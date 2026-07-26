/**
 * ============================================================================
 *  OKLCH ↔ sRGB
 * ============================================================================
 *
 *  The same colour maths the palette generator uses, available at runtime for
 *  the tools. Working in OKLCH matters because it is perceptually uniform:
 *  stepping lightness by an equal amount looks like an equal step, which HSL
 *  does not give you. That is what keeps generated ramps and gradients from
 *  going muddy or grey in the middle.
 *
 *  Conversion matrices follow Björn Ottosson's Oklab definition.
 * ============================================================================
 */

/** OKLab → linear sRGB. */
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Linear sRGB → OKLab. */
function linearSrgbToOklab(r, g, b) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

const EPS = 1e-4;
const inGamut = ([r, g, b]) =>
  r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;

function oklchToLinear(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  return oklabToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h));
}

/**
 * OKLCH → HEX, with gamut mapping.
 *
 * Colours outside sRGB get their chroma reduced by binary search while
 * lightness and hue are preserved. Naive clipping would shift the hue and
 * produce a visibly different colour.
 */
export function oklchToHex(L, C, hDeg) {
  let linear = oklchToLinear(L, C, hDeg);

  if (!inGamut(linear)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 18; i += 1) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, hDeg))) lo = mid;
      else hi = mid;
    }
    linear = oklchToLinear(L, lo, hDeg);
  }

  return linear
    .map((channel) => {
      const value = Math.round(Math.min(1, Math.max(0, toGamma(channel))) * 255);
      return value.toString(16).padStart(2, '0');
    })
    .join('');
}

/** HEX → { L, C, h } with L in 0..1, h in degrees. */
export function hexToOklch(hex) {
  const clean = String(hex).replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6);
  const r = toLinear(parseInt(clean.slice(0, 2), 16) / 255);
  const g = toLinear(parseInt(clean.slice(2, 4), 16) / 255);
  const b = toLinear(parseInt(clean.slice(4, 6), 16) / 255);

  const [L, a, bb] = linearSrgbToOklab(r, g, b);
  const C = Math.sqrt(a * a + bb * bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { L, C, h };
}

/** Formatted `oklch(62.3% 0.14 264)` string. */
export function formatOklch(hex) {
  const { L, C, h } = hexToOklch(hex);
  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${h.toFixed(1)})`;
}

/**
 * Tint/shade ramp through OKLCH.
 *
 * Mixing towards white or black in sRGB desaturates unevenly and often turns
 * mid-tones chalky; holding hue and chroma while walking lightness keeps the
 * ramp recognisably the same colour.
 */
export function ramp(hex, steps = 11) {
  const { C, h } = hexToOklch(hex);
  const out = [];

  for (let i = 0; i < steps; i += 1) {
    const L = 0.96 - (i / (steps - 1)) * 0.86;
    // Very light and very dark colours physically hold less chroma; tapering
    // it prevents the ends of the ramp from clipping into flat blocks.
    const falloff = 1 - Math.pow(Math.abs(L - 0.62) / 0.62, 1.6);
    out.push(oklchToHex(L, C * Math.max(0.25, falloff), h));
  }
  return out;
}

/**
 * Interpolate between two colours through OKLCH.
 * `hueShort` takes the shorter way around the hue circle, which is what people
 * expect from a two-stop gradient.
 */
export function mix(hexA, hexB, t, { hueShort = true } = {}) {
  const a = hexToOklch(hexA);
  const b = hexToOklch(hexB);

  let dh = b.h - a.h;
  if (hueShort) {
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
  }

  return oklchToHex(
    a.L + (b.L - a.L) * t,
    a.C + (b.C - a.C) * t,
    (a.h + dh * t + 360) % 360,
  );
}
