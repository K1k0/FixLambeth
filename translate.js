exports.handler = async (event) => {
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}?maxRecords=200&sort[0][field]=Date&sort[0][direction]=desc`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` } }
    );

    const data = await res.json();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data.records || [])
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
