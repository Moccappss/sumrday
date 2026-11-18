import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number | string;
  aspectRatio?: string;
  className?: string;
  isDark?: boolean;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Sebelum (Lama)',
  afterLabel = 'Sesudah (Rebrand sumr.day)',
  height = 'auto',
  aspectRatio = '16/9',
  className = '',
  isDark = true
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clipLayerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; width: number } | null>(null);
  const posRef = useRef<number>(50);
  const rafRef = useRef<number>(0);

  const applyDom = useCallback((pos: number) => {
    const clip = `inset(0 ${(100 - pos).toFixed(3)}% 0 0)`;
    if (clipLayerRef.current) {
      clipLayerRef.current.style.clipPath = clip;
      (clipLayerRef.current.style as any).webkitClipPath = clip;
    }
    if (dividerRef.current) {
      dividerRef.current.style.left = `${pos.toFixed(3)}%`;
    }
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!rectRef.current && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, width: r.width };
    }
    if (!rectRef.current || rectRef.current.width <= 0) return;
    const x = clientX - rectRef.current.left;
    const pos = Math.max(0, Math.min(100, (x / rectRef.current.width) * 100));
    posRef.current = pos;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        applyDom(posRef.current);
      });
    }
  }, [applyDom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    rectRef.current = null;
    setSliderPosition(posRef.current);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      data-card-3d="true"
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        aspectRatio: aspectRatio,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'ew-resize',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.5)' : '0 12px 36px rgba(0,0,0,0.12)',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
      }}
      onMouseDown={(e) => {
        if (containerRef.current) {
          const r = containerRef.current.getBoundingClientRect();
          rectRef.current = { left: r.left, width: r.width };
        }
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        if (containerRef.current) {
          const r = containerRef.current.getBoundingClientRect();
          rectRef.current = { left: r.left, width: r.width };
        }
        setIsDragging(true);
        if (e.touches[0]) handleMove(e.touches[0].clientX);
      }}
    >
      {/* After Image (Background / Right Side) */}
      <img
        src={afterImage}
        alt={afterLabel}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
        draggable={false}
      />

      {/* Before Image (Clipped / Left Side) */}
      <div
        ref={clipLayerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          WebkitClipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          willChange: isDragging ? 'clip-path' : 'auto'
        }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
          draggable={false}
        />
      </div>

      {/* Divider Line & Handle */}
      <div
        ref={dividerRef}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: 3,
          background: '#ffffff',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 12px rgba(0,0,0,0.6)',
          zIndex: 10
        }}
      >
        {/* Circular Drag Handle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a',
            cursor: 'ew-resize'
          }}
        >
          <SlidersHorizontal size={18} />
        </div>
      </div>

      {/* Labels */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          padding: '4px 12px',
          borderRadius: 100,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          zIndex: 5,
          pointerEvents: 'none'
        }}
      >
        {beforeLabel}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          padding: '4px 12px',
          borderRadius: 100,
          background: 'rgba(217,86,41,0.85)',
          backdropFilter: 'blur(6px)',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          zIndex: 5,
          pointerEvents: 'none'
        }}
      >
        <Sparkles size={12} />
        <span>{afterLabel}</span>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
