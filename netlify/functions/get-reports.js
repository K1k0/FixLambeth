const { getStore } = require('@netlify/blobs')

const ALLOWED_ORIGINS = ['https://fixlambeth.co.uk', 'https://www.fixlambeth.co.uk', 'https://fixlambeth.netlify.app']

const FETCH_CONCURRENCY = 20
const MAX_RECORDS = 500

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

  try {
    const store = getBlobStore('reports')
    const { blobs } = await store.list()
    const records = []

    // Fetch in bounded-concurrency batches rather than one at a time.
    const entries = blobs || []
    for (let i = 0; i < entries.length; i += FETCH_CONCURRENCY) {
      const batch = entries.slice(i, i + FETCH_CONCURRENCY)
      const results = await Promise.all(batch.map(async (entry) => {
        try {
          const blob = await store.get(entry.key)
          return blob ? JSON.parse(blob) : null
        } catch (e) {
          console.error('Failed to read blob:', entry.key, e)
          return null
        }
      }))
      for (const r of results) {
        if (r) records.push(r)
      }
    }

    records.sort((a, b) => {
      const dateA = a.fields?.Date || ''
      const dateB = b.fields?.Date || ''
      return dateB.localeCompare(dateA)
    })

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
      body: JSON.stringify(records.slice(0, MAX_RECORDS)),
    }
  } catch (err) {
    console.error('Get-reports error:', err)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
