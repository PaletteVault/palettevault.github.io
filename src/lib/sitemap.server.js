/**
 * ============================================================================
 *  SITEMAP DOCUMENTS
 * ============================================================================
 *
 *  Shared by every sitemap endpoint so the XML is written in one place.
 *
 *  WHY THERE IS MORE THAN ONE SITEMAP
 *
 *  Not size. 10 161 URLs in 1.9 MB sits far inside the 50 000 / 50 MB limit,
 *  and a single file is legal. Two other reasons:
 *
 *  1. Search Console refused to read /sitemap.xml for months. The file was
 *     verified correct three ways: it returns 200 with application/xml, parses
 *     cleanly, ends with </urlset>, and a live URL test in Search Console said
 *     it was available to Google. Six removals and resubmissions produced
 *     "Couldn't fetch" with an empty "Last read" every time, while a sitemap
 *     for an unrelated site submitted from the same account succeeded at once.
 *     Whatever holds that state is not visible from outside, and a new path
 *     carries none of it.
 *
 *  2. Split by section, Search Console reports discovered pages per file. One
 *     combined sitemap answers "did Google read it"; several answer "which
 *     parts did Google take", which is the question worth asking of a site
 *     whose palette pages outnumber everything else 60 to 1.
 *
 *  /sitemap.xml stays as it is. Anything that already knows about it keeps
 *  working, and removing a URL to fix a fetch problem would be a strange trade.
 * ============================================================================
 */

/** Palette URLs per file. Small enough that a failure is legible, not a wall. */
export const PALETTES_PER_SITEMAP = 2500;

const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/** Today, as the W3C date sitemaps expect. */
export const today = () => new Date().toISOString().slice(0, 10);

export function urlsetXml(entries, origin, lastmod) {
  const urls = entries
    .map(
      ({ path, changefreq, priority }) =>
        `  <url>\n` +
        `    <loc>${escape(origin + path)}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${changefreq}</changefreq>\n` +
        `    <priority>${priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    '</urlset>\n'
  );
}

export function sitemapIndexXml(paths, origin, lastmod) {
  const items = paths
    .map(
      (path) =>
        `  <sitemap>\n` +
        `    <loc>${escape(origin + path)}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `  </sitemap>`,
    )
    .join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${items}\n` +
    '</sitemapindex>\n'
  );
}

/** Split sitemap entries into the palette pages and everything else. */
export function partition(entries) {
  const palettes = entries.filter((entry) => entry.path.startsWith('/palette/'));
  const pages = entries.filter((entry) => !entry.path.startsWith('/palette/'));
  return { pages, palettes };
}

/** How many palette files the current library needs. */
export const paletteFileCount = (palettes) =>
  Math.max(1, Math.ceil(palettes.length / PALETTES_PER_SITEMAP));

export const xmlResponse = (body) =>
  new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
