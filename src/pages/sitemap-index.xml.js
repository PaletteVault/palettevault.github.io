/**
 * The sitemap index: /sitemap-index.xml
 *
 * This is the one to submit. It names the section files rather than any URL of
 * its own, so it stays a few hundred bytes no matter how large the library
 * gets, and Search Console reports each section separately.
 */

import { getSitemapEntries } from '../lib/routes.server.js';
import {
  partition,
  paletteFileCount,
  sitemapIndexXml,
  today,
  xmlResponse,
} from '../lib/sitemap.server.js';

export function GET({ site }) {
  const origin = (site ?? new URL('https://palette-vault.example')).origin;
  const { palettes } = partition(getSitemapEntries());

  const paths = ['/sitemap-pages.xml'];
  for (let index = 1; index <= paletteFileCount(palettes); index += 1) {
    paths.push(`/sitemap-palettes-${index}.xml`);
  }

  return xmlResponse(sitemapIndexXml(paths, origin, today()));
}
