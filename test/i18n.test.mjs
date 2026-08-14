import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { boot, ready, SRC } from './helpers/app.mjs'

const LOCALES = ['en', 'pt', 'es', 'ar', 'pl']
const load = (l) => JSON.parse(readFileSync(path.join(SRC, 'i18n', `${l}.json`), 'utf8'))

const I18N_ENTRY = "export * from './i18n.js'"

test('all locales have identical key sets', () => {
  const en = load('en')
  const keys = (o) => Object.keys(o).sort()
  for (const l of LOCALES.slice(1)) {
    const other = load(l)
    assert.deepEqual(keys(other), keys(en), `${l} key drift`)
    assert.deepEqual(keys(other.issues), keys(en.issues), `${l}.issues drift`)
    assert.deepEqual(keys(other.issueLabels), keys(en.issueLabels), `${l}.issueLabels drift`)
  }
})

test('every locale carries the map count strings', () => {
  for (const l of LOCALES) {
    const t = load(l)
    for (const k of ['mapCountNone', 'mapCountOne', 'mapCountMany', 'mapCountError', 'mapLoading']) {
      assert.ok(t[k] && t[k].trim(), `${l} missing ${k}`)
    }
    assert.match(t.mapCountMany, /\{count\}/, `${l}.mapCountMany lost its placeholder`)
    assert.match(t.s2Sub, /\{team\}/, `${l}.s2Sub lost its {team} placeholder`)
  }
})

test('Arabic is the only RTL locale', () => {
  for (const l of LOCALES) {
    assert.equal(load(l).dir, l === 'ar' ? 'rtl' : 'ltr')
  }
})

test('getTeam routes each issue to the right council team', async () => {
  const { app } = await boot({ entry: I18N_ENTRY })
  assert.equal(app.getTeam('flytipping'), 'Environment')
  assert.equal(app.getTeam('graffiti'), 'Environment')
  assert.equal(app.getTeam('tree'), 'Parks')
  assert.equal(app.getTeam('noise'), 'Noise')
  assert.equal(app.getTeam('asb'), 'Noise')
  assert.equal(app.getTeam('pothole'), 'Highways')
  assert.equal(app.getTeam('streetlight'), 'Highways')
  assert.equal(app.getTeam('drain'), 'Highways')
  assert.equal(app.getTeam(undefined), 'Highways', 'must not throw on a missing key')
})

test('detectLang prefers a saved choice, then the browser, then English', async () => {
  const saved = await boot({ entry: I18N_ENTRY, storage: { 'fixlambeth.lang': 'pl' }, language: 'pt-BR', languages: ['pt-BR'] })
  assert.equal(saved.app.detectLang(), 'pl')

  const browser = await boot({ entry: I18N_ENTRY, language: 'pt-BR', languages: ['pt-BR', 'pt'] })
  assert.equal(browser.app.detectLang(), 'pt')

  const unsupported = await boot({ entry: I18N_ENTRY, language: 'de-DE', languages: ['de-DE'] })
  assert.equal(unsupported.app.detectLang(), 'en')

  const junk = await boot({ entry: I18N_ENTRY, storage: { 'fixlambeth.lang': 'zz' }, language: 'de', languages: ['de'] })
  assert.equal(junk.app.detectLang(), 'en', 'an unsupported saved value must not be trusted')
})

test('choosing a language persists it', async () => {
  const { app, storage } = await boot({ entry: I18N_ENTRY })
  app.setLang('es', 'flytipping')
  assert.equal(storage['fixlambeth.lang'], 'es')
})

test('setLang translates the map legend, eyebrow and headings', async () => {
  const { app, document } = await boot({ entry: I18N_ENTRY })
  const es = load('es')
  app.setLang('es', 'flytipping')

  assert.equal(document.getElementById('legend-env').textContent, es.legendEnv)
  assert.equal(document.getElementById('legend-asb').textContent, es.legendAsb)
  assert.equal(document.getElementById('map-eyebrow').textContent, es.communityEyebrow)
  assert.equal(document.getElementById('map-title').textContent, es.mapTitle)
})

test('{team} is interpolated in the step 2 subtitle in every locale', async () => {
  const { app, document } = await boot({ entry: I18N_ENTRY })
  for (const l of LOCALES) {
    app.setLang(l, 'tree')
    const text = document.getElementById('s2-sub').textContent
    assert.doesNotMatch(text, /\{team\}/, `${l} left the placeholder unreplaced`)
    assert.match(text, /Parks/, `${l} did not interpolate the team`)
  }
})

test('Arabic switches document direction, others restore it', async () => {
  const { app, document } = await boot({ entry: I18N_ENTRY })
  app.setLang('ar', 'flytipping')
  assert.equal(document.documentElement.dir, 'rtl')
  assert.equal(document.documentElement.lang, 'ar')
  app.setLang('en', 'flytipping')
  assert.equal(document.documentElement.dir, 'ltr')
})

test('formatReportCount pluralises in the active language', async () => {
  const { app } = await boot({ entry: I18N_ENTRY })
  app.setLang('en', 'flytipping')
  assert.equal(app.formatReportCount(0), load('en').mapCountNone)
  assert.equal(app.formatReportCount(1), '1 report')
  assert.equal(app.formatReportCount(7), '7 reports')

  app.setLang('pl', 'flytipping')
  assert.equal(app.formatReportCount(7), 'Zgłoszenia: 7')
  assert.doesNotMatch(app.formatReportCount(7), /\{count\}/)
})

test('the app boots in the browser language without a saved choice', async () => {
  const { window, document } = await boot({ language: 'es-ES', languages: ['es-ES', 'es'] })
  ready(window)
  assert.equal(document.documentElement.lang, 'es')
  assert.equal(document.getElementById('hero-title').textContent, load('es').heroTitle)
})
