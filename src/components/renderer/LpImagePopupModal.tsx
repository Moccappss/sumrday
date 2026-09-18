import React, { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import StickerItem from './StickerItem';
import { getOptimizedUrl } from './utils';

interface LpImagePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  popupId: string;
  title?: string;
  blocks: any[];
  stickers: any[];
}

const LpImagePopupModal: React.FC<LpImagePopupModalProps> = ({
  isOpen,
  onClose,
  popupId,
  title,
  blocks = [],
  stickers = []
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const stickersByBlock = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    const validBlockIds = new Set(blocks.map(b => b.id));
    const firstBlockId = blocks[0]?.id;

    stickers.forEach(s => {
      if (s.visible === false || s.isHidden === true) return;
      const targetBlockId = (s.blockId && validBlockIds.has(s.blockId)) ? s.blockId : firstBlockId;
      if (targetBlockId) {
        if (!grouped[targetBlockId]) grouped[targetBlockId] = [];
        grouped[targetBlockId].push(s);
      }
    });
    return grouped;
  }, [stickers, blocks]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.68)',
        animation: 'popupFadeIn 0.22s ease-out forwards'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col rounded-[22px] overflow-hidden shadow-2xl border border-white/15"
        style={{
          width: '80%',
          maxWidth: '560px',
          maxHeight: '86vh',
          backgroundColor: 'var(--cms-card-bg, #111827)',
          color: 'var(--cms-text, #f8fafc)',
          animation: 'popupZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button inside modal */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black/60 hover:bg-black/85 text-white shadow-lg border border-white/20"
          title="Tutup (Esc)"
          aria-label="Tutup"
          style={{ cursor: 'pointer' }}
        >
          <X size={16} />
        </button>

        {/* Scrollable Content (LP Image Blocks & Stickers) */}
        <div className="flex-1 overflow-y-auto overscroll-contain relative p-0" style={{ fontSize: 0, lineHeight: 0 }}>
          {blocks.length === 0 ? (
            <div className="py-16 px-6 text-center text-white/50 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-1 text-white/40">
                <X size={24} />
              </div>
              <p className="text-sm font-semibold">Pop-up Belum Memiliki Konten</p>
              <p className="text-xs text-white/40">Desain isi pop-up ini melalui editor CMS.</p>
            </div>
          ) : (
            blocks.map((block, idx) => {
              if (block.isHidden) return null;
              const mediaType = block.mediaType || 'image';

              let mediaEl = null;
              if (mediaType === 'solid') {
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
                  <div className="w-full relative" style={{ height: block.height || 40, margin: 0, padding: 0 }}>
                    {block.showLine && (
                      <div
                        className="absolute top-1/2 left-0 right-0 h-px"
                        style={{ backgroundColor: block.lineColor || 'rgba(255,255,255,0.1)' }}
                      />
                    )}
                  </div>
                );
              } else {
                mediaEl = (
                  <img
                    src={getOptimizedUrl(block.url, 800, block)}
                    alt={block.altText || ''}
                    loading={idx === 0 ? 'eager' : 'lazy'}
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

              const blockContent = (
                <div
                  key={block.id}
                  className="img-block relative overflow-hidden"
                  data-block-id={block.id}
                  style={{
                    margin: 0,
                    padding: 0,
                    border: 'none',
                    lineHeight: 0,
                    fontSize: 0,
                    display: 'block',
                    marginTop: idx > 0 ? '-1px' : 0
                  }}
                >
                  {mediaEl}
                  {/* Stickers inside this popup block */}
                  {(stickersByBlock[block.id] || []).map((s, i, arr) => (
                    <StickerItem key={s.id} sticker={s} total={arr.length} index={i} />
                  ))}
                </div>
              );

              if (block.linkUrl && mediaType !== 'spacer') {
                const safeLink = (block.linkUrl.startsWith('http://') || block.linkUrl.startsWith('https://'))
                  ? block.linkUrl
                  : `https://${block.linkUrl}`;
                return (
                  <a
                    key={block.id}
                    href={safeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block leading-none text-[0]"
                    style={{
                      display: 'block',
                      margin: 0,
                      padding: 0,
                      border: 'none',
                      lineHeight: 0,
                      fontSize: 0
                    }}
                  >
                    {blockContent}
                  </a>
                );
              }

              return blockContent;
            })
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes popupFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popupZoomIn {
            from { opacity: 0; transform: scale(0.92) translateY(12px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `
      }} />
    </div>
  );
};

export default LpImagePopupModal;
