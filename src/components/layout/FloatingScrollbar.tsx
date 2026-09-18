import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, Bookmark } from 'lucide-react';
import { haptic } from '../../utils/haptics';

const FloatingScrollbar = ({ scrollContainerRef, markerOpen, onMarkerClick }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const isDraggingScroll = useRef(false);

  const dragStartY = useRef(0);

  const dragStartScrollTop = useRef(0);
  const containerRef = useRef(null);
  const thumbRef = useRef(null);
  const scrollTrackRef = useRef(null);

  // ── Show/hide the whole container ──
  const showContainer = useCallback(() => {
    // Handled by parent MainLayout now
  }, []);

  // ── Direct DOM update for instant response ──
  const syncThumb = useCallback((scrollTop) => {
    const el = scrollContainerRef.current;
    const thumb = thumbRef.current;
    const track = scrollTrackRef.current;
    if (!el || !thumb || !track) return;

    const clientH = el.clientHeight;
    const scrollH = el.scrollHeight;
    const maxScroll = scrollH - clientH;
    const st = scrollTop !== undefined ? scrollTop : el.scrollTop;

    setShowScrollTop(maxScroll > 0 && st / maxScroll > 0.2);

    if (scrollH > clientH + 10) {
      setIsScrollable(true);
      const trackRect = track.getBoundingClientRect();
      const trackPadding = 6;
      const trackH = trackRect.height - trackPadding * 2;
      const frac = maxScroll > 0 ? st / maxScroll : 0;
      const thumbH = Math.max(28, (clientH / scrollH) * trackH);
      const thumbTop = trackPadding + frac * (trackH - thumbH);

      thumb.style.height = `${thumbH}px`;
      thumb.style.top = `${thumbTop}px`;
    } else {
      setIsScrollable(false);
    }
  }, [scrollContainerRef]);

  useEffect(() => {
    // Drag: track delta from start position for smooth feel
    const handleGlobalMove = (e) => {
      if (!isDraggingScroll.current) return;
      e.preventDefault();

      const el = scrollContainerRef.current;
      const track = scrollTrackRef.current;
      const thumb = thumbRef.current;
      if (!el || !track || !thumb) return;

      const trackRect = track.getBoundingClientRect();
      const trackPadding = 6;
      const trackH = trackRect.height - trackPadding * 2;
      const clientH = el.clientHeight;
      const scrollH = el.scrollHeight;
      const maxScroll = scrollH - clientH;
      const thumbH = Math.max(28, (clientH / scrollH) * trackH);

      // Calculate position directly from mouse on track
      let y = e.clientY - trackRect.top - trackPadding - thumbH / 2;
      y = Math.max(0, Math.min(y, trackH - thumbH));
      const frac = trackH > thumbH ? y / (trackH - thumbH) : 0;

      const newScrollTop = frac * maxScroll;
      el.scrollTop = newScrollTop;

      // Update thumb directly, no RAF
      thumb.style.height = `${thumbH}px`;
      thumb.style.top = `${trackPadding + frac * (trackH - thumbH)}px`;
    };

    const handleGlobalUp = () => {
      isDraggingScroll.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      showContainer();
    };

    window.addEventListener('mousemove', handleGlobalMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [scrollContainerRef, showContainer, syncThumb]);

  // ── Listen to scroll events from the page ──
  const handleScroll = useCallback(() => {
    if (!isDraggingScroll.current) {
      syncThumb();
    }
    showContainer();
  }, [syncThumb, showContainer]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      syncThumb();
      el.addEventListener('scroll', handleScroll, { passive: true });
      const observer = new ResizeObserver(() => syncThumb());
      if (el.firstElementChild) observer.observe(el.firstElementChild);
      observer.observe(el);
      return () => {
        el.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, [scrollContainerRef, handleScroll, syncThumb]);

  useEffect(() => {
    // Handled by parent MainLayout now
  }, []);

  return (
    <div
      ref={containerRef}
      className="custom-scroll-container"
      style={{
        opacity: 1,
        pointerEvents: 'auto'
      }}
    >
      {/* Bookmark button — standalone pill */}
      {onMarkerClick && (
        <button
          className="interaction-btn"
          style={{
            transition: 'all 0.2s',
            pointerEvents: 'auto',
            backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
          }}
          onClick={(e) => { e.stopPropagation(); onMarkerClick(); }}
          aria-label="Penanda"
        >
          <Bookmark size={20} strokeWidth={2.2} fill={markerOpen ? 'currentColor' : 'none'} />
        </button>
      )}

      {/* Track pill — only this has a background */}
      <div
        className="custom-scroll-track-vt"
        ref={scrollTrackRef}
        style={{
          backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          pointerEvents: 'auto'
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          isDraggingScroll.current = true;
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
          // Snap thumb to click position immediately
          const track = scrollTrackRef.current;
          const el = scrollContainerRef.current;
          const thumb = thumbRef.current;
          if (!track || !el || !thumb) return;
          const trackRect = track.getBoundingClientRect();
          const trackPadding = 6;
          const trackH = trackRect.height - trackPadding * 2;
          const clientH = el.clientHeight;
          const scrollH = el.scrollHeight;
          const maxScroll = scrollH - clientH;
          const thumbH = Math.max(28, (clientH / scrollH) * trackH);
          let y = e.clientY - trackRect.top - trackPadding - thumbH / 2;
          y = Math.max(0, Math.min(y, trackH - thumbH));
          const frac = trackH > thumbH ? y / (trackH - thumbH) : 0;
          el.scrollTop = frac * maxScroll;
          thumb.style.height = `${thumbH}px`;
          thumb.style.top = `${trackPadding + frac * (trackH - thumbH)}px`;
        }}
      >
        <div
          ref={thumbRef}
          className="custom-scroll-thumb-vt"
          style={{
            height: 0,
            top: 6,
            opacity: isScrollable ? 0.55 : 0,
            transition: 'opacity 0.3s ease',

            cursor: isDraggingScroll.current ? 'grabbing' : 'grab',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { if (!isDraggingScroll.current) e.currentTarget.style.opacity = isScrollable ? '0.55' : '0'; }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            isDraggingScroll.current = true;
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
          }}
        />
      </div>

      {/* Arrow up button — standalone pill */}
      <button
        className="interaction-btn"
        disabled={!showScrollTop}
        style={{
          opacity: showScrollTop ? 1 : 0.25,
          cursor: showScrollTop ? 'pointer' : 'default',
          backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)'
        }}
        onClick={() => {
          if (!showScrollTop) return;
          haptic.light();
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        aria-label="Ke atas"
      >
        <ArrowUp size={20} strokeWidth={2.2} />
      </button>
    </div>
  );
};

export default FloatingScrollbar;
