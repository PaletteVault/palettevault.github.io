/**
 * ============================================================================
 *  CONTRAST CHECKER
 * ============================================================================
 *
 *  Evaluates a foreground/background pair against WCAG 2.1 contrast minimums:
 *
 *    Normal text   AA 4.5:1    AAA 7:1
 *    Large text    AA 3:1      AAA 4.5:1     (>= 24px, or >= 18.66px bold)
 *    UI components AA 3:1                    (borders, icons, focus rings)
 *
 *  Also suggests the nearest passing foreground: failing a check is only half
 *  the answer, the useful part is knowing how far you have to move.
 * ============================================================================
 */

import { copyWithToast } from '../clipboard.js';
import { contrastRatio, luminance } from '../palette.js';
import { hexToOklch, oklchToHex } from '../oklch.js';

const LEVELS = [
  { id: 'aa-normal', label: 'AA · normal text', min: 4.5 },
  { id: 'aaa-normal', label: 'AAA · normal text', min: 7 },
  { id: 'aa-large', label: 'AA · large text', min: 3 },
  { id: 'aaa-large', label: 'AAA · large text', min: 4.5 },
  { id: 'aa-ui', label: 'AA · UI components', min: 3 },
];

const clean = (value) => String(value).replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6);

/**
 * Nearest foreground that clears `target`, found by walking lightness in
 * OKLCH while holding hue and chroma. That keeps the suggestion recognisably
 * the same colour instead of collapsing to plain black or white.
 */
function suggest(fg, bg, target) {
  if (contrastRatio(fg, bg) >= target) return null;

  const { C, h } = hexToOklch(fg);
  // Push away from the background: darken on light backgrounds, lighten on
  // dark ones. Going the other way usually cannot reach the target at all.
  const direction = luminance(bg) > 0.35 ? -1 : 1;
  const start = hexToOklch(fg).L;

  for (let step = 1; step <= 100; step += 1) {
    const L = start + direction * step * 0.01;
    if (L < 0 || L > 1) break;

    const candidate = oklchToHex(L, C, h);
    if (contrastRatio(candidate, bg) >= target) return candidate;
  }

  // Nothing on this hue works — fall back to whichever extreme passes.
  const black = contrastRatio('000000', bg);
  const white = contrastRatio('ffffff', bg);
  return black >= target || white >= target ? (black > white ? '000000' : 'ffffff') : null;
}

function render(root, fg, bg) {
  const ratio = contrastRatio(fg, bg);

  root.style.setProperty('--preview-fg', `#${fg}`);
  root.style.setProperty('--preview-bg', `#${bg}`);

  const score = root.querySelector('[data-contrast-ratio]');
  score.textContent = `${ratio.toFixed(2)}:1`;
  score.classList.toggle('is-fail', ratio < 4.5);
  score.classList.toggle('is-pass', ratio >= 4.5);

  root.querySelector('[data-contrast-levels]').innerHTML = LEVELS.map((level) => {
    const passes = ratio >= level.min;
    return (
      `<li class="level ${passes ? 'is-pass' : 'is-fail'}">` +
        `<span class="level__badge">${passes ? 'Pass' : 'Fail'}</span>` +
        `<span class="level__label">${level.label}</span>` +
        `<span class="level__min">${level.min}:1</span>` +
      `</li>`
    );
  }).join('');

  // Suggest against the strictest level currently failing.
  const failing = LEVELS.filter((level) => ratio < level.min).sort((a, b) => a.min - b.min)[0];
  const box = root.querySelector('[data-contrast-suggest]');

  if (!failing) {
    box.setAttribute('hidden', '');
    return;
  }

  const fixed = suggest(fg, bg, failing.min);
  if (!fixed) {
    box.setAttribute('hidden', '');
    return;
  }

  const upper = `#${fixed.toUpperCase()}`;
  box.innerHTML =
    `<span>Closest foreground that clears ${failing.min}:1 —</span> ` +
    `<button type="button" class="chip" data-copy="${upper}" style="--chip-bg:#${fixed}">` +
      `<span class="chip__dot"></span>${upper}` +
    `</button> ` +
    `<button type="button" class="action action--sm" data-contrast-apply="${fixed}">Apply</button>`;
  box.removeAttribute('hidden');
}

export function initContrast() {
  const root = document.getElementById('contrast');
  if (!root) return;

  const fgInput = root.querySelector('[data-contrast-fg]');
  const bgInput = root.querySelector('[data-contrast-bg]');
  const fgText = root.querySelector('[data-contrast-fg-text]');
  const bgText = root.querySelector('[data-contrast-bg-text]');

  const state = { fg: '2b2b2b', bg: 'ffffff' };

  function sync(source) {
    if (source !== 'fg-text') fgText.value = `#${state.fg.toUpperCase()}`;
    if (source !== 'bg-text') bgText.value = `#${state.bg.toUpperCase()}`;
    fgInput.value = `#${state.fg}`;
    bgInput.value = `#${state.bg}`;
    render(root, state.fg, state.bg);
  }

  fgInput.addEventListener('input', () => {
    state.fg = clean(fgInput.value);
    sync('fg');
  });
  bgInput.addEventListener('input', () => {
    state.bg = clean(bgInput.value);
    sync('bg');
  });
  fgText.addEventListener('input', () => {
    state.fg = clean(fgText.value);
    sync('fg-text');
  });
  bgText.addEventListener('input', () => {
    state.bg = clean(bgText.value);
    sync('bg-text');
  });

  root.addEventListener('click', async (event) => {
    if (event.target.closest('[data-contrast-swap]')) {
      [state.fg, state.bg] = [state.bg, state.fg];
      sync();
      return;
    }

    const apply = event.target.closest('[data-contrast-apply]');
    if (apply) {
      state.fg = apply.dataset.contrastApply;
      sync();
      return;
    }

    const copy = event.target.closest('[data-copy]');
    if (copy) await copyWithToast(copy.dataset.copy);
  });

  sync();
}
