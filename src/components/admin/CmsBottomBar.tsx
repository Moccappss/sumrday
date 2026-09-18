import React, { useEffect, useRef } from 'react';
import { Save, Monitor, Smartphone, House, LayoutGrid, User, Settings, Plus, Layout, Layers, Moon, Sun } from 'lucide-react';

const LEFT_PAGES = [
  { key: 'home',       icon: <House size={28} strokeWidth={2.4} /> },
  { key: 'portofolio', icon: <LayoutGrid size={28} strokeWidth={2.4} /> },
  { key: 'biodata',    icon: <User size={28} strokeWidth={2.4} /> },
];

const CmsBottomBar = ({ 
  activePage, onSwitchPage, onSave, onAddClick, 
  customPages = [], 
  cmsMode, onModeChange,
  previewSize, onTogglePreviewSize,
  isSaving,

  canUndo, onUndo, canRedo, onRedo,
  isDarkMode, onToggleDarkMode
}) => {
  const leftDockRef  = useRef(null);
  const rightDockRef = useRef(null);

  const ALL_PAGES = [
    ...LEFT_PAGES.map(lp => {
      const settings = customPages.find(p => p.slug === lp.key);
      if (settings && !settings.showInNav) return null;
      return { ...lp, isPublished: settings ? settings.isPublished : true };
    }),
    ...customPages.filter(p => !p.isSystem && p.showInNav).map(p => ({
      key: p.slug,
      icon: p.iconSvg ? (
        <div 
          className="cms-icon-wrapper" 
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          dangerouslySetInnerHTML={{ __html: p.iconSvg }} 
        />
      ) : <Layout size={28} strokeWidth={2.4} />,
      isCustom: true,
      isPublished: p.isPublished
    }))
  ].filter(Boolean);

  const activeIndex = ALL_PAGES.findIndex(p => p.key === activePage);

  // Right dock: preview(0) save(1) pages(2) settings(3)
  const getRightIndicatorPos = () => {
    if (cmsMode === 'pages') return 2 * 68;  // pages btn index=2
    if (activePage === 'settings' && cmsMode !== 'pages') return 3 * 68; // settings btn index=3
    return -1;
  };
  const rightIdx = getRightIndicatorPos();

  /* ── Mouse drag-to-scroll ── */
  useEffect(() => {
    const setupDrag = (el) => {
      if (!el) return;

      let isDown = false, startX, scrollLeft, moved = false;

      const onDown = (e) => {
        // Skip drag if mousedown is on an interactive element — let click propagate normally
        if (e.target.closest('button, a, [role="button"], input')) return;
        isDown = true; moved = false;
        el.classList.add('grabbing');
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
      };
      const onLeave = () => { isDown = false; el.classList.remove('grabbing'); };
      // Do NOT call preventDefault on mouseup — it would block click events on child buttons
      const onUp = () => { isDown = false; el.classList.remove('grabbing'); };
      const onMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 5) moved = true;
        el.scrollLeft = scrollLeft - walk;
      };

      el.addEventListener('mousedown', onDown);
      window.addEventListener('mouseleave', onLeave);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('mousemove', onMove);
      return () => {
        el.removeEventListener('mousedown', onDown);
        window.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('mousemove', onMove);
      };
    };
    const cl = setupDrag(leftDockRef.current);
    const cr = setupDrag(rightDockRef.current);
    return () => { cl?.(); cr?.(); };
  }, []);

  /* ── Auto-scroll to active page ── */
  useEffect(() => {
    if (leftDockRef.current && activeIndex !== -1) {
      const items = leftDockRef.current.querySelectorAll('.dock-item');
      const activeItem = items[activeIndex];
      if (activeItem) {
        const c = leftDockRef.current;
        c.scrollTo({ left: activeItem.offsetLeft - (c.offsetWidth/2) + (activeItem.offsetWidth/2), behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  return (
    <div className="top-nav-wrapper" style={{ top: 20 }}>

      {/* LEFT: Page nav */}
      <div className="bottom-nav-dock cms-page-nav" ref={leftDockRef}>
        <div className="dock-indicator" style={{
          transform: (activeIndex === -1 || cmsMode === 'pages') ? 'scale(0)' : `translateX(${activeIndex * 68}px)`,
          opacity:   (activeIndex === -1 || cmsMode === 'pages') ? 0 : 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }} />
        {ALL_PAGES.map(p => (
          <button
            key={p.key}
            className={`dock-item${activePage === p.key ? ' active' : ''}`}
            onClick={() => onSwitchPage(p.key)}
            title={p.key}
            aria-label={`Buka halaman ${p.key}`}
            style={{ opacity: p.isPublished === false ? 0.5 : 1 }}
          >
            <div className="dock-icon">{p.icon}</div>
          </button>
        ))}
      </div>

        {/* CENTER: Plus */}
        <button
          onClick={() => {
            if (onAddClick) onAddClick();
            window.dispatchEvent(new Event('cms_global_add'));
          }}
          className="contact-circle"
        title="Tambah"
        aria-label="Tambah item"
        style={{ 
          background: 'linear-gradient(135deg, #4f46e5, var(--cms-accent, #7c3aed))',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.4)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onMouseOver={e => { e.currentTarget.style.transform='scale(1.05) translateY(-2px)'; }}
        onMouseOut={e  => { e.currentTarget.style.transform='scale(1) translateY(0)'; }}
      >
        <div className="dock-icon-large" style={{ display:'flex', fontSize:36 }}>+</div>
      </button>

      {/* RIGHT: Actions — preview | darkmode | save | pages | settings */}
      <div className="bottom-nav-dock" ref={rightDockRef} style={{ maxWidth: 350 }}>
        <div className="dock-indicator" style={{
          transform: rightIdx === -1 ? 'scale(0)' : `translateX(${rightIdx}px)`,
          opacity:   rightIdx === -1 ? 0 : 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }} />

        <button onClick={onTogglePreviewSize} className="dock-item"
          title={previewSize === 'mobile' ? 'Mode Desktop' : 'Mode Mobile'}
          aria-label={previewSize === 'mobile' ? 'Beralih ke mode desktop' : 'Beralih ke mode mobile'}>
          <div className="dock-icon" style={{ color: previewSize==='desktop' ? 'var(--cms-accent, #7c3aed)' : 'inherit' }}>
            {previewSize === 'mobile'
              ? <Monitor   size={28} strokeWidth={2.4} />
              : <Smartphone size={28} strokeWidth={2.4} />}
          </div>
        </button>

        <button onClick={onToggleDarkMode} className="dock-item"
          title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          aria-label={isDarkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}>
          <div className="dock-icon" style={{ color: isDarkMode ? '#f59e0b' : 'inherit' }}>
            {isDarkMode 
              ? <Sun size={28} strokeWidth={2.4} /> 
              : <Moon size={28} strokeWidth={2.4} />}
          </div>
        </button>



        <button onClick={onSave} className="dock-item" title="Simpan (Ctrl+S)" aria-label="Simpan perubahan" disabled={isSaving}>
          <div className="dock-icon">
            {isSaving ? <div className="cms-loader-small" /> : <Save size={28} strokeWidth={2.4} />}
          </div>
        </button>

        <button onClick={() => onModeChange(cmsMode === 'pages' ? 'content' : 'pages')}
          className={`dock-item${cmsMode === 'pages' ? ' active' : ''}`}
          title="Manajemen Halaman"
          aria-label="Beralih ke manajemen halaman">
          <div className="dock-icon"><Layers size={28} strokeWidth={2.4} /></div>
        </button>

        <button onClick={() => onSwitchPage('settings')}
          className={`dock-item${activePage==='settings' && cmsMode !== 'pages' ? ' active' : ''}`}
          title="Pengaturan"
          aria-label="Buka pengaturan">
          <div className="dock-icon"><Settings size={28} strokeWidth={2.4} /></div>
        </button>
      </div>
    </div>
  );
};

export default CmsBottomBar;
