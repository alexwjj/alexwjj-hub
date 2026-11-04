import test from 'node:test'
import assert from 'node:assert/strict'
import { resources } from '../src/content/resources.ts'

test('public capabilities have unique IDs and expose no internal sources', () => {
  assert.equal(new Set(resources.map(r => `${r.kind}:${r.id}`)).size, resources.length)
  assert(resources.some(r => r.kind === 'skill') && resources.some(r => r.kind === 'mcp'))
  for (const resource of resources) {
    assert(resource.name && resource.category && resource.description)
    assert(!/cooper|didichuxing|didi-ee|hcms|huichong|mindwiki|dcc[-_]|\bddp\b|\boe\b/i.test(JSON.stringify(resource)))
    if (!resource.href) continue
    const url = new URL(resource.href)
    assert.equal(url.protocol, 'https:')
    assert(!/localhost|\.local$|^127\.|^10\.|^192\.168\.|internal/i.test(url.hostname))
    assert.equal(url.username + url.password + url.search, '')
  }
})
