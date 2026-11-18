import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ImagePlus, Monitor, Smartphone, Video, Play, Square, Image, Box, Type, ArrowDownUp, Images, MessageSquare, Undo2, Redo2, ChevronUp, ChevronDown, Trash2, Cloud, Loader2, RotateCcw, ExternalLink, Copy, Fingerprint, History } from 'lucide-react';

/* ── thin vertical divider ──────────────────────────────── */
const Divider = () => (
  <div className="toolbox-divider" style={{ width: 1, height: 28, background: 'var(--glass-border)', flexShrink: 0, margin: '0 4px' }} />
);

/* ── icon button wrapper ─────────────────────────────────── */
const TBtn = ({ onClick, disabled, title, bg, color, children, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`sidebar-icon-btn toolbox-btn ${className}`}
    style={{
      background: bg || 'var(--cms-switcher-bg)', border: 'none', color: color || 'var(--cms-text-primary)', 
      borderRadius: '50%', padding: 0, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      transition: 'background 0.2s, transform 0.2s',
      opacity: disabled ? 0.35 : 1,
    }}
    onMouseOver={(e) => { if(!disabled && !bg) e.currentTarget.style.background = 'var(--cms-card-bg-hover)'; }}
    onMouseOut={(e) => { if(!disabled && !bg) e.currentTarget.style.background = 'var(--cms-switcher-bg)'; e.currentTarget.style.transform = 'scale(1)'; }}
    onMouseDown={(e) => { if(!disabled) e.currentTarget.style.transform = 'scale(0.9)'; }}
    onMouseUp={(e) => { if(!disabled) e.currentTarget.style.transform = 'scale(1)'; }}
  >
    {children}
  </button>
);

const Toolbox = ({
  onAddContent,
  onAddSticker,
  previewSize, onTogglePreviewSize,
  cmsMode,
  canUndo, canRedo, onUndo, onRedo,
  selectedBlockId, selectedStickerId,
  onMoveBlock, onRemoveBlock, onRemoveSticker,
  selectedIdx, totalBlocks,
  isSaving, unsavedState, onManualSave,
  onResetPage, onDeletePage,
  isSidebarOpen,
  onDuplicateBlock, onDuplicateSticker,
  activePage
}) => {
  const toolboxRef = useRef<HTMLDivElement>(null);
  const [scrollFade, setScrollFade] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  const dragStateRef = useRef({ isDown: false, startX: 0, scrollLeftInit: 0, moved: false });

  const updateScrollFade = useCallback(() => {
    const el = toolboxRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 4) {
      setScrollFade({ left: false, right: false });
      return;
    }
    setScrollFade({
      left: el.scrollLeft > 6,
      right: el.scrollLeft < maxScroll - 6,
    });
  }, []);

  useEffect(() => {
    updateScrollFade();
    window.addEventListener('resize', updateScrollFade, { passive: true });
    return () => window.removeEventListener('resize', updateScrollFade);
  }, [updateScrollFade, selectedBlockId, selectedStickerId, cmsMode, totalBlocks]);

  const maskGradient =
    scrollFade.left && scrollFade.right
      ? 'linear-gradient(to right, transparent 0%, #000 22px, #000 calc(100% - 22px), transparent 100%)'
      : scrollFade.left
        ? 'linear-gradient(to right, transparent 0%, #000 22px, #000 100%)'
        : scrollFade.right
          ? 'linear-gradient(to right, #000 0%, #000 calc(100% - 22px), transparent 100%)'
          : undefined;

  return (
    <>
      <style>{`
        /* Default button size (desktop) */
        #builder-toolbox .toolbox-btn {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          scroll-snap-align: center;
        }
        #builder-toolbox .toolbox-btn svg {
          width: 22px;
          height: 22px;
        }

        #builder-toolbox {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 5000;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          padding: 10px 14px;
          border-radius: 18px;
          border: 1px solid var(--cms-border);
          background: var(--cms-panel-bg);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: var(--cms-shadow-lg);
          width: max-content;
          max-width: min(800px, 95%);
          height: auto;
          box-sizing: border-box;
          overflow-x: auto;
          overflow-y: hidden;
          touch-action: pan-x !important;
          overscroll-behavior-x: contain !important;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch !important;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, padding 0.3s ease;
        }
        #builder-toolbox,
        #builder-toolbox * {
          touch-action: pan-x !important;
        }
        #builder-toolbox .toolbox-btn:active:not(:disabled) {
          transform: scale(0.9) !important;
          opacity: 0.82 !important;
        }
        #builder-toolbox::-webkit-scrollbar { display: none; width: 0; height: 0; }

        /* Mobile & Small Screen: floating centered bottom pill */
        @media (max-width: 768px) {
          #builder-toolbox {
            position: fixed !important;
            bottom: calc(96px + env(safe-area-inset-bottom, 16px)) !important;
            left: 50% !important;
            transform: ${isSidebarOpen ? 'translateY(200px) translateX(-50%)' : 'translateX(-50%)'} !important;
            border-radius: 999px !important;
            padding: 8px 16px !important;
            scroll-padding-inline: 16px !important;
            height: 58px !important;
            max-height: 58px !important;
            max-width: 92% !important;
            gap: 4px !important;
            align-items: center !important;
            box-shadow: 0 12px 32px -8px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.2) inset !important;
            opacity: ${isSidebarOpen ? 0 : 1} !important;
            pointer-events: ${isSidebarOpen ? 'none' : 'auto'} !important;
          }
          #builder-toolbox .toolbox-btn {
            width: 42px !important;
            height: 42px !important;
          }
          #builder-toolbox .toolbox-btn svg {
            width: 22px !important;
            height: 22px !important;
          }
          #builder-toolbox .toolbox-divider {
            height: 26px !important;
            margin: 0 6px !important;
            background: rgba(var(--cms-text-rgb, 0,0,0), 0.1) !important;
          }
        }
      `}</style>

      <div
        ref={toolboxRef}
        id="builder-toolbox"
        className="builder-toolbox-wrap"
        onScroll={updateScrollFade}
        onTouchStart={(e) => { e.stopPropagation(); }}
        onTouchMove={(e) => { e.stopPropagation(); }}
        onClickCapture={(e) => {
          if (dragStateRef.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            dragStateRef.current.moved = false;
          }
        }}
        onMouseDown={(e) => {
          const slider = toolboxRef.current;
          if (!slider) return;
          dragStateRef.current = {
            isDown: true,
            startX: e.pageX - slider.offsetLeft,
            scrollLeftInit: slider.scrollLeft,
            moved: false,
          };
        }}
        onMouseLeave={() => { dragStateRef.current.isDown = false; }}
        onMouseUp={() => { dragStateRef.current.isDown = false; }}
        onMouseMove={(e) => {
          const slider = toolboxRef.current;
          const st = dragStateRef.current;
          if (!st.isDown || !slider) return;
          const x = e.pageX - slider.offsetLeft;
          const delta = x - st.startX;
          if (Math.abs(delta) > 5) st.moved = true;
          if (!st.moved) return;
          e.preventDefault();
          slider.scrollLeft = st.scrollLeftInit - delta * 1.4;
        }}
        style={{
          cursor: 'grab',
          scrollSnapType: 'x proximity',
          ...(maskGradient ? { maskImage: maskGradient, WebkitMaskImage: maskGradient } : {}),
        }}
      >

        {/* ── Save ──────────────────────────────────────────── */}
        <button
          onClick={onManualSave}
          disabled={isSaving}
          title={isSaving ? 'Menyinkronkan...' : unsavedState ? 'Simpan Perubahan (Ctrl+S)' : 'Semua Tersimpan (Ctrl+S)'}
          className="toolbox-btn"
          style={{
            position: 'relative',
            borderRadius: '50%', border: 'none',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.25s ease',
            transform: 'scale(1)',
            background: isSaving
              ? 'linear-gradient(135deg,rgba(var(--cms-accent-rgb),0.2),rgba(6,182,212,0.2))'
              : unsavedState ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.15)',
            color: isSaving ? 'var(--cms-accent,#7c3aed)'
              : unsavedState ? '#f97316' : '#22c55e',
          }}
        >
          {isSaving
            ? <Loader2 size={24} style={{ animation: 'spin 1.2s linear infinite' }} />
            : <Cloud size={24} />}
          <span style={{
            position: 'absolute', top: 6, right: 6, width: 8, height: 8,
            borderRadius: '50%',
            background: isSaving ? '#06b6d4' : unsavedState ? '#f97316' : '#22c55e',
            border: '1.5px solid var(--cms-panel-bg)',
            animation: unsavedState && !isSaving ? 'pulseUnsaved 1.5s infinite ease-in-out' : 'none',
          }} />
        </button>

        <Divider />

        {/* ── Undo / Redo / History ────────────────────────── */}
        <TBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 size={24} />
        </TBtn>
        <TBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          <Redo2 size={24} />
        </TBtn>
        <TBtn onClick={() => window.dispatchEvent(new Event('cms_open_version_history'))} title="Riwayat Versi Halaman (Time Travel)">
          <History size={22} />
        </TBtn>

        <Divider />

        {/* ── Preview Site ──────────────────────────────────── */}
        <a 
          href={`/lpimage/${activePage || 'home'}?preview=true`}
          target="_blank" rel="noopener noreferrer"
          title="Live Preview Halaman Ini"
          className="sidebar-icon-btn toolbox-btn"
          style={{
            position: 'relative', borderRadius: '50%',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
            transition: 'all 0.15s ease', textDecoration: 'none'
          }}
        >
          <ExternalLink size={24} />
        </a>

        <Divider />

        {/* ── Content Tools  (orange) ───────────────────────── */}
        <TBtn onClick={() => onAddContent('image')} title="Tambah Konten Gambar"
          bg="rgba(249,115,22,0.12)" color="#f97316"><ImagePlus size={24}/></TBtn>
        <TBtn onClick={() => onAddContent('video')} title="Tambah Konten Video"
          bg="rgba(249,115,22,0.12)" color="#f97316"><Video size={24}/></TBtn>
        <TBtn onClick={() => onAddContent('youtube')} title="Tambah Konten YouTube"
          bg="rgba(249,115,22,0.12)" color="#f97316"><Play size={24}/></TBtn>
        <TBtn onClick={() => onAddContent('solid')} title="Tambah Warna Solid"
          bg="rgba(249,115,22,0.12)" color="#f97316"><Square size={24}/></TBtn>
        <TBtn onClick={() => onAddContent('spacer')} title="Tambah Pemisah"
          bg="rgba(249,115,22,0.12)" color="#f97316"><ArrowDownUp size={24}/></TBtn>
        <TBtn onClick={() => onAddContent('carousel')} title="Tambah Carousel"
          bg="rgba(249,115,22,0.12)" color="#f97316"><Images size={24}/></TBtn>
        <TBtn onClick={() => onAddContent('form')} title="Tambah Formulir"
          bg="rgba(249,115,22,0.12)" color="#f97316"><MessageSquare size={24}/></TBtn>
        <TBtn onClick={() => onAddContent('biodata')} title="Tambah Biodata"
          bg="rgba(249,115,22,0.12)" color="#f97316"><Fingerprint size={24}/></TBtn>

        <Divider />

        {/* ── Sticker Tools  (purple) ───────────────────────── */}
        <TBtn onClick={() => onAddSticker('image')} title="Stiker Gambar"
          bg="rgba(var(--cms-accent-rgb),0.12)" color="#7c3aed"><Image size={24}/></TBtn>
        <TBtn onClick={() => onAddSticker('video')} title="Stiker Video"
          bg="rgba(var(--cms-accent-rgb),0.12)" color="#7c3aed"><Video size={24}/></TBtn>
        <TBtn onClick={() => onAddSticker('youtube')} title="Stiker YouTube"
          bg="rgba(var(--cms-accent-rgb),0.12)" color="#7c3aed"><Play size={24}/></TBtn>
        <TBtn onClick={() => onAddSticker('button')} title="Stiker Tombol"
          bg="rgba(var(--cms-accent-rgb),0.12)" color="#7c3aed"><Box size={24}/></TBtn>
        <TBtn onClick={() => onAddSticker('text')} title="Stiker Teks"
          bg="rgba(var(--cms-accent-rgb),0.12)" color="#7c3aed"><Type size={24}/></TBtn>

        {/* ── Contextual: Block selected ────────────────────── */}
        {(selectedBlockId || selectedStickerId) && (
          <>
            <Divider />
            {cmsMode === 'content' && selectedBlockId && (
              <>
                <TBtn onClick={() => onMoveBlock(selectedBlockId, 'up')} disabled={selectedIdx <= 0} title="Pindah ke Atas">
                  <ChevronUp size={24}/>
                </TBtn>
                <TBtn onClick={() => onMoveBlock(selectedBlockId, 'down')} disabled={selectedIdx >= totalBlocks - 1} title="Pindah ke Bawah">
                  <ChevronDown size={24}/>
                </TBtn>
                <TBtn onClick={() => onDuplicateBlock?.(selectedBlockId)} title="Duplikat Blok (Ctrl+D)">
                  <Copy size={24}/>
                </TBtn>
                <TBtn onClick={() => onRemoveBlock(selectedBlockId)} title="Hapus Blok (Del / Backspace)" className="danger">
                  <Trash2 size={24}/>
                </TBtn>
              </>
            )}
            {cmsMode === 'sticker' && selectedStickerId && (
              <>
                <TBtn onClick={() => onDuplicateSticker?.(selectedStickerId)} title="Duplikat Stiker (Ctrl+D)">
                  <Copy size={24}/>
                </TBtn>
                <TBtn onClick={() => onRemoveSticker(selectedStickerId)} title="Hapus Stiker (Del / Backspace)" className="danger">
                  <Trash2 size={24}/>
                </TBtn>
              </>
            )}
          </>
        )}

        {/* ── Page Actions (no selection) ───────────────────── */}
        {!selectedBlockId && !selectedStickerId && (
          <>
            <Divider />
            <TBtn onClick={onResetPage} title="Reset Konten Halaman" className="warning">
              <RotateCcw size={24}/>
            </TBtn>
            {onDeletePage && (
              <TBtn onClick={onDeletePage} title="Hapus Halaman" className="danger">
                <Trash2 size={24}/>
              </TBtn>
            )}
          </>
        )}

        <Divider />

        {/* ── Preview toggle ────────────────────────────────── */}
        <TBtn onClick={onTogglePreviewSize}
          title={previewSize === 'mobile' ? 'Mode Desktop' : 'Mode Mobile'}>
          {previewSize === 'mobile' ? <Monitor size={24}/> : <Smartphone size={24}/>}
        </TBtn>

      </div>
    </>
  );
};

export default Toolbox;
