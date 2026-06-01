const { getStore } = require('@netlify/blobs')

const ALLOWED_ORIGINS = ['https://fixlambeth.co.uk', 'https://www.fixlambeth.co.uk', 'https://fixlambeth.netlify.app']

const ALLOWED_FIELDS = ['Issue Type', 'Location', 'Postcode', 'Description', 'Language', 'Date']
const FIELD_MAX_LENGTHS = {
  'Issue Type': 100,
  Location: 200,
  Postcode: 10,
  Description: 2000,
  Language: 5,
  Date: 20,
}
const VALID_ISSUE_TYPES = [
  'Fly-tipping & dumped rubbish',
  'Pothole / Pavement damage',
  'Broken or faulty streetlight',
  'Graffiti',
  'Noise nuisance',
  'Blocked drain or manhole',
  'Dangerous or overhanging tree',
  'Anti-social behaviour',
]

const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW = 3600000
const crypto = require('crypto')

function getBlobStore(name) {
  return getStore({
    name,
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN,
  })
}

async function checkRateLimit(ip) {
  const store = getBlobStore('rate-limits')
  const key = `rl_save_${crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)}`
  const now = Date.now()
  const existing = await store.get(key)
  let data = existing ? JSON.parse(existing) : { count: 0, resetAt: now + RATE_LIMIT_WINDOW }
  if (now > data.resetAt) {
    data = { count: 1, resetAt: now + RATE_LIMIT_WINDOW }
  } else {
    data.count++
  }
  await store.set(key, JSON.stringify(data))
  return { allowed: data.count <= RATE_LIMIT_MAX, remaining: Math.max(0, RATE_LIMIT_MAX - data.count) }
}

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

  const rateLimit = await checkRateLimit(event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown')
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: { ...corsHeaders, 'Retry-After': '3600' },
      body: JSON.stringify({ error: 'Too many requests. Try again later.' }),
    }
  }

  try {
    const raw = JSON.parse(event.body)
    const fields = {}
    for (const key of ALLOWED_FIELDS) {
      if (raw[key] !== undefined) {
        fields[key] = String(raw[key]).trim().slice(0, FIELD_MAX_LENGTHS[key])
      }
    }

    if (!fields['Issue Type'] || !fields.Location || !fields.Description) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    if (!VALID_ISSUE_TYPES.includes(fields['Issue Type'])) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid issue type' }) }
    }

    const coords = await geocodePostcode(fields.Postcode)
    if (coords) {
      fields.Lat = coords.lat
      fields.Lng = coords.lng
    }

    fields.Status = 'Open'

    const store = getBlobStore('reports')
    const key = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    await store.set(key, JSON.stringify({ id: key, fields }))

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, id: key }),
    }
  } catch (err) {
    console.error('Save-report error:', err)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
