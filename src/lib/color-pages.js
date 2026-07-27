/**
 * ============================================================================
 *  COLOR LANDING PAGES — DATA
 * ============================================================================
 *
 *  Each entry becomes one page at /<slug>/ rendered by ColorLanding.astro.
 *
 *  The split is deliberate: markup is written once, words are written per
 *  page. Three hand-built landing pages had already produced three copies of
 *  the same 250 lines of structure, and a fourth would have made the drift
 *  permanent — the value of these pages is entirely in the prose, not in the
 *  layout.
 *
 *  Conventions:
 *    tag       which palette category feeds the grid. The tag page
 *              canonicalises here, so one query is not split across two URLs.
 *    base      the hex the tint-and-shade scale is generated from.
 *    named     specific shades. `hex` for values fixed by the CSS spec,
 *              `{ hue, L, C }` for ones generated in OKLCH.
 *    sections  prose. Paragraphs may contain inline HTML links.
 *
 *  Numbers quoted in the prose (contrast ratios, the first WCAG-passing step)
 *  are computed at build time by the component rather than typed in here, so
 *  they cannot go stale if a base color is retuned.
 * ============================================================================
 */

export const COLOR_PAGES = [
  /* ======================================================================== */
  {
    slug: 'ivory-color',
    tag: 'cream',
    base: 'fffff0',
    keyword: 'Ivory',
    h1: 'Ivory color: hex codes, shades and palettes',
    titleTemplate: 'Ivory Color — Hex Code #FFFFF0, Shades & {count} Palettes',
    description:
      'The ivory color hex code is #FFFFF0. See ivory next to cream, beige and '
      + 'eggshell, get every shade in HEX, RGB and HSL, and browse {count} palettes.',

    lead: [
      'Ivory is the off-white of old piano keys and wedding stationery — white '
      + 'with a trace of yellow in it, warm enough to feel softer than paper but '
      + 'pale enough to still read as white. The CSS keyword <code>ivory</code> '
      + 'is <strong>#FFFFF0</strong>.',
      'Below are ivory and its neighbours with hex codes, a full shade scale, '
      + 'and {count} palettes built around warm off-whites.',
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
      {
        q: 'What is the hex code for ivory?',
        a: 'Ivory is #FFFFF0 — the CSS named color. In RGB that is rgb(255, 255, 240), and in HSL hsl(60, 100%, 97%): full white with the blue channel pulled down slightly, which is what produces the faint warmth.',
      },
      {
        q: 'Is ivory a shade of white?',
        a: 'Yes. It is an off-white — white with a small amount of yellow. At 97% lightness it is close enough to white that most people will call it white until it sits next to a pure white, at which point the warmth becomes obvious.',
      },
      {
        q: 'What is the difference between ivory and cream?',
        a: 'Both are warm off-whites at roughly the same hue, but cream is darker and more saturated. Ivory reads as white with a hint of warmth; cream reads as a pale yellow. Put them side by side and the difference is unmistakable, in isolation neither is.',
      },
      {
        q: 'Can I use ivory text on a white background?',
        a: 'No. Ivory on white measures about 1.01:1, effectively invisible — normal text needs 4.5:1. Ivory is a background color. For text on an ivory background, dark warm greys and near-blacks work well and clear WCAG AA comfortably.',
      },
    ],

    related: [
      { href: '/tag/cream/', label: 'cream palettes' },
      { href: '/tag/wedding/', label: 'wedding' },
      { href: '/tag/light/', label: 'light' },
      { href: '/tag/earth/', label: 'earth tones' },
      { href: '/pastel-colors/', label: 'pastel colors' },
    ],
  },

  /* ======================================================================== */
  {
    slug: 'lime-green',
    tag: 'green',
    base: '32cd32',
    keyword: 'Lime green',
    h1: 'Lime green: hex codes, shades and color palettes',
    titleTemplate: 'Lime Green — Hex Code #32CD32, Shades & {count} Palettes',
    description:
      'The lime green hex code is #32CD32. Every shade from pale to deep in HEX, '
      + 'RGB and HSL, how it differs from lime and chartreuse, plus {count} palettes.',

    lead: [
      'Lime green is the bright, slightly yellow-leaning green of a fresh lime '
      + 'skin — loud enough to work as an accent, dark enough to still be a '
      + 'green rather than a highlighter. The CSS keyword '
      + '<code>limegreen</code> is <strong>#32CD32</strong>.',
      'Below are the shades with hex codes, the difference between lime green '
      + 'and its neighbours, and {count} green palettes.',
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
          + 'is #00FF00 — the green primary at full strength, with nothing mixed '
          + 'in. It is not a color anyone chooses deliberately for design work: '
          + 'at 100% saturation it vibrates against most backgrounds and is '
          + 'almost impossible to use for text. Lime green (#32CD32) is that '
          + 'same hue pulled down to 61% saturation and 50% lightness, which is '
          + 'what makes it usable.',
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
          + 'neutrals — charcoal, warm grey, off-white — rather than pairing it '
          + 'with another saturated color. Where a second color is needed, deep '
          + 'purple is the direct complement and holds up; anything orange or '
          + 'red next to it tends to read as a warning.',
          'It is a natural fit for sports and fitness branding, energy drinks, '
          + 'eco and sustainability marks, and developer tooling that wants to '
          + 'look technical rather than corporate. It struggles in finance, '
          + 'healthcare and luxury, where the brightness reads as cheap.',
        ],
      },
    ],

    faq: [
      {
        q: 'What is the hex code for lime green?',
        a: 'Lime green is #32CD32, the CSS named color limegreen. In RGB that is rgb(50, 205, 50) and in HSL hsl(120, 61%, 50%) — a pure green hue at just over half saturation.',
      },
      {
        q: 'Is lime green the same as lime?',
        a: 'No. CSS lime is #00FF00, the green primary at full intensity. Lime green is #32CD32, the same hue but noticeably softer and darker. Lime is too intense for most design work; lime green is the one people usually mean.',
      },
      {
        q: 'What colors go with lime green?',
        a: 'Neutrals first — charcoal, warm grey and off-white let it be the accent without competition. For a second color, deep purple is the direct complement and gives the strongest contrast, while navy and dark teal produce a calmer pairing. Avoid putting it beside saturated orange or red.',
      },
      {
        q: 'Is lime green readable as text?',
        a: 'Not on white. #32CD32 measures around 2.12:1 against white, well below the 4.5:1 WCAG AA requires for normal text. It works as a background with dark text, or as text on a dark background, but not as green text on a light page.',
      },
    ],

    related: [
      { href: '/tag/green/', label: 'green palettes' },
      { href: '/tag/nature/', label: 'nature' },
      { href: '/tag/neon/', label: 'neon' },
      { href: '/tag/spring/', label: 'spring' },
      { href: '/shades-of-purple/', label: 'shades of purple' },
    ],
  },

  /* ======================================================================== */
  {
    slug: 'coral-color',
    tag: 'orange',
    base: 'ff7f50',
    keyword: 'Coral',
    h1: 'Coral color: hex codes, shades and palettes',
    titleTemplate: 'Coral Color — Hex Code #FF7F50, Shades & {count} Palettes',
    description:
      'The coral color hex code is #FF7F50. Coral compared with salmon and peach, '
      + 'every shade in HEX, RGB and HSL, and {count} warm color palettes.',

    lead: [
      'Coral is the warm pink-orange of the reef it is named after — orange '
      + 'with enough pink in it to feel soft rather than loud. The CSS keyword '
      + '<code>coral</code> is <strong>#FF7F50</strong>.',
      'Below are coral and the colors it gets confused with, a full shade '
      + 'scale, and {count} palettes in the same warm range.',
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
          + 'pink. Coral (#FF7F50) is at hue 16 and fully saturated: the most '
          + 'orange of the three and the most vivid. Salmon (#FA8072) sits at '
          + 'hue 6, closer to pink, and is slightly muted — it reads as fleshier '
          + 'and softer. Peach is paler than both, high in lightness and low in '
          + 'saturation, which puts it in pastel territory rather than accent '
          + 'territory.',
          'A quick test: if it could plausibly be a background, it is peach. If '
          + 'it reads as pink before it reads as orange, it is salmon. If it '
          + 'jumps forward as an accent, it is coral.',
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
          'It suits hospitality, travel, food, beauty and anything summery, and '
          + 'it is a common choice for interfaces wanting to feel friendly '
          + 'without resorting to a primary. The failure mode is pairing it '
          + 'with another warm mid-tone: coral beside a similar orange or pink '
          + 'looks like an accident rather than a decision.',
        ],
      },
    ],

    faq: [
      {
        q: 'What is the hex code for coral?',
        a: 'Coral is #FF7F50, the CSS named color. In RGB that is rgb(255, 127, 80) and in HSL hsl(16, 100%, 66%) — a fully saturated orange-red at high lightness.',
      },
      {
        q: 'What is the difference between coral and salmon?',
        a: 'Coral sits at hue 16 and is fully saturated, so it leans orange and reads as vivid. Salmon (#FA8072) sits nearer hue 6 and is slightly less saturated, so it leans pink and reads as softer. Side by side, coral is the brighter and more orange of the two.',
      },
      {
        q: 'What color goes best with coral?',
        a: 'Teal is the standard answer and it earns it — close to coral\'s complement, so the contrast is strong while the two stay balanced. Navy is a calmer alternative, and cream or sand will let coral sit quietly as a warm neutral rather than an accent.',
      },
      {
        q: 'Is coral pink or orange?',
        a: 'Orange, with pink in it. At hue 16 it sits in the orange-red range, but the high lightness and full saturation give it the softness people read as pink. Colors that are genuinely pink-first, such as salmon, sit lower on the hue circle.',
      },
    ],

    related: [
      { href: '/tag/orange/', label: 'orange palettes' },
      { href: '/tag/summer/', label: 'summer' },
      { href: '/tag/sunset/', label: 'sunset' },
      { href: '/tag/warm/', label: 'warm tones' },
      { href: '/pastel-colors/', label: 'pastel colors' },
    ],
  },
];

export const getColorPage = (slug) => COLOR_PAGES.find((page) => page.slug === slug) ?? null;
