import { fetchReports } from './api.js'
import { esc } from './utils.js'

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
let L = null

function getColour(issue) {
  const key = Object.keys(ISSUE_COLOURS).find(k => issue && issue.toLowerCase().includes(k))
  return key ? ISSUE_COLOURS[key] : '#3f4d7a'
}

async function geocodePostcode(postcode) {
  if (!postcode) return null
  try {
    const clean = postcode.trim().replace(/\s+/g, '')
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`)
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
    L = (await import('leaflet')).default

    map = L.map('map').setView([51.462, -0.120], 12)

    if (mapEl.offsetWidth === 0 || mapEl.offsetHeight === 0) {
      map.remove()
      map = null
      requestAnimationFrame(() => initMap())
      return
    }

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    const records = await fetchReports()
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

      const jitter = [(Math.random() - 0.5) * 0.002, (Math.random() - 0.5) * 0.002]
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

    document.getElementById('report-count').textContent = placed === 0
      ? 'No reports yet — be the first!'
      : `${placed} report${placed !== 1 ? 's' : ''}`
  } catch (e) {
    console.error('Map load failed:', e)
    document.getElementById('report-count').textContent = 'Could not load reports'
  }
}
