import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedUrl } from './utils';

const ImageMultipleBlock = React.memo(({ block }: { block: any }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [firstHeight, setFirstHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const isJumping = useRef(false);
  const timerRef = useRef<any>(null);

  const urls = (block.urls && block.urls.length > 0) ? block.urls : [block.url].filter(Boolean);
  const totalOriginal = Math.max(1, urls.length);
  const displayUrls = urls.length > 1 ? [...urls, ...urls, ...urls] : urls;

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowControls(true);
    timerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Horizontal Drag for Mouse
  useEffect(() => {
    const el = containerRef.current;
    if (!el || totalOriginal <= 1) return;
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      el.classList.add('grabbing');
      el.style.scrollSnapType = 'none';
      el.style.scrollBehavior = 'auto';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onMouseLeave = () => { 
      isDown = false; 
      el.classList.remove('grabbing');
      el.style.scrollSnapType = 'x mandatory';
      el.style.scrollBehavior = 'smooth';
    };
    const onMouseUp = () => { 
      isDown = false; 
      el.classList.remove('grabbing');
      el.style.scrollSnapType = 'x mandatory';
      el.style.scrollBehavior = 'smooth';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, [totalOriginal]);

  const handleScroll = () => {
    resetTimer();
    const el = containerRef.current;
    if (!el || totalOriginal <= 1 || isJumping.current) return;
    
    const { scrollLeft, scrollWidth } = el;
    const setWidth = scrollWidth / 3;

    // Track active indicator
    const currentSlide = Math.round(scrollLeft / (el.offsetWidth || 1)) % totalOriginal;
    setActiveIndex((currentSlide + totalOriginal) % totalOriginal);
    
    // Looping Logic for infinite carousel
    if (scrollLeft >= 2 * setWidth) {
      isJumping.current = true;
      el.style.scrollSnapType = 'none';
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = scrollLeft - setWidth;
      requestAnimationFrame(() => {
        el.style.scrollSnapType = 'x mandatory';
        setTimeout(() => { isJumping.current = false; }, 50);
      });
    } else if (scrollLeft <= setWidth * 0.1) {
      isJumping.current = true;
      el.style.scrollSnapType = 'none';
      el.style.scrollBehavior = 'auto';
      el.scrollLeft = scrollLeft + setWidth;
      requestAnimationFrame(() => {
        el.style.scrollSnapType = 'x mandatory';
        setTimeout(() => { isJumping.current = false; }, 50);
      });
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el && totalOriginal > 1) {
      requestAnimationFrame(() => {
        const setWidth = el.scrollWidth / 3;
        el.style.scrollBehavior = 'auto';
        el.scrollLeft = setWidth;
      });
    }
  }, [totalOriginal, block.id]);

  useEffect(() => {
    if (totalOriginal <= 1) return;
    const observer = new IntersectionObserver(([entry]) => {
      window.dispatchEvent(new CustomEvent('porto_block_active', {
        detail: { active: entry.isIntersecting, type: 'multiple', id: block.id, ref: containerRef.current }
      }));
    }, { threshold: 0.1 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      window.dispatchEvent(new CustomEvent('porto_block_active', {
        detail: { active: false, id: block.id }
      }));
    };
  }, [totalOriginal, block.id, block.name, block.title]);

  useEffect(() => {
    if (!block.autoSlide || totalOriginal <= 1) return;
    
    const interval = setInterval(() => {
      const el = containerRef.current;
      if (!el || el.classList.contains('grabbing')) return;
      
      const currentScroll = el.scrollLeft;
      const imgWidth = el.offsetWidth;
      const nextScroll = currentScroll + imgWidth;
      
      el.scrollTo({ left: nextScroll, behavior: 'smooth' });
    }, 3200);

    return () => clearInterval(interval);
  }, [block.autoSlide, totalOriginal, block.id]);

  if (urls.length === 0) {
    return (
      <div style={{ width: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.03)', color: 'var(--cms-text-muted)', padding: 24, boxSizing: 'border-box' }}>
        <p style={{ fontSize: 12, margin: 0, fontWeight: 600 }}>Carousel belum memiliki slide gambar.</p>
        <span style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Tambahkan slide gambar melalui CMS editor.</span>
      </div>
    );
  }

  return (
    <div 
      style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      onMouseEnter={resetTimer}
      onMouseMove={resetTimer}
      onTouchStart={resetTimer}
    >
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="multiple-image-slider"
        style={{ 
          display: 'flex', 
          overflowX: 'auto', 
          overflowY: 'hidden',
          width: '100%',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: totalOriginal > 1 ? 'grab' : 'default',
          alignItems: 'center',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'auto'
        }}
      >
        {displayUrls.map((url: string, i: number) => {
          const isVideo = url.includes('/video/') || Boolean(url.match(/\.(mp4|webm|mov)$/i));
          return (
            <div 
              key={i} 
              style={{ 
                flexShrink: 0, 
                height: firstHeight > 0 ? firstHeight : 'auto',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                scrollSnapAlign: 'start'
              }}
            >
              {isVideo ? (
                <video
                  src={url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  style={{
                    height: 'auto',
                    width: '100%',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                />
              ) : (
                <img 
                  src={getOptimizedUrl(url, 1200)} 
                  alt={`Slide ${i + 1}`} 
                  decoding="async"
                  loading="lazy"
                  draggable="false"
                  referrerPolicy="no-referrer"
                  onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => { 
                    if (i === 0 && e.currentTarget.offsetHeight > 0) {
                      setFirstHeight(e.currentTarget.offsetHeight); 
                    }
                  }}
                  ref={(el) => {
                    if (i === 0 && el && el.complete && el.offsetHeight > 0 && firstHeight === 0) {
                      setFirstHeight(el.offsetHeight);
                    }
                  }}
                  style={{ 
                    height: 'auto', 
                    width: '100%',
                    display: 'block',
                    pointerEvents: 'none'
                  }} 
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Navbar Controls: Panah & Indikator di navbar bawah saja */}
      {totalOriginal > 1 && (
        <div 
          style={{ 
            position: 'absolute', 
            bottom: 12, 
            left: 0, 
            right: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 30, 
            pointerEvents: 'none' 
          }}
        >
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 100,
              background: 'rgba(15, 15, 20, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              pointerEvents: 'auto',
              transition: 'opacity 0.25s ease',
              opacity: showControls ? 1 : 0.6
            }}
          >
            {/* Panah Kiri */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const el = containerRef.current;
                if (el) el.scrollBy({ left: -el.offsetWidth, behavior: 'smooth' });
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                padding: 0,
                transition: 'background 0.2s'
              }}
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft size={15} color="#fff" />
            </button>

            {/* Indikator Titik (Dots) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 4px' }}>
              {urls.map((_: any, dotIdx: number) => (
                <div
                  key={dotIdx}
                  style={{
                    width: dotIdx === activeIndex ? 14 : 5,
                    height: 5,
                    borderRadius: 10,
                    background: dotIdx === activeIndex ? '#10b981' : 'rgba(255, 255, 255, 0.45)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              ))}
            </div>

            {/* Panah Kanan */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const el = containerRef.current;
                if (el) el.scrollBy({ left: el.offsetWidth, behavior: 'smooth' });
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                padding: 0,
                transition: 'background 0.2s'
              }}
              aria-label="Slide berikutnya"
            >
              <ChevronRight size={15} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ImageMultipleBlock;
