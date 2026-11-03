import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { webcrypto } from 'node:crypto'

async function browser({ dnt = false, blockedStorage = false, vitals = false, rootPath = false } = {}) {
  const source = (await readFile(new URL('../sdk/index.js', import.meta.url), 'utf8')).replace('export function', 'function').replaceAll('import.meta.url', '"https://hub.example/sdk/hub.js"')
  const beacons = [], listeners = new Map(), values = new Map()
  const storage = { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) }
  const context = { URL, Blob, Date, Uint8Array, crypto: webcrypto, navigator: { doNotTrack: dnt ? '1' : '0', sendBeacon: (url, body) => { beacons.push({ url, body }); return true } }, location: { href: 'https://work.example/app?secret=hidden#/dashboard?token=hidden', hostname: 'work.example', pathname: '/app', hash: '#/dashboard?token=hidden' }, matchMedia: () => ({ matches: false }), performance: { getEntriesByType: () => [] }, history: { pushState() {}, replaceState() {} }, setInterval: () => 1, clearInterval() {}, fetch() { throw Error('beacon should handle delivery') } }
  const events = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) } }
  if (rootPath) context.location.pathname = '/'
  context.document = { ...events, hidden: false, readyState: 'complete', referrer: 'https://referrer.example/page?private=1' }
  context.window = { ...events }
  if (vitals) context.PerformanceObserver = class { observe() {} disconnect() {} }
  Object.defineProperty(context, 'localStorage', { get() { if (blockedStorage) throw Error('storage denied'); return storage } })
  Object.defineProperty(context, 'sessionStorage', { get() { if (blockedStorage) throw Error('storage denied'); return storage } })
  runInNewContext(source + '\nglobalThis.sdk = createHubAnalytics({projectId:"test",endpoint:"https://hub.example/api/collect"})', context)
  return { context, beacons, listeners, batches: async () => Promise.all(beacons.map(async b => JSON.parse(await b.body.text()))) }
}

test('SDK strips queries, tracks one navigation, accepts custom events and restores history', async () => {
  const b = await browser()
  const [first] = await b.batches()
  assert.equal(first.events[0].path, '/app/dashboard')
  assert.equal(first.events[0].referrer, 'referrer.example')
  assert(!JSON.stringify(first).includes('hidden'))
  b.context.history.pushState(null, '', '/app')
  assert.equal(b.beacons.length, 1)
  b.context.sdk.track('download_click')
  assert.equal((await b.batches())[1].events[0].name, 'download_click')
  b.context.sdk.stop()
  assert.equal(b.listeners.size, 0)
  const count = b.beacons.length
  b.context.sdk.track('after_stop')
  assert.equal(b.beacons.length, count)
})

test('SDK respects DNT and survives denied browser storage', async () => {
  const off = await browser({ dnt: true })
  off.context.sdk.track('ignored')
  assert.equal(off.beacons.length, 0)
  const blocked = await browser({ blockedStorage: true })
  assert.equal(blocked.beacons.length, 1)
  blocked.context.sdk.stop()
})

test('SDK reports zero CLS so the average does not exclude stable pages', async () => {
  const b = await browser({ vitals: true })
  b.context.sdk.stop()
  const events = (await b.batches()).flatMap(batch => batch.events)
  assert.equal(events.find(e => e.name === 'cls').value, 0)
  assert.equal(events.filter(e => e.name === 'cls').length, 1)
})

test('SDK normalizes root-level hash routes without duplicate slashes', async () => {
  const b = await browser({ rootPath: true })
  assert.equal((await b.batches())[0].events[0].path, '/dashboard')
  b.context.sdk.stop()
})
