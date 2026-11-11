import restoreCustomerSession from '../utils/customerSession.cjs'

// Notifications use the same bootstrap-vue toasts as the rest of the app. The
// old code called Vue.prototype.$toasted, but vue-toasted is not installed and
// its plugin was never registered, so every API error threw a TypeError
// instead of reaching the caller's catch block.
let root = null;
const pending = [];
const recent = new Map();

function notify(message, variant = 'danger') {
  if (!message || typeof window === 'undefined') return;
  // The same message from a burst of failing requests is shown once.
  const now = Date.now();
  if (recent.has(message) && now - recent.get(message) < 2500) return;
  recent.set(message, now);
  if (!root) { pending.push([message, variant]); return; }
  root.$bvToast.toast(message, { variant });
}

// The root instance only exists after the app has mounted.
function flushWhenReady() {
  if (typeof window === 'undefined') return;
  window.onNuxtReady((nuxt) => {
    root = nuxt.$root;
    pending.splice(0).forEach(([m, v]) => root.$bvToast.toast(m, { variant: v }));
  });
}

// Validation text the backend sends: { result: { error: { value } } }.
function serverMessages(data) {
  const list = [];
  const add = (item) => {
    const m = item && ((item.error && item.error.value) || item.value);
    if (typeof m === 'string' && m.trim()) list.push(m);
  };
  if (data && Array.isArray(data.result)) data.result.forEach(add);
  else if (data && data.result) add(data.result);
  // Plain `message` bodies are left to the caller: the screens that send them
  // already show that text themselves, and a second toast would duplicate it.
  return list;
}

export default function ({ $axios }) {
  if (process.client) flushWhenReady();

  // localStorage survives refreshes. Restore the credential before any page
  // can issue an authenticated request (including a direct /profile load).
  if (process.client) {
    restoreCustomerSession(window.localStorage, $axios)
  }

  $axios.onRequest(config => {
    if (process.client) {
      const session = restoreCustomerSession(window.localStorage, $axios)
      if (session) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${session.token}`
      }
      if (!navigator.onLine) notify('اتصال اینترنت برقرار نیست.', 'warning')
    }
  });

  $axios.onError(e => {
    if (!e.response) {
      // No response at all: offline, DNS or the server is unreachable.
      if (process.client && navigator.onLine) notify('ارتباط با سرور برقرار نشد. لطفا دوباره تلاش کنید.')
      return false
    }

    // Nest's error body uses `statusCode`, not `status`, so read the HTTP
    // status first.
    const httpStatus = e.response.status
    const data = e.response.data

    if (httpStatus === 401) {
      // The token no longer maps to a user (expired, or the account is gone).
      // Drop it so the app returns to the logged-out state instead of retrying
      // with a credential that can never work.
      if (typeof localStorage !== 'undefined' && localStorage.getItem('token')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        notify('نشست شما منقضی شده است. لطفا دوباره وارد شوید.', 'warning')
        // Leave a moment for the message before the page restarts.
        if (typeof window !== 'undefined') setTimeout(() => window.location.reload(), 1200)
      }
      return false
    }

    const code = parseInt((data && (data.statusCode || data.status)) || httpStatus)
    switch (code) {
      case 400: {
        serverMessages(data).forEach(m => notify(m))
        break
      }
      case 403:
        notify('شما به این بخش دسترسی ندارید.')
        break
      case 404:
        // Callers decide what a missing item means; no global message.
        break
      default:
        if (code >= 500) {
          const messages = serverMessages(data)
          if (messages.length) messages.forEach(m => notify(m))
          else notify('خطایی در سرور رخ داد. لطفا کمی بعد دوباره تلاش کنید.')
        }
    }
    return false
  })
}
