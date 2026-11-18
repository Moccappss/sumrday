import React, { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { storage } from '../../utils/storage';

/**
 * MarkerModal — tombol melayang rata kiri, tanpa background container.
 * Konten di belakang diblur via class 'blur-content' pada page-scroll.
 */
const MarkerModal = ({ isOpen, onClose, pageKey }) => {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!isOpen || !pageKey) return;
    const load = async () => {
      const raw = await storage.getItem('porto_pages');
      if (!raw) { setMarkers([]); return; }
      const blocks = (raw[pageKey] || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const all = [];
      blocks.forEach(block => (block.markers || []).forEach(m => all.push({ ...m, blockId: block.id })));
      setMarkers(all);
    };
    load();
    window.addEventListener('porto_saved', load);
    return () => window.removeEventListener('porto_saved', load);
  }, [isOpen, pageKey]);

  const jumpTo = (markerId) => {
    const el = document.getElementById(markerId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible tap-to-close backdrop */}
      <div onClick={onClose}
        style={{ position: 'absolute', inset: 0, zIndex: 800 }}
      />

      {/* Floating buttons — anchored bottom-right, level with contact button */}
      <div className="marker-list-scroll" style={{
        position: 'absolute',
        right: 80,
        bottom: '100px', 
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column', 
        alignItems: 'flex-end',
        justifyContent: 'flex-start', 
        gap: 8,
        maxHeight: 'calc(100% - 200px)', 
        width: 'calc(100% - 100px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        pointerEvents: 'auto',
        padding: '10px 14px 10px 10px',
      }}>
        <style>{`
          .marker-list-scroll::-webkit-scrollbar {
            width: 3px;
          }
          .marker-list-scroll::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.03);
            border-radius: 10px;
          }
          .marker-list-scroll::-webkit-scrollbar-thumb {
            background: rgba(var(--cms-accent-rgb), 0.3);
            border-radius: 10px;
          }
        `}</style>
        {markers.length === 0 ? (
          <div style={{
            padding: '10px 14px',
            background: 'var(--glass-bg)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            border: '1px solid var(--glass-border)',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--glass-text)',
            whiteSpace: 'nowrap',
          }}>
            Belum ada penanda
          </div>
        ) : markers.map(mk => (
          <button
            key={mk.id}
            onClick={(e) => { e.stopPropagation(); jumpTo(mk.id); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 10px 9px 14px',
              background: 'var(--glass-bg)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: '1px solid var(--glass-border)',
              borderRadius: 100,
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--glass-text)',
              whiteSpace: 'nowrap',
              maxWidth: '100%', // Allow shrinking if too long
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              transition: 'all 0.18s ease',
              animation: 'markerSlideIn 0.2s ease both',
            }}
            onMouseOver={e => { 
              e.currentTarget.style.background = 'var(--cms-card-bg)'; 
              e.currentTarget.style.transform = 'scale(1.05) translateX(-8px)'; 
            }}
            onMouseOut={e => { 
              e.currentTarget.style.background = 'var(--glass-bg)'; 
              e.currentTarget.style.transform = 'scale(1) translateX(0)'; 
            }}
          >
            {mk.svgData ? (
              <div style={{ width: 20, height: 20, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: mk.svgData }} />
            ) : (
              <Bookmark size={14} color="var(--cms-accent, #7c3aed)" />
            )}
            <span style={{ 
              fontSize: 12, 
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{mk.name}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default MarkerModal;
