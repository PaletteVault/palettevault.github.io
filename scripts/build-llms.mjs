/**
 * ============================================================================
 *  GENERATE public/llms.txt
 * ============================================================================
 *
 *  This file used to be maintained by hand and drifted twice: it listed twelve
 *  of ninety-five color pages, none of the forty-three tag pages, and had the
 *  blog appended under the Privacy heading because an earlier patch could not
 *  find the right insertion point. A map of the site that is written by hand is
 *  a map that goes stale.
 *
 *  So it is generated from the same catalogs the pages use, exactly like the
 *  sitemap. It cannot be an Astro route because `public/llms.txt` already
 *  exists and takes precedence over a page of the same name, and the file
 *  cannot be deleted in this environment; writing over it before the build
 *  achieves the same result.
 *
 *  Everything emitted is ASCII on purpose. A .txt file is served without a
 *  charset by most static hosts, so a browser falls back to Windows-1252 and an
 *  em dash arrives as three mojibake characters. Plain hyphens cost nothing and
 *  cannot be misread.
 * ============================================================================
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { COLORS } from '../src/lib/colors.js';
import { TOOLS, TAG_LANDING_PAGES } from '../src/lib/routes.server.js';
import { getMeta } from '../src/lib/data.server.js';

const ORIGIN = process.env.SITE_URL ?? 'https://palettevault.github.io';

/**
 * Strip anything a plain-text file cannot carry safely.
 *
 * Only the handful of punctuation marks that actually appear in this project's
 * prose are mapped; anything else non-ASCII is dropped rather than guessed at,
 * so a stray character shows up as an obvious gap instead of a silent mojibake.
 */
const ascii = (value) =>
  String(value)
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/[^\x20-\x7e\n]/g, '');

const link = (label, path, note) =>
  `- [${ascii(label)}](${ORIGIN}${path})${note ? `: ${ascii(note)}` : ''}`;

const meta = getMeta();

/* -------------------------------------------------------------- sections -- */

const header = `# Palette Vault

> A catalogue of four-color palettes with free browser-based color tools. Every
> palette is built in OKLCH, a perceptually uniform color space, and is free to
> use for any purpose without attribution.

Every palette is built in OKLCH, so equal steps in lightness look equal to the
eye. The four hues follow a classical relationship (monochrome, analogous,
complementary, split complementary, triad or tetrad), lightness runs as a
deliberate ladder from light to dark, and chroma tapers at both extremes where a
screen can hold less of it. Tags are derived from the measured result rather
than from any stated intent.

A palette's URL contains its colors: \`/palette/<24 hex characters>/\` is the four
HEX codes in a row, so the address is a complete description of the palette and
needs no lookup.`;

const browse = [
  '## Browse',
  '',
  link('Home - newest palettes', '/'),
  link('All palettes - infinite browse', '/palettes/'),
  link('Popular - ranked by likes', '/popular/'),
  link('Random', '/random/'),
  link('All colors - names, hex codes, shades', '/colors/'),
  link('All tools', '/tools/'),
  link('Plugins - Chrome extension and Obsidian plugin', '/plugins/'),
  link('Blog', '/blog/'),
].join('\n');

/*
 * Colors, grouped the same way the index groups them so an agent reading this
 * gets the same structure a person sees. Rich pages carry a note; the rest are
 * listed plainly rather than given invented descriptions.
 */
const RICH_NOTES = {
  pastel: 'the soft, low-chroma family',
  y2k: 'the 1999-2003 aesthetic, and why it fails contrast checks',
  gold: 'why a flat fill never reads as metal',
  'transparent-blue': 'alpha and opacity in CSS, and why transparency has no hex code',
  gunmetal: 'the dark-mode background',
};

/*
 * Style pages live under /colors/ for historical reasons but are not colors, so
 * they are listed separately. Calling Y2K a color would be wrong in the one file
 * whose whole job is to describe the site accurately.
 */
const shades = COLORS.filter((color) => color.kind !== 'style');
const styles = COLORS.filter((color) => color.kind === 'style');

const colorLines = shades.map((color) =>
  link(`${color.name} color`, `/colors/${color.slug}/`, RICH_NOTES[color.slug]),
);

const colors = [
  '## Colors',
  '',
  'Each page carries hex, RGB, HSL and OKLCH values, an eleven-step shade scale',
  'built in OKLCH, contrast figures against white and black, and matching palettes.',
  '',
  ...colorLines,
].join('\n');

const styleSection = styles.length
  ? [
      '',
      '## Styles',
      '',
      'Aesthetics rather than shades. These pages describe a look and the colors',
      'that belong to it, so they carry no single hex value or shade scale.',
      '',
      ...styles.map((style) => link(style.name, `/colors/${style.slug}/`, RICH_NOTES[style.slug])),
    ].join('\n')
  : '';

const tools = [
  '## Tools',
  '',
  'All run entirely in the browser. No image or color is ever uploaded.',
  '',
  ...TOOLS.map((tool) => link(tool.title, `/tools/${tool.slug}/`, tool.description)),
].join('\n');

/*
 * Tag pages that canonicalise to a color landing page are left out on purpose:
 * pointing an agent at a page that declares a different canonical is noise.
 */
const tagLines = meta.tags
  .filter((tag) => !TAG_LANDING_PAGES[tag.slug])
  .map((tag) => link(`${tag.label} palettes`, `/tag/${tag.slug}/`));

const tags = [
  '## Categories',
  '',
  'Style and color-family tags. Membership is measured from the palette itself,',
  'not declared, so a palette appears under Blue because its colors measure blue.',
  '',
  ...tagLines,
].join('\n');

/*
 * Posts are read off disk rather than through `astro:content`, which only
 * exists inside Astro's runtime. Same reason the sitemap does it this way.
 */
function blogPosts() {
  let dir = process.cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = join(dir, 'src', 'content', 'blog');
    if (existsSync(candidate)) {
      return readdirSync(candidate)
        .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
        .map((name) => {
          const body = readFileSync(join(candidate, name), 'utf8');
          const front = body.slice(0, body.indexOf('---', 3));
          const title = front.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? name;
          const draft = /^draft:\s*true\s*$/m.test(front);
          return { slug: name.replace(/\.md$/, ''), title, draft };
        })
        .filter((post) => !post.draft);
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return [];
}

const posts = blogPosts();

const writing = [
  '## Writing',
  '',
  link('Blog', '/blog/'),
  link('RSS feed', '/blog/rss.xml'),
  ...posts.map((post) => link(post.title, `/blog/${post.slug}/`)),
].join('\n');

const about = [
  '## About',
  '',
  link('About - method and licence', '/about/'),
  link('Privacy policy', '/privacy/'),
  link('Sitemap', '/sitemap.xml'),
  '',
  '## Licence',
  '',
  'Colors cannot be owned. Every palette here is free for commercial and',
  'non-commercial use, with no attribution required.',
  '',
  '## Privacy',
  '',
  'Like counts are the only server-side data, stored as a single number per',
  'palette with nothing attached to identify who sent it. Saved collections live',
  "in the visitor's browser and are never transmitted. There is no analytics, no",
  'cookies and no accounts.',
].join('\n');

/* ----------------------------------------------------------------- write -- */

const body = `${ascii(header)}\n\n${browse}\n\n${colors}\n${styleSection}\n\n${tools}\n\n${tags}\n\n${writing}\n\n${about}\n`;

const nonAscii = [...body].filter((c) => c.charCodeAt(0) > 126 && c !== '\n');
if (nonAscii.length > 0) {
  console.error(`llms.txt: ${nonAscii.length} non-ASCII characters survived`, nonAscii.slice(0, 5));
  process.exit(1);
}

const out = join(process.cwd(), 'public', 'llms.txt');
writeFileSync(out, body, 'utf8');

const urls = (body.match(/\]\(https:/g) ?? []).length;
console.log(
  `llms.txt: ${body.split('\n').length} lines, ${urls} links `
  + `(${shades.length} colors, ${styles.length} styles, ${TOOLS.length} tools, ${tagLines.length} tags, `
  + `${posts.length} posts), ASCII only`,
);
