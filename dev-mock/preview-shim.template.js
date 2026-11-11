// Browser shim for the static preview: answers the app's API calls from the
// bundled sample data (no server needed). Generated into the page head.
(function () {
  var ORIGIN = '__ORIGIN__';
  var mock = createMock(__SAMPLE__);
  var P = XMLHttpRequest.prototype, realOpen = P.open, realSend = P.send;

  P.open = function (method, url) {
    var u = String(url);
    this.__mock = u.indexOf(ORIGIN) === 0 ? { m: String(method).toUpperCase(), p: new URL(u).pathname, u: u } : null;
    return realOpen.apply(this, arguments);
  };
  P.send = function (body) {
    var mk = this.__mock;
    if (!mk) return realSend.apply(this, arguments);
    var self = this, parsed = {};
    try { parsed = body ? JSON.parse(body) : {}; } catch (e) {}
    var out = mock.handle(mk.m, mk.p, parsed, new URL(mk.u).searchParams) || { status: 404, body: { statusCode: 404, message: 'mock: not implemented' } };
    var text = JSON.stringify(out.body);
    setTimeout(function () {
      function def(k, v) { Object.defineProperty(self, k, { value: v, configurable: true }); }
      def('readyState', 4); def('status', out.status); def('statusText', '');
      def('responseText', text); def('response', text); def('responseURL', ORIGIN + mk.p);
      self.getAllResponseHeaders = function () { return 'content-type: application/json\r\n'; };
      self.getResponseHeader = function (h) { return /content-type/i.test(h) ? 'application/json' : null; };
      ['readystatechange', 'load', 'loadend'].forEach(function (ev) { self.dispatchEvent(new Event(ev)); });
    }, 120);
  };

  // Product photos: swap the API image URLs for the generated placeholders.
  function fix(img) {
    var s = img.getAttribute && img.getAttribute('src');
    if (!s || s.indexOf(ORIGIN + '/public/food/') !== 0) return;
    var svg = mock.image(s.slice(ORIGIN.length));
    if (svg) img.setAttribute('src', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  new MutationObserver(function (list) {
    list.forEach(function (r) {
      if (r.type === 'attributes') fix(r.target);
      r.addedNodes && r.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IMG') fix(n);
        else if (n.querySelectorAll) n.querySelectorAll('img').forEach(fix);
      });
    });
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });

  // ---- map.ir stand-in -----------------------------------------------------
  // The preview has no network access to map.ir, OpenFreeMap or Nominatim. Tiles become a generic street
  // grid, search covers a few Qaen places, reverse geocoding names the nearest
  // one. None of this is real map data; it only lets the map UI be exercised.
  var PLACES = [
    { title: 'بلوار بسیج', lat: 33.7335, lng: 59.1835 },
    { title: 'خیابان بصیرت', lat: 33.7322, lng: 59.1815 },
    { title: 'میدان شهدا', lat: 33.7340, lng: 59.1870 },
    { title: 'بیمارستان امام علی', lat: 33.7276, lng: 59.1838 },
    { title: 'پارک ملت', lat: 33.7300, lng: 59.1790 },
    { title: 'ترمینال مسافربری', lat: 33.7210, lng: 59.1750 },
    { title: 'میدان آزادی، مشهد', lat: 36.2972, lng: 59.6067 }
  ];
  function jsonResponse(obj) {
    return new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  // One map tile (256px) of the generic street grid; minx/miny in web-mercator
  // metres, span the tile's width in metres.
  function drawTile(minx, miny, span) {
    var N = 256, k = N / span;
    var c = document.createElement('canvas'); c.width = c.height = N;
    var g = c.getContext('2d');
    g.fillStyle = '#eceee6'; g.fillRect(0, 0, N, N);
    var CELL = 180, x0 = Math.floor(minx / CELL), x1 = Math.ceil((minx + span) / CELL);
    var y0 = Math.floor(miny / CELL), y1 = Math.ceil((miny + span) / CELL);
    function px(X) { return (X - minx) * k; }
    function py(Y) { return N - (Y - miny) * k; }
    for (var ix = x0; ix <= x1; ix++) for (var iy = y0; iy <= y1; iy++) {
      var h = Math.abs((ix * 73856093) ^ (iy * 19349663)) % 11;
      if (h === 0) { g.fillStyle = '#cfe6c6'; g.fillRect(px(ix * CELL), py((iy + 1) * CELL), CELL * k, CELL * k); }
      else if (h < 4) { g.fillStyle = '#e3e1d8'; g.fillRect(px(ix * CELL) + 6 * k, py((iy + 1) * CELL) + 6 * k, (CELL - 12) * k, (CELL - 12) * k); }
    }
    g.fillStyle = '#ffffff';
    for (var i = x0; i <= x1; i++) g.fillRect(px(i * CELL) - Math.max(1.5, 7 * k) / 2, 0, Math.max(1.5, 7 * k), N);
    for (var j = y0; j <= y1; j++) g.fillRect(0, py(j * CELL) - Math.max(1.5, 7 * k) / 2, N, Math.max(1.5, 7 * k));
    g.fillStyle = '#fbe3a0';
    for (var a = Math.floor(minx / (CELL * 5)); a <= Math.ceil((minx + span) / (CELL * 5)); a++) g.fillRect(px(a * CELL * 5) - Math.max(3, 16 * k) / 2, 0, Math.max(3, 16 * k), N);
    for (var b = Math.floor(miny / (CELL * 5)); b <= Math.ceil((miny + span) / (CELL * 5)); b++) g.fillRect(0, py(b * CELL * 5) - Math.max(3, 16 * k) / 2, N, Math.max(3, 16 * k));
    return c;
  }
  function paintTile(url) {
    var q = new URL(url).searchParams, bbox = (q.get('bbox') || q.get('BBOX') || '0,0,1,1').split(',').map(Number);
    var c = drawTile(bbox[0], bbox[1], bbox[2] - bbox[0]);
    return new Promise(function (resolve) {
      c.toBlob(function (blob) { resolve(new Response(blob, { status: 200, headers: { 'Content-Type': 'image/png' } })); }, 'image/png');
    });
  }
  // The app asks for its base map through this hook when it exists (see
  // utils/basemap.js): the real one needs servers this page cannot reach.
  window.__lavizBasemap = function (L, map) {
    var Grid = L.GridLayer.extend({
      createTile: function (coords) {
        var world = 40075016.68, size = world / Math.pow(2, coords.z);
        var minx = -world / 2 + coords.x * size, maxy = world / 2 - coords.y * size;
        return drawTile(minx, maxy - size, size);
      }
    });
    return new Grid({ maxZoom: 19, tileSize: 256 }).addTo(map);
  };
  var realFetch = window.fetch;
  window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || '';
    if (u.indexOf('https://nominatim.openstreetmap.org/') === 0) {
      var nu = new URL(u);
      if (nu.pathname === '/search') {
        var term = (nu.searchParams.get('q') || '').trim();
        return Promise.resolve(jsonResponse(PLACES.filter(function (p) { return p.title.indexOf(term) !== -1; }).map(function (p) {
          return { name: p.title, display_name: p.title + '، قائن', lat: String(p.lat), lon: String(p.lng), address: { road: p.title, city: 'قائن' } };
        })));
      }
      if (nu.pathname === '/reverse') {
        var rla = +nu.searchParams.get('lat'), rlo = +nu.searchParams.get('lon'), nb = PLACES[0], nd = 1e9;
        PLACES.forEach(function (p) { var d = Math.hypot(p.lat - rla, p.lng - rlo); if (d < nd) { nd = d; nb = p; } });
        return Promise.resolve(jsonResponse({ display_name: nb.title + '، قائن', address: { road: nb.title, city: 'قائن' } }));
      }
    }
    if (u.indexOf('https://map.ir/') !== 0) return realFetch.apply(this, arguments);
    if (u.indexOf('/shiveh/wms') !== -1) return paintTile(u);
    var url = new URL(u);
    if (url.pathname.indexOf('/search') === 0) {
      var text = (url.searchParams.get('text') || '').trim();
      var hits = PLACES.filter(function (p) { return p.title.indexOf(text) !== -1; }).map(function (p) {
        return { title: p.title, address: p.title.indexOf('مشهد') !== -1 ? p.title : 'قائن، ' + p.title, geom: { coordinates: [p.lng, p.lat] } };
      });
      return Promise.resolve(jsonResponse({ value: hits }));
    }
    if (url.pathname.indexOf('/reverse') === 0) {
      var la = +url.searchParams.get('lat'), lo = +url.searchParams.get('lon'), best = PLACES[0], bd = 1e9;
      PLACES.forEach(function (p) { var d = Math.hypot(p.lat - la, p.lng - lo); if (d < bd) { bd = d; best = p; } });
      return Promise.resolve(jsonResponse({ address: 'قائن، نزدیک ' + best.title }));
    }
    return Promise.resolve(new Response('{}', { status: 404 }));
  };
})();
