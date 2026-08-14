import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readHtml } from './helpers/app.mjs'
import { JSDOM } from 'jsdom'

const html = readHtml()
const doc = new JSDOM(html).window.document

test('viewport meta is valid and mobile-first', () => {
  const content = doc.querySelector('meta[name="viewport"]').getAttribute('content')
  assert.match(content, /width=device-width/)
  assert.doesNotMatch(content, /device=device/, 'malformed width directive would disable mobile layout')
  assert.doesNotMatch(content, /user-scalable=no|maximum-scale=1/, 'must not block pinch zoom')
})

test('issue cards form an accessible radiogroup', () => {
  const group = doc.querySelector('.issue-grid')
  assert.equal(group.getAttribute('role'), 'radiogroup')
  assert.ok(group.getAttribute('aria-labelledby'))

  const cards = [...doc.querySelectorAll('.issue-card')]
  assert.equal(cards.length, 8)
  for (const c of cards) {
    assert.equal(c.getAttribute('role'), 'radio')
    assert.equal(c.getAttribute('type'), 'button')
    assert.ok(['true', 'false'].includes(c.getAttribute('aria-checked')))
  }
  assert.equal(cards.filter((c) => c.getAttribute('aria-checked') === 'true').length, 1)
})

test('every issue card routes to a lambeth.gov.uk address', () => {
  for (const c of doc.querySelectorAll('.issue-card')) {
    assert.match(c.dataset.email, /^[^@\s]+@lambeth\.gov\.uk$/, `bad email on ${c.dataset.key}`)
  }
})

test('step changes have a live region to announce into', () => {
  const announcer = doc.getElementById('step-announcer')
  assert.ok(announcer, 'missing #step-announcer')
  assert.equal(announcer.getAttribute('aria-live'), 'polite')
  for (const id of ['s1-heading', 's2-heading', 'confirm-title']) {
    assert.equal(doc.getElementById(id).getAttribute('tabindex'), '-1', `${id} must be focusable`)
  }
})

test('map legend text is addressable for translation', () => {
  for (const id of ['legend-env', 'legend-road', 'legend-parks', 'legend-asb', 'map-eyebrow']) {
    assert.ok(doc.getElementById(id), `missing #${id}`)
  }
})

test('report count is announced politely', () => {
  const el = doc.getElementById('report-count')
  assert.equal(el.getAttribute('aria-live'), 'polite')
})

test('the English email preview stays LTR under an RTL interface', () => {
  assert.equal(doc.querySelector('.email-preview').getAttribute('dir'), 'ltr')
  assert.equal(doc.getElementById('confirm-email').getAttribute('dir'), 'ltr')
})

test('every class used in the stylesheet-critical markup actually exists in CSS', () => {
  // Regression: .reassurance-item was styled but never applied, so the trust
  // row rendered as unstyled body text.
  const css = readFileSync(new URL('../src/css/style.css', import.meta.url), 'utf8')
  for (const cls of ['reassurance-item', 'map-empty', 'hero-eyebrow']) {
    assert.ok(doc.querySelector(`.${cls}`), `.${cls} is styled but never used in the markup`)
    assert.ok(css.includes(`.${cls}`), `.${cls} is used in markup but never styled`)
  }
})

test('the hero eyebrow style is not scoped to the report tab only', () => {
  const css = readFileSync(new URL('../src/css/style.css', import.meta.url), 'utf8')
  assert.ok(!css.includes('.hero-inline .hero-eyebrow'), 'scoping this hides the map tab eyebrow')
  // Both tabs carry one.
  assert.ok(doc.querySelector('#content-report .hero-eyebrow'))
  assert.ok(doc.querySelector('#content-map .hero-eyebrow'))
})

test('interactive elements get a styled focus ring, headings do not', () => {
  const css = readFileSync(new URL('../src/css/style.css', import.meta.url), 'utf8')
  assert.match(css, /:where\(button, a, \[tabindex\]\):focus-visible/, 'no global focus ring')
  assert.match(css, /\.step-heading:focus[\s\S]{0,120}outline: none/, 'programmatic heading focus must not draw a ring')
})

test('the map has a real empty state with a way out', () => {
  const empty = doc.getElementById('map-empty')
  assert.ok(empty, 'missing #map-empty')
  assert.ok(empty.hasAttribute('hidden'), 'must start hidden until we know the count')
  assert.ok(empty.querySelector('h2'), 'needs a heading, not just a pill')
  assert.ok(doc.getElementById('map-empty-cta'), 'empty state must offer an action')
})

test('no empty "recent reports" placeholder is rendered', () => {
  assert.equal(doc.getElementById('recent-list'), null)
})

test('every form input has an associated label', () => {
  for (const input of doc.querySelectorAll('input:not([type="file"]), textarea')) {
    const label = doc.querySelector(`label[for="${input.id}"]`)
    assert.ok(label, `no <label for="${input.id}">`)
  }
})

test('decorative svgs are hidden from assistive tech', () => {
  const visible = [...doc.querySelectorAll('svg')].filter((s) => s.getAttribute('aria-hidden') !== 'true')
  assert.deepEqual(visible, [], 'all inline svgs in the markup are decorative')
})
