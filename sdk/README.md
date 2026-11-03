# @alexwjj/hub-sdk

在个人作品中加入：

```html
<script type="module" src="https://alexwjj-hub.vercel.app/sdk/hub.js?project=项目ID" async></script>
```

项目 ID 和登记的来源域名可在站长「作品数据」中查看。域名不在清单中的上报会被拒绝。

自定义事件：`window.alexHubAnalytics?.track('download_click')`。

也可将这个目录作为本地依赖，或运行 `npm pack ./sdk` 生成独立安装包：

```js
import { createHubAnalytics } from '@alexwjj/hub-sdk'
const analytics = createHubAnalytics({ projectId: '项目ID', endpoint: 'https://alexwjj-hub.vercel.app/api/collect' })
analytics.track('download_click')
// 卸载应用或 HMR 时：analytics.stop()
```

默认遵守 DNT / Global Privacy Control。记录访问量、项目内独立访客、会话、前台停留时间、来源域名、屏幕类别、JS 错误计数、自定义事件，以及可用时的加载耗时/LCP/CLS。
不会收集 GitHub 身份、原始 IP、URL 查询参数、普通 hash、错误内容、堆栈或表单数据。UUID 与七位以上数字组成的路径段归并为 `:id`，不按人物或账号编号统计。访客和会话 ID 在服务端按项目加盐散列，不跨项目拼接。

历史路由自动捕获；同一路径的重复导航不重复计数。上报失败会静默丢弃，不阻塞作品本身。前台时间以 15 秒心跳累计，单次补记最多 60 秒；浏览器退出或拦截脚本会造成少量漏记。它是客户端访问统计，不是付费结算或防作弊系统。
