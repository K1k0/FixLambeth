import { getT, getLang, getIssueEn, ISSUE_ICONS, issueSVG } from './i18n.js'
import { translateToEnglish, saveReport, uploadPhoto } from './api.js'
import { validatePostcode } from './utils.js'

function showValidationMessage(msg) {
  let el = document.getElementById('validation-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'validation-toast'
    el.setAttribute('role', 'alert')
    el.setAttribute('aria-live', 'polite')
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--error,#d9534f);color:#fff;padding:12px 20px;border-radius:12px;font-family:var(--font-ui,system-ui);font-size:14px;font-weight:600;z-index:9999;max-width:90vw;text-align:center;'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.style.display = 'block'
  clearTimeout(el._timeout)
  el._timeout = setTimeout(() => el.style.display = 'none', 3000)
}

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

function setActiveCard(key) {
  document.querySelectorAll('.issue-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.key === key)
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
  const area = document.getElementById('photo-upload-area')
  if (area) area.classList.remove('filled')
  setActiveCard('flytipping')
}

export function toStep2(key, email) {
  selectedKey = key
  selectedEmail = email
  setActiveCard(key)
  const t = getT()
  const label = t.issueLabels?.[key] || key
  const iconKey = ISSUE_ICONS[key]
  const chip = document.getElementById('selected-chip')
  if (chip) {
    chip.innerHTML = `<span class="chip-icon">${issueSVG(iconKey, 14)}</span><span>${label}</span>`
  }
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

  if (!loc || !desc) { showValidationMessage(t.alertFill); return }
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
  const issueLabel = t.issueLabels?.[selectedKey] || selectedKey
  const team = issueEn.toLowerCase().includes('fly') || issueEn.toLowerCase().includes('graffiti') ? 'Environment'
    : issueEn.toLowerCase().includes('tree') ? 'Parks'
    : issueEn.toLowerCase().includes('noise') || issueEn.toLowerCase().includes('anti-social') ? 'Noise'
    : 'Highways'

  currentSubject = `${issueEn} report — ${loc || 'Lambeth'}`
  currentBody = `Dear ${team} team,

I would like to report a ${issueEn.toLowerCase()} issue in Lambeth.

Location: ${loc || '—'}
Postcode: ${postcode || '—'}
When noticed: ${when || '—'}

Details:
${descEn || '—'}
${photoUrl ? '\nA photo is attached to this email.' : ''}
Please could the relevant team look into this.

Kind regards,
${name || 'A Lambeth resident'}`

  currentEmail = selectedEmail.replaceAll('%26', '&')
  currentMailto = `mailto:${currentEmail}?subject=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentBody)}`

  document.getElementById('confirm-email').textContent = currentEmail
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
    ? t.mapNote || t.statusNote
    : 'Could not save to the map — but your email will still reach the council.'

  btn.disabled = false
  btn.innerHTML = `<span id="btn-next-text">${t.btnPrepare || t.btnNext}</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`

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
    if (ok) {
      ok.style.display = 'inline'
      setTimeout(() => ok.style.display = 'none', 1800)
    }
  })
}

export async function handlePhoto(input) {
  if (input.files && input.files[0]) {
    photoFile = input.files[0]
    const area = document.getElementById('photo-upload-area')
    const preview = document.getElementById('photo-preview')

    const reader = new FileReader()
    reader.onload = e => {
      preview.src = e.target.result
      preview.style.display = 'block'
      if (area) area.classList.add('filled')
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
