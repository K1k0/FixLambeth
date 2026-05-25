const { getStore } = require('@netlify/blobs')

const ALLOWED_ORIGINS = ['https://fixlambeth.co.uk', 'https://www.fixlambeth.co.uk', 'https://fixlambeth.netlify.app']

exports.handler = async (event) => {
  const origin = event.headers.origin || ''
  const corsHeaders = ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {}

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { ...corsHeaders, 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' }
  }

  try {
    const store = getStore('reports')
    const result = await store.list()
    const records = []

    for (const entry of result.blobs) {
      try {
        const blob = await store.get(entry.key)
        if (blob) {
          records.push(JSON.parse(blob))
        }
      } catch (e) {
        console.error('Failed to read blob:', entry.key, e)
      }
    }

    records.sort((a, b) => {
      const dateA = a.fields?.Date || ''
      const dateB = b.fields?.Date || ''
      return dateB.localeCompare(dateA)
    })

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(records),
    }
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) }
  }
}
