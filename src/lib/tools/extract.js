/**
 * ============================================================================
 *  EXTRACT PALETTE FROM IMAGE
 * ============================================================================
 *
 *  Thin UI layer over ../image-colors.js, which holds the clustering itself.
 *  The algorithm is shared with the collage generator so the two tools cannot
 *  drift into disagreeing about what colors an image contains.
 * ============================================================================
 */

import { copyWithToast, showToast } from '../clipboard.js';
import { isDark } from '../palette.js';
import { extractColors } from '../image-colors.js';

function renderResult(root, colors) {
  root.querySelector('[data-extract-result]').innerHTML = colors
    .map(({ hex, share }) => {
      const upper = `#${hex.toUpperCase()}`;
      const tone = isDark(hex) ? 'on-dark' : 'on-light';
      return (
        `<button type="button" class="gen-swatch ${tone}" style="--swatch-bg:#${hex}" ` +
        `data-copy="${upper}" title="Copy ${upper}">` +
          `<span class="gen-swatch__hex">${upper}</span>` +
          `<span class="gen-swatch__share">${share}%</span>` +
        `</button>`
      );
    })
    .join('');

  root.querySelector('[data-extract-output]').removeAttribute('hidden');
}

async function handleFile(root, file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('That is not an image');
    return;
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    root.querySelector('[data-extract-preview]').src = url;

    const count = Number(root.querySelector('[data-extract-count]').value) || 5;
    const results = extractColors(image, count);

    if (results.length === 0) {
      showToast('No visible pixels found');
      return;
    }

    renderResult(root, results);
    root.dataset.colors = results.map((item) => item.hex).join(',');
  } catch {
    showToast('Could not read that image');
  } finally {
    // The preview still points at this URL, so release it only on the next
    // extraction rather than immediately.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

export function initExtract() {
  const root = document.getElementById('extract');
  if (!root) return;

  const input = root.querySelector('[data-extract-input]');
  const dropzone = root.querySelector('[data-extract-drop]');

  input.addEventListener('change', () => handleFile(root, input.files?.[0]));

  root.querySelector('[data-extract-count]').addEventListener('change', () => {
    if (input.files?.[0]) handleFile(root, input.files[0]);
  });

  for (const type of ['dragenter', 'dragover']) {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-over');
    });
  }

  for (const type of ['dragleave', 'drop']) {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-over');
    });
  }

  dropzone.addEventListener('drop', (event) => {
    handleFile(root, event.dataTransfer?.files?.[0]);
  });

  // Pasting a screenshot straight from the clipboard is the fastest path.
  document.addEventListener('paste', (event) => {
    const item = [...(event.clipboardData?.items ?? [])].find((entry) =>
      entry.type.startsWith('image/'),
    );
    if (item) handleFile(root, item.getAsFile());
  });

  root.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      await copyWithToast(copy.dataset.copy);
      return;
    }

    if (event.target.closest('[data-extract-copy-all]')) {
      const colors = String(root.dataset.colors ?? '').split(',').filter(Boolean);
      if (colors.length) {
        await copyWithToast(colors.map((hex) => `#${hex.toUpperCase()}`).join(', '), 'Palette');
      }
    }
  });
}
