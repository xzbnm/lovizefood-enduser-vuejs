<template>
  <div class="laviz-storefront-shell">
  <!-- Ambient background: a soft glow, two slow drifting lights and a few
       rising sparks. Only transform and opacity animate, so it stays on the
       GPU and costs next to nothing; see .laviz-ambient in main.scss. -->
  <div class="laviz-ambient" aria-hidden="true">
    <span class="laviz-ambient__glow"></span>
    <span class="laviz-ambient__blob laviz-ambient__blob--a"></span>
    <span class="laviz-ambient__blob laviz-ambient__blob--b"></span>
    <span v-for="(style, i) in emberStyles" :key="'ember-' + i" class="laviz-ambient__ember" :style="style"></span>
  </div>
  <b-overlay
    class="laviz-storefront-overlay"
    :show="loading && products.length > 0"
    :z-index="999">

    <div class="main-fixed-header laviz-app-header"
         :class="{ 'laviz-app-header--collapsed': headerCollapsed, 'laviz-app-header--hidden': headerHidden }"
         :style="{ top: headerHidden ? (-headerHideOffset) + 'px' : '0px' }">
      <div class="container">
        <div class="row">

          <div class="col-md-12">
            <!-- One row: brand on the start side, the two actions on the end side.
                 Same in the expanded and collapsed header, so nothing jumps on scroll. -->
            <div class="laviz-topbar">
              <div class="laviz-topbar__brand">
                <img src="@/assets/media/logo-laviz.png" class="laviz-topbar__logo laviz-topbar__logo--light" alt="لاویز"/>
                <img src="@/assets/media/logo-laviz-dark.png" class="laviz-topbar__logo laviz-topbar__logo--dark" alt="" aria-hidden="true"/>
                <!-- The logo already says the name; the heading stays for screen readers and search engines. -->
                <h1 class="laviz-topbar__title sr-only">{{ shopInfo.name }}</h1>
              </div>
              <div class="laviz-topbar__actions">
                <button
                  type="button"
                  class="laviz-icon-btn"
                  :aria-label="theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
                  :title="theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'"
                  @click="toggleTheme"
                >
                  <svg v-if="theme === 'dark'" :key="'sun'" class="laviz-icon-btn__theme" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                    <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
                  </svg>
                  <svg v-else :key="'moon'" class="laviz-icon-btn__theme" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="laviz-icon-btn"
                  aria-label="مسیریابی به رستوران"
                  title="مسیریابی به رستوران"
                  @click="openNavigation"
                >
                  <svg class="laviz-icon-btn__arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                    <path d="M12 2.5 4.5 20.2c-.2.5.4 1 .9.7L12 17l6.6 3.9c.5.3 1.1-.2.9-.7L12 2.5z"
                          fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  </svg>
                </button>
                <!-- Signed in: one solid saffron icon button opens the profile (sign-out lives there). -->
                <button
                  v-if="auth.is_login"
                  type="button"
                  class="laviz-icon-btn laviz-icon-btn--saffron"
                  aria-label="پروفایل"
                  title="پروفایل"
                  @click="$router.push('/profile')"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
                  </svg>
                </button>
                <button v-else type="button" class="laviz-user-bar__login" @click="openProfileLogin">ورود</button>
              </div>
            </div>
            <div v-if="mode === 0 && !headerCollapsed" class="laviz-topbar__ramadan">
              <span class="laviz-mode-ribbon">🌙 ماه مبارک رمضان</span>
              <p class="laviz-app-header__subtitle">سفارش آنلاین شله و حلیم ویژه ماه مبارک رمضان</p>
            </div>
            <div v-if="currentOrder" class="laviz-status-card laviz-status-card--expandable">
              <div class="d-flex justify-content-between align-items-center flex-wrap">
                <span>سفارش فعال: <strong>{{ currentOrderStatusLabel }}</strong></span>
                <div>
                  <button type="button" class="btn btn-link btn-sm p-0 ml-2" @click="showCurrentOrderDetails = !showCurrentOrderDetails">
                    {{ showCurrentOrderDetails ? 'بستن جزئیات' : 'مشاهده جزئیات' }}
                  </button>
                  <a :href="'tel:' + supportPhone" class="ml-2">تماس پشتیبانی</a>
                </div>
              </div>
              <div v-if="showCurrentOrderDetails" class="laviz-status-card__details mt-2 pt-2 border-top small">
                <div>شماره: {{ currentOrder.orderNumber || currentOrder.id.slice(0, 8) }}</div>
                <div>تحویل: {{ formatJalaliDate(currentOrder.deliveryDate) }} {{ currentOrder.deliveryTime || '' }}</div>
                <div v-if="currentOrder.deliveryAddress">آدرس: {{ currentOrder.deliveryAddress }}</div>
                <div v-if="currentOrder.comment">توضیحات: {{ currentOrder.comment }}</div>
                <div v-for="(item, idx) in currentOrderItems" :key="idx" class="d-flex justify-content-between">
                  <span>{{ item.title }} × {{ item.count }}</span>
                  <span>{{ formatNum(item.lineTotal) }} تومان</span>
                </div>
                <div class="mt-1">
                  <span v-if="currentOrder.shippingCost">ارسال: {{ formatNum(currentOrder.shippingCost) }} تومان</span>
                  <span v-if="currentOrder.taxAmount" class="mr-2">مالیات: {{ formatNum(currentOrder.taxAmount) }} تومان</span>
                </div>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm laviz-receipt-btn mt-2"
                  :disabled="downloadingReceiptId === currentOrder.id"
                  @click="downloadReceipt(currentOrder)"
                >
                  {{ downloadingReceiptId === currentOrder.id ? '...' : 'چاپ / ذخیره PDF رسید' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Only worth a row when it has something to say (an ETA); the shipping
               cost is shown in the basket, not on the first page. -->
          <div v-if="!headerCollapsed && Number(etaMinutes) > 0" class="col-12">
            <delivery-type-bar
              v-model="delivery_type"
              :options="deliveryTypeOptions"
              :showSwitch="false"
              :shippingCost="shippingCost"
              :etaMinutes="etaMinutes"
              :deliveryEtaLabel="labels.deliveryEta"
              :pickupEtaLabel="labels.pickupEta"
              :shippingChipLabel="labels.shippingChip"
            />
          </div>

          <div class="col-12 laviz-tabs laviz-tabs--bleed">
            <!-- ROLLBACK[b-tabs-strip]: the previous b-tabs strip switched the
                 content area one category at a time. The menu is now a single
                 continuous scroll, so the strip only reflects/drives scroll
                 position. Restore by reverting this block and the
                 `menu-section` loop below. -->
            <menu-category-nav
              v-if="showCategoryTabs"
              :categories="menuNavCategories"
              :activeId="currentActiveTabId"
              @select="scrollToCategory"
              @open-sheet="menuSheetVisible = true"
              @open-search="openSearch"
            />

            <div v-if="searchOpen" class="laviz-menu-search">
              <input
                ref="menuSearch"
                v-model="menuSearch"
                type="search"
                class="laviz-menu-search__input"
                placeholder="جستجوی غذا…"
                @keyup.esc="closeSearch"
              />
              <button type="button" class="laviz-menu-search__close" aria-label="بستن جستجو" @click="closeSearch">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container">

      <!-- Reserves exactly the header's current height: it collapses on
           scroll, so a fixed value left a gap under the tab strip. -->
      <div class="header-spacer" :style="{ height: headerHeight + 'px' }"></div>

      <!-- ROLLBACK[weekly-plan-table]: replaced by the "غذای روز سرآشپز" tab
           (chefDailyTab.vue). To go back to the old weekly table, delete the
           `false &&` below and remove the chef-daily tab from the tab strip. -->
      <section v-if="false && weeklyPlan.length" class="laviz-section laviz-weekly-plan mb-3">
        <div class="laviz-weekly-plan__header">
          <h2 class="laviz-weekly-plan__title">برنامه غذایی هفته</h2>
          <p class="laviz-weekly-plan__hint">منوی هر روز — غذاهای ثابت به‌اضافهٔ ویژهٔ همان روز</p>
        </div>
        <div class="laviz-weekly-plan__table">
          <div class="laviz-weekly-plan__table-head">
            <span>روز</span>
            <span>منوی سرویس</span>
          </div>
          <div
            v-for="(day, dayIndex) in weeklyPlan"
            :key="day.name"
            class="laviz-weekly-plan__table-row"
            :class="{ 'laviz-weekly-plan__table-row--today': dayIndex === todayWeekIndex }"
          >
            <div class="laviz-weekly-plan__table-day">
              <span>{{ day.name }}</span>
              <span v-if="dayIndex === todayWeekIndex" class="laviz-weekly-plan__today-badge">امروز</span>
            </div>
            <div class="laviz-weekly-plan__table-menu">
              <template v-if="day.products.length">
                <span
                  v-for="productName in day.products"
                  :key="`${day.name}-${productName}`"
                  class="laviz-weekly-plan__product"
                >{{ productName }}</span>
              </template>
              <span v-else class="laviz-weekly-plan__empty">بدون سرویس</span>
            </div>
          </div>
        </div>
      </section>

      <div class="row">

        <div class="col-12">
          <div v-if="!loading && products.length === 0" class="alert alert-warning text-center my-3">
            در حال حاضر محصولی برای این حالت ({{ mode === 0 ? 'رمضان' : 'عادی' }}) تعریف نشده است.
            لطفاً از پنل مدیریت، منوی {{ mode === 0 ? 'رمضان' : 'عادی' }} را تکمیل کنید.
          </div>
          <discount-section
            :personalCodes="myActiveCodes"
            :publicOffers="publicOffers"
          />

          <div class="product-content-wrapper">

            <!-- First load: shimmering placeholders hold the menu's shape until the data lands. -->
            <div v-if="loading && !products.length" class="skeleton-menu" role="status" aria-label="در حال بارگذاری منو">
              <div class="skeleton-title"></div>
              <div v-for="n in 5" :key="n" class="skeleton-item">
                <div class="skeleton-item__img"></div>
                <div class="skeleton-item__lines">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
            <section
              v-if="hasChefDaily"
              :id="'menu-cat-' + CHEF_TAB_ID"
              class="menu-section menu-section--chef-daily"
            >
              <chef-daily-tab
                :products="chefDailyProducts"
                :product-data="productData"
                @increase="addChefDailyProduct"
                @decrease="subChefDailyProduct"
                @imageClick="showImageModal"
              />
            </section>

            <!-- Every category is rendered as its own section in one long
                 scroll (Snappfood layout); the strip above follows the scroll
                 position rather than swapping the content. -->
            <template v-for="productCategoryItem in visibleCategories">
              <section
                :id="'menu-cat-' + productCategoryItem.id"
                :ref="'section-' + productCategoryItem.id"
                :key="'content-' + productCategoryItem.id"
                class="menu-section"
              >
                <h2 v-reveal class="menu-section__title section-heading">{{ productCategoryItem.text }}</h2>
                <div
                  v-for="product of categoryProducts(productCategoryItem.id)"
                  v-reveal
                  class="order-item"
                  :key="product.name"
                >
                  <template v-if="productData[product.key]">
                    <product-item
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
                      :specialDaysText="productData[product.key].specialDaysText"
                      :ratingAverage="productData[product.key].ratingAverage"
                      :ratingCount="productData[product.key].ratingCount"
                      :showRating="showProductRating"
                      @decrease="subProductCount(product.key,productData[product.key].add_unit)"
                      @increase="onProductAdd(product.key)"
                      @imageClick="showImageModal"
                    />
                  </template>
                </div>
              </section>
            </template>
          </div>
        </div>


        <!-- Step 2: a full-screen sheet opened from the basket button. It holds
             the same delivery / address / invoice sections as before, so the
             information collected from the customer is unchanged. -->
        <div class="laviz-cart-modal" v-if="cartOpen">
        <div class="laviz-cart-modal__bar">
          <button type="button" class="laviz-cart-modal__close" aria-label="بستن" @click="closeCart">✕</button>
          <h2 class="laviz-cart-modal__title">سبد خرید</h2>
          <span class="laviz-cart-modal__count">{{ selectedProducts.length }} قلم</span>
        </div>

        <div class="laviz-cart-modal__scroll">
        <section class="laviz-section laviz-cart-items">
          <div class="laviz-cart-items__head">
            <h3 class="laviz-section__title">خرید شما</h3>
            <!-- Back to the menu to pick more; the basket keeps its items. -->
            <button type="button" class="laviz-cart-items__add" @click="closeCart">اضافه کردن</button>
          </div>
          <!-- Rows slide into and out of place instead of jumping, and every
               column has a fixed width so a changing number never moves its
               neighbours. -->
          <transition-group name="cart-line" tag="div" class="laviz-cart-lines">
            <div v-for="item in selectedProducts" :key="item.key" class="laviz-cart-line">
              <div class="laviz-cart-line__info">
                <span class="laviz-cart-line__name">{{ item.name }}</span>
                <small class="laviz-cart-line__unit">{{ item.count }} {{ item.unit_name }}</small>
                <span class="laviz-cart-line__price"><span :key="item.total" class="laviz-cart-line__price-num">{{ formatNum(item.total) }}</span> تومان</span>
              </div>
              <div class="laviz-cart-line__stepper">
                <button type="button" @click="onCartStep(item.key, -1)" aria-label="کم کردن">−</button>
                <transition :name="'count-' + countDir" mode="out-in">
                  <span :key="item.count" class="laviz-cart-line__count">{{ item.count }}</span>
                </transition>
                <button type="button" @click="onCartStep(item.key, 1)" aria-label="افزودن">+</button>
              </div>
            </div>
          </transition-group>
          <p v-if="!selectedProducts.length" class="laviz-cart-items__empty">سبد خرید خالی است.</p>
        </section>

        <div class="laviz-checkout-details">
        <div class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۱</span>
              زمان و نحوه تحویل
            </h2>
            <div class="d-flex flex-column position-relative">
              <p v-if="mode === 0 && deliveryItems.length" class="text-muted small mb-2">
                {{ 'سفارش امروز فقط تا قبل از ساعت ' + '15:30' }}
              </p>
              <!-- Three day buttons. The chosen one also names the weekday
                   ("امروز سه‌شنبه"); the others stay short ("فردا"). -->
              <div v-if="deliveryItems && deliveryItems.length" class="laviz-day-switch" role="radiogroup" aria-label="روز تحویل">
                <button
                  v-for="(deliveryItem, deliveryIndex) in deliveryItems"
                  :key="deliveryIndex"
                  type="button"
                  role="radio"
                  class="laviz-day"
                  :class="{
                    'laviz-day--active': delivery_date === deliveryIndex,
                    'laviz-day--disabled': !deliveryItem.status
                  }"
                  :aria-checked="delivery_date === deliveryIndex"
                  :disabled="!deliveryItem.status"
                  @click="dateSelection(deliveryIndex)"
                >
                  <span class="laviz-day__label">{{
                    delivery_date === deliveryIndex
                      ? getDeliveryItemText(deliveryIndex) + ' ' + jalaliDate(deliveryItem.date, 'dddd')
                      : getDeliveryItemText(deliveryIndex)
                  }}</span>
                  <small v-if="!deliveryItem.status" class="laviz-day__note">
                    {{ deliveryIndex === 0 ? 'پایان سفارش' : 'تعطیل' }}
                  </small>
                  <small v-else-if="deliveryItem.discount_special_day" class="laviz-day__note laviz-day__note--discount">
                    تخفیف ویژه {{ Number(deliveryItem.discount_special_day) + Number(deliveryItem.discount_percent) }}٪
                  </small>
                  <small v-else-if="deliveryItem.discount_percent" class="laviz-day__note laviz-day__note--discount">
                    {{ deliveryItem.discount_percent }}٪ تخفیف
                  </small>
                </button>
              </div>

              <div v-if="delivery_date !== -1 && deliveryTimes.length" class="mt-3">
                <label class="laviz-field-label">ساعت تحویل</label>
                <div class="laviz-day-switch laviz-day-switch--two" role="radiogroup" aria-label="ساعت تحویل">
                  <button
                    type="button"
                    role="radio"
                    class="laviz-day"
                    :class="{ 'laviz-day--active': timeMode === 'asap' }"
                    :aria-checked="timeMode === 'asap'"
                    @click="chooseAsapTime"
                  >
                    <span class="laviz-day__label">تحویل فوری</span>
                    <small class="laviz-day__note">۳۰ تا ۴۵ دقیقه از زمان ثبت سفارش</small>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    class="laviz-day"
                    :class="{ 'laviz-day--active': timeMode === 'scheduled' }"
                    :aria-checked="timeMode === 'scheduled'"
                    @click="timeSheetOpen = true"
                  >
                    <span class="laviz-day__label">{{
                      timeMode === 'scheduled' && delivery_time
                        ? 'تحویل ساعت ' + faTime(delivery_time)
                        : 'تحویل در ساعت انتخابی'
                    }}</span>
                    <small v-if="timeMode === 'scheduled'" class="laviz-day__note">تغییر ساعت</small>
                  </button>
                </div>
                <!-- Plain note from the restaurant, last thing in the time section. -->
                <p v-if="delivery_description && delivery_type == 'sendToMe'" class="laviz-choice-note">
                  {{ delivery_description }}
                </p>
              </div>

              <div class="mt-3">
                <label class="laviz-field-label">نحوه دریافت سفارش</label>
                <div class="laviz-choice-list" role="radiogroup" aria-label="نحوه دریافت سفارش">
                  <label
                    v-for="opt in deliveryTypeOptions"
                    :key="opt.value"
                    class="laviz-choice"
                    :class="{ 'laviz-choice--active': delivery_type === opt.value }"
                  >
                    <input
                      type="radio"
                      class="laviz-choice__input"
                      name="delivery_type"
                      v-model="delivery_type"
                      :value="opt.value"
                    />
                    <span class="laviz-choice__text">{{ opt.text }}</span>
                  </label>
                </div>
                <!-- Delivery fee note sits right under the send option it belongs to. -->
                <p v-if="delivery_type == 'sendToMe'" class="laviz-choice-note">
                  هزینه ارسال {{ formatNum(shippingCost) }} تومان به فاکتور اضافه می‌شود. ارسال فقط در محدوده شهر.
                </p>
              </div>


              <div class="mt-3" v-if="isPickupLike">
                <label class="form-label font-weight-bold">{{ delivery_type === 'snapp' ? 'موقعیت رستوران (برای سفارش اسنپ)' : 'موقعیت رستوران (تحویل حضوری)' }}</label>
                <p v-if="delivery_type === 'snapp'" class="laviz-choice-note">
                  اسنپ را خودتان سفارش می‌دهید. هزینه‌ی ارسال به فاکتور اضافه نمی‌شود.
                </p>
                <p class="text-muted small mb-2">{{ in_person_description || mapCenter.address }}</p>
                <client-only>
                  <map-picker
                    ref="restaurantMap"
                    readonly
                    :center-lat="mapCenter.lat"
                    :center-lng="mapCenter.lng"
                    :restaurant-name="mapCenter.name || 'رستوران لاویز'"
                    :restaurant-address="mapCenter.address || in_person_description"
                    @navigate="openNavigation"
                  />
                </client-only>
              </div>


              <div
                class="mt-3 position-relative"
                v-if="delivery_type == 'sendToMe'"
              >
                <label class="form-label font-weight-bold">آدرس تحویل</label>
                <div v-if="savedAddresses.length" class="form-group laviz-saved-addresses">
                  <label class="small d-block mb-2">آدرس‌های ذخیره‌شده</label>
                  <div class="laviz-saved-address-list">
                    <button
                      v-for="a in savedAddresses"
                      :key="a.id"
                      type="button"
                      class="laviz-saved-address"
                      :class="{ 'laviz-saved-address--active': selectedAddressId === a.id }"
                      @click="pickSavedAddress(a)"
                    >
                      <span class="laviz-saved-address__title">{{ a.title || 'آدرس ذخیره‌شده' }}</span>
                      <span class="laviz-saved-address__text">{{ a.address }}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model="delivery_address"
                  aria-label="آدرس تحویل"
                  placeholder="شهر، خیابان، کوچه ..."
                ></textarea>

                <!-- Title and field share one row. -->
                <div class="laviz-inline-field mt-3">
                  <label class="laviz-inline-field__label" for="delivery-plaque">
                    پلاک <span class="laviz-inline-field__hint">(اختیاری)</span>
                  </label>
                  <input
                    id="delivery-plaque"
                    type="text"
                    class="form-control"
                    v-model.trim="plaque"
                    maxlength="20"
                    autocomplete="off"
                    placeholder="مثلا ۱۲"
                  />
                </div>

                <map-preview
                  v-if="delivery_lat != null && delivery_lng != null"
                  class="mt-3"
                  :lat="Number(delivery_lat)"
                  :lng="Number(delivery_lng)"
                  @edit="mapModalOpen = true"
                />
                <template v-else>
                  <p class="laviz-map-hint">برای تسریع در زمان دریافت موقعیت، آدرس خود را روی نقشه نیز وارد نمایید.</p>
                  <button type="button" class="laviz-map-trigger" @click="mapModalOpen = true">
                    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                      <circle cx="12" cy="10" r="2.3" fill="currentColor"/>
                    </svg>
                    <span>تعیین آدرس روی نقشه</span>
                  </button>
                </template>
              </div>
            </div>
          </section>
        </div>
        
        <div class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۲</span>
              کد تخفیف
            </h2>
            <!-- Codes already issued to this customer. Selecting one fills the
                 field; only one code can ever be on an invoice, so picking a
                 second simply replaces the first. -->
            <div v-if="myActiveCodes.length" class="laviz-my-codes">
              <p class="laviz-my-codes__hint">کدهای تخفیف فعال شما:</p>
              <div class="laviz-my-codes__list">
                <button
                  v-for="c in myActiveCodes"
                  :key="c.id"
                  type="button"
                  class="laviz-my-code"
                  :class="{ 'laviz-my-code--active': discountCode.code === c.code }"
                  :disabled="discountCode.code_valid_status"
                  @click="pickMyCode(c)"
                >
                  <span class="laviz-my-code__code">{{ c.code }}</span>
                  <span class="laviz-my-code__amount">{{ formatNum(c.amount) }} تومان</span>
                  <small class="laviz-my-code__exp">{{ remainingLabel(c) }}</small>
                </button>
              </div>
            </div>

            <p v-else class="laviz-discount-hint mb-2">
              اگر کد تخفیف دارید اینجا وارد کنید.
            </p>
            <div class="laviz-discount-row">
              <input
                type="text"
                class="form-control"
                v-model="discountCode.code"
                placeholder="کد تخفیف"
                :disabled="discountCode.code_valid_status"
                v-validate="{ required: true }"
                name="code"
                data-vv-as="کد تخفیف"
                autocomplete="off"
                data-vv-scope="discountCode"
                :class="{ 'is-invalid': errors.has('discountCode.code') }"
              />
              <button
                type="button"
                class="btn btn-outline-secondary"
                v-if="discountCode.code_valid_status"
                @click="cancelDiscountCode()"
              >
                لغو
              </button>
              <button
                type="button"
                class="btn btn-primary laviz-btn-apply"
                v-else
                @click="approveDiscountCode()">
                اعمال
              </button>
            </div>
            <div
              class="text-success mt-2 small"
              v-if="discountCode.code_valid_status"
            >
              {{ formatNum(Math.round(bill.discount_amount)) }} تومان تخفیف اعمال شد
            </div>
          </section>
        </div>
        <!-- ✅ نمایش محصولات انتخاب شده -->
  <!-- <div class="col-md-12 mt-2" v-if="selectedProducts.length > 0">
    <div class="content-box p-3 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>خرید شما:</strong>
        <b-badge variant="primary">{{ selectedProducts.length }} مورد</b-badge>
      </div>
      
      <div 
        v-for="item in selectedProducts" 
        :key="item.name"
        class="d-flex justify-content-between align-items-center py-1 border-bottom"
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
      
      <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
        <small class="text-muted">جمع جزئی:</small>
        <strong>{{ formatNum(selectedItemsTotal) }} تومان</strong>
      </div>
    </div>
  </div>  -->
        <!-- HIDDEN[invoice-summary]: switched off on request. Delete the
             `false &&` below to bring the card back. -->
        <div v-if="false" class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۳</span>
              خلاصه فاکتور
            </h2>
            <div class="laviz-checkout-summary">
              <div v-if="!selectedProducts.length" class="laviz-checkout-summary__empty text-muted text-center py-3">
                هنوز غذایی انتخاب نشده است.
              </div>

              <template v-else>
                <div class="laviz-checkout-summary__items">
                  <div
                    v-for="item in selectedProducts"
                    :key="item.key"
                    class="laviz-checkout-summary__item"
                  >
                    <div class="laviz-checkout-summary__item-name">
                      {{ item.name }}
                      <small class="text-muted d-block">
                        {{ item.count }} {{ item.unit_name }} × {{ formatNum(item.price) }} تومان
                      </small>
                    </div>
                    <div class="laviz-checkout-summary__item-price">
                      {{ formatNum(item.total) }} تومان
                    </div>
                  </div>
                </div>

                <div class="laviz-checkout-summary__row">
                  <span>جمع اقلام</span>
                  <span>{{ formatNum(bill.total_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="delivery_type === 'sendToMe' && bill.shipping_amount > 0"
                >
                  <span>هزینه ارسال (پیک)</span>
                  <span>+ {{ formatNum(bill.shipping_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="delivery_type === 'sendToMe' && bill.shipping_amount === 0"
                >
                  <span>هزینه ارسال (پیک)</span>
                  <span class="text-muted">رایگان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="bill.tax_amount > 0"
                >
                  <span>مالیات{{ taxPercent ? ` (${taxPercent}٪)` : '' }}</span>
                  <span>+ {{ formatNum(bill.tax_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="bill.discount_amount > 0"
                >
                  <span>تخفیف{{ discountCode.code ? ` (${discountCode.code})` : '' }}</span>
                  <span class="text-danger">− {{ formatNum(bill.discount_amount) }} تومان</span>
                </div>

                <div class="laviz-checkout-summary__row laviz-checkout-summary__total">
                  <span>مبلغ قابل پرداخت</span>
                  <span>{{ formatNum(bill.payment_amount) }} تومان</span>
                </div>
              </template>
            </div>
          </section>
        </div>
        </div><!-- /laviz-checkout-details -->

        </div><!-- /laviz-cart-modal__scroll -->

        <!-- Payment is only offered once we know who the customer is; guests
             are sent to the phone/OTP modal first and land back here. -->
        <div class="laviz-cart-modal__cta">
          <div class="laviz-cart-modal__total">
            <small>مبلغ قابل پرداخت</small>
            <strong :key="bill.payment_amount" class="laviz-total-tick">{{ formatNum(bill.payment_amount) }} تومان</strong>
            <!-- Says why the button is off, in the spot the eye is already on. -->
            <small v-if="auth.is_login && addressMissing" class="laviz-cart-modal__hint" role="status">آدرس تحویل را وارد کنید</small>
          </div>
          <button
            v-if="auth.is_login"
            type="button"
            class="laviz-btn-pay"
            :disabled="addressMissing"
            @click="order()"
          >پرداخت و ثبت سفارش</button>
          <button
            v-else
            type="button"
            class="laviz-btn-pay"
            @click="startLoginFromCart"
          >ورود یا ثبت‌نام</button>
        </div>
        </div><!-- /laviz-cart-modal -->

      </div>

      <!-- ROLLBACK[sticky-pay-cta]: the old always-on pay bar. The new flow
           uses stickyContinueBar.vue (menu step) and shows this pay bar only
           once the customer is in the details step. To restore the previous
           behaviour, drop the v-if below and remove <sticky-continue-bar>. -->
      <div class="laviz-sticky-cta" v-if="false">
        <div class="laviz-sticky-cta__inner">
          <div class="laviz-sticky-cta__price">
            <small>مبلغ قابل پرداخت</small>
            <strong>{{ formatNum(bill.payment_amount) }} تومان</strong>
          </div>
          <button type="button" class="laviz-btn-pay" @click="order()">
            پرداخت و ثبت سفارش
          </button>
        </div>
      </div>

      <menu-sheet
        :visible.sync="menuSheetVisible"
        :categories="sheetCategories"
        @select="scrollToCategory"
      />

      <sticky-continue-bar
        v-if="!cartOpen"
        :itemCount="selectedProducts.length"
        :total="selectedItemsTotal"
        :isLoggedIn="auth.is_login"
        @continue="openCart"
      />

      <!-- Every line comes from the settings panel; the address and phone
           numbers used to be three hardcoded copies across two pages. -->
      <footer class="laviz-footer container">
        <p>{{ shopInfo.address }}</p>
        <p v-if="shopInfo.managerName" class="small">مدیریت: {{ shopInfo.managerName }}</p>
        <p v-if="shopInfo.phone">تلفن: <a :href="'tel:' + shopInfo.phone">{{ shopInfo.phone }}</a></p>
        <p>پشتیبانی: <a :href="'tel:' + supportPhone">{{ supportPhone }}</a></p>
        <a
          v-if="enamad.id && enamad.code"
          class="laviz-footer__seal d-inline-block mt-2"
          referrerpolicy="origin"
          target="_blank"
          :href="'https://trustseal.enamad.ir/?id=' + enamad.id + '&Code=' + enamad.code"
        >
          <img
            referrerpolicy="origin"
            :src="'https://Trustseal.eNamad.ir/logo.aspx?id=' + enamad.id + '&Code=' + enamad.code"
            alt="نماد اعتماد الکترونیک"
            style="cursor: pointer;"
            :id="enamad.code"
          />
        </a>
      </footer>
      <delivery-time-sheet
        :visible.sync="timeSheetOpen"
        :times="(deliveryItems[delivery_date] && deliveryItems[delivery_date].deliveryTimes) || []"
        :value="timeMode === 'scheduled' ? delivery_time : null"
        :day-label="timeSheetDayLabel"
        @select="onTimePicked"
      />
      <map-picker-modal
        :open="mapModalOpen"
        :lat="delivery_lat"
        :lng="delivery_lng"
        :center-lat="Number(mapCenter.lat)"
        :center-lng="Number(mapCenter.lng)"
        :restaurant-name="shopInfo.name"
        :restaurant-address="shopInfo.address"
        @confirm="onMapConfirm"
        @close="mapModalOpen = false"
      />
      <success-login-modal
        @order="order"
        :auth="auth"/>
      <register-modal
        @onRegister="registerSuccess"
        @onLogin="loginSuccess"
        @closed="onLoginModalClosed"
        @order="order"
        :auth="auth"/>
      <bill-modal
        :display_product="display_product"
        :product-data="productData"
        :products="products"
        :bill-data="billData"
        :delivery_date="deliveryItems[delivery_date]? deliveryItems[delivery_date].date: null"
        :day-label="delivery_date === -1 ? '' : getDeliveryItemText(delivery_date)"
        :delivery_time="delivery_time"
        :check_one="check_one"
        :delivery_address="fullDeliveryAddress"
        :shipping-cost="shippingCost"
        :discount-code="discountCode"
        :delivery_type="delivery_type"
        :delivery-lat="delivery_lat"
        :delivery-lng="delivery_lng"
        :address-id="selectedAddressId"
        :order-comment="orderComment"
        :auth="auth"/>
      <profile-modal
        ref="profileModal"
        :support-phone="supportPhone"
        :map-center="mapCenter"
        @addresses-changed="refreshSavedAddresses"
      />
      <image-details-modal :visible.sync="imageOpen" :src="modal.image" :name="modal.name" :description="modal.description"/>
      <pwa-call-out :text="pwaCallOutText"/>
    </div>

  </b-overlay>
  </div>
</template>

<script>
import moment from "moment-jalaali";
// import moment from 'moment/min/moment-with-locales'
// moment.locale('fa')
import 'moment/locale/fa'  // برای فارسی
moment.locale('fa')
import PwaCallOut from "../components/pwa-call-out.vue";
import SuccessLoginModal from "./index/components/successLoginModal.vue";
import MapPickerModal from "~/components/MapPickerModal.vue";
import MapPreview from "~/components/MapPreview.vue";
import reveal from "../utils/reveal";
import { trackTaps, flyToCart, reducedMotion } from "../utils/motion";
import DeliveryTimeSheet from "./index/components/deliveryTimeSheet.vue";
import RegisterModal from "./index/components/registerModal.vue";
import BillModal from "./index/components/billModal.vue";
import Vue from "vue";
import ProductItem from "~/pages/index/components/productItem.vue";
import ImageDetailsModal from "@/pages/index/components/image-details-modal.vue";
import ProfileModal from "./index/components/profileModal.vue";
import MapPicker from "~/components/MapPicker.vue";
import MenuCategoryNav from "./index/components/menuCategoryNav.vue";
import DeliveryTypeBar from "./index/components/deliveryTypeBar.vue";
import MenuSheet from "./index/components/menuSheet.vue";
import DiscountSection from "./index/components/discountSection.vue";
import ChefDailyTab from "./index/components/chefDailyTab.vue";
import StickyContinueBar from "./index/components/stickyContinueBar.vue";
import { applyAppModeTheme } from "~/utils/appModeTheme";
import { DEFAULT_MAP_CENTER } from "~/utils/mapir";
import { openOrderReceiptForPrint } from "~/utils/orderReceipt";
import { formatJalaliDate } from "~/utils/persianDate";
import { isOrderScheduledForTodayOrLater } from "~/utils/orderScheduleDate";
import restoreCustomerSession from "~/utils/customerSession.cjs";
import { visibleDeliveryOptions, deliveryDayLabel } from "~/utils/deliveryOptions";

// Sentinel id for the synthetic "غذای روز سرآشپز" tab. It is not a real
// product_category row, so it must never collide with a uuid.
const CHEF_TAB_ID = '__chef_daily__';

moment.loadPersian(true, {dialect: "persian-modern"});

export default {
  name: "index",
  directives: {reveal},
  components: {DeliveryTimeSheet, MapPickerModal, MapPreview, ImageDetailsModal, ProductItem, ChefDailyTab, BillModal, RegisterModal, SuccessLoginModal, PwaCallOut, ProfileModal, MapPicker, MenuCategoryNav, DeliveryTypeBar, MenuSheet, DiscountSection, StickyContinueBar},
  data() {
    return {
      modal: {
        image: null,
        name: '',
        description: '',
      },
      loading: false,
      shippingCost: 0,
      tax_amount: 0,
      taxEnabled: false,
      taxPercent: 0,
      delivery_lat: null,
      plaque: '',
      timeMode: 'asap', // 'asap' = earliest slot, 'scheduled' = picked in the sheet
      timeSheetOpen: false,
      mapModalOpen: false,
      imageOpen: false,
      countDir: 'up', // direction of the last quantity change, for the number roll
      theme: 'light', // 'light' | 'dark'; mirrors <html data-theme>, set before paint by app.html
      delivery_lng: null,
      selectedAddressId: null,
      orderComment: '',
      currentOrder: null,
      currentOrderItems: [],
      downloadingReceiptId: null,
      showCurrentOrderDetails: false,
      supportPhone: '09155611540',
      // Overwritten from /core/initialize; these are only what shows before
      // the first response lands.
      enamad: { id: '8159726', code: 'BPjiYd4x54ASb7bcPXYqLLO7EyG86QNC' },
      pwaCallOutText: 'اپ لاویز را به صفحه اصلی گوشی خود اضافه نمایید.',
      shopInfo: {
        name: 'رستوران لاویز',
        address: 'بلوار بسیج، بعد از سالن آزادی، میدان شهدا، خیابان بصیرت',
        phone: '05632499000',
        managerName: 'تراب‌زاده مقدم',
        supportPhone: '09155611540',
      },
      mapCenter: {
        lat: DEFAULT_MAP_CENTER.lat,
        lng: DEFAULT_MAP_CENTER.lng,
        address: DEFAULT_MAP_CENTER.address,
        name: 'رستوران لاویز',
      },
      savedAddresses: [],
      mode: null,
      auth: {
        is_login: false,
        token: null,
        user: {},
        discountCodeRequest: false,
      },
      display_product: false,
      products: [],
      productCategories: [],
      productData: {},
      deliveryItems: [],
      deliveryTimes: [],
      deliveryTypeOptions: [
        { text: "حضوری میام", value: "iWillCome" },
        { text: "برام ارسال کنید", value: "sendToMe" },
      ],
      discountCode: {
        code: null,
        code_valid_status: false,
        discount_percent: 0,
      },
      bill: {
        discount_amount: 0,
        total_amount: 0,
        shipping_amount: 0,
        tax_amount: 0,
        decreased_amount: 0,
        payment_amount: 0,
      },
      // Pickup is the default order method unless settings hide it.
      delivery_type: 'iWillCome',
      delivery_date: -1,
      delivery_time: null,
      check_one: false,
      delivery_address: null,
      delivery_description: null,
      in_person_description: null,
      loading_payment: false,
      billData: {
        total_amount: null,
        discount_amount: null,
        payment_amount: null,
        is_first_order: null,
      },
      menuTypeOrder: null,
      sumInCurrentMenu: 0,
      tabIndex: 0,
      currentActiveTabId: null,
      CHEF_TAB_ID,
      // The basket sheet covers the screen; the menu stays mounted behind it.
      cartOpen: false,
      // Set when a guest pressed "ادامه" and still has to authenticate.
      pendingContinue: false,
      profileLoginPending: false,
      // Scrollspy bookkeeping (not reactive UI state, but kept here so the
      // component instance owns them and they are torn down with it).
      menuSheetVisible: false,
      headerCollapsed: false,
      // Scroll down hides everything above the category tabs; the first scroll
      // up brings it back. The tabs stay pinned either way.
      headerHidden: false,
      headerHideOffset: 0,
      lastScrollY: 0,
      headerHeight: 264,
      searchOpen: false,
      menuSearch: '',
      etaMinutes: 0,
      showProductRating: false,
      labels: {
        deliveryEta: 'تحویل فوری تا {value} دقیقه',
        pickupEta: 'آماده‌سازی تا {value} دقیقه',
        shippingChip: 'ارسال: {value}',
      },
      myActiveCodes: [],
      publicOffers: [],
      suppressScrollSpy: false,
      scrollSpyTimer: null,
      scrollSpyFrame: null,
    };
  },
  created() {
    Vue.prototype.formatNum = (n) => {
      var n = ("" + n).split(".");
      var num = n[0];
      var dec = n[1];
      var r, s, t;

      if (num.length > 3) {
        s = num.length % 3;

        if (s) {
          t = num.substring(0, s);
          num = t + num.substring(s).replace(/(\d{3})/g, ",$1");
        } else {
          num = num
            .substring(s)
            .replace(/(\d{3})/g, ",$1")
            .substring(1);
        }
      }

      if (dec && dec.length > 3) {
        dec = dec.replace(/(\d{3})/g, "$1 ");
      }

      return num + (dec ? "." + dec : "");
    };
  },
  mounted() {


    this.initialize();
    const session = restoreCustomerSession(localStorage, this.$axios);
    if (session) {
      this.auth.token = session.token;
      this.auth.user = session.user;
      this.auth.is_login = true;
      this.loadCurrentOrder();
    }

    trackTaps();
    this.theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    this.syncThemeColor();
    this.$nextTick(this.syncHeaderHeight);
    // The header changes height as data arrives (chips, banners) and when the
    // viewport changes; keep the spacer under it in step so no content hides.
    const headerEl = document.querySelector('.main-fixed-header');
    if (headerEl && window.ResizeObserver) {
      this.headerObserver = new ResizeObserver(() => this.syncHeaderHeight());
      this.headerObserver.observe(headerEl);
    }
    window.addEventListener('scroll', this.onMenuScroll, { passive: true });
    window.addEventListener('resize', this.onMenuScroll, { passive: true });
  },

  beforeDestroy() {
    if (this.headerObserver) this.headerObserver.disconnect();
    if (process.client) document.body.style.overflow = '';
    window.removeEventListener('scroll', this.onMenuScroll);
    window.removeEventListener('resize', this.onMenuScroll);
    clearTimeout(this.scrollSpyTimer);
    if (this.scrollSpyFrame) cancelAnimationFrame(this.scrollSpyFrame);
  },
  methods: {
    openProfileLogin() {
      if (this.auth.is_login) {
        this.$router.push('/profile');
        return;
      }
      this.profileLoginPending = true;
      this.$bvModal.show('modal-login');
    },
    onLoginModalClosed() {
      // Closing the dialog must not turn a later login into a profile redirect
      // or an unexpected basket.
      this.profileLoginPending = false;
      this.pendingContinue = false;
    },
    pickSavedAddress(addr) {
      this.selectedAddressId = addr.id;
      this.plaque = ''; // a saved address already carries its plaque in the text
      this.delivery_address = addr.address;
      this.delivery_lat = addr.lat;
      this.delivery_lng = addr.lng;
      this.recalcShippingPreview();
    },
    /** Light/dark switch. The choice is kept on this device (localStorage, with a
     *  cookie as a fallback) and read back by the script in app.html on the next load. */
    toggleTheme(event) {
      const next = this.theme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      const apply = () => {
        root.setAttribute('data-theme', next);
        this.theme = next;
        try { localStorage.setItem('laviz_theme', next); } catch (e) { /* private mode */ }
        document.cookie = `laviz_theme=${next}; max-age=31536000; path=/; SameSite=Lax`;
        this.syncThemeColor();
      };

      // Transitioning each element's colours separately made borders and
      // backgrounds change at different moments. Instead the browser takes a
      // picture of the old page and the new theme grows over it from the
      // button, so every line and fill changes together. Browsers without the
      // View Transitions API simply switch at once.
      if (typeof document.startViewTransition !== 'function' || reducedMotion()) {
        apply();
        return;
      }
      const button = event && event.currentTarget && event.currentTarget.getBoundingClientRect
        ? event.currentTarget.getBoundingClientRect()
        : null;
      const x = button ? button.left + button.width / 2 : window.innerWidth / 2;
      const y = button ? button.top + button.height / 2 : 0;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = document.startViewTransition(async () => {
        apply();
        await this.$nextTick();
      });
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 560, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      }).catch(() => { /* a skipped transition still ends in the new theme */ });
    },
    /** Browser chrome (status bar / address bar) follows the theme. */
    syncThemeColor() {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', this.theme === 'dark' ? '#17181a' : '#ffffff');
    },
    /** + / − in the basket: a light tap on phones that support it, and a rolling number. */
    onCartStep(key, direction) {
      const item = this.productData[key];
      if (!item) return;
      this.countDir = direction > 0 ? 'up' : 'down';
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* not allowed */ } }
      if (direction > 0) this.addProductCount(key, item.add_unit);
      else this.subProductCount(key, item.add_unit);
    },
    /** Adds one unit from the menu and, if it took, lets a dot fly to the basket. */
    onProductAdd(key) {
      const item = this.productData[key];
      if (!item) return;
      const before = item.count;
      this.addProductCount(key, item.add_unit);
      if (item.count > before) this.$nextTick(() => { if (!this.cartOpen) flyToCart(); });
    },
    /** Opens the phone's own navigation to the restaurant: on Android the
     *  system offers every installed map app, on iOS Apple Maps opens, and on a
     *  computer Google Maps opens in a new tab. */
    openNavigation() {
      const lat = Number(this.mapCenter.lat);
      const lng = Number(this.mapCenter.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const name = encodeURIComponent(this.shopInfo.name || '');
      const ua = navigator.userAgent || '';
      const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (/android/i.test(ua)) {
        window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${name})`;
      } else if (isIOS) {
        window.location.href = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d&q=${name}`;
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank', 'noopener');
      }
    },
    /** The customer confirmed a spot on the full-screen map. */
    onMapConfirm({ lat, lng }) {
      this.delivery_lat = lat;
      this.delivery_lng = lng;
      this.selectedAddressId = null; // the position no longer matches a saved address
      // The typed address is the customer's own words: the map never edits it.
      this.mapModalOpen = false;
      this.recalcShippingPreview();
    },
    async refreshSavedAddresses() {
      if (!this.auth.is_login) return;
      try {
        const res = await this.$axios.get('/api/enduser/profile/addresses');
        this.savedAddresses = res.data;
      } catch (e) {
      }
    },
    async recalcShippingPreview() {
      if (this.delivery_type !== 'sendToMe' || !this.delivery_lat) return;
      try {
        const products = [];
        for (const product of this.products) {
          if (this.productData[product.key]?.count) {
            products.push({ product_id: product.key, count: this.productData[product.key].count });
          }
        }
        if (!products.length) return;
        const res = await this.$axios.post('/api/enduser/order/preview', {
          products,
          delivery_type: 'sendToMe',
          delivery_lat: this.delivery_lat,
          delivery_lng: this.delivery_lng,
          discount_code: this.discountCode.code,
        });
        this.shippingCost = res.data.shipping_cost ?? this.shippingCost;
        this.calcBill();
      } catch (e) {
      }
    },
    async loadCurrentOrder() {
      try {
        const res = await this.$axios.get('/api/enduser/profile/orders/current', {
          params: { _refresh: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        if (res.data?.order && isOrderScheduledForTodayOrLater(res.data.order)) {
          this.currentOrder = res.data.order;
          this.currentOrderItems = (res.data.items || []).map((i) => ({
            title: i.productTitle || 'محصول',
            count: i.count,
            lineTotal: Number(i.amount) * Number(i.count),
          }));
        } else {
          this.currentOrder = null;
          this.currentOrderItems = [];
        }
      } catch (e) {
        this.currentOrder = null;
        this.currentOrderItems = [];
      }
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
    dateSelection(index) {
      if (!this.deliveryItems[index].status)
        return;
      this.delivery_date = index;
    },
    openSearch() {
      this.searchOpen = true;
      this.$nextTick(() => this.$refs.menuSearch && this.$refs.menuSearch.focus());
    },
    closeSearch() {
      this.searchOpen = false;
      this.menuSearch = '';
    },

    // Chef's-daily foods live in their own weekly section, not in categories.
    categoryProducts(categoryId) {
      const q = (this.menuSearch || '').trim();
      return this.products.filter(
        (p) =>
          p.categoryId === categoryId &&
          p.menu_type !== 'specialDay' &&
          (!q || (p.name || '').includes(q) || (p.description || '').includes(q))
      );
    },
    addChefDailyProduct(productKey) {
      const product = this.productData[productKey];
      if (product) this.onProductAdd(productKey);
    },
    subChefDailyProduct(productKey) {
      const product = this.productData[productKey];
      if (product) this.subProductCount(productKey, product.add_unit);
    },
    async loadMyDiscountCodes() {
      if (!this.auth.is_login) { this.myActiveCodes = []; return; }
      try {
        const { data } = await this.$axios.get('/api/enduser/profile/active-discount-codes');
        this.myActiveCodes = data || [];
      } catch (e) {
        this.myActiveCodes = [];
      }
    },
    pickMyCode(c) {
      this.discountCode.code = c.code;
      this.approveDiscountCode();
    },
    remainingLabel(c) {
      if (c.remainingDays === null || c.remainingDays === undefined) return 'بدون محدودیت';
      if (c.remainingDays === 0) return 'امروز آخرین مهلت';
      if (c.remainingDays === 1) return 'یک روز مانده';
      return `${c.remainingDays} روز مانده`;
    },
    openCart() {
      if (!this.selectedProducts.length) return;
      // A guest signs in first; the basket opens by itself right after
      // (advanceToDetails), without the "welcome" dialog in between.
      if (!this.auth.is_login) { this.startLoginFromCart(); return; }
      this.cartOpen = true;
      this.loadMyDiscountCodes();
      if (process.client) document.body.style.overflow = 'hidden';
    },
    closeCart() {
      this.cartOpen = false;
      if (process.client) document.body.style.overflow = '';
    },
    /** Guests: collect the phone number and OTP, then come back to the sheet. */
    startLoginFromCart() {
      this.pendingContinue = true;
      this.$bvModal.show('modal-login');
    },
    advanceToDetails() {
      // Called after a successful login/register: the basket sheet stays open
      // and now shows the payment button instead of the login one.
      this.pendingContinue = false;
      this.cartOpen = true;
      this.loadMyDiscountCodes();
      if (process.client) document.body.style.overflow = 'hidden';
    },
    handleTabChange(newTabIndex) {
      const activeCategories = this.menuNavCategories;
      if (activeCategories[newTabIndex]) {
        this.currentActiveTabId = activeCategories[newTabIndex].id;
      } else if (activeCategories[0]) {
        this.currentActiveTabId = activeCategories[0].id;
      }
    },

    // The fixed header covers the top of the viewport, so the "current"
    // section is judged against a line just below it rather than against 0.
    headerOffset(goingDown) {
      const header = document.querySelector('.main-fixed-header');
      if (!header) return 12;
      const full = header.offsetHeight;
      // `goingDown` is passed for programmatic scrolls: the header is about to
      // hide (or show), so aim for the line it will have, not the current one.
      const hidden = goingDown === undefined ? this.headerHidden : goingDown;
      return (hidden ? full - this.headerHideOffset : full) + 12;
    },

    /** Keeps the spacer in step with the header as it collapses and expands. */
    syncHeaderHeight() {
      const header = document.querySelector('.main-fixed-header');
      if (!header) return;
      // Everything above the category tabs is what slides away.
      const tabs = header.querySelector('.laviz-tabs');
      this.headerHideOffset = tabs ? tabs.offsetTop : 0;
      if (header.offsetHeight !== this.headerHeight) {
        this.headerHeight = header.offsetHeight;
      }
    },

    scrollToCategory(categoryId) {
      const el = document.getElementById('menu-cat-' + categoryId);
      if (!el) return;
      // Highlight immediately, then let the scroll settle before the scroll
      // handler takes over again — otherwise it fights the smooth animation.
      this.currentActiveTabId = categoryId;
      this.suppressScrollSpy = true;
      const target = el.getBoundingClientRect().top + window.pageYOffset;
      const goingDown = target > window.pageYOffset + this.headerOffset();
      const top = target - this.headerOffset(goingDown);
      window.scrollTo({ top, behavior: 'smooth' });
      clearTimeout(this.scrollSpyTimer);
      this.scrollSpyTimer = setTimeout(() => {
        this.suppressScrollSpy = false;
      }, 700);
    },

    // Picks the last section whose top has passed under the header. Cheap and
    // predictable; no observer thresholds to tune for short trailing sections.
    updateActiveCategoryFromScroll() {
      if (this.suppressScrollSpy || !this.menuNavCategories.length) return;

      // getBoundingClientRect().top is fractional, so a section scrolled exactly
      // to the line lands a fraction below it and would otherwise be skipped —
      // leaving the strip one section behind. A small tolerance absorbs that.
      const TOLERANCE_PX = 2;
      const line = this.headerOffset() + TOLERANCE_PX;
      let activeId = this.menuNavCategories[0].id;

      for (const cat of this.menuNavCategories) {
        const el = document.getElementById('menu-cat-' + cat.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - line <= 0) activeId = cat.id;
      }

      // At the very bottom the last section may never reach the line, so make
      // sure it still wins once the page is scrolled all the way down.
      const atBottom =
        window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 2;
      if (atBottom) activeId = this.menuNavCategories[this.menuNavCategories.length - 1].id;

      if (activeId !== this.currentActiveTabId) this.currentActiveTabId = activeId;
    },

    onMenuScroll() {
      if (this.scrollSpyFrame) return;
      this.scrollSpyFrame = requestAnimationFrame(() => {
        this.scrollSpyFrame = null;
        this.updateActiveCategoryFromScroll();
        this.updateHeaderCollapse();
        this.$nextTick(this.syncHeaderHeight);
      });
    },

    /** Hide the header on the way down, show it again on the first move up.
     *  Small deadbands (6px down / 4px up) keep touch jitter from flickering it. */
    updateHeaderCollapse() {
      const y = Math.max(0, window.pageYOffset);
      const dy = y - this.lastScrollY;
      if (y <= 10) {
        this.headerHidden = false;
        this.lastScrollY = y;
      } else if (dy > 6 && y > this.headerHideOffset) {
        this.headerHidden = true;
        this.lastScrollY = y;
      } else if (dy < -4) {
        this.headerHidden = false;
        this.lastScrollY = y;
      }
    },
    async initialize() {
      this.loading = true;
      try {
        const resp = await this.$axios.get('/api/enduser/core/initialize');
        this.productCategories = resp.data.categories;
        this.products = resp.data.products;
        this.deliveryItems = visibleDeliveryOptions(resp.data.schedule.activeDays);
        if (Array.isArray(resp.data.deliveryTypeOptions) && resp.data.deliveryTypeOptions.length) {
          this.deliveryTypeOptions = resp.data.deliveryTypeOptions;
        }
        if (!this.deliveryTypeOptions.some(option => option.value === this.delivery_type)) {
          this.delivery_type = this.deliveryTypeOptions[0].value;
        }
        // Defaults on entry: delivery ("برام ارسال کنید") and the first day that
        // can still take orders (today when it is open), so the basket opens
        // with both choices already made.
        if (this.deliveryTypeOptions.some(option => option.value === 'sendToMe')) {
          this.delivery_type = 'sendToMe';
        }
        if (this.delivery_date === -1) {
          const firstOpenDay = this.deliveryItems.findIndex(day => day.status);
          if (firstOpenDay !== -1) this.delivery_date = firstOpenDay;
        }
        this.shippingCost = resp.data.shippingCost;
        this.delivery_address = resp.data.address;
        if (resp.data.mapCenter) this.mapCenter = resp.data.mapCenter;
        if (resp.data.supportPhone) this.supportPhone = resp.data.supportPhone;
        if (resp.data.pwaCallOutText) this.pwaCallOutText = resp.data.pwaCallOutText;
        if (resp.data.shopInfo) {
          this.shopInfo = { ...this.shopInfo, ...resp.data.shopInfo };
          // Kept in localStorage so the result page, which the gateway loads
          // directly without a menu request, can show the same details.
          try {
            localStorage.setItem('shopInfo', JSON.stringify(this.shopInfo));
          } catch (e) { /* private mode — the page falls back to defaults */ }
        }
        this.savedAddresses = resp.data.savedAddresses || [];
        this.delivery_description = resp.data.delivery_description;
        this.in_person_description = resp.data.in_person_description;
        this.mode = resp.data.mode;
        this.taxEnabled = !!resp.data.taxEnabled;
        this.taxPercent = Number(resp.data.taxPercent) || 0;
        this.etaMinutes = Number(resp.data.deliveryEtaMinutes) || 0;
        this.showProductRating = !!resp.data.showProductRating;
        if (resp.data.deliveryEtaLabel) this.labels.deliveryEta = resp.data.deliveryEtaLabel;
        if (resp.data.pickupEtaLabel) this.labels.pickupEta = resp.data.pickupEtaLabel;
        if (resp.data.shippingChipLabel) this.labels.shippingChip = resp.data.shippingChipLabel;
        applyAppModeTheme(this.mode);
        this.publicOffers = resp.data.publicOffers || [];
        this.setProduct();
        // The offers row sits above the menu, so personal codes have to be
        // fetched at load rather than when the basket opens.
        this.loadMyDiscountCodes();

        if (this.productCategories.length > 0) {
          this.$nextTick(() => {
            this.handleTabChange(this.tabIndex);
            if (!this.currentActiveTabId) {
              const first = this.menuNavCategories[0];
              if (first) this.currentActiveTabId = first.id;
            }
          });
        }
      } catch (e) {
        this.$bvToast.toast('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.', { variant: 'danger', noAutoHide: true });
      } finally {
        this.loading = false;
      }
    },
    setProduct() {
  for (let product of this.products) {
    this.$set(this.productData, product.key, {
      name: product.name,
      price: product.price,
      image: product.thumbnail
        ? this.$axios.defaults.baseURL + product.thumbnail
        : product.image
          ? this.$axios.defaults.baseURL + product.image
          : '', // no picture: the card leaves the slot empty
      imageFull: product.image ? this.$axios.defaults.baseURL + product.image : null,
      discount_percent: product.discount_percent,
      description: product.description,
      add_unit: product.add_unit,
      unit_name: product.unit_name,
      isOutOfStock: product.isOutOfStock,
      count: 0,
      total_amount: 0,
      menu_type: product.menu_type,
      isSpecial: product.isSpecial,
      specialDaysText: product.specialDaysText,
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount
    });
  }
  this.display_product = true;
},
    // setProduct() {
    //   for (let product of this.products) {
    //     this.productData[product.key] = {
    //       name: product.name,
    //       price: product.price,
    //       thumbnail: product.thumb ? this.$axios.defaults.baseURL + product.thumb : require('@/assets/media/no-image.jpg'),
    //       image: product.image ? this.$axios.defaults.baseURL + product.image : null,
    //       discount_percent: product.discount_percent,
    //       description: product.description,
    //       add_unit: product.add_unit,
    //       unit_name: product.unit_name,
    //       isOutOfStock: product.isOutOfStock,
    //       count: 0,
    //       total_amount: 0,
    //       menu_type: product.menu_type,
    //       isSpecial: product.isSpecial,
    //       specialDaysText: product.specialDaysText
    //     };
    //   }
    //   this.display_product = true;
    // },
    addProductCount(pKey, unit) {
      const selectedProduct = this.productData[pKey];
      if (!selectedProduct) return;
      const selectedMenuType = selectedProduct.menu_type;

      // Customers add food before opening the basket to select a delivery
      // date. Validate its weekday when a date is already selected; final
      // checkout validates the date for every special-day item.
      if (selectedMenuType === 'specialDay' && this.delivery_date !== -1) {
        const selectedDeliveryDate = this.deliveryItems[this.delivery_date].date;
        const dayOfWeek = moment(selectedDeliveryDate, "YYYY/M/D").day();
        // const dayOfWeek = moment(selectedDeliveryDate, "YYYY/M/D").startOf('day').day();
        const adjustedDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

        if (selectedProduct.isSpecial) {
          const productInList = this.products.find(p => p.key === pKey);
          const allowedDays = JSON.parse(productInList.specialDay);

          if (!allowedDays.includes(adjustedDay)) {
            this.$bvToast.toast(`این غذا در روز ${this.getDeliveryItemText(this.delivery_date)} (${this.jalaliDate(selectedDeliveryDate, "dddd")}) سرو نمی‌شود.`, {
              variant: "danger",
            });
            return;
          }
        }
      }

      this.display_product = false;
      // this.productData[pKey].count += unit;
      this.$set(this.productData[pKey], 'count', this.productData[pKey].count + unit);
      this.display_product = true;
      this.calcBill();
    },

    subProductCount(pKey, unit) {
      if (this.productData[pKey].count <= 0) {
        return;
      }

      this.display_product = false;

      // this.productData[pKey].count -= unit;
      this.$set(this.productData[pKey], 'count', this.productData[pKey].count - unit);
      this.display_product = true;
      this.calcBill();
    },
    calcBill() {
      this.bill.total_amount = 0;
      this.bill.discount_amount = 0;
      this.bill.tax_amount = 0;
      this.bill.shipping_amount = 0;
      this.bill.payment_amount = 0;

      for (const product of this.products) {
        this.bill.total_amount +=
          Number(this.productData[product.key].price) *
          Number(this.productData[product.key].count);
      }

      if (this.delivery_type === 'sendToMe' && this.bill.total_amount > 0) {
        this.bill.shipping_amount = Number(this.shippingCost || 0);
      }

      const beforeTax = this.bill.total_amount + this.bill.shipping_amount;
      if (this.taxEnabled && this.taxPercent > 0) {
        this.bill.tax_amount = Math.round((beforeTax * this.taxPercent) / 100);
      }

      let subtotal = beforeTax + this.bill.tax_amount;

      if (this.discountCode.code_valid_status) {
        this.bill.discount_amount = Math.round(
          (subtotal / 100) * this.discountCode.discount_percent
        );
      }

      this.bill.payment_amount = Math.max(0, subtotal - this.bill.discount_amount);
    },
    async order() {
      let selected_product = false;
      for (let product of this.products) {
        if (this.productData[product.key].count > 0) {
          selected_product = true;

          if (this.productData[product.key].menu_type === 'specialDay') {
            if (this.delivery_date === -1) {
              this.$bvToast.toast("لطفاً تاریخ تحویل را انتخاب کنید", {
                variant: "danger",
              });
              return false;
            }

            const selectedDeliveryDate = this.deliveryItems[this.delivery_date].date;
            const dayOfWeek = moment(selectedDeliveryDate, "YYYY/M/D").day();
            const adjustedDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

            const productInList = this.products.find(p => p.key === product.key);
            if (productInList && productInList.specialDay) {
              const allowedDays = JSON.parse(productInList.specialDay);
              if (!allowedDays.includes(adjustedDay)) {
                this.$bvToast.toast(`غذا "${this.productData[product.key].name}" برای روز انتخاب شده مجاز نیست.`, {
                  variant: "danger",
                });
                return false;
              }
            }
          }
        }
      }

      if (!selected_product) {
        this.$bvToast.toast("حداقل یک محصول را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      let sumKG = 0;
      for (let product of this.products) {
        sumKG = Number(sumKG) + Number(this.productData[product.key].count);
      }

      if (sumKG <= 0.5) {
        this.$bvToast.toast("حداقل سفارش یک کیلوگرم می باشد", {
          variant: "danger",
        });
        return false;
      }

      if (!this.delivery_type) {
        this.$bvToast.toast("لطفا نحوه دریافت خود را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      if (this.delivery_date === -1) {
        this.$bvToast.toast("تاریخ تحویل خود را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      if (this.delivery_type == "sendToMe" && !this.delivery_address) {
        this.$bvToast.toast("لطفا آدرس محل تحویل خود را وارد کنید", {
          variant: "danger",
        });
        return false;
      }


      if (this.isPickupLike && !this.delivery_time) {
        if (this.deliveryTimes.length > 1) {
          this.$bvToast.toast("لطفاً ساعت تحویل را انتخاب کنید", { variant: "danger" });
          return false;
        }
      }

      if (this.delivery_type == "sendToMe" && this.deliveryTimes.length > 1 && !this.delivery_time) {
        this.$bvToast.toast("لطفاً ساعت تحویل را انتخاب کنید", { variant: "danger" });
        return false;
      }

      if (!this.auth.is_login) {
        this.$bvModal.show("modal-login");
        return;
      }

      this.loading_payment = true;

      try {
        let data = {
          products: [],
          delivery_date: this.delivery_date !== -1 ? this.deliveryItems[this.delivery_date].date : null,
          delivery_type: this.delivery_type,
          delivery_time: this.delivery_time,
          check_one: this.check_one,
          delivery_address: this.fullDeliveryAddress,
          delivery_lat: this.delivery_lat,
          delivery_lng: this.delivery_lng,
          discount_code: this.discountCode.code,
        };

        for (let product of this.products) {
          if (this.productData[product.key].count) {
            data.products.push({
              product_id: product.key,
              count: this.productData[product.key].count,
            });
          }
        }

        let resp = await this.$axios.post("/api/enduser/order/preview", data);

        this.billData.total_amount = resp.data.total_amount;
        this.billData.discount_amount = resp.data.discount_amount;
        this.billData.payment_amount = resp.data.payment_amount;
        this.billData.shipping_cost = resp.data.shipping_cost;
        this.billData.tax_amount = resp.data.tax_amount || 0;
        this.shippingCost = resp.data.shipping_cost || this.shippingCost;
        this.billData.is_first_order = resp.data.is_first_order;
        this.$bvModal.show("modal-bill");
      } catch (error) {
        if (error.response && error.response.status == 401) {
          this.auth.is_login = false;
          this.auth.token = null;
          this.auth.user = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete this.$axios.defaults.headers.common["Authorization"];
          this.$bvModal.show("modal-login");
          return;
        }
        this.loading_payment = false;
        if (error.response) {
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
        }
      }
    },
    async approveDiscountCode() {

      if (!this.auth.is_login) {
        this.auth.discountCodeRequest = true;
        this.$bvModal.show("modal-login");
        return;
      }

      try {
        let res = await this.$validator.validateAll("discountCode");
        if (!res) throw "فرم زیر را تکمیل کنید";

        let resp = await this.$axios.get("/api/enduser/core/check-discount-code/" + encodeURIComponent(String(this.discountCode.code || '').trim()) + `?basketAmount=${this.bill.payment_amount}`);
        this.discountCode.code_valid_status = true;
        const discountValue = Number(resp.data.value)

        this.discountCode.discount_percent = discountValue;

        this.bill.decreased_amount = this.bill.total_amount * (discountValue / 100);
        this.bill.discount_amount = this.bill.total_amount - this.bill.decreased_amount;


      } catch (error) {
        const body = error && error.response && error.response.data;
        let message = body && (body.message || body.error || body.detail);
        if (Array.isArray(message)) message = message.join('، ');
        if (typeof message !== 'string' || !message.trim()) {
          message = error && !error.response
            ? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.'
            : 'اعتبارسنجی کد تخفیف انجام نشد. دوباره تلاش کنید.';
        }
        this.$bvToast.toast(message, { variant: "danger" });
      }
    },
    async cancelDiscountCode() {
      this.discountCode.code = null;
      this.discountCode.code_valid_status = false;
      this.discountCode.discount_percent = 0;
    },
    registerSuccess() {
      this.$bvModal.hide("modal-login");
      if (this.profileLoginPending) {
        this.profileLoginPending = false;
        this.$router.push('/profile');
        return;
      }
      if (!this.pendingContinue) this.$bvModal.show("success-login");
      if (this.pendingContinue) this.advanceToDetails();

      this.loginForm = {
        step: "checkMobile",
        new_user: true,
        data: {
          mobile: null,
          first_name: null,
          last_name: null,
          verify_code: null,
        },
      };
    },
    loginSuccess() {
      this.$bvModal.hide("modal-login");
      if (this.profileLoginPending) {
        this.profileLoginPending = false;
        this.$router.push('/profile');
        return;
      }
      if (this.auth.discountCodeRequest == true) {
        this.approveDiscountCode();
        this.auth.discountCodeRequest = false;
      } else if (!this.pendingContinue) {
        this.$bvModal.show("success-login");
      }
      if (this.pendingContinue) this.advanceToDetails();
    },
    async logout() {
      try {
        if (!this.auth.is_login) return false;

        const result = await this.$bvModal.msgBoxConfirm(
          "آیا برای خروج اطمینان دارید؟",
          {
            title: "خروج",
            size: "sm",
            buttonSize: "sm",
            okVariant: "success",
            headerClass: "p-2 border-bottom-0",
            footerClass: "p-2 border-top-0",
            centered: true,
            okTitle: "بله",
            cancelTitle: "خیر",
            cancelVariant: "danger",
          }
        );

        if (result === true) {
          this.auth.is_login = false;
          this.auth.token = null;
          this.auth.user = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete this.$axios.defaults.headers.common["Authorization"];
        }
      } catch {
      }
    },
    jalaliDate(date, format = "jYYYY/jM/jD") {
      const result = moment(date, "YYYY/M/D").format(format);
      return result.replaceAll('آدینه', 'جمعه');
    },
    formatJalaliDate,
    getDeliveryItemText(index) {
      return deliveryDayLabel(index);
    },
    setDeliveryTimeItems(index) {
      this.delivery_time = null;
      this.timeMode = 'asap';
      const times = this.deliveryItems[index]?.deliveryTimes || [];
      this.deliveryTimes = times.map((f) => ({ value: f, text: f }));
      // "Delivery as soon as possible" is the default: the earliest slot of the
      // day (the list arrives in time order). A day's hours can differ from the
      // next day's, so a chosen time never carries over to another day.
      if (this.deliveryTimes.length >= 1) {
        this.delivery_time = this.deliveryTimes[0].value;
      }
    },
    chooseAsapTime() {
      this.timeMode = 'asap';
      if (this.deliveryTimes.length) this.delivery_time = this.deliveryTimes[0].value;
    },
    onTimePicked(time) {
      this.delivery_time = time;
      this.timeMode = 'scheduled';
    },
    faTime(value) {
      return String(value || '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    },
    // Accepts the product card's { src, name, description } (or just a URL).
    showImageModal(payload) {
      const info = typeof payload === 'string' ? { src: payload } : (payload || {});
      if (!info.src) return;
      this.modal.image = info.src;
      this.modal.name = info.name || '';
      this.modal.description = info.description || '';
      this.imageOpen = true;
    },
    removeProduct(pKey) {
      this.display_product = false;
      this.productData[pKey].count = 0;
      this.display_product = true;
      this.calcBill();
    },
  },
  watch: {
    mode(value) {
      applyAppModeTheme(value);
    },
    delivery_date(value) {
      this.calcBill();
      if (value !== -1) {
        this.setDeliveryTimeItems(value);
      }
    },
    delivery_type(value) {
      this.calcBill();
      if (value === 'sendToMe') {
        this.$nextTick(() => this.$refs.deliveryMap?.refreshMap());
      } else if (value === 'iWillCome' || value === 'snapp') {
        this.$nextTick(() => this.$refs.restaurantMap?.refreshMap());
      }
    },
    "discountCode.code_valid_status"() {
      this.calcBill();
    },
    tabIndex(newIndex) {
      this.handleTabChange(newIndex);
    }
  },
  computed: {
    // Positions, sizes and timings of the sparks. Fixed numbers (no randomness)
    // so the layout is the same on every load.
    emberStyles() {
      return Array.from({ length: 14 }, (_, n) => ({
        '--ex': ((n * 53 + 11) % 96) + 2 + '%',
        '--es': 2 + (n % 3) + 'px',
        '--ed': 18 + ((n * 7) % 14) + 's',
        '--edl': -(n * 3.1) + 's',
        '--esw': ((n * 11) % 44) - 22 + 'px',
      }));
    },
    // The customer collects (or sends their own Snapp for) the order: no
    // address, no shipping cost, and the restaurant's location is what matters.
    isPickupLike() {
      return this.delivery_type === 'iWillCome' || this.delivery_type === 'snapp';
    },
    // Delivery needs an address; pick-up does not.
    addressMissing() {
      return this.delivery_type === 'sendToMe' && !(this.delivery_address || '').trim();
    },
    timeSheetDayLabel() {
      const item = this.deliveryItems[this.delivery_date];
      if (!item) return '';
      return `${this.getDeliveryItemText(this.delivery_date)} ${this.jalaliDate(item.date, 'dddd')}`;
    },
    // The API has a single address string, so the plaque is appended to it.
    fullDeliveryAddress() {
      const text = (this.delivery_address || '').trim();
      const plaque = (this.plaque || '').trim();
      return plaque ? `${text}، پلاک ${plaque}` : text;
    },
    showCategoryTabs() {
      const cats = this.menuNavCategories;
      return cats.length > 1;
    },
    hasChefDaily() {
      return this.chefDailyProducts.length > 0;
    },
    chefDailyProducts() {
      const q = (this.menuSearch || '').trim();
      return this.products.filter((p) =>
        p.menu_type === 'specialDay' &&
        (!q || (p.name || '').includes(q) || (p.description || '').includes(q))
      );
    },
    // Categories that still have at least one non-chef-daily product. Chef's
    // daily foods live in their own leading tab, so they are not repeated here.
    realVisibleCategories() {
      return this.productCategories.filter(
        (cat) => this.categoryProducts(cat.id).length > 0
      );
    },
    visibleCategories() {
      return this.realVisibleCategories;
    },
    menuNavCategories() {
      const categories = this.visibleCategories.map((cat) => ({ ...cat }));
      if (this.hasChefDaily) {
        categories.unshift({
          id: CHEF_TAB_ID,
          text: 'غذای روز',
          count: this.chefDailyProducts.length,
        });
      }
      return categories;
    },
    sheetCategories() {
      return this.menuNavCategories.map((cat) => ({
        ...cat,
        count: cat.id === CHEF_TAB_ID ? this.chefDailyProducts.length : this.categoryProducts(cat.id).length,
      }));
    },
    weeklyPlan() {
      const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
      const dailyProducts = this.products
        .filter((p) => p.menu_type !== 'specialDay')
        .map((p) => p.name);
      return dayNames.map((name, dayIndex) => {
        const specialProducts = this.products.filter((p) => {
          if (p.menu_type !== 'specialDay' || !p.specialDay) return false;
          try {
            const allowed = JSON.parse(p.specialDay);
            return Array.isArray(allowed) && allowed.includes(dayIndex);
          } catch {
            return false;
          }
        }).map((p) => p.name);
        const products = [...dailyProducts, ...specialProducts];
        return { name, products: [...new Set(products)] };
      });
    },
    todayWeekIndex() {
      const map = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
      return map[new Date().getDay()] ?? 0;
    },
    currentOrderStatusLabel() {
      if (!this.currentOrder) return '';
      const map = { 10: 'در انتظار تایید رستوران', 12: 'در حال آماده‌سازی', 13: 'تحویل پیک', 1: 'پرداخت شده', 2: 'پرداخت شده (نقدی)' };
      return map[this.currentOrder.status] || 'در حال پیگیری';
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
    selectedItemsTotal() {
      return this.selectedProducts.reduce((sum, item) => sum + item.total, 0);
    },
  }
};
</script>

<style>
/* صفحه اصلی — جزئیات در assets/scss/main.scss */
</style>
