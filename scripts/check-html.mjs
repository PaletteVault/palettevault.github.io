/**
 * ============================================================================
 *  BUILD OUTPUT CHECKS
 * ============================================================================
 *
 *  Run against dist/ after a build. Catches classes of mistake that are
 *  invisible in the source and easy to reintroduce.
 *
 *  The one that prompted this: Astro, like JSX, is free to discard whitespace
 *  that consists only of a newline and indentation. Write prose that wraps
 *  just before a link, *
 *      or the
 *      <a href="/tools/generate/">palette generator</a>
 *
 *, and the rendered output is `or the<a href=…>`, with the words run
 *  together. Nothing warns about it, the source looks correct, and a formatter
 *  can reintroduce it at any time by rewrapping a line. Eleven of these had
 *  accumulated across 66 pages before anyone noticed.
 *
 *  The fix in source is an explicit `{' '}`, which is an expression rather than
 *  whitespace and so cannot be dropped. This script is what makes sure the fix
 *  stayed applied.
 * ============================================================================
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = process.argv[2] ?? 'dist';

/*
 * Trees shipped from this domain that are not pages of this website.
 *
 * /penpot/ is the Penpot plugin. Penpot loads it by URL into an iframe from
 * its plugin manager, so nobody reads it as a page: it has no canonical, no
 * breadcrumb and no business in the sitemap, and every check here would be
 * measuring it against rules it was never meant to follow.
 */
const NOT_THIS_SITE = ['penpot'];

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (dir === DIST && NOT_THIS_SITE.includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/**
 * Each check reports the offending snippet so the message is actionable.
 *
 * Only letters and digits count as a collision. Punctuation either side of a
 * link is normal English, `</a>, which` and `(<a href` are both fine, and
 * treating it as an error would bury the real hits in noise.
 */
const CHECKS = [
  {
    id: 'missing-space-before-link',
    describe: 'a word runs into the opening <a> tag',
    pattern: /[A-Za-z0-9]<a\s/g,
    hint: "add {' '} at the end of the line before the <a>",
  },
  {
    id: 'missing-space-after-link',
    describe: 'the closing </a> runs into the next word',
    pattern: /<\/a>[A-Za-z0-9]/g,
    hint: "add {' '} after the </a>",
  },
  {
    /*
     * Two inline elements butted together, e.g. `</strong><a href=…>`.
     *
     * The first version of this file only looked for a letter next to a tag,
     * on the reasoning that punctuation either side of a link is normal
     * English. That reasoning had a hole: when the neighbour is a closing tag
     * the character before `<a` is `>`, which the letter test skips, and if
     * both elements are filled in by script they are empty at build time, so
     * there are no letters to find in the first place. A palette name ran
     * straight into "Open as a palette page" on the generator for exactly
     * this reason.
     *
     * Scoped to the inside of a <p>, because that is where whitespace
     * matters. Navigation rows and the footer legitimately butt links
     * together, they are flex containers and the gap comes from CSS.
     */
    id: 'adjacent-inline-in-paragraph',
    describe: 'two inline elements with no space between them inside a <p>',
    pattern: /<p\b[^>]*>(?:(?!<\/p>).)*?<\/(?:a|strong|em|b|i|code|kbd|abbr|time)><(?:a|strong|em|b|i|code|kbd|abbr|time)[\s>]/gs,
    hint: "add {' '} between the two elements, or make the parent a flex row if they should touch",
  },
  {
    /*
     * A palette count in the copy. The number is deliberately not published:
     * it dates the site, invites comparison on volume rather than quality, and
     * changes every time the dataset is regenerated, which quietly turns every
     * title and meta description into a claim that has to be maintained.
     *
     * It was interpolated into titles, descriptions, schema.org names, the
     * footer, the tag tooltips and several body paragraphs, so a plain grep is
     * worth keeping. A few words are allowed between the number and the noun,
     * because the first version of this check only looked for them adjacent and
     * sailed straight past "4,266 amber color palettes".
     */
    id: 'palette-count-in-copy',
    describe: 'a palette count appears in the copy',
    pattern: /\b\d[\d.]*\s+(?:[a-z-]+\s+){0,3}palettes\b/gi,
    hint: 'describe the catalog without a number',
  },
  {
    id: 'unresolved-expression',
    describe: 'a template expression reached the output verbatim',
    pattern: /\{['"] ['"]\}|\[object Object\]|undefined<\/|>NaN</g,
    hint: 'check the component that renders this fragment',
  },
  {
    id: 'empty-heading',
    describe: 'a heading rendered with no text',
    pattern: /<h[1-6][^>]*>\s*<\/h[1-6]>/g,
    hint: 'the heading content resolved to an empty value',
  },
];

/* ==========================================================================
 *  SITE-WIDE CHECKS
 * ==========================================================================
 *
 *  The per-file patterns above cannot see relationships between files. These
 *  three can, and each one caught something real:
 *
 *    - a tag page linked to a palette outside the pre-render window, so the
 *      URL resolved through 404.html and answered with a 404 status;
 *    - llms.txt had drifted, missing /tools/ and /privacy/ and listing the
 *      blog under the wrong heading;
 *    - nothing had ever confirmed the sitemap and the built output agree.
 * ========================================================================== */

const ORIGIN = 'https://palettevault.github.io';

/** Every path a browser can actually fetch from this build. */
function buildIndex(files) {
  const fetchable = new Set(['/']);
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      const path = `/${relative(DIST, full).split(sep).join('/')}`;
      fetchable.add(path);
      if (entry === 'index.html') {
        const dirPath = path.slice(0, -'index.html'.length);
        fetchable.add(dirPath);
        fetchable.add(dirPath.replace(/\/$/, ''));
      }
    }
  };
  walk(DIST);
  return fetchable;
}

function siteChecks(files) {
  const found = [];
  const fetchable = buildIndex(files);

  /* ---- 1. internal links that go nowhere ------------------------------- */
  const broken = new Map();
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    for (const href of new Set(html.match(/href="\/[^"]*"/g) ?? [])) {
      const target = href.slice(6, -1).split('#')[0].split('?')[0];
      if (!target || fetchable.has(target)) continue;
      if (!broken.has(target)) broken.set(target, []);
      broken.get(target).push(relative(DIST, file));
    }
  }
  for (const [target, pages] of broken) {
    found.push({
      id: 'broken-internal-link',
      describe: `link to ${target} but nothing is built there`,
      pages,
      hint: 'pre-render the target, or stop linking to it',
    });
  }

  /* ---- 2. sitemap vs reality ------------------------------------------ */
  const sitemapPath = join(DIST, 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    const xml = readFileSync(sitemapPath, 'utf8');
    const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1].replace(ORIGIN, '') || '/');

    for (const url of listed) {
      if (!fetchable.has(url)) {
        found.push({
          id: 'sitemap-points-nowhere',
          describe: `sitemap lists ${url} but nothing is built there`,
          pages: ['sitemap.xml'],
          hint: 'remove it from getSitemapEntries, or build the page',
        });
      }
    }

    if (new Set(listed).size !== listed.length) {
      found.push({
        id: 'sitemap-duplicates',
        describe: `sitemap contains ${listed.length - new Set(listed).size} duplicate URL(s)`,
        pages: ['sitemap.xml'],
        hint: 'a path is being added by two different loops',
      });
    }
  }

  /* ---- 3. llms.txt coverage ------------------------------------------- */
  const llmsPath = join(DIST, 'llms.txt');
  if (existsSync(llmsPath)) {
    const llms = readFileSync(llmsPath, 'utf8');
    const cited = new Set(
      [...llms.matchAll(new RegExp(`${ORIGIN}([^\\s)\\]]*)`, 'g'))].map(
        // A URL ending a sentence picks up the full stop. Trailing punctuation
        // is never part of the path, and treating it as one reported a
        // perfectly good link as broken.
        (m) => (m[1] || '/').replace(/[.,;:!?]+$/, '') || '/'));

    for (const url of cited) {
      if (!fetchable.has(url)) {
        found.push({
          id: 'llms-points-nowhere',
          describe: `llms.txt cites ${url} but nothing is built there`,
          pages: ['llms.txt'],
          hint: 'fix or drop the entry',
        });
      }
    }

    /*
     * Tool pages and the standalone informational pages are the ones an agent
     * reading llms.txt would expect to find. Individual palettes and the long
     * tail of color pages are deliberately not enumerated, that is what the
     * sitemap is for.
     */
    const required = [
      ...new Set(
        [...fetchable].filter((p) => /^\/tools\/[a-z-]*\/$/.test(p) || p === '/tools/')),
      '/',
      '/palettes/',
      '/colors/',
      '/popular/',
      '/random/',
      '/blog/',
      '/about/',
      '/privacy/',
    ];
    for (const url of required) {
      if (!cited.has(url)) {
        found.push({
          id: 'llms-missing-page',
          describe: `llms.txt does not mention ${url}`,
          pages: ['llms.txt'],
          hint: 'add it to public/llms.txt',
        });
      }
    }
  }

  return found;
}

const files = htmlFiles(DIST);
/** Grouped by snippet, because 2000 palette pages share a handful of templates. */
const problems = new Map();

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  for (const check of CHECKS) {
    for (const match of html.matchAll(check.pattern)) {
      /*
       * Some patterns match a whole enclosing element in order to establish
       * context, so the interesting part is the end of the match, not the
       * start. Anchoring the excerpt on the end keeps the reported snippet
       * pointing at the actual collision either way.
       */
      const end = match.index + match[0].length;
      const snippet = html
        .slice(Math.max(0, end - 90), end + 60)
        .replace(/\s+/g, ' ')
        .trim();
      const key = `${check.id} ${snippet}`;
      if (!problems.has(key)) problems.set(key, { check, snippet, files: [] });
      problems.get(key).files.push(relative(DIST, file));
    }
  }
}

const structural = siteChecks(files);

console.log(`Checked ${files.length} HTML files in ${DIST}/`);

if (problems.size === 0 && structural.length === 0) {
  console.log('No problems found.');
  process.exit(0);
}

let pages = 0;
for (const { check, snippet, files: hit } of problems.values()) {
  pages += hit.length;
  console.log(`\n[${check.id}] ${check.describe}`);
  console.log(`  on ${hit.length} page(s), e.g. ${hit[0]}`);
  console.log(`  …${snippet}…`);
  console.log(`  fix: ${check.hint}`);
}

for (const { id, describe, pages: hit, hint } of structural) {
  console.log(`\n[${id}] ${describe}`);
  console.log(`  from ${hit.length} place(s), e.g. ${hit[0]}`);
  console.log(`  fix: ${hint}`);
}

console.log(
  `\n${problems.size} content problem(s) across ${pages} page hit(s), `
  + `${structural.length} structural problem(s).`);
process.exit(1);
