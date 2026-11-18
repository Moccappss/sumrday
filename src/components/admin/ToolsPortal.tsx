import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Globe2, StickyNote, Megaphone, Layers, Image as ImageIcon,
  LayoutGrid, FileSpreadsheet, Link2, LayoutTemplate
} from 'lucide-react';
import { getClientFlipbooks } from '../../services/flipbookService';
import { storage } from '../../utils/storage';
import { AdminPortalFeatureCard } from './AdminPortalFeatureCard';

interface ToolsPortalProps {
  onNavigate?: (page: string) => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

export const ToolsPortal: React.FC<ToolsPortalProps> = ({
  onNavigate,
  notify,
  isDarkMode = true
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [flipbookCount, setFlipbookCount] = useState(0);
  const [formsCount, setFormsCount] = useState(0);
  const [linksCount, setLinksCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [flipbooks, forms, links] = await Promise.all([
          getClientFlipbooks(),
          storage.getItem('porto_forms', []),
          storage.getItem('porto_links', [])
        ]);
        setFlipbookCount(Array.isArray(flipbooks) ? flipbooks.length : 0);
        setFormsCount(Array.isArray(forms) ? forms.length : 0);
        const lList = Array.isArray(links) ? links : (links?.links || []);
        setLinksCount(lList.length);
      } catch (err) {
        console.error('Failed to load tools count:', err);
      }
    };
    load();
  }, []);

  const cards = useMemo(() => [
    {
      key: 'poster-promo',
      title: 'Poster',
      badge: '100 Desain',
      subtitle: 'Studio poster sosial & video MP4',
      icon: LayoutTemplate,
      paletteIndex: 1,
    },
    {
      key: 'builder',
      title: 'LP Image',
      badge: 'Canvas',
      subtitle: 'Kanvas visual halaman utama',
      icon: ImageIcon,
      paletteIndex: 0,
    },
    {
      key: 'flipbook',
      title: 'Flipbook',
      badge: flipbookCount ? `${flipbookCount} Buku` : 'PDF Flip',
      subtitle: 'Publikasi katalog PDF interaktif',
      icon: BookOpen,
      paletteIndex: 2,
    },
    {
      key: 'visual-editor',
      title: 'Web Studio',
      badge: 'Builder',
      subtitle: 'Perancang tata letak halaman',
      icon: Globe2,
      paletteIndex: 3,
    },
    {
      key: 'apps',
      title: 'Apps',
      badge: 'Modul App',
      subtitle: 'Undangan digital & mikro-app',
      icon: LayoutGrid,
      paletteIndex: 4,
    },
    {
      key: 'forms',
      title: 'Forms',
      badge: formsCount ? `${formsCount} Form` : 'Formulir',
      subtitle: 'Kuesioner & brief klien otomatis',
      icon: FileSpreadsheet,
      paletteIndex: 5,
    },
    {
      key: 'links',
      title: 'Links',
      badge: 'Link & QR',
      subtitle: 'Portal tautan bio & kode QR',
      icon: Link2,
      paletteIndex: 6,
    },
    {
      key: 'broadcast',
      title: 'Waves',
      badge: 'Siaran',
      subtitle: 'Pengumuman & rilis publik',
      icon: Megaphone,
      paletteIndex: 7,
    },
    {
      key: 'notes',
      title: 'Memo',
      badge: 'Ide & Sketsa',
      subtitle: 'Catatan konsep & kanvas sketsa',
      icon: StickyNote,
      paletteIndex: 8,
    }
  ], [flipbookCount, formsCount, linksCount]);

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: isMobile ? 'flex-start' : 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
      padding: isMobile ? '20px 16px 8px' : '28px 32px 60px',
      color: 'var(--cms-text, currentColor)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ maxWidth: 1140, width: '100%', margin: isMobile ? '0 auto' : 'auto' }}>

        {/* ── HEADER (Tanpa Keterangan Berlebihan) ── */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            borderRadius: 100,
            background: 'var(--cms-accent-soft, rgba(217, 86, 41, 0.12))',
            color: 'var(--cms-accent, #D95629)',
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 8
          }}>
            <Layers size={13} strokeWidth={2.4} />
            <span>Peralatan Kreatif</span>
          </div>

          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 26 : 32,
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
            letterSpacing: '-0.03em',
            color: isDarkMode ? 'var(--cms-text, #f8fafc)' : 'var(--cms-text, #0f172a)',
            WebkitFontSmoothing: 'antialiased',
          }}>
            Tool Studio
          </h1>
        </div>

        {/* ── FLUTED RIBBED FEATURE CARDS GRID ── */}
        <div className="admin-feature-portal-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(3, minmax(0, 1fr))',
            gap: isMobile ? 14 : 18
          }}>
          {cards.map((card, idx) => (
            <AdminPortalFeatureCard
              key={card.key}
              index={idx}
              title={card.title}
              badge={card.badge}
              subtitle={card.subtitle}
              tagLabel="tool"
              routeKey={card.key}
              icon={card.icon}
              paletteIndex={card.paletteIndex}
              variant="fluted"
              isMobile={isMobile}
              isDarkMode={isDarkMode}
              onClick={() => {
                if (card.key === 'builder') onNavigate?.('home');
                else onNavigate?.(card.key);
              }}
            />
          ))}
        </div>

        {/* Dedicated Mobile Bottom Spacer to ensure the last card (Memo) is never covered by bottom dock */}
        {isMobile && <div style={{ height: 110, width: '100%', flexShrink: 0 }} />}

      </div>
    </div>
  );
};

export default ToolsPortal;
