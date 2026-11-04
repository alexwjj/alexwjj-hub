import { useEffect, useRef, useState } from "react";

// One optical layer under native DOM content; no text or interaction is rasterized.
const vertex = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const fragment = `precision mediump float;
uniform vec2 viewport;
uniform float pixelRatio;
uniform float lightTheme;
uniform vec2 pointer;
uniform vec4 surface;
uniform float radius;
uniform float isSurface;

vec3 scene(vec2 point) {
  vec2 uv = point / viewport;
  vec2 p = (uv - 0.5) * vec2(viewport.x / viewport.y, 1.0);
  float ellipse = length((p - vec2(0.52, -0.02)) / vec2(0.82, 0.61));
  float sweep = exp(-pow((ellipse - 1.0) * 9.0, 2.0));
  float rim = exp(-pow((ellipse - 0.94) * 90.0, 2.0));
  float second = length((p + vec2(0.52, 0.52)) / vec2(0.93, 0.67));
  float glow = exp(-pow((second - 1.0) * 6.0, 2.0));
  float shade = 0.014 + sweep * 0.06 + rim * 0.075 + glow * 0.027;
  float light = 0.9 + sweep * 0.045 + rim * 0.03 - glow * 0.045;
  return vec3(mix(shade, light, lightTheme));
}
float roundedBox(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
void main() {
  vec2 point = vec2(gl_FragCoord.x, viewport.y * pixelRatio - gl_FragCoord.y) / pixelRatio;
  vec3 color = vec3(lightTheme);
  if (isSurface > 0.5) {
    vec2 halfSize = surface.zw * 0.5;
    vec2 local = point - surface.xy - halfSize;
    float distance = roundedBox(local, halfSize, radius);
    if (distance > 1.0) discard;
    vec2 normal = normalize(vec2(
      roundedBox(local + vec2(0.6, 0.0), halfSize, radius) - roundedBox(local - vec2(0.6, 0.0), halfSize, radius),
      roundedBox(local + vec2(0.0, 0.6), halfSize, radius) - roundedBox(local - vec2(0.0, 0.6), halfSize, radius)) + vec2(0.0001));
    float lens = exp(-max(-distance, 0.0) / 14.0);
    vec2 refracted = point - normal * lens * 26.0;
    color = scene(refracted);
    vec2 lightDirection = normalize(pointer - point + vec2(0.01));
    float specular = pow(max(dot(normal, lightDirection), 0.0), 5.0);
    float edge = exp(-abs(distance + 1.2) * 0.9);
    color += (0.055 + specular * 0.21) * edge;
    color += lens * mix(0.017, 0.025, lightTheme);
  }
  gl_FragColor = vec4(color, 1.0);
}`;

const surfaces = ".sidebar, .tool-shortcut, .panel, .project-card, .tool-detail-card, .website-item, .reading-links > a, .social-links > a, .message-card";

export function LiquidGlass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
    if (!gl) return; // The CSS glass treatment also works without WebGL.
    let contextWasLost = false;
    const shaders: WebGLShader[] = [];
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    if (!program || !buffer) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return false;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return false;
      gl.attachShader(program, shader);
      return true;
    };
    const dispose = () => {
      if (contextWasLost) return; // Context loss already released these GPU resources.
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach(shader => gl.deleteShader(shader));
    };
    if (!compile(gl.VERTEX_SHADER, vertex) || !compile(gl.FRAGMENT_SHADER, fragment)) { dispose(); return; }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return; }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(["viewport", "pixelRatio", "lightTheme", "pointer", "surface", "radius", "isSurface"].map(name => [name, gl.getUniformLocation(program, name)]));
    let frame = 0;
    let disposed = false;
    let items: Element[] = [];
    let needsMeasure = true;
    let pointer = [innerWidth * 0.35, -innerHeight * 0.2];
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const schedule = () => {
      if (!disposed && !contextWasLost && !document.hidden && !gl.isContextLost() && !frame) frame = requestAnimationFrame(draw);
    };
    const resizeObserver = new ResizeObserver(schedule);
    const draw = () => {
      frame = 0;
      if (disposed || contextWasLost || gl.isContextLost()) return;
      const width = innerWidth;
      const height = innerHeight;
      // Bound the backing buffer on retina/4K displays, including desktop zoom.
      const ratio = Math.min(devicePixelRatio || 1, 1.5, 2400 / Math.max(width, height));
      const backingWidth = Math.round(width * ratio);
      const backingHeight = Math.round(height * ratio);
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.viewport, width, height);
      gl.uniform1f(uniforms.pixelRatio, ratio);
      gl.uniform1f(uniforms.lightTheme, document.documentElement.classList.contains("dark") ? 0 : 1);
      gl.uniform2f(uniforms.pointer, pointer[0], pointer[1]);
      gl.disable(gl.SCISSOR_TEST);
      gl.uniform1f(uniforms.isSurface, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (needsMeasure) {
        resizeObserver.disconnect();
        items = [...document.querySelectorAll(surfaces)];
        items.forEach(item => resizeObserver.observe(item));
        needsMeasure = false;
      }
      gl.enable(gl.SCISSOR_TEST);
      gl.uniform1f(uniforms.isSurface, 1);
      for (const item of items) {
        const box = item.getBoundingClientRect();
        if (!box.width || !box.height || box.bottom <= 0 || box.top >= height || box.right <= 0 || box.left >= width) continue;
        const left = Math.max(0, Math.floor(box.left * ratio));
        const bottom = Math.max(0, Math.floor((height - box.bottom) * ratio));
        const right = Math.min(canvas.width, Math.ceil(box.right * ratio));
        const top = Math.min(canvas.height, Math.ceil((height - box.top) * ratio));
        gl.scissor(left, bottom, Math.max(0, right - left), Math.max(0, top - bottom));
        const radius = Math.min(parseFloat(getComputedStyle(item).borderTopLeftRadius) || 0, box.width / 2, box.height / 2);
        gl.uniform4f(uniforms.surface, box.left, box.top, box.width, box.height);
        gl.uniform1f(uniforms.radius, radius);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      canvas.dataset.renderer = "webgl";
    };
    const mutations = new MutationObserver(() => { needsMeasure = true; schedule(); });
    mutations.observe(document.getElementById("root")!, { childList: true, subtree: true });
    const theme = new MutationObserver(schedule);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) return;
      pointer = [event.clientX, event.clientY];
      schedule();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextWasLost = true;
      cancelAnimationFrame(frame);
      frame = 0;
      delete canvas.dataset.renderer;
    };
    const restored = () => setGeneration(value => value + 1);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    window.addEventListener("resize", schedule);
    document.addEventListener("transitionend", schedule, true);
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutations.disconnect();
      theme.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("transitionend", schedule, true);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", schedule);
      dispose();
      delete canvas.dataset.renderer;
    };
  }, [generation]);
  return <canvas ref={canvasRef} className="liquid-scene" aria-hidden="true" />;
}
