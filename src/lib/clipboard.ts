/**
 * Cross-environment "copy text to clipboard" helper.
 *
 * `navigator.clipboard.writeText()` is the modern API but is blocked in:
 *   • cross-origin iframes (e.g. preview deployments)
 *   • insecure contexts (http://)
 *   • browsers that gate it behind a Permissions-Policy
 *
 * When that happens, fall back to the legacy `document.execCommand('copy')`
 * trick (hidden textarea → select() → copy → remove). It still works in every
 * evergreen browser even when the modern API is denied.
 *
 * Returns `true` when the copy succeeded, `false` otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  // 1. Modern Clipboard API
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permissions-Policy or insecure context — fall through to legacy path
  }

  // 2. Legacy execCommand fallback
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);

    const selection = document.getSelection();
    const previousRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);

    let ok = false;
    try {
      // execCommand is deprecated but still the only viable fallback.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }

    document.body.removeChild(ta);

    if (previousRange && selection) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }

    return ok;
  } catch {
    return false;
  }
}
