/**
 * RSS 2.0 feed for the blog.
 *
 * Hand-written rather than pulled in through @astrojs/rss. The feed is a dozen
 * lines of XML, the dependency would be the only one in the project that exists
 * to emit a string, and the escaping rules are not subtle enough to justify it.
 *
 * Descriptions only, not full post bodies: the posts lean on relative links to
 * the tools, and a feed reader would render those as dead ends.
 */

import { getCollection } from 'astro:content';

/** XML has five reserved characters and no others. */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET({ site }) {
  const origin = (site ?? new URL('https://palette-vault.example')).origin;

  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime());

  const items = posts
    .map((post) => {
      const url = `${origin}/blog/${post.id}/`;
      return (
        '    <item>\n' +
        `      <title>${escapeXml(post.data.title)}</title>\n` +
        `      <link>${url}</link>\n` +
        // guid is what a reader uses to tell posts apart, so it must never
        // change once published, the permalink is the stable choice.
        `      <guid isPermaLink="true">${url}</guid>\n` +
        `      <description>${escapeXml(post.data.description)}</description>\n` +
        `      <pubDate>${post.data.published.toUTCString()}</pubDate>\n` +
        post.data.tags
          .map((tag) => `      <category>${escapeXml(tag)}</category>\n`)
          .join('') +
        '    </item>'
      );
    })
    .join('\n');

  const latest = posts[0]?.data.published ?? new Date();

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '  <channel>\n' +
    '    <title>Palette Vault Blog</title>\n' +
    `    <link>${origin}/blog/</link>\n` +
    '    <description>Practical writing about color: color spaces, contrast, and building ' +
    'palettes that hold together.</description>\n' +
    '    <language>en</language>\n' +
    `    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>\n` +
    `    <atom:link href="${origin}/blog/rss.xml" rel="self" type="application/rss+xml" />\n` +
    `${items}\n` +
    '  </channel>\n' +
    '</rss>\n';

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
