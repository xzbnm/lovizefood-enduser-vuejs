<template>
  <div class="my-codes">
    <div class="my-codes__tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        class="my-codes__tab"
        :class="{ 'my-codes__tab--active': tab === t.value }"
        role="tab"
        :aria-selected="tab === t.value"
        @click="tab = t.value"
      >
        {{ t.text }}
        <span class="my-codes__tab-count">{{ toFa(listFor(t.value).length) }}</span>
      </button>
    </div>

    <p v-if="loading" class="my-codes__state">در حال بارگذاری…</p>

    <p v-else-if="!current.length" class="my-codes__state">
      {{ tab === 'available' ? 'کد تخفیف فعالی ندارید.' : 'کد استفاده‌شده‌ای ندارید.' }}
    </p>

    <ul v-else class="my-codes__list">
      <li v-for="code in current" :key="code.id" class="code-card" :class="{ 'code-card--spent': tab === 'used' }">
        <div class="code-card__head">
          <span class="code-card__code" @click="copy(code.code)" :title="'کپی ' + code.code">
            {{ code.code }}
          </span>
          <span class="code-card__amount">{{ toFa(code.decreaseValue || code.amount) }} تومان</span>
        </div>

        <p class="code-card__title">{{ code.title }}</p>

        <div class="code-card__meta">
          <span v-if="tab === 'used'" class="code-card__badge code-card__badge--spent">استفاده شده</span>
          <template v-else>
            <!-- Remaining time is the thing a customer actually acts on, so it
                 gets the emphasis rather than the raw expiry date. -->
            <span
              class="code-card__badge"
              :class="{ 'code-card__badge--urgent': remainingDays(code) !== null && remainingDays(code) <= 1 }"
            >{{ remainingLabel(code) }}</span>
            <small v-if="code.expTime" class="code-card__exp">تا {{ faDate(code.expTime) }}</small>
          </template>
        </div>
      </li>
    </ul>

    <p v-if="copied" class="my-codes__copied">کد «{{ copied }}» کپی شد.</p>
  </div>
</template>

<script>
export default {
  name: 'MyDiscountCodes',
  data() {
    return {
      loading: false,
      tab: 'available',
      available: [],
      used: [],
      copied: null,
      tabs: [
        { value: 'available', text: 'استفاده نشده' },
        { value: 'used', text: 'استفاده شده' },
      ],
    };
  },
  computed: {
    current() {
      return this.listFor(this.tab);
    },
  },
  created() {
    this.load();
  },
  methods: {
    listFor(tab) {
      return tab === 'used' ? this.used : this.available;
    },
    async load() {
      this.loading = true;
      try {
        const { data } = await this.$axios.get('/api/enduser/profile/discount-codes');
        this.available = data.available || [];
        this.used = data.used || [];
      } catch (e) {
        this.available = [];
        this.used = [];
      } finally {
        this.loading = false;
      }
    },
    remainingDays(code) {
      if (code.remainingDays != null) return code.remainingDays;
      if (!code.expTime) return null;
      return Math.max(0, Math.ceil((new Date(code.expTime).getTime() - Date.now()) / 86400000));
    },
    remainingLabel(code) {
      const d = this.remainingDays(code);
      if (d === null) return 'بدون محدودیت زمانی';
      if (d === 0) return 'امروز آخرین مهلت';
      if (d === 1) return 'یک روز مانده';
      return `${this.toFa(d)} روز مانده`;
    },
    faDate(value) {
      try {
        return new Date(value).toLocaleDateString('fa-IR', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
      } catch (e) {
        return String(value).slice(0, 10);
      }
    },
    toFa(n) {
      return Number(n || 0).toLocaleString('fa-IR');
    },
    copy(code) {
      const done = () => {
        this.copied = code;
        setTimeout(() => { this.copied = null; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => {});
      } else {
        // Older mobile browsers: fall back to a throwaway input.
        const el = document.createElement('input');
        el.value = code;
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(el);
      }
    },
  },
};
</script>

<style scoped>
.my-codes__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.my-codes__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border: 1px solid var(--laviz-border);
  border-radius: 8px;
  background: var(--laviz-surface);
  color: var(--laviz-muted);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.my-codes__tab--active {
  border-color: var(--laviz-primary);
  background: var(--laviz-primary-light);
  color: var(--laviz-primary);
}

.my-codes__tab-count {
  font-size: 12px;
  font-weight: 400;
}

.my-codes__state,
.my-codes__copied {
  text-align: center;
  color: var(--laviz-muted);
  font-size: 14px;
  padding: 12px 0;
  margin: 0;
}

.my-codes__copied { color: var(--laviz-success); }

.my-codes__list { list-style: none; margin: 0; padding: 0; }

.code-card {
  border: 1px dashed var(--laviz-border);
  border-radius: var(--laviz-radius);
  padding: 10px 12px;
  margin-bottom: 8px;
}

.code-card--spent { opacity: 0.6; }

.code-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.code-card__code {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--laviz-primary);
  cursor: pointer;
}

.code-card__amount {
  font-size: 14px;
  font-weight: 600;
  color: var(--laviz-text);
}

.code-card__title {
  margin: 4px 0 6px;
  font-size: 13px;
  color: var(--laviz-muted);
}

.code-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.code-card__badge {
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  padding: 2px 10px;
  background: var(--laviz-surface-soft, #eeeef0);
  color: var(--laviz-text);
}

.code-card__badge--urgent {
  background: var(--lz-danger-wash);
  color: var(--laviz-danger);
}

.code-card__badge--spent {
  background: var(--laviz-surface-soft, #eeeef0);
  color: var(--laviz-muted);
}

.code-card__exp { font-size: 11px; color: var(--laviz-faint, #a6a8b0); }
</style>
