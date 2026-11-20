const http = require('http');

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 8545;
const LISTEN_PORT = 7545;

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err.message);
    clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    clientRes.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'Node unreachable' } }));
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`RPC Proxy listening on port ${LISTEN_PORT} -> forwarding to port ${TARGET_PORT}`);
});
