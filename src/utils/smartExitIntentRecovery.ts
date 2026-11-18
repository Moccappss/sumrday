/**
 * ══════════════════════════════════════════════════════════════════════
 * SMART EXIT-INTENT & DRAFT RECOVERY ENGINE
 * Detects visitor departure intent and automatically guards in-progress
 * form inputs, checkout drafts, and carts from being lost.
 * ══════════════════════════════════════════════════════════════════════
 */

const SESSION_LOCK_KEY = 'sumr_exit_intent_fired';
const DRAFT_STORAGE_PREFIX = 'sumr_draft_';

let _isInitialized = false;

/**
 * Saves a draft of any form or cart input
 */
export function saveDraftForm(formKey: string, data: any): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${formKey}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {}
}

/**
 * Retrieves a saved draft if within 7 days
 */
export function getDraftForm<T = any>(formKey: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${formKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > SEVEN_DAYS) {
      localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${formKey}`);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

/**
 * Clears a specific saved draft
 */
export function clearDraftForm(formKey: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${formKey}`);
  } catch {}
}

/**
 * Initializes Exit-Intent Detector (Desktop cursor boundary & Mobile gesture)
 */
export function initSmartExitIntentEngine(): void {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;

  // Trigger at most once per session
  if (sessionStorage.getItem(SESSION_LOCK_KEY)) return;

  // 1. Desktop Mouse Exit Detection (cursor approaching tab/address bar rapidly)
  const handleMouseLeave = (e: MouseEvent) => {
    if (e.clientY <= 15 && e.relatedTarget === null) {
      triggerExitIntent();
    }
  };

  const triggerExitIntent = () => {
    if (sessionStorage.getItem(SESSION_LOCK_KEY)) return;
    sessionStorage.setItem(SESSION_LOCK_KEY, 'true');

    // Notify components via event
    window.dispatchEvent(new CustomEvent('sumr_exit_intent_triggered', {
      detail: { timestamp: Date.now() }
    }));
  };

  document.addEventListener('mouseleave', handleMouseLeave);

  // 2. Mobile rapid upward scroll detection near end of page
  let lastScrollY = window.scrollY;
  let lastScrollTime = Date.now();

  const handleScroll = () => {
    const now = Date.now();
    const currentY = window.scrollY;
    const scrollDelta = lastScrollY - currentY;
    const timeDelta = now - lastScrollTime;

    if (timeDelta > 0 && timeDelta < 200) {
      const scrollSpeed = scrollDelta / timeDelta;
      // Fast upward flick when user has scrolled down past 500px
      if (scrollSpeed > 2.2 && currentY > 500 && currentY < 1200) {
        triggerExitIntent();
      }
    }

    lastScrollY = currentY;
    lastScrollTime = now;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}
