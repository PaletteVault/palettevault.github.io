/**
 * ============================================================================
 *  OKLCH PICKER & CONVERTER
 * ============================================================================
 *
 *  Three sliders, lightness, chroma, hue, plus a text field that accepts any
 *  CSS color, and a panel of the same color written every other way.
 *
 *  The design problem this tool exists to solve is that chroma has no fixed
 *  maximum. Unlike HSL saturation, `0.2` is a perfectly ordinary chroma for a
 *  mid blue and an impossible one for a pale yellow, because the sRGB solid is
 *  a lopsided shape in OKLCH whose edge moves with both lightness and hue.
 *  A slider that runs 0..0.4 with no other information is therefore mostly
 *  dead travel, and the user has no way to know where the useful part ended.
 *
 *  So every slider track is drawn as the actual colors it would produce, and
 *  the chroma track carries markers at the point where the color leaves sRGB
 *  and where it leaves Display P3. Nothing is silently clamped: going past the
 *  marker is allowed, and the tool tells you what fallback you will need.
 * ============================================================================
 */

import {
  hexToOklch,
  oklchToHex,
  parseColor,
  findGamut,
  inGamutOf,
  maxChroma,
  formatOklchParts,
  formatDisplayP3,
  formatLab,
  formatLch,
  GAMUT_LABELS,
} from '../oklch.js';
import { copyWithToast } from '../clipboard.js';

/** Where the chroma slider ends. Past this nothing is displayable anywhere. */
const CHROMA_MAX = 0.4;

/** Stops per gradient track. Enough to look continuous, cheap enough to redraw. */
const TRACK_STOPS = 32;

const state = { L: 0.7, C: 0.15, h: 250, alpha: 1 };

/** Set once at start-up: does this browser understand oklch() at all? */
let supportsOklch = false;
/** And is the screen actually wide-gamut, or are we describing colors it cannot show? */
let wideScreen = false;

/* -------------------------------------------------------------------------- */
/*  Rendering                                                                 */
/* -------------------------------------------------------------------------- */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * A CSS color for the current state, preferring oklch() so wide-gamut screens
 * get the real thing and only falling back to a mapped hex where they must.
 */
function cssColor(L, C, h, alpha = 1) {
  if (supportsOklch) return formatOklchParts(L, C, h, alpha);
  const hex = `#${oklchToHex(L, C, h)}`;
  return alpha >= 1 ? hex : `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Build a gradient across one axis, holding the other two.
 *
 * Out-of-gamut stops are gamut-mapped rather than skipped, which is what the
 * browser would do anyway, the markers are what communicate the boundary.
 */
function trackGradient(axis) {
  const stops = [];
  for (let i = 0; i < TRACK_STOPS; i += 1) {
    const t = i / (TRACK_STOPS - 1);
    let L = state.L;
    let C = state.C;
    let h = state.h;

    if (axis === 'L') L = t;
    else if (axis === 'C') C = t * CHROMA_MAX;
    else h = t * 360;

    stops.push(`${cssColor(L, C, h)} ${(t * 100).toFixed(1)}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

/**
 * Position the gamut-boundary markers on the chroma track.
 *
 * At some lightness/hue combinations sRGB and P3 give the same headroom, or
 * the color is out of gamut at every chroma including zero. Both cases hide
 * the marker rather than parking it at 0 where it would read as a real edge.
 */
function renderChromaMarkers(root) {
  const srgbEdge = maxChroma(state.L, state.h, 'srgb');
  const p3Edge = maxChroma(state.L, state.h, 'p3');

  /*
   * At the very top and bottom of the lightness range the maths reports real
   * chroma headroom, Oklab at L=0 admits tiny positive channel values, so
   * `maxChroma` returns about 0.1 for black, but every color along that
   * track is black or white to look at. Marking a boundary a quarter of the
   * way along a uniformly black track states something untrue.
   *
   * So the test is whether the edge color is actually distinguishable from
   * the same color at zero chroma. An exact hex comparison is not enough
   * (black vs #010000 differs, and is still black); a few 8-bit levels is the
   * point where a difference becomes visible at all.
   */
  const flat = oklchToHex(state.L, 0, state.h);
  const edge = oklchToHex(state.L, srgbEdge, state.h);
  const spread = Math.max(
    ...[0, 2, 4].map((i) =>
      Math.abs(parseInt(flat.slice(i, i + 2), 16) - parseInt(edge.slice(i, i + 2), 16))));
  const degenerate = spread < 4;

  const place = (selector, value, show) => {
    const el = root.querySelector(selector);
    if (!el) return;
    el.hidden = !show;
    el.style.left = `${clamp((value / CHROMA_MAX) * 100, 0, 100)}%`;
  };

  place(
    '[data-mark="srgb"]',
    srgbEdge,
    !degenerate && srgbEdge > 0.001 && srgbEdge < CHROMA_MAX);
  place(
    '[data-mark="p3"]',
    p3Edge,
    !degenerate && p3Edge > 0.001 && p3Edge < CHROMA_MAX && p3Edge - srgbEdge > 0.004);
}

/** The output rows, in the order someone is most likely to want them. */
function formats() {
  const { L, C, h, alpha } = state;
  const hex = oklchToHex(L, C, h);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const inSrgb = inGamutOf(L, C, h, 'srgb');

  // HSL from the mapped sRGB value, since HSL cannot express anything else.
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const light = (max + min) / 2;
  const delta = max - min;
  const sat = delta === 0 ? 0 : delta / (1 - Math.abs(2 * light - 1));
  let hue = 0;
  if (delta !== 0) {
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    if (max === rr) hue = ((gg - bb) / delta) % 6;
    else if (max === gg) hue = (bb - rr) / delta + 2;
    else hue = (rr - gg) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }

  const alphaSuffix = alpha >= 1 ? '' : ` / ${Number(alpha.toFixed(3))}`;
  const hexOut = alpha >= 1
    ? `#${hex}`
    : `#${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

  return [
    { label: 'OKLCH', value: formatOklchParts(L, C, h, alpha), primary: true },
    {
      label: 'HEX',
      value: hexOut,
      note: inSrgb ? null : 'closest sRGB, chroma reduced',
    },
    {
      label: 'RGB',
      value: alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b}${alphaSuffix})`,
      note: inSrgb ? null : 'clipped to sRGB',
    },
    {
      label: 'HSL',
      value: `hsl(${hue.toFixed(1)} ${(sat * 100).toFixed(1)}% ${(light * 100).toFixed(1)}%${alphaSuffix})`,
      note: inSrgb ? null : 'clipped to sRGB',
    },
    { label: 'Display P3', value: formatDisplayP3(L, C, h, alpha) },
    { label: 'CIE Lab', value: formatLab(L, C, h, alpha) },
    { label: 'CIE LCH', value: formatLch(L, C, h, alpha) },
  ];
}

/**
 * The gamut verdict.
 *
 * Reported as three independent checks rather than one hierarchy, because the
 * three gamuts are not nested: P3 is wider than sRGB, but a few deep P3 reds
 * lie outside Rec. 2020 rather than inside it.
 */
function renderGamut(root) {
  const { L, C, h } = state;
  const narrowest = findGamut(L, C, h);

  const badge = root.querySelector('[data-gamut-badge]');
  if (badge) {
    badge.textContent = narrowest === 'none'
      ? 'Not displayable'
      : `Fits ${GAMUT_LABELS[narrowest]}`;
    badge.dataset.level = narrowest;
  }

  root.querySelectorAll('[data-gamut-check]').forEach((el) => {
    const fits = inGamutOf(L, C, h, el.dataset.gamutCheck);
    el.dataset.fits = String(fits);
    const mark = el.querySelector('[data-gamut-mark]');
    if (mark) mark.textContent = fits ? 'yes' : 'no';
  });

  const advice = root.querySelector('[data-gamut-advice]');
  if (!advice) return;

  if (narrowest === 'srgb') {
    advice.textContent =
      'Every screen can show this color, so no fallback declaration is needed, '
      + 'only a fallback for browsers that predate oklch() itself.';
  } else if (narrowest === 'none') {
    advice.textContent =
      'No current display can reproduce this. It is still a valid OKLCH value, '
      + 'but every browser will gamut-map it, so what you see is an approximation.';
  } else {
    advice.textContent =
      `This is outside sRGB and needs a fallback: put the HEX value first, then `
      + `override it inside @supports (color: oklch(0% 0 0)). On an sRGB screen `
      + `you are seeing a mapped approximation${wideScreen ? '' : ', which this display cannot distinguish from the real value'}.`;
  }
}

function render(root) {
  const { L, C, h, alpha } = state;

  // Sliders and their number twins.
  const set = (name, value, digits) => {
    root.querySelectorAll(`[data-axis="${name}"]`).forEach((el) => {
      if (el.matches(':focus') && el.type === 'number') return;
      el.value = digits === undefined ? value : Number(value.toFixed(digits));
    });
  };
  set('L', L * 100, 2);
  set('C', C, 4);
  set('h', h, 2);
  set('alpha', alpha, 3);

  // Tracks.
  const paint = (axis) => {
    const el = root.querySelector(`[data-track="${axis}"]`);
    if (el) el.style.backgroundImage = trackGradient(axis);
  };
  paint('L');
  paint('C');
  paint('h');

  const alphaTrack = root.querySelector('[data-track="alpha"]');
  if (alphaTrack) {
    alphaTrack.style.backgroundImage =
      `linear-gradient(to right, ${cssColor(L, C, h, 0)}, ${cssColor(L, C, h, 1)})`;
  }

  renderChromaMarkers(root);

  // Preview.
  const preview = root.querySelector('[data-preview]');
  if (preview) {
    preview.style.setProperty('--swatch', cssColor(L, C, h, alpha));
    // Label contrast: OKLCH lightness is perceptual, so the midpoint is a
    // reliable switch in a way an sRGB luminance threshold is not.
    preview.dataset.dark = String(L < 0.6);
  }

  const value = root.querySelector('[data-preview-value]');
  if (value) value.textContent = formatOklchParts(L, C, h, alpha);

  // Formats.
  const list = root.querySelector('[data-formats]');
  if (list) {
    list.replaceChildren(
      ...formats().map(({ label, value: text, note, primary }) => {
        const li = document.createElement('li');
        li.className = 'okl-format';
        if (primary) li.dataset.primary = 'true';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'okl-format__button';
        button.title = `Copy ${label} value`;
        button.addEventListener('click', () => copyWithToast(text, label));

        const name = document.createElement('span');
        name.className = 'okl-format__label';
        name.textContent = label;

        const code = document.createElement('code');
        code.className = 'okl-format__value';
        code.textContent = text;

        button.append(name, code);
        li.append(button);

        if (note) {
          const warn = document.createElement('span');
          warn.className = 'okl-format__note';
          warn.textContent = note;
          li.append(warn);
        }
        return li;
      }));
  }

  renderGamut(root);

  const input = root.querySelector('[data-input]');
  if (input && document.activeElement !== input) {
    input.value = formatOklchParts(L, C, h, alpha);
  }

  writeHash();
}

/* -------------------------------------------------------------------------- */
/*  State plumbing                                                            */
/* -------------------------------------------------------------------------- */

let hashLock = false;

/**
 * Mirror the color into the URL so it can be shared or bookmarked.
 *
 * replaceState rather than pushState: dragging a slider would otherwise bury
 * the back button under hundreds of history entries.
 */
function writeHash() {
  hashLock = true;
  const { L, C, h, alpha } = state;
  const hash = `#${[
    Number((L * 100).toFixed(2)),
    Number(C.toFixed(4)),
    Number(h.toFixed(2)),
    Number(alpha.toFixed(3)),
  ].join(',')}`;
  history.replaceState(null, '', hash);
  // The hashchange event fires asynchronously, so the guard has to outlive
  // this call rather than being cleared at the end of it.
  setTimeout(() => { hashLock = false; }, 0);
}

function readHash() {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return false;

  // Either our own compact form, or a pasted oklch() string.
  const compact = raw.split(',').map(Number);
  if (compact.length >= 3 && compact.every((n) => Number.isFinite(n))) {
    state.L = clamp(compact[0] / 100, 0, 1);
    state.C = clamp(compact[1], 0, CHROMA_MAX);
    state.h = ((compact[2] % 360) + 360) % 360;
    state.alpha = compact.length > 3 ? clamp(compact[3], 0, 1) : 1;
    return true;
  }

  const parsed = parseColor(decodeURIComponent(raw));
  if (!parsed) return false;
  Object.assign(state, {
    L: parsed.L,
    C: clamp(parsed.C, 0, CHROMA_MAX),
    h: parsed.h,
    alpha: parsed.alpha ?? 1,
  });
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Wiring                                                                    */
/* -------------------------------------------------------------------------- */

export function initOklch() {
  const root = document.querySelector('[data-oklch-tool]');
  if (!root) return;

  supportsOklch = typeof CSS !== 'undefined'
    && CSS.supports?.('color', 'oklch(50% 0.1 200)');
  wideScreen = window.matchMedia?.('(color-gamut: p3)').matches ?? false;

  // Tell the user what their own screen can do, the gamut advice is much less
  // useful if they do not know which side of it they are sitting on.
  const screenNote = root.querySelector('[data-screen-note]');
  if (screenNote) {
    screenNote.textContent = wideScreen
      ? 'Your display reports wide-gamut (P3) support, so colors outside sRGB should look genuinely more saturated here.'
      : 'Your display reports sRGB only, so colors outside sRGB will look identical to their mapped fallback on this screen.';
  }
  if (!supportsOklch) {
    const warn = root.querySelector('[data-support-warning]');
    if (warn) warn.hidden = false;
  }

  if (!readHash()) {
    // A pleasant default rather than black, and one that is comfortably in
    // gamut so the markers are visible straight away.
    Object.assign(state, hexToOklch('4f7cf0'), { alpha: 1 });
  }

  // Sliders and number fields share the data-axis hook.
  root.addEventListener('input', (event) => {
    const el = event.target;
    const axis = el.dataset?.axis;
    if (!axis) return;

    const value = parseFloat(el.value);
    if (!Number.isFinite(value)) return;

    if (axis === 'L') state.L = clamp(value / 100, 0, 1);
    else if (axis === 'C') state.C = clamp(value, 0, CHROMA_MAX);
    else if (axis === 'h') state.h = ((value % 360) + 360) % 360;
    else if (axis === 'alpha') state.alpha = clamp(value, 0, 1);

    render(root);
  });

  // Free-text input: parse on Enter or blur, not on every keystroke, so a
  // half-typed value does not fight the field for control of the caret.
  const input = root.querySelector('[data-input]');
  const commit = () => {
    const parsed = parseColor(input.value);
    if (!parsed) {
      input.dataset.invalid = 'true';
      return;
    }
    delete input.dataset.invalid;
    Object.assign(state, {
      L: parsed.L,
      C: clamp(parsed.C, 0, CHROMA_MAX),
      h: parsed.h,
      alpha: parsed.alpha ?? 1,
    });
    render(root);
  };
  input?.addEventListener('change', commit);
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    }
  });
  input?.addEventListener('input', () => delete input.dataset.invalid);

  // Native picker, for people who would rather point than type.
  const native = root.querySelector('[data-native]');
  native?.addEventListener('input', () => {
    Object.assign(state, hexToOklch(native.value.replace('#', '')));
    render(root);
  });
  const syncNative = () => {
    if (native) native.value = `#${oklchToHex(state.L, state.C, state.h)}`;
  };

  // "Pull into gamut", the one place we do modify the color, on request.
  root.querySelectorAll('[data-fit]').forEach((button) => {
    button.addEventListener('click', () => {
      state.C = Math.min(state.C, maxChroma(state.L, state.h, button.dataset.fit));
      render(root);
      syncNative();
    });
  });

  root.querySelector('[data-random]')?.addEventListener('click', () => {
    state.h = Math.random() * 360;
    state.L = 0.35 + Math.random() * 0.5;
    state.C = maxChroma(state.L, state.h, 'srgb') * (0.4 + Math.random() * 0.6);
    state.alpha = 1;
    render(root);
    syncNative();
  });

  window.addEventListener('hashchange', () => {
    if (hashLock) return;
    if (readHash()) {
      render(root);
      syncNative();
    }
  });

  render(root);
  syncNative();
}
