/**
 * ============================================================================
 *  CONTENT COLLECTIONS
 * ============================================================================
 *
 *  The blog is the only collection. Posts are plain Markdown so that writing
 *  one requires no build knowledge — drop a file in src/content/blog, fill the
 *  frontmatter, and the index page, RSS feed and sitemap pick it up.
 *
 *  Posts carry no personal byline: the site is the author, so schema.org gets
 *  an Organization rather than a Person and there is no author field to fill in
 *  per post.
 * ============================================================================
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  /*
   * The leading-underscore exclusion matters more than it looks. An empty or
   * half-written .md file fails the schema, and a content-collection failure
   * stops the entire build — every page, not just the blog. Naming a work in
   * progress `_draft.md` keeps it out of the collection entirely, so an
   * unfinished file cannot take the site down.
   */
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/blog' }),
  /*
   * `schema` is a function so it can reach Astro's `image()` helper.
   *
   * `image: z.string()` looks equivalent and is not: a plain string never
   * enters the asset pipeline, so the file is not emitted, the path stays
   * relative to the markdown file rather than to the site, and a typo ships as
   * a broken preview that only shows up when somebody shares the link. The
   * helper resolves the file at build time and returns its real dimensions.
   */
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().min(80).max(165),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      accent: z.string().regex(/^[0-9a-f]{6}$/i),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      /**
       * Social preview, relative to the post file. Optional; without it the
       * page uses the site-wide OG image.
       *
       * Worth aiming for 1200x630 or larger. That is the size Facebook,
       * LinkedIn and Slack lay their cards out for, and anything smaller gets
       * upscaled or cropped by whichever platform renders it.
       */
      image: image().optional(),
    }),
});

export const collections = { blog };
