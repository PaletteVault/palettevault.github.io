#!/usr/bin/env node
/**
 * ============================================================================
 *  HARMONIOUS COLOUR PALETTE GENERATOR
 * ============================================================================
 *
 *  What it does:
 *   1. Generates N four-colour palettes in OKLCH, a perceptually uniform space.
 *      That uniformity is why the results look considered rather than like the
 *      noise you get from random values in RGB.
 *   2. Uses the classical harmony schemes: mono, analogous, complementary,
 *      split-complementary, triad, tetrad, neutral-with-accent, gradient.
 *   3. Tags every palette automatically: style tags (Pastel, Dark, Neon,
 *      Vintage...) and colour tags (Blue, Red, Green...).
 *   4. Writes the result as static JSON chunks of 1000 records:
 *        public/data/new/1.json ... N.json        — the "New" feed, id descending
 *        public/data/tag/<slug>/1.json ... N.json — one shard set per tag
 *        public/data/meta.json                    — manifest with chunk counts
 *
 *  Why the tag shards duplicate the data:
 *   A palette costs ~45 bytes. Duplicating it across 3-6 tags is cheaper than
 *   shipping an id-to-chunk index to the client and making 100 requests to open
 *   a single tag page. Disk is cheap; round trips are not.
 *
 *  Usage:
 *    node scripts/generate-palettes.mjs --count=100000 --chunk=1000 --seed=42
 *
 *  No external dependencies — Node.js standard library only.
 * ============================================================================
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DATA_DIR = resolve(__dirname, '..', 'public', 'data');

/* ==========================================================================
 * 0. COMMAND LINE ARGUMENTS
 * ========================================================================== */

function parseArgs(argv) {
  const out = { count: 100_000, chunk: 1000, seed: 20260726, out: PUBLIC_DATA_DIR };
  for (const arg of argv.slice(2)) {
    const m = /^--([\w-]+)(?:=(.*))?$/.exec(arg);
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue ?? 'true';
    if (key === 'count') out.count = Math.max(1, Number.parseInt(value, 10));
    else if (key === 'chunk') out.chunk = Math.max(1, Number.parseInt(value, 10));
    else if (key === 'seed') out.seed = Number.parseInt(value, 10) >>> 0;
    else if (key === 'out') out.out = resolve(process.cwd(), value);
  }
  return out;
}

const ARGS = parseArgs(process.argv);

/* ==========================================================================
 * 1. DETERMINISTIC RNG (mulberry32)
 *    The same seed yields the same dataset. That matters: rebuilding the site
 *    must not reshuffle the ids of existing palettes, or the like counters in
 *    Firebase would end up attached to different colours.
 * ========================================================================== */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(ARGS.seed);
const rangeF = (min, max) => min + rnd() * (max - min);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

/* ==========================================================================
 * 2. COLOUR MATHS: OKLCH -> sRGB (Björn Ottosson, oklab)
 * ========================================================================== */

/** OKLab -> linear sRGB. */
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

/** Linear channel -> gamma-encoded sRGB (0..1). */
function linearToSrgb(x) {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

function oklchToLinear(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  return oklabToLinearSrgb(L, C * Math.cos(h), C * Math.sin(h));
}

const EPS = 1e-4;
const inGamut = ([r, g, b]) =>
  r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;

/**
 * OKLCH -> HEX with gamut mapping.
 * When a colour falls outside sRGB, chroma is reduced by binary search while
 * lightness and hue are preserved. That yields a correct colour instead of the
 * hue shift naive clipping produces.
 */
function oklchToHex(L, C, hDeg) {
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

  let hex = '';
  for (const channel of linear) {
    const v = Math.round(Math.min(1, Math.max(0, linearToSrgb(channel))) * 255);
    hex += v.toString(16).padStart(2, '0');
  }
  return hex;
}

/** HEX -> HSL, needed only for automatic tagging. */
function hexToHsl(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta > 1e-6) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / delta + 2) * 60;
    else h = ((r - g) / delta + 4) * 60;
  }

  return { h, s, l };
}

/* ==========================================================================
 * 3. MOOD PRESETS
 *
 *  Each preset defines a corridor in OKLCH: a lightness range (L), a chroma
 *  range (C) and the permitted hue windows. This is where the recognisable
 *  aesthetics come from.
 *
 *  weight — how often the preset appears in the dataset, relatively.
 *  tags   — tags the preset always applies.
 * ========================================================================== */

/** Hue windows in OKLCH degrees (0 is red, ~145 green, ~264 blue). */
const HUE = {
  red: [15, 40],
  orange: [40, 70],
  yellow: [70, 105],
  green: [125, 165],
  turquoise: [175, 205],
  blue: [225, 265],
  purple: [285, 320],
  pink: [340, 370],
  earth: [45, 95],
  sea: [190, 250],
  forest: [110, 170],
  sunset: [10, 80],
  berry: [320, 380],
};

const MOODS = [
  // --- light and soft -----------------------------------------------------
  { id: 'pastel', weight: 10, L: [0.84, 0.94], C: [0.035, 0.075], tags: ['pastel', 'light'], schemes: ['analogous', 'triad', 'split', 'mono'] },
  { id: 'cream', weight: 5, L: [0.86, 0.96], C: [0.02, 0.055], hues: [HUE.earth, HUE.yellow], tags: ['cream', 'light', 'warm'], schemes: ['analogous', 'mono', 'gradient'] },
  { id: 'wedding', weight: 4, L: [0.82, 0.96], C: [0.015, 0.06], hues: [HUE.pink, HUE.earth, [330, 360]], tags: ['wedding', 'light', 'pastel'], schemes: ['analogous', 'mono', 'neutral'] },
  { id: 'skin', weight: 3, L: [0.60, 0.92], C: [0.03, 0.09], hues: [[35, 75]], tags: ['skin', 'warm'], schemes: ['gradient', 'mono'] },
  { id: 'spring', weight: 5, L: [0.72, 0.92], C: [0.06, 0.13], hues: [HUE.green, HUE.yellow, HUE.pink], tags: ['spring', 'light', 'happy'], schemes: ['analogous', 'triad', 'split'] },

  // --- saturated and bright -----------------------------------------------
  { id: 'neon', weight: 6, L: [0.68, 0.90], C: [0.17, 0.30], tags: ['neon', 'vibrant'], schemes: ['complement', 'split', 'triad'] },
  { id: 'happy', weight: 6, L: [0.68, 0.88], C: [0.12, 0.21], hues: [HUE.yellow, HUE.orange, HUE.turquoise, HUE.pink], tags: ['happy', 'vibrant'], schemes: ['triad', 'tetrad', 'split'] },
  { id: 'rainbow', weight: 3, L: [0.62, 0.82], C: [0.13, 0.22], tags: ['rainbow', 'vibrant', 'happy'], schemes: ['tetrad', 'triad'] },
  { id: 'kids', weight: 4, L: [0.72, 0.90], C: [0.10, 0.18], tags: ['kids', 'happy', 'light'], schemes: ['tetrad', 'triad', 'split'] },

  // --- warm / retro -------------------------------------------------------
  { id: 'vintage', weight: 7, L: [0.48, 0.80], C: [0.035, 0.085], hues: [HUE.earth, HUE.red, HUE.green], tags: ['vintage', 'warm'], schemes: ['analogous', 'neutral', 'split'] },
  { id: 'retro', weight: 6, L: [0.50, 0.78], C: [0.085, 0.155], hues: [HUE.orange, HUE.red, HUE.turquoise], tags: ['retro', 'warm'], schemes: ['split', 'complement', 'triad'] },
  { id: 'sunset', weight: 5, L: [0.45, 0.85], C: [0.09, 0.19], hues: [HUE.sunset, HUE.berry], tags: ['sunset', 'warm', 'summer'], schemes: ['gradient', 'analogous'] },
  { id: 'fall', weight: 5, L: [0.42, 0.76], C: [0.06, 0.14], hues: [[25, 90]], tags: ['fall', 'warm', 'earth'], schemes: ['analogous', 'gradient', 'neutral'] },
  { id: 'gold', weight: 3, L: [0.55, 0.88], C: [0.05, 0.13], hues: [[70, 95]], tags: ['gold', 'warm', 'vintage'], schemes: ['gradient', 'mono', 'neutral'] },
  { id: 'coffee', weight: 4, L: [0.32, 0.82], C: [0.02, 0.07], hues: [[40, 80]], tags: ['coffee', 'earth', 'warm'], schemes: ['gradient', 'mono'] },
  { id: 'food', weight: 4, L: [0.52, 0.86], C: [0.08, 0.17], hues: [HUE.red, HUE.orange, HUE.yellow, HUE.green], tags: ['food', 'warm', 'happy'], schemes: ['analogous', 'split'] },
  { id: 'christmas', weight: 2, L: [0.38, 0.82], C: [0.07, 0.17], hues: [[18, 34], [140, 160], [80, 95]], tags: ['christmas', 'winter'], schemes: ['complement', 'split'] },
  { id: 'halloween', weight: 2, L: [0.22, 0.75], C: [0.05, 0.19], hues: [[45, 65], [295, 315]], tags: ['halloween', 'dark'], schemes: ['complement', 'split'] },

  // --- cool ---------------------------------------------------------------
  { id: 'cold', weight: 7, L: [0.55, 0.88], C: [0.04, 0.12], hues: [HUE.blue, HUE.turquoise, HUE.purple], tags: ['cold'], schemes: ['analogous', 'mono', 'gradient'] },
  { id: 'sea', weight: 5, L: [0.42, 0.86], C: [0.05, 0.14], hues: [HUE.sea], tags: ['sea', 'cold', 'summer'], schemes: ['gradient', 'analogous', 'mono'] },
  { id: 'sky', weight: 4, L: [0.65, 0.93], C: [0.03, 0.11], hues: [[210, 260]], tags: ['sky', 'cold', 'light'], schemes: ['gradient', 'mono', 'analogous'] },
  { id: 'winter', weight: 4, L: [0.55, 0.92], C: [0.02, 0.09], hues: [[195, 265]], tags: ['winter', 'cold', 'light'], schemes: ['mono', 'analogous', 'neutral'] },
  { id: 'nature', weight: 5, L: [0.40, 0.84], C: [0.05, 0.13], hues: [HUE.forest, HUE.earth], tags: ['nature', 'green'], schemes: ['analogous', 'gradient', 'neutral'] },

  // --- dark ---------------------------------------------------------------
  { id: 'dark', weight: 8, L: [0.20, 0.46], C: [0.03, 0.11], tags: ['dark'], schemes: ['mono', 'analogous', 'gradient', 'neutral'] },
  { id: 'night', weight: 4, L: [0.16, 0.42], C: [0.03, 0.12], hues: [HUE.blue, HUE.purple], tags: ['night', 'dark', 'cold'], schemes: ['gradient', 'mono', 'analogous'] },
  { id: 'space', weight: 3, L: [0.15, 0.50], C: [0.04, 0.15], hues: [[250, 320]], tags: ['space', 'dark'], schemes: ['gradient', 'analogous', 'split'] },
  { id: 'earth', weight: 4, L: [0.35, 0.80], C: [0.03, 0.09], hues: [[30, 100]], tags: ['earth', 'warm', 'vintage'], schemes: ['gradient', 'neutral', 'analogous'] },

  // --- seasonal / general purpose -----------------------------------------
  { id: 'summer', weight: 5, L: [0.62, 0.90], C: [0.10, 0.20], hues: [HUE.turquoise, HUE.yellow, HUE.orange, HUE.pink], tags: ['summer', 'happy', 'vibrant'], schemes: ['split', 'triad', 'tetrad'] },
  { id: 'gradient', weight: 6, L: [0.30, 0.92], C: [0.04, 0.18], tags: ['gradient'], schemes: ['gradient'] },
  // Near-achromatic palettes: the source of the White / Gray / Black tags.
  { id: 'minimal', weight: 5, L: [0.18, 0.96], C: [0.004, 0.022], tags: [], schemes: ['gradient', 'mono', 'neutral'] },
  { id: 'monochrome', weight: 3, L: [0.12, 0.55], C: [0.004, 0.03], tags: ['dark'], schemes: ['gradient', 'mono'] },
  { id: 'balanced', weight: 9, L: [0.40, 0.88], C: [0.05, 0.16], tags: [], schemes: ['analogous', 'complement', 'split', 'triad', 'tetrad', 'neutral', 'mono'] },
];

/** Expand the weights into a flat array for O(1) selection. */
const MOOD_POOL = MOODS.flatMap((mood) => Array.from({ length: mood.weight }, () => mood));

/* ==========================================================================
 * 4. HARMONY SCHEMES
 *    Each returns four hue offsets relative to the base hue.
 * ========================================================================== */

const SCHEMES = {
  mono: () => [0, 0, 0, 0],
  analogous: () => {
    const step = rangeF(12, 26);
    return [-step * 1.5, -step * 0.5, step * 0.5, step * 1.5];
  },
  complement: () => {
    const jitter = rangeF(-10, 10);
    return [0, rangeF(8, 20), 180 + jitter, 180 + jitter + rangeF(8, 20)];
  },
  split: () => {
    const spread = rangeF(24, 44);
    return [0, rangeF(10, 22), 180 - spread, 180 + spread];
  },
  triad: () => {
    const j = rangeF(-12, 12);
    return [0, 120 + j, 240 - j, rangeF(8, 24)];
  },
  tetrad: () => {
    const j = rangeF(-14, 14);
    return [0, 90 + j, 180, 270 - j];
  },
  /** Three close hues plus one contrasting accent. */
  neutral: () => [0, rangeF(6, 16), rangeF(-16, -6), 180 + rangeF(-25, 25)],
  /** Gentle hue drift, paired with a smooth lightness ramp. */
  gradient: () => {
    const drift = rangeF(4, 16);
    return [0, drift, drift * 2, drift * 3];
  },
};

/* ==========================================================================
 * 5. GENERATING ONE PALETTE
 * ========================================================================== */

/** A hue within the preset's window, or any hue if no window is set. */
function baseHue(mood) {
  if (!mood.hues || mood.hues.length === 0) return rnd() * 360;
  const [from, to] = pick(mood.hues);
  return rangeF(from, to) % 360;
}

/**
 * Lightness distribution across the four positions.
 * Palettes that read well almost always have a clear lightness spread, so
 * rather than picking four random L values this builds a monotonic ladder, or
 * one with a deliberate accent, inside the preset's corridor.
 */
function lightnessRamp(mood, scheme) {
  const [lo, hi] = mood.L;
  const span = hi - lo;

  // Gradient and mono get a strictly monotonic ladder.
  if (scheme === 'gradient' || scheme === 'mono') {
    const start = rangeF(lo, lo + span * 0.25);
    const end = rangeF(hi - span * 0.25, hi);
    const ramp = [0, 1, 2, 3].map((i) => start + ((end - start) * i) / 3);
    return chance(0.5) ? ramp : ramp.reverse();
  }

  // Other schemes: three close values plus one noticeable accent.
  const mid = rangeF(lo + span * 0.25, hi - span * 0.15);
  const values = [
    mid + rangeF(-span * 0.12, span * 0.12),
    mid + rangeF(-span * 0.12, span * 0.12),
    mid + rangeF(-span * 0.12, span * 0.12),
    chance(0.5) ? lo + span * rangeF(0, 0.12) : hi - span * rangeF(0, 0.12),
  ];

  // Shuffle so the accent does not always land last.
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values.map((v) => Math.min(hi, Math.max(lo, v)));
}

/** Reject palettes that read as four shades of the same blob. */
function isDistinct(colors) {
  const hsls = colors.map(hexToHsl);
  for (let i = 0; i < 4; i += 1) {
    for (let j = i + 1; j < 4; j += 1) {
      const a = hsls[i];
      const b = hsls[j];
      let dh = Math.abs(a.h - b.h);
      if (dh > 180) dh = 360 - dh;
      // Distance: lightness weighs most, then hue, then saturation.
      const dist = Math.abs(a.l - b.l) * 2.6 + (dh / 360) * 1.5 + Math.abs(a.s - b.s) * 0.8;
      if (dist < 0.085) return false;
    }
  }
  return true;
}

function makePalette() {
  const mood = pick(MOOD_POOL);
  const scheme = pick(mood.schemes);
  const offsets = SCHEMES[scheme]();
  const h0 = baseHue(mood);
  const ramp = lightnessRamp(mood, scheme);
  const [cLo, cHi] = mood.C;

  const colors = [];
  for (let i = 0; i < 4; i += 1) {
    const L = ramp[i];
    // Very light and very dark colours physically hold less chroma, so C is
    // tapered; otherwise gamut mapping would flatten the differences away.
    const headroom = 1 - Math.pow(Math.abs(L - 0.62) / 0.62, 1.6);
    const C = rangeF(cLo, cHi) * Math.max(0.35, headroom);
    const H = (h0 + offsets[i] + rangeF(-4, 4) + 360) % 360;
    colors.push(oklchToHex(L, C, H));
  }

  return { colors, mood, scheme };
}

/* ==========================================================================
 * 6. AUTOMATIC TAGGING FROM THE ACTUAL COLOURS
 * ========================================================================== */

/** Base colour families by HSL hue. */
function colorFamily({ h, s, l }) {
  if (l >= 0.88 && s < 0.30) return 'white';
  if (l <= 0.20) return 'black';
  if (s < 0.16) return 'gray';

  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 68) return 'yellow';
  if (h < 155) return 'green';
  if (h < 195) return 'turquoise';
  if (h < 255) return 'blue';
  if (h < 300) return 'purple';
  return 'pink';
}

function deriveTags(colors, mood) {
  const tags = new Set(mood.tags);
  const hsls = colors.map(hexToHsl);

  const avgL = hsls.reduce((sum, c) => sum + c.l, 0) / 4;
  const avgS = hsls.reduce((sum, c) => sum + c.s, 0) / 4;

  // --- properties ---------------------------------------------------------
  if (avgL >= 0.78) tags.add('light');
  if (avgL <= 0.40) tags.add('dark');
  if (avgL >= 0.75 && avgS <= 0.55 && avgS >= 0.12) tags.add('pastel');
  if (avgS >= 0.80 && avgL >= 0.50 && avgL <= 0.75) tags.add('neon');
  if (avgS >= 0.62) tags.add('vibrant');

  // --- temperature: count which side of the wheel dominates ---------------
  let warm = 0;
  let cold = 0;
  for (const c of hsls) {
    if (c.s < 0.08) continue; // neutrals do not vote
    if (c.h < 75 || c.h >= 320) warm += 1;
    else if (c.h >= 160 && c.h < 290) cold += 1;
  }
  if (warm >= 3) tags.add('warm');
  if (cold >= 3) tags.add('cold');

  // --- colour families: tag the palette for every family it actually
  //     contains, so a single accent colour still makes it findable.
  const families = new Map();
  for (const c of hsls) {
    const family = colorFamily(c);
    families.set(family, (families.get(family) ?? 0) + 1);
  }
  for (const [family, count] of families) {
    // A single neutral is enough to list the palette under White/Gray/Black.
    if (count >= 1) tags.add(family);
  }

  // Mutually exclusive tags: light and dark must never both apply.
  if (tags.has('light') && tags.has('dark')) tags.delete(avgL >= 0.6 ? 'dark' : 'light');

  return [...tags];
}

/* ==========================================================================
 * 7. TAG CATALOGUE for the sidebar. Order here is display order.
 * ========================================================================== */

const TAG_CATALOG = [
  // Styles and moods
  { slug: 'pastel', label: 'Pastel', group: 'style' },
  { slug: 'vintage', label: 'Vintage', group: 'style' },
  { slug: 'retro', label: 'Retro', group: 'style' },
  { slug: 'neon', label: 'Neon', group: 'style' },
  { slug: 'gold', label: 'Gold', group: 'style' },
  { slug: 'light', label: 'Light', group: 'style' },
  { slug: 'dark', label: 'Dark', group: 'style' },
  { slug: 'warm', label: 'Warm', group: 'style' },
  { slug: 'cold', label: 'Cold', group: 'style' },
  { slug: 'summer', label: 'Summer', group: 'style' },
  { slug: 'fall', label: 'Fall', group: 'style' },
  { slug: 'winter', label: 'Winter', group: 'style' },
  { slug: 'spring', label: 'Spring', group: 'style' },
  { slug: 'happy', label: 'Happy', group: 'style' },
  { slug: 'nature', label: 'Nature', group: 'style' },
  { slug: 'earth', label: 'Earth', group: 'style' },
  { slug: 'night', label: 'Night', group: 'style' },
  { slug: 'space', label: 'Space', group: 'style' },
  { slug: 'rainbow', label: 'Rainbow', group: 'style' },
  { slug: 'gradient', label: 'Gradient', group: 'style' },
  { slug: 'sunset', label: 'Sunset', group: 'style' },
  { slug: 'sky', label: 'Sky', group: 'style' },
  { slug: 'sea', label: 'Sea', group: 'style' },
  { slug: 'kids', label: 'Kids', group: 'style' },
  { slug: 'skin', label: 'Skin', group: 'style' },
  { slug: 'food', label: 'Food', group: 'style' },
  { slug: 'cream', label: 'Cream', group: 'style' },
  { slug: 'coffee', label: 'Coffee', group: 'style' },
  { slug: 'wedding', label: 'Wedding', group: 'style' },
  { slug: 'christmas', label: 'Christmas', group: 'style' },
  { slug: 'halloween', label: 'Halloween', group: 'style' },
  { slug: 'vibrant', label: 'Vibrant', group: 'style' },

  // Base colours
  { slug: 'red', label: 'Red', group: 'color' },
  { slug: 'orange', label: 'Orange', group: 'color' },
  { slug: 'yellow', label: 'Yellow', group: 'color' },
  { slug: 'green', label: 'Green', group: 'color' },
  { slug: 'turquoise', label: 'Turquoise', group: 'color' },
  { slug: 'blue', label: 'Blue', group: 'color' },
  { slug: 'purple', label: 'Purple', group: 'color' },
  { slug: 'pink', label: 'Pink', group: 'color' },
  { slug: 'white', label: 'White', group: 'color' },
  { slug: 'gray', label: 'Gray', group: 'color' },
  { slug: 'black', label: 'Black', group: 'color' },
];

const KNOWN_TAGS = new Set(TAG_CATALOG.map((t) => t.slug));

/* ==========================================================================
 * 8. WRITING THE CHUNKS
 * ========================================================================== */

/**
 * A palette is stored as a compact tuple rather than a keyed object:
 *   [id, "aabbcc", "ddeeff", "112233", "445566"]
 * Across 100k palettes that saves roughly 40% of the JSON size.
 */
async function writeFeed(dir, rows, chunkSize) {
  await mkdir(dir, { recursive: true });
  const chunks = Math.max(1, Math.ceil(rows.length / chunkSize));

  for (let i = 0; i < chunks; i += 1) {
    const slice = rows.slice(i * chunkSize, (i + 1) * chunkSize);
    await writeFile(join(dir, `${i + 1}.json`), JSON.stringify(slice), 'utf8');
  }
  return chunks;
}

/* ==========================================================================
 * 9. MAIN
 * ========================================================================== */

async function main() {
  const started = Date.now();
  const { count, chunk, out } = ARGS;

  console.log(`\n🎨  Generating ${count.toLocaleString('en-US')} palettes (seed=${ARGS.seed})\n`);

  /* --- 9.1 Generation with deduplication --------------------------------- */
  const seen = new Set();
  const palettes = [];
  let attempts = 0;
  const maxAttempts = count * 30;

  while (palettes.length < count && attempts < maxAttempts) {
    attempts += 1;
    const { colors, mood } = makePalette();

    const key = colors.join('');
    if (seen.has(key)) continue;
    if (!isDistinct(colors)) continue;

    seen.add(key);
    palettes.push({ colors, tags: deriveTags(colors, mood).filter((t) => KNOWN_TAGS.has(t)) });

    if (palettes.length % 25_000 === 0) {
      console.log(`   … ${palettes.length.toLocaleString('ru-RU')}`);
    }
  }

  if (palettes.length < count) {
    console.warn(`⚠️  Only produced ${palettes.length} unique palettes in ${attempts} attempts.`);
  }

  /* --- 9.2 Shuffle, then assign ids -------------------------------------- */
  // Generation runs preset by preset, so without a shuffle the New feed would
  // arrive visually grouped by mood. Shuffle first, number second.
  for (let i = palettes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [palettes[i], palettes[j]] = [palettes[j], palettes[i]];
  }
  palettes.forEach((p, i) => {
    p.id = i + 1;
  });

  /* --- 9.3 Rebuild the data directory from scratch ----------------------
   * Best effort: on some filesystems (network or mounted volumes) unlink may
   * be denied. Not critical — meta.json declares the current chunk count, so
   * leftovers from earlier runs are simply never requested.
   */
  try {
    await rm(out, { recursive: true, force: true });
  } catch (error) {
    console.warn(`⚠️  Could not clear ${out} (${error.code}). Files will be overwritten in place.`);
  }
  await mkdir(out, { recursive: true });

  /* --- 9.4 New feed: ids descending, freshest first ---------------------- */
  const newRows = [...palettes].reverse().map((p) => [p.id, ...p.colors]);
  const newChunks = await writeFeed(join(out, 'new'), newRows, chunk);
  console.log(`\n📦  new/           → ${newChunks} chunk(s)`);

  /* --- 9.5 Tag shards ----------------------------------------------------- */
  const byTag = new Map(TAG_CATALOG.map((t) => [t.slug, []]));
  for (const p of palettes) {
    for (const tag of p.tags) byTag.get(tag)?.push(p);
  }

  const tagsMeta = [];
  for (const tag of TAG_CATALOG) {
    const bucket = byTag.get(tag.slug) ?? [];
    if (bucket.length === 0) {
      console.warn(`⚠️  Tag "${tag.slug}" is empty — skipped.`);
      continue;
    }
    const rows = [...bucket].reverse().map((p) => [p.id, ...p.colors]);
    const chunks = await writeFeed(join(out, 'tag', tag.slug), rows, chunk);
    tagsMeta.push({ ...tag, count: bucket.length, chunks });
  }

  console.log(`🏷️   tag/           → ${tagsMeta.length} tag(s)`);

  /* --- 9.6 Manifest ------------------------------------------------------- */
  // The palette date is derived deterministically from the id on the client:
  //   ts = latestTs - (total - id) * stepMs
  // Storing a date per record would be pointless bytes across 100k rows.
  const meta = {
    version: 1,
    generatedAt: new Date().toISOString(),
    seed: ARGS.seed,
    total: palettes.length,
    chunkSize: chunk,
    latestTs: Date.now(),
    stepMs: 25 * 60 * 1000, // ~25 min apart, so 100k spans about 4.7 years
    feeds: { new: { chunks: newChunks } },
    tags: tagsMeta,
  };
  await writeFile(join(out, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  /* --- 9.7 Report --------------------------------------------------------- */
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n✅  Done: ${palettes.length.toLocaleString('en-US')} palettes in ${seconds}s`);
  console.log(`    Directory: ${out}\n`);

  const top = [...tagsMeta].sort((a, b) => b.count - a.count).slice(0, 12);
  console.log('    Top tags:');
  for (const t of top) {
    console.log(`      ${t.label.padEnd(12)} ${String(t.count).padStart(7)}`);
  }
  console.log('');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
