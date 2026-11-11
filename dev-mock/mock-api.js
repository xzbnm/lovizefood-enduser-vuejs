#!/usr/bin/env node
/**
 * Local mock of the customer-facing API, served from dev-mock/sample-data.json
 * (a read-only snapshot of the public GET /api/enduser/core/initialize).
 *
 * Dev tooling only: nothing in the app imports this, and it is excluded from
 * the Docker build context. Run with `npm run dev:mock`.
 *
 * Not the real backend. Auth accepts any mobile with code 12345; order
 * preview does simple arithmetic; order creation is not supported.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const createMock = require('./mock-core');

const PORT = Number(process.env.MOCK_PORT || 3003);
const mock = createMock(JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data.json'), 'utf8')));

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const pathname = new URL(req.url, 'http://x').pathname;

  if (pathname.startsWith('/public/food/')) {
    const svg = mock.image(pathname);
    if (!svg) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    return res.end(svg);
  }

  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (e) { /* ignore */ }
    const out = mock.handle(req.method, pathname, body, new URL(req.url, 'http://x').searchParams);
    console.log(req.method, pathname, out ? '' : '(not mocked -> 404)');
    if (!out) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ statusCode: 404, message: 'mock: not implemented' }));
    }
    res.writeHead(out.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out.body));
  });
}).listen(PORT, () => console.log(`mock api on http://localhost:${PORT}`));
