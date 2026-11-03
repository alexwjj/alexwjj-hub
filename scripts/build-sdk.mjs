import { mkdir, copyFile } from 'node:fs/promises'
await mkdir(new URL('../public/sdk/', import.meta.url), { recursive: true })
await copyFile(new URL('../sdk/index.js', import.meta.url), new URL('../public/sdk/hub.js', import.meta.url))
