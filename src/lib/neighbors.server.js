/**
 * ============================================================================
 *  PALETTE LINK GRAPH
 * ============================================================================
 *
 *  Builds, once per build, the set of outgoing links every palette page
 *  carries: two neighbours in feed order and six perceptually similar
 *  palettes.
 *
 *  WHY BOTH, AND NOT JUST ONE OF THEM
 *
 *  The paginated archive alone gives every palette exactly one incoming link.
 *  That clears the orphan report and immediately produces a different one:
 *  two thousand pages with a single dofollow inlink, which is the same
 *  structural weakness wearing a different name. A page reached one way is
 *  reached one way whether or not a crawler calls it an orphan.
 *
 *  So the graph is built from two independent relations:
 *
 *    The chain (prev/next) is a guarantee. It is a single cycle through every
 *    pre-rendered palette, so each one has at least two incoming links no
 *    matter how unusual its colors are, and the whole catalog is walkable
 *    from any starting point.
 *
 *    Similarity is the useful half. Nearest neighbours in OKLCH cluster
 *    palettes that actually look alike, which is what a reader wants next and
 *    what gives the graph topical shape rather than chronological shape.
 *
 *  Together they average around eight incoming links per palette.
 *
 *  WHAT MAY BE LINKED
 *
 *  Only palettes returned by `getStaticLinkedRows()`, because only those have
 *  pages. Roughly eight thousand palettes exist in the feed with no page of
 *  their own; linking one would produce a URL that resolves through 404.html
 *  on GitHub Pages and answers 404. Trading orphans for broken links is a
 *  worse trade than doing nothing, so the candidate set is the pre-rendered
 *  set and nothing else.
 * ============================================================================
 */

import { getStaticLinkedRows } from './data.server.js';
import { hexToOklch } from './oklch.js';
import { paletteSlug } from './palette.js';

/** How many similar palettes each page links to. */
export const SIMILAR_COUNT = 6;

/**
 * Reduce a palette to a point that can be compared.
 *
 * Hue is averaged as a unit vector rather than as a number, because hue is
 * circular: the plain mean of 350 and 10 is 180, a green, which is the
 * opposite of the red both inputs describe. Summing the vectors and taking
 * the angle back out is the only average that respects the wrap.
 *
 * The vector length that falls out of that sum is kept as `focus`: near 1 the
 * palette sits on one hue, near 0 its hues are spread around the wheel. Two
 * palettes can share a mean hue and look nothing alike if one is monochrome
 * and the other is a triad, so this is what keeps them apart.
 */
function descriptor(colors) {
  let sumL = 0;
  let sumC = 0;
  let x = 0;
  let y = 0;

  for (const hex of colors) {
    const { L, C, h } = hexToOklch(`#${hex}`);
    sumL += L;
    sumC += C;
    // Weight each hue by its chroma: a near-grey has no meaningful hue, and
    // letting it vote pulls the average toward noise.
    const radians = (h * Math.PI) / 180;
    x += Math.cos(radians) * C;
    y += Math.sin(radians) * C;
  }

  const n = colors.length;
  const magnitude = Math.hypot(x, y);

  return {
    lightness: sumL / n,
    chroma: sumC / n,
    hueX: magnitude === 0 ? 0 : x / magnitude,
    hueY: magnitude === 0 ? 0 : y / magnitude,
    focus: sumC === 0 ? 0 : magnitude / sumC,
  };
}

/**
 * Squared distance between two descriptors.
 *
 * The weights are not tuned, they are scaled so each term contributes on a
 * comparable range: lightness and focus already run 0 to 1, chroma runs to
 * about 0.37 in sRGB so it is scaled up, and the hue term is a dot product
 * turned into a 0 to 1 difference.
 */
function distance(a, b) {
  const hueDot = a.hueX * b.hueX + a.hueY * b.hueY;
  const hueDelta = (1 - hueDot) / 2;

  return (
    3.0 * (a.lightness - b.lightness) ** 2
    + 3.0 * ((a.chroma - b.chroma) * 2.7) ** 2
    + 2.0 * hueDelta ** 2
    + 1.0 * (a.focus - b.focus) ** 2
  );
}

let cache = null;

/**
 * slug -> { prev, next, similar[] }, every value a slug that has a page.
 *
 * Memoised because Astro calls the page component once per route and this is
 * an O(n^2) scan. At two thousand palettes that is four million comparisons,
 * fine once and pointless two thousand times.
 */
export function getPaletteGraph() {
  if (cache) return cache;

  const rows = getStaticLinkedRows();
  const nodes = rows.map((row) => {
    const colors = row.slice(1);
    return { slug: paletteSlug(colors), colors, point: descriptor(colors) };
  });

  const graph = new Map();

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];

    /*
     * A cycle rather than a line. On a line the first and last palette each
     * have one neighbour instead of two, which would leave exactly the two
     * pages that are hardest to notice as the weakest in the graph.
     */
    const prev = nodes[(i - 1 + nodes.length) % nodes.length];
    const next = nodes[(i + 1) % nodes.length];

    /*
     * A bounded insertion into a small array beats sorting all n candidates:
     * six is tiny next to two thousand, so this stays a single pass with no
     * allocation per comparison.
     */
    const best = [];
    for (let j = 0; j < nodes.length; j += 1) {
      if (j === i) continue;
      const other = nodes[j];
      if (other.slug === prev.slug || other.slug === next.slug) continue;

      const d = distance(node.point, other.point);
      if (best.length === SIMILAR_COUNT && d >= best[best.length - 1].d) continue;

      let at = best.length;
      while (at > 0 && best[at - 1].d > d) at -= 1;
      best.splice(at, 0, { d, node: other });
      if (best.length > SIMILAR_COUNT) best.pop();
    }

    graph.set(node.slug, {
      prev: { slug: prev.slug, colors: prev.colors },
      next: { slug: next.slug, colors: next.colors },
      similar: best.map(({ node: hit }) => ({ slug: hit.slug, colors: hit.colors })),
    });
  }

  cache = graph;
  return graph;
}
