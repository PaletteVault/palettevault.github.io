/**
 * ============================================================================
 *  SINGLE PALETTE PAGE
 * ============================================================================
 *
 *  The defining property: this page needs no external data at all. All four
 *  colors are encoded directly in the address:
 *
 *      /palette/4e1f6e3e3e7545a9a998e8de/
 *
 *  So one HTML file can serve any palette in the dataset, rendering from
 *  `location.pathname`. Some pages are pre-rendered at build time for search
 *  engines; the rest land on the same file through the host's rewrite. There
 *  is no visible difference, because the client render is idempotent and
 *  simply redraws the same thing.
 *
 *  Supports: copying a single color, copying the whole palette in four
 *  formats, downloading a PNG, and liking.
 * ============================================================================
 */

import {
  bumpLikes,
  fetchLikes,
  getLastWriteError,
  isFirebaseConfigured,
  reconcileLike,
} from './firebase.js';
import {
  contrastRatio,
  describeColor,
  hexToHsl,
  hexToRgb,
  isDark,
  paletteName,
  parseSlug,
  paletteSlug,
} from './palette.js';
import { nearestColor } from './nearest-color.js';
import { isLiked, toggleLike } from './store.js';
import { updateCollectionBadge } from './gallery.js';

/* ==========================================================================
 * SLUG FROM THE ADDRESS
 * ========================================================================== */

function slugFromLocation() {
  // /palette/<slug>/ → <slug>. Works with or without the trailing slash.
  const match = /\/palette\/([0-9a-fA-F]{24})\/?$/.exec(location.pathname);
  return match ? match[1].toLowerCase() : null;
}

/* ==========================================================================
 * TOAST
 * ========================================================================== */

let toastNode = null;
let toastTimer = 0;

function showToast(message) {
  if (!toastNode) {
    toastNode = document.createElement('div');
    toastNode.className = 'toast';
    toastNode.setAttribute('role', 'status');
    toastNode.setAttribute('aria-live', 'polite');
    document.body.append(toastNode);
  }

  toastNode.textContent = message;
  toastNode.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastNode.classList.remove('is-visible'), 1400);
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.cssText = 'position:fixed;top:-9999px;opacity:0';
    document.body.append(helper);
    helper.select();
    const ok = document.execCommand('copy');
    helper.remove();
    return ok;
  } catch {
    return false;
  }
}

/* ==========================================================================
 * EXPORT FORMATS
 * ========================================================================== */

const FORMATS = {
  hex: (colors) => colors.map((hex) => `#${hex.toUpperCase()}`).join(', '),

  css: (colors) =>
    `:root {\n${colors
      .map((hex, i) => `  --color-${i + 1}: #${hex};`)
      .join('\n')}\n}`,

  rgb: (colors) =>
    colors
      .map((hex) => {
        const { r, g, b } = hexToRgb(hex);
        return `rgb(${r}, ${g}, ${b})`;
      })
      .join(', '),

  array: (colors) => JSON.stringify(colors.map((hex) => `#${hex}`)),
};

/* ==========================================================================
 * RENDERING
 * ========================================================================== */

/**
 * Band markup. Extracted into a pure function because it is used twice: Astro
 * renders pre-rendered pages with it at build time, and initDetail renders the
 * ones that arrive via a rewrite. One source of truth, same as card.js.
 */
export function swatchesHTML(colors, colorIndex = []) {
  return colors
    .map((hex) => {
      const upper = `#${hex.toUpperCase()}`;
      const { r, g, b } = hexToRgb(hex);
      const { h, s, l } = hexToHsl(hex);
      const tone = isDark(hex) ? 'on-dark' : 'on-light';

      // Contrast against white and black, a practical hint when laying out.
      const onWhite = contrastRatio(hex, 'ffffff').toFixed(1);
      const onBlack = contrastRatio(hex, '000000').toFixed(1);

      /*
       * The link sits below the swatch, not inside it. The swatch is a <button>
       * that copies the hex, and an <a> inside a <button> is invalid HTML, the
       * browser would hoist it out and the copy target would break.
       *
       * The label names the destination rather than saying "Explore color",
       * because the catalog page may carry a different name than this swatch's
       * own description: #6C7C59 reads as a muted lime and the page it links to
       * is Olive. Naming it avoids the surprise.
       */
      const match = nearestColor(hex, colorIndex);
      const explore = match
        ? `<a class="detail-swatch__explore" href="/colors/${match.slug}/" ` +
          `title="${match.name} color: hex codes, shades and palettes">` +
            `Explore ${match.name.toLowerCase()} <span aria-hidden="true">→</span>` +
          `</a>`
        : '';

      return (
        `<div class="detail-swatch-cell">` +
          `<button type="button" class="detail-swatch ${tone}" ` +
          `style="--swatch-bg:#${hex}" data-hex="${upper}" ` +
          `title="Copy ${upper}" aria-label="Copy ${upper}">` +
            `<span class="detail-swatch__hex">${upper}</span>` +
            `<span class="detail-swatch__meta">` +
              `<span>${describeColor(hex)}</span>` +
              `<span>rgb(${r}, ${g}, ${b})</span>` +
              `<span>hsl(${h}, ${s}%, ${l}%)</span>` +
              `<span class="detail-swatch__contrast">${onWhite}:1 on white · ${onBlack}:1 on black</span>` +
            `</span>` +
          `</button>` +
          explore +
        `</div>`
      );
    })
    .join('');
}

/**
 * The catalog index, read from the JSON the page embeds.
 *
 * Pre-rendered pages get their links at build time. The ones that arrive
 * through the rewrite fallback are rendered here instead, and they need the
 * same lookup, but importing the color catalog would drag fifty kilobytes of
 * page prose into the bundle, so the shell carries a slug/name/hex list only.
 */
function readColorIndex() {
  const node = document.getElementById('color-index');
  if (!node?.textContent) return [];
  try {
    return JSON.parse(node.textContent);
  } catch {
    return [];
  }
}

function renderSwatches(root, colors) {
  root.innerHTML = swatchesHTML(colors, readColorIndex());
}

/* ==========================================================================
 * IMAGE GENERATION
 * ========================================================================== */

/**
 * Draw the palette on a canvas and hand it back as a PNG.
 * 1200x630 is the standard social preview ratio, so the file works both as an
 * og:image and as a plain image for a moodboard.
 */
function renderImage(colors, { width = 1200, height = 630, labels = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const bandWidth = width / colors.length;

  colors.forEach((hex, index) => {
    const x = index * bandWidth;

    ctx.fillStyle = `#${hex}`;
    // One pixel of overlap: without it, antialiasing on fractional
    // coordinates leaves hairline gaps between the bands.
    ctx.fillRect(x, 0, bandWidth + 1, height);

    if (!labels) return;

    ctx.fillStyle = isDark(hex) ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.72)';
    ctx.font = '600 30px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`#${hex.toUpperCase()}`, x + bandWidth / 2, height - 44);
  });

  return canvas;
}

function downloadImage(colors) {
  const canvas = renderImage(colors);
  const filename = `palette-${paletteSlug(colors)}.png`;

  canvas.toBlob((blob) => {
    if (!blob) {
      showToast('Could not create image');
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    // Release memory, but not before the browser has taken the file.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    showToast('Image downloaded');
  }, 'image/png');
}

/* ==========================================================================
 * LIKE
 * ========================================================================== */

function paintLike(button, slug, count) {
  const liked = isLiked(slug);
  button.classList.toggle('is-liked', liked);
  button.setAttribute('aria-pressed', String(liked));

  if (typeof count === 'number') {
    button.querySelector('[data-count]').textContent = String(count);
  }
}

/* ==========================================================================
 * ENTRY POINT
 * ========================================================================== */

export function initDetail() {
  const root = document.getElementById('palette-detail');
  if (!root) return;

  const slug = slugFromLocation();
  const colors = parseSlug(slug);

  /* --- Invalid address ----------------------------------------------------
   * This page answers arbitrary slugs through the rewrite, so a malformed
   * address genuinely does arrive here. Show a clear message rather than an
   * empty screen.
   */
  if (!colors) {
    root.querySelector('[data-detail-body]')?.setAttribute('hidden', '');
    root.querySelector('[data-detail-invalid]')?.removeAttribute('hidden');
    return;
  }

  root.dataset.slug = slug;

  /* --- Headings and metadata ----------------------------------------------
   * Pages that were not pre-rendered arrive with placeholders, fill them in.
   */
  const hexList = colors.map((hex) => `#${hex.toUpperCase()}`).join(' ');
  const name = paletteName(colors);

  document.title = `${name}, ${hexList}`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute(
      'content',
      `${name}: color palette ${hexList}. Copy the HEX codes or download it as a PNG.`);
  document.querySelector('link[rel="canonical"]')
    ?.setAttribute('href', `${location.origin}/palette/${slug}/`);

  const nameNode = root.querySelector('[data-detail-name]');
  if (nameNode) nameNode.textContent = name;

  const heading = root.querySelector('[data-detail-title]');
  if (heading) heading.textContent = hexList;

  /* --- Bands --------------------------------------------------------------- */
  const swatchRoot = root.querySelector('[data-detail-swatches]');
  if (swatchRoot) renderSwatches(swatchRoot, colors);

  /* --- Preview image -------------------------------------------------------
   * Pre-rendered pages already carry a real file in src. The rest get a blob
   * URL built from the canvas, still an <img>, so right-click save, drag-out
   * and the download button all behave normally. Pinning is the one thing a
   * blob cannot do: Pinterest fetches the image server-side.
   */
  const image = root.querySelector('[data-detail-image]');
  if (image) {
    image.alt = `Color palette ${hexList}`;

    if (!image.getAttribute('src')) {
      renderImage(colors).toBlob((blob) => {
        if (!blob) return;
        image.src = URL.createObjectURL(blob);
        // Not revoked: the object URL has to stay valid for the lifetime of
        // the page, otherwise the image goes blank and saving it breaks.
      }, 'image/png');
    }
  }

  /* --- Clicks -------------------------------------------------------------- */
  root.addEventListener('click', async (event) => {
    // Copy a single color
    const swatch = event.target.closest('[data-hex]');
    if (swatch) {
      const hex = swatch.dataset.hex;
      const ok = await copyText(hex);
      showToast(ok ? `${hex} copied` : 'Copy failed');
      swatch.classList.add('is-copied');
      setTimeout(() => swatch.classList.remove('is-copied'), 400);
      return;
    }

    // Copy the whole palette in the selected format
    const copyAll = event.target.closest('[data-copy-format]');
    if (copyAll) {
      const format = copyAll.dataset.copyFormat;
      const text = (FORMATS[format] ?? FORMATS.hex)(colors);
      const ok = await copyText(text);
      showToast(ok ? `Copied as ${format.toUpperCase()}` : 'Copy failed');
      return;
    }

    // Download the PNG
    if (event.target.closest('[data-download]')) {
      downloadImage(colors);
      return;
    }

    // Copy the palette link
    if (event.target.closest('[data-copy-link]')) {
      const ok = await copyText(`${location.origin}/palette/${slug}/`);
      showToast(ok ? 'Link copied' : 'Copy failed');
      return;
    }

    // Like
    const likeButton = event.target.closest('[data-like]');
    if (likeButton) {
      const liked = toggleLike(slug);

      const counter = likeButton.querySelector('[data-count]');
      const next = Math.max(0, Number(counter.textContent ?? 0) + (liked ? 1 : -1));
      counter.textContent = String(next);

      likeButton.classList.toggle('is-liked', liked);
      likeButton.setAttribute('aria-pressed', String(liked));
      likeButton.classList.remove('is-bumping');
      void likeButton.offsetWidth; // restart the CSS animation
      likeButton.classList.add('is-bumping');

      updateCollectionBadge();

      const saved = await bumpLikes(slug, liked ? 1 : -1);
      if (!saved) {
        showToast(
          getLastWriteError() === 'not-configured'
            ? 'Saved in this browser only'
            : 'Could not save, see the console');
      }
    }
  });

  /* --- Like state ---------------------------------------------------------- */
  const likeButton = root.querySelector('[data-like]');
  if (likeButton) {
    paintLike(likeButton, slug);
    if (isFirebaseConfigured) {
      fetchLikes(slug).then(async (count) => {
        paintLike(likeButton, slug, count);

        // Repair a like that never reached the database, see reconcileLike.
        const repaired = await reconcileLike(slug, isLiked(slug), count);
        if (repaired !== null) paintLike(likeButton, slug, repaired);
      });
    }
  }

  updateCollectionBadge();
}
