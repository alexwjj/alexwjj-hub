// Single convex surface, normal incidence, glass IOR 1.5. See docs/liquid-glass.md.
export function refractedOffset(depth: number, bevel: number, thickness = 6) {
  if (depth < 0 || depth >= bevel || bevel <= 0) return 0;
  const x = Math.max(0.001, depth / bevel);
  const edge = 1 - x;
  const surface = Math.pow(1 - Math.pow(edge, 4), 0.25);
  const slope = Math.pow(edge, 3) / Math.pow(surface, 3);
  const incident = Math.atan(slope);
  const refracted = Math.asin(Math.sin(incident) / 1.5);
  return Math.tan(incident - refracted) * (thickness + surface * bevel);
}
