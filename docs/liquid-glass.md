# 液态玻璃：材质与交互方案

更新：2026-11-05。保持 Pencil R2 的尺寸、间距、文案和静止外观，为控件补上连续的状态变化。本方案已接入主站，不是独立展示页。

## 现状与根因

原来的侧栏在不同链接上切换 `.selected`，背景、阴影各自淡入淡出。它们是两个不同位置的元素，没有共享的几何状态，因此看不到胶囊移动。已有全局按压回弹只处理鼠标按下，不能产生菜单、分类或 Skills/MCP 的位置过渡。

另外，原来的指针坐标只写入变量，没有对应的高光绘制；折射使用经验衰减曲线；观察器只覆盖 `#root`，遗漏 Base UI 挂到 `body` 的弹层。

## 社区方案对照与选择

| 参考 | 核心做法 | 本项目采用方式 |
| --- | --- | --- |
| [martin65536/liquid-glass-webgl](https://github.com/martin65536/liquid-glass-webgl) | WebGL 场景、SDF、折射和独立高光 pass；Tab 有位置、按压与弹簧状态 | 参考其交互分层，不移植整套渲染器。该仓库标注 AGPL-3.0，本次没有复制其源码 |
| [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) | DOM 背景折射、弹性、悬停与点击反馈；README 明确 Safari/Firefox 折射支持有限 | 参考组件层的光学与交互分离，不额外叠装第二套玻璃组件 |
| [kube 的光学推导](https://kube.io/blog/liquid-glass-css-svg/) | 由曲面法线和 Snell 定律计算位移，再交给 SVG displacement map | 改进已有透镜生成器，使用单曲面近似，复用原生 DOM 背景采样 |
| [Motion 共享布局](https://motion.dev/docs/react-layout-animations)、[弹簧](https://motion.dev/docs/react-transitions) | `layoutId` 连接不同状态的元素，动画位置与尺寸；独立设置弹簧参数 | 安装公开 npm 的 `motion@14.9.1`（MIT），统一选中层的移动与中断衔接 |
| [Base UI 动画生命周期](https://base-ui.com/react/handbook/animation) | `data-starting-style` / `data-ending-style` 驱动进入和退出，退出完毕再卸载 | 保留现有 shadcn/Base UI 的焦点、键盘和 Portal 行为，只修改视觉过渡 |

研究时核对的上游版本：WebGL `0b90f9fc1cea8c7e59825f9aff1cbb96674b5b80`；rdev `ac48eab18d1f7f444ae30002d240cae29c863a21`。可直接查看 WebGL 的 [Tab 状态](https://github.com/martin65536/liquid-glass-webgl/blob/0b90f9fc1cea8c7e59825f9aff1cbb96674b5b80/src/components/liquid-glass/renderer/methods-tabs.ts)、[弹簧模型](https://github.com/martin65536/liquid-glass-webgl/blob/0b90f9fc1cea8c7e59825f9aff1cbb96674b5b80/src/components/liquid-glass/renderer/spring.ts)与[高光层](https://github.com/martin65536/liquid-glass-webgl/blob/0b90f9fc1cea8c7e59825f9aff1cbb96674b5b80/src/components/liquid-glass/shaders/highlight.ts)。

选择 **DOM 光学层 + Motion 状态层 + Base UI 交互语义**。本项目有长列表、滚动、输入框和真实网页内容；让浏览器采样实时 DOM，可以继续沿用原来的布局与可访问性。全页 WebGL 需要维护额外的场景同步，不适合作为本次菜单动画的前置条件。

## 实现结构

```text
链接 / button / Base UI：决定选中项、焦点、路由和开关状态
  ├─ GlassGroup + GlassIndicator：同组共享 selection，弹簧移动与形变
  ├─ LiquidGlass：观察真实元素尺寸 → 缓存位移图 → SVG backdrop 折射
  ├─ glass-motion.css：透明填充、边缘高光、阴影、指针追光
  └─ 主题 / 背景 / 弹层：各自使用适合的过渡机制
```

### 选中层

`src/components/GlassMotion.tsx` 提供两种组件。`GlassGroup` 用 `useId()` 隔离共享布局空间；同组只有选中的控件挂载 `GlassIndicator`。选中项变化时，Motion 把前后位置连接起来，而不是创建两块独立背景。

```tsx
<GlassGroup className="segment">
  {items.map(item => (
    <button key={item} aria-pressed={value === item} onClick={() => setValue(item)}>
      <GlassIndicator active={value === item} />
      {item}
    </button>
  ))}
</GlassGroup>
```

已覆盖：侧栏两组菜单、移动端导航、首页能力摘要、能力库 Skills/MCP、所有 `FilterPills`、主题按钮、统计 PV/UV。桌面与移动导航有独立实例，避免同名 `layoutId` 跨区域飞行。只移动背景层，文字和图标保持原位。

| 参数 | 当前值 | 意图 |
| --- | --- | --- |
| 位置/尺寸弹簧 | stiffness 460 / damping 32 / mass 0.8 | 快速响应，轻微回弹，连续点击重新接续 |
| 切换形变 | X 1 → 1.035 → 1；Y 1 → 0.94 → 1，420ms | 胶囊移动时短暂变扁、恢复 |
| 按压 | X .96 / Y 1.06 | 只变形选中背景，不缩放整行标签 |
| 高光 | 520ms 掠光；180ms 指针亮度过渡 | 表达玻璃边缘和光源变化，静止不循环 |

### 光学材质

`src/lib/glass-optics.ts` 计算凸四次曲面斜率，使用空气到玻璃的折射率 1.5 求出采样偏移。`src/LiquidGlass.tsx` 把这个一维轮廓投到圆角矩形法线，生成 RG 位移图，经 `feImage → feDisplacementMap` 采样背景；字体仍由 DOM 正常绘制。

这是单曲面、垂直入射近似，不等同完整光线追踪。像素循环用 256 个采样点的查找表，避免逐像素执行三角函数。位移图按宽、高、圆角缓存，地图最大边约 420px，只有尺寸变化或新元素挂载时生成；不逐帧截图页面。观察范围包含 `body` 的 Portal，并排除自身 SVG 定义，卸载时断开 Observer、监听器与动画。

### 其他切换

- 主题：支持 `document.startViewTransition` 时，从点击的主题按钮做 460ms 圆形揭示。快速切换取消上次过渡；结束或失败均清理状态。旧浏览器保留颜色过渡。
- 背景：两张原始设计壁纸交叉淡化 320ms，强度仍由已有设置控制，不重置偏好。
- 弹层：使用 Base UI 的进入/退出属性，透明度与 .96 → 1 的尺度过渡；背景面板从右上角展开，关闭完成后卸载。
- 路由与能力内容：280ms 轻量淡入和 8px 位移。内容立即可操作，不等待旧页面退出。

## 降级与边界

1. Chromium 满足 URL backdrop-filter 支持检测时启用 SVG 折射；其他情况保留 CSS blur、填充、边线与共享布局动画。UA 检测沿用现有实现，不能据此宣称跨浏览器完全一致。
2. [MotionConfig reducedMotion="user"](https://motion.dev/docs/react-motion-config) 加 CSS 媒体查询关闭位移/形变；主题直接更新。操作、选中与焦点始终存在。偏好减少透明度时，选中层改用更实的材质。
3. 不引入跟随滚动的独立全屏画布。折射和控件属于同一 DOM 元素，不建立延迟追赶滚动坐标的循环。
4. Motion 会增加前端包体；只引入这一套状态动画库，不同时引入 GSAP 或另一个玻璃运行时。构建大小以实际 build 输出为准。
5. 当前验收使用 Chromium 和模拟视口。Safari、Firefox 和真实移动设备尚未实机验收；CSS 降级在 Chromium 中禁用 SVG 支持后验证，不能替代这些浏览器实测。

## 验收方式

- `npm test`：光学计算边缘/中心/数值稳定性，以及原有 API/SDK 回归。
- `npm run build`：TypeScript 与生产构建。
- `ego-browser nodejs < scripts/glass-motion-smoke.mjs`：针对隔离预览 5174 / 内存 API 5006。逐帧记录侧栏胶囊的中间坐标，检查快速改选、能力切换、键盘/焦点、弹层折射、背景、主题、减少动态效果、无 SVG 降级和响应式。
- `ego-browser nodejs < scripts/glass-smoke.mjs`：已有按压、紧凑侧栏和材质降级回归。

浏览器测试复用当前任务空间，运行后不自动关闭用户页面。逐帧证据写在忽略目录 `.local/glass-motion-report.json`。验收看实际中间位置与最终对齐，不只检查 `.selected` 类或静态截图。
