/**
 * ============================================================================
 *  COLOR CATALOG
 * ============================================================================
 *
 *  Every color that gets its own page at /colors/<slug>/.
 *
 *  Two tiers share one route:
 *
 *    plain   name, hex and the palette tag it draws from. The page builds
 *            itself from measured values — shade scale, conversions, contrast
 *            — and needs no hand-written copy.
 *    rich    the same, plus `lead`, `named`, `sections` and `faq`. These are
 *            the colors worth ranking for, where the value is in the prose.
 *
 *  Hex values for CSS keywords are taken from the CSS Color specification.
 *  Everything else is a conventional value for the name.
 *
 *  `tag` picks which palette category feeds the grid. It is not always the
 *  obvious one: coral measures as orange, so /colors/coral/ shows orange
 *  palettes rather than red ones.
 *
 *  `featured` marks the thirteen shown on the home page.
 * ============================================================================
 */

export const COLORS = [
  /* ------------------------------------------------------------ families -- */
  /*
   * Not a single color, so `kind: 'family'` skips the value card and the shade
   * scale — neither means anything for a group — and leads with the named
   * shades instead.
   */
  {
    slug: 'pastel',
    name: 'Pastel',
    kind: 'family',
    hex: 'faccdc',
    tag: 'pastel',
    featured: true,
    h1: 'Pastel color palettes and soft color schemes',
    title: 'Pastel Colors — Soft Color Palettes with Hex Codes',
    lead: [
      'Pastel colors are soft, light and low in saturation — the pale pinks, '
      + 'mints and lilacs that make an interface feel calm rather than loud. '
      + 'Every pastel palette below is four such shades chosen to sit '
      + 'together, with hex codes ready to copy.',
    ],
    named: [
      { name: 'Pastel pink', hue: 355, L: 0.89, C: 0.055 },
      { name: 'Pastel peach', hue: 40, L: 0.89, C: 0.055 },
      { name: 'Pastel butter', hue: 92, L: 0.89, C: 0.055 },
      { name: 'Pastel mint', hue: 150, L: 0.89, C: 0.055 },
      { name: 'Pastel aqua', hue: 195, L: 0.89, C: 0.055 },
      { name: 'Pastel sky', hue: 240, L: 0.89, C: 0.055 },
      { name: 'Pastel lilac', hue: 290, L: 0.89, C: 0.055 },
      { name: 'Pastel lavender', hue: 315, L: 0.89, C: 0.055 },
    ],
    sections: [
      {
        h2: 'What makes a color pastel',
        paragraphs: [
          'A pastel is a hue with the volume turned down: high lightness, low '
          + 'chroma, but never so low that the hue disappears. That last part '
          + 'is what separates a pastel from a plain grey tint — pastel sky '
          + 'still reads as blue.',
          'These palettes are generated in <strong>OKLCH</strong> rather than '
          + 'HSL, and the pastel preset holds lightness between 0.84 and 0.94 '
          + 'with chroma between 0.035 and 0.075 — which lands between 70% and '
          + '95% lightness in HSL. The OKLCH corridor is the one that matters: '
          + 'HSL lightness is not perceptually even, so a fixed HSL value gives '
          + 'a yellow that looks washed out beside a blue that still looks '
          + 'strong.',
        ],
      },
      {
        h2: 'Pastels and contrast',
        paragraphs: [
          'This is where pastel schemes usually go wrong. The shades above '
          + 'score between roughly 1.36:1 and 1.43:1 against white — nowhere '
          + 'near the 4.5:1 WCAG AA requires for normal text, and short of the '
          + '3:1 needed for buttons, borders and icons. Pastel text on a white '
          + 'page is not a stylistic risk; it is unreadable for a large number '
          + 'of people.',
          'Used as backgrounds they are excellent. Dark text on a pastel field '
          + 'has room to spare — black on pastel pink measures about 14.7:1. '
          + 'The working rule is pastels behind, dark ink in front, and one '
          + 'deep accent from the same hue family for anything that has to be '
          + 'noticed.',
        ],
      },
      {
        h2: 'Where pastel palettes work',
        paragraphs: [
          'Wedding stationery, baby and nursery branding, wellness and '
          + 'skincare packaging, spring campaigns, children\'s books, and the '
          + 'soft empty states common in modern apps. The common thread is '
          + 'content that should feel approachable rather than urgent — which '
          + 'is also why pastels rarely suit an error state or a warning.',
        ],
      },
    ],
    faq: [
      { q: 'What is a pastel color?', a: 'A color with high lightness and low saturation — a hue softened by adding white, or more precisely one whose chroma is deliberately held down. The pastels here sit between 70% and 95% HSL lightness. What separates a pastel from a plain tint is that the hue stays identifiable.' },
      { q: 'What colors go well with pastels?', a: 'Other pastels of a similar lightness, which is why analogous and monochrome schemes dominate here. For contrast, pair a pastel field with one deep accent from the same hue family rather than a second bright color.' },
      { q: 'Are pastel colors accessible?', a: 'Not on their own. Pastels score around 1.4:1 against white, far below the 4.5:1 WCAG AA needs for normal text. They work as backgrounds, not as text or small UI elements. Dark text on a pastel background is fine.' },
      { q: 'Are these pastel palettes free to use?', a: 'Yes, for anything, including commercial and client work, with no attribution required. Colors cannot be owned: a palette is four numbers.' },
    ],
  },

  /* ---------------------------------------------------------------- reds -- */
  { slug: 'red', name: 'Red', hex: 'ff0000', tag: 'red', featured: true },
  { slug: 'crimson', name: 'Crimson', hex: 'dc143c', tag: 'red' },
  { slug: 'maroon', name: 'Maroon', hex: '800000', tag: 'red' },
  { slug: 'burgundy', name: 'Burgundy', hex: '800020', tag: 'red' },
  { slug: 'salmon', name: 'Salmon', hex: 'fa8072', tag: 'red' },
  { slug: 'rose', name: 'Rose', hex: 'ff007f', tag: 'pink' },

  /* ------------------------------------------------------------- oranges -- */
  {
    slug: 'coral',
    name: 'Coral',
    hex: 'ff7f50',
    tag: 'orange',
    featured: true,
    lead: [
      'Coral is the warm pink-orange of the reef it is named after — orange '
      + 'with enough pink in it to feel soft rather than loud. The CSS keyword '
      + '<code>coral</code> is <strong>#FF7F50</strong>.',
    ],
    named: [
      { name: 'Coral', hex: 'ff7f50', note: 'CSS keyword' },
      { name: 'Light coral', hex: 'f08080', note: 'CSS keyword' },
      { name: 'Salmon', hex: 'fa8072', note: 'CSS keyword' },
      { name: 'Tomato', hex: 'ff6347', note: 'CSS keyword' },
      { name: 'Peach', hue: 45, L: 0.86, C: 0.09 },
      { name: 'Coral pink', hue: 20, L: 0.74, C: 0.13 },
      { name: 'Deep coral', hue: 30, L: 0.6, C: 0.17 },
      { name: 'Burnt coral', hue: 32, L: 0.46, C: 0.13 },
    ],
    sections: [
      {
        h2: 'Coral vs salmon vs peach',
        paragraphs: [
          'All three are warm and pale enough to be mistaken for one another, '
          + 'and the difference is mostly where they sit between orange and '
          + 'pink. Coral is at hue 16 and fully saturated: the most orange of '
          + 'the three and the most vivid. Salmon sits at hue 6, closer to '
          + 'pink, and is slightly muted — it reads as fleshier and softer. '
          + 'Peach is paler than both, high in lightness and low in '
          + 'saturation, which puts it in pastel territory rather than accent '
          + 'territory.',
          'A quick test: if it could plausibly be a background, it is peach. '
          + 'If it reads as pink before it reads as orange, it is salmon. If '
          + 'it jumps forward as an accent, it is coral.',
        ],
      },
      {
        h2: 'Using coral in a palette',
        paragraphs: [
          'Coral is unusually easy to build around, which is why it recurs in '
          + 'branding. Teal is the classic pairing — close to its complement, '
          + 'and the cool-against-warm contrast is strong without either color '
          + 'fighting the other. Navy gives a more restrained version of the '
          + 'same idea. Against cream or sand it goes quiet and becomes almost '
          + 'a neutral warm tone.',
          'It suits hospitality, travel, food, beauty and anything summery. '
          + 'The failure mode is pairing it with another warm mid-tone: coral '
          + 'beside a similar orange or pink looks like an accident rather '
          + 'than a decision.',
        ],
      },
    ],
    faq: [
      { q: 'What is the hex code for coral?', a: 'Coral is #FF7F50, the CSS named color. In RGB that is rgb(255, 127, 80) and in HSL hsl(16, 100%, 66%) — a fully saturated orange-red at high lightness.' },
      { q: 'What is the difference between coral and salmon?', a: 'Coral sits at hue 16 and is fully saturated, so it leans orange and reads as vivid. Salmon sits nearer hue 6 and is slightly less saturated, so it leans pink and reads as softer.' },
      { q: 'What color goes best with coral?', a: 'Teal is the standard answer and it earns it — close to coral\'s complement, so the contrast is strong while the two stay balanced. Navy is a calmer alternative, and cream or sand let coral sit as a warm neutral.' },
      { q: 'Is coral pink or orange?', a: 'Orange, with pink in it. At hue 16 it sits in the orange-red range, but the high lightness and full saturation give it the softness people read as pink.' },
    ],
  },
  { slug: 'orange', name: 'Orange', hex: 'ffa500', tag: 'orange', featured: true },
  { slug: 'peach', name: 'Peach', hex: 'ffdab9', tag: 'orange' },
  { slug: 'amber', name: 'Amber', hex: 'ffbf00', tag: 'orange' },
  { slug: 'rust', name: 'Rust', hex: 'b7410e', tag: 'orange' },
  { slug: 'terracotta', name: 'Terracotta', hex: 'e2725b', tag: 'orange' },

  /* ------------------------------------------------------------- yellows -- */
  { slug: 'yellow', name: 'Yellow', hex: 'ffff00', tag: 'yellow', featured: true },
  {
    slug: 'gold',
    name: 'Gold',
    hex: 'ffd700',
    tag: 'gold',
    featured: true,
    title: 'Gold Color — Hex Code #FFD700, Shades & Gold Palettes',
    lead: [
      'The CSS keyword <code>gold</code> is <strong>#FFD700</strong> — a bright, '
      + 'fully saturated yellow. It is worth knowing up front that this is not '
      + 'the color most people picture when they say gold: metallic gold is '
      + 'darker and browner, closer to #D4AF37, because real gold is a '
      + 'reflective surface rather than a flat color.',
    ],
    named: [
      { name: 'Gold', hex: 'ffd700', note: 'CSS keyword' },
      { name: 'Metallic gold', hex: 'd4af37', note: 'the usual intent' },
      { name: 'Old gold', hex: 'cfb53b', note: 'muted, aged' },
      { name: 'Champagne gold', hex: 'e8d3a9', note: 'pale, warm' },
      { name: 'Rose gold', hex: 'b76e79', note: 'copper-pink' },
      { name: 'Antique gold', hex: '9a7b4f', note: 'deep, dulled' },
      { name: 'Brass', hue: 88, L: 0.66, C: 0.11 },
      { name: 'Bronze', hue: 70, L: 0.52, C: 0.1 },
    ],
    sections: [
      {
        h2: 'Why gold never looks metallic on screen',
        paragraphs: [
          'A flat hex value cannot be metallic. What the eye reads as metal is '
          + 'not a color but a behaviour: a bright specular highlight, a darker '
          + 'body, and a warm reflected bounce, all shifting as the surface '
          + 'moves. A single #FFD700 fill has none of that and reads as plain '
          + 'yellow.',
          'The usual fix is a gradient rather than a fill — a light champagne '
          + 'through a mid metallic gold to a bronze shadow, banded rather than '
          + 'smooth. The '
          + '<a href="/tools/gradient-maker/">gradient maker</a> is the quickest '
          + 'way to try that; interpolating in OKLCH keeps the midpoint from '
          + 'going grey, which is exactly what kills a metallic effect.',
        ],
      },
      {
        h2: 'Using gold in a palette',
        paragraphs: [
          'Gold reads as luxury only against depth. On white it is close to '
          + 'invisible and looks like a highlighter; against charcoal, deep '
          + 'navy, forest green or near-black it does the job it is hired for. '
          + 'That is a contrast fact as much as a taste one — the numbers below '
          + 'show how little separation gold has from a light background.',
          'It pairs conventionally with black and white for formal work, with '
          + 'deep green or burgundy for warmth, and with cream or ivory when '
          + 'the goal is soft rather than opulent. Avoid pairing it with other '
          + 'saturated yellows or oranges, where it simply disappears.',
        ],
      },
    ],
    faq: [
      { q: 'What is the hex code for gold?', a: 'The CSS named color gold is #FFD700, rgb(255, 215, 0). For a metallic-looking gold most designers use something closer to #D4AF37, which is darker and less saturated.' },
      { q: 'Why does my gold look yellow?', a: 'Because a flat color cannot be metallic. Metal reads as metal through a highlight, a darker body and a warm bounce, not through hue. A banded gradient from champagne through gold to bronze is the usual substitute.' },
      { q: 'What colors go with gold?', a: 'Depth. Charcoal, near-black, deep navy, forest green and burgundy all give gold the contrast it needs. On white or pale backgrounds it loses separation and reads as highlighter yellow.' },
      { q: 'What is rose gold?', a: 'A copper-pink rather than a yellow — around #B76E79. It comes from gold alloyed with copper, and on screen it behaves like a muted pink, which is why it pairs with soft neutrals rather than with strong darks.' },
    ],
  },
  { slug: 'mustard', name: 'Mustard', hex: 'ffdb58', tag: 'yellow' },
  {
    slug: 'ivory',
    name: 'Ivory',
    hex: 'fffff0',
    tag: 'cream',
    featured: true,
    lead: [
      'Ivory is the off-white of old piano keys and wedding stationery — white '
      + 'with a trace of yellow in it, warm enough to feel softer than paper '
      + 'but pale enough to still read as white. The CSS keyword '
      + '<code>ivory</code> is <strong>#FFFFF0</strong>.',
    ],
    named: [
      { name: 'Ivory', hex: 'fffff0', note: 'CSS keyword' },
      { name: 'Cream', hex: 'fffdd0', note: 'more yellow' },
      { name: 'Eggshell', hex: 'f0ead6', note: 'slightly grey' },
      { name: 'Beige', hex: 'f5f5dc', note: 'CSS keyword' },
      { name: 'Bone', hex: 'e3dac9', note: 'warmer, deeper' },
      { name: 'Vanilla', hex: 'f3e5ab', note: 'clearly yellow' },
      { name: 'Linen', hex: 'faf0e6', note: 'CSS keyword' },
      { name: 'Alabaster', hex: 'edeae0', note: 'near neutral' },
    ],
    sections: [
      {
        h2: 'Ivory vs cream vs beige vs eggshell',
        paragraphs: [
          'These four get used as if they were the same color, and the '
          + 'difference is easy to state once the numbers are in front of you. '
          + 'Ivory sits at hue 60 with 97% lightness — the palest of the group '
          + 'and barely tinted. Cream keeps a similar hue but drops to 91% '
          + 'lightness, so it reads as noticeably more yellow. Beige carries '
          + 'more of that yellow still and starts to feel like a color rather '
          + 'than a white. Eggshell adds a little grey, which is what gives it '
          + 'the flatter, chalkier feel that paint charts trade on.',
          'The practical rule: ivory when you want white that is not clinical, '
          + 'cream when you want warmth to be visible, beige when you want an '
          + 'actual neutral color, eggshell when you want either without the '
          + 'yellow reading as cheap.',
        ],
      },
      {
        h2: 'Where ivory works',
        paragraphs: [
          'Wedding invitations and stationery, luxury and skincare packaging, '
          + 'book interiors, and any interface that wants to feel calm rather '
          + 'than sterile. Pure white backgrounds are unforgiving under bright '
          + 'light; a few percent of warmth takes the glare off without anyone '
          + 'consciously noticing the page is not white.',
          'It pairs naturally with warm neutrals — taupe, sand, soft brown — '
          + 'and with deep colors that have some warmth of their own, such as '
          + 'forest green, burgundy or navy. Against a cool grey it can look '
          + 'accidental, as though the white point drifted.',
        ],
      },
    ],
    faq: [
      { q: 'What is the hex code for ivory?', a: 'Ivory is #FFFFF0 — the CSS named color. In RGB that is rgb(255, 255, 240), and in HSL hsl(60, 100%, 97%): full white with the blue channel pulled down slightly.' },
      { q: 'Is ivory a shade of white?', a: 'Yes. It is an off-white — white with a small amount of yellow. At 97% lightness most people will call it white until it sits next to a pure white.' },
      { q: 'What is the difference between ivory and cream?', a: 'Both are warm off-whites at roughly the same hue, but cream is darker and more saturated. Ivory reads as white with a hint of warmth; cream reads as a pale yellow.' },
      { q: 'Can I use ivory text on a white background?', a: 'No. Ivory on white measures about 1.01:1, effectively invisible — normal text needs 4.5:1. Ivory is a background color.' },
    ],
  },
  { slug: 'cream', name: 'Cream', hex: 'fffdd0', tag: 'cream' },
  { slug: 'beige', name: 'Beige', hex: 'f5f5dc', tag: 'cream' },

  /* -------------------------------------------------------------- greens -- */
  { slug: 'green', name: 'Green', hex: '008000', tag: 'green', featured: true },
  {
    slug: 'lime-green',
    name: 'Lime green',
    hex: '32cd32',
    tag: 'green',
    featured: true,
    lead: [
      'Lime green is the bright, slightly yellow-leaning green of a fresh lime '
      + 'skin — loud enough to work as an accent, dark enough to still be a '
      + 'green rather than a highlighter. The CSS keyword '
      + '<code>limegreen</code> is <strong>#32CD32</strong>.',
    ],
    named: [
      { name: 'Lime green', hex: '32cd32', note: 'CSS limegreen' },
      { name: 'Lime', hex: '00ff00', note: 'CSS lime, pure' },
      { name: 'Chartreuse', hex: '7fff00', note: 'CSS keyword' },
      { name: 'Yellow green', hex: '9acd32', note: 'CSS yellowgreen' },
      { name: 'Spring green', hex: '00ff7f', note: 'CSS keyword' },
      { name: 'Green apple', hue: 135, L: 0.72, C: 0.19 },
      { name: 'Deep lime', hue: 138, L: 0.52, C: 0.16 },
      { name: 'Forest lime', hue: 140, L: 0.38, C: 0.12 },
    ],
    sections: [
      {
        h2: 'Lime green, lime and chartreuse',
        paragraphs: [
          'Three names, three genuinely different colors. CSS <code>lime</code> '
          + 'is #00FF00 — the green primary at full strength, with nothing '
          + 'mixed in. It is not a color anyone chooses deliberately for '
          + 'design work: at 100% saturation it vibrates against most '
          + 'backgrounds and is almost impossible to use for text. Lime green '
          + 'is that same hue pulled down to 61% saturation and 50% lightness, '
          + 'which is what makes it usable.',
          'Chartreuse (#7FFF00) sits between green and yellow at hue 90, far '
          + 'enough towards yellow that many people read it as yellow-green '
          + 'rather than green. If a lime green looks wrong and you cannot say '
          + 'why, the usual cause is that it has drifted into chartreuse '
          + 'territory and lost the green.',
        ],
      },
      {
        h2: 'Using lime green without it shouting',
        paragraphs: [
          'Lime green is a high-energy color and it does not share space well. '
          + 'The reliable approach is to treat it as an accent against '
          + 'neutrals — charcoal, warm grey, off-white — rather than pairing '
          + 'it with another saturated color. Where a second color is needed, '
          + 'deep purple is the direct complement and holds up; anything '
          + 'orange or red next to it tends to read as a warning.',
          'It is a natural fit for sports and fitness branding, energy drinks, '
          + 'eco and sustainability marks, and developer tooling that wants to '
          + 'look technical rather than corporate. It struggles in finance, '
          + 'healthcare and luxury, where the brightness reads as cheap.',
        ],
      },
    ],
    faq: [
      { q: 'What is the hex code for lime green?', a: 'Lime green is #32CD32, the CSS named color limegreen. In RGB that is rgb(50, 205, 50) and in HSL hsl(120, 61%, 50%) — a pure green hue at just over half saturation.' },
      { q: 'Is lime green the same as lime?', a: 'No. CSS lime is #00FF00, the green primary at full intensity. Lime green is #32CD32, the same hue but noticeably softer and darker.' },
      { q: 'What colors go with lime green?', a: 'Neutrals first — charcoal, warm grey and off-white let it be the accent without competition. For a second color, deep purple is the direct complement.' },
      { q: 'Is lime green readable as text?', a: 'Not on white. #32CD32 measures around 2.12:1 against white, well below the 4.5:1 WCAG AA requires for normal text.' },
    ],
  },
  { slug: 'mint', name: 'Mint', hex: '98ff98', tag: 'green' },
  { slug: 'olive', name: 'Olive', hex: '808000', tag: 'green' },
  { slug: 'sage', name: 'Sage', hex: 'b2ac88', tag: 'nature' },
  { slug: 'forest-green', name: 'Forest green', hex: '228b22', tag: 'nature' },
  { slug: 'emerald', name: 'Emerald', hex: '50c878', tag: 'green' },

  /* --------------------------------------------------------- blue-greens -- */
  { slug: 'teal', name: 'Teal', hex: '008080', tag: 'turquoise', featured: true },
  { slug: 'turquoise', name: 'Turquoise', hex: '40e0d0', tag: 'turquoise' },
  { slug: 'aqua', name: 'Aqua', hex: '00ffff', tag: 'turquoise' },
  { slug: 'seafoam', name: 'Seafoam', hex: '9fe2bf', tag: 'sea' },

  /* --------------------------------------------------------------- blues -- */
  { slug: 'blue', name: 'Blue', hex: '0000ff', tag: 'blue', featured: true },
  { slug: 'navy', name: 'Navy', hex: '000080', tag: 'blue', featured: true },
  { slug: 'sky-blue', name: 'Sky blue', hex: '87ceeb', tag: 'sky' },
  { slug: 'royal-blue', name: 'Royal blue', hex: '4169e1', tag: 'blue' },
  { slug: 'cobalt', name: 'Cobalt', hex: '0047ab', tag: 'blue' },
  { slug: 'periwinkle', name: 'Periwinkle', hex: 'ccccff', tag: 'blue' },

  /* ------------------------------------------------------------- purples -- */
  {
    slug: 'purple',
    name: 'Purple',
    hex: '8e4ec6',
    tag: 'purple',
    featured: true,
    h1: 'Shades of purple: color palettes and hex codes',
    title: 'Shades of Purple — Hex Codes, Scale & Purple Palettes',
    lead: [
      'Purple runs from the palest lavender to a near-black eggplant, and the '
      + 'shade decides the message: the light end reads soft and floral, the '
      + 'dark end expensive and serious. CSS defines <code>purple</code> as '
      + '<strong>#800080</strong>, though most interfaces use something '
      + 'brighter — the scale below starts from #8E4EC6.',
    ],
    named: [
      { name: 'Lavender', hue: 320, L: 0.88, C: 0.06 },
      { name: 'Lilac', hue: 310, L: 0.8, C: 0.1 },
      { name: 'Orchid', hue: 330, L: 0.68, C: 0.17 },
      { name: 'Amethyst', hue: 305, L: 0.58, C: 0.18 },
      { name: 'Royal purple', hue: 300, L: 0.45, C: 0.19 },
      { name: 'Byzantium', hue: 330, L: 0.38, C: 0.14 },
      { name: 'Plum', hue: 345, L: 0.35, C: 0.11 },
      { name: 'Eggplant', hue: 315, L: 0.28, C: 0.09 },
    ],
    sections: [
      {
        h2: 'Purple, violet and magenta',
        paragraphs: [
          'These get used interchangeably and are not the same thing. Violet '
          + 'is a single wavelength at the end of the visible spectrum and '
          + 'sits nearer blue, around hue 260 to 275. Purple has no single '
          + 'wavelength — it is what the eye reports when red and blue arrive '
          + 'together — and covers roughly 270 to 320. Past 320 the color '
          + 'reads as magenta or fuchsia.',
          'The boundary matters in practice. Anything below hue 255 is tagged '
          + 'blue on this site and anything above 300 pink, so a palette '
          + 'listed here measures as purple rather than merely being called '
          + 'it.',
        ],
      },
      {
        h2: 'Where purple works',
        paragraphs: [
          'Beauty and fragrance packaging, wellness and meditation apps, wine '
          + 'and spirits labels, fantasy and mystery covers, and technology '
          + 'brands wanting to look creative rather than corporate. Deep '
          + 'purples read as luxury, pale ones as calm.',
          'Yellow and gold are the direct complement and give the strongest '
          + 'contrast. For something calmer, an analogous scheme with blue or '
          + 'magenta stays in the family, and warm neutrals — cream, sand, '
          + 'taupe — soften purple without competing with it. The one place it '
          + 'struggles is food, outside berries and aubergine, where it tends '
          + 'to read as artificial.',
        ],
      },
    ],
    faq: [
      { q: 'What are the main shades of purple?', a: 'From lightest to darkest: lavender and lilac at the pale end, orchid and amethyst in the middle, then royal purple, byzantium, plum and eggplant. They differ in lightness and hue at once, which is why a single purple swatch never covers the range.' },
      { q: 'What is the hex code for purple?', a: 'CSS defines purple as #800080, a dark magenta-leaning shade that is rarely the one people mean. Most modern interfaces use something closer to #8549BA or #A061DA, bright enough to work as an accent.' },
      { q: 'What is the difference between purple and violet?', a: 'Violet is a single wavelength of light near blue, around hue 260 to 275. Purple is a mixture of red and blue with no single wavelength, spanning roughly 270 to 320. Violet reads cooler and bluer, purple warmer and more magenta.' },
      { q: 'What colors go well with purple?', a: 'Yellow and gold are the direct complement and give the strongest contrast. Blue or magenta keeps things analogous and calm, and warm neutrals such as cream, sand and taupe soften purple without competing.' },
    ],
  },
  { slug: 'lavender', name: 'Lavender', hex: 'e6e6fa', tag: 'purple' },
  { slug: 'violet', name: 'Violet', hex: '7f00ff', tag: 'purple' },
  { slug: 'lilac', name: 'Lilac', hex: 'c8a2c8', tag: 'purple' },
  { slug: 'plum', name: 'Plum', hex: 'dda0dd', tag: 'purple' },
  { slug: 'indigo', name: 'Indigo', hex: '4b0082', tag: 'purple' },

  /* --------------------------------------------------------------- pinks -- */
  { slug: 'pink', name: 'Pink', hex: 'ffc0cb', tag: 'pink', featured: true },
  { slug: 'hot-pink', name: 'Hot pink', hex: 'ff69b4', tag: 'pink' },
  { slug: 'blush', name: 'Blush', hex: 'de5d83', tag: 'pink' },
  { slug: 'magenta', name: 'Magenta', hex: 'ff00ff', tag: 'pink' },
  { slug: 'fuchsia', name: 'Fuchsia', hex: 'ff00ff', tag: 'pink' },

  /* ------------------------------------------------------------ neutrals -- */
  { slug: 'black', name: 'Black', hex: '000000', tag: 'black', featured: true },
  { slug: 'white', name: 'White', hex: 'ffffff', tag: 'white' },
  { slug: 'gray', name: 'Gray', hex: '808080', tag: 'gray', featured: true },
  { slug: 'charcoal', name: 'Charcoal', hex: '36454f', tag: 'dark' },
  { slug: 'silver', name: 'Silver', hex: 'c0c0c0', tag: 'gray' },
  { slug: 'taupe', name: 'Taupe', hex: '483c32', tag: 'earth' },



  /*
   * Y2K is an era rather than a hue, so it behaves like `pastel`: a family page
   * with no single value card and no shade scale, because there is nothing to
   * make a scale of.
   */
  {
    slug: 'y2k',
    name: 'Y2K',
    /*
     * A style, not a color. It behaves like a family page — no value card, no
     * shade scale — but it must not be listed among the colors: Y2K names an
     * era, and the catalog is a list of shades. `pastel` stays a family because
     * "pastel" really is a description of colors; "Y2K" is a description of a
     * decade that happened to have colors.
     */
    kind: 'style',
    hex: '9ad9e8',
    tag: 'retro',
    featured: true,
    h1: 'Y2K color palettes: the 1999-2003 aesthetic in hex',
    title: 'Y2K Colors — Palettes and Hex Codes for the Y2K Aesthetic',
    lead: [
      'The Y2K palette is frosted translucent blue, chrome, bubblegum pink, '
      + 'lime and lavender \u2014 the colors of turn-of-the-millennium '
      + 'optimism, when consumer technology briefly decided it should look '
      + 'like candy rather than office equipment. Hex codes and ready-made '
      + 'four-color palettes below.',
    ],
    named: [
      { name: 'Frosted ice blue', hex: '9ad9e8', note: 'the signature shade' },
      { name: 'Bondi blue', hex: '0095b6', note: 'translucent teal' },
      { name: 'Bubblegum pink', hex: 'ff9ecd' },
      { name: 'Lime', hex: 'b6ff3c' },
      { name: 'Lavender', hex: 'c3a6ea' },
      { name: 'Acid yellow', hex: 'f2ff54' },
      { name: 'Chrome silver', hex: 'c8ccd4', note: 'reads as metal in context' },
      { name: 'Tangerine', hue: 50, L: 0.74, C: 0.16 },
    ],
    sections: [
      {
        h2: 'Where these colors came from',
        paragraphs: [
          'The palette has a specific origin: translucent plastic. When the '
          + 'iMac G3 arrived in 1998 in a see-through teal case, and then in a '
          + 'run of fruit-named colors, it reset what consumer electronics were '
          + 'allowed to look like. Beige boxes gave way to frosted lime, '
          + 'tangerine and grape, and everything from staplers to hair dryers '
          + 'followed within two years.',
          'Two other threads run through it. Millennium futurism supplied the '
          + 'chrome \u2014 liquid metal, lens flares and silver wordmarks, on the '
          + 'assumption that the year 2000 would look like a spacecraft. And '
          + 'the glossy operating systems of 2001 made the whole look '
          + 'mainstream: interfaces went candy-coloured and semi-transparent at '
          + 'exactly the moment most households got their first broadband '
          + 'connection.',
          'Worth separating from its neighbours, because the terms get mixed '
          + 'up. Vaporwave is a later internet aesthetic that borrows Y2K '
          + 'imagery but runs on pastel pink and cyan with a nostalgic, hazy '
          + 'tone. Frutiger Aero came afterwards, roughly 2004 to 2013, and is '
          + 'greener and wetter \u2014 glossy leaves, water droplets, blue skies. '
          + 'Y2K proper is brighter, harder and more plastic than either.',
        ],
      },
      {
        h2: 'What makes a palette read as Y2K',
        paragraphs: [
          'Three things, and the third is the one people miss. First, high '
          + 'chroma at high lightness: these are vivid colors that are also '
          + 'light, which is an unusual combination and the reason the palette '
          + 'feels artificial in a deliberate way. Lime and acid yellow are '
          + 'literally at the limit \u2014 both sit on the sRGB boundary, using '
          + '100% of the chroma available at their lightness and hue, with no '
          + 'headroom left. That is not a coincidence; the era was reaching for '
          + 'the most artificial colors a screen could produce. Second, cool '
          + 'over warm \u2014 '
          + 'ice blue, lime and lavender carry it, with pink and tangerine as '
          + 'accents rather than the base.',
          'Third, the effect depends on gloss, not just hue. Chrome silver is '
          + '#C8CCD4 as a flat fill, which is simply grey; it only reads as '
          + 'metal when it carries a highlight and a darker body. The same goes '
          + 'for the frosted look, which is a translucency effect rather than a '
          + 'color \u2014 a light blue at partial alpha over a busy background, '
          + 'which is why '
          + '<a href="/colors/transparent-blue/">transparent blue</a> is a '
          + 'useful companion page. A Y2K palette built from flat fills alone '
          + 'tends to land closer to 1980s Memphis than to 2001.',
        ],
      },
      {
        h2: 'Using it now without making a costume of it',
        paragraphs: [
          'The full palette at full strength reads as pastiche, which is fine '
          + 'if pastiche is the brief \u2014 music, streetwear, event graphics and '
          + 'anything aimed at an audience nostalgic for a decade they may not '
          + 'remember firsthand. Used straight, it is unmistakable and dates '
          + 'itself on purpose.',
          'For work that needs to look current, the usual move is one Y2K '
          + 'color against restrained neutrals: frosted ice blue on warm grey, '
          + 'or a single acid yellow accent in an otherwise sober layout. That '
          + 'keeps the reference legible without committing the whole design to '
          + 'it.',
          'One practical warning. These colors are light and saturated, which '
          + 'is exactly the combination that fails contrast checks. Lime '
          + '#B6FF3C manages 1.21:1 against white and acid yellow #F2FF54 only '
          + '1.09:1, against the 4.5:1 normal text requires \u2014 they are not '
          + 'marginal, they are invisible. Treat them as fills and reach for a '
          + 'darker variant of the same hue when words are involved. The '
          + '<a href="/tools/contrast/">contrast checker</a> will confirm any '
          + 'pair, and the <a href="/tools/oklch/">OKLCH picker</a> shows why '
          + 'these shades sit so near the edge of what a screen can even '
          + 'display.',
        ],
      },
    ],
    faq: [
      { q: 'What colors are Y2K?', a: 'Frosted translucent blue, chrome silver, bubblegum pink, lime green, lavender and acid yellow. The common thread is high saturation at high lightness, with cool colors carrying the palette and warm ones used as accents.' },
      { q: 'What is the main Y2K color?', a: 'Frosted ice blue, around #9AD9E8, together with the deeper translucent teal of the original iMac. If one shade signals the era, it is that pale see-through blue.' },
      { q: 'Is Y2K the same as vaporwave?', a: 'No. Vaporwave is a later internet aesthetic that borrows Y2K imagery but uses softer pastel pink and cyan with a hazy, nostalgic tone. Y2K is brighter, harder and more plastic, and it was a mainstream commercial look rather than a subculture.' },
      { q: 'How do I get a chrome effect in CSS?', a: 'Not with a single color. Chrome needs a banded gradient — a light highlight, a mid grey body and a darker shadow — because what reads as metal is a reflection pattern rather than a hue. A flat #C8CCD4 fill just looks grey.' },
      { q: 'Are Y2K colors accessible?', a: 'Often not, for text. Lime reaches only 1.21:1 against white and acid yellow 1.09:1, where normal text needs 4.5:1 — both are effectively invisible. They work as fills against dark type, or pick a darker variant of the same hue for anything readable. Frosted ice blue and chrome silver have the same problem at around 1.6:1.' },
    ],
  },

  /* ------------------------------------------------- additions by request -- */
  {
    slug: 'espresso',
    name: 'Espresso',
    hex: '3c2218',
    tag: 'coffee',
    title: 'Espresso Color — Hex Code #3C2218, Shades & Brown Palettes',
    lead: [
      'Espresso is the deep, almost-black brown of a fresh shot — dark enough '
      + 'to work as a background, warm enough to never read as grey. A common '
      + 'value is <strong>#3C2218</strong>, though unlike a CSS keyword there '
      + 'is no single official definition.',
    ],
    named: [
      { name: 'Espresso', hex: '3c2218', note: 'common value' },
      { name: 'Dark chocolate', hex: '3f2a1d' },
      { name: 'Coffee bean', hex: '4a2c2a' },
      { name: 'Mocha', hex: '6f4e37' },
      { name: 'Walnut', hex: '5c4033' },
      { name: 'Cocoa', hue: 55, L: 0.42, C: 0.06 },
      { name: 'Roasted', hue: 50, L: 0.3, C: 0.05 },
      { name: 'Bitter', hue: 45, L: 0.2, C: 0.035 },
    ],
    sections: [
      {
        h2: 'A note on Pantone',
        paragraphs: [
          'Espresso is often searched for alongside Pantone. Pantone is a '
          + 'proprietary color matching system, and its numbered values are '
          + 'licensed rather than public, so no Pantone codes are reproduced '
          + 'here — any site listing them freely is republishing licensed data.',
          'For print work the practical route is Pantone\'s own tools or a '
          + 'physical guide, since the whole point of the system is matching '
          + 'ink on paper, which no screen value can guarantee. What this page '
          + 'gives you is the screen side: a hex value, a shade scale and '
          + 'palettes that work.',
        ],
      },
      {
        h2: 'Where espresso works',
        paragraphs: [
          'Coffee and food branding for the obvious reason, but it earns its '
          + 'place more widely as a warm alternative to black. Dark interfaces '
          + 'built on espresso rather than neutral grey feel less clinical, and '
          + 'it is a common base for leather goods, whisky, menswear and any '
          + 'brand reaching for craft rather than tech.',
          'It pairs with cream and ivory for contrast without harshness, with '
          + 'brass or gold for warmth, and with sage or olive for something '
          + 'earthier. Against pure black it loses its identity entirely.',
        ],
      },
    ],
    faq: [
      { q: 'What is the hex code for espresso?', a: 'There is no official value — espresso is a descriptive name rather than a specified color. #3C2218 is a common choice: a very dark warm brown. Anything from roughly #3C2218 to #4A2C2A reads as espresso.' },
      { q: 'Is espresso the same as dark brown?', a: 'It is a dark brown with a specific character: warm, slightly red, and dark enough to substitute for black. A neutral dark brown reads flatter and less appetising.' },
      { q: 'What colors go with espresso?', a: 'Cream and ivory for contrast without harshness, brass or gold for warmth, sage and olive for an earthier scheme. Avoid pairing it with pure black, where it stops reading as brown at all.' },
    ],
  },
  {
    slug: 'transparent-blue',
    name: 'Transparent blue',
    hex: '4a90d9',
    tag: 'blue',
    title: 'Transparent Blue — RGBA, Hex Alpha and Opacity Values',
    lead: [
      'Transparency is not a color, it is a fourth channel. There is no hex '
      + 'code for "transparent blue" — there is a blue plus an alpha value, and '
      + 'the result depends entirely on what sits behind it. The base used here '
      + 'is <strong>#4A90D9</strong>.',
    ],
    named: [
      { name: 'Blue 100%', hex: '4a90d9', note: 'opaque base' },
      { name: 'Blue 75% on white', hue: 250, L: 0.72, C: 0.1 },
      { name: 'Blue 50% on white', hue: 250, L: 0.81, C: 0.07 },
      { name: 'Blue 25% on white', hue: 250, L: 0.91, C: 0.035 },
      { name: 'Blue 75% on black', hue: 250, L: 0.5, C: 0.09 },
      { name: 'Blue 50% on black', hue: 250, L: 0.38, C: 0.07 },
      { name: 'Blue 25% on black', hue: 250, L: 0.24, C: 0.04 },
    ],
    sections: [
      {
        h2: 'Four ways to write a transparent blue in CSS',
        paragraphs: [
          'The modern form is <code>rgb(74 144 217 / 50%)</code>, and the older '
          + '<code>rgba(74, 144, 217, 0.5)</code> still works everywhere. Hex '
          + 'takes an alpha pair too — <code>#4A90D980</code> is the same color '
          + 'at 50%, where the last two digits run from 00 to FF. And '
          + '<code>opacity: 0.5</code> is a fourth option that behaves '
          + 'differently: it fades the entire element including its text and '
          + 'children, not just the background.',
          'That last distinction causes most transparency bugs. If a button '
          + 'looks washed out including its label, it has <code>opacity</code> '
          + 'where it wanted an alpha channel on <code>background-color</code>.',
        ],
      },
      {
        h2: 'Transparency and contrast',
        paragraphs: [
          'A semi-transparent color has no fixed contrast ratio, because the '
          + 'ratio depends on the backdrop. The same blue at 50% clears WCAG AA '
          + 'over white and fails over a photograph — and accessibility tools '
          + 'generally cannot check it, since they cannot know what will be '
          + 'behind it at runtime.',
          'The safe approach is to compute the flattened result and test that. '
          + 'The values above show this blue composited over white and over '
          + 'black at three alpha levels, which is the range any overlay has to '
          + 'survive. Paste any of them into the '
          + '<a href="/tools/contrast/">contrast checker</a> to see where it '
          + 'stands.',
        ],
      },
    ],
    faq: [
      { q: 'What is the hex code for transparent blue?', a: 'There is not one. Transparency is an alpha channel, not a color. You can write eight-digit hex — #4A90D980 is a blue at 50% alpha — but the visible result depends on the backdrop.' },
      { q: 'How do I make a color transparent in CSS?', a: 'Use rgb(74 144 217 / 50%) or the older rgba(74, 144, 217, 0.5) on the property itself, or append two hex digits: #4A90D980. Avoid the opacity property unless you want the element\'s text and children faded too.' },
      { q: 'What is the difference between opacity and alpha?', a: 'Alpha applies to one color value, so a background can be semi-transparent while the text on it stays solid. The opacity property applies to the whole element and everything inside it.' },
      { q: 'Does a transparent color have a contrast ratio?', a: 'Not on its own. Contrast is only defined once the color is composited over a known backdrop, which is why automated checkers usually skip semi-transparent values. Flatten it against the real background and test that.' },
    ],
  },
  {
    slug: 'gunmetal',
    name: 'Gunmetal',
    hex: '36393e',
    tag: 'dark',
    title: 'Gunmetal Gray — Hex Code #36393E, Shades & Dark Palettes',
    lead: [
      'Gunmetal is the cool dark grey used as the background of most dark '
      + 'interfaces — <strong>#36393E</strong> is a widely used value, dark '
      + 'enough to rest the eye but far enough from black to keep depth. It '
      + 'carries a slight blue cast, which is what separates it from a neutral '
      + 'charcoal.',
    ],
    named: [
      { name: 'Gunmetal', hex: '36393e', note: 'common UI value' },
      { name: 'Charcoal', hex: '36454f' },
      { name: 'Slate gray', hex: '708090', note: 'CSS keyword' },
      { name: 'Dark slate gray', hex: '2f4f4f', note: 'CSS keyword' },
      { name: 'Onyx', hex: '353839' },
      { name: 'Graphite', hue: 250, L: 0.42, C: 0.012 },
      { name: 'Ink', hue: 255, L: 0.26, C: 0.018 },
      { name: 'Near black', hue: 255, L: 0.16, C: 0.012 },
    ],
    sections: [
      {
        h2: 'Why dark interfaces avoid pure black',
        paragraphs: [
          'Pure black backgrounds are harsh: white text on #000000 produces the '
          + 'maximum possible contrast, 21:1, which causes halation — the text '
          + 'appears to bleed into the background, particularly for people with '
          + 'astigmatism. Lifting the background a few percent to something like '
          + '#36393E takes the edge off while keeping the interface dark.',
          'It also restores depth. On pure black a raised surface has nowhere '
          + 'to go except lighter, so elevation stops reading. A dark grey base '
          + 'leaves room to place cards and modals above it and dividers below.',
        ],
      },
      {
        h2: 'Building on gunmetal',
        paragraphs: [
          'The practical set is three or four steps: a base around #36393E, a '
          + 'slightly lighter surface for cards, a darker step for wells and '
          + 'inputs, and a border that is a lift of the base rather than a grey '
          + 'from somewhere else. The scale below gives all of those from one '
          + 'value.',
          'Keep the blue cast consistent. Mixing a cool grey base with warm grey '
          + 'surfaces is a common and very visible mistake — the surfaces look '
          + 'dirty rather than lighter.',
        ],
      },
    ],
    faq: [
      { q: 'What color is #36393E?', a: 'A dark cool grey with a slight blue cast — gunmetal. It is a common background value for dark-mode interfaces, dark enough to rest the eye without the harshness of pure black.' },
      { q: 'Is gunmetal the same as charcoal?', a: 'Close but not identical. Charcoal (#36454F) is lighter and noticeably bluer. Gunmetal is darker and closer to neutral, which is why it works better as a background than as a surface.' },
      { q: 'Why not use pure black for dark mode?', a: 'White text on pure black hits 21:1 contrast, which causes halation — text appearing to bleed into the background. It also removes any room for elevation, since a raised surface can only go lighter.' },
    ],
  },
  {
    slug: 'rose-pink',
    name: 'Rose pink',
    hex: 'fc94af',
    tag: 'pink',
    title: 'Rose Pink — Hex Code #FC94AF, Shades & Pink Palettes',
    lead: [
      'Rose pink is a soft, slightly warm pink — <strong>#FC94AF</strong> is a '
      + 'widely used value, light enough to feel gentle without tipping into '
      + 'pastel. It sits between the paleness of blush and the intensity of hot '
      + 'pink.',
    ],
    named: [
      { name: 'Rose pink', hex: 'fc94af', note: 'this page' },
      { name: 'Blush', hex: 'de5d83' },
      { name: 'Baby pink', hex: 'f4c2c2' },
      { name: 'Hot pink', hex: 'ff69b4', note: 'CSS keyword' },
      { name: 'Dusty rose', hue: 5, L: 0.62, C: 0.08 },
      { name: 'Deep rose', hue: 0, L: 0.5, C: 0.13 },
      { name: 'Mauve', hue: 340, L: 0.66, C: 0.06 },
      { name: 'Rosewood', hue: 10, L: 0.36, C: 0.08 },
    ],
    sections: [
      {
        h2: 'Rose pink against its neighbours',
        paragraphs: [
          'Pink covers a lot of ground and the names are used loosely. Rose '
          + 'pink is mid-light and warm, with a trace of red rather than '
          + 'purple. Baby pink is paler and flatter. Blush is deeper and duller. '
          + 'Hot pink is the same family at full saturation and reads as '
          + 'aggressive by comparison.',
          'The useful distinction is warmth. A rose pink leans red, a mauve '
          + 'leans purple, and putting the two side by side looks like a '
          + 'mistake even when both are pleasant on their own.',
        ],
      },
      {
        h2: 'Where rose pink works',
        paragraphs: [
          'Beauty and skincare, florists, wedding material, and any brand '
          + 'reaching for warmth without sweetness. It also works well as an '
          + 'accent in otherwise neutral interfaces, where a single warm pink '
          + 'against grey reads as considered rather than decorative.',
          'It pairs naturally with deep green, navy and warm neutrals such as '
          + 'cream and sand. Against a cool grey it can look washed out, and '
          + 'against another mid-tone pink it simply blurs.',
        ],
      },
    ],
    faq: [
      { q: 'What color is #FC94AF?', a: 'A soft, warm rose pink — light and gentle without being a pastel. It sits between baby pink and hot pink in intensity, with a red rather than purple lean.' },
      { q: 'What is the difference between rose pink and blush?', a: 'Rose pink is lighter and brighter; blush is deeper and duller, closer to a muted red. Both are warm, which is what separates them from mauve and lilac.' },
      { q: 'What colors go with rose pink?', a: 'Deep green and navy give it contrast without competing, and warm neutrals such as cream and sand keep the scheme soft. Cool greys wash it out.' },
    ],
  },

  /* -------------------------------------------------------------- browns -- */
  { slug: 'brown', name: 'Brown', hex: 'a52a2a', tag: 'earth' },
  { slug: 'chocolate', name: 'Chocolate', hex: 'd2691e', tag: 'coffee' },
  { slug: 'tan', name: 'Tan', hex: 'd2b48c', tag: 'earth' },
  { slug: 'sand', name: 'Sand', hex: 'c2b280', tag: 'earth' },


  {
    slug: 'tuscan',
    name: 'Tuscan',
    /*
     * A regional palette, not a shade - same reasoning as y2k. There is no one
     * "Tuscan" hex, so the page skips the value card and the shade scale.
     */
    kind: 'style',
    hex: 'c67b5c',
    tag: 'earth',
    featured: true,
    h1: 'Tuscan colors: the palette of terracotta, ochre and cypress',
    title: 'Tuscan Colors - Terracotta, Ochre and Olive Palettes',
    lead: [
      'The Tuscan palette is what a landscape looks like when its buildings are '
      + 'made of it: fired clay roofs, ochre stucco, grey sandstone, olive and '
      + 'cypress. Every color in it came out of the ground within sight of the '
      + 'walls it ended up on. Hex codes and matching four-color palettes below.',
    ],
    named: [
      { name: 'Terracotta', hex: 'c67b5c', note: 'fired clay' },
      { name: 'Burnt sienna', hex: '9a4f2c' },
      { name: 'Ochre', hex: 'c9903a' },
      { name: 'Raw sienna', hex: 'b07a3c' },
      { name: 'Umber', hex: '6b4a2f' },
      { name: 'Olive', hex: '7f7a3f' },
      { name: 'Cypress', hex: '3a4a35', note: 'the dark vertical' },
      { name: 'Pietra serena', hex: '8a8f88', note: 'Florentine sandstone' },
      { name: 'Travertine', hex: 'e2d5bf' },
      { name: 'Stucco cream', hex: 'efe3ce' },
    ],
    sections: [
      {
        h2: 'The palette is a geology report',
        paragraphs: [
          'Most named palettes are a mood. This one is a material list. Terracotta '
          + 'is literally "baked earth" in Italian - clay fired until the iron in it '
          + 'oxidises red. Ochre, raw sienna, burnt sienna and umber are all iron '
          + 'oxide pigments dug out of the same region, and two of them are named '
          + 'after the places they came from: sienna after Siena, umber after '
          + 'Umbria. Pietra serena, the grey-blue sandstone in every Florentine '
          + 'doorway, is quarried a few kilometres outside the city.',
          'That shared origin is why the colors agree with each other. They are not '
          + 'a designer\'s selection of things that happen to look good together; '
          + 'they are variations on one chemistry, seen under one sky. Olive and '
          + 'cypress complete it because those are the two plants that grow in the '
          + 'same soil.',
        ],
      },
      {
        h2: 'Why it never looks garish',
        paragraphs: [
          'Because it physically cannot. Iron oxide pigments are muted by nature, '
          + 'and the numbers bear it out: the ten shades above average a chroma of '
          + '0.068 in OKLCH, against 0.108 across this site\'s whole color '
          + 'catalog, and none of them passes 0.122. There is no neon in the '
          + 'ground.',
          'This is the useful part when borrowing the palette. Reach for a '
          + 'saturated terracotta and the scheme stops reading as Tuscan and starts '
          + 'reading as autumn clip art. The restraint is not stylistic taste, it '
          + 'is the actual constraint the original materials imposed - which is '
          + 'also why the palette survives being used at large sizes across a whole '
          + 'wall or a whole page.',
        ],
      },
      {
        h2: 'Using it, and where the text goes',
        paragraphs: [
          'The structure is three bands: pale stone for the ground, warm earth for '
          + 'the mass, and one dark green for the vertical. Drop the green and the '
          + 'scheme goes flat and sandy, which is the most common way this palette '
          + 'is got wrong - cypress is doing more work than its share of the area '
          + 'suggests.',
          'For text, only the dark end is usable. Cypress reaches 9.5:1 against '
          + 'white and umber 7.9:1, so both clear WCAG AA comfortably. The pale end '
          + 'does not come close: travertine manages 1.45:1 and stucco cream '
          + '1.27:1, so they are backgrounds and nothing else. Terracotta itself, '
          + 'at 3.29:1, is a fill or a large heading, never body copy. Check any '
          + 'pair you plan to ship in the '
          + '<a href="/tools/contrast/">contrast checker</a>, and see the '
          + 'individual shades on the '
          + '<a href="/colors/terracotta/">terracotta</a>, '
          + '<a href="/colors/umber/">umber</a> and '
          + '<a href="/colors/olive/">olive</a> pages.',
        ],
      },
    ],
    faq: [
      { q: 'What colors are Tuscan?', a: 'Terracotta, ochre, raw and burnt sienna, umber, olive, cypress green, grey pietra serena sandstone, and pale travertine and stucco cream. They are the colors of the local clay, stone and vegetation rather than a chosen scheme.' },
      { q: 'What is the main Tuscan color?', a: 'Terracotta, around #C67B5C. It is the fired clay of the roof tiles, and it is the color the whole palette is usually built outward from.' },
      { q: 'Why are Tuscan colors so muted?', a: 'Because they come from iron oxide pigments, which are inherently low in chroma. Measured in OKLCH the ten shades on this page average 0.068 chroma against 0.108 for this site\'s color catalog as a whole, and none exceeds 0.122.' },
      { q: 'Is Tuscan the same as terracotta?', a: 'No. Terracotta is one color in it, and the page for that single shade is at /colors/terracotta/. Tuscan is the whole set, including the greens and the pale stone that give the terracotta something to sit against.' },
      { q: 'Which Tuscan colors work for text?', a: 'Only the dark ones. Cypress reaches 9.5:1 against white and umber 7.9:1, both clearing WCAG AA. Terracotta at 3.29:1 is limited to large text or fills, and travertine and stucco cream, at 1.45:1 and 1.27:1, are backgrounds only.' },
    ],
  },

  /* ----------------------------------------------- gap-filling entries --
   *
   * Added because 15% of palette swatches had no page close enough to link
   * to. The gaps were measured, not guessed: the azure sector had no entry at
   * all, blue had one, and the catalog held only three dark and nine deep
   * shades against eighteen light ones. These 32 names close it to under 2%,
   * and every one of them is the nearest match for real swatches — none was
   * added just to pad the list.
   *
   * Each carries its own `lead` rather than relying on the generated sentence.
   * Thirty-two pages that differ only by a hex value read as doorway pages;
   * two sentences of something specific is what makes each one defensible.
   */
  {
    slug: 'steel-blue',
    name: 'Steel blue',
    hex: '4a7396',
    tag: 'blue',
    lead: [
      'A mid blue with grey mixed in, named for the tone of tempered steel. The grey is what makes it usable as a large area where a saturated blue would shout.',
    ],
  },
  {
    slug: 'dusty-blue',
    name: 'Dusty blue',
    hex: '8299ae',
    tag: 'blue',
    lead: [
      'A soft, hazy blue with the chroma pulled down. It sits between slate and powder blue, and it is the blue most often asked for by wedding stationers.',
    ],
  },
  {
    slug: 'denim',
    name: 'Denim',
    hex: '3b5c7e',
    tag: 'blue',
    lead: [
      'The blue of indigo-dyed cotton after a few washes: deep, slightly grey, never quite saturated. Real denim varies enormously, so treat this as the middle of a range.',
    ],
  },
  {
    slug: 'prussian-blue',
    name: 'Prussian blue',
    hex: '16394f',
    tag: 'blue',
    lead: [
      'A very dark green-leaning blue. It takes its name from an eighteenth-century pigment and reads almost black until placed beside a true black.',
    ],
  },
  {
    slug: 'midnight-blue',
    name: 'Midnight blue',
    hex: '111d33',
    tag: 'night',
    lead: [
      'Nearly black, with just enough blue left to read as a colour rather than a neutral. Useful when a dark interface needs to feel cool without going grey.',
    ],
  },
  {
    slug: 'powder-blue',
    name: 'Powder blue',
    hex: 'a8c4dc',
    tag: 'pastel',
    lead: [
      'A pale, quiet blue with a hint of grey. Light enough to work as a background, which is most of what it gets used for.',
    ],
  },
  {
    slug: 'cornflower',
    name: 'Cornflower',
    hex: '6e93d6',
    tag: 'blue',
    lead: [
      'A clear mid blue leaning slightly violet, brighter than dusty blue and softer than royal. It is the blue of the flower it is named after.',
    ],
  },
  {
    slug: 'cerulean',
    name: 'Cerulean',
    hex: '1a7ea3',
    tag: 'blue',
    lead: [
      'A blue with a green cast, the colour of shallow water over sand. Sits between teal and a true blue and holds its own at large sizes.',
    ],
  },
  {
    slug: 'petrol',
    name: 'Petrol',
    hex: '07434f',
    tag: 'sea',
    lead: [
      'A very deep blue-green. Dark enough to substitute for black in a scheme that wants to stay cool, and common in interiors for exactly that reason.',
    ],
  },
  {
    slug: 'slate-blue',
    name: 'Slate blue',
    hex: '5b6f8c',
    tag: 'blue',
    lead: [
      'A muted blue-grey named after the stone. Note that CSS also has a keyword `slateblue`, which is a much more saturated violet — they are not the same colour.',
    ],
  },
  {
    slug: 'eggplant',
    name: 'Eggplant',
    hex: '4b2e4a',
    tag: 'purple',
    lead: [
      'A deep purple with brown in it, the colour of the vegetable skin. Dark and warm, which separates it from a cool violet at the same lightness.',
    ],
  },
  {
    slug: 'mulberry',
    name: 'Mulberry',
    hex: '6b4570',
    tag: 'purple',
    lead: [
      'A deep purple with a red lean. It reads richer than plum and darker than a mid violet.',
    ],
  },
  {
    slug: 'damson',
    name: 'Damson',
    hex: '3a2244',
    tag: 'dark',
    lead: [
      'Very dark purple, close to black. Named for the plum, and it behaves like espresso does among browns: a colour that can carry a whole dark scheme.',
    ],
  },
  {
    slug: 'mauve',
    name: 'Mauve',
    hex: '9c7c9c',
    tag: 'vintage',
    lead: [
      'A greyed mid purple. The name has drifted a long way from the original 1856 aniline dye, and today it usually means this soft dusty tone.',
    ],
  },
  {
    slug: 'wisteria',
    name: 'Wisteria',
    hex: 'a29ccd',
    tag: 'pastel',
    lead: [
      'A light blue-leaning purple, soft rather than pale. It is the tone most people mean by "lavender" when lavender turns out to be too pink.',
    ],
  },
  {
    slug: 'wine',
    name: 'Wine',
    hex: '5e2233',
    tag: 'red',
    lead: [
      'A deep red with brown in it. Darker and less purple than burgundy, and warm enough to pair with gold rather than silver.',
    ],
  },
  {
    slug: 'raspberry',
    name: 'Raspberry',
    hex: '8e2f52',
    tag: 'pink',
    lead: [
      'A deep pink-red, brighter than wine and darker than rose. It has enough blue in it to stay cool despite being a red.',
    ],
  },
  {
    slug: 'dusty-rose',
    name: 'Dusty rose',
    hex: 'b08192',
    tag: 'vintage',
    lead: [
      'A muted mid pink with grey mixed in. It is the pink that appears in most "romantic but not sweet" palettes, and it pairs with sage almost automatically.',
    ],
  },
  {
    slug: 'mocha',
    name: 'Mocha',
    hex: '7d6152',
    tag: 'coffee',
    lead: [
      'A mid brown with a grey cast, lighter than coffee and less red than chestnut. It works where a true brown would feel heavy.',
    ],
  },
  {
    slug: 'clay',
    name: 'Clay',
    hex: 'a98a7c',
    tag: 'earth',
    lead: [
      'A light warm brown-grey, the colour of unfired earthenware. Sits between taupe and terracotta and reads as a neutral in practice.',
    ],
  },
  {
    slug: 'umber',
    name: 'Umber',
    hex: '6b4a2f',
    tag: 'earth',
    lead: [
      'A deep earthy brown from a natural iron-oxide pigment. Raw umber is cooler, burnt umber redder; this is the middle of the two.',
    ],
  },
  {
    slug: 'khaki',
    name: 'Khaki',
    hex: '8b7b4f',
    tag: 'earth',
    lead: [
      'A dull yellow-brown. Worth knowing that the CSS keyword `khaki` is a much lighter, more yellow colour than the fabric the word comes from — this is the fabric.',
    ],
  },
  {
    slug: 'bronze',
    name: 'Bronze',
    hex: '8c6b3f',
    tag: 'gold',
    lead: [
      'A dark metallic-adjacent brown-gold. Like all metals it needs a gradient rather than a flat fill to read as metal at all.',
    ],
  },
  {
    slug: 'camel',
    name: 'Camel',
    hex: 'c19a6b',
    tag: 'earth',
    lead: [
      'A light warm tan, named for the coat fabric. Neutral enough to act as a background and warm enough to stop a scheme feeling clinical.',
    ],
  },
  {
    slug: 'coffee',
    name: 'Coffee',
    hex: '4b3621',
    tag: 'coffee',
    lead: [
      'A dark brown, roasted rather than red. Slightly lighter and greyer than espresso, which is the darkest of the coffee browns.',
    ],
  },
  {
    slug: 'hunter-green',
    name: 'Hunter green',
    hex: '33553f',
    tag: 'green',
    lead: [
      'A deep, slightly grey green. Traditional, and dark enough to work as a background with cream or gold on top.',
    ],
  },
  {
    slug: 'pine',
    name: 'Pine',
    hex: '2e4a3d',
    tag: 'nature',
    lead: [
      'A very dark blue-leaning green. Reads as almost black in small amounts, which makes it a good alternative to charcoal in a natural palette.',
    ],
  },
  {
    slug: 'moss',
    name: 'Moss',
    hex: '5a6b4a',
    tag: 'nature',
    lead: [
      'A muted yellow-green, the colour of dry moss rather than wet. Less grey than sage and darker than olive.',
    ],
  },
  {
    slug: 'juniper',
    name: 'Juniper',
    hex: '4a6a5e',
    tag: 'nature',
    lead: [
      'A mid green-grey with blue in it. Sits between sage and teal, and it is the green that appears in most muted "forest" palettes.',
    ],
  },
  {
    slug: 'slate',
    name: 'Slate',
    hex: '4a5560',
    tag: 'gray',
    lead: [
      'A mid grey with a blue cast, named after the stone. Cooler than charcoal and lighter than gunmetal.',
    ],
  },
  {
    slug: 'onyx',
    name: 'Onyx',
    hex: '1f2124',
    tag: 'black',
    lead: [
      'A near-black with the faintest cool cast. Useful as a background where pure black is too harsh but charcoal is too light.',
    ],
  },
  {
    slug: 'pewter',
    name: 'Pewter',
    hex: '8a8f94',
    tag: 'gray',
    lead: [
      'A mid grey with a slight blue-green cast, named after the alloy. Neutral enough for interface chrome without reading as pure grey.',
    ],
  },
];

export const FEATURED_COLORS = COLORS.filter((color) => color.featured);

export const getColor = (slug) => COLORS.find((color) => color.slug === slug) ?? null;

/** Grouped for the /colors/ index and the footer. */
export const COLOR_GROUPS = [
  { title: 'Reds and pinks', slugs: ['red', 'crimson', 'maroon', 'burgundy', 'salmon', 'rose', 'pink', 'rose-pink', 'hot-pink', 'blush', 'magenta', 'fuchsia'] },
  { title: 'Oranges and yellows', slugs: ['coral', 'orange', 'peach', 'amber', 'rust', 'terracotta', 'yellow', 'gold', 'mustard'] },
  { title: 'Greens', slugs: ['green', 'lime-green', 'mint', 'olive', 'sage', 'forest-green', 'emerald'] },
  { title: 'Blues and teals', slugs: ['teal', 'turquoise', 'aqua', 'seafoam', 'blue', 'navy', 'sky-blue', 'royal-blue', 'cobalt', 'periwinkle', 'transparent-blue'] },
  { title: 'Purples', slugs: ['purple', 'lavender', 'violet', 'lilac', 'plum', 'indigo'] },
  { title: 'Neutrals and browns', slugs: ['ivory', 'cream', 'beige', 'white', 'silver', 'gray', 'charcoal', 'gunmetal', 'black', 'taupe', 'brown', 'espresso', 'chocolate', 'tan', 'sand'] },
  /* Aesthetics rather than shades, kept apart so the list above stays a list of colors. */
  { title: 'Styles', slugs: ['y2k', 'tuscan'] },
];

/** Pages that describe an aesthetic rather than a shade. */
export const STYLE_PAGES = COLORS.filter((color) => color.kind === 'style');

/**
 * Slug, name and hex only — nothing else.
 *
 * Used to match an arbitrary palette swatch to the closest page we publish. It
 * exists as a separate export because the full catalog carries several thousand
 * words of prose per rich entry, and the palette pages need this list in the
 * browser.
 *
 * Two kinds of entry are excluded on purpose:
 *   - `kind: 'family'` (pastel) describes a group of colors and `kind: 'style'`
 *     (y2k) describes an era, so neither has a single value to measure against;
 *   - `transparent-blue` is a page about the alpha channel rather than a shade,
 *     and matching a vivid cyan to it was one of the wrong links this replaced.
 */
const NOT_A_SHADE = new Set(['transparent-blue']);

export const COLOR_INDEX = COLORS
  .filter((color) => !color.kind && !NOT_A_SHADE.has(color.slug))
  .map((color) => ({ slug: color.slug, name: color.name, hex: color.hex }));
