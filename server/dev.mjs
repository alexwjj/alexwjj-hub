import { createServer } from 'node:http'
import { createHandler } from './app.mjs'
const handler = createHandler()
createServer(async (incoming, outgoing) => {
  try {
    const chunks = []; let length = 0
    for await (const chunk of incoming) { length += chunk.length; if (length > 24_000) { outgoing.writeHead(413); outgoing.end(); return } chunks.push(chunk) }
    const request = new Request('http://127.0.0.1:5005' + incoming.url, { method: incoming.method, headers: incoming.headers, ...(!['GET', 'HEAD'].includes(incoming.method) ? { body: Buffer.concat(chunks) } : {}) })
    const response = await handler(request)
    const headers = Object.fromEntries(response.headers)
    if (response.headers.getSetCookie().length) headers['set-cookie'] = response.headers.getSetCookie()
    outgoing.writeHead(response.status, headers)
    outgoing.end(Buffer.from(await response.arrayBuffer()))
  } catch { outgoing.writeHead(500); outgoing.end('API unavailable') }
}).listen(5005, '127.0.0.1', () => console.log('API http://127.0.0.1:5005'))
