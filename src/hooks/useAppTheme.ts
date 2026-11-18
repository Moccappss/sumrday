import { useEffect } from 'react';
import { applyAccentColor } from '../utils/theme';
export { applyAccentColor };

export interface PageSettings {
  slug?: string;
  styleBlockRadius?: number;
  styleBlockGap?: number;
  styleBlockShadow?: number;
  styleBgColor?: string;
  stylePagePadding?: number | string;
  scrollAnimation?: string;
  scrollAnimationDelay?: number;
  preloaderImage?: string;
  desktopRatio?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  name?: string;
  isPublished?: boolean;
  publishAt?: string;
  isSystem?: boolean;
  isDeleted?: boolean;
}

export interface AppSettings {
  preloaderDuration?: number;
  preloaderImage?: string;
  desktopRatio?: string;
  glassOpacity?: number;
  glassBlur?: number;
  borderRadiusGlobal?: string;
  customCSS?: string;
  accentColor?: string;
  shopSettings?: { enabled: boolean };
  customPages?: PageSettings[];
  fontPairing?: string;
  baseFontSize?: number;
  buttonStyle?: string;
  cardStyle?: string;
  hoverEffect?: string;
  cmsName?: string;
  siteTitle?: string;
  cmsLogo?: string;
}

export const applyPageStyles = (settingsData?: AppSettings) => {
  const allPages = settingsData?.customPages || [];
  let el = document.getElementById('porto-page-styles');
  if (!el) {
    el = document.createElement('style');
    el.id = 'porto-page-styles';
    document.head.appendChild(el);
  }
  const cssRules: string[] = [];
  allPages.forEach(pageData => {
    const selector = `.page-renderer-root[data-page-slug="${pageData.slug}"]`;
    if (pageData.styleBgColor) cssRules.push(`${selector} { background-color: ${pageData.styleBgColor} !important; }`);
    if (pageData.styleBlockRadius !== undefined) cssRules.push(`${selector} { --cms-radius-card: ${pageData.styleBlockRadius}px; }`);
    if (pageData.styleBlockGap !== undefined) cssRules.push(`${selector} { --spacing-lg: ${pageData.styleBlockGap}px; }`);
    if (pageData.styleBlockShadow !== undefined) cssRules.push(`${selector} { --cms-shadow-md: 0 ${pageData.styleBlockShadow}px ${pageData.styleBlockShadow * 2.5}px rgba(0,0,0,0.1); }`);
    if (pageData.stylePagePadding !== undefined) cssRules.push(`${selector} { padding: ${pageData.stylePagePadding}px !important; }`);
  });
};

export const applyGlobalThemeSettings = (s: AppSettings, currentPage: PageSettings | undefined) => {
  const finalRatio = currentPage?.desktopRatio || s.desktopRatio || '9/16';
  if (finalRatio === 'Full') {
    document.documentElement.style.setProperty('--preview-ratio', 'auto');
    document.documentElement.style.setProperty('--preview-width', '100%');
    document.documentElement.style.setProperty('--preview-max-width', '1400px');
  } else {
    document.documentElement.style.setProperty('--preview-ratio', finalRatio);
    document.documentElement.style.setProperty('--preview-width', 'auto');
    document.documentElement.style.setProperty('--preview-max-width', '96vw');
  }

  document.documentElement.style.setProperty('--glass-opacity', String(s.glassOpacity || 0.3));
  document.documentElement.style.setProperty('--glass-blur', `${s.glassBlur ?? 12}px`);
  document.documentElement.style.setProperty('--font-base-size', `${s.baseFontSize || 16}px`);
  
  const nextPairing = s.fontPairing || 'jakarta';
  if (document.documentElement.getAttribute('data-font-pairing') !== nextPairing) {
    document.documentElement.setAttribute('data-font-pairing', nextPairing);
  }
  document.documentElement.setAttribute('data-btn-style', s.buttonStyle || 'filled');
  document.documentElement.setAttribute('data-card-style', s.cardStyle || 'glass');
  document.documentElement.setAttribute('data-hover-effect', s.hoverEffect || 'lift');
  
  if (s.borderRadiusGlobal) {
    document.documentElement.style.setProperty('--cms-radius-card', s.borderRadiusGlobal);
  }

  if (s.customCSS) {
    let styleTag = document.getElementById('porto-custom-css');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'porto-custom-css';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = s.customCSS;
  }
  
  const effectiveAccent = (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || s?.accentColor;
  applyAccentColor(effectiveAccent);
  applyPageStyles(s);

  /* ── Dynamic Branding Injection ── */
  const getMainWebCached = () => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_main_website') : null;
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };
  const mainWeb = getMainWebCached();
  const brandName = s.cmsName || mainWeb?.navbar?.logoText || 'sumr.day';
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // 1. Title Sync (Tab Browser Admin vs Tab Browser Public)
  const newTitle = isAdmin
    ? `${brandName} Studio | Admin Control Center`
    : (s.siteTitle || mainWeb?.seo?.metaTitle || `${brandName} | Creative Digital Studio`);
  if (document.title !== newTitle) {
    document.title = newTitle;
  }

  // 2. Favicon & Apple Icon Sync (Synchronized with CMS, Navbar Logo, and PWA)
  const effectiveLogo = s.cmsLogo || mainWeb?.navbar?.logoImage || mainWeb?.seo?.faviconUrl || '/logo.png';
  if (effectiveLogo) {
    let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = effectiveLogo;
    
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = effectiveLogo;

    // 3. Dynamic PWA Manifest Isolation (Client vs Admin)
    try {
      const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      const targetManifest = isAdmin ? '/manifest-admin.json' : '/manifest-client.json';
      
      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      if (manifestLink.getAttribute('href') !== targetManifest) {
        manifestLink.href = targetManifest;
      }

      const appleTitleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']") as HTMLMetaElement;
      if (appleTitleMeta) {
        appleTitleMeta.content = isAdmin ? `${brandName} OS` : brandName;
      }
    } catch (e) {
      console.warn("Failed to synchronize manifest", e);
    }
  }
};

export const useSystemTheme = () => {
  useEffect(() => {
    const syncTheme = () => {
      if (typeof window === 'undefined') return;
      const isAdmin = window.location.pathname.startsWith('/admin');
      
      if (isAdmin) {
        const savedTheme = localStorage.getItem('cms_dark_mode');
        const isDark = savedTheme !== 'false';
        const themeStr = isDark ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-cms-theme', themeStr);
        document.documentElement.setAttribute('data-theme', themeStr);
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
        if (document.body) {
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        }
      } else {
        document.documentElement.removeAttribute('data-cms-theme');
        const savedClientTheme = localStorage.getItem('website_theme_override');
        let isDark = false;
        if (savedClientTheme === 'dark') {
          isDark = true;
        } else if (savedClientTheme === 'light') {
          isDark = false;
        } else {
          // Check cached defaultMode from porto_main_website
          try {
            const cached = localStorage.getItem('porto_main_website');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.theme?.defaultMode) {
                isDark = parsed.theme.defaultMode === 'dark';
              } else {
                isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
              }
            } else {
              isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
            }
          } catch (_) {
            isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
          }
        }
        const themeStr = isDark ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', themeStr);
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
        if (document.body) {
          document.body.style.backgroundColor = isDark ? '#08080f' : '#ffffff';
          document.body.style.color = isDark ? '#f8fafc' : '#0f172a';
        }
      }

      // Synchronize dynamic branding (tab title, favicon, and PWA manifest)
      try {
        const rawSettings = localStorage.getItem('porto_settings');
        const currentSettings = rawSettings ? JSON.parse(rawSettings) : {};
        applyGlobalThemeSettings(currentSettings, undefined);
      } catch {}
    };

    syncTheme();
    window.addEventListener('popstate', syncTheme);
    window.addEventListener('storage', syncTheme);
    window.addEventListener('cms_theme_changed', syncTheme);
    window.addEventListener('website_theme_changed', syncTheme);
    window.addEventListener('porto_logo_updated', syncTheme);

    return () => {
      window.removeEventListener('popstate', syncTheme);
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener('cms_theme_changed', syncTheme);
      window.removeEventListener('website_theme_changed', syncTheme);
      window.removeEventListener('porto_logo_updated', syncTheme);
    };
  }, []);
};
