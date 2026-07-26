/**
 * ============================================================================
 *  EXTRACT PALETTE FROM IMAGE
 * ============================================================================
 *
 *  Naive approaches sample pixels at fixed points or take the most frequent
 *  RGB values, and both fail on real photographs: you get five near-identical
 *  browns from a landscape and miss the one red jacket that defines the shot.
 *
 *  Instead this clusters the pixels with k-means and, crucially, does the
 *  clustering in OKLab. Distance in OKLab tracks how different two colours
 *  actually look, so clusters land where a person would draw the boundaries.
 *
 *  Everything happens on the visitor's machine — the image is never uploaded.
 * ============================================================================
 */

import { copyWithToast, showToast } from '../clipboard.js';
import { isDark } from '../palette.js';

/** sRGB channel → linear. */
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** Pack r,g,b (0..255) into OKLab coordinates. */
function rgbToOklab(r, g, b) {
  const lr = toLinear(r / 255);
  const lg = toLinear(g / 255);
  const lb = toLinear(b / 255);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const toHex = (value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');

/**
 * k-means++ seeding.
 *
 * Plain random seeding regularly drops two centroids into the same region and
 * returns duplicate swatches. Seeding proportional to squared distance spreads
 * the starting points out and makes the result stable between runs.
 */
function seedCentroids(points, k) {
  const centroids = [points[Math.floor(Math.random() * points.length)]];

  while (centroids.length < k) {
    const distances = points.map((point) => {
      let best = Infinity;
      for (const centroid of centroids) {
        const dl = point[0] - centroid[0];
        const da = point[1] - centroid[1];
        const db = point[2] - centroid[2];
        best = Math.min(best, dl * dl + da * da + db * db);
      }
      return best;
    });

    const total = distances.reduce((sum, value) => sum + value, 0);
    if (total <= 0) break;

    let target = Math.random() * total;
    let index = 0;
    while (index < distances.length - 1 && target > distances[index]) {
      target -= distances[index];
      index += 1;
    }
    centroids.push(points[index]);
  }

  return centroids;
}

function kmeans(points, k, iterations = 12) {
  let centroids = seedCentroids(points, k);
  let assignments = new Array(points.length).fill(0);

  for (let step = 0; step < iterations; step += 1) {
    let moved = false;

    for (let i = 0; i < points.length; i += 1) {
      let best = 0;
      let bestDistance = Infinity;

      for (let c = 0; c < centroids.length; c += 1) {
        const dl = points[i][0] - centroids[c][0];
        const da = points[i][1] - centroids[c][1];
        const db = points[i][2] - centroids[c][2];
        const distance = dl * dl + da * da + db * db;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = c;
        }
      }

      if (assignments[i] !== best) {
        assignments[i] = best;
        moved = true;
      }
    }

    const sums = centroids.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i += 1) {
      const bucket = sums[assignments[i]];
      bucket[0] += points[i][0];
      bucket[1] += points[i][1];
      bucket[2] += points[i][2];
      bucket[3] += 1;
    }

    centroids = sums.map((bucket, index) =>
      bucket[3] === 0 ? centroids[index] : [bucket[0] / bucket[3], bucket[1] / bucket[3], bucket[2] / bucket[3]],
    );

    if (!moved) break; // converged
  }

  const counts = centroids.map(() => 0);
  for (const assignment of assignments) counts[assignment] += 1;

  return { centroids, counts };
}

/**
 * Read an image into a small pixel sample.
 * Downscaling to at most 160px on the long edge keeps clustering instant even
 * for a 40-megapixel photo, and averages away sensor noise as a bonus.
 */
function samplePixels(image, maxSide = 160) {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);

  const pixels = ctx.getImageData(0, 0, width, height).data;

  const points = [];
  const rgb = [];

  for (let i = 0; i < pixels.length; i += 4) {
    // Skip transparent pixels: they carry no colour information.
    if (pixels[i + 3] < 125) continue;
    rgb.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    points.push(rgbToOklab(pixels[i], pixels[i + 1], pixels[i + 2]));
  }

  return { points, rgb };
}

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
    const { points, rgb } = samplePixels(image);

    if (points.length === 0) {
      showToast('No visible pixels found');
      return;
    }

    const { centroids, counts } = kmeans(points, Math.min(count, points.length));

    // Map each centroid back to a real pixel colour. Converting the OKLab
    // centroid back to sRGB directly can land slightly outside the gamut, and
    // an actual pixel from the image is always a truthful answer.
    const total = counts.reduce((sum, value) => sum + value, 0);
    const results = centroids
      .map((centroid, index) => {
        let bestPixel = rgb[0];
        let bestDistance = Infinity;

        for (let i = 0; i < points.length; i += 1) {
          const dl = points[i][0] - centroid[0];
          const da = points[i][1] - centroid[1];
          const db = points[i][2] - centroid[2];
          const distance = dl * dl + da * da + db * db;
          if (distance < bestDistance) {
            bestDistance = distance;
            bestPixel = rgb[i];
          }
        }

        return {
          hex: toHex(bestPixel[0]) + toHex(bestPixel[1]) + toHex(bestPixel[2]),
          share: Math.round((counts[index] / total) * 100),
          weight: counts[index],
        };
      })
      .sort((a, b) => b.weight - a.weight);

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
