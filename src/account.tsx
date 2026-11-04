import { analyticsSnippet } from './lib/analytics';
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, Code2, Copy, Loader2, LogOut, MessageSquare, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './account.css'

export type User = { id: string; login: string; name: string; isOwner: boolean }
type AuthState = { user: User | null; loading: boolean; loginEnabled: boolean; logout: () => Promise<void> }
const AuthContext = createContext<AuthState>({ user: null, loading: true, loginEnabled: false, logout: async () => {} })
export const useAuth = () => useContext(AuthContext)

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...options })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || '请求失败，请稍后重试')
  return body
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ user: null as User | null, loading: true, loginEnabled: false })
  useEffect(() => {
    const controller = new AbortController()
    api<{ user: User | null; loginEnabled: boolean }>('/api/auth/session', { signal: controller.signal }).then(value => setState({ ...value, loading: false })).catch(() => { if (!controller.signal.aborted) setState({ user: null, loading: false, loginEnabled: false }) })
    return () => controller.abort()
  }, [])
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }); setState(s => ({ ...s, user: null })) }
  return <AuthContext.Provider value={{ ...state, logout }}>{children}</AuthContext.Provider>
}

export function AccountButton() {
  const { user, loading, loginEnabled, logout } = useAuth()
  const [error, setError] = useState('')
  if (loading) return <span className="account-loading" aria-label="正在检查登录"><Loader2 size={14} /></span>
  if (!user) return <Button className="account-login" size="sm" variant="outline" nativeButton={false} render={<a href="/api/auth/login" />} disabled={!loginEnabled} title={loginEnabled ? '使用 GitHub 登录' : 'GitHub 登录暂未开放'}><Code2 size={14} /><span>GitHub 登录</span></Button>
  return <div className="account-control"><Link className="account-name" to={user.isOwner ? '/admin' : '/guestbook'}>{user.isOwner && <ShieldCheck size={14} />}<span>@{user.login}</span></Link><button aria-label="退出登录" title={error || '退出登录'} onClick={() => { logout().catch(() => setError('退出失败，请重试')) }}><LogOut size={14} /></button></div>
}

function Header({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <header className="page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{children}</p></header>
}

type Message = { id: string; user_id: string; login: string; name: string; content: string; created_at: string }
export function Guestbook() {
  const { user, loginEnabled, loading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState(''), [error, setError] = useState(''), [listError, setListError] = useState('')
  const [busy, setBusy] = useState(false), [fetching, setFetching] = useState(true)
  const location = useLocation()
  async function refresh() {
    setFetching(true); setListError('')
    try { const data = await api<{ messages: Message[] }>('/api/messages'); setMessages(data.messages) } catch (e) { setListError((e as Error).message) } finally { setFetching(false) }
  }
  useEffect(() => { void refresh() }, [])
  return <><Header eyebrow="LEAVE A LITTLE SOMETHING" title="来都来了，留句话吧。">聊聊作品、分享工具，或者只是打个招呼。</Header>
    {new URLSearchParams(location.search).get('login') === 'failed' && <p className="inline-error" role="alert">GitHub 登录未完成，请重新登录。</p>}
    <section className="panel guestbook-compose">
      <div className="guestbook-compose-title"><MessageSquare size={19} /><h2>{user ? `你好，${user.name}` : '很高兴在这里遇见你'}</h2></div>
      {user ? <form onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); setError(''); try { const data = await api<{ message: Message }>('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) }); setMessages(old => [data.message, ...old]); setText('') } catch (err) { setError((err as Error).message) } finally { setBusy(false) } }}>
        <label htmlFor="message" className="sr-only">写下留言</label><textarea id="message" placeholder="写下想分享的话…" value={text} onChange={e => setText(e.target.value)} maxLength={1000} required rows={4} />
        <div className="compose-bottom"><span>{text.length} / 1000<span className="dot-divider">·</span>每 30 秒可发布一条</span><Button disabled={busy || !text.trim()} type="submit">{busy ? <Loader2 size={14} /> : <ArrowUpRight size={14} />}{busy ? '正在发布' : '发布留言'}</Button></div>
      </form> : <div className="guestbook-signin"><p>留言需要 GitHub 登录。其他内容可以自由浏览。</p><Button nativeButton={false} render={<a href="/api/auth/login" />} disabled={loading || !loginEnabled}><Code2 size={15} />GitHub 登录后留言</Button>{!loading && !loginEnabled && <span>登录暂未开放，请稍后再来。</span>}</div>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
    <div className="guestbook-list-title"><h2>这里的声音 <span>{messages.length}</span></h2><Button size="sm" variant="ghost" onClick={() => void refresh()} disabled={fetching}><RefreshCw size={13} />刷新</Button></div>
    {fetching && !messages.length ? <p className="data-placeholder">正在读取留言…</p> : listError ? <p className="inline-error" role="alert">{listError}</p> : !messages.length ? <div className="data-placeholder"><MessageSquare size={25} /><p>还没有留言，期待第一声问候。</p></div> : <div className="messages-list">{messages.map(message => <article className="message-card" key={message.id}><div className="message-avatar">{message.login.slice(0, 1).toUpperCase()}</div><div className="message-main"><div className="message-meta"><a href={`https://github.com/${message.login}`} target="_blank" rel="noopener noreferrer">{message.name} <span>@{message.login}</span></a><time dateTime={message.created_at}>{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(message.created_at))}</time>{user && (user.isOwner || user.id === message.user_id) && <button className="delete-message" aria-label={`删除 ${message.login} 的留言`} onClick={async () => { if (!window.confirm('删除这条留言？')) return; try { await api('/api/messages', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: message.id }) }); setMessages(old => old.filter(m => m.id !== message.id)) } catch (e) { setError((e as Error).message) } }}><Trash2 size={13} /></button>}</div><p>{message.content}</p></div></article>)}</div>}
  </>
}

type RegistryProject = { id: string; name: string; url: string | null; repo: string | null; visibility: string; origins: string[] }
type CountRow = { name?: string; path?: string; count: number }
type Analytics = { summary: { views: number; visitors: number; sessions: number; errors: number; engagement: number }; daily: { day: string; views: number; visitors: number }[]; pages: CountRow[]; events: CountRow[]; referrers: CountRow[]; devices: CountRow[]; metrics: { name: string; value: number }[]; perProject: { project_id: string; views: number; visitors: number; errors: number }[] }

function Breakdown({ title, rows }: { title: string; rows: CountRow[] }) {
  return <section className="panel breakdown-panel"><h2>{title}</h2>{rows.length ? rows.map((r, i) => <div className="breakdown-row" key={`${r.path || r.name}-${i}`}><span title={r.path || r.name}>{r.path || r.name || '直接访问'}</span><strong>{r.count.toLocaleString()}</strong></div>) : <p className="data-placeholder small">暂无数据</p>}</section>
}

export function OwnerDashboard() {
  const { user, loading } = useAuth()
  const [days, setDays] = useState('30'), [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<RegistryProject[]>([]), [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(true), [version, setVersion] = useState(0)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!user?.isOwner) return
    const controller = new AbortController(); setBusy(true); setError('')
    Promise.all([api<{ projects: RegistryProject[] }>('/api/admin/projects', { signal: controller.signal }), api<Analytics>(`/api/admin/analytics?days=${days}${projectId ? '&project=' + encodeURIComponent(projectId) : ''}`, { signal: controller.signal })]).then(([registry, report]) => { setProjects(registry.projects); setData(report) }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [user?.isOwner, days, projectId, version])
  if (loading) return <p className="data-placeholder">正在检查身份…</p>
  if (!user?.isOwner) return <div className="empty-state"><ShieldCheck size={32} /><h1>这是站长的工作区</h1><p>只有站点所有者可以查看作品数据。</p><Button nativeButton={false} render={<Link to="/" />}>回到总览<ArrowRight size={14} /></Button></div>
  const selected = projects.find(p => p.id === projectId)
  const max = Math.max(1, ...(data?.daily.map(d => d.views) || []))
  const chartDays = Array.from({ length: Number(days) }, (_, i) => { const day = new Date(Date.now() + 8 * 3600_000 - (Number(days) - i - 1) * 86400_000).toISOString().slice(0, 10); return data?.daily.find(d => d.day === day) || { day, views: 0, visitors: 0 } })
  const snippet = analyticsSnippet(selected?.id || '')
  return <><Header eyebrow="OWNER WORKSPACE" title="作品数据，一处看见。">只有你能看到这里。数据来自各作品接入的 SDK，不会展示给访客。</Header>
    <div className="analytics-controls"><label>项目<select value={projectId} onChange={e => { setProjectId(e.target.value); setCopied(false) }}><option value="">全部作品</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.visibility === 'private' ? ' · 私有' : ''}</option>)}</select></label><label>时间<select value={days} onChange={e => setDays(e.target.value)}><option value="7">最近 7 天</option><option value="30">最近 30 天</option><option value="90">最近 90 天</option></select></label><Button variant="outline" size="sm" disabled={busy} onClick={() => setVersion(v => v + 1)}><RefreshCw size={14} />刷新</Button></div>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {busy && <p className="data-loading" role="status">正在读取作品数据…</p>}
    {data && <><div className="stats-grid">{[{ name: '浏览量 PV', value: data.summary.views }, { name: '独立访客 UV', value: data.summary.visitors }, { name: '访问会话', value: data.summary.sessions }, { name: '平均前台停留', value: `${Math.round(data.summary.engagement / Math.max(1, data.summary.sessions) / 1000)}s` }, { name: 'JS 错误', value: data.summary.errors }].map(s => <section className="panel stat-card" key={s.name}><span>{s.name}</span><strong>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</strong></section>)}</div>
      <section className="panel traffic-chart"><div className="section-heading"><h2>浏览趋势</h2><span className="muted-small">上海时间 · 每日 PV</span></div><div className="traffic-bars" role="img" aria-label={`最近 ${days} 天浏览量趋势`} >{chartDays.map(d => <div key={d.day} className="traffic-day" title={`${d.day}：${d.views} PV / ${d.visitors} UV`}><span style={{ height: `${Math.max(d.views ? 3 : 1, d.views / max * 100)}%` }} /></div>)}</div><div className="chart-axis"><span>{chartDays[0].day}</span><span>{chartDays.at(-1)?.day}</span></div>{!data.summary.views && <p className="chart-empty">接入 SDK 后，真实访问会出现在这里。</p>}</section>
      <div className="breakdown-grid"><Breakdown title="访问页面" rows={data.pages} /><Breakdown title="自定义事件" rows={data.events} /><Breakdown title="访问来源" rows={data.referrers} /><Breakdown title="设备类型" rows={data.devices} /></div>
      {!!data.metrics.length && <div className="metrics-row">{data.metrics.map(m => <span key={m.name}>{m.name === 'load_ms' ? '平均加载耗时' : m.name === 'lcp_ms' ? '平均 LCP' : m.name === 'cls' ? '平均 CLS' : m.name}<strong>{m.value}{m.name.endsWith('_ms') ? ' ms' : ''}</strong></span>)}</div>}
    </>}
    <section className="panel sdk-panel"><div className="section-heading"><h2><Code2 size={18} />接入一个作品</h2><span className="muted-small">@alexwjj/hub-sdk · 0.1.0</span></div><p>在上方选择项目，将这段代码放进对应网站。无需在作品中放任何密钥。</p><pre><code>{snippet}</code></pre><div className="sdk-panel-bottom"><span>{selected ? `允许来源：${selected.origins.join('、') || '尚未登记网站域名'}` : '先选择一个项目，即可生成接入代码。'}</span><Button variant="outline" size="sm" disabled={!selected} onClick={async () => { try { await navigator.clipboard.writeText(snippet); setCopied(true) } catch { setError('复制失败，请手动选择代码') } }}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? '已复制' : '复制代码'}</Button></div></section>
    <section className="panel registry-panel"><h2>作品清单 <span>{projects.length}</span></h2><div className="registry-table-wrap"><table><thead><tr><th>作品</th><th>项目 ID</th><th>范围</th><th>PV</th><th>UV</th><th>入口</th></tr></thead><tbody>{projects.map(p => { const counts = data?.perProject.find(x => x.project_id === p.id); return <tr key={p.id}><td>{p.name}</td><td><code>{p.id}</code></td><td>{p.visibility === 'private' ? '仅自己' : '公开'}</td><td>{counts?.views || 0}</td><td>{counts?.visitors || 0}</td><td>{p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`打开 ${p.name}`}><ArrowUpRight size={15} /></a>}{p.repo && <a href={p.repo} target="_blank" rel="noopener noreferrer" aria-label={`打开 ${p.name} 仓库`}><Code2 size={15} /></a>}</td></tr> })}</tbody></table></div></section>
    <p className="analytics-footnote">UV 按项目计算，同一人在不同项目会分别计数。未接入的项目显示为 0；客户端拦截或关闭页面可能造成少量漏记。访问统计不用于结算。</p>
  </>
}
