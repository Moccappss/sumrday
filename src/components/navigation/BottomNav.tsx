import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { House, LayoutGrid, UserRound, Link, Layout, Store } from 'lucide-react';
import DOMPurify from 'dompurify';
import { haptic } from '../../utils/haptics';

// Default icons for system pages (used as fallback when no custom iconSvg is set)
const DEFAULT_SYSTEM_ICONS = {
  home: <House size={28} strokeWidth={2.4} />,
  portofolio: <LayoutGrid size={28} strokeWidth={2.4} />,
  biodata: <UserRound size={28} strokeWidth={2.4} />,
};

const DEFAULT_NAV_ITEMS = [
  { path: '/lpimage/home', slug: 'home', label: 'Home', end: true },
  { path: '/lpimage/portofolio', slug: 'portofolio', label: 'Portofolio' },
  { path: '/lpimage/biodata', slug: 'biodata', label: 'Biodata' },
];

const SIZE_CONFIG = {
  compact: { iconSize: 24, itemWidth: 50, dockHeight: 62, padding: '10px 14px' },
  normal:  { iconSize: 30, itemWidth: 60, dockHeight: 74, padding: '14px 18px' },
  large:   { iconSize: 36, itemWidth: 72, dockHeight: 88, padding: '16px 22px' },
};

const BottomNav = ({

  onContactClick,
  isContactOpen,
  customPages = [],
  contacts = [],

  unreadCount = 0,
  navSettings = {},

  isScrollingDown = false,
  onScrollDirectionChange,
  scrollContainerRef,
  shopEnabled = false,
  isEmbedded = false,
  previewMode = false,
}) => {
  const location = useLocation();
  const scrollRef = useRef(null);
  const itemRefs = useRef([]);
  const lastScrollRef = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ transform: 'scale(0)', opacity: 0 });

  const {
    navStyle = 'dock',
    navSize = 'normal',
    navMaxIcons = 5,
    navAutoHide = false,
    navBgMode = 'glass',
  } = navSettings;

  const sizeConf = SIZE_CONFIG[navSize] || SIZE_CONFIG.normal;

  // ── Auto-hide on scroll ──────────────────────────────────────
  useEffect(() => {

    if (!navAutoHide) { setHidden(false); return; }
    const el = scrollContainerRef?.current;
    if (!el) return;

    const handleScroll = () => {
      const st = el.scrollTop;
      const delta = st - lastScrollRef.current;
      if (Math.abs(delta) < 4) return;
      const goingDown = delta > 0 && st > 60;
      setHidden(goingDown);
      if (onScrollDirectionChange) onScrollDirectionChange(goingDown);
      lastScrollRef.current = st;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [navAutoHide, scrollContainerRef, onScrollDirectionChange]);

  // ── Build nav items ──────────────────────────────────────────
  const allNavItems = [
    ...DEFAULT_NAV_ITEMS.map(item => {
      const settings = customPages.find(p => p.slug === item.slug);
      if (settings && (!settings.isPublished || !settings.showInNav)) return null;
      const customIconSvg = settings?.iconSvg;
      const icon = customIconSvg ? (
        <div className="cms-icon-wrapper" style={{ width: sizeConf.iconSize, height: sizeConf.iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(customIconSvg) }} />
      ) : (
        React.cloneElement(DEFAULT_SYSTEM_ICONS[item.slug], { size: sizeConf.iconSize })
      );
      return { ...item, icon };
    }),
    ...(shopEnabled ? [{
      path: '/katalog',
      slug: 'katalog',
      label: 'Katalog',
      icon: <Store size={sizeConf.iconSize} strokeWidth={2.4} />
    }] : []),
    ...customPages.filter(p => !p.isSystem && p.isPublished && p.showInNav).map(p => ({
      path: `/lpimage/${p.slug}`,
      icon: p.iconSvg ? (
        <div className="cms-icon-wrapper" style={{ width: sizeConf.iconSize, height: sizeConf.iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.iconSvg) }} />
      ) : <Layout size={sizeConf.iconSize} strokeWidth={2.4} />,
      label: p.name,
    }))
  ].filter(Boolean);

  // ── Active index & indicator ─────────────────────────────────
  const activeIndex = allNavItems.findIndex(item =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  useEffect(() => {
    if (scrollRef.current && activeIndex !== -1 && !isContactOpen) {
      const items = itemRefs.current;
      const activeItem = items[activeIndex];
      if (activeItem) {
        const container = scrollRef.current;
        // Only auto-scroll if there is significant overflow (prevent sub-pixel shifting)
        if (container.scrollWidth > container.clientWidth + 5) {
          const scrollLeft = activeItem.offsetLeft - (container.offsetWidth / 2) + (activeItem.offsetWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }
  }, [activeIndex, isContactOpen]);

  useEffect(() => {
    let rafId;
    const updateIndicator = () => {
      if (activeIndex === -1 || isContactOpen) {
        setIndicatorStyle(prev => ({ ...prev, transform: 'scale(0.8)', opacity: 0 }));
        return;
      }
      const el = itemRefs.current[activeIndex];
      if (el) {
        setIndicatorStyle({
          width: el.offsetWidth || sizeConf.itemWidth,
          height: el.offsetWidth || sizeConf.itemWidth,
          left: el.offsetLeft,
          transform: `scale(1)`,
          opacity: 1,
          borderRadius: '50%',
          '--indicator-size': `${el.offsetWidth || sizeConf.itemWidth}px`,
        });
      }
    };
    
    // Initial update
    rafId = requestAnimationFrame(updateIndicator);

    // Watch for resizes to keep indicator aligned (fixes Flat mode centering bug)
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateIndicator);
    });
    if (scrollRef.current) observer.observe(scrollRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };

  }, [activeIndex, isContactOpen, allNavItems.length, navSize]);

  // ── Drag-to-scroll ───────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false, startX, scrollLeft, isMoving = false;
    const onStart = (e) => {
      if (e.type === 'mousedown' && e.target.closest('button, a')) return;
      isDown = true; isMoving = false;
      const pageX = e.type.startsWith('touch') ? e.touches[0].pageX : e.pageX;
      startX = pageX - el.offsetLeft; scrollLeft = el.scrollLeft;
    };
    const onEnd = () => { isDown = false; el.classList.remove('grabbing'); document.body.style.userSelect = ''; };
    const onMove = (e) => {
      if (!isDown) return;
      const pageX = e.type.startsWith('touch') ? e.touches[0].pageX : e.pageX;
      const x = pageX - el.offsetLeft;
      
      // Require at least 10px actual movement before considering it a swipe/drag
      if (Math.abs(x - startX) > 10) {
        if (!isMoving) { isMoving = true; el.classList.add('grabbing'); document.body.style.userSelect = 'none'; }
        const walk = (x - startX) * 1.5;
        el.scrollLeft = scrollLeft - walk;
        if (e.cancelable) e.preventDefault();
      }
    };
    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    el.addEventListener('mouseleave', onEnd);
    return () => {
      el.removeEventListener('mousedown', onStart);
      el.removeEventListener('touchstart', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
      el.removeEventListener('mouseleave', onEnd);
    };
  }, []);

  // ── Style variants ───────────────────────────────────────────
  const gapSize = 8;
  const paddingX = parseInt(sizeConf.padding.split(' ')[1] || '16', 10) * 2;
  const maxDockWidth = isContactOpen ? undefined : (navMaxIcons * sizeConf.itemWidth) + ((navMaxIcons - 1) * gapSize) + paddingX;

  const styleVariants = {
    dock: {
      wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))', paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))', paddingRight: 'max(8px, env(safe-area-inset-right, 8px))' },
      dock: { borderRadius: 100, maxWidth: maxDockWidth ? `${maxDockWidth}px` : undefined, width: 'max-content' },
    },
    flat: {
      wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' },
      dock: { width: '100%' },
    },
    card: {
      wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))', paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))', paddingRight: 'max(16px, env(safe-area-inset-right, 16px))' },
      dock: { maxWidth: maxDockWidth ? `${maxDockWidth}px` : undefined, width: 'max-content' },
    },
  };
  const variant = styleVariants[navStyle] || styleVariants.dock;

  const isSolid = navBgMode === 'solid';

  return (
    <div
      className="bottom-nav-wrapper"
      style={{
        ...variant.wrapper,
        position: isEmbedded ? 'absolute' : (window.innerWidth >= 1024 ? 'absolute' : 'fixed'),
        bottom: 0, left: 0, right: 0,
        zIndex: isEmbedded ? 50 : 800,
        transform: hidden ? 'translateY(120%)' : 'translateY(0)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: hidden ? 'none' : 'auto',
      }}
    >
      <div
        ref={scrollRef}
        className={`bottom-nav-dock ${isContactOpen ? 'chat-nav' : 'web-nav'}`}
        data-style={navStyle}
        data-bg-mode={navBgMode}
        style={{
          ...variant.dock,
          // Conditionally apply glass or solid effect based on navBgMode
          background: isSolid ? '#12131a' : undefined,
          backdropFilter: isSolid ? 'none' : 'blur(var(--glass-blur, 20px)) saturate(180%)',
          WebkitBackdropFilter: isSolid ? 'none' : 'blur(var(--glass-blur, 20px)) saturate(180%)',
          border: isSolid ? '1px solid rgba(255,255,255,0.08)' : undefined,
          
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          display: 'flex',
          alignItems: 'center',
          gap: `${gapSize}px`,
          justifyContent: (isContactOpen ? contacts.length : allNavItems.length) > navMaxIcons ? 'flex-start' : 'center',
          padding: sizeConf.padding,
          // Hide scrollbar but keep functionality
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >

        <div className="dock-indicator" style={indicatorStyle} />

        {isContactOpen ? (
          contacts.map((c, i) => {
            const safeUrl = (c.url.startsWith('http://') || c.url.startsWith('https://')) ? c.url : `https://${c.url}`;
            return (
              <a
                key={c.id}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dock-item"
                style={{ 
                  flexShrink: 0, 
                  width: sizeConf.itemWidth,
                  height: sizeConf.itemWidth,
                  scrollSnapAlign: 'center',
                  animation: 'cmsPopIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)', 
                  animationDelay: `${i * 0.05}s` 
                }}
              >
                <div className="dock-icon">
                  {c.iconSvg ? (
                    <div style={{ width: sizeConf.iconSize, height: sizeConf.iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.iconSvg) }} />
                  ) : <Link size={sizeConf.iconSize} />}
                </div>
              </a>
            );
          })
        ) : (
          <>
            {allNavItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={(e) => {
                  if (previewMode) {
                    e.preventDefault();
                    e.stopPropagation();
                  } else {
                    haptic.selection();
                  }
                }}
                ref={el => itemRefs.current[i] = el}
                className={({ isActive }) => `dock-item${isActive ? ' active' : ''}`}
                style={{ 
                  flexShrink: 0,
                  width: sizeConf.itemWidth,
                  height: sizeConf.itemWidth,
                  scrollSnapAlign: 'center',
                }}
              >
                <div className="dock-icon" style={{ width: sizeConf.iconSize, height: sizeConf.iconSize }}>{item.icon}</div>
              </NavLink>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default BottomNav;
