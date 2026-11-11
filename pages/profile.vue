<template>
  <div class="profile-page laviz-container">
    <!-- Header: back button + title -->
    <header class="profile-header">
      <button type="button" class="profile-header__back" @click="$router.back()" aria-label="بازگشت">
        <!-- Points right, the way "back" reads in a right-to-left page. -->
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M4 12h16M14 6l6 6-6 6" />
        </svg>
      </button>
      <h1 class="profile-header__title">پروفایل</h1>
      <div class="profile-header__spacer"></div>
    </header>

    <!-- One tab per section, in the same plain-text style as the menu's category
         strip. The strip scrolls sideways when it does not fit and stays at the
         top while the page scrolls. -->
    <nav ref="tabs" v-drag-scroll class="profile-tabs" role="tablist" aria-label="بخش‌های پروفایل">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :ref="'tab-' + tab.id"
        type="button"
        role="tab"
        class="profile-tabs__tab"
        :class="{ 'profile-tabs__tab--active': activeTab === tab.id }"
        :aria-selected="activeTab === tab.id ? 'true' : 'false'"
        @click="selectTab(tab.id)"
      >
        {{ tab.label }}
        <span v-if="tab.id === 'messages' && unseenCount" class="profile-tabs__badge">{{ unseenCount }}</span>
      </button>
    </nav>

    <b-overlay :show="loading" :z-index="999">
      <div class="profile-body">
        <!-- Profile info card -->
        <section v-if="profileData" v-show="activeTab === 'info'" class="profile-section">
          <header class="profile-section__header">
            <h2 class="profile-section__title">اطلاعات شخصی</h2>
            <button
              v-if="!editingProfile"
              type="button"
              class="profile-section__edit-btn"
              @click="editingProfile = true"
            >
              ویرایش
            </button>
          </header>

          <!-- Display mode -->
          <div v-if="!editingProfile" class="profile-info">
            <div class="profile-info__row">
              <span class="profile-info__label">نام:</span>
              <span class="profile-info__value">{{ profileData.name }}</span>
            </div>
            <div class="profile-info__row">
              <span class="profile-info__label">نام خانوادگی:</span>
              <span class="profile-info__value">{{ profileData.family }}</span>
            </div>
            <div class="profile-info__row">
              <span class="profile-info__label">شماره همراه:</span>
              <span class="profile-info__value">{{ profileData.mobile }}</span>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="profile-form">
            <div class="form-group">
              <label class="form-label">نام *</label>
              <input
                v-model="profileEdit.name"
                type="text"
                class="form-control"
                placeholder="نام"
              />
            </div>
            <div class="form-group">
              <label class="form-label">نام خانوادگی</label>
              <input
                v-model="profileEdit.family"
                type="text"
                class="form-control"
                placeholder="نام خانوادگی"
              />
            </div>
            <div class="form-actions">
              <button
                type="button"
                class="btn btn-primary"
                :disabled="savingProfile"
                @click="saveProfile"
              >
                {{ savingProfile ? 'درحال ذخیره...' : 'ذخیره' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="editingProfile = false"
              >
                لغو
              </button>
            </div>
          </div>
        </section>

        <!-- Password section -->
        <section v-show="activeTab === 'password'" class="profile-section">
          <header class="profile-section__header">
            <h2 class="profile-section__title">رمز عبور</h2>
          </header>

          <div v-if="!editingPassword" class="profile-info">
            <div class="profile-info__row">
              <span class="profile-info__label">وضعیت:</span>
              <span class="profile-info__value">
                {{ profileData?.hasPassword ? 'تعریف شده' : 'تعریف نشده' }}
              </span>
            </div>
            <button
              type="button"
              class="btn btn-outline-primary btn-sm mt-2"
              @click="editingPassword = true"
            >
              {{ profileData?.hasPassword ? 'تغییر رمز' : 'تعریف رمز' }}
            </button>
          </div>

          <div v-else class="profile-form">
            <div v-if="profileData?.hasPassword" class="form-group">
              <label class="form-label">رمز عبور فعلی *</label>
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                class="form-control"
                placeholder="رمز عبور فعلی"
              />
            </div>
            <div class="form-group">
              <label class="form-label">رمز عبور جدید *</label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="form-control"
                placeholder="حداقل ۶ کاراکتر"
              />
            </div>
            <div class="form-actions">
              <button
                type="button"
                class="btn btn-primary"
                :disabled="savingPassword"
                @click="savePassword"
              >
                {{ savingPassword ? 'درحال ذخیره...' : 'ذخیره' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="editingPassword = false"
              >
                لغو
              </button>
            </div>
          </div>
        </section>

        <!-- Messages section -->
        <section v-show="activeTab === 'messages'" class="profile-section">
          <header class="profile-section__header">
            <h2 class="profile-section__title">پیام‌ها</h2>
            <span v-if="unseenCount" class="profile-section__badge">{{ unseenCount }} جدید</span>
          </header>
          <notification-list @unseen="unseenCount = $event" />
        </section>

        <section v-show="activeTab === 'orders'" class="profile-section">
          <h2 class="profile-section__title">تاریخچه سفارشات</h2>
          <order-history
            :orders="orders"
            :downloading-receipt-id="downloadingReceiptId"
            @review="openReview"
            @download-receipt="downloadReceipt"
          />
        </section>

        <!-- Addresses section -->
        <section v-show="activeTab === 'addresses'" class="profile-section">
          <header class="profile-section__header">
            <h2 class="profile-section__title">آدرس‌های من</h2>
            <button
              type="button"
              class="profile-section__edit-btn"
              @click="addAddress"
            >
              + افزودن
            </button>
          </header>
          <address-list
            :addresses="profileData?.addresses || []"
            @edit="editAddress"
            @delete="deleteAddress"
          />
        </section>

        <!-- Sign out lives here; the header only carries the profile button. -->
        <button type="button" class="profile-logout" @click="logout">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 4.5H6.5A2 2 0 0 0 4.5 6.5v11a2 2 0 0 0 2 2H9M15.5 8l4 4-4 4M19.5 12H9.5" />
          </svg>
          خروج از حساب
        </button>

        <!-- Address form modal -->
        <address-form
          v-if="showAddressForm"
          :address="addressFormData"
          :loading="savingAddress"
          @save="saveAddress"
          @close="closeAddressForm"
        />
      </div>
    </b-overlay>

    <review-modal ref="reviewModal" @submitted="onReviewSubmitted" />
  </div>
</template>

<script>
import OrderHistory from './profile/components/orderHistory.vue';
import ReviewModal from './profile/components/reviewModal.vue';
import NotificationList from './profile/components/notificationList.vue';
import AddressList from './profile/components/addressList.vue';
import AddressForm from './profile/components/addressForm.vue';
import { openOrderReceiptForPrint } from '~/utils/orderReceipt';
import dragScroll from '~/utils/dragScroll';

export default {
  name: 'ProfilePage',
  components: { OrderHistory, AddressList, AddressForm, ReviewModal, NotificationList },
  directives: { dragScroll },
  data() {
    return {
      activeTab: 'info',
      tabs: [
        { id: 'info', label: 'اطلاعات' },
        { id: 'password', label: 'رمز عبور' },
        { id: 'messages', label: 'پیام‌ها' },
        { id: 'orders', label: 'سفارش‌ها' },
        { id: 'addresses', label: 'آدرس‌ها' },
      ],
      loading: false,
      unseenCount: 0,
      profileData: null,
      orders: [],
      downloadingReceiptId: null,
      editingProfile: false,
      savingProfile: false,
      profileEdit: { name: '', family: '' },
      editingPassword: false,
      savingPassword: false,
      passwordForm: { currentPassword: '', newPassword: '' },
      showAddressForm: false,
      savingAddress: false,
      addressFormData: null,
    };
  },
  async mounted() {
    // The whole page needs an authenticated customer; send guests to the menu
    // where the login modal lives, instead of rendering empty sections and
    // firing 401s for every panel.
    if (process.client && !localStorage.getItem('token')) {
      this.$router.replace('/');
      return;
    }

    await this.loadProfile();
    await this.loadOrders();
  },
  methods: {
    selectTab(id) {
      this.activeTab = id;
      this.$nextTick(this.revealActiveTab);
    },
    /**
     * Slides the strip so the chosen tab is centred. Measured as a delta between
     * two rects and applied with scrollBy, which works the same in LTR and RTL.
     */
    revealActiveTab() {
      const holder = this.$refs['tab-' + this.activeTab];
      const tab = Array.isArray(holder) ? holder[0] : holder;
      const strip = this.$refs.tabs;
      if (!tab || !strip || strip.scrollWidth <= strip.clientWidth) return;
      const stripRect = strip.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const delta = (tabRect.left + tabRect.width / 2) - (stripRect.left + stripRect.width / 2);
      if (Math.abs(delta) >= 1) strip.scrollBy({ left: delta, behavior: 'smooth' });
    },
    /** Signs out after a confirmation, then returns to the menu. */
    async logout() {
      let confirmed = false;
      try {
        confirmed = await this.$bvModal.msgBoxConfirm('آیا برای خروج از حساب اطمینان دارید؟', {
          title: 'خروج از حساب',
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'primary',
          cancelVariant: 'outline-secondary',
          okTitle: 'بله، خروج',
          cancelTitle: 'انصراف',
          headerClass: 'p-2 border-bottom-0',
          footerClass: 'p-2 border-top-0',
          centered: true,
        });
      } catch (e) {
        confirmed = false;
      }
      if (confirmed !== true) return;
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) { /* storage blocked */ }
      delete this.$axios.defaults.headers.common['Authorization'];
      this.$router.replace('/');
    },
    openReview(order) {
      this.$refs.reviewModal.open(order);
    },
    async downloadReceipt(order) {
      if (!order?.id) return;
      this.downloadingReceiptId = order.id;
      try {
        await openOrderReceiptForPrint(this.$axios, order);
        this.$bvToast.toast('از پنجرهٔ چاپ، گزینهٔ «ذخیره به‌صورت PDF» را انتخاب کنید.', { variant: 'info' });
      } catch (e) {
        const message = e.code === 'POPUP_BLOCKED'
          ? 'برای نمایش رسید، بازشدن پنجرهٔ جدید را در مرورگر مجاز کنید.'
          : e.response?.data?.message || 'خطا در آماده‌سازی رسید';
        this.$bvToast.toast(typeof message === 'string' ? message : 'خطا در آماده‌سازی رسید', { variant: 'danger' });
      } finally {
        this.downloadingReceiptId = null;
      }
    },
    async onReviewSubmitted() {
      // Refresh so any newly stored rating shows on the card straight away.
      await this.loadOrders();
    },
    async loadProfile() {
      try {
        this.loading = true;
        const res = await this.$axios.get('/api/enduser/profile');
        this.profileData = res.data;
      } catch (e) {
        this.$bvToast.toast('خطا در بارگذاری پروفایل', { variant: 'danger' });
      } finally {
        this.loading = false;
      }
    },
    async loadOrders() {
      try {
        const res = await this.$axios.get('/api/enduser/profile/orders');
        this.orders = res.data;
      } catch (e) {
        console.error('Error loading orders:', e);
      }
    },
    async saveProfile() {
      try {
        this.savingProfile = true;
        await this.$axios.put('/api/enduser/profile', this.profileEdit);
        this.profileData.name = this.profileEdit.name;
        this.profileData.family = this.profileEdit.family;
        this.editingProfile = false;
        this.$bvToast.toast('اطلاعات ذخیره شد', { variant: 'success' });
      } catch (e) {
        this.$bvToast.toast('خطا در ذخیره اطلاعات', { variant: 'danger' });
      } finally {
        this.savingProfile = false;
      }
    },
    async savePassword() {
      try {
        this.savingPassword = true;
        await this.$axios.put('/api/enduser/profile/password', this.passwordForm);
        this.profileData.hasPassword = true;
        this.editingPassword = false;
        this.passwordForm = { currentPassword: '', newPassword: '' };
        this.$bvToast.toast('رمز عبور ذخیره شد', { variant: 'success' });
      } catch (e) {
        const msg = e.response?.data?.message || 'خطا در ذخیره رمز عبور';
        this.$bvToast.toast(msg, { variant: 'danger' });
      } finally {
        this.savingPassword = false;
      }
    },
    editAddress(addr) {
      this.addressFormData = { ...addr };
      this.showAddressForm = true;
    },
    // A new address starts from an empty form, not from the one edited last.
    addAddress() {
      this.addressFormData = null;
      this.showAddressForm = true;
    },
    closeAddressForm() {
      this.showAddressForm = false;
      this.addressFormData = null;
    },
    async saveAddress(data) {
      try {
        this.savingAddress = true;
        if (data.id) {
          await this.$axios.put(`/api/enduser/profile/addresses/${data.id}`, data);
        } else {
          await this.$axios.post('/api/enduser/profile/addresses', data);
        }
        await this.loadProfile();
        this.showAddressForm = false;
        this.addressFormData = null;
        this.$bvToast.toast('آدرس ذخیره شد', { variant: 'success' });
      } catch (e) {
        const msg = e.response?.data?.message || 'خطا در ذخیره آدرس';
        this.$bvToast.toast(msg, { variant: 'danger' });
      } finally {
        this.savingAddress = false;
      }
    },
    async deleteAddress(id) {
      if (!confirm('آیا مطمئن هستید؟')) return;
      try {
        await this.$axios.delete(`/api/enduser/profile/addresses/${id}`);
        await this.loadProfile();
        this.$bvToast.toast('آدرس حذف شد', { variant: 'success' });
      } catch (e) {
        this.$bvToast.toast('خطا در حذف آدرس', { variant: 'danger' });
      }
    },
  },
};
</script>

<style scoped>
.profile-page {
  padding: 1rem 0 3rem;
  min-height: 100vh;
  background: var(--lz-surface-light);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 0.9rem;
  margin-bottom: 0;
  background: var(--lz-surface);
}

/* Section tabs: plain text, 48px tall, a 3px underline under the active one,
   like the menu's category strip. Sticks to the top while the page scrolls. */
.profile-tabs {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  gap: 0;
  overflow-x: auto;
  flex-wrap: nowrap;
  background: var(--lz-surface);
  border-bottom: 1px solid rgba(42, 35, 24, 0.08);
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

.profile-tabs::-webkit-scrollbar {
  display: none;
}

.profile-tabs__tab {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--lz-ink-muted);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
  padding: 12px 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease;
}

.profile-tabs__tab::after {
  content: '';
  position: absolute;
  right: 14px;
  left: 14px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--lz-accent);
  transform: scaleX(0);
  transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.profile-tabs__tab--active {
  color: var(--lz-ink);
  font-weight: 700;
}

.profile-tabs__tab--active::after {
  transform: scaleX(1);
}

.profile-tabs__tab:active {
  opacity: 0.7;
}

.profile-tabs__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--lz-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.profile-header__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--lz-ink);
  padding: 0;
}

.profile-header__title {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  color: var(--lz-ink);
}

.profile-header__spacer {
  width: 44px;
}

.profile-body {
  padding: 1rem 0.9rem 0;
  max-width: 720px;
  margin: 0 auto;
}

.profile-section {
  background: var(--lz-surface);
  border-radius: 14px;
  padding: 1.2rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(42, 35, 24, 0.08);
}

.profile-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.profile-section__title {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  color: var(--lz-ink);
}

/* A title that sits straight in the section (no header row around it) gets the
   same gap the header row gives the other sections, so it no longer touches the
   cards or tabs right below it. */
.profile-section > .profile-section__title {
  margin-bottom: 1rem;
}

.profile-section__edit-btn {
  border: none;
  background: none;
  color: var(--lz-accent);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.profile-info__row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(42, 35, 24, 0.06);
}

.profile-info__label {
  font-size: 0.85rem;
  color: var(--lz-ink-muted);
  font-weight: 700;
}

.profile-info__value {
  font-size: 0.85rem;
  color: var(--lz-ink);
  font-weight: 600;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--lz-ink);
}

.form-control {
  border: 1px solid rgba(42, 35, 24, 0.2);
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: var(--lz-accent);
  box-shadow: 0 0 0 2px rgba(196, 69, 54, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.btn {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: var(--lz-accent);
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-primary {
  border: 1px solid var(--lz-accent);
  color: var(--lz-accent);
  background: transparent;
}

.btn-outline-secondary {
  border: 1px solid var(--lz-ink-muted);
  color: var(--lz-ink-muted);
  background: transparent;
}

.btn-outline-secondary:hover {
  background: rgba(42, 35, 24, 0.04);
}

.btn-sm {
  padding: 0.5rem 0.8rem;
  font-size: 0.8rem;
}

.mt-2 {
  margin-top: 0.8rem;
}

.profile-logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 48px;
  margin: 0.5rem 0 1.5rem;
  border: 1px solid var(--lz-border-strong);
  border-radius: 12px;
  background: transparent;
  color: var(--lz-ink);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.profile-logout:active {
  transform: scale(0.98);
}
</style>
