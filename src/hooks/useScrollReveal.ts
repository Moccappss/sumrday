import { useEffect } from 'react';

/**
 * High-performance, GPU-accelerated Scroll Reveal & Cascading Spill Engine.
 * Creates an elegant, organic "spill satu-satu" cascade effect when scrolling / swiping
 * across Desktop, Tablet, and Mobile.
 * Automatically discovers all elements matching `[data-reveal]` or `.fade-in-scroll`.
 */
export function useScrollReveal(containerRef?: React.RefObject<HTMLElement | null>, deps: any[] = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Helper to reveal an element smoothly with spill delay
    const revealElement = (el: Element, delayMs?: number) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.getAttribute('data-reveal') === 'revealed' && htmlEl.classList.contains('is-revealed')) {
        return;
      }

      if (delayMs !== undefined && delayMs !== null) {
        if (delayMs === 0) {
          htmlEl.style.transitionDelay = '0ms';
        } else if (!htmlEl.style.transitionDelay) {
          htmlEl.style.transitionDelay = `${delayMs}ms`;
        }
      }
      htmlEl.classList.add('is-revealed');
      htmlEl.setAttribute('data-reveal', 'revealed');

      // Clear inline transitionDelay once reveal is complete so card hover interactions stay snappy
      setTimeout(() => {
        if (htmlEl && htmlEl.style) {
          if (htmlEl.style.transitionDelay === `${delayMs}ms`) {
            htmlEl.style.transitionDelay = '';
          }
          // Remove will-change after transition completes to free GPU composite memory
          htmlEl.style.willChange = 'auto';
        }
      }, (delayMs || 0) + 750);
    };

    // Respect user's motion preferences or fallback for unsupported browsers
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const all = document.querySelectorAll('[data-reveal], .fade-in-scroll');
      all.forEach((el) => revealElement(el, 0));
      return;
    }

    const containerEl = containerRef?.current;
    let observerRoot: HTMLElement | null = null;
    if (containerEl && typeof window !== 'undefined') {
      const style = window.getComputedStyle(containerEl);
      if (
        ['auto', 'scroll'].includes(style.overflowY) &&
        containerEl.scrollHeight > containerEl.clientHeight &&
        containerEl.clientHeight > 0 &&
        style.height !== 'auto'
      ) {
        observerRoot = containerEl;
      }
    }

    // High precision observer for smooth cascading waterfall spill
    const observer = new IntersectionObserver(
      (entries, obs) => {
        // 1. Immediately reveal elements that are already scrolled past (above viewport)
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
            const target = entry.target as HTMLElement;
            if (target.getAttribute('data-reveal') !== 'revealed') {
              revealElement(target, 0);
              obs.unobserve(target);
            }
          }
        });

        // 2. Cascade intersecting elements entering the screen one-by-one (spill satu-satu)
        const intersecting = entries.filter((e) => e.isIntersecting && e.boundingClientRect.bottom >= 0);
        intersecting.forEach((entry, idx) => {
          const target = entry.target as HTMLElement;
          if (target.getAttribute('data-reveal') === 'revealed') {
            obs.unobserve(target);
            return;
          }

          // Respect manual delay if specified via class (e.g. reveal-delay-2) or inline style
          const hasManualDelay = Array.from(target.classList).some((c) => c.startsWith('reveal-delay-')) || Boolean(target.style.transitionDelay);
          const delay = hasManualDelay ? undefined : (idx % 6) * 110;

          revealElement(target, delay);
          obs.unobserve(target);
        });
      },
      {
        root: observerRoot,
        // Trigger right as element enters 20px into view so the user distinctly sees the spill glide
        rootMargin: observerRoot ? '0px 0px -20px 0px' : '0px 0px -20px 0px',
        threshold: 0.03,
      }
    );

    const rootElement = containerEl || document;

    const observeUnrevealed = () => {
      const elements = rootElement.querySelectorAll(
        '[data-reveal]:not([data-reveal="revealed"]):not(.is-revealed), .fade-in-scroll:not(.is-revealed)'
      );
      elements.forEach((el) => {
        observer.observe(el);
      });
    };

    // Active gesture & scroll runner: ensures spill triggers instantly as user swipes/scrolls ("saat di geser")
    let isChecking = false;
    const checkScrollPosition = () => {
      if (isChecking) return;
      isChecking = true;
      requestAnimationFrame(() => {
        isChecking = false;
        const vHeight = window.innerHeight || document.documentElement.clientHeight;
        const unrevealed = rootElement.querySelectorAll(
          '[data-reveal]:not([data-reveal="revealed"]):not(.is-revealed), .fade-in-scroll:not(.is-revealed)'
        );
        if (unrevealed.length === 0) return;

        let batchIdx = 0;
        unrevealed.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // Element entering screen from bottom
          if (rect.top <= vHeight - 20 && rect.bottom >= 0) {
            const hasManualDelay = Array.from(el.classList).some((c) => c.startsWith('reveal-delay-')) || Boolean((el as HTMLElement).style.transitionDelay);
            const delay = hasManualDelay ? undefined : (batchIdx % 6) * 110;
            batchIdx++;
            revealElement(el, delay);
            observer.unobserve(el);
          } else if (rect.bottom < 0) {
            // Already scrolled past above viewport
            revealElement(el, 0);
            observer.unobserve(el);
          }
        });
      });
    };

    // Initial observe & position check
    observeUnrevealed();
    // Run an initial check after a tiny tick to animate elements initially on screen
    const initialCheckTimer = setTimeout(checkScrollPosition, 60);

    // Listen to scroll, wheel, and touchmove (swiping/geser on mobile)
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('touchmove', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });
    if (containerEl) {
      containerEl.addEventListener('scroll', checkScrollPosition, { passive: true });
    }

    // Observe dynamically added elements with debounce to prevent layout thrashing
    let mutationDebounceTimer: any = null;
    const mutationObserver = new MutationObserver(() => {
      if (mutationDebounceTimer) return;
      mutationDebounceTimer = setTimeout(() => {
        mutationDebounceTimer = null;
        observeUnrevealed();
        checkScrollPosition();
      }, 100);
    });

    mutationObserver.observe(rootElement, { childList: true, subtree: true });

    // Safety fallback: ONLY reveal elements that are already within or above the viewport if observer stalled
    const safetyTimer = setTimeout(() => {
      const vHeight = window.innerHeight || document.documentElement.clientHeight;
      const remaining = rootElement.querySelectorAll(
        '[data-reveal]:not([data-reveal="revealed"]):not(.is-revealed), .fade-in-scroll:not(.is-revealed)'
      );
      remaining.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= vHeight + 150) {
          revealElement(el, 0);
        }
      });
    }, 1500);

    return () => {
      clearTimeout(initialCheckTimer);
      clearTimeout(safetyTimer);
      window.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('touchmove', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
      if (containerEl) {
        containerEl.removeEventListener('scroll', checkScrollPosition);
      }
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, deps);
}

export default useScrollReveal;
