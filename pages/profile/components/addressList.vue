<template>
  <div class="address-list">
    <p v-if="!addresses || addresses.length === 0" class="address-list__empty">
      آدرسی ثبت نشده است.
    </p>

    <div v-else class="address-cards">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="address-card"
        :class="{ 'address-card--default': addr.isDefault }"
      >
        <div class="address-card__header">
          <h3 class="address-card__title">{{ addr.title }}</h3>
          <span v-if="addr.isDefault" class="address-card__badge">پیش‌فرض</span>
        </div>

        <div class="address-card__content">
          <p class="address-card__text">{{ addr.address }}</p>

          <div v-if="addr.plateNumber || addr.unitNumber" class="address-card__details">
            <span v-if="addr.plateNumber">پلاک {{ addr.plateNumber }}</span>
            <span v-if="addr.unitNumber">واحد {{ addr.unitNumber }}</span>
          </div>

          <p class="address-card__coords">
            {{ addr.lat?.toFixed(4) }}, {{ addr.lng?.toFixed(4) }}
          </p>
        </div>

        <div class="address-card__actions">
          <button
            type="button"
            class="address-action-btn"
            @click="$emit('edit', addr)"
          >
            ویرایش
          </button>
          <button
            type="button"
            class="address-action-btn address-action-btn--delete"
            @click="$emit('delete', addr.id)"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddressList',
  props: {
    addresses: { type: Array, default: () => [] },
  },
};
</script>

<style scoped>
.address-list {
  padding: 0;
}

.address-list__empty {
  text-align: center;
  color: var(--lz-ink-muted);
  font-size: 0.85rem;
  padding: 1.5rem 0;
  margin: 0;
}

.address-cards {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.address-card {
  border: 1px solid rgba(42, 35, 24, 0.1);
  border-radius: 10px;
  padding: 1rem;
  background: var(--lz-surface-light);
  transition: border-color 0.15s;
}

.address-card:hover {
  border-color: rgba(42, 35, 24, 0.2);
}

.address-card--default {
  background: rgba(196, 69, 54, 0.04);
  border-color: rgba(196, 69, 54, 0.15);
}

.address-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.address-card__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--lz-ink);
  margin: 0;
}

.address-card__badge {
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--lz-accent);
  color: #fff;
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
}

.address-card__content {
  margin-bottom: 0.8rem;
}

.address-card__text {
  font-size: 0.85rem;
  color: var(--lz-ink);
  margin: 0 0 0.4rem;
  line-height: 1.5;
}

.address-card__details {
  display: flex;
  gap: 0.8rem;
  font-size: 0.75rem;
  color: var(--lz-ink-muted);
  margin: 0.4rem 0;
}

.address-card__coords {
  font-size: 0.72rem;
  color: var(--lz-ink-faint);
  margin: 0.4rem 0 0;
  font-family: monospace;
}

.address-card__actions {
  display: flex;
  gap: 0.6rem;
}

.address-action-btn {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--lz-accent);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s;
}

.address-action-btn:hover {
  opacity: 0.9;
}

.address-action-btn--delete {
  background: transparent;
  border: 1px solid var(--lz-accent);
  color: var(--lz-accent);
}
</style>
