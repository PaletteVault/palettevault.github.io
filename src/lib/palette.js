/**
 * ============================================================================
 *  PALETTE UTILITIES: SLUG AND COLOR CONVERSIONS
 * ============================================================================
 *
 *  The addressing scheme rests on one idea: a slug is four HEX codes in a row.
 *
 *      /palette/4e1f6e3e3e7545a9a998e8de/
 *                └────┘└────┘└────┘└────┘
 *                4e1f6e 3e3e75 45a9a9 98e8de
 *
 *  That gives the URL an important property: it is self-contained. The palette
 *  page needs no chunk request and no id, because everything is already in the
 *  address. One HTML file can therefore serve any of hundreds of thousands of
 *  palettes, rendering from `location.pathname`.
 * ============================================================================
 */

const HEX_RE = /^[0-9a-f]{6}$/;

/* ==========================================================================
 * SLUG
 * ========================================================================== */

/** Four HEX values without '#' -> a 24-character slug. */
export function paletteSlug(colors) {
  return colors.map((hex) => String(hex).replace(/[^0-9a-fA-F]/g, '').toLowerCase()).join('');
}

/**
 * Slug -> four HEX values without '#'. Returns null for an invalid slug.
 * Tolerates a leading '#' and upper case, in case the address was edited
 * by hand.
 */
export function parseSlug(slug) {
  const clean = String(slug ?? '').replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (clean.length !== 24) return null;

  const colors = [0, 1, 2, 3].map((i) => clean.slice(i * 6, i * 6 + 6));
  return colors.every((hex) => HEX_RE.test(hex)) ? colors : null;
}

/** Path to the palette page. */
export function palettePath(colors) {
  return `/palette/${paletteSlug(colors)}/`;
}

/* ==========================================================================
 * CONVERSIONS
 * ========================================================================== */

/** '4e1f6e' -> { r, g, b } (0..255) */
export function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/** '4e1f6e' -> { h, s, l } (degrees and percentages, rounded) */
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;

  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta > 1e-6) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === rf) h = ((gf - bf) / delta + (gf < bf ? 6 : 0)) * 60;
    else if (max === gf) h = ((bf - rf) / delta + 2) * 60;
    else h = ((rf - gf) / delta + 4) * 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** WCAG relative luminance — used to pick readable text over a swatch. */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Whether the color is dark, i.e. whether it needs light text on top. */
export function isDark(hex) {
  return luminance(hex) < 0.45;
}

/** WCAG contrast ratio between two colors (1..21). */
export function contrastRatio(hexA, hexB) {
  const a = luminance(hexA);
  const b = luminance(hexB);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/* ==========================================================================
 * HUMAN-READABLE COLOR DESCRIPTION
 *
 * No attempt at inventing evocative names — that always reads as nonsense.
 * Instead a plain description from three parts: lightness, saturation, hue.
 * For example "Deep muted violet" or "Light vivid orange".
 * ========================================================================== */

const HUE_NAMES = [
  [15, 'red'],
  [45, 'orange'],
  [68, 'yellow'],
  [100, 'lime'],
  [155, 'green'],
  [195, 'cyan'],
  [220, 'azure'],
  [255, 'blue'],
  [280, 'violet'],
  [310, 'purple'],
  [340, 'magenta'],
  [360, 'red'],
];

/* ==========================================================================
 * PALETTE NAME
 *
 * The name is a pure function of the four colors, exactly like the slug.
 * So it never has to be stored in the chunks (saving ~2 MB across 100k
 * palettes) and the palette page can name itself without fetching anything.
 *
 * The scheme is deliberately plain: the adjective comes from lightness and
 * saturation, the noun from the dominant hue. Neither aims for poetry, but
 * neither produces gibberish either.
 * ========================================================================== */

/** Nouns by hue family. */
const NOUNS = {
  red: ['Ember', 'Poppy', 'Cherry', 'Brick', 'Garnet', 'Chili', 'Rust', 'Cardinal'],
  orange: ['Amber', 'Apricot', 'Clay', 'Marmalade', 'Copper', 'Tangerine', 'Ochre', 'Peach'],
  yellow: ['Honey', 'Straw', 'Mustard', 'Saffron', 'Butter', 'Wheat', 'Lemon', 'Brass'],
  lime: ['Fern', 'Olive', 'Sprout', 'Moss', 'Pear', 'Meadow', 'Chartreuse', 'Basil'],
  green: ['Pine', 'Jade', 'Clover', 'Forest', 'Sage', 'Emerald', 'Ivy', 'Juniper'],
  cyan: ['Lagoon', 'Mint', 'Teal', 'Reef', 'Aqua', 'Seafoam', 'Turquoise', 'Spray'],
  azure: ['Harbor', 'Sky', 'Glacier', 'Tide', 'Denim', 'Marine', 'Frost', 'Bay'],
  blue: ['Cobalt', 'Indigo', 'Sapphire', 'Ocean', 'Midnight', 'Ink', 'Steel', 'Horizon'],
  violet: ['Iris', 'Lilac', 'Amethyst', 'Dusk', 'Wisteria', 'Orchid', 'Thistle', 'Twilight'],
  purple: ['Plum', 'Mulberry', 'Velvet', 'Aubergine', 'Fig', 'Grape', 'Heather', 'Nightshade'],
  magenta: ['Fuchsia', 'Rose', 'Blossom', 'Peony', 'Raspberry', 'Petal', 'Camellia', 'Bloom'],
  neutral: ['Stone', 'Ash', 'Linen', 'Slate', 'Pebble', 'Smoke', 'Chalk', 'Granite'],
};

/** Adjectives by lightness and saturation. */
const ADJECTIVES = {
  pale: ['Pale', 'Soft', 'Powdered', 'Airy', 'Whispered', 'Faded', 'Hushed', 'Milky'],
  light: ['Light', 'Bright', 'Sunlit', 'Clear', 'Fresh', 'Open', 'Crisp', 'Morning'],
  vivid: ['Vivid', 'Electric', 'Bold', 'Loud', 'Neon', 'Punchy', 'Radiant', 'Hot'],
  muted: ['Muted', 'Dusty', 'Weathered', 'Quiet', 'Worn', 'Faded', 'Vintage', 'Washed'],
  deep: ['Deep', 'Rich', 'Dark', 'Shadowed', 'Late', 'Heavy', 'Velvet', 'Smoked'],
};

/** Hue family for an HSL angle. */
function hueFamily(h) {
  return HUE_NAMES.find(([limit]) => h < limit)?.[1] ?? 'red';
}

/**
 * Deterministic 32-bit string hash (FNV-1a).
 * Lets two palettes with the same character pick different words, while the
 * same palette always resolves to the same name.
 */
function hash(text) {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/**
 * Palette name, for example "Dusty Harbor" or "Deep Aubergine".
 * @param {string[]} colors four HEX values without '#'
 */
export function paletteName(colors) {
  if (!Array.isArray(colors) || colors.length !== 4) return 'Palette';

  const hsls = colors.map(hexToHsl);
  const avgL = hsls.reduce((sum, c) => sum + c.l, 0) / 4;
  const avgS = hsls.reduce((sum, c) => sum + c.s, 0) / 4;

  /* --- Dominant hue ------------------------------------------------------
   * Only visibly colored swatches vote, and a vote weighs more the more
   * saturated it is. Otherwise a palette of three greyish tones and one vivid
   * accent would be named after the grey.
   */
  const votes = new Map();
  for (const { h, s, l } of hsls) {
    if (s < 12 || l < 6 || l > 96) continue;
    const family = hueFamily(h);
    votes.set(family, (votes.get(family) ?? 0) + s);
  }

  const dominant = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral';

  /* --- Character ---------------------------------------------------------- */
  let mood;
  if (avgL >= 82) mood = 'pale';
  else if (avgS >= 72 && avgL >= 45) mood = 'vivid';
  else if (avgL <= 38) mood = 'deep';
  else if (avgS <= 34) mood = 'muted';
  else mood = 'light';

  /* --- Word selection ------------------------------------------------------ */
  const seed = hash(colors.join(''));
  const adjectives = ADJECTIVES[mood];
  const nouns = NOUNS[dominant] ?? NOUNS.neutral;

  // Different bits of the hash drive the adjective and the noun; sharing them
  // correlates the two and makes some combinations unreachable.
  const adjective = adjectives[seed % adjectives.length];
  const noun = nouns[(seed >>> 8) % nouns.length];

  return `${adjective} ${noun}`;
}

export function describeColor(hex) {
  const { h, s, l } = hexToHsl(hex);

  if (l >= 96) return 'White';
  if (l <= 5) return 'Black';
  if (s <= 8) {
    if (l >= 75) return 'Light grey';
    if (l <= 30) return 'Dark grey';
    return 'Grey';
  }

  const lightness = l >= 80 ? 'Pale' : l >= 62 ? 'Light' : l >= 38 ? '' : l >= 20 ? 'Deep' : 'Dark';
  const saturation = s >= 80 ? 'vivid' : s >= 45 ? '' : 'muted';
  const hue = HUE_NAMES.find(([limit]) => h < limit)?.[1] ?? 'red';

  const words = [lightness, saturation, hue].filter(Boolean);
  const phrase = words.join(' ');
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
