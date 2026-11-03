import { readFile } from 'node:fs/promises'
import { createDatabase, seedProjects } from '../server/db.mjs'
const db = await createDatabase()
try {
  if (process.argv.includes('--private')) {
    const projects = JSON.parse(await readFile('.local/private-projects.json', 'utf8'))
    await seedProjects(db, projects)
    console.log(`Imported ${projects.length} owner-only repository records.`)
  }
  console.log('Hub schema and project registry ready.')
} finally { await db.close() }
