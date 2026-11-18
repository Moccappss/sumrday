import React, { useRef, useEffect, useState } from 'react';
import { Lock, Sliders, ShieldAlert } from 'lucide-react';
import { 
  drawWatermark, 
  type WatermarkStyle, 
  type WatermarkTheme,
  type WatermarkOptions 
} from '../../utils/watermark';

export interface ProtectedPreviewImageProps {
  src: string;
  alt?: string;
  isPaid: boolean;
  clientName?: string;
  className?: string;
  style?: React.CSSProperties;
  watermarkStyle?: WatermarkStyle;
  watermarkTheme?: WatermarkTheme;
  watermarkText?: string;
  watermarkOpacity?: number;
  enableBurnIn?: boolean;
  showControls?: boolean;
  onClick?: () => void;
}

// Fallback high-resolution vibrant canvas gradient SVG
const DEFAULT_FALLBACK_IMG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236366f1"/><stop offset="50%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%23f59e0b"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="50%" font-family="system-ui, sans-serif" font-weight="800" font-size="42" fill="white" text-anchor="middle" dominant-baseline="middle" opacity="0.9">sumr.day Visual Studio</text></svg>`;

export const ProtectedPreviewImage: React.FC<ProtectedPreviewImageProps> = ({
  src,
  alt = 'Pratinjau Desain',
  isPaid,
  clientName = 'KLIEN',
  className = '',
  style = {},
  watermarkStyle: initialStyle = 'grid',
  watermarkTheme: initialTheme = 'frosted',
  watermarkText = 'SUMR.DAY • DRAFT PREVIEW',
  watermarkOpacity = 0.16,
  showControls = false,
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Active watermark settings
  const [currentStyle, setCurrentStyle] = useState<WatermarkStyle>(initialStyle);
  const [currentTheme, setCurrentTheme] = useState<WatermarkTheme>(initialTheme);
  const [currentOpacity, setCurrentOpacity] = useState<number>(watermarkOpacity);
  const [imgSrc, setImgSrc] = useState<string>(src || DEFAULT_FALLBACK_IMG);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState<boolean>(false);

  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setImgLoaded(false);
    }
  }, [src]);

  // Real-time Canvas Overlay on top of image
  const updateCanvasWatermark = () => {
    if (isPaid || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = img.clientWidth || img.naturalWidth || 800);
    const height = (canvas.height = img.clientHeight || img.naturalHeight || 600);

    ctx.clearRect(0, 0, width, height);

    drawWatermark(ctx, width, height, {
      primaryText: watermarkText,
      clientName,
      style: currentStyle,
      theme: currentTheme,
      opacity: currentOpacity,
      includeTimestamp: true
    });
  };

  useEffect(() => {
    updateCanvasWatermark();
  }, [isPaid, clientName, watermarkText, currentStyle, currentTheme, currentOpacity, imgLoaded]);

  // ResizeObserver to keep canvas watermark perfectly aligned
  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new ResizeObserver(() => {
      updateCanvasWatermark();
    });
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [isPaid]);

  return (
    <div
      ref={containerRef}
      className={`protected-image-container relative select-none ${className}`}
      style={{
        borderRadius: 12,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
        maxHeight: '100%',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
        background: '#0a0d16',
        ...style
      }}
      onContextMenu={(e) => {
        if (!isPaid) e.preventDefault();
      }}
      onDragStart={(e) => {
        if (!isPaid) e.preventDefault();
      }}
    >
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading="eager"
        decoding="sync"
        draggable={false}
        onClick={onClick}
        onLoad={() => {
          setImgLoaded(true);
          updateCanvasWatermark();
        }}
        onError={() => {
          // If original image fails to load, gracefully fallback to guaranteed local SVG
          if (imgSrc !== DEFAULT_FALLBACK_IMG) {
            setImgSrc(DEFAULT_FALLBACK_IMG);
          }
        }}
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 120px)',
          width: 'auto',
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          pointerEvents: isPaid ? 'auto' : 'none'
        }}
      />

      {/* Dynamic Canvas Watermark Overlay */}
      {!isPaid && (
        <>
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 3
            }}
          />

          {/* Watermark Security Status Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              zIndex: 4,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
          >
            <Lock size={10} color="#f87171" />
            <span>Watermark Aktif</span>
          </div>

          {/* Discreet Minimalist Watermark Settings (if enabled) */}
          {showControls && (
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
              <button
                type="button"
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Atur Watermark"
              >
                <Sliders size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProtectedPreviewImage;
