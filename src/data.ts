import { projectUrlForHost } from './lib/project-links';
import projectCatalog from "./content/projects.json";
export type ToolId = "claude" | "codex" | "pi" | "pencil" | "warp";
export type Entry = { name: string; description: string; href?: string; status?: string };
export type Tool = { id: ToolId; name: string; label: string; description: string; url: string; category: string };
export const profile = {
  name: "俊劫", handle: "alexwjj", tagline: "开发者 / AIGC 探索者 / 持续创造",
  github: "https://github.com/alexwjj", blog: "https://alexwjj.github.io/",
  portfolio: "https://alexwjj.weightbook.icu/", juejin: "https://juejin.cn/user/3386151545609837/posts",
  bilibili: "https://space.bilibili.com/64755432", x: "https://x.com/junjiezed",
};
export const tools: Tool[] = [
  { id: "claude", name: "Claude Code", label: "终端编程", description: "代码理解、项目修改与工具协作。", url: "https://code.claude.com/", category: "AI 编程" },
  { id: "codex", name: "Codex", label: "开发工作台", description: "在项目上下文中连接代码、浏览器和创作工具。", url: "https://chatgpt.com/codex", category: "AI 编程" },
  { id: "pi", name: "pi.dev", label: "轻量 Agent", description: "通过扩展、技能与提示模板组合开发环境。", url: "https://pi.dev/", category: "AI 编程" },
  { id: "pencil", name: "Pencil", label: "设计画布", description: "界面设计、组件探索与设计到代码。", url: "https://www.pen.dev/", category: "设计工具" },
  { id: "warp", name: "Warp", label: "智能终端", description: "终端命令、项目操作与开发协作。", url: "https://www.warp.dev/", category: "效率工具" },
];

export type Project = {
  id: string;
  origins: string[];
  visibility: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  url: string;
  image?: string;
  kind: string;
  source?: string;
};
export const projects: Project[] = projectCatalog.map(project => ({
  ...project, url: projectUrlForHost(project, typeof location === "undefined" ? "" : location.hostname) || project.url,
}));

export const workflows = [
  {
    id: "idea-to-page",
    name: "从想法到页面",
    description: "连接仓库上下文、设计工具、Agent 实现与真实验收。",
    category: "开发",
    tools: ["Pencil", "Claude Code", "Codex"],
    steps: [
      {
        title: "读取项目",
        description: "仓库上下文与变更边界",
        detail:
          "读取项目约定和相关源码，确认启动方式、已有改动与需要验证的链路。",
        output: "目标、范围与验收标准",
      },
      {
        title: "设计与拆解",
        description: "Pencil / shadcn 组件",
        detail:
          "按需在 Pencil 或真实页面中确认布局与关键交互，复用 shadcn 组件并拆解实现范围。",
        output: "页面结构与设计方向",
      },
      {
        title: "实现与评审",
        description: "Agent 协作与可运行改动",
        detail:
          "结合任务所需的 Skills 与 MCP 推进代码修改，检查边界与异常路径，运行构建和相关测试。",
        output: "可运行的页面与代码",
      },
      {
        title: "浏览器验收",
        description: "Ego · CI · Vercel",
        detail:
          "用真实浏览器验证交互、滚动和不同视口；提交后检查 CI 与 Vercel 部署，再打开线上页面核对。",
        output: "验证结果与后续清单",
      },
    ],
  },
  {
    id: "notes-to-knowledge",
    name: "从笔记到知识库",
    description: "连接记录，让下一次查找与复用更轻松。",
    category: "知识",
    tools: ["Obsidian", "Skills"],
    steps: [
      {
        title: "收集",
        description: "保留想法与原始来源",
        detail: "记录问题、链接与实践过程，先保留上下文，避免只收藏标题。",
        output: "原始记录",
      },
      {
        title: "整理",
        description: "补充标签与笔记结构",
        detail: "用稳定的命名、属性和主题分类整理内容，合并重复信息。",
        output: "结构化笔记",
      },
      {
        title: "连接",
        description: "关联主题与具体项目",
        detail: "使用双向链接连接概念、决策和项目，把有用的经验放回实际场景。",
        output: "主题索引与关联",
      },
      {
        title: "复用",
        description: "沉淀方法与可执行步骤",
        detail: "把频繁出现的做法整理成模板或 Skill，并在实际任务中持续修订。",
        output: "可复用的方法与模板",
      },
    ],
  },
];

export const websites: Entry[] = [
  {
    name: "ChatGPT",
    description: "讨论想法、研究与日常问答",
    href: "https://chatgpt.com/",
  },
  {
    name: "Claude",
    description: "写作、推敲与代码讨论",
    href: "https://claude.ai/",
  },
  {
    name: "Gemini",
    description: "多模态探索与信息理解",
    href: "https://gemini.google.com/",
  },
  {
    name: "Perplexity",
    description: "带来源的信息检索",
    href: "https://www.perplexity.ai/",
  },
  {
    name: "Hugging Face",
    description: "浏览模型与开源 AI 项目",
    href: "https://huggingface.co/",
  },
  {
    name: "shadcn/ui",
    description: "查找组件与界面实现参考",
    href: "https://ui.shadcn.com/",
  },
];
