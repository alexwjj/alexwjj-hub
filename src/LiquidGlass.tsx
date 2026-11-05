import { useEffect, useRef } from "react";
import { refractedOffset } from "./lib/glass-optics";

const namespace = "http://www.w3.org/2000/svg";
const surfaceSelector =
  '.glass, .pill, .liquid-indicator, .sidebar, .panel, .tool-shortcut, .project-card, .website-item, .social-links > a, .message-card, .search-trigger, [data-slot="button"], [data-slot="tabs-list"], .theme-controls';
const interactiveSelector =
  'button:not(:disabled), a[data-slot="button"], a.pill, .tool-shortcut, .nav-item';

// A rounded lens displacement map. It is generated in element coordinates,
// so the browser compositor moves the glass and its content together on scroll.
function lensMap(width: number, height: number, radius: number) {
  const scale = Math.min(1.5, 420 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  const pixels = context.createImageData(canvas.width, canvas.height);
  const bevel = Math.min(22, height * 0.3, radius * 0.85);
  const profile = Array.from({ length: 256 }, (_, i) =>
    refractedOffset((i / 255) * bevel, bevel),
  );
  const displacement = Math.max(...profile, 1);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const px = (x + 0.5) / scale - width / 2;
      const py = (y + 0.5) / scale - height / 2;
      const qx = Math.abs(px) - width / 2 + radius;
      const qy = Math.abs(py) - height / 2 + radius;
      const ax = Math.max(qx, 0),
        ay = Math.max(qy, 0);
      const length = Math.hypot(ax, ay);
      const depth = -(length + Math.min(Math.max(qx, qy), 0) - radius);
      const strength =
        depth >= 0 && depth < bevel
          ? profile[Math.min(255, Math.round((depth / bevel) * 255))] /
            displacement
          : 0;
      const nx =
        length > 0
          ? (ax / length) * Math.sign(px)
          : qx > qy
            ? Math.sign(px)
            : 0;
      const ny =
        length > 0
          ? (ay / length) * Math.sign(py)
          : qy >= qx
            ? Math.sign(py)
            : 0;
      const index = (y * canvas.width + x) * 4;
      pixels.data[index] = Math.round(127.5 - 127.5 * nx * strength);
      pixels.data[index + 1] = Math.round(127.5 - 127.5 * ny * strength);
      pixels.data[index + 2] = 128;
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  return { image: canvas.toDataURL(), displacement: displacement * 2 };
}

export function LiquidGlass() {
  const definitions = useRef<SVGDefsElement>(null);
  useEffect(() => {
    const defs = definitions.current!;
    let nextId = 0;
    let frame = 0;
    let disposed = false;
    const filters = new Map<string, string>();
    const elements = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    // URL backdrop filters are a progressive enhancement. Unsupported browsers
    // keep the ordinary blur, highlights and native, accessible controls.
    const svgBackdrop =
      CSS.supports("backdrop-filter", 'url("#glass-probe")') &&
      /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);
    const node = (tag: string, attributes: Record<string, string>) => {
      const element = document.createElementNS(namespace, tag);
      for (const [name, value] of Object.entries(attributes))
        element.setAttribute(name, value);
      return element;
    };
    const applyLens = (element: HTMLElement) => {
      if (!svgBackdrop) return;
      const width = element.offsetWidth,
        height = element.offsetHeight;
      if (!width || !height) return;
      const radius = Math.min(
        parseFloat(getComputedStyle(element).borderTopLeftRadius) || 16,
        width / 2,
        height / 2,
      );
      const key = `${width}:${height}:${radius}`;
      let id = filters.get(key);
      if (!id) {
        const map = lensMap(width, height, radius);
        if (!map) return;
        id = `hub-lens-${++nextId}`;
        const filter = node("filter", {
          id,
          x: "0",
          y: "0",
          width: `${width}`,
          height: `${height}`,
          filterUnits: "userSpaceOnUse",
          "color-interpolation-filters": "sRGB",
        });
        filter.append(
          node("feGaussianBlur", {
            in: "SourceGraphic",
            stdDeviation: height < 90 ? "0.5" : "3",
            result: "backdrop",
          }),
        );
        filter.append(
          node("feImage", {
            href: map.image,
            x: "0",
            y: "0",
            width: `${width}`,
            height: `${height}`,
            preserveAspectRatio: "none",
            result: "lens",
          }),
        );
        const displacement = (scale: number, result: string) =>
          node("feDisplacementMap", {
            in: "backdrop",
            in2: "lens",
            scale: `${scale}`,
            xChannelSelector: "R",
            yChannelSelector: "G",
            result,
          });
        filter.append(displacement(map.displacement, "refract"));
        defs.append(filter);
        filters.set(key, id);
      }
      element.style.setProperty(
        "--glass-backdrop",
        `url("#${id}") saturate(1.12)`,
      );
      element.dataset.glass = "lens";
    };
    const resize = new ResizeObserver((entries) =>
      entries.forEach((entry) => applyLens(entry.target as HTMLElement)),
    );
    const refresh = () => {
      frame = 0;
      if (disposed) return;
      const current = new Set(
        document.querySelectorAll<HTMLElement>(surfaceSelector),
      );
      for (const element of elements)
        if (!current.has(element)) {
          resize.unobserve(element);
          elements.delete(element);
        }
      for (const element of current)
        if (!elements.has(element)) {
          elements.add(element);
          resize.observe(element);
        }
      // Keep only filters still referenced by mounted elements after route changes.
      const used = new Set(
        [...elements].map((element) =>
          element.style.getPropertyValue("--glass-backdrop"),
        ),
      );
      if (filters.size > 80)
        for (const [key, id] of filters)
          if (![...used].some((value) => value.includes(`#${id}\"`))) {
            defs.querySelector(`#${id}`)?.remove();
            filters.delete(key);
          }
    };
    const mutations = new MutationObserver((records) => {
      if (
        !frame &&
        records.some(
          (record) =>
            !(
              record.target instanceof Element &&
              record.target.closest(".glass-definitions")
            ),
        )
      )
        frame = requestAnimationFrame(refresh);
    });
    // Base UI portals live outside #root and need the same optical material.
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
    });
    const interactive = (target: EventTarget | null) =>
      target instanceof Element
        ? target.closest<HTMLElement>(interactiveSelector)
        : null;
    const animate = (
      element: HTMLElement,
      keyframes: Keyframe[],
      duration: number,
      hold = false,
    ) => {
      animations.get(element)?.cancel();
      const animation = element.animate(keyframes, {
        duration,
        fill: "forwards",
        easing: "linear",
      });
      animations.set(element, animation);
      animation.finished
        .then(() => {
          if (!hold && animations.get(element) === animation) {
            animation.cancel();
            animations.delete(element);
          }
        })
        .catch(() => {});
    };
    let pressed: HTMLElement | null = null;
    const down = (event: PointerEvent) => {
      if (reducedMotion.matches || event.button !== 0) return;
      pressed = interactive(event.target);
      // Shared selection geometry is owned by Motion; do not scale its label/anchor.
      if (pressed?.closest("[data-glass-group]")) pressed = null;
      if (pressed)
        animate(pressed, [{ scale: "1" }, { scale: ".96 1.035" }], 95, true);
    };
    const release = () => {
      if (!pressed) return;
      const element = pressed;
      pressed = null;
      if (reducedMotion.matches) return;
      // Analytic damped oscillation: a short squash, overshoot, then rest.
      const frames = Array.from({ length: 31 }, (_, i) => {
        const t = (i / 30) * 0.64;
        const spring = Math.exp(-9 * t) * Math.cos(21 * t);
        return {
          offset: i / 30,
          scale: `${1 - 0.04 * spring} ${1 + 0.035 * spring}`,
        };
      });
      frames[frames.length - 1] = { offset: 1, scale: "1 1" };
      animate(element, frames, 640);
    };
    const move = (event: PointerEvent) => {
      if (reducedMotion.matches || event.pointerType !== "mouse") return;
      const element = interactive(event.target);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty(
        "--glass-pointer-x",
        `${((event.clientX - rect.left) / rect.width) * 100}%`,
      );
      element.style.setProperty(
        "--glass-pointer-y",
        `${((event.clientY - rect.top) / rect.height) * 100}%`,
      );
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    document.addEventListener("pointermove", move, { passive: true });
    const motionChanged = () => {
      if (!reducedMotion.matches) return;
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      pressed = null;
    };
    reducedMotion.addEventListener("change", motionChanged);
    refresh();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
      animations.forEach((animation) => animation.cancel());
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      document.removeEventListener("pointermove", move);
      reducedMotion.removeEventListener("change", motionChanged);
      for (const element of elements) {
        element.style.removeProperty("--glass-backdrop");
        delete element.dataset.glass;
      }
      defs.replaceChildren();
    };
  }, []);
  return (
    <svg className="glass-definitions" width="0" height="0" aria-hidden="true">
      <defs ref={definitions} />
    </svg>
  );
}
