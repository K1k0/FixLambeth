import en from '../i18n/en.json'
import pt from '../i18n/pt.json'
import es from '../i18n/es.json'
import ar from '../i18n/ar.json'
import pl from '../i18n/pl.json'

const allTranslations = { en, pt, es, ar, pl }
let lang = 'en'

export function getLang() {
  return lang
}

export function getT() {
  return allTranslations[lang]
}

export function setLang(l, currentIssueKey) {
  lang = l
  const t = allTranslations[l]
  document.documentElement.lang = l
  document.documentElement.dir = t.dir

  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase() === l)
  })

  document.getElementById('hero-eyebrow').textContent = t.heroEyebrow
  document.getElementById('hero-title').innerHTML = t.heroTitle
  document.getElementById('hero-sub').textContent = t.heroSub
  document.getElementById('tab-report').textContent = t.tabReport
  document.getElementById('tab-map').textContent = t.tabMap
  document.getElementById('s1-heading').textContent = t.s1Heading
  document.getElementById('s1-sub').textContent = t.s1Sub
  document.getElementById('s2-heading').textContent = t.s2Heading
  document.getElementById('s2-sub').textContent = t.s2Sub
  document.getElementById('label-location').textContent = t.labelLocation
  document.getElementById('label-postcode').textContent = t.labelPostcode
  document.getElementById('label-desc').textContent = t.labelDesc
  document.getElementById('label-when').textContent = t.labelWhen
  document.getElementById('label-name').textContent = t.labelName
  document.getElementById('label-photo').textContent = t.labelPhoto
  document.getElementById('photo-label-text').textContent = t.photoLabelText
  document.getElementById('btn-next-text').textContent = t.btnNext
  document.getElementById('btn-back-1').textContent = t.btnBack
  document.getElementById('btn-restart').textContent = t.btnRestart
  document.getElementById('confirm-title').textContent = t.confirmTitle
  document.getElementById('confirm-sub').textContent = t.confirmSub
  document.getElementById('btn-email-text').textContent = t.btnEmail
  document.getElementById('status-note').textContent = t.statusNote
  document.getElementById('map-title').textContent = t.mapTitle

  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t')
    if (t.issueLabels && t.issueLabels[key]) el.textContent = t.issueLabels[key]
  })

  const chip = document.getElementById('selected-chip')
  if (chip && currentIssueKey && t.issueLabels[currentIssueKey]) {
    chip.textContent = '● ' + t.issueLabels[currentIssueKey]
  }
}

export function getIssueEn(key) {
  return en.issues[key] || key
}
