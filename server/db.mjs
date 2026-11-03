import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'
import catalog from '../src/content/projects.json' with { type: 'json' }

export async function createDatabase({ url = process.env.DATABASE_URL, localPath = process.env.LOCAL_DB_DIR || '.local/postgres', production = !!process.env.VERCEL } = {}) {
  let query, close = async () => {}
  if (url) { const sql = neon(url); query = (text, params = []) => sql.query(text, params) }
  else {
    if (production) throw new Error('DATABASE_URL is required')
    const { PGlite } = await import('@electric-sql/pglite')
    const pg = new PGlite(localPath)
    await pg.waitReady
    query = async (text, params = []) => (await pg.query(text, params)).rows
    close = () => pg.close()
  }
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
  // Each statement is independent and safe to repeat on a new database.
  for (const statement of schema.split(';').map(s => s.trim()).filter(Boolean)) await query(statement)
  const db = { query, close }
  await seedProjects(db, catalog)
  return db
}

export async function seedProjects(db, projects) {
  const rows = projects.map(p => ({ id: p.id, name: p.name, url: p.url || null, repo: p.source || null, visibility: p.visibility || 'public', origins: p.origins || [] }))
  await db.query(`INSERT INTO hub_projects(id,name,url,repo,visibility,origins)
    SELECT x->>'id',x->>'name',x->>'url',x->>'repo',x->>'visibility',x->'origins' FROM jsonb_array_elements($1::jsonb) x
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,repo=coalesce(excluded.repo,hub_projects.repo),
    visibility=CASE WHEN hub_projects.visibility='private' THEN 'private' ELSE excluded.visibility END,origins=excluded.origins`, [JSON.stringify(rows)])
}

let connection
export function database() {
  if (!connection) connection = createDatabase().catch(error => { connection = undefined; throw error })
  return connection
}

export async function rateLimit(db, key, limit, seconds) {
  const rows = await db.query(`INSERT INTO hub_limits(key,count,expires_at) VALUES($1,1,now()+$2::int*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN hub_limits.expires_at<now() THEN 1 ELSE hub_limits.count+1 END,
    expires_at=CASE WHEN hub_limits.expires_at<now() THEN excluded.expires_at ELSE hub_limits.expires_at END RETURNING count`, [key, seconds])
  return rows[0].count <= limit
}
