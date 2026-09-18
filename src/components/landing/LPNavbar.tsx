import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Sun, Moon, User, Menu, X, ChevronDown, ChevronRight,
  Home, FolderGit2, UserCheck, BookOpen, ShoppingBag, Send,
  Shield, LogOut, Package, Sparkles, Receipt, Gamepad2, Link2
} from 'lucide-react';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';
import { useClientAuth } from '../../context/ClientAuthContext';

export interface NavItem {
  id: string;
  type: 'link' | 'dropdown';
  label: string;
  url?: string;
  children?: { id: string; label: string; url: string }[];
}

interface LPNavbarProps {
  items?: NavItem[];
  loginBtnLabel?: string;
  logoText?: string;
  accentColor?: string;
  isDark?: boolean;
}

const DEFAULT_ITEMS: NavItem[] = [
  { id: 'nav-home', type: 'link', label: 'Beranda', url: '/' },
  { id: 'nav-portfolio', type: 'link', label: 'Portofolio', url: '/portfolio' },
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
  if (norm.includes('beranda') || norm.includes('home') || url === '/' || url === '#home') return <Home size={16} />;
  if (norm.includes('karya') || norm.includes('portfolio') || norm.includes('portofolio') || norm.includes('proyek')) return <FolderGit2 size={16} />;
  if (norm.includes('tentang') || norm.includes('about') || norm.includes('bio')) return <UserCheck size={16} />;
  if (norm.includes('katalog') || norm.includes('shop') || norm.includes('toko') || norm.includes('layanan')) return <ShoppingBag size={16} />;
  if (norm.includes('harga') || norm.includes('pricing') || norm.includes('paket') || norm.includes('biaya')) return <Receipt size={16} />;
  if (norm.includes('game') || norm.includes('games') || norm.includes('play')) return <Gamepad2 size={16} />;
  if (norm.includes('blog') || norm.includes('artikel') || norm.includes('jurnal')) return <BookOpen size={16} />;
  if (norm.includes('update') || norm.includes('updates') || norm.includes('aktivitas')) return <Sparkles size={16} />;
  if (norm.includes('link') || norm.includes('links') || norm.includes('tautan')) return <Link2 size={16} />;
  if (norm.includes('kontak') || norm.includes('contact')) return <Send size={16} />;
  return <Sparkles size={16} />;
};

const LPNavbar: React.FC<LPNavbarProps> = ({
  items = DEFAULT_ITEMS,
  loginBtnLabel = 'Masuk',
  logoText = 'Arif.',
  accentColor = '#64748b',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Record<string, boolean>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { isDark, toggleTheme } = useWebsiteTheme();
  const {
    client,
    openAuthModal,
    openProfileModal,
    openOrdersModal,
    logout
  } = useClientAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Reliable scroll listener across window, document, and custom scroll parents
  useEffect(() => {
    const handleScroll = () => {
      const top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setScrolled(top > 15);
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

  // Prevent background scroll when mobile drawer or search is open
  useEffect(() => {
    if (mobileOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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
      navigate(url);
    }
  };

  const isCurrentActive = (url?: string) => {
    if (!url) return false;
    if (url === '/' || url === '#home') {
      return location.pathname === '/' && !location.hash;
    }
    if (url.startsWith('#')) {
      return location.pathname === '/' && location.hash === url;
    }
    return location.pathname.startsWith(url);
  };

  // Color tokens
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const glassBg = isDark
    ? (scrolled ? 'rgba(10, 10, 18, 0.94)' : 'rgba(10, 10, 18, 0.85)')
    : (scrolled ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.90)');
  const dropdownBg = isDark ? '#0e0e18' : '#ffffff';
  const buttonHoverBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';

  const activeNavItems = items && items.length > 0 ? items : DEFAULT_ITEMS;

  const navbarContent = (
    <>
      <style>{`
        #lp-navbar-fixed-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          z-index: 99999 !important;
          display: flex !important;
          justify-content: center !important;
          pointer-events: none !important;
          padding-top: ${scrolled ? '14px' : '0px'} !important;
          transition: padding-top 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .lp-navbar-inner-card {
          pointer-events: auto;
          width: ${scrolled ? 'calc(100% - 32px)' : '100%'};
          max-width: ${scrolled ? '1140px' : '100%'};
          border-radius: ${scrolled ? (mobileOpen ? '24px' : '100px') : (mobileOpen ? '0 0 24px 24px' : '0px')};
          border: ${scrolled ? `1px solid ${borderColor}` : 'none'};
          border-bottom: 1px solid ${borderColor};
          box-shadow: ${scrolled 
            ? (isDark ? '0 20px 45px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' : '0 20px 45px -10px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.03)')
            : 'none'};
          transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, background 0.3s ease;
        }
        .lp-nav-desktop-menu {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .lp-nav-mobile-btn {
          display: none !important;
        }
        @media (max-width: 860px) {
          .lp-nav-desktop-menu {
            display: none !important;
          }
          .lp-nav-mobile-btn {
            display: flex !important;
          }
        }
      `}</style>

      {/* ── Fixed Viewport Container (Never Scrolls Away) ── */}
      <header id="lp-navbar-fixed-container">
        <div
          className="lp-navbar-inner-card"
          style={{
            background: glassBg,
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              padding: scrolled ? '0 18px' : '0 24px',
              height: scrolled ? 56 : 64,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box',
              position: 'relative',
              transition: 'height 0.35s ease, padding 0.35s ease',
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
                  fontSize: 20,
                  fontWeight: 850,
                  color: textColor,
                  textDecoration: 'none',
                  letterSpacing: '-0.6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: accentColor,
                    boxShadow: `0 0 12px ${accentColor}`,
                  }}
                />
                <span>{logoText || 'Arif.'}</span>
              </a>
            </div>

            {/* Center: Desktop Navigation Menu */}
            <nav
              ref={dropdownRef}
              className="lp-nav-desktop-menu"
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1,
              }}
            >
              {activeNavItems.map((item) => {
                const active = isCurrentActive(item.url);

                if (item.type === 'dropdown' && item.children?.length) {
                  const isOpen = openDropdown === item.id;
                  return (
                    <div key={item.id} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setOpenDropdown(isOpen ? null : item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '7px 14px',
                          background: isOpen ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') : 'transparent',
                          border: 'none',
                          color: isOpen ? accentColor : textColor,
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          borderRadius: 9999,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isOpen) {
                            e.currentTarget.style.background = buttonHoverBg;
                            e.currentTarget.style.color = accentColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isOpen) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = textColor;
                          }
                        }}
                      >
                        {item.label}
                        <ChevronDown
                          size={13}
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
                            top: 'calc(100% + 10px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: dropdownBg,
                            borderRadius: 16,
                            border: `1px solid ${borderColor}`,
                            boxShadow: isDark
                              ? '0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                              : '0 20px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                            padding: '6px',
                            minWidth: 180,
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
                                  padding: '8px 14px',
                                  color: isChildActive ? accentColor : textColor,
                                  background: isChildActive ? `${accentColor}15` : 'transparent',
                                  fontFamily: "'Outfit', sans-serif",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  borderRadius: 10,
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
                                <ChevronRight size={13} style={{ opacity: 0.5 }} />
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
                      padding: '7px 16px',
                      color: active ? '#ffffff' : textColor,
                      background: active ? accentColor : 'transparent',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                      borderRadius: 9999,
                      boxShadow: active ? `0 2px 10px ${accentColor}40` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = buttonHoverBg;
                        e.currentTarget.style.color = accentColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = textColor;
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
              {/* Quick Spotlight Search Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Cari (Ctrl+K / ⌘K)"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
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
                <Search size={15} />
              </button>

              {/* Dark / Light Mode Switcher */}
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#fbbf24' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#fbbf2460' : `${accentColor}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                }}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Client Profile / Auth Button */}
              {client ? (
                <div ref={profileRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px 4px 5px',
                      height: 36,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${profileDropdownOpen ? accentColor : borderColor}`,
                      borderRadius: 9999,
                      color: textColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: accentColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
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
                    <ChevronDown size={12} style={{ opacity: 0.6 }} />
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
                        onClick={() => { setProfileDropdownOpen(false); openProfileModal(); }}
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
                        onClick={() => { setProfileDropdownOpen(false); openOrdersModal(); }}
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
                  onClick={() => openAuthModal('login')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 16px',
                    height: 36,
                    borderRadius: 9999,
                    border: `1px solid ${borderColor}`,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: textColor,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
                  <User size={14} />
                  <span>{loginBtnLabel}</span>
                </button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu Navigasi"
                className="lp-nav-mobile-btn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  color: textColor,
                  cursor: 'pointer',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* ── Mobile Slide-in Drawer / Menu List ── */}
          {mobileOpen && (
            <div
              style={{
                background: isDark ? '#0c0c16' : '#ffffff',
                borderTop: `1px solid ${borderColor}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 'calc(80vh)',
                overflowY: 'auto',
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
                boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.8)' : '0 24px 60px rgba(0,0,0,0.15)',
              }}
            >
              {/* Nav list items */}
              {activeNavItems.map((item) => {
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
                      {/* Sub-Group Accordion Header (Ciut / Luas) */}
                      <button
                        type="button"
                        onClick={() => toggleMobileGroup(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '12px 14px',
                          background: 'transparent',
                          border: 'none',
                          color: textColor,
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 14,
                          fontWeight: 800,
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

                      {/* Sub-Group Collapsible Items List */}
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
                                  fontSize: 13.5,
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
                      gap: 12,
                      padding: '11px 14px',
                      borderRadius: 14,
                      background: active ? accentColor : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      color: active ? '#ffffff' : textColor,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: active ? `0 4px 14px ${accentColor}35` : 'none',
                    }}
                  >
                    {getNavIcon(item.label, item.url)}
                    <span>{item.label}</span>
                  </a>
                );
              })}

              {/* Divider */}
              <div style={{ height: 1, background: borderColor, margin: '8px 0' }} />

              {/* Mobile Client Auth / Admin Controls */}
              {client ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderRadius: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: accentColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: textColor }}>{client.name}</div>
                      <div style={{ fontSize: 11.5, color: subTextColor }}>{client.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); openProfileModal(); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <User size={14} /> Profil
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); openOrdersModal(); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <Package size={14} /> Pesanan
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); logout(); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <LogOut size={14} /> Keluar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); openAuthModal('login'); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 14, border: `1px solid ${accentColor}60`,
                    background: `${accentColor}15`, color: textColor, fontSize: 14, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <User size={15} style={{ color: accentColor }} />
                  <span>Masuk / Daftar Akun</span>
                </button>
              )}

              {/* Bottom Controls: Theme Toggle & Admin Shortcut */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px', borderRadius: 12, border: `1px solid ${borderColor}`,
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', color: textColor,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {isDark ? <Sun size={15} style={{ color: '#fbbf24' }} /> : <Moon size={15} />}
                  <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
                </button>

                <a
                  href="/admin/login"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 12, border: `1px solid ${borderColor}`,
                    background: 'transparent', color: subTextColor, fontSize: 12.5, fontWeight: 700, textDecoration: 'none'
                  }}
                >
                  <Shield size={14} />
                  <span>Admin</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

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
              background: isDark ? '#0f101c' : '#ffffff',
              borderRadius: 20,
              border: `1px solid ${borderColor}`,
              boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
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

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(navbarContent, document.body);
  }
  return navbarContent;
};

export default LPNavbar;
