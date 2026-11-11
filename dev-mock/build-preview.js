#!/usr/bin/env node
// Builds dev-mock/preview-dist: a static copy of the app + mock API shim.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ORIGIN = 'https://mock.local';
const core = fs.readFileSync(path.join(__dirname, 'mock-core.js'), 'utf8');
const sample = fs.readFileSync(path.join(__dirname, 'sample-data.json'), 'utf8');
const tpl = fs.readFileSync(path.join(__dirname, 'preview-shim.template.js'), 'utf8');
fs.writeFileSync(
  path.join(__dirname, '.preview-shim.js'),
  core + '\n' + tpl.replace('__ORIGIN__', ORIGIN).replace('__SAMPLE__', () => sample)
);

const env = Object.assign({}, process.env, {
  VUE_APP_BASE_URL: ORIGIN, API_URL: ORIGIN, API_URL_BROWSER: ORIGIN,
  MAP_IR_API_KEY: '', // no map.ir key: tiles come from OpenFreeMap, search from Nominatim
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--openssl-legacy-provider'].filter(Boolean).join(' '),
});
const r = spawnSync('npx', ['nuxt', 'generate', '--config-file', 'dev-mock/nuxt.preview.config.js'], { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' });
if (r.status !== 0) process.exit(r.status || 1);

// Post-process the output so it works from any folder (the hosting path is not
// known at build time) and never reports to the real Google Analytics property.
const dist = path.join(__dirname, 'preview-dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
walk(dist).forEach((f) => {
  if (!/\.(html|js)$/.test(f)) return;
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  if (f.endsWith('.html')) {
    t = t
      .replace(/<script[^>]*googletagmanager[^>]*><\/script>/g, '')
      .replace(/<script>[^<]*window\.dataLayer[^<]*<\/script>/g, '')
      .replace(/(src|href)="\/_nuxt\//g, '$1="./_nuxt/');
  } else {
    t = t.replace(/\bp="\/_nuxt\/"/g, 'p="./_nuxt/"'); // webpack public path
  }
  if (t !== before) fs.writeFileSync(f, t);
});
['200.html', 'sw.js'].forEach((f) => { try { fs.unlinkSync(path.join(dist, f)); } catch (e) { /* absent */ } });
console.log('preview built in', dist);
