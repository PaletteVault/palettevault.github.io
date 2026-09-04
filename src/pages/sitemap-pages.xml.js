/**
 * Everything that is not a palette page: /sitemap-pages.xml
 *
 * About 160 URLs, and the ones that carry the site's actual subject matter.
 * Keeping them apart from the 10 000 palettes means Search Console reports
 * their coverage as its own number instead of rounding them away.
 */

import { getSitemapEntries } from '../lib/routes.server.js';
import { partition, today, urlsetXml, xmlResponse } from '../lib/sitemap.server.js';

export function GET({ site }) {
  const origin = (site ?? new URL('https://palette-vault.example')).origin;
  const { pages } = partition(getSitemapEntries());

  return xmlResponse(urlsetXml(pages, origin, today()));
}
