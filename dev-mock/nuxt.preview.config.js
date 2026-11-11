// Static, server-less build of the app that answers its API calls from the
// bundled sample data. Used by `npm run preview:build`; not part of the app.
import fs from 'fs'
import path from 'path'
import base from '../nuxt.config.js'

const shim = fs.readFileSync(path.join(process.cwd(), 'dev-mock', '.preview-shim.js'), 'utf8')

export default {
  ...base,
  target: 'static',
  serverMiddleware: [],
  buildModules: [],
  modules: base.modules.filter((m) => m !== '@nuxtjs/pwa'),
  router: { ...(base.router || {}), mode: 'hash' },
  head: {
    ...base.head,
    script: [{ hid: 'mock-shim', innerHTML: shim, type: 'text/javascript' }],
    __dangerouslyDisableSanitizersByTagID: { 'mock-shim': ['innerHTML'] },
  },
  build: { ...base.build, publicPath: './_nuxt/' },
  generate: { dir: 'dev-mock/preview-dist' },
}
