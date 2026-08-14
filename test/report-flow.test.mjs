import test from 'node:test'
import assert from 'node:assert/strict'
import { boot, ready, flush } from './helpers/app.mjs'

const ENTRY = "export * from './report.js'; export { setLang, getT } from './i18n.js'"

function stubFetch(handlers = {}) {
  const calls = []
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url: String(url), body: opts.body ? JSON.parse(opts.body) : null })
    for (const [fragment, respond] of Object.entries(handlers)) {
      if (String(url).includes(fragment)) return respond(opts)
    }
    return { ok: true, status: 200, json: async () => ({}) }
  }
  fetchImpl.calls = calls
  return fetchImpl
}

const ok = (body) => () => ({ ok: true, status: 200, json: async () => body })

async function fillForm(document, { location = '42 Brixton Road', postcode = 'SW9 8DN', desc = 'Large pile of rubbish', when = 'This morning', name = 'Sarah Jones' } = {}) {
  document.getElementById('inp-location').value = location
  document.getElementById('inp-postcode').value = postcode
  document.getElementById('inp-desc').value = desc
  document.getElementById('inp-when').value = when
  document.getElementById('inp-name').value = name
}

test('a completed report produces a correctly routed email', async () => {
  const fetchImpl = stubFetch({ 'save-report': ok({ success: true, id: 'report_1' }) })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)

  app.toStep2('tree', 'parks@lambeth.gov.uk')
  await fillForm(document, { desc: 'Branch hanging over the pavement' })
  await app.toStep3()

  assert.equal(document.getElementById('s3').classList.contains('active'), true)
  assert.equal(document.getElementById('fallback-to').textContent, 'parks@lambeth.gov.uk')
  assert.match(document.getElementById('fallback-subject').textContent, /^Dangerous or overhanging tree report — 42 Brixton Road$/)

  const body = document.getElementById('fallback-body').textContent
  assert.match(body, /^Dear Parks team,/, 'team must match the routing table')
  assert.match(body, /Location: 42 Brixton Road/)
  assert.match(body, /Postcode: SW9 8DN/)
  assert.match(body, /Branch hanging over the pavement/)
  assert.match(body, /Sarah Jones$/)
})

test('the saved report matches the English issue type the server accepts', async () => {
  // These are the exact strings whitelisted in netlify/functions/save-report.js
  const VALID = new Set([
    'Fly-tipping & dumped rubbish', 'Pothole / Pavement damage', 'Broken or faulty streetlight',
    'Graffiti', 'Noise nuisance', 'Blocked drain or manhole', 'Dangerous or overhanging tree',
    'Anti-social behaviour',
  ])
  const keys = ['flytipping', 'pothole', 'streetlight', 'graffiti', 'noise', 'drain', 'tree', 'asb']

  for (const key of keys) {
    const fetchImpl = stubFetch({ 'save-report': ok({ success: true }) })
    const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
    ready(window)
    app.toStep2(key, 'environment@lambeth.gov.uk')
    await fillForm(document)
    await app.toStep3()

    const save = fetchImpl.calls.find((c) => c.url.includes('save-report'))
    assert.ok(save, `no save call for ${key}`)
    assert.ok(VALID.has(save.body['Issue Type']), `server would reject "${save.body['Issue Type']}" for ${key}`)
  }
})

test('the greeting team always matches the inbox the email is addressed to', async () => {
  // Regression: "streetlight" contains the substring "tree", so substring-based
  // routing greeted the Parks team on an email sent to highways@.
  const INBOX_TEAM = {
    'environment@lambeth.gov.uk': 'Environment',
    'highways@lambeth.gov.uk': 'Highways',
    'noise@lambeth.gov.uk': 'Noise',
    'parks@lambeth.gov.uk': 'Parks',
    'PPARS@lambeth.gov.uk': 'Noise',
  }

  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl: stubFetch({ 'save-report': ok({ success: true }) }) })
  ready(window)

  for (const card of document.querySelectorAll('.issue-card')) {
    const { key, email } = card.dataset
    app.toStep2(key, email)
    await fillForm(document)
    await app.toStep3()

    const greeting = document.getElementById('fallback-body').textContent.split('\n')[0]
    assert.equal(greeting, `Dear ${INBOX_TEAM[email]} team,`, `${key} greets the wrong team for ${email}`)
  }
})

test('the step 2 subtitle names the team for the issue actually selected', async () => {
  // Regression: {team} was only interpolated on language change, so the
  // subtitle kept showing the team from whichever issue was selected then.
  const { window, document, app } = await boot({ entry: ENTRY })
  ready(window)

  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  assert.match(document.getElementById('s2-sub').textContent, /Environment/)

  app.toStep2('streetlight', 'highways@lambeth.gov.uk')
  const sub = document.getElementById('s2-sub').textContent
  assert.match(sub, /Highways/, 'subtitle went stale on the previous selection')
  assert.doesNotMatch(sub, /Environment|\{team\}/)
})

test('a non-English report is translated before it is sent and stored', async () => {
  const fetchImpl = stubFetch({
    translate: ok({ translated: 'Large pile of rubbish on the corner' }),
    'save-report': ok({ success: true }),
  })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.setLang('pt', 'flytipping')
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document, { desc: 'Monte de lixo na esquina' })
  await app.toStep3()

  assert.match(document.getElementById('fallback-body').textContent, /Large pile of rubbish on the corner/)
  const save = fetchImpl.calls.find((c) => c.url.includes('save-report'))
  assert.equal(save.body.Description, 'Large pile of rubbish on the corner')
  assert.equal(save.body.Language, 'PT')
})

test('a failed translation falls back to the original text', async () => {
  const fetchImpl = stubFetch({
    translate: () => { throw new Error('service down') },
    'save-report': ok({ success: true }),
  })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.setLang('es', 'flytipping')
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document, { desc: 'Basura en la acera' })
  await app.toStep3()

  assert.match(document.getElementById('fallback-body').textContent, /Basura en la acera/)
  assert.equal(document.getElementById('s3').classList.contains('active'), true, 'the user must still reach step 3')
})

test('English reports skip the translation service entirely', async () => {
  const fetchImpl = stubFetch({ 'save-report': ok({ success: true }) })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document)
  await app.toStep3()
  assert.equal(fetchImpl.calls.filter((c) => c.url.includes('translate')).length, 0)
})

test('the email never claims a photo when none was uploaded', async () => {
  const fetchImpl = stubFetch({ 'save-report': ok({ success: true }) })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document)
  await app.toStep3()

  const body = document.getElementById('fallback-body').textContent
  assert.doesNotMatch(body, /attached/i, 'mailto cannot attach files — must not claim one')
  assert.doesNotMatch(body, /Photo:/)
})

test('an uploaded photo is included as a working link, not a false attachment claim', async () => {
  const fetchImpl = stubFetch({
    'upload-photo': ok({ key: 'photo_1717171717171_ab12cd.jpeg' }),
    'save-report': ok({ success: true }),
  })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document)

  const file = new window.File(['fake-bytes'], 'photo.jpg', { type: 'image/jpeg' })
  await app.handlePhoto({ files: [file] })
  await app.toStep3()

  const body = document.getElementById('fallback-body').textContent
  assert.match(body, /Photo: https:\/\/fixlambeth\.co\.uk\/\.netlify\/functions\/get-photo\?key=photo_1717171717171_ab12cd\.jpeg/)
  assert.doesNotMatch(body, /attached/i)
})

test('the photo upload is awaited, so a fast user never loses the link', async () => {
  let release
  const gate = new Promise((r) => { release = r })
  const fetchImpl = stubFetch({
    'upload-photo': async () => {
      await gate
      return { ok: true, status: 200, json: async () => ({ key: 'photo_1717171717171_zz99zz.png' }) }
    },
    'save-report': ok({ success: true }),
  })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document)

  const file = new window.File(['bytes'], 'p.png', { type: 'image/png' })
  const uploading = app.handlePhoto({ files: [file] })

  // User taps "Prepare my report" while the upload is still in flight.
  const preparing = app.toStep3()
  await flush()
  release()
  await Promise.all([uploading, preparing])

  assert.match(document.getElementById('fallback-body').textContent, /Photo: .*photo_1717171717171_zz99zz\.png/)
})

test('a failed photo upload degrades quietly and still sends the report', async () => {
  const fetchImpl = stubFetch({
    'upload-photo': () => ({ ok: false, status: 500, json: async () => ({ error: 'Upload service unavailable' }) }),
    'save-report': ok({ success: true }),
  })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document)
  const file = new window.File(['bytes'], 'p.png', { type: 'image/png' })
  await app.handlePhoto({ files: [file] })
  await app.toStep3()

  const body = document.getElementById('fallback-body').textContent
  assert.doesNotMatch(body, /Photo:/, 'must not link a photo that failed to upload')
  assert.equal(document.getElementById('s3').classList.contains('active'), true)
})

test('an ampersand-escaped recipient address is decoded correctly', async () => {
  const fetchImpl = stubFetch({ 'save-report': ok({ success: true }) })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('flytipping', 'waste%26recycling@lambeth.gov.uk')
  await fillForm(document)
  await app.toStep3()
  assert.equal(document.getElementById('fallback-to').textContent, 'waste&recycling@lambeth.gov.uk')
})

test('validation blocks an empty form and a malformed postcode', async () => {
  const { window, document, app } = await boot({ entry: ENTRY })
  ready(window)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')

  await app.toStep3()
  assert.equal(document.getElementById('s2').classList.contains('active'), true, 'must not advance with an empty form')

  await fillForm(document, { postcode: 'NOT A POSTCODE' })
  await app.toStep3()
  assert.equal(document.getElementById('s2').classList.contains('active'), true, 'must not advance with a bad postcode')
  assert.equal(document.getElementById('postcode-error').style.display, 'block')
})

test('a save failure is surfaced to the user but does not block the email', async () => {
  const fetchImpl = stubFetch({ 'save-report': () => { throw new Error('offline') } })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document)
  await app.toStep3()

  assert.equal(document.getElementById('s3').classList.contains('active'), true)
  assert.match(document.getElementById('status-note').textContent, /Could not save/i)
})

test('the step label tracks the actual step, including step 3', async () => {
  const fetchImpl = stubFetch({ 'save-report': ok({ success: true }) })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  // The label is styled uppercase in CSS, so compare case-insensitively.
  const label = () => document.querySelector('.step-label').textContent.toLowerCase()

  assert.equal(label(), 'step 1 of 3')
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  assert.equal(label(), 'step 2 of 3')

  await fillForm(document)
  await app.toStep3()
  assert.equal(label(), 'step 3 of 3', 'label went stale on the confirmation step')

  app.toStep1()
  assert.equal(label(), 'step 1 of 3')
})

test('the hero shows only on step 1, so it never contradicts the form', async () => {
  const fetchImpl = stubFetch({ 'save-report': ok({ success: true }) })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  const hero = document.querySelector('.hero-inline')

  assert.equal(hero.hidden, false)
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  assert.equal(hero.hidden, true, 'hero still visible while filling in the form')

  await fillForm(document)
  await app.toStep3()
  assert.equal(hero.hidden, true)

  app.toStep1()
  assert.equal(hero.hidden, false, 'hero must come back on step 1')
})

test('step changes move focus and announce the new heading', async () => {
  const { window, document, app } = await boot({ entry: ENTRY })
  ready(window)

  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  assert.equal(document.activeElement.id, 's2-heading')
  assert.equal(document.getElementById('step-announcer').textContent, document.getElementById('s2-heading').textContent)

  app.toStep1()
  assert.equal(document.activeElement.id, 's1-heading')
})

test('restarting clears every field and the staged photo', async () => {
  const fetchImpl = stubFetch({ 'upload-photo': ok({ key: 'photo_1717171717171_ab12cd.jpeg' }), 'save-report': ok({ success: true }) })
  const { window, document, app } = await boot({ entry: ENTRY, fetchImpl })
  ready(window)
  app.toStep2('tree', 'parks@lambeth.gov.uk')
  await fillForm(document)
  await app.handlePhoto({ files: [new window.File(['b'], 'p.jpg', { type: 'image/jpeg' })] })

  app.toStep1()
  for (const id of ['inp-location', 'inp-postcode', 'inp-desc', 'inp-when', 'inp-name', 'photo-input']) {
    assert.equal(document.getElementById(id).value, '', `${id} not cleared`)
  }
  assert.equal(document.getElementById('photo-preview').style.display, 'none')

  // The next report must not inherit the previous photo.
  app.toStep2('flytipping', 'environment@lambeth.gov.uk')
  await fillForm(document)
  await app.toStep3()
  assert.doesNotMatch(document.getElementById('fallback-body').textContent, /Photo:/)
})

test('selecting an issue keeps aria-checked and roving tabindex in sync', async () => {
  const { window, document, app } = await boot({ entry: ENTRY })
  ready(window)
  app.toStep2('noise', 'noise@lambeth.gov.uk')

  const cards = [...document.querySelectorAll('.issue-card')]
  const checked = cards.filter((c) => c.getAttribute('aria-checked') === 'true')
  assert.equal(checked.length, 1)
  assert.equal(checked[0].dataset.key, 'noise')
  assert.equal(checked[0].tabIndex, 0)
  for (const c of cards.filter((c) => c !== checked[0])) {
    assert.equal(c.tabIndex, -1)
  }
})
