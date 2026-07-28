/**
 * ============================================================================
 *  BROWSER EXTENSION AND EDITOR PLUGINS
 * ============================================================================
 *
 *  One place for the store URLs and the descriptions that go with them.
 *
 *  These addresses appear in the header, the plugins page, the footer and
 *  llms.txt. Written out four times they would drift, and a store link that
 *  drifts is worse than most broken links: it fails on the one page where a
 *  visitor had already decided to install something.
 *
 *  `status` is what keeps this file honest. Anything not actually published
 *  says so, rather than being listed beside the live one and quietly implying
 *  it can be installed today.
 * ============================================================================
 */

export const OBSIDIAN_PLUGIN_URL = 'https://community.obsidian.md/plugins/palette-vault';

export const CHROME_EXTENSION_URL =
  'https://chromewebstore.google.com/detail/palette-vault-color-palet/njnhlacephcfkccghemekgggekioiekh';

export const PLUGINS = [
  {
    slug: 'chrome',
    name: 'Palette Vault for Chrome',
    platform: 'Chrome, Edge, Brave and other Chromium browsers',
    status: 'live',
    url: CHROME_EXTENSION_URL,
    cta: 'Add to Chrome',
    summary:
      'Generate palettes in the toolbar, pull the colors out of any website, '
      + 'extract them from an image, and pick a color off the screen with the '
      + 'eyedropper.',
    features: [
      'Generate a four-color palette and reroll until one lands',
      'Read the colors off the page you are looking at',
      'Drop in an image and get the colors that define it',
      'Eyedropper: click any pixel, the hex goes to your clipboard',
      'Save palettes locally, no account needed',
      'Opens in the browser side panel, so it stays put while you work',
    ],
    note:
      'There is no host permission, so the extension cannot see the sites you '
      + 'visit and has no standing access to any page.',
  },
  {
    slug: 'obsidian',
    name: 'Palette Vault for Obsidian',
    platform: 'Obsidian, desktop and mobile',
    status: 'live',
    url: OBSIDIAN_PLUGIN_URL,
    cta: 'View in the plugin directory',
    summary:
      'Generate palettes inside a note, preview every hex code inline, render '
      + 'palette blocks as swatches, and extract colors from the images in your '
      + 'vault.',
    features: [
      'A ribbon panel that generates palettes and inserts them',
      'A color chip beside every hex code, in editing and reading mode',
      'Fenced palette blocks that render as clickable swatches',
      'Extract a palette from any image embedded in a note',
      'An eyedropper that inserts and copies in one step',
    ],
    note:
      'Install it from inside Obsidian: Settings, Community plugins, Browse, '
      + 'then search for Palette Vault.',
  },
];

export const LIVE_PLUGINS = PLUGINS.filter((plugin) => plugin.status === 'live');
