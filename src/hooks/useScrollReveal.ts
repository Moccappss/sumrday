import { useEffect } from 'react';

/**
 * High-performance, GPU-accelerated Scroll Reveal Hook.
 * Ensures consistent smooth reveal animations across all browsers.
 * Automatically discovers all elements matching `[data-reveal]` or `.fade-in-scroll`.
 */
export function useScrollReveal(containerRef?: React.RefObject<HTMLElement | null>, deps: any[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Helper to reveal an element smoothly
    const revealElement = (el: Element, delayMs?: number) => {
      const htmlEl = el as HTMLElement;
      if (delayMs !== undefined && delayMs !== null) {
        if (delayMs === 0) {
          htmlEl.style.transitionDelay = '0ms';
        } else if (!htmlEl.style.transitionDelay) {
          htmlEl.style.transitionDelay = `${delayMs}ms`;
        }
      }
      htmlEl.classList.add('is-revealed');
      htmlEl.setAttribute('data-reveal', 'revealed');
    };

    // If IntersectionObserver is not supported, reveal all immediately
    if (!('IntersectionObserver' in window)) {
      const all = document.querySelectorAll('[data-reveal], .fade-in-scroll');
      all.forEach((el) => revealElement(el));
      return;
    }

    const containerEl = containerRef?.current;
    let observerRoot: HTMLElement | null = null;
    if (containerEl && typeof window !== 'undefined') {
      const style = window.getComputedStyle(containerEl);
      if (['auto', 'scroll'].includes(style.overflowY)) {
        observerRoot = containerEl;
      }
    }

    // High precision observer for smooth, calm, in-viewport scroll reveal
    const observer = new IntersectionObserver(
      (entries, obs) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        intersecting.forEach((entry, idx) => {
          const target = entry.target as HTMLElement;
          if (target.getAttribute('data-reveal') === 'revealed') {
            obs.unobserve(target);
            return;
          }

          // If element is already above the viewport (scrolled past), reveal immediately with 0 delay
          if (entry.boundingClientRect.bottom < 0) {
            revealElement(target, 0);
            obs.unobserve(target);
            return;
          }

          // Auto stagger batch elements entering simultaneously if not explicitly delayed
          const hasManualDelay = Array.from(target.classList).some((c) => c.startsWith('reveal-delay-')) || Boolean(target.style.transitionDelay);
          const delay = hasManualDelay ? undefined : (idx % 6) * 120;

          revealElement(target, delay);
          obs.unobserve(target);
        });
      },
      {
        root: observerRoot,
        rootMargin: observerRoot ? '0px 0px -8% 0px' : '0px 0px -10% 0px',
        threshold: 0.08,
      }
    );

    const rootElement = containerEl || document;

    const observeUnrevealed = () => {
      const elements = rootElement.querySelectorAll(
        '[data-reveal]:not([data-reveal="revealed"]), .fade-in-scroll:not(.is-revealed)'
      );
      elements.forEach((el) => {
        observer.observe(el);
      });
    };

    // Initial observe
    observeUnrevealed();

    // Observe dynamically added elements (e.g. projects loaded asynchronously)
    const mutationObserver = new MutationObserver(() => {
      observeUnrevealed();
    });

    mutationObserver.observe(rootElement, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, deps);
}

export default useScrollReveal;
