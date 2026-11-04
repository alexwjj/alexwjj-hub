import { createHash } from 'node:crypto'
import { authRoute, configuration, sameOrigin, session } from './auth.mjs'
import { database, rateLimit } from './db.mjs'

const json = (data, status = 200) => Response.json(data, { status })
const hash = value => createHash('sha256').update(value).digest('hex')
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
const eventTypes = new Set(['pageview', 'engagement', 'event', 'error', 'metric'])

export function validateEvents(body, projectId, secret) {
  if (!Array.isArray(body.events) || body.events.length < 1 || body.events.length > 20) throw new Error('Invalid batch')
  return body.events.map(e => {
    if (!e || !uuid.test(e.id) || !uuid.test(e.visitor) || !uuid.test(e.session) || !eventTypes.has(e.type) || typeof e.name !== 'string' || !/^[a-zA-Z\d_.-]{1,64}$/.test(e.name) || typeof e.path !== 'string' || !e.path.startsWith('/') || e.path.length > 500 || /[?#\u0000-\u001f]/.test(e.path)) throw new Error('Invalid event')
    if (!Number.isFinite(e.value) || e.value < 0 || e.value > 3_600_000) throw new Error('Invalid metric')
    const referrer = typeof e.referrer === 'string' && /^[a-z\d.-]{0,253}$/i.test(e.referrer) ? e.referrer : ''
    return { ...e, path: e.path.replace(/\/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}(?=\/|$)/gi, '/:id').replace(/\/\d{7,}(?=\/|$)/g, '/:id'), referrer, visitor: hash(`${secret}:${projectId}:${e.visitor}`), session: hash(`${secret}:${projectId}:${e.session}`), device: ['mobile', 'desktop', 'tablet'].includes(e.device) ? e.device : 'desktop' }
  })
}

async function readBody(request) {
  const text = await request.text()
  if (Buffer.byteLength(text) > 24_000) throw new Error('Body too large')
  const value = JSON.parse(text)
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid body')
  return value
}

export function createHandler({ getDatabase = database, config = configuration(), fetcher = fetch } = {}) {
  return async function handler(request) {
    let response
    try { response = await route(request) } catch (error) {
      if (error instanceof SyntaxError || ['Body too large', 'Invalid body', 'Invalid batch', 'Invalid event', 'Invalid metric'].includes(error.message)) response = json({ error: '请求数据无效' }, 400)
      else { console.error('Hub API unavailable:', error.name); response = json({ error: '服务暂不可用，请稍后重试' }, 503) }
    }
    response.headers.set('cache-control', 'no-store')
    response.headers.set('x-content-type-options', 'nosniff')
    return response
  }

  async function route(request) {
    const url = new URL(request.url), path = url.pathname
    if (path.startsWith('/api/auth/')) return authRoute(request, config, fetcher)
    const user = session(request, config)
    if (path.startsWith('/api/admin/')) {
      if (!user) return json({ error: '请先登录' }, 401)
      if (!user.isOwner) return json({ error: '仅站点所有者可访问' }, 403)
      if (request.method !== 'GET') return json({ error: '不支持的操作' }, 405)
      const db = await getDatabase()
      if (path === '/api/admin/projects') return json({ projects: await db.query('SELECT id,name,url,repo,visibility,origins FROM hub_projects ORDER BY name') })
      if (path === '/api/admin/analytics') {
        const days = Number(url.searchParams.get('days') || 30)
        if (![7, 30, 90].includes(days)) return json({ error: '时间范围无效' }, 400)
        const project = url.searchParams.get('project') || null
        const filter = `created_at >= ((date_trunc('day',now() AT TIME ZONE 'Asia/Shanghai')-($1::int-1)*interval '1 day') AT TIME ZONE 'Asia/Shanghai') AND ($2::text IS NULL OR project_id=$2)`
        const params = [days, project]
        const [summary, daily, pages, events, referrers, devices, metrics, perProject] = await Promise.all([
          db.query(`SELECT count(*) FILTER(WHERE type='pageview')::int AS views,count(DISTINCT visitor) FILTER(WHERE type='pageview')::int AS visitors,count(DISTINCT session_id) FILTER(WHERE type='pageview')::int AS sessions,count(*) FILTER(WHERE type='error')::int AS errors,coalesce(sum(value) FILTER(WHERE type='engagement'),0)::float AS engagement FROM hub_events WHERE ${filter}`, params),
          db.query(`SELECT to_char(created_at AT TIME ZONE 'Asia/Shanghai','YYYY-MM-DD') AS day,count(*) FILTER(WHERE type='pageview')::int AS views,count(DISTINCT visitor) FILTER(WHERE type='pageview')::int AS visitors FROM hub_events WHERE ${filter} GROUP BY day ORDER BY day`, params),
          db.query(`SELECT path,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='pageview' GROUP BY path ORDER BY count DESC LIMIT 20`, params),
          db.query(`SELECT name,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='event' GROUP BY name ORDER BY count DESC LIMIT 20`, params),
          db.query(`SELECT referrer AS name,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='pageview' GROUP BY referrer ORDER BY count DESC LIMIT 10`, params),
          db.query(`SELECT device AS name,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='pageview' GROUP BY device ORDER BY count DESC`, params),
          db.query(`SELECT name,round(avg(value)::numeric,2)::float AS value FROM hub_events WHERE ${filter} AND type='metric' GROUP BY name`, params),
          db.query(`SELECT project_id,count(*) FILTER(WHERE type='pageview')::int AS views,count(DISTINCT visitor) FILTER(WHERE type='pageview')::int AS visitors,count(*) FILTER(WHERE type='error')::int AS errors FROM hub_events WHERE ${filter} GROUP BY project_id ORDER BY views DESC`, params),
        ])
        return json({ days, summary: summary[0], daily, pages, events, referrers, devices, metrics, perProject })
      }
      return json({ error: '接口不存在' }, 404)
    }
    if (path === '/api/messages') {
      if (request.method === 'GET') {
        const db = await getDatabase()
        return json({ messages: await db.query('SELECT id::text,user_id,login,name,content,created_at FROM hub_messages ORDER BY created_at DESC,id DESC LIMIT 100') })
      }
      if (!['POST', 'DELETE'].includes(request.method)) return json({ error: '不支持的操作' }, 405)
      if (!user) return json({ error: '请先使用 GitHub 登录' }, 401)
      if (!sameOrigin(request, config)) return json({ error: '请求来源无效' }, 403)
      const body = await readBody(request)
      const db = await getDatabase()
      if (request.method === 'DELETE') {
        if (!/^\d{1,20}$/.test(String(body.id))) return json({ error: '留言编号无效' }, 400)
        const removed = await db.query('DELETE FROM hub_messages WHERE id=$1::bigint AND (user_id=$2 OR $3::boolean) RETURNING id', [body.id, user.id, user.isOwner])
        return removed.length ? json({ ok: true }) : json({ error: '留言不存在或无权删除' }, 403)
      }
      if (typeof body.content !== 'string' || !body.content.trim() || body.content.trim().length > 1000) return json({ error: '留言请保持在 1–1000 字之间' }, 400)
      if (!await rateLimit(db, 'message:' + user.id, 1, 30)) return json({ error: '请等待 30 秒后再留言' }, 429)
      const rows = await db.query('INSERT INTO hub_messages(user_id,login,name,content) VALUES($1,$2,$3,$4) RETURNING id::text,user_id,login,name,content,created_at', [user.id, user.login, user.name, body.content.trim()])
      return json({ message: rows[0] }, 201)
    }
    if (path === '/api/collect') {
      const projectId = url.searchParams.get('project')
      if (!projectId || !/^[a-z\d-]{1,80}$/.test(projectId)) return json({ error: '项目编号无效' }, 400)
      const origin = request.headers.get('origin')
      const db = await getDatabase()
      const [project] = await db.query('SELECT origins FROM hub_projects WHERE id=$1', [projectId])
      if (!project || !origin || !((projectId === 'x-reader' && /^chrome-extension:\/\/[a-p]{32}$/.test(origin)) || project.origins.includes(origin) || (!process.env.VERCEL && projectId === 'alexwjj-hub' && origin === config.origin))) return json({ error: '未登记的项目来源' }, 403)
      const headers = { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'Content-Type', 'vary': 'Origin' }
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
      if (request.method !== 'POST') return new Response(null, { status: 405, headers })
      const events = validateEvents(await readBody(request), projectId, config.secret)
      const address = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local'
      if (!await rateLimit(db, 'collect:' + hash(`${config.secret}:${projectId}:${address}`), 120, 60)) return new Response(null, { status: 429, headers })
      const params = events.map(e => ({ id: e.id, type: e.type, name: e.name, path: e.path, visitor: e.visitor, session: e.session, referrer: e.referrer, device: e.device, value: e.value }))
      await db.query(`INSERT INTO hub_events(id,project_id,type,name,path,visitor,session_id,referrer,device,value)
        SELECT (x->>'id')::uuid,$1,x->>'type',x->>'name',x->>'path',x->>'visitor',x->>'session',x->>'referrer',x->>'device',(x->>'value')::float
        FROM jsonb_array_elements($2::jsonb) x ON CONFLICT(id) DO NOTHING`, [projectId, JSON.stringify(params)])
      return new Response(null, { status: 204, headers })
    }
    return json({ error: '接口不存在' }, 404)
  }
}
