/**
 * ============================================================================
 *  GRADIENT MAKER
 * ============================================================================
 *
 *  Compose a gradient from your own stops and copy the CSS.
 *
 *  The interpolation space matters more than it looks. A gradient between two
 *  saturated, opposing hues in sRGB dips through a washed-out middle, because
 *  sRGB interpolation cuts a straight line through a non-perceptual cube.
 *  Interpolating in OKLCH keeps chroma up across the whole ramp, so the tool
 *  previews both and lets you copy either.
 * ============================================================================
 */

import { copyWithToast, showToast } from '../clipboard.js';
import { mix } from '../oklch.js';
import { isDark } from '../palette.js';
import { formatOklch } from '../oklch.js';

const clean = (value) => String(value).replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6);

const state = {
  stops: [
    { hex: 'ff8a5c', pos: 0 },
    { hex: '5c6bff', pos: 100 },
  ],
  angle: 135,
  type: 'linear',
  space: 'srgb',
};

/**
 * CSS for the current gradient.
 * In OKLCH mode we hand the browser `in oklch` rather than baking in
 * intermediate stops: fewer bytes, and it stays smooth at any size.
 */
function toCss({ space = state.space } = {}) {
  const stops = [...state.stops]
    .sort((a, b) => a.pos - b.pos)
    .map((stop) =>
      space === 'oklch' ? `${formatOklch(stop.hex)} ${stop.pos}%` : `#${stop.hex} ${stop.pos}%`,
    )
    .join(', ');

  const interpolation = space === 'oklch' ? ' in oklch' : '';

  return state.type === 'radial'
    ? `radial-gradient(circle${interpolation}, ${stops})`
    : `linear-gradient(${state.angle}deg${interpolation}, ${stops})`;
}

/**
 * Preview for the sRGB variant is drawn with explicit sampled stops so both
 * previews render identically in browsers that do not support `in oklch` yet.
 */
function sampledCss() {
  const sorted = [...state.stops].sort((a, b) => a.pos - b.pos);
  const samples = [];

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const from = sorted[i];
    const to = sorted[i + 1];

    for (let step = 0; step <= 8; step += 1) {
      const t = step / 8;
      if (i > 0 && step === 0) continue; // avoid duplicating the shared stop
      samples.push(`#${mix(from.hex, to.hex, t)} ${(from.pos + (to.pos - from.pos) * t).toFixed(1)}%`);
    }
  }

  return state.type === 'radial'
    ? `radial-gradient(circle, ${samples.join(', ')})`
    : `linear-gradient(${state.angle}deg, ${samples.join(', ')})`;
}

function render(root) {
  root.querySelector('[data-gm-preview-srgb]').style.backgroundImage = toCss({ space: 'srgb' });
  root.querySelector('[data-gm-preview-oklch]').style.backgroundImage = sampledCss();

  root.querySelector('[data-gm-css]').textContent = toCss();

  root.querySelector('[data-gm-stops]').innerHTML = state.stops
    .map((stop, index) => {
      const upper = `#${stop.hex.toUpperCase()}`;
      const tone = isDark(stop.hex) ? 'on-dark' : 'on-light';
      return (
        `<li class="stop">` +
          `<span class="stop__chip ${tone}" style="--swatch-bg:#${stop.hex}"></span>` +
          `<input type="color" data-stop-color="${index}" value="#${stop.hex}" aria-label="Stop ${index + 1} color" />` +
          `<input type="text" class="input-hex" data-stop-hex="${index}" value="${upper}" spellcheck="false" aria-label="Stop ${index + 1} HEX" />` +
          `<input type="range" min="0" max="100" value="${stop.pos}" data-stop-pos="${index}" aria-label="Stop ${index + 1} position" />` +
          `<span class="stop__pos">${stop.pos}%</span>` +
          `<button type="button" class="action action--sm" data-stop-remove="${index}" ` +
          `${state.stops.length <= 2 ? 'disabled' : ''} aria-label="Remove stop ${index + 1}">✕</button>` +
        `</li>`
      );
    })
    .join('');
}

export function initGradientMaker() {
  const root = document.getElementById('gradient-maker');
  if (!root) return;

  const angle = root.querySelector('[data-gm-angle]');
  const angleOut = root.querySelector('[data-gm-angle-out]');
  const type = root.querySelector('[data-gm-type]');
  const space = root.querySelector('[data-gm-space]');

  angle.value = String(state.angle);
  angleOut.textContent = `${state.angle}°`;

  angle.addEventListener('input', () => {
    state.angle = Number(angle.value);
    angleOut.textContent = `${state.angle}°`;
    render(root);
  });

  type.addEventListener('change', () => {
    state.type = type.value;
    root.classList.toggle('is-radial', state.type === 'radial');
    render(root);
  });

  space.addEventListener('change', () => {
    state.space = space.value;
    render(root);
  });

  root.addEventListener('input', (event) => {
    const color = event.target.closest('[data-stop-color]');
    if (color) {
      state.stops[Number(color.dataset.stopColor)].hex = clean(color.value);
      render(root);
      return;
    }

    const hex = event.target.closest('[data-stop-hex]');
    if (hex) {
      state.stops[Number(hex.dataset.stopHex)].hex = clean(hex.value);
      // Re-rendering here would steal focus mid-typing, so update only the
      // preview and let the stop list refresh on the next structural change.
      root.querySelector('[data-gm-preview-srgb]').style.backgroundImage = toCss({ space: 'srgb' });
      root.querySelector('[data-gm-preview-oklch]').style.backgroundImage = sampledCss();
      root.querySelector('[data-gm-css]').textContent = toCss();
      return;
    }

    const pos = event.target.closest('[data-stop-pos]');
    if (pos) {
      state.stops[Number(pos.dataset.stopPos)].pos = Number(pos.value);
      render(root);
    }
  });

  root.addEventListener('click', async (event) => {
    const remove = event.target.closest('[data-stop-remove]');
    if (remove && state.stops.length > 2) {
      state.stops.splice(Number(remove.dataset.stopRemove), 1);
      render(root);
      return;
    }

    if (event.target.closest('[data-gm-add]')) {
      if (state.stops.length >= 6) {
        showToast('Six stops is plenty');
        return;
      }
      const sorted = [...state.stops].sort((a, b) => a.pos - b.pos);
      const last = sorted[sorted.length - 1];
      const first = sorted[0];
      const pos = Math.round((first.pos + last.pos) / 2);
      state.stops.push({ hex: mix(first.hex, last.hex, 0.5), pos });
      render(root);
      return;
    }

    if (event.target.closest('[data-gm-copy]')) {
      await copyWithToast(`background-image: ${toCss()};`, 'CSS');
      return;
    }

    if (event.target.closest('[data-gm-reverse]')) {
      state.stops = state.stops.map((stop) => ({ ...stop, pos: 100 - stop.pos }));
      render(root);
    }
  });

  render(root);
}
