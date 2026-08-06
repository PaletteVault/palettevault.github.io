/**
 * ============================================================================
 *  ORPHAN PAGE CHECK
 * ============================================================================
 *
 *  Fails the build if a page exists in dist with no incoming internal link
 *  from any other page.
 *
 *  This is here because the site shipped 1,407 orphaned palette pages without
 *  anybody noticing. They were built, they were in the sitemap, and they were
 *  reachable by typing the URL, so nothing looked broken. What was missing was
 *  the only signal that actually matters for discovery: a link from somewhere
 *  else on the site.
 *
 *  The cause was structural rather than a mistake in any one file. Every
 *  browse surface fills its grid from JSON on the client, so the server-
 *  rendered HTML contains the first batch of cards and nothing after it. A
 *  crawler sees what the HTML says, not what the script would have added.
 *
 *  That failure mode is invisible to every check that looks at one page at a
 *  time, which is why this one builds a graph across the whole output.
 *
 *  Deliberately excluded from the count:
 *    - the home page, which is the root and needs no parent
 *    - 404.html, which is reached by status code
 *    - anything a page links to with rel=nofollow, which is not a real vote
 *    - /penpot/, which is not a page of this site at all
 *
 *  Usage:  node scripts/check-orphans.mjs [dist]
 * ============================================================================
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const DIST = process.argv[2] ?? 'dist';

/** Pages that are legitimately without a parent. */
const ROOTS = new Set(['/', '/404.html']);

/*
 * Trees that are shipped from this domain but are not part of this website.
 *
 * /penpot/ is the Penpot plugin: Penpot loads it by URL from the plugin
 * manager, so it has no reader arriving by link and never should. Linking to
 * it to satisfy this check would be worse than excluding it, because it would
 * put a bare plugin iframe into the site's navigation.
 *
 * A prefix rather than one path, since the plugin is a folder and may grow
 * more files.
 */
const NOT_THIS_SITE = ['/penpot/'];

const isForeign = (url) => NOT_THIS_SITE.some((prefix) => url.startsWith(prefix));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** dist/foo/bar/index.html -> /foo/bar/ */
function toUrl(file) {
  const rel = relative(DIST, file).split('\\').join('/');
  return rel.endsWith('index.html') ? `/${rel.slice(0, -'index.html'.length)}` : `/${rel}`;
}

const files = walk(DIST).filter((file) => !isForeign(toUrl(file)));
const pages = new Set(files.map(toUrl));

console.log(`  scanning ${files.length} pages in ${DIST}/`);

/*
 * Only href on an <a>. Not <link rel=canonical>, not og:url, not the sitemap:
 * all three were present on every orphaned page and none of them stopped the
 * pages being orphans. Counting them would make this check pass while the
 * problem it exists to catch stayed exactly where it was.
 */
const ANCHOR = /<a\b([^>]*)>/gi;
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const NOFOLLOW = /\brel\s*=\s*(?:"[^"]*\bnofollow\b|'[^']*\bnofollow\b|nofollow)/i;

const incoming = new Map();

for (const file of files) {
  const from = toUrl(file);
  const html = readFileSync(file, 'utf8');

  for (const [, attrs] of html.matchAll(ANCHOR)) {
    if (NOFOLLOW.test(attrs)) continue;
    const match = attrs.match(HREF);
    if (!match) continue;

    let href = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href) || href.startsWith('//')) continue;

    href = href.split('#')[0].split('?')[0];
    if (!href.startsWith('/')) href = posix.resolve(from, href);
    if (!href.endsWith('/') && !href.includes('.')) href += '/';

    // A link from a page to itself is not an incoming link.
    if (href === from) continue;
    if (!incoming.has(href)) incoming.set(href, new Set());
    incoming.get(href).add(from);
  }
}

const orphans = [...pages].filter((url) => !ROOTS.has(url) && !incoming.has(url)).sort();

const bySection = new Map();
for (const url of orphans) {
  const section = `/${url.split('/')[1] ?? ''}/`;
  bySection.set(section, (bySection.get(section) ?? 0) + 1);
}

if (orphans.length === 0) {
  console.log('  every page has at least one incoming internal link.');
  process.exit(0);
}

console.log(`\n[orphan-page] ${orphans.length} page(s) with no incoming internal link\n`);
for (const [section, count] of [...bySection].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(6)}  ${section}`);
}
console.log('\n  examples:');
for (const url of orphans.slice(0, 8)) console.log(`    ${url}`);
console.log(
  '\n  fix: link them from real markup. A client-rendered grid does not count,'
  + '\n       because the crawler never runs the script that fills it.',
);
process.exit(1);
