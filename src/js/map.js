import { fetchReports } from './api.js'
import { esc } from './utils.js'
import { getT, formatReportCount } from './i18n.js'

const ISSUE_COLOURS = {
  flytipping: '#c2683f',
  graffiti: '#c2683f',
  pothole: '#3f4d7a',
  drain: '#3f4d7a',
  streetlight: '#3f4d7a',
  tree: '#4f7a5e',
  noise: '#9a7a3f',
  asb: '#9a7a3f',
}

let map = null

// Deterministic per-report offset (~±100m) so a pin doesn't wander between
// page loads, while still not pinpointing an exact address.
function stableJitter(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const a = ((h >>> 0) % 10000) / 10000
  const b = ((Math.imul(h, 48271) >>> 0) % 10000) / 10000
  return [(a - 0.5) * 0.002, (b - 0.5) * 0.002]
}

function setReportCount(text) {
  const el = document.getElementById('report-count')
  if (el) el.textContent = text
}

// With no reports the legend describes nothing, so swap it for a real empty
// state that offers the one useful action.
export function setMapEmptyState(isEmpty) {
  const empty = document.getElementById('map-empty')
  const legend = document.getElementById('map-legend')
  const count = document.getElementById('report-count')
  if (empty) empty.hidden = !isEmpty
  if (legend) legend.hidden = isEmpty
  if (count) count.hidden = isEmpty
}

function getColour(issue) {
  const key = Object.keys(ISSUE_COLOURS).find(k => issue && issue.toLowerCase().includes(k))
  return key ? ISSUE_COLOURS[key] : '#3f4d7a'
}

async function geocodePostcode(postcode) {
  if (!postcode) return null
  try {
    const clean = postcode.trim().replace(/\s+/g, '')
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`)
    const data = await res.json()
    if (data.status === 200 && data.result) {
      return [data.result.latitude, data.result.longitude]
    }
  } catch (e) {}
  return null
}

export async function initMap() {
  if (map) {
    map.invalidateSize()
    return
  }

  const mapEl = document.getElementById('map')
  if (!mapEl) return

  try {
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded')
      return
    }

    if (mapEl.offsetWidth === 0 || mapEl.offsetHeight === 0) {
      requestAnimationFrame(() => initMap())
      return
    }

    map = L.map('map').setView([51.462, -0.120], 12)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    let records = []
    let loadFailed = false
    try {
      records = await fetchReports()
    } catch (e) {
      // Distinguish "nothing to show" from "couldn't ask" — reporting a failed
      // load as an empty map hides a broken backend behind a friendly message.
      loadFailed = true
      console.warn('Could not fetch reports:', e)
    }

    let placed = 0

    for (const r of records) {
      const f = r.fields || r

      let latlng = null
      if (f.Lat && f.Lng) {
        latlng = [parseFloat(f.Lat), parseFloat(f.Lng)]
      } else if (f.Postcode) {
        latlng = await geocodePostcode(f.Postcode)
      }

      if (!latlng) continue

      const jitter = stableJitter(String(r.id || f.Postcode || placed))
      const colour = getColour(f['Issue Type'] || '')

      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div class="pin-halo" style="background:${colour}; opacity:0.15;"></div>
               <div class="pin-dot" style="background:${colour};"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      L.marker([latlng[0] + jitter[0], latlng[1] + jitter[1]], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="map-popup">
            <strong>${esc(f['Issue Type'] || 'Issue')}</strong><br>
            ${esc(f.Location || f.Postcode || '')}<br>
            ${f.Description ? '<em>' + esc(f.Description.substring(0, 120)) + (f.Description.length > 120 ? '...' : '') + '</em><br>' : ''}
            <span class="popup-meta">${esc(f.Status || 'Open')} · ${esc(f.Language || '')}</span>
          </div>
        `)
      placed++
    }

    if (loadFailed) {
      setMapEmptyState(false)
      setReportCount(getT().mapCountError || 'Could not load reports')
      return
    }

    const countEl = document.getElementById('report-count')
    if (countEl) countEl.dataset.count = String(placed)
    setReportCount(formatReportCount(placed))
    setMapEmptyState(placed === 0)
  } catch (e) {
    console.error('Map load failed:', e)
    setMapEmptyState(false)
    setReportCount(getT().mapCountError || 'Could not load reports')
  }
}
