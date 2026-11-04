// Run with: ego-browser nodejs < scripts/glass-smoke.mjs
const { default: assert } = await import('node:assert/strict')
const page = (await taskSpace('Alex personal hub')).page('p1')
const settle = () => page.evaluate(async () => {
  await Promise.all(document.getAnimations().filter(a => a.playState === 'running').map(a => a.finished.catch(() => {})))
  for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame)
})
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
await page.click('loc=role:button[name="浅色主题"]')
await page.waitForSelector('[data-glass="lens"]')
await settle()
assert(await page.evaluate(async () => {
  const selector = document.querySelector('.search-trigger').style.getPropertyValue('--glass-backdrop').match(/#([^"]+)/)[1]
  const image = new Image()
  image.src = document.querySelector(`#${selector} feImage`).getAttribute('href')
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width; canvas.height = image.height
  const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
  const left = context.getImageData(1, Math.floor(image.height / 2), 1, 1).data[0]
  const right = context.getImageData(image.width - 2, Math.floor(image.height / 2), 1, 1).data[0]
  return left > 128 && right < 128
}), 'Convex lens samples inward at both rims without clipping the backdrop')
assert.equal(await page.evaluate(() => document.querySelectorAll('canvas').length), 0, 'No separate screen-space surface renderer')
const pointer = await page.evaluate(() => {
  const rect = document.querySelector('.search-trigger').getBoundingClientRect()
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
})
await page.mouse.move(pointer.x, pointer.y)
await page.mouse.down()
await page.waitForFunction(() => { const scale = getComputedStyle(document.querySelector('.search-trigger')).scale; return scale !== 'none' && scale !== '1' })
await page.mouse.up()
await page.waitForSelector('[role="dialog"]')
await settle()
assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.search-trigger')).scale), 'none', 'Press spring settles and releases its animation')
await page.keyboard.press('Escape')
await page.waitForSelector('[role="dialog"]', { state: 'hidden' })

await page.click('loc=role:tab[name="MCP"]')
await settle()
assert(await page.evaluate(() => {
  const tab = document.querySelector('.capability-tabs [aria-selected="true"]').getBoundingClientRect()
  const indicator = document.querySelector('.capability-tabs [data-slot="tabs-indicator"]').getBoundingClientRect()
  return Math.abs(tab.x - indicator.x) < 2 && Math.abs(tab.width - indicator.width) < 2
}), 'Sliding glass indicator ends at the selected tab')

await page.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await page.mouse.move(pointer.x, pointer.y)
await page.mouse.down()
assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.search-trigger')).scale), 'none', 'Reduced motion disables press deformation')
await page.mouse.up()
await page.keyboard.press('Escape')
await page.cdp('Emulation.setEmulatedMedia', { features: [] })
for (const height of [500, 640, 900]) {
  await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height, deviceScaleFactor: 1, mobile: false })
  await settle()
  const menu = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar')
    return { height: sidebar.clientHeight, content: sidebar.scrollHeight, overflow: getComputedStyle(sidebar).overflowY, bottom: document.querySelector('.profile-card').getBoundingClientRect().bottom }
  })
  assert(menu.content <= menu.height + 1, `Sidebar fits ${height}px: ${JSON.stringify(menu)}`)
  assert(['clip', 'hidden'].includes(menu.overflow))
  assert(menu.bottom < height, 'Profile remains reachable')
}
await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await page.mouse.move(1000, 700)
await page.mouse.wheel(0, 650)
assert(await page.evaluate(() => scrollY > 100), 'Real scrolling occurred')
assert.equal(await page.evaluate(() => document.querySelectorAll('.liquid-scene').length), 0, 'No fixed canvas can lag behind DOM scrolling')
await page.screenshot({ path: '/Users/didi/Desktop/warp/alexwjj-hub/.local/scroll-regression.png' })
await page.cdp('Emulation.clearDeviceMetricsOverride')
const injection = await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `const supports = CSS.supports.bind(CSS); CSS.supports = (...args) => args.join('').includes('url(') ? false : supports(...args);` })
try {
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('h1')
  await settle()
  assert.equal(await page.evaluate(() => document.querySelectorAll('[data-glass="lens"]').length), 0)
  assert(await page.evaluate(() => getComputedStyle(document.querySelector('.panel')).backdropFilter.includes('blur')), 'Native CSS glass fallback')
  await page.click('loc=role:button[name="打开全局搜索"]')
  await page.waitForSelector('[role="dialog"]')
  await page.fill('loc=role:textbox[name="搜索作品、工具、工作流"]', 'pencil')
  await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0)
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-glass="lens"]')
}
console.log('PASS: DOM-bound glass, press/release spring, tab indicator, reduced motion, sidebar at 500/640/900px, real scrolling and CSS fallback.')
