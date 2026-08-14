import test from 'node:test'
import assert from 'node:assert/strict'
import { boot } from './helpers/app.mjs'

const ENTRY = "export * from './map.js'; export { setLang } from './i18n.js'"

test('with no reports the legend is swapped for the empty state', async () => {
  const { document, app } = await boot({ entry: ENTRY })
  app.setMapEmptyState(true)

  assert.equal(document.getElementById('map-empty').hidden, false)
  assert.equal(document.getElementById('map-legend').hidden, true, 'legend describes nothing when empty')
  assert.equal(document.getElementById('report-count').hidden, true)
})

test('with reports present the legend returns and the empty state hides', async () => {
  const { document, app } = await boot({ entry: ENTRY })
  app.setMapEmptyState(true)
  app.setMapEmptyState(false)

  assert.equal(document.getElementById('map-empty').hidden, true)
  assert.equal(document.getElementById('map-legend').hidden, false)
  assert.equal(document.getElementById('report-count').hidden, false)
})

test('the empty state is translated along with everything else', async () => {
  const { document, app } = await boot({ entry: ENTRY })
  app.setLang('pl', 'flytipping')
  assert.equal(document.getElementById('map-empty-title').textContent, 'Brak zgłoszeń w Lambeth')
  assert.equal(document.getElementById('map-empty-cta-text').textContent, 'Zgłoś problem')
})

test('the empty-state button returns the user to the report flow', async () => {
  const { window, document } = await boot()
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }))

  document.getElementById('tab-map').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  assert.equal(document.getElementById('content-map').classList.contains('active'), true)

  document.getElementById('map-empty-cta').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  assert.equal(document.getElementById('content-report').classList.contains('active'), true)
  assert.equal(document.getElementById('s1').classList.contains('active'), true)
})
