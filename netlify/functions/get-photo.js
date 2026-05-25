const { getStore } = require('@netlify/blobs')

const ALLOWED_ORIGINS = ['https://fixlambeth.co.uk', 'https://www.fixlambeth.co.uk', 'https://fixlambeth.netlify.app']

function getBlobStore(name) {
  return getStore({
    name,
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_ACCESS_TOKEN,
  })
}

exports.handler = async (event) => {
  const origin = event.headers.origin || ''
  const corsHeaders = ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {}

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { ...corsHeaders, 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const key = event.queryStringParameters?.key
    if (!key) {
      return { statusCode: 400, headers: corsHeaders, body: 'Missing key parameter' }
    }

    const store = getBlobStore('photos')
    const blob = await store.get(key)
    if (!blob) {
      return { statusCode: 404, headers: corsHeaders, body: 'Photo not found' }
    }

    const { mime, data } = JSON.parse(blob)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...corsHeaders,
      },
      body: data,
      isBase64Encoded: true,
    }
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: err.message }
  }
}
