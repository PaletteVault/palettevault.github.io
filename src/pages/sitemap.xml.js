/**
 * Sitemap.
 *
 * Written by hand rather than pulled in as an integration: the site needs to
 * exclude a few routes on purpose (see getSitemapEntries) and the total stays
 * well under the 50 000 URL / 50 MB limit, so a single file is enough.
 */

import { getSitemapEntries } from '../lib/routes.server.js';

export function GET({ site }) {
  const origin = (site ?? new URL('https://palette-vault.example')).origin;
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = getSitemapEntries()
    .map(
      ({ path, changefreq, priority }) =>
        `  <url>\n` +
        `    <loc>${origin}${path}</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${changefreq}</changefreq>\n` +
        `    <priority>${priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n');

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    '</urlset>\n';

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
