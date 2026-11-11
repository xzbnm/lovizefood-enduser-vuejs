#!/usr/bin/env node
// Starts the mock API and the Nuxt dev server together, pointed at each other.
const { spawn } = require('child_process');
const path = require('path');

const mockPort = process.env.MOCK_PORT || '3003';
const env = Object.assign({}, process.env, {
  MOCK_PORT: mockPort,
  VUE_APP_BASE_URL: `http://localhost:${mockPort}`,
  API_URL: `http://localhost:${mockPort}`,
  API_URL_BROWSER: `http://localhost:${mockPort}`,
  // webpack 4 needs the legacy OpenSSL provider on Node >= 17
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--openssl-legacy-provider'].filter(Boolean).join(' '),
});

const children = [
  spawn(process.execPath, [path.join(__dirname, 'mock-api.js')], { stdio: 'inherit', env }),
  spawn('npx', ['nuxt', 'dev', '--port', '3333'], { stdio: 'inherit', env, shell: process.platform === 'win32' }),
];
const stop = () => children.forEach((c) => { try { c.kill(); } catch (e) { /* already gone */ } });
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('SIGTERM', () => { stop(); process.exit(0); });
children.forEach((c) => c.on('exit', stop));
