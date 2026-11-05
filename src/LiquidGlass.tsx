import { LiquidGlass as Material } from "../.agents/skills/alexwjj-liquid-glass/assets/LiquidGlass";

const surfaceSelector =
  '.glass, .pill, .liquid-indicator, .sidebar, .panel, .tool-shortcut, .project-card, .website-item, .social-links > a, .message-card, .search-trigger, [data-slot="button"], [data-slot="tabs-list"], .theme-controls';
const interactiveSelector =
  'button:not(:disabled), a[data-slot="button"], a.pill, .tool-shortcut, .nav-item';

export function LiquidGlass() {
  return (
    <Material
      surfaceSelector={surfaceSelector}
      interactiveSelector={interactiveSelector}
    />
  );
}
