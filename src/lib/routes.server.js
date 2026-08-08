/**
 * ============================================================================
 *  ROUTE INVENTORY (build time only)
 * ============================================================================
 *
 *  Single source of truth for what the site contains. Used by the sitemap,
 *  the tools index and the header, so a new page never ends up listed in one
 *  place and missing from another.
 * ============================================================================
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { COLORS } from './colors.js';
import { getMeta, getStaticLinkedRows } from './data.server.js';
import { paletteSlug } from './palette.js';

/**
 * Tool pages.
 *
 * `icon` is a Tabler-style outline path drawn at 24x24; keeping the geometry
 * here avoids shipping an icon font for nine glyphs.
 */
export const TOOLS = [
  {
    slug: 'generate',
    title: 'Palette generator',
    short: 'Generate palettes',
    description:
      'Build harmonious four-color palettes from any base color. Lock the shades you like and reshuffle the rest.',
    icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  },
  {
    slug: 'extract',
    title: 'Extract palette from image',
    short: 'Extract from image',
    description:
      'Drop in a photo and pull out the colors that actually define it, clustered rather than sampled at random.',
    icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 16l5-5 4 4 3-3 6 6',
  },
  {
    slug: 'collage',
    title: 'Color collage generator',
    short: 'Image + color collage',
    description:
      'Combine a photo with the colors extracted from it into one shareable PNG, with the swatches placed above, below, left or right.',
    icon: 'M3 5a2 2 0 0 1 2-2h9v18H5a2 2 0 0 1-2-2zM17 3h4v4h-4zM17 10h4v4h-4zM17 17h4v4h-4z',
  },
  {
    slug: 'contrast',
    title: 'Contrast checker',
    short: 'Contrast checker',
    description:
      'Check any pair of colors against WCAG 2.1 AA and AAA thresholds for normal text, large text and UI components.',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18',
  },
  {
    slug: 'picker',
    title: 'Color picker',
    short: 'Color picker',
    description:
      'Pick a color and read it back as HEX, RGB, HSL and OKLCH, with a full ramp of tints and shades.',
    icon: 'M15 4l5 5M17.5 6.5 8 16l-4 4 4-1 9.5-9.5',
  },
  {
    slug: 'oklch',
    title: 'OKLCH color picker and converter',
    short: 'OKLCH picker',
    description:
      'Pick a color by lightness, chroma and hue, see where it leaves the sRGB gamut, and copy it as OKLCH, HEX, RGB, HSL, Display P3, Lab or LCH.',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 12l7-4M12 12v9',
  },
  {
    slug: 'tailwind',
    title: 'Tailwind colors',
    short: 'Tailwind colors',
    description:
      'The full default Tailwind CSS palette with every shade, ready to copy as a class name or a HEX value.',
    icon: 'M4 7h16M4 12h16M4 17h16',
  },
  {
    slug: 'colors',
    title: 'List of colors',
    short: 'List of colors',
    description:
      'Every named CSS color, sortable by hue and lightness, with HEX, RGB and HSL for each one.',
    icon: 'M4 5h16v14H4zM9 5v14M14 5v14',
  },
  {
    slug: 'gradients',
    title: 'Browse gradients',
    short: 'Browse gradients',
    description:
      'A library of two-stop CSS gradients generated in OKLCH, so the midpoints stay clean instead of going grey.',
    icon: 'M4 4h16v16H4zM4 12h16',
  },
  {
    slug: 'gradient-maker',
    title: 'Gradient maker',
    short: 'Create a gradient',
    description:
      'Compose a gradient from your own stops, choose the interpolation space and copy the CSS.',
    icon: 'M4 20 20 4M4 12h8M12 4v8',
  },
];

export function getTool(slug) {
  return TOOLS.find((tool) => tool.slug === slug) ?? null;
}

/**
 * Tags that have a dedicated landing page covering the same ground in depth.
 *
 * Two indexable pages competing for one query split the ranking signals and
 * usually do worse than either would alone, so the tag page canonicalises to
 * the landing page and drops out of the sitemap. Declared here rather than in
 * the tag template so the canonical tag and the sitemap cannot disagree.
 */
export const TAG_LANDING_PAGES = {
  pastel: '/colors/pastel/',
  purple: '/colors/purple/',
};

/**
 * Every URL that should appear in the sitemap.
 *
 * Deliberately excluded:
 *   /collection/, content lives in the visitor's localStorage, so a crawler
 *                   only ever sees an empty page;
 *   /palette/, the rewrite fallback shell, which has no content of its
 *                   own until a slug is attached;
 *   /404.html, never a destination.
 */
/**
 * Blog post slugs, read straight off disk.
 *
 * `getCollection` is only available inside Astro's runtime, and this module is
 * plain Node so the sitemap and the tools index can share it. Resolving from
 * `process.cwd()` rather than `import.meta.url` matters: Vite relocates modules
 * during the build, and a path derived from the module URL silently resolves to
 * nothing, which previously caused the build to emit four pages instead of
 * forty-seven.
 */
function getBlogSlugs() {
  let dir = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = join(dir, 'src', 'content', 'blog');
    if (existsSync(candidate)) {
      return readdirSync(candidate)
        .filter((name) => name.endsWith('.md'))
        .filter((name) => {
          // Drafts are excluded from the index and the feed, so they must be
          // excluded here too or the sitemap advertises a page that 404s.
          const body = readFileSync(join(candidate, name), 'utf8');
          return !/^draft:\s*true\s*$/m.test(body);
        })
        .map((name) => name.replace(/\.md$/, ''));
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return [];
}

export function getSitemapEntries() {
  const meta = getMeta();
  const entries = [
    { path: '/', changefreq: 'hourly', priority: '1.0' },
    { path: '/popular/', changefreq: 'daily', priority: '0.9' },
    { path: '/random/', changefreq: 'always', priority: '0.5' },
    { path: '/tools/', changefreq: 'monthly', priority: '0.8' },
    { path: '/about/', changefreq: 'yearly', priority: '0.4' },
    { path: '/privacy/', changefreq: 'yearly', priority: '0.3' },
    { path: '/blog/', changefreq: 'weekly', priority: '0.8' },
  ];

  for (const slug of getBlogSlugs()) {
    entries.push({ path: `/blog/${slug}/`, changefreq: 'monthly', priority: '0.7' });
  }

  entries.push({ path: '/palettes/', changefreq: 'hourly', priority: '0.9' });
  entries.push({ path: '/plugins/', changefreq: 'monthly', priority: '0.7' });
  entries.push({ path: '/apps/', changefreq: 'monthly', priority: '0.7' });
  entries.push({ path: '/colors/', changefreq: 'weekly', priority: '0.9' });

  /*
   * Two fixed vocabularies, listed apart from the catalogue.
   *
   * Neither changes: the CSS keywords are set by the specification and the 216
   * were fixed decades ago, hence `yearly`. They sit below the catalogue in
   * priority because they answer reference questions rather than the searches
   * the colour pages are written for.
   */
  entries.push({ path: '/colors/css-names/', changefreq: 'yearly', priority: '0.7' });
  entries.push({ path: '/colors/web-safe/', changefreq: 'yearly', priority: '0.7' });

  /*
   * One page per color. Most are not canonicalised from their source tag
   * "coral" and the general orange category answer different questions. Only
   * pastel and purple cover the same ground as their tag, and those are listed
   * in TAG_LANDING_PAGES so the tag drops out instead.
   */
  for (const color of COLORS) {
    entries.push({ path: `/colors/${color.slug}/`, changefreq: 'weekly', priority: '0.8' });
  }

  for (const tool of TOOLS) {
    entries.push({ path: `/tools/${tool.slug}/`, changefreq: 'monthly', priority: '0.7' });
  }

  // A tag with a landing page is canonicalised to it, so listing both would
  // only advertise the duplicate.
  for (const tag of meta.tags) {
    if (TAG_LANDING_PAGES[tag.slug]) continue;
    entries.push({ path: `/tag/${tag.slug}/`, changefreq: 'daily', priority: '0.8' });
  }

  for (const row of getStaticLinkedRows()) {
    entries.push({
      path: `/palette/${paletteSlug(row.slice(1))}/`,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  return entries;
}
