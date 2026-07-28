/**
 * robots.txt
 *
 * Generated rather than static so the sitemap URL always matches the `site`
 * value in astro.config.mjs instead of drifting out of sync with it.
 */

export function GET({ site }) {
  const origin = (site ?? new URL('https://palette-vault.example')).origin;

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Personal, stored in the visitor\'s browser, nothing for a crawler to see.',
    'Disallow: /collection/',
    '',
    '# Rewrite fallback shell: no content until a palette slug is attached.',
    'Disallow: /palette/$',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
