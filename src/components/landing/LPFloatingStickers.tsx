import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  Copy,
  Eye,
  EyeOff,
  FolderOpen,
  ImageIcon,
  Link2,
  Move,
  Pin,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';
import {
  LP_IMAGE_STICKER_SAMPLES,
  StickerAnimType,
  StickerMaskType,
} from './LPHomeCustomWidget';

export interface FloatingStickerItem {
  id: string;
  label?: string;
  imageData: string;
  x: number; // 0-95 (%)
  y: number; // 0-95 (%)
  width: number; // px (32-380)
  rotation: number; // -180 to 180 deg
  opacity: number; // 0.1 to 1
  mask: StickerMaskType;
  animation: StickerAnimType;
  shadow: 'none' | 'outer' | 'glow';
  shadowColor?: string;
  positionMode: 'sticky' | 'page';
  linkUrl?: string;
  visible?: boolean;
}

const STICKER_MASKS: { key: StickerMaskType; label: string }[] = [
  { key: 'none', label: 'Asli' },
  { key: 'circle', label: 'Lingkaran' },
  { key: 'squircle', label: 'Squircle' },
  { key: 'rounded', label: 'Rounded' },
  { key: 'heart', label: 'Hati' },
  { key: 'star', label: 'Bintang' },
  { key: 'badge', label: 'Badge' },
  { key: 'shield', label: 'Perisai' },
  { key: 'triangle', label: 'Segitiga' },
  { key: 'hexagon', label: 'Hexagon' },
];

const STICKER_ANIMS: { key: StickerAnimType; label: string }[] = [
  { key: 'none', label: 'Diam' },
  { key: 'float', label: 'Mengambang' },
  { key: 'bounce', label: 'Meloncat' },
  { key: 'swing', label: 'Mengayun' },
  { key: 'pop', label: 'Pop' },
  { key: 'pulse', label: 'Denyut' },
  { key: 'spin', label: 'Berputar' },
];

export function createDefaultFloatingSticker(
  overrides: Partial<FloatingStickerItem> = {},
): FloatingStickerItem {
  const sample = LP_IMAGE_STICKER_SAMPLES[0];
  return {
    id: `fstk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: sample?.label || 'Stiker LP Image',
    imageData: sample?.src || '',
    x: 82,
    y: 22,
    width: 112,
    rotation: sample?.rotation ?? -8,
    opacity: 1,
    mask: sample?.mask || 'none',
    animation: sample?.animation || 'float',
    shadow: 'outer',
    shadowColor: 'rgba(15, 23, 42, 0.35)',
    positionMode: 'sticky',
    linkUrl: '',
    visible: true,
    ...overrides,
  };
}

function isSvgMarkup(src?: string): boolean {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  return (
    trimmed.startsWith('<svg') ||
    trimmed.startsWith('<?xml') ||
    trimmed.includes('<svg')
  );
}

function getStickerFilter(sticker: FloatingStickerItem): string | undefined {
  if (sticker.shadow === 'glow') {
    const color = sticker.shadowColor || 'rgba(99, 102, 241, 0.65)';
    return `drop-shadow(0 0 14px ${color}) drop-shadow(0 6px 18px ${color})`;
  }
  if (sticker.shadow === 'outer') {
    const color = sticker.shadowColor || 'rgba(15, 23, 42, 0.32)';
    return `drop-shadow(0 10px 18px ${color})`;
  }
  return undefined;
}

const StickerVisualContent: React.FC<{ sticker: FloatingStickerItem }> = ({
  sticker,
}) => {
  const isSvg = useMemo(() => isSvgMarkup(sticker.imageData), [sticker.imageData]);
  const sanitizedSvg = useMemo(() => {
    if (!isSvg || !sticker.imageData) return '';
    return DOMPurify.sanitize(sticker.imageData);
  }, [isSvg, sticker.imageData]);

  const maskClass =
    sticker.mask && sticker.mask !== 'none' ? `stk-mask-${sticker.mask}` : '';
  const animClass =
    sticker.animation && sticker.animation !== 'none'
      ? `stk-anim-${sticker.animation}`
      : '';

  if (!sticker.imageData) {
    return (
      <div
        className={`${maskClass} ${animClass}`}
        style={{
          width: '100%',
          aspectRatio: '1/1',
          borderRadius: 18,
          background: 'rgba(99,102,241,0.16)',
          border: '2px dashed rgba(99,102,241,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6366f1',
        }}
      >
        <ImageIcon size={28} />
      </div>
    );
  }

  return (
    <div
      className={animClass}
      style={{
        width: '100%',
        filter: getStickerFilter(sticker),
      }}
    >
      {isSvg ? (
        <div
          className={maskClass}
          style={{ width: '100%', height: 'auto', lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      ) : (
        <img
          src={sticker.imageData}
          alt={sticker.label || 'Stiker'}
          draggable={false}
          className={maskClass}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   1. PUBLIC OVERLAY RENDERER (LandingPage.tsx)
   - sticky stickers: position: fixed (melayang sticky ikut scroll)
   - page stickers:   position: absolute (menempel di posisi halaman)
══════════════════════════════════════════════════════════════════════════════ */
export const LPFloatingStickersOverlay: React.FC<{
  stickers?: FloatingStickerItem[];
}> = ({ stickers }) => {
  const navigate = useNavigate();

  const activeStickers = useMemo(
    () => (stickers || []).filter((s) => s && s.visible !== false && s.imageData),
    [stickers],
  );

  if (activeStickers.length === 0) return null;

  const stickyList = activeStickers.filter((s) => s.positionMode !== 'page');
  const pageList = activeStickers.filter((s) => s.positionMode === 'page');

  const handleStickerClick = (linkUrl?: string) => {
    if (!linkUrl) return;
    if (linkUrl.startsWith('/')) {
      navigate(linkUrl);
    } else if (/^https?:\/\//i.test(linkUrl)) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } else if (linkUrl.startsWith('#')) {
      const target = document.querySelector(linkUrl);
      target?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderStickerNode = (sticker: FloatingStickerItem, idx: number, total: number) => {
    const clickable = Boolean(sticker.linkUrl && sticker.linkUrl.trim());
    const baseW = sticker.width ?? 110;
    const minW = Math.max(34, Math.round(baseW * 0.56));
    const vwPct = Math.round((baseW / 1180) * 1000) / 10;
    const clampedX = Math.max(6, Math.min(94, sticker.x ?? 80));
    const clampedY = Math.max(5, Math.min(94, sticker.y ?? 20));
    return (
      <div
        key={sticker.id}
        onClick={clickable ? () => handleStickerClick(sticker.linkUrl) : undefined}
        title={clickable ? sticker.label || sticker.linkUrl : undefined}
        style={{
          position: 'absolute',
          left: `${clampedX}%`,
          top: `${clampedY}%`,
          width: `clamp(${minW}px, ${vwPct}vw, ${baseW}px)`,
          maxWidth: '28vw',
          transform: `translate(-50%, -50%) rotate(${sticker.rotation ?? 0}deg)`,
          transformOrigin: 'center center',
          opacity: sticker.opacity ?? 1,
          zIndex: 40 + (total - idx),
          pointerEvents: clickable ? 'auto' : 'none',
          cursor: clickable ? 'pointer' : 'default',
          transition: 'transform 0.2s ease',
        }}
      >
        <StickerVisualContent sticker={sticker} />
      </div>
    );
  };

  return (
    <>
      {pageList.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 35,
            overflow: 'hidden',
          }}
        >
          {pageList.map((s, idx) => renderStickerNode(s, idx, pageList.length))}
        </div>
      )}

      {stickyList.length > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 45,
            overflow: 'hidden',
          }}
        >
          {stickyList.map((s, idx) => renderStickerNode(s, idx, stickyList.length))}
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   2. VISUAL WEB EDITOR OVERLAY & INSPECTOR (VisualWebEditor.tsx)
   - Drag anywhere on canvas, resize corner, rotate handle, upload image,
     choose from MediaGalleryModal, preset samples, masks, animations, sticky toggle.
══════════════════════════════════════════════════════════════════════════════ */
interface EditorLayerProps {
  stickers: FloatingStickerItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: FloatingStickerItem[]) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
  accentColor: string;
  onOpenMediaGallery: (stickerId: string) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LPFloatingStickersEditorLayer: React.FC<EditorLayerProps> = ({
  stickers,
  selectedId,
  onSelect,
  onChange,
  canvasRef,
  isDark,
  accentColor,
  onOpenMediaGallery,
  notify,
}) => {
  const dragState = useRef<{
    id: string;
    mode: 'move' | 'resize' | 'rotate';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const [interactingId, setInteractingId] = useState<string | null>(null);
  const [livePatch, setLivePatch] = useState<{ id: string; patch: Partial<FloatingStickerItem> } | null>(null);
  const livePatchRef = useRef<{ id: string; patch: Partial<FloatingStickerItem> } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const effectiveStickers = useMemo(() => {
    if (!livePatch) return stickers;
    return stickers.map((s) => (s.id === livePatch.id ? { ...s, ...livePatch.patch } : s));
  }, [stickers, livePatch]);

  const selectedSticker = useMemo(
    () => effectiveStickers.find((s) => s.id === selectedId) || null,
    [effectiveStickers, selectedId],
  );

  const updateSticker = (id: string, patch: Partial<FloatingStickerItem>) => {
    onChange(stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const duplicateSticker = (sticker: FloatingStickerItem) => {
    const copy: FloatingStickerItem = {
      ...sticker,
      id: `fstk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: Math.min(92, (sticker.x ?? 50) + 4),
      y: Math.min(92, (sticker.y ?? 20) + 4),
    };
    onChange([...stickers, copy]);
    onSelect(copy.id);
    notify('Stiker melayang diduplikat', 'success');
  };

  const removeSticker = (id: string) => {
    onChange(stickers.filter((s) => s.id !== id));
    if (selectedId === id) onSelect(null);
    notify('Stiker melayang dihapus', 'info');
  };

  useEffect(() => {
    if (!interactingId) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const state = dragState.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      let nextPatch: Partial<FloatingStickerItem> | null = null;
      if (state.mode === 'move') {
        const activeSticker = stickers.find((s) => s.id === state.id);
        const isStickyMode = activeSticker?.positionMode !== 'page';
        const refHeight = isStickyMode
          ? Math.min(window.innerHeight * 0.82, 760)
          : rect.height;
        const dxPct = ((clientX - state.startX) / rect.width) * 100;
        const dyPct = ((clientY - state.startY) / Math.max(240, refHeight)) * 100;
        const nx = Math.max(6, Math.min(94, state.origX + dxPct));
        const ny = Math.max(5, Math.min(94, state.origY + dyPct));
        nextPatch = {
          x: Math.round(nx * 10) / 10,
          y: Math.round(ny * 10) / 10,
        };
      } else if (state.mode === 'resize') {
        const nw = Math.max(36, Math.min(380, state.origW + (clientX - state.startX)));
        nextPatch = { width: Math.round(nw) };
      } else if (state.mode === 'rotate') {
        const angle =
          Math.atan2(clientY - state.centerY, clientX - state.centerX) *
            (180 / Math.PI) +
          90;
        nextPatch = { rotation: Math.round(angle) };
      }

      if (nextPatch) {
        const nextObj = { id: state.id, patch: nextPatch };
        livePatchRef.current = nextObj;
        if (rafRef.current === null) {
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            if (livePatchRef.current) setLivePatch({ ...livePatchRef.current });
          });
        }
      }
    };

    const handleUp = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const finalPatch = livePatchRef.current;
      livePatchRef.current = null;
      setLivePatch(null);
      dragState.current = null;
      setInteractingId(null);
      if (finalPatch) {
        updateSticker(finalPatch.id, finalPatch.patch);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [interactingId, stickers]);

  const handleUploadFile = async (file: File, stickerId: string) => {
    setIsUploading(true);
    try {
      const res = await uploadToCloudinary(file, 'image');
      if (res?.url) {
        updateSticker(stickerId, { imageData: res.url, label: file.name });
        notify('Gambar stiker berhasil diunggah', 'success');
      } else {
        notify('Gagal mengunggah gambar stiker', 'error');
      }
    } catch {
      notify('Gagal mengunggah gambar stiker', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const panelBg = isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  const renderEditorSticker = (sticker: FloatingStickerItem, idx: number, total: number) => {
    const isSel = selectedId === sticker.id;
    const isHidden = sticker.visible === false;
    const baseW = sticker.width ?? 112;
    const minW = Math.max(34, Math.round(baseW * 0.56));
    const vwPct = Math.round((baseW / 1180) * 1000) / 10;
    const clampedX = Math.max(6, Math.min(94, sticker.x ?? 80));
    const clampedY = Math.max(5, Math.min(94, sticker.y ?? 20));
    return (
      <div
        key={sticker.id}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect(sticker.id);
          dragState.current = {
            id: sticker.id,
            mode: 'move',
            startX: e.clientX,
            startY: e.clientY,
            origX: sticker.x ?? 80,
            origY: sticker.y ?? 20,
            origW: sticker.width ?? 112,
            centerX: 0,
            centerY: 0,
          };
          setInteractingId(sticker.id);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onSelect(sticker.id);
          const t = e.touches[0];
          dragState.current = {
            id: sticker.id,
            mode: 'move',
            startX: t.clientX,
            startY: t.clientY,
            origX: sticker.x ?? 80,
            origY: sticker.y ?? 20,
            origW: sticker.width ?? 112,
            centerX: 0,
            centerY: 0,
          };
          setInteractingId(sticker.id);
        }}
        style={{
          position: 'absolute',
          left: `${clampedX}%`,
          top: `${clampedY}%`,
          width: `clamp(${minW}px, ${vwPct}vw, ${baseW}px)`,
          maxWidth: '28vw',
          transform: `translate(-50%, -50%) rotate(${sticker.rotation ?? 0}deg)`,
          transformOrigin: 'center center',
          opacity: isHidden ? 0.25 : sticker.opacity ?? 1,
          zIndex: isSel ? 99 : 60 + (total - idx),
          pointerEvents: 'auto',
                cursor: interactingId === sticker.id ? 'grabbing' : 'grab',
                outline: isSel ? `2px dashed ${accentColor}` : '1px dashed transparent',
                outlineOffset: 4,
                borderRadius: 12,
                userSelect: 'none',
              }}
              title="Seret untuk menempelkan stiker di mana saja"
            >
              <StickerVisualContent sticker={sticker} />

              {/* Mode badge (Sticky vs Page) */}
              {isSel && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      top: -26,
                      left: '50%',
                      transform: `translateX(-50%) rotate(${-(sticker.rotation ?? 0)}deg)`,
                      background: accentColor,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 100,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Move size={10} />
                    <span>
                      {sticker.positionMode === 'page' ? 'Tempel Halaman' : 'Melayang Sticky'}
                    </span>
                  </div>

                  {/* Rotate handle (top-right) */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const elRect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (!elRect) return;
                      dragState.current = {
                        id: sticker.id,
                        mode: 'rotate',
                        startX: e.clientX,
                        startY: e.clientY,
                        origX: sticker.x,
                        origY: sticker.y,
                        origW: sticker.width,
                        centerX: elRect.left + elRect.width / 2,
                        centerY: elRect.top + elRect.height / 2,
                      };
                      setInteractingId(sticker.id);
                    }}
                    title="Putar stiker"
                    style={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '2px solid #fff',
                      background: '#6366f1',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'alias',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                    }}
                  >
                    <RotateCw size={11} />
                  </button>

                  {/* Resize handle (bottom-right) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      dragState.current = {
                        id: sticker.id,
                        mode: 'resize',
                        startX: e.clientX,
                        startY: e.clientY,
                        origX: sticker.x,
                        origY: sticker.y,
                        origW: sticker.width ?? 112,
                        centerX: 0,
                        centerY: 0,
                      };
                      setInteractingId(sticker.id);
                    }}
                    title="Tarik untuk ubah ukuran stiker"
                    style={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: '2px solid #fff',
                      background: accentColor,
                      cursor: 'nwse-resize',
                      boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                    }}
                  />
                </>
              )}
            </div>
          );
  };

  const pageEditorStickers = effectiveStickers.filter((s) => s.positionMode === 'page');
  const stickyEditorStickers = effectiveStickers.filter((s) => s.positionMode !== 'page');

  return (
    <>
      {/* Overlay Container on Canvas: Page Stickers + Viewport-Locked Sticky Frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 55,
          overflow: 'hidden',
        }}
      >
        {pageEditorStickers.map((sticker, idx) =>
          renderEditorSticker(sticker, idx, pageEditorStickers.length),
        )}

        {stickyEditorStickers.length > 0 && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              width: '100%',
              height: 'min(82vh, 760px)',
              pointerEvents: 'none',
              zIndex: 58,
            }}
          >
            {stickyEditorStickers.map((sticker, idx) =>
              renderEditorSticker(sticker, idx, stickyEditorStickers.length),
            )}
          </div>
        )}
      </div>

      {/* Selected Sticker Inspector Drawer (Floating in Canvas Corner, Mobile Dock-Safe) */}
      {selectedSticker && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            right: 14,
            bottom: typeof window !== 'undefined' && window.innerWidth < 768 ? 84 : 22,
            width: 340,
            maxWidth: 'calc(100vw - 28px)',
            maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '52vh' : '78vh',
            overflowY: 'auto',
            zIndex: 9999,
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: 20,
            padding: 16,
            boxShadow: '0 22px 50px rgba(0,0,0,0.28)',
            color: textColor,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: `1px solid ${panelBorder}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  background: `${accentColor}20`,
                  color: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={14} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Stiker Melayang (LP Image)</div>
                <div style={{ fontSize: 11, color: subTextColor }}>
                  Seret di kanvas untuk menempel di mana saja
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(null)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: `1px solid ${panelBorder}`,
                background: 'transparent',
                color: subTextColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Tutup panel stiker"
            >
              <X size={14} />
            </button>
          </div>

          {/* Upload / Media Gallery / URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: accentColor,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: isUploading ? 'wait' : 'pointer',
                }}
              >
                <Upload size={13} />
                <span>{isUploading ? 'Mengunggah...' : 'Upload Gambar'}</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFile(f, selectedSticker.id);
                    e.target.value = '';
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => onOpenMediaGallery(selectedSticker.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${panelBorder}`,
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                  color: textColor,
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={13} />
                <span>Galeri Media</span>
              </button>
            </div>

            <input
              type="text"
              value={isSvgMarkup(selectedSticker.imageData) ? '' : selectedSticker.imageData}
              onChange={(e) =>
                updateSticker(selectedSticker.id, { imageData: e.target.value })
              }
              placeholder="Atau tempel URL gambar / PNG transparan..."
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 9,
                border: `1px solid ${panelBorder}`,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                color: textColor,
                fontSize: 12,
              }}
            />
          </div>

          {/* Preset Samples from LP Image */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 750, color: subTextColor, marginBottom: 6 }}>
              Contoh Stiker LP Image
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LP_IMAGE_STICKER_SAMPLES.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    updateSticker(selectedSticker.id, {
                      imageData: sample.src,
                      label: sample.label,
                      mask: sample.mask,
                      animation: sample.animation,
                    })
                  }
                  style={{
                    width: 42,
                    height: 42,
                    padding: 4,
                    borderRadius: 10,
                    border: `1px solid ${panelBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={sample.label}
                >
                  <img
                    src={sample.src}
                    alt={sample.label}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Mode Melayang Sticky vs Tempel di Halaman */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 750, color: subTextColor, marginBottom: 6 }}>
              Perilaku Tempelan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { key: 'sticky', label: 'Melayang Sticky' },
                { key: 'page', label: 'Tempel di Halaman' },
              ].map((m) => {
                const active = (selectedSticker.positionMode || 'sticky') === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() =>
                      updateSticker(selectedSticker.id, {
                        positionMode: m.key as 'sticky' | 'page',
                      })
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '6px 8px',
                      borderRadius: 9,
                      border: `1px solid ${active ? accentColor : panelBorder}`,
                      background: active ? `${accentColor}1c` : 'transparent',
                      color: active ? accentColor : textColor,
                      fontSize: 11.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    <Pin size={11} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders: Ukuran, Rotasi, Opasitas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: subTextColor }}>
                <span>Ukuran</span>
                <span>{selectedSticker.width ?? 112}px</span>
              </div>
              <input
                type="range"
                min={36}
                max={340}
                value={selectedSticker.width ?? 112}
                onChange={(e) =>
                  updateSticker(selectedSticker.id, { width: Number(e.target.value) })
                }
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: subTextColor }}>
                <span>Rotasi</span>
                <span>{selectedSticker.rotation ?? 0}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={selectedSticker.rotation ?? 0}
                onChange={(e) =>
                  updateSticker(selectedSticker.id, { rotation: Number(e.target.value) })
                }
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: subTextColor }}>
                <span>Opasitas</span>
                <span>{Math.round((selectedSticker.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round((selectedSticker.opacity ?? 1) * 100)}
                onChange={(e) =>
                  updateSticker(selectedSticker.id, {
                    opacity: Number(e.target.value) / 100,
                  })
                }
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Mask & Animasi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 750, color: subTextColor, marginBottom: 4 }}>
                Bentuk / Mask
              </div>
              <select
                value={selectedSticker.mask || 'none'}
                onChange={(e) =>
                  updateSticker(selectedSticker.id, {
                    mask: e.target.value as StickerMaskType,
                  })
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1px solid ${panelBorder}`,
                  background: isDark ? '#0f172a' : '#fff',
                  color: textColor,
                  fontSize: 12,
                }}
              >
                {STICKER_MASKS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 750, color: subTextColor, marginBottom: 4 }}>
                Animasi
              </div>
              <select
                value={selectedSticker.animation || 'float'}
                onChange={(e) =>
                  updateSticker(selectedSticker.id, {
                    animation: e.target.value as StickerAnimType,
                  })
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: `1px solid ${panelBorder}`,
                  background: isDark ? '#0f172a' : '#fff',
                  color: textColor,
                  fontSize: 12,
                }}
              >
                {STICKER_ANIMS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Link URL */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 750, color: subTextColor, marginBottom: 4 }}>
              <Link2 size={11} />
              <span>Link Klik (Opsional)</span>
            </div>
            <input
              type="text"
              value={selectedSticker.linkUrl || ''}
              onChange={(e) =>
                updateSticker(selectedSticker.id, { linkUrl: e.target.value })
              }
              placeholder="/katalog atau https://..."
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${panelBorder}`,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                color: textColor,
                fontSize: 12,
              }}
            />
          </div>

          {/* Bottom Actions: Visibility, Duplicate, Delete, Add New */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              paddingTop: 10,
              borderTop: `1px solid ${panelBorder}`,
            }}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() =>
                  updateSticker(selectedSticker.id, {
                    visible: selectedSticker.visible === false,
                  })
                }
                title={selectedSticker.visible === false ? 'Tampilkan' : 'Sembunyikan'}
                style={{
                  padding: '6px 9px',
                  borderRadius: 8,
                  border: `1px solid ${panelBorder}`,
                  background: 'transparent',
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11.5,
                }}
              >
                {selectedSticker.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>

              <button
                type="button"
                onClick={() => duplicateSticker(selectedSticker)}
                title="Duplikat stiker"
                style={{
                  padding: '6px 9px',
                  borderRadius: 8,
                  border: `1px solid ${panelBorder}`,
                  background: 'transparent',
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Copy size={13} />
              </button>

              <button
                type="button"
                onClick={() => removeSticker(selectedSticker.id)}
                title="Hapus stiker"
                style={{
                  padding: '6px 9px',
                  borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.35)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const ns = createDefaultFloatingSticker({
                  x: 20 + (stickers.length % 4) * 15,
                  y: 25 + (stickers.length % 4) * 12,
                });
                onChange([...stickers, ns]);
                onSelect(ns.id);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 9,
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>Tambah Lagi</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
