/**
 * ============================================================================
 *  FIREBASE REALTIME DATABASE — LIKE LAYER
 * ============================================================================
 *
 *  Firebase is used ONLY for like counters. The palettes themselves are
 *  static JSON chunks under /public/data and never touch the database.
 *
 *  The data model is as narrow as it gets — one node, one number:
 *
 *      /palettes/{slug} = 42
 *
 *  where the slug is 24 hex characters — the palette's four colors in a row
 *  (see lib/palette.js). Three useful properties follow:
 *
 *    1. The key is the data. Colors never need to be stored separately; the
 *       Popular page rebuilds each palette straight from the key.
 *    2. Likes are not tied to generator ids. The dataset can be regenerated
 *       with a different seed, or palettes added and removed, and the counters
 *       stay with their colors.
 *    3. The top list is a single orderByValue().limitToLast(N) query.
 *
 *  The SDK is loaded lazily via dynamic import and stays out of the critical
 *  bundle: the gallery renders and works without Firebase, and counters arrive
 *  afterwards. With no keys configured the site still works fully — likes just
 *  live in localStorage.
 * ============================================================================
 */

import { parseSlug } from './palette.js';

/* --------------------------------------------------------------------------
 * Config from Astro environment variables. The PUBLIC_ prefix is required,
 * otherwise Astro will not expose the value to the client bundle.
 * -------------------------------------------------------------------------- */
const CONFIG = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.PUBLIC_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

/** Realtime Database only works when databaseURL is present. */
export const isFirebaseConfigured = Boolean(CONFIG.databaseURL && CONFIG.apiKey);

/* --------------------------------------------------------------------------
 * Lazy SDK initialisation. The promise is cached, so however many times this
 * is called, initializeApp runs exactly once.
 * -------------------------------------------------------------------------- */
let sdkPromise = null;

async function getSdk() {
  if (!isFirebaseConfigured) return null;

  sdkPromise ??= (async () => {
    const [{ initializeApp, getApps }, database] = await Promise.all([
      import('firebase/app'),
      import('firebase/database'),
    ]);

    const app = getApps().length ? getApps()[0] : initializeApp(CONFIG);
    return { db: database.getDatabase(app), ...database };
  })().catch((error) => {
    console.warn('[firebase] init failed; likes will work locally:', error);
    sdkPromise = null; // allow a retry later
    return null;
  });

  return sdkPromise;
}

/* ==========================================================================
 * COUNTER CACHE
 * The same palette appears in several feeds; never query the database twice.
 * ========================================================================== */
const countCache = new Map(); // slug -> number
const inFlight = new Map(); // slug -> Promise<number>

/** Read a cached value synchronously (or undefined). */
export function getCachedLikes(slug) {
  return countCache.get(slug);
}

/** Seed the cache locally; used by the optimistic UI. */
export function primeLikes(slug, value) {
  countCache.set(slug, Math.max(0, value));
}

/* --------------------------------------------------------------------------
 * Concurrency-limited queue.
 * RTDB multiplexes requests over a single websocket, but 60 simultaneous
 * get() calls during a scroll are still better spread out.
 * -------------------------------------------------------------------------- */
function createLimiter(limit) {
  let active = 0;
  const queue = [];

  const next = () => {
    if (active >= limit || queue.length === 0) return;
    active += 1;
    const { task, resolve, reject } = queue.shift();
    task().then(resolve, reject).finally(() => {
      active -= 1;
      next();
    });
  };

  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      next();
    });
}

const limit = createLimiter(8);

/* ==========================================================================
 * READING A COUNTER
 * ========================================================================== */

/**
 * Get the like count for a palette.
 * @param {string} slug 24 hex characters
 * @returns {Promise<number>}
 */
export async function fetchLikes(slug) {
  if (countCache.has(slug)) return countCache.get(slug);
  if (inFlight.has(slug)) return inFlight.get(slug);

  const promise = limit(async () => {
    const sdk = await getSdk();
    if (!sdk) return 0;

    try {
      const snapshot = await sdk.get(sdk.ref(sdk.db, `palettes/${slug}`));
      const value = Number(snapshot.val()) || 0;
      countCache.set(slug, value);
      return value;
    } catch (error) {
      console.warn(`[firebase] could not read likes for ${slug}:`, error);
      return countCache.get(slug) ?? 0;
    } finally {
      inFlight.delete(slug);
    }
  });

  inFlight.set(slug, promise);
  return promise;
}

/* ==========================================================================
 * WRITING: INCREMENT / DECREMENT
 * ========================================================================== */

/**
 * Why the last write did not reach the database, or null if it did.
 * Exposed so the UI can tell the visitor that a like only landed locally,
 * rather than failing silently and looking like it worked.
 */
let lastWriteError = null;

export function getLastWriteError() {
  return lastWriteError;
}

/**
 * Atomically change the like counter by ±1.
 *
 * @param {string} slug
 * @param {number} delta  +1 or -1
 * @returns {Promise<boolean>} whether the write landed (false = offline / no keys)
 */
export async function bumpLikes(slug, delta) {
  // Update the cache optimistically so the UI never waits on the network.
  countCache.set(slug, Math.max(0, (countCache.get(slug) ?? 0) + delta));

  if (!isFirebaseConfigured) {
    lastWriteError = 'not-configured';
    console.warn(
      '[firebase] PUBLIC_FIREBASE_* is not set, so likes stay in this browser only. ' +
        'Fill in .env and restart the dev server — Vite reads it once at startup.',
    );
    return false;
  }

  const sdk = await getSdk();
  if (!sdk) {
    lastWriteError = 'sdk-unavailable';
    return false;
  }

  try {
    // increment is a server-side sentinel: concurrent likes do not overwrite
    // each other, unlike a read-modify-write done on the client.
    await sdk.set(sdk.ref(sdk.db, `palettes/${slug}`), sdk.increment(delta));
    lastWriteError = null;
    return true;
  } catch (error) {
    lastWriteError = error?.code ?? 'unknown';

    // PERMISSION_DENIED here almost always means the rules in
    // database.rules.json were never published, or an older version is live.
    // Say so directly rather than leaving a bare stack trace.
    if (String(error?.message ?? '').toUpperCase().includes('PERMISSION_DENIED')) {
      console.error(
        `[firebase] PERMISSION_DENIED writing palettes/${slug}. ` +
          'The deployed rules do not allow this write — publish database.rules.json ' +
          '(Realtime Database → Rules → Publish, or `firebase deploy --only database`).',
      );
    } else {
      console.error(`[firebase] could not write like for ${slug}:`, error);
    }

    countCache.set(slug, Math.max(0, (countCache.get(slug) ?? 0) - delta));
    return false;
  }
}

/* ==========================================================================
 * RECONCILING A LOST WRITE
 * ========================================================================== */

/** Slugs already retried this session, so a failure cannot become a loop. */
const reconciled = new Set();

/**
 * Re-send a like whose write never reached the database.
 *
 * The check is exact rather than heuristic: if this visitor has the palette
 * liked locally, the shared counter cannot legitimately be 0, because their
 * own like would have made it at least 1. A 0 therefore means that particular
 * write was lost — typically because the rules were misconfigured at the time,
 * or the browser was offline.
 *
 * @param {string} slug
 * @param {boolean} liked        whether this visitor has it liked locally
 * @param {number} remoteCount   the count just read from the database
 * @returns {Promise<number|null>} the repaired count, or null if nothing to do
 */
export async function reconcileLike(slug, liked, remoteCount) {
  if (!liked || remoteCount !== 0 || reconciled.has(slug)) return null;
  if (!isFirebaseConfigured) return null;

  reconciled.add(slug);

  const ok = await bumpLikes(slug, 1);
  return ok ? (getCachedLikes(slug) ?? 1) : null;
}

/* ==========================================================================
 * TOP PALETTES (Popular page)
 * ========================================================================== */

/**
 * Top N palettes by like count.
 * Requires an index in the database rules: "palettes": { ".indexOn": ".value" }
 *
 * Colors come straight from the key, so the static chunks are never touched.
 *
 * @param {number} count
 * @returns {Promise<Array<[null, string, string, string, string]>>}
 *          tuples in the chunk format; the id is unknown, hence null
 */
export async function fetchTopPalettes(count = 150) {
  const sdk = await getSdk();
  if (!sdk) return [];

  let snapshot;

  try {
    snapshot = await sdk.get(
      sdk.query(sdk.ref(sdk.db, 'palettes'), sdk.orderByValue(), sdk.limitToLast(count)),
    );
  } catch (error) {
    // The server refuses to sort without an index. Rather than showing an
    // empty page, read the node and sort on the client — correct, just not
    // scalable, which is why the warning stays loud. This keeps Popular
    // usable while the rules are still being set up.
    if (!String(error?.message ?? '').includes('Index not defined')) {
      console.warn('[firebase] could not fetch top palettes:', error);
      return [];
    }

    console.warn(
      '[firebase] /palettes has no ".indexOn": ".value" in the deployed rules, ' +
        'so Popular fell back to sorting on the client. Publish database.rules.json ' +
        'to fix it — the fallback downloads the whole node and will not scale.',
    );

    try {
      const all = await sdk.get(sdk.ref(sdk.db, 'palettes'));
      const rows = [];

      all.forEach((child) => {
        const colors = parseSlug(String(child.key));
        const value = Number(child.val());
        if (colors && Number.isFinite(value) && value > 0) {
          countCache.set(String(child.key), value);
          rows.push({ colors, value });
        }
      });

      return rows
        .sort((a, b) => b.value - a.value)
        .slice(0, count)
        .map((row) => [null, ...row.colors]);
    } catch (fallbackError) {
      console.warn('[firebase] fallback read failed too:', fallbackError);
      return [];
    }
  }

  try {

    const rows = [];
    let skipped = 0;

    snapshot.forEach((child) => {
      const slug = String(child.key);
      const colors = parseSlug(slug);

      // Keys that are not a 24-character slug come from an older data model
      // and carry no colors, so there is nothing to render. Count them: a
      // Popular page that looks empty while the database clearly has records
      // is otherwise very confusing to debug.
      if (!colors) {
        skipped += 1;
        return;
      }

      const value = Number(child.val()) || 0;
      if (value <= 0) return; // zero counters do not belong in Popular

      countCache.set(slug, value);
      rows.push([null, ...colors]);
    });

    if (skipped > 0) {
      console.warn(
        `[firebase] Popular skipped ${skipped} record(s) whose key is not a palette slug. ` +
          'These are leftovers from an earlier data model — delete the /palettes node ' +
          'in the Firebase console to clear them.',
      );
    }

    // Firebase returns ascending order; reverse it so the most liked come first.
    return rows.reverse();
  } catch (error) {
    console.warn('[firebase] could not fetch top palettes:', error);
    return [];
  }
}
