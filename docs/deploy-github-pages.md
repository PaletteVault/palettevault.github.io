# Deploying to GitHub Pages

Target: `https://palettevault.github.io` from the repository
`PaletteVault/palettevault.github.io`.

Everything is already configured. This document is the checklist plus the
reasoning behind the parts that are easy to get wrong.

---

## One-time setup

### 1. Push the repository

`site/` is its own git repository and is pushed from inside itself, so the
Astro project sits at the **root** of `palettevault.github.io`:

```
palettevault.github.io/
  .github/workflows/deploy.yml   ← lives inside site/ locally
  astro.config.mjs
  package.json
  src/
  public/
```

The workflow therefore lives at `site/.github/workflows/deploy.yml` and runs
from the repository root, no `working-directory`.

```bash
cd site
git add .
git commit -m "Add deploy workflow"
git push
```

**A workflow only runs if it is committed to the repository it should run in.**
A file placed one directory above `site/` never reaches this repository, which
is the usual reason a first push produces no build at all: the Actions tab is
simply empty rather than showing a failure.

The Chrome extension lives outside this repository and is not deployed.

### 2. Point Pages at Actions

**Settings → Pages → Build and deployment → Source: GitHub Actions.**

Not "Deploy from a branch". The branch mode serves committed files, and this
site's dataset and images are generated at build time rather than committed, there would be nothing to serve.

### 3. Add the Firebase variables

**Settings, Secrets and variables, Actions, the Variables tab, New repository
variable.** Seven of them.

Variables, not secrets. The two are neighbouring tabs on the same page and the
distinction is easy to miss, but getting it wrong fails in the worst possible
way: `${{ secrets.X }}` resolves to an empty string when `X` is a variable, so
the build goes green, the site deploys, and likes silently do nothing. That is
exactly how this configuration was broken once already. The workflow now stops
with a list of the missing names instead.

| Variable | Value |
| --- | --- |
| `PUBLIC_FIREBASE_API_KEY` | `AIzaSy…` |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | `colorpalette-99684.firebaseapp.com` |
| `PUBLIC_FIREBASE_DATABASE_URL` | `https://colorpalette-99684-default-rtdb.firebaseio.com` |
| `PUBLIC_FIREBASE_PROJECT_ID` | `colorpalette-99684` |
| `PUBLIC_FIREBASE_STORAGE_BUCKET` | `colorpalette-99684.firebasestorage.app` |
| `PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `739499355397` |
| `PUBLIC_FIREBASE_APP_ID` | `1:739499355397:web:…` |

Copy them from your local `.env`.

These are not secrets in any meaningful sense. A Firebase web config ships in
the client bundle of every site that uses one, so anyone can read it from view
source. What actually controls access is the database rules. Storing the values
as repository variables keeps them in one place for rotation without implying a
confidentiality they do not have, and leaves them readable in build logs, where
seeing them is useful rather than dangerous.

Skipping this step is not fatal: the site builds and works, likes just stay in
each visitor's browser and Popular stays empty.

### 4. Run it

The workflow runs on every push to `main`, or manually from the **Actions**
tab, where **Run workflow** also lets you override the palette count for a
one-off build.

First run takes roughly 8-12 minutes, most of it generating palettes and
rendering the 4000 PNGs.

---

## Three things that would otherwise break the site

**`.nojekyll`.** GitHub runs published output through Jekyll, which silently
ignores every path starting with an underscore. Astro emits all of its hashed
JS and CSS into `_astro/`, so without this file the site loads as unstyled HTML
with no scripts and no error message anywhere. The file lives in `public/` so
it lands in the published output, and the workflow fails the build if it is
missing.

**`site` in `astro.config.mjs`.** It drives canonical URLs, the sitemap,
`og:image` and the Pinterest share link. A repository named
`<account>.github.io` is served from the root of its domain, which is why there
is no `base`. A project repository, `palettevault.github.io/somerepo/`, would
need `base: '/somerepo'` and every absolute path in the code adjusted to match.
Worth avoiding.

**`404.html`.** GitHub Pages supports no rewrite rules at all: `_redirects` and
`vercel.json` are inert there. The only mechanism available is `404.html`,
which GitHub serves for any address with no file behind it, so it carries the
same body as the palette page and renders from the slug in the URL.

---

## The one real compromise

Only the first 2000 palettes exist as their own HTML files. Every other
`/palette/<slug>/` address is served by `404.html`, it renders correctly and
the visitor sees a normal page, but **the response carries HTTP 404**, so
search engines will not index it.

This is specific to GitHub Pages. Netlify, Cloudflare Pages and Vercel all
support real rewrites, and the config for each is already in the repository
(`public/_redirects`, `vercel.json`); on those hosts the same addresses return
200 and are indexable.

If organic search traffic on individual palettes matters, that is the reason to
move. Everything else about the site behaves identically.

To narrow the gap without switching hosts, raise `PRERENDER_PALETTES` in
`src/lib/data.server.js`. Each additional 1000 palettes costs roughly 10 MB of
HTML plus 11 MB of PNGs, against a 1 GB ceiling, so around 20 000 pre-rendered
pages is the practical maximum, and re-running `npm run images` only renders
the new ones.

---

## Limits worth knowing

| Limit | Value | Where this site sits |
| --- | --- | --- |
| Published site size | 1 GB | ~105 MB at 100k palettes |
| Deployment timeout | 10 min | ~1 min for the artifact |
| Bandwidth (soft) | 100 GB/month | fine unless the site takes off |
| Builds per hour (soft) | 10 | does not apply to Actions workflows |

The workflow prints the size on every run and fails above 900 MB, so hitting
the ceiling shows up as a failed build rather than a silently broken deploy.

---

## After the first deploy

1. Open `https://palettevault.github.io`, cards should be styled. Unstyled
   means `.nojekyll` did not make it.
2. Like a palette, then check the Firebase console. Nothing appearing means the
   secrets are missing; the browser console will say which failure it was.
3. Submit `https://palettevault.github.io/sitemap.xml` in Google Search
   Console.
4. Update `SITE_URL` in `extension/src/lib/ui.js` so the Chrome extension links
   to the live site.

## Custom domain later

Add a `public/CNAME` file containing the bare domain, point a `CNAME` DNS
record at `palettevault.github.io`, then set the domain under Settings → Pages
and enable **Enforce HTTPS**. Also update `SITE_URL` in the workflow, otherwise
canonical tags and `og:image` keep pointing at the old origin.
