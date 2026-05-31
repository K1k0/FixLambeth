import { setLang, getT } from './i18n.js'
import {
  selectedKey,
  toStep2,
  toStep3,
  toStep1,
  sendEmail,
  copyEmailBody,
  handlePhoto,
  setProgress,
} from './report.js'
import { initMap } from './map.js'
import { validatePostcode } from './utils.js'

function resetScroll() {
  const sc = document.querySelector('.scroll-container')
  if (sc) sc.scrollTop = 0
}

function updateStepLabel() {
  const t = getT()
  const stepLabel = document.querySelector('.step-label')
  if (!stepLabel) return
  const activeStep = document.querySelector('.step.active')
  let n = 1
  if (activeStep?.id === 's2') n = 2
  else if (activeStep?.id === 's3') n = 3
  stepLabel.textContent = (t.stepLabel || 'Step {n} of 3').replace('{n}', n)
}

function setActiveCard(key) {
  document.querySelectorAll('.issue-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.key === key)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const t = getT()

  // Language switching
  const langSwitcher = document.querySelector('.lang-switcher')
  const langPill = document.querySelector('.lang-pill')
  if (langPill && langSwitcher) {
    langPill.addEventListener('click', (e) => {
      e.stopPropagation()
      langSwitcher.classList.toggle('open')
    })
    document.addEventListener('click', () => {
      langSwitcher.classList.remove('open')
    })
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const l = btn.getAttribute('data-lang')
      setLang(l, selectedKey)
      if (langSwitcher) langSwitcher.classList.remove('open')
    })
  })

  // Tab navigation (bottom nav)
  const tabReport = document.getElementById('tab-report')
  const tabMap = document.getElementById('tab-map')

  tabReport.addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'))
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
    document.getElementById('content-report').classList.add('active')
    tabReport.classList.add('active')
    const anyActive = document.querySelector('#content-report .step.active')
    if (!anyActive) {
      document.getElementById('s1').classList.add('active')
      setProgress(1)
    }
    updateStepLabel()
    resetScroll()
  })

  tabMap.addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'))
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
    document.getElementById('content-map').classList.add('active')
    tabMap.classList.add('active')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initMap().catch(console.error)
      })
    })
    resetScroll()
  })

  // Issue card selection
  document.querySelectorAll('.issue-card').forEach(card => {
    card.addEventListener('click', () => {
      setActiveCard(card.dataset.key)
      toStep2(card.dataset.key, card.dataset.email)
      updateStepLabel()
      resetScroll()
    })
  })

  // Step 1 → Step 2 (Continue button)
  document.getElementById('btn-continue').addEventListener('click', () => {
    const activeCard = document.querySelector('.issue-card.selected')
    if (activeCard) {
      toStep2(activeCard.dataset.key, activeCard.dataset.email)
      updateStepLabel()
      resetScroll()
    }
  })

  // Step 2 → Step 3
  document.getElementById('btn-next').addEventListener('click', toStep3)

  // Back to Step 1
  document.getElementById('btn-back-1').addEventListener('click', () => {
    toStep1()
    updateStepLabel()
    resetScroll()
  })

  // Restart
  document.getElementById('btn-restart').addEventListener('click', () => {
    toStep1()
    setActiveCard('flytipping')
    updateStepLabel()
    resetScroll()
  })

  // Send email
  document.getElementById('email-btn').addEventListener('click', sendEmail)

  // Copy email body
  document.getElementById('copy-btn').addEventListener('click', copyEmailBody)

  // Photo upload
  document.getElementById('photo-upload-area').addEventListener('click', () => {
    document.getElementById('photo-input').click()
  })

  // Postcode validation
  document.getElementById('inp-postcode').addEventListener('blur', () => {
    const val = document.getElementById('inp-postcode').value.trim()
    const err = document.getElementById('postcode-error')
    if (val && !validatePostcode(val)) {
      err.style.display = 'block'
    } else {
      err.style.display = 'none'
    }
  })

  document.getElementById('inp-postcode').addEventListener('input', () => {
    document.getElementById('postcode-error').style.display = 'none'
  })

  // Photo input
  document.getElementById('photo-input').addEventListener('change', e => {
    handlePhoto(e.target)
  })

  // Footer date
  document.getElementById('footer-date').textContent = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
  })

  // Initial step label
  updateStepLabel()
})
