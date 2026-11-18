import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Sun, Moon, User, Menu, X, ChevronDown, ChevronRight,
  Home, FolderGit2, UserCheck, BookOpen, ShoppingBag, Send,
  Shield, LogOut, Package, Sparkles, Receipt, Gamepad2, Link2, ShoppingCart, Globe, Layers,
  Volume2, VolumeX, ArrowUpRight
} from 'lucide-react';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { useClientAuth } from '../../context/ClientAuthContext';
import { haptic } from '../../utils/haptics';
import { soundEffects } from '../../utils/soundEffects';

export interface NavItem {
  id: string;
  type: 'link' | 'dropdown';
  label: string;
  url?: string;
  mobileSlot?: 'auto' | 'grid' | 'list';
  children?: { id: string; label: string; url: string }[];
}

export interface LPNavbarProps {
  items?: NavItem[];
  loginBtnLabel?: string;
  logoText?: string;
  logoImage?: string | null;
  accentColor?: string;
  isDark?: boolean;
  isPersistentRoot?: boolean;
}

// Module-level persistent navbar registration & override coordination
let persistentNavbarMounted = true;

export function registerPersistentNavbar(mounted: boolean) {
  persistentNavbarMounted = mounted;
}

export function isPersistentNavbarMounted(): boolean {
  return persistentNavbarMounted;
}

export type NavbarOverride = {
  items?: NavItem[];
  loginBtnLabel?: string;
  logoText?: string;
  logoImage?: string | null;
  accentColor?: string;
  isDark?: boolean;
};

let activeNavbarOverride: NavbarOverride | null = null;
const overrideSubscribers = new Set<(override: NavbarOverride | null) => void>();

export function setNavbarOverride(override: NavbarOverride | null) {
  activeNavbarOverride = override;
  overrideSubscribers.forEach((fn) => {
    try { fn(override); } catch (_) { }
  });
}

export function subscribeNavbarOverride(fn: (override: NavbarOverride | null) => void) {
  overrideSubscribers.add(fn);
  return () => {
    overrideSubscribers.delete(fn);
  };
}

export const DEFAULT_ITEMS: NavItem[] = [
  { id: 'nav-home', type: 'link', label: 'Beranda', url: '/' },
  { id: 'nav-portfolio', type: 'link', label: 'Portofolio', url: '/portofolio' },
  { id: 'nav-tentang', type: 'link', label: 'Tentang', url: '/about' },
  { id: 'nav-katalog', type: 'link', label: 'Katalog', url: '/katalog' },
  { id: 'nav-harga', type: 'link', label: 'Harga', url: '/pricing' },
  { id: 'nav-game', type: 'link', label: 'Game', url: '/games' },
  { id: 'nav-blog', type: 'link', label: 'Blog', url: '/blog' },
  { id: 'nav-updates', type: 'link', label: 'Update', url: '/updates' },
  { id: 'nav-links', type: 'link', label: 'Links', url: '/links' },
  { id: 'nav-kontak', type: 'link', label: 'Kontak', url: '#contact' },
];

const getNavIcon = (label: string, url: string = '') => {
  const norm = (label + ' ' + url).toLowerCase();
  if (norm.includes('beranda') || norm.includes('home') || norm.includes('sunrise') || url === '/' || url === '#home') return <Home size={16} />;
  if (norm.includes('karya') || norm.includes('portfolio') || norm.includes('portofolio') || norm.includes('proyek')) return <FolderGit2 size={16} />;
  if (norm.includes('tentang') || norm.includes('about') || norm.includes('bio') || norm.includes('cerita')) return <UserCheck size={16} />;
  if (norm.includes('katalog') || norm.includes('shop') || norm.includes('toko') || norm.includes('layanan') || norm.includes('jajan')) return <ShoppingBag size={16} />;
  if (norm.includes('harga') || norm.includes('pricing') || norm.includes('paket') || norm.includes('biaya')) return <Receipt size={16} />;
  if (norm.includes('game') || norm.includes('games') || norm.includes('play') || norm.includes('main')) return <Gamepad2 size={16} />;
  if (norm.includes('blog') || norm.includes('artikel') || norm.includes('jurnal')) return <BookOpen size={16} />;
  if (norm.includes('update') || norm.includes('updates') || norm.includes('aktivitas') || norm.includes('kabar')) return <Layers size={16} />;
  if (norm.includes('link') || norm.includes('links') || norm.includes('tautan')) return <Link2 size={16} />;
  if (norm.includes('kontak') || norm.includes('contact') || norm.includes('halo') || norm.includes('sapa')) return <Send size={16} />;
  return <Globe size={16} />;
};

// ── Child Instance Handler (Sends overrides up to PersistentPublicNavbar, 0 DOM elements) ──
const LPNavbarChildOverride: React.FC<LPNavbarProps> = () => {
  // Child pages inside page routes do not render a second navbar.
  // The persistent root navbar at App level remains fixed and smooth.
  return null;
};

// ── Full Interactive Navbar Renderer ──
const LPNavbarRenderer: React.FC<LPNavbarProps> = ({
  items = DEFAULT_ITEMS,
  loginBtnLabel = 'Masuk',
  logoText: propLogoText,
  logoImage: propLogoImage,
  accentColor = '#64748b',
  isDark: propIsDark,
  isPersistentRoot = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const resolveLogo = () => {
    if (propLogoImage !== undefined && propLogoImage !== null) {
      return propLogoImage;
    }
    try {
      const rawMain = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_main_website') : null;
      if (rawMain) {
        const parsed = JSON.parse(rawMain);
        if (parsed?.navbar?.logoImage !== undefined && parsed.navbar.logoImage !== null) {
          return parsed.navbar.logoImage;
        }
      }
      const rawSettings = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_settings') : null;
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        if (parsed?.cmsLogo !== undefined && parsed.cmsLogo !== null) {
          return parsed.cmsLogo;
        }
      }
    } catch { }
    return '/logo.png';
  };

  const resolveLogoText = (propVal?: string): string => {
    let resolved = '';
    if (propVal && propVal.trim()) {
      resolved = propVal.trim();
    } else {
      try {
        const rawMain = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_main_website') : null;
        if (rawMain) {
          const parsed = JSON.parse(rawMain);
          if (parsed?.navbar?.logoText && parsed.navbar.logoText.trim()) {
            resolved = parsed.navbar.logoText.trim();
          }
        }
        if (!resolved) {
          const rawSettings = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_settings') : null;
          if (rawSettings) {
            const parsed = JSON.parse(rawSettings);
            if (parsed?.siteTitle && parsed.siteTitle.trim()) resolved = parsed.siteTitle.trim();
            else if (parsed?.brandName && parsed.brandName.trim()) resolved = parsed.brandName.trim();
            else if (parsed?.cmsName && parsed.cmsName.trim()) resolved = parsed.cmsName.trim();
            else if (parsed?.logoText && parsed.logoText.trim()) resolved = parsed.logoText.trim();
          }
        }
        if (!resolved) {
          const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_cached_logotext') : null;
          if (cached && cached.trim()) resolved = cached.trim();
        }
      } catch { }
    }

    if (!resolved || resolved.toLowerCase() === 'surm.day' || resolved.toLowerCase() === 'surm') {
      return 'sumr.day';
    }
    return resolved;
  };

  const [currentLogo, setCurrentLogo] = useState<string | null>(resolveLogo);
  const [currentLogoText, setCurrentLogoText] = useState<string>(() => resolveLogoText(propLogoText));
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [currentLogo]);

  useEffect(() => {
    if (propLogoImage !== undefined) {
      setCurrentLogo(propLogoImage);
    }
  }, [propLogoImage]);

  useEffect(() => {
    if (propLogoText && propLogoText.trim()) {
      const resolved = resolveLogoText(propLogoText);
      setCurrentLogoText(resolved);
      try {
        localStorage.setItem('porto_cached_logotext', resolved);
      } catch { }
    }
  }, [propLogoText]);

  useEffect(() => {
    const handleLogoUpdate = (e: any) => {
      if (propLogoImage === undefined) {
        if (e?.detail?.logo !== undefined) {
          setCurrentLogo(e.detail.logo);
        } else {
          setCurrentLogo(resolveLogo());
        }
      }
    };
    const handleTextUpdate = (e: any) => {
      const incoming = e?.detail?.logoText || e?.detail?.title;
      const newText = (typeof incoming === 'string' && incoming.trim()) ? incoming.trim() : resolveLogoText();
      if (newText) {
        setCurrentLogoText(newText);
        try {
          localStorage.setItem('porto_cached_logotext', newText);
        } catch { }
      }
    };
    window.addEventListener('porto_logo_updated', handleLogoUpdate);
    window.addEventListener('porto_logotext_updated', handleTextUpdate);
    window.addEventListener('storage', handleLogoUpdate);
    window.addEventListener('storage', handleTextUpdate);
    return () => {
      window.removeEventListener('porto_logo_updated', handleLogoUpdate);
      window.removeEventListener('porto_logotext_updated', handleTextUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
      window.removeEventListener('storage', handleTextUpdate);
    };
  }, [propLogoImage]);

  const [scrolled, setScrolled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0) > 15;
  });

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setProfileDropdownOpen(false);
    setIsSearchOpen(false);
    setScrolled(false);
  }, [location.pathname]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVacationMode, setIsVacationMode] = useState<boolean>(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_settings') : null;
      return raw ? Boolean(JSON.parse(raw)?.isVacationMode) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('porto_settings') : null;
        setIsVacationMode(raw ? Boolean(JSON.parse(raw)?.isVacationMode) : false);
      } catch { }
    };
    window.addEventListener('storage', handleSettingsUpdate);
    window.addEventListener('porto_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('porto_settings_updated', handleSettingsUpdate);
    };
  }, []);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Record<string, boolean>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { isDark, toggleTheme } = useWebsiteTheme();
  const [isSoundMuted, setIsSoundMuted] = useState(() => soundEffects.getMuted());

  const toggleSound = () => {
    const next = !isSoundMuted;
    soundEffects.setMuted(next);
    setIsSoundMuted(next);
    haptic.selection();
    if (!next) {
      soundEffects.play('pop');
    }
  };
  const {
    client,
    openAuthModal,
    openProfileModal,
    openOrdersModal,
    logout
  } = useClientAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Cart item count for navbar badge
  const [navCartCount, setNavCartCount] = useState(0);

  useEffect(() => {
    const updateNavCart = () => {
      try {
        const raw = localStorage.getItem('porto_client_cart');
        const items = raw ? JSON.parse(raw) : [];
        const count = items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);
        setNavCartCount(count);
      } catch {
        setNavCartCount(0);
      }
    };
    updateNavCart();
    window.addEventListener('storage', updateNavCart);
    window.addEventListener('porto_cart_updated', updateNavCart);
    return () => {
      window.removeEventListener('storage', updateNavCart);
      window.removeEventListener('porto_cart_updated', updateNavCart);
    };
  }, []);

  // Reliable scroll listener across window, document, and custom scroll parents (rAF throttled)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const shouldScroll = top > 15;
        setScrolled(prev => (prev !== shouldScroll ? shouldScroll : prev));
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setMobileOpen(false);
        setOpenDropdown(null);
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background bounce when mobile drawer is open without causing scrollbar layout jumping
  useEffect(() => {
    if (mobileOpen || isSearchOpen) {
      document.body.style.overscrollBehavior = 'contain';
    } else {
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      document.body.style.overscrollBehavior = '';
    };
  }, [mobileOpen, isSearchOpen]);

  const toggleMobileGroup = (id: string) => {
    setExpandedMobileGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, url?: string) => {
    if (!url || url === '#') return;
    setMobileOpen(false);
    setOpenDropdown(null);

    if (url.startsWith('#')) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate('/' + url);
      } else {
        const el = document.querySelector(url);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else if (url.startsWith('http')) {
      // Direct external link
    } else {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      navigate(url);
    }
  };

  const isCurrentActive = (url?: string) => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0];
    if (cleanUrl === '/' || url === '#home') {
      return location.pathname === '/' && !location.hash;
    }
    if (url.startsWith('#')) {
      return location.pathname === '/' && location.hash === url;
    }
    const path = location.pathname;
    if (cleanUrl === '/portfolio' || cleanUrl === '/portofolio') {
      return path === '/portfolio' || path === '/portofolio' || path.startsWith('/portfolio/') || path.startsWith('/portofolio/');
    }
    return path === cleanUrl || path.startsWith(cleanUrl + '/');
  };

  // Color tokens - pure solid flat minimal matching exact page background (zero clashing background)
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const solidNavBg = isDark ? 'rgba(21, 24, 36, 0.94)' : 'rgba(255, 255, 255, 0.94)';
  const dropdownBg = isDark ? '#151824' : '#ffffff';
  const buttonHoverBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)';

  const activeNavItems = items && items.length > 0 ? items : DEFAULT_ITEMS;
  const filteredNavItems = activeNavItems.filter((item) => {
    const norm = (item.label || '').trim().toLowerCase();
    const normUrl = (item.url || '').trim().toLowerCase();
    return norm !== 'masuk' && norm !== 'login' && normUrl !== '/login' && normUrl !== '/client/login';
  });

  const navbarContent = (
    <>
      <style>{`
        .lp-nav-desktop-menu {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: clamp(3px, 0.6vw, 8px) !important;
          flex: 1 !important;
          margin: 0 10px !important;
        }
        .lp-nav-desktop-only {
          display: inline-flex !important;
        }
        .lp-nav-mobile-btn,
        button.lp-nav-mobile-btn {
          display: none !important;
        }
        @media (max-width: 860px) {
          .lp-nav-desktop-menu {
            display: none !important;
          }
          .lp-nav-desktop-only {
            display: none !important;
          }
          .lp-nav-mobile-btn,
          button.lp-nav-mobile-btn {
            display: inline-flex !important;
          }
        }
        .lp-mobile-drawer {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .lp-mobile-drawer::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>

      {/* ── Fixed Viewport Container (Never Scrolls Away) ── */}
      <header id="lp-navbar-fixed-container" data-no-3d="true">
        {isVacationMode && (
          <div style={{
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            color: '#000000',
            padding: '4px 14px',
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.02em',
            borderRadius: 100,
            marginBottom: 6,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            <span>Studio Sedang Libur — Respons chat mungkin sedikit lebih lambat</span>
          </div>
        )}
        <div
          className={`lp-navbar-inner-card ${scrolled ? 'is-scrolled' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}
          style={{
            position: 'relative',
            width: mobileOpen ? 'calc(100% - 24px)' : 'calc(100% - clamp(32px, 7vw, 48px))',
            maxWidth: mobileOpen ? 480 : 1240,
            margin: '0 auto',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: mobileOpen ? 24 : 9999,
            boxSizing: 'border-box',
            overflow: mobileOpen ? 'hidden' : 'visible',
            boxShadow: 'none',
            transition: 'width 0.32s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Smooth Glass Pill Backdrop Layer (pure silky fade for opacity, blur & shadow) */}
          <div
            aria-hidden="true"
            className="lp-navbar-backdrop"
            style={{
              position: 'absolute',
              inset: -1,
              borderRadius: 'inherit',
              background: solidNavBg,
              backdropFilter: (scrolled || mobileOpen) ? 'blur(16px)' : 'blur(0px)',
              WebkitBackdropFilter: (scrolled || mobileOpen) ? 'blur(16px)' : 'blur(0px)',
              border: `1px solid ${(scrolled || mobileOpen) ? borderColor : 'transparent'}`,
              boxShadow: (scrolled || mobileOpen)
                ? (isDark ? '0 8px 28px rgba(0,0,0,0.38)' : '0 4px 16px rgba(15,23,42,0.04)')
                : '0 0 0 rgba(0,0,0,0)',
              opacity: (scrolled || mobileOpen) ? 1 : 0,
              transition:
                'opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1), ' +
                'backdrop-filter 0.65s cubic-bezier(0.22, 1, 0.36, 1), ' +
                '-webkit-backdrop-filter 0.65s cubic-bezier(0.22, 1, 0.36, 1), ' +
                'border-color 0.65s cubic-bezier(0.22, 1, 0.36, 1), ' +
                'box-shadow 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
              pointerEvents: 'none',
              zIndex: 0,
              willChange: 'opacity',
            }}
          />
          <div
            className="lp-navbar-top-row"
            style={{
              margin: '0 auto',
              padding: mobileOpen ? '0 14px' : '0 10px 0 18px',
              height: 48,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              boxSizing: 'border-box',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Left: Logo / Brand */}
            <div style={{ flexShrink: 0, zIndex: 2 }}>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 16.5,
                  fontWeight: 850,
                  color: textColor,
                  textDecoration: 'none',
                  letterSpacing: '-0.4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                {currentLogo && !logoError ? (
                  <img
                    src={currentLogo}
                    alt={currentLogoText || 'Studio'}
                    decoding="async"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      objectFit: 'contain',
                      background: '#FAF7F2',
                      flexShrink: 0,
                    }}
                    onError={() => {
                      setLogoError(true);
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {(currentLogoText || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="lp-brand-text" style={{ letterSpacing: '-0.3px', whiteSpace: 'nowrap', fontSize: 15.5 }}>{currentLogoText || 'Studio'}</span>
              </a>
            </div>

            {/* Center: Desktop Navigation Menu */}
            <nav
              ref={dropdownRef}
              className="lp-nav-desktop-menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(2px, 0.4vw, 5px)',
                flex: 1,
                margin: '0 10px',
                zIndex: 1,
              }}
            >
              {filteredNavItems.map((item) => {
                const active = isCurrentActive(item.url);

                if (item.type === 'dropdown' && item.children?.length) {
                  const isOpen = openDropdown === item.id;
                  return (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <button
                        className="lp-nav-desktop-link"
                        onClick={() => setOpenDropdown(isOpen ? null : item.id)}
                        style={{
                          padding: '6px clamp(6px, 0.75vw, 12px)',
                          fontSize: 13,
                          letterSpacing: '-0.01em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'transparent',
                          border: 'none',
                          color: isOpen ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.72)' : '#4b5563'),
                          fontFamily: "'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          fontWeight: isOpen ? 700 : 500,
                          cursor: 'pointer',
                          borderRadius: 9999,
                          transition: 'color 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.04)';
                          e.currentTarget.style.color = isDark ? '#ffffff' : '#0f1115';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.color = isOpen ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.72)' : '#4b5563');
                        }}
                      >
                        {item.label}
                        <ChevronDown
                          size={12}
                          style={{
                            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </button>

                      {/* Dropdown Floating Menu */}
                      {isOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: dropdownBg,
                            borderRadius: 14,
                            border: `1px solid ${borderColor}`,
                            boxShadow: isDark
                              ? '0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                              : '0 20px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                            padding: '6px',
                            minWidth: 170,
                            zIndex: 9999,
                          }}
                        >
                          {item.children.map((child) => {
                            const isChildActive = isCurrentActive(child.url);
                            return (
                              <a
                                key={child.id}
                                href={child.url}
                                onClick={(e) => handleNavClick(e, child.url)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '7px 12px',
                                  color: isChildActive ? accentColor : textColor,
                                  background: isChildActive ? `${accentColor}15` : 'transparent',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  borderRadius: 8,
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = `${accentColor}18`;
                                  (e.currentTarget as HTMLElement).style.color = accentColor;
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = isChildActive ? `${accentColor}15` : 'transparent';
                                  (e.currentTarget as HTMLElement).style.color = isChildActive ? accentColor : textColor;
                                }}
                              >
                                <span>{child.label}</span>
                                <ChevronRight size={12} style={{ opacity: 0.5 }} />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={item.id}
                    href={item.url || '#'}
                    className="lp-nav-desktop-link"
                    onClick={(e) => handleNavClick(e, item.url)}
                    style={{
                      padding: '6px clamp(6px, 0.75vw, 12px)',
                      fontSize: 13,
                      letterSpacing: '-0.01em',
                      color: active ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.72)' : '#4b5563'),
                      background: 'transparent',
                      fontFamily: "'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      fontWeight: active ? 700 : 500,
                      textDecoration: 'none',
                      borderRadius: 9999,
                      transition: 'color 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.04)';
                      if (!active) {
                        e.currentTarget.style.color = isDark ? '#ffffff' : '#0f1115';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      if (!active) {
                        e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.72)' : '#4b5563';
                      }
                    }}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Right: Actions (Search, Theme, Login/Profile, Hamburger) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 2,
              }}
            >
              {/* Quick Spotlight Search Trigger (Desktop Only - In Mobile it is inside drawer) */}
              <button
                type="button"
                className="lp-nav-desktop-only icon-btn cms-circle-btn"
                onClick={() => setIsSearchOpen(true)}
                title="Cari (Ctrl+K / ⌘K)"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${accentColor}70`;
                  e.currentTarget.style.color = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.color = textColor;
                }}
              >
                <Search size={14} style={{ flexShrink: 0 }} />
              </button>

              {/* Keranjang Belanja Dedicated Button (Desktop Only - In Mobile it is inside drawer) */}
              <button
                type="button"
                className="lp-nav-desktop-only icon-btn cms-circle-btn"
                onClick={() => navigate('/keranjang')}
                title={navCartCount > 0 ? `Keranjang Belanja (${navCartCount} item)` : 'Keranjang Belanja'}
                style={{
                  position: 'relative',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#e2e8f0' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, background 0.18s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ShoppingCart size={14} style={{ flexShrink: 0 }} />
                {navCartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    minWidth: 15,
                    height: 15,
                    padding: '0 3px',
                    borderRadius: 10,
                    background: accentColor,
                    color: '#ffffff',
                    fontSize: 9,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'none',
                    flexShrink: 0
                  }}>
                    {navCartCount > 99 ? '99+' : navCartCount}
                  </span>
                )}
              </button>

              {/* Dark / Light Mode Switcher (Desktop Only - In Mobile it is placed in the drawer) */}
              <button
                type="button"
                className="lp-nav-desktop-only icon-btn cms-circle-btn"
                onClick={toggleTheme}
                title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#fbbf24' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#fbbf2460' : `${accentColor}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                }}
              >
                {isDark ? (
                  <span key="sun" className="theme-icon-animated"><Sun size={14} style={{ flexShrink: 0 }} /></span>
                ) : (
                  <span key="moon" className="theme-icon-animated"><Moon size={14} style={{ flexShrink: 0 }} /></span>
                )}
              </button>

              {/* Client Profile / Auth Button (Desktop Only - In Mobile it is placed in the drawer) */}
              {client ? (
                <div ref={profileRef} className="lp-nav-desktop-only" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 8px 3px 4px',
                      height: 32,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${borderColor}`,
                      borderRadius: 9999,
                      color: textColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: accentColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {client.avatarUrl ? (
                        <img src={client.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        (client.name || 'C').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={11} style={{ opacity: 0.6 }} />
                  </button>

                  {/* Profile Floating Menu */}
                  {profileDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        background: dropdownBg,
                        borderRadius: 16,
                        border: `1px solid ${borderColor}`,
                        boxShadow: isDark
                          ? '0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                          : '0 20px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                        padding: '8px',
                        minWidth: 190,
                        zIndex: 9999,
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${borderColor}`, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: textColor }}>{client.name}</div>
                        <div style={{ fontSize: 11, color: subTextColor, overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.email}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setProfileDropdownOpen(false); navigate('/akun?tab=profile'); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                          border: 'none', background: 'transparent', color: textColor, borderRadius: 10,
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = buttonHoverBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <User size={14} style={{ color: accentColor }} />
                        <span>Profil Saya</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setProfileDropdownOpen(false); navigate('/akun?tab=orders'); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                          border: 'none', background: 'transparent', color: textColor, borderRadius: 10,
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = buttonHoverBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Package size={14} style={{ color: accentColor }} />
                        <span>Pesanan Saya</span>
                      </button>

                      <div style={{ height: 1, background: borderColor, margin: '4px 0' }} />

                      <button
                        type="button"
                        onClick={() => { setProfileDropdownOpen(false); logout(); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                          border: 'none', background: 'transparent', color: '#ef4444', borderRadius: 10,
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={14} />
                        <span>Keluar</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="lp-nav-desktop-only"
                  onClick={() => openAuthModal('login')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '0 13px',
                    height: 32,
                    borderRadius: 9999,
                    border: 'none',
                    background: isDark ? '#ffffff' : '#0f1115',
                    color: isDark ? '#0f1115' : '#ffffff',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span>{loginBtnLabel}</span>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: isDark ? '#0f1115' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f1115',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 1
                    }}
                  >
                    <ArrowUpRight size={11} strokeWidth={2.4} />
                  </span>
                </button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setMobileOpen(!mobileOpen);
                }}
                aria-label="Menu Navigasi"
                className="lp-nav-mobile-btn"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 'unset',
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: mobileOpen ? 'rotate(90deg)' : 'none',
                  flexShrink: 0
                }}
              >
                {mobileOpen ? <X size={16} style={{ flexShrink: 0 }} /> : <Menu size={16} style={{ flexShrink: 0 }} />}
              </button>
            </div>
          </div>

          {/* ── Mobile Slide-down Collapsible Drawer Container ── */}
          <div
            className={`lp-mobile-drawer-wrapper ${mobileOpen ? 'is-open' : ''}`}
            aria-hidden={!mobileOpen}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div className="lp-mobile-drawer-inner">
              <div
                className="lp-mobile-drawer"
                style={{
                  background: isDark ? '#0c0d12' : '#ffffff',
                  borderTop: `1px solid ${borderColor}`,
                  padding: '16px 18px 20px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 'calc(85vh - 64px)',
                  overflowY: mobileOpen ? 'auto' : 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  boxSizing: 'border-box',
                }}
              >
                {/* Quick Search + Keranjang & Lacak (1 Baris Ringkas) */}
                <div className="lp-drawer-stagger-1" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setMobileOpen(false);
                      setIsSearchOpen(true);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '0 14px',
                      borderRadius: 14,
                      border: `1px solid ${borderColor}`,
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                      color: subTextColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13.5,
                      fontWeight: 650,
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Search size={16} style={{ color: accentColor, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: subTextColor }}>
                      Cari halaman, artikel, produk...
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: subTextColor, fontWeight: 700, flexShrink: 0 }}>⌘K</span>
                  </button>

                  <button
                    type="button"
                    title="Keranjang"
                    aria-label="Keranjang"
                    onClick={() => {
                      haptic.light();
                      setMobileOpen(false);
                      navigate('/keranjang');
                    }}
                    style={{
                      position: 'relative',
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      border: `1px solid ${borderColor}`,
                      background: isCurrentActive('/keranjang') ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                      color: textColor,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ShoppingCart size={17} color={accentColor} />
                    {navCartCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        minWidth: 18,
                        height: 18,
                        padding: '0 4px',
                        borderRadius: 100,
                        background: accentColor,
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                      }}>
                        {navCartCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    title="Lacak / Drop Portal"
                    aria-label="Lacak / Drop Portal"
                    onClick={() => {
                      haptic.light();
                      setMobileOpen(false);
                      navigate('/lacak');
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 14,
                      border: `1px solid ${isCurrentActive('/lacak') || isCurrentActive('/drop') ? '#0ea5e9' : borderColor}`,
                      background: isCurrentActive('/lacak') || isCurrentActive('/drop') ? 'rgba(14, 165, 233, 0.18)' : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                      color: textColor,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Package size={17} color="#0ea5e9" />
                  </button>
                </div>

                {/* ── Menu Utama (Grid 2 Kolom — Fleksibel via mobileSlot) ── */}
                {(() => {
                  const PRIMARY_SLUGS = ['/', '#home', '/portofolio', '/portfolio', '/katalog', '/pricing', '/harga'];
                  const isPrimary = (url?: string) => url && PRIMARY_SLUGS.includes(url.toLowerCase());
                  const explicitGridItems = activeNavItems.filter(item => item.mobileSlot === 'grid');
                  const fallbackCandidates = activeNavItems.filter(item => item.mobileSlot !== 'list');
                  const primaryNavItems = fallbackCandidates.filter(item => item.type === 'link' && isPrimary(item.url));
                  const mainGridItems = explicitGridItems.length > 0
                    ? explicitGridItems
                    : (primaryNavItems.length >= 2 ? primaryNavItems : fallbackCandidates.slice(0, 4));
                  const secondaryNavItems = activeNavItems.filter(item => !mainGridItems.some(p => p.id === item.id));

                  return (
                    <>
                      <div className="lp-drawer-stagger-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                        {mainGridItems.map((item) => {
                          const active = isCurrentActive(item.url);
                          return (
                            <a
                              key={item.id}
                              href={item.url || '#'}
                              onClick={(e) => handleNavClick(e, item.url)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '11px 12px',
                                borderRadius: 14,
                                background: active ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                                color: active ? accentColor : textColor,
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 13.5,
                                fontWeight: active ? 850 : 700,
                                textDecoration: 'none',
                                border: `1px solid ${borderColor}`,
                                boxShadow: 'none',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: active ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: active ? '#ffffff' : accentColor,
                                flexShrink: 0
                              }}>
                                {getNavIcon(item.label, item.url)}
                              </div>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.label}
                              </span>
                            </a>
                          );
                        })}
                      </div>

                      {/* ── Jelajahi Studio (Compact List) ── */}
                      {secondaryNavItems.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                          <div style={{
                            fontSize: 10.5,
                            fontWeight: 850,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: subTextColor,
                            padding: '4px 6px 2px',
                          }}>
                            Jelajahi Studio
                          </div>

                          {secondaryNavItems.map((item) => {
                            const active = isCurrentActive(item.url);

                            if (item.type === 'dropdown' && item.children?.length) {
                              const isExpanded = !!expandedMobileGroups[item.id];
                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                                    borderRadius: 14,
                                    border: `1px solid ${borderColor}`,
                                    overflow: 'hidden'
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleMobileGroup(item.id)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      width: '100%',
                                      padding: '11px 14px',
                                      background: 'transparent',
                                      border: 'none',
                                      color: textColor,
                                      fontFamily: "'Outfit', sans-serif",
                                      fontSize: 13.5,
                                      fontWeight: 750,
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      {getNavIcon(item.label, item.url)}
                                      <span>{item.label}</span>
                                    </div>
                                    <ChevronDown
                                      size={16}
                                      style={{
                                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        color: subTextColor
                                      }}
                                    />
                                  </button>

                                  {isExpanded && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        padding: '0 10px 10px 10px',
                                        borderTop: `1px solid ${borderColor}`,
                                        paddingTop: 8,
                                      }}
                                    >
                                      {item.children.map((child) => {
                                        const childActive = isCurrentActive(child.url);
                                        return (
                                          <a
                                            key={child.id}
                                            href={child.url}
                                            onClick={(e) => handleNavClick(e, child.url)}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 10,
                                              padding: '9px 12px',
                                              borderRadius: 10,
                                              background: childActive ? `${accentColor}18` : 'transparent',
                                              color: childActive ? accentColor : textColor,
                                              fontFamily: "'Outfit', sans-serif",
                                              fontSize: 13,
                                              fontWeight: 700,
                                              textDecoration: 'none',
                                            }}
                                          >
                                            <ChevronRight size={13} style={{ color: accentColor }} />
                                            <span>{child.label}</span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <a
                                key={item.id}
                                href={item.url || '#'}
                                onClick={(e) => handleNavClick(e, item.url)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 14px',
                                  borderRadius: 12,
                                  background: active
                                    ? `${accentColor}16`
                                    : (isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)'),
                                  color: active ? accentColor : textColor,
                                  fontFamily: "'Outfit', sans-serif",
                                  fontSize: 13.5,
                                  fontWeight: active ? 800 : 700,
                                  textDecoration: 'none',
                                  border: `1px solid ${active ? `${accentColor}40` : 'transparent'}`,
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {getNavIcon(item.label, item.url)}
                                  <span>{item.label}</span>
                                </div>
                                <ChevronRight size={14} style={{ color: active ? accentColor : subTextColor, opacity: 0.7 }} />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Divider */}
                <div style={{ height: 1, background: borderColor, margin: '6px 0' }} />

                {/* Mobile Client Auth / Account Controls (All in One Single Clean Row) */}
                <div className="lp-drawer-stagger-5">
                  {client ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 14, border: `1px solid ${borderColor}` }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                          <div style={{ fontSize: 11.5, color: subTextColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => { setMobileOpen(false); navigate('/akun?tab=profile'); }}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 12, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', color: textColor, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          <User size={13} color={accentColor} /> Profil
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMobileOpen(false); navigate('/akun?tab=orders'); }}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 12, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', color: textColor, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          <Package size={13} color={accentColor} /> Pesanan
                        </button>
                        <button
                          type="button"
                          onClick={toggleSound}
                          title={isSoundMuted ? "Suara UI Mati" : "Suara UI Aktif"}
                          style={{
                            width: 38,
                            height: 38,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 12,
                            border: `1px solid ${borderColor}`,
                            background: !isSoundMuted ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                            color: textColor,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {!isSoundMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            toggleTheme();
                          }}
                          title="Ganti Mode"
                          style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: textColor, cursor: 'pointer', flexShrink: 0 }}
                        >
                          {isDark ? (
                            <span key="sun-m1" className="theme-icon-animated"><Sun size={15} color="#fbbf24" /></span>
                          ) : (
                            <span key="moon-m1" className="theme-icon-animated"><Moon size={15} /></span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMobileOpen(false); logout(); }}
                          title="Keluar"
                          style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <LogOut size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', boxSizing: 'border-box' }}>
                      <button
                        type="button"
                        onClick={() => {
                          haptic.light();
                          setMobileOpen(false);
                          openAuthModal('login');
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                          padding: '0 12px',
                          borderRadius: 12,
                          border: 'none',
                          background: isDark ? '#ffffff' : '#0f1115',
                          color: isDark ? '#0f1115' : '#ffffff',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 750,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'transform 0.18s ease',
                        }}
                      >
                        <User size={14} style={{ color: isDark ? '#0f1115' : '#ffffff', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {loginBtnLabel || 'Masuk'}
                        </span>
                        <ArrowUpRight size={13} style={{ color: isDark ? '#0f1115' : '#ffffff', flexShrink: 0 }} />
                      </button>

                      <button
                        type="button"
                        onClick={toggleSound}
                        title={isSoundMuted ? "Suara UI Mati" : "Suara UI Aktif"}
                        aria-label="Toggle Sound Effects"
                        style={{
                          width: 38,
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          border: `1px solid ${borderColor}`,
                          background: !isSoundMuted ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                          color: textColor,
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {!isSoundMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          haptic.light();
                          toggleTheme();
                        }}
                        title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
                        aria-label="Toggle Dark/Light Mode"
                        style={{
                          width: 38,
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          border: `1px solid ${borderColor}`,
                          background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                          color: textColor,
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isDark ? (
                          <span key="sun-m2" className="theme-icon-animated"><Sun size={15} style={{ color: '#fbbf24' }} /></span>
                        ) : (
                          <span key="moon-m2" className="theme-icon-animated"><Moon size={15} /></span>
                        )}
                      </button>

                      <a
                        href="/admin/login"
                        title="Studio Admin"
                        style={{
                          width: 38,
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          border: `1px solid ${borderColor}`,
                          background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                          color: subTextColor,
                          textDecoration: 'none',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Shield size={15} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen Backdrop Blur for Mobile Drawer (Smooth Fade In & Out) */}
      <div
        className="lp-mobile-backdrop"
        onClick={() => {
          haptic.light();
          setMobileOpen(false);
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: isDark ? 'rgba(0, 0, 0, 0.68)' : 'rgba(15, 23, 42, 0.38)',
          backdropFilter: mobileOpen ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: mobileOpen ? 'blur(8px)' : 'none',
          zIndex: 99990,
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          display: mobileOpen ? 'block' : 'none',
          visibility: mobileOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.32s ease, -webkit-backdrop-filter 0.32s ease',
        }}
      />

      {/* ── Spotlight Search Modal ── */}
      {isSearchOpen && (
        <div
          onClick={() => setIsSearchOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999999,
            background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '12vh', paddingLeft: 16, paddingRight: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 540,
              background: isDark ? '#151824' : '#ffffff',
              borderRadius: 22,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? '0 24px 70px rgba(0,0,0,0.6)' : '0 24px 70px rgba(15,23,42,0.14)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${borderColor}` }}>
              <Search size={18} style={{ color: subTextColor, marginRight: 12 }} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik untuk mencari halaman atau karya..."
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  outline: 'none', color: textColor, fontFamily: "'Outfit', sans-serif",
                  fontSize: 15, fontWeight: 600,
                }}
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                style={{ background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 12, maxHeight: 320, overflowY: 'auto' }}>
              {activeNavItems
                .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      setIsSearchOpen(false);
                      handleNavClick(e as any, item.url);
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 12, border: 'none', background: 'transparent',
                      color: textColor, fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = buttonHoverBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {getNavIcon(item.label, item.url)}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={14} style={{ opacity: 0.5 }} />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return navbarContent;
};

// ── Root LPNavbar Component Router ──
// Safely switches between child override sender and full renderer.
// Because these are distinct component functions, React properly unmounts/mounts
// without ever violating the Rules of Hooks ("Rendered fewer hooks than expected").
const LPNavbar: React.FC<LPNavbarProps> = (props) => {
  const isChildInstance = !props.isPersistentRoot && persistentNavbarMounted;

  if (isChildInstance) {
    return <LPNavbarChildOverride {...props} />;
  }

  return <LPNavbarRenderer {...props} />;
};

export default LPNavbar;
