import {
  Minimize2,
  ScanLine,
  ScanEye,
  ListChecks,
  Play,
  Bug,
  Asterisk,
  PencilLine,
  SquareTerminal,
  GitCommitHorizontal,
  ArrowUpRight,
  ArrowRight,
  Blocks,
  Bookmark,
  BookOpen,
  Box,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Code,
  CloudUpload,
  Link2,
  CircleCheck,
  MessageCircle,
  MessagesSquare,
  ScanText,
  Library,
  MapPin,
  CalendarDays,
  Clock3,
  Eye,
  LockKeyhole,
  MousePointer2,
  TriangleAlert,
  UsersRound,
  GitPullRequest,
  LayoutTemplate,
  PanelTop,
  Command,
  Compass,
  FileText,
  GitBranch,
  Globe,
  Heart,
  Image,
  Layers,
  Lightbulb,
  ListFilter,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  PanelsTopLeft,
  Pencil,
  Pin,
  Plus,
  Radar,
  RefreshCw,
  Rss,
  Search,
  Settings2,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Sun,
  Moon,
  Terminal,
  Triangle,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { GlassGroup, GlassIndicator } from "./GlassMotion";
function Github({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`github-mark ${className || ""}`}
      style={{ width: size, height: size }}
    />
  );
}
export const icons = {
  minimize: Minimize2,
  scan: ScanLine,
  eye: ScanEye,
  list: ListChecks,
  play: Play,
  bug: Bug,
  asterisk: Asterisk,
  "pencil-line": PencilLine,
  "square-terminal": SquareTerminal,
  commit: GitCommitHorizontal,
  arrow: ArrowUpRight,
  right: ArrowRight,
  blocks: Blocks,
  bookmark: Bookmark,
  book: BookOpen,
  box: Box,
  briefcase: BriefcaseBusiness,
  chart: ChartNoAxesCombined,
  check: Check,
  "circle-check": CircleCheck,
  "message-circle": MessageCircle,
  messages: MessagesSquare,
  "scan-text": ScanText,
  library: Library,
  link: Link2,
  down: ChevronDown,
  left: ChevronLeft,
  next: ChevronRight,
  chevrons: ChevronsUpDown,
  code: Code,
  "map-pin": MapPin,
  "cloud-upload": CloudUpload,
  command: Command,
  compass: Compass,
  file: FileText,
  git: GitBranch,
  github: Github,
  views: Eye,
  users: UsersRound,
  pointer: MousePointer2,
  clock: Clock3,
  alert: TriangleAlert,
  calendar: CalendarDays,
  lock: LockKeyhole,
  "pull-request": GitPullRequest,
  layout: LayoutTemplate,
  "panel-top": PanelTop,
  globe: Globe,
  heart: Heart,
  image: Image,
  layers: Layers,
  lightbulb: Lightbulb,
  filter: ListFilter,
  message: MessageSquare,
  more: MoreHorizontal,
  panel: PanelLeft,
  panels: PanelsTopLeft,
  pencil: Pencil,
  pin: Pin,
  plus: Plus,
  radar: Radar,
  refresh: RefreshCw,
  rss: Rss,
  search: Search,
  settings: Settings2,
  shield: ShieldCheck,
  shuffle: Shuffle,
  sparkles: Sparkles,
  sun: Sun,
  moon: Moon,
  terminal: Terminal,
  triangle: Triangle,
  user: UserRound,
  workflow: Workflow,
  x: X,
};
export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name?: string;
  size?: number;
  className?: string;
}) {
  const Component = icons[name as keyof typeof icons] || Sparkles;
  return (
    <Component
      size={size}
      strokeWidth={1.65}
      className={className}
      aria-hidden="true"
    />
  );
}
export function OutLink({
  href,
  children,
  className = "",
  label,
}: {
  href: string;
  children: ReactNode;
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
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
export function SectionHeading({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="flex items-center gap-3">
        <h2>{title}</h2>
        {eyebrow && (
          <span className="mono text-[9px] tracking-[1.3px] text-muted-foreground">
            {eyebrow}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}) {
  return (
    <label className="search-field">
      <Icon name="search" size={15} />
      <input
        aria-label={label || placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
export function FilterPills({
  items,
  value,
  onChange,
  label,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <GlassGroup className="filter-pills" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          className={value === item ? "selected" : ""}
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          <GlassIndicator active={value === item} />
          {item}
        </button>
      ))}
    </GlassGroup>
  );
}
