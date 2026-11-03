# 网页 SDK 接入清单

本轮接入对应项目的网页入口，使用异步 ES Module 脚本，不增加 npm 依赖。下面记录公开网站的项目 ID；管理入口的地址与仓库信息只保留在站长数据库中。

| 公开入口 | 项目 ID | 统计范围 |
| --- | --- | --- |
| [个人工作空间](https://alexwjj-hub.vercel.app/) | `alexwjj-hub` | 个人主页与工作台 |
| [家有根](https://family.weightbook.icu/) | `family-genealogy` | 官网与已授权访问的网页入口；不上传家谱人物或成员资料 |
| [云上家](https://home.weightbook.icu/) | `yunshang-house-3d` | 三维社区、户型与装修网页 |
| [JLab Photos](https://j-lab-photos.vercel.app/) | `jlabphotos` | 产品官网；不接触本地相册或照片 |
| [个人作品站](https://alexwjj.weightbook.icu/) | `alexwjj-site` | 个人作品与内容入口 |
| [JJ Hot](https://jjhot.weightbook.icu/) | `jjhot` | 热点聚合前台 |
| [体重管理](https://weight-manage.vercel.app/) | `weight-manage` | H5 网页；不上传体重、表单或账号资料 |
| [学习基地](https://alexwjj.github.io/) | `alexwjj-github-io` | 博客与文章页面 |
| [React 学习系统](https://alexwjj.github.io/study/) | `react-typescript` | React 示例网页 |
| [Vue 打印示例](https://alexwjj.github.io/vue-iframe-print/) | `vue-iframe-print` | 打印插件的在线示例 |
| [前端性能分享](https://alexwjj.github.io/fe-optimize-ppt/) | `fe-ppt` | 在线演示文稿 |

博客源码在 `docs` 分支，GitHub Pages 发布内容在 `master`。接入同时覆盖源码模板、静态示例和发布页，并更新公开页面的离线缓存指纹，保持后续构建与当前发布内容一致。

访问默认遵守 DNT/GPC。UUID 与七位以上数字路径段归并为 `:id`，查询参数、普通 hash、错误内容、堆栈、GitHub 身份、原始 IP 与表单不会上传。原站自己的业务统计和权限不变，所有 SDK 数据进入个人 Hub 的独立数据库。

SDK 只统计运行它的网页。GitHub 代码仓库、npm 插件本身、API 服务与原生客户端不会凭空产生网页访问量；作品清单仍保留这些项目，后续有实际网页入口时再登记来源并接入。
