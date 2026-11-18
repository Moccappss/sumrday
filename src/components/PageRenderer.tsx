import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../utils/storage';
import { getOptimizedUrl } from './renderer/utils';
import StickerItem from './renderer/StickerItem';
import VideoBlock from './renderer/VideoBlock';
import ImageMultipleBlock from './renderer/ImageMultipleBlock';
import { useBlockMusic } from './renderer/useBlockMusic';
import FloatingMusicPlayer from './renderer/FloatingMusicPlayer';
import ParallaxMedia from './renderer/ParallaxMedia';
import ContactFormBlock from './renderer/ContactFormBlock';
import BiodataWidget from './public/BiodataWidget';
import LpImagePopupModal from './renderer/LpImagePopupModal';
import Model3DViewer from './common/Model3DViewer';
import { useScrollReveal } from '../hooks/useScrollReveal';

interface PageRendererProps {
  pageKey: string;
}

const usePageStyles = (pageKey: string) => {
  useEffect(() => {
    const styleId = `page-custom-css-${pageKey}`;
    const applyStyles = (settings: any) => {
      let el = document.getElementById(styleId);
      if (!el) {
        el = document.createElement('style');
        el.id = styleId;
        document.head.appendChild(el);
      }
      const pageData = (settings?.customPages || []).find((p: any) => p.slug === pageKey);
      const r: string[] = [];
      if (pageData?.styleBlockRadius !== undefined && pageData?.styleBlockRadius !== null && Number(pageData?.styleBlockRadius) > 0) {
        const v = pageData.styleBlockRadius;
        r.push(`.img-block:not(.parallax-block), .img-block-wrapper, .media-block-inner { border-radius: ${v}px !important; overflow: hidden !important; }`);
        r.push(`.img-block > img, .img-block > video, .img-block > iframe, .img-block > div { border-radius: ${v}px !important; }`);
      }
      if (pageData?.styleBlockGap && Number(pageData?.styleBlockGap) > 0) {
        const g = pageData.styleBlockGap;
        r.push(`.page-scroll .page-transition-wrapper > * { margin-top: ${g}px !important; }`);
        r.push(`.page-scroll .page-transition-wrapper > *:first-child { margin-top: 0 !important; }`);
      } else {
        r.push(`.page-scroll .page-transition-wrapper > *:not(:first-child) { margin-top: -1px !important; }`);
      }
      if (pageData?.styleBlockShadow && Number(pageData?.styleBlockShadow) > 0) {
        const s = pageData.styleBlockShadow;
        r.push(`.img-block, .img-block-wrapper { box-shadow: 0 ${s}px ${s * 2}px rgba(0,0,0,0.18) !important; }`);
      }
      if (pageData?.styleBgColor) {
        r.push(`body, .mobile-shell, .page-scroll { background-color: ${pageData.styleBgColor} !important; }`);
      }
      if (pageData?.stylePagePadding !== undefined && pageData?.stylePagePadding !== null && pageData?.stylePagePadding !== '' && Number(pageData?.stylePagePadding) > 0) {
        const p = pageData.stylePagePadding;
        r.push(`.page-scroll .page-transition-wrapper { padding: ${p}px !important; }`);
      }
      el.textContent = r.join('\n');
    };

    const unsub = storage.listenItem('porto_settings', applyStyles, {});
    return () => {
      if (unsub) unsub();
      const el = document.getElementById(styleId);
      if (el) el.textContent = '';
    };
  }, [pageKey]);
};

const PageRenderer: React.FC<PageRendererProps> = ({ pageKey }) => {
  usePageStyles(pageKey);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [stickers, setStickers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [allPages, setAllPages] = useState<Record<string, any[]>>({});
  const [allStickers, setAllStickers] = useState<Record<string, any[]>>({});
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOpenPopup = (e: any) => {
      if (e.detail?.popupId) {
        setActivePopupId(e.detail.popupId);
      }
    };
    window.addEventListener('porto_open_popup', handleOpenPopup);
    return () => window.removeEventListener('porto_open_popup', handleOpenPopup);
  }, []);

  useEffect(() => {
    setLoading(true);
    let pagesUnsub: any = null;
    let stickersUnsub: any = null;

    pagesUnsub = storage.listenItem('porto_pages', (rawPages: any) => {
      if (rawPages) {
        setAllPages(rawPages);
        const pBlocks = rawPages[pageKey] || [];
        const sorted = [...pBlocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setBlocks(sorted);
      } else {
        setAllPages({});
        setBlocks([]);
      }
      setLoading(false);
    });

    stickersUnsub = storage.listenItem('porto_stickers', (rawStickers: any) => {
      if (rawStickers) {
        setAllStickers(rawStickers);
        setStickers(rawStickers[pageKey] || []);
      } else {
        setAllStickers({});
        setStickers([]);
      }
    });

    const settingsUnsub = storage.listenItem('porto_settings', (rawSettings: any) => {
      if (rawSettings) {
        setSettings(rawSettings);
      }
    }, {});

    return () => {
      if (pagesUnsub && typeof pagesUnsub === 'function') pagesUnsub();
      if (stickersUnsub && typeof stickersUnsub === 'function') stickersUnsub();
      if (settingsUnsub && typeof settingsUnsub === 'function') settingsUnsub();
    };
  }, [pageKey]);

  // Performance Fix: Pre-group stickers by blockId to avoid O(N*S) complexity during render
  const stickersByBlock = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    const validBlockIds = new Set(blocks.map(b => b.id));
    const firstBlockId = blocks[0]?.id;

    stickers.forEach(s => {
      if (s.visible === false || s.isHidden === true) return;
      // Target block: use s.blockId if valid and exists in current blocks, otherwise fallback to firstBlockId
      const targetBlockId = (s.blockId && validBlockIds.has(s.blockId)) ? s.blockId : firstBlockId;
      if (targetBlockId) {
        if (!grouped[targetBlockId]) grouped[targetBlockId] = [];
        grouped[targetBlockId].push(s);
      }
    });
    return grouped;
  }, [stickers, blocks]);

  // Block music engine
  const { nowPlaying, togglePlayPause, toggleMute, isMuted, manualPause } = useBlockMusic(blocks);

  const pageData = useMemo(() => {
    return (settings?.customPages || []).find((p: any) => p.slug === pageKey);
  }, [settings?.customPages, pageKey]);

  const scrollAnim = pageData?.scrollAnimation || 'none';
  const hasScrollAnim = Boolean(scrollAnim && scrollAnim !== 'none');
  const baseStagger = pageData?.scrollAnimationDelay !== undefined ? pageData.scrollAnimationDelay : 120;

  // Must be called unconditionally before any early returns (Rules of Hooks)
  useScrollReveal(undefined, [blocks, scrollAnim, baseStagger]);

  if (loading) {
    return (
      <div className="w-full">
        {[1, 0.6, 1, 0.75].map((ratio, i) => (
          <div
            key={i}
            className="w-full bg-[linear-gradient(90deg,var(--cms-switcher-bg,rgba(0,0,0,0.06))_25%,var(--cms-card-bg,rgba(0,0,0,0.03))_50%,var(--cms-switcher-bg,rgba(0,0,0,0.06))_75%)] bg-[length:200%_100%] animate-[skeletonShimmer_1.5s_infinite]"
            style={{
              paddingBottom: `${ratio * 56}%`,
              marginBottom: i < 3 ? 2 : 0,
            }}
          />
        ))}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes skeletonShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}} />
      </div>
    );
  }

  if (blocks.length === 0) {
    const visibleStickers = stickers.filter(s => s.visible !== false && !s.isHidden);
    return (
      <div className="flex flex-col items-center justify-center px-4 text-[var(--cms-text-muted,#666)] text-center text-sm border-2 border-dashed border-[var(--glass-border,rgba(0,0,0,0.1))] rounded-2xl m-4 bg-[var(--cms-card-bg,#fff)] h-[calc(100dvh-140px)] min-h-[400px] relative overflow-hidden">
        {visibleStickers.map((s, i, arr) => (
          <StickerItem key={s.id} sticker={s} total={arr.length} index={i} />
        ))}
        <div className="w-16 h-16 rounded-full bg-[var(--cms-bg,#f5f5f5)] flex items-center justify-center mb-4 text-[var(--cms-text-muted,#666)] pointer-events-none">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="m-0 leading-relaxed font-medium pointer-events-none">Halaman ini belum memiliki konten gambar.<br />Upload gambar melalui CMS.</p>
      </div>
    );
  }

  return (
    <>
      {blocks.map((block, idx) => {
        if (block.isHidden) return null;
        const mediaType = block.mediaType || 'image';
        const isCarousel = block.mode === 'multiple' || mediaType === 'carousel';
        const hasMedia = Boolean(
          block.url || 
          block.embedId || 
          ['solid', 'spacer', 'form', 'biodata', '3d'].includes(mediaType) ||
          (isCarousel && ((block.urls && block.urls.length > 0) || block.url))
        );
        if (!hasMedia) return null;

        const markerIds = (block.markers || []).map((m: any) => m.id);
        const firstMarkerId = markerIds[0] || null;

        const isReveal = idx > 0 && hasScrollAnim;
        const revealDelayClass = isReveal ? `reveal-delay-${((idx - 1) % 6) + 1}` : '';
        const computedDelay = isReveal
          ? (block.animationDelay !== undefined && block.animationDelay !== null && block.animationDelay !== ''
              ? Number(block.animationDelay)
              : (((idx - 1) % 6) + 1) * baseStagger)
          : undefined;

        let mediaEl = null;

        if (mediaType === '3d') {
          mediaEl = (
            <div className="w-full my-2 relative" style={{ height: block.height || 450 }}>
              <Model3DViewer 
                src={block.url} 
                height={block.height || 450} 
                allowLocalUpload={false} 
                title={block.name || 'Model 3D'} 
              />
            </div>
          );
        } else if (mediaType === 'youtube' && block.embedId) {
          mediaEl = (
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${block.embedId}?rel=0&modestbranding=1`}
                title={block.altText || block.name || 'YouTube'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-none block"
              />
            </div>
          );
        } else if (mediaType === 'video') {
          mediaEl = block.parallax ? <ParallaxMedia block={block} getOptimizedUrl={getOptimizedUrl} /> : <VideoBlock block={block} />;
        } else if (isCarousel) {
          mediaEl = <ImageMultipleBlock block={block} />;
        } else if (mediaType === 'solid') {
          mediaEl = (
            <div 
              className="w-full"
              style={{ 
                height: block.height || 200, 
                backgroundColor: block.backgroundColor || 'var(--cms-accent, #7c3aed)',
                margin: 0,
                padding: 0,
                border: 'none',
                boxShadow: 'none',
                display: 'block'
              }} 
            />
          );
        } else if (mediaType === 'spacer') {
          mediaEl = (
            <div className="w-full relative" style={{ height: block.height || 50, margin: 0, padding: 0 }}>
              {block.showLine && <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: block.lineColor || 'rgba(0,0,0,0.1)' }} />}
            </div>
          );
        } else if (mediaType === 'form') {
          mediaEl = <ContactFormBlock block={block} />;
        } else if (mediaType === 'biodata') {
          mediaEl = (
            <BiodataWidget settings={settings} block={block} />
          );
        } else if (block.parallax) {
          mediaEl = <ParallaxMedia block={block} getOptimizedUrl={getOptimizedUrl} />;
        } else {
          mediaEl = (
            <img
              src={getOptimizedUrl(block.url, 1200, block)}
              alt={block.altText || block.name || ''}
              decoding="async"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
              draggable="false"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (block.url && e.currentTarget.src !== block.url) {
                  e.currentTarget.src = block.url;
                }
              }}
              className="block w-full h-auto pointer-events-none"
              style={{
                display: 'block',
                margin: 0,
                padding: 0,
                border: 'none',
                verticalAlign: 'bottom'
              }}
            />
          );
        }

        const extraAnchors = markerIds.slice(1).map((mid: string) => (
          <div key={mid} id={mid} className="absolute top-0 h-0 pointer-events-none" />
        ));

        const isParallax = block.parallax;
        const blockContent = (
          <div
            key={block.id}
            data-reveal={isReveal ? "true" : undefined}
            data-reveal-type={isReveal ? scrollAnim : undefined}
            className={`img-block ${isParallax ? 'parallax-block' : ''} ${block.hideOnMobile ? 'cms-hide-mobile' : ''} ${block.hideOnDesktop ? 'cms-hide-desktop' : ''} ${idx > 2 ? 'content-visibility-auto' : ''} ${isReveal ? revealDelayClass : ''} relative`}
            id={firstMarkerId || undefined}
            data-block-id={block.id}
            data-marker-ids={markerIds.join(',') || undefined}
            style={{ 
              overflow: isParallax ? 'visible' : 'hidden',
              margin: 0,
              padding: 0,
              border: 'none',
              lineHeight: 0,
              fontSize: 0,
              display: 'block',
              marginTop: (!pageData?.styleBlockGap && idx > 0) ? '-1px' : undefined,
              transitionDelay: isReveal && computedDelay !== undefined ? `${computedDelay}ms` : undefined,
            }}
          >
            {extraAnchors}
            {mediaEl}
            {/* Render stickers for this block */}
            {(stickersByBlock[block.id] || []).map((s, i, arr) => (
              <StickerItem key={s.id} sticker={s} total={arr.length} index={i} />
            ))}
          </div>
        );

        if (block.actionType === 'popup' && block.popupId && mediaType !== 'form' && mediaType !== 'spacer') {
          return (
            <div
              key={block.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('porto_open_popup', {
                  detail: { popupId: block.popupId }
                }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('porto_open_popup', {
                    detail: { popupId: block.popupId }
                  }));
                }
              }}
              draggable="false"
              className="block leading-none text-[0] [user-drag:none] cursor-pointer"
            >
              {blockContent}
            </div>
          );
        }

        if (block.linkUrl && mediaType !== 'form' && mediaType !== 'spacer') {
          const safeLink = (block.linkUrl.startsWith('http://') || block.linkUrl.startsWith('https://'))
            ? block.linkUrl
            : `https://${block.linkUrl}`;
          return (
            <a key={block.id} href={safeLink} target="_blank" rel="noopener noreferrer"
              draggable="false"
              className="block leading-none text-[0] [user-drag:none]">
              {blockContent}
            </a>
          );
        }
        return blockContent;
      })}
      {/* Floating Music Player — shown when any block music is playing */}
      <FloatingMusicPlayer
        nowPlaying={nowPlaying}
        onToggle={togglePlayPause}
        onMute={toggleMute}
        isMuted={isMuted}
        isPaused={manualPause}
      />
      {/* Pop-up Modal */}
      {(() => {
        const activePopup = (settings?.popups || []).find((p: any) => p.id === activePopupId);
        const popupBlocks = activePopupId ? (allPages[activePopupId] || []) : [];
        const popupStickers = activePopupId ? (allStickers[activePopupId] || []) : [];
        return (
          <LpImagePopupModal
            isOpen={Boolean(activePopupId)}
            popupId={activePopupId || ''}
            title={activePopup?.title || 'Pop-up Modal'}
            blocks={popupBlocks}
            stickers={popupStickers}
            onClose={() => setActivePopupId(null)}
          />
        );
      })()}
    </>
  );
};

export default PageRenderer;
