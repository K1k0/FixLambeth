import { getT, getLang, getIssueEn, getTeam, ISSUE_ICONS, issueSVG } from './i18n.js'
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
// Resolves once any in-flight photo upload has settled, so the email body
// never claims a photo that hasn't finished uploading.
let photoUploadPromise = Promise.resolve()
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
  // The hero introduces the whole flow, so it only belongs on step 1 —
  // otherwise it contradicts the screen while the user is mid-form.
  const hero = document.querySelector('.hero-inline')
  if (hero) hero.hidden = step !== 1

  // Keep the label with the bar — otherwise step 3 still reads "Step 2 of 3".
  const stepLabel = document.querySelector('.step-label')
  if (stepLabel) {
    const t = getT()
    stepLabel.textContent = (t.stepLabel || 'Step {n} of 3').replace('{n}', step)
  }
}

function setActiveCard(key) {
  document.querySelectorAll('.issue-card').forEach(c => {
    const on = c.dataset.key === key
    c.classList.toggle('selected', on)
    c.setAttribute('aria-checked', on ? 'true' : 'false')
    c.tabIndex = on ? 0 : -1
  })
}

// Announce the new step and move focus to its heading, so the change isn't
// silent for screen-reader and keyboard users.
function announceStep(headingId) {
  const heading = document.getElementById(headingId)
  const announcer = document.getElementById('step-announcer')
  if (announcer && heading) announcer.textContent = heading.textContent
  if (heading) heading.focus()
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
  photoUploadPromise = Promise.resolve()
  const photoInput = document.getElementById('photo-input')
  if (photoInput) photoInput.value = ''
  const preview = document.getElementById('photo-preview')
  if (preview) {
    preview.style.display = 'none'
    preview.src = ''
  }
  const area = document.getElementById('photo-upload-area')
  if (area) area.classList.remove('filled')
  setActiveCard('flytipping')
  announceStep('s1-heading')
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
  // The subtitle names the receiving team, so it must follow the selection —
  // not just the last language change.
  const sub = document.getElementById('s2-sub')
  if (sub) sub.textContent = (t.s2Sub || '').replace('{team}', getTeam(key))
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById('s2').classList.add('active')
  setProgress(2)
  announceStep('s2-heading')
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

  // Wait for any in-flight photo upload so the body reflects reality.
  await photoUploadPromise

  const issueEn = getIssueEn(selectedKey)
  const team = getTeam(selectedKey)

  currentSubject = `${issueEn} report — ${loc || 'Lambeth'}`
  currentBody = `Dear ${team} team,

I would like to report a ${issueEn.toLowerCase()} issue in Lambeth.

Location: ${loc || '—'}
Postcode: ${postcode || '—'}
When noticed: ${when || '—'}

Details:
${descEn || '—'}
${photoUrl ? `\nPhoto: ${photoUrl}\n` : ''}
Please could the relevant team look into this.

Kind regards,
${name || 'A Lambeth resident'}`

  currentEmail = decodeURIComponent(selectedEmail)
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
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`

  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById('s3').classList.add('active')
  setProgress(3)
  announceStep('confirm-title')
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

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export async function handlePhoto(input) {
  if (!input.files || !input.files[0]) return
  photoFile = input.files[0]
  photoUrl = ''
  const area = document.getElementById('photo-upload-area')
  const preview = document.getElementById('photo-preview')

  photoUploadPromise = (async () => {
    let dataUrl
    try {
      dataUrl = await readAsDataURL(photoFile)
    } catch (e) {
      console.error('Could not read photo:', e)
      showValidationMessage(getT().photoReadError || 'Could not read that photo.')
      return
    }

    if (preview) {
      preview.src = dataUrl
      preview.style.display = 'block'
    }
    if (area) area.classList.add('filled')

    try {
      const data = await uploadPhoto(dataUrl)
      if (data.key) {
        photoUrl = `${window.location.origin}/.netlify/functions/get-photo?key=${encodeURIComponent(data.key)}`
      }
    } catch (e) {
      // Non-fatal: the report still sends, just without a photo link.
      console.error('Photo upload failed:', e)
    }
  })()

  await photoUploadPromise
}
