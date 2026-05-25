import { fetchReports } from './api.js'
import { esc } from './utils.js'

const ISSUE_COLOURS = {
  flytipping: '#e84855',
  graffiti: '#e84855',
  pothole: '#5b2be8',
  drain: '#5b2be8',
  streetlight: '#f7c59f',
  tree: '#2ec4b6',
  noise: '#ff9f1c',
  asb: '#ff9f1c',
}

let map = null
let L = null

function getColour(issue) {
  const key = Object.keys(ISSUE_COLOURS).find(k => issue && issue.toLowerCase().includes(k))
  return key ? ISSUE_COLOURS[key] : '#5b2be8'
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

  const spinner = document.getElementById('map-spinner')
  if (spinner) spinner.style.display = 'flex'

  try {
    L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')

    map = L.map('map').setView([51.462, -0.120], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
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

      L.circleMarker(
        [latlng[0] + jitter[0], latlng[1] + jitter[1]],
        { radius: 9, fillColor: colour, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.88 }
      ).addTo(map).bindPopup(`
        <strong>${esc(f['Issue Type'] || 'Issue')}</strong><br>
        📍 ${esc(f.Location || f.Postcode || '')}<br>
        ${f.Description ? '<em>' + esc(f.Description.substring(0, 120)) + (f.Description.length > 120 ? '...' : '') + '</em><br>' : ''}
        <span style="color:#7a7589;font-size:11px">${esc(f.Status || 'Open')} · ${esc(f.Language || '')}</span>
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

  if (spinner) spinner.style.display = 'none'
}
