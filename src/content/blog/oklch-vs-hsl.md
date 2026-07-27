---
title: 'OKLCH vs HSL: why your color scale looks uneven'
description: 'HSL lightness does not match what the eye sees, which is why HSL scales go chalky in the middle and muddy at the end. What OKLCH fixes, and what it costs.'
published: 2026-07-26
accent: '4f7cf0'
tags: ['color spaces', 'CSS', 'accessibility']
---

Pick a blue in HSL, then build a scale by stepping the lightness: 90%, 80%, 70%, and so on down to 10%. Do the same with a yellow. Put the two scales side by side and something is clearly wrong. The blues bunch up at the dark end and the yellows bunch up at the light end, and the two scales do not look like they belong to the same system, even though the numbers are identical.

This is not a mistake in how you built the scale. It is HSL working exactly as designed, and the design has a flaw the eye notices immediately.

## The problem with HSL lightness

Here are two colors that HSL claims are equally light:

```css
.a { background: hsl(60 100% 50%); }   /* yellow */
.b { background: hsl(240 100% 50%); }  /* blue */
```

Both are at 50% lightness. Look at them and the yellow is glaring while the blue is nearly black. Measure them and the gap is not subtle — the yellow has nearly thirteen times the relative luminance of the blue.

The reason is that HSL was never built to model perception. It is a straightforward geometric rearrangement of the RGB cube into a cylinder, which made it easy to compute on 1970s hardware. "Lightness" in HSL is just the midpoint between the largest and smallest RGB channel. For yellow, `rgb(255 255 0)`, that midpoint is 127.5. For blue, `rgb(0 0 255)`, it is also 127.5. The arithmetic agrees. Your eye does not, because the eye is far more sensitive to green light than to blue, and yellow is mostly green.

So every HSL scale inherits a distortion that changes with hue. That is why a yellow scale and a blue scale built from the same lightness values will never look like siblings.

## What OKLCH changes

OKLCH is the cylindrical form of Oklab, a color space published by Björn Ottosson in 2020 and designed around one goal: equal numeric steps should look like equal steps. It has the same three axes as HSL, in a different order and with different meanings.

**Lightness** runs 0% to 100% and is perceptual. Move from 40% to 50% and it looks exactly as much lighter as moving from 70% to 80%. Set two colors to the same lightness and they will read as equally light regardless of hue — the yellow-versus-blue problem simply does not occur.

**Chroma** is colorfulness. It starts at 0 for grey and, unlike HSL saturation, is not a percentage of anything.

**Hue** is an angle in degrees, spaced more evenly around the circle than HSL manages.

The practical payoff shows up the moment you build anything with more than one color in it:

```css
:root {
  --blue-100: oklch(96% 0.02 262); /* #ecf2fe */
  --blue-300: oklch(82% 0.08 262); /* #a7c5fb */
  --blue-500: oklch(63% 0.18 262); /* #4883f6 */
  --blue-700: oklch(45% 0.19 262); /* #0c49bd */
  --blue-900: oklch(25% 0.11 262); /* #021b54 */
}
```

Hue is held constant, lightness walks down in even steps, and chroma tapers at both ends because very light and very dark colors physically hold less of it. Swap 262 for any other hue and the scale keeps its shape. That is the thing HSL cannot do.

Note the taper is not decoration. Push `--blue-100` to a chroma of 0.03 and it stops being displayable at all — at 96% lightness there is only about 0.019 of chroma available at this hue. Which brings us to the awkward part.

## Gradients stop going grey

The same property fixes a problem you have probably worked around without naming it. Interpolate between two saturated colors in sRGB and the midpoint loses saturation, because the straight line between them passes near the centre of the color solid, which is grey.

```css
/* Midpoint drifts toward grey */
background: linear-gradient(90deg, #0066ff, #ff0066);

/* Midpoint stays saturated */
background: linear-gradient(in oklch 90deg, #0066ff, #ff0066);
```

The `in oklch` keyword tells the browser which space to interpolate in. Blue to pink is the case where the difference is most obvious — in sRGB the middle turns a dull mauve.

There is one trap. In a cylindrical space the browser has to decide which way around the hue circle to travel, and for colors that are nearly opposite it can take the long way, sweeping through hues that belong to neither end. If a gradient suddenly detours through green, add `shorter hue`:

```css
background: linear-gradient(in oklch shorter hue 90deg, #0066ff, #ff0066);
```

## The part that is genuinely harder

OKLCH is not a free upgrade, and the honest version of this comparison has to include the cost.

HSL saturation is always 0–100%, and 100% always means something. Chroma has no such ceiling. Real values run from 0 to roughly 0.37, but the usable maximum at any moment depends on the other two axes, because the set of colors a screen can display is a lopsided solid in OKLCH whose edge moves with both lightness and hue.

Concretely: `oklch(65% 0.2 262)` is an ordinary blue. `oklch(95% 0.2 100)` is a pale yellow that no monitor can show — at 95% lightness there is almost no chroma available at any hue, and the browser will quietly map it to something displayable. Nothing warns you. The value is valid CSS and renders fine; it just is not the color you asked for.

This is the one place where a picker earns its keep. Our [OKLCH picker](/tools/oklch/) marks the exact point on the chroma track where the current lightness and hue leave the sRGB gamut, and a second marker for Display P3, so you can see how much headroom you have instead of discovering the limit by accident.

## Wide gamut, and when to care

Because OKLCH describes colors independently of any particular screen, it can express colors outside sRGB — which is the point, if you are targeting the P3 displays now standard on Apple hardware and most OLED phones.

Two different things can go wrong, and they need different responses. A browser too old to parse `oklch()` discards the declaration, so it needs an earlier one to fall back to. A current browser in front of an sRGB monitor parses it fine and gamut-maps the result, which needs nothing from you.

The first case takes one extra line:

```css
.button {
  background: #407aea;             /* every browser */
  background: oklch(60% 0.18 262); /* dropped by old ones */
}
```

That is enough for most work, since later declarations win and unparseable ones are discarded. Where you want a genuinely more saturated color on wide-gamut screens rather than a mapped approximation, put the upgrade behind a feature query:

```css
.button { background: #2f75ff; } /* closest sRGB match */

@supports (color: oklch(0% 0 0)) {
  .button { background: oklch(60% 0.22 262); } /* outside sRGB */
}
```

Support is good now — current Chrome, Edge, Safari and Firefox all handle `oklch()`. The fallback is about older versions still in the wild, not about a feature nobody has shipped.

## What OKLCH does not do

One clarification worth making, because it causes real bugs. Perceptual lightness is not the same thing as WCAG contrast, and equal lightness steps do not give you equal contrast ratios.

WCAG contrast is computed from relative luminance with its own weighting, and it is a ratio, not a difference. Take the scale above: `--blue-900` reaches 16.3:1 against white, `--blue-500` only 3.6:1, and `--blue-100` a useless 1.1:1. The lightness steps between them are even; the ratios are nothing of the kind, because a ratio compresses hard at the light end. OKLCH makes a scale look even, which is a design property; it does not certify that any pair of steps is legible together. Check the pairs you actually ship in a [contrast checker](/tools/contrast/).

Similarly, OKLCH will not tell you which colors go together. It makes relationships easier to express and adjust — same hue, different lightness; same lightness, different hue — but choosing the hues is still a design decision.

## Where to start

Converting a single brand color to OKLCH gains you nothing on its own. The value appears the moment you need a second color that relates to the first.

So the useful first step is a scale. Take a color you already use, drop it into the [color picker](/tools/picker/) to see an eleven-step ramp generated in OKLCH, and compare it against whatever your current scale is. If your existing mid-tones look chalkier and your dark end muddier, you have found the HSL distortion in your own design system.

From there, the [palette generator](/tools/generate/) builds four-color schemes in OKLCH, and every palette on this site was generated that way — which is why they hold together at a glance rather than looking like four colors that happen to share a page.
