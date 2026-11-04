import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createDatabase, seedProjects } from '../server/db.mjs'
import { createHandler, validateEvents } from '../server/app.mjs'
import { cookie, seal, session, unseal, authRoute } from '../server/auth.mjs'

const config = { origin: 'https://hub.example', secret: 'a'.repeat(48), clientId: 'test-client', clientSecret: 'test-secret', ownerId: '29943063' }
const identity = (id = '29943063') => ({ id, login: id === '29943063' ? 'alexwjj' : 'visitor', name: 'Test user', exp: Date.now() + 100_000 })
const signedCookie = id => cookie(config, 'session', seal(identity(id), config.secret), 100).split(';')[0]
const req = (path, { id, method = 'GET', body, origin = config.origin } = {}) => new Request(config.origin + path, { method, headers: { ...(id ? { cookie: signedCookie(id) } : {}), origin, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
let db, handler
before(async () => { db = await createDatabase({ localPath: 'memory://', url: '', production: false }); handler = createHandler({ config, getDatabase: async () => db, dashboardProjectIds: ['test-project', 'boundary-test'] }); await seedProjects(db, [{ id: 'test-project', name: 'Test', url: 'https://work.example', origins: ['https://work.example'] }]) })
after(async () => db?.close())

test('signed sessions reject tampering, expiry and forged owner role', () => {
  const valid = seal(identity(), config.secret)
  assert.equal(unseal(valid, config.secret).id, config.ownerId)
  assert.equal(unseal(valid + 'tamper', config.secret), null)
  assert.equal(unseal(seal({ ...identity(), exp: Date.now() - 1 }, config.secret), config.secret), null)
  const forgedRole = seal({ ...identity('123'), isOwner: true }, config.secret)
  assert.equal(session(new Request(config.origin, { headers: { cookie: '__Host-hub_session=' + forgedRole } }), config).isOwner, false)
})

test('private endpoints enforce identity before accessing storage', async () => {
  let accessed = false
  const guard = createHandler({ config, getDatabase: async () => { accessed = true; throw Error() } })
  assert.equal((await guard(req('/api/admin/analytics'))).status, 401)
  assert.equal((await guard(req('/api/admin/projects', { id: '123' }))).status, 403)
  assert.equal(accessed, false)
})

test('OAuth uses state and PKCE, rejects mismatched callback, and fixes redirect origin', async () => {
  const response = await authRoute(req('/api/auth/login'), config)
  const location = new URL(response.headers.get('location'))
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(location.searchParams.get('scope'), 'read:user')
  assert.equal(location.searchParams.get('redirect_uri'), config.origin + '/api/auth/callback')
  const callback = await authRoute(new Request(config.origin + '/api/auth/callback?code=bad&state=bad', { headers: { cookie: response.headers.get('set-cookie').split(';')[0] } }), config, () => { throw Error('must not call GitHub') })
  assert.equal(callback.status, 302)
  assert.match(callback.headers.get('location'), /login=failed/)
})

test('OAuth callback verifies GitHub identity and never stores the access token', async () => {
  const start = await authRoute(req('/api/auth/login'), config)
  const state = new URL(start.headers.get('location')).searchParams.get('state')
  const response = await authRoute(new Request(config.origin + '/api/auth/callback?code=ok&state=' + state, { headers: { cookie: start.headers.get('set-cookie').split(';')[0] } }), config, async url => Response.json(url.includes('access_token') ? { access_token: 'not-for-the-cookie' } : { id: 29943063, login: 'alexwjj', name: 'Alex' }))
  const cookies = response.headers.getSetCookie()
  assert.equal(cookies.length, 2)
  const user = session(new Request(config.origin, { headers: { cookie: cookies[0].split(';')[0] } }), config)
  assert.equal(user.isOwner, true)
  assert(!JSON.stringify(unseal(decodeURIComponent(cookies[0].split(';')[0].split('=')[1]), config.secret)).includes('not-for-the-cookie'))
})

test('guestbook validates login, CSRF, length, persistent writes and deletion ownership', async () => {
  assert.equal((await handler(req('/api/messages', { method: 'POST', body: { content: 'hello' } }))).status, 401)
  assert.equal((await handler(req('/api/messages', { id: '123', method: 'POST', origin: 'https://evil.example', body: { content: 'hello' } }))).status, 403)
  assert.equal((await handler(req('/api/messages', { id: '123', method: 'POST', body: { content: ' '.repeat(5) } }))).status, 400)
  assert.equal((await handler(new Request(config.origin + '/api/messages', { method: 'POST', headers: { cookie: signedCookie('123'), origin: config.origin }, body: 'null' }))).status, 400)
  const response = await handler(req('/api/messages', { id: '123', method: 'POST', body: { content: '<script>alert(1)</script>' } }))
  assert.equal(response.status, 201)
  const { message } = await response.json()
  assert.equal((await (await handler(req('/api/messages'))).json()).messages[0].content, '<script>alert(1)</script>')
  assert.equal((await handler(req('/api/messages', { id: '123', method: 'POST', body: { content: 'too soon' } }))).status, 429)
  assert.equal((await handler(req('/api/messages', { id: '456', method: 'DELETE', body: { id: message.id } }))).status, 403)
  assert.equal((await handler(req('/api/messages', { id: config.ownerId, method: 'DELETE', body: { id: message.id } }))).status, 200)
})

test('collector validates project origin, de-duplicates events and returns owner-only aggregates', async () => {
  const visitor = randomUUID(), sessionId = randomUUID()
  const event = { id: randomUUID(), visitor, session: sessionId, type: 'pageview', name: 'pageview', value: 0, path: '/work', referrer: 'example.com', device: 'mobile' }
  const send = (origin = 'https://work.example', events = [event]) => handler(req('/api/collect?project=test-project', { method: 'POST', origin, body: { events } }))
  assert.equal((await send('https://evil.example')).status, 403)
  assert.equal((await send()).status, 204)
  assert.equal((await send()).status, 204)
  assert.equal((await send('https://work.example', [{ ...event, path: '/?token=secret' }])).status, 400)
  const stats = await (await handler(req('/api/admin/analytics?project=test-project&days=7', { id: config.ownerId }))).json()
  assert.equal(stats.summary.views, 1)
  assert.equal(stats.summary.visitors, 1)
  assert.equal(stats.pages[0].path, '/work')
  const [stored] = await db.query('SELECT visitor,session_id FROM hub_events WHERE project_id=$1', ['test-project'])
  assert.notEqual(stored.visitor, visitor)
  assert.notEqual(stored.session_id, sessionId)
  assert.equal((await handler(req('/api/admin/analytics?days=9999', { id: config.ownerId }))).status, 400)
})

test('public catalog seed cannot overwrite private repository visibility', async () => {
  await seedProjects(db, [{ id: 'private-test', name: 'Private', visibility: 'private', source: 'https://github.com/owner/private' }])
  await seedProjects(db, [{ id: 'private-test', name: 'Public website' }])
  const [p] = await db.query('SELECT * FROM hub_projects WHERE id=$1', ['private-test'])
  assert.equal(p.visibility, 'private')
  assert.equal(p.repo, 'https://github.com/owner/private')
})

test('daily reports use the same Shanghai calendar boundaries as the chart', async () => {
  await seedProjects(db, [{ id: 'boundary-test', name: 'Calendar boundary' }])
  for (const offset of [-1, 1]) await db.query(`INSERT INTO hub_events(id,project_id,type,name,path,visitor,session_id,referrer,device,value,created_at)
    VALUES($1,'boundary-test','pageview','pageview','/','v','s','','desktop',0,
    ((date_trunc('day',now() AT TIME ZONE 'Asia/Shanghai')-interval '6 days'+$2::int*interval '1 minute') AT TIME ZONE 'Asia/Shanghai'))`, [randomUUID(), offset])
  const report = await (await handler(req('/api/admin/analytics?project=boundary-test&days=7', { id: config.ownerId }))).json()
  assert.equal(report.summary.views, 1)
  assert.equal(report.daily.reduce((sum, day) => sum + day.views, 0), report.summary.views)
})

test('collector redacts identifier-shaped paths before storage', () => {
  const id = randomUUID()
  const [event] = validateEvents({ events: [{ id: randomUUID(), visitor: randomUUID(), session: randomUUID(), type: 'pageview', name: 'pageview', value: 0, path: `/people/${id}/1234567`, device: 'desktop' }] }, 'test', config.secret)
  assert.equal(event.path, '/people/:id/:id')
})


test('owner dashboard exposes only curated works and rejects archived selections without deleting history', async () => {
  const curated = createHandler({ config, getDatabase: async () => db })
  const registry = await (await curated(req('/api/admin/projects', { id: config.ownerId }))).json()
  assert.equal(registry.projects.length, 9)
  assert(!registry.projects.some(p => p.id === 'test-project' || p.id === 'private-test'))
  assert.equal((await curated(req('/api/admin/analytics?project=test-project', { id: config.ownerId }))).status, 400)
  const report = await (await curated(req('/api/admin/analytics', { id: config.ownerId }))).json()
  assert(report.perProject.every(row => registry.projects.some(project => project.id === row.project_id)))
  assert.equal((await db.query('SELECT id FROM hub_projects WHERE id=$1', ['test-project'])).length, 1)
})
