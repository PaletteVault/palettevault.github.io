/**
 * ============================================================================
 *  PALETTE GENERATOR TOOL
 * ============================================================================
 *
 *  A live version of the offline generator: same OKLCH harmony schemes and
 *  lightness ramps, but driven by the visitor instead of a seeded RNG.
 *
 *  Locking is the feature that makes it usable — you keep the one shade that
 *  works and reroll the rest, rather than hunting for four good colors at once.
 * ============================================================================
 */

import { copyWithToast, showToast } from '../clipboard.js';
import { hexToOklch, oklchToHex } from '../oklch.js';
import { isDark, palettePath, paletteName } from '../palette.js';

const SCHEMES = {
  analogous: { label: 'Analogous', offsets: () => [-28, -12, 12, 28] },
  monochrome: { label: 'Monochrome', offsets: () => [0, 0, 0, 0] },
  complementary: { label: 'Complementary', offsets: () => [0, 14, 180, 194] },
  split: { label: 'Split complementary', offsets: () => [0, 16, 150, 210] },
  triad: { label: 'Triad', offsets: () => [0, 120, 240, 16] },
  tetrad: { label: 'Tetrad', offsets: () => [0, 90, 180, 270] },
};

const state = {
  scheme: 'analogous',
  base: '3b82f6',
  locked: [false, false, false, false],
  colors: ['3b82f6', '3b82f6', '3b82f6', '3b82f6'],
};

const rand = (min, max) => min + Math.random() * (max - min);

/**
 * Build four colors around a base hue.
 * Lightness walks a ramp rather than being random per swatch, so the result
 * always has a readable light-to-dark structure.
 */
function build() {
  const { h: baseHue, C: baseChroma } = hexToOklch(state.base);
  const offsets = SCHEMES[state.scheme].offsets();

  const start = rand(0.32, 0.46);
  const end = rand(0.78, 0.9);

  return offsets.map((offset, index) => {
    if (state.locked[index]) return state.colors[index];

    const L = start + ((end - start) * index) / 3;
    const falloff = 1 - Math.pow(Math.abs(L - 0.62) / 0.62, 1.6);
    const C = Math.max(0.02, baseChroma * rand(0.7, 1.25)) * Math.max(0.35, falloff);
    const H = (baseHue + offset + rand(-6, 6) + 360) % 360;

    return oklchToHex(L, C, H);
  });
}

function render(root) {
  const list = root.querySelector('[data-generator-swatches]');

  list.innerHTML = state.colors
    .map((hex, index) => {
      const upper = `#${hex.toUpperCase()}`;
      const tone = isDark(hex) ? 'on-dark' : 'on-light';
      const locked = state.locked[index];

      return (
        `<div class="gen-swatch ${tone}" style="--swatch-bg:#${hex}">` +
          `<button type="button" class="gen-swatch__lock${locked ? ' is-locked' : ''}" ` +
          `data-lock="${index}" aria-pressed="${locked}" ` +
          `aria-label="${locked ? 'Unlock' : 'Lock'} ${upper}">` +
            `<svg viewBox="0 0 24 24" aria-hidden="true">` +
              `<rect x="5" y="11" width="14" height="10" rx="2"/>` +
              (locked
                ? `<path d="M8 11V7a4 4 0 0 1 8 0v4"/>`
                : `<path d="M8 11V7a4 4 0 0 1 7.5-2"/>`) +
            `</svg>` +
          `</button>` +
          `<button type="button" class="gen-swatch__hex" data-copy="${upper}">${upper}</button>` +
        `</div>`
      );
    })
    .join('');

  const name = paletteName(state.colors);
  root.querySelector('[data-generator-name]').textContent = name;
  root.querySelector('[data-generator-open]').href = palettePath(state.colors);
}

function reroll(root) {
  state.colors = build();
  render(root);
}

export function initGenerator() {
  const root = document.getElementById('generator');
  if (!root) return;

  const schemeSelect = root.querySelector('[data-generator-scheme]');
  const baseInput = root.querySelector('[data-generator-base]');

  schemeSelect.innerHTML = Object.entries(SCHEMES)
    .map(([id, { label }]) => `<option value="${id}">${label}</option>`)
    .join('');
  schemeSelect.value = state.scheme;
  baseInput.value = `#${state.base}`;

  schemeSelect.addEventListener('change', () => {
    state.scheme = schemeSelect.value;
    reroll(root);
  });

  baseInput.addEventListener('input', () => {
    state.base = baseInput.value.replace('#', '').toLowerCase();
    reroll(root);
  });

  root.addEventListener('click', async (event) => {
    const lock = event.target.closest('[data-lock]');
    if (lock) {
      const index = Number(lock.dataset.lock);
      state.locked[index] = !state.locked[index];
      render(root);
      return;
    }

    const copy = event.target.closest('[data-copy]');
    if (copy) {
      await copyWithToast(copy.dataset.copy);
      return;
    }

    if (event.target.closest('[data-generator-reroll]')) {
      reroll(root);
      return;
    }

    if (event.target.closest('[data-generator-copy-all]')) {
      await copyWithToast(
        state.colors.map((hex) => `#${hex.toUpperCase()}`).join(', '),
        'Palette',
      );
    }
  });

  // Spacebar rerolls, the way every generator of this kind works.
  // Ignored while typing so it does not fight with form fields.
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;

    event.preventDefault();
    reroll(root);
  });

  reroll(root);
  showToast('Press space to reroll', 2200);
}
