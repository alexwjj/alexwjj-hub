import { flushSync } from "react-dom";

let themeTransition: ViewTransition | undefined;
export function transitionTheme(update: () => void, origin: HTMLElement) {
  if (
    !document.startViewTransition ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  themeTransition?.skipTransition();
  const root = document.documentElement;
  const rect = origin.getBoundingClientRect();
  root.style.setProperty("--theme-x", `${rect.x + rect.width / 2}px`);
  root.style.setProperty("--theme-y", `${rect.y + rect.height / 2}px`);
  root.dataset.themeTransition = "";
  const current = document.startViewTransition(() => flushSync(update));
  themeTransition = current;
  current.finished
    .catch(() => {})
    .finally(() => {
      if (themeTransition === current) {
        delete root.dataset.themeTransition;
        themeTransition = undefined;
      }
    });
}
