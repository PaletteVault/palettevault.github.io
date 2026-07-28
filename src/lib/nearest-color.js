/**
 * ============================================================================
 *  NEAREST CATALOG COLOR
 * ============================================================================
 *
 *  A palette holds arbitrary hex values; the color pages are a fixed catalog of
 *  named shades. To link a swatch to a color page, the swatch has to be matched
 *  to the closest name we actually publish.
 *
 *  The first version of this used plain OKLab distance with a cut-off, and it
 *  produced confidently wrong links: a muted green matched "Gray", a dark violet
 *  matched "Espresso", a vivid cyan matched "Transparent blue". The reason is
 *  that OKLab distance lets lightness dominate, for two dark colors both `a`
 *  and `b` are small in absolute terms, so a violet and a brown sit numerically
 *  close together while looking nothing alike.
 *
 *  So the gate is on hue first, in OKLCH, and distance only decides between
 *  candidates that already share a hue. Neutrals are handled separately, since
 *  hue is meaningless once chroma is near zero.
 * ============================================================================
 */

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** hex (6 digits, no hash) → { L, C, h } with L 0..1 and h in degrees. */
export function hexToOklch(hex) {
  const clean = String(hex).replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6);
  const r = toLinear(parseInt(clean.slice(0, 2), 16) / 255);
  const g = toLinear(parseInt(clean.slice(2, 4), 16) / 255);
  const b = toLinear(parseInt(clean.slice(4, 6), 16) / 255);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C: Math.sqrt(a * a + bb * bb), h };
}

/** Below this chroma a color reads as grey and its hue angle is noise. */
const NEUTRAL_C = 0.035;

/** Hue may differ by this much and still be the same colour family. */
const HUE_TOLERANCE = 22;

/** Lightness may differ by this much, beyond it "olive" and "black" merge. */
const LIGHTNESS_TOLERANCE = 0.2;

/** Chroma may differ by this much, so a pastel does not match a neon. */
const CHROMA_TOLERANCE = 0.09;

const hueGap = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * Closest publishable entry to `hex`, or null when nothing qualifies.
 *
 * `index` is a list of `{ slug, name, hex }`, deliberately not the full color
 * catalog, which carries thousands of words of prose per entry and has no
 * business in a browser bundle.
 *
 * Returning null is a normal outcome, not a failure. A link to a visibly
 * different color is worse than no link.
 */
export function nearestColor(hex, index) {
  if (!Array.isArray(index) || index.length === 0) return null;

  const target = hexToOklch(hex);
  const targetNeutral = target.C < NEUTRAL_C;

  let best = null;
  let bestScore = Infinity;

  for (const entry of index) {
    const candidate = hexToOklch(entry.hex);
    const candidateNeutral = candidate.C < NEUTRAL_C;

    // A grey and a colour are never the same shade, whichever way round.
    if (targetNeutral !== candidateNeutral) continue;

    const dL = Math.abs(candidate.L - target.L);
    if (dL > LIGHTNESS_TOLERANCE) continue;

    if (!targetNeutral) {
      if (hueGap(candidate.h, target.h) > HUE_TOLERANCE) continue;
      if (Math.abs(candidate.C - target.C) > CHROMA_TOLERANCE) continue;
    }

    /*
     * Among candidates that pass the gate, rank by hue first and lightness
     * second. Plain Euclidean distance would again favour a closer lightness
     * over a closer hue, which is how the earlier version ended up calling a
     * green "gray".
     */
    const score = targetNeutral
      ? dL
      : hueGap(candidate.h, target.h) / HUE_TOLERANCE + dL / LIGHTNESS_TOLERANCE;

    if (score < bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best ? { ...best, score: bestScore } : null;
}
