const { getStore } = require('@netlify/blobs')

const ALLOWED_ORIGINS = ['https://fixlambeth.co.uk', 'https://www.fixlambeth.co.uk', 'https://fixlambeth.netlify.app']
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

const RATE_LIMIT_MAX = 20
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
  const key = `rl_photo_${crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)}`
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

  let rateLimit = { allowed: true }
  try {
    rateLimit = await checkRateLimit(event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown')
  } catch (e) {
    // A rate-limit store outage must not stop photo uploads.
    console.error('Rate limit check failed, allowing request:', e)
  }
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: { ...corsHeaders, 'Retry-After': '3600' },
      body: JSON.stringify({ error: 'Too many uploads. Try again later.' }),
    }
  }

  try {
    const { photo } = JSON.parse(event.body)
    if (!photo) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No photo data provided' }) }
    }

    const matches = photo.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid photo format' }) }
    }

    const mime = matches[1]
    if (!ALLOWED_TYPES.includes(mime)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: `Unsupported image type: ${mime}` }) }
    }

    const raw = Buffer.from(matches[2], 'base64')
    if (raw.length > MAX_SIZE) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Photo too large (max 5MB)' }) }
    }

    const ext = mime.split('/')[1]
    const key = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    const store = getBlobStore('photos')
    await store.set(key, JSON.stringify({ mime, data: matches[2] }))

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ key }),
    }
  } catch (err) {
    console.error('Upload-photo error:', err)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Upload service unavailable' }) }
  }
}
