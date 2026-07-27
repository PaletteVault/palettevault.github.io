/**
 * ============================================================================
 *  OKLCH ↔ sRGB
 * ============================================================================
 *
 *  The same color maths the palette generator uses, available at runtime for
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
 * Colors outside sRGB get their chroma reduced by binary search while
 * lightness and hue are preserved. Naive clipping would shift the hue and
 * produce a visibly different color.
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
 * ramp recognisably the same color.
 */
export function ramp(hex, steps = 11) {
  const { C, h } = hexToOklch(hex);
  const out = [];

  for (let i = 0; i < steps; i += 1) {
    const L = 0.96 - (i / (steps - 1)) * 0.86;
    // Very light and very dark colors physically hold less chroma; tapering
    // it prevents the ends of the ramp from clipping into flat blocks.
    const falloff = 1 - Math.pow(Math.abs(L - 0.62) / 0.62, 1.6);
    out.push(oklchToHex(L, C * Math.max(0.25, falloff), h));
  }
  return out;
}

/**
 * Interpolate between two colors through OKLCH.
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

/* ==========================================================================
 *  WIDER GAMUTS
 * ==========================================================================
 *
 *  OKLCH can describe colors that no sRGB monitor can show. To tell the user
 *  *which* colors those are, we need to test membership in more than one
 *  gamut, so the conversions below take linear sRGB (which we already have)
 *  into linear Display P3 and linear Rec2020.
 *
 *  All three spaces share the D65 white point, so no chromatic adaptation is
 *  needed and each conversion is a single 3x3 matrix. Every row sums to 1 —
 *  that is what makes white map to white, and it is a useful check that the
 *  numbers have not been mistyped.
 * ==========================================================================
 */

const SRGB_TO_P3 = [
  [0.8224621, 0.1775380, 0.0000000],
  [0.0331941, 0.9668058, 0.0000000],
  [0.0170827, 0.0723974, 0.9105199],
];

const SRGB_TO_REC2020 = [
  [0.6274039, 0.3292830, 0.0433131],
  [0.0690970, 0.9195404, 0.0113626],
  [0.0163916, 0.0880132, 0.8955952],
];

const apply = (m, [r, g, b]) => m.map((row) => row[0] * r + row[1] * g + row[2] * b);

/**
 * The gamuts we can report on, narrowest first.
 *
 * Worth knowing: these are *not* strictly nested. sRGB sits inside both of the
 * others, but Display P3 is not a subset of Rec. 2020 — the P3 red primary
 * falls just outside the Rec. 2020 triangle, so a handful of deep reds are
 * displayable on a P3 monitor and not describable in Rec. 2020. The order
 * below is therefore "narrowest that fits", not a hierarchy.
 */
export const GAMUTS = ['srgb', 'p3', 'rec2020'];

export const GAMUT_LABELS = {
  srgb: 'sRGB',
  p3: 'Display P3',
  rec2020: 'Rec. 2020',
  none: 'beyond Rec. 2020',
};

/** Does this OKLCH triplet fit inside `gamut`? */
export function inGamutOf(L, C, hDeg, gamut = 'srgb') {
  const linear = oklchToLinear(L, C, hDeg);
  if (gamut === 'srgb') return inGamut(linear);
  if (gamut === 'p3') return inGamut(apply(SRGB_TO_P3, linear));
  if (gamut === 'rec2020') return inGamut(apply(SRGB_TO_REC2020, linear));
  return false;
}

/**
 * The narrowest gamut that contains this color, or 'none'.
 *
 * Reported rather than silently corrected: a color outside sRGB is not a
 * mistake, it just needs a fallback declaration alongside it.
 */
export function findGamut(L, C, hDeg) {
  for (const gamut of GAMUTS) {
    if (inGamutOf(L, C, hDeg, gamut)) return gamut;
  }
  return 'none';
}

/**
 * The highest chroma that still fits in `gamut` at this lightness and hue.
 *
 * There is no closed form for this — the sRGB solid is a lopsided shape in
 * OKLCH, and its edge moves with both L and h. Binary search converges fast
 * enough to run on every slider frame, and 20 iterations lands well inside
 * the precision an 8-bit channel can represent anyway.
 */
export function maxChroma(L, hDeg, gamut = 'srgb') {
  if (!inGamutOf(L, 0, hDeg, gamut)) return 0;

  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2;
    if (inGamutOf(L, mid, hDeg, gamut)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/* ==========================================================================
 *  FORMATTING
 * ========================================================================== */

/** Trim a float to `digits` without leaving a trailing `.0`. */
const num = (value, digits) => String(Number(value.toFixed(digits)));

export function formatOklchParts(L, C, h, alpha = 1) {
  const base = `${num(L * 100, 2)}% ${num(C, 4)} ${num(h, 2)}`;
  return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${num(alpha, 3)})`;
}

/** `color(display-p3 …)`, the way you would actually ship a wide-gamut color. */
export function formatDisplayP3(L, C, h, alpha = 1) {
  const [r, g, b] = apply(SRGB_TO_P3, oklchToLinear(L, C, h)).map((c) =>
    Math.min(1, Math.max(0, toGamma(c))),
  );
  const base = `${num(r, 4)} ${num(g, 4)} ${num(b, 4)}`;
  return alpha >= 1 ? `color(display-p3 ${base})` : `color(display-p3 ${base} / ${num(alpha, 3)})`;
}

/** CIE Lab / LCH, for anyone coming from a print or Photoshop background. */
export function oklchToLab(L, C, hDeg) {
  const linear = oklchToLinear(L, C, hDeg);
  // linear sRGB → XYZ (D65), then the usual CIELAB transfer function.
  const x = 0.4123908 * linear[0] + 0.3575843 * linear[1] + 0.1804808 * linear[2];
  const y = 0.2126390 * linear[0] + 0.7151687 * linear[1] + 0.0721923 * linear[2];
  const z = 0.0193308 * linear[0] + 0.1191948 * linear[1] + 0.9505322 * linear[2];

  // D65 reference white.
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27) * t / 116 + 16 / 116);
  const fx = f(x / 0.9504559);
  const fy = f(y);
  const fz = f(z / 1.0890578);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function formatLab(L, C, h, alpha = 1) {
  const [l, a, b] = oklchToLab(L, C, h);
  const base = `${num(l, 2)}% ${num(a, 2)} ${num(b, 2)}`;
  return alpha >= 1 ? `lab(${base})` : `lab(${base} / ${num(alpha, 3)})`;
}

export function formatLch(L, C, h, alpha = 1) {
  const [l, a, b] = oklchToLab(L, C, h);
  let hue = (Math.atan2(b, a) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const base = `${num(l, 2)}% ${num(Math.sqrt(a * a + b * b), 2)} ${num(hue, 2)}`;
  return alpha >= 1 ? `lch(${base})` : `lch(${base} / ${num(alpha, 3)})`;
}

/* ==========================================================================
 *  PARSING
 * ==========================================================================
 *
 *  Accepts what someone is likely to paste: a hex code, an rgb()/hsl() from
 *  devtools, an oklch()/lab()/lch() from a stylesheet, or a CSS keyword. The
 *  browser does the hard part — `new Option().style.color` only keeps a value
 *  it recognises, which is a far better validator than any regex, and
 *  getComputedStyle then hands the value back resolved.
 * ========================================================================== */

/** Split the numeric arguments out of `fn(a b c / d)` or `fn(a, b, c, d)`. */
function args(body) {
  const [main, alphaPart] = body.split('/');
  const parts = main.trim().split(/[\s,]+/).filter(Boolean);
  const alpha = alphaPart === undefined ? null : alphaPart.trim();
  return { parts, alpha };
}

const asNumber = (token, scale = 1) => {
  if (token === 'none') return 0;
  const value = parseFloat(token);
  if (Number.isNaN(value)) return null;
  return token.trim().endsWith('%') ? (value / 100) * scale : value;
};

const asAlpha = (token) => {
  if (token === null || token === undefined) return 1;
  const value = asNumber(token, 1);
  return value === null ? 1 : Math.min(1, Math.max(0, value));
};

/**
 * Any CSS color → { L, C, h, alpha }, or null if it is not a color.
 *
 * oklch() is handled directly rather than through the browser, because
 * bouncing it off a DOM element would clamp it into sRGB and lose exactly the
 * out-of-gamut values this tool exists to show.
 */
export function parseColor(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;

  const fn = raw.match(/^(oklch|oklab)\(([^)]*)\)$/i);
  if (fn) {
    const { parts, alpha } = args(fn[2]);
    if (parts.length < 3) return null;
    const alphaValue = asAlpha(alpha);

    if (fn[1].toLowerCase() === 'oklab') {
      const l = asNumber(parts[0], 1);
      const a = asNumber(parts[1], 0.4);
      const b = asNumber(parts[2], 0.4);
      if (l === null || a === null || b === null) return null;
      let h = (Math.atan2(b, a) * 180) / Math.PI;
      if (h < 0) h += 360;
      return { L: l, C: Math.sqrt(a * a + b * b), h, alpha: alphaValue };
    }

    const L = asNumber(parts[0], 1);
    const C = asNumber(parts[1], 0.4);
    const h = parts[2] === 'none' ? 0 : parseFloat(parts[2]);
    if (L === null || C === null || Number.isNaN(h)) return null;
    return {
      L: Math.min(1, Math.max(0, L)),
      C: Math.max(0, C),
      h: ((h % 360) + 360) % 360,
      alpha: alphaValue,
    };
  }

  // Bare hex digits, as people type them into a swatch field.
  const bare = raw.replace(/^#/, '');
  if (/^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(bare)) {
    return fromHexString(bare);
  }

  // Everything else goes through the browser's own parser.
  if (typeof document === 'undefined') return null;
  const probe = new Option().style;
  probe.color = '';
  probe.color = raw;
  if (!probe.color) return null;

  const el = document.createElement('span');
  el.style.color = raw;
  el.style.display = 'none';
  document.body.appendChild(el);
  const resolved = getComputedStyle(el).color;
  el.remove();

  const rgb = resolved.match(/^rgba?\(([^)]*)\)$/i);
  if (!rgb) return null;
  const { parts, alpha } = args(rgb[1]);
  const channels = parts.slice(0, 3).map((token) => {
    const value = asNumber(token, 255);
    return value === null ? 0 : Math.min(255, Math.max(0, value));
  });
  const alphaValue = parts.length > 3 ? asAlpha(parts[3]) : asAlpha(alpha);

  const hex = channels
    .map((c) => Math.round(c).toString(16).padStart(2, '0'))
    .join('');
  return { ...hexToOklch(hex), alpha: alphaValue };
}

/** 3-, 4-, 6- or 8-digit hex → OKLCH, honouring the alpha pair when present. */
function fromHexString(bare) {
  let hex = bare.toLowerCase();
  let alpha = 1;

  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.slice(0, 6);
  }
  return { ...hexToOklch(hex), alpha };
}
