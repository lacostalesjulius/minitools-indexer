const tunnel_url = 'wss://cheese-massachusetts-recreation-spring.trycloudflare.com';
const target_url = tunnel_url || 'ws://192.168.100.95:8888';

export function connectToGate(aggregate_snapshot) {
  const GATE_URL = `${target_url}/api`;
  console.log(GATE_URL);
  let ws = null;
  let reconnectTimer = null;

  const RECONNECT_INTERVAL =
    Number(import.meta?.env?.SUBSCRIBE_RECONNECT_MS) ||
    10000;

  function connect() {
    console.log('[Gate] connecting...')
    ws = new WebSocket(GATE_URL);
    ws.onopen = () => {
      console.log('[Gate] connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'snapshot') {
          aggregate_snapshot.value = msg.payload;
        }

      } catch (err) {
        console.error('[Gate] invalid message', err);
      }
    };

    ws.onclose = () => {
      console.warn('[Gate] disconnected');

      reconnectTimer = setTimeout(() => {
        connect();
      }, RECONNECT_INTERVAL);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  }

  connect();

  return { disconnect };
}
