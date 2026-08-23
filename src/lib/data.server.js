/**
 * ============================================================================
 *  READING THE STATIC DATASET AT BUILD TIME
 * ============================================================================
 *
 *  Used ONLY from Astro frontmatter (Node.js, build time). It exists to:
 *    • serve meta.json to getStaticPaths for the tag list and the copy;
 *    • serve the first chunk of a feed so the first screen is static HTML,
 *      which is visible without JavaScript and indexable.
 *
 *  Everything else, hundreds of thousands of palettes, is NOT imported into
 *  the build. It sits in /public and loads at runtime as the visitor scrolls.
 * ============================================================================
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Location of the dataset.
 *
 * Important: resolved from process.cwd(), NOT from import.meta.url. Vite moves
 * this module into an internal directory during the build, which silently
 * breaks a path relative to the file and yields an empty dataset. cwd is
 * always the project root for both `astro build` and `astro dev`.
 *
 * The upward walk is a safety net for runs started from a subdirectory.
 */
function findDataDir() {
  let dir = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = join(dir, 'public', 'data');
    if (existsSync(join(candidate, 'meta.json'))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(process.cwd(), 'public', 'data');
}

const DATA_DIR = findDataDir();

/** Cards rendered into the HTML. Everything after that is infinite scroll. */
export const SSG_BATCH = 24;

function readJson(relativePath, fallback) {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, relativePath), 'utf8'));
  } catch {
    return fallback;
  }
}

const EMPTY_META = {
  total: 0,
  chunkSize: 1000,
  latestTs: Date.now(),
  stepMs: 0,
  feeds: { new: { chunks: 0 } },
  tags: [],
};

let cachedMeta = null;

/** Dataset manifest. Read once per build. */
export function getMeta() {
  if (!cachedMeta) {
    cachedMeta = readJson('meta.json', EMPTY_META);
    if (!cachedMeta.tags) cachedMeta = EMPTY_META;
  }
  return cachedMeta;
}

/** First N rows of a feed, for pre-rendering. */
export function getFirstRows(base, count = SSG_BATCH) {
  return readJson(join(base, '1.json'), []).slice(0, count);
}

/**
 * How many individual palette pages to pre-render.
 *
 * MEASURED BUDGET
 *
 * A palette costs 45 KB of output: 33.5 KB of HTML plus two PNGs averaging
 * 6.4 KB each. GitHub Pages publishes at most 1 GB, so the whole site fits
 * about 22 000 palettes and nothing else. 10 000 costs 441 MB, which leaves
 * real room for the rest of the site and for growth.
 *
 * This was briefly set to Infinity, on the belief that the library held 10 000
 * palettes. It holds 100 000: generate-palettes.mjs defaults to that, and only
 * the local checkout carries a 10 000 sample. Infinity therefore meant 100 000
 * pages, 200 000 images and about 4.4 GB, four times what the host accepts. CI
 * spent an hour on it before anyone noticed, because the failure would only
 * have appeared at the very end, on upload.
 *
 * So: a number, not a predicate, and a number derived from a measurement
 * rather than from an assumption about how many palettes there are.
 *
 * WHY THIS CHANGED
 *
 * The old value was 2000, on the reasoning that the rest would be served by a
 * rewrite and nobody would notice. That reasoning holds on Netlify and it does
 * not hold on GitHub Pages, which has no rewrites: it falls back to 404.html,
 * so the page rendered correctly in a browser while the server answered 404.
 * Measured on the live site: a palette inside the window returned 200, one
 * outside it returned 404, and the two were indistinguishable to look at.
 *
 * Those addresses were reachable from the grid, which builds its links in the
 * browser, so the built HTML never pointed at them and no build check could
 * have seen it. Only a crawler that runs scripts, or a person pasting a URL,
 * met the 404.
 *
 * WHAT IS STILL UNSOLVED
 *
 * At 100 000 palettes and 45 KB each, pre-rendering the library is not
 * possible on this host at any setting. 10 000 is a window, not a fix: the
 * other 90 000 still answer 404 to anything that reaches them. Closing that
 * properly means one of three things, and all of them are decisions rather
 * than constants: shrink the library, move to a host with rewrite rules, or
 * stop offering addresses for palettes that have no page.
 */
export const PRERENDER_PALETTES = 10_000;

/**
 * Rows for pre-rendered palette pages, taken from the top of the New feed.
 * Reads as many chunks as it takes to collect `count` records.
 */
export function getPrerenderRows(count = PRERENDER_PALETTES) {
  const meta = getMeta();
  const chunks = meta.feeds?.new?.chunks ?? 0;
  const rows = [];

  for (let index = 1; index <= chunks && rows.length < count; index += 1) {
    rows.push(...readJson(join('new', `${index}.json`), []));
  }
  return rows.slice(0, count);
}

/**
 * Every palette that some other page links to with a real `href`.
 *
 * The prerender window is the top of the New feed, but tag pages ship their own
 * server-rendered preview drawn from the tag's feed, and for a rare tag the
 * newest palette in it can easily sit outside that window. The link is then
 * correct and the page does not exist, on a host with rewrites the visitor
 * never notices, but GitHub Pages has no rewrites, so it resolves through
 * 404.html and answers with a 404 status. Fine for a human, wrong for a
 * crawler, and wrong in the sitemap.
 *
 * So the set to pre-render is the union of the New-feed window and every
 * statically linked palette. In practice the tag previews overlap the window
 * almost entirely, one palette out of 5 128 static links was missing, so this
 * costs a handful of pages, not a thousand.
 */
export function getStaticLinkedRows() {
  const rows = getPrerenderRows();
  const seen = new Set(rows.map((row) => row[0]));

  for (const tag of getMeta().tags) {
    for (const row of getFirstRows(`tag/${tag.slug}`, SSG_BATCH)) {
      if (seen.has(row[0])) continue;
      seen.add(row[0]);
      rows.push(row);
    }
  }
  return rows;
}

/** Tag descriptor by slug. */
export function getTag(slug) {
  return getMeta().tags.find((tag) => tag.slug === slug) ?? null;
}

/** Tags grouped for the sidebar. */
export function getTagGroups() {
  const tags = getMeta().tags;
  return [
    { title: 'Styles', items: tags.filter((tag) => tag.group === 'style') },
    { title: 'Colors', items: tags.filter((tag) => tag.group === 'color') },
  ];
}

/** Sample color for the dot next to each color tag in the sidebar. */
export const TAG_DOT = {
  red: '#e5484d',
  orange: '#f0851b',
  yellow: '#f5cf24',
  green: '#46a758',
  turquoise: '#12a594',
  blue: '#3b82f6',
  purple: '#8e4ec6',
  pink: '#e93d82',
  white: '#ffffff',
  gray: '#8b8d98',
  black: '#1c1f26',
};
