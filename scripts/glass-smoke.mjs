// Run against the isolated R2 preview with the local owner fixture.
const assert = (await import("node:assert/strict")).default;
const p = (await taskSpace("Alex Hub Pencil R2")).page("p1");
const settle = () =>
  p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.playState === "running")
        .map((a) => a.finished.catch(() => {})),
    );
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
  });
await p.goto("http://localhost:5174/", { waitUntil: "domcontentloaded" });
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForSelector('[data-glass="lens"]');
await settle();
assert.equal(
  await p.evaluate(() => document.querySelectorAll("canvas").length),
  0,
  "Glass follows native DOM, no fixed canvas lag",
);
const pointer = await p.evaluate(() => {
  const r = document.querySelector(".search-trigger").getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(pointer.x, pointer.y);
await p.mouse.down();
await p.waitForFunction(
  () =>
    getComputedStyle(document.querySelector(".search-trigger")).scale !==
    "none",
);
await p.mouse.up();
await p.waitForSelector('[role="dialog"]');
await settle();
assert.equal(
  await p.evaluate(
    () => getComputedStyle(document.querySelector(".search-trigger")).scale,
  ),
  "none",
);
await p.keyboard.press("Escape");
await p.waitForSelector('[role="dialog"]', { state: "hidden" });
await p.cdp("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await p.mouse.move(pointer.x, pointer.y);
await p.mouse.down();
assert.equal(
  await p.evaluate(
    () => getComputedStyle(document.querySelector(".search-trigger")).scale,
  ),
  "none",
);
await p.mouse.up();
await p.keyboard.press("Escape");
await p.cdp("Emulation.setEmulatedMedia", { features: [] });
for (const height of [500, 640, 900]) {
  await p.cdp("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await settle();
  const m = await p.evaluate(() => ({
    height: document.querySelector(".sidebar").clientHeight,
    content: document.querySelector(".sidebar").scrollHeight,
    profile: document.querySelector(".account-row").getBoundingClientRect()
      .bottom,
  }));
  assert(
    m.content <= m.height + 1,
    `${height}px sidebar clips ${JSON.stringify(m)}`,
  );
  assert(m.profile < height);
}
await p.cdp("Emulation.clearDeviceMetricsOverride");
const injection = await p.cdp("Page.addScriptToEvaluateOnNewDocument", {
  source: `const supports=CSS.supports.bind(CSS);CSS.supports=(...args)=>args.join('').includes('url(')?false:supports(...args);`,
});
try {
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForSelector("h1");
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
        document.querySelector(".sidebar"),
      ).backdropFilter.includes("blur"),
    ),
  );
  await p.click('loc=role:button[name="打开全局搜索"]');
  await p.waitForSelector('[role="dialog"]');
} finally {
  await p.cdp("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: injection.identifier,
  });
  await p.reload({ waitUntil: "domcontentloaded" });
  await p.waitForSelector('[data-glass="lens"]');
}
console.log(
  "PASS: native glass, press spring, reduced motion, compact sidebar at 500/640/900px, and CSS fallback.",
);
