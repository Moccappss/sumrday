/**
 * ══════════════════════════════════════════════════════════════════════
 * INTELLIGENT UI/UX & KINETIC PRODUCTIVITY ENGINE
 * Smart keyboard shortcuts (Ctrl+S, Esc), micro-haptic kinetic feedback,
 * and Indonesian number-to-words currency spell-out for error-free pricing.
 * ══════════════════════════════════════════════════════════════════════
 */

import {
  CARD_3D_ANIMATION_CONFIG,
  computeCard3dTilt,
  getCard3dGlareBackground,
  getCard3dHoverShadow,
  getCard3dTransform,
  getCard3dTransition,
} from './card3dAnimationConfig';

/**
 * Triggers gentle micro-haptic vibration on supported mobile devices
 */
export function triggerMicroHaptic(type: 'tap' | 'success' | 'warning' | 'error' = 'tap'): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'tap':
        navigator.vibrate(8); // Ultra subtle 8ms tick
        break;
      case 'success':
        navigator.vibrate([10, 30, 15]); // Double crisp pulse
        break;
      case 'warning':
        navigator.vibrate([25, 40, 25]);
        break;
      case 'error':
        navigator.vibrate([40, 60, 40, 60, 40]);
        break;
    }
  } catch {}
}

/**
 * Converts numbers into Indonesian spelled-out words (Terbilang)
 * e.g. 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function numberToIndonesianWords(rawNum: number | string): string {
  const num = typeof rawNum === 'number' ? rawNum : parseInt(String(rawNum).replace(/\D/g, ''), 10);
  if (isNaN(num) || num <= 0) return 'Nol Rupiah';

  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function spell(n: number): string {
    if (n < 12) return units[n];
    if (n < 20) return spell(n - 10) + ' Belas';
    if (n < 100) return spell(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + spell(n % 10) : '');
    if (n < 200) return 'Seratus' + (n - 100 !== 0 ? ' ' + spell(n - 100) : '');
    if (n < 1000) return spell(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + spell(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n - 1000 !== 0 ? ' ' + spell(n - 1000) : '');
    if (n < 1000000) return spell(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + spell(n % 1000) : '');
    if (n < 1000000000) return spell(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + spell(n % 1000000) : '');
    if (n < 1000000000000) return spell(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + spell(n % 1000000000) : '');
    return spell(Math.floor(n / 1000000000000)) + ' Triliun';
  }

  const result = spell(num).trim();
  return result ? `${result} Rupiah` : 'Nol Rupiah';
}

let _isShortcutsInitialized = false;

const CARD_3D_SELECTOR = [
  '.lp-portfolio-card',
  '.lp-blog-card',
  '.lp-blog-featured-card',
  '.lp-store-card',
  '.lp-ratecard-card',
  '.lp-testimonial-card',
  '.lp-bento-card-tall',
  '.lp-company-stat-card',
  '.lp-card',
  '.lp-update-card',
  '.lp-update-spotlight-card',
  '.lp-solution-card',
  '.portfolio-card',
  '.katalog-card',
  '.blog-card',
  '.ratecard-card',
  '.product-card',
  '.project-card',
  '.cms-card',
  '.app-card',
  '.cms-notif-full-card',
  '.preview-sheet-card',
  '.bento-card',
  '.bento-info-card',
  '.dash-bento-card',
  '.dash-card',
  '.dash-stat-card',
  '.dash-quick-act-card',
  '.ultra-glass-card',
  '.premium-glass',
  '.cert-card',
  '.related-card',
  '.lp-link-item',
  '.lpcm-card',
  '.client-landing-root article',
  '.blog-main-wrap article',
  '.public-ratecard-root article',
  '.lp-navbar-inner-card.is-scrolled:not(.is-mobile-open)',
  '.page-hero-header',
  '[data-card-3d]',
].join(',');

/**
 * Global smooth 3D card hover engine (matches Admin Proofing Interactive3DCard)
 * - Exact same perspective(1200px) + rotateX/Y tilt + translateZ(6px) translateY(-4px)
 * - Silky 0.09s ease-out follow & 0.45s cubic-bezier(0.16, 1, 0.3, 1) reset
 * - Zero excessive glow or shine
 * - Uses important inline transform while hovered so legacy inline onMouseEnter cannot conflict
 */
function initGlobal3DCardHover(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let activeCard: HTMLElement | null = null;
  let rafId = 0;
  let lastX = 0;
  let lastY = 0;

  const ensureGlareLayer = (card: HTMLElement): HTMLElement => {
    let glare = card.querySelector(':scope > [data-sumr-3d-glare="true"]') as HTMLElement | null;
    if (!glare) {
      try {
        if (window.getComputedStyle(card).position === 'static') {
          card.style.position = 'relative';
        }
      } catch {}
      glare = document.createElement('div');
      glare.setAttribute('data-sumr-3d-glare', 'true');
      glare.style.cssText =
        `position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:3;opacity:0;transition:${CARD_3D_ANIMATION_CONFIG.transitions.glareOpacity};`;
      card.appendChild(glare);
    }
    return glare;
  };

  const restoreInlineStyle = (el: HTMLElement, prop: string, dataKey: keyof DOMStringMap) => {
    const prev = el.dataset[dataKey];
    if (prev !== undefined) {
      if (prev) {
        el.style.setProperty(prop, prev);
      } else {
        el.style.removeProperty(prop);
      }
      delete el.dataset[dataKey];
    } else {
      el.style.removeProperty(prop);
    }
  };

  const resetCard = (card: HTMLElement | null) => {
    if (!card) return;
    if (rafId && activeCard === card) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    card.style.setProperty('transition-delay', '0ms', 'important');
    card.style.setProperty('transition', getCard3dTransition(false, true), 'important');
    card.style.setProperty('transform', getCard3dTransform(0, 0, false), 'important');
    const glare = card.querySelector(':scope > [data-sumr-3d-glare="true"]') as HTMLElement | null;
    if (glare) {
      glare.style.opacity = '0';
    }
    restoreInlineStyle(card, 'box-shadow', 'prevBoxShadow');
    card.removeAttribute('data-3d-active');
    card.removeAttribute('data-3d-tilted');
    window.setTimeout(() => {
      if (card && !card.hasAttribute('data-3d-active')) {
        restoreInlineStyle(card, 'transform', 'prevTransform');
        restoreInlineStyle(card, 'transition', 'prevTransition');
        restoreInlineStyle(card, 'transition-delay', 'prevTransitionDelay');
        restoreInlineStyle(card, 'will-change', 'prevWillChange');
      }
    }, CARD_3D_ANIMATION_CONFIG.resetCleanupDelayMs);
  };

  const applyTilt = (isTouchTilt = false) => {
    rafId = 0;
    if (!activeCard) return;
    const rect = activeCard.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const { rotX, rotY, glareX, glareY } = computeCard3dTilt(
      lastX,
      lastY,
      rect,
      true,
      isTouchTilt ? 12 : undefined
    );

    if (activeCard.dataset.prevBoxShadow === undefined) {
      activeCard.dataset.prevBoxShadow = activeCard.style.getPropertyValue('box-shadow') || '';
    }
    if (activeCard.dataset.prevTransform === undefined) {
      activeCard.dataset.prevTransform = activeCard.style.getPropertyValue('transform') || '';
    }
    if (activeCard.dataset.prevTransition === undefined) {
      activeCard.dataset.prevTransition = activeCard.style.getPropertyValue('transition') || '';
    }
    if (activeCard.dataset.prevTransitionDelay === undefined) {
      activeCard.dataset.prevTransitionDelay = activeCard.style.getPropertyValue('transition-delay') || '';
    }
    if (activeCard.dataset.prevWillChange === undefined) {
      activeCard.dataset.prevWillChange = activeCard.style.getPropertyValue('will-change') || '';
    }

    const root = document.documentElement;
    const isDark =
      root.classList.contains('dark') ||
      root.getAttribute('data-theme') === 'dark' ||
      root.getAttribute('data-cms-theme') === 'dark' ||
      Boolean(activeCard.closest('[data-cms-theme="dark"], .dark'));
    const isLight = !isDark;

    const glare = ensureGlareLayer(activeCard);
    glare.style.background = getCard3dGlareBackground(glareX, glareY, isLight);
    glare.style.opacity = '1';

    const isAlreadyTilted = activeCard.hasAttribute('data-3d-tilted');
    activeCard.setAttribute('data-3d-tilted', 'true');
    activeCard.style.setProperty('will-change', 'transform', 'important');
    activeCard.style.setProperty('transition-delay', '0ms', 'important');
    activeCard.style.setProperty('box-shadow', getCard3dHoverShadow(isLight), 'important');
    activeCard.style.setProperty(
      'transition',
      isAlreadyTilted
        ? `transform 0.1s ease-out, ${CARD_3D_ANIMATION_CONFIG.transitions.enterBoxShadow}, ${CARD_3D_ANIMATION_CONFIG.transitions.enterBorder}`
        : getCard3dTransition(true, true),
      'important'
    );
    activeCard.style.setProperty('transform', getCard3dTransform(rotX, rotY, true), 'important');
  };

  const findGenericCard = (target: HTMLElement | null): HTMLElement | null => {
    if (
      !target ||
      target.closest(
        '[role="dialog"], [role="menu"], [role="listbox"], .lp-navbar, nav, header, footer, form, input, textarea, select, table, .cms-modal-card, .cms-dialog-box, .modal-content'
      )
    ) {
      return null;
    }
    let el: HTMLElement | null = target;
    let depth = 0;
    while (el && depth < 6) {
      if (
        el.tagName === 'BODY' ||
        el.tagName === 'HTML' ||
        el.id === 'root' ||
        el.hasAttribute('data-no-3d') ||
        el.hasAttribute('data-3d-managed')
      ) {
        return null;
      }
      if (el.hasAttribute('data-3d-skip')) {
        el = el.parentElement;
        depth++;
        continue;
      }
      if (el.matches?.(CARD_3D_SELECTOR)) {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        const isGiantWrapper =
          !el.hasAttribute('data-card-3d') &&
          w > window.innerWidth * 0.88 &&
          h > window.innerHeight * 0.78;
        if (!isGiantWrapper) {
          return el;
        }
      }
      if (el.tagName === 'DIV' || el.tagName === 'ARTICLE' || el.tagName === 'A' || el.tagName === 'SECTION') {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w >= 110 && h >= 68 && w <= 1150 && h <= 960) {
          let cs: CSSStyleDeclaration | null = null;
          try {
            cs = window.getComputedStyle(el);
          } catch {
            cs = null;
          }
          if (cs && cs.display === 'inline') {
            el = el.parentElement;
            depth++;
            continue;
          }
          const s = el.style;
          const hasVisibleBg =
            Boolean(s.background || s.backgroundColor) ||
            Boolean(cs && cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
          const hasVisibleBorder =
            Boolean(s.border) ||
            Boolean(cs && parseFloat(cs.borderTopWidth || '0') > 0 && cs.borderTopStyle !== 'none');
          const hasShadow = Boolean(cs && cs.boxShadow && cs.boxShadow !== 'none');
          const hasInteractiveHint =
            s.cursor === 'pointer' ||
            cs?.cursor === 'pointer' ||
            el.tagName === 'ARTICLE' ||
            hasVisibleBg ||
            hasVisibleBorder ||
            hasShadow;
          if (hasInteractiveHint) {
            let br = parseFloat(s.borderRadius || '0');
            if (!br && cs) {
              br = parseFloat(cs.borderRadius || '0');
            }
            if (br >= 8) {
              return el;
            }
          }
        }
      }
      el = el.parentElement;
      depth++;
    }
    return null;
  };

  let isScrolling = false;
  let scrollResetTimer = 0;
  let touchReleaseTimer = 0;
  let touchHoldTimer = 0;
  let hasActiveTouch = false;
  let touchHoldActive = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTouchTime = 0;

  const is3dDisabledContext = (target: HTMLElement | null): boolean => {
    const path = window.location.pathname || '';
    if (
      import.meta.env.VITE_ADMIN_APP === 'true' ||
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      path.startsWith('/admin')
    ) {
      return true;
    }
    if (
      path.startsWith('/form') ||
      path.startsWith('/f/') ||
      path.startsWith('/order') ||
      path.startsWith('/checkout') ||
      path.startsWith('/feedback') ||
      path.startsWith('/drop')
    ) {
      return true;
    }
    if (
      target &&
      target.closest(
        '.cms-dashboard, .cms-layout, [data-admin-root], .login-gateway-container, form, input, textarea, select, label, [contenteditable="true"], .lp-footer-form-card, .lp-estimator-card'
      )
    ) {
      return true;
    }
    return false;
  };

  const resolveCardFromTarget = (target: HTMLElement | null): HTMLElement | null => {
    if (!target || is3dDisabledContext(target)) return null;

    let card = findGenericCard(target);
    if (!card) {
      const matched = target?.closest?.(CARD_3D_SELECTOR) as HTMLElement | null;
      if (matched) {
        const w = matched.offsetWidth;
        const h = matched.offsetHeight;
        const isGiantWrapper =
          !matched.hasAttribute('data-card-3d') &&
          w > window.innerWidth * 0.88 &&
          h > window.innerHeight * 0.78;
        if (!isGiantWrapper) {
          card = matched;
        }
      }
    }
    if (
      !card ||
      card.closest('[data-3d-managed="true"], [data-no-3d="true"], .no-3d-hover, .modal-content, .cms-modal-card, .cms-dialog-box') ||
      card.hasAttribute('data-no-3d') ||
      card.tagName === 'FORM' ||
      Boolean(card.querySelector('form, input, textarea, select'))
    ) {
      return null;
    }
    return card;
  };

  const activateCardAtPoint = (card: HTMLElement | null, clientX: number, clientY: number, isTouchTilt = false) => {
    if (!card) {
      if (activeCard) {
        resetCard(activeCard);
        activeCard = null;
      }
      return;
    }
    if (activeCard && activeCard !== card) {
      resetCard(activeCard);
    }
    const wasActive = activeCard === card && card.hasAttribute('data-3d-active');
    activeCard = card;
    if (!wasActive) {
      activeCard.setAttribute('data-3d-active', 'true');
    }
    lastX = clientX;
    lastY = clientY;
    if (!rafId) {
      rafId = requestAnimationFrame(() => applyTilt(isTouchTilt));
    }
  };

  window.addEventListener('scroll', (e: Event) => {
    if (hasActiveTouch && touchHoldActive) return;
    const target = e.target;
    const affectsActiveCard =
      target === window ||
      target === document ||
      target === document.documentElement ||
      target === document.body ||
      (activeCard && target instanceof Node && target.contains(activeCard));
    if (!affectsActiveCard) return;

    isScrolling = true;
    window.clearTimeout(touchHoldTimer);
    if (activeCard) {
      resetCard(activeCard);
      activeCard = null;
    }
    window.clearTimeout(scrollResetTimer);
    scrollResetTimer = window.setTimeout(() => {
      isScrolling = false;
    }, 120);
  }, { passive: true, capture: true });

  window.addEventListener('blur', () => {
    hasActiveTouch = false;
    touchHoldActive = false;
    window.clearTimeout(touchHoldTimer);
    if (activeCard) {
      resetCard(activeCard);
      activeCard = null;
    }
  });

  let lastPointerTarget: HTMLElement | null = null;
  let lastResolvedCard: HTMLElement | null = null;

  document.addEventListener('pointermove', (e: PointerEvent) => {
    if (e.pointerType === 'touch' || hasActiveTouch || isScrolling || Date.now() - lastTouchTime < 400) return;
    const target = e.target as HTMLElement | null;
    if (target !== lastPointerTarget) {
      lastPointerTarget = target;
      lastResolvedCard = resolveCardFromTarget(target);
    }
    activateCardAtPoint(lastResolvedCard, e.clientX, e.clientY, false);
  }, { passive: true, capture: true });

  document.addEventListener('touchstart', (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    window.clearTimeout(touchReleaseTimer);
    window.clearTimeout(touchHoldTimer);
    touchHoldActive = false;
    lastTouchTime = Date.now();
    isScrolling = false;

    const card = resolveCardFromTarget(e.target as HTMLElement | null);
    if (!card) {
      hasActiveTouch = false;
      return;
    }

    hasActiveTouch = true;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    activateCardAtPoint(card, touch.clientX, touch.clientY, true);
    touchHoldTimer = window.setTimeout(() => {
      if (hasActiveTouch && !isScrolling) {
        touchHoldActive = true;
      }
    }, 140);
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !hasActiveTouch || !activeCard) return;
    lastTouchTime = Date.now();

    if (!touchHoldActive) {
      const dx = Math.abs(touch.clientX - touchStartX);
      const dy = Math.abs(touch.clientY - touchStartY);
      if (dx > 8 && dx > dy * 1.2) {
        touchHoldActive = true;
        window.clearTimeout(touchHoldTimer);
      } else if (dy > 12) {
        // User is immediately scrolling vertically; let browser scroll cleanly
        window.clearTimeout(touchHoldTimer);
        return;
      }
    }

    if (touchHoldActive && e.cancelable) {
      e.preventDefault();
    }

    const elUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const card = resolveCardFromTarget(elUnderFinger || (e.target as HTMLElement | null));
    activateCardAtPoint(card, touch.clientX, touch.clientY, true);
  }, { passive: false, capture: true });

  const handleTouchEnd = () => {
    hasActiveTouch = false;
    touchHoldActive = false;
    window.clearTimeout(touchHoldTimer);
    lastTouchTime = Date.now();
    if (!activeCard) return;
    const cardToReset = activeCard;
    window.clearTimeout(touchReleaseTimer);
    touchReleaseTimer = window.setTimeout(() => {
      if (!hasActiveTouch && activeCard === cardToReset) {
        resetCard(cardToReset);
        activeCard = null;
      }
    }, 160);
  };

  document.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
  document.addEventListener('touchcancel', handleTouchEnd, { passive: true, capture: true });

  document.addEventListener('pointerleave', () => {
    if (activeCard && !hasActiveTouch) {
      resetCard(activeCard);
      activeCard = null;
    }
  }, { passive: true });
}

/**
 * Initializes global smart keyboard shortcuts & smooth 3D card hover engine
 * - Ctrl+S / Cmd+S: Quick Save trigger
 * - Esc: Closes active top-most modal
 */
export function initSmartUiUxEngine(): void {
  if (typeof window === 'undefined' || _isShortcutsInitialized) return;
  _isShortcutsInitialized = true;

  initGlobal3DCardHover();

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // 1. Ctrl + S or Cmd + S (Save Shortcut)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      triggerMicroHaptic('success');
      window.dispatchEvent(new CustomEvent('sumr_shortcut_save', { detail: { timestamp: Date.now() } }));
    }

    // 2. Escape key for hierarchical modal dismiss
    if (e.key === 'Escape') {
      window.dispatchEvent(new CustomEvent('sumr_shortcut_escape', { detail: { timestamp: Date.now() } }));
    }
  });
}
