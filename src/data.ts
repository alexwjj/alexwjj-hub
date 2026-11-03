import projectCatalog from "./content/projects.json";
export type ToolId = "claude" | "codex" | "pi" | "pencil" | "warp";
export type ManualTab = "usage" | "plugins" | "mcp" | "skills";
export type Entry = {
  name: string;
  description: string;
  href?: string;
  status?: string;
};
export type Tool = {
  id: ToolId;
  name: string;
  label: string;
  description: string;
  url: string;
  category: string;
  color: string;
  entries: Record<ManualTab, Entry[]>;
};

export const profile = {
  name: "俊劫",
  handle: "alexwjj",
  tagline: "开发者 / AIGC 探索者 / 持续创造",
  github: "https://github.com/alexwjj",
  blog: "https://alexwjj.github.io/",
  portfolio: "https://alexwjj.weightbook.icu/",
  juejin: "https://juejin.cn/user/3386151545609837/posts",
  bilibili: "https://space.bilibili.com/64755432",
  x: "https://x.com/junjiezed",
};

export const tools: Tool[] = [
  {
    id: "claude",
    name: "Claude Code",
    label: "终端里的编程搭档",
    description:
      "把需求、项目上下文与可复用能力带进终端，完成从理解代码到验证改动的过程。",
    url: "https://code.claude.com/docs/en/overview",
    category: "AI 编程",
    color: "coral",
    entries: {
      usage: [
        {
          name: "先给上下文，再开始动手",
          description:
            "说明目标、相关代码与验收标准。复杂任务先拆出步骤，确认范围后逐步实现。",
        },
        {
          name: "让项目约定跟着代码走",
          description:
            "把启动方式、代码风格和项目边界放进 CLAUDE.md，减少每次对话重复交代。",
        },
        {
          name: "把验证写进任务",
          description:
            "要求说明修改范围，运行相关检查，并把未验证的部分明确留下。",
        },
      ],
      plugins: [
        {
          name: "Superpowers",
          description: "围绕计划、实现与验证组织开发过程。",
          href: "https://github.com/obra/superpowers",
          status: "本机已启用",
        },
        {
          name: "Claude Mem",
          description: "为跨会话的开发过程补充记忆与上下文。",
          href: "https://github.com/thedotmack/claude-mem",
          status: "本机已启用",
        },
        {
          name: "Skill Creator",
          description: "把重复工作整理成可复用的技能。",
          href: "https://github.com/anthropics/skills",
          status: "本机已启用",
        },
        {
          name: "Frontend Design",
          description: "面向界面实现的设计与编码能力。",
          href: "https://github.com/anthropics/skills",
          status: "本机已安装",
        },
      ],
      mcp: [
        {
          name: "Pencil",
          description: "连接设计画布，读取与调整界面。",
          href: "https://www.pen.dev/",
          status: "本机已配置",
        },
        {
          name: "Playwright",
          description: "操作浏览器，检查页面行为与截图。",
          href: "https://github.com/microsoft/playwright-mcp",
          status: "本机已配置",
        },
      ],
      skills: [
        {
          name: "Skill Creator",
          description:
            "从具体工作中提炼步骤、输入和验收要求，沉淀自己的 Skill。",
          href: "https://github.com/anthropics/skills",
          status: "本机已安装",
        },
        {
          name: "Frontend Design",
          description: "围绕布局、视觉与交互完成前端页面。",
          href: "https://github.com/anthropics/skills",
          status: "本机已安装",
        },
      ],
    },
  },
  {
    id: "codex",
    name: "Codex",
    label: "从任务到可运行的代码",
    description:
      "结合工作区、工具和技能，把一个想法持续推进到可以查看、运行与验证的结果。",
    url: "https://developers.openai.com/codex/",
    category: "AI 编程",
    color: "mono",
    entries: {
      usage: [
        {
          name: "描述结果与边界",
          description:
            "交代要解决的问题、使用场景、工作目录，以及需要保留的已有改动。",
        },
        {
          name: "把能力组合起来",
          description:
            "代码任务结合项目文件；设计与内容任务按需连接浏览器、画布和文档工具。",
        },
        {
          name: "用可见结果验收",
          description:
            "查看实际页面和关键交互，结合构建结果确认改动；保留明确的后续事项。",
        },
      ],
      plugins: [
        {
          name: "Sites",
          description: "网站开发与预览能力。",
          status: "当前环境可用",
        },
        {
          name: "Google Drive",
          description: "连接文档、表格与演示文稿。",
          status: "当前环境可用",
        },
        {
          name: "Documents & Presentations",
          description: "制作与检查文档、幻灯片等交付物。",
          status: "当前环境可用",
        },
      ],
      mcp: [
        {
          name: "Pencil",
          description: "在设计画布中读写页面与组件。",
          href: "https://www.pen.dev/",
          status: "当前环境可用",
        },
        {
          name: "Playwright",
          description: "在真实浏览器中执行页面检查。",
          href: "https://github.com/microsoft/playwright-mcp",
          status: "当前环境可用",
        },
        {
          name: "Blender",
          description: "为 3D 场景提供建模与场景操作入口。",
          href: "https://www.blender.org/",
          status: "当前环境可用",
        },
      ],
      skills: [
        {
          name: "Ponytail",
          description: "用最小的完整改动解决问题，减少不需要的抽象。",
          status: "本机已安装",
        },
        {
          name: "Obsidian Markdown",
          description: "整理笔记、属性、双向链接与知识内容。",
          status: "本机已安装",
        },
        {
          name: "Imagegen",
          description: "按描述生成或编辑图片。",
          status: "本机已安装",
        },
        {
          name: "Write Researched Articles",
          description: "研究资料、核验来源，再组织成长文。",
          status: "本机已安装",
        },
      ],
    },
  },
  {
    id: "pi",
    name: "pi.dev",
    label: "可塑的轻量 Agent",
    description:
      "通过扩展、技能和提示模板，把轻量编程 Agent 组合成适合自己的工作方式。",
    url: "https://pi.dev/",
    category: "AI 编程",
    color: "purple",
    entries: {
      usage: [
        {
          name: "从一个具体任务开始",
          description: "明确输入、输出与完成标准，再围绕任务逐步补充工作流。",
        },
        {
          name: "把重复操作变成扩展",
          description:
            "用 extensions、skills 和 prompt templates 组织自己的能力。",
        },
      ],
      plugins: [
        {
          name: "Pi Packages",
          description: "通过官方包目录探索扩展；个人已用清单待补充。",
          href: "https://pi.dev/packages",
          status: "待整理",
        },
      ],
      mcp: [
        {
          name: "集成记录",
          description: "个人连接方式与使用经验还在整理中。",
          status: "待整理",
        },
      ],
      skills: [
        {
          name: "自定义 Skills",
          description: "按任务组织可以重复使用的指令；个人配置待补充。",
          status: "待整理",
        },
      ],
    },
  },
  {
    id: "pencil",
    name: "Pencil",
    label: "先把想法画出来",
    description:
      "在画布中探索界面结构、视觉方向与组件，再把设计衔接到代码实现。",
    url: "https://www.pen.dev/",
    category: "设计工具",
    color: "orange",
    entries: {
      usage: [
        {
          name: "从结构与场景开始",
          description:
            "先描述用户目标、页面结构和参考方向，再细化字体、间距与组件。",
        },
        {
          name: "设计和实现一起验证",
          description:
            "设计稿确认后，结合开发工具逐步还原布局，并检查不同屏幕下的表现。",
        },
      ],
      plugins: [
        {
          name: "画布工作区",
          description: "在设计文件中组织页面、可复用组件和视觉变量。",
          href: "https://docs.pen.dev/",
        },
      ],
      mcp: [
        {
          name: "Pencil MCP",
          description: "本机已连接设计画布能力；具体任务由编程 Agent 调用。",
          status: "本机已配置",
        },
      ],
      skills: [
        {
          name: "设计实践记录",
          description: "个人设计提示词和交付习惯待补充。",
          status: "待整理",
        },
      ],
    },
  },
  {
    id: "warp",
    name: "Warp",
    label: "日常开发的终端入口",
    description:
      "把命令行操作、项目上下文和 AI 辅助结合起来，整理日常开发过程。",
    url: "https://www.warp.dev/",
    category: "效率工具",
    color: "blue",
    entries: {
      usage: [
        {
          name: "整理常用开发命令",
          description:
            "把启动、检查、构建等常用操作放在一起，保留命令的用途与适用目录。",
        },
        {
          name: "在终端里解决问题",
          description: "围绕报错与运行结果补充上下文，逐步定位问题并验证。",
        },
      ],
      plugins: [
        {
          name: "终端工作流",
          description: "个人常用命令和工作流清单待补充。",
          href: "https://docs.warp.dev/",
          status: "待整理",
        },
      ],
      mcp: [
        {
          name: "集成记录",
          description: "个人 MCP 连接与配置经验待补充。",
          status: "待整理",
        },
      ],
      skills: [
        {
          name: "使用笔记",
          description: "日常终端与 Agent 协作经验待补充。",
          status: "待整理",
        },
      ],
    },
  },
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
export const projects: Project[] = projectCatalog;

export const workflows = [
  {
    id: "idea-to-page",
    name: "从想法到页面",
    description: "让模糊想法，逐步变成可以使用的作品。",
    category: "开发",
    tools: ["Pencil", "Claude Code", "Codex"],
    steps: [
      {
        title: "明确需求",
        description: "整理想法与使用场景",
        detail:
          "写下谁会使用、需要完成什么，以及这次必须交付的内容。收集参考，明确暂时不做的部分。",
        output: "目标、范围与验收标准",
      },
      {
        title: "界面设计",
        description: "确认结构与视觉方向",
        detail:
          "从信息层级和关键操作开始，确定布局、组件与黑白主题，再检查手机端的展示方式。",
        output: "页面结构与设计方向",
      },
      {
        title: "编码实现",
        description: "逐步搭建可运行页面",
        detail:
          "把数据与界面分开，复用组件，先实现主流程，再补齐搜索、筛选和不同交互状态。",
        output: "可运行的页面与代码",
      },
      {
        title: "检查验证",
        description: "体验流程，打磨细节",
        detail:
          "实际打开页面，检查导航、搜索、键盘操作与响应式布局，完成构建并记录已知限制。",
        output: "验证结果与后续清单",
      },
    ],
  },
  {
    id: "research-to-article",
    name: "从研究到内容",
    description: "把零散资料，整理成有来源、可阅读的内容。",
    category: "内容",
    tools: ["Codex", "Skills"],
    steps: [
      {
        title: "确定问题",
        description: "明确读者与文章目标",
        detail: "用一句话描述要解释的问题，列出读者需要的背景与文章边界。",
        output: "写作目标与问题清单",
      },
      {
        title: "研究查证",
        description: "找资料，核对关键事实",
        detail: "优先使用原始资料，保留来源，区分事实、推断与尚未确认的信息。",
        output: "有出处的研究笔记",
      },
      {
        title: "组织表达",
        description: "建立结构与叙事顺序",
        detail: "先写结论和大纲，再展开论据，按实际需要加入例子、对比和配图。",
        output: "文章初稿",
      },
      {
        title: "校对归档",
        description: "检查来源与阅读体验",
        detail: "复核链接、标题、引用和图片，把可复用资料整理进知识库。",
        output: "文章与素材归档",
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

export const articles = [
  {
    name: "Vue 2.x 高阶问题，你能答多少？",
    description: "从常见问题出发，梳理 Vue 中值得深入理解的细节。",
    category: "Vue",
    href: "https://juejin.cn/post/6921911974611664903",
    reading: "技术整理",
  },
  {
    name: "拯救你的年底 KPI：前端性能优化",
    description: "围绕性能与体验，记录前端优化的思考和实践。",
    category: "工程实践",
    href: "https://juejin.cn/post/6911472693405548557",
    reading: "实践分享",
  },
  {
    name: "reveal.js 制作网页版 PPT",
    description: "用熟悉的前端技术，制作可以在线访问的演示文稿。",
    category: "效率工具",
    href: "https://juejin.cn/post/6850037266082070535",
    reading: "工具实践",
  },
];

export const prompt =
  "请先理解项目与已有约定，明确这次任务的目标和边界，再用最小的完整改动实现。完成后验证关键交互，并说明修改内容、验证结果和未完成的部分。";
