import { useEffect } from 'react';

/**
 * useLandingBodyFix
 *
 * Injects a <style> tag into <head> that forces html/body/#root to be
 * scrollable on landing/client pages. A dynamically-injected stylesheet
 * is the ONLY reliable way to override `!important` rules already in the
 * page stylesheet, because inline styles set via JS cannot target `html` or
 * use pseudo-selectors, and class-based overrides lose the specificity battle
 * against stacked `!important` rules.
 *
 * Removes the tag on component unmount so admin pages are unaffected.
 */
export function useLandingBodyFix() {
  useEffect(() => {
    const styleId = 'lp-body-scroll-fix';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html, body {
          position: static !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          max-height: none !important;
          display: block !important;
        }
        #root {
          display: block !important;
          overflow: visible !important;
          height: auto !important;
          min-height: 100vh !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);
}
