// Smoke test against the real Vite production output in dist/.
// The other suites bundle src/ directly; this one proves the shipped artefact
// boots and wires itself up without errors.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM, VirtualConsole } from 'jsdom'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const hasBuild = existsSync(path.join(dist, 'index.html'))

test('production build boots and renders step 1', { skip: hasBuild ? false : 'run `npm run build` first' }, () => {
  const html = readFileSync(path.join(dist, 'index.html'), 'utf8')

  assert.match(html, /width=device-width/, 'built html lost the viewport fix')
  assert.match(html, /role="radiogroup"/)

  const scriptSrc = html.match(/<script type="module"[^>]*src="([^"]+)"/)[1]
  const bundle = readFileSync(path.join(dist, scriptSrc.replace(/^\//, '')), 'utf8')

  const errors = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (e) => errors.push(e.message))

  const dom = new JSDOM(
    html.replace(/<script[^>]*src="https:\/\/unpkg[^>]*><\/script>/, '').replace(/<script type="module"[^>]*><\/script>/, ''),
    { url: 'https://fixlambeth.co.uk/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole }
  )
  const { window } = dom
  window.fetch = async () => ({ ok: true, status: 200, json: async () => [] })

  window.eval(bundle)
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }))

  assert.deepEqual(errors, [], 'the built bundle threw on boot')
  assert.equal(window.document.getElementById('s1').classList.contains('active'), true)
  assert.equal(window.document.querySelectorAll('.issue-card[aria-checked="true"]').length, 1)

  // Clicking an issue must advance to step 2 in the shipped bundle.
  window.document.querySelector('.issue-card[data-key="pothole"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  assert.equal(window.document.getElementById('s2').classList.contains('active'), true)
  assert.match(window.document.getElementById('selected-chip').textContent, /Pothole/)
})
