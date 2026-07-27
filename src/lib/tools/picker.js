/**
 * ============================================================================
 *  COLOR PICKER
 * ============================================================================
 *
 *  One color in, every representation out: HEX, RGB, HSL, OKLCH, plus a tint
 *  and shade ramp and the two nearest text colors that meet contrast.
 *
 *  The ramp walks lightness in OKLCH rather than mixing towards white/black in
 *  sRGB, which is why the mid-tones stay saturated instead of going chalky.
 * ============================================================================
 */

import { copyWithToast } from '../clipboard.js';
import { contrastRatio, describeColor, hexToHsl, hexToRgb, isDark } from '../palette.js';
import { formatOklch, ramp } from '../oklch.js';

const clean = (value) => String(value).replace(/[^0-9a-fA-F]/g, '').padEnd(6, '0').slice(0, 6);

function formats(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = hexToHsl(hex);

  return [
    { label: 'HEX', value: `#${hex.toUpperCase()}` },
    { label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
    { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
    { label: 'OKLCH', value: formatOklch(hex) },
    { label: 'CSS var', value: `--color: #${hex};` },
  ];
}

function render(root, hex) {
  root.style.setProperty('--picker-bg', `#${hex}`);
  root.querySelector('[data-picker-preview]').className =
    `picker__preview ${isDark(hex) ? 'on-dark' : 'on-light'}`;
  root.querySelector('[data-picker-name]').textContent = describeColor(hex);

  root.querySelector('[data-picker-formats]').innerHTML = formats(hex)
    .map(
      ({ label, value }) =>
        `<li class="format">` +
          `<span class="format__label">${label}</span>` +
          `<code class="format__value">${value}</code>` +
          `<button type="button" class="action action--sm" data-copy="${value}">Copy</button>` +
        `</li>`,
    )
    .join('');

  root.querySelector('[data-picker-ramp]').innerHTML = ramp(hex, 11)
    .map((shade, index) => {
      const upper = `#${shade.toUpperCase()}`;
      const tone = isDark(shade) ? 'on-dark' : 'on-light';
      const step = index === 0 ? 50 : index * 100;
      return (
        `<button type="button" class="ramp__step ${tone}" style="--swatch-bg:#${shade}" ` +
        `data-copy="${upper}" title="Copy ${upper}">` +
          `<span class="ramp__index">${step}</span>` +
          `<span class="ramp__hex">${upper}</span>` +
        `</button>`
      );
    })
    .join('');

  const onWhite = contrastRatio(hex, 'ffffff');
  const onBlack = contrastRatio(hex, '000000');
  root.querySelector('[data-picker-contrast]').innerHTML =
    `<span>Contrast: <strong>${onWhite.toFixed(2)}:1</strong> on white, ` +
    `<strong>${onBlack.toFixed(2)}:1</strong> on black. ` +
    `Readable text on this color: <strong>${onWhite > onBlack ? 'white' : 'black'}</strong>.</span>`;
}

export function initPicker() {
  const root = document.getElementById('picker');
  if (!root) return;

  const colorInput = root.querySelector('[data-picker-input]');
  const textInput = root.querySelector('[data-picker-text]');

  // Seed from ?color= so a picked color can be shared as a link.
  const fromUrl = new URLSearchParams(location.search).get('color');
  let hex = clean(fromUrl ?? '3b82f6');

  function sync(source) {
    if (source !== 'text') textInput.value = `#${hex.toUpperCase()}`;
    colorInput.value = `#${hex}`;
    render(root, hex);
  }

  colorInput.addEventListener('input', () => {
    hex = clean(colorInput.value);
    sync('color');
  });

  textInput.addEventListener('input', () => {
    hex = clean(textInput.value);
    sync('text');
  });

  root.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]');
    if (copy) await copyWithToast(copy.dataset.copy);
  });

  sync();
}
