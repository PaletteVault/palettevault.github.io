/**
 * ============================================================================
 *  EXPORT THE PALETTE LIBRARY AS A DATASET
 * ============================================================================
 *
 *  The site ships palettes in the leanest form that renders a grid: an id and
 *  four hex codes. That is right for the site, where every derived value is
 *  recomputed in the browser in microseconds, and wrong for a dataset, where
 *  the whole point is that somebody else does not have to own our colour code
 *  to use our colours.
 *
 *  So this fills the gap: it reads the same files the site reads, derives
 *  everything the site would derive at render time, and writes one flat CSV.
 *
 *  WHY IT IMPORTS FROM src/lib RATHER THAN REIMPLEMENTING
 *
 *  A second copy of the colour maths would drift from the first, and the
 *  failure would be silent: the dataset would quietly describe colours that
 *  differ from the ones on the pages it links to. Importing the real modules
 *  means the published numbers are the numbers the site shows, by construction.
 * ============================================================================
 */

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  paletteSlug,
  palettePath,
  hexToRgb,
  hexToHsl,
  luminance,
  isDark,
  contrastRatio,
  paletteName,
} from '../src/lib/palette.js';
import { hexToOklch } from '../src/lib/oklch.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(here, '..', 'public', 'data');
const OUT = path.join(here, '..', '..', 'hf-dataset');

const SITE = 'https://palettevault.github.io';

/** Every chunk in a feed directory, in file order. */
async function readChunks(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir))
    .filter((f) => f.endsWith('.json'))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

  const rows = [];
  for (const file of files) {
    const parsed = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
    if (Array.isArray(parsed)) rows.push(...parsed);
  }
  return rows;
}

/**
 * Which tags each palette carries.
 *
 * Tags are stored as separate feeds rather than as a field on the palette, so
 * membership has to be inverted. A palette can appear in several.
 */
async function readTags() {
  const root = path.join(DATA, 'tag');
  const byId = new Map();
  if (!existsSync(root)) return byId;

  const tags = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const tag of tags) {
    for (const row of await readChunks(path.join(root, tag))) {
      const id = row[0];
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(tag);
    }
  }
  return byId;
}

const round = (value, places) => Number(value.toFixed(places));

/** The six pairs in a four-colour palette, and how far apart they are. */
function contrastRange(colors) {
  const ratios = [];
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      ratios.push(contrastRatio(colors[i], colors[j]));
    }
  }
  return {
    best: round(Math.max(...ratios), 2),
    worst: round(Math.min(...ratios), 2),
  };
}

function describe(id, colors, tags) {
  const oklch = colors.map(hexToOklch);
  const { best, worst } = contrastRange(colors);

  const row = {
    id,
    slug: paletteSlug(colors),
    url: `${SITE}${palettePath(colors)}`,
    name: paletteName(colors),
    tags: (tags ?? []).join(';'),
  };

  colors.forEach((hex, index) => {
    const n = index + 1;
    const rgb = hexToRgb(hex);
    const hsl = hexToHsl(hex);
    const lch = oklch[index];

    row[`hex_${n}`] = `#${hex.toUpperCase()}`;
    row[`r_${n}`] = rgb.r;
    row[`g_${n}`] = rgb.g;
    row[`b_${n}`] = rgb.b;
    row[`h_${n}`] = round(hsl.h, 1);
    row[`s_${n}`] = round(hsl.s, 1);
    row[`l_${n}`] = round(hsl.l, 1);
    row[`oklch_l_${n}`] = round(lch.L, 4);
    row[`oklch_c_${n}`] = round(lch.C, 4);
    row[`oklch_h_${n}`] = round(lch.h, 2);
    row[`luminance_${n}`] = round(luminance(hex), 4);
  });

  row.contrast_best = best;
  row.contrast_worst = worst;
  row.mean_oklch_l = round(oklch.reduce((sum, c) => sum + c.L, 0) / 4, 4);
  row.mean_oklch_c = round(oklch.reduce((sum, c) => sum + c.C, 0) / 4, 4);

  /*
   * How many of the four need light text on them, not how dark the palette is.
   *
   * The first version of this column was called `is_dark` and used the same
   * helper, which marked 6360 of 10000 palettes dark, including ones with a
   * mean lightness of 0.90. The helper is right; the name was not. Its
   * threshold sits at 0.45 relative luminance because that is where light text
   * starts winning, which is far above where a colour starts looking dark.
   * Anyone wanting darkness should read mean_oklch_l.
   */
  row.needs_light_text = colors.filter(isDark).length;

  return row;
}

/**
 * CSV, minimally quoted.
 *
 * Only the name and tags can contain a comma, and only in theory, but a
 * generator that is right by inspection is worth more than one that is right
 * for today's data.
 */
function toCsv(rows) {
  const columns = Object.keys(rows[0]);
  const escape = (value) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const lines = [columns.join(',')];
  for (const row of rows) lines.push(columns.map((c) => escape(row[c])).join(','));
  return `${lines.join('\n')}\n`;
}

async function main() {
  const palettes = await readChunks(path.join(DATA, 'new'));
  if (palettes.length === 0) {
    console.error('No palettes found. Run the site data generator first.');
    process.exitCode = 1;
    return;
  }

  const tags = await readTags();

  const seen = new Set();
  const rows = [];
  for (const [id, ...colors] of palettes) {
    // The feeds overlap by design; a palette in three tags is still one row.
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push(describe(id, colors, tags.get(id)));
  }

  rows.sort((a, b) => a.id - b.id);

  await mkdir(OUT, { recursive: true });
  const csv = toCsv(rows);
  await writeFile(path.join(OUT, 'palettes.csv'), csv, 'utf8');

  const tagged = rows.filter((r) => r.tags).length;
  console.log(`palettes   ${rows.length}`);
  console.log(`columns    ${Object.keys(rows[0]).length}`);
  console.log(`tagged     ${tagged} (${Math.round((tagged / rows.length) * 100)}%)`);
  console.log(`distinct tags ${new Set([...tags.values()].flat()).size}`);
  console.log(`csv        ${(csv.length / 1024 / 1024).toFixed(1)} MB`);
}

await main();
