import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown, Trash2, Upload, Link2, Play, Bookmark, Plus, X, ImageIcon, ChevronLeft, ChevronRight, Copy, FlipHorizontal, Maximize2, RotateCw, FileText } from 'lucide-react';

import { storage } from '../../utils/storage';
import DOMPurify from 'dompurify';
import BiodataWidget from '../public/BiodataWidget';
import Model3DViewer from '../common/Model3DViewer';
import { useScrollReveal } from '../../hooks/useScrollReveal';

import { extractYouTubeId, ensureAbsoluteUrl, getOptimizedUrl, hexToRgba, buildStickerFilter } from '../renderer/utils';
import BottomNav from '../navigation/BottomNav';

let mkCounter = Date.now();
const newMkId = () => `mk-${++mkCounter}`;

const StickerHandleItem = React.memo(({ sticker, isSelected, onSelect, onUpdate, onDuplicate, onRemove, onReorder, frameRef, scrollPos, cmsMode, index, total, style, onModeChange, stickerVisibility }) => {
  const drag   = useRef(null);
  const resize = useRef(null);
  const rotate = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const getXY = (e) => (e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY });

  // On-demand move/up listeners: only attached when actively dragging/resizing/rotating
  useEffect(() => {
    if (!isInteracting) return;

    let rafId = null;

    const onMove = (e) => {
      if (!drag.current && !resize.current && !rotate.current) return;
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        const rect = frameRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { x, y } = getXY(e);

        if (drag.current) {
          const cursorXInFrame = ((x - rect.left) / rect.width) * 100;
          const newX = Math.max(-10, Math.min(110, cursorXInFrame - (drag.current.offX || 0)));

          const scrollEl = frameRef.current.querySelector('.cms-preview-scroll');
          if (!scrollEl) return;
          const scrollRect = scrollEl.getBoundingClientRect();

          // Auto-scroll when dragging near top or bottom edges
          const scrollZone = 50;
          const scrollSpeed = 8;
          if (y > scrollRect.bottom - scrollZone && scrollEl.scrollTop < scrollEl.scrollHeight - scrollEl.clientHeight) {
            scrollEl.scrollTop += scrollSpeed;
          } else if (y < scrollRect.top + scrollZone && scrollEl.scrollTop > 0) {
            scrollEl.scrollTop -= scrollSpeed;
          }

          const cursorYInScroll = (y - scrollRect.top) + scrollEl.scrollTop;
          const targetYInScroll = cursorYInScroll - (drag.current.offY || 0);

          const allBlocks = Array.from(scrollEl.querySelectorAll('.img-block-wrapper'));

          if (allBlocks.length === 0) {
            // Empty page without blocks: allow flexible dragging in viewport
            const totalH = Math.max(scrollEl.clientHeight, 400);
            const relativeY = Math.max(-10, Math.min(120, (targetYInScroll / totalH) * 100));
            onUpdate(sticker.id, { x: newX, y: relativeY, blockId: null });
          } else {
            const blockDataList = allBlocks.map(el => {
              const bRect = el.getBoundingClientRect();
              const top = (bRect.top - scrollRect.top) + scrollEl.scrollTop;
              const height = Math.max(bRect.height, 1);
              return {
                id: el.getAttribute('data-block-id'),
                top,
                height,
                bottom: top + height
              };
            });

            let bestBlock = blockDataList[0];

            if (targetYInScroll < blockDataList[0].top) {
              bestBlock = blockDataList[0];
            } else if (targetYInScroll >= blockDataList[blockDataList.length - 1].bottom) {
              bestBlock = blockDataList[blockDataList.length - 1];
            } else {
              for (let i = 0; i < blockDataList.length; i++) {
                const b = blockDataList[i];
                const nextB = blockDataList[i + 1];
                const nextTop = nextB ? nextB.top : Infinity;
                if (targetYInScroll >= b.top && targetYInScroll < nextTop) {
                  bestBlock = b;
                  break;
                }
              }
            }

            const relativeY = ((targetYInScroll - bestBlock.top) / bestBlock.height) * 100;
            onUpdate(sticker.id, { x: newX, y: relativeY, blockId: bestBlock.id });
          }
        }

        if (resize.current) {
          const dx  = x - resize.current.sx;
          const scl = 320 / rect.width;
          onUpdate(sticker.id, { width: Math.max(20, Math.min(280, resize.current.ow + dx * scl)) });
        }

        if (rotate.current) {
          const angle = Math.atan2(y - rotate.current.cy, x - rotate.current.cx) * (180 / Math.PI) + 90;
          onUpdate(sticker.id, { rotation: Math.round(angle) });
        }
      });
    };
    
    const onUp = () => { 
      drag.current = null; resize.current = null; rotate.current = null; 
      if (rafId) cancelAnimationFrame(rafId);
      setIsInteracting(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isInteracting, sticker, onUpdate, frameRef]);

  const onBodyDown = (e) => {
    e.stopPropagation();
    if (cmsMode !== 'sticker') onModeChange?.('sticker');
    onSelect(sticker.id);
    
    const { x, y } = getXY(e);
    const rect = frameRef.current?.getBoundingClientRect();
    const scrollEl = frameRef.current?.querySelector('.cms-preview-scroll');
    
    if (rect && scrollEl) {
      const scrollRect = scrollEl.getBoundingClientRect();
      const cursorYInScroll = (y - scrollRect.top) + scrollEl.scrollTop;
      const cursorXInFrame = ((x - rect.left) / rect.width) * 100;

      const targetBlockEl = scrollEl.querySelector(`[data-block-id="${sticker.blockId}"]`);
      let blockTopInScroll = 0;
      let blockHeight = scrollEl.clientHeight || 400;

      if (targetBlockEl) {
        const bRect = targetBlockEl.getBoundingClientRect();
        blockTopInScroll = (bRect.top - scrollRect.top) + scrollEl.scrollTop;
        blockHeight = Math.max(bRect.height, 1);
      }

      const offsetX = cursorXInFrame - (sticker.x ?? 10);
      const stickerYInScroll = blockTopInScroll + ((sticker.y ?? 0) / 100) * blockHeight;
      const offsetYInPx = cursorYInScroll - stickerYInScroll;
      
      drag.current = { sx: x, sy: y, ox: sticker.x ?? 10, oy: sticker.y ?? 0, offX: offsetX, offY: offsetYInPx };
      setIsInteracting(true);
    }
  };
  const onResizeDown = (e) => {
    e.stopPropagation(); e.preventDefault();
    const { x } = getXY(e);
    resize.current = { sx: x, ow: sticker.width ?? 80 };
    setIsInteracting(true);
  };
  const onRotateDown = (e) => {
    e.stopPropagation(); e.preventDefault();
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const w   = sticker.width ?? 80;
    const rw  = w * (rect.width / 320);         // rendered width on screen
    const rh  = rw;                              // approx rendered height
    const cx  = rect.left + (sticker.x ?? 10) / 100 * rect.width  + rw / 2;
    const cy  = rect.top  + (sticker.y ?? 10) / 100 * rect.height + rh / 2;
    rotate.current = { cx, cy };
    setIsInteracting(true);
  };

  const idleClass = !isSelected && sticker.animation && sticker.animation !== 'none'
    ? `stk-anim-${sticker.animation}` : '';
  const maskClass = sticker.mask && sticker.mask !== 'none' ? `stk-mask-${sticker.mask}` : '';

  // Ukuran stiker dihitung sebagai persentase dari lebar canvas referensi (320px)
  const widthPct = ((sticker.width ?? 80) / 320) * 100;
  
  const maskRad = sticker.maskRadius ?? 2;
  const dynamicMaskStyle = sticker.mask === 'rounded' 
    ? { clipPath: `inset(0 round ${maskRad}rem)` }
    : sticker.mask === 'squircle'
    ? { clipPath: `inset(0 round ${maskRad * 1.8}rem)`, aspectRatio: '1/1', objectFit: 'cover' }
    : {};

  // Inner shadow logic
  const innerShadow = sticker.shadow === 'inner' 
    ? `inset ${sticker.shadowX ?? 0}px ${sticker.shadowY ?? 5}px ${sticker.shadowBlur ?? 10}px ${sticker.shadowColor || 'rgba(0,0,0,0.35)'}`
    : undefined;

  // Final top position relative to the scroll container
  const scrollEl = frameRef.current?.querySelector('.cms-preview-scroll');
  const blockEl = frameRef.current?.querySelector(`[data-block-id="${sticker.blockId}"]`);
  let topPx = 0;
  if (blockEl && scrollEl) {
    const bRect = blockEl.getBoundingClientRect();
    const sRect = scrollEl.getBoundingClientRect();
    const blockTopInScroll = (bRect.top - sRect.top) + (scrollPos || 0);
    topPx = blockTopInScroll + ((sticker.y ?? 0) / 100) * bRect.height;
  } else if (scrollEl) {
    const sRect = scrollEl.getBoundingClientRect();
    topPx = ((sticker.y ?? 20) / 100) * (sRect.height || 400);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${sticker.x ?? 10}%`,
        top: 0,
        width: sticker.type === 'button' ? 'fit-content' : `${widthPct}%`,
        minWidth: sticker.type === 'button' ? `${widthPct}%` : undefined,
        whiteSpace: sticker.type === 'button' ? 'nowrap' : 'normal',
        maxWidth: '100%',
        transform: `translateY(${topPx - scrollPos}px) rotate(${sticker.rotation ?? 0}deg)`,
        transformOrigin: 'center center',
        opacity: sticker.opacity ?? 1,
        filter: buildStickerFilter(sticker),
        cursor: isSelected ? 'move' : 'pointer',
        zIndex: isSelected ? 999 : (total - index) * 10,
        userSelect: 'none',
        touchAction: 'none',
        pointerEvents: stickerVisibility === 'hidden' ? 'none' : 'auto',
        transition: isSelected ? 'none' : (style?.transition || 'opacity 0.2s, transform 0.2s'),
        ...style,
        // Override style transition if selected to ensure no lag during drag
        ...(isSelected ? { transition: 'none' } : {})
      }}
      draggable={false}
      onMouseDown={onBodyDown}
      onTouchStart={onBodyDown}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Floating Toolbar */}
      {isSelected && (
        <div className="stk-toolbar" onMouseDown={e => e.stopPropagation()}>
          <button className="stk-toolbar-btn" onClick={() => onDuplicate(sticker.id)} title="Gandakan (Duplicate)">
            <Copy size={14} />
          </button>
          <button className="stk-toolbar-btn" onClick={() => onUpdate(sticker.id, { flipX: !sticker.flipX })} title="Balik Horizontal">
            <FlipHorizontal size={14} />
          </button>
          
          <div className="stk-toolbar-divider" />
          
          <button className="stk-toolbar-btn" onClick={() => onReorder(sticker.id, 'up')} title="Pindah ke Depan (Bring to Front)" disabled={index === 0}>
            <ChevronUp size={16} />
          </button>
          <button className="stk-toolbar-btn" onClick={() => onReorder(sticker.id, 'down')} title="Pindah ke Belakang (Send to Back)" disabled={index === total - 1}>
            <ChevronDown size={16} />
          </button>
          
          <div className="stk-toolbar-divider" />
          
          <button className="stk-toolbar-btn danger" onClick={() => onRemove(sticker.id)} title="Hapus Stiker">
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div 
        className={idleClass} 
        style={{ 
          width: '100%', 
          height: 'auto',
          transform: sticker.flipX ? 'scaleX(-1)' : 'none',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {(sticker.type || 'image') === 'image' ? (
          sticker.imageData ? (
            (sticker.isSvg || (typeof sticker.imageData === 'string' && sticker.imageData.trim().startsWith('<svg')))
              ? <div 
                  className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''} 
                  style={{ width:'100%', height: '100%', pointerEvents:'none', boxShadow: innerShadow, ...dynamicMaskStyle }} 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sticker.imageData) }}
                />
              : <img 
                  className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''} 
                  src={getOptimizedUrl(sticker.imageData, 400)} 
                  alt="" 
                  draggable={false} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (sticker.imageData && e.currentTarget.src !== sticker.imageData) {
                      e.currentTarget.src = sticker.imageData;
                    }
                  }}
                  style={{ 
                    width:'100%', 
                    height: (sticker.mask && sticker.mask !== 'none' && sticker.mask !== 'rounded') ? '100%' : 'auto', 
                    display: 'block', 
                    pointerEvents: 'none', 
                    boxShadow: innerShadow,
                    objectFit: (sticker.mask && sticker.mask !== 'none' && sticker.mask !== 'rounded') ? 'cover' : 'contain',
                    ...dynamicMaskStyle
                  }}
                />
          ) : (
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.4)', backdropFilter:'blur(10px)', border:'2px dashed rgba(0,0,0,0.1)', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
              <ImageIcon size={24} color="rgba(0,0,0,0.3)" />
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.3)', marginTop:4 }}>GAMBAR</div>
            </div>
          )
        ) : sticker.type === 'button' ? (
          <div 
            className="stk-btn"
            style={{ 
              width:'100%', 
              padding: '0.8em 1.2em',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center',
              background: sticker.btnBgType === 'image' 
                ? (sticker.imageData ? `url(${getOptimizedUrl(sticker.imageData, 400)}) center/cover` : 'rgba(0,0,0,0.1)')
                : hexToRgba(sticker.btnColor || 'var(--cms-accent, #7c3aed)', sticker.btnFillOpacity ?? 1),
              borderRadius: sticker.btnShape === 'pill' ? 9999 : sticker.btnShape === 'circle' ? '50%' : sticker.btnShape === 'rectangle' ? 0 : '1.2rem',
              aspectRatio: sticker.btnShape === 'circle' ? '1/1' : 'auto',
              color: sticker.textColor || '#fff',
              fontSize: '14cqw',
              fontWeight: 800,
              lineHeight: 1,
              border: `${sticker.btnBorderWidth ?? 1.5}px solid ${sticker.btnBorderColor || 'rgba(255,255,255,0.2)'}`,
              backdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
              WebkitBackdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
              boxShadow: innerShadow || '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {sticker.btnText || 'KLIK DISINI'}
          </div>
        ) : sticker.type === 'text' ? (
          (() => {
            const baseFontSize = sticker.fontSize || (sticker.textMode === 'title' ? 32 : 16);
            const fontSizeCqw = (baseFontSize / 320) * 100;
            return (
              <div style={{
                width: '100%',
                overflow: sticker.textMode === 'marquee' || sticker.marquee ? 'hidden' : 'visible',
                color: sticker.textColor || '#000',
                fontFamily: sticker.fontFamily || 'inherit',
                fontSize: `${fontSizeCqw}cqw`,
                fontWeight: sticker.fontWeight || (sticker.textMode === 'title' ? 800 : 400),
                textAlign: sticker.textAlign || 'left',
                lineHeight: sticker.lineHeight || 1.5,
                whiteSpace: sticker.textMode === 'marquee' || sticker.marquee ? 'nowrap' : 'pre-wrap',
                textShadow: sticker.textShadow ? `2px 2px 4px rgba(0,0,0,0.5)` : 'none',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}>
                {(sticker.textMode === 'marquee' || sticker.marquee) ? (
                  <div style={{
                    display: 'inline-block',
                    paddingLeft: '100%',
                    animation: `marquee ${sticker.marqueeSpeed || 10}s linear infinite`
                  }}>
                    {sticker.text || 'Teks Berjalan'}
                  </div>
                ) : sticker.textMode === 'title' ? (
                  <h1 style={{ margin: 0, padding: 0, fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', textAlign: 'inherit', lineHeight: 'inherit' }}>
                    {sticker.text || 'Judul Baru'}
                  </h1>
                ) : (
                  <div>{sticker.text || 'Masukkan teks Anda'}</div>
                )}
                {(sticker.textMode === 'marquee' || sticker.marquee) && (
                  <style>
                    {`
                      @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-100%); }
                      }
                    `}
                  </style>
                )}
              </div>
            );
          })()
        ) : (
          sticker.youtubeId ? (
            <div 
              className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''}
              style={{ width: '100%', aspectRatio: sticker.aspectRatio || '16/9', position: 'relative', overflow: 'hidden', ...dynamicMaskStyle, boxShadow: innerShadow }}
            >
              <img 
                src={`https://img.youtube.com/vi/${sticker.youtubeId}/mqdefault.jpg`} 
                alt="" 
                onError={(e) => {
                  if (!e.currentTarget.src.includes('hqdefault')) {
                    e.currentTarget.src = `https://img.youtube.com/vi/${sticker.youtubeId}/hqdefault.jpg`;
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <Play size={20} color="#fff" />
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.4)', backdropFilter:'blur(10px)', border:'2px dashed rgba(0,0,0,0.1)', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
              <Play size={24} color="rgba(0,0,0,0.3)" />
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(0,0,0,0.3)', marginTop:4 }}>YOUTUBE</div>
            </div>
          )
        )}
      </div>

      {isSelected && (

        <>
          <div className="stk-selection-ring"/>
          <div className="stk-handle-resize" onMouseDown={onResizeDown} onTouchStart={onResizeDown}>
            <Maximize2 size={10} color="var(--cms-accent, #7c3aed)" strokeWidth={3} />
          </div>
          <div className="stk-handle-rotate"  onMouseDown={onRotateDown} onTouchStart={onRotateDown}>
            <RotateCw size={10} color="#fff" strokeWidth={3} />
          </div>
        </>
      )}
    </div>
  );
});

const PreviewParallaxMedia = React.memo(({ block, getOptimizedUrl, isVid, isYt }) => {
  const containerRef = useRef(null);
  const mediaRef = useRef(null);

  // Set --scroll-h on mount and resize so sticky height is always correct
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScrollH = () => {
      if (!containerRef.current) return;
      const scrollParent = containerRef.current.closest('.cms-preview-scroll') || window;
      const h = scrollParent.clientHeight || window.innerHeight;
      containerRef.current.style.setProperty('--scroll-h', `${h}px`);
    };
    updateScrollH();
    window.addEventListener('resize', updateScrollH);
    return () => window.removeEventListener('resize', updateScrollH);
  }, [block.parallaxMode, block.parallaxScrollLength]);

  useEffect(() => {
    let rafId;
    let currentPct = 0;
    let targetPct = 0;
    let isLoopRunning = false;

    const lerpLoop = () => {
      const ease = 0.08; // LERP smoothing factor
      const diff = targetPct - currentPct;
      
      if (Math.abs(diff) > 0.001) {
        currentPct += diff * ease;
        const vid = mediaRef.current;
        if (vid && vid.duration && !isNaN(vid.duration)) {
          const targetTime = currentPct * vid.duration;
          // Optimize seeking frequency by gating with the hardware seeking state
          if (!vid.seeking && Math.abs(vid.currentTime - targetTime) > 0.01) {
            vid.currentTime = targetTime;
          }
        }
        rafId = requestAnimationFrame(lerpLoop);
      } else {
        currentPct = targetPct;
        const vid = mediaRef.current;
        if (vid && vid.duration && !isNaN(vid.duration)) {
          if (!vid.seeking) {
            vid.currentTime = targetPct * vid.duration;
          }
        }
        isLoopRunning = false;
      }
    };

    const handleScroll = () => {
      if (!containerRef.current || !mediaRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const scrollParent = containerRef.current.closest('.cms-preview-scroll') || window;
      
      const viewHeight = scrollParent.clientHeight || window.innerHeight;
      containerRef.current.style.setProperty('--scroll-h', `${viewHeight}px`);
      const topOffset = scrollParent.getBoundingClientRect ? scrollParent.getBoundingClientRect().top : 0;
      
      const elemTop = rect.top - topOffset;
      const elemBottom = rect.bottom - topOffset;
      
      if (isVid && block.parallaxScrollLength) {
         if (block.parallaxMode === 'sticky') {
           const scrollDist = -elemTop; 
           const maxScroll = rect.height - viewHeight; 
           
           if (maxScroll > 0) {
             let pct = scrollDist / maxScroll;
             targetPct = Math.max(0, Math.min(1, pct));
             
             if (!isLoopRunning) {
               isLoopRunning = true;
               rafId = requestAnimationFrame(lerpLoop);
             }
           }
         } else {
           const totalDist = viewHeight + rect.height;
           const currentDist = viewHeight - elemTop;
           
           if (totalDist > 0) {
             let pct = currentDist / totalDist;
             targetPct = Math.max(0, Math.min(1, pct));
             
             if (!isLoopRunning) {
               isLoopRunning = true;
               rafId = requestAnimationFrame(lerpLoop);
             }
           }
         }
      } else {
          // Regular Parallax Logic for images / non-seeking video scaling
          if (elemTop <= viewHeight && elemBottom >= 0) {
            const totalDist = viewHeight + rect.height;
            const currentDist = viewHeight - elemTop;
            const pct = currentDist / totalDist;
            const yOffset = (pct - 0.5) * 20; 
            
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              if (mediaRef.current) {
                mediaRef.current.style.transform = `scale(1.2) translateY(${yOffset}%)`;
              }
            });
          }
      }
    };
    
    const scrollParent = containerRef.current.closest('.cms-preview-scroll');
    if (scrollParent) {
      scrollParent.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
    
    return () => {
      if (scrollParent) scrollParent.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };

  }, [isVid, block.parallaxScrollLength]);

  if (isVid && block.parallaxScrollLength) {
    if (block.parallaxMode === 'sticky') {
      const scrollLength = block.parallaxScrollLength || 200;
      return (
        <div ref={containerRef} style={{ width: '100%', height: `calc(var(--scroll-h, 100vh) * ${scrollLength / 100})`, position: 'relative', background: '#000' }}>
          <div style={{ position: 'sticky', top: 0, height: 'var(--scroll-h, 100vh)', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={mediaRef}
              src={block.url}
              muted playsInline preload="auto"
              crossOrigin="anonymous"
              style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
          <video
            ref={mediaRef}
            src={block.url}
            muted playsInline preload="auto"
            crossOrigin="anonymous"
            style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
          />
        </div>
      );
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative', overflow: 'hidden', lineHeight: 0 }}>
      {isYt ? (
        <img
          ref={mediaRef}
          src={`https://images.weserv.nl/?url=${encodeURIComponent(`https://img.youtube.com/vi/${block.embedId}/mqdefault.jpg`)}&w=600&q=80&output=webp`}
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', transform: 'scale(1.2)', willChange: 'transform' }}
          referrerPolicy="no-referrer"
        />
      ) : isVid ? (
        <video
          ref={mediaRef}
          src={block.url}
          autoPlay muted loop playsInline preload="metadata"
          crossOrigin="anonymous"
          style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none', transform: 'scale(1.2)', willChange: 'transform' }}
        />
      ) : (
        <img
          ref={mediaRef}
          src={getOptimizedUrl(block.url, 800, block)}
          alt={block.altText || ''}
          loading="lazy"
          style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none', transform: 'scale(1.2)', willChange: 'transform' }}
          referrerPolicy="no-referrer"
        />
      )}
      {isYt && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
          <div style={{ width: 40, height: 40, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={18} color="#fff" /></div>
        </div>
      )}
    </div>
  );
});

const MediaBlock = React.memo(({ 
  block, idx, isSel, selectedBlockId, selectedStickerId, cmsMode, contentVisibility, globalSettings, pageSettings,
  onSelectBlock, onSelectSticker, onUpdateBlock, blockRefs, onModeChange, onContextMenu 
}) => {
  const isYt = block.mediaType === 'youtube';
  const isVid = block.mediaType === 'video';

  const anySelected = selectedBlockId || selectedStickerId;

  const scrollAnim = pageSettings?.scrollAnimation || 'none';
  const hasScrollAnim = Boolean(scrollAnim && scrollAnim !== 'none');
  const baseStagger = pageSettings?.scrollAnimationDelay !== undefined ? pageSettings.scrollAnimationDelay : 120;
  const isReveal = idx > 0 && hasScrollAnim;
  const revealDelayClass = isReveal ? `reveal-delay-${((idx - 1) % 6) + 1}` : '';
  const computedDelay = isReveal
    ? (block.animationDelay !== undefined && block.animationDelay !== null && block.animationDelay !== ''
        ? Number(block.animationDelay)
        : (((idx - 1) % 6) + 1) * baseStagger)
    : undefined;

  // Calculate block opacity - only fade if a block is selected
  let blockOpacity = 1;
  if (contentVisibility === 'hidden') {
    blockOpacity = 0;
  } else if (contentVisibility === 'low') {
    blockOpacity = 0.25;
  } else if (selectedBlockId && !isSel) {
    blockOpacity = 0.3; // Only fade unselected blocks when a block is actively being edited
  }

  return (
    <div ref={el => blockRefs.current[block.id] = el}
      className={`img-block-wrapper ${isSel ? 'selected' : ''} ${isReveal ? revealDelayClass : ''}`}
      data-block-id={block.id}
      data-reveal={isReveal ? "true" : undefined}
      data-reveal-type={isReveal ? scrollAnim : undefined}
      onClick={e => { 
        e.stopPropagation(); 
        onModeChange?.('content');
        onSelectBlock(isSel ? null : block.id); 
        onSelectSticker?.(null);
      }}
      onContextMenu={e => {
        if (cmsMode === 'content') {
          e.preventDefault();
          e.stopPropagation();
          onSelectBlock(block.id);
          onContextMenu?.(e, block.id, idx);
        }
      }}
      style={{ 
        position: 'relative', 
        flexShrink: 0, 
        lineHeight: 0, 
        fontSize: 0, 
        margin: 0,
        padding: 0,
        cursor: cmsMode === 'content' ? 'pointer' : 'default',
        opacity: blockOpacity,
        transition: isReveal ? undefined : 'opacity 0.2s ease',
        transitionDelay: isReveal && computedDelay !== undefined ? `${computedDelay}ms` : undefined,
        outline: isSel ? '2px solid var(--cms-accent, #7c3aed)' : 'none',
        outlineOffset: '-2px',
        boxShadow: 'none',
        transform: 'none',
      }}>
      {/* Media */}
      <div style={{ position: 'relative', margin: 0, padding: 0, lineHeight: 0, fontSize: 0 }}>
        <div className="media-block-inner" style={{ transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)', overflow: 'hidden', margin: 0, padding: 0, border: 'none', lineHeight: 0, fontSize: 0 }}>
          {block.mediaType === 'solid' ? (
            <div 
              style={{ 
                width: '100%', 
                backgroundColor: block.backgroundColor || 'var(--cms-accent, #7c3aed)', 
                height: block.height || 200, 
                borderRadius: 0,
                boxShadow: 'none',
                margin: 0,
                padding: 0,
                border: 'none',
                display: 'block',
                transition: 'background-color 0.2s ease, height 0.1s linear' 
              }} 
            />
          ) : block.mediaType === 'spacer' ? (
            <div style={{ width: '100%', height: block.height || 50, position: 'relative' }}>
              {block.showLine && <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: block.lineColor || 'rgba(0,0,0,0.1)' }} />}
            </div>
          ) : block.mediaType === 'form' ? (
            <div style={{ width: '100%', padding: '24px 16px', background: 'var(--cms-card-bg)', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
              <input type="text" placeholder="Nama Anda" style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: 14, background: 'var(--cms-input-bg)', color: 'var(--cms-text)' }} readOnly />
              <input type="email" placeholder="Email Anda" style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: 14, background: 'var(--cms-input-bg)', color: 'var(--cms-text)' }} readOnly />
              <textarea placeholder="Pesan Anda" style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--glass-border)', borderRadius: 8, fontSize: 14, minHeight: 100, background: 'var(--cms-input-bg)', color: 'var(--cms-text)', resize: 'vertical' }} readOnly />
              <button style={{ width: '100%', padding: '14px', background: block.submitColor || 'var(--cms-accent, #7c3aed)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{block.submitText || 'Kirim Pesan'}</button>
            </div>
          ) : block.mediaType === '3d' ? (
            <div style={{ width: '100%', height: block.height || 450, position: 'relative' }}>
              <Model3DViewer 
                src={block.url} 
                height={block.height || 450} 
                allowLocalUpload={false} 
                title={block.name || 'Model 3D'} 
              />
            </div>
          ) : block.mediaType === 'biodata' ? (
            <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <BiodataWidget settings={{ biodata: globalSettings?.biodata }} block={block} />
            </div>
          ) : (block.mode === 'multiple' || block.mediaType === 'carousel') ? (
            (() => {
              const slideUrls = (block.urls && block.urls.length > 0) ? block.urls : [block.url].filter(Boolean);
              if (slideUrls.length === 0) {
                return (
                  <div style={{ width: '100%', minHeight: 180, padding: 20, background: 'rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--cms-text-muted)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cms-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <ImageIcon size={20} color="var(--cms-accent, #7c3aed)" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>Carousel Slide</span>
                    <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>Upload slide gambar di panel kanan</span>
                  </div>
                );
              }
              return (
                <div style={{ position: 'relative', width: '100%', background: '#000', overflow: 'hidden' }}>
                  <div id={`slider-${block.id}`} style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {slideUrls.map((u, i) => (
                      <div key={i} style={{ flexShrink: 0, width: '100%', scrollSnapAlign: 'start' }}>
                        {u.includes('/video/') || u.match(/\.(mp4|webm|mov)$/i) ? (
                          <video src={u} style={{ display: 'block', width: '100%', height: 'auto' }} autoPlay muted loop playsInline preload="metadata" />
                        ) : (
                          <img src={getOptimizedUrl(u, 800)} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} referrerPolicy="no-referrer" />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Bottom Navbar Controls: Panah & Dots di navbar bawah saja */}
                  {slideUrls.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, pointerEvents: 'none' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 100, background: 'rgba(15, 15, 20, 0.65)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.16)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)', pointerEvents: 'auto' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(`slider-${block.id}`);
                            el?.scrollBy({ left: -el.offsetWidth, behavior: 'smooth' });
                          }}
                          style={{ 
                            width: 22, height: 22, borderRadius: '50%', 
                            background: 'rgba(255,255,255,0.12)', 
                            border: 'none', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: 'pointer', color: '#fff', padding: 0
                          }}
                        >
                          <ChevronLeft size={13} color="#fff" />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 3px' }}>
                          {slideUrls.map((_, dotIdx) => (
                            <div key={dotIdx} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.5)' }} />
                          ))}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(`slider-${block.id}`);
                            el?.scrollBy({ left: el.offsetWidth, behavior: 'smooth' });
                          }}
                          style={{ 
                            width: 22, height: 22, borderRadius: '50%', 
                            background: 'rgba(255,255,255,0.12)', 
                            border: 'none', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: 'pointer', color: '#fff', padding: 0
                          }}
                        >
                          <ChevronRight size={13} color="#fff" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (block.url || block.embedId) ? (
            block.parallax ? (
              <PreviewParallaxMedia block={block} getOptimizedUrl={getOptimizedUrl} isVid={isVid} isYt={isYt} />
            ) : isYt ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                <img src={`https://images.weserv.nl/?url=${encodeURIComponent(`https://img.youtube.com/vi/${block.embedId}/mqdefault.jpg`)}&w=600&q=80&output=webp`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} referrerPolicy="no-referrer" />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                  <div style={{ width: 40, height: 40, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={18} color="#fff" /></div>
                </div>
              </div>
            ) : isVid ? (
              <video src={block.url} style={{ display: 'block', width: '100%', height: 'auto' }} autoPlay muted loop playsInline preload="metadata" />
            ) : (
              <img src={getOptimizedUrl(block.url, 800, block)} alt={block.altText || ''} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} referrerPolicy="no-referrer" />
            )
          ) : (
            <div style={{ width: '100%', aspectRatio: '4/3', background: '#f0f0f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#ccc', fontSize: 10, fontWeight: 700 }}>
              <ImageIcon size={20} color="#ddd" />Blok #{idx + 1}
            </div>
          )}
        </div>
        {/* White Overlay 40% - only when editing content */}
        {!isSel && selectedBlockId && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', zIndex: 10, transition: 'all 0.4s ease' }} />
        )}
        {/* Marker badge */}
        {(block.markers || []).length > 0 && !isSel && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(var(--cms-accent-rgb),0.85)', backdropFilter: 'blur(4px)', borderRadius: 100, padding: '2px 6px 2px 4px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#fff', lineHeight: 1, zIndex: 11 }}>
            <Bookmark size={9} />{(block.markers || []).length}
          </div>
        )}
      </div>
    </div>
  );
});

const LivePreview = ({ page, globalSettings, blocks, selectedBlockId, onSelectBlock, onRemoveBlock, onMoveBlock, onUpdateBlock, cmsMode, stickers, selectedStickerId, onSelectSticker, onUpdateSticker, onRemoveSticker, onDuplicateSticker, onReorderSticker, currentFrames, contentVisibility, stickerVisibility, frameVisibility, previewSize = 'desktop', desktopRatio = '1/1', onModeChange }) => {

  const [isMobileDevice, setIsMobileDevice] = useState(typeof window !== 'undefined' ? window.innerWidth <= 1200 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileDevice(window.innerWidth <= 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);  const fileRefs = useRef({});
  const blockRefs = useRef({});
  const scrollRef = useRef(null);
  const frameRef = useRef(null);

  const [mediaTab, setMediaTab] = useState('file');
  const [ytInput, setYtInput] = useState('');

  const [addingMarker, setAddingMarker] = useState(false);
  const [markerDraft, setMarkerDraft] = useState({ name: '', svgData: '' });

  const markerSvgRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, blockId, blockIdx }

  const handleContextMenu = useCallback((e, blockId, blockIdx) => {
    setContextMenu({ x: e.clientX, y: e.clientY, blockId, blockIdx });
  }, []);

  useScrollReveal(scrollRef, [blocks, page?.scrollAnimation, page?.scrollAnimationDelay]);

  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  // Live visual styles injection for Admin preview canvas
  useEffect(() => {
    const styleId = 'live-preview-custom-css';
    let el = document.getElementById(styleId);
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    const rules = [];
    if (page?.styleBlockRadius !== undefined && page?.styleBlockRadius !== null && Number(page?.styleBlockRadius) > 0) {
      const r = page.styleBlockRadius;
      rules.push(`.img-block-wrapper, .media-block-inner { border-radius: ${r}px !important; overflow: hidden !important; }`);
    }
    if (page?.styleBlockGap && Number(page?.styleBlockGap) > 0) {
      const g = page.styleBlockGap;
      rules.push(`.cms-preview-scroll > .img-block-wrapper + .img-block-wrapper { margin-top: ${g}px !important; }`);
    } else {
      rules.push(`.cms-preview-scroll > .img-block-wrapper:not(:first-child) { margin-top: -1px !important; }`);
    }
    if (page?.styleBlockShadow && Number(page?.styleBlockShadow) > 0) {
      const s = page.styleBlockShadow;
      rules.push(`.img-block-wrapper, .media-block-inner { box-shadow: 0 ${s}px ${s * 2}px rgba(0,0,0,0.18) !important; }`);
    }
    if (page?.styleBgColor) {
      rules.push(`.cms-preview-scroll, .phone-frame-inner { background-color: ${page.styleBgColor} !important; }`);
    }
    if (page?.stylePagePadding !== undefined && page?.stylePagePadding !== null && page?.stylePagePadding !== '' && Number(page?.stylePagePadding) > 0) {
      const p = page.stylePagePadding;
      rules.push(`.cms-preview-scroll { padding: ${p}px !important; }`);
    }

    // Dynamic Button Style in Live Preview
    const btnStyle = page?.buttonStyle || 'filled';
    if (btnStyle === 'outline') {
      rules.push(`.cms-preview-scroll button[type="submit"], .cms-preview-scroll .stk-btn, .cms-preview-scroll .btn-action { background: transparent !important; border: 2px solid var(--cms-accent, #7c3aed) !important; color: var(--cms-accent, #7c3aed) !important; }`);
    } else if (btnStyle === 'soft') {
      rules.push(`.cms-preview-scroll button[type="submit"], .cms-preview-scroll .stk-btn, .cms-preview-scroll .btn-action { background: var(--cms-accent-soft, rgba(124, 58, 237, 0.15)) !important; color: var(--cms-accent, #7c3aed) !important; }`);
    } else if (btnStyle === 'pill') {
      rules.push(`.cms-preview-scroll button[type="submit"], .cms-preview-scroll .stk-btn, .cms-preview-scroll .btn-action { border-radius: 100px !important; }`);
    } else if (btnStyle === 'sharp') {
      rules.push(`.cms-preview-scroll button[type="submit"], .cms-preview-scroll .stk-btn, .cms-preview-scroll .btn-action { border-radius: 4px !important; }`);
    }

    // Dynamic Hover Effect in Live Preview
    const hEff = page?.hoverEffect || 'lift';
    if (hEff === 'glow') {
      rules.push(`.cms-preview-scroll .img-block-wrapper:hover, .cms-preview-scroll .media-block-inner:hover { filter: drop-shadow(0 0 16px var(--cms-accent, rgba(124,58,237,0.6))) !important; transition: filter 0.25s ease !important; }`);
    } else if (hEff === 'scale') {
      rules.push(`.cms-preview-scroll .img-block-wrapper:hover, .cms-preview-scroll .media-block-inner:hover { transform: scale(1.025) !important; transition: transform 0.25s ease !important; }`);
    } else if (hEff === 'lift') {
      rules.push(`.cms-preview-scroll .img-block-wrapper:hover, .cms-preview-scroll .media-block-inner:hover { transform: translateY(-4px) !important; transition: transform 0.25s ease !important; }`);
    } else if (hEff === 'none') {
      rules.push(`.cms-preview-scroll .img-block-wrapper:hover, .cms-preview-scroll .media-block-inner:hover { transform: none !important; filter: none !important; }`);
    }

    // Glass variables for Live Preview frame
    rules.push(`.cms-preview-frame { --glass-blur: ${page?.glassBlur ?? 20}px; --glass-opacity: ${page?.glassOpacity ?? 0.25}; }`);

    el.textContent = rules.join('\n');
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) existing.textContent = '';
    };
  }, [page?.styleBlockRadius, page?.styleBlockGap, page?.styleBlockShadow, page?.styleBgColor, page?.stylePagePadding, page?.buttonStyle, page?.hoverEffect, page?.glassBlur, page?.glassOpacity]);

  const [scrollPos, setScrollPos] = useState(0);
  const [localPreviewSize, setLocalPreviewSize] = useState(previewSize);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchScale, setTouchScale] = useState(1);
  const [touchOffset, setTouchOffset] = useState(null);

  const handlePreviewTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setTouchOffset(dist);
    }
  };

  const handlePreviewTouchMove = (e) => {
    if (e.touches.length === 2 && touchOffset) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setTouchScale(s => Math.min(2, Math.max(0.3, s * (dist / touchOffset))));
      setTouchOffset(dist);
    }
  };

  useEffect(() => {
    if (previewSize !== localPreviewSize) {

      setIsTransitioning(true);
      const t1 = setTimeout(() => {
        setLocalPreviewSize(previewSize);
        const t2 = setTimeout(() => {
          setIsTransitioning(false);
        }, 500); // Menunggu durasi animasi resize frame
        return () => clearTimeout(t2);
      }, 300); // Menunggu durasi fade out putih
      return () => clearTimeout(t1);
    }
  }, [previewSize, localPreviewSize]);

  const handleScroll = (e) => {
    const t = e.target;
    const max = t.scrollHeight - t.clientHeight;
    if (max > 0) setScrollPos(t.scrollTop);
  };

  useEffect(() => {
    const handleFocus = (e) => {

      const { id, blockId } = e.detail;
      if (!blockId || !scrollRef.current) return;
      
      const blockEl = scrollRef.current.querySelector(`[data-block-id="${blockId}"]`);
      if (blockEl) {
        blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    window.addEventListener('porto_focus_sticker', handleFocus);
    return () => window.removeEventListener('porto_focus_sticker', handleFocus);
  }, []);

  useEffect(() => {
    const handleRequestSpawn = (e) => {
      const type = e.detail?.type || 'image';
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const centerY = el.scrollTop + (el.offsetHeight / 2);
      
      const allBlocks = Array.from(el.querySelectorAll('.img-block-wrapper'));
      let targetBlockId = blocks[0]?.id || null;
      let relativeY = 50;

      if (allBlocks.length > 0) {
        const sRect = el.getBoundingClientRect();
        for (const bEl of allBlocks) {
          const bRect = bEl.getBoundingClientRect();
          const top = (bRect.top - sRect.top) + el.scrollTop;
          const bottom = top + bRect.height;
          if (centerY >= top && centerY <= bottom) {
            targetBlockId = bEl.getAttribute('data-block-id');
            relativeY = ((centerY - top) / Math.max(bRect.height, 1)) * 100;
            break;
          }
        }
      }
      window.dispatchEvent(new CustomEvent('porto_sticker_spawn_pos_ready', { detail: { blockId: targetBlockId, y: relativeY, type } }));
    };
    window.addEventListener('porto_request_sticker_spawn_pos', handleRequestSpawn);
    return () => window.removeEventListener('porto_request_sticker_spawn_pos', handleRequestSpawn);
  }, [blocks]);

  React.useEffect(() => {
    if (selectedBlockId && blockRefs.current[selectedBlockId]) {
      blockRefs.current[selectedBlockId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setMediaTab('file'); setYtInput(''); setAddingMarker(false); setMarkerDraft({ name: '', svgData: '' });
  }, [selectedBlockId]);

  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1280; let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); const r = new FileReader(); r.onload = ev => resolve(ev.target.result); r.readAsDataURL(file); };
    img.src = url;
  });

  const handleFileUpload = async (blockId, e) => {
    const file = e.target.files[0]; if (!file) return; e.target.value = '';
    let mediaType = 'image';
    if (file.type.startsWith('video/')) mediaType = 'video';
    if (mediaType === 'image' && file.type !== 'image/gif') {

      try { const c = await compressImage(file); onUpdateBlock(blockId, { url: c, name: file.name, mediaType, embedId: null }); return; } catch {}
    }
    const r = new FileReader(); r.onload = ev => onUpdateBlock(blockId, { url: ev.target.result, name: file.name, mediaType, embedId: null }); r.readAsDataURL(file);
  };

  const handleYTApply = (blockId) => {
    const id = extractYouTubeId(ytInput);
    if (!id) { alert('URL YouTube tidak valid'); return; }
    onUpdateBlock(blockId, { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, embedId: id, mediaType: 'youtube', name: `YouTube: ${id}` });
    setYtInput('');
  };

  const addMarker = (blockId, block) => {
    if (!markerDraft.name.trim()) return;
    onUpdateBlock(blockId, { markers: [...(block.markers || []), { id: newMkId(), name: markerDraft.name.trim(), svgData: markerDraft.svgData }] });
    setMarkerDraft({ name: '', svgData: '' }); setAddingMarker(false);
  };

  return (
    <div 
      className="cms-preview-container"
      data-preview-size={localPreviewSize}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%', 
        boxSizing: 'border-box',
        transition: 'all 0.4s ease', 
        touchAction: 'none',
        padding: '24px 24px 100px 24px'
      }}
      onClick={e => { if (e.target === e.currentTarget) { onSelectBlock(null); onSelectSticker?.(null); } }}
      onTouchStart={handlePreviewTouchStart}
      onTouchMove={handlePreviewTouchMove}
      onTouchEnd={() => setTouchOffset(null)}
    >
      <div 
        className="cms-preview-frame" 
        ref={frameRef} 
        onClick={e => e.stopPropagation()} 
        style={{ 
          position:'relative',
          maxWidth: localPreviewSize === 'mobile' ? '380px' : '100%',
          width: localPreviewSize === 'mobile' ? '100%' : (desktopRatio === 'Full' ? '100%' : 'auto'),
          height: localPreviewSize === 'mobile' ? '100%' : (desktopRatio === 'Full' ? '100%' : '96%'),
          aspectRatio: localPreviewSize === 'mobile' ? '9/16' : (desktopRatio === 'Full' ? 'auto' : desktopRatio),
          borderRadius: localPreviewSize === 'mobile' ? '40px' : `${globalSettings?.frameRadius ?? 18}px`,
          transform: `scale(${touchScale})`,
          transition: touchOffset ? 'none' : 'all 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div 
          className="preview-content-fade"
          style={{
            width: '100%', height: '100%',
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.4s ease',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div 
            className="cms-preview-scroll" 
            ref={scrollRef} 
            onScroll={handleScroll}
            onClick={e => { if (e.target === scrollRef.current) { onSelectBlock(null); onSelectSticker?.(null); } }}
          >

            {blocks.length === 0 ? (
              <div className="empty-page" style={{ flex: 1 }}>
                <div className="empty-page-icon"><ImageIcon size={22} color="#ccc" /></div>
                <p style={{ fontSize: 11 }}>Tambah blok media<br />dari panel kiri</p>
              </div>
            ) : blocks.map((block, idx) => (
              <MediaBlock 
                key={block.id}
                block={block}
                idx={idx}
                globalSettings={globalSettings}
                pageSettings={page}
                isSel={selectedBlockId === block.id}
                selectedBlockId={selectedBlockId}
                selectedStickerId={selectedStickerId}
                cmsMode={cmsMode}
                contentVisibility={contentVisibility}
                onSelectBlock={onSelectBlock}
                onSelectSticker={onSelectSticker}
                onUpdateBlock={onUpdateBlock}
                blockRefs={blockRefs}
                onModeChange={onModeChange}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>

          {/* Sticker overlay — always rendered, but faint in content mode */}
          <div style={{ position:'absolute', inset:0, zIndex:200, overflow:'hidden', pointerEvents:'none' }}>
            {(stickers||[]).filter(s=>s.visible!==false).map((sticker, idx)=>{
              const isSel = selectedStickerId === sticker.id;
              const anySelected = selectedBlockId || selectedStickerId;

              // Calculate effective opacity based on selection and visibility toggle
              let effectiveOpacity = (sticker.opacity ?? 1);
              if (stickerVisibility === 'hidden') {
                effectiveOpacity = 0;
              } else if (stickerVisibility === 'low') {
                effectiveOpacity *= 0.25;
              } else if (anySelected && !isSel) {
                effectiveOpacity *= 0.3; // Fade unselected stickers
              }

              return (
                <StickerHandleItem 
                  key={sticker.id}
                  sticker={{...sticker, imageData: sticker.imageData, blockId: sticker.blockId || blocks[0]?.id}}
                  isSelected={isSel}
                  onSelect={() => onSelectSticker(sticker.id)}
                  onUpdate={onUpdateSticker}
                  frameRef={frameRef}
                  scrollPos={scrollPos}
                  cmsMode={cmsMode}
                  index={idx}
                  total={stickers.length}
                  onModeChange={onModeChange}
                  stickerVisibility={stickerVisibility}
                  onDuplicate={onDuplicateSticker}
                  onRemove={onRemoveSticker}
                  onReorder={onReorderSticker}
                  style={{ 
                    pointerEvents: stickerVisibility === 'hidden' ? 'none' : 'auto',
                    opacity: effectiveOpacity,
                    transition: 'opacity 0.3s ease, transform 0.2s'
                  }}
                />
              );
            })}
          </div>

          {/* Reference UI (Dock/Pill) — Mock Top Pill */}
          {!currentFrames.hideNavbars && previewSize === 'desktop' && (
            <div style={{ 
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', 
              width: 110, height: 36, borderRadius: 100, background: 'rgba(255,255,255,0.3)', 
              backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.2)', zIndex: 400,
              pointerEvents: 'none'
            }} />
          )}

          {/* Custom Frames — Overlaid on top of everything */}
          {currentFrames.useFrame !== false && currentFrames.topFrame && (
            currentFrames.topLink ? (
              <div 
                style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', 
                  zIndex: 300, display: 'block', pointerEvents: 'none',
                  opacity: cmsMode === 'frame' ? 1 : (frameVisibility === 'hidden' ? 0 : frameVisibility === 'low' ? 0.25 : 1),
                  transition: 'opacity 0.3s ease'
                }}
              >
                <img src={getOptimizedUrl(currentFrames.topFrame, 800)} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} referrerPolicy="no-referrer" />
              </div>
            ) : (
              <img 
                src={getOptimizedUrl(currentFrames.topFrame, 800)} 
                alt="" 
                onClick={e => e.preventDefault()}
                style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', 
                  zIndex: 300, pointerEvents: cmsMode === 'frame' ? 'auto' : 'none', display: 'block',
                  opacity: cmsMode === 'frame' ? 1 : (frameVisibility === 'hidden' ? 0 : frameVisibility === 'low' ? 0.25 : 1),
                  transition: 'opacity 0.3s ease',
                  cursor: cmsMode === 'frame' ? 'default' : 'none'
                }} 
                referrerPolicy="no-referrer"
              />
            )
          )}
          {currentFrames.useFrame !== false && currentFrames.bottomFrame && (
            currentFrames.bottomLink ? (
              <div 
                style={{ 
                  position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'auto', 
                  zIndex: 301, display: 'block', pointerEvents: 'none',
                  opacity: cmsMode === 'frame' ? 1 : (frameVisibility === 'hidden' ? 0 : frameVisibility === 'low' ? 0.25 : 1),
                  transition: 'opacity 0.3s ease'
                }}
              >
                <img src={getOptimizedUrl(currentFrames.bottomFrame, 800)} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} referrerPolicy="no-referrer" />
              </div>
            ) : (
              <img 
                src={getOptimizedUrl(currentFrames.bottomFrame, 800)} 
                alt="" 
                onClick={e => e.preventDefault()}
                style={{ 
                  position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'auto', 
                  zIndex: 301, pointerEvents: cmsMode === 'frame' ? 'auto' : 'none', display: 'block',
                  opacity: cmsMode === 'frame' ? 1 : (frameVisibility === 'hidden' ? 0 : frameVisibility === 'low' ? 0.25 : 1),
                  transition: 'opacity 0.3s ease',
                  cursor: cmsMode === 'frame' ? 'default' : 'none'
                }} 
                referrerPolicy="no-referrer"
              />
            )
          )}
        </div>

        {/* Live Bottom Navigation in Editor Preview */}
        {!page?.hideBottomNav && !page?.hideNavbars && !currentFrames?.hideNavbars && (
          <div 
            className="cms-preview-bottom-nav"
            style={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              zIndex: 302, 
              pointerEvents: 'none' 
            }}
          >
            <style>{`@media (max-width: 767px) { .cms-preview-bottom-nav { display: none !important; } }`}</style>
            <div style={{ pointerEvents: 'auto' }}>
              <BottomNav
                onContactClick={() => {}}
                isContactOpen={false}
                customPages={globalSettings?.customPages || []}
                contacts={[]}
                unreadCount={0}
                navSettings={{
                  navStyle: page?.navStyle || globalSettings?.navStyle || 'dock',
                  navSize: page?.navSize || globalSettings?.navSize || 'normal',
                  navMaxIcons: page?.navMaxIcons || globalSettings?.navMaxIcons || 5,
                  navAutoHide: false,
                  navBgMode: page?.navBgMode || globalSettings?.navBgMode || 'glass',
                }}
                scrollContainerRef={scrollRef}
                shopEnabled={globalSettings?.shopSettings?.enabled || false}
                isEmbedded={true}
                previewMode={true}
              />
            </div>
          </div>
        )}

        {isTransitioning && (
          <div style={{ 
            position:'absolute', inset:0, zIndex:1000, 
            display:'flex', alignItems:'center', justifyContent:'center',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'cmsFadeIn 0.3s ease'
          }}>
            <div className="cms-loader-small" style={{ width: 28, height: 28, borderTopColor: 'var(--cms-accent, #7c3aed)' }} />
          </div>
        )}
      </div>

      {contextMenu && createPortal(
        <>
          <style>{`
            .glassmorphic-context-menu {
              position: fixed;
              z-index: 9999999;
              background: rgba(18, 15, 36, 0.75);
              backdrop-filter: blur(20px) saturate(210%);
              -webkit-backdrop-filter: blur(20px) saturate(210%);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 6px;
              min-width: 170px;
              box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(var(--cms-accent-rgb), 0.2);
              display: flex;
              flex-direction: column;
              gap: 2px;
              animation: cmsSmoothFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              transform-origin: top left;
            }
            .glassmorphic-context-menu-overlay {
              display: none;
            }
            @media (max-width: 500px) {
              .glassmorphic-context-menu-overlay {
                display: flex;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.4);
                z-index: 9999998;
                align-items: center;
                justify-content: center;
                animation: cmsFadeIn 0.2s ease;
              }
              .glassmorphic-context-menu {
                position: relative !important;
                top: auto !important;
                left: auto !important;
                transform-origin: center !important;
                width: 240px;
              }
            }
          `}</style>
          <div className="glassmorphic-context-menu-overlay" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} />
          <div 
            className="glassmorphic-context-menu"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 170),
              left: Math.min(contextMenu.x, window.innerWidth - 190),
            }}
            onClick={e => e.stopPropagation()}
          >
          <div style={{ padding: '6px 12px 4px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255, 255, 255, 0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '4px' }}>
            Aksi Blok #{contextMenu.blockIdx + 1}
          </div>
          
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('porto_duplicate_block', { detail: contextMenu.blockId }));
              setContextMenu(null);
            }}
            className="ctx-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copy size={14} style={{ opacity: 0.7 }} /> Duplikat
            </span>
            <span style={{ fontSize: '9px', opacity: 0.4, fontWeight: 500 }}>Ctrl+D</span>
          </button>
          
          <button 
            onClick={() => {
              onMoveBlock(contextMenu.blockId, 'up');
              setContextMenu(null);
            }}
            disabled={contextMenu.blockIdx <= 0}
            className="ctx-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: contextMenu.blockIdx <= 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.85)',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'left',
              cursor: contextMenu.blockIdx <= 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (contextMenu.blockIdx > 0) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = contextMenu.blockIdx <= 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.85)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChevronUp size={14} style={{ opacity: 0.7 }} /> Naik
            </span>
            <span style={{ fontSize: '9px', opacity: 0.4, fontWeight: 500 }}>↑</span>
          </button>

          <button 
            onClick={() => {
              onMoveBlock(contextMenu.blockId, 'down');
              setContextMenu(null);
            }}
            disabled={contextMenu.blockIdx >= blocks.length - 1}
            className="ctx-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: contextMenu.blockIdx >= blocks.length - 1 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.85)',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'left',
              cursor: contextMenu.blockIdx >= blocks.length - 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (contextMenu.blockIdx < blocks.length - 1) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = contextMenu.blockIdx >= blocks.length - 1 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.85)';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChevronDown size={14} style={{ opacity: 0.7 }} /> Turun
            </span>
            <span style={{ fontSize: '9px', opacity: 0.4, fontWeight: 500 }}>↓</span>
          </button>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

          <button 
            onClick={() => {
              onRemoveBlock(contextMenu.blockId);
              setContextMenu(null);
            }}
            className="ctx-item danger"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '12px',
              fontWeight: 700,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#ef4444';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={14} style={{ opacity: 0.7 }} /> Hapus
            </span>
            <span style={{ fontSize: '9px', opacity: 0.4, fontWeight: 500 }}>Del</span>
          </button>
        </div>
        </>,
        document.body
      )}
    </div>
  );
};

/* helpers */
/* helpers */
const GBtn = React.memo(({ onClick, disabled, danger, children }) => (
  <button onClick={disabled ? undefined : onClick}
    style={{ width: 30, height: 28, border: 'none', borderRadius: 8, background: danger ? 'rgba(239,68,68,0.1)' : 'var(--cms-card-bg)', color: danger ? '#ef4444' : 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1, fontFamily: 'inherit', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
    {children}
  </button>
));

const GTab = React.memo(({ active, onClick, children }) => (
  <button onClick={onClick}
    style={{ flex: 1, padding: '7px 6px', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, background: active ? 'var(--cms-switcher-item-bg)' : 'transparent', color: active ? 'var(--cms-text)' : 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.12s ease', boxShadow: active ? '0 4px 10px rgba(0,0,0,0.1)' : 'none' }}>
    {children}
  </button>
));

const GLabel = React.memo(({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>{children}</div>
));

const GInput = React.memo(({ label, placeholder, value, onChange }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <GLabel>{label}</GLabel>}
    <input 
      type="text" 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange}
      onClick={e => e.stopPropagation()}
      style={{ 
        width: '100%', height: 38, padding: '0 14px', border: '1px solid var(--glass-border)', 
        borderRadius: 100, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', outline: 'none', 
        background: 'var(--cms-input-bg)', color: 'var(--cms-text)', boxSizing: 'border-box', 
        transition: 'all 0.2s'
      }}
      onFocus={e => e.target.style.borderColor = 'var(--cms-accent, #7c3aed)'}
      onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
    />
  </div>
));

export default React.memo(LivePreview);
