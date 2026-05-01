import express from 'express';
// import https from 'https';
// import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Read env variables
const HOST = process.env.FRONTEND_HOST || '0.0.0.0';
const PORT = Number(process.env.FRONTEND_PORT) || 443;

const keyPath = process.env.HTTPS_KEY_PATH;
const certPath = process.env.HTTPS_CERT_PATH;

if (!keyPath || !certPath) {
  throw new Error('HTTPS_KEY_PATH or HTTPS_CERT_PATH not defined in .env');
}

// Path to frontend static files
const FRONTEND_DIR = path.join(process.cwd(), 'frontend');
const MODELS_DIR = path.join(process.cwd(), 'models');

// Serve static assets (js, css, etc.)
app.use('/', express.static(path.join(FRONTEND_DIR, "public")));
app.use('/tools', express.static(path.join(FRONTEND_DIR, "tools")));
app.use('/src', express.static(path.join(FRONTEND_DIR, "src")));
app.use('/models', express.static(MODELS_DIR));
app.use('/services', express.static(path.join(FRONTEND_DIR, 'src', 'services')));


app.get('/style.css', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'style.css'));
})

// SPA fallback: always return index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

/*
// HTTPS server
https.createServer(
  {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  },
  app
)
*/

app.listen(PORT, HOST, () => {
  console.log(`[Frontend] running at http://${HOST}:${PORT}`);
});
