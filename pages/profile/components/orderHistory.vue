<template>
  <div class="order-history">
    <p v-if="!orders || orders.length === 0" class="order-history__empty">
      سفارشی ثبت نشده است.
    </p>

    <div v-else class="order-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        :class="{ 'order-card--pending': ![4, 20].includes(Number(order.status)) }"
      >
        <div class="order-card__header">
          <span class="order-card__id">
            {{ order.orderNumber || order.id.slice(0, 8) }}
          </span>
          <span class="order-card__status" :class="`order-card__status--${statusClass(order.status)}`">
            {{ statusLabel(order.status) }}
          </span>
        </div>

        <div class="order-card__meta">
          <div>
            <small class="order-card__label">تاریخ:</small>
            <span>{{ formatJalaliDate(order.createDate, true) }}</span>
          </div>
          <div>
            <small class="order-card__label">تحویل:</small>
            <span>{{ formatJalaliDate(order.deliveryDate) }} {{ order.deliveryTime || '' }}</span>
          </div>
        </div>

        <div class="order-card__items">
          <div
            v-for="item in parseOrderItems(order)"
            :key="item.id"
            class="order-item-line"
          >
            <span>{{ item.title }} × {{ item.count }}</span>
            <span class="order-item-price">{{ formatNum(item.total) }} تومان</span>
          </div>
        </div>

        <div class="order-card__total">
          <strong>{{ formatNum(order.totalAmount) }} تومان</strong>
        </div>

        <div class="order-card__actions">
          <button
            type="button"
            class="order-action-btn"
            @click="$emit('review', order)"
          >
            ثبت نظر
          </button>
          <a
            v-if="![3, 5].includes(Number(order.status))"
            href="#"
            class="order-action-btn order-action-btn--secondary"
            :aria-busy="downloadingReceiptId === order.id"
            @click.prevent="$emit('download-receipt', order)"
          >
            {{ downloadingReceiptId === order.id ? '...' : 'رسید / PDF' }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment-jalaali';

export default {
  name: 'OrderHistory',
  props: {
    orders: { type: Array, default: () => [] },
    downloadingReceiptId: { type: String, default: null },
  },
  methods: {
    formatJalaliDate(value, includeTime = false) {
      if (!value) return '';
      const date = moment(value);
      if (!date.isValid()) return String(value);

      const format = includeTime ? 'jYYYY/jMM/jDD - HH:mm' : 'jYYYY/jMM/jDD';
      return date.format(format).replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]);
    },
    statusLabel(status) {
      const map = {
        2: 'پرداخت شده (نقدی)',
        3: 'پرداخت ناموفق',
        10: 'درانتظار تایید',
        12: 'درحال آماده‌سازی',
        13: 'تحویل پیک',
        4: 'تحویل شده',
        5: 'در انتظار پرداخت',
        11: 'عدم تایید',
        1: 'پرداخت شده',
        20: 'تحویل شده',
      };
      return map[status] || 'در پیگیری';
    },
    statusClass(status) {
      if ([4, 20].includes(Number(status))) return 'completed';
      if (Number(status) === 13) return 'shipping';
      if (Number(status) === 12) return 'preparing';
      return 'pending';
    },
    // Lines of one order, read from `items` on the order (same fields as the
    // current-order endpoint: productTitle, count, amount = unit price).
    parseOrderItems(order) {
      const lines = order.items || order.orderItems || [];
      return lines.map((line, index) => ({
        id: line.id || `${order.id}-${index}`,
        title: line.productTitle || line.title || line.name || 'محصول',
        count: line.count,
        total: line.total != null ? line.total : Number(line.amount) * Number(line.count),
      }));
    },
    formatNum(val) {
      return Number(val || 0).toLocaleString();
    },
  },
};
</script>

<style scoped>
.order-history {
  padding: 0;
}

.order-history__empty {
  text-align: center;
  color: var(--lz-ink-muted);
  font-size: 0.85rem;
  padding: 1.5rem 0;
  margin: 0;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.order-card {
  border: 1px solid rgba(42, 35, 24, 0.08);
  border-radius: 10px;
  padding: 1rem;
  background: var(--lz-surface-light);
  transition: border-color 0.15s;
}

.order-card:hover {
  border-color: rgba(42, 35, 24, 0.15);
}

.order-card--pending {
  border-left: 3px solid var(--lz-accent);
}

.order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}

.order-card__id {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--lz-ink);
}

.order-card__status {
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
}

.order-card__status--completed {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.order-card__status--shipping {
  background: rgba(33, 150, 243, 0.15);
  color: #2196f3;
}

.order-card__status--preparing {
  background: rgba(255, 152, 0, 0.15);
  color: #ff9800;
}

.order-card__status--pending {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

.order-card__meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--lz-ink-muted);
  margin-bottom: 0.7rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(42, 35, 24, 0.06);
}

.order-card__label {
  display: block;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.order-card__items {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.7rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(42, 35, 24, 0.06);
}

.order-item-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--lz-ink);
}

.order-item-price {
  font-weight: 600;
}

.order-card__total {
  text-align: left;
  font-size: 0.9rem;
  color: var(--lz-ink);
  margin-bottom: 0.7rem;
}

.order-card__actions {
  display: flex;
  gap: 0.6rem;
}

.order-action-btn {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--lz-accent);
  color: #fff;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: opacity 0.15s;
}

.order-action-btn:hover {
  opacity: 0.9;
}

.order-action-btn--secondary {
  background: transparent;
  border: 1px solid var(--lz-accent);
  color: var(--lz-accent);
}
</style>
