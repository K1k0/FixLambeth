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

document.addEventListener('DOMContentLoaded', () => {
  const t = getT()

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const l = btn.textContent.toLowerCase()
      setLang(l, selectedKey)
    })
  })

  const tabReport = document.getElementById('tab-report')
  const tabMap = document.getElementById('tab-map')

  tabReport.addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'))
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.getElementById('content-report').classList.add('active')
    tabReport.classList.add('active')
    const anyActive = document.querySelector('#content-report .step.active')
    if (!anyActive) {
      document.getElementById('s1').classList.add('active')
      setProgress(1)
    }
  })

  tabMap.addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'))
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.getElementById('content-map').classList.add('active')
    tabMap.classList.add('active')
    setTimeout(() => {
      initMap()
    }, 100)
  })

  document.querySelectorAll('.issue-card').forEach(card => {
    card.addEventListener('click', () => {
      toStep2(card.dataset.key, card.dataset.email)
    })
  })

  document.getElementById('btn-next').addEventListener('click', toStep3)
  document.getElementById('btn-back-1').addEventListener('click', toStep1)
  document.getElementById('btn-restart').addEventListener('click', toStep1)
  document.getElementById('email-btn').addEventListener('click', sendEmail)

  document.getElementById('copy-btn').addEventListener('click', copyEmailBody)

  document.getElementById('photo-upload-area').addEventListener('click', () => {
    document.getElementById('photo-input').click()
  })

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

  document.getElementById('photo-input').addEventListener('change', e => {
    handlePhoto(e.target)
  })

  document.getElementById('footer-date').textContent = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
  })
})
