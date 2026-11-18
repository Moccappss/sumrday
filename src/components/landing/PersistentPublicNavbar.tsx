import React, { useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LPNavbar, { 
  registerPersistentNavbar, 
  DEFAULT_ITEMS 
} from './LPNavbar';
import { useLandingData } from './useLandingData';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';

export const isPublicNavbarRoute = (pathname: string): boolean => {
  if (!pathname) return true;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/lpimage')) return false;
  if (pathname.startsWith('/link') || pathname.startsWith('/links')) return false;
  if (pathname.startsWith('/invitation') || pathname.startsWith('/undangan')) return false;
  if (pathname.startsWith('/client/play') || pathname.startsWith('/play')) return false;
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return false;
  if (pathname.startsWith('/drop') || pathname.startsWith('/lacak')) return false;
  if (pathname.startsWith('/proofing') || pathname.startsWith('/client/proofing')) return false;
  return true;
};

export const PersistentPublicNavbar: React.FC = () => {
  const location = useLocation();
  const shouldRender = isPublicNavbarRoute(location.pathname);
  const { data } = useLandingData();
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);

  useEffect(() => {
    registerPersistentNavbar(true);
  }, []);

  const navItems = useMemo(() => {
    const raw = (data?.navbar?.items && data.navbar.items.length > 0) 
      ? data.navbar.items 
      : DEFAULT_ITEMS;
    const hasCatalog = raw.some((i: any) => i.url === '/katalog' || i.id === 'nav-katalog' || i.id === 'nav-catalog');
    if (!hasCatalog && data?.shopSettings?.enabled) {
      return [...raw, { id: 'nav-katalog', type: 'link', label: 'Katalog', url: '/katalog' }];
    }
    return raw;
  }, [data?.navbar?.items, data?.shopSettings?.enabled]);

  if (!shouldRender) {
    return null;
  }

  return (
    <LPNavbar
      isPersistentRoot={true}
      items={navItems}
      loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
      logoText={data?.navbar?.logoText}
      logoImage={data?.navbar?.logoImage}
      isDark={isDark}
      accentColor={data?.theme?.accentColor || '#6366f1'}
    />
  );
};

export default PersistentPublicNavbar;
