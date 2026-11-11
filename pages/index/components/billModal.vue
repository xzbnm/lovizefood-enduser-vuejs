<template>
  <b-modal id="modal-bill" centered hide-footer hide-header dialog-class="laviz-bill-modal" body-class="p-0">
    <div class="laviz-bill-modal__head">
      <span class="laviz-bill-modal__title">{{ auth.is_login ? auth.user.first_name + " " + auth.user.last_name + " عزیز، فاکتور شما" : "فاکتور شما" }}</span>
      <button type="button" class="laviz-bill-modal__close" aria-label="بستن" @click="$bvModal.hide('modal-bill')">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="laviz-bill-modal__body" v-if="selectedProducts.length > 0">
  <div class="laviz-bill-card">
    
    <!-- هدر -->
    <div class="d-flex justify-content-between align-items-center mb-2">
      <strong>خرید شما:</strong>
      <b-badge variant="primary">{{ selectedProducts.length }} مورد</b-badge>
    </div>

    <!-- لیست محصولات -->
    <div
      v-for="item in selectedProducts"
      :key="item.name"
      class="d-flex justify-content-between align-items-center py-2 border-bottom"
    >
      <div class="text-right">
        <div class="font-weight-bold">{{ item.name }}</div>
        <small class="text-muted">
          {{ item.count }} {{ item.unit_name }} × {{ formatNum(item.price) }} تومان
        </small>
      </div>
      <div class="text-left font-weight-bold text-success">
        {{ formatNum(item.total) }} تومان
      </div>
    </div>

    <!-- جمع جزئی -->
    <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
      <small class="text-muted">جمع جزئی:</small>
      <strong>{{ formatNum(selectedItemsTotal) }} تومان</strong>
    </div>

    <!-- تخفیف -->
    <div
      class="d-flex justify-content-between align-items-center py-2 border-top"
      v-if="billData.discount_amount > 0"
    >
      <span class="text-muted">مبلغ تخفیف :</span>
      <span class="font-weight-bold text-danger">- {{ formatNum(billData.discount_amount) }} تومان</span>
    </div>

    <div class="d-flex justify-content-between align-items-center py-2 border-top" v-if="delivery_type == 'sendToMe'">
      <span class="text-muted">هزینه ارسال :</span>
      <span class="font-weight-bold">+ {{ formatNum(billData.shipping_cost || shippingCost) }} تومان</span>
    </div>
    <div class="d-flex justify-content-between align-items-center py-2 border-top" v-if="billData.tax_amount > 0">
      <span class="text-muted">مالیات :</span>
      <span class="font-weight-bold">+ {{ formatNum(billData.tax_amount) }} تومان</span>
    </div>
    <div class="form-group mt-2">
      <label>توضیحات سفارش (اختیاری)</label>
      <textarea v-model="orderCommentLocal" class="form-control" rows="2" placeholder="مثلاً بدون نان..." />
    </div>
    <div class="laviz-bill-card__total">
      <span>مبلغ قابل پرداخت</span>
      <span>{{ formatNum(billData.payment_amount) }} تومان</span>
    </div>

  </div>

    <div class="laviz-bill-delivery">
      <div class="laviz-bill-delivery__row">
        <div class="laviz-bill-delivery__label">نوع ارسال</div>
        <div class="laviz-bill-delivery__value">
          <template v-if="delivery_type === 'sendToMe'">
            {{ deliveryDayText }} برام ارسال کنید.
          </template>
          <template v-else-if="delivery_type === 'snapp'">
            {{ deliveryDayText }} خودم اسنپ می‌گیرم.
          </template>
          <template v-else>
            {{ deliveryDayText }} حضوری میام.
          </template>
          <div v-if="delivery_time" class="laviz-bill-delivery__sub">ساعت {{ delivery_time }}</div>
        </div>
      </div>

      <div v-if="delivery_type === 'sendToMe'" class="laviz-bill-delivery__row">
        <div class="laviz-bill-delivery__label">به آدرس</div>
        <div class="laviz-bill-delivery__value">{{ delivery_address }}</div>
      </div>
    </div>
</div>
    <div class="laviz-bill-modal__actions">
      <button type="button" class="laviz-btn-pay w-100" @click="payment()">تأیید و پرداخت</button>
    </div>
  </b-modal>
</template>

<script>
import moment from "moment-jalaali";

export default {
  name: "billModal",
  props: {
    auth: Object,
    display_product: Boolean,
    products: Array,
    productData: Object,
    billData: Object,
    discountCode: Object,
    delivery_type: String,
    delivery_date: String,
    // "امروز", "فردا" or "پس فردا" for the chosen day.
    dayLabel: { type: String, default: '' },
    delivery_time: String,
    check_one: Boolean,
    delivery_address: String,
    shippingCost: Number,
    orderComment: String,
    deliveryLat: Number,
    deliveryLng: Number,
    addressId: String,
  },
  data() {
    return { orderCommentLocal: '' };
  },
  watch: {
    orderComment: {
      immediate: true,
      handler(v) { this.orderCommentLocal = v || ''; }
    }
  },
  methods: {
    async payment() {
      try {
        let data = {
          products: [],
          delivery_date: this.delivery_date,
          delivery_type: this.delivery_type,
          delivery_time: this.delivery_time,
          check_one: this.check_one,
          delivery_address: this.delivery_address,
          discount_code: this.discountCode.code,
          comment: this.orderCommentLocal,
          delivery_lat: this.deliveryLat,
          delivery_lng: this.deliveryLng,
          address_id: this.addressId,
        };
        for (let product of this.products) {
          if (this.productData[product.key].count)
            data.products.push({
              product_id: product.key,
              count: this.productData[product.key].count,
            });
        }
        let resp = await this.$axios.post("/api/enduser/order/create", data);
        console.log(resp)
        this.loading_payment = false;
        window.location.href = resp.data.payment_link;
      } catch (error) {
        this.loading_payment = false;
        if (error.response)
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
      }
    },
    jalaliDate(date, format = "jYYYY/jM/jD") {
      return moment(date, "YYYY/M/D").format(format);
    }
  },
  computed: {
    // Today reads as just "امروز"; other days read "فردا ۱۶ آبان ۱۴۰۵".
    deliveryDayText() {
      const date = this.jalaliDate(this.delivery_date, 'jD jMMMM jYYYY');
      if (!this.dayLabel) return date;
      return this.dayLabel === 'امروز' ? this.dayLabel : `${this.dayLabel} ${date}`;
    },
  hasValidProducts() {
    if (this.products.length < 2) return false;
    
    const uniqueCategoryIds = new Set(this.products.map(p => p.categoryId));
    
    return uniqueCategoryIds.size >= 2;
  },
  selectedProducts() {
    return this.products
      .filter(p => this.productData[p.key]?.count > 0)
      .map(p => ({
        key: p.key,
        name: this.productData[p.key].name,
        count: this.productData[p.key].count,
        price: this.productData[p.key].price,
        unit_name: this.productData[p.key].unit_name,
        discount_percent: this.productData[p.key].discount_percent,
        total: this.productData[p.key].count * this.productData[p.key].price,
        totalWithDiscount: this.productData[p.key].count * this.productData[p.key].price * (1 - this.productData[p.key].discount_percent / 100)
      }));
  },
  
  // ✅ جمع کل محصولات انتخاب شده
  selectedItemsTotal() {
    return this.selectedProducts.reduce((sum, item) => sum + item.total, 0);
  }
}
}
</script>

<style scoped lang="scss">
/* Title on the right (start), close button on the left (end). */
.laviz-bill-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem 0;
  font-weight: 800;
  text-align: right;
  font-size: 1.05rem;
}

.laviz-bill-modal__title {
  flex: 1;
  min-width: 0;
}

.laviz-bill-modal__close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-inline-end: -0.5rem;
  border: 0;
  border-radius: 50%;
  background: var(--lz-surface-soft);
  color: var(--lz-ink);
  cursor: pointer;
}

.laviz-bill-modal__close:active { transform: scale(0.92); }

.laviz-bill-modal__body {
  padding: 0 1.25rem 0.5rem;
}

.laviz-bill-delivery {
  margin-top: 1rem;
  border: 1px solid rgba(42, 35, 24, 0.08);
  border-radius: 14px;
  overflow: hidden;
  background: var(--lz-surface);
}

.laviz-bill-delivery__row {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(42, 35, 24, 0.08);
  text-align: right;
  direction: rtl;

  &:last-child {
    border-bottom: none;
  }
}

.laviz-bill-delivery__label {
  font-size: 0.85rem;
  color: var(--lz-ink-muted);
  margin-bottom: 0.35rem;
}

.laviz-bill-delivery__value {
  font-weight: 700;
  line-height: 1.65;
  word-break: break-word;
}

.laviz-bill-delivery__sub {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--lz-ink-muted);
  margin-top: 0.25rem;
}

.laviz-bill-card {
  background: var(--lz-surface-light);
  border: 1px solid rgba(42, 35, 24, 0.08);
  border-radius: 14px;
  padding: 1rem;
  margin-top: 0.75rem;
}

.laviz-bill-card__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: var(--lz-success);
  color: #fff;
  font-weight: 800;
}

/* The dark theme's green is light, so the text on it goes dark. */
html[data-theme='dark'] .laviz-bill-card__total {
  color: #0e0f10;
}

</style>
