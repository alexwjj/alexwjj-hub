import test from "node:test";
import assert from "node:assert/strict";
import { refractedOffset } from "../.agents/skills/alexwjj-liquid-glass/assets/glass-optics.ts";

test("glass refraction stays finite at the rim and goes flat at the lens centre", () => {
  for (const bevel of [1, 8, 22]) {
    const offsets = Array.from({ length: 257 }, (_, i) =>
      refractedOffset((i / 256) * bevel, bevel),
    );
    assert(offsets.every((n) => Number.isFinite(n) && n >= 0 && n < 100));
    assert(offsets.some((n) => n > 1));
    assert.equal(offsets.at(-1), 0);
    assert(refractedOffset(bevel * 0.999, bevel) < 0.001);
  }
  assert.equal(refractedOffset(-1, 10), 0);
  assert.equal(refractedOffset(10, 0), 0);
  assert(refractedOffset(2, 12, 10) > refractedOffset(2, 12, 2));
});
