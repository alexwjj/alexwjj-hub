import { useEffect, useRef, useState } from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  api,
  AuthProvider,
  LoginButton,
  OwnerDashboard,
  useAuth,
} from "./account";
import {
  BackgroundSettings,
  useAppearance,
} from "./components/BackgroundSettings";
import {
  FilterPills,
  Icon,
  OutLink,
  PageHeading,
  SearchField,
  SectionHeading,
} from "./components/hub-ui";
import { Guestbook } from "./Guestbook";
import { UserAvatar, AccountIdentity } from "./components/UserAvatar";
import { Discover } from "./Discover";
import { profile, projects } from "./data";
import type { Project } from "./data";
import { resources } from "./content/resources";
import type { Resource } from "./content/resources";
import {
  dailySteps,
  designFlows,
  designTools,
  projectCopy,
  skillCopy,
  skillIcons,
  mcpIcons,
} from "./design-data";
import {
  LiquidGlassSkill,
  glassSkillId,
  glassSkillPath,
} from "./LiquidGlassSkill";
import { LiquidGlass } from "./LiquidGlass";
import { GlassGroup, GlassIndicator } from "./components/GlassMotion";
import { transitionTheme } from "./lib/theme-transition";
import { Wallpaper } from "./components/BackgroundSettings";

const skillCount = resources.filter(
  (resource) => resource.kind === "skill",
).length;
const mcpCount = String(resources.length - skillCount).padStart(2, "0");
const navigation = [
  { to: "/", name: "总览", icon: "panels" },
  { to: "/projects", name: "作品", icon: "layers", count: "09" },
  { to: "/workflows", name: "工作流", icon: "workflow", count: "08" },
  { to: "/tools", name: "AI 工具箱", icon: "command", count: "16" },
  {
    to: "/resources",
    name: "Skills & MCP",
    icon: "blocks",
    count: String(resources.length),
  },
  { to: "/discover", name: "发现", icon: "compass", count: "02" },
  { to: "/guestbook", name: "留言板", icon: "message" },
  { to: "/about", name: "关于我", icon: "user" },
  { to: "/admin", name: "作品数据", icon: "chart" },
];
declare const __HUB_UPDATED_AT__: string;
const ageMinutes = Math.max(
  0,
  Math.floor((Date.now() - Date.parse(__HUB_UPDATED_AT__)) / 60000),
);
const updatedLabel =
  ageMinutes < 1
    ? "just now"
    : ageMinutes < 60
      ? `${ageMinutes} minutes ago`
      : `${Math.floor(ageMinutes / 60)} hours ago`;
const projectOrder = [
  "alexwjj-hub",
  "alexwjj-site",
  "family-genealogy",
  "yunshang-house-3d",
];
function MoreLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <Icon name="arrow" size={13} />
    </Link>
  );
}
function HeroStatus() {
  return (
    <div className="hero-status">
      <div className="glass status-back" />
      <div className="glass status-front">
        <div className="flex items-center justify-between muted text-[10px]">
          <span className="flex items-center gap-2">
            <i className="status-dot" />
            正在构建
          </span>
          <Icon name="git" size={14} />
        </div>
        <h2 className="text-[25px] font-semibold tracking-[-1px] mt-[14px]">
          alexwjj-hub
        </h2>
        <p className="text-xs muted mt-[14px]">一个持续生长的个人数字空间</p>
        <div className="mono text-[9px] muted mt-4 pt-3 border-t border-border flex gap-[7px]">
          <Icon name="commit" size={13} />
          main · updated {updatedLabel}
        </div>
      </div>
    </div>
  );
}
function Home() {
  const [kind, setKind] = useState("Skills");
  const hub = projects.find((p) => p.id === "alexwjj-hub")!;
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow flex items-center gap-2">
            <i className="status-dot" />
            ALEXWJJ — A SPACE TO CREATE
          </div>
          <h1>创造，自成一格。</h1>
          <p>作品、工具与灵感，在这里自然连接。</p>
          <div className="flex flex-wrap items-center gap-3 mt-[22px]">
            <Link className="pill primary !h-[42px] !px-5" to="/projects">
              探索我的作品
              <Icon name="arrow" size={16} />
            </Link>
            <Link className="pill !h-[42px] !px-4" to="/workflows">
              查看工作流
              <Icon name="right" size={17} />
            </Link>
            <MoreLink to={glassSkillPath}>获取本站玻璃 Skill</MoreLink>
          </div>
        </div>
        <HeroStatus />
      </section>
      <section className="home-tools">
        <SectionHeading title="你的常用工具" eyebrow="MY DAILY STACK">
          <MoreLink to="/tools">全部工具</MoreLink>
        </SectionHeading>
        <div className="daily-tools">
          {["claude", "codex", "pi", "pencil", "warp"].map((id) => {
            const tool = designTools.find((t) => t.id === id)!;
            return (
              <OutLink className="glass tool-shortcut" key={id} href={tool.url}>
                <span className="soft-icon">
                  <Icon
                    name={
                      {
                        claude: "asterisk",
                        codex: "code",
                        pi: "terminal",
                        pencil: "pencil-line",
                        warp: "square-terminal",
                      }[id]
                    }
                    size={19}
                  />
                </span>
                <div>
                  <h3>{tool.name}</h3>
                  <p>{tool.subtitle}</p>
                </div>
                <Icon name="arrow" size={13} className="ml-auto muted" />
              </OutLink>
            );
          })}
        </div>
      </section>
      <section className="home-work-grid">
        <div>
          <SectionHeading title="精选作品" eyebrow="SELECTED WORK">
            <MoreLink to="/projects">所有作品</MoreLink>
          </SectionHeading>
          <OutLink href={hub.url} className="glass featured-project">
            <div className="featured-info">
              <div className="eyebrow">• FEATURED PROJECT / 01</div>
              <h2>alexwjj-hub</h2>
              <p>
                一个持续生长的个人数字空间。
                <br />
                让作品、工具与知识，在此连接。
              </p>
              <div className="flex gap-2 mt-auto items-center">
                <span className="tag">React</span>
                <span className="tag">shadcn/ui</span>
                <span className="text-link ml-auto">
                  查看项目
                  <Icon name="arrow" size={13} />
                </span>
              </div>
            </div>
            <img
              className="featured-preview"
              src={hub.image}
              alt="alexwjj-hub 界面预览"
            />
          </OutLink>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Link className="glass mini-project" to="/workflows">
              <Icon name="workflow" size={19} />
              <div>
                <h3>AI DevFlow</h3>
                <p>从需求到交付的 AI 开发实践</p>
              </div>
              <Icon name="arrow" size={13} className="ml-auto muted" />
            </Link>
            <Link className="glass mini-project" to="/projects">
              <Icon name="panel-top" size={19} />
              <div>
                <h3>UI Lab</h3>
                <p>界面实验与交互灵感</p>
              </div>
              <Icon name="arrow" size={13} className="ml-auto muted" />
            </Link>
          </div>
        </div>
        <div>
          <SectionHeading title="让工具协同工作">
            <MoreLink to="/workflows">全部工作流</MoreLink>
          </SectionHeading>
          <Link className="glass home-flow" to="/workflows">
            <div className="flex justify-between items-center">
              <div>
                <h3>从想法到上线</h3>
                <p className="mt-2 muted text-[11px]">我的日常 AI 开发路径</p>
              </div>
              <span className="round-button">
                <Icon name="arrow" size={18} />
              </span>
            </div>
            <ol>
              {[
                { title: "理解与拆解", tool: "Claude Code · 项目上下文" },
                { title: "设计与构建", tool: "Pencil + shadcn/ui" },
                { title: "编码与验证", tool: "Codex · Warp · ego lite" },
                { title: "部署与沉淀", tool: "GitHub · Vercel" },
              ].map((step, i) => (
                <li key={step.title}>
                  <span className="mono muted text-[10px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <strong>{step.title}</strong>
                  <span className="ml-auto muted text-[10px]">{step.tool}</span>
                </li>
              ))}
            </ol>
          </Link>
        </div>
      </section>
      <section className="home-capabilities">
        <SectionHeading title="可复用的能力">
          <MoreLink to="/resources">探索能力库</MoreLink>
        </SectionHeading>
        <div className="glass capability-summary">
          <div className="flex justify-between">
            <GlassGroup className="segment">
              <button
                className={kind === "Skills" ? "selected" : ""}
                aria-pressed={kind === "Skills"}
                onClick={() => setKind("Skills")}
              >
                <GlassIndicator active={kind === "Skills"} />
                Skills <span>{skillCount}</span>
              </button>
              <button
                className={kind === "MCP" ? "selected" : ""}
                aria-pressed={kind === "MCP"}
                onClick={() => setKind("MCP")}
              >
                <GlassIndicator active={kind === "MCP"} />
                MCP <span>{mcpCount}</span>
              </button>
            </GlassGroup>
            <Icon name="bookmark" size={13} className="muted self-center" />
          </div>
          <div
            key={kind}
            className="liquid-content grid grid-cols-2 gap-10 mt-2 max-sm:grid-cols-1"
          >
            {(kind === "Skills"
              ? [
                  {
                    name: glassSkillId,
                    description: "本站液态玻璃 · 预览与下载",
                  },
                  {
                    name: "frontend-design",
                    description: "构建更有辨识度的前端界面",
                  },
                ]
              : [
                  { name: "GitHub", description: "连接仓库、Issue 与代码审查" },
                  { name: "Pencil", description: "在设计与代码之间保持上下文" },
                ]
            ).map((r) => (
              <Link
                className="capability-summary-link"
                to={
                  r.name === glassSkillId
                    ? glassSkillPath
                    : `/resources?kind=${kind === "Skills" ? "skill" : "mcp"}&q=${encodeURIComponent(r.name)}`
                }
                key={r.name}
              >
                <Icon
                  name={
                    r.name === "frontend-design"
                      ? "layout"
                      : r.name === "GitHub"
                        ? "github"
                        : r.name === "Pencil"
                          ? "pencil"
                          : "sparkles"
                  }
                  size={16}
                />
                <div>
                  <h3 className="mono text-[13px] font-medium">{r.name}</h3>
                  <p className="muted text-[11px] mt-1.5">{r.description}</p>
                </div>
                <Icon name="arrow" size={13} className="ml-auto muted" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const info = projectCopy[project.id];
  return (
    <article className="glass project-card">
      <OutLink href={project.url} className="block">
        <div className="project-preview">
          {project.image ? (
            <img
              src={project.image}
              alt={`${info?.name || project.name} 实际页面截图`}
              width={1280}
              height={800}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
            />
          ) : (
            <div className="generic-preview">
              <Icon
                name={
                  project.id === "jlabphotos"
                    ? "image"
                    : project.id === "x-reader"
                      ? "book"
                      : "panels"
                }
                size={42}
              />
              <span>{project.name}</span>
            </div>
          )}
        </div>
      </OutLink>
      <div className="project-information">
        <div className="muted text-[10px]">
          {project.category} /{" "}
          {project.id === "alexwjj-hub"
            ? "WORKSPACE"
            : String(index).padStart(2, "0")}
        </div>
        <OutLink href={project.url}>
          <h2>{info?.name || project.name}</h2>
        </OutLink>
        <p>{info?.description || project.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="mono muted text-[10px]">
            {info?.tech || project.tags.join(" · ")}
          </span>
          <OutLink
            className="text-link !text-[10px]"
            href={project.url}
            label={`打开 ${project.name}`}
          >
            {project.id === "alexwjj-hub" ? "打开工作台" : null}
            <Icon name="arrow" size={14} />
          </OutLink>
        </div>
      </div>
    </article>
  );
}
function Projects() {
  const [category, setCategory] = useState("全部 09"),
    [query, setQuery] = useState(""),
    [visibleCount, setVisibleCount] = useState(6);
  const loadMore = useRef<HTMLButtonElement>(null);
  const ordered = [...projects].sort(
    (a, b) =>
      (projectOrder.indexOf(a.id) < 0 ? 99 : projectOrder.indexOf(a.id)) -
      (projectOrder.indexOf(b.id) < 0 ? 99 : projectOrder.indexOf(b.id)),
  );
  const filtered = ordered.filter(
    (p) =>
      (category.startsWith("全部") || category.startsWith(p.category)) &&
      `${p.name} ${p.description} ${p.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const shown = filtered.slice(0, visibleCount);
  const hasMore = shown.length < filtered.length;
  useEffect(() => {
    const target = loadMore.current;
    if (!hasMore || !target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        setVisibleCount((count) => count + 3);
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, visibleCount, category, query]);
  return (
    <>
      <PageHeading
        eyebrow="PROJECTS / 09"
        title="把探索，做成作品。"
        description="从一个想法出发，把技术、设计与真实需求连接起来。"
      />
      <div className="page-controls">
        <FilterPills
          label="作品分类"
          items={["全部 09", "个人网站 03", "产品实践 05", "开源项目 01"]}
          value={category}
          onChange={(v) => {
            setCategory(v);
            setVisibleCount(6);
          }}
        />
        <SearchField
          value={query}
          onChange={(value) => {
            setQuery(value);
            setVisibleCount(6);
          }}
          placeholder="搜索名称、技术或用途"
          label="搜索作品"
        />
      </div>
      <div className="projects-grid">
        {shown.map((p, i) => (
          <ProjectCard project={p} index={i} key={p.id} />
        ))}
      </div>
      {!shown.length && (
        <p className="data-placeholder">没有找到匹配的作品。</p>
      )}
      <div className="flex items-center justify-between mt-[34px]">
        <span className="mono text-[11px] muted">
          已展示 {shown.length} / {filtered.length} 个作品
        </span>
        {hasMore && (
          <button
            ref={loadMore}
            className="pill"
            onClick={() => setVisibleCount((count) => count + 3)}
          >
            加载更多作品
            <Icon name="down" size={14} />
          </button>
        )}
      </div>
    </>
  );
}
function FlowDialog({
  flow,
  open,
  onClose,
}: {
  flow: (typeof designFlows)[number] | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flow-dialog">
        <DialogHeader>
          <DialogTitle>{flow?.title}</DialogTitle>
          <DialogDescription>{flow?.description}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-5 mt-5">
          {(flow?.id === "delivery"
            ? dailySteps
            : flow?.trail.split(" → ").map((title, i) => ({
                title,
                description: flow.description,
                tool: flow.tools.split(" / ")[
                  Math.min(i, flow.tools.split(" / ").length - 1)
                ],
                icon: flow.icon,
              })) || []
          ).map((step, i) => (
            <li className="flex gap-4" key={step.title}>
              <span className="soft-icon mono text-xs">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-base">{step.title}</h3>
                <p className="muted text-[13px] leading-7 mt-1">
                  {step.description}
                </p>
                <span className="tag mt-2">{step.tool}</span>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
function Workflows() {
  const location = useLocation();
  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get("q") || "");
    setCategory("全部 08");
  }, [location.search]);
  const [category, setCategory] = useState("全部 08"),
    [query, setQuery] = useState(
      new URLSearchParams(location.search).get("q") || "",
    ),
    [selected, setSelected] = useState<(typeof designFlows)[number] | null>(
      null,
    ),
    [expanded, setExpanded] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  function showFlow(flow: (typeof designFlows)[number]) {
    setSelected(flow);
    setFlowOpen(true);
  }
  const matches = designFlows.filter(
    (f) =>
      (category.startsWith("全部") || f.category === category) &&
      `${f.title} ${f.description} ${f.tools}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const daily = matches.find((f) => f.id === "delivery");
  const extra = matches.filter((f) => f.id !== "delivery");
  return (
    <>
      <PageHeading
        eyebrow="WORKFLOWS / 08"
        title="让好方法，稳定复用。"
        description="把任务拆成清晰步骤，让工具协同，也让每一次交付更从容。"
      />
      <div className="page-controls">
        <FilterPills
          items={["全部 08", "开发交付", "设计实现", "知识整理", "内容创作"]}
          value={category}
          onChange={setCategory}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="搜索流程或使用场景"
        />
      </div>
      {daily && (
        <article className="glass workflow-feature">
          <div className="flex flex-col">
            <div className="eyebrow">DAILY WORKFLOW / 01</div>
            <h2>从想法到上线</h2>
            <p>
              先理解问题，再设计与实现。
              <br />
              把验证放进过程，把经验留给下一次。
            </p>
            <div className="flex gap-2 mt-5">
              <span className="tag">5 steps</span>
              <span className="tag">AI assisted</span>
            </div>
            <p className="workflow-audience !text-[11px]">
              适合新功能、个人项目与小型产品验证。
            </p>
            <button
              className="pill primary self-start mt-5"
              onClick={() => showFlow(daily)}
            >
              查看完整流程
              <Icon name="arrow" size={14} />
            </button>
          </div>
          <ol className="workflow-detail-steps">
            {dailySteps.map((step, i) => (
              <li key={step.title}>
                <span className="soft-icon mono text-[10px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <span className="ml-auto flex flex-col items-end gap-2">
                  <Icon name={step.icon} size={16} />
                  <span>{step.tool}</span>
                </span>
              </li>
            ))}
          </ol>
        </article>
      )}
      <div className="mt-9 more-flow-heading">
        <SectionHeading title="为不同任务，留下一条清晰路径。" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(expanded || query || !category.startsWith("全部")
          ? extra
          : extra.slice(0, 3)
        ).map((flow) => (
          <button
            className="glass workflow-small text-left"
            key={flow.id}
            onClick={() => showFlow(flow)}
          >
            <div className="flex justify-between muted">
              <Icon name={flow.icon} size={24} />
              <Icon name="arrow" size={13} />
            </div>
            <h3>{flow.title}</h3>
            <p>{flow.description}</p>
            <span className="text-[11px] muted mt-auto">{flow.trail}</span>
            <span className="text-[10px] muted mt-2">{flow.tools}</span>
          </button>
        ))}
      </div>
      {!expanded && extra.length > 3 && (
        <button
          className="text-link workflow-more ml-auto"
          onClick={() => setExpanded(true)}
        >
          查看其余 {extra.length - 3} 个流程
          <Icon name="down" size={13} />
        </button>
      )}
      {!matches.length && (
        <p className="data-placeholder">没有找到匹配的流程。</p>
      )}
      <FlowDialog
        flow={selected}
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
      />
    </>
  );
}
function Tools() {
  const [category, setCategory] = useState("全部 16"),
    [query, setQuery] = useState(""),
    [expanded, setExpanded] = useState(false);
  const shown = designTools.filter(
    (t) =>
      (category.startsWith("全部") ||
        t.category === category ||
        (category === "编码助手" && t.id === "warp") ||
        (category === "效率工具" &&
          ["开发协作", "浏览器验证", "部署交付"].includes(t.category))) &&
      `${t.name} ${t.description} ${t.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="TOOLBOX / 16"
        title="工具少一点，创造多一点。"
        description="收录真正进入日常的工具，按任务找到适合自己的下一步。"
      />
      <div className="page-controls">
        <FilterPills
          items={["全部 16", "编码助手", "设计原型", "效率工具", "知识管理"]}
          value={category}
          onChange={setCategory}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="搜索工具或任务"
        />
      </div>
      <section className="glass tool-pipeline">
        <div>
          <div className="eyebrow">MY DAILY STACK</div>
          <h2>从设计到上线</h2>
          <p>每个环节，留下最顺手的工具。</p>
        </div>
        {[
          { name: "设计", tool: "Pencil", icon: "pencil" },
          {
            name: "编码",
            tool: "Claude Code · Codex",
            detail: "Warp",
            icon: "code",
          },
          {
            name: "验证",
            tool: "ego lite",
            detail: "真实页面验证",
            icon: "globe",
          },
          { name: "交付", tool: "GitHub", icon: "pull-request" },
          { name: "部署", tool: "Vercel", icon: "cloud-upload" },
        ].map((step) => (
          <div className="pipeline-step" key={step.name}>
            <span className="soft-icon">
              <Icon name={step.icon} size={19} />
            </span>
            <small>{step.name}</small>
            <strong>{step.tool}</strong>
            {step.detail && <span>{step.detail}</span>}
          </div>
        ))}
      </section>
      <div className="mt-7 tool-list-heading">
        <SectionHeading title="常用与精选">
          <span className="muted text-[11px]">按使用场景整理</span>
        </SectionHeading>
      </div>
      <div className="tool-detail-grid">
        {(expanded || query || !category.startsWith("全部")
          ? shown
          : shown.slice(0, 8)
        ).map((tool) => (
          <article className="glass tool-detail-card" key={tool.id}>
            <span className="soft-icon">
              <Icon name={tool.icon} size={23} />
            </span>
            <div className="tool-details">
              <div className="flex items-center gap-3">
                <h2>{tool.name}</h2>
                <span className="ml-auto mono muted text-[10px]">
                  {tool.platform}
                </span>
              </div>
              <p>{tool.description}</p>
              <div className="tool-actions">
                <span className="muted text-[10px]">{tool.category}</span>
                <OutLink href={tool.docs} className="ml-auto muted text-[10px]">
                  使用说明
                </OutLink>
                <OutLink href={tool.url} className="text-link !text-[11px]">
                  打开工具
                  <Icon name="arrow" size={13} />
                </OutLink>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!expanded && shown.length > 8 && (
        <button
          className="text-link tools-more ml-auto"
          onClick={() => setExpanded(true)}
        >
          查看其余 {shown.length - 8} 个工具
          <Icon name="down" size={13} />
        </button>
      )}
      {!shown.length && (
        <p className="data-placeholder">没有找到匹配的工具。</p>
      )}
    </>
  );
}
function Resources() {
  const location = useLocation(),
    navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const kind = params.get("kind") === "mcp" ? "mcp" : "skill";
  const [query, setQuery] = useState(params.get("q") || ""),
    [category, setCategory] = useState("全部"),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<Resource | null>(null);
  const [resourceOpen, setResourceOpen] = useState(false);
  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get("q") || "");
    setCategory("全部");
    setPage(0);
  }, [location.search]);
  const ordered = [...resources].sort((a, b) => {
    if (kind === "mcp") {
      const ids = [
        "github",
        "pencil",
        "playwright",
        "blender",
        "figma",
        "vercel",
      ];
      return ids.indexOf(a.id) - ids.indexOf(b.id);
    }
    const ids = Object.keys(skillCopy);
    return (
      (ids.indexOf(a.id) < 0 ? 99 : ids.indexOf(a.id)) -
      (ids.indexOf(b.id) < 0 ? 99 : ids.indexOf(b.id))
    );
  });
  const matches = ordered.filter(
    (r) =>
      r.kind === kind &&
      (category === "全部" || r.category === category) &&
      `${r.name} ${r.description} ${skillCopy[r.id]?.title || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(matches.length / 9));
  const current = Math.min(page, pages - 1);
  return (
    <>
      <PageHeading
        eyebrow={`CAPABILITIES / ${kind === "skill" ? "SKILLS" : "MCP"}`}
        title={
          kind === "skill" ? "让能力，随需而用。" : "让 AI，连接你的工作现场。"
        }
        description={
          kind === "skill"
            ? "按任务查找 Skills 与 MCP，把有效的方法带进每一次 AI 协作。"
            : "把代码、文档、浏览器与本地资源接进来，让上下文真正参与工作。"
        }
      />
      <div className="page-controls capabilities-controls !mb-5">
        <GlassGroup className="glass segment">
          <button
            className={kind === "skill" ? "selected" : ""}
            aria-pressed={kind === "skill"}
            onClick={() => navigate("/resources?kind=skill")}
          >
            <GlassIndicator active={kind === "skill"} />
            Skills <span>{skillCount}</span>
          </button>
          <button
            className={kind === "mcp" ? "selected" : ""}
            aria-pressed={kind === "mcp"}
            onClick={() => navigate("/resources?kind=mcp")}
          >
            <GlassIndicator active={kind === "mcp"} />
            MCP <span>{mcpCount}</span>
          </button>
        </GlassGroup>
        <SearchField
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(0);
          }}
          placeholder={
            kind === "skill" ? "搜索名称、用途或关键词" : "搜索服务、资源或用途"
          }
          label="搜索能力库"
        />
      </div>
      <FilterPills
        items={
          kind === "skill"
            ? [
                "全部",
                "开发",
                "设计",
                "浏览器",
                "知识管理",
                "内容创作",
                "文档交付",
                "协作",
              ]
            : ["全部", "开发", "设计", "浏览器"]
        }
        value={category}
        onChange={(v) => {
          setCategory(v);
          setPage(0);
        }}
      />
      <div className="section-heading mt-5">
        <div className="flex items-center gap-3">
          <h2 className="!text-[15px]">
            {kind === "skill" ? "全部 Skills" : "六种连接，扩展工作边界。"}
          </h2>
          <span className="muted text-[11px]">
            {kind === "skill" ? `${matches.length} 项能力` : ""}
          </span>
        </div>
        <span className="flex items-center gap-3 text-[11px] muted">
          {kind === "skill" ? (
            <>
              常用优先 <Icon name="filter" size={13} />
            </>
          ) : (
            "按用途查看工具与配置方式"
          )}
        </span>
      </div>
      <div
        key={`${kind}:${category}:${current}`}
        className={
          kind === "skill"
            ? "liquid-content resource-grid skills-grid"
            : "liquid-content resource-grid mcp-grid"
        }
      >
        {matches.slice(current * 9, current * 9 + 9).map((resource) => {
          const copy = kind === "skill" ? skillCopy[resource.id] : null;
          return (
            <article className="glass resource-card" key={resource.id}>
              {kind === "mcp" ? (
                <div className="flex items-center gap-2.5">
                  <span className="soft-icon">
                    <Icon name={mcpIcons[resource.id] || "box"} size={20} />
                  </span>
                  <h2 className="!m-0 !text-xl !leading-6">{resource.name}</h2>
                  <span className="ml-auto muted text-[10px]">
                    {resource.category}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[10px] muted">
                    <span className="flex items-center gap-2">
                      <Icon
                        name={skillIcons[resource.id] || "sparkles"}
                        size={16}
                      />
                      {resource.category}
                    </span>
                    <Icon name="bookmark" size={13} />
                  </div>
                  <h2>{copy?.title || resource.name}</h2>
                </>
              )}
              {kind === "skill" && (
                <span className="mono text-[10px] muted mt-1">
                  {resource.name}
                </span>
              )}
              <p>{copy?.description || resource.description}</p>
              {kind === "mcp" && (
                <span className="text-[10px] muted mt-3">
                  {
                    {
                      github: "仓库检索 / Issue / Pull request",
                      pencil: "设计画布 / 组件 / 设计到代码",
                      playwright: "页面操作 / DOM / 截图",
                      blender: "3D 场景 / 模型 / 材质",
                      figma: "设计上下文 / 组件 / 样式",
                      vercel: "部署查询 / 构建与运行信息",
                    }[resource.id]
                  }
                </span>
              )}
              <div className="flex justify-between items-center mt-auto pt-5">
                <span className="muted text-[10px]">
                  {kind === "skill"
                    ? copy?.tag || resource.category
                    : "MODEL CONTEXT PROTOCOL"}
                </span>
                {resource.id === glassSkillId ? (
                  <Link className="text-link !text-[10px]" to={glassSkillPath}>
                    预览与下载 <Icon name="arrow" size={12} />
                  </Link>
                ) : (
                  <button
                    className="text-link !text-[10px]"
                    onClick={() => {
                      setSelected(resource);
                      setResourceOpen(true);
                    }}
                  >
                    {kind === "skill" ? "查看用法" : "查看配置"}
                    <Icon name="arrow" size={12} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!matches.length && (
        <p className="data-placeholder">没有找到匹配的能力。</p>
      )}
      {kind === "skill" && (
        <div className="flex justify-between items-center mt-6">
          <span className="mono muted text-[10px]">
            {matches.length ? current * 9 + 1 : 0}–
            {Math.min((current + 1) * 9, matches.length)} / {matches.length}
          </span>
          <div className="flex gap-2 items-center">
            <button
              className="pill"
              disabled={!current}
              onClick={() => setPage(current - 1)}
            >
              <Icon name="left" size={13} />
              上一页
            </button>
            <span className="round-button !w-7 !h-7 primary">
              {current + 1}
            </span>
            <button
              className="pill"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              下一页
              <Icon name="next" size={13} />
            </button>
          </div>
        </div>
      )}
      <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
        <DialogContent className="resource-dialog">
          <DialogHeader>
            <DialogTitle>
              {(selected && skillCopy[selected.id]?.title) || selected?.name}
            </DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
          </DialogHeader>
          <p className="mono text-[12px] muted">{selected?.name}</p>
          <p className="text-[13px] leading-7">
            {selected?.kind === "mcp"
              ? "按任务连接服务，通过当前 AI 工具的 MCP 设置管理授权与可用范围。"
              : "在支持 Skills 的 AI 工具中调用该技能，并提供当前任务需要的项目上下文和验收标准。"}
          </p>
          {selected?.href ? (
            <OutLink className="pill primary self-start" href={selected.href}>
              查看公开来源
              <Icon name="arrow" size={14} />
            </OutLink>
          ) : (
            <p className="text-xs muted">本地自定义技能，尚无公开安装来源。</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function About() {
  return (
    <>
      <PageHeading
        eyebrow="ABOUT / ALEX"
        title="你好，我是俊劫。"
        description="开发者，也是在工程、设计与 AI 之间持续探索的创造者。"
      />
      <section className="about-intro">
        <div>
          <h2>
            把好奇心，
            <br />
            做成具体的东西。
          </h2>
          <p>
            我关注前端工程、AIGC 与产品体验。比起收藏更多工具，
            <br />
            我更在意它们能否帮助人完成真实的事。
            <br />
            <br />
            这个工作台连接我的作品、常用工具与实践方法，
            <br />
            也记录那些还在生长的想法。
          </p>
          <div className="flex flex-wrap gap-2 mt-[25px]">
            <span className="tag">Frontend Engineering</span>
            <span className="tag">AI × Product</span>
            <span className="tag">Build in public</span>
          </div>
        </div>
        <div className="glass about-identity">
          <span className="glass identity-avatar">
            <img
              src={profile.avatar}
              alt="俊劫的微信头像"
              width={102}
              height={102}
            />
          </span>
          <div className="identity-name">
            <h3>俊劫 / Alex</h3>
            <span className="mono text-[11px] muted">@alexwjj</span>
          </div>
          <span className="identity-location muted text-[11px]">
            <Icon name="map-pin" size={13} /> 浙江 · 杭州
          </span>
          <span className="mono text-[10px] tracking-wider muted">
            KEEP MAKING THINGS.
          </span>
        </div>
      </section>
      <section className="about-principles">
        <SectionHeading title="我如何做事" eyebrow="LESS NOISE, MORE MAKING" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[38px] mt-6">
          {[
            {
              title: "先弄清问题",
              text: "多问一句为什么，把目标和约束说清楚，\n再决定该用什么方法。",
            },
            {
              title: "把想法做小",
              text: "从可验证的一步开始，让想法尽早\n进入真实使用，再持续打磨。",
            },
            {
              title: "让经验流动",
              text: "记录过程与取舍，把一次解决的问题，\n变成下一次可以复用的经验。",
            },
          ].map((p, i) => (
            <div key={p.title}>
              <span className="mono muted text-[10px]">0{i + 1}</span>
              <h3 className="text-[19px] mt-[14px]">{p.title}</h3>
              <p className="muted text-xs leading-[1.9] mt-3 whitespace-pre-line">
                {p.text}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-[44px]">
        <SectionHeading title="在这些地方找到我" />
        <div className="social-links">
          {[
            {
              name: "GitHub",
              description: "@alexwjj · 项目与代码",
              url: profile.github,
              icon: "github",
            },
            {
              name: "掘金",
              description: "俊劫 · 技术与实践",
              url: profile.juejin,
              icon: "book",
            },
            {
              name: "X",
              description: "@junjiezed · AI 与日常观察",
              url: profile.x,
              icon: "x",
            },
          ].map((s) => (
            <OutLink className="glass social-card" href={s.url} key={s.name}>
              {s.name === "X" ? (
                <span
                  aria-hidden="true"
                  className="text-[23px] leading-[31px] muted"
                >
                  𝕏
                </span>
              ) : (
                <Icon name={s.icon} size={24} />
              )}
              <div>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
              </div>
              <Icon name="arrow" size={14} className="ml-auto muted" />
            </OutLink>
          ))}
        </div>
      </section>
    </>
  );
}
function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sites, setSites] = useState<
    { name: string; description: string; url: string }[]
  >([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    api<{ sites: { name: string; description: string; url: string }[] }>(
      "/api/discover",
      { signal: controller.signal },
    )
      .then((result) => setSites(result.sites))
      .catch(() => {});
    return () => controller.abort();
  }, [open]);
  const entries = [
    ...navigation
      .filter((n) => n.to !== "/admin" || user?.isOwner)
      .map((n) => ({ title: n.name, description: "页面", path: n.to })),
    ...projects.map((p) => ({
      title: projectCopy[p.id]?.name || p.name,
      description: `${p.name} · ${p.id} · ${p.description}`,
      href: p.url,
    })),
    ...designFlows.map((flow) => ({
      title: flow.title,
      description: flow.description,
      path: `/workflows?q=${encodeURIComponent(flow.title)}`,
    })),
    ...designTools.map((t) => ({
      title: t.name,
      description: t.description,
      href: t.url,
    })),
    ...sites.map((site) => ({
      title: site.name,
      description: site.description,
      href: site.url,
    })),
    ...resources.map((r) => ({
      title: skillCopy[r.id]?.title || r.name,
      description: `${r.name} · ${r.description}`,
      path:
        r.id === glassSkillId
          ? glassSkillPath
          : `/resources?kind=${r.kind}&q=${encodeURIComponent(r.name)}`,
    })),
  ];
  const shown = entries
    .filter((r) =>
      `${r.title} ${r.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .slice(0, query ? 25 : 9);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="search-dialog">
        <DialogHeader className="sr-only">
          <DialogTitle>搜索个人空间</DialogTitle>
          <DialogDescription>
            搜索作品、工具、工作流与通用能力。
          </DialogDescription>
        </DialogHeader>
        <div className="search-input-wrap">
          <Icon name="search" size={19} />
          <input
            autoFocus
            aria-label="搜索作品、工具、工作流"
            placeholder="搜索作品、工具、知识…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && shown.length)
                document.querySelector<HTMLElement>(".search-result")?.click();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                document.querySelector<HTMLElement>(".search-result")?.focus();
              }
            }}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="search-results">
          {shown.map((r, i) =>
            "href" in r ? (
              <OutLink className="search-result" href={r.href!} key={i}>
                <Icon name="search" size={17} />
                <div>
                  <strong>{r.title}</strong>
                  <p>{r.description}</p>
                </div>
                <Icon name="arrow" size={14} />
              </OutLink>
            ) : (
              <button
                className="search-result"
                key={i}
                onClick={() => {
                  navigate(r.path);
                  onClose();
                }}
              >
                <Icon name="search" size={17} />
                <div>
                  <strong>{r.title}</strong>
                  <p>{r.description}</p>
                </div>
                <Icon name="arrow" size={14} />
              </button>
            ),
          )}
          {!shown.length && <p className="search-empty">没有找到「{query}」</p>}
        </div>
        <div className="search-footer">
          搜索整个个人空间<span>Tab 切换 · ↵ 打开</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Shell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [currentTheme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("alex-hub-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  const [discoverCount, setDiscoverCount] = useState(2);
  const [accountError, setAccountError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "sidebar-collapsed",
      sidebarCollapsed,
    );
    return () => document.documentElement.classList.remove("sidebar-collapsed");
  }, [sidebarCollapsed]);
  const [searchOpen, setSearchOpen] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false),
    [accountOpen, setAccountOpen] = useState(false);
  const { appearance, setAppearance } = useAppearance();
  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: PointerEvent) => {
      if (e.target instanceof Element && !e.target.closest(".toolbar-account"))
        setAccountOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);
  const current = navigation.find((n) =>
    n.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(n.to),
  );
  const breadcrumbLabel =
    location.pathname === glassSkillPath
      ? "液态玻璃 Skill"
      : current?.to === "/resources"
        ? new URLSearchParams(location.search).get("kind") === "mcp"
          ? "能力库 · MCP"
          : "能力库 · Skills"
        : current?.name || "页面";
  useEffect(() => {
    let active = true;
    api<{ sites: unknown[] }>("/api/discover")
      .then((result) => {
        if (active) setDiscoverCount(result.sites.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", currentTheme === "dark");
    document.documentElement.style.colorScheme = currentTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        currentTheme === "dark" ? "#141518" : "#F5F5F3",
      );
    try {
      localStorage.setItem("alex-hub-theme", currentTheme);
    } catch {
      /* Storage is optional. */
    }
  }, [currentTheme]);
  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    window.scrollTo({ top: 0 });
    document.title = `${breadcrumbLabel} · alexwjj-hub`;
  }, [location.pathname, breadcrumbLabel]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const navContent = (
    <>
      <Link to="/" className="brand">
        <img
          className="brand-symbol"
          src={profile.avatar}
          alt=""
          width={36}
          height={36}
        />
        <span>
          <strong>alexwjj</strong>
          <small>PERSONAL HUB</small>
        </span>
      </Link>
      <GlassGroup className="nav-selection-region">
        <div className="nav-label">工作空间</div>
        <nav className="main-nav" aria-label="主导航">
          {navigation.slice(0, 6).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                "nav-item " + (isActive ? "selected" : "")
              }
            >
              {({ isActive }) => (
                <>
                  <GlassIndicator active={isActive} />
                  <Icon name={n.icon} size={17} />
                  <span>{n.name}</span>
                  {n.count && (
                    <small>
                      {n.to === "/discover"
                        ? String(discoverCount).padStart(2, "0")
                        : n.count}
                    </small>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="nav-label mt-7">交流与记录</div>
        <nav className="secondary-nav" aria-label="交流与记录">
          {navigation
            .slice(6)
            .filter((n) => n.to !== "/admin" || user?.isOwner)
            .map((n) => (
              <NavLink
                className={({ isActive }) =>
                  "nav-item " + (isActive ? "selected" : "")
                }
                key={n.to}
                to={n.to}
              >
                {({ isActive }) => (
                  <>
                    <GlassIndicator active={isActive} />
                    <Icon name={n.icon} size={17} />
                    <span>{n.name}</span>
                  </>
                )}
              </NavLink>
            ))}
        </nav>
      </GlassGroup>
      <div className="sidebar-bottom">
        <div className="sidebar-status">
          <span className="mono flex items-center gap-2 text-[11px]">
            <i className="status-dot" />
            Always building
          </span>
          <OutLink
            href={profile.github}
            className="flex items-center gap-2 text-xs mt-3"
          >
            <Icon name="github" size={15} />
            GitHub
            <Icon name="arrow" size={14} className="ml-auto" />
          </OutLink>
        </div>
      </div>
    </>
  );
  return (
    <TooltipProvider>
      <LiquidGlass />
      <Wallpaper id={appearance.wallpaper} />
      <div className="app-shell">
        <aside className="sidebar glass" inert={sidebarCollapsed}>
          {navContent}
        </aside>
        <div className="main-wrapper">
          <header className="topbar glass">
            <button
              className="icon-button desktop-panel-icon"
              aria-label="切换侧栏"
              aria-expanded={!sidebarCollapsed}
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              <Icon name="panel" size={18} />
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label="打开导航"
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="panel" size={18} />
            </button>
            <div className="breadcrumb">
              <span>个人空间</span>
              <span>/</span>
              <strong>{breadcrumbLabel}</strong>
            </div>
            <div className="topbar-actions">
              <button
                className="search-trigger"
                aria-label="打开全局搜索"
                onClick={() => setSearchOpen(true)}
              >
                <Icon name="search" size={15} />
                <span>搜索作品、工具、知识…</span>
                <kbd>⌘ K</kbd>
              </button>
              <BackgroundSettings
                appearance={appearance}
                onChange={setAppearance}
              />
              <GlassGroup className="theme-controls">
                <button
                  className={currentTheme === "light" ? "selected" : ""}
                  aria-label="浅色主题"
                  aria-pressed={currentTheme === "light"}
                  onClick={(e) =>
                    currentTheme !== "light" &&
                    transitionTheme(() => setTheme("light"), e.currentTarget)
                  }
                >
                  <GlassIndicator active={currentTheme === "light"} />
                  <Icon name="sun" size={15} />
                </button>
                <button
                  className={currentTheme === "dark" ? "selected" : ""}
                  aria-label="深色主题"
                  aria-pressed={currentTheme === "dark"}
                  onClick={(e) =>
                    currentTheme !== "dark" &&
                    transitionTheme(() => setTheme("dark"), e.currentTarget)
                  }
                >
                  <GlassIndicator active={currentTheme === "dark"} />
                  <Icon name="moon" size={15} />
                </button>
              </GlassGroup>
              <div className="toolbar-account">
                {user ? (
                  <>
                    <button
                      className="toolbar-account-trigger"
                      aria-label="账户菜单"
                      aria-expanded={accountOpen}
                      onClick={() => {
                        setAccountError("");
                        setAccountOpen((v) => !v);
                      }}
                    >
                      <UserAvatar {...user} />
                      <Icon name="down" size={12} />
                    </button>
                  </>
                ) : (
                  <LoginButton className="pill primary toolbar-login">
                    登录
                  </LoginButton>
                )}
                {accountOpen && user && (
                  <div className="account-menu glass">
                    <>
                      <AccountIdentity {...user} />
                      {user.isOwner && (
                        <>
                          <Link to="/admin">作品数据</Link>
                          <Link to="/admin?setup=1">接入 SDK</Link>
                        </>
                      )}
                      <button
                        onClick={() =>
                          void logout()
                            .then(() => setAccountOpen(false))
                            .catch(() =>
                              setAccountError("退出失败，请稍后重试"),
                            )
                        }
                      >
                        退出登录
                      </button>
                      {accountError && (
                        <p
                          className="text-[11px] text-destructive"
                          role="alert"
                        >
                          {accountError}
                        </p>
                      )}
                    </>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="page-content" id="main-content" tabIndex={-1}>
            <div
              className="route-view"
              data-route={location.pathname}
              key={location.pathname}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/tools" element={<Tools />} />
                <Route
                  path="/tools/:id"
                  element={<Navigate to="/tools" replace />}
                />
                <Route
                  path={glassSkillPath}
                  element={<LiquidGlassSkill theme={currentTheme} />}
                />
                <Route path="/resources" element={<Resources />} />
                <Route
                  path="/capabilities"
                  element={<Navigate to="/resources" replace />}
                />
                <Route
                  path="/discover"
                  element={<Discover onCountChange={setDiscoverCount} />}
                />
                <Route path="/guestbook" element={<Guestbook />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<OwnerDashboard />} />
                <Route
                  path="*"
                  element={
                    <div className="data-placeholder">
                      <h1>这里还没有内容</h1>
                      <Link className="pill inline-flex mt-5" to="/">
                        回到总览
                        <Icon name="right" size={14} />
                      </Link>
                    </div>
                  }
                />
              </Routes>
            </div>
            <footer className="page-footer">
              <span>© 2026 alexwjj-hub · Made with curiosity.</span>
              <span className="flex items-center gap-2">
                <i className="status-dot" />
                All systems operational
              </span>
            </footer>
          </main>
        </div>
      </div>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="mobile-nav-dialog">
          <DialogHeader className="sr-only">
            <DialogTitle>个人空间导航</DialogTitle>
            <DialogDescription>作品、工具与发现。</DialogDescription>
          </DialogHeader>
          {navContent}
        </DialogContent>
      </Dialog>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </TooltipProvider>
  );
}
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <a
          className="skip-link"
          href="#main-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          跳到主要内容
        </a>
        <Shell />
      </AuthProvider>
    </HashRouter>
  );
}
