const { getStore } = require('@netlify/blobs')

const ALLOWED_ORIGINS = ['https://fixlambeth.co.uk', 'https://www.fixlambeth.co.uk', 'https://fixlambeth.netlify.app']

const RATE_LIMIT_MAX = 15
const RATE_LIMIT_WINDOW = 3600000
const crypto = require('crypto')

async function checkRateLimit(ip) {
  const store = getStore('rate-limits')
  const key = `rl_translate_${crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)}`
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

  const rateLimit = await checkRateLimit(event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown')
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: { ...corsHeaders, 'Retry-After': '3600' },
      body: JSON.stringify({ error: 'Too many translation requests. Try again later.' }),
    }
  }

  const GEMINI_KEY = process.env.GEMINI_KEY

  try {
    const { text } = JSON.parse(event.body)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Translate the following text to English. Return only the translation, nothing else:\n\n${text}` }],
          }],
        }),
      }
    )

    const data = await res.json()
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ translated }),
    }
  } catch (err) {
    console.error('Translate error:', err)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Translation service unavailable' }) }
  }
}
