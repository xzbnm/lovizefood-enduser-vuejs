/**
 * Environment-agnostic mock logic (works in Node and in the browser).
 * createMock(sample) -> { handle(method, pathname, body), image(pathname) }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.createMock = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return function createMock(sample) {
    const snapshot = sample.responses['GET /api/enduser/core/initialize'].body;
    const manifest = (sample.responses['GET /api/enduser/core/manifest.webmanifest'] || {}).body || {};

    // The snapshot has fixed dates. Shift them so the first active day is
    // always today (Tehran), keeping each day's slots and discounts.
    function tehranToday() {
      const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date()).split('-').map(Number);
      return Date.UTC(p[0], p[1] - 1, p[2]);
    }
    function initialize() {
      const body = JSON.parse(JSON.stringify(snapshot));
      body.schedule.activeDays.forEach((d, i) => {
        const t = new Date(tehranToday() + i * 864e5);
        d.date = `${t.getUTCFullYear()}/${t.getUTCMonth() + 1}/${t.getUTCDate()}`;
      });
      // Not in the real API yet: the backend has to define this delivery type
      // ("snapp", the customer books their own Snapp) before it can show up there.
      if (Array.isArray(body.deliveryTypeOptions) && !body.deliveryTypeOptions.some((o) => o.value === 'snapp')) {
        body.deliveryTypeOptions.push({ text: 'خودم اسنپ می‌گیرم', value: 'snapp' });
      }
      // The real API returns the signed-in customer's saved addresses here; the
      // snapshot was taken signed out, so it has none.
      if (!body.savedAddresses) body.savedAddresses = sampleAddresses();
      return body;
    }

    const imagePaths = new Set();
    snapshot.products.forEach((p) => { [p.thumbnail, p.image].forEach((x) => { if (x) imagePaths.add(x); }); });
    const colors = ['#e8a33d', '#c0392b', '#8e5a2b', '#6b8e23', '#d35400', '#7d3c98', '#2e86c1'];
    // Only products that have an image in the snapshot get one; the rest 404 on
    // purpose so the "no photo" state is exercised with real data.
    function image(pathname) {
      if (!imagePaths.has(pathname)) return null;
      const hash = [...pathname].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
      const prod = snapshot.products.find((x) => x.thumbnail === pathname || x.image === pathname);
      const label = (prod ? prod.name : 'food').replace(/[<&>]/g, '');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${colors[Math.abs(hash) % colors.length]}"/><text x="300" y="310" font-size="44" fill="#fff" text-anchor="middle" font-family="sans-serif">${label}</text></svg>`;
    }

    // Sample personal discount codes (fixed amounts in toman), as the API would
    // return them for a signed-in customer.
    const sampleCodes = [
      { id: 'dc-1', code: 'LAVIZ50', title: 'هدیه خوش‌آمد', amount: 50000, percent: 10, remainingDays: 6 },
      { id: 'dc-2', code: 'QAEN20', title: 'تخفیف قائن', amount: 20000, percent: 5, remainingDays: 1 },
      { id: 'dc-3', code: 'FRIDAY100', title: 'جمعه خانوادگی', amount: 100000, percent: 15, remainingDays: null },
    ];
    const usedCodes = [{ id: 'dc-0', code: 'WELCOME', title: 'اولین سفارش', amount: 30000, expTime: null }];
    const findCode = (code) => sampleCodes.find((c) => c.code.toLowerCase() === String(code || '').trim().toLowerCase());

    // Made-up order history for the profile page. Dates are counted back from
    // today so the list always looks recent. Statuses: 12 being prepared,
    // 20 delivered (see statusLabel in orderHistory.vue).
    function sampleOrders() {
      const day = 864e5;
      const at = (daysAgo, hour, minute) => {
        const d = new Date(Date.now() - daysAgo * day);
        d.setHours(hour, minute, 0, 0);
        return d.toISOString();
      };
      // Lines use the same fields as the current-order endpoint: productTitle,
      // count, amount (unit price). Names and prices come from the menu snapshot.
      return [
        {
          id: 'a1f3c9d2-7b41-4e0a-9c55-1d2e3f4a5b61', orderNumber: '10482', status: 12, createDate: at(0, 12, 41), deliveryDate: at(0, 13, 30), deliveryTime: '13:30', totalAmount: 1240000,
          items: [
            { id: 'i-1', productTitle: 'چلو کباب ویژه لاویز', count: 1, amount: 600000 },
            { id: 'i-2', productTitle: 'چلو جوجه کباب', count: 1, amount: 460000 },
            { id: 'i-3', productTitle: 'نوشابه قوطی کوکاکولا', count: 2, amount: 90000 },
          ],
        },
        {
          id: 'b7d20e84-3c96-4a1f-8e07-6a5b4c3d2e10', orderNumber: '10431', status: 20, createDate: at(3, 19, 5), deliveryDate: at(3, 20, 0), deliveryTime: '20:00', totalAmount: 1150000,
          items: [
            { id: 'i-4', productTitle: 'چلو وزیری', count: 1, amount: 700000 },
            { id: 'i-5', productTitle: 'چلو مرغ سرخ شده', count: 1, amount: 450000 },
          ],
        },
        {
          id: 'c5e81a37-9d02-4b6c-a3f4-0e1d2c3b4a59', orderNumber: '10377', status: 20, createDate: at(9, 13, 18), deliveryDate: at(9, 14, 15), deliveryTime: '14:15', totalAmount: 475000,
          items: [
            { id: 'i-6', productTitle: 'چلو جوجه کباب', count: 1, amount: 460000 },
            { id: 'i-7', productTitle: 'سس مایونز رعنا', count: 1, amount: 15000 },
          ],
        },
      ];
    }

    // Made-up saved addresses, a few streets from the restaurant (mapCenter in
    // the snapshot). Same fields the profile page and the basket read.
    function sampleAddresses() {
      return [
        { id: 'ad-1', title: 'خانه', address: 'قائن، بلوار بسیج، کوچه ۱۲، منزل آقای نمونه', isDefault: true, plateNumber: '۲۴', unitNumber: '', lat: 33.7289, lng: 59.1856 },
        { id: 'ad-2', title: 'محل کار', address: 'قائن، خیابان امام خمینی، نبش کوچه ۸، طبقه دوم', isDefault: false, plateNumber: '۱۱۰', unitNumber: '۳', lat: 33.7351, lng: 59.1801 },
        { id: 'ad-3', title: 'منزل پدری', address: 'قائن، خیابان بصیرت، کوچه ۴، بن‌بست گل‌ها', isDefault: false, plateNumber: '۷', unitNumber: '', lat: 33.7312, lng: 59.1894 },
      ];
    }

    const user = { id: 'mock-user', first_name: 'کاربر', last_name: 'نمونه', mobile: '09120000000' };
    const json = (body, status = 200) => ({ status, body });
    const routes = {
      'GET /api/enduser/core/initialize': () => json(initialize()),
      'GET /api/enduser/core/manifest.webmanifest': () => json(manifest),
      'POST /api/auth/check-mobile': () => json({ is_new_user: false, verify_code: '12345' }),
      'POST /api/auth/login': () => json({ token: 'mock-token', user }),
      'POST /api/auth/register': () => json({ token: 'mock-token', user }),
      'GET /api/enduser/profile': () => json(Object.assign({}, user, { addresses: sampleAddresses() })),
      'PUT /api/enduser/profile': () => json(user),
      'GET /api/enduser/profile/addresses': () => json(sampleAddresses()),
      'GET /api/enduser/profile/orders': () => json(sampleOrders()),
      'GET /api/enduser/profile/orders/current': () => json({ order: null, items: [] }),
      'GET /api/enduser/profile/password-status': () => json({ hasPassword: false }),
      'GET /api/enduser/profile/discount-codes': () => json({ available: sampleCodes, used: usedCodes }),
      'GET /api/enduser/profile/active-discount-codes': () => json(sampleCodes),
      'GET /api/enduser/profile/notifications': () => json([]),
      'PUT /api/enduser/profile/notifications/seen': () => json({ ok: true }),
      'POST /api/enduser/order/preview': (body) => {
        let total = 0;
        (body.products || []).forEach((i) => {
          const p = snapshot.products.find((x) => x.key === i.product_id);
          if (p) total += p.price * (1 - (p.discount_percent || 0) / 100) * i.count;
        });
        total = Math.round(total);
        const shipping = body.delivery_type === 'sendToMe' ? snapshot.shippingCost : 0;
        const found = findCode(body.discount_code);
        const discount = found ? Math.min(found.percent ? Math.round((total * found.percent) / 100) : found.amount, total) : 0;
        const tax = snapshot.taxEnabled ? Math.round((total - discount) * snapshot.taxPercent / 100) : 0;
        return json({ total_amount: total, discount_amount: discount, shipping_cost: shipping, tax_amount: tax, payment_amount: total - discount + shipping + tax, is_first_order: false });
      },
      'POST /api/enduser/order/create': () => json({ statusCode: 501, message: 'ثبت سفارش در mock پشتیبانی نمی‌شود' }, 501),
    };

    function handle(method, pathname, body, query) {
      // GET /api/enduser/core/check-discount-code/{code}?basketAmount=...
      // Answers with the discount as a percentage of the basket, like the real API.
      const m = method === 'GET' && pathname.match(/^\/api\/enduser\/core\/check-discount-code\/(.+)$/);
      if (m) {
        const found = findCode(decodeURIComponent(m[1]));
        if (!found) return json({ statusCode: 400, message: 'کد تخفیف معتبر نیست یا منقضی شده است.' }, 400);
        const basket = Number((query && query.get && query.get('basketAmount')) || 0);
        const percent = found.percent || (basket > 0 ? Math.min(100, (found.amount / basket) * 100) : 0);
        return json({ value: Number(percent.toFixed(4)), amount: found.amount });
      }
      const h = routes[`${method} ${pathname}`];
      return h ? h(body || {}) : null; // null = not mocked
    }
    return { handle, image };
  };
});
