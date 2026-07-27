/**
 * ============================================================================
 *  LOCAL LIKE STORAGE (localStorage)
 * ============================================================================
 *
 *  Answers two questions:
 *    1. "Has this visitor already liked this palette?" — which keeps the
 *       counter honest and the heart correctly filled.
 *    2. "What belongs on the Collection page?" — which is the like list itself.
 *
 *  A palette is keyed by its slug (24 hex characters, four colors in a row).
 *  Because the slug already contains the colors, nothing else has to be
 *  cached for Collection: the list of slugs is the render data.
 *
 *  Format: one key holding a JSON array of slugs in insertion order (newest
 *  last). An array rather than a Set, to preserve that order.
 * ============================================================================
 */

import { parseSlug } from './palette.js';

const STORAGE_KEY = 'palette.likes.v2';

/** In-memory cache, so a click never re-parses the JSON. */
let cache = null;

/** localStorage may be unavailable: private mode, SSR, or disabled. */
function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function read() {
  if (cache) return cache;

  const storage = safeStorage();
  if (!storage) {
    cache = { list: [], set: new Set() };
    return cache;
  }

  let list = [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    if (Array.isArray(parsed)) {
      // Filter out junk: an older version may have left entries behind.
      list = parsed.filter((slug) => typeof slug === 'string' && parseSlug(slug));
    }
  } catch {
    list = [];
  }

  cache = { list, set: new Set(list) };
  return cache;
}

function persist() {
  const storage = safeStorage();
  if (!storage || !cache) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cache.list));
  } catch (error) {
    // QuotaExceeded and friends — never break the UI over storage.
    console.warn('[store] could not save likes:', error);
  }
}

/* ==========================================================================
 * PUBLIC API
 * ========================================================================== */

/** Whether this visitor has liked the palette. */
export function isLiked(slug) {
  return read().set.has(slug);
}

/** Every liked slug, newest first — the order used by Collection. */
export function likedSlugs() {
  return [...read().list].reverse();
}

/** Number of palettes in the collection. */
export function likedCount() {
  return read().list.length;
}

/**
 * Toggle a like.
 * @returns {boolean} the new state (true means liked)
 */
export function toggleLike(slug) {
  const state = read();

  if (state.set.has(slug)) {
    state.set.delete(slug);
    state.list = state.list.filter((item) => item !== slug);
    persist();
    return false;
  }

  state.set.add(slug);
  state.list.push(slug);
  persist();
  return true;
}

/**
 * Gallery rows built from the local collection.
 * Colors come straight out of the slug, so no extra storage is involved.
 *
 * @returns {Array<[null, string, string, string, string]>}
 */
export function collectionRows() {
  return likedSlugs()
    .map((slug) => {
      const colors = parseSlug(slug);
      return colors ? [null, ...colors] : null;
    })
    .filter(Boolean);
}
