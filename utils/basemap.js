// The map picture behind every map in the app.
//
// OpenFreeMap (https://openfreemap.org): free, no account, no API key, no
// usage limits, OpenStreetMap data, and a clean "Liberty" style close to what
// people know from Google Maps. It is vector tiles, drawn with MapLibre GL;
// MapLibre sits inside Leaflet as a layer (maplibre-gl-leaflet), so markers,
// panning and the rest of the Leaflet code stay as they are.
//
// MapLibre is large, so it is loaded the first time a map is opened. If it
// cannot run (no WebGL) or the style cannot be fetched, the map falls back to
// plain OpenStreetMap raster tiles instead of showing an empty grey box.

export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// How long the style may take before the raster map takes over.
const STYLE_TIMEOUT_MS = 3000;

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

let glReady = null;

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

// Loads MapLibre (and its Leaflet bridge) once.
function loadGl() {
  if (!glReady) {
    glReady = Promise.all([
      import('maplibre-gl'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]).then(() => import('@maplibre/maplibre-gl-leaflet'));
  }
  return glReady;
}

// Labels in Persian where the data has them, otherwise the local name.
function preferPersianLabels(gl) {
  const apply = () => {
    const style = gl.getStyle();
    if (!style || !style.layers) return;
    style.layers.forEach((layer) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        gl.setLayoutProperty(layer.id, 'text-field', [
          'coalesce', ['get', 'name:fa'], ['get', 'name:nonlatin'], ['get', 'name'],
        ]);
      }
    });
  };
  if (gl.isStyleLoaded()) apply();
  else gl.once('styledata', apply);
}

function addRasterFallback(L, map) {
  return L.tileLayer(OSM_TILES, {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
}

/**
 * Puts the base map on a Leaflet map. Resolves with the layer that was added.
 * Never rejects: a failure ends in the raster fallback.
 */
export async function addBasemap(L, map, { style = BASEMAP_STYLE_URL } = {}) {
  if (typeof window === 'undefined') return null;
  // The static design preview runs where no outside server is reachable; it
  // supplies a stand-in picture here (dev-mock/preview-shim.template.js).
  if (typeof window.__lavizBasemap === 'function') return window.__lavizBasemap(L, map);
  if (!webglAvailable()) return addRasterFallback(L, map);
  try {
    await loadGl();
    if (!map._loaded && !map._container) return null; // the map was destroyed meanwhile
    const layer = L.maplibreGL({
      style,
      attributionControl: false,
      // Leaflet's own attribution control shows the credit.
    });
    layer.options.attribution =
      '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © ' +
      '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
      'data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
    layer.addTo(map);
    const gl = layer.getMaplibreMap();
    if (gl) {
      preferPersianLabels(gl);
      // If the style cannot be fetched (blocked, offline, or a connection that
      // just hangs, which filtered networks often do), show the raster map.
      const fallBack = () => {
        if (layer.__fellBack) return;
        layer.__fellBack = true;
        window.clearTimeout(timer);
        if (map.hasLayer(layer)) map.removeLayer(layer);
        addRasterFallback(L, map);
      };
      const timer = window.setTimeout(() => { if (!gl.isStyleLoaded()) fallBack(); }, STYLE_TIMEOUT_MS);
      gl.once('load', () => window.clearTimeout(timer));
      gl.on('error', () => { if (!gl.isStyleLoaded()) fallBack(); });
    }
    return layer;
  } catch (e) {
    return addRasterFallback(L, map);
  }
}
