/**
 * ============================================================================
 *  COLOR COLLAGE GENERATOR
 * ============================================================================
 *
 *  Drop in an image, get back the image with its own colors laid alongside it
 *  as a band of swatches, the format people post to Pinterest and Instagram
 *  when sharing a palette, because the picture and the colors have to travel
 *  together to mean anything.
 *
 *  The geometry is kept in `planCollage`, a pure function that takes sizes and
 *  returns rectangles. Canvas painting is separate. That split exists so the
 *  layout can be checked with arithmetic instead of by eye: an off-by-one in a
 *  band width is invisible on screen and obvious in a test.
 *
 *  Everything runs locally. The image is never uploaded.
 * ============================================================================
 */

import { showToast, copyWithToast } from '../clipboard.js';
import { isDark } from '../palette.js';
import { extractColors } from '../image-colors.js';

/** Long edge of the exported PNG, to keep canvases from getting absurd. */
const MAX_OUTPUT_SIDE = 4000;

/**
 * Smallest long edge worth exporting.
 *
 * Rendering at the source resolution seemed like the respectful default until a
 * 216px icon went through: the band came out 43px wide, a seven-character hex
 * label needed 8.1px of type against a 9px floor, and the labels vanished, so
 * the "show hex labels" checkbox appeared to do nothing at all. The export was
 * also too small to post anywhere.
 *
 * Upscaling cannot invent detail, and the interface says so when it happens.
 * But a collage exists to be shared, and one that is unreadable at any size is
 * worse than one that is slightly soft.
 */
const MIN_OUTPUT_SIDE = 1200;

/** Below this many pixels a hex label is not worth drawing. */
const MIN_LABEL_PX = 9;

/**
 * A band wider than this fraction of the whole canvas stops being a band and
 * starts being the subject. Caps the two-column case on narrow images.
 */
const MAX_BAND_FRACTION = 0.5;

/** Below this many colors a second column or row would look sparse, not spacious. */
export const WRAP_THRESHOLD = 10;

/* -------------------------------------------------------------------------- */
/*  Geometry                                                                  */
/* -------------------------------------------------------------------------- */

const isVertical = (position) => position === 'left' || position === 'right';

/**
 * Work out the canvas size and every rectangle on it.
 *
 * `bandRatio` is measured against the image edge the band runs along, so the
 * band stays visually proportional whether the image is a wide panorama or a
 * tall portrait.
 *
 * With ten or more colors the band splits into two columns (or rows) and grows
 * to match, rather than slicing one column into ever-thinner strips. Sixteen
 * colors down the side of an 800px image leaves 50px per swatch, which is too
 * short for a legible hex label; eight per column leaves 100px, which is not.
 *
 * Returns `{ width, height, image, cells }` with `cells` in reading order.
 */
export function planCollage({
  imgW,
  imgH,
  colors,
  position = 'right',
  bandRatio = 0.2,
  wrap = true,
}) {
  const count = colors.length;
  if (!count || imgW <= 0 || imgH <= 0) {
    return { width: imgW, height: imgH, image: { x: 0, y: 0, w: imgW, h: imgH }, cells: [] };
  }

  const vertical = isVertical(position);
  const tracks = wrap && count >= WRAP_THRESHOLD ? 2 : 1;

  // The band grows with the number of tracks so each swatch keeps its width,
  // then is capped so it cannot dominate the canvas.
  const along = vertical ? imgW : imgH;
  let band = along * bandRatio * tracks;
  const maxBand = vertical
    ? (imgW * MAX_BAND_FRACTION) / (1 - MAX_BAND_FRACTION)
    : (imgH * MAX_BAND_FRACTION) / (1 - MAX_BAND_FRACTION);
  band = Math.min(band, maxBand);

  const width = Math.round(vertical ? imgW + band : imgW);
  const height = Math.round(vertical ? imgH : imgH + band);
  const bandSize = vertical ? width - imgW : height - imgH;

  const bandStart = position === 'left' || position === 'top' ? 0 : vertical ? imgW : imgH;
  const imageOffset = position === 'left' || position === 'top' ? bandSize : 0;

  const image = vertical
    ? { x: imageOffset, y: 0, w: imgW, h: imgH }
    : { x: 0, y: imageOffset, w: imgW, h: imgH };

  /*
   * Distribute across tracks with the remainder in the first one, so an odd
   * count reads as a full column beside a shorter one rather than a ragged
   * split. Rounding is done by accumulating edges instead of multiplying a
   * per-cell size, which is what keeps the last cell flush with the border
   * rather than a pixel short.
   */
  const perTrack = Math.ceil(count / tracks);
  const cells = [];
  let index = 0;

  for (let track = 0; track < tracks; track += 1) {
    const inThis = Math.min(perTrack, count - index);
    if (inThis <= 0) break;

    const trackStart = bandStart + Math.round((bandSize * track) / tracks);
    const trackEnd = bandStart + Math.round((bandSize * (track + 1)) / tracks);
    const trackSize = trackEnd - trackStart;
    const runLength = vertical ? height : width;

    for (let i = 0; i < inThis; i += 1) {
      const start = Math.round((runLength * i) / inThis);
      const end = Math.round((runLength * (i + 1)) / inThis);

      cells.push(
        vertical
          ? { x: trackStart, y: start, w: trackSize, h: end - start, hex: colors[index] }
          : { x: start, y: trackStart, w: end - start, h: trackSize, hex: colors[index] });
      index += 1;
    }
  }

  return { width, height, image, cells, tracks };
}

/* -------------------------------------------------------------------------- */
/*  Painting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Largest font that fits a seven-character hex label inside a cell.
 *
 * The 0.62 is the advance width of a character in a monospace face as a
 * fraction of its size, near enough across the stack to size text without
 * measuring, and measureText is used afterwards to confirm.
 */
function labelSize(ctx, text, cell) {
  const byWidth = (cell.w * 0.82) / (text.length * 0.62);
  const byHeight = cell.h * 0.42;
  let size = Math.floor(Math.min(byWidth, byHeight));

  // Confirm against real metrics, since the estimate above is a stack-wide
  // average and a fallback face may be wider.
  while (size >= MIN_LABEL_PX) {
    ctx.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    if (ctx.measureText(text).width <= cell.w * 0.86) break;
    size -= 1;
  }
  return size;
}

/**
 * Paint a plan onto a canvas.
 *
 * Returns `{ canvas, labelled }`. `labelled` reports whether the hex labels
 * actually fit, so the caller can tell the user why they are missing instead of
 * leaving a checked box with no visible effect.
 */
export function drawCollage(image, plan, { labels = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = plan.width;
  canvas.height = plan.height;

  const ctx = canvas.getContext('2d');

  // A transparent source PNG would otherwise composite onto nothing and export
  // with holes, so the canvas starts opaque.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, plan.width, plan.height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, plan.image.x, plan.image.y, plan.image.w, plan.image.h);

  let drawn = 0;

  for (const cell of plan.cells) {
    ctx.fillStyle = `#${cell.hex}`;
    ctx.fillRect(cell.x, cell.y, cell.w, cell.h);

    if (!labels) continue;

    const text = `#${cell.hex.toUpperCase()}`;
    const size = labelSize(ctx, text, cell);
    // No room. A clipped label is worse than none, but the caller is told.
    if (size < MIN_LABEL_PX) continue;

    ctx.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Perceptual lightness decides the label color, so a mid-tone swatch does
    // not end up with text that technically passes and looks wrong.
    ctx.fillStyle = isDark(cell.hex) ? '#ffffff' : '#111318';
    ctx.fillText(text, cell.x + cell.w / 2, cell.y + cell.h / 2);
    drawn += 1;
  }

  return { canvas, labelled: drawn, wanted: labels ? plan.cells.length : 0 };
}

/* -------------------------------------------------------------------------- */
/*  Wiring                                                                    */
/* -------------------------------------------------------------------------- */

const state = {
  /** The decoded source image, scaled down if it was enormous. */
  image: null,
  colors: [],
  position: 'right',
  bandRatio: 0.2,
  count: 6,
  labels: true,
  wrap: true,
  /** Object URL of the rendered PNG, revoked whenever it is replaced. */
  url: null,
};

function setBusy(root, busy) {
  root.querySelectorAll('[data-collage-needs-image]').forEach((el) => {
    el.disabled = busy || !state.image;
  });
}

function render(root) {
  const preview = root.querySelector('[data-collage-preview]');
  const output = root.querySelector('[data-collage-output]');
  if (!state.image || state.colors.length === 0) {
    output.hidden = true;
    return;
  }

  /*
   * Two ceilings and one floor. Very large photos are capped so the browser
   * does not refuse to allocate the canvas; very small ones are raised to a
   * size where the band is wide enough to hold a label and the export is worth
   * posting. Both are reported under the preview rather than done quietly.
   */
  const longest = Math.max(state.image.width, state.image.height);
  let scale = 1;
  if (longest > MAX_OUTPUT_SIDE) scale = MAX_OUTPUT_SIDE / longest;
  else if (longest < MIN_OUTPUT_SIDE) scale = MIN_OUTPUT_SIDE / longest;

  const plan = planCollage({
    imgW: Math.round(state.image.width * scale),
    imgH: Math.round(state.image.height * scale),
    colors: state.colors,
    position: state.position,
    bandRatio: state.bandRatio,
    wrap: state.wrap,
  });

  const { canvas, labelled, wanted } = drawCollage(state.image, plan, { labels: state.labels });

  canvas.toBlob((blob) => {
    if (!blob) {
      showToast('Could not render the collage');
      return;
    }
    if (state.url) URL.revokeObjectURL(state.url);
    state.url = URL.createObjectURL(blob);

    preview.src = state.url;
    preview.alt =
      `Collage: the uploaded image with ${state.colors.length} extracted colors `
      + `on the ${state.position}`;

    const link = root.querySelector('[data-collage-download]');
    link.href = state.url;
    // Only the leading colors go in the name: twenty of them would produce a
    // 140-character filename that some systems truncate and none display.
    link.download = `collage-${state.colors.slice(0, 4).join('-')}.png`;

    root.querySelector('[data-collage-size]').textContent =
      `${plan.width} × ${plan.height} px · ${Math.round(blob.size / 1024)} KB`
      + (plan.tracks > 1 ? ` · ${plan.tracks} tracks` : '');

    /*
     * Say what happened. Silence here was the actual defect: labels were being
     * dropped a pixel short of the floor while the checkbox stayed ticked, so
     * the option looked broken rather than constrained.
     */
    const notes = [];
    if (scale > 1) {
      notes.push(
        `Source is ${state.image.width} × ${state.image.height}, upscaled ${scale.toFixed(1)}× so `
        + 'the band is large enough to be readable. Upscaling cannot add detail, so the image '
        + 'will be softer than the original.');
    } else if (scale < 1) {
      notes.push(
        `Source is ${state.image.width} × ${state.image.height}, scaled down to keep the export `
        + 'within a size the browser can render.');
    }
    if (wanted > 0 && labelled === 0) {
      notes.push(
        'Hex labels do not fit at this band size, raise it, or use fewer colors. The codes are '
        + 'listed below either way.');
    } else if (wanted > 0 && labelled < wanted) {
      notes.push(
        `${wanted - labelled} of ${wanted} labels were left off because their swatch is too small.`);
    }

    const note = root.querySelector('[data-collage-note]');
    note.textContent = notes.join(' ');
    note.hidden = notes.length === 0;

    output.hidden = false;
  }, 'image/png');

  const list = root.querySelector('[data-collage-swatches]');
  list.replaceChildren(
    ...state.colors.map((hex) => {
      const li = document.createElement('li');
      li.className = 'collage-chip';
      li.style.background = `#${hex}`;
      li.dataset.dark = String(isDark(hex));

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `#${hex.toUpperCase()}`;
      button.title = `Copy #${hex.toUpperCase()}`;
      button.addEventListener('click', () => copyWithToast(`#${hex}`, `#${hex.toUpperCase()}`));

      li.append(button);
      return li;
    }));
}

async function loadFile(root, file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('That is not an image');
    return;
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    state.image = image;
    root.querySelector('[data-collage-filename]').textContent =
      `${file.name} · ${image.width} × ${image.height}`;

    recolor(root);
    setBusy(root, false);
  } catch {
    showToast('Could not read that image');
  } finally {
    // The decoded image still references this URL while it is drawn, so it is
    // released only once another file replaces it.
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }
}

/** Re-extract colors, which is the only step that costs anything. */
function recolor(root) {
  if (!state.image) return;
  const found = extractColors(state.image, state.count);
  if (found.length === 0) {
    showToast('No visible pixels found');
    return;
  }
  state.colors = found.map((item) => item.hex);
  render(root);
}

export function initCollage() {
  const root = document.getElementById('collage');
  if (!root) return;

  const input = root.querySelector('[data-collage-input]');
  const dropzone = root.querySelector('[data-collage-drop]');

  input?.addEventListener('change', () => {
    if (input.files?.[0]) loadFile(root, input.files[0]);
  });

  ['dragenter', 'dragover'].forEach((type) =>
    dropzone?.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.dataset.over = 'true';
    }));
  ['dragleave', 'drop'].forEach((type) =>
    dropzone?.addEventListener(type, () => delete dropzone.dataset.over));
  dropzone?.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) loadFile(root, file);
  });

  // Pasting a screenshot is the fastest path in, so it is worth supporting.
  document.addEventListener('paste', (event) => {
    const item = [...(event.clipboardData?.items ?? [])].find((entry) =>
      entry.type.startsWith('image/'));
    if (item) loadFile(root, item.getAsFile());
  });

  // Layout choice.
  root.querySelectorAll('[data-position]').forEach((button) => {
    button.addEventListener('click', () => {
      state.position = button.dataset.position;
      root.querySelectorAll('[data-position]').forEach((other) => {
        other.setAttribute('aria-pressed', String(other === button));
      });
      render(root);
    });
  });

  root.querySelector('[data-collage-count]')?.addEventListener('input', (event) => {
    state.count = Number(event.target.value);
    root.querySelector('[data-collage-count-label]').textContent = String(state.count);
    // Changing the count needs a fresh clustering, not just a repaint.
    recolor(root);
  });

  root.querySelector('[data-collage-band]')?.addEventListener('input', (event) => {
    state.bandRatio = Number(event.target.value) / 100;
    root.querySelector('[data-collage-band-label]').textContent = `${event.target.value}%`;
    render(root);
  });

  root.querySelector('[data-collage-labels]')?.addEventListener('change', (event) => {
    state.labels = event.target.checked;
    render(root);
  });

  root.querySelector('[data-collage-wrap]')?.addEventListener('change', (event) => {
    state.wrap = event.target.checked;
    render(root);
  });

  root.querySelector('[data-collage-copy-all]')?.addEventListener('click', () => {
    if (state.colors.length === 0) return;
    copyWithToast(state.colors.map((hex) => `#${hex}`).join(', '), 'all colors');
  });

  setBusy(root, false);
}
