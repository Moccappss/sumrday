import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import DOMPurify from 'dompurify';
import { buildStickerFilter, hexToRgba, getOptimizedUrl, getVideoPoster } from './utils';

// Marquee keyframes — defined once at module level to avoid re-injection on every render
const MARQUEE_CSS = `@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }`;

/**
 * Hook: plays sticker audio independently (overlaps with block/other audio).
 * Sticker music NEVER pauses other audio — it always runs in parallel.
 */
const useStickerAudio = (sticker, containerRef) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!sticker.musicUrl) return;

    const audio = new Audio(sticker.musicUrl);
    audio.loop = sticker.musicLoop !== false;
    audio.volume = sticker.musicVolume ?? 1;
    audioRef.current = audio;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            audio.play().catch(() => {});
          } else {
            audio.pause();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };

  }, [sticker.musicUrl, sticker.musicLoop]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = sticker.musicVolume ?? 1;
  }, [sticker.musicVolume]);
};

const StickerItem = React.memo(({ sticker, total, index }) => {
  const [isPlayed, setIsPlayed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [sticker.imageData]);

  const widthPct = ((sticker.width ?? 80) / 320) * 100;
  const maskRad = sticker.maskRadius ?? 2;
  const dynamicMaskStyle = sticker.mask === 'rounded' 
    ? { clipPath: `inset(0 round ${maskRad}rem)` }
    : sticker.mask === 'squircle'
    ? { clipPath: `inset(0 round ${maskRad * 1.8}rem)`, aspectRatio: '1/1', objectFit: 'cover' }
    : {};
  
  const innerShadow = sticker.shadow === 'inner' 
    ? `inset ${sticker.shadowX ?? 0}px ${sticker.shadowY ?? 5}px ${sticker.shadowBlur ?? 10}px ${sticker.shadowColor || 'rgba(0,0,0,0.35)'}`
    : undefined;

  const maskClass = sticker.mask && sticker.mask !== 'none' ? `stk-mask-${sticker.mask}` : '';
  const idleClass = sticker.animation && sticker.animation !== 'none' ? `stk-anim-${sticker.animation}` : '';

  const isSvg = Boolean(
    sticker.isSvg || (
      typeof sticker.imageData === 'string' && (
        sticker.imageData.trim().startsWith('<svg') ||
        sticker.imageData.trim().startsWith('<?xml') ||
        sticker.imageData.includes('<svg')
      )
    )
  );

  // Performance Fix: Memoize DOMPurify to avoid blocking main thread on every render
  const sanitizedSVG = useMemo(() => {
    if ((sticker.type || 'image') === 'image' && isSvg && sticker.imageData) {
      return DOMPurify.sanitize(sticker.imageData);
    }
    return '';
  }, [sticker.type, isSvg, sticker.imageData]);

  const stickerPoster = sticker.type === 'video' && sticker.videoUrl ? getVideoPoster(sticker.videoUrl) : '';

  // Sticker music — always overlaps, plays independently of block music
  useStickerAudio(sticker, containerRef);

  const content = (
    <div
      ref={containerRef}
      className={`${sticker.hideOnMobile ? 'cms-hide-mobile' : ''} ${sticker.hideOnDesktop ? 'cms-hide-desktop' : ''}`}
      style={{
      position: 'absolute',
      left: `${sticker.x ?? 10}%`,
      top: `${sticker.y ?? 10}%`,
      width: sticker.type === 'button' ? 'fit-content' : `${widthPct}%`,
      minWidth: sticker.type === 'button' ? `${widthPct}%` : undefined,
      whiteSpace: sticker.type === 'button' ? 'nowrap' : 'normal',
      maxWidth: '100%',
      transform: `rotate(${sticker.rotation ?? 0}deg)`,
      transformOrigin: 'center center',
      opacity: sticker.opacity ?? 1,
      filter: buildStickerFilter(sticker),
      // Always overlap: stickers always appear above all block content
      zIndex: 9000 + (total - index) * 10,
      pointerEvents: (sticker.linkUrl || sticker.type === 'button' || sticker.youtubeId) ? 'auto' : 'none',
      containerType: 'inline-size',
    }}>
      <div className={idleClass} style={{ width: '100%', height: 'auto' }}>
        {(sticker.type || 'image') === 'image' ? (
          isSvg ? (
            <div className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''}
              style={{ width: '100%', height: '100%', pointerEvents: 'none', boxShadow: innerShadow, ...dynamicMaskStyle }}
              dangerouslySetInnerHTML={{ __html: sanitizedSVG }} />
          ) : (
            <img 
              src={imgError ? sticker.imageData : getOptimizedUrl(sticker.imageData, 400)} 
              alt="" 
              decoding="async"
              loading="lazy"
              onError={() => {
                if (!imgError) setImgError(true);
              }}
              className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''}
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: (sticker.mask && sticker.mask !== 'none' && sticker.mask !== 'rounded') ? '100%' : 'auto', display: 'block', pointerEvents: 'none', boxShadow: innerShadow, objectFit: (sticker.mask && sticker.mask !== 'none' && sticker.mask !== 'rounded') ? 'cover' : 'contain', ...dynamicMaskStyle }} />
          )
        ) : sticker.type === 'video' ? (
          sticker.videoUrl ? (
            <div 
              className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''}
              style={{ 
                width: '100%', 
                aspectRatio: sticker.aspectRatio || '16/9', 
                position: 'relative', 
                overflow: 'hidden', 
                ...dynamicMaskStyle, 
                boxShadow: innerShadow,
                pointerEvents: 'auto'
              }}
            >
              <video 
                src={sticker.videoUrl} 
                autoPlay 
                muted 
                loop 
                playsInline 
                crossOrigin={sticker.videoUrl?.startsWith('data:') || sticker.videoUrl?.startsWith('blob:') ? undefined : "anonymous"}
                className="pdf-hide-video"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
              />
              {stickerPoster && (
                <img
                  src={stickerPoster}
                  alt=""
                  className="pdf-show-poster"
                  referrerPolicy="no-referrer"
                  crossOrigin={sticker.videoUrl?.startsWith('data:') || sticker.videoUrl?.startsWith('blob:') ? undefined : "anonymous"}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          ) : null
        ) : sticker.youtubeId ? (
          <div 
            className={sticker.mask !== 'rounded' && sticker.mask !== 'squircle' ? maskClass : ''}
            onClick={(e) => {
              if (!isPlayed) {
                e.preventDefault();
                e.stopPropagation();
                setIsPlayed(true);
              }
            }}
            style={{ 
              width: '100%', 
              aspectRatio: sticker.aspectRatio || '16/9', 
              position: 'relative', 
              overflow: 'hidden', 
              ...dynamicMaskStyle, 
              boxShadow: innerShadow,
              cursor: isPlayed ? 'default' : 'pointer',
              pointerEvents: 'auto'
            }}
          >
            {isPlayed ? (
              <iframe
                src={`https://www.youtube.com/embed/${sticker.youtubeId}?autoplay=1&modestbranding=1&rel=0`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                allowFullScreen
                title={`YouTube Video: ${sticker.youtubeId}`}
              />
            ) : (
              <>
                <img 
                  src={`https://images.weserv.nl/?url=${encodeURIComponent(`https://img.youtube.com/vi/${sticker.youtubeId}/mqdefault.jpg`)}`} 
                  alt={`YouTube thumbnail for ${sticker.youtubeId}`}
                  decoding="async"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = `https://img.youtube.com/vi/${sticker.youtubeId}/mqdefault.jpg`;
                  }}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s ease'
                  }}>
                    <Play size={22} fill="currentColor" style={{ marginLeft: 3 }} />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : sticker.type === 'button' ? (
          <div 
            className="stk-btn"
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center',
              background: sticker.btnBgType === 'image' 
                ? (sticker.imageData ? `url(${imgError ? sticker.imageData : getOptimizedUrl(sticker.imageData, 400)}) center/cover` : 'rgba(0,0,0,0.1)')
                : sticker.btnColor 
                  ? hexToRgba(sticker.btnColor, sticker.btnFillOpacity ?? 1)
                  : `rgba(var(--cms-accent-rgb, 124, 58, 237), ${sticker.btnFillOpacity ?? 1})`,
              color: sticker.textColor || '#fff',
              fontSize: '14cqw',
              fontWeight: 800,
              lineHeight: 1,
              padding: '0.8em 1.2em',
              boxShadow: innerShadow,
              overflow: 'hidden',
              borderRadius: sticker.btnShape === 'pill' ? '9999px' : sticker.btnShape === 'circle' ? '50%' : sticker.btnShape === 'rectangle' ? '0' : '1.2rem',
              border: sticker.btnBorder || `${sticker.btnBorderWidth ?? 1.5}px solid ${sticker.btnBorderColor || 'rgba(255,255,255,0.2)'}`,
              backdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
              WebkitBackdropFilter: (sticker.useGlass !== false) ? `blur(${sticker.btnBlur ?? 12}px)` : 'none',
              ...dynamicMaskStyle
            }}
          >
            {sticker.btnText || 'KLIK DISINI'}
          </div>
        ) : sticker.type === 'text' ? (
          (() => {
            const baseFontSize = sticker.fontSize || (sticker.textMode === 'title' ? 32 : 16);
            // cqw is relative to THIS sticker's own width (containerType: inline-size above).
            // CMS stores font size in px relative to a sticker of width sticker.width px.
            // Formula: (baseFontSize / sticker.width) * 100 cqw → always proportional.
            const stickerWidthPx = sticker.width || 80;
            const fontSizeCqw = (baseFontSize / stickerWidthPx) * 100;
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
                  <style dangerouslySetInnerHTML={{__html: MARQUEE_CSS}} />
                )}
              </div>
            );
          })()
        ) : null}
      </div>
    </div>
  );

  if (sticker.actionType === 'popup' && sticker.popupId) {
    return (
      <div 
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('porto_open_popup', {
            detail: { popupId: sticker.popupId }
          }));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('porto_open_popup', {
              detail: { popupId: sticker.popupId }
            }));
          }
        }}
        style={{ display: 'contents', cursor: 'pointer' }}
      >
        {content}
      </div>
    );
  }

  if (sticker.linkUrl) {
    const safe = sticker.linkUrl.trim().startsWith('http') ? sticker.linkUrl.trim() : `https://${sticker.linkUrl.trim()}`;
    return <a href={safe} target="_blank" rel="noopener noreferrer" style={{ display: 'contents' }}>{content}</a>;
  }
  return content;
});

export default StickerItem;
