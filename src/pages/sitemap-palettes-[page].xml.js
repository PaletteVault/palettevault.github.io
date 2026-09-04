/**
 * Palette pages, in chunks: /sitemap-palettes-1.xml and so on.
 *
 * 2500 URLs each, so 10 000 palettes make four files. The number is not a
 * limit imposed on us, it is a size at which a partial failure is readable:
 * if Search Console reports three files read and one not, that is a fact worth
 * having. With one file of 10 000 the same failure reads as "nothing worked".
 */

import { getSitemapEntries } from '../lib/routes.server.js';
import {
  PALETTES_PER_SITEMAP,
  paletteFileCount,
  partition,
  today,
  urlsetXml,
  xmlResponse,
} from '../lib/sitemap.server.js';

export function getStaticPaths() {
  const { palettes } = partition(getSitemapEntries());
  return Array.from({ length: paletteFileCount(palettes) }, (_, index) => ({
    params: { page: String(index + 1) },
  }));
}

export function GET({ params, site }) {
  const origin = (site ?? new URL('https://palette-vault.example')).origin;
  const { palettes } = partition(getSitemapEntries());

  const index = Number.parseInt(params.page, 10) - 1;
  const slice = palettes.slice(
    index * PALETTES_PER_SITEMAP,
    (index + 1) * PALETTES_PER_SITEMAP,
  );

  return xmlResponse(urlsetXml(slice, origin, today()));
}
