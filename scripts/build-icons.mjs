#!/usr/bin/env node
/**
 * ============================================================================
 *  ICON PIPELINE
 * ============================================================================
 *
 *  Takes the master artwork at public/icon.png and produces every icon the
 *  site needs: favicons, an Apple touch icon, PWA icons and an Open Graph
 *  banner.
 *
 *  Steps:
 *    1. Trim the white margin around the badge so the artwork fills the frame.
 *    2. Punch transparent rounded corners with an alpha mask, so the icon sits
 *       cleanly on any browser chrome instead of showing white corners.
 *    3. Resize to every required size with Lanczos resampling.
 *    4. Compose a 1200x630 Open Graph banner from the icon plus a colour strip
 *       sampled from the artwork itself.
 *
 *  Requires Pillow (Python). Run: npm run icons
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PYTHON_SOURCE = String.raw`
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.environ["PROJECT_ROOT"]
PUBLIC = os.path.join(ROOT, "public")
SOURCE = os.path.join(PUBLIC, "icon.png")

if not os.path.exists(SOURCE):
    raise SystemExit("public/icon.png not found")

master = Image.open(SOURCE).convert("RGBA")

# --- 1. Trim the near-white margin ------------------------------------------
# A plain getbbox() would not help: the margin is white, not transparent.
# So build a mask of "anything that is not near-white" and use its bounds.
rgb = master.convert("RGB")
pixels = rgb.load()
width, height = rgb.size

def is_background(pixel):
    r, g, b = pixel
    return r > 244 and g > 244 and b > 244

left, top, right, bottom = width, height, 0, 0
for y in range(height):
    for x in range(width):
        if not is_background(pixels[x, y]):
            left = min(left, x)
            right = max(right, x)
            top = min(top, y)
            bottom = max(bottom, y)

if right <= left or bottom <= top:
    raise SystemExit("could not find artwork bounds in icon.png")

cropped = master.crop((left, top, right + 1, bottom + 1))

# Pad to a square so nothing is distorted when resizing.
side = max(cropped.size)
square = Image.new("RGBA", (side, side), (255, 255, 255, 0))
square.paste(
    cropped,
    ((side - cropped.width) // 2, (side - cropped.height) // 2),
)

print("trimmed %s -> %s" % (master.size, square.size))

# --- 2. Transparent rounded corners -----------------------------------------
# 22% of the side matches the radius already drawn in the artwork, so the mask
# follows the existing silhouette instead of clipping into it.
SUPERSAMPLE = 4
radius = int(side * 0.22)
mask_big = Image.new("L", (side * SUPERSAMPLE, side * SUPERSAMPLE), 0)
ImageDraw.Draw(mask_big).rounded_rectangle(
    (0, 0, side * SUPERSAMPLE - 1, side * SUPERSAMPLE - 1),
    radius=radius * SUPERSAMPLE,
    fill=255,
)
# Downsampling a 4x mask is what gives smooth, non-jagged corners.
mask = mask_big.resize((side, side), Image.LANCZOS)

icon = square.copy()
icon.putalpha(mask)

# --- 3. Every size the site needs -------------------------------------------
OUTPUTS = [
    ("favicon-16.png", 16),
    ("favicon-32.png", 32),
    ("favicon-48.png", 48),
    ("icon-192.png", 192),
    ("icon-512.png", 512),
]

for name, size in OUTPUTS:
    icon.resize((size, size), Image.LANCZOS).save(
        os.path.join(PUBLIC, name), optimize=True
    )
    print("wrote %s (%dx%d)" % (name, size, size))

# Multi-resolution .ico for legacy browsers and pinned tabs.
icon.resize((256, 256), Image.LANCZOS).save(
    os.path.join(PUBLIC, "favicon.ico"),
    sizes=[(16, 16), (32, 32), (48, 48)],
)
print("wrote favicon.ico (16/32/48)")

# iOS ignores transparency and composites against black, which would ruin the
# rounded corners. Flatten onto white and let the OS apply its own mask.
apple = Image.new("RGB", (180, 180), (255, 255, 255))
apple.paste(square.resize((180, 180), Image.LANCZOS).convert("RGB"), (0, 0))
apple.save(os.path.join(PUBLIC, "apple-touch-icon.png"), optimize=True)
print("wrote apple-touch-icon.png (180x180, opaque)")

# --- 4. Open Graph banner ----------------------------------------------------
# Social crawlers need a fixed 1200x630 image; a square icon gets cropped badly.
OG_W, OG_H = 1200, 630
banner = Image.new("RGB", (OG_W, OG_H), (255, 255, 255))

# Sample four representative colours straight from the artwork corners so the
# strip always matches whatever icon.png happens to contain.
small = square.convert("RGB").resize((4, 4), Image.LANCZOS)
strip_colors = [small.getpixel((0, 0)), small.getpixel((3, 0)),
                small.getpixel((0, 3)), small.getpixel((3, 3))]

strip_height = 14
band_width = OG_W // len(strip_colors)
draw = ImageDraw.Draw(banner)
for index, color in enumerate(strip_colors):
    x0 = index * band_width
    x1 = OG_W if index == len(strip_colors) - 1 else x0 + band_width
    draw.rectangle((x0, OG_H - strip_height, x1, OG_H), fill=color)

logo_size = 216
logo = square.resize((logo_size, logo_size), Image.LANCZOS)
logo_x = 108
logo_y = (OG_H - strip_height - logo_size) // 2
banner.paste(logo, (logo_x, logo_y), logo)


def load_font(size, bold=False):
    """Pick whichever sans face the build machine actually has."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf" % ("-Bold" if bold else ""),
        "/usr/share/fonts/truetype/liberation/LiberationSans-%s.ttf"
        % ("Bold" if bold else "Regular"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


text_x = logo_x + logo_size + 56
draw.text((text_x, logo_y + 40), "Palette Vault", font=load_font(66, True), fill=(22, 24, 29))
draw.text(
    (text_x, logo_y + 128),
    "Thousands of colour palettes",
    font=load_font(34),
    fill=(118, 124, 138),
)
draw.text(
    (text_x, logo_y + 174),
    "Copy any HEX in one click",
    font=load_font(34),
    fill=(118, 124, 138),
)

banner.save(os.path.join(PUBLIC, "og-image.png"), optimize=True)
print("wrote og-image.png (1200x630)")
`;

const result = spawnSync('python3', ['-c', PYTHON_SOURCE], {
  stdio: 'inherit',
  env: { ...process.env, PROJECT_ROOT: ROOT },
});

if (result.status !== 0) {
  console.error('\nIcon build failed. Is Pillow installed?  pip install Pillow');
  process.exit(result.status ?? 1);
}
