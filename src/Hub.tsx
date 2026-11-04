import { useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  BarChart3,
  MessageSquare,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  FileText,
  GitBranch,
  Layers3,
  LayoutDashboard,
  MapPin,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  Pencil,
  Search,
  Sparkles,
  Sun,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  profile,
  projects,
  tools,
  websites,
  workflows,
} from "./data";
import type { Project, ToolId } from "./data";
import { resources } from "./content/resources";
import type { Resource, ResourceKind } from "./content/resources";
import "./styles.css";
import { LiquidGlass } from "./LiquidGlass";
import { AccountButton, AuthProvider, Guestbook, OwnerDashboard, useAuth } from "./account";
import "./liquid-glass.css";

function Github({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.98a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.59c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

const publicNavigation = [
  { to: "/", name: "总览", icon: LayoutDashboard, en: "Overview" },
  { to: "/projects", name: "作品", icon: Layers3, en: "Projects" },
  { to: "/workflows", name: "工作流", icon: Workflow, en: "Workflows" },
  { to: "/tools", name: "工具箱", icon: Boxes, en: "Toolbox" },
  { to: "/resources", name: "能力库", icon: Sparkles, en: "Skills & MCP" },
  { to: "/guestbook", name: "留言", icon: MessageSquare, en: "Guestbook" },
  { to: "/about", name: "关于", icon: CircleHelp, en: "About" },
];
function navigationFor(owner: boolean) { return owner ? [...publicNavigation, { to: "/admin", name: "作品数据", icon: BarChart3, en: "Analytics" }] : publicNavigation; }

function OutLink({
  href,
  children,
  className = "",
  label,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={label}
    >
      {children}
    </a>
  );
}

function ToolLogo({ id, small = false }: { id: ToolId; small?: boolean }) {
  return (
    <span
      className={`tool-logo logo-${id} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      {id === "claude" ? (
        <span className="claude-star">✳</span>
      ) : id === "codex" ? (
        <Code2 />
      ) : id === "pi" ? (
        <span className="pi-symbol">π</span>
      ) : id === "pencil" ? (
        <Pencil />
      ) : (
        <Terminal />
      )}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  link,
  to,
  children,
}: {
  eyebrow?: string;
  title: string;
  link?: string;
  to?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children ||
        (to && (
          <Link className="text-link" to={to}>
            {link || "查看全部"}
            <ArrowRight size={14} />
          </Link>
        ))}
    </div>
  );
}

function TerminalIllustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-cross cross-one">+</div>
      <div className="art-cross cross-two">+</div>
      <div className="floating-tag">
        <span /> ideas into reality
      </div>
      <div className="terminal-window">
        <div className="terminal-top">
          <span className="window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>~/alex/workspace</span>
          <GitBranch size={11} />
        </div>
        <div className="terminal-code">
          <p>
            <span className="code-muted">01</span>
            <span className="code-green">const</span> workspace = {"{"}
          </p>
          <p>
            <span className="code-muted">02</span>
            <span className="code-indent">create:</span>{" "}
            <span className="code-lime">'with curiosity'</span>,
          </p>
          <p>
            <span className="code-muted">03</span>
            <span className="code-indent">build:</span>{" "}
            <span className="code-lime">'with AI'</span>,
          </p>
          <p>
            <span className="code-muted">04</span>
            <span className="code-indent">share:</span>{" "}
            <span className="code-lime">'in public'</span>
          </p>
          <p>
            <span className="code-muted">05</span>
            {"}"}
            <span className="terminal-cursor" />
          </p>
        </div>
        <div className="terminal-bottom">
          <span>
            <span className="status-dot" /> always building
          </span>
          <span>⌘ ↵</span>
        </div>
      </div>
      <div className="floating-icon">
        <Sparkles size={20} />
      </div>
    </div>
  );
}

function CapabilityPreview() {
  const [kind, setKind] = useState<ResourceKind>("skill");
  const featured = kind === "skill" ? ["ego-browser", "obsidian-markdown", "superpowers"] : ["Pencil", "Playwright", "Blender"];
  return <section className="panel capability-preview">
    <div className="panel-heading"><span className="panel-icon"><Sparkles size={23} /></span><div><h2>我的 AI 能力库</h2><p>跨工具复用的 Skills 与 MCP。</p></div></div>
    <Tabs value={kind} onValueChange={value => setKind(value as ResourceKind)} className="capability-tabs">
      <TabsList><TabsTrigger value="skill">Skills</TabsTrigger><TabsTrigger value="mcp">MCP</TabsTrigger></TabsList>
    </Tabs>
    <div className="capability-picks" key={kind}>
      {resources.filter(r => featured.includes(r.name)).map(r => <Link key={r.id} to={`/resources?kind=${kind}&q=${encodeURIComponent(r.name)}`}><span>{r.name}</span><ArrowUpRight size={17}/></Link>)}
    </div>
    <Link className="text-link strong" to={`/resources?kind=${kind}`}>浏览能力库<ArrowRight size={17}/></Link>
  </section>;
}

function WorkflowSteps({
  full = false,
  workflow = workflows[0],
}: {
  full?: boolean;
  workflow?: (typeof workflows)[number];
}) {
  return (
    <ol className={`workflow-steps ${full ? "full" : ""}`}>
      {workflow.steps.map((step, i) => (
        <li key={step.title}>
          <span className="step-number">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{full ? step.detail : step.description}</p>
            {full && (
              <span className="step-output">
                <Check size={13} />
                {step.output}
              </span>
            )}
          </div>
          {!full && <ChevronRight size={13} className="step-chevron" />}
        </li>
      ))}
    </ol>
  );
}

function WorkflowDialog({
  workflow,
  open,
  setOpen,
}: {
  workflow: (typeof workflows)[number];
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="detail-dialog">
        <DialogHeader>
          <span className="eyebrow">WORKFLOW TEMPLATE</span>
          <DialogTitle>{workflow.name}</DialogTitle>
          <DialogDescription>
            {workflow.description} 这是一份可按项目调整的流程模板。
          </DialogDescription>
        </DialogHeader>
        <WorkflowSteps full workflow={workflow} />
        <div className="dialog-bottom">
          <span>组合工具</span>
          {workflow.tools.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProjectPreview({ project }: { project: Project }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`project-preview preview-${project.kind}`}>
      {project.image && !failed ? (
        <img
          src={project.image}
          alt={`${project.name}网站预览`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="project-graphic" aria-hidden="true">
          {project.kind === "chart" ? (
            <>
              <div className="chart-bars">
                {[35, 66, 45, 85, 60, 100, 74].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
              <span>Visualize your ideas.</span>
            </>
          ) : project.kind === "pdf" || project.kind === "print" ? (
            <>
              <FileText size={48} strokeWidth={1} />
              <span>
                {project.kind === "pdf" ? "HTML → PDF" : "Print, simply."}
              </span>
            </>
          ) : project.kind === "micro" ? (
            <>
              <div className="micro-blocks">
                <i />
                <i />
                <i />
                <i />
              </div>
              <span>Independent. Connected.</span>
            </>
          ) : (
            <>
              <Code2 size={48} strokeWidth={1} />
              <span>
                {project.kind === "perf"
                  ? "Make the web faster."
                  : "Keep building."}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  return (
    <article className={`project-card ${compact ? "compact" : ""}`}>
      <OutLink href={project.url} className="project-main">
        <ProjectPreview project={project} />
        <div className="project-info">
          <div className="project-meta">
            <span>{project.category}</span>
            <ArrowUpRight size={17} />
          </div>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <div className="project-tags">
            {project.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </OutLink>
      {!compact && project.source && (
        <OutLink href={project.source} className="project-source">
          <Github size={13} />
          查看源代码
          <ArrowUpRight size={12} />
        </OutLink>
      )}
    </article>
  );
}

function Home() {
  const [workflowOpen, setWorkflowOpen] = useState(false);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> ALEX’S PERSONAL SPACE
          </span>
          <h1>
            保持好奇，
            <br />
            把想法变成
            <span className="hero-accent">
              作品<span className="accent-dot">。</span>
            </span>
          </h1>
          <p>
            你好，我是俊劫。<span className="hero-wave">✳</span>
            <br className="mobile-break" />
            在这里记录开发、整理工具，也持续探索 AI 的更多可能。
          </p>
          <div className="hero-actions">
            <Button nativeButton={false} render={<Link to="/projects" />}>
              探索我的作品 <ArrowUpRight size={15} />
            </Button>
            <Button nativeButton={false} variant="outline" render={<Link to="/workflows" />}>
              看看我的工作流 <ArrowRight size={15} />
            </Button>
          </div>

        </div>
        <TerminalIllustration />
      </section>
      <section className="tools-section">
        <SectionHeading title="我的 AI 工具箱" to="/tools" link="全部工具" />
        <div className="tool-strip">
          {tools.map((tool) => (
            <OutLink href={tool.url} key={tool.id} className="tool-shortcut">
              <ToolLogo id={tool.id} />
              <div>
                <h3>{tool.name}</h3>
                <span>{tool.category}</span>
              </div>
              <ArrowUpRight size={15} className="shortcut-arrow" />
            </OutLink>
          ))}
        </div>
      </section>
      <div className="workspace-grid">
        <CapabilityPreview />
        <section className="panel workflow-panel">
          <div className="panel-heading">
            <span className="panel-icon">
              <Workflow size={19} />
            </span>
            <div>
              <h2>我的工作流</h2>
              <p>把工具串起来，让创造自然发生。</p>
            </div>
          </div>
          <div className="workflow-title">
            <h3>从想法到页面</h3>
            <Badge variant="secondary">开发流程</Badge>
          </div>
          <WorkflowSteps />
          <button
            className="text-link strong"
            onClick={() => setWorkflowOpen(true)}
          >
            展开完整流程
            <ArrowRight size={14} />
          </button>
        </section>
      </div>
      <section className="content-section">
        <SectionHeading
          title="精选作品"
          to="/projects"
          link="探索更多"
        />
        <div className="featured-grid">
          {projects.slice(0, 2).map((p) => (
            <ProjectCard project={p} key={p.name} compact />
          ))}
        </div>
      </section>
      <section className="home-bottom">
        <span>
          <Sparkles size={15} />
          工具在变，创造的热情不变。
        </span>
        <Link to="/about">
          多了解我一点 <ArrowRight size={14} />
        </Link>
      </section>
      <WorkflowDialog
        workflow={workflows[0]}
        open={workflowOpen}
        setOpen={setWorkflowOpen}
      />
    </>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <span className="eyebrow">{eyebrow}</span>
      <div>
        <h1>{title}</h1>
        {children}
      </div>
      <p>{description}</p>
    </header>
  );
}

function Projects() {
  const [filter, setFilter] = useState("全部");
  const [query, setQuery] = useState("");
  return (
    <>
      <PageHeader
        eyebrow="SELECTED WORK & EXPERIMENTS"
        title="用作品，记录探索。"
        description="从前端工程到个人网站，把学习与想法写进真实的项目里。"
      >
        <OutLink href={profile.github} className="text-link">
          <Github size={16} />
          GitHub
          <ArrowUpRight size={14} />
        </OutLink>
      </PageHeader>
      <div className="filter-row" aria-label="作品分类">
        {["全部", ...new Set(projects.map(p => p.category))].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
            <span className="filter-count">
              {f === "全部"
                ? projects.length
                : projects.filter((p) => p.category === f).length}
            </span>
          </Button>
        ))}
      </div>
      <Input className="project-search" aria-label="搜索作品" placeholder="按名称、技术或用途搜索作品…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="projects-grid">
        {projects
          .filter((p) => (filter === "全部" || p.category === filter) && `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
          .map((p) => (
            <ProjectCard key={p.name} project={p} />
          ))}
      </div>
    </>
  );
}

function Workflows() {
  const [selected, setSelected] = useState<(typeof workflows)[number] | null>(
    null,
  );
  return (
    <>
      <PageHeader
        eyebrow="HOW I CONNECT THE DOTS"
        title="从工具，到工作方式。"
        description="用具体的流程连接想法与结果。这些模板，也在实践中不断调整。"
      />
      <div className="workflow-cards">
        {workflows.map((w, i) => (
          <article className="panel workflow-full-card" key={w.id}>
            <div className="workflow-card-top">
              <span className="workflow-index">0{i + 1}</span>
              <Badge variant="outline">{w.category}工作流</Badge>
            </div>
            <h2>{w.name}</h2>
            <p>{w.description}</p>
            <div className="flow-minimap" aria-hidden="true">
              {w.steps.map((s, j) => (
                <span key={s.title}>
                  <i>{j + 1}</i>
                  {s.title}
                  {j !== 3 && <ArrowRight size={12} />}
                </span>
              ))}
            </div>
            <div className="workflow-card-bottom">
              <div>
                {w.tools.map((t) => (
                  <Badge variant="secondary" key={t}>
                    {t}
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected(w)}
              >
                查看步骤
                <ArrowUpRight size={14} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="quiet-note">
        <BookOpen size={17} />
        <div>
          <h3>好流程，不必复杂。</h3>
          <p>从一个真实任务开始，留下有用的步骤，删掉不必要的动作。</p>
        </div>
      </div>
      {selected && (
        <WorkflowDialog
          workflow={selected}
          open={!!selected}
          setOpen={(v) => !v && setSelected(null)}
        />
      )}
    </>
  );
}

function Tools() {
  const [category, setCategory] = useState("全部");
  return (
    <>
      <PageHeader
        eyebrow="MY EVERYDAY TOOLKIT"
        title="找到顺手的工具。"
        description="编程、设计与创造。整理工具的用途，也记录它们如何进入工作流。"
      />
      <div className="filter-row" aria-label="工具分类">
        {["全部", "AI 编程", "设计工具", "效率工具"].map((c) => (
          <Button
            size="sm"
            key={c}
            variant={c === category ? "default" : "ghost"}
            aria-pressed={c === category}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      <div className="tool-detail-grid">
        {tools
          .filter((t) => category === "全部" || t.category === category)
          .map((t) => (
            <OutLink className="panel tool-detail-card" href={t.url} key={t.id}>
              <div className="tool-detail-top">
                <ToolLogo id={t.id} />
                <Badge variant="outline">{t.category}</Badge>
                <ArrowUpRight size={17} />
              </div>
              <h2>{t.name}</h2>
              <h3>{t.label}</h3>
              <p>{t.description}</p>
              <span className="text-link strong">
                打开工具
                <ArrowRight size={14} />
              </span>
            </OutLink>
          ))}
      </div>
      <section className="websites-section">
        <SectionHeading eyebrow="BOOKMARKS" title="AI 网站收藏" />
        <p className="section-description">

        </p>
        <div className="website-grid">
          {websites.map((site, i) => (
            <OutLink className="website-item" key={site.name} href={site.href!}>
              <span className="website-icon">
                {
                  [
                    <Sparkles />,
                    <span className="claude-star">✳</span>,
                    <Zap />,
                    <Search />,
                    <span>☻</span>,
                    <Code2 />,
                  ][i]
                }
              </span>
              <div>
                <h3>{site.name}</h3>
                <p>{site.description}</p>
              </div>
              <ArrowUpRight size={15} />
            </OutLink>
          ))}
        </div>
      </section>
    </>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return <article className="panel resource-card">
    <div className="resource-card-heading"><span className="resource-symbol">{resource.kind === "skill" ? <Sparkles size={20}/> : <Workflow size={20}/>}</span><span>{resource.category}</span>{resource.href && <OutLink href={resource.href} label={`访问 ${resource.name} 的公开来源`}><ArrowUpRight size={19}/></OutLink>}</div>
    <h2>{resource.name}</h2><p>{resource.description}</p>
  </article>;
}
function Resources() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const kind: ResourceKind = params.get("kind") === "mcp" ? "mcp" : "skill";
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState(params.get("q") || "");
  useEffect(() => { setQuery(new URLSearchParams(location.search).get("q") || ""); setCategory("全部"); }, [location.search]);
  const categories = ["全部", ...new Set(resources.filter(r => r.kind === kind).map(r => r.category))];
  const shown = resources.filter(r => r.kind === kind && (category === "全部" || category === r.category) && `${r.name} ${r.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <PageHeader eyebrow="" title="我的 AI 能力库" description="按任务组织的 Skills 与 MCP，在不同 AI 工具之间复用。"/>
    <div className="resource-toolbar">
      <Tabs value={kind} onValueChange={value => navigate(`/resources?kind=${value}`)} className="resource-kind-tabs"><TabsList><TabsTrigger value="skill">Skills <span>{resources.filter(r=>r.kind === "skill").length}</span></TabsTrigger><TabsTrigger value="mcp">MCP <span>{resources.filter(r=>r.kind === "mcp").length}</span></TabsTrigger></TabsList></Tabs>
      <Input className="resource-search" aria-label="搜索能力库" placeholder="搜索名称或用途…" value={query} onChange={event=>setQuery(event.target.value)}/>
    </div>
    <div className="filter-row resource-filters" aria-label="能力分类">{categories.map(c=><Button key={c} variant={category === c ? "default" : "ghost"} aria-pressed={category === c} onClick={()=>setCategory(c)}>{c}</Button>)}</div>
    <div className="resource-grid" key={`${kind}-${category}`}>{shown.map(resource=><ResourceCard key={`${resource.kind}-${resource.id}`} resource={resource}/>)}</div>
    {!shown.length && <p className="data-placeholder">没有找到匹配的能力，试试其他关键词。</p>}
    <p className="catalog-note">来自本机已安装的公开技能与通用 MCP 配置。清单更新于 2026 年 11 月。</p>
  </>;
}

function About() {
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE ABOUT ME"
        title="你好，我是俊劫。"
        description="开发者，也是一个保持好奇的创造者。"
      />
      <section className="about-intro">
        <div>
          <p>
            关注前端工程、AIGC 与产品体验，
            <br />
            也喜欢把探索变成可以分享的作品。
          </p>
          <p className="about-secondary">
            这里是我的个人工作空间。把散落在博客、GitHub
            与不同工具里的内容连接起来：做过的作品、正在整理的方法，以及下一次创造可能用上的工具。
          </p>
          <span className="location-tag">
            <MapPin size={14} />
            浙江 · 杭州
          </span>
        </div>
        <div className="about-avatar">
          <img src="./avatar.jpg" alt="俊劫的头像" />
          <span>KEEP CREATING.</span>
        </div>
      </section>
      <section className="about-principles">
        {[
          {
            n: "01",
            title: "保持好奇",
            text: "试试新工具，也多问一句为什么。",
          },
          {
            n: "02",
            title: "动手创造",
            text: "让想法离开脑海，成为真实的作品。",
          },
          {
            n: "03",
            title: "持续分享",
            text: "记录过程，让经验产生新的连接。",
          },
        ].map((p) => (
          <div key={p.n}>
            <span>{p.n}</span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </section>
      <SectionHeading
        title="在这些地方找到我"
        eyebrow="ELSEWHERE ON THE INTERNET"
      />
      <div className="social-links">
        {[
          {
            name: "GitHub",
            desc: "@alexwjj · 项目与代码",
            href: profile.github,
          },
          { name: "掘金", desc: "俊劫 · 技术与实践", href: profile.juejin },
          {
            name: "Bilibili",
            desc: "俊劫 · 前端与 Vibe Coding",
            href: profile.bilibili,
          },
          { name: "X", desc: "@junjiezed · 日常与想法", href: profile.x },
        ].map((s) => (
          <OutLink href={s.href} key={s.name}>
            <div>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
            </div>
            <ArrowUpRight size={18} />
          </OutLink>
        ))}
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="empty-state">
      <Search size={32} />
      <h1>这里还没有内容</h1>
      <p>换个方向，继续探索。</p>
      <Button nativeButton={false} render={<Link to="/" />}>
        回到总览
        <ArrowRight size={15} />
      </Button>
    </div>
  );
}

function SearchDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const navigation = navigationFor(!!user?.isOwner);
  const navigate = useNavigate();
  const entries = [
    ...navigation.map((n) => ({
      title: n.name,
      desc: n.en,
      group: "页面",
      path: n.to,
    })),
    ...tools.map((t) => ({
      title: t.name,
      desc: t.label,
      group: "工具",
      href: t.url,
    })),
    ...projects.map((p) => ({
      title: p.name,
      desc: p.description,
      group: "作品",
      href: p.url,
    })),
    ...workflows.map((w) => ({
      title: w.name,
      desc: w.description,
      group: "工作流",
      path: "/workflows",
    })),
    ...websites.map((w) => ({
      title: w.name,
      desc: w.description,
      group: "网站",
      href: w.href,
    })),
    ...resources.map(r => ({ title: r.name, desc: r.description, group: r.kind === "skill" ? "Skill" : "MCP", path: `/resources?kind=${r.kind}&q=${encodeURIComponent(r.name)}` })),
  ];
  const results = entries
    .filter((e) =>
      `${e.title} ${e.desc} ${e.group}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    )
    .slice(0, query ? 30 : 11);
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="search-dialog">
        <DialogHeader className="sr-only">
          <DialogTitle>搜索个人空间</DialogTitle>
          <DialogDescription>
            搜索作品、工具、工作流、Skills 和 MCP。
          </DialogDescription>
        </DialogHeader>
        <div className="search-input-wrap">
          <Search size={20} />
          <Input
            autoFocus
            aria-label="搜索作品、工具、工作流"
            placeholder="搜索作品、工具、Skills、MCP…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                document
                  .querySelector<
                    HTMLAnchorElement | HTMLButtonElement
                  >(".search-result")
                  ?.focus();
              }
              if (e.key === "Enter" && results.length)
                document
                  .querySelector<
                    HTMLAnchorElement | HTMLButtonElement
                  >(".search-result")
                  ?.click();
            }}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="search-results" aria-live="polite">
          {results.length ? (
            results.map((entry, i) => {
              const body = (
                <>
                  <span className="search-result-icon">
                    {entry.group === "作品" ? (
                      <Layers3 size={17} />
                    ) : entry.group === "工具" ? (
                      <Terminal size={17} />
                    ) : (
                      <Search size={16} />
                    )}
                  </span>
                  <div>
                    <span>{entry.title}</span>
                    <p>{entry.desc}</p>
                  </div>
                  <Badge variant="outline">{entry.group}</Badge>
                  <ArrowUpRight size={14} />
                </>
              );
              return "href" in entry ? (
                <OutLink
                  className="search-result"
                  href={entry.href!}
                  key={`${entry.title}-${i}`}
                >
                  {body}
                </OutLink>
              ) : (
                <button
                  key={`${entry.title}-${i}`}
                  className="search-result"
                  onClick={() => {
                    navigate(entry.path);
                    setOpen(false);
                  }}
                >
                  {body}
                </button>
              );
            })
          ) : (
            <div className="search-empty">
              <Search size={26} />
              <p>没有找到「{query}」</p>
              <span>试试 Claude、作品、MCP 或写作。</span>
            </div>
          )}
        </div>
        <div className="search-footer">
          <span>搜索整个个人空间</span>
          <span>
            <kbd>tab</kbd> 切换 <kbd>↵</kbd> 打开
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Theme = "light" | "dark" | "system";
function Shell() {
  const { user } = useAuth();
  const navigation = navigationFor(!!user?.isOwner);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("alex-hub-theme");
      return saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
    } catch {
      return "light";
    }
  });
  const current = navigation.find((n) =>
    n.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(n.to),
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
      document.documentElement.style.colorScheme =
        theme === "system" ? "light dark" : theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute(
        "content", document.documentElement.classList.contains("dark") ? "#000000" : "#ffffff",
      );
    };
    update();
    media.addEventListener("change", update);
    try {
      localStorage.setItem("alex-hub-theme", theme);
    } catch {
      /* Browser storage is optional. */
    }
    return () => media.removeEventListener("change", update);
  }, [theme]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
    document.title = `${current?.name || "页面"} · 俊劫的个人空间`;
  }, [location.pathname, current?.name]);
  return (
    <TooltipProvider>
      <LiquidGlass />
      <div className="app-shell">
        <aside className="sidebar">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Terminal size={24} />
            </span>
            <div>
              <strong>
                俊劫<span> / </span>
              </strong>
              <small>alexwjj</small>
            </div>
          </Link>
          <nav className="main-nav" aria-label="主导航" data-active-index={navigation.findIndex(n => n.to === (current?.to || "/"))}>
            <span className="nav-glass-indicator" aria-hidden="true" />
            {navigation.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"}>
                <n.icon size={18} />
                <span>{n.name}</span>
                {n.to === "/tools" && <span className="nav-count">05</span>}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <OutLink href={profile.github} className="github-link">
              <Github size={17} />
              <span>GitHub</span>
              <ArrowUpRight size={14} />
            </OutLink>
            <div className="profile-card">
              <img src="./avatar.jpg" alt="" />
              <div>
                <strong>俊劫 / Alex</strong>
                <span>
                  <i />
                  保持热爱，持续创造
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger
                  render={<Link to="/about" aria-label="关于俊劫" />}
                >
                  <ChevronRight size={16} />
                </TooltipTrigger>
                <TooltipContent>关于我</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>
        <div className="main-wrapper">
          <header className="topbar">
            <div className="breadcrumb">
              <Button
                variant="ghost"
                size="icon"
                className="mobile-menu"
                aria-label="打开导航"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={20} />
              </Button>
              <PanelLeftClose size={17} className="desktop-panel-icon" />
              <span className="breadcrumb-home">个人空间</span>
              <ChevronRight size={13} />
              <span>{current?.name || "工具手册"}</span>

            </div>
            <div className="topbar-actions">
              <button
                className="search-trigger"
                onClick={() => setSearchOpen(true)}
                aria-label="打开全局搜索"
              >
                <Search size={15} />
                <span>搜索任何内容…</span>
                <kbd>⌘ K</kbd>
              </button>
              <div className="topbar-divider" />
              <div className="theme-controls" data-theme={theme}>
                <span className="theme-glass-indicator" aria-hidden="true" />
                {(
                  [
                    { id: "light", label: "浅色主题", icon: Sun },
                    { id: "dark", label: "深色主题", icon: Moon },
                    { id: "system", label: "跟随系统", icon: Monitor },
                  ] as const
                ).map((t) => (
                  <Tooltip key={t.id}>
                    <TooltipTrigger
                      render={
                        <button
                          className={theme === t.id ? "active" : ""}
                          onClick={() => setTheme(t.id)}
                          aria-label={t.label}
                          aria-pressed={theme === t.id}
                        />
                      }
                    >
                      <t.icon size={15} />
                    </TooltipTrigger>
                    <TooltipContent>{t.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <AccountButton />
            </div>
          </header>
          <main className="page-content" id="main-content" tabIndex={-1}>
            <div className="route-view" key={location.pathname} data-route={location.pathname}><Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/:id" element={<Navigate to="/resources" replace />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/about" element={<About />} />
              <Route path="/guestbook" element={<Guestbook />} />
              <Route path="/admin" element={<OwnerDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes></div>
            <footer className="page-footer">
              <span>
                © 2026 俊劫 <span className="dot-divider">·</span> 保持所有热爱
              </span>
            </footer>
          </main>
        </div>
      </div>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="mobile-nav-dialog">
          <DialogHeader>
            <DialogTitle>
              <Terminal size={22} />
              俊劫的个人空间
            </DialogTitle>
            <DialogDescription>作品、工具，与创造的方法。</DialogDescription>
          </DialogHeader>
          <nav aria-label="移动端导航">
            {navigation.map((n) => (
              <NavLink
                end={n.to === "/"}
                to={n.to}
                key={n.to}
                onClick={() => setMobileOpen(false)}
              >
                <n.icon size={20} />
                {n.name}
                <ArrowRight size={15} />
              </NavLink>
            ))}
          </nav>
        </DialogContent>
      </Dialog>
      <SearchDialog open={searchOpen} setOpen={setSearchOpen} />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <HashRouter><AuthProvider>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        跳到主要内容
      </a>
      <Shell />
    </AuthProvider></HashRouter>
  );
}
