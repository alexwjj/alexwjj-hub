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
  Code2,
  Command,
  Compass,
  FileText,
  GitBranch,
  Globe2,
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
import type { ReactNode, SVGProps } from "react";
import { GlassGroup, GlassIndicator } from "./GlassMotion";
function Github({
  size = 18,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.98a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.59c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
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
  down: ChevronDown,
  left: ChevronLeft,
  next: ChevronRight,
  chevrons: ChevronsUpDown,
  code: Code2,
  command: Command,
  compass: Compass,
  file: FileText,
  git: GitBranch,
  github: Github,
  globe: Globe2,
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
