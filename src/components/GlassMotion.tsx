import { useId } from "react";
import type { HTMLAttributes } from "react";
import { LayoutGroup, motion } from "motion/react";

// Shared layout, not two independent fading backgrounds. See docs/liquid-glass.md.
export function GlassGroup(props: HTMLAttributes<HTMLDivElement>) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div data-glass-group="" {...props} />
    </LayoutGroup>
  );
}

export function GlassIndicator({ active }: { active: boolean }) {
  return active ? (
    <motion.span
      aria-hidden="true"
      className="liquid-indicator"
      layoutId="selection"
      style={{ borderRadius: 999 }}
      initial={false}
      animate={{ scaleX: [1, 1.035, 1], scaleY: [1, 0.94, 1] }}
      transition={{
        layout: { type: "spring", stiffness: 460, damping: 32, mass: 0.8 },
        scaleX: { duration: 0.42, times: [0, 0.35, 1] },
        scaleY: { duration: 0.42, times: [0, 0.35, 1] },
      }}
    />
  ) : null;
}
