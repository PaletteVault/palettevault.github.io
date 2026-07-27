# Palette Vault

A free color reference: ready-made four-color palettes, a page for every
named color, and a set of tools that run in your browser.

Everything on it is free to use — for client work, for something you sell, for
anything at all. No account, no attribution, no sign-up.

**[palettevault.github.io](https://palettevault.github.io)**

---

## What it is for

Picking colors is easy to start and hard to finish. You find a blue you like,
then need three more that go with it, then a darker version for text, then you
discover the pair you chose is unreadable. This site is built around those four
moments.

- **Browse palettes** when you want a starting point. Each one is four colors
  chosen to sit together.
- **Open a color** when you have one shade and need its family: lighter and
  darker versions, every format, and how it behaves against white and black.
- **Use a tool** when you want to make something rather than pick it — build a
  palette from your own color, pull one out of a photo, or check whether two
  colors are legible together.
- **Read the blog** when something is behaving oddly and you want to know why.

---

## Using the site

### Finding a palette

The home page shows what is newest. **Popular** ranks by what people have
liked, **Random** reshuffles on every visit, and **All palettes** keeps loading
as you scroll.

The sidebar narrows things down two ways: by mood — pastel, vintage, neon,
sunset, night — and by color family. Categories come from what a palette
actually looks like, measured, not from a label somebody typed. A palette
appears under *Blue* because its colors measure as blue.

### Taking colors with you

Click any swatch to copy its hex code. That works everywhere on the site — on
the cards, on the palette page, inside the tools.

Open a palette and you get more: all four colors at once as hex, RGB, CSS
variables or an array, and a download as an image you can drop into a
moodboard, a message, or a pin. Each color also links through to its own page.

Tap the heart to save a palette. Saved palettes live in **My collection**,
stored in your own browser rather than on a server — which means no account,
and also means the collection belongs to one browser on one device.

### Color pages

Every color has a page with its hex, RGB, HSL and OKLCH values, a scale of
lighter and darker versions, contrast figures against white and black, and
palettes built around it. The scale is the part worth bookmarking: it gives you
a usable light and dark version of a color instead of one isolated value.

A few pages cover a whole look rather than a single shade — pastel, Y2K,
Tuscan — and describe the colors that belong to it.

### Tools

All of them run entirely in your browser. Nothing you upload is sent anywhere.

| Tool | What it does |
| --- | --- |
| Palette generator | Builds a scheme around a color you pick. Lock the shades you like, reroll the rest. |
| Extract from image | Pulls the colors that actually define a photo. |
| Image + color collage | Combines a photo with its colors into one shareable image. |
| Contrast checker | Tells you whether two colors are legible together, and suggests the nearest shade that is. |
| Color picker | Any color in every format, with a scale of tints and shades. |
| OKLCH picker | Lightness, chroma and hue as separate sliders, marking where a color leaves what a screen can show. |
| Tailwind colors | The default Tailwind palette, ready to copy. |
| List of colors | Every named CSS color, ordered by hue. |
| Browse gradients | A library of two-stop gradients. |
| Gradient maker | Build your own and copy the CSS. |

### Browser extension

There is a Chrome extension alongside this folder, in `../extension/`. It
generates palettes, picks a color off any page with the eyedropper, and pulls
the palette out of a site you are looking at. It works offline and asks only
for access to the tab you are currently on.

---

## Why the colors look considered

One decision explains most of it: everything is built in **OKLCH**, a color
space designed so that equal numeric steps look like equal steps to the eye.

That is not true of the older ways of describing color. In HSL a yellow and a
blue can claim the same lightness while the yellow glares and the blue reads as
nearly black. Anything built on that — a scale, a gradient, a palette — comes
out uneven no matter how carefully the numbers were chosen.

Working in a space that matches perception is why the scales here step evenly,
why the gradients keep their color through the middle instead of passing
through grey, and why four colors on a card look related rather than merely
different. There is a
[longer explanation on the blog](https://palettevault.github.io/blog/oklch-vs-hsl/).

---

## Running it locally

You need Node. Clone the repo, then:

```bash
npm install
npm run generate:dev   # build a small palette set to work against
npm run dev
```

That is enough to see the whole site. Likes will not save without Firebase
credentials, which is fine for local work — everything else runs.

For a full production build:

```bash
npm run generate       # the full palette dataset
npm run icons          # favicons and social banner (needs Pillow)
npm run images         # a share image per palette page
npm run build          # writes dist/
npm run check          # checks the built output for common mistakes
```

Publish `dist/` to any static host.

### Likes

Likes are the only thing that touches a server. Each one adds to a single
number stored against a palette, with nothing recorded about who sent it. Set
it up with `.env` — see [`docs/firebase-setup.md`](docs/firebase-setup.md).
Without it the site still works completely; only the Popular page stays empty.

### Where things live

```
src/
  lib/          color maths, palette naming, storage, per-tool logic
  components/   header, sidebar, cards, palette page, footer
  pages/        feeds, color pages, tools, blog, sitemap
  content/      blog posts as markdown
scripts/        dataset, icons and share images
docs/           Firebase and deployment guides
```

The Chrome extension is a sibling of this folder, at `../extension/`.

### Writing a blog post

Drop a markdown file in `src/content/blog/`. The frontmatter needs a title, a
description, a date and an accent color; an `image` is optional and becomes
the social preview. Name a file `_something.md` while it is unfinished and it
stays out of the site entirely.

---

## Deployment

Pushing to `main` builds and publishes to GitHub Pages automatically. The
dataset and images are generated during the build rather than committed, so the
repository stays small. Details and the GitHub Pages quirks are in
[`docs/deploy-github-pages.md`](docs/deploy-github-pages.md).

---

## License

Colors cannot be owned, and the palettes here are free for any use, commercial
or not, with no attribution required. The code is open — read it, take it, fork
it.
