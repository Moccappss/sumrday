import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Link, MessageSquare, X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Share2, ArrowUp, MessageSquareMore, Sparkles, Store, Download, Sun, Moon } from 'lucide-react';
import TopPill from '../navigation/TopPill';
import BottomNav from '../navigation/BottomNav';
import ContactPanel from '../contact/ContactPanel';
import MarkerModal from '../navigation/MarkerModal';
import FloatingScrollbar from './FloatingScrollbar';
import { storage } from '../../utils/storage';
import { subscribeToUserNotifications } from '../../utils/notifications';
import { listenToPublicBroadcasts } from '../../utils/pushBroadcast';
import PushOptinBell from '../common/PushOptinBell';
import PublicBroadcastPopup from '../common/PublicBroadcastPopup';
import PublicAiChat from '../chat/PublicAiChat';
import { haptic } from '../../utils/haptics';
import { exportToPdf } from '../../utils/pdfExport';
import { getOptimizedUrl, ensureAbsoluteUrl } from '../renderer/utils';
import AccessLockScreen, { isPageUnlocked, LockConfig } from '../public/AccessLockScreen';
import { useWebsiteTheme } from '../../hooks/useWebsiteTheme';

const DEFAULT_PATH_TO_PAGEKEY = { '/': 'home', '/portofolio': 'portofolio', '/biodata': 'biodata' };

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [markerOpen, setMarkerOpen] = useState(false);
  const [globalLock, setGlobalLock] = useState<LockConfig | null>(null);
  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>({});

  const [scrollFrac, setScrollFrac] = useState(0);

  const [nearMarker, setNearMarker] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [contacts, setContacts] = useState([]);
  const panelRef = useRef(null);
  const pageScrollRef = useRef(null);
  const markerPosRef = useRef([]);
  const [topVisible, setTopVisible] = useState(true);

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const lastScrollRef = useRef(0);

  const scrollPositionsRef = useRef({});
  const topNavTimerRef = useRef(null);
  const isVisibleRef = useRef(true);
  const [activeControl, setActiveControl] = useState(null);
  const [frames, setFrames] = useState({});
  const [customPages, setCustomPages] = useState([]);
  const [globalTitle, setGlobalTitle] = useState('');
  const [shopEnabled, setShopEnabled] = useState(false);
  const [userUnreadCount, setUserUnreadCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const scrollRafId = useRef(null);
  const rightStackRef = useRef(null);
  const rightStackTimerRef = useRef(null);
  const rightStackHovered = useRef(false);
  // Global nav/frame settings
  const [navSettings, setNavSettings] = useState({ navStyle: 'dock', navSize: 'normal', navMaxIcons: 5, navAutoHide: false, navLabelVisible: false, navBgMode: 'glass' });
  const [frameRadius, setFrameRadius] = useState(24);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  // Client Theme (Dark/Light mode) - Unified single source of truth
  const { isDark, toggleTheme } = useWebsiteTheme();

  useEffect(() => {
    const unsubBroadcasts = listenToPublicBroadcasts();
    return () => unsubBroadcasts();
  }, []);

  const handleToggleTheme = () => {
    haptic.light();
    toggleTheme();
  };

  const lastScrollYRef = useRef(0);

  useEffect(() => {
    return () => {
      if (scrollRafId.current) cancelAnimationFrame(scrollRafId.current);
      if (rightStackTimerRef.current) clearTimeout(rightStackTimerRef.current);
    };
  }, []);

  const wakeRightStack = useCallback(() => {
    if (!rightStackRef.current) return;
    rightStackRef.current.style.opacity = '1';
    rightStackRef.current.style.transform = 'translateX(0)';
    rightStackRef.current.style.pointerEvents = 'none'; // wrapper has none, children have auto
    
    // Enable pointer events on children
    const children = rightStackRef.current.children;
    for(let i=0; i<children.length; i++) {
        children[i].style.pointerEvents = 'auto';
    }

    if (rightStackTimerRef.current) clearTimeout(rightStackTimerRef.current);
    const hideDelay = window.innerWidth < 768 ? 1200 : 2200;
    rightStackTimerRef.current = setTimeout(() => {
      if (!rightStackHovered.current && rightStackRef.current) {
        rightStackRef.current.style.opacity = '0';
        rightStackRef.current.style.transform = 'translateX(10px)';
        // Disable pointer events on children
        const children = rightStackRef.current.children;
        for(let i=0; i<children.length; i++) {
            children[i].style.pointerEvents = 'none';
        }
      }
    }, hideDelay);
  }, []);

  // Set --scroll-h CSS variable so sticky parallax blocks know the scroll container height
  useEffect(() => {
    const el = pageScrollRef.current;
    if (!el) return;
    const update = () => {
      el.style.setProperty('--scroll-h', `${el.clientHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    let resizeTimer;
    const h = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setIsDesktop(window.innerWidth >= 1024);
        setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      }, 100);
    };
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); clearTimeout(resizeTimer); };
  }, []);
  
  useEffect(() => {
    const saved = localStorage.getItem('porto_chat_user');
    if (!saved) {
      if ('clearAppBadge' in navigator) navigator.clearAppBadge().catch(() => {});
      return;
    }
    try {
      const { id } = JSON.parse(saved);
      const unsub = subscribeToUserNotifications(id, (notifs) => {
        const unread = notifs.filter(n => !n.read).length;
        setUserUnreadCount(unread);
        
        // Trigger Native App Badge
        if ('setAppBadge' in navigator) {
          if (unread > 0) {
            navigator.setAppBadge(unread).catch(() => {});
          } else {
            navigator.clearAppBadge().catch(() => {});
          }
        }
      });
      return () => {
        unsub();
        if ('clearAppBadge' in navigator) navigator.clearAppBadge().catch(() => {});
      };

    } catch (e) {}
  }, []);
  
  const previousUnreadRef = useRef(0);
  useEffect(() => {
    if (userUnreadCount > previousUnreadRef.current && !contactOpen) {
      window.dispatchEvent(new CustomEvent('porto_island_notify', {
        detail: { type: 'success', message: 'Pesan Baru Masuk!', duration: 3500 }
      }));
      haptic.success();
    }
    previousUnreadRef.current = userUnreadCount;
  }, [userUnreadCount, contactOpen]);

  
  useEffect(() => {
    const load = async () => {
      const s = await storage.getItem('porto_settings', {});
      if (s.customPages) setCustomPages(s.customPages);
      if (s.siteTitle) setGlobalTitle(s.siteTitle);
      if (s.accessLock) setGlobalLock(s.accessLock);
      
      const shopS = await storage.getItem('porto_shop_settings', null);
      if (shopS) {
        setShopEnabled(shopS.enabled || false);
      } else if (s.shopSettings) {
        setShopEnabled(s.shopSettings.enabled || false);
      }

      // Apply glass/blur CSS variables from global settings
      if (s.glassBlur !== undefined) document.documentElement.style.setProperty('--glass-blur', `${s.glassBlur}px`);
      if (s.glassOpacity !== undefined) document.documentElement.style.setProperty('--glass-opacity', s.glassOpacity);
      // Nav and frame settings
      setNavSettings({
        navStyle: s.navStyle || 'dock',
        navSize: s.navSize || 'normal',
        navMaxIcons: s.navMaxIcons || 5,
        navAutoHide: s.navAutoHide || false,
        navLabelVisible: s.navLabelVisible || false,
        navBgMode: s.navBgMode || 'glass',
      });
      setFrameRadius(s.frameRadius ?? 24);
      const c = await storage.getItem('porto_contacts', []);
      setContacts(c.filter(con => con.url).slice(0, 8));
    };
    load();
    window.addEventListener('porto_saved', load);
    window.addEventListener('porto_settings_updated', load);
    window.addEventListener('porto_bg_synced', load);
    window.addEventListener('porto_save_end', load);
    
    return () => { 
      window.removeEventListener('porto_saved', load);
      window.removeEventListener('porto_settings_updated', load);
      window.removeEventListener('porto_bg_synced', load);
      window.removeEventListener('porto_save_end', load);
      if (topNavTimerRef.current) clearTimeout(topNavTimerRef.current);
    };
  }, []);

  const rawSlug = location.pathname.replace(/^\/lpimage\/?/, '').split('/')[0] || '';
  const combinedPathToKey: Record<string, string> = { ...DEFAULT_PATH_TO_PAGEKEY };
  customPages.forEach(p => { 
    combinedPathToKey[`/${p.slug}`] = p.slug; 
    combinedPathToKey[`/lpimage/${p.slug}`] = p.slug; 
  });
  combinedPathToKey['/'] = 'home';
  combinedPathToKey['/lpimage'] = 'home';
  combinedPathToKey['/lpimage/'] = 'home';
  combinedPathToKey['/lpimage/home'] = 'home';
  combinedPathToKey['/home'] = 'home';

  const pageKey = combinedPathToKey[location.pathname] || (rawSlug ? rawSlug : 'home');

  // Close contact panel on outside click
  useEffect(() => {
    const h = (e) => {
      if (contactOpen && panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('[data-contact-btn]') && !e.target.closest('.bottom-nav-wrapper')) setContactOpen(false);
    };
    const handleCloseContact = () => setContactOpen(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('touchstart', h);
    window.addEventListener('porto_close_contact', handleCloseContact);
    return () => { 
      document.removeEventListener('mousedown', h); 
      document.removeEventListener('touchstart', h);
      window.removeEventListener('porto_close_contact', handleCloseContact);
    };
  }, [contactOpen]);

  // Reset on route change + update document.title per page
  useEffect(() => { 

    setContactOpen(false); 
    setMarkerOpen(false); 
    setScrollFrac(0); 
    setNearMarker(''); 
    
    // Smooth haptic feedback for selection transitions
    haptic.selection();

    // Apply per-page title tag
    const allPages = [
      { slug: 'home', name: 'Home', pageTitle: '' },
      { slug: 'portofolio', name: 'Portofolio', pageTitle: '' },
      { slug: 'biodata', name: 'Biodata', pageTitle: '' },
      ...customPages
    ];
    const slug = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');
    const currentPage = allPages.find(p => p.slug === slug);
    if (currentPage?.pageTitle) {
      document.title = currentPage.pageTitle;
    } else if (globalTitle) {
      document.title = globalTitle;
    }
    
    // Show top nav on route change, then hide after 5 seconds
    setTopVisible(true);
    isVisibleRef.current = true;
    if (topNavTimerRef.current) clearTimeout(topNavTimerRef.current);
    topNavTimerRef.current = setTimeout(() => {
      setTopVisible(false);
      isVisibleRef.current = false;
    }, 5000);

    setTopVisible(true);
    setActiveControl(null);
  }, [location.pathname, customPages, globalTitle]);

  // Load marker positions from DOM after content renders
  const loadMarkerPositions = useCallback(async () => {
    if (!pageKey) return;
    await new Promise(r => setTimeout(r, 400));
    const el = pageScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    const raw = await storage.getItem('porto_pages');
    if (!raw) return;
    const positions = [];
    (raw[pageKey] || []).forEach(b =>
      (b.markers || []).forEach(m => {
        const anchor = el.querySelector(`#${m.id}`);
        if (anchor) positions.push({ name: m.name, frac: anchor.offsetTop / maxScroll });
      })
    );
    markerPosRef.current = positions;
  }, [pageKey]);

  useEffect(() => { loadMarkerPositions(); }, [loadMarkerPositions]);
  useEffect(() => {
    const h = () => loadMarkerPositions();
    window.addEventListener('porto_saved', h);
    return () => window.removeEventListener('porto_saved', h);
  }, [loadMarkerPositions]);
  const activeBlocksRef = useRef(new Map());

  useEffect(() => {
    const handleControl = (e) => {
      const { active, type, id, ref } = e?.detail || {};
      
      if (id && id !== 'scroll-update') {
        if (active) {
          activeBlocksRef.current.set(id, { type, id, ref });
        } else {
          activeBlocksRef.current.delete(id);
        }
      }
      
      const blocks = Array.from(activeBlocksRef.current.values());
      if (blocks.length === 0) {
        setActiveControl(null);
        return;
      }

      const centerY = window.innerHeight / 2;
      const threshold = window.innerHeight * 0.3; // 60% center area = 30% above/below center
      
      let bestBlock = null;
      let minDistance = Infinity;

      blocks.forEach(b => {
        if (!b.ref || !document.contains(b.ref)) {
          activeBlocksRef.current.delete(b.id);
          return;
        }
        const rect = b.ref.getBoundingClientRect();
        const blockCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(centerY - blockCenterY);
        if (distance < minDistance) {
          minDistance = distance;
          bestBlock = b;
        }
      });

      if (bestBlock && minDistance <= threshold) {
        setActiveControl(bestBlock);
      } else {
        setActiveControl(null);
      }
    };

    // Also update on scroll to keep the most central block active
    const handleScroll = () => {
      if (activeBlocksRef.current.size > 0) {
        handleControl({ detail: { active: true, id: 'scroll-update' } }); // Trigger re-calculation
      }
    };

    window.addEventListener('porto_block_active', handleControl);
    const scrollArea = pageScrollRef.current;
    if (scrollArea) scrollArea.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('porto_block_active', handleControl);
      if (scrollArea) scrollArea.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Load Frames
  const refreshFrames = useCallback(async () => {
    const f = await storage.getItem('porto_frames', {});
    setFrames(f);
  }, []);

  useEffect(() => { refreshFrames(); }, [refreshFrames]);
  useEffect(() => {
    const h = () => refreshFrames();
    window.addEventListener('porto_saved', h);
    window.addEventListener('porto_settings_updated', h);
    window.addEventListener('porto_frames_updated', h);
    return () => {
      window.removeEventListener('porto_saved', h);
      window.removeEventListener('porto_settings_updated', h);
      window.removeEventListener('porto_frames_updated', h);
    };
  }, [refreshFrames]);

  const handleControlAction = (action) => {
    if (!activeControl || !activeControl.ref || !document.contains(activeControl.ref)) {
      setActiveControl(null);
      return;
    }
    const el = activeControl.ref;
    if (activeControl.type === 'multiple') {
      const scrollAmount = el.offsetWidth;
      el.scrollBy({ left: action === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    } else if (activeControl.type === 'video') {
      const video = el.querySelector('video');
      if (video) {
        if (action === 'play') {
          if (video.paused) video.play(); else video.pause();
        } else if (action === 'mute') {
          video.muted = !video.muted;
        }
        // Force state refresh for icons
        setActiveControl(prev => ({ ...prev }));
      }
    }
  };



  // Scroll handler
  const handleScroll = useCallback(() => {
    if (scrollRafId.current) return;
    scrollRafId.current = requestAnimationFrame(() => {
      const el = pageScrollRef.current;
      if (!el) {
        scrollRafId.current = null;
        return;
      }
      
      const st = el.scrollTop;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const didScrollMove = Math.abs(st - lastScrollRef.current) > 1;
      lastScrollRef.current = st;

      const frac = maxScroll > 0 ? st / maxScroll : 0;
      setScrollFrac(frac);
      setShowScrollTop(st > 300);
      window.dispatchEvent(new CustomEvent('page-scroll', { detail: { scrollTop: st } }));
      el.style.setProperty('--scroll-px', `${st}px`);
      // Also set on parent shell for overlays
      el.closest('.mobile-shell')?.style.setProperty('--scroll-px', `${st}px`);
      const near = markerPosRef.current.find(m => Math.abs(m.frac - frac) < 0.07);
      setNearMarker(near?.name || '');
      
      if (didScrollMove) {
        wakeRightStack();
      }

      scrollRafId.current = null;
    });
  }, [wakeRightStack]);

  useEffect(() => {
    const el = pageScrollRef.current;
    if (el) {
      handleScroll();
      
      const observer = new ResizeObserver(() => {
        handleScroll();
      });
      if (el.firstElementChild) {
        observer.observe(el.firstElementChild);
      }
      observer.observe(el);
      
      return () => observer.disconnect();
    }
  }, [pageKey, customPages, handleScroll]);

  useEffect(() => {
    const el = pageScrollRef.current;
    if (el) handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [handleScroll]);

  const hasMarkers = markerPosRef.current.length > 0;

  const currentSlug = location.pathname.replace(/^\/lpimage\/?/, '').split('/')[0] || 'home';
  const currentPageMetadata = customPages.find(p => p.slug === (pageKey || currentSlug)) || { isPublished: true, showInNav: true, hideNavbars: false, hideBottomNav: false };
  const isFullPage = currentPageMetadata.hideNavbars;
  const hideBottomNav = isFullPage || currentPageMetadata.hideBottomNav;

  const cp = currentPageMetadata as any;
  const activeNavSettings = {
    navStyle: cp?.navStyle || navSettings.navStyle || 'dock',
    navSize: cp?.navSize || navSettings.navSize || 'normal',
    navMaxIcons: cp?.navMaxIcons || navSettings.navMaxIcons || 5,
    navAutoHide: cp?.navAutoHide !== undefined ? cp.navAutoHide : navSettings.navAutoHide,
    navLabelVisible: cp?.navLabelVisible !== undefined ? cp.navLabelVisible : navSettings.navLabelVisible,
    navBgMode: cp?.navBgMode || navSettings.navBgMode || 'glass',
  };

  useEffect(() => {
    const meta = currentPageMetadata as any;
    if (meta?.glassBlur !== undefined) {
      document.documentElement.style.setProperty('--glass-blur', `${meta.glassBlur}px`);
    }
    if (meta?.glassOpacity !== undefined) {
      document.documentElement.style.setProperty('--glass-opacity', String(meta.glassOpacity));
    }
    if (meta?.buttonStyle) {
      document.documentElement.setAttribute('data-btn-style', meta.buttonStyle);
    }
    if (meta?.hoverEffect) {
      document.documentElement.setAttribute('data-hover-effect', meta.hoverEffect);
    }
  }, [currentPageMetadata]);

  const currentDesktopRatio = (currentPageMetadata as any)?.desktopRatio || '9/16';
  const isFullRatio = currentDesktopRatio === 'Full';

  return (
    <div 
      className="mobile-shell"
      style={{
        margin: 'auto',
        height: isDesktop ? '96dvh' : '100dvh',
        aspectRatio: isDesktop ? (isFullRatio ? 'auto' : currentDesktopRatio) : undefined,
        width: isDesktop ? (isFullRatio ? '100%' : 'auto') : (isTablet ? '90%' : '100%'),
        maxWidth: isDesktop ? (isFullRatio ? '1400px' : '96vw') : (isTablet ? '800px' : '100%'),
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: (isDesktop || isTablet) ? `0 24px 80px rgba(0,0,0,0.25)` : 'none',
        borderRadius: (isDesktop || isTablet) ? `${frameRadius}px` : '0',
        '--frame-radius': (isDesktop || isTablet) ? `${frameRadius}px` : '0px'
      }}
    >
      {!isFullPage && (
        <div 
          className={`top-pill-wrapper${topVisible ? '' : ' hidden'}`}
          style={{ top: isDesktop ? 48 : 20 }}
        >
          <TopPill />
        </div>
      )}



      {/* Persistent Page Frames */}
      {(() => {
        if (currentPageMetadata.useFrame === false) return null;
        const pageFrame = (pageKey && frames[pageKey]) ? frames[pageKey] : (frames['home'] || {});
        const topImg = pageFrame.topFrame || frames['home']?.topFrame;
        const topLnk = pageFrame.topLink || frames['home']?.topLink;
        const bottomImg = pageFrame.bottomFrame || frames['home']?.bottomFrame;
        const bottomLnk = pageFrame.bottomLink || frames['home']?.bottomLink;

        return (
          <>
            {topImg && (
              topLnk ? (
                <a 
                  href={ensureAbsoluteUrl(topLnk)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', 
                    zIndex: 300, display: 'block' 
                  }}
                >
                  <img src={getOptimizedUrl(topImg, 800)} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </a>
              ) : (
                <img 
                  src={getOptimizedUrl(topImg, 800)} 
                  alt="" 
                  style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', 
                    zIndex: 300, pointerEvents: 'none', display: 'block' 
                  }} 
                />
              )
            )}
            {bottomImg && (
              bottomLnk ? (
                <a 
                  href={ensureAbsoluteUrl(bottomLnk)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'auto', 
                    zIndex: 301, display: 'block' 
                  }}
                >
                  <img src={getOptimizedUrl(bottomImg, 800)} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </a>
              ) : (
                <img 
                  src={getOptimizedUrl(bottomImg, 800)} 
                  alt="" 
                  style={{ 
                    position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'auto', 
                    zIndex: 301, pointerEvents: 'none', display: 'block' 
                  }} 
                />
              )
            )}
          </>
        );
      })()}

      {/* Page content */}
      <div
        className="page-scroll"
        ref={pageScrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          height: isDesktop ? '100%' : 'auto',
          maxHeight: isDesktop ? '100%' : 'none',
          minHeight: 0,
          overflowY: isDesktop ? 'auto' : 'visible',
          scrollbarWidth: isFullPage ? 'none' : undefined,
          msOverflowStyle: isFullPage ? 'none' : undefined,
          position: 'relative'
        }}
      >
        <div key={location.pathname} className="page-transition-wrapper" style={{ animation: 'cinematicPageEnter 0.38s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {(() => {
            const currentSlug = location.pathname.replace(/^\/lpimage\/?/, '').split('/')[0] || 'home';
            const currentPage = customPages.find(p => p.slug === currentSlug) || null;

            let activeLockConfig: LockConfig | null = null;
            if (currentPage && currentPage.isLocked) {
              activeLockConfig = {
                isLocked: true,
                password: currentPage.lockPassword || globalLock?.password || '123456',
                title: currentPage.lockTitle || globalLock?.title,
                message: currentPage.lockMessage || globalLock?.message,
                contactChannel: currentPage.lockContactChannel || globalLock?.contactChannel || 'whatsapp',
                contactTarget: currentPage.lockContactTarget || globalLock?.contactTarget,
                contactText: currentPage.lockContactText || globalLock?.contactText
              };
            } else if (globalLock?.isLocked) {
              const lockCfg: any = globalLock;
              const mode = lockCfg.mode || 'all';
              const isLocked = mode === 'all' || (Array.isArray(lockCfg.lockedPages) && (
                lockCfg.lockedPages.includes(currentSlug) ||
                lockCfg.lockedPages.includes(`lpimage/${currentSlug}`) ||
                lockCfg.lockedPages.includes(`/lpimage/${currentSlug}`)
              ));

              if (isLocked) {
                const pageSpecificPassword = lockCfg.pagePasswords?.[currentSlug] || lockCfg.pagePasswords?.[`lpimage/${currentSlug}`];
                const pageSpecificTitle = lockCfg.pageTitles?.[currentSlug] || lockCfg.pageTitles?.[`lpimage/${currentSlug}`];
                const pageSpecificMessage = lockCfg.pageMessages?.[currentSlug] || lockCfg.pageMessages?.[`lpimage/${currentSlug}`];

                activeLockConfig = {
                  isLocked: true,
                  password: pageSpecificPassword || globalLock.password || '123456',
                  title: pageSpecificTitle || globalLock.title,
                  message: pageSpecificMessage || globalLock.message,
                  contactChannel: globalLock.contactChannel || 'whatsapp',
                  contactTarget: globalLock.contactTarget,
                  contactText: globalLock.contactText
                };
              }
            }

            const isCurrentUnlocked = unlockedMap[currentSlug] || isPageUnlocked(currentSlug) || isPageUnlocked(`lpimage/${currentSlug}`);

            if (activeLockConfig?.isLocked && !isCurrentUnlocked) {
              return (
                <AccessLockScreen
                  config={activeLockConfig}
                  pageKey={currentSlug}
                  pageTitle={currentPage?.name || globalTitle || 'Halaman'}
                  onUnlocked={() => setUnlockedMap(prev => ({ ...prev, [currentSlug]: true, [`lpimage/${currentSlug}`]: true }))}
                />
              );
            }

            return children;
          })()}
        </div>
      </div>

      <div 
        style={{
          position: isDesktop ? 'absolute' : 'fixed', inset: 0, zIndex: 400,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          opacity: markerOpen ? 1 : 0,
          pointerEvents: markerOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateZ(0)',
          willChange: 'opacity, backdrop-filter',
        }}
        onClick={() => setMarkerOpen(false)}
      />

      {/* Floating Controls */}
      {activeControl && (
        <div style={{
          position: isDesktop ? 'absolute' : 'fixed',
          bottom: (() => {
            if (isFullPage) return 40;
            const baseOffsets = { flat: 4, card: 28, dock: 20 };
            let sizeOffset = 0;
            if (navSettings.navSize === 'small') sizeOffset = -8;
            if (navSettings.navSize === 'large') sizeOffset = 8;
            return (baseOffsets[navSettings.navStyle] || 20) + sizeOffset;
          })(),
          left: 0, right: 0, height: 72,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          pointerEvents: 'none', zIndex: 1000, animation: 'markerSlideIn 0.3s ease'
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: (() => {
              if (navSettings.navStyle === 'flat') return 'calc(100% - 40px)';
              const itemWidth = navSettings.navSize === 'small' ? 48 : (navSettings.navSize === 'large' ? 64 : 56);
              return `${(navSettings.navMaxIcons * itemWidth) + 160}px`;
            })(), 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px', pointerEvents: 'none' 
          }}>
            <div style={{ width: 44, display: 'flex', justifyContent: 'center' }}>
              {activeControl.type === 'multiple' ? (
                <button onClick={() => handleControlAction('prev')} className="control-nav-btn"><ChevronLeft size={22} strokeWidth={2.5} /></button>
              ) : (
                <button onClick={() => handleControlAction('mute')} className="control-nav-btn">
                  {activeControl.ref?.querySelector('video')?.muted ? <VolumeX size={20} strokeWidth={2.5} /> : <Volume2 size={20} strokeWidth={2.5} />}
                </button>
              )}
            </div>
            <div style={{ width: 44, display: 'flex', justifyContent: 'center' }}>
              {activeControl.type === 'multiple' ? (
                <button onClick={() => handleControlAction('next')} className="control-nav-btn"><ChevronRight size={22} strokeWidth={2.5} /></button>
              ) : (
                <button onClick={() => handleControlAction('play')} className="control-nav-btn">
                  {activeControl.ref?.querySelector('video')?.paused ? <Play size={20} strokeWidth={2.5} fill="currentColor" /> : <Pause size={20} strokeWidth={2.5} fill="currentColor" />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Right Interaction Stack ── */}
      {!isFullPage && (
        <div
          ref={rightStackRef}
          style={{
          position: isDesktop ? 'absolute' : 'fixed',
          top: isDesktop ? 48 : 20,
          bottom: 110,
          right: 12,
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
          opacity: isDesktop ? 1 : 0,
          transform: isDesktop ? 'translateX(0)' : 'translateX(10px)',
          pointerEvents: 'none',
          transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onMouseEnter={() => { rightStackHovered.current = true; wakeRightStack(); }}
        onMouseLeave={() => { rightStackHovered.current = false; wakeRightStack(); }}
        >
          {/* Theme Toggle Button */}
          <button
            className="interaction-btn"
            style={{
              transition: 'all 0.3s ease',
              pointerEvents: 'auto',
              backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
              WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
            }}
            onClick={handleToggleTheme}
            title={isDark ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
            aria-label="Toggle Dark / Light Mode"
          >
            {isDark ? (
              <span key="sun-ml" className="theme-icon-animated"><Sun size={24} strokeWidth={2.2} color="#f59e0b" /></span>
            ) : (
              <span key="moon-ml" className="theme-icon-animated"><Moon size={24} strokeWidth={2.2} /></span>
            )}
          </button>

          <button
            className="interaction-btn"
            style={{
              background: shareToast ? 'var(--cms-accent, #7c3aed)' : undefined,
              transition: 'all 0.3s ease',
              pointerEvents: 'auto',
              backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
              WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
            }}
            onClick={async () => {
              haptic.light();
              const url = window.location.href;
              try {
                if (navigator.share) {
                  await navigator.share({ url, title: document.title });
                  haptic.success();
                } else {
                  await navigator.clipboard.writeText(url);
                  haptic.success();
                  setShareToast(true);
                  setTimeout(() => setShareToast(false), 2000);
                  
                  window.dispatchEvent(new CustomEvent('porto_island_notify', {
                    detail: { type: 'success', message: 'Tautan Tersalin!', duration: 2500 }
                  }));
                }

              } catch {}
            }}
            aria-label="Bagikan"
          >
            <Share2 size={24} strokeWidth={2.2} color={shareToast ? '#fff' : 'currentColor'} />
          </button>

          {showScrollTop && (
            <button
              className="interaction-btn"
              style={{
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: 'auto',
                backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
                WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
                animation: 'cmsPopIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => {
                haptic.light();
                pageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Scroll ke atas"
              title="Scroll ke atas"
            >
              <ArrowUp size={24} strokeWidth={2.2} />
            </button>
          )}

          <button
            className="interaction-btn print-hide"
            style={{
              transition: 'all 0.3s ease',
              pointerEvents: 'auto',
              backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
              WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              haptic.light();
              
              const container = document.querySelector('.page-scroll');
              if (container) {
                const title = document.title || 'Portfolio';
                exportToPdf(container, `${title.replace(/\s+/g, '_')}.pdf`);
              } else {
                window.print();
              }
            }}
            title="Simpan sebagai PDF"
            aria-label="Download PDF"
          >
            <Download size={24} strokeWidth={2.2} />
          </button>

          <FloatingScrollbar 
            scrollContainerRef={pageScrollRef} 
            markerOpen={markerOpen}
            onMarkerClick={() => { haptic.light(); setMarkerOpen(p => !p); }}
          />

          {shopEnabled && (
            <button 
              className={`interaction-btn${location.pathname === '/katalog' ? ' active' : ''}`} 
              style={{ 
                pointerEvents: 'auto',
                backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
                WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
              }} 
              onClick={() => { haptic.light(); navigate('/katalog'); }} 
              aria-label="Shop"
            >
              <Store size={24} strokeWidth={2.2} />
            </button>
          )}
          <button 
            className={`interaction-btn${location.pathname === '/links' ? ' active' : ''}`} 
            style={{ 
              pointerEvents: 'auto',
              backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
              WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
            }} 
            onClick={() => { haptic.light(); navigate('/links'); }} 
            aria-label="Links"
          >
            <Link size={24} strokeWidth={2.2} />
          </button>
          
          <button
            onClick={() => { haptic.light(); setContactOpen(p => !p); }}
            data-contact-btn
            className={`interaction-btn${contactOpen ? ' active' : ''}`}
            style={{ 
              position: 'relative', 
              pointerEvents: 'auto',
              backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
              WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
            }}
            aria-label="Chat"
          >
            <MessageSquareMore size={24} strokeWidth={2.2} />
            {userUnreadCount > 0 && !contactOpen && (
              <div className="premium-badge bounce-badge" style={{ top: -4, right: -4, left: 'auto', width: 18, height: 18 }}>
                {userUnreadCount > 9 ? '9+' : userUnreadCount}
              </div>
            )}
          </button>
        </div>
      )}

      <style>{`
        .bounce-badge { animation: elegantBadgeFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes elegantBadgeFadeIn { 0% { opacity: 0; transform: scale(0.7); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* ContactPanel & BottomNav stay inside shell for layout */}
      {!hideBottomNav && (
        <BottomNav 
          onContactClick={() => setContactOpen(p => !p)} 
          isContactOpen={contactOpen} 
          customPages={customPages}
          contacts={contacts}
          unreadCount={userUnreadCount}
          navSettings={activeNavSettings}
          isScrollingDown={isScrollingDown}
          onScrollDirectionChange={setIsScrollingDown}
          scrollContainerRef={pageScrollRef}
          shopEnabled={shopEnabled}
        />
      )}

      <MarkerModal isOpen={markerOpen} onClose={() => setMarkerOpen(false)} pageKey={pageKey} />

      {/* ContactPanel inside shell for correct desktop centering */}
      <ContactPanel ref={panelRef} isOpen={contactOpen && location.pathname !== '/links'} />
      <PushOptinBell />
      <PublicBroadcastPopup />
    </div>
  );
};

export default MainLayout;
