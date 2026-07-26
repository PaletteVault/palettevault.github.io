# Palette Vault

A static catalogue of four-colour palettes built with Astro. The palettes are
pre-generated JSON chunks in `public/`; the only backend is Firebase, used
solely for like counters.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Astro 7, `output: 'static'` |
| Styling | Plain CSS with custom properties, light and dark themes |
| Palette data | Static JSON chunks of 1000 records under `public/data` |
| Likes | Firebase Realtime Database (`increment`) |
| Saved palettes | `localStorage` |
| Runtime dependencies | `firebase` only, lazily loaded as a separate chunk |

## Quick start

```bash
npm install
cp .env.example .env        # fill in if you want likes to work
npm run generate:dev        # 10,000 palettes — fast, for development
npm run dev
```

Production:

```bash
npm run generate            # 100,000 palettes (~2 min, ~28 MB in public/data)
npm run icons               # favicons and the OG banner from public/icon.png
npm run images              # a PNG per pre-rendered palette (~23 MB)
npm run build               # dist/ — deploy to any static host
```

The generator takes flags:

```bash
node scripts/generate-palettes.mjs --count=500000 --chunk=1000 --seed=42
```

> The seed is fixed, so the same seed always produces the same dataset. Likes
> are keyed by colour rather than by id, so changing the seed no longer breaks
> them — but ids will shift, which changes the dates shown on cards.

## How the data is organised

```
public/data/
  meta.json              manifest: total, chunkSize, latestTs, stepMs, tags[]
  new/1.json … N.json    the New feed, ids descending
  tag/<slug>/1.json …    one shard set per category
```

A palette is a compact tuple with no keys:

```json
[12345, "ffd6e0", "ffef9f", "c1f4c5", "94d3ac"]
```

Dates are not stored. They are derived from the id:
`ts = latestTs − (total − id) × stepMs`, which saves several megabytes across
100k records.

**Why tag shards duplicate the data instead of storing id lists.** A palette
costs ~45 bytes. Duplicating it into 3–6 shards is cheaper than shipping an
`id → chunk` index: the ids for one tag are scattered across every chunk, so
`/tag/pastel/` would need a hundred requests instead of one. Disk is cheaper
than round trips.

## The palette generator

`scripts/generate-palettes.mjs`, no external dependencies.

1. Colours are built in **OKLCH**, a perceptually uniform space. That is why
   the combinations look considered rather than like random values in RGB.
2. Colours outside sRGB are fixed by **gamut mapping**: chroma is reduced by
   binary search while lightness and hue are preserved, instead of clipping.
3. Around 30 mood presets (`pastel`, `vintage`, `neon`, `sunset`, `coffee`,
   `night`…) define corridors of lightness, chroma and permitted hues.
4. Eight harmony schemes: mono, analogous, complementary, split, triad,
   tetrad, neutral-with-accent, gradient.
5. Lightness is laid out as a **ladder** rather than randomly, so every palette
   has a readable spread.
6. A proximity filter rejects palettes that read as four shades of one blob.
7. Tags are applied from the actual output: properties (`light`, `dark`,
   `pastel`, `neon`, `warm`, `cold`) and colour families (`blue`, `red`, …).

## Firebase

The data model is one node holding one number:

```
/palettes/{slug} = 42
```

where `slug` is the same 24 hex characters used in the palette page URL. The
key *is* the data, which gives three things:

- colours are never stored separately — **Popular** rebuilds each palette from
  the key with a single `orderByValue().limitToLast(N)` query;
- likes are not tied to generator ids, so the dataset can be regenerated with a
  different seed and the counters stay with their colours;
- **Collection** needs no colour storage either: the list of slugs in
  `localStorage` is already the render data.

The rules in `database.rules.json` allow writing only a number, only by ±1 per
operation, and only under a 24-hex-character key. Deploy with:

```bash
firebase deploy --only database
```

Without `.env` the site works completely: likes live in `localStorage` and only
the Popular page stays empty.

Step-by-step setup, filling in `.env`, deploying the rules and the common
failure modes are covered in [`docs/firebase-setup.md`](docs/firebase-setup.md).

## Routes

| Route | Shows | Source |
| --- | --- | --- |
| `/` | New — freshest palettes | `new/` chunks |
| `/popular/` | ranked by likes | Firebase RTDB |
| `/random/` | shuffled order | `new/` chunks in random order |
| `/collection/` | the visitor's saved palettes | `localStorage` |
| `/tag/<slug>/` | a category | `tag/<slug>/` chunks |
| `/palette/<slug>/` | a single palette | the address itself |
| `/tools/` | eight colour tools | client-side |

The first 24 cards of every feed are rendered into the HTML at build time, so
the first screen is visible without JavaScript and indexable. Everything after
that arrives through infinite scroll.

### The palette page

An address like `/palette/4e1f6e3e3e7545a9a998e8de/` is four HEX codes in a
row, so the page needs no data request and no id: it rebuilds itself from the
URL. It can copy a single colour or the whole palette in four formats (HEX,
RGB, CSS variables, array), download a 1200×630 PNG, and register a like.

The preview is a real `<img>`, not a `<canvas>`. That distinction matters more
than it looks: a canvas cannot be right-clicked and saved, dragged into another
app, or picked up by a browser extension. `npm run images` renders two PNGs per
pre-rendered palette — a 1200×630 landscape for Open Graph and Twitter, and a
1000×1500 portrait for Pinterest, which crops and ranks around a 2:3 ratio.
Re-running skips files that already exist, so an interrupted run resumes and
raising `PRERENDER_PALETTES` only renders the new pages.

**Per-palette social images only exist on pre-rendered pages, and that is
inherent to the architecture rather than a limitation of the image pipeline.**
Every other address is served one shared HTML file through the rewrite, and
crawlers do not execute JavaScript — so an `og:image` written on the client
would never be seen. Pinterest has the same constraint from the other side: it
fetches the image server-side from the `media` parameter, which means `blob:`
and `data:` URLs are invisible to it. Pages without a file still get an `<img>`
built from a canvas blob, so saving and downloading work; only pinning does not,
and the Pinterest button is simply not rendered there.

Only the top of the feed is pre-rendered — `PRERENDER_PALETTES` in
`src/lib/data.server.js`, 2000 by default. Pre-rendering all of them is not an
option: at 100,000 palettes that is 100,000 HTML files and an output directory
of several hundred megabytes. Every other address is caught by a rewrite rule
and served `/palette/index.html`, the same template that draws itself from the
address bar:

- **Netlify, Cloudflare Pages** — `public/_redirects` (already in the project)
- **Vercel** — `vercel.json` (already in the project)
- **nginx** — `location /palette/ { try_files $uri $uri/ /palette/index.html; }`
- **GitHub Pages** — no rewrite support at all. The `404.html` fallback works
  (also in the project), but responses carry HTTP 404: fine for visitors, not
  for indexing. This is the current deployment target — see
  [`docs/deploy-github-pages.md`](docs/deploy-github-pages.md).

Without a rewrite rule the 2000 pre-rendered palettes still work; the rest
return 404.

### Palette names

A name like "Shadowed Bay" is a pure function of the four colours, exactly like
the slug. The adjective comes from lightness and saturation, the noun from the
dominant hue — where only visibly coloured swatches vote and each vote is
weighted by saturation. Variation within a group comes from an FNV-1a hash.

Names are never stored: that saves ~2 MB across 100,000 palettes and, more
importantly, lets the palette page name itself with nothing but its address.
Names are not unique and do not need to be — roughly 780 distinct names across
a sample of 1000 palettes.

## Tools

Eight client-side tools under `/tools/`, all running entirely in the browser:

| Tool | Notes |
| --- | --- |
| Palette generator | OKLCH harmony schemes, per-swatch locking, space to reroll |
| Extract from image | k-means clustering in OKLab; nothing is uploaded |
| Contrast checker | WCAG 2.1 AA/AAA, plus the nearest passing foreground |
| Colour picker | HEX, RGB, HSL, OKLCH and a tint/shade ramp |
| Tailwind colours | the default Tailwind palette as a lookup table |
| List of colours | every named CSS colour, ordered by hue |
| Browse gradients | two-stop gradients generated in OKLCH |
| Gradient maker | custom stops, sRGB and OKLCH previews side by side |

Two of these are worth a note on method. The image extractor clusters in
**OKLab** rather than RGB, because distance in OKLab tracks how different two
colours actually look — cluster boundaries land where a person would draw them,
instead of returning five near-identical browns from a landscape photo. The
gradient tools interpolate in **OKLCH** for the same underlying reason: a
two-stop gradient interpolated in sRGB passes through a desaturated middle,
which is where the familiar grey band between complementary colours comes from.

## Icons

`public/icon.png` is the master artwork. `npm run icons` trims its margin,
punches transparent rounded corners with an alpha mask, and writes the
favicons, the Apple touch icon, the PWA icons and a 1200×630 Open Graph banner.
Requires Pillow (`pip install Pillow`).

## SEO

- `sitemap.xml` and `robots.txt` are generated from `src/lib/routes.server.js`,
  so a new route cannot end up in one and missing from the other.
- `/collection/` and the `/palette/` fallback shell are excluded from both the
  sitemap and the index — a crawler would only ever see an empty page.
- Every page emits Open Graph and Twitter card metadata plus a canonical URL.
- JSON-LD: a site-level `WebSite` object, with `BreadcrumbList`,
  `CollectionPage` and `WebApplication` added per page.

## Project layout

```
src/
  lib/
    palette.js        slug, colour conversions, palette naming
    card.js           card markup — shared by the build and the runtime
    gallery.js        chunks, infinite scroll, copy, likes
    detail.js         the palette page
    firebase.js       lazy RTDB layer with a counter cache
    store.js          localStorage for likes
    oklch.js          OKLCH conversions, ramps, interpolation
    clipboard.js      copy plus toast, shared everywhere
    data.server.js    reads public/data at build time
    routes.server.js  route inventory for the sitemap and tools index
    tools/            per-tool logic
  components/         Header, Sidebar, Feed, PaletteCard, PaletteDetail, ToolLayout
  pages/              feeds, tags, palette pages, tools, sitemap, robots
scripts/
  generate-palettes.mjs
  build-icons.mjs
  build-palette-images.mjs
```

The card markup is declared exactly once (`lib/card.js`) and reused by both the
Astro component at build time and `gallery.js` during scroll, so static and
dynamically inserted cards cannot drift apart. The palette page body follows
the same pattern through `swatchesHTML`.

Like counters are fetched lazily: an `IntersectionObserver` requests them only
for cards that actually reach the viewport, with a concurrency limit and a
cache. Clicking a like updates the UI optimistically and rolls back if the
write fails.

## Deployment

Deployed to GitHub Pages at `https://palettevault.github.io` by
`.github/workflows/deploy.yml` on every push touching `site/`. The workflow
regenerates the dataset, the icons and the palette images first, since none of
those are committed. Setup and the GitHub Pages specifics are in
[`docs/deploy-github-pages.md`](docs/deploy-github-pages.md).

For any other static host, the build is:

```
npm run generate && npm run images && npm run build
```

Publish directory: `dist`. The origin comes from `site` in `astro.config.mjs`,
overridable with the `SITE_URL` environment variable — it drives canonical
URLs, the sitemap, Open Graph images and the Pinterest share link.

Two files must reach the published output or the site breaks in ways that are
hard to spot: `public/.nojekyll`, without which GitHub drops the `_astro/`
directory and the site loads unstyled, and `404.html`, which is the only
fallback mechanism GitHub Pages offers for non-pre-rendered palette pages.
