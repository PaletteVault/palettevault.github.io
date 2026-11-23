---
title: 'OKLCH in CSS: A Better Way to Work with Colors'
description:
  'Learn how OKLCH works in CSS, why perceptual uniformity matters, and how to build consistent
  color palettes, accessible interfaces, and dark themes.'
published: 2026-11-23
accent: '4f7cf0'
tags: ['OKLCH', 'CSS', 'Color-Theory', 'Accessibility', 'Design-Systems']
image: ./images/oklch-css-guide.png
---

For years, frontend developers have relied on HEX, RGB, and HSL to define colors. They work, they're
familiar, and practically every design tool supports them.

But they have a fundamental limitation: they don't describe colors the way humans perceive them.

Take two colors with the same HSL lightness. One is yellow, the other is blue. Their numerical
lightness values may be identical, yet the yellow can appear dramatically brighter.

This becomes a problem when building a design system.

You create a palette with ten shades of blue, then try the same approach with orange or purple.
Suddenly, the colors don't feel consistent. Some shades look too dark, others too bright, and
adjusting the numbers becomes an exercise in trial and error.

OKLCH offers a better approach.

It's a modern CSS color space designed around human color perception. Instead of manipulating red,
green, and blue channels, you work with three properties that map more closely to how we experience
color: lightness, chroma, and hue.

The result is a more predictable way to build color palettes, generate hover states, create dark
themes, and manage visual hierarchy.

Let's see how it works.

## 1. What's wrong with HEX, RGB, and HSL?

HEX and RGB are perfectly valid ways to represent colors. The problem isn't accuracy. It's usability
when making perceptual adjustments.

Consider this color:

```css
.button {
  background: #2563eb;
}
```

Suppose we want a lighter version for a hover state.

We could manually modify the HEX value, convert it to RGB and adjust the channels, or use HSL.

```css
.button {
  background: hsl(220 80% 50%);
}

.button:hover {
  background: hsl(220 80% 60%);
}
```

HSL looks intuitive. It exposes hue, saturation, and lightness, making it seem ideal for generating
related colors.

Unfortunately, HSL lightness is not perceptually uniform.

A lightness of 50% doesn't mean that every hue will appear equally bright.

<div style="display:flex;flex-wrap:wrap;gap:12px;margin:1.5rem 0" role="img" aria-label="Yellow, blue and red swatches, all with HSL lightness 50 percent, appear very different in brightness">
  <div style="flex:1;min-width:120px;padding:28px 16px;border-radius:12px;background:hsl(60 100% 50%);color:#111"><strong>Yellow</strong><br><small>HSL L = 50%</small></div>
  <div style="flex:1;min-width:120px;padding:28px 16px;border-radius:12px;background:hsl(240 100% 50%);color:#fff"><strong>Blue</strong><br><small>HSL L = 50%</small></div>
  <div style="flex:1;min-width:120px;padding:28px 16px;border-radius:12px;background:hsl(0 100% 50%);color:#fff"><strong>Red</strong><br><small>HSL L = 50%</small></div>
</div>

All three colors have identical HSL lightness, but their perceived brightness differs substantially.

Yellow appears much brighter than blue, despite both having the same numerical lightness.

This happens because HSL is derived from RGB geometry rather than a perceptual model of human
vision.

As a result, changing HSL lightness by a fixed amount doesn't produce a consistent visual change
across different hues.

For one-off colors, this may not matter much.

For a design system with dozens of components, semantic tokens, light and dark themes, and multiple
brand palettes, it becomes a recurring problem.

## 2. What is perceptual uniformity?

Perceptual uniformity is the idea that similar numerical differences in a color space should
correspond to roughly similar differences in how humans perceive colors.

Imagine two pairs of colors.

In the first pair, the colors are barely distinguishable. In the second, they look dramatically
different.

A perceptually uniform color space aims to represent those visual differences more consistently
through numerical distances.

Traditional RGB and HSL aren't designed to do this.

OKLCH is based on Oklab, a perceptual color model developed by Björn Ottosson. It represents Oklab's
coordinates in a cylindrical format, making them easier to work with when designing palettes.

OKLCH isn't perfectly perceptually uniform in every situation. No practical color model completely
captures the complexity of human vision.

But it is substantially better suited to many UI color adjustments than HSL.

That's what makes it interesting for frontend development.

## 3. Understanding OKLCH syntax

An OKLCH color contains three main components:

```css
color: oklch(65% 0.18 250);
```

| Component | Value | Meaning            |
| --------- | ----- | ------------------ |
| Lightness | 65%   | How light or dark  |
| Chroma    | 0.18  | Color intensity    |
| Hue       | 250°  | Color family       |

### Lightness (L)

Lightness describes how light or dark a color appears.

It ranges from `0` (black) to `1` (white), or equivalently from `0%` to `100%`.

```css
.dark {
  color: oklch(25% 0.1 250);
}

.medium {
  color: oklch(55% 0.1 250);
}

.light {
  color: oklch(85% 0.1 250);
}
```

Higher lightness generally produces a visually lighter color.

Unlike HSL, OKLCH lightness is designed to correspond more closely to perceived lightness.

### Chroma (C)

Chroma describes how colorful a color is.

A chroma of zero produces a neutral gray, assuming the lightness is between black and white.

Increasing chroma makes the color more vivid, subject to the limitations of the display's color
gamut.

```css
.muted {
  color: oklch(65% 0.04 250);
}

.normal {
  color: oklch(65% 0.12 250);
}

.vibrant {
  color: oklch(65% 0.22 250);
}
```

Unlike HSL saturation, chroma isn't limited to a universal 0 to 100% scale. The maximum
representable chroma depends on lightness, hue, and the target gamut.

### Hue (H)

Hue represents the color family as an angle.

```css
.red {
  color: oklch(65% 0.18 30);
}

.green {
  color: oklch(65% 0.18 145);
}

.blue {
  color: oklch(65% 0.18 260);
}
```

The hue angles don't correspond exactly to HSL hue angles. For example, blue is typically around 260
degrees in OKLCH, rather than 240 degrees in HSL.

There's also optional alpha transparency:

```css
.overlay {
  background: oklch(50% 0.12 260 / 0.5);
}
```

This gives us a practical way to control color appearance without directly manipulating RGB
channels.

## 4. Changing lightness without changing the color's character

This is where OKLCH becomes particularly useful.

Suppose we have a blue button and want to create lighter and darker variations. With RGB, we'd have
to adjust multiple channels. With HSL, changing lightness might produce uneven visual results.

With OKLCH, we can keep chroma and hue constant while adjusting only lightness.

```css
.button {
  background: oklch(60% 0.16 260);
}

.button:hover {
  background: oklch(68% 0.16 260);
}

.button:active {
  background: oklch(52% 0.16 260);
}
```

The hue stays at `260`, and chroma remains `0.16`. Only the lightness changes.

<div style="display:flex;border-radius:12px;overflow:hidden;margin:1.5rem 0 0.5rem" role="img" aria-label="Five blue swatches from 40 to 80 percent OKLCH lightness at chroma 0.16 and hue 260">
  <div style="flex:1;padding:24px 8px;text-align:center;background:oklch(40% 0.16 260);color:#fff">40%</div>
  <div style="flex:1;padding:24px 8px;text-align:center;background:oklch(50% 0.16 260);color:#fff">50%</div>
  <div style="flex:1;padding:24px 8px;text-align:center;background:oklch(60% 0.16 260);color:#fff">60%</div>
  <div style="flex:1;padding:24px 8px;text-align:center;background:oklch(70% 0.16 260);color:#111">70%</div>
  <div style="flex:1;padding:24px 8px;text-align:center;background:oklch(80% 0.16 260);color:#111">80%</div>
</div>

_A lightness scale with constant chroma (0.16) and hue (260). Actual displayed colors depend on
gamut support and mapping._

These colors are related in a more perceptually meaningful way than equivalent steps in HSL.

But there's an important catch.

**Equal lightness steps don't guarantee equal contrast ratios.**

A color's contrast against its background depends on both colors. Changing the lightness of one
color changes that relationship, and the resulting contrast difference is not necessarily linear.

There's another limitation: not every combination of OKLCH lightness, chroma, and hue can be
displayed in sRGB.

If a requested color falls outside the available gamut, the browser may map it to a displayable
color. This can change the resulting chroma and sometimes the apparent hue.

In other words, keeping chroma and hue constant is a useful starting point, not a guarantee of
identical color appearance.

## 5. Try it yourself

Instead of guessing what a color will look like, experiment with its three coordinates
independently. The [OKLCH color picker](/tools/oklch/) on this site lets you move lightness, chroma,
and hue one at a time and see the result next to its HEX value.

Try setting chroma to zero. Regardless of the hue, the resulting color becomes neutral.

Now increase chroma and move the hue slider. You can explore different color families without
changing the specified lightness.

Finally, adjust lightness while leaving the other values unchanged.

This separation of responsibilities is one of the biggest advantages of OKLCH.

## 6. Building a consistent color palette

A design system rarely uses a single brand color.

Most applications need a range of shades for backgrounds, borders, buttons, hover states, disabled
elements, and text.

With OKLCH, we can start with one hue and build a scale around it.

```css
:root {
  --blue-50: oklch(97% 0.015 260);
  --blue-100: oklch(93% 0.035 260);
  --blue-200: oklch(86% 0.065 260);
  --blue-300: oklch(77% 0.105 260);
  --blue-400: oklch(68% 0.145 260);
  --blue-500: oklch(59% 0.18 260);
  --blue-600: oklch(50% 0.18 260);
  --blue-700: oklch(42% 0.15 260);
  --blue-800: oklch(34% 0.115 260);
  --blue-900: oklch(26% 0.075 260);
}
```

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:6px;margin:1.5rem 0" role="img" aria-label="A ten-step blue palette from 50 to 900">
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(97% 0.015 260);color:#111"><strong>50</strong><br>97% / 0.015</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(93% 0.035 260);color:#111"><strong>100</strong><br>93% / 0.035</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(86% 0.065 260);color:#111"><strong>200</strong><br>86% / 0.065</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(77% 0.105 260);color:#111"><strong>300</strong><br>77% / 0.105</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(68% 0.145 260);color:#111"><strong>400</strong><br>68% / 0.145</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(59% 0.18 260);color:#fff"><strong>500</strong><br>59% / 0.180</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(50% 0.18 260);color:#fff"><strong>600</strong><br>50% / 0.180</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(42% 0.15 260);color:#fff"><strong>700</strong><br>42% / 0.150</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(34% 0.115 260);color:#fff"><strong>800</strong><br>34% / 0.115</div>
  <div style="padding:18px 6px;border-radius:8px;text-align:center;font-size:0.8em;background:oklch(26% 0.075 260);color:#fff"><strong>900</strong><br>26% / 0.075</div>
</div>

Notice that chroma isn't constant throughout the scale.

Very light and very dark colors often benefit from lower chroma. Keeping chroma extremely high near
the ends of the lightness range can create out-of-gamut colors or visually awkward results.

That's why a useful palette usually adjusts both lightness and chroma.

This example is a starting palette, not a mathematically optimized one. Its steps should be reviewed
on the actual target display and against the backgrounds where they'll be used.

### Generating palettes with CSS relative colors

Modern CSS also supports relative color syntax, which lets us derive new colors from an existing
one.

```css
:root {
  --brand: oklch(60% 0.17 260);

  --brand-hover: oklch(from var(--brand) calc(l + 0.08) c h);

  --brand-active: oklch(from var(--brand) calc(l - 0.08) c h);
}
```

Here, `l`, `c`, and `h` refer to the original color's channels.

The lightness channel in relative OKLCH syntax is represented numerically on a 0 to 1 scale. Adding
`0.08` therefore increases lightness by eight percentage points.

This is different from adding `8`, which would be far outside the intended range.

The advantage is that the derived colors follow the base token automatically.

Change `--brand`, and its hover and active variations change with it.

For a larger design system, you can combine this technique with CSS custom properties to reduce
repetitive color definitions.

## 7. OKLCH and accessible color contrast

One of the most misleading claims about OKLCH is that perceptual uniformity automatically makes
interfaces accessible.

It doesn't.

OKLCH lightness is designed to correlate with perceived lightness, but WCAG contrast ratios are
calculated using relative luminance, not OKLCH lightness.

These are related concepts, but they aren't interchangeable.

For example:

```css
.button {
  background: oklch(60% 0.18 260);
  color: white;
}
```

This combination might look readable at first glance. That doesn't mean it meets the required
contrast ratio for normal-sized text.

Under WCAG 2.x, the usual minimum contrast ratios are:

| Content                       | WCAG AA |
| ----------------------------- | ------- |
| Normal text                   | 4.5:1   |
| Large text                    | 3:1     |
| Relevant non-text UI graphics | 3:1     |

Large text generally means at least 18pt regular or 14pt bold. The 3:1 non-text requirement applies
to visual information needed to identify components and their states, with exceptions.

### A practical contrast workflow

Rather than choosing a color based only on appearance, start with the intended text and background
combination.

Then adjust the background's OKLCH lightness until the contrast checker reports an acceptable
result.

For example:

```css
:root {
  --button-bg: oklch(50% 0.18 260);
  --button-text: #ffffff;
}

.button {
  background: var(--button-bg);
  color: var(--button-text);
}
```

If the contrast is insufficient, lower the background lightness and test again.

This is usually more predictable than manually editing three RGB channels.

However, don't assume that a particular OKLCH lightness value guarantees a given contrast ratio
across every hue and chroma.

It doesn't.

The actual rendered color, including any gamut mapping, must be checked.

Useful tools include the [OKLCH Color Picker](https://oklch.com/) and the
[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

### Why lightness matters for UI hierarchy

Contrast isn't just about passing an accessibility test.

Interfaces also need visual hierarchy.

Primary buttons should stand out from secondary controls. Borders should be visible without
dominating the layout. Disabled elements should look different from active ones.

OKLCH makes it easier to build these relationships systematically.

For instance, a design system might define semantic tokens:

```css
:root {
  --surface: oklch(99% 0.005 260);
  --surface-muted: oklch(95% 0.01 260);

  --text-primary: oklch(22% 0.02 260);
  --text-secondary: oklch(43% 0.025 260);

  --border: oklch(83% 0.015 260);

  --accent: oklch(50% 0.18 260);
}
```

These tokens express a deliberate hierarchy of lightness.

But their final contrast relationships should still be verified, especially for secondary text,
borders, and interactive controls.

## 8. Creating dark themes with OKLCH

Dark mode is another area where OKLCH can simplify color management.

A common mistake is to invert a light theme mechanically.

White becomes black. Dark text becomes white. Bright accent colors remain unchanged.

The result often feels harsh.

A better dark theme uses a carefully chosen lightness hierarchy, with muted backgrounds and accent
colors adjusted for their new surroundings.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:1.5rem 0" role="img" aria-label="The same settings card rendered with light theme tokens and dark theme tokens">
  <div style="padding:20px;border-radius:12px;background:oklch(98% 0.006 260);border:1px solid oklch(88% 0.015 260)">
    <div style="font-size:0.75em;color:oklch(43% 0.025 260);margin-bottom:10px">Light theme</div>
    <div style="padding:16px;border-radius:10px;background:oklch(94% 0.01 260)">
      <div style="font-weight:700;color:oklch(24% 0.02 260)">Account settings</div>
      <div style="font-size:0.9em;color:oklch(43% 0.025 260);margin:4px 0 14px">Manage your preferences</div>
      <span style="display:inline-block;padding:8px 14px;border-radius:8px;background:oklch(50% 0.18 260);color:#fff;font-size:0.9em;font-weight:600">Save changes</span>
    </div>
  </div>
  <div style="padding:20px;border-radius:12px;background:oklch(16% 0.015 260);border:1px solid oklch(30% 0.02 260)">
    <div style="font-size:0.75em;color:oklch(76% 0.02 260);margin-bottom:10px">Dark theme</div>
    <div style="padding:16px;border-radius:10px;background:oklch(23% 0.02 260)">
      <div style="font-weight:700;color:oklch(94% 0.01 260)">Account settings</div>
      <div style="font-size:0.9em;color:oklch(76% 0.02 260);margin:4px 0 14px">Manage your preferences</div>
      <span style="display:inline-block;padding:8px 14px;border-radius:8px;background:oklch(72% 0.14 260);color:#101827;font-size:0.9em;font-weight:600">Save changes</span>
    </div>
  </div>
</div>

The key is to treat dark mode as a separate palette, not simply an inversion.

```css
:root {
  color-scheme: light;

  --surface: oklch(98% 0.006 260);
  --surface-raised: oklch(94% 0.01 260);

  --text: oklch(24% 0.02 260);
  --text-muted: oklch(43% 0.025 260);

  --accent: oklch(50% 0.18 260);
  --accent-text: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;

    --surface: oklch(16% 0.015 260);
    --surface-raised: oklch(23% 0.02 260);

    --text: oklch(94% 0.01 260);
    --text-muted: oklch(76% 0.02 260);

    --accent: oklch(72% 0.14 260);
    --accent-text: #101827;
  }
}
```

In the dark theme, the accent color has higher lightness but lower chroma.

That helps it remain visible against dark surfaces without becoming excessively saturated.

Notice that the accent text also changes from white to a dark color. Increasing the accent
background's lightness without reconsidering its text color could reduce contrast.

This is why lightness, contrast, and theme design need to be considered together.

## 9. Better gradients with OKLCH

Gradients expose another weakness of traditional RGB interpolation.

When the browser interpolates colors in a space that doesn't correspond well to perception,
transitions can look muddy or take an unexpected route through the color spectrum.

CSS lets us specify the interpolation color space.

```css
.gradient {
  background: linear-gradient(90deg in oklch, oklch(65% 0.2 300), oklch(70% 0.18 190));
}
```

Compare RGB and OKLCH interpolation using the same endpoints.

<div style="margin:1.5rem 0" role="img" aria-label="Two gradients with the same purple and teal endpoints, one interpolated in sRGB and one in OKLCH">
  <div style="font-size:0.85em;margin-bottom:6px">RGB interpolation</div>
  <div style="height:56px;border-radius:10px;background:linear-gradient(90deg in srgb, oklch(65% 0.2 300), oklch(70% 0.18 190))"></div>
  <div style="font-size:0.85em;margin:14px 0 6px">OKLCH interpolation</div>
  <div style="height:56px;border-radius:10px;background:linear-gradient(90deg in oklch, oklch(65% 0.2 300), oklch(70% 0.18 190))"></div>
</div>

_The same endpoints can produce different intermediate colors depending on the interpolation
space._

OKLCH interpolation often produces more visually consistent transitions, particularly between
saturated colors.

But it isn't always the best choice.

Hue interpolation can travel through colors you didn't intend. CSS provides options such as
`shorter hue` and `longer hue` to control the direction.

```css
.gradient {
  background: linear-gradient(
    90deg in oklch shorter hue,
    oklch(65% 0.2 300),
    oklch(70% 0.18 190)
  );
}
```

For gradients that need to remain visually neutral or follow a specific artistic direction, you
should still inspect the intermediate colors.

Perceptual color spaces make gradients easier to control. They don't replace design judgment.

## 10. Understanding color gamut limitations

Here's something worth knowing before converting an entire design system to OKLCH.

Not every mathematically valid OKLCH color can be represented by every display.

Most conventional web colors are designed around sRGB. Modern wide-gamut displays can reproduce a
larger range of colors, often using Display P3.

OKLCH can describe colors beyond both gamuts.

Consider:

```css
.vibrant {
  background: oklch(70% 0.35 150);
}
```

This requests a highly chromatic green. Depending on the target display and browser, the color may
need to be mapped into the available gamut.

The rendered result may not preserve the exact requested chroma.

### Fallbacks and @supports

You can provide a conventional fallback for older browsers:

```css
.button {
  background: #2563eb;
  background: oklch(55% 0.2 260);
}
```

Browsers that understand OKLCH use the second declaration. Browsers that don't understand it retain
the HEX color.

The two colors here are illustrative, not exact equivalents. For a production fallback, convert the
intended OKLCH color to a suitable sRGB value.

You can also use feature queries:

```css
.card {
  background: #f1f5f9;
}

@supports (color: oklch(90% 0.02 260)) {
  .card {
    background: oklch(95% 0.02 260);
  }
}
```

Modern browsers support OKLCH, but compatibility still matters when targeting older browsers or
embedded webviews. Relative color syntax and advanced interpolation features should be checked
separately from basic OKLCH support.

For current support information, consult
[Can I Use: CSS LCH and Lab colors](https://caniuse.com/css-lch-lab).

## 11. A practical design token system

Let's combine everything into a small CSS foundation.

Instead of scattering HEX values across components, we'll define semantic tokens using OKLCH.

```css
:root {
  color-scheme: light;

  /* Brand */
  --brand-l: 55%;
  --brand-c: 0.18;
  --brand-h: 260;

  --brand: oklch(var(--brand-l) var(--brand-c) var(--brand-h));

  --brand-hover: oklch(from var(--brand) calc(l - 0.06) c h);

  /* Surfaces */
  --surface: oklch(99% 0.005 260);
  --surface-raised: oklch(96% 0.008 260);

  /* Text */
  --text-primary: oklch(22% 0.02 260);
  --text-secondary: oklch(43% 0.025 260);

  /* Borders */
  --border: oklch(85% 0.015 260);
}
```

Components can now consume these tokens without knowing how the underlying colors are represented.

```css
.card {
  background: var(--surface-raised);
  color: var(--text-primary);

  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
}

.button {
  background: var(--brand);
  color: white;

  border: 0;
  border-radius: 8px;
  padding: 12px 20px;

  cursor: pointer;
}

.button:hover {
  background: var(--brand-hover);
}
```

This structure has a few advantages.

Changing the brand hue becomes straightforward. Creating a lighter or darker variation doesn't
require manually editing RGB channels. And semantic tokens make it easier to implement themes
consistently.

Still, don't automatically derive every token from a single base color.

Some colors need independent tuning, especially text, borders, focus indicators, and status colors.
Their purpose matters more than maintaining a perfectly mathematical palette.

The example button also needs a contrast check before production use.

## 12. When should you use OKLCH?

OKLCH is especially useful when you're building a system rather than choosing an isolated color.

| Task                    | Why OKLCH helps                                                         |
| ----------------------- | ----------------------------------------------------------------------- |
| Brand color palettes    | More consistent lightness adjustments                                   |
| Hover and active states | Easier variations from a base color                                     |
| Dark mode               | Better control of surface and accent lightness                          |
| Design tokens           | Meaningful color coordinates                                            |
| Gradients               | Perceptually informed interpolation                                     |
| Multi-brand interfaces  | Easier hue changes while preserving approximate lightness relationships |

There are also situations where HEX or RGB remains perfectly reasonable.

If you're matching an exact brand color, copying a value from a design specification, or working
with a legacy codebase, converting everything to OKLCH may provide little immediate benefit.

HEX is also concise and easy to recognize.

The point isn't that RGB is obsolete. Screens still ultimately render colors through device color
channels, and CSS color spaces must be converted into displayable values.

The advantage of OKLCH is that it provides a better interface for _working with_ colors.

## 13. Useful OKLCH tools

**[Palette Vault OKLCH picker](/tools/oklch/).** Pick a color by lightness, chroma, and hue, and
copy it as OKLCH or HEX.

**[OKLCH Color Picker](https://oklch.com/).** An interactive color picker with gamut visualization.
Useful for experimenting with lightness, chroma, and hue.

**[Harmonizer](https://harmonizer.evilmartians.com/).** A tool for exploring harmonious color
palettes, particularly useful when developing a visual identity.

**[Leonardo](https://leonardocolor.io/).** An accessible color palette generator that helps explore
color relationships and contrast requirements.

## Conclusion

HEX and RGB aren't going anywhere. They're simple, familiar, and still useful for representing exact
colors.

But when it comes to designing color systems, they aren't always the most intuitive tools.

OKLCH changes the way we approach color by separating perceived lightness, chroma, and hue into
coordinates that are easier to reason about.

Want a lighter button? Adjust lightness.

Need a more muted accent? Reduce chroma.

Building another brand theme? Change hue, then review the resulting palette.

These operations are more predictable than manipulating RGB channels or relying on HSL's misleading
lightness scale.

There are limitations, of course. OKLCH doesn't guarantee accessibility, and not every color fits
within the available display gamut. You still need to check contrast, test your themes, and inspect
the rendered results.

But it gives frontend developers a much stronger foundation for those decisions.

If you're building a modern design system, experimenting with CSS color functions, or struggling to
keep your light and dark themes consistent, OKLCH is well worth learning.

You don't have to abandon HEX tomorrow. Start by using OKLCH for your next palette, and you'll
quickly see why perceptual color spaces are becoming an important part of modern CSS.

### Further reading

- [MDN: oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [W3C: CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)
- [W3C: CSS Color Module Level 5](https://www.w3.org/TR/css-color-5/)
- [Björn Ottosson: A perceptual color space for image processing](https://bottosson.github.io/posts/oklab/)
- [WCAG: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
