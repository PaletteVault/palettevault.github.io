/**
 * ============================================================================
 *  SHADES, TINTS AND SCHEMES
 * ============================================================================
 *
 *  The derived colours a colour page shows: eleven steps towards black,
 *  eleven towards white, and the four classical hue relationships.
 *
 *  TWO DIFFERENT JOBS, TWO DIFFERENT SPACES
 *
 *  Shades and tints are computed in plain RGB. That is not an oversight. A
 *  shade is defined as a colour mixed with black and a tint as one mixed with
 *  white, and every tool that publishes such a ramp does the mix in RGB. Doing
 *  it in OKLCH would give a smoother looking ramp and a different set of hex
 *  values, which would make this page disagree with every other one about what
 *  the shades of a colour are. When the definition is arithmetic rather than
 *  perceptual, following the definition wins.
 *
 *  The schemes are the opposite case. There is no canonical list of "the
 *  triadic colours of #E38B2A": there is a rule, rotate the hue, and the
 *  answer depends on which space you rotate in. Rotating in HSL, which most
 *  tools do, moves through hues at an uneven rate, so a triad comes out with
 *  one member noticeably lighter than the others. Rotating in OKLCH keeps
 *  lightness and chroma steady, which is the entire argument this site makes
 *  elsewhere. So schemes are computed in OKLCH, and the page says so.
 * ============================================================================
 */

import { hexToRgb } from './palette.js';
import { hexToOklch, oklchToHex, maxChroma } from './oklch.js';

/** palette.js has no rgb to hex, and one line here beats widening its surface. */
const rgbToHex = (r, g, b) =>
  [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

const STEPS = 11;

/**
 * Eleven values from the colour to black.
 *
 * Truncating rather than rounding, which is what the published ramps do: the
 * difference is one unit on a channel here and there, and matching them costs
 * nothing.
 */
export function shades(hex, steps = STEPS) {
  const { r, g, b } = hexToRgb(hex);
  const out = [];

  for (let i = 0; i < steps; i += 1) {
    const factor = 1 - i / (steps - 1);
    out.push(
      rgbToHex(
        Math.floor(r * factor),
        Math.floor(g * factor),
        Math.floor(b * factor),
      ),
    );
  }

  return out;
}

/** Eleven values from the colour to white, by the same rule. */
export function tints(hex, steps = STEPS) {
  const { r, g, b } = hexToRgb(hex);
  const out = [];

  for (let i = 0; i < steps; i += 1) {
    const factor = i / (steps - 1);
    out.push(
      rgbToHex(
        Math.floor(r + (255 - r) * factor),
        Math.floor(g + (255 - g) * factor),
        Math.floor(b + (255 - b) * factor),
      ),
    );
  }

  return out;
}

/* ---------------------------------------------------------------- hues -- */

/**
 * The same colour with its hue turned, kept inside sRGB.
 *
 * Chroma is capped rather than clipped. A rotated hue often asks for more
 * chroma than sRGB can show, and clipping the channels afterwards shifts the
 * hue away from the one that was asked for, which is how a triad ends up not
 * being a triad. Searching for the highest chroma that fits keeps the angle.
 */
function rotate(hex, degrees) {
  const { L, C, h } = hexToOklch(hex);
  const turned = (((h + degrees) % 360) + 360) % 360;
  const ceiling = maxChroma(L, turned);
  return oklchToHex(L, Math.min(C, ceiling), turned);
}

/** Opposite on the wheel. */
export const complementary = (hex) => rotate(hex, 180);

/** Three points evenly spaced, the colour included. */
export const triadic = (hex) => [hex, rotate(hex, 120), rotate(hex, 240)];

/**
 * The colour and its two neighbours.
 *
 * Thirty degrees is the usual span. Wider stops reading as a related pair and
 * starts reading as two separate colours.
 */
export const analogous = (hex) => [hex, rotate(hex, 30), rotate(hex, -30)];

/**
 * Seven steps of lightness at one hue, the colour in the middle.
 *
 * Chroma is re-fitted at every step because the same chroma that fits a mid
 * lightness falls outside sRGB near the ends, and a monochrome ramp that
 * quietly desaturates at one end looks like a mistake in the ramp rather than
 * a limit of the screen.
 */
export function monochromatic(hex, steps = 7) {
  const { L, C, h } = hexToOklch(hex);
  const half = Math.floor(steps / 2);
  const span = 0.12;
  const out = [];

  for (let i = -half; i <= half; i += 1) {
    if (i === 0) {
      out.push(hex);
      continue;
    }
    const lightness = Math.min(0.98, Math.max(0.06, L + (i / half) * span * half));
    out.push(oklchToHex(lightness, Math.min(C, maxChroma(lightness, h)), h));
  }

  return out;
}

/** Everything a colour page shows under Color schemes, in one call. */
export function schemes(hex) {
  return {
    complementary: [hex, complementary(hex)],
    triadic: triadic(hex),
    analogous: analogous(hex),
    monochromatic: monochromatic(hex),
  };
}
