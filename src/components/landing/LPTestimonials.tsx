import React, { useState, useEffect, useMemo } from 'react';
import { Star, Quote, CheckCircle2, MessageSquare, ShieldCheck, Sparkles, Building2, User, ThumbsUp } from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';

export interface TestimonialData {
  id: string;
  quote?: string;
  text?: string;
  author?: string;
  name?: string;
  clientName?: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
  company?: string;
  brand?: string;
  rating?: number;
  serviceCategory?: string;
  isPublished?: boolean;
}

interface LPTestimonialsProps {
  testimonials?: TestimonialData[];
  isDark?: boolean;
  accentColor?: string;
  localization?: any;
  badge?: string;
  title?: string;
  subtitle?: string;
  isEditable?: boolean;
  onUpdateBadge?: (val: string) => void;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
  onOpenManageReviews?: () => void;
}

const DEFAULT_REVIEWS: TestimonialData[] = [
  {
    id: 'rev-def-1',
    author: 'Alif Pratama',
    role: 'Founder & Art Director',
    brand: 'Nusantara Creative',
    company: 'Nusantara Creative',
    rating: 5,
    quote: 'Eksekusi desain dan sistem interaktifnya luar biasa memukau. Klien kami sangat terkesan dengan kecepatan loading, kehangatan visual Warm Tech, dan kemudahan navigasi.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    serviceCategory: 'Branding & Web'
  },
  {
    id: 'rev-def-2',
    author: 'Siti Rahmania',
    role: 'Marketing Lead',
    brand: 'Kopi Kenangan Senja',
    company: 'Kopi Kenangan Senja',
    rating: 5,
    quote: 'Pelayanan responsif, revisi cepat, dan hasil akhir benar-benar melampaui ekspektasi. Website katalog dan promo flash drop kami berhasil menaikkan konversi hingga 2.4x lipat!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    serviceCategory: 'Katalog & Promo'
  },
  {
    id: 'rev-def-3',
    author: 'Budi & Cindy',
    role: 'Wedding Couple',
    brand: 'Private Client',
    company: 'Private Client',
    rating: 5,
    quote: 'Undangan web kami dapet ratusan pujian dari para tamu karena estetik, musik latar mulus, dan fitur RSVP WhatsApp-nya sangat memudahkan pendataan tamu.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    serviceCategory: 'Undangan Web'
  },
  {
    id: 'rev-def-4',
    author: 'Dimas Wicaksono',
    role: 'Event Organizer Lead',
    brand: 'Skena Festival ID',
    company: 'Skena Festival ID',
    rating: 5,
    quote: 'Modul game aktivasi booth event berjalan tanpa kendala sedikitpun di tablet offline. Antrean pengunjung pameran jadi super ramai dan seru!',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    serviceCategory: 'Game & Event'
  }
];

const CARD_ACCENTS = [
  { border: 'rgba(59, 130, 246, 0.25)', tagBg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
  { border: 'rgba(168, 85, 247, 0.25)', tagBg: 'rgba(168, 85, 247, 0.12)', text: '#a855f7' },
  { border: 'rgba(16, 185, 129, 0.25)', tagBg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' },
  { border: 'rgba(245, 158, 11, 0.25)', tagBg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' },
];

export const LPTestimonials: React.FC<LPTestimonialsProps> = ({
  testimonials,
  isDark = true,
  accentColor = '#2563eb',
  localization,
  badge,
  title,
  subtitle,
  isEditable = false,
  onUpdateBadge,
  onUpdateTitle,
  onUpdateSubtitle,
  onOpenManageReviews
}) => {
  const [dbReviews, setDbReviews] = useState<TestimonialData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Load reviews directly from database
  useEffect(() => {
    let isMounted = true;
    const fetchDbReviews = async () => {
      try {
        const [savedReviews, savedTesti] = await Promise.all([
          storage.getItem('porto_client_reviews', []),
          storage.getItem('porto_testimonials', [])
        ]);

        if (!isMounted) return;

        const rawList = [
          ...(Array.isArray(savedReviews) ? savedReviews : []),
          ...(Array.isArray(savedTesti) ? savedTesti : [])
        ];

        if (rawList.length > 0) {
          const published = rawList
            .filter((r: any) => r.isPublished !== false)
            .map((r: any, idx: number) => ({
              id: r.id || `rev-${idx}`,
              author: r.clientName || r.author || r.name || 'Klien Terverifikasi',
              name: r.clientName || r.author || r.name || 'Klien Terverifikasi',
              role: r.role || 'Klien Puas',
              brand: r.brand || r.company || '',
              company: r.brand || r.company || '',
              quote: r.reviewText || r.quote || r.text || '',
              rating: r.rating || 5,
              avatar: r.avatarUrl || r.avatar || '',
              serviceCategory: r.serviceCategory || 'Layanan Studio'
            }));
          setDbReviews(published);
        } else {
          setDbReviews([]);
        }
      } catch (e) {
        console.error('Failed to load testimonials from db:', e);
      }
    };

    fetchDbReviews();

    // Window events (fired by admin panels on explicit actions)
    const handleUpdate = () => fetchDbReviews();
    window.addEventListener('porto_reviews_updated', handleUpdate);
    window.addEventListener('porto_testimonials_updated', handleUpdate);

    // Storage listener for real-time sync (catches Draft/Tayang toggles that don't fire window events)
    const unsubReviews = storage.listenItem('porto_client_reviews', () => fetchDbReviews(), []);
    const unsubTesti = storage.listenItem('porto_testimonials', () => fetchDbReviews(), []);

    return () => {
      isMounted = false;
      window.removeEventListener('porto_reviews_updated', handleUpdate);
      window.removeEventListener('porto_testimonials_updated', handleUpdate);
      if (typeof unsubReviews === 'function') unsubReviews();
      if (typeof unsubTesti === 'function') unsubTesti();
    };
  }, []);

  // Compute final list: database reviews take precedence, then passed prop, fallback to rich defaults
  const allReviews = useMemo<TestimonialData[]>(() => {
    if (dbReviews.length > 0) return dbReviews;
    if (Array.isArray(testimonials) && testimonials.length > 0) {
      return testimonials.map((t, idx) => ({
        id: t.id || `prop-${idx}`,
        author: t.author || t.name || t.clientName || 'Klien',
        name: t.author || t.name || t.clientName || 'Klien',
        role: t.role || 'Klien Puas',
        brand: t.brand || t.company || '',
        company: t.brand || t.company || '',
        quote: t.quote || t.text || '',
        avatar: t.avatar || t.avatarUrl || '',
        rating: t.rating || 5,
        serviceCategory: t.serviceCategory || 'Proyek Klien'
      }));
    }
    return DEFAULT_REVIEWS;
  }, [dbReviews, testimonials]);

  // Extract unique category filters
  const categories = useMemo(() => {
    const set = new Set<string>();
    allReviews.forEach(r => {
      if (r.serviceCategory && r.serviceCategory.trim()) {
        set.add(r.serviceCategory.trim());
      }
    });
    return Array.from(set);
  }, [allReviews]);

  // Filtered reviews
  const displayReviews = useMemo(() => {
    if (selectedFilter === 'all') return allReviews;
    return allReviews.filter(r => r.serviceCategory?.toLowerCase() === selectedFilter.toLowerCase());
  }, [allReviews, selectedFilter]);

  // Average Rating
  const avgRating = useMemo(() => {
    if (!allReviews.length) return '5.0';
    const sum = allReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / allReviews.length).toFixed(1);
  }, [allReviews]);

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const sectionBg = isDark ? '#06070a' : '#eef2f6';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const cardBg = isDark ? '#151824' : '#ffffff';

  return (
    <section
      id="testimonials"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: sectionBg,
        position: 'relative',
        overflow: 'hidden',
        borderTop: `1px solid ${cardBorder}`,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* ── SECTION HEADER ── */}
        <div data-reveal="true" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateBadge?.(e.currentTarget.textContent || '')}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 800,
              color: accentColor,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 100,
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit badge ulasan' : undefined}
          >
            <MessageSquare size={13} />
            <span>{badge || localization?.testimonialSectionTitle || 'KATA MEREKA'}</span>
          </div>

          <h2
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateTitle?.(e.currentTarget.textContent || '')}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(28px, 3.8vw, 44px)',
              fontWeight: 800,
              color: textColor,
              margin: '0 0 12px',
              letterSpacing: '-0.025em',
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit judul ulasan' : undefined}
          >
            {title || localization?.testimonialMainTitle || 'Kata Teman'}
          </h2>

          <p
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateSubtitle?.(e.currentTarget.textContent || '')}
            style={{
              maxWidth: 620,
              margin: '0 auto',
              fontSize: 15,
              color: subTextColor,
              lineHeight: 1.6,
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit deskripsi ulasan' : undefined}
          >
            {subtitle || localization?.testimonialSubtitle || 'Ulasan terverifikasi dari brand, kreator konten, dan mitra bisnis yang telah mempercayakan kehadiran digitalnya bersama kami.'}
          </p>
        </div>

        {/* ── TRUST & RATING HIGHLIGHT BAR ── */}
        <div
          data-reveal="true"
          className="reveal-delay-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 36,
            padding: '20px',
            borderRadius: 22,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
            border: `1px solid ${cardBorder}`,
            boxShadow: 'none'
          }}
        >
          {/* Rating Capsule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px' }}>
            <div
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
                minHeight: 46,
                aspectRatio: '1 / 1',
                flexShrink: 0,
                borderRadius: 14,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                fontWeight: 900,
                fontSize: 18
              }}
            >
              <Star size={22} fill="#f59e0b" color="#f59e0b" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: textColor }}>
                  {avgRating}
                </span>
                <span style={{ fontSize: 12, color: subTextColor }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 650, color: subTextColor }}>
                Skor Kepuasan Klien ({allReviews.length} Ulasan)
              </div>
            </div>
          </div>

          {/* On-Time Delivery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px' }}>
            <div
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
                minHeight: 46,
                aspectRatio: '1 / 1',
                flexShrink: 0,
                borderRadius: 14,
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: textColor }}>
                100%
              </div>
              <div style={{ fontSize: 12, fontWeight: 650, color: subTextColor }}>
                On-Time & Sesuai Spesifikasi
              </div>
            </div>
          </div>

          {/* Repeat / Recommendation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px' }}>
            <div
              style={{
                width: 46,
                height: 46,
                minWidth: 46,
                minHeight: 46,
                aspectRatio: '1 / 1',
                flexShrink: 0,
                borderRadius: 14,
                background: `${accentColor}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor
              }}
            >
              <ThumbsUp size={22} />
            </div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: textColor }}>
                99.4%
              </div>
              <div style={{ fontSize: 12, fontWeight: 650, color: subTextColor }}>
                Klien Merekomendasikan
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY FILTER PILLS ── */}
        {categories.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 32
            }}
          >
            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setSelectedFilter('all');
              }}
              style={{
                padding: '7px 18px',
                borderRadius: 100,
                fontSize: 12.5,
                fontWeight: 750,
                border: `1.5px solid ${selectedFilter === 'all' ? accentColor : cardBorder}`,
                background: selectedFilter === 'all' ? accentColor : (isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'),
                color: selectedFilter === 'all' ? '#ffffff' : subTextColor,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Semua Ulasan ({allReviews.length})
            </button>
            {categories.map(cat => {
              const count = allReviews.filter(r => r.serviceCategory?.toLowerCase() === cat.toLowerCase()).length;
              const isActive = selectedFilter.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setSelectedFilter(cat);
                  }}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 100,
                    fontSize: 12.5,
                    fontWeight: 750,
                    border: `1.5px solid ${isActive ? accentColor : cardBorder}`,
                    background: isActive ? accentColor : (isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'),
                    color: isActive ? '#ffffff' : subTextColor,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* ── TESTIMONIAL CARDS GRID ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: 22
          }}
        >
          {displayReviews.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '48px 24px',
              textAlign: 'center',
              borderRadius: 22,
              border: `1px dashed ${cardBorder}`,
              color: subTextColor,
              fontSize: 13
            }}>
              Belum ada ulasan untuk kategori ini.
            </div>
          ) : (
            displayReviews.map((item, idx) => {
              const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
              const authorName = item.author || item.name || item.clientName || 'Klien';
              const brandName = item.brand || item.company;
              const starCount = Math.max(1, Math.min(5, Number(item.rating) || 5));

              return (
                <div
                  key={item.id || idx}
                  className="lp-testimonial-card"
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 22,
                    padding: '24px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 18,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: 'none',
                    animation: 'lpTestiFadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.22)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = cardBorder;
                  }}
                >
                {/* Top: Stars & Quote Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {[...Array(starCount)].map((_, sIdx) => (
                      <Star key={sIdx} size={15} fill="#f59e0b" color="#f59e0b" />
                    ))}
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#f59e0b',
                        background: 'rgba(245, 158, 11, 0.12)',
                        padding: '1px 6px',
                        borderRadius: 100
                      }}
                    >
                      {starCount}.0
                    </span>
                  </div>

                  <div
                    style={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      minHeight: 32,
                      aspectRatio: '1 / 1',
                      flexShrink: 0,
                      borderRadius: 10,
                      background: accent.tagBg,
                      color: accent.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Quote size={15} />
                  </div>
                </div>

                {/* Review Text */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14.5,
                    color: textColor,
                    lineHeight: 1.7,
                    margin: 0,
                    flex: 1,
                    fontStyle: 'italic'
                  }}
                >
                  "{item.quote || item.text || 'Layanan prima, eksekusi rapi, dan hasil memuaskan.'}"
                </p>

                {/* Author Information */}
                <div
                  style={{
                    paddingTop: 16,
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:') || item.avatar.startsWith('/')) ? (
                      <img
                        src={item.avatar}
                        alt={authorName}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `1.5px solid ${accent.border}`,
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: accent.tagBg,
                          border: `1.5px solid ${accent.border}`,
                          color: accent.text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 900,
                          fontSize: 15,
                          flexShrink: 0
                        }}
                      >
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14.5,
                            fontWeight: 800,
                            color: textColor,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {authorName}
                        </span>
                        <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0 }} />
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: subTextColor,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.role || 'Klien Puas'} {brandName ? `• ${brandName}` : ''}
                      </div>
                    </div>
                  </div>

                  {item.serviceCategory && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: accent.tagBg,
                        color: accent.text,
                        fontSize: 11,
                        fontWeight: 750,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {item.serviceCategory}
                    </span>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      <style>{`
        @keyframes lpTestiFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .lp-testimonial-card {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
    </section>
  );
};

export default LPTestimonials;
