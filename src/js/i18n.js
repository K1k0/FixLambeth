import en from '../i18n/en.json'
import pt from '../i18n/pt.json'
import es from '../i18n/es.json'
import ar from '../i18n/ar.json'
import pl from '../i18n/pl.json'

const allTranslations = { en, pt, es, ar, pl }
let lang = 'en'

const ISSUE_ICONS = {
  flytipping: 'trash-2',
  pothole: 'traffic-cone',
  streetlight: 'lightbulb',
  graffiti: 'spray-can',
  noise: 'volume-2',
  drain: 'droplets',
  tree: 'trees',
  asb: 'shield-alert',
}

export function getLang() {
  return lang
}

export function getT() {
  return allTranslations[lang]
}

function issueSVG(key, size = 14) {
  const paths = {
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    'trash-2': '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="m10 11 4 4"/><path d="m14 11-4 4"/>',
    'traffic-cone': '<path d="M10.27 2.31a1 1 0 0 1 1.46 0l2 2.5a1 1 0 0 1-.73 1.69h-3.46a1 1 0 0 1-.73-1.69l1.46-1.5z"/><path d="M5.5 10.5L12 22l6.5-11.5a1 1 0 0 0-.87-1.5H6.37a1 1 0 0 0-.87 1.5z"/><circle cx="12" cy="9" r="1"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'spray-can': '<path d="M12 2c-1.5 2-3 4-3 6a3 3 0 0 0 6 0c0-2-1.5-4-3-6z"/><path d="M12 8v4"/><path d="M9 16h6"/><path d="M10 20h4"/>',
    'volume-2': '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    'droplets': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    'trees': '<path d="M17 14h3l-3.5-3.5a1 1 0 0 0-1.4 0L12 13.6l-1.6-1.6a1 1 0 0 0-1.4 0L5.5 15.5H9l-2 3h10l-2-3z"/><path d="M12 14v7"/><path d="M8 21h8"/>',
    'shield-alert': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m15 11-1 4"/><circle cx="12" cy="15" r="1"/>',
  }
  const d = paths[key] || ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
}

export function setLang(l, currentIssueKey) {
  lang = l
  const t = allTranslations[l]
  document.documentElement.lang = l
  document.documentElement.dir = t.dir

  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-lang') === l)
  })

  const langCurrent = document.querySelector('.lang-current')
  if (langCurrent) langCurrent.textContent = l.toUpperCase()

  // Nav items
  const navReportSpan = document.querySelector('#tab-report span')
  if (navReportSpan) navReportSpan.textContent = t.navReport
  const navMapSpan = document.querySelector('#tab-map span')
  if (navMapSpan) navMapSpan.textContent = t.navMap

  // Hero inline
  document.getElementById('hero-eyebrow').textContent = t.heroEyebrow
  document.getElementById('hero-title').textContent = t.heroTitle
  document.getElementById('hero-sub').textContent = t.heroSub

  // Step label
  const stepLabel = document.querySelector('.step-label')
  if (stepLabel) {
    const activeStep = document.querySelector('.step.active')
    let n = 1
    if (activeStep) {
      if (activeStep.id === 's2') n = 2
      else if (activeStep.id === 's3') n = 3
    }
    stepLabel.textContent = (t.stepLabel || 'Step {n} of 3').replace('{n}', n)
  }

  // Progress bar (update label when step changes)
  updateProgressLabel(t)

  // Headings
  document.getElementById('s1-heading').textContent = t.s1Heading
  document.getElementById('s1-sub').textContent = t.s1Sub
  document.getElementById('s2-heading').textContent = t.s2Title || t.s2Heading
  document.getElementById('s2-sub').textContent = t.s2Sub
  document.getElementById('confirm-title').textContent = t.s3Title || t.confirmTitle
  document.getElementById('confirm-sub').textContent = t.s3Sub || t.confirmSub

  // Fields
  document.getElementById('label-location').textContent = t.labelLocation
  document.getElementById('label-postcode').textContent = t.labelPostcode
  document.getElementById('label-desc').textContent = t.labelDesc
  document.getElementById('label-when').textContent = t.labelWhen
  document.getElementById('label-name').textContent = t.labelName
  document.getElementById('label-photo').textContent = t.labelPhoto
  document.getElementById('photo-label-text').textContent = t.photoAdd || t.photoLabelText

  // Buttons
  document.getElementById('btn-next-text').textContent = t.btnPrepare || t.btnNext
  const btnContinueText = document.getElementById('btn-continue-text')
  if (btnContinueText) btnContinueText.textContent = t.btnContinue || 'Continue'
  const backBtn = document.getElementById('btn-back-1')
  if (backBtn) {
    backBtn.innerHTML = `${issueSVG('arrow-left', 18)} ${t.back || 'Back'}`
  }
  const restartBtn = document.getElementById('btn-restart')
  if (restartBtn) {
    restartBtn.innerHTML = `${issueSVG('rotate-ccw', 16)} ${t.reportAnother || 'Report another issue'}`
  }
  document.getElementById('btn-email-text').textContent = t.btnOpenEmail || t.btnEmail

  const copyPromptText = document.getElementById('copy-prompt-text')
  if (copyPromptText) copyPromptText.textContent = t.copyPrompt || 'Button not working? Copy the text'

  const infoNoteText = document.getElementById('info-note-text')
  if (infoNoteText) infoNoteText.innerHTML = t.infoNote || 'Your report has been added to the <strong>Lambeth reports map</strong> so neighbours can see it too.'

  // Status note
  document.getElementById('status-note').textContent = t.statusNote

  // Map
  document.getElementById('map-title').textContent = t.mapTitle
  const mapEyebrow = document.querySelector('.map-eyebrow')
  if (mapEyebrow) mapEyebrow.textContent = t.communityEyebrow || 'COMMUNITY'
  const recentLabel = document.querySelector('.recent-label')
  if (recentLabel) recentLabel.textContent = t.recentReports || 'RECENT REPORTS'

  // Issue cards
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t')
    if (t.issueLabels && t.issueLabels[key]) el.textContent = t.issueLabels[key]
  })

  // Reassurance row
  const noAccount = document.getElementById('reassure-no-account')
  const languages = document.getElementById('reassure-languages')
  const timeEl = document.getElementById('reassure-time')
  if (noAccount && languages && timeEl) {
    const updateReassurance = (el, text) => {
      const textNode = Array.from(el.childNodes).find(n => n.nodeType === Node.TEXT_NODE)
      if (textNode) textNode.textContent = ' ' + text
    }
    updateReassurance(noAccount, t.reassureNoAccount || 'No account')
    updateReassurance(languages, t.reassureLanguages || '5 languages')
    updateReassurance(timeEl, t.reassureTime || '~1 min')
  }

  // Selected chip
  updateChip(currentIssueKey, t)
}

function updateProgressLabel(t) {
  const stepLabel = document.querySelector('.step-label')
  if (!stepLabel) return
  const activeStep = document.querySelector('.step.active')
  let n = 1
  if (activeStep) {
    if (activeStep.id === 's2') n = 2
    else if (activeStep.id === 's3') n = 3
  }
  stepLabel.textContent = (t.stepLabel || 'Step {n} of 3').replace('{n}', n)
}

function updateChip(key, t) {
  const chip = document.getElementById('selected-chip')
  if (!chip || !key) return
  const label = t.issueLabels?.[key] || key
  const iconKey = ISSUE_ICONS[key]
  chip.innerHTML = `<span class="chip-icon">${issueSVG(iconKey, 14)}</span><span>${label}</span>`
}

export function getIssueEn(key) {
  return en.issues[key] || key
}

export { ISSUE_ICONS, issueSVG }
