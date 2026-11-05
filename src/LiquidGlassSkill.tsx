import { useState } from "react";
import { Download, Check, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import instructions from "../.agents/skills/alexwjj-liquid-glass/SKILL.md?raw";
import "../.agents/skills/alexwjj-liquid-glass/assets/glass.css";
import "./skill-showcase.css";

export const glassSkillId = "alexwjj-liquid-glass";
export const glassSkillPath = "/resources/" + glassSkillId;
const prompt =
  "使用 $alexwjj-liquid-glass，为我的作品卡片应用阅读玻璃材质，保留原有布局，并适配深色主题。";
const materials = [
  { id: "back", name: "背板", tint: 16, bend: 10, radius: 28 },
  { id: "navigation", name: "导航", tint: 42, bend: 10, radius: 30 },
  { id: "reading", name: "阅读", tint: 74, bend: 8, radius: 28 },
  { id: "dialog", name: "弹窗", tint: 97, bend: 10, radius: 30 },
];

export function LiquidGlassSkill({ theme }: { theme: string }) {
  const [selected, setSelected] = useState("reading");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">(
    "idle",
  );
  const material = materials.find((item) => item.id === selected)!;
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState("copied");
    } catch {
      setCopyState("manual");
    }
  }
  return (
    <section className="skill-showcase">
      <Link to="/resources" className="text-link">
        ← 返回能力库
      </Link>
      <header className="skill-intro">
        <div className="eyebrow">ALEXWJJ / DESIGN SKILL</div>
        <h1>液态玻璃</h1>
        <p>把本站的玻璃导航、阅读卡片和浮层带进你的项目。</p>
      </header>
      <div className="skill-showcase-grid">
        <section className="glass skill-specimen">
          <div className="specimen-heading">
            <h2>材质预览</h2>
            <div className="segment" role="group" aria-label="选择玻璃材质">
              {materials.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected === item.id}
                  className={selected === item.id ? "selected" : ""}
                  onClick={() => setSelected(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="hub-glass-scene specimen-scene" data-theme={theme}>
            <div
              key={material.id}
              data-material={material.id}
              className="hub-glass glass specimen-card"
            >
              <span className="mono">Liquid Glass</span>
              <h3>{material.name}玻璃</h3>
              <p>alexwjj-liquid-glass</p>
            </div>
          </div>
          <dl className="material-values" aria-live="polite">
            <div>
              <dt>{theme === "dark" ? "暗色混合" : "白色混合"}</dt>
              <dd>{theme === "dark" ? 36 : material.tint}%</dd>
            </div>
            <div>
              <dt>折射偏移</dt>
              <dd>{material.bend} px</dd>
            </div>
            <div>
              <dt>圆角</dt>
              <dd>{material.radius} px</dd>
            </div>
          </dl>
        </section>
        <section className="glass skill-install">
          <h2>在项目中使用</h2>
          <p>
            下载后解压，将 <code>{glassSkillId}</code> 文件夹放进项目的{" "}
            <code>.agents/skills/</code>。
          </p>
          <a
            className="pill primary"
            href={`${import.meta.env.BASE_URL}downloads/${glassSkillId}.zip`}
            download
          >
            <Download size={15} />
            下载 Skill
          </a>
          <h3>在项目中发起一次任务</h3>
          <p className="skill-prompt">{prompt}</p>
          <button type="button" className="text-link" onClick={copyPrompt}>
            {copyState === "copied" ? <Check size={14} /> : <Copy size={14} />}
            <span aria-live="polite">
              {copyState === "copied"
                ? "已复制"
                : copyState === "manual"
                  ? "请选中上方示例复制"
                  : "复制使用示例"}
            </span>
          </button>
        </section>
      </div>
      <details className="glass skill-instructions">
        <summary>查看 SKILL.md 指令</summary>
        <pre>{instructions}</pre>
      </details>
    </section>
  );
}
