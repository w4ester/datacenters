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
  const city = esc(p[FIELDS.city] || '');
  const state = esc(p[FIELDS.state] || '');
  const loc = [city, state].filter(Boolean).join(', ');
  const url = p[FIELDS.url];
  const id = p.id;

  // Build action buttons
  let actions = '';

  if (url) {
    actions += `<a href="${encodeURI(url)}" target="_blank" rel="noopener" class="popup-btn popup-btn-primary">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <path d="M15 3h6v6"/><path d="M10 14L21 3"/>
      </svg>
      Visit Website
    </a>`;
  }

  // Add careers button (links to jobs.json data if available)
  if (id && operator) {
    actions += `<a href="#" onclick="window.showCareers('${id}', '${operator.replace(/'/g, "\\'")}', '${city}', '${state}'); return false;" class="popup-btn popup-btn-secondary">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
      View Jobs
    </a>`;
  }

  return `
    <div class="popup-header">
      <h3>${name}</h3>
      <span class="popup-status status-${status.toLowerCase().replace(/\s+/g, '-')}">${status}</span>
    </div>
    <div class="popup-body">
      <div class="popup-grid">
        <div class="popup-item">
          <span class="popup-label">Operator</span>
          <span class="popup-value">${operator}</span>
        </div>
        <div class="popup-item">
          <span class="popup-label">Capacity</span>
          <span class="popup-value">${capStr}</span>
        </div>
        <div class="popup-item">
          <span class="popup-label">Water Stress</span>
          <span class="popup-value popup-water-${ws.toLowerCase().replace(/\s+/g, '-')}">${ws}</span>
        </div>
        <div class="popup-item">
          <span class="popup-label">Location</span>
          <span class="popup-value">${loc || '—'}</span>
        </div>
      </div>
      ${actions ? `<div class="popup-actions">${actions}</div>` : ''}
    </div>
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

// --- Career/Jobs integration ---
window.showCareers = function(id, operator, city, state) {
  // Load jobs.json if not already loaded
  if (!window.jobsData) {
    fetch('data/jobs.json')
      .then(r => r.json())
      .then(data => {
        window.jobsData = data;
        displayCareers(id, operator, city, state);
      })
      .catch(err => {
        console.error('Failed to load jobs data', err);
        alert('Job data not available at this time.');
      });
  } else {
    displayCareers(id, operator, city, state);
  }
};

function displayCareers(id, operator, city, state) {
  const jobInfo = window.jobsData && window.jobsData[id];

  if (!jobInfo) {
    alert(`No job data available for ${operator} in ${city}, ${state}`);
    return;
  }

  let message = `Careers at ${operator} - ${city}, ${state}\n\n`;

  if (jobInfo.career_page) {
    message += `Company Careers Page:\n${jobInfo.career_page}\n\n`;
  }

  if (jobInfo.aggregator_urls) {
    message += 'Job Search Links:\n';
    if (jobInfo.aggregator_urls.linkedin) message += `LinkedIn: ${jobInfo.aggregator_urls.linkedin}\n`;
    if (jobInfo.aggregator_urls.indeed) message += `Indeed: ${jobInfo.aggregator_urls.indeed}\n`;
    if (jobInfo.aggregator_urls.glassdoor) message += `Glassdoor: ${jobInfo.aggregator_urls.glassdoor}\n`;
  }

  // Open the first available link
  const firstLink = jobInfo.career_page ||
                   (jobInfo.aggregator_urls && jobInfo.aggregator_urls.linkedin) ||
                   (jobInfo.aggregator_urls && jobInfo.aggregator_urls.indeed);

  if (firstLink && confirm(message + '\n\nOpen career page?')) {
    window.open(firstLink, '_blank');
  }
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
