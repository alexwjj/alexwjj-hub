// Local R2 preview: use the isolated owner fixture and API, not the production database.
const assert = (await import("node:assert/strict")).default;
const p = (await taskSpace("Alex Hub Pencil R2")).page("p1");
const origin = "http://localhost:5174/";
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
const go = async (path) => {
  await p.goto(origin + "#" + path, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(
    (expected) =>
      document.querySelector(".route-view")?.dataset.route === expected,
    path.split("?")[0],
  );
  await p.waitForSelector("h1");
  await settle();
};
await p.cdp("Emulation.setDeviceMetricsOverride", {
  width: 1600,
  height: 1208,
  deviceScaleFactor: 1,
  mobile: false,
});
await go("/");
assert.equal(
  await p.evaluate(() => document.querySelector("h1").textContent),
  "创造，自成一格。",
);
const frame = await p.evaluate(() => {
  const r = document.querySelector(".home-hero").getBoundingClientRect();
  return [r.x, r.y, r.width, r.height];
});
assert.deepEqual(frame, [296, 124, 1256, 220]);
await p.click('loc=role:button[name="深色主题"]');
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForSelector("h1");
assert(
  await p.evaluate(() => document.documentElement.classList.contains("dark")),
);
await p.click('loc=role:button[name="浅色主题"]');
await p.keyboard.press("ControlOrMeta+k");
await p.fill('loc=role:textbox[name="搜索作品、工具、工作流"]', "JLab");
await p.waitForFunction(
  () => document.querySelectorAll(".search-result").length === 1,
);
assert(
  (
    await p.evaluate(() => document.querySelector(".search-result").href)
  ).includes("j-lab-photos"),
);
await p.keyboard.press("Escape");
await p.cdp("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false,
});
await go("/projects");
assert.equal(
  await p.evaluate(() => document.querySelectorAll(".project-card").length),
  6,
);
await p.evaluate(() =>
  window.scrollTo(0, document.documentElement.scrollHeight),
);
await p.waitForFunction(
  () => document.querySelectorAll(".project-card").length === 9,
);
assert.equal(
  await p.evaluate(() => document.querySelectorAll(".project-card").length),
  9,
);
await p.fill('loc=role:textbox[name="搜索作品"]', "jlab");
await p.waitForFunction(
  () => document.querySelectorAll(".project-card").length === 1,
);
await go("/workflows");
await p.click('loc=role:button[name="查看完整流程"]');
await p.waitForSelector('[role="dialog"] li');
assert.equal(
  await p.evaluate(
    () => document.querySelectorAll('[role="dialog"] li').length,
  ),
  5,
);
await p.keyboard.press("Escape");
await go("/tools");
assert.equal(
  await p.evaluate(() => document.querySelectorAll(".tool-detail-card").length),
  8,
);
await p.fill('loc=role:textbox[name="搜索工具或任务"]', "ego");
await p.waitForFunction(
  () => document.querySelectorAll(".tool-detail-card").length === 1,
);
assert(
  (
    await p.evaluate(
      () => document.querySelector(".tool-detail-card h2").textContent,
    )
  ).includes("ego"),
);
await go("/resources");
assert.equal(
  await p.evaluate(() => document.querySelectorAll(".resource-card").length),
  9,
);
assert.equal(
  await p.evaluate(
    () => document.querySelector(".resource-card h2").textContent,
  ),
  "前端界面设计",
);
await p.click('loc=role:button[name*="下一页"]');
await p.waitForFunction(
  () =>
    document.querySelector(".resource-card h2")?.textContent !== "前端界面设计",
);
await p.fill('loc=role:textbox[name="搜索能力库"]', "obsidian");
await p.waitForFunction(
  () => document.querySelectorAll(".resource-card").length === 3,
);
await go("/resources?kind=mcp");
assert.equal(
  await p.evaluate(() => document.querySelectorAll(".resource-card").length),
  6,
);
assert(
  !(await p.evaluate(() =>
    document.querySelector(".resource-grid").textContent.includes("Cooper"),
  )),
);
await go("/admin");
await p.waitForSelector(".stat-card");
assert.equal(
  await p.evaluate(() => document.querySelectorAll(".stat-card").length),
  5,
);
await p.click("loc=css:.project-picker-trigger");
await p.fill("loc=css:.project-picker-search", "JLab");
await p.waitForFunction(
  () => document.querySelectorAll(".project-picker-option").length === 1,
);
await p.keyboard.press("ArrowDown");
await p.keyboard.press("Enter");
await p.waitForFunction(() =>
  document
    .querySelector(".project-picker-trigger")
    .textContent.includes("JLab"),
);
await p.click('loc=role:button[name="查看明细"]');
await p.waitForSelector('[role="dialog"]');
await p.keyboard.press("Escape");
console.log(
  "PASS: design geometry, theme persistence, global search, scroll-loaded projects, five-step workflow, tool search, resource pagination, public MCP list and analytics selection.",
);
for (const width of [390, 768, 1600]) {
  await p.cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height: width === 1600 ? 1208 : 844,
    deviceScaleFactor: 1,
    mobile: width < 760,
  });
  for (const route of [
    "/",
    "/projects",
    "/workflows",
    "/tools",
    "/resources",
    "/resources?kind=mcp",
    "/discover",
    "/guestbook",
    "/about",
    "/admin",
  ]) {
    await go(route);
    const metrics = await p.evaluate(() => ({
      width: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert(
      metrics.content <= metrics.width + 1,
      `${width} ${route} overflow ${JSON.stringify(metrics)}`,
    );
  }
}
await p.cdp("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await go("/");
await p.click('loc=role:button[name="打开导航"]');
await p.waitForSelector(".mobile-nav-dialog");
await p.click('loc=css:.mobile-nav-dialog a[href="#/discover"]');
await p.waitForFunction(() => location.hash === "#/discover");
await p.waitForSelector('[role="dialog"]', { state: "hidden" });
await p.cdp("Emulation.clearDeviceMetricsOverride");
await go("/");
console.log("PASS: 30 responsive page checks and mobile navigation.");
