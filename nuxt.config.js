export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'server',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'رستوران لاویز',
    meta: [
      {charset: "utf-8"},
      {hid: "description", name: "description", content: "سفارش شله و حلیم بهشت"},
      {name: "format-detection", content: "telephone=no"},
      {name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"},
      {viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no", mobileAppIOS: true},
      {name: "apple-mobile-web-app-capable", content: "yes"},
      {name: "apple-mobile-web-app-status-bar-style", content: "black"},
      {name: "msapplication-TileColor", content: "#ffffff"},
      {name: "msapplication-TileImage", content: "/icon/mstile-144x144.png"},
      {name: "theme-color", content: "#ffffff"},
    ],
    link: [
      {rel: 'manifest', href: '/manifest.webmanifest', hid: 'manifest'},
      {rel: 'apple-touch-icon', size: '180x180', href: '/icons/apple-touch-icon.png'},
      {rel: 'icon', type: 'image/png', size: '32x32', href: '/icons/favicon-32x32.png'},
      {rel: 'icon', type: 'image/png', size: '16x16', href: '/icons/favicon-16x16.png'},
      {rel: 'mask-icon', color: '#5bbad5', href: '/icons/safari-pinned-tab.svg'},
      //
      {rel: "apple-touch-icon", sizes: "60x60", href: "/icons/mstile-144x144.png"},
      {rel: "apple-touch-icon", sizes: "72x72", href: "/icons/mstile-144x144.png"},
      {rel: "apple-touch-icon", sizes: "76x76", href: "/icons/mstile-144x144.png"},
      {rel: "apple-touch-icon", sizes: "114x114", href: "/icons/mstile-144x144.png"},
      {rel: "apple-touch-icon", sizes: "120x120", href: "/icons/mstile-144x144.png"},
      {rel: "apple-touch-icon", sizes: "144x144", href: "/icons/mstile-144x144.png"},
      {rel: "apple-touch-icon", sizes: "152x152", href: "/icons/mstile-144x144.png"},
      {rel: "apple-touch-icon", sizes: "180x180", href: "/icons/mstile-144x144.png"},
      {rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/mstile-144x144.png"},
      {rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/mstile-144x144.png"},
      {rel: "icon", type: "image/png", sizes: "96x96", href: "/icons/mstile-144x144.png"},
      {rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/mstile-144x144.png"},
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    "@/assets/fonts/iran-sans-x/index.css",
    "@/assets/scss/main.scss"
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    "~/plugins/veeValidate",
    // axios.js was present but never registered here, so its error handling
    // (notably clearing a dead token on 401) never ran.
    "~/plugins/axios",
  ],

  serverMiddleware: [
    '~/server-middleware/manifest.js',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: false,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    '@nuxtjs/pwa',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    // https://github.com/nuxt-community/gtm-module
    // '@nuxtjs/gtm',
  ],

  // gtm: {
  //   id: 'G-BX4K10D06H'
  // },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    // baseURL برای درخواست‌های سمت سرور (SSR داخل کانتینر) — API_URL
    baseURL: process.env.API_URL || process.env.VUE_APP_BASE_URL || 'http://localhost:3003',
    // browserBaseURL برای درخواست‌های سمت مرورگر — API_URL_BROWSER
    browserBaseURL: process.env.API_URL_BROWSER || process.env.VUE_APP_BASE_URL || 'http://localhost:3003',
  },

  env: {
    MAP_IR_API_KEY: process.env.MAP_IR_API_KEY || process.env.VUE_APP_MAP_IR_API_KEY || '',
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    short_name: "Loviz",
    name: "Loviz",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#fff",
    background_color: "#fff",
    lang: 'fa',
    manifest: {
      short_name: "Loviz",
      name: "Loviz",
      description: "Loviz",
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      theme_color: "#fff",
      background_color: "#fff",
      lang: 'fa',
    }
  },


  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend(config, ctx) {
      if (ctx.isDev) {
        config.devtool = ctx.isClient ? 'source-map' : 'inline-source-map'
      }
      config.plugins.push(
      new (require('webpack')).ContextReplacementPlugin(
        /moment[/\\]src[/\\]lib[/\\]locale/,
        /fa|en/
        )
      )
    }
  }
  
}
