// -----------------------------
// Initiation
// -----------------------------
import express from 'express';
// import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();

const server = http.createServer(app);

const keyPath = process.env.HTTPS_KEY_PATH;
const certPath = process.env.HTTPS_CERT_PATH;

if (!keyPath || !certPath) {
  throw new Error('HTTPS_KEY_PATH or HTTPS_CERT_PATH not defined');
}

/*
const server = https.createServer({
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
}, app);
*/

const wss = new WebSocketServer({ server });

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// -----------------------------
// Definitions
// -----------------------------
const PORT = Number(process.env.GATE_PORT) || 4000;
const HOST = process.env.GATE_HOST || '0.0.0.0';

const INTERVAL = Number(process.env.ACTIVE_INTERVAL_MS) || 5000;
const OFFLINE_THRESHOLD = Number(process.env.ACTIVE_TIMEOUT_MS) || 15000;

const DB_DIR = process.env.DB_DIR || './database';
const SERVICES_FILE = path.join(DB_DIR, 'services.json');

const services = new Map();
const clients = new Set();


// -----------------------------
// Persistence (Load / Save)
// -----------------------------
function loadServices() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(SERVICES_FILE)) return;

    const raw = fs.readFileSync(SERVICES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    parsed.forEach((s) => {
      services.set(s.id, {
        ...s,
        lastPing: 0, // reset so they become offline until heartbeat
        status: 'Offline',
        healthy: false,
        responseTime: null
      });
    });

  } catch (err) {
    console.error('[Gate] Failed to load services:', err);
  }
}

function saveServices() {
  try {
    const data = Array.from(services.values()).map(s => ({
      id: s.id,
      name: s.name,
      transport: s.transport,
      ip: s.ip,
      port: s.port,
      endpoint: s.endpoint,
      meta: s.meta
    }));

    fs.writeFileSync(SERVICES_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Gate] Failed to save services:', err);
  }
}


// -----------------------------
// Routing
// -----------------------------
app.get('/snapshot', (req, res) => {
  res.json(buildSnapshot());
});

app.post('/heartbeat', (req, res) => {
  handleHeartbeat(req, res);
});

app.use('/services/:serviceId/*', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const restPath = req.params[0] || '';
    
    const service = services.get(serviceId) || getServiceByPath(serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const query = new URLSearchParams(req.query).toString();
    const queryString = query ? `?${query}` : '';

    const targetUrl =
      `http://${service.ip}:${service.port}/${restPath}${queryString}`;
    console.log(`reverse proxying into: ${targetUrl}`)

    const method = req.method;

    const headers = {
      'content-type': req.headers['content-type'] || 'application/json'
    };

    const hasBody = !['GET', 'HEAD'].includes(method);

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined
    });
    res.status(response.status);

    // forward all response headers (THIS is the key fix)
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!response.body) {
      return res.end();
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('[Gate Proxy Error]', err);
    res.status(500).json({ error: 'Proxy failure' });
  }
});

// -----------------------------
// HTTPS Methods
// -----------------------------
function handleHeartbeat(req, res) {
  const now = Date.now();

  const {
    id,
    name,
    transport = 'http',
    healthy = true,
    meta = {}
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing service id' });
  }

  let service = services.get(id);

  if (!service) {
    service = {
      id,
      name: name || id,
      transport,

      ip: req.ip,
      port: '',
      endpoint: '',

      status: 'Online',
      healthy: true,
      responseTime: null,
      lastChanged: now,

      lastPing: now,
      meta
    };
    console.log(service);
    services.set(id, service);
    saveServices(); // persist new service
  }

  const prevStatus = service.status;
  const prevHealthy = service.healthy;

  service.status = 'Online';
  service.healthy = healthy;
  service.lastPing = now;
  service.meta = meta;

  if (prevStatus !== 'Online' || prevHealthy !== healthy) {
    service.lastChanged = now;
  }

  res.json({ ok: true });
}


function updateOffline(service) {
  const now = Date.now();

  if (now - service.lastPing > OFFLINE_THRESHOLD) {
    if (service.status !== 'Offline') {
      service.status = 'Offline';
      service.healthy = false;
      service.responseTime = null;
      service.lastChanged = now;
    }
  }
}

function buildSnapshot() {
  return {
    version: Date.now(),
    generatedAt: Date.now(),
    interval: INTERVAL,
    services: Array.from(services.values()).map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      healthy: s.healthy,
      transport: s.transport,
      ip: s.ip,
      port: s.port,
      endpoint: s.endpoint,
      responseTime: s.responseTime,
      lastChanged: s.lastChanged,
      meta: s.meta
    }))
  };
}

function getServiceByPath(servicePath) {
  for (const service of services.values()) {
    if (service.id === servicePath || service.name === servicePath) {
      return service;
    }
  }
  return null;
}

// -----------------------------
// WS
// -----------------------------
wss.on('connection', (ws) => {
  clients.add(ws);

  const snapshot = buildSnapshot();
  console.log(snapshot)
  ws.send(JSON.stringify({
    type: 'snapshot',
    payload: snapshot
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});


// -----------------------------
// WS Methods
// -----------------------------
function broadcast(snapshot) {
  const msg = JSON.stringify({
    type: 'snapshot',
    payload: snapshot
  });

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}


// -----------------------------
// Loop
// -----------------------------
setInterval(() => {
  for (const service of services.values()) {
    updateOffline(service);
  }

  const snapshot = buildSnapshot();
  broadcast(snapshot);

}, INTERVAL);


// -----------------------------
// Init Load
// -----------------------------
loadServices();


// -----------------------------
// HTTP Listen
// -----------------------------
server.listen(PORT, HOST, () => {
  console.log(`[Gate] running at http://${HOST}:${PORT}`);
});
