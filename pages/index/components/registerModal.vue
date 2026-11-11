<template>
  <!-- Redesigned as a bottom sheet on phones and a centred card on wider
       screens, matching the offers/menu sheets the rest of the app uses.
       The three steps (mobile -> register | login) and every validation scope
       are unchanged; only the shell and the fields were rebuilt. -->
  <b-modal
    id="modal-login"
    centered
    hide-footer
    hide-header
    modal-class="auth-modal"
    dialog-class="auth-modal__dialog"
    content-class="auth-modal__content"
    body-class="auth-modal__body"
    @shown="onShown"
    @hidden="onHidden"
  >
    <div class="auth-sheet__grip" aria-hidden="true"></div>

    <button type="button" class="auth-sheet__close" aria-label="بستن" @click="hide">✕</button>

    <!-- ==================== step 1: mobile ==================== -->
    <form
      v-show="loginForm.step == 'checkMobile'"
      class="auth-step"
      @submit.prevent="checkMobile"
    >
      <div class="auth-head">
        <div class="auth-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="2.5" width="12" height="19" rx="3" />
            <path d="M10.5 18.5h3" />
          </svg>
        </div>
        <h2 class="auth-head__title">برای ثبت سفارش</h2>
        <p class="auth-head__sub">شماره موبایل خود را وارد کنید تا کد تایید برایتان ارسال شود.</p>
      </div>

      <label class="auth-field">
        <span class="auth-field__label">شماره تلفن همراه</span>
        <input
          ref="mobileInput"
          type="tel"
          dir="ltr"
          inputmode="numeric"
          maxlength="11"
          v-model="loginForm.data.mobile"
          class="auth-input auth-input--mobile"
          placeholder="09123456789"
          v-validate="{ required: true, mobile_iran: true }"
          name="mobile"
          data-vv-as="شماره تلفن همراه"
          autocomplete="tel"
          data-vv-scope="checkMobile"
          :class="{ 'auth-input--error': errors.has('checkMobile.mobile') }"
          @input="onMobileInput"
          @blur="onMobileBlur"
        />
        <span v-if="errors.has('checkMobile.mobile')" class="auth-field__error">
          {{ errors.first("checkMobile.mobile") }}
        </span>
      </label>

      <!-- Off until the number is a valid Iranian mobile, so the first tap can't be wasted. -->
      <button type="submit" class="auth-submit" :disabled="busy || !mobileValid">
        <span v-if="!busy">دریافت کد تایید</span>
        <span v-else class="auth-spinner" aria-label="در حال ارسال"></span>
      </button>

      <p class="auth-terms">
        با ورود، <b>قوانین و شرایط</b> استفاده از خدمات رستوران لاویز را می‌پذیرید.
      </p>
    </form>

    <!-- ==================== step 2a: new customer ==================== -->
    <form
      v-show="loginForm.step == 'register'"
      class="auth-step"
      @submit.prevent="register"
    >
      <div class="auth-head">
        <div class="auth-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 8.5 12 14l9-5.5" />
            <rect x="3" y="5" width="18" height="14" rx="3" />
          </svg>
        </div>
        <h2 class="auth-head__title">تکمیل ثبت‌نام</h2>
        <p class="auth-head__sub">
          کد تایید به شماره <bdi class="auth-head__mobile">{{ loginForm.data.mobile }}</bdi> ارسال شد
        </p>
        <button
          type="button"
          class="auth-edit"
          :disabled="busy || resendIn > 0"
          :aria-disabled="busy || resendIn > 0"
          @click="editPhoneNumber()"
        >اصلاح شماره موبایل</button>
      </div>

      <div class="auth-row">
        <label class="auth-field">
          <span class="auth-field__label">نام</span>
          <input
            type="text"
            v-model="loginForm.data.first_name"
            class="auth-input"
            placeholder="نام"
            v-validate="{ required: true }"
            name="first_name"
            data-vv-as="نام"
            autocomplete="off"
            data-vv-scope="register"
            :class="{ 'auth-input--error': errors.has('register.first_name') }"
          />
          <span v-if="errors.has('register.first_name')" class="auth-field__error">
            {{ errors.first("register.first_name") }}
          </span>
        </label>

        <label class="auth-field">
          <span class="auth-field__label">نام خانوادگی</span>
          <input
            type="text"
            v-model="loginForm.data.last_name"
            class="auth-input"
            placeholder="نام خانوادگی"
            v-validate="{ required: true }"
            name="last_name"
            data-vv-as="نام خانوادگی"
            autocomplete="off"
            data-vv-scope="register"
            :class="{ 'auth-input--error': errors.has('register.last_name') }"
          />
          <span v-if="errors.has('register.last_name')" class="auth-field__error">
            {{ errors.first("register.last_name") }}
          </span>
        </label>
      </div>

      <!-- This is returned only when the admin enables emergency OTP mode. -->
      <div v-if="devCode" class="auth-devcode">
        <span class="auth-devcode__label">حالت اضطراری فعال است؛ پیامکی ارسال نشده. کد تایید:</span>
        <span class="auth-devcode__value">{{ devCode }}</span>
      </div>

      <label class="auth-field">
        <span class="auth-field__label">{{ devCode ? 'کد تایید' : 'کد تایید پیامک‌شده' }}</span>
        <!-- type=text + inputmode=numeric: type=number let the spinner and
             non-digit characters (e, +, -) through and broke the tracking. -->
        <input
          ref="registerCode"
          type="text"
          dir="ltr"
          inputmode="numeric"
          maxlength="6"
          v-model="loginForm.data.verify_code"
          class="auth-input auth-otp"
          placeholder="––––––"
          v-validate="{ required: true }"
          name="verify_code"
          data-vv-as="کد تایید"
          autocomplete="one-time-code"
          data-vv-scope="register"
          :class="{ 'auth-input--error': errors.has('register.verify_code') }"
          @input="onCodeInput"
        />
        <span v-if="errors.has('register.verify_code')" class="auth-field__error">
          {{ errors.first("register.verify_code") }}
        </span>
      </label>

      <div class="auth-resend">
        <span v-if="resendIn > 0" class="auth-cooldown" role="timer" :aria-label="`زمان باقی‌مانده برای ارسال دوباره یا اصلاح شماره ${resendLabel}`">
          <span class="auth-cooldown__clock" aria-hidden="true">◷</span>
          <span>ارسال دوباره یا اصلاح شماره تا</span>
          <bdi class="auth-cooldown__time" dir="ltr">{{ resendLabel }}</bdi>
        </span>
        <button v-else type="button" class="auth-resend__btn" @click="resend">ارسال دوباره کد</button>
      </div>

      <button type="submit" class="auth-submit" :disabled="busy">
        <span v-if="!busy">ثبت‌نام و ورود</span>
        <span v-else class="auth-spinner" aria-label="در حال ارسال"></span>
      </button>
    </form>

    <!-- ==================== step 2b: returning customer ==================== -->
    <form
      v-show="loginForm.step == 'login'"
      class="auth-step"
      @submit.prevent="login"
    >
      <div class="auth-head">
        <div class="auth-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 8.5 12 14l9-5.5" />
            <rect x="3" y="5" width="18" height="14" rx="3" />
          </svg>
        </div>
        <h2 class="auth-head__title">کد تایید را وارد کنید</h2>
        <p class="auth-head__sub">
          <template v-if="devCode">حالت اضطراری فعال است؛ پیامکی ارسال نشده و کد در همین پنجره نمایش داده می‌شود.</template>
          <template v-else>کد به شماره <bdi class="auth-head__mobile">{{ loginForm.data.mobile }}</bdi> پیامک شد</template>
        </p>
        <button
          type="button"
          class="auth-edit"
          :disabled="busy || resendIn > 0"
          :aria-disabled="busy || resendIn > 0"
          @click="editPhoneNumber()"
        >اصلاح شماره موبایل</button>
      </div>

      <!-- This is returned only when the admin enables emergency OTP mode. -->
      <div v-if="devCode" class="auth-devcode">
        <span class="auth-devcode__label">حالت اضطراری فعال است؛ پیامکی ارسال نشده. کد تایید:</span>
        <span class="auth-devcode__value">{{ devCode }}</span>
      </div>

      <label class="auth-field">
        <span class="auth-field__label">{{ devCode ? 'کد تایید' : 'کد تایید پیامک‌شده' }}</span>
        <input
          ref="loginCode"
          type="text"
          dir="ltr"
          inputmode="numeric"
          maxlength="6"
          v-model="loginForm.data.verify_code"
          class="auth-input auth-otp"
          placeholder="––––––"
          v-validate="{ required: true }"
          name="verify_code"
          data-vv-as="کد تایید"
          autocomplete="one-time-code"
          data-vv-scope="login"
          :class="{ 'auth-input--error': errors.has('login.verify_code') }"
          @input="onCodeInput"
        />
        <span v-if="errors.has('login.verify_code')" class="auth-field__error">
          {{ errors.first("login.verify_code") }}
        </span>
      </label>

      <div class="auth-resend">
        <span v-if="resendIn > 0" class="auth-cooldown" role="timer" :aria-label="`زمان باقی‌مانده برای ارسال دوباره یا اصلاح شماره ${resendLabel}`">
          <span class="auth-cooldown__clock" aria-hidden="true">◷</span>
          <span>ارسال دوباره یا اصلاح شماره تا</span>
          <bdi class="auth-cooldown__time" dir="ltr">{{ resendLabel }}</bdi>
        </span>
        <button v-else type="button" class="auth-resend__btn" @click="resend">ارسال دوباره کد</button>
      </div>

      <button type="submit" class="auth-submit" :disabled="busy">
        <span v-if="!busy">ورود</span>
        <span v-else class="auth-spinner" aria-label="در حال ورود"></span>
      </button>
    </form>
  </b-modal>
</template>

<script>
import { normalizeMobileIran, isValidMobileIran } from '~/utils/mobile';

/** Cooldown before another OTP request or changing the phone number. */
const RESEND_SECONDS = 120;

export default {
  name: "registerModal",
  methods: {
    hide() {
      this.$bvModal.hide('modal-login');
    },
    /**
     * Server errors arrive as an axios error; validation failures are thrown
     * as plain strings. The old handler only knew the first shape, so a failed
     * validation left the customer staring at a button that did nothing.
     */
    toastError(error) {
      const data = error && error.response && error.response.data;
      let message = data && (data.message || data.error || data.detail);
      if (Array.isArray(message)) message = message.join('، ');
      if (typeof message !== 'string' || !message.trim()) {
        if (typeof error === 'string') message = error;
        else if (error && error.code === 'ECONNABORTED') message = 'پاسخی از سرور دریافت نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.';
        else if (error && !error.response && (error.request || error.message === 'Network Error')) message = 'ارتباط با سرور برقرار نشد. اینترنت را بررسی و دوباره تلاش کنید.';
        else message = 'ارسال یا تأیید کد با خطا مواجه شد. لطفاً دوباره تلاش کنید.';
      }
      this.$bvToast.toast(message, { variant: 'danger' });
    },
    onShown() {
      // Phones open the keyboard straight onto the field the customer needs.
      this.$nextTick(() => {
        const el = this.$refs.mobileInput;
        if (el && this.loginForm.step === 'checkMobile') el.focus();
      });
    },
    onHidden() {
      // Keep counting while the modal is closed, so reopening cannot restart
      // the two-minute wait from the beginning.
      this.syncTimer();
      this.$emit('closed');
    },
    /** Digits only, so a pasted "1 2 3 4 5 6" or a stray letter cannot pass. */
    onCodeInput() {
      const digits = String(this.loginForm.data.verify_code || '')
        .replace(/[^0-9۰-۹٠-٩]/g, '');
      const normalized = normalizeMobileIran(digits);
      if (normalized !== this.loginForm.data.verify_code) {
        this.loginForm.data.verify_code = normalized;
      }
    },
    startTimer() {
      this.stopTimer();
      this.cooldownEndsAt = Date.now() + RESEND_SECONDS * 1000;
      this.syncTimer();
      this.timer = setInterval(() => {
        this.syncTimer();
      }, 1000);
    },
    syncTimer() {
      if (!this.cooldownEndsAt) {
        this.resendIn = 0;
        return;
      }
      this.resendIn = Math.max(0, Math.ceil((this.cooldownEndsAt - Date.now()) / 1000));
      if (this.resendIn === 0) {
        this.cooldownEndsAt = null;
        this.stopTimer();
      }
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    /** Re-runs check-mobile, which is what sends the code in the first place. */
    async resend() {
      if (this.busy || this.resendIn > 0) return;
      await this.checkMobile(true);
      if (this.resendIn > 0) {
        this.$bvToast.toast(this.devCode ? 'کد جدید در همین پنجره نمایش داده شد' : 'کد تایید دوباره ارسال شد', { variant: 'success' });
      }
    },
    onMobileInput() {
      const normalized = normalizeMobileIran(this.loginForm.data.mobile);
      if (normalized !== this.loginForm.data.mobile) {
        this.loginForm.data.mobile = normalized;
      }
    },
    onMobileBlur() {
      this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
    },
    async checkMobile(keepStep = false) {
      if (this.busy || this.resendIn > 0) return;
      this.busy = true;
      try {
        this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
        let res = await this.$validator.validateAll("checkMobile");
        if (!res) throw "فرم زیر را تکمیل کنید";
        let resp = await this.$axios.post("/api/auth/check-mobile", {
          mobile: this.loginForm.data.mobile,
        });

        // The server includes this only in emergency mode; normal SMS OTPs are
        // never exposed to the browser.
        this.devCode = resp.data.verify_code || null;
        if (this.devCode) {
          // Prefilled so the customer does not have to retype what is already
          // on screen; still editable.
          this.loginForm.data.verify_code = this.devCode;
        }

        if (resp.data.is_new_user) {
          if (!keepStep) {
            this.loginForm.data.first_name = null;
            this.loginForm.data.last_name = null;
          }
          this.loginForm.step = "register";
          this.focusCode('registerCode');
        } else {
          this.loginForm.step = "login";
          this.loginForm.new_user = false;
          // /check-mobile intentionally returns only `is_new_user` for an
          // existing account. Login does not need profile names here; reading
          // resp.data.user caused a client-side TypeError after a successful
          // 201 response, which looked like an OTP send failure to customers.
          const existingUser = resp.data && resp.data.user;
          this.loginForm.data.first_name = existingUser ? existingUser.first_name : null;
          this.loginForm.data.last_name = existingUser ? existingUser.last_name : null;
          this.focusCode('loginCode');
        }
        this.startTimer();
      } catch (error) {
        this.toastError(error);
      } finally {
        this.busy = false;
      }

    },
    focusCode(ref) {
      this.$nextTick(() => {
        const el = this.$refs[ref];
        if (el) el.focus();
      });
    },
    async register() {
      if (this.busy) return;
      this.busy = true;
      try {
        this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
        let res = await this.$validator.validateAll("register");
        if (!res) throw "فرم زیر را تکمیل کنید";

        let resp = await this.$axios.post("/api/auth/register", {
          mobile: this.loginForm.data.mobile,
          first_name: this.loginForm.data.first_name,
          last_name: this.loginForm.data.last_name,
          verify_code: this.loginForm.data.verify_code,
        });

        this.auth.is_login = true;
        this.auth.user = resp.data.user;
        this.auth.token = resp.data.token;
        this.$axios.setHeader(
          "Authorization",
          "Bearer " + resp.data.token
        );
        localStorage.setItem("token", resp.data.token);
        localStorage.setItem("user", JSON.stringify(resp.data.user));
        this.stopTimer();
        this.cooldownEndsAt = null;
        this.resendIn = 0;
        this.$emit('onRegister')
      } catch (error) {
        this.toastError(error);
      } finally {
        this.busy = false;
      }
    },
    async login() {
      if (this.busy) return;
      this.busy = true;
      try {
        this.loginForm.data.mobile = normalizeMobileIran(this.loginForm.data.mobile);
        let res = await this.$validator.validateAll("login");
        if (!res) throw "فرم زیر را تکمیل کنید";

        let resp = await this.$axios.post("/api/auth/login", {
          mobile: this.loginForm.data.mobile,
          verify_code: this.loginForm.data.verify_code,
        });
        this.auth.is_login = true;
        this.loginForm.data = resp.data.user;
        this.auth.token = resp.data.token;
        this.auth.user = {
          first_name: resp.data.user.first_name,
          last_name: resp.data.user.last_name
        }
        this.$axios.setHeader(
          "Authorization",
          "Bearer " + resp.data.token
        );

        localStorage.setItem("token", resp.data.token);
        localStorage.setItem("user", JSON.stringify(resp.data.user));
        this.stopTimer();
        this.cooldownEndsAt = null;
        this.resendIn = 0;
        this.$emit('onLogin')
      } catch (error) {
        this.toastError(error);
      } finally {
        this.busy = false;
      }
    },
    editPhoneNumber() {
      if (this.busy || this.resendIn > 0) return;
      this.stopTimer();
      this.cooldownEndsAt = null;
      this.resendIn = 0;
      this.loginForm.step = "checkMobile";
      this.loginForm.new_user = true;
      this.loginForm.data.mobile = null;
      this.loginForm.data.first_name = null;
      this.loginForm.data.last_name = null;
      this.loginForm.data.verify_code = null;
      this.devCode = null;
      this.$nextTick(() => {
        const el = this.$refs.mobileInput;
        if (el) el.focus();
      });
    },
  },
  props: {
    auth: Object,
  },
  emits: ['onRegister', 'onLogin'],
  computed: {
    mobileValid() {
      return isValidMobileIran(this.loginForm.data.mobile);
    },
    /** m:ss, in Persian digits. */
    resendLabel() {
      const m = Math.floor(this.resendIn / 60);
      const s = String(this.resendIn % 60).padStart(2, '0');
      return (m + ':' + s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    },
  },
  beforeDestroy() {
    this.stopTimer();
  },
  data() {
    return {
      busy: false,
      devCode: null,
      resendIn: 0,
      cooldownEndsAt: null,
      timer: null,
      loginForm: {
        step: "checkMobile", // checkMobile | register | login
        new_user: true,
        data: {
          mobile: null,
          first_name: null,
          last_name: null,
          verify_code: null,
        },
      },
    }
  }
}
</script>

<style>
/* Unscoped on purpose: bootstrap-vue renders the dialog outside this
   component's tree, so scoped styles never reach .modal-dialog. */

/* ---- shell: the bottom-sheet placement comes from main.scss ---- */

.auth-modal .auth-modal__body {
  padding: var(--lz-space-2) var(--lz-space-4)
    calc(var(--lz-space-6) + env(safe-area-inset-bottom));
  position: relative;
}

.auth-sheet__grip {
  display: none;
}


.auth-sheet__close {
  position: absolute;
  top: var(--lz-space-3);
  left: var(--lz-space-3);
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: var(--lz-surface-light);
  color: var(--lz-ink-muted);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

/* ---- head ---- */
.auth-head {
  text-align: center;
  margin-bottom: var(--lz-space-6);
}

.auth-head__icon {
  width: 56px;
  height: 56px;
  margin: var(--lz-space-2) auto var(--lz-space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--lz-accent-wash);
  color: var(--lz-accent);
}

.auth-head__title {
  margin: 0 0 var(--lz-space-1);
  font-size: var(--lz-text-display);
  font-weight: var(--lz-weight-semibold);
  letter-spacing: var(--lz-track-lg);
  color: var(--lz-ink);
}

.auth-head__sub {
  margin: 0;
  font-size: var(--lz-text-body);
  line-height: var(--lz-leading-body);
  color: var(--lz-ink-muted);
}

.auth-head__mobile {
  direction: ltr;
  unicode-bidi: isolate;
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink);
}

.auth-edit {
  margin-top: var(--lz-space-2);
  border: 0;
  background: transparent;
  padding: var(--lz-space-1) var(--lz-space-2);
  font-family: inherit;
  font-size: var(--lz-text-sm);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-accent);
  cursor: pointer;
}

.auth-edit:disabled {
  color: var(--lz-ink-faint);
  cursor: not-allowed;
}

/* ---- fields ---- */
.auth-step { display: block; }

.auth-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--lz-space-3);
}

.auth-field {
  display: block;
  margin-bottom: var(--lz-space-4);
}

.auth-field__label {
  display: block;
  margin-bottom: var(--lz-space-2);
  font-size: var(--lz-text-sm);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-ink-muted);
}

.auth-input {
  width: 100%;
  height: 52px;
  padding: 0 var(--lz-space-4);
  border: 1px solid var(--lz-border-strong);
  border-radius: var(--lz-radius-control);
  background: var(--lz-surface);
  font-family: inherit;
  font-size: var(--lz-text-lg);
  color: var(--lz-ink);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.auth-input::placeholder { color: var(--lz-ink-faint); }

.auth-input:focus {
  border-color: var(--lz-accent);
  box-shadow: 0 0 0 3px var(--lz-accent-wash);
}

.auth-input--error {
  border-color: var(--lz-danger);
}

.auth-input--mobile {
  text-align: center;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

/* The code reads as six separate glyphs without six separate inputs, which
   keeps one v-validate field and one paste target. */
.auth-otp {
  height: 60px;
  text-align: center;
  font-size: 26px;
  font-weight: var(--lz-weight-semibold);
  letter-spacing: 14px;
  text-indent: 14px;
  font-variant-numeric: tabular-nums;
}

.auth-otp::placeholder { letter-spacing: 10px; font-size: 22px; }

.auth-field__error {
  display: block;
  margin-top: var(--lz-space-2);
  font-size: var(--lz-text-sm);
  color: var(--lz-danger);
}

/* Temporary stand-in for the SMS. Deliberately styled as a warning rather
   than a normal field so nobody mistakes it for finished behaviour. */
.auth-devcode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lz-space-3);
  margin-bottom: var(--lz-space-4);
  padding: var(--lz-space-3) var(--lz-space-4);
  border: 1px dashed var(--lz-warning);
  border-radius: var(--lz-radius-control);
  background: var(--lz-saffron-wash);
}

.auth-devcode__label {
  font-size: var(--lz-text-sm);
  line-height: var(--lz-leading-body);
  color: var(--lz-ink-muted);
}

.auth-devcode__value {
  direction: ltr;
  unicode-bidi: isolate;
  font-size: 20px;
  font-weight: var(--lz-weight-semibold);
  letter-spacing: 3px;
  font-variant-numeric: tabular-nums;
  color: var(--lz-ink);
}

/* ---- actions ---- */
.auth-resend {
  text-align: center;
  margin-bottom: var(--lz-space-4);
  font-size: var(--lz-text-sm);
  color: var(--lz-ink-muted);
}

.auth-cooldown {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid var(--lz-border-strong);
  border-radius: 999px;
  background: var(--lz-surface-light);
  color: var(--lz-ink-muted);
  font-size: var(--lz-text-sm);
  line-height: 1.4;
}

.auth-cooldown__clock {
  color: var(--lz-accent);
  font-size: 18px;
  line-height: 1;
}

.auth-cooldown__time {
  color: var(--lz-accent);
  font-weight: var(--lz-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.auth-resend__btn {
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: var(--lz-text-sm);
  font-weight: var(--lz-weight-semibold);
  color: var(--lz-accent);
  cursor: pointer;
}

.auth-submit {
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: var(--lz-radius-chip);
  background: var(--lz-accent);
  color: var(--lz-on-accent);
  font-family: inherit;
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--lz-shadow-accent);
}

.auth-submit { transition: opacity 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease; }
.auth-submit:active:not(:disabled) { transform: scale(0.98); }
.auth-submit:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

.auth-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: auth-spin 0.7s linear infinite;
}

@keyframes auth-spin { to { transform: rotate(360deg); } }

.auth-terms {
  margin: var(--lz-space-3) 0 0;
  text-align: center;
  font-size: var(--lz-text-caption);
  line-height: var(--lz-leading-body);
  color: var(--lz-ink-faint);
}

.auth-terms b { color: var(--lz-ink-muted); font-weight: var(--lz-weight-semibold); }
</style>
