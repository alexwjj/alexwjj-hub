---
name: alexwjj-liquid-glass
description: 将 alexwjj-hub 的银白液态玻璃应用到网页、导航、卡片和弹窗。适用于明确要求复用本站风格、玻璃边缘折射或分层玻璃材质的前端实现和调整。
---

# Alex 的液态玻璃

先确定哪一层需要透出背景，以及哪一层承载长文字。沿用目标项目的布局、控件语义、内容和主题开关。玻璃的轮廓来自背景明暗跨过边缘时的变化，纯色背景上先放一处可见的纹理，再调透明度。

## 接入材质

1. 把 [glass.css](assets/glass.css)、[glass-rim.png](assets/glass-rim.png) 和 [silver-flow.webp](assets/silver-flow.webp) 复制到目标项目同一资产目录，按项目习惯引入 CSS。目标已有背景时，可替换场景背景，保留纹理和前景的明度差。
2. 在容器上加 `hub-glass-scene`，在实际面板上加 `hub-glass`。默认是 26px 圆角，68% 白色混合。让组件自己定义尺寸、内边距和布局。暗色主题给场景设置 `data-theme="dark"`。
3. 按用途选 `data-material`。下面的数值对应本站浅色材质，bend 是启用折射时的边缘采样偏移。

| 用途 | material | 白色混合 | bend |
| --- | --- | ---: | ---: |
| 双层状态卡的背板 | back | 16% | 10px |
| 悬浮导航 | navigation | 42% | 10px |
| 长文字卡片 | reading | 74% | 8px |
| 表单与弹窗 | dialog | 97% | 10px |

```html
<section class="hub-glass-scene">
  <article class="hub-glass" data-material="reading">
    <h2>作品手记</h2>
    <p>把真实页面的内容放在玻璃上，检查背景最亮和最暗处的可读性。</p>
  </article>
</section>
```

边缘高光是 2× 九宫格贴图。保留 84 像素切片和 42px 边宽，缩放时只拉伸直边。装饰层保持 `pointer-events: none`。滚动时卡片和高光应一起移动。

## React 中启用实时折射

将 [LiquidGlass.tsx](assets/LiquidGlass.tsx) 和 [glass-optics.ts](assets/glass-optics.ts) 一起复制到组件目录，在页面根部挂载一个 `<LiquidGlass />`。两者只依赖 React 与浏览器 API。默认只给 `.hub-glass` 面板创建透镜，只给带此类名的按钮和链接做按压回弹。需要接入已有组件时可传 `surfaceSelector` 和 `interactiveSelector`；保留 `hub-glass` 类以使用材质的 bend 数值。

组件按尺寸、圆角和 bend 缓存位移图，监听尺寸和 DOM 挂载，包括弹窗 Portal。更换会影响 bend 或圆角的预设时，用预设名作为 React key 重新挂载该面板。浏览器缺少 SVG 背景滤镜能力时沿用 CSS 材质。非 React 项目可先用 CSS，只有明确需要实时折射时才移植透镜逻辑。

## 交互与验收

- 导航和标签切换时只移动选中背景，文字和点击区域固定。项目已有 Motion 时，可复用同一 layoutId，位置弹簧取 stiffness 460、damping 32、mass 0.8。为每组导航隔离 layoutId。
- 弹窗内容与打开状态分开保存，关闭时保留标题、尺寸和正文直到退场结束。本站采用 140ms 淡出并缩放至 0.986，遮罩同步淡出。尊重系统减少动态效果的设置。
- 用真文字在桌面和手机上检查浅色、深色和减少透明度三种状态。再用键盘切换标签、打开和关闭弹窗，检查轮廓、焦点回到触发器、快速改选和滚动时的边缘跟随。关闭折射后仍应能读正文并完成同样操作。
