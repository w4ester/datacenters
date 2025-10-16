/* global L */
'use strict';

// --- Configurable field mapping for your data schema ---
const FIELDS = {
  name: 'name',
  operator: 'operator',
  status: 'status',          // "Existing" | "Permitted" | "Under Construction"
  capacityMW: 'capacity_mw', // number
  waterStress: 'water_stress', // "Low" | "Medium" | "High" | "Extremely High" | ""
  city: 'city',
  state: 'state',
  url: 'url'                 // optional
};

const state = {
  rawGeoJSON: null,
  clusterGroup: null
};

// --- Map init ---
const map = L.map('map', {
  minZoom: 3,
  worldCopyJump: true,
  scrollWheelZoom: true
}).setView([39.5, -98.5], 4);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
).addTo(map);

state.clusterGroup = L.markerClusterGroup({
  showCoverageOnHover: false,
  maxClusterRadius: 50,
  spiderfyOnMaxZoom: true
});
map.addLayer(state.clusterGroup);

// --- UI elements ---
const form = document.getElementById('filters');
const minMW = document.getElementById('minMW');
const minMWVal = document.getElementById('minMWVal');
const waterStress = document.getElementById('waterStress');
const searchInput = document.getElementById('q');
const fitBtn = document.getElementById('fitBtn');

minMW.addEventListener('input', () => {
  minMWVal.value = minMW.value;
  render();
});
form.addEventListener('change', render);
searchInput.addEventListener('input', debounce(render, 150));
document.getElementById('resetBtn').addEventListener('click', () => {
  // tiny delay so inputs reset visually before rerender
  setTimeout(() => {
    minMWVal.value = minMW.value;
    render();
  }, 0);
});
fitBtn.addEventListener('click', () => {
  const bounds = state.clusterGroup.getBounds();
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.08));
});

// --- Load data ---
fetch('data/datacenters.geojson')
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(geo => {
    state.rawGeoJSON = geo;
    minMWVal.value = minMW.value;
    render(true);
  })
  .catch(err => {
    console.error('Failed to load GeoJSON', err);
    alert('Failed to load data/datacenters.geojson. See console for details.');
  });

// --- Rendering ---
function render(fit=false) {
  if (!state.rawGeoJSON) return;

  // clear existing
  state.clusterGroup.clearLayers();

  // Build filtered layer
  const statuses = [...form.querySelectorAll('input[name="status"]:checked')].map(i => i.value);
  const q = (searchInput.value || '').trim().toLowerCase();
  const min = Number(minMW.value || 0);
  const ws = waterStress.value; // '' or value

  const layer = L.geoJSON(state.rawGeoJSON, {
    pointToLayer: (feature, latlng) => L.marker(latlng, {
      icon: dotIcon(feature.properties[FIELDS.status])
    }),
    filter: (feature) => {
      const p = feature.properties || {};
      // status
      if (statuses.length && !statuses.includes(p[FIELDS.status])) return false;
      // capacity
      const cap = Number(p[FIELDS.capacityMW] ?? 0);
      if (Number.isFinite(min) && cap < min) return false;
      // water stress
      if (ws && (p[FIELDS.waterStress] || '') !== ws) return false;
      // search
      if (q) {
        const hay = [
          p[FIELDS.name], p[FIELDS.operator], p[FIELDS.city], p[FIELDS.state]
        ].map(s => (s || '').toString().toLowerCase()).join(' ');
        if (!hay.includes(q)) return false;
      }
      return true;
    },
    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      layer.bindPopup(popupHTML(p), { className: 'popup' });
    }
  });

  state.clusterGroup.addLayer(layer);

  if (fit) {
    const bounds = state.clusterGroup.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.08));
  }
}

function popupHTML(p) {
  const name = esc(p[FIELDS.name] || 'Unnamed site');
  const operator = esc(p[FIELDS.operator] || '—');
  const status = esc(p[FIELDS.status] || '—');
  const cap = Number(p[FIELDS.capacityMW] ?? NaN);
  const capStr = Number.isFinite(cap) ? `${cap.toLocaleString()} MW` : '—';
  const ws = esc(p[FIELDS.waterStress] || '—');
  const loc = [p[FIELDS.city], p[FIELDS.state]].filter(Boolean).map(esc).join(', ');
  const url = p[FIELDS.url];

  return `
    <h3>${name}</h3>
    <ul class="meta">
      <li><strong>Operator:</strong> ${operator}</li>
      <li><strong>Status:</strong> ${status}</li>
      <li><strong>Capacity:</strong> ${capStr}</li>
      <li><strong>Water stress:</strong> ${ws}</li>
      <li><strong>Location:</strong> ${loc || '—'}</li>
      ${url ? `<li><a href="${encodeURI(url)}" target="_blank" rel="noopener">Learn more</a></li>` : ''}
    </ul>
  `;
}

// --- Marker icon helper (colored dot) ---
function dotIcon(status) {
  const cls =
    status === 'Existing' ? 'marker-existing' :
    status === 'Permitted' ? 'marker-permitted' :
    'marker-construction';

  return L.divIcon({
    html: `<span class="marker-dot ${cls}"></span>`,
    className: '', // remove default class
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7]
  });
}

// --- Small utils ---
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[c])
  );
}
function debounce(fn, ms=150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}
