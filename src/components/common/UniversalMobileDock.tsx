import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, FolderGit2, ShoppingBag, ShoppingCart,
  User, MessageCircle, Tag, Sparkles, BookOpen, Info,
  Gamepad2, Link as LinkIcon, Globe, Star, Compass, Layers
} from 'lucide-react';
import { useClientAuth } from '../../context/ClientAuthContext';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import {
  type MobileDockConfig,
  type MobileDockCustomItem,
  type MobileDockIconKey,
  DEFAULT_DOCK_CONFIG,
  resolveMobileDockItems,
} from '../../utils/mobileDockConfig';

export type { MobileDockConfig, MobileDockCustomItem, MobileDockIconKey };

const renderDockIcon = (icon: MobileDockIconKey, size: number, strokeWidth: number) => {
  switch (icon) {
    case 'home': return <Home size={size} strokeWidth={strokeWidth} />;
    case 'folder': return <FolderGit2 size={size} strokeWidth={strokeWidth} />;
    case 'bag': return <ShoppingBag size={size} strokeWidth={strokeWidth} />;
    case 'tag': return <Tag size={size} strokeWidth={strokeWidth} />;
    case 'sparkles': return <Sparkles size={size} strokeWidth={strokeWidth} />;
    case 'book': return <BookOpen size={size} strokeWidth={strokeWidth} />;
    case 'info': return <Info size={size} strokeWidth={strokeWidth} />;
    case 'gamepad': return <Gamepad2 size={size} strokeWidth={strokeWidth} />;
    case 'chat': return <MessageCircle size={size} strokeWidth={strokeWidth} />;
    case 'cart': return <ShoppingCart size={size} strokeWidth={strokeWidth} />;
    case 'user': return <User size={size} strokeWidth={strokeWidth} />;
    case 'globe': return <Globe size={size} strokeWidth={strokeWidth} />;
    case 'star': return <Star size={size} strokeWidth={strokeWidth} />;
    case 'compass': return <Compass size={size} strokeWidth={strokeWidth} />;
    case 'layers': return <Layers size={size} strokeWidth={strokeWidth} />;
    case 'link':
    default:
      return <LinkIcon size={size} strokeWidth={strokeWidth} />;
  }
};

export const UniversalMobileDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { client, isAuthenticated } = useClientAuth();
  const { isDark } = useWebsiteTheme();

  const [cartCount, setCartCount] = useState<number>(0);
  const [accentColor, setAccentColor] = useState<string>(() => {
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('porto_accent_color') : null) || '#D95629';
  });
  const [dockConfig, setDockConfig] = useState<MobileDockConfig>(DEFAULT_DOCK_CONFIG);

  const pathname = location.pathname;

  // Determine if dock should be disabled based on route
  const isExcludedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/invitation') ||
    pathname.startsWith('/undangan') ||
    pathname.startsWith('/proofing') ||
    pathname.startsWith('/client/proofing') ||
    pathname.startsWith('/play') ||
    pathname.startsWith('/client/play') ||
    pathname.startsWith('/flipbook') ||
    pathname.startsWith('/buku') ||
    pathname.startsWith('/f/') ||
    pathname.startsWith('/drop') ||
    pathname.startsWith('/lacak') ||
    pathname.startsWith('/links') ||
    pathname.startsWith('/link');

  // Check if a modal or popup is currently blocking the screen
  const [hasBlockingModal, setHasBlockingModal] = useState<boolean>(false);

  useEffect(() => {
    const checkModalState = () => {
      if (typeof document === 'undefined') return;
      const body = document.body;
      const isBlocking =
        body.classList.contains('modal-open') ||
        body.classList.contains('has-open-modal') ||
        body.classList.contains('has-sticky-checkout') ||
        Boolean(document.querySelector('[role="dialog"]')) ||
        Boolean(document.querySelector('.lp-project-modal-backdrop'));
      setHasBlockingModal(isBlocking);
    };

    let rafId = 0;
    const scheduleCheck = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        checkModalState();
      });
    };

    checkModalState();

    const observer = new MutationObserver(scheduleCheck);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Load and listen to Mobile Dock settings
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const s = await storage.getItem<any>('porto_settings', {});
        if (s?.mobileDock) {
          setDockConfig(prev => ({
            ...prev,
            ...s.mobileDock,
            items: { ...prev.items, ...(s.mobileDock.items || {}) }
          }));
        }
      } catch {}
    };
    loadConfig();

    const handleDockUpdated = (e: any) => {
      if (e?.detail?.mobileDock) {
        setDockConfig(prev => ({
          ...prev,
          ...e.detail.mobileDock,
          items: { ...prev.items, ...(e.detail.mobileDock.items || {}) }
        }));
      } else {
        loadConfig();
      }
    };

    window.addEventListener('porto_mobile_dock_updated', handleDockUpdated);
    window.addEventListener('porto_settings_updated', loadConfig);
    return () => {
      window.removeEventListener('porto_mobile_dock_updated', handleDockUpdated);
      window.removeEventListener('porto_settings_updated', loadConfig);
    };
  }, []);

  // Sync Accent Color
  useEffect(() => {
    const handleAccentChange = (e: any) => {
      if (e?.detail?.color) setAccentColor(e.detail.color);
    };
    window.addEventListener('porto_accent_color_changed', handleAccentChange);
    return () => window.removeEventListener('porto_accent_color_changed', handleAccentChange);
  }, []);

  // Sync Cart Badge Count
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const cart = await storage.getItem<any[]>('porto_cart', []);
        const count = Array.isArray(cart) ? cart.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0;
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();
    window.addEventListener('porto_cart_updated', updateCartCount);
    window.addEventListener('storage', updateCartCount);
    return () => {
      window.removeEventListener('porto_cart_updated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  if (isExcludedRoute || hasBlockingModal || dockConfig.enabled === false) {
    return null;
  }

  const resolvedItems = resolveMobileDockItems(dockConfig).filter(item => item.enabled !== false);
  if (resolvedItems.length === 0) {
    return null;
  }

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const dockBg = isDark ? 'rgba(15, 17, 23, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  const dockBorder = isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(0, 0, 0, 0.10)';
  const isIconOnly = dockConfig.displayMode !== 'icon-text';

  const isRouteActive = (url: string) => {
    if (!url || url.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(url)) return false;
    if (url === '/') return pathname === '/';
    if (url === '/portofolio') return pathname.startsWith('/portofolio') || pathname.startsWith('/karya');
    if (url === '/keranjang') return pathname === '/keranjang' || pathname === '/cart';
    if (url === '/akun') return pathname.startsWith('/akun') || pathname.startsWith('/client');
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const handleItemClick = (url: string) => {
    try { haptic.light(); } catch {}
    const target = (url || '/').trim();
    if (target === '#chat') {
      window.dispatchEvent(new Event('porto_open_chat'));
      return;
    }
    if (target === '#calculator') {
      window.dispatchEvent(new Event('porto_open_calculator'));
      return;
    }
    if (/^(https?:|mailto:|tel:)/i.test(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    if (target.startsWith('#')) {
      const id = target.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
      }
      return;
    }
    navigate(target);
  };

  return (
    <div
      className="universal-mobile-dock"
      style={{
        opacity: 1,
        transform: 'translateX(-50%) translateY(0)',
        pointerEvents: 'auto',
        background: dockBg,
        border: dockBorder,
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: isDark
          ? '0 16px 45px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)'
          : '0 14px 36px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.85)',
        gap: isIconOnly ? 6 : 4,
        padding: isIconOnly ? '6px 8px' : '6px 10px',
        scrollPaddingInline: 10,
        borderRadius: 9999,
        height: 52,
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'safe center',
        overflowX: 'auto',
        overflowY: 'hidden',
        overscrollBehaviorX: 'contain',
        scrollSnapType: 'x proximity',
        touchAction: 'pan-x',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {resolvedItems.map((item) => {
        const isActive = isRouteActive(item.url);
        const isHighlight = Boolean(item.isHighlight);
        const isCartItem = item.url === '/keranjang' || item.url === '/cart' || item.icon === 'cart';
        const isAccountItem = item.url === '/akun' || item.url === '/client' || item.icon === 'user';

        const bg = isHighlight
          ? '#10b981'
          : isActive
            ? accentColor
            : 'transparent';
        const fg = isHighlight || isActive ? '#ffffff' : textColor;
        const shadow = isHighlight
          ? '0 4px 14px rgba(16, 185, 129, 0.4)'
          : isActive
            ? `0 4px 14px ${accentColor}45`
            : 'none';

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item.url)}
            aria-label={item.label}
            title={item.label}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isIconOnly ? 0 : 5,
              width: isIconOnly ? 40 : 'auto',
              height: isIconOnly ? 40 : 'auto',
              padding: isIconOnly ? 0 : '7px 13px',
              borderRadius: 9999,
              overflow: isAccountItem && isAuthenticated && client?.avatar && isIconOnly ? 'hidden' : 'visible',
              background: bg,
              color: fg,
              border: 'none',
              fontSize: 12,
              fontWeight: isActive || isHighlight ? 800 : 650,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: shadow,
              flexShrink: 0,
              scrollSnapAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {isAccountItem && isAuthenticated && client?.avatar ? (
              <img
                src={client.avatar}
                alt={client.name || item.label}
                style={{
                  width: isIconOnly ? '100%' : 18,
                  height: isIconOnly ? '100%' : 18,
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              renderDockIcon(item.icon, isIconOnly ? 17 : 14, isActive || isHighlight ? 2.4 : 2)
            )}
            {!isIconOnly && <span className="dock-label">{item.label}</span>}
            {isCartItem && cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 9999,
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: 9,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default UniversalMobileDock;
