const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:4649');

ws.on('open', () => {
  console.log('✅ Connected to biometric WebSocket');
  setTimeout(() => ws.close(), 2000);
});

ws.on('message', (data) => {
  console.log('📩 Received:', data.toString());
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Disconnected');
  process.exit(0);
});
