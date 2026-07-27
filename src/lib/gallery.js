/**
 * ============================================================================
 *  GALLERY: CHUNK LOADING, INFINITE SCROLL, COPY, LIKES
 * ============================================================================
 *
 *  One module serves every feed on the site. The pages differ only in their
 *  data source:
 *
 *    chunks     — static JSON chunks (/data/new/*, /data/tag/<slug>/*)
 *    random     — the same chunks, visited in random order and shuffled within
 *    popular    — top likes from Firebase Realtime Database
 *    collection — local likes from localStorage
 *
 *  All of it works without a framework: event delegation plus string rendering
 *  from lib/card.js. For static content that is noticeably faster than
 *  hydrating components.
 * ============================================================================
 */

import { cardsHTML, relativeDate } from './card.js';
import {
  bumpLikes,
  fetchLikes,
  fetchTopPalettes,
  getCachedLikes,
  getLastWriteError,
  isFirebaseConfigured,
  reconcileLike,
} from './firebase.js';
import { collectionRows, isLiked, likedCount, toggleLike } from './store.js';

/** Cards appended per scroll step. */
const PAGE_SIZE = 60;

/* ==========================================================================
 * MANIFEST
 * ========================================================================== */

let metaPromise = null;

export function loadMeta() {
  metaPromise ??= fetch('/data/meta.json')
    .then((response) => {
      if (!response.ok) throw new Error(`meta.json: ${response.status}`);
      return response.json();
    })
    .catch((error) => {
      console.error('[gallery] could not load meta.json:', error);
      return { total: 0, chunkSize: 1000, latestTs: Date.now(), stepMs: 0, feeds: {}, tags: [] };
    });

  return metaPromise;
}

/** Load a single chunk, with caching. */
const chunkCache = new Map();

function loadChunk(base, index) {
  const url = `${base}/${index}.json`;
  if (!chunkCache.has(url)) {
    chunkCache.set(
      url,
      fetch(url)
        .then((response) => (response.ok ? response.json() : []))
        .catch(() => []),
    );
  }
  return chunkCache.get(url);
}

/* ==========================================================================
 * DATA SOURCES (FEEDS)
 *
 * Contract: the object exposes async next(limit) -> row[]. Empty array = end.
 * ========================================================================== */

/**
 * Sequential walk through the chunks: 1.json, 2.json, …
 * `skip` is how many leading rows to drop — that many cards were already
 * rendered into the HTML at build time and must not be repeated.
 */
function chunksFeed({ base, chunks, skip = 0 }) {
  let chunkIndex = 1;
  let buffer = [];
  let cursor = 0;
  let toSkip = skip;

  return {
    async next(limit) {
      const out = [];
      while (out.length < limit) {
        // Buffer exhausted — pull the next chunk.
        if (cursor >= buffer.length) {
          if (chunkIndex > chunks) break; // out of chunks
          buffer = await loadChunk(base, chunkIndex);
          chunkIndex += 1;
          cursor = 0;

          // Skip what is already in the HTML; this may span several chunks.
          if (toSkip > 0) {
            const drop = Math.min(toSkip, buffer.length);
            cursor = drop;
            toSkip -= drop;
          }
          if (cursor >= buffer.length) continue;
        }
        const take = Math.min(limit - out.length, buffer.length - cursor);
        out.push(...buffer.slice(cursor, cursor + take));
        cursor += take;
      }
      return out;
    },
  };
}

/** Random order: a random chunk without repeats, shuffled internally. */
function randomFeed({ base, chunks }) {
  const order = shuffle(Array.from({ length: chunks }, (_, i) => i + 1));
  let pointer = 0;
  let buffer = [];
  let cursor = 0;

  return {
    async next(limit) {
      const out = [];
      while (out.length < limit) {
        if (cursor >= buffer.length) {
          if (pointer >= order.length) break;
          buffer = shuffle([...(await loadChunk(base, order[pointer]))]);
          pointer += 1;
          cursor = 0;
          if (buffer.length === 0) continue;
        }
        const take = Math.min(limit - out.length, buffer.length - cursor);
        out.push(...buffer.slice(cursor, cursor + take));
        cursor += take;
      }
      return out;
    },
  };
}

/** A ready array of rows (Popular / Collection), served in batches. */
function staticFeed(rowsPromise) {
  let rows = null;
  let cursor = 0;

  return {
    async next(limit) {
      rows ??= await rowsPromise;
      const slice = rows.slice(cursor, cursor + limit);
      cursor += slice.length;
      return slice;
    },
  };
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ==========================================================================
 * COPY CONFIRMATION
 * ========================================================================== */

let toastNode = null;
let toastTimer = 0;

function showToast(message, duration = 1100) {
  if (!toastNode) {
    toastNode = document.createElement('div');
    toastNode.className = 'toast';
    toastNode.setAttribute('role', 'status');
    toastNode.setAttribute('aria-live', 'polite');
    document.body.append(toastNode);
  }

  toastNode.textContent = message;
  toastNode.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastNode.classList.remove('is-visible'), duration);
}

/** Copy, with a fallback for http:// origins and older browsers. */
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.cssText = 'position:fixed;top:-9999px;opacity:0';
    document.body.append(helper);
    helper.select();
    const ok = document.execCommand('copy');
    helper.remove();
    return ok;
  } catch {
    return false;
  }
}

/* ==========================================================================
 * LIKES: SYNCING CARD STATE
 * ========================================================================== */

function paintLike(card, { count } = {}) {
  const slug = card.dataset.slug;
  const button = card.querySelector('[data-like]');
  const counter = card.querySelector('[data-count]');
  if (!button || !counter) return;

  const liked = isLiked(slug);
  button.classList.toggle('is-liked', liked);
  button.setAttribute('aria-pressed', String(liked));

  const value = count ?? getCachedLikes(slug);
  if (typeof value === 'number') counter.textContent = String(value);
}

/**
 * Counters are fetched only for cards that actually reach the viewport.
 * Otherwise a long feed would fire thousands of pointless reads.
 */
function createLikeLoader() {
  if (!isFirebaseConfigured || typeof IntersectionObserver === 'undefined') {
    return { observe() {} };
  }

  return new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);

        const card = entry.target;
        const slug = card.dataset.slug;

        fetchLikes(slug).then(async (count) => {
          paintLike(card, { count });

          // Repair a like that never reached the database — see reconcileLike.
          const repaired = await reconcileLike(slug, isLiked(slug), count);
          if (repaired !== null) paintLike(card, { count: repaired });
        });
      }
    },
    { rootMargin: '300px 0px' },
  );
}

/* ==========================================================================
 * MAIN ENTRY POINT
 * ========================================================================== */

/**
 * @param {object} options
 * @param {HTMLElement} options.mount    the card grid container
 * @param {object}      options.source   { type, base?, chunks? }
 * @param {HTMLElement} [options.sentinel] element that triggers loading more
 * @param {HTMLElement} [options.empty]    the empty-state block
 * @param {HTMLElement} [options.status]   status line / loading indicator
 */
export async function initGallery({ mount, source, sentinel, empty, status }) {
  if (!mount) return;

  const meta = await loadMeta();
  const likeLoader = createLikeLoader();

  /* --- 1. Build the requested source ------------------------------------ */
  let feed;
  let finite = false;

  switch (source.type) {
    case 'random':
      feed = randomFeed({ base: source.base, chunks: source.chunks });
      break;

    case 'popular':
      finite = true;
      feed = staticFeed(
        isFirebaseConfigured ? fetchTopPalettes(source.limit ?? 150) : Promise.resolve([]),
      );
      break;

    case 'collection':
      finite = true;
      feed = staticFeed(Promise.resolve(collectionRows()));
      break;

    default:
      feed = chunksFeed({ base: source.base, chunks: source.chunks, skip: source.skip ?? 0 });
  }

  /* --- 2. Initialise the cards already rendered into the HTML ----------- */
  for (const card of mount.querySelectorAll('.card')) {
    paintLike(card);
    likeLoader.observe?.(card);
  }
  refreshDates(mount);

  /* --- 3. Loading further batches ---------------------------------------- */
  let loading = false;
  let done = false;
  let replaced = false;
  let rendered = mount.querySelectorAll('.card').length;

  async function loadMore() {
    if (loading || done) return;
    loading = true;
    status?.classList.add('is-loading');

    try {
      const rows = await feed.next(PAGE_SIZE);

      if (rows.length === 0) {
        done = true;
        if (rendered === 0) empty?.removeAttribute('hidden');
        status?.classList.remove('is-loading');
        status?.setAttribute('hidden', '');
        return;
      }

      /*
       * Popular is ranked live from Firebase, but the page ships with a static
       * batch so it is not blank before that resolves. The first real batch
       * therefore replaces the placeholders instead of appending to them.
       */
      if (source.type === 'popular' && rendered > 0 && !replaced) {
        mount.replaceChildren();
        rendered = 0;
        replaced = true;
      }

      const fragment = document.createElement('div');
      fragment.innerHTML = cardsHTML(rows, meta);

      const cards = [...fragment.children];
      mount.append(...cards);
      rendered += cards.length;

      for (const card of cards) {
        paintLike(card);
        likeLoader.observe?.(card);
      }

      // Finite feeds (Popular/Collection) close as soon as a short batch
      // arrives; a second, empty request would be wasted.
      if (finite && rows.length < PAGE_SIZE) {
        done = true;
        status?.setAttribute('hidden', '');
      }
    } finally {
      loading = false;
      status?.classList.remove('is-loading');
    }
  }

  /* --- 4. Infinite scroll ------------------------------------------------ */
  // Without a sentinel the feed is a fixed preview: one batch and stop.
  if (!sentinel) finite = true;

  if (sentinel && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(sentinel);
  }

  /* --- 4b. First batch -----------------------------------------------------
   * Only fetch immediately when the page rendered no cards of its own.
   *
   * Feeds with a pre-rendered batch already have a full first screen, so
   * fetching chunk 1 during load only lengthens the critical request chain:
   * it hangs off the end of HTML → CSS → entry script → gallery → palette,
   * and delays nothing the visitor can see. The sentinel has 800px of root
   * margin, so the fetch still starts well before anyone reaches the bottom.
   */
  if (rendered === 0) await loadMore();

  /* --- 5. Click delegation ----------------------------------------------- */
  mount.addEventListener('click', onGridClick);
}

/* ==========================================================================
 * GRID CLICK HANDLER
 * ========================================================================== */

async function onGridClick(event) {
  /* --- Copy HEX -----------------------------------------------------------
   * The copy button sits above the stretched .card__hit link, so propagation
   * is stopped: otherwise the click would reach the link and navigate away.
   */
  const copyButton = event.target.closest('.swatch__copy');
  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();

    const hex = copyButton.dataset.hex;
    const ok = await copyText(hex);
    showToast(ok ? `${hex} copied` : 'Copy failed');

    const swatch = copyButton.closest('.swatch');
    swatch?.classList.add('is-copied');
    setTimeout(() => swatch?.classList.remove('is-copied'), 400);
    return;
  }

  /* --- Like --------------------------------------------------------------- */
  const button = event.target.closest('[data-like]');
  if (!button) return;

  const card = button.closest('.card');
  const slug = card.dataset.slug;

  // 1. Local state is the source of truth for "have I liked this".
  const liked = toggleLike(slug);

  // 2. Optimistic UI: do not wait for the network.
  const counter = card.querySelector('[data-count]');
  const current = Number(counter?.textContent ?? 0);
  const nextValue = Math.max(0, current + (liked ? 1 : -1));
  if (counter) counter.textContent = String(nextValue);

  button.classList.toggle('is-liked', liked);
  button.setAttribute('aria-pressed', String(liked));
  button.classList.remove('is-bumping');
  void button.offsetWidth; // restart the CSS animation
  button.classList.add('is-bumping');

  updateCollectionBadge();

  // 3. Atomic increment/decrement in Firebase.
  const saved = await bumpLikes(slug, liked ? 1 : -1);

  // Say so when the counter only changed locally. Silently pretending the
  // write succeeded is what makes this class of problem hard to notice.
  if (!saved) {
    showToast(
      getLastWriteError() === 'not-configured'
        ? 'Saved in this browser only'
        : 'Could not save — see the console',
      2400,
    );
  }
}

/* ==========================================================================
 * ODDS AND ENDS
 * ========================================================================== */

/**
 * Recompute relative dates: the static markup may have been built long ago.
 * The date lives in the tooltip (the footer shows the palette name), so this
 * updates the tail of the title string after the separator.
 */
export function refreshDates(root = document) {
  const now = Date.now();
  for (const node of root.querySelectorAll('[data-ts]')) {
    const fresh = relativeDate(Number(node.dataset.ts), now);
    const name = (node.getAttribute('title') ?? '').split(' · ')[0];
    node.setAttribute('title', name ? `${name} · ${fresh}` : fresh);
  }
}

/** The counter next to Collection in the header. */
export function updateCollectionBadge() {
  const badge = document.querySelector('[data-collection-count]');
  if (!badge) return;

  const count = likedCount();
  badge.textContent = String(count);
  badge.toggleAttribute('hidden', count === 0);
}
