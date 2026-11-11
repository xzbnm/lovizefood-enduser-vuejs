<template>
  <section class="chef-daily">
    <header class="chef-daily__header">
      <h2 class="chef-daily__title section-heading">غذای روز سرآشپز</h2>
      <p class="chef-daily__hint">
        امروز {{ todayName }} است — غذاهای روزهای آینده را هم می‌توانید پیش‌سفارش کنید؛ تاریخ تحویل را در سبد انتخاب کنید.
      </p>
    </header>

    <p v-if="!groups.length" class="chef-daily__empty">
      برای این هفته غذای روزی ثبت نشده است.
    </p>

    <div
      v-for="group in groups"
      :key="group.dayIndex"
      class="chef-daily__group"
      :class="{ 'chef-daily__group--today': group.isToday }"
    >
      <div class="chef-daily__day">
        <span class="chef-daily__day-name">{{ group.dayName }}</span>
        <span v-if="group.isToday" class="chef-daily__day-badge">امروز</span>
        <span v-else class="chef-daily__day-offset">{{ offsetLabel(group.offset) }}</span>
      </div>

      <div class="chef-daily__products">
        <div
          v-for="product in group.products"
          :key="product.key"
          class="chef-daily__product"
        >
          <product-item
            v-if="productData[product.key]"
            :discount_percent="productData[product.key].discount_percent"
            :name="productData[product.key].name"
            :price="productData[product.key].price"
            :count="productData[product.key].count"
            :isOutOfStock="productData[product.key].isOutOfStock"
            :unit_name="productData[product.key].unit_name"
            :image="productData[product.key].image"
                      :fullImage="productData[product.key].imageFull || ''"
                      :hasPhoto="!!productData[product.key].imageFull"
            :description="productData[product.key].description"
            :isSpecial="productData[product.key].isSpecial"
            @decrease="$emit('decrease', product.key)"
            @increase="$emit('increase', product.key)"
            @imageClick="$emit('imageClick', $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import ProductItem from '~/pages/index/components/productItem.vue';
import { buildChefDailyGroups, todayWeekIndex, WEEK_DAY_NAMES } from '~/utils/chefDaily';

export default {
  name: 'ChefDailyTab',
  components: { ProductItem },
  props: {
    products: { type: Array, default: () => [] },
    productData: { type: Object, default: () => ({}) },
  },
  computed: {
    today() {
      return todayWeekIndex();
    },
    todayName() {
      return WEEK_DAY_NAMES[this.today];
    },
    groups() {
      return buildChefDailyGroups(this.products, this.today);
    },
  },
  methods: {
    offsetLabel(offset) {
      if (offset === 1) return 'فردا';
      return offset + ' روز دیگر';
    },
  },
};
</script>

<style scoped>
.chef-daily {
  margin-bottom: 1rem;
}

.chef-daily__header {
  margin-bottom: 0.85rem;
  text-align: center;
}

.chef-daily__hint {
  font-size: 0.8rem;
  color: var(--laviz-muted);
  margin: 0;
}

.chef-daily__empty {
  font-size: 0.85rem;
  color: var(--laviz-muted);
  text-align: center;
  padding: 1.5rem 0;
}

.chef-daily__group {
  margin-bottom: 1.1rem;
}

.chef-daily__day {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.chef-daily__day-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--laviz-text);
}

.chef-daily__day-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--lz-saffron-ink);
  background: var(--lz-saffron);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
}

.chef-daily__day-offset {
  font-size: 0.72rem;
  color: var(--laviz-muted);
}

.chef-daily__products {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

</style>
