import React, { useState, useEffect, useMemo, memo } from 'react';
import { ShieldCheck, Star, CheckCircle2 } from 'lucide-react';
import { storage } from '../../utils/storage';

export interface ClientItem {
  id: string;
  name: string;
  clientName?: string;
  role?: string;
  logo?: string;
  industry?: string;
  rating?: number;
  quote?: string;
  serviceCategory?: string;
}

interface LPClientMarqueeProps {
  clients?: ClientItem[];
  isDark: boolean;
  accentColor?: string;
  badge?: string;
  title?: string;
  metric1?: string;
  metric2?: string;
  isEditable?: boolean;
  onUpdateBadge?: (val: string) => void;
  onUpdateTitle?: (val: string) => void;
  onUpdateMetric1?: (val: string) => void;
  onUpdateMetric2?: (val: string) => void;
}

const DEFAULT_PARTNERS: ClientItem[] = [
  {
    id: 'cp-1',
    name: 'TechIndo Global',
    clientName: 'Hendra Gunawan',
    role: 'Head of Tech',
    industry: 'SaaS & Enterprise',
    rating: 5,
    serviceCategory: 'Web Platform',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
  },
  {
    id: 'cp-2',
    name: 'Kopi Kenangan Senja',
    clientName: 'Siti Rahmania',
    role: 'Marketing Lead',
    industry: 'F&B & Lifestyle',
    rating: 5,
    serviceCategory: 'Katalog & Promo',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80'
  },
  {
    id: 'cp-3',
    name: 'Nusantara Creative',
    clientName: 'Alif Pratama',
    role: 'Art Director',
    industry: 'Design Agency',
    rating: 5,
    serviceCategory: 'Branding & Web',
    logo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80'
  },
  {
    id: 'cp-4',
    name: 'Nusantara Logistics',
    clientName: 'Irwan Setiadi',
    role: 'Operations VP',
    industry: 'Supply Chain Tech',
    rating: 5,
    serviceCategory: 'Enterprise Portal',
    logo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80'
  },
  {
    id: 'cp-5',
    name: 'Studio Kreatif ID',
    clientName: 'Jessica Tania',
    role: 'Creative Producer',
    industry: 'Media & Production',
    rating: 5,
    serviceCategory: 'Creative Drops',
    logo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'
  },
  {
    id: 'cp-6',
    name: 'Skena Collective',
    clientName: 'Dimas Wicaksono',
    role: 'Brand Manager',
    industry: 'Fashion Culture',
    rating: 5,
    serviceCategory: 'Brand Experience',
    logo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80'
  },
  {
    id: 'cp-7',
    name: 'Vibe Digital Lab',
    clientName: 'Farhan Maulana',
    role: 'Product Lead',
    industry: 'Interactive Apps',
    rating: 5,
    serviceCategory: 'UI/UX Engineering',
    logo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80'
  },
  {
    id: 'cp-8',
    name: 'Lumina Space & Event',
    clientName: 'Anita Wijaya',
    role: 'Event Director',
    industry: 'Space & Activation',
    rating: 5,
    serviceCategory: 'Event Activation',
    logo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&q=80'
  },
];

export const LPClientMarquee: React.FC<LPClientMarqueeProps> = ({
  clients,
  isDark,
  accentColor = '#f59e0b',
  badge = 'DIPERCAYA 50+ BRAND & KLIEN AKTIF',
  title = 'Kolaborasi Bersama Brand Terpilih di Seluruh Indonesia',
  metric1 = '100% On-Time Delivery',
  metric2 = '4.9 / 5 Rating Kepuasan',
  isEditable = false,
  onUpdateBadge,
  onUpdateTitle,
  onUpdateMetric1,
  onUpdateMetric2,
}) => {
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadReviewsFromDb = async () => {
      try {
        const saved = await storage.getItem('porto_client_reviews');
        if (!isMounted) return;
        if (Array.isArray(saved) && saved.length > 0) {
          const published = saved.filter((r: any) => r.isPublished !== false);
          setDbReviews(published);
        }
      } catch (e) {
        if (isMounted) console.error('Failed to load db reviews for marquee:', e);
      }
    };

    loadReviewsFromDb();
    const handleUpdate = () => loadReviewsFromDb();
    window.addEventListener('porto_reviews_updated', handleUpdate);
    window.addEventListener('porto_testimonials_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('porto_reviews_updated', handleUpdate);
      window.removeEventListener('porto_testimonials_updated', handleUpdate);
    };
  }, []);

  // Compute final partner list
  const partnerList = useMemo<ClientItem[]>(() => {
    if (dbReviews.length > 0) {
      const fromReviews: ClientItem[] = dbReviews.map((r, i) => {
        const brandName = (r.brand && r.brand.trim()) || r.clientName || `Klien ${i + 1}`;
        const sub = r.brand && r.brand.trim()
          ? `${r.clientName}${r.role ? ` â€¢ ${r.role}` : ''}`
          : (r.role || r.serviceCategory || 'Klien Terverifikasi');

        return {
          id: r.id || `rev-${i}`,
          name: brandName,
          clientName: r.clientName,
          role: r.role,
          industry: sub,
          quote: r.quote || r.text,
          logo: r.avatarUrl || r.avatar,
          rating: r.rating || 5,
          serviceCategory: r.serviceCategory
        };
      });

      return fromReviews;
    }

    if (Array.isArray(clients) && clients.length > 0) {
      return clients.map((c, i) => ({
        id: c.id || `c-${i}`,
        name: c.name,
        clientName: c.clientName,
        role: c.role,
        logo: c.logo,
        industry: c.industry || 'Mitra Bisnis',
        rating: c.rating || 5,
        quote: c.quote,
        serviceCategory: c.serviceCategory
      }));
    }

    return DEFAULT_PARTNERS;
  }, [clients, dbReviews]);


  const textColor = isDark ? '#ffffff' : '#0f1115';
  const subTextColor = isDark ? '#9aa1ad' : '#5b6170';
  const sectionBg = isDark ? '#06070a' : '#eef2f6';
  const surface = isDark ? '#151824' : '#ffffff';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <section
      id="clients"
      aria-label="Mitra dan Klien Studio"
      style={{
        width: '100%',
        padding: 'clamp(32px, 5vw, 48px) clamp(16px, 3.5vw, 24px)',
        background: sectionBg,
        borderBottom: `1px solid ${borderCol}`,
        position: 'relative',
        overflowX: 'clip',
        overflowY: 'visible',
        boxSizing: 'border-box',
      }}
    >
      {/* Keyframes & classes are defined globally in index.css â€” no inline <style> needed */}
      <style>{`
        .lpcm-chip { transition: transform .2s ease; }
        .lpcm-chip:hover { transform: scale(1.03); }
        @media (max-width: 640px) {
          .lpcm-header { flex-direction: column; align-items: flex-start !important; }
          .lpcm-title { font-size: 1.15rem !important; }
        }
      `}</style>
      <div
        style={{
          maxWidth: 1240,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* â”€â”€ Trust Highlights Header (Clean, Minimal, Tanpa Tombol Jeda) â”€â”€ */}
        <div
          data-reveal="true"
          className="lpcm-header"
          style={{
            width: '100%',
            margin: '0 0 24px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Left: Status Pill & Headline */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, minWidth: 0, flex: '1 1 320px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: surface,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: accentColor,
                  flexShrink: 0,
                }}
              />
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateBadge?.(e.currentTarget.textContent || badge)}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: textColor,
                  outline: 'none',
                  cursor: isEditable ? 'text' : 'default'
                }}
                title={isEditable ? 'Klik untuk mengedit badge status' : undefined}
              >
                {badge}
              </span>
            </div>

            <span
              className="lpcm-title"
              contentEditable={isEditable}
              suppressContentEditableWarning
              onBlur={(e) => onUpdateTitle?.(e.currentTarget.textContent || title)}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                color: textColor,
                outline: 'none',
                cursor: isEditable ? 'text' : 'default'
              }}
              title={isEditable ? 'Klik untuk mengedit judul' : undefined}
            >
              {title}
            </span>
          </div>

          {/* Right: Trust Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div
              className="lpcm-chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: textColor,
                background: surface,
                padding: '8px 14px 8px 8px',
                borderRadius: 999,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={13.5} color={accentColor} />
              </span>
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateMetric1?.(e.currentTarget.textContent || metric1)}
                style={{ outline: 'none', cursor: isEditable ? 'text' : 'default' }}
                title={isEditable ? 'Klik untuk mengedit teks garansi' : undefined}
              >
                {metric1}
              </span>
            </div>

            <div
              className="lpcm-chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                background: accentColor,
                padding: '8px 14px 8px 8px',
                borderRadius: 999,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Star size={12} color="#ffffff" fill="#ffffff" />
              </span>
              <span
                contentEditable={isEditable}
                suppressContentEditableWarning
                onBlur={(e) => onUpdateMetric2?.(e.currentTarget.textContent || metric2)}
                style={{ outline: 'none', cursor: isEditable ? 'text' : 'default' }}
                title={isEditable ? 'Klik untuk mengedit rating kepuasan' : undefined}
              >
                {metric2}
              </span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Strict 1-Row Continuous Looping Marquee Strip (Jalan Terus Tanpa Henti) â”€â”€ */}
        <div
          data-reveal="true"
          className="sumr-marquee-track reveal-delay-1"
          style={{
            position: 'relative',
            width: '100%',
            overflowX: 'clip',
            overflowY: 'visible',
            padding: '26px 0',
            margin: '-20px 0',
            maskImage: 'linear-gradient(to right, transparent 0%, black clamp(50px, 9vw, 130px), black calc(100% - clamp(50px, 9vw, 130px)), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black clamp(50px, 9vw, 130px), black calc(100% - clamp(50px, 9vw, 130px)), transparent 100%)',
          }}
        >
          {/* Left Silky Fade Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 'clamp(50px, 9vw, 130px)',
              background: `linear-gradient(to right, ${sectionBg} 0%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* Right Silky Fade Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 'clamp(50px, 9vw, 130px)',
              background: `linear-gradient(to left, ${sectionBg} 0%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              width: 'max-content',
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            {/* GROUP 1: Primary Stream */}
            <div className="sumr-marquee-loop-row">
              {partnerList.map((item, idx) => (
                <MarqueeCard
                  key={`g1-${item.id}-${idx}`}
                  item={item}
                  isDark={isDark}
                  accentColor={accentColor}
                  textColor={textColor}
                  subTextColor={subTextColor}
                  borderCol={borderCol}
                />
              ))}
            </div>

            {/* GROUP 2: Identical Clone for Seamless Infinite Gliding */}
            <div className="sumr-marquee-loop-row" aria-hidden="true">
              {partnerList.map((item, idx) => (
                <MarqueeCard
                  key={`g2-${item.id}-${idx}`}
                  item={item}
                  isDark={isDark}
                  accentColor={accentColor}
                  textColor={textColor}
                  subTextColor={subTextColor}
                  borderCol={borderCol}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// â”€â”€ Rapi, Proporsional, & Bersih: Flat Minimal Marquee Pill Card â”€â”€
interface MarqueeCardProps {
  item: ClientItem;
  isDark: boolean;
  accentColor: string;
  textColor: string;
  subTextColor: string;
  borderCol: string;
}

const MarqueeCard: React.FC<MarqueeCardProps> = memo(function MarqueeCard({
  item,
  isDark,
  accentColor,
  textColor,
  subTextColor,
}: MarqueeCardProps) {
  const hasValidLogo = Boolean(
    item.logo &&
    (item.logo.startsWith('http') || item.logo.startsWith('data:') || item.logo.startsWith('/'))
  );

  const subLabel = item.serviceCategory
    ? `#${item.serviceCategory}`
    : (item.role ? `${item.clientName || ''} â€¢ ${item.role}` : (item.industry || 'Mitra Bisnis'));

  const surface = isDark ? '#151824' : '#ffffff';
  const surface2 = isDark ? '#1f2436' : '#e2e8f0';

  return (
    <div
      className="sumr-marquee-card-item lpcm-card"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '7px 16px 7px 7px',
        borderRadius: 999,
        background: surface,
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)'}`,
        boxShadow: 'none',
        cursor: 'default',
        height: 50,
        boxSizing: 'border-box',
      }}
    >
      {/* Avatar / Logo with Verified Dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {hasValidLogo ? (
          <img
            src={item.logo}
            alt={item.name}
            loading="lazy"
            decoding="async"
            width={36}
            height={36}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
              background: surface2,
              display: 'block'
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 13,
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            {item.name.charAt(0)}
          </div>
        )}

        {/* Small Verified Check Dot */}
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: accentColor,
            border: `2px solid ${surface}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}
        >
          <CheckCircle2 size={8} color="#ffffff" />
        </div>
      </div>

      {/* Info: Brand Name, Rating & Subtitle Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 14,
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </span>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            fontWeight: 700,
            color: textColor,
            background: surface2,
            padding: '2px 7px',
            borderRadius: 999
          }}
        >
          <Star size={9} fill={accentColor} color={accentColor} />
          <span>{item.rating || 5}.0</span>
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: subTextColor,
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {subLabel}
        </span>
      </div>
    </div>
  );
});

export default LPClientMarquee;
