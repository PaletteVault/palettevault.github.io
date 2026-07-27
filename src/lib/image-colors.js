/**
 * ============================================================================
 *  COLORS FROM AN IMAGE
 * ============================================================================
 *
 *  Shared by the palette extractor and the collage generator. Previously this
 *  lived inside the extractor; two tools with two copies of a clustering
 *  algorithm would eventually disagree about what colors an image contains,
 *  which is a confusing thing for one site to do.
 *
 *  Naive approaches sample pixels at fixed points or count the most frequent
 *  RGB values, and both fail on real photographs: you get five near-identical
 *  browns from a landscape and miss the one red jacket that defines the shot.
 *
 *  So this clusters the pixels with k-means and, crucially, clusters in OKLab.
 *  Distance in OKLab tracks how different two colors actually look, so the
 *  cluster boundaries land where a person would draw them.
 *
 *  Everything runs on the visitor's machine. No image is ever uploaded.
 * ============================================================================
 */

/** sRGB channel → linear. */
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** Pack r,g,b (0..255) into OKLab coordinates. */
export function rgbToOklab(r, g, b) {
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

const toHex = (value) =>
  Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');

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

export function kmeans(points, k, iterations = 12) {
  let centroids = seedCentroids(points, k);
  const assignments = new Array(points.length).fill(0);

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
      bucket[3] === 0
        ? centroids[index]
        : [bucket[0] / bucket[3], bucket[1] / bucket[3], bucket[2] / bucket[3]],
    );

    if (!moved) break; // converged
  }

  const counts = centroids.map(() => 0);
  for (const assignment of assignments) counts[assignment] += 1;

  return { centroids, counts };
}

/**
 * Read an image into a small pixel sample.
 *
 * Downscaling to at most 160px on the long edge keeps clustering instant even
 * for a 40-megapixel photo, and averages away sensor noise as a bonus.
 */
export function samplePixels(image, maxSide = 160) {
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
    // Skip transparent pixels: they carry no color information.
    if (pixels[i + 3] < 125) continue;
    rgb.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    points.push(rgbToOklab(pixels[i], pixels[i + 1], pixels[i + 2]));
  }

  return { points, rgb };
}

/**
 * Extract `count` colors from a decoded image, most prominent first.
 *
 * Returns `[]` when the image has no visible pixels, which the callers report
 * rather than treating as an empty palette.
 */
export function extractColors(image, count = 5, { maxSide = 160 } = {}) {
  const { points, rgb } = samplePixels(image, maxSide);
  if (points.length === 0) return [];

  const k = Math.max(1, Math.min(count, points.length));
  const { centroids, counts } = kmeans(points, k);
  const total = counts.reduce((sum, value) => sum + value, 0);

  return centroids
    .map((centroid, index) => {
      /*
       * Map each centroid back to a real pixel from the image. Converting the
       * OKLab centroid straight to sRGB can land slightly outside the gamut,
       * and an actual pixel is always a truthful answer to "what color is in
       * this picture".
       */
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
}
