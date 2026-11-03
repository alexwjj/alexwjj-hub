import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export function configuration(env = process.env) {
  const origin = new URL(env.APP_ORIGIN || 'http://127.0.0.1:5173').origin
  if (env.VERCEL && !origin.startsWith('https://')) throw new Error('APP_ORIGIN must use HTTPS')
  return { origin, secret: env.SESSION_SECRET || '', clientId: env.GITHUB_CLIENT_ID || '', clientSecret: env.GITHUB_CLIENT_SECRET || '', ownerId: env.OWNER_GITHUB_ID || '29943063' }
}

export function seal(value, secret) {
  if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters')
  const data = Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`
}

export function unseal(token, secret, now = Date.now()) {
  try {
    if (!token || token.length > 4096 || secret.length < 32) return null
    const [data, signature, extra] = token.split('.')
    if (!data || !signature || extra) return null
    const expected = createHmac('sha256', secret).update(data).digest()
    const actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) return null
    const value = JSON.parse(Buffer.from(data, 'base64url').toString())
    return Number.isFinite(value.exp) && value.exp > now ? value : null
  } catch { return null }
}

function cookieName(config, kind) { return `${config.origin.startsWith('https://') ? '__Host-' : ''}hub_${kind}` }
export function cookie(config, kind, value, seconds) {
  return `${cookieName(config, kind)}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${config.origin.startsWith('https://') ? '; Secure' : ''}`
}
function readCookie(request, name) {
  const part = request.headers.get('cookie')?.split(';').find(p => p.trim().startsWith(name + '='))
  try { return part ? decodeURIComponent(part.trim().slice(name.length + 1)) : null } catch { return null }
}
export function session(request, config) {
  const value = unseal(readCookie(request, cookieName(config, 'session')), config.secret)
  if (!value || !/^\d+$/.test(value.id) || typeof value.login !== 'string' || typeof value.name !== 'string') return null
  return { id: value.id, login: value.login, name: value.name, isOwner: value.id === config.ownerId }
}
export function sameOrigin(request, config) { return request.headers.get('origin') === config.origin }

export async function authRoute(request, config, fetcher = fetch) {
  const path = new URL(request.url).pathname
  const enabled = config.secret.length >= 32 && !!config.clientId && !!config.clientSecret
  if (path === '/api/auth/session') return Response.json({ user: session(request, config), loginEnabled: enabled })
  if (path === '/api/auth/logout') {
    if (request.method !== 'POST' || !sameOrigin(request, config)) return Response.json({ error: '请求来源无效' }, { status: 403 })
    return Response.json({ ok: true }, { headers: { 'set-cookie': cookie(config, 'session', '', 0) } })
  }
  if (!enabled) return Response.json({ error: 'GitHub 登录尚未完成配置' }, { status: 503 })
  if (path === '/api/auth/login' && request.method === 'GET') {
    const state = randomBytes(32).toString('base64url')
    const verifier = randomBytes(32).toString('base64url')
    const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.origin + '/api/auth/callback', state, scope: 'read:user', code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' })
    return new Response(null, { status: 302, headers: { location: 'https://github.com/login/oauth/authorize?' + params, 'set-cookie': cookie(config, 'oauth', seal({ state, verifier, exp: Date.now() + 600_000 }, config.secret), 600) } })
  }
  if (path === '/api/auth/callback' && request.method === 'GET') {
    const url = new URL(request.url)
    const state = unseal(readCookie(request, cookieName(config, 'oauth')), config.secret)
    const fail = () => new Response(null, { status: 302, headers: { location: config.origin + '/#/guestbook?login=failed', 'set-cookie': cookie(config, 'oauth', '', 0) } })
    if (!state || url.searchParams.get('state') !== state.state || !url.searchParams.get('code') || url.searchParams.has('error')) return fail()
    try {
      const tokenResponse = await fetcher('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code: url.searchParams.get('code'), code_verifier: state.verifier, redirect_uri: config.origin + '/api/auth/callback' }), signal: AbortSignal.timeout(10_000) })
      if (!tokenResponse.ok) return fail()
      const token = await tokenResponse.json()
      if (!token.access_token) return fail()
      const response = await fetcher('https://api.github.com/user', { headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'alexwjj-hub' }, signal: AbortSignal.timeout(10_000) })
      if (!response.ok) return fail()
      const user = await response.json()
      if (!Number.isSafeInteger(user.id) || user.id <= 0 || !/^[a-z\d-]{1,39}$/i.test(user.login)) return fail()
      const value = { id: String(user.id), login: user.login, name: String(user.name || user.login).slice(0, 100), exp: Date.now() + 7 * 86_400_000 }
      const headers = new Headers({ location: config.origin + '/#/guestbook' })
      headers.append('set-cookie', cookie(config, 'session', seal(value, config.secret), 7 * 86400))
      headers.append('set-cookie', cookie(config, 'oauth', '', 0))
      return new Response(null, { status: 302, headers })
    } catch { return fail() }
  }
  return Response.json({ error: '接口不存在' }, { status: 404 })
}
