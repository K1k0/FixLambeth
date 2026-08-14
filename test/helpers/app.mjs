// Test harness: boots the real app (index.html + bundled src/js) inside jsdom.
//
// The client modules import JSON and use bare ESM, so we bundle them with
// esbuild (already a Vite dependency) exactly as the production build does,
// then evaluate the bundle inside a jsdom window.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as esbuild from 'esbuild'
import { JSDOM, VirtualConsole } from 'jsdom'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const SRC = path.join(root, 'src')

const bundleCache = new Map()

async function bundle(entryContents) {
  if (bundleCache.has(entryContents)) return bundleCache.get(entryContents)
  const result = await esbuild.build({
    stdin: { contents: entryContents, resolveDir: path.join(SRC, 'js'), loader: 'js' },
    bundle: true,
    write: false,
    format: 'iife',
    globalName: '__app',
    platform: 'browser',
    target: 'es2020',
  })
  const code = result.outputFiles[0].text
  bundleCache.set(entryContents, code)
  return code
}

export function readHtml() {
  return readFileSync(path.join(SRC, 'index.html'), 'utf8')
}

/**
 * Boot index.html in jsdom with the given entry module evaluated in it.
 * Returns { dom, window, document, app } where `app` is the module's exports.
 */
export async function boot({
  entry = "export * from './main.js'",
  language = 'en-GB',
  languages = ['en-GB', 'en'],
  storage = {},
  fetchImpl,
} = {}) {
  const html = readHtml()
    // Leaflet is a CDN <script>; jsdom must not try to fetch it.
    .replace(/<script src="https:\/\/unpkg\.com[^>]*><\/script>/, '')
    .replace(/<script type="module"[^>]*><\/script>/, '')

  const virtualConsole = new VirtualConsole()
  const consoleErrors = []
  virtualConsole.on('jsdomError', (e) => consoleErrors.push(e))
  virtualConsole.on('error', (...args) => consoleErrors.push(args.join(' ')))

  const dom = new JSDOM(html, {
    url: 'https://fixlambeth.co.uk/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole,
  })
  const { window } = dom

  // Deterministic language environment.
  Object.defineProperty(window.navigator, 'language', { value: language, configurable: true })
  Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true })

  // In-memory localStorage so tests control the saved-language path.
  const store = { ...storage }
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
      clear: () => { for (const k of Object.keys(store)) delete store[k] },
    },
  })

  window.fetch = fetchImpl || (async () => ({ ok: true, status: 200, json: async () => ({}) }))
  window.L = undefined
  if (!window.navigator.clipboard) {
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    })
  }

  const code = await bundle(entry)
  window.eval(code)

  return {
    dom,
    window,
    document: window.document,
    app: window.__app,
    storage: store,
    consoleErrors,
  }
}

/** Fire DOMContentLoaded so main.js wires itself up. */
export function ready(window) {
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }))
}

/** Let queued microtasks/promises settle. */
export const flush = () => new Promise((r) => setTimeout(r, 0))
