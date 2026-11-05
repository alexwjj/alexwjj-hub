import { websiteURL, websiteMetadata } from "./website-metadata.mjs";
import {
  messageBodyLimit,
  getMessages,
  getMessageImage,
  writeMessage,
} from "./messages.mjs";
import catalog from "../src/content/projects.json" with { type: "json" };
import { randomUUID, createHash } from "node:crypto";
import { authRoute, configuration, sameOrigin, session } from "./auth.mjs";
import { database, rateLimit } from "./db.mjs";

const json = (data, status = 200) => Response.json(data, { status });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const eventTypes = new Set([
  "pageview",
  "engagement",
  "event",
  "error",
  "metric",
]);

export function validateEvents(body, projectId, secret) {
  if (
    !Array.isArray(body.events) ||
    body.events.length < 1 ||
    body.events.length > 20
  )
    throw new Error("Invalid batch");
  return body.events.map((e) => {
    if (
      !e ||
      !uuid.test(e.id) ||
      !uuid.test(e.visitor) ||
      !uuid.test(e.session) ||
      !eventTypes.has(e.type) ||
      typeof e.name !== "string" ||
      !/^[a-zA-Z\d_.-]{1,64}$/.test(e.name) ||
      typeof e.path !== "string" ||
      !e.path.startsWith("/") ||
      e.path.length > 500 ||
      /[?#\u0000-\u001f]/.test(e.path)
    )
      throw new Error("Invalid event");
    if (!Number.isFinite(e.value) || e.value < 0 || e.value > 3_600_000)
      throw new Error("Invalid metric");
    const referrer =
      typeof e.referrer === "string" && /^[a-z\d.-]{0,253}$/i.test(e.referrer)
        ? e.referrer
        : "";
    return {
      ...e,
      path: e.path
        .replace(
          /\/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}(?=\/|$)/gi,
          "/:id",
        )
        .replace(/\/\d{7,}(?=\/|$)/g, "/:id"),
      referrer,
      visitor: hash(`${secret}:${projectId}:${e.visitor}`),
      session: hash(`${secret}:${projectId}:${e.session}`),
      device: ["mobile", "desktop", "tablet"].includes(e.device)
        ? e.device
        : "desktop",
    };
  });
}

async function readBody(request, limit = 24_000) {
  const text = await request.text();
  if (Buffer.byteLength(text) > limit) throw new Error("Body too large");
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid body");
  return value;
}

export function createHandler({
  getDatabase = database,
  config = configuration(),
  fetcher = fetch,
  dashboardProjectIds = catalog.map((p) => p.id),
} = {}) {
  return async function handler(request) {
    let response;
    try {
      response = await route(request);
    } catch (error) {
      if (
        error instanceof SyntaxError ||
        [
          "Body too large",
          "Invalid body",
          "Invalid batch",
          "Invalid event",
          "Invalid metric",
        ].includes(error.message)
      )
        response = json({ error: "请求数据无效" }, 400);
      else {
        console.error("Hub API unavailable:", error.name);
        response = json({ error: "服务暂不可用，请稍后重试" }, 503);
      }
    }
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-content-type-options", "nosniff");
    return response;
  };

  async function route(request) {
    const url = new URL(request.url),
      path = url.pathname;
    if (path.startsWith("/api/auth/"))
      return authRoute(request, config, fetcher);
    const user = session(request, config);
    if (path === "/api/discover" || path === "/api/discover/metadata") {
      if (path === "/api/discover" && request.method === "GET") {
        const db = await getDatabase();
        return json({
          sites: await db.query(
            "SELECT id,name,url,category,description,pinned FROM hub_discover ORDER BY pinned DESC,created_at,id",
          ),
        });
      }
      if (!user) return json({ error: "请先登录" }, 401);
      if (!user.isOwner) return json({ error: "仅站长可以编辑发现收藏" }, 403);
      if (!sameOrigin(request, config))
        return json({ error: "请求来源无效" }, 403);
      if (!["POST", "PUT", "DELETE"].includes(request.method))
        return json({ error: "不支持的操作" }, 405);
      const db = await getDatabase();
      const body = await readBody(request);
      if (path.endsWith("/metadata")) {
        if (!(await rateLimit(db, "link-preview:" + user.id, 15, 60)))
          return json({ error: "读取过于频繁，请稍后再试" }, 429);
        try {
          return json(await websiteMetadata(body.url));
        } catch (e) {
          return json({ error: e.message }, 400);
        }
      }
      if (request.method === "DELETE") {
        if (!uuid.test(body.id || ""))
          return json({ error: "网站标识无效" }, 400);
        await db.query("DELETE FROM hub_discover WHERE id=$1", [body.id]);
        return json({ ok: true });
      }
      let link;
      try {
        link = websiteURL(body.url).href;
      } catch {
        return json({ error: "请输入公开网站的 HTTPS 链接" }, 400);
      }
      const name = String(body.name || "").trim(),
        description = String(body.description || "").trim();
      if (
        !name ||
        name.length > 100 ||
        description.length > 500 ||
        !["评测与动态", "AI 资讯", "趣味实验", "开发资源"].includes(
          body.category,
        )
      )
        return json({ error: "请填写有效的网站名称、分类与说明" }, 400);
      if (request.method === "PUT" && !uuid.test(body.id || ""))
        return json({ error: "网站标识无效" }, 400);
      const id = request.method === "POST" ? randomUUID() : body.id;
      const values = [
        id,
        name,
        link,
        body.category,
        description,
        body.pinned === true,
      ];
      const exists = await db.query(
        "SELECT id FROM hub_discover WHERE url=$1 AND id<>$2",
        [link, id],
      );
      if (exists.length) return json({ error: "这个网站已经在收藏中" }, 409);
      if (request.method === "POST") {
        await db.query(
          "INSERT INTO hub_discover(id,name,url,category,description,pinned) VALUES($1,$2,$3,$4,$5,$6)",
          values,
        );
      } else
        await db.query(
          "UPDATE hub_discover SET name=$2,url=$3,category=$4,description=$5,pinned=$6 WHERE id=$1",
          values,
        );
      return json({
        site: {
          id,
          name,
          url: link,
          category: body.category,
          description,
          pinned: body.pinned === true,
        },
      });
    }
    if (path.startsWith("/api/admin/")) {
      if (!user) return json({ error: "请先登录" }, 401);
      if (!user.isOwner) return json({ error: "仅站点所有者可访问" }, 403);
      if (request.method !== "GET") return json({ error: "不支持的操作" }, 405);
      const db = await getDatabase();
      if (path === "/api/admin/projects") {
        const rows = await db.query(
          "SELECT id,name,url,repo,visibility,origins FROM hub_projects WHERE id=ANY($1::text[])",
          [dashboardProjectIds],
        );
        return json({
          projects: dashboardProjectIds
            .map((id) => rows.find((row) => row.id === id))
            .filter(Boolean),
        });
      }
      if (path === "/api/admin/analytics") {
        const days = Number(url.searchParams.get("days") || 30);
        if (![7, 30, 90].includes(days))
          return json({ error: "时间范围无效" }, 400);
        const project = url.searchParams.get("project") || null;
        if (project && !dashboardProjectIds.includes(project))
          return json({ error: "该作品不在当前清单中" }, 400);
        const filter = `created_at >= ((date_trunc('day',now() AT TIME ZONE 'Asia/Shanghai')-($1::int-1)*interval '1 day') AT TIME ZONE 'Asia/Shanghai') AND ($2::text IS NULL OR project_id=$2) AND project_id=ANY($3::text[])`;
        const params = [days, project, dashboardProjectIds];
        const [
          summary,
          daily,
          pages,
          events,
          referrers,
          devices,
          metrics,
          perProject,
          errors,
        ] = await Promise.all([
          db.query(
            `SELECT count(*) FILTER(WHERE type='pageview')::int AS views,count(DISTINCT visitor) FILTER(WHERE type='pageview')::int AS visitors,count(DISTINCT session_id) FILTER(WHERE type='pageview')::int AS sessions,count(*) FILTER(WHERE type='error')::int AS errors,coalesce(sum(value) FILTER(WHERE type='engagement'),0)::float AS engagement FROM hub_events WHERE ${filter}`,
            params,
          ),
          db.query(
            `SELECT to_char(created_at AT TIME ZONE 'Asia/Shanghai','YYYY-MM-DD') AS day,count(*) FILTER(WHERE type='pageview')::int AS views,count(DISTINCT visitor) FILTER(WHERE type='pageview')::int AS visitors FROM hub_events WHERE ${filter} GROUP BY day ORDER BY day`,
            params,
          ),
          db.query(
            `SELECT path,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='pageview' GROUP BY path ORDER BY count DESC LIMIT 20`,
            params,
          ),
          db.query(
            `SELECT name,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='event' GROUP BY name ORDER BY count DESC LIMIT 20`,
            params,
          ),
          db.query(
            `SELECT referrer AS name,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='pageview' GROUP BY referrer ORDER BY count DESC LIMIT 10`,
            params,
          ),
          db.query(
            `SELECT device AS name,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='pageview' GROUP BY device ORDER BY count DESC`,
            params,
          ),
          db.query(
            `SELECT name,round(avg(value)::numeric,2)::float AS value FROM hub_events WHERE ${filter} AND type='metric' GROUP BY name`,
            params,
          ),
          db.query(
            `SELECT project_id,count(*) FILTER(WHERE type='pageview')::int AS views,count(DISTINCT visitor) FILTER(WHERE type='pageview')::int AS visitors,count(*) FILTER(WHERE type='error')::int AS errors FROM hub_events WHERE ${filter} GROUP BY project_id ORDER BY views DESC`,
            params,
          ),
          db.query(
            `SELECT name,count(*)::int AS count FROM hub_events WHERE ${filter} AND type='error' GROUP BY name ORDER BY count DESC LIMIT 10`,
            params,
          ),
        ]);
        return json({
          days,
          summary: summary[0],
          daily,
          pages,
          events,
          referrers,
          devices,
          metrics,
          perProject,
          errors,
        });
      }
      return json({ error: "接口不存在" }, 404);
    }
    if (path.startsWith("/api/message-images/") && request.method === "GET") {
      return getMessageImage(await getDatabase(), path);
    }
    if (path === "/api/messages") {
      if (request.method === "GET")
        return json({ messages: await getMessages(await getDatabase()) });
      if (!["POST", "DELETE"].includes(request.method))
        return json({ error: "不支持的操作" }, 405);
      if (!user) return json({ error: "请先使用 GitHub 登录" }, 401);
      if (!sameOrigin(request, config))
        return json({ error: "请求来源无效" }, 403);
      const body = await readBody(
        request,
        request.method === "POST" ? messageBodyLimit : 24_000,
      );
      return writeMessage(await getDatabase(), request.method, user, body);
    }
    if (path === "/api/collect") {
      const projectId = url.searchParams.get("project");
      if (!projectId || !/^[a-z\d-]{1,80}$/.test(projectId))
        return json({ error: "项目编号无效" }, 400);
      const origin = request.headers.get("origin");
      const db = await getDatabase();
      const [project] = await db.query(
        "SELECT origins FROM hub_projects WHERE id=$1",
        [projectId],
      );
      if (
        !project ||
        !origin ||
        !(
          (projectId === "x-reader" &&
            /^chrome-extension:\/\/[a-p]{32}$/.test(origin)) ||
          project.origins.includes(origin) ||
          (!process.env.VERCEL &&
            projectId === "alexwjj-hub" &&
            origin === config.origin)
        )
      )
        return json({ error: "未登记的项目来源" }, 403);
      const headers = {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        vary: "Origin",
      };
      if (request.method === "OPTIONS")
        return new Response(null, { status: 204, headers });
      if (request.method !== "POST")
        return new Response(null, { status: 405, headers });
      const events = validateEvents(
        await readBody(request),
        projectId,
        config.secret,
      );
      const address = process.env.VERCEL
        ? request.headers.get("x-vercel-forwarded-for") || "unknown"
        : "local";
      if (
        !(await rateLimit(
          db,
          "collect:" + hash(`${config.secret}:${projectId}:${address}`),
          120,
          60,
        ))
      )
        return new Response(null, { status: 429, headers });
      const params = events.map((e) => ({
        id: e.id,
        type: e.type,
        name: e.name,
        path: e.path,
        visitor: e.visitor,
        session: e.session,
        referrer: e.referrer,
        device: e.device,
        value: e.value,
      }));
      await db.query(
        `INSERT INTO hub_events(id,project_id,type,name,path,visitor,session_id,referrer,device,value)
        SELECT (x->>'id')::uuid,$1,x->>'type',x->>'name',x->>'path',x->>'visitor',x->>'session',x->>'referrer',x->>'device',(x->>'value')::float
        FROM jsonb_array_elements($2::jsonb) x ON CONFLICT(id) DO NOTHING`,
        [projectId, JSON.stringify(params)],
      );
      return new Response(null, { status: 204, headers });
    }
    return json({ error: "接口不存在" }, 404);
  }
}
