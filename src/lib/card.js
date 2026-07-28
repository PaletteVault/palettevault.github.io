/**
 * ============================================================================
 *  PALETTE CARD TEMPLATE, SINGLE SOURCE OF TRUTH
 * ============================================================================
 *
 *  The same module is used twice:
 *    • PaletteCard.astro, renders the first batch at build time, so the
 *                             first screen needs no JavaScript at all;
 *    • lib/gallery.js, renders every later batch at runtime during
 *                             infinite scroll.
 *
 *  Keeping the markup in two places is a reliable way to end up with two
 *  different cards, so it is declared exactly once.
 * ============================================================================
 */

/** Band proportions: dominant, two mid-tones, accent. */
export const SWATCH_RATIOS = [35, 25, 25, 15];

/* --------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

import { isDark, paletteName, palettePath, paletteSlug } from './palette.js';

/** Escape values that end up inside attributes. */
function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

/** Normalise a HEX value; anything malformed falls back to a safe grey. */
export function normalizeHex(value) {
  const clean = String(value).replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toLowerCase();
  return clean.length === 6 ? clean : '888888';
}

/**
 * A palette's date is derived deterministically from its id, dates are not
 * stored in the chunks, which would cost bytes across hundreds of thousands
 * of records.
 *   ts = latestTs - (total - id) * stepMs
 */
export function paletteTimestamp(id, meta) {
  const { total = 1, latestTs = Date.now(), stepMs = 0 } = meta ?? {};
  return latestTs - (total - id) * stepMs;
}

/** Relative label such as "3 days ago". Recomputed on the client at load. */
export function relativeDate(timestamp, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, size] of units) {
    if (seconds >= size) {
      const value = Math.floor(seconds / size);
      return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

/* Color maths and addressing live in palette.js. */

/* --------------------------------------------------------------------------
 * Heart icon
 * -------------------------------------------------------------------------- */
const HEART_SVG = `<svg class="like__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.7 4.3 13a5 5 0 0 1 7.1-7.1l.6.6.6-.6A5 5 0 1 1 19.7 13Z"/></svg>`;

/** Copy icon shown on a color band. */
const COPY_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>`;

/** Open icon in the card footer. */
const OPEN_SVG = `<svg class="card__open-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;

/* ==========================================================================
 * CARD MARKUP
 * ========================================================================== */

/**
 * @param {[number|null, string, string, string, string]} row tuple [id, c1..c4]
 *   The id may be null: that is how rows arrive from Popular and Collection,
 *   where the palette was rebuilt from a slug and its position in the feed is
 *   unknown. In that case no date is rendered.
 * @param {object} meta   contents of data/meta.json, needed for the date
 * @returns {string} card HTML
 */
export function cardHTML(row, meta) {
  const [rawId, ...rawColors] = row;
  const id = Number.isFinite(Number(rawId)) && rawId !== null ? Number(rawId) : null;
  const colors = rawColors.slice(0, 4).map(normalizeHex);

  const href = palettePath(colors);
  const slug = paletteSlug(colors);

  /*
   * The card has two actions, kept explicitly separate:
   *
   *   • clicking anywhere on the bands opens the palette page. A .card__hit
   *     link stretched over the whole area handles this. A real link rather
   *     than a handler, so the status bar, middle click, Ctrl/Cmd+click and
   *     search indexing all work;
   *   • clicking the copy icon on a band copies its HEX. The button sits above
   *     the link by z-index.
   *
   * The bands themselves are non-interactive: a button inside a link would be
   * invalid markup with ambiguous behaviour.
   */
  const swatches = colors
    .map((hex, index) => {
      const upper = `#${hex.toUpperCase()}`;
      const tone = isDark(hex) ? 'on-dark' : 'on-light';
      return (
        `<div class="swatch ${tone}" ` +
        `style="--swatch-bg:#${hex};--swatch-grow:${SWATCH_RATIOS[index]}">` +
          `<span class="swatch__hex">${upper}</span>` +
          `<button type="button" class="swatch__copy" data-hex="${upper}" ` +
          `title="Copy ${upper}" aria-label="Copy ${upper}">${COPY_SVG}</button>` +
        `</div>`
      );
    })
    .join('');

  const name = paletteName(colors);

  // The date is only known where the palette's position in the feed is. The
  // footer shows the name instead, which is more useful when scanning a grid
  // than "12 hours ago"; the date moved into the tooltip, kept fresh by
  // refreshDates().
  let dateAttrs = '';
  if (id !== null) {
    const timestamp = paletteTimestamp(id, meta);
    dateAttrs = ` data-ts="${timestamp}" title="${esc(name)} · ${relativeDate(timestamp)}"`;
  } else {
    dateAttrs = ` title="${esc(name)}"`;
  }

  return (
    `<article class="card" data-slug="${slug}" data-colors="${esc(colors.join(','))}">` +
      `<div class="card__swatches">` +
        `<a class="card__hit" href="${href}" aria-label="Open palette ${esc(name)}"></a>` +
        swatches +
      `</div>` +
      `<footer class="card__footer">` +
        `<button type="button" class="like" data-like="${slug}" aria-pressed="false" aria-label="Like palette">` +
          HEART_SVG +
          `<span class="like__count" data-count>0</span>` +
        `</button>` +
        `<a class="card__open" href="${href}"${dateAttrs}>` +
          `<span class="card__name">${esc(name)}</span>` +
          OPEN_SVG +
        `</a>` +
      `</footer>` +
    `</article>`
  );
}

/** Render a batch of rows as one HTML string. */
export function cardsHTML(rows, meta) {
  return rows.map((row) => cardHTML(row, meta)).join('');
}
