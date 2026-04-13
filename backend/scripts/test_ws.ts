import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:4649');

ws.on('open', () => {
    console.log('Successfully connected to BioMiddleware WS!');
    process.exit(0);
});

ws.on('error', (err) => {
    console.error('Failed to connect to BioMiddleware WS:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('Timed out waiting for WS connection');
    process.exit(1);
}, 5000);
