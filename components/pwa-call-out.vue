<template>
  <!--
    "Add to home screen" sheet. On Android (Chrome) the browser offers a real
    install prompt, so one tap installs; iOS has no such API, so Safari's own
    steps are shown instead. Shown once on phones, never inside the installed
    app.
  -->
  <transition name="pwa-sheet">
    <div v-if="visible" class="pwa-sheet" @click.self="later">
      <div class="pwa-sheet__panel" role="dialog" aria-modal="true" aria-label="نصب برنامه">
        <div class="pwa-sheet__grip" aria-hidden="true"></div>

        <div class="pwa-sheet__head">
          <img class="pwa-sheet__logo pwa-sheet__logo--light" src="@/assets/media/logo-laviz.png" alt="لاویز">
          <img class="pwa-sheet__logo pwa-sheet__logo--dark" src="@/assets/media/logo-laviz-dark.png" alt="لاویز">
        </div>

        <h2 class="pwa-sheet__title">{{ text }}</h2>
        <p class="pwa-sheet__sub">و به‌راحتی در روزهای آینده ثبت سفارش نمایید.</p>

        <!-- Android with the native prompt available: one tap. -->
        <button v-if="canPrompt" type="button" class="pwa-sheet__install" @click="install">
          نصب برنامه
        </button>

        <!-- iPhone / iPad: the steps Safari needs. -->
        <template v-else-if="device === 'ios'">
          <p v-if="!isSafari" class="pwa-sheet__warn">
            نصب فقط از مرورگر Safari امکان‌پذیر است. این صفحه را در Safari باز کنید.
          </p>
          <ol class="pwa-sheet__steps">
            <li>
              <span class="pwa-sheet__num">۱</span>
              <span>
                در نوار پایین دکمه
                <img src="@/assets/media/pwa-callout/icon-share.png" class="pwa-sheet__icon" alt="اشتراک‌گذاری">
                را انتخاب کنید.
              </span>
            </li>
            <li>
              <span class="pwa-sheet__num">۲</span>
              <span>منوی باز شده را بالا بکشید و «Add to Home Screen» را انتخاب کنید.</span>
            </li>
            <li class="pwa-sheet__shot">
              <img src="@/assets/media/pwa-callout/add-to-home-screen.png" alt="">
            </li>
            <li>
              <span class="pwa-sheet__num">۳</span>
              <span>در بالای صفحه روی «Add» بزنید.</span>
            </li>
          </ol>
        </template>

        <!-- Android without the prompt (other browser, or already declined). -->
        <ol v-else class="pwa-sheet__steps">
          <li>
            <span class="pwa-sheet__num">۱</span>
            <span>
              در نوار بالا دکمه
              <img src="@/assets/media/pwa-callout/andriod-chrome-more.png" class="pwa-sheet__icon" alt="منو">
              را انتخاب کنید.
            </span>
          </li>
          <li>
            <span class="pwa-sheet__num">۲</span>
            <span>گزینه «Add to Home screen» یا «Install app» را انتخاب کنید.</span>
          </li>
          <li>
            <span class="pwa-sheet__num">۳</span>
            <span>در مرحله بعد روی «Add» یا «Install» بزنید.</span>
          </li>
        </ol>

        <label class="pwa-sheet__never">
          <input v-model="neverAgain" type="checkbox">
          <span>دیگر نمایش نده</span>
        </label>

        <button type="button" class="pwa-sheet__later" @click="later">
          {{ canPrompt ? 'بعدا' : 'متوجه شدم' }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
// localStorage first; a cookie when storage is blocked (private modes).
const KEY_NEVER = 'pwaCallOut'; // set = never show again (older versions used it for "seen")
const KEY_DAY = 'pwaCallOutDay'; // date of the last showing, YYYY-MM-DD
const store = {
  get(key) {
    try { const v = localStorage.getItem(key); if (v !== null) return v; } catch (e) { /* blocked */ }
    const m = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* blocked */ }
    document.cookie = key + '=' + encodeURIComponent(value) + '; max-age=31536000; path=/; SameSite=Lax';
  },
};

export default {
  name: 'pwa-call-out',
  props: {
    /** Wording is set in the panel. */
    text: { type: String, default: 'اپ لاویز را به صفحه اصلی گوشی خود اضافه نمایید.' },
  },
  data() {
    return {
      visible: false,
      device: null,
      isSafari: true,
      // The browser's install event, kept until the customer taps "install".
      deferredPrompt: null,
      // "Don't show again" ticked by the customer.
      neverAgain: false,
    };
  },
  computed: {
    canPrompt() {
      return !!this.deferredPrompt;
    },
  },
  mounted() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1; // iPadOS
    if (/android/i.test(ua)) this.device = 'android';
    if ((/iPad|iPhone|iPod/.test(ua) && !window.MSStream) || touchMac) this.device = 'ios';
    // Any other browser on a narrow screen gets the Android wording (Chrome's
    // "Install app" works the same way there).
    if (!this.device) this.device = 'android';
    // Chrome, Firefox and others on iOS cannot add to the home screen.
    this.isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

    window.addEventListener('beforeinstallprompt', this.onBeforeInstall);
    window.addEventListener('appinstalled', this.onInstalled);
    this.run();
  },
  beforeDestroy() {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstall);
    window.removeEventListener('appinstalled', this.onInstalled);
  },
  methods: {
    // Phones only, only in a browser tab. Shown at most once a day, and never
    // again once the customer ticked "don't show again" or installed the app.
    run() {
      let standalone = false;
      try {
        standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      } catch (e) { /* treat as not installed */ }
      if (standalone || window.innerWidth >= 600) return;
      if (store.get(KEY_NEVER)) return;
      const today = new Date().toISOString().slice(0, 10);
      if (store.get(KEY_DAY) === today) return;
      store.set(KEY_DAY, today); // counts as today's showing even if the page is reloaded
      this.visible = true;
    },
    onBeforeInstall(e) {
      // Keep the event so the sheet can trigger the native prompt later.
      e.preventDefault();
      this.deferredPrompt = e;
    },
    onInstalled() {
      this.deferredPrompt = null;
      store.set(KEY_NEVER, '1');
      this.visible = false;
    },
    async install() {
      const prompt = this.deferredPrompt;
      if (!prompt) return;
      this.deferredPrompt = null;
      try {
        prompt.prompt();
        await prompt.userChoice;
      } catch (e) { /* the browser refused; the manual steps remain below */ }
      this.close();
    },
    later() {
      this.close();
    },
    close() {
      if (this.neverAgain) store.set(KEY_NEVER, '1');
      this.visible = false;
    },
  },
};
</script>

<style scoped>
.pwa-sheet {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: var(--lz-modal-backdrop, rgba(0, 0, 0, 0.5));
}

.pwa-sheet__panel {
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 8px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  background: var(--lz-surface-raised);
  border: 1px solid var(--lz-sheet-border);
  border-bottom: 0;
  border-radius: 24px 24px 0 0;
  box-shadow: var(--lz-shadow-sheet);
  color: var(--lz-ink);
  text-align: center;
}

.pwa-sheet__grip {
  width: 40px;
  height: 4px;
  margin: 4px auto 12px;
  border-radius: 2px;
  background: var(--lz-border-strong);
}

/* The logo comes from the app's own assets (the old /logo.png path broke
   whenever the app was not served from the site root). */
.pwa-sheet__head { display: flex; justify-content: center; margin-bottom: 8px; }
.pwa-sheet__logo { width: 112px; height: auto; }
.pwa-sheet__logo--dark { display: none; }

.pwa-sheet__title {
  margin: 12px 0 4px;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.9;
}

.pwa-sheet__sub {
  margin: 0 0 16px;
  font-size: 0.9rem;
  color: var(--lz-ink-muted);
}

.pwa-sheet__warn {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--lz-saffron-wash);
  color: var(--lz-ink);
  font-size: 0.85rem;
  line-height: 1.8;
}

.pwa-sheet__steps {
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  text-align: right;
}

.pwa-sheet__steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-size: 0.9rem;
  line-height: 1.9;
}

.pwa-sheet__num {
  flex: none;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--lz-accent-wash);
  color: var(--lz-accent-strong);
  font-size: 0.8rem;
  font-weight: 600;
}

.pwa-sheet__icon { width: 20px; margin: 0 4px; vertical-align: middle; }

.pwa-sheet__shot img { width: 100%; border-radius: 12px; border: 1px solid var(--lz-border-hairline); }

.pwa-sheet__never {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: var(--lz-ink-muted);
  cursor: pointer;
  user-select: none;
}

.pwa-sheet__never input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--lz-accent);
}

.pwa-sheet__install,
.pwa-sheet__later {
  display: block;
  width: 100%;
  min-height: 52px;
  border: 0;
  border-radius: 14px;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.pwa-sheet__install {
  margin-bottom: 8px;
  background: var(--lz-accent);
  color: var(--lz-on-accent, #fff);
}

.pwa-sheet__later {
  background: var(--lz-surface-soft);
  color: var(--lz-ink);
}

.pwa-sheet__install:active,
.pwa-sheet__later:active { transform: scale(0.98); }

.pwa-sheet-enter-active,
.pwa-sheet-leave-active { transition: opacity 0.25s ease; }
.pwa-sheet-enter-active .pwa-sheet__panel,
.pwa-sheet-leave-active .pwa-sheet__panel { transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1); }
.pwa-sheet-enter,
.pwa-sheet-leave-to { opacity: 0; }
.pwa-sheet-enter .pwa-sheet__panel,
.pwa-sheet-leave-to .pwa-sheet__panel { transform: translateY(100%); }

@media (prefers-reduced-motion: reduce) {
  .pwa-sheet-enter-active,
  .pwa-sheet-leave-active,
  .pwa-sheet-enter-active .pwa-sheet__panel,
  .pwa-sheet-leave-active .pwa-sheet__panel { transition: none; }
}
</style>

<!-- Not scoped: the theme switch lives on <html>, outside this component. -->
<style>
html[data-theme='dark'] .pwa-sheet__logo--light { display: none; }
html[data-theme='dark'] .pwa-sheet__logo--dark { display: block; }
</style>
