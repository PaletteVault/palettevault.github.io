// @ts-check
import { defineConfig } from 'astro/config';

/**
 * `site` drives canonical URLs, the sitemap, Open Graph images and the
 * Pinterest share link, so it has to match the deployed origin exactly.
 *
 * A repository named <account>.github.io is served from the root of that
 * domain, which is why there is no `base` here. A project repository
 * (github.io/<repo>/) would need `base: '/<repo>'` and every absolute path in
 * the code adjusted to match — a good reason to prefer the root repo.
 */
const SITE = process.env.SITE_URL ?? 'https://palettevault.github.io';

export default defineConfig({
  // Fully static: hundreds of thousands of palettes live in /public and load
  // as chunks at runtime, so no server is involved.
  output: 'static',

  site: SITE,

  // Stable /tag/pastel/ style addresses, which is what static hosts expect.
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Inlining small stylesheets saves a request on the card grid.
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      rollupOptions: {
        output: {
          // Keep the Firebase SDK in its own chunk. It is imported lazily and
          // must stay out of the gallery's critical path.
          manualChunks(id) {
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'firebase';
            }
            return undefined;
          },
        },
      },
    },
  },
});
