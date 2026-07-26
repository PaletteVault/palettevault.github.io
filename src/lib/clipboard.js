/**
 * ============================================================================
 *  CLIPBOARD + TOAST
 * ============================================================================
 *
 *  Shared by the gallery, the palette page and every tool, so copy feedback
 *  looks and behaves identically across the site.
 * ============================================================================
 */

let toastNode = null;
let toastTimer = 0;

/** Brief confirmation pinned to the bottom of the viewport. */
export function showToast(message, duration = 1200) {
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

/**
 * Copy text to the clipboard.
 *
 * navigator.clipboard is unavailable on plain http:// origins and in older
 * browsers, so fall back to a hidden textarea plus execCommand. Deprecated,
 * but it is the only thing that works there.
 */
export async function copyText(text) {
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

/** Copy and report in one call. */
export async function copyWithToast(text, label = text) {
  const ok = await copyText(text);
  showToast(ok ? `${label} copied` : 'Copy failed');
  return ok;
}
