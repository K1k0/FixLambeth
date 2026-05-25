export async function translateToEnglish(text) {
  const res = await fetch('/.netlify/functions/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  const data = await res.json()
  return data.translated || text
}

export async function saveReport(fields) {
  const res = await fetch('/.netlify/functions/save-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields)
  })
  const data = await res.json()
  if (!res.ok) console.error('Save error:', data)
  return data
}

export async function fetchReports() {
  const res = await fetch('/.netlify/functions/get-reports')
  if (!res.ok) throw new Error(`API returned ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function uploadPhoto(base64Data) {
  const res = await fetch('/.netlify/functions/upload-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo: base64Data })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}
