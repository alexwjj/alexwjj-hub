// Run with: ego-browser nodejs < scripts/glass-smoke.mjs
const { default: assert } = await import('node:assert/strict')
const page = (await taskSpace('Alex personal hub')).page('p1')
const origin = 'http://127.0.0.1:5173/'
const settle = () => page.evaluate(async () => {
  await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})))
  for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame)
})
await page.cdp('Emulation.setEmulatedMedia', { features: [] })
await page.goto(origin)
await page.waitForSelector('.liquid-scene[data-renderer="webgl"]')
await page.click('loc=role:button[name="深色主题"]')
await settle()
await page.evaluate(() => {
  window.__glassDraws = 0
  const gl = document.querySelector('.liquid-scene').getContext('webgl')
  const draw = gl.drawArrays.bind(gl)
  gl.drawArrays = (...args) => { window.__glassDraws++; draw(...args) }
})
await settle()
const idle = await page.evaluate(() => window.__glassDraws)
await settle()
assert.equal(await page.evaluate(() => window.__glassDraws), idle, 'No continuous rendering while idle')
await page.mouse.move(780, 180)
await settle()
assert(await page.evaluate(() => window.__glassDraws) > idle, 'Pointer updates the optical layer')
await page.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
await settle()
await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
const readLight = () => page.evaluate(() => {
  const gl = document.querySelector('canvas').getContext('webgl')
  const program = gl.getParameter(gl.CURRENT_PROGRAM)
  return [...gl.getUniform(program, gl.getUniformLocation(program, 'pointer'))]
})
const reduced = await readLight()
await page.mouse.move(850, 190)
await settle()
assert.deepEqual(await readLight(), reduced, 'Reduced motion disables pointer lighting')
await page.cdp('Emulation.setEmulatedMedia', { features: [] })
await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 3, mobile: false })
await settle()
assert(await page.evaluate(() => Math.max(document.querySelector('canvas').width, document.querySelector('canvas').height) <= 2400), 'Retina backing buffer is bounded')
await page.cdp('Emulation.clearDeviceMetricsOverride')
await page.keyboard.press('ControlOrMeta+k')
await page.fill('loc=role:textbox[name="搜索作品、工具、工作流"]', 'codex')
const canLoseContext = await page.evaluate(() => {
  window.__glassExtension = document.querySelector('.liquid-scene').getContext('webgl').getExtension('WEBGL_lose_context')
  return !!window.__glassExtension
})
assert(canLoseContext, 'Test browser exposes WebGL context loss extension')
await page.evaluate(() => window.__glassExtension.loseContext())
await page.waitForFunction(() => !document.querySelector('.liquid-scene').dataset.renderer)
assert.equal(await page.evaluate(() => document.querySelector('.search-input-wrap input').value), 'codex', 'Context loss preserves input')
await page.evaluate(() => window.__glassExtension.restoreContext())
await page.waitForSelector('.liquid-scene[data-renderer="webgl"]')
assert.equal(await page.evaluate(() => document.querySelector('.search-input-wrap input').value), 'codex', 'Context restore preserves input without a reload')
assert.equal(await page.evaluate(() => document.querySelector('.liquid-scene').getContext('webgl').getError()), 0, 'No WebGL error after restoration')
await page.keyboard.press('Escape')
const injection = await page.cdp('Page.addScriptToEvaluateOnNewDocument', {
  source: `const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    return type === 'webgl' ? null : original.call(this, type, ...args);
  };`,
})
try {
  await page.reload()
  await page.waitForSelector('h1')
  await settle()
  assert(await page.evaluate(() => !document.querySelector('.liquid-scene').dataset.renderer), 'CSS fallback without WebGL')
  await page.click('loc=role:button[name="打开全局搜索"]')
  await page.waitForSelector('[role="dialog"] .search-input-wrap')
  await page.fill('loc=role:textbox[name="搜索作品、工具、工作流"]', 'claude')
  await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0)
  assert(await page.evaluate(() => getComputedStyle(document.querySelector('.panel')).backdropFilter !== 'none'), 'CSS glass remains available')
} finally {
  await page.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier })
  await page.reload()
  await page.waitForSelector('.liquid-scene[data-renderer="webgl"]')
}
console.log('PASS: idle rendering, pointer light, reduced motion, retina bounds, context loss/restore with retained input, CSS fallback and native search.')
