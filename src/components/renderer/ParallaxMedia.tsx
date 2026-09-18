import React, { useEffect, useRef } from 'react';
import { getVideoPoster } from './utils';

interface ParallaxMediaProps {
  block: any;
  getOptimizedUrl: (url: string, width: number, block: any) => string;
}

const ParallaxMedia: React.FC<ParallaxMediaProps> = React.memo(({ block, getOptimizedUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const isVid = block.mediaType === 'video';
  const poster = block.coverUrl || getVideoPoster(block.url);

  // Set --scroll-h on mount and resize so sticky height is always correct
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScrollH = () => {
      if (!containerRef.current) return;
      const scrollParent = containerRef.current.closest('.page-scroll') || window;
      const h = (scrollParent as any).clientHeight || window.innerHeight;
      containerRef.current.style.setProperty('--scroll-h', `${h}px`);
    };
    updateScrollH();
    window.addEventListener('resize', updateScrollH);
    return () => window.removeEventListener('resize', updateScrollH);
  }, [block.parallaxMode, block.parallaxScrollLength]);

  useEffect(() => {
    let rafId: number;
    let currentPct = 0;
    let targetPct = 0;
    let isLoopRunning = false;

    const lerpLoop = () => {
      const ease = 0.08;
      const diff = targetPct - currentPct;
      if (Math.abs(diff) > 0.001) {
        currentPct += diff * ease;
        const vid = mediaRef.current as HTMLVideoElement;
        if (vid && vid.duration && !isNaN(vid.duration)) {
          const targetTime = currentPct * vid.duration;
          if (!vid.seeking && Math.abs(vid.currentTime - targetTime) > 0.01) {
            vid.currentTime = targetTime;
          }
        }
        rafId = requestAnimationFrame(lerpLoop);
      } else {
        currentPct = targetPct;
        const vid = mediaRef.current as HTMLVideoElement;
        if (vid && vid.duration && !isNaN(vid.duration)) {
          if (!vid.seeking) vid.currentTime = targetPct * vid.duration;
        }
        isLoopRunning = false;
      }
    };

    const handleScroll = () => {
      if (!containerRef.current || !mediaRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollParent = containerRef.current.closest('.page-scroll') || window;
      const viewHeight = (scrollParent as any).clientHeight || window.innerHeight;
      containerRef.current.style.setProperty('--scroll-h', `${viewHeight}px`);
      const topOffset = (scrollParent as any).getBoundingClientRect && scrollParent !== window
        ? (scrollParent as Element).getBoundingClientRect().top : 0;
      const elemTop = rect.top - topOffset;
      const elemBottom = rect.bottom - topOffset;

      if (isVid && block.parallaxScrollLength) {
        if (block.parallaxMode === 'sticky') {
          const scrollDist = -elemTop;
          const maxScroll = rect.height - viewHeight;
          if (maxScroll > 0) {
            const pct = scrollDist / maxScroll;
            targetPct = Math.max(0, Math.min(1, pct));
            if (!isLoopRunning) { isLoopRunning = true; rafId = requestAnimationFrame(lerpLoop); }
          }
        } else {
          const totalDist = viewHeight + rect.height;
          const currentDist = viewHeight - elemTop;
          if (totalDist > 0) {
            const pct = currentDist / totalDist;
            targetPct = Math.max(0, Math.min(1, pct));
            if (!isLoopRunning) { isLoopRunning = true; rafId = requestAnimationFrame(lerpLoop); }
          }
        }
      } else {
        // Regular parallax for images / non-seeking video
        if (elemTop <= viewHeight && elemBottom >= 0) {
          const totalDist = viewHeight + rect.height;
          const currentDist = viewHeight - elemTop;
          const pct = currentDist / totalDist;
          const yOffset = (pct - 0.5) * 20;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            if (mediaRef.current) mediaRef.current.style.transform = `scale(1.2) translateY(${yOffset}%)`;
          });
        }
      }
    };

    const scrollParent = containerRef.current
      ? containerRef.current.closest('.page-scroll') || window
      : window;
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
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
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={block.url}
              muted playsInline preload="auto"
              crossOrigin={block.url?.startsWith('data:') || block.url?.startsWith('blob:') ? undefined : "anonymous"}
              className="w-full h-auto block pointer-events-none"
            />
            {poster && (
              <img src={poster} alt={block.altText || ''}
                referrerPolicy="no-referrer" crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div ref={containerRef} className="w-full relative">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={block.url}
            muted playsInline preload="auto"
            crossOrigin={block.url?.startsWith('data:') || block.url?.startsWith('blob:') ? undefined : "anonymous"}
            className="w-full h-auto block pointer-events-none"
          />
          {poster && (
            <img src={poster} alt={block.altText || ''}
              referrerPolicy="no-referrer" crossOrigin="anonymous"
              className="w-full h-auto"
            />
          )}
        </div>
      );
    }
  }

  // Regular parallax (image or non-seeking video)
  return (
    <div ref={containerRef} className="w-full relative overflow-hidden leading-none">
      {isVid ? (
        <>
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={block.url}
            autoPlay muted loop playsInline
            crossOrigin={block.url?.startsWith('data:') || block.url?.startsWith('blob:') ? undefined : "anonymous"}
            className="w-full h-auto block pointer-events-none transform scale-125 will-change-transform"
          />
          {poster && (
            <img src={poster} alt={block.altText || ''}
              referrerPolicy="no-referrer" crossOrigin="anonymous"
              className="w-full h-auto transform scale-125 will-change-transform"
            />
          )}
        </>
      ) : (
        <img
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={getOptimizedUrl(block.url, 1200, block)}
          alt={block.altText || block.name || ''}
          decoding="async" loading="lazy" draggable="false" referrerPolicy="no-referrer"
          crossOrigin={block.url?.startsWith('data:') || block.url?.startsWith('blob:') ? undefined : "anonymous"}
          className="w-full h-auto block pointer-events-none transform scale-125 will-change-transform"
        />
      )}
    </div>
  );
});

export default ParallaxMedia;
