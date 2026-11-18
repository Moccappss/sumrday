import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

// Shared in-memory theme cache across all hook instances
let globalWebsiteThemeCache: boolean | null = null;
const themeSubscribers = new Set<(isDark: boolean) => void>();

function notifySubscribers(isDark: boolean) {
  themeSubscribers.forEach((cb) => {
    try { cb(isDark); } catch (_) {}
  });
}

/**
 * Helper to determine the current active theme for the public website.
 * Priority:
 * 1. CMS defaultMode configuration ('dark' | 'light') - Online Single Source of Truth
 * 2. In-memory global cache
 * 3. <html data-theme="dark"|"light"> attribute
 * 4. localStorage 'website_theme_override' ('dark' | 'light')
 * 5. System prefers-color-scheme
 * 6. Fallback to false (light)
 */
export function getInitialWebsiteTheme(defaultMode?: 'light' | 'dark'): boolean {
  if (typeof window === 'undefined') return defaultMode === 'dark';
  if (window.location.pathname.startsWith('/admin')) return false;

  try {
    // 1. User manual override (Highest Priority)
    const saved = localStorage.getItem('website_theme_override');
    if (saved === 'dark') {
      globalWebsiteThemeCache = true;
      return true;
    }
    if (saved === 'light') {
      globalWebsiteThemeCache = false;
      return false;
    }

    // 2. In-memory global cache
    if (globalWebsiteThemeCache !== null) {
      return globalWebsiteThemeCache;
    }

    // 3. Current DOM attribute
    const currentAttr = document.documentElement.getAttribute('data-theme');
    if (currentAttr === 'dark') {
      globalWebsiteThemeCache = true;
      return true;
    }
    if (currentAttr === 'light') {
      globalWebsiteThemeCache = false;
      return false;
    }

    // 4. CMS Default Mode
    if (defaultMode) {
      const isDark = defaultMode === 'dark';
      globalWebsiteThemeCache = isDark;
      return isDark;
    }

    // 5. System preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      globalWebsiteThemeCache = true;
      return true;
    }
  } catch (_) {}

  return defaultMode === 'dark';
}

let themeTransitionTimer: any = null;

export function triggerSmoothThemeTransition() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  if (themeTransitionTimer) clearTimeout(themeTransitionTimer);
  themeTransitionTimer = setTimeout(() => {
    root.classList.remove('theme-transitioning');
  }, 170);
}

/**
 * Globally set and broadcast website theme to DOM, localStorage, and all React components + Cloud Sync
 */
export function setGlobalWebsiteTheme(isDark: boolean, syncCloud = false) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;

  triggerSmoothThemeTransition();

  const themeStr = isDark ? 'dark' : 'light';
  globalWebsiteThemeCache = isDark;

  try {
    localStorage.setItem('website_theme_override', themeStr);
    document.documentElement.setAttribute('data-theme', themeStr);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Also sync document.body styling
    if (document.body) {
      document.body.style.backgroundColor = isDark ? '#06070a' : '#eef2f6';
      document.body.style.color = isDark ? '#ffffff' : '#0f172a';
    }

    notifySubscribers(isDark);
    window.dispatchEvent(new CustomEvent('website_theme_changed', { detail: { isDark } }));

    if (syncCloud) {
      storage.getItem('porto_main_website', null).then((existing: any) => {
        const updated = {
          ...(existing || {}),
          theme: {
            ...((existing && existing.theme) || {}),
            defaultMode: themeStr
          }
        };
        storage.setItem('porto_main_website', updated, true).catch(() => {});
      }).catch(() => {});
    }
  } catch (_) {}
}

/**
 * Unified React hook for public website theme state & switching.
 * Eliminates theme flickering, page transition desync, and state fighting across components.
 */
export function useWebsiteTheme(defaultMode?: 'light' | 'dark') {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const [isDark, setIsDarkState] = useState<boolean>(() => (isAdmin ? false : getInitialWebsiteTheme(defaultMode)));

  // Sync when defaultMode from CMS loads asynchronously ONLY IF user has not explicitly set a preference
  useEffect(() => {
    if (isAdmin || !defaultMode) return;
    try {
      const saved = localStorage.getItem('website_theme_override');
      if (saved) return; // User preference takes absolute priority

      const next = defaultMode === 'dark';
      if (globalWebsiteThemeCache !== next) {
        globalWebsiteThemeCache = next;
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        if (document.body) {
          document.body.style.backgroundColor = next ? '#06070a' : '#eef2f6';
          document.body.style.color = next ? '#ffffff' : '#0f172a';
        }
        setIsDarkState(next);
        notifySubscribers(next);
      }
    } catch (_) {}
  }, [defaultMode, isAdmin]);

  // Keep DOM and state synchronized, subscribe to global listener
  useEffect(() => {
    if (isAdmin) return;

    // Direct subscription for instant React state update
    const subscriber = (newIsDark: boolean) => {
      setIsDarkState(newIsDark);
    };
    themeSubscribers.add(subscriber);

    // Strictly enforce saved client override onto DOM on mount
    try {
      const saved = localStorage.getItem('website_theme_override');
      if (saved === 'dark' || saved === 'light') {
        const savedDark = saved === 'dark';
        if (document.documentElement.getAttribute('data-theme') !== saved) {
          document.documentElement.setAttribute('data-theme', saved);
          if (savedDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
          }
          if (document.body) {
            document.body.style.backgroundColor = savedDark ? '#06070a' : '#eef2f6';
            document.body.style.color = savedDark ? '#ffffff' : '#0f172a';
          }
        }
        if (isDark !== savedDark) {
          setIsDarkState(savedDark);
          globalWebsiteThemeCache = savedDark;
        }
      }
    } catch (_) {}

    const handleThemeChange = (e: Event) => {
      if (window.location.pathname.startsWith('/admin')) return;
      triggerSmoothThemeTransition();
      const ce = e as CustomEvent<{ isDark: boolean }>;
      if (ce?.detail && typeof ce.detail.isDark === 'boolean') {
        globalWebsiteThemeCache = ce.detail.isDark;
        setIsDarkState(ce.detail.isDark);
      } else {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        globalWebsiteThemeCache = dark;
        setIsDarkState(dark);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (window.location.pathname.startsWith('/admin')) return;
      if (e.key === 'website_theme_override' && e.newValue) {
        triggerSmoothThemeTransition();
        const nextDark = e.newValue === 'dark';
        globalWebsiteThemeCache = nextDark;
        document.documentElement.setAttribute('data-theme', nextDark ? 'dark' : 'light');
        setIsDarkState(nextDark);
        notifySubscribers(nextDark);
      }
    };

    window.addEventListener('website_theme_changed', handleThemeChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      themeSubscribers.delete(subscriber);
      window.removeEventListener('website_theme_changed', handleThemeChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isAdmin, isDark]);

  const toggleTheme = useCallback(() => {
    if (isAdmin) return;
    const next = !isDark;
    setIsDarkState(next);
    setGlobalWebsiteTheme(next);
  }, [isAdmin, isDark]);

  const setIsDark = useCallback((val: boolean) => {
    if (isAdmin) return;
    setIsDarkState(val);
    setGlobalWebsiteTheme(val);
  }, [isAdmin]);

  return {
    isDark,
    setIsDark,
    toggleTheme,
  };
}

