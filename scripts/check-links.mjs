/**
 * ============================================================================
 *  EVERY INTERNAL LINK POINTS AT A FILE THAT EXISTS
 * ============================================================================
 *
 *  Run against dist/ after a build.
 *
 *  WHY THIS EXISTS
 *
 *  check-orphans.mjs asks whether every page has an incoming link. This asks
 *  the opposite and, as it turned out, more expensive question: whether every
 *  link has a page.
 *
 *  Nothing asked it for months. The site pre-rendered 2000 palette pages and
 *  linked to 10 000, so 8000 links resolved to nothing. On a host with rewrite
 *  rules that is invisible, which is how it survived review. On GitHub Pages,
 *  which has no rewrites, those addresses fell through to 404.html, and 404.html
 *  renders the palette from the slug in the browser. So the page looked right,
 *  the server said 404, and the only way to tell them apart was to read the
 *  status code, which no human does by hand across 10 000 URLs.
 *
 *  A crawler does, though. That is the failure this catches: not a broken page,
 *  a page that is broken only to machines.
 *
 *  WHAT IT CANNOT SEE
 *
 *  Only links present in the built HTML. The palette grid builds its links in
 *  the browser from the JSON feed, so on the first run of this script, against
 *  a build with 2000 pre-rendered palettes and 10 000 in the library, it found
 *  zero broken targets. That is a true answer to the question it asks and a
 *  misleading answer to the question that mattered.
 *
 *  So a clean report here means the static link graph is sound, not that every
 *  address the site can navigate to exists. Client-generated links have to be
 *  reasoned about separately, which is precisely how 8000 of them went unnoticed.
 *
 *  WHAT IT COSTS
 *
 *  It reads every HTML file in the output, which at 10 000 pages is a few
 *  hundred megabytes and takes a while. Existence checks are cached, so the
 *  expense is the reading, not the resolving.
 * ============================================================================
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = process.argv[2] ?? 'dist';

/** How many distinct broken targets to print before summarising. */
const SHOW = 15;

if (!existsSync(DIST)) {
  console.error(`No ${DIST}. Build first.`);
  process.exit(1);
}

function htmlFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, found);
    else if (entry.endsWith('.html')) found.push(full);
  }
  return found;
}

/**
 * Does this site-absolute path resolve to a file in the output?
 *
 * Mirrors how a static host serves a directory: `/a/b/` looks for
 * `a/b/index.html`. An extensionless path is tried both ways, because a host
 * may serve `a/b.html` for `/a/b` and Astro can emit either shape depending on
 * the trailingSlash setting.
 */
const resolved = new Map();
function exists(path) {
  if (resolved.has(path)) return resolved.get(path);

  const clean = path.split('#')[0].split('?')[0];
  const local = clean.replace(/^\//, '').split('/').join(sep);

  const candidates = clean.endsWith('/')
    ? [join(DIST, local, 'index.html')]
    : [
        join(DIST, local),
        join(DIST, `${local}.html`),
        join(DIST, local, 'index.html'),
      ];

  const ok = candidates.some((candidate) => existsSync(candidate));
  resolved.set(path, ok);
  return ok;
}

/*
 * Only href and src, and only site-absolute ones. Protocol-relative and
 * external links are somebody else's uptime, and a fragment or a mailto is not
 * a path at all.
 */
const LINK = /(?:href|src)="(\/[^"]*)"/g;

const files = htmlFiles(DIST);
const broken = new Map(); // target -> pages that link to it

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const page = `/${relative(DIST, file).split(sep).join('/')}`;

  for (const match of html.matchAll(LINK)) {
    const target = match[1];
    if (target.startsWith('//')) continue;
    if (exists(target)) continue;

    if (!broken.has(target)) broken.set(target, []);
    const sources = broken.get(target);
    // One example per target is enough to find it; keeping all of them on a
    // site this size means holding thousands of strings for no extra insight.
    if (sources.length < 1) sources.push(page);
  }
}

console.log(`pages scanned   ${files.length}`);
console.log(`link targets    ${resolved.size}`);
console.log(`broken targets  ${broken.size}`);

if (broken.size === 0) {
  console.log('\nEvery internal link resolves to a file.');
  process.exit(0);
}

console.log('');
let shown = 0;
for (const [target, [source]] of broken) {
  if (shown >= SHOW) break;
  console.log(`  ${target}\n      linked from ${source}`);
  shown += 1;
}
if (broken.size > shown) console.log(`  ... and ${broken.size - shown} more`);

process.exit(1);
