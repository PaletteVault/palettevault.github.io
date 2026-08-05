/**
 * ============================================================================
 *  DESKTOP APPLICATIONS
 * ============================================================================
 *
 *  Separate from lib/plugins.js on purpose, even though the two look alike.
 *
 *  A plugin lives inside something the reader already runs; an application is
 *  a thing they install on its own. That difference decides what the page has
 *  to say: a plugin entry explains where it appears once installed, an app
 *  entry explains what it is and what it needs to run. Merging them would
 *  force one shape onto both and the weaker fit would show.
 * ============================================================================
 */

export const WINDOWS_APP_URL = 'https://apps.microsoft.com/detail/9N2F8N1Z1LC4';

export const APPS = [
  {
    slug: 'windows',
    name: 'Palette Vault for Windows',
    platform: 'Windows 10 and 11',
    status: 'live',
    url: WINDOWS_APP_URL,
    cta: 'Get it from Microsoft',
    screenshot: '/apps/windows-app.png',
    screenshotAlt:
      'The Palette Vault desktop app showing a grid of generated four-color palettes',
    summary:
      'A desktop colour toolkit. Generate palettes, pull them out of a photo, '
      + 'and pick a colour from anywhere on your screen. Works with no network '
      + 'connection at all.',
    features: [
      'Generate four-color palettes across eight harmony schemes',
      'Reroll with the spacebar until something lands',
      'Drop in a photo and get the colors that define it',
      'Eyedropper reads any pixel on screen, inside the app or outside it',
      'Save palettes to a collection that survives restarts',
      'Click any swatch to copy its hex, or take all four at once',
    ],
    /*
     * Stated plainly because it is the thing that distinguishes this from
     * most free desktop tools, and because it is verifiable: the app has no
     * network code at all, which is also what made the Store review short.
     */
    note:
      'No account, no sign-up, no telemetry, and no network requests of any '
      + 'kind. Everything is computed on your own machine.',
  },
];

export const LIVE_APPS = APPS.filter((app) => app.status === 'live');
