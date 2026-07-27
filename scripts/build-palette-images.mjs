#!/usr/bin/env node
/**
 * ============================================================================
 *  PALETTE IMAGE PIPELINE
 * ============================================================================
 *
 *  Renders a real PNG for every pre-rendered palette page, so that:
 *
 *    • the page can show an <img> instead of a <canvas>. A canvas cannot be
 *      right-clicked and saved, cannot be dragged out, and cannot be pinned;
 *    • `og:image` can point at that palette rather than the site-wide banner;
 *    • Pinterest's share endpoint has a real `media` URL to fetch. Pinterest
 *      downloads the image server-side, so blob: and data: URLs are useless
 *      to it — only a public http(s) URL works.
 *
 *  Two variants per palette:
 *    <slug>.png       1200x630  — Open Graph / Twitter, vertical bands
 *    <slug>-pin.png   1000x1500 — Pinterest, 2:3 portrait with labels
 *
 *  Pinterest ranks and crops around a 2:3 ratio; a 1200x630 landscape image
 *  gets letterboxed into a thin strip in the feed, which is why the portrait
 *  variant exists separately rather than reusing the OG one.
 *
 *  Only palettes that are actually pre-rendered as HTML get an image. Pages
 *  served through the rewrite fallback all share one HTML file, so they cannot
 *  carry per-palette metadata anyway — no image would ever be referenced.
 *
 *  Output is 8-bit palette PNG. Flat colour fields compress roughly 4x better
 *  that way: ~1 KB instead of ~3 KB per file, which matters across thousands.
 *
 *  Re-running skips palettes whose files already exist, so an interrupted run
 *  resumes and raising PRERENDER_PALETTES only renders the new pages. Pass
 *  FORCE=1 to re-render everything.
 *
 *  Requires Pillow. Run: npm run images
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getStaticLinkedRows } from '../src/lib/data.server.js';
import { paletteName, paletteSlug } from '../src/lib/palette.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/*
 * Output directory. Overridable with --out because writing several thousand
 * small files to a network or mounted volume is dramatically slower than to a
 * local disk; rendering elsewhere and copying the directory in one go can be
 * an order of magnitude faster.
 */
const outFlag = process.argv.slice(2).find((arg) => arg.startsWith('--out='));
const OUT_DIR = outFlag
  ? resolve(process.cwd(), outFlag.slice('--out='.length))
  : join(ROOT, 'public', 'p');

/* --------------------------------------------------------------------------
 * Collect the work list in Node, so slug and name come from the same modules
 * the site uses. Duplicating the naming logic in Python would guarantee the
 * image caption and the page heading drift apart eventually.
 * -------------------------------------------------------------------------- */
// Must match the set of pages that get built, not just the New-feed window:
// a page whose og:image 404s is worse than a page with no image.
const rows = getStaticLinkedRows();

if (rows.length === 0) {
  console.error('No palettes found. Run `npm run generate` first.');
  process.exit(1);
}

const jobs = rows.map((row) => {
  const colors = row.slice(1);
  return { slug: paletteSlug(colors), colors, name: paletteName(colors) };
});

const workDir = mkdtempSync(join(tmpdir(), 'palette-images-'));
const manifestPath = join(workDir, 'jobs.json');
writeFileSync(manifestPath, JSON.stringify(jobs), 'utf8');

console.log(`\n🖼   Rendering ${jobs.length.toLocaleString('en-US')} palette images`);
console.log(`    Output: ${OUT_DIR}\n`);

const PYTHON_SOURCE = String.raw`
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.environ["PROJECT_ROOT"]
OUT = os.environ["OUT_DIR"]
os.makedirs(OUT, exist_ok=True)

jobs = json.load(open(os.environ["JOBS"], encoding="utf-8"))


def load_font(size, bold=False):
    """Whichever sans face this machine actually has."""
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf" % ("-Bold" if bold else ""),
        "/usr/share/fonts/truetype/liberation/LiberationSans-%s.ttf"
        % ("Bold" if bold else "Regular"),
        "C:\\Windows\\Fonts\\segoeui%s.ttf" % ("b" if bold else ""),
        "C:\\Windows\\Fonts\\arial%s.ttf" % ("bd" if bold else ""),
    ):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


MONO_LG = load_font(30, True)
MONO_PIN = load_font(38, True)
NAME_PIN = load_font(58, True)


def is_dark(hex_value):
    """WCAG relative luminance, to choose readable label colour."""
    def channel(part):
        c = int(part, 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    lum = (
        0.2126 * channel(hex_value[0:2])
        + 0.7152 * channel(hex_value[2:4])
        + 0.0722 * channel(hex_value[4:6])
    )
    return lum < 0.45


def ink(hex_value):
    return (255, 255, 255) if is_dark(hex_value) else (0, 0, 0)


def save(image, path):
    # Quantise to 8-bit. Each image is four flat fills plus antialiased text,
    # so a small adaptive palette is plenty and cuts the file size several
    # times over. The text edges are what consume most of the colour slots.
    image.convert("P", palette=Image.ADAPTIVE, colors=16).save(path, optimize=True)


def render_og(job, width=1200, height=630):
    """Landscape, vertical bands — the shape Open Graph and Twitter expect."""
    image = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(image)
    band = width / len(job["colors"])

    for index, hex_value in enumerate(job["colors"]):
        x = index * band
        # +1 px overlap, otherwise antialiasing on fractional coordinates
        # leaves hairline seams between the bands.
        draw.rectangle((x, 0, x + band + 1, height), fill="#" + hex_value)
        draw.text(
            (x + band / 2, height - 52),
            "#" + hex_value.upper(),
            font=MONO_LG,
            fill=ink(hex_value),
            anchor="mm",
        )

    return image


def render_pin(job, width=1000, height=1500):
    """Portrait 2:3 — the ratio Pinterest crops and ranks around."""
    image = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(image)

    caption = 150
    body = height - caption
    band = body / len(job["colors"])

    for index, hex_value in enumerate(job["colors"]):
        y = index * band
        draw.rectangle((0, y, width, y + band + 1), fill="#" + hex_value)
        draw.text(
            (60, y + band / 2),
            "#" + hex_value.upper(),
            font=MONO_PIN,
            fill=ink(hex_value),
            anchor="lm",
        )

    # Caption strip: the palette name reads at feed thumbnail size, where the
    # HEX codes are already illegible.
    draw.rectangle((0, body, width, height), fill=(255, 255, 255))
    draw.text((60, body + caption / 2), job["name"], font=NAME_PIN, fill=(22, 24, 29), anchor="lm")

    return image


FORCE = os.environ.get("FORCE") == "1"

written = 0
skipped = 0

for job in jobs:
    slug = job["slug"]
    og_path = os.path.join(OUT, slug + ".png")
    pin_path = os.path.join(OUT, slug + "-pin.png")

    # Resume by default: a palette's colours fully determine its images, so a
    # file that already exists is already correct. This makes the script safe
    # to re-run after an interruption and turns a rebuild after raising
    # PRERENDER_PALETTES into work proportional to the new pages only.
    if not FORCE and os.path.exists(og_path) and os.path.exists(pin_path):
        skipped += 1
        continue

    save(render_og(job), og_path)
    save(render_pin(job), pin_path)

    written += 1
    if written % 250 == 0:
        print("   … %d rendered" % written)

total = sum(
    os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith(".png")
)
print(
    "\n✅  %d rendered, %d already present → %.1f MB total"
    % (written, skipped, total / 1048576)
)
print("    Directory: %s\n" % OUT)
`;

const result = spawnSync('python3', ['-c', PYTHON_SOURCE], {
  stdio: 'inherit',
  env: { ...process.env, PROJECT_ROOT: ROOT, JOBS: manifestPath, OUT_DIR },
});

rmSync(workDir, { recursive: true, force: true });

if (result.status !== 0) {
  console.error('\nImage build failed. Is Pillow installed?  pip install Pillow');
  process.exit(result.status ?? 1);
}
