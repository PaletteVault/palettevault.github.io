/**
 * ============================================================================
 *  APPLICATIONS (desktop and mobile)
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

export const ANDROID_APP_URL =
  'https://play.google.com/store/apps/details?id=io.github.palettevault';

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
  {
    slug: 'android',
    name: 'Palette Vault for Android',
    platform: 'Android 7.0 and newer',
    status: 'live',
    url: ANDROID_APP_URL,
    cta: 'Get it on Google Play',
    screenshot: '/apps/android-app.png',
    screenshotWidth: 1024,
    screenshotHeight: 500,
    screenshotAlt: 'The Palette Vault app icon over four color stripes',
    summary:
      'The palette tools in your pocket. Generate palettes, pull them out of a '
      + 'photo from the camera, and check the contrast between two colors.',
    features: [
      'Lock a color you like and regenerate the rest',
      'Fifteen moods, from Pastel and Vintage to Neon and Night',
      'Point the camera at anything and get the four colors it is made of',
      'WCAG contrast ratio with a plain note on what it allows',
      'Pick colors with OKLCH sliders instead of typing hex codes',
      'Save palettes to a list on your phone',
    ],
    /*
     * Unlike the Windows app this one shows an AdMob banner, so the note says
     * so rather than repeating the "no network requests" claim, which would
     * not be true here.
     */
    note:
      'No account needed. Your palettes and photos stay on your phone; the '
      + 'only network traffic is a small ad banner.',
  },
];

export const LIVE_APPS = APPS.filter((app) => app.status === 'live');
