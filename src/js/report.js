import { getT, getLang, getIssueEn } from './i18n.js'
import { translateToEnglish, saveReport, uploadPhoto } from './api.js'
import { validatePostcode } from './utils.js'

export let selectedKey = ''
export let selectedEmail = ''
export let photoFile = null
export let photoUrl = ''
let currentEmail = ''
let currentSubject = ''
let currentBody = ''
let currentMailto = ''

export function setProgress(step) {
  ['ps1', 'ps2', 'ps3'].forEach((id, i) => {
    const el = document.getElementById(id)
    el.classList.remove('active', 'done')
    if (i + 1 < step) el.classList.add('done')
    if (i + 1 === step) el.classList.add('active')
  })
}

export function toStep1() {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById('s1').classList.add('active')
  setProgress(1)
  ;['inp-location', 'inp-postcode', 'inp-desc', 'inp-when', 'inp-name'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
  photoFile = null
  photoUrl = ''
  const preview = document.getElementById('photo-preview')
  if (preview) {
    preview.style.display = 'none'
    preview.src = ''
  }
}

export function toStep2(key, email) {
  selectedKey = key
  selectedEmail = email
  const t = getT()
  document.getElementById('selected-chip').textContent = '● ' + (t.issueLabels[key] || key)
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById('s2').classList.add('active')
  setProgress(2)
}

export async function toStep3() {
  const t = getT()
  const loc = document.getElementById('inp-location').value.trim()
  const postcode = document.getElementById('inp-postcode').value.trim()
  const desc = document.getElementById('inp-desc').value.trim()
  const when = document.getElementById('inp-when').value.trim()
  const name = document.getElementById('inp-name').value.trim()

  if (!loc || !desc) { alert(t.alertFill); return }
  if (postcode && !validatePostcode(postcode)) {
    document.getElementById('postcode-error').style.display = 'block'
    document.getElementById('inp-postcode').focus()
    return
  }

  const btn = document.getElementById('btn-next')
  btn.disabled = true
  btn.innerHTML = `<span class="spinner"></span> <span>${t.sending}</span>`

  let descEn = desc
  if (getLang() !== 'en') {
    try {
      descEn = await translateToEnglish(desc)
    } catch (e) {
      console.error('Translation failed, using original:', e)
    }
  }

  const issueEn = getIssueEn(selectedKey)
  currentSubject = `${issueEn} — ${loc}${postcode ? ', ' + postcode : ''}`
  currentBody = `Issue: ${issueEn}
Location: ${loc}${postcode ? '\nPostcode: ' + postcode : ''}
Description: ${descEn}${when ? '\nWhen noticed: ' + when : ''}${name ? '\nReported by: ' + name : ''}
${photoUrl ? '\nPhoto: ' + photoUrl : ''}

Sent via fixlambeth.co.uk`

  currentEmail = selectedEmail.replaceAll('%26', '&')
  currentMailto = `mailto:${currentEmail}?subject=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentBody)}`

  document.getElementById('confirm-email').textContent = `→ ${currentEmail}`
  document.getElementById('fallback-to').textContent = currentEmail
  document.getElementById('fallback-subject').textContent = currentSubject
  document.getElementById('fallback-body').textContent = currentBody

  let savedOk = false
  try {
    const fields = {
      'Issue Type': issueEn,
      'Location': loc,
      'Postcode': postcode || '',
      'Description': descEn,
      'Language': getLang().toUpperCase(),
      'Date': new Date().toLocaleDateString('en-GB'),
    }
    await saveReport(fields)
    savedOk = true
  } catch (e) {
    console.error('Save failed:', e)
  }

  document.getElementById('status-note').textContent = savedOk
    ? t.statusNote
    : 'Could not save to the map — but your email will still reach the council.'

  btn.disabled = false
  btn.innerHTML = `<span id="btn-next-text">${t.btnNext}</span> →`

  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById('s3').classList.add('active')
  setProgress(3)
}

export function sendEmail() {
  if (!currentMailto) return
  window.location.href = currentMailto
}

export function copyEmailBody() {
  const text = `To: ${currentEmail}\nSubject: ${currentSubject}\n\n${currentBody}`
  navigator.clipboard.writeText(text).then(() => {
    const ok = document.getElementById('copy-ok')
    ok.style.display = 'inline'
    setTimeout(() => ok.style.display = 'none', 2000)
  })
}

export async function handlePhoto(input) {
  if (input.files && input.files[0]) {
    photoFile = input.files[0]
    const reader = new FileReader()
    reader.onload = e => {
      const preview = document.getElementById('photo-preview')
      preview.src = e.target.result
      preview.style.display = 'block'
    }
    reader.readAsDataURL(photoFile)

    try {
      const reader2 = new FileReader()
      reader2.onload = async () => {
        const data = await uploadPhoto(reader2.result)
        if (data.key) {
          photoUrl = `${window.location.origin}/.netlify/functions/get-photo?key=${data.key}`
        }
      }
      reader2.readAsDataURL(photoFile)
    } catch (e) {
      console.error('Photo upload failed:', e)
    }
  }
}
