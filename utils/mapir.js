// Search and address lookup only; the map picture itself comes from
// utils/basemap.js and needs no key. With a map.ir key set, map.ir answers
// search and lookup (better Persian data); without one, Nominatim does.
const MAPIR_BASE = 'https://map.ir';

export const DEFAULT_MAP_CENTER = {
  lat: 33.733,
  lng: 59.188,
  label: 'قائن',
  address: 'قائن، بلوار بسیج، خیابان بصیرت — رستوران لاویز',
};

export function getMapirApiKey() {
  return process.env.MAP_IR_API_KEY || process.env.VUE_APP_MAP_IR_API_KEY || '';
}

export function mapirHeaders() {
  const key = getMapirApiKey();
  return key ? { 'x-api-key': key } : {};
}

export async function mapirReverse(lat, lng) {
  const key = getMapirApiKey();
  if (!key) return nominatimReverse(lat, lng);

  const url = `${MAPIR_BASE}/reverse/?lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { 'x-api-key': key } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.address || data.formatted_address || null;
}

export async function mapirSearch(text, lat, lng) {
  const key = getMapirApiKey();
  if (!text || text.trim().length < 2) return [];
  if (!key) return nominatimSearch(text.trim(), lat, lng);

  const params = new URLSearchParams({ text: text.trim() });
  if (lat != null && lng != null) {
    params.set('lat', String(lat));
    params.set('lon', String(lng));
  }

  const url = `${MAPIR_BASE}/search/v2/?${params.toString()}`;
  const res = await fetch(url, { headers: { 'x-api-key': key } });
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.value || data.results || [];
  return items.map((item) => {
    let itemLat = item.lat;
    let itemLng = item.lon;
    if (item.geom && item.geom.coordinates) {
      itemLng = item.geom.coordinates[0];
      itemLat = item.geom.coordinates[1];
    } else if (item.location) {
      itemLat = item.location.y ?? item.location.lat;
      itemLng = item.location.x ?? item.location.lon;
    }
    return {
      title: item.title || item.address || '',
      address: item.address || item.title || '',
      lat: itemLat,
      lng: itemLng,
    };
  }).filter((x) => x.lat != null && x.lng != null);
}

export function formatSearchLabel(item) {
  return item.title && item.address && item.title !== item.address
    ? `${item.title} — ${item.address}`
    : (item.address || item.title);
}


// ---- Address search and lookup without an account -------------------------
// With no map.ir key the app uses Nominatim (OpenStreetMap's own geocoder):
// free, no key. Its policy allows light use only (about one request a second,
// no bulk), which suits a customer typing an address. Requests are therefore
// spaced out here.
const NOMINATIM = 'https://nominatim.openstreetmap.org';
let nominatimQueue = Promise.resolve();

function nominatimGet(path) {
  const run = nominatimQueue.then(async () => {
    const res = await fetch(`${NOMINATIM}${path}`, { headers: { 'Accept-Language': 'fa' } });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    return res.json();
  });
  // The next request waits at least 1.1 s after this one starts, win or lose.
  nominatimQueue = new Promise((resolve) => setTimeout(resolve, 1100)).then(() => run.catch(() => {}));
  return run;
}

// "خیابان بصیرت، محله ...، قائن" from Nominatim's address parts.
function shortAddress(item) {
  const a = item.address || {};
  const parts = [
    a.road || a.pedestrian || a.footway,
    a.neighbourhood || a.suburb || a.quarter,
    a.city || a.town || a.village || a.county,
  ].filter(Boolean);
  return parts.length ? parts.join('، ') : (item.display_name || '');
}

export async function nominatimReverse(lat, lng) {
  const q = new URLSearchParams({
    format: 'jsonv2', lat: String(lat), lon: String(lng), zoom: '18', addressdetails: '1', 'accept-language': 'fa',
  });
  const data = await nominatimGet(`/reverse?${q.toString()}`);
  if (!data || data.error) return null;
  return shortAddress(data) || null;
}

export async function nominatimSearch(text, lat, lng) {
  const q = new URLSearchParams({
    format: 'jsonv2', q: text, limit: '8', addressdetails: '1', 'accept-language': 'fa', countrycodes: 'ir',
  });
  if (lat != null && lng != null) {
    // A box around the restaurant ranks nearby places first (not a hard limit).
    const d = 0.5;
    q.set('viewbox', `${Number(lng) - d},${Number(lat) + d},${Number(lng) + d},${Number(lat) - d}`);
  }
  const data = await nominatimGet(`/search?${q.toString()}`);
  return (Array.isArray(data) ? data : []).map((item) => ({
    title: item.name || (item.display_name || '').split('،')[0].split(',')[0],
    address: shortAddress(item),
    lat: Number(item.lat),
    lng: Number(item.lon),
  })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));
}
