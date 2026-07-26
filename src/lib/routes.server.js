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

import { getMeta, getPrerenderRows } from './data.server.js';
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
      'Build harmonious four-colour palettes from any base colour. Lock the shades you like and reshuffle the rest.',
    icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  },
  {
    slug: 'extract',
    title: 'Extract palette from image',
    short: 'Extract from image',
    description:
      'Drop in a photo and pull out the colours that actually define it, clustered rather than sampled at random.',
    icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 16l5-5 4 4 3-3 6 6',
  },
  {
    slug: 'contrast',
    title: 'Contrast checker',
    short: 'Contrast checker',
    description:
      'Check any pair of colours against WCAG 2.1 AA and AAA thresholds for normal text, large text and UI components.',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18',
  },
  {
    slug: 'picker',
    title: 'Colour picker',
    short: 'Colour picker',
    description:
      'Pick a colour and read it back as HEX, RGB, HSL and OKLCH, with a full ramp of tints and shades.',
    icon: 'M15 4l5 5M17.5 6.5 8 16l-4 4 4-1 9.5-9.5',
  },
  {
    slug: 'tailwind',
    title: 'Tailwind colours',
    short: 'Tailwind colours',
    description:
      'The full default Tailwind CSS palette with every shade, ready to copy as a class name or a HEX value.',
    icon: 'M4 7h16M4 12h16M4 17h16',
  },
  {
    slug: 'colors',
    title: 'List of colours',
    short: 'List of colours',
    description:
      'Every named CSS colour, sortable by hue and lightness, with HEX, RGB and HSL for each one.',
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
 * Every URL that should appear in the sitemap.
 *
 * Deliberately excluded:
 *   /collection/  — content lives in the visitor's localStorage, so a crawler
 *                   only ever sees an empty page;
 *   /palette/     — the rewrite fallback shell, which has no content of its
 *                   own until a slug is attached;
 *   /404.html     — never a destination.
 */
export function getSitemapEntries() {
  const meta = getMeta();
  const entries = [
    { path: '/', changefreq: 'hourly', priority: '1.0' },
    { path: '/popular/', changefreq: 'daily', priority: '0.9' },
    { path: '/random/', changefreq: 'always', priority: '0.5' },
    { path: '/tools/', changefreq: 'monthly', priority: '0.8' },
  ];

  for (const tool of TOOLS) {
    entries.push({ path: `/tools/${tool.slug}/`, changefreq: 'monthly', priority: '0.7' });
  }

  for (const tag of meta.tags) {
    entries.push({ path: `/tag/${tag.slug}/`, changefreq: 'daily', priority: '0.8' });
  }

  for (const row of getPrerenderRows()) {
    entries.push({
      path: `/palette/${paletteSlug(row.slice(1))}/`,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  return entries;
}
