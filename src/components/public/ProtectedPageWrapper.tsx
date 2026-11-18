import React, { useState, useEffect } from 'react';
import AccessLockScreen, { isPageUnlocked, LockConfig } from './AccessLockScreen';
import { storage } from '../../utils/storage';
import LPNavbar from '../landing/LPNavbar';
import LPFooter from '../landing/LPFooter';
import { useLandingData } from '../landing/useLandingData';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';

export interface GlobalAccessLockConfig extends LockConfig {
  mode?: 'all' | 'selective';
  lockedPages?: string[];
  pagePasswords?: Record<string, string>;
  pageTitles?: Record<string, string>;
  pageMessages?: Record<string, string>;
}

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
  pageKey: string;
  pageTitle?: string;
  pageLockConfig?: LockConfig;
}

// Normalize page keys to support route aliases
export const normalizePageKey = (key: string): string[] => {
  const clean = key.replace(/^\/+|\/+$/g, '');
  const aliases: string[] = [key, clean];

  if (!clean || clean === 'main_site' || clean === 'home' && !key.includes('lpimage')) {
    aliases.push('/', 'main_site', 'home');
  }
  if (clean === 'portfolio' || clean === 'karya') {
    aliases.push('portfolio', 'karya', '/portfolio', '/karya');
  }
  if (clean === 'about' || clean === 'tentang') {
    aliases.push('about', 'tentang', '/about', '/tentang');
  }
  if (clean === 'links' || clean === 'link') {
    aliases.push('links', 'link', '/links', '/link');
  }
  if (clean === 'katalog' || clean === 'shop') {
    aliases.push('katalog', 'shop', '/katalog');
  }
  if (clean === 'blog' || clean.startsWith('blog/')) {
    aliases.push('blog', '/blog');
  }
  if (clean === 'updates' || clean === 'update') {
    aliases.push('updates', 'update', '/updates', '/update');
  }
  if (clean.startsWith('lpimage/')) {
    aliases.push(clean, clean.replace('lpimage/', ''));
  }

  return Array.from(new Set(aliases));
};

export const isKeyInLockedList = (pageKey: string, lockedPages: string[] = []): boolean => {
  if (!lockedPages || !Array.isArray(lockedPages) || lockedPages.length === 0) return false;
  const aliases = normalizePageKey(pageKey);
  return lockedPages.some(lp => {
    const lpAliases = normalizePageKey(lp);
    return aliases.some(a => lpAliases.includes(a));
  });
};

export const ProtectedPageWrapper: React.FC<ProtectedPageWrapperProps> = ({
  children,
  pageKey,
  pageTitle = 'Halaman',
  pageLockConfig
}) => {
  const { data } = useLandingData();
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const [unlocked, setUnlocked] = useState<boolean>(() => isPageUnlocked(pageKey));
  const [effectiveConfig, setEffectiveConfig] = useState<LockConfig | null>(pageLockConfig || null);
  const [isChecking, setIsChecking] = useState<boolean>(!pageLockConfig);

  useEffect(() => {
    let isMounted = true;

    // Check if unlocked state changes in session or storage
    if (isPageUnlocked(pageKey)) {
      setUnlocked(true);
    }

    if (pageLockConfig) {
      setEffectiveConfig(pageLockConfig);
      setIsChecking(false);
      return;
    }

    // Load global settings or specific page lock settings from storage
    const checkLock = async () => {
      try {
        const [globalSettings, pages] = await Promise.all([
          storage.getItem('porto_settings', {}),
          storage.getItem('porto_pages', [])
        ]);

        if (!isMounted) return;

        const accessLock: GlobalAccessLockConfig = globalSettings?.accessLock || {};
        let targetLock: LockConfig | null = null;

        // 1. Check if individual custom page is locked in porto_pages
        if (Array.isArray(pages)) {
          const aliases = normalizePageKey(pageKey);
          const currentPage = pages.find((p: any) => aliases.includes(p.slug) || aliases.includes(p.id));
          if (currentPage && currentPage.isLocked) {
            targetLock = {
              isLocked: true,
              password: currentPage.lockPassword || accessLock.password || '123456',
              title: currentPage.lockTitle || accessLock.title,
              message: currentPage.lockMessage || accessLock.message,
              contactChannel: currentPage.lockContactChannel || accessLock.contactChannel || 'whatsapp',
              contactTarget: currentPage.lockContactTarget || accessLock.contactTarget,
              contactText: currentPage.lockContactText || accessLock.contactText
            };
          }
        }

        // 2. Check Global Access Lock configuration
        if (!targetLock && accessLock.isLocked) {
          const mode = accessLock.mode || 'all';
          const isLocked = mode === 'all' || isKeyInLockedList(pageKey, accessLock.lockedPages || []);

          if (isLocked) {
            const pageSpecificPassword = accessLock.pagePasswords?.[pageKey];
            const pageSpecificTitle = accessLock.pageTitles?.[pageKey];
            const pageSpecificMessage = accessLock.pageMessages?.[pageKey];

            targetLock = {
              isLocked: true,
              password: pageSpecificPassword || accessLock.password || '123456',
              title: pageSpecificTitle || accessLock.title,
              message: pageSpecificMessage || accessLock.message,
              contactChannel: accessLock.contactChannel || 'whatsapp',
              contactTarget: accessLock.contactTarget,
              contactText: accessLock.contactText
            };
          }
        }

        setEffectiveConfig(targetLock);
      } catch (err) {
        console.error('[ProtectedPageWrapper] Lock check error:', err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    };

    checkLock();

    const handleSaved = () => checkLock();
    window.addEventListener('porto_saved', handleSaved);
    window.addEventListener('porto_settings_updated', handleSaved);

    return () => {
      isMounted = false;
      window.removeEventListener('porto_saved', handleSaved);
      window.removeEventListener('porto_settings_updated', handleSaved);
    };
  }, [pageKey, pageLockConfig]);

  if (isChecking) {
    return (
      <div key={pageKey} className="cinematic-client-page-transition" style={{ minHeight: '100vh', width: '100%' }}>
        {children}
      </div>
    );
  }

  if (effectiveConfig?.isLocked && !unlocked) {
    const isLpImage = pageKey.startsWith('lpimage/') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/lpimage'));

    if (isLpImage) {
      return (
        <AccessLockScreen
          config={effectiveConfig}
          pageKey={pageKey}
          pageTitle={pageTitle}
          onUnlocked={() => setUnlocked(true)}
        />
      );
    }

    return (
      <div
        className="public-locked-page-layout cinematic-client-page-transition"
        style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? '#08080f' : '#f8fafc',
          color: isDark ? '#f1f5f9' : '#0f172a',
          position: 'relative',
          transition: 'background-color 0.3s ease, color 0.3s ease',
          overflowX: 'hidden',
        }}
      >
        <div style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%' }}>
          <LPNavbar
            items={data?.navbar?.items || []}
            loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
            isDark={isDark}
            accentColor={data?.theme?.accentColor || '#6366f1'}
            logoText={data?.navbar?.logoText || data?.hero?.title || 'Studio'}
          />
        </div>
        <main style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%', 
          position: 'relative',
          minHeight: 'calc(100dvh - 72px)',
          boxSizing: 'border-box',
        }}>
          <AccessLockScreen
            config={effectiveConfig}
            pageKey={pageKey}
            pageTitle={pageTitle}
            onUnlocked={() => setUnlocked(true)}
          />
        </main>
      </div>
    );
  }

  return (
    <div key={pageKey} className="cinematic-client-page-transition" style={{ minHeight: '100vh', width: '100%' }}>
      {children}
    </div>
  );
};

export default ProtectedPageWrapper;




