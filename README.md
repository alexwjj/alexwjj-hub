# 俊劫的个人工作空间

作品、AI 工具、工作流、Skills、MCP 与留言的个人主页。静态内容写在仓库里，修改并推送后由 Vercel 自动部署；登录、留言和访问统计由 Vercel Functions + 独立 Neon/Postgres 提供。

## 使用与内容维护

```bash
npm ci
cp .env.example .env.local
npm run dev
```

前端 <http://127.0.0.1:5173/>，API <http://127.0.0.1:5005/>。两个端口均不会抢占其他进程。没有 `DATABASE_URL` 时，本地使用 `.local/postgres` 中隔离的 PGlite 数据库；正式环境强制使用 Neon。

- `src/data.ts`：个人介绍、工具入口、AI 网站与工作流。
- `src/content/projects.json`：公开作品清单、分类、域名和稳定项目 ID。慢变化的数据直接改文件。
- `src/Hub.tsx`、`src/styles.css`：主站界面，shadcn/ui（Base UI）、黑白与系统主题、全局搜索、响应式布局。
- `src/LiquidGlass.tsx`、`src/liquid-glass.css`：跟随 DOM 的透镜折射、玻璃材质与弹簧动效；默认日间主题，支持深色与系统主题。
- `src/content/resources.ts`：独立、跨工具的公开 Skills 与 MCP 清单，按任务分类。
- `src/account.tsx`：GitHub 登录状态、留言、站长数据后台。
- `sdk/`：无运行时依赖的浏览器统计 SDK。构建时复制到 `/sdk/hub.js`。
- `server/`、`api/index.mjs`：OAuth、权限、留言与统计接口。

## Vercel 与 GitHub 登录

在 Vercel 导入 `alexwjj/alexwjj-hub`，使用 Vite 预设，Node.js 24，`npm run build`，输出 `dist`。`vercel.json` 配置静态资源与 `/api/*` 函数路由，`main` 推送触发生产部署。

设置下列**服务端环境变量**，不使用 `VITE_` 前缀，也不写进仓库：

| 变量 | 含义 |
| --- | --- |
| `APP_ORIGIN` | 正式站点的完整 origin，例如 `https://alexwjj-hub.vercel.app` |
| `OWNER_GITHUB_ID` | 站长 GitHub 固定数字 ID：`29943063`，不按可修改的用户名判断 |
| `SESSION_SECRET` | 至少 32 个字符，建议 `openssl rand -base64 48` 生成 |
| `GITHUB_CLIENT_ID` | 此站专用 GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | 此站专用 GitHub OAuth App Client Secret |
| `DATABASE_URL` | 独立 Neon 项目的 Postgres 连接串 |

OAuth App Homepage 设置为 `APP_ORIGIN`，回调设置为 `APP_ORIGIN/api/auth/callback`。仅申请 `read:user`，不申请仓库或邮箱权限；访问令牌不进入会话 cookie。登录使用 state、PKCE、签名 HttpOnly/Secure/SameSite cookie；留言与退出检查同源。

公开栏目无需登录；GitHub 用户登录后可以留言、删除自己的留言。站长能删除任何留言，并查看「作品数据」菜单。所有 `/api/admin/*` 接口在服务端验证站长身份，未登录返回 401，其他用户返回 403。

数据库初始化：

```bash
# .env.local 配置专用 DATABASE_URL 后：
npm run db:setup
# 首次扫描形成的私有清单保留在本机，只有需要导入时执行：
npm run db:import-private
```

表名统一使用 `hub_` 前缀。初始化只创建本应用的表和项目登记，不删除任何数据；重启和重新部署不会清空留言或统计。不要把其他项目的数据库连接串复制到这个项目。

## 作品统计 SDK

在站长后台选择项目，就能复制对应接入代码：

```html
<script type="module" src="https://alexwjj-hub.vercel.app/sdk/hub.js?project=项目ID" async></script>
```

自定义事件：

```js
window.alexHubAnalytics?.track('download_click')
```

新网站的 origin 必须添加到该项目 `origins` 中；采集接口拒绝未登记来源。原有作品需要分别加入接入代码后才有真实数据，已上线前端的本轮接入记录见 `docs/sdk-integrations.md`；后续新项目仍按相同方式接入。主站自身已接入，localhost 默认不统计。

记录 PV、项目内 UV、会话、前台停留、来源域名、屏幕类别、错误计数和自定义事件，以及浏览器支持时的加载耗时/LCP/CLS。默认遵守 DNT/GPC，不上传查询参数、普通 hash、原始 IP、错误堆栈、表单或 GitHub 身份；UUID 和长数字路径段归并为 `:id`。事件 ID 去重；采集按来源限流，留言每账号 30 秒一条。UV 按项目计算，跨项目不合并为同一访客。客户端统计可能被拦截或漏记，不用于结算。

独立包与接入 API 见 [sdk/README.md](sdk/README.md)，可 `npm pack ./sdk` 生成安装包。

## 清单来源与公开边界

2026-11-03 使用当前登录账号核对了 59 个 GitHub 仓库及 Vercel 的 10 个项目。公开页面包含 48 个入口，原创、学习实验和 Fork 参考分开标注。私有仓库只有已有公开网站的项目展示网站入口；私有仓库链接、后台和 API 清单仅导入数据库并由站长接口返回。

`.local/private-projects.json`、凭据、数据库文件均被 Git 忽略，不在公开仓库或前端 bundle 中。公开站点入口已对照 GitHub 与 Vercel 的实际配置，引用的名称与简介来自项目元数据、README 和个人站。部分个人工具使用经验仍标为「待整理」。

## 检查与交付

```bash
npm test
npm run build
npm audit --omit=dev
# 前端与 API 启动后，已安装 ego-browser 的环境可执行：
ego-browser nodejs < scripts/smoke.mjs
ego-browser nodejs < scripts/glass-smoke.mjs
```

测试覆盖签名会话、站长权限、OAuth state/PKCE、真实 SQL 留言与归属校验、跨域采集、去重与聚合、私有元数据保护，以及 SDK 隐私和清理。测试数据库在内存中，不连接生产 Neon。

`.github/workflows/ci.yml` 使用 npm 官方源安装、测试和构建。本仓库 `.npmrc` 与 lockfile 全部使用 `https://registry.npmjs.org`，不依赖内部 npm 源。

## 液态玻璃界面

参考 [liquid-glass-webgl](https://github.com/martin65536/liquid-glass-webgl) 的透镜边缘、方向高光、按压形变和弹簧切换。本仓库独立实现，未复制参考项目代码，也未新增运行时依赖。

玻璃直接绑定原生组件：在支持的 Chromium 中，通过 SVG 位移滤镜采样实际背景；其他浏览器保留 CSS 模糊与高光。位移贴图仅随组件尺寸生成，滚动不需要 JavaScript 同步屏幕坐标，避免固定画布落后于 DOM 的残影。原生 shadcn / Base UI 继续处理焦点、键盘与弹窗。

按钮有按压与阻尼回弹；菜单、主题和 Skills / MCP 标签使用滑动玻璃指示层，内容切换带短淡入。尊重减少动态效果和减少透明度设置。`alex-hub-theme` 保存本版主题选择，首次打开默认日间。

文章页面和入门手册已删除；工具直接链接到公开入口。能力库来自本机已安装的公开技能与通用 MCP 配置，安装或配置不代表日常使用频率。公开数据不包含内部工具、服务器地址、凭据或个人路径。
