// ego-browser nodejs < scripts/glass-motion-smoke.mjs
// Isolated API: 5006 / preview: 5174 / LOCAL_DB_DIR=memory://; never production.
const assert = (await import("node:assert/strict")).default;
const fs = await import("node:fs/promises");
const task = await taskSpace("Alex Hub Liquid Motion");
const p = task.page("p1");
const base = "http://localhost:5174/";
const report = {};
const settle = () =>
  p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => {})),
    );
    await new Promise((r) => setTimeout(r, 600));
  });
await p.goto(base + "#/resources");
await p.cdp("Emulation.setDeviceMetricsOverride", {
  width: 1600,
  height: 1208,
  deviceScaleFactor: 1,
  mobile: false,
});
await p.waitForSelector(".liquid-indicator");
await settle();
if (
  await p.evaluate(() => document.documentElement.classList.contains("dark"))
) {
  await p.click('loc=role:button[name="浅色主题"]');
  await p.waitForFunction(
    () => !document.documentElement.hasAttribute("data-theme-transition"),
  );
}

// Record real intermediate positions, rather than only checking final classes.
report.sidebar = await p.evaluate(async () => {
  const region = document.querySelector(".sidebar .nav-selection-region");
  const target = region.querySelector('a[href="#/discover"]');
  const start = region
    .querySelector(".liquid-indicator")
    .getBoundingClientRect().y;
  const end = target.getBoundingClientRect().y;
  target.click();
  const samples = [],
    began = performance.now();
  while (performance.now() - began < 700) {
    await new Promise(requestAnimationFrame);
    const indicator = region.querySelector(".liquid-indicator");
    samples.push({
      t: Math.round(performance.now() - began),
      y: indicator?.getBoundingClientRect().y,
    });
  }
  return { start, end, samples };
});
await fs.writeFile(
  "/Users/didi/Desktop/warp/alexwjj-hub/.local/glass-motion-sidebar.json",
  JSON.stringify(report.sidebar, null, 2),
);
assert(
  new Set(report.sidebar.samples.map((s) => Math.round(s.y))).size >= 2,
  "Selection must travel, not teleport",
);
assert(
  report.sidebar.samples.some(
    (s) => s.y > report.sidebar.start + 1 && s.y < report.sidebar.end - 1,
  ),
);
await settle();

// Retarget a running spring across both menu sections.
await p.evaluate(async () => {
  for (const href of ["#/tools", "#/resources", "#/about", "#/projects"]) {
    document.querySelector(`.sidebar a[href="${href}"]`).click();
    await new Promise((r) => setTimeout(r, 45));
  }
});
await settle();
report.retarget = await p.evaluate(() => {
  const a = document.querySelector(".sidebar .nav-item.selected");
  const i = document.querySelector(".sidebar .liquid-indicator");
  return {
    label: a.textContent,
    delta: Math.abs(a.getBoundingClientRect().y - i.getBoundingClientRect().y),
    count: document.querySelectorAll(".sidebar .liquid-indicator").length,
  };
});
assert.equal(report.retarget.count, 1);
assert(report.retarget.label.includes("作品") && report.retarget.delta < 1);

await p.click("loc=href:/#/resources");
await p.waitForSelector(".capabilities-controls");
await settle();
await p.click(".capabilities-controls .segment button:nth-child(2)");
await p.waitForSelector(".mcp-grid");
await settle();
assert.equal(
  await p.evaluate(
    () => document.querySelectorAll(".mcp-grid .resource-card").length,
  ),
  6,
);
await p.click(".capabilities-controls .segment button:first-child");
await p.waitForSelector(".skills-grid");
await p.click(".filter-pills button:nth-child(3)");
await settle();
assert.equal(
  await p.evaluate(
    () => document.querySelectorAll(".filter-pills .liquid-indicator").length,
  ),
  1,
);

// Keyboard activation preserves native focus and link semantics.
await p.focus('.sidebar a[href="#/tools"]');
await p.press('.sidebar a[href="#/tools"]', "Enter");
await p.waitForSelector(".tool-detail-card");
assert(
  await p.evaluate(
    () => document.activeElement?.getAttribute("href") === "#/tools",
  ),
);

await p.click('loc=role:button[name="打开全局搜索"]');
await p.waitForSelector('[role="dialog"]');
await settle();
report.dialog = await p.evaluate(() => ({
  scale: getComputedStyle(
    document.querySelector('[data-slot="dialog-content"]'),
  ).scale,
  focusInside: document
    .querySelector('[role="dialog"]')
    .contains(document.activeElement),
}));
assert(report.dialog.focusInside);
await p.keyboard.press("Escape");
await p.waitForSelector('[role="dialog"]', { state: "hidden" });

await p.click('loc=role:button[name="切换背景"]');
await p.waitForSelector(".background-panel");
await settle();
assert.equal(
  await p.evaluate(
    () => document.querySelector(".background-panel").dataset.glass,
  ),
  "lens",
  "Portal gets optical material",
);
await p.click(".wallpaper-choice:nth-child(2)");
await settle();
assert(
  await p.evaluate(() =>
    document
      .querySelector(".wallpaper-layer")
      .style.backgroundImage.includes("misty"),
  ),
);
await p.click('text="恢复默认"');
await p.click('loc=role:button[name="关闭背景设置"]');
await p.waitForSelector(".background-panel", { state: "hidden" });

await p.click('loc=role:button[name="深色主题"]');
await p.waitForFunction(() =>
  document.documentElement.classList.contains("dark"),
);
await p.waitForFunction(
  () => !document.documentElement.hasAttribute("data-theme-transition"),
);
await p.click('loc=role:button[name="浅色主题"]');
await p.waitForFunction(
  () => !document.documentElement.hasAttribute("data-theme-transition"),
);

await p.cdp("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await p.click("loc=href:/#/resources");
await settle();
assert.equal(
  await p.evaluate(
    () =>
      getComputedStyle(document.querySelector(".sidebar .liquid-indicator"))
        .transform,
  ),
  "none",
);
assert.equal(
  await p.evaluate(
    () => getComputedStyle(document.querySelector(".route-view")).animationName,
  ),
  "none",
);
await p.click('loc=role:button[name="深色主题"]');
assert.equal(
  await p.evaluate(() =>
    document.documentElement.hasAttribute("data-theme-transition"),
  ),
  false,
);
await p.click('loc=role:button[name="浅色主题"]');
await p.cdp("Emulation.setEmulatedMedia", { features: [] });

// Browser without SVG backdrop support keeps CSS glass and the same navigation.
const injection = await p.cdp("Page.addScriptToEvaluateOnNewDocument", {
  source:
    "const supports=CSS.supports.bind(CSS);CSS.supports=(...a)=>a.join('').includes('url(')?false:supports(...a);",
});
try {
  await p.reload();
  await p.waitForSelector(".liquid-indicator");
  await settle();
  assert.equal(
    await p.evaluate(
      () => document.querySelectorAll('[data-glass="lens"]').length,
    ),
    0,
  );
  assert(
    await p.evaluate(() =>
      getComputedStyle(
        document.querySelector(".liquid-indicator"),
      ).backdropFilter.includes("blur"),
    ),
  );
  await p.click("loc=href:/#/projects");
  await p.waitForSelector(".project-card");
} finally {
  await p.cdp("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: injection.identifier,
  });
  await p.reload();
  await p.waitForSelector('[data-glass="lens"]');
}

report.responsive = [];
for (const width of [390, 768, 1600]) {
  await p.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: 1208,
    deviceScaleFactor: 1,
    mobile: false,
  });
  for (const path of [
    "/",
    "/projects",
    "/resources",
    "/resources?kind=mcp",
    "/discover",
  ]) {
    await p.goto(base + "#" + path);
    await p.waitForSelector("h1");
    await settle();
    const result = await p.evaluate(() => ({
      width: innerWidth,
      content: document.documentElement.scrollWidth,
      canvas: document.querySelectorAll("canvas").length,
    }));
    assert(result.content <= width + 1, `${width} ${path}: overflow`);
    assert.equal(
      result.canvas,
      0,
      "No detached canvas can lag behind scrolling DOM",
    );
    report.responsive.push({ path, ...result });
  }
}
await p.cdp("Emulation.setDeviceMetricsOverride", {
  width: 1600,
  height: 1208,
  deviceScaleFactor: 1,
  mobile: false,
});
await p.goto(base + "#/resources");
await settle();
await fs.writeFile(
  "/Users/didi/Desktop/warp/alexwjj-hub/.local/glass-motion-report.json",
  JSON.stringify(report, null, 2),
);
console.log(
  "PASS: measured selection travel, rapid retarget, segments/filters, keyboard/focus, portal glass, wallpapers, theme, reduced motion, CSS fallback and 15 responsive cases.",
);
