// Uses the isolated localhost preview and local owner fixture; it does not write production data.
const assert = (await import("node:assert/strict")).default;
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
const { mkdir } = await import("node:fs/promises");
const output = join(tmpdir(), "alex-hub-r2-states");
await mkdir(output, { recursive: true });
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
await p.cdp("Emulation.setDeviceMetricsOverride", {
  width: 1600,
  height: 1208,
  deviceScaleFactor: 1,
  mobile: false,
});
await p.goto("http://localhost:5174/#/discover", {
  waitUntil: "domcontentloaded",
});
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForFunction(
  () => document.querySelectorAll(".discover-card").length === 2,
);
await p.click('loc=role:button[name="添加网站"]');
await p.waitForSelector(".add-site-dialog");
await p.fill('loc=css:.add-site-dialog input[type="url"]', "https://127.0.0.1");
await p.click('loc=role:button[name="读取信息"]');
await p.waitForSelector('.add-site-dialog [role="alert"]');
assert(
  (
    await p.evaluate(
      () =>
        document.querySelector('.add-site-dialog [role="alert"]').textContent,
    )
  ).includes("本地"),
);
await p.fill(
  'loc=css:.add-site-dialog input[type="url"]',
  "https://example.org/r2-verification#start",
);
await p.fill(
  'loc=css:.add-site-dialog input[maxlength="100"]',
  "R2 saved website",
);
await p.selectOption("loc=css:.add-site-dialog select", { label: "趣味实验" });
await p.fill(
  "loc=css:.add-site-dialog textarea",
  "Website editor verification.",
);
await p.screenshot({ path: join(output, "add-website.png") });
await p.click('loc=role:button[name="添加到收藏"]');
await p.waitForSelector(".add-site-dialog", { state: "hidden" });
await p.waitForFunction(
  () => document.querySelectorAll(".discover-card").length === 3,
);
await p.waitForFunction(
  () =>
    document.querySelector('.main-nav a[href="#/discover"] small')
      .textContent === "03",
);
let index = await p.evaluate(
  () =>
    [...document.querySelectorAll(".discover-card")].findIndex((e) =>
      e.textContent.includes("R2 saved website"),
    ) + 1,
);
await p.click(`loc=css:.discover-card:nth-child(${index}) button.text-link`);
await p.waitForSelector(".add-site-dialog");
await p.fill(
  'loc=css:.add-site-dialog input[maxlength="100"]',
  "Edited R2 website",
);
await p.click('loc=css:.add-site-dialog input[type="checkbox"]');
await p.click('loc=role:button[name="保存修改"]');
await p.waitForSelector(".add-site-dialog", { state: "hidden" });
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForFunction(() =>
  [...document.querySelectorAll(".discover-card h2")].some(
    (e) => e.textContent === "Edited R2 website",
  ),
);
await p.click('loc=role:button[name="Edited R2 website 更多操作"]');
await p.click('text="固定到常逛"');
await p.waitForFunction(() => {
  const e = [...document.querySelectorAll(".discover-card")].find((e) =>
    e.textContent.includes("Edited R2 website"),
  );
  return !!e?.querySelector("svg.lucide-pin");
});
await p.click('loc=role:button[name="Edited R2 website 更多操作"]');
await p.click('text="移除网站"');
await p.waitForFunction(
  () => document.querySelectorAll(".discover-card").length === 2,
);
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForFunction(
  () => document.querySelectorAll(".discover-card").length === 2,
);
console.log(
  "PASS: database-backed add/edit/pin/delete, reload persistence, private URL rejection and sidebar count.",
);
await p.goto("http://localhost:5174/", { waitUntil: "domcontentloaded" });
await p.waitForSelector(".hero-copy");
await p.click('loc=role:button[name="切换背景"]');
await p.waitForSelector(".background-panel");
await p.click('loc=role:button[name="雾山留白"]');
await p.focus('loc=css:input[aria-label="背景强度"]');
await p.keyboard.press("Home");
for (let i = 0; i < 5; i++) await p.keyboard.press("PageUp");
await p.waitForFunction(
  () =>
    document.querySelector(".background-panel output").textContent === "50%",
);
await settle();
const panel = await p.evaluate(() => {
  const r = document.querySelector(".background-panel").getBoundingClientRect();
  return [r.x, r.y, r.width, r.height];
});
assert.deepEqual(panel, [1050, 102, 502, 650]);
await p.screenshot({ path: join(output, "background-picker.png") });
await p.click('loc=role:button[name="完成"]');
await p.reload({ waitUntil: "domcontentloaded" });
await p.waitForFunction(
  () => document.documentElement.dataset.wallpaper === "mountains",
);
assert.equal(
  await p.evaluate(() =>
    document.documentElement.style.getPropertyValue("--wallpaper-strength"),
  ),
  "0.5",
);
for (const [name, id] of [
  ["云间微光", "clouds"],
  ["珍珠弧面", "pearl"],
]) {
  await p.click('loc=role:button[name="切换背景"]');
  await p.waitForSelector(".background-panel");
  await p.click(`loc=role:button[name="${name}"]`);
  await p.click('loc=role:button[name="完成"]');
  await p.waitForFunction(
    (expected) => document.documentElement.dataset.wallpaper === expected,
    id,
  );
  await settle();
  await p.screenshot({ path: join(output, id + ".png") });
}
await p.click('loc=role:button[name="切换背景"]');
await p.waitForSelector(".background-panel");
await p.click('loc=role:button[name="恢复默认"]');
await p.waitForFunction(
  () => document.documentElement.dataset.wallpaper === "silver",
);
await p.click('loc=role:button[name="完成"]');
console.log(
  "PASS: exact background panel geometry, four presets, live intensity, persistence and reset.",
);
await p.goto("http://localhost:5174/#/guestbook", {
  waitUntil: "domcontentloaded",
});
await p.waitForSelector("textarea");
await p.fill('loc=role:textbox[name="写下留言"]', "R2 local UI verification");
await p.click('loc=role:button[name="发布留言"]');
await p.waitForFunction(
  () => document.querySelectorAll(".message-card").length === 1,
);
const receipt = await p.click('loc=role:button[name="删除 alexwjj 的留言"]');
await p.acceptDialog();
await p.waitForFunction(
  () => document.querySelectorAll(".message-card").length === 0,
);
await p.waitForSelector(".guestbook-empty");
console.log(
  "PASS: authenticated guestbook publish/delete and empty state restored in isolated storage.",
);
await p.goto("http://127.0.0.1:5174/#/discover", {
  waitUntil: "domcontentloaded",
});
await p.waitForSelector(".discover-card");
assert(
  await p.evaluate(
    () =>
      [...document.querySelectorAll("button")].find((e) =>
        e.textContent.startsWith("添加网站"),
      ).disabled,
  ),
);
await p.goto("http://localhost:5174/", { waitUntil: "domcontentloaded" });
await p.waitForSelector(".hero-copy");
console.log(
  "PASS: visitors can read but cannot edit the shared discovery collection. Screenshots:",
  output,
);
