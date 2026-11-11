<template>
  <div>
  <b-modal
    id="address-form-modal"
    centered
    size="lg"
    :static="true"
    hide-header-close
    @hidden="$emit('close')"
  >
    <template #modal-header="{ close }">
      <div class="address-form-modal-header" dir="ltr">
        <button
          type="button"
          class="address-form-modal-header__close"
          aria-label="بستن"
          @click="close()"
        >
          ×
        </button>
        <h5 class="address-form-modal-header__title" dir="rtl">مدیریت آدرس</h5>
      </div>
    </template>

    <form @submit.prevent="submit">
      <div class="form-group">
        <label class="form-label">عنوان آدرس *</label>
        <input
          v-model="form.title"
          type="text"
          class="form-control"
          placeholder="مثال: منزل، دفتر"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label">نشانی متنی *</label>
        <textarea
          v-model="form.address"
          class="form-control"
          rows="3"
          placeholder="خیابان، بن‌بست و توضیحات دیگر"
          required
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">پلاک</label>
          <input
            v-model="form.plateNumber"
            type="text"
            class="form-control"
            placeholder="مثال: ۲۳۴"
          />
        </div>
        <div class="form-group">
          <label class="form-label">واحد/زنگ</label>
          <input
            v-model="form.unitNumber"
            type="text"
            class="form-control"
            placeholder="مثال: ۵"
          />
        </div>
      </div>

      <!-- Same flow as the basket: a button opens the full-screen map, and the
           chosen spot is shown as a small preview with an "edit position" button.
           The map never changes the address typed above. -->
      <div class="form-group">
        <label class="form-label">موقعیت روی نقشه *</label>
        <client-only>
          <map-preview
            v-if="hasPosition"
            :lat="form.lat"
            :lng="form.lng"
            @edit="mapModalOpen = true"
          />
          <button v-else type="button" class="laviz-map-trigger" @click="mapModalOpen = true">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
              <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <circle cx="12" cy="10" r="2.3" fill="currentColor"/>
            </svg>
            <span>تعیین آدرس روی نقشه</span>
          </button>
        </client-only>
      </div>

      <div class="form-group form-group--checkbox">
        <label class="form-checkbox">
          <input
            v-model="form.isDefault"
            type="checkbox"
          />
          <span>پیش‌فرض برای سفارشات جدید</span>
        </label>
      </div>
    </form>

    <template #modal-footer>
      <button
        type="button"
        class="btn btn-secondary"
        @click="$emit('close')"
      >
        لغو
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="loading"
        @click="submit"
      >
        {{ loading ? 'درحال ذخیره...' : 'ذخیره آدرس' }}
      </button>
    </template>
  </b-modal>

  <!-- Outside the b-modal on purpose: the sheet is moved with a transform, and a
       position:fixed map inside it would fill the sheet instead of the screen. -->
  <client-only>
    <map-picker-modal
      :open="mapModalOpen"
      :lat="hasPosition ? form.lat : null"
      :lng="hasPosition ? form.lng : null"
      :center-lat="mapCenter.lat"
      :center-lng="mapCenter.lng"
      @confirm="onMapConfirm"
      @close="mapModalOpen = false"
    />
  </client-only>
  </div>
</template>

<script>
import MapPickerModal from '~/components/MapPickerModal.vue';
import MapPreview from '~/components/MapPreview.vue';
import { DEFAULT_MAP_CENTER } from '~/utils/mapir';

export default {
  name: 'AddressForm',
  components: { MapPickerModal, MapPreview },
  props: {
    address: { type: Object, default: null },
    loading: { type: Boolean, default: false },
  },
  data() {
    const emptyForm = {
      id: null,
      title: '',
      address: '',
      plateNumber: '',
      unitNumber: '',
      lat: null,
      lng: null,
      isDefault: false,
    };
    const address = this.address || {};
    const lat = address.lat == null ? null : Number(address.lat);
    const lng = address.lng == null ? null : Number(address.lng);

    return {
      mapCenter: DEFAULT_MAP_CENTER,
      mapModalOpen: false,
      form: {
        ...emptyForm,
        ...address,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        isDefault: !!address.isDefault,
      },
    };
  },
  computed: {
    hasPosition() {
      return this.form.lat !== null && this.form.lng !== null;
    },
  },
  mounted() {
    this.$bvModal.show('address-form-modal');
  },
  methods: {
    /** A spot was confirmed on the full-screen map; the typed address stays as is. */
    onMapConfirm({ lat, lng }) {
      this.form.lat = lat;
      this.form.lng = lng;
      this.mapModalOpen = false;
    },
    submit() {
      if (!this.form.title?.trim()) {
        this.$bvToast.toast('عنوان الزامی است', { variant: 'danger' });
        return;
      }
      if (!this.form.address?.trim()) {
        this.$bvToast.toast('نشانی الزامی است', { variant: 'danger' });
        return;
      }
      if (this.form.lat === null || this.form.lng === null) {
        this.$bvToast.toast('انتخاب موقعیت الزامی است', { variant: 'danger' });
        return;
      }
      this.$emit('save', this.form);
    },
  },
};
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.address-form-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.address-form-modal-header__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--lz-surface-light);
  color: var(--lz-ink-muted);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
}

.address-form-modal-header__title {
  margin: 0;
  color: var(--lz-ink);
  font-size: 1.1rem;
  font-weight: 700;
}

.form-group--checkbox {
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--lz-ink);
  margin-bottom: 0.4rem;
}

.form-control {
  width: 100%;
  border: 1px solid rgba(42, 35, 24, 0.2);
  border-radius: 8px;
  padding: 0.7rem 0.8rem;
  font-size: 0.85rem;
  font-family: inherit;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--lz-accent);
  box-shadow: 0 0 0 2px rgba(196, 69, 54, 0.1);
}

.form-control[type='checkbox'] {
  width: auto;
  margin-right: 0.5rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--lz-ink-muted);
  margin: 0 0 0.6rem;
}

.form-checkbox {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--lz-ink);
  cursor: pointer;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.2rem;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary {
  background: var(--lz-accent);
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--lz-ink-muted);
  border: 1px solid var(--lz-ink-muted);
}
</style>
