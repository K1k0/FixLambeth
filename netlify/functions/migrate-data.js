const { getStore } = require('@netlify/blobs')

const ALLOWED_ORIGINS = ['https://fixlambeth.co.uk', 'https://www.fixlambeth.co.uk', 'https://fixlambeth.netlify.app']

async function geocodePostcode(postcode) {
  if (!postcode) return null
  try {
    const clean = postcode.trim().replace(/\s+/g, '')
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`)
    const data = await res.json()
    if (data.status === 200 && data.result) {
      return { lat: data.result.latitude.toFixed(6), lng: data.result.longitude.toFixed(6) }
    }
  } catch (e) {
    console.error('Geocode failed:', e)
  }
  return null
}

async function fetchAirtablePage(offset) {
  const token = process.env.AIRTABLE_TOKEN
  const base = process.env.AIRTABLE_BASE
  const table = process.env.AIRTABLE_TABLE
  let url = `https://api.airtable.com/v0/${base}/${table}?maxRecords=100&sort[0][field]=Date&sort[0][direction]=desc`
  if (offset) url += `&offset=${offset}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Airtable fetch failed')
  return data
}

exports.handler = async (event) => {
  const origin = event.headers.origin || ''
  const corsHeaders = ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {}

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { ...corsHeaders, 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const store = getStore('reports')
    let totalMigrated = 0
    let offset = null

    do {
      const page = await fetchAirtablePage(offset)
      for (const record of page.records) {
        const fields = { ...record.fields }

        if (!fields.Lat || !fields.Lng) {
          const coords = await geocodePostcode(fields.Postcode)
          if (coords) {
            fields.Lat = coords.lat
            fields.Lng = coords.lng
          }
        }

        if (!fields.Status) fields.Status = 'Open'

        const key = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
        await store.set(key, JSON.stringify({ id: key, fields }))
        totalMigrated++
      }
      offset = page.offset
    } while (offset)

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, migrated: totalMigrated }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
