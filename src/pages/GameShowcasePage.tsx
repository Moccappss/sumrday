import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2, Search, Sparkles, MessageCircle, Play, CheckCircle2,
  Users, Clock, Video, Monitor, Tag, Trophy, X, Zap, Calendar, Building2, MapPin
} from 'lucide-react';
import { GameInstance } from '../types/gameLicense';
import { subscribeToGames, STORAGE_GAMES_KEY } from '../services/gameService';
import { SAMPLE_GAMES } from '../data/sampleGames';
import { storage } from '../utils/storage';
import { generateGameEngineHtml } from '../utils/gameEngineBuilder';
import { useLandingData } from '../components/landing/useLandingData';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingBodyFix } from '../hooks/useLandingBodyFix';
import { useScrollReveal } from '../hooks/useScrollReveal';
import LPNavbar from '../components/landing/LPNavbar';
import LPFooter from '../components/landing/LPFooter';
import SEOHelmet from '../components/SEOHelmet';
import PageHeroHeader from '../components/common/PageHeroHeader';
import { useBusinessProfile } from '../hooks/useBusinessProfile';

export default function GameShowcasePage() {
  const navigate = useNavigate();
  const { data } = useLandingData();
  const { profile: businessProfile } = useBusinessProfile();
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  useLandingBodyFix();
  useScrollReveal();

  const [games, setGames] = useState<GameInstance[]>(() => {
    try {
      const syncGames = storage.getSync<GameInstance[]>(STORAGE_GAMES_KEY, null);
      if (Array.isArray(syncGames)) {
        const filtered = syncGames.filter((g: any) => g.isActive !== false);
        if (filtered.length > 0) return filtered;
      }
      const raw = localStorage.getItem(STORAGE_GAMES_KEY) || localStorage.getItem('sumr_games') || localStorage.getItem('porto_games');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((g: any) => g.isActive !== false);
          if (filtered.length > 0) return filtered;
        }
      }
    } catch { }
    return (SAMPLE_GAMES as GameInstance[]).filter((g: any) => g.isActive !== false);
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedGamePreview, setSelectedGamePreview] = useState<GameInstance | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<GameInstance | null>(null);

  // 30-Second Live Demo State
  const [activeDemoGame, setActiveDemoGame] = useState<GameInstance | null>(null);
  const [demoSecondsLeft, setDemoSecondsLeft] = useState(30);

  // Self-Service Event Rental Modal State
  const [activeRentalModal, setActiveRentalModal] = useState<GameInstance | null>(null);
  const [rentalForm, setRentalForm] = useState({
    brandName: '',
    eventDate: '',
    city: '',
    packageType: 'rental_1day' as 'rental_1day' | 'rental_expo' | 'buyout'
  });

  // 30-second live demo countdown effect
  useEffect(() => {
    if (!activeDemoGame) {
      setDemoSecondsLeft(30);
      return;
    }
    setDemoSecondsLeft(30);
    const interval = setInterval(() => {
      setDemoSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeDemoGame]);

  useEffect(() => {
    const unsub = subscribeToGames((dataList) => {
      let active = (Array.isArray(dataList) && dataList.length > 0)
        ? dataList.filter(g => g.isActive !== false)
        : [];
      if (active.length === 0) {
        active = (SAMPLE_GAMES as GameInstance[]).filter(g => g.isActive !== false);
      }
      setGames(active);
      setLoading(false);
      try {
        localStorage.setItem(STORAGE_GAMES_KEY, JSON.stringify(active));
      } catch { }
    });
    return () => unsub();
  }, []);

  // Kumpulan unik seluruh tags dari game yang ada
  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    games.forEach(g => {
      if (g.category) set.add(g.category);
      if (g.tags) g.tags.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchSearch = !searchQuery.trim() ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.category && g.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchTag = selectedTag === 'all' ||
        g.category?.toLowerCase() === selectedTag.toLowerCase() ||
        (g.tags && g.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));

      return matchSearch && matchTag;
    });
  }, [games, searchQuery, selectedTag]);

  const accentColor = data?.theme?.accentColor || '#7c3aed';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
  const pageBg = isDark ? '#06070a' : '#eef2f6';

  const handleHubungiSewa = (game: GameInstance) => {
    const rawWa = (businessProfile?.whatsapp || data?.footer?.whatsappNumber || '6281234567890').toString().replace(/[^0-9]/g, '');
    const waNumber = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;
    const text = encodeURIComponent(`Halo ${businessProfile?.brandName || 'sumr.day crew'}! ☀️ Saya tertarik untuk kolaborasi aktivasi event interaktif game "${game.title}". Mohon info paket dan opsi kustomisasinya.`);
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', color: textColor }}>
      <SEOHelmet
        title="Interaksi Digital & Game Aktivasi — sumr.day Fun Lab ☀️"
        description="Hadirkan keceriaan instan dan energi positif di booth atau event brand Anda dengan game interaktif responsif bernuansa fresh dari sumr.day."
      />

      <LPNavbar
        items={(data?.navbar?.items || []) as any}
        loginBtnLabel={data?.navbar?.loginBtnLabel || 'Login'}
        logoText={data?.navbar?.logoText}
        isDark={isDark}
        accentColor={accentColor}
      />

      <section style={{
        padding: '112px clamp(16px, 3.5vw, 24px) 20px',
        maxWidth: 1240,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* ── UNIFIED HERO POSTER SECTION ── */}
        <PageHeroHeader
          isDark={isDark}
          accentColor={accentColor}
          bgPattern={(data?.pagesHeader as any)?.games?.bgPattern || 'grid'}
          textColor={textColor}
          subTextColor={subTextColor}
          badgeIcon={<Sparkles size={14} />}
          badgeText={data?.pagesHeader?.games?.badge || 'Interactive Event Activation Games'}
          title={data?.pagesHeader?.games?.title || 'Koleksi Game Kustom untuk Aktivasi Event & Booth Brand Anda'}
          highlightText={data?.pagesHeader?.games?.highlight || 'Aktivasi Event & Booth Brand Anda'}
          description={data?.pagesHeader?.games?.description || 'Tingkatkan keterlibatan pengunjung di pameran, mal, expo, dan festival dengan game interaktif responsif berbasis HTML5. Tersedia opsi Sewa Lisensi Event atau Beli Putus (Hak Download Offline DRM-free).'}
          stats={[
            { icon: <Gamepad2 size={14} />, value: games.length, label: 'Game Siap Pakai' },
            { icon: <Trophy size={14} />, value: 'Event & Booth', label: 'Spesialisasi' },
            { icon: <Sparkles size={14} />, value: 'DRM-Free', label: 'Lisensi Offline' }
          ]}
        >
          <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
            <input
              type="text"
              placeholder="Cari game event (misal: Spin Wheel, Kuis, Koin)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 48,
                padding: '0 18px 0 46px',
                borderRadius: 100,
                border: `1.5px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: textColor,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'none'
              }}
            />
          </div>
        </PageHeroHeader>

        {/* Dynamic Tag Filter Buttons */}
        {allAvailableTags.length > 0 && (
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
            maxWidth: 820, margin: '20px auto 0', padding: '0 10px'
          }}>
            <button
              onClick={() => setSelectedTag('all')}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 800,
                background: selectedTag === 'all' ? accentColor : isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                color: selectedTag === 'all' ? '#fff' : textColor,
                border: `1px solid ${selectedTag === 'all' ? 'transparent' : cardBorder}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Semua Game ({games.length})
            </button>
            {allAvailableTags.map((tag) => {
              const isCurrent = selectedTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isCurrent ? 'all' : tag)}
                  style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    background: isCurrent ? accentColor : isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                    color: isCurrent ? '#fff' : subTextColor,
                    border: `1px solid ${isCurrent ? 'transparent' : cardBorder}`,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <main
        className="game-showcase-main"
        style={{ maxWidth: 1240, margin: '0 auto 100px', width: '100%', padding: '0 clamp(16px, 3.5vw, 24px)', boxSizing: 'border-box', flex: 1 }}
      >
        <style>{`
          @media (max-width: 640px) {
            .game-showcase-main {
              padding: 0 16px !important;
            }
          }
        `}</style>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: subTextColor }}>
            <Gamepad2 size={40} style={{ animation: 'bounce 1s infinite', margin: '0 auto 16px', color: accentColor }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Memuat katalog game interaktif...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '70px 20px',
            background: cardBg,
            borderRadius: 22,
            border: `1.5px dashed ${cardBorder}`,
            maxWidth: 520,
            margin: '20px auto'
          }}>
            <Gamepad2 size={48} style={{ opacity: 0.3, margin: '0 auto 16px', color: accentColor }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Game Belum Tersedia</h3>
            <p style={{ margin: '8px 0 20px', color: subTextColor, fontSize: 13 }}>
              Coba kata kunci pencarian lain atau hubungi tim kami untuk konsultasi game event baru.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              style={{
                padding: '9px 20px',
                borderRadius: 100,
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {filteredGames.map((game) => (
              <div
                key={game.id}
                style={{
                  background: cardBg,
                  borderRadius: 22,
                  border: `1px solid ${cardBorder}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = cardBorder;
                }}
              >
                <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: '#09090f' }}>
                  {game.thumbnailUrl ? (
                    <img
                      src={game.thumbnailUrl}
                      alt={game.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${accentColor}30, #3b82f630)` }}>
                      <Gamepad2 size={56} style={{ color: accentColor, opacity: 0.7 }} />
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    padding: '4px 10px', borderRadius: 100,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    color: '#10b981', fontSize: 11, fontWeight: 800,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <CheckCircle2 size={12} /> Ready to Play
                  </div>

                  <div style={{
                    position: 'absolute', bottom: 10, left: 12,
                    padding: '3px 9px', borderRadius: 100,
                    background: 'rgba(0,0,0,0.75)',
                    color: '#94a3b8', fontSize: 10.5, fontWeight: 700
                  }}>
                    HTML5 Single File • Offline Ready
                  </div>
                </div>

                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Tier & Tags Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6,
                      background: game.pricingTier === 'premium' ? 'rgba(236,72,153,0.2)' : game.pricingTier === 'plus' ? 'rgba(59,130,246,0.2)' : game.pricingTier === 'free' ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)',
                      color: game.pricingTier === 'premium' ? '#f472b6' : game.pricingTier === 'plus' ? '#60a5fa' : game.pricingTier === 'free' ? '#34d399' : '#facc15',
                      border: '1px solid currentColor'
                    }}>
                      Tier {game.pricingTier || 'basic'}
                    </span>

                    {game.category && (
                      <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 6, background: `${accentColor}20`, color: accentColor, fontWeight: 700 }}>
                        {game.category}
                      </span>
                    )}

                    {game.tags?.slice(0, 2).map((t, idx) => (
                      <span key={idx} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: subTextColor }}>
                        #{t}
                      </span>
                    ))}
                  </div>

                  <h3 style={{
                    margin: '0 0 8px',
                    fontSize: 18,
                    fontWeight: 900,
                    color: textColor,
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {game.title}
                  </h3>

                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: subTextColor,
                    lineHeight: 1.55,
                    flex: 1
                  }}>
                    {game.description || 'Game aktivasi interaktif ringan siap dibranding dengan logo dan grafis brand Anda untuk pameran atau promosi event.'}
                  </p>

                  {/* Spesifikasi Event EO */}
                  <div style={{ display: 'flex', gap: 12, margin: '14px 0', flexWrap: 'wrap', fontSize: 11.5, color: subTextColor }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color={accentColor} /> {game.eventSpecs?.estimatedDuration || '30-60s Gameplay'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trophy size={12} color="#10b981" /> {game.eventSpecs?.leaderboardCapacity || 'Leaderboard Ready'}
                    </span>
                    {game.eventSpecs?.deviceSupport && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Monitor size={12} color="#3b82f6" /> {game.eventSpecs.deviceSupport}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: `1px solid ${cardBorder}`, flexWrap: 'wrap' }}>
                    {/* Tombol Demo 30 Detik Instan */}
                    <button
                      onClick={() => setActiveDemoGame(game)}
                      style={{
                        padding: '9px 13px',
                        borderRadius: 100,
                        border: '1.5px solid rgba(234, 179, 8, 0.4)',
                        background: 'rgba(234, 179, 8, 0.12)',
                        color: '#eab308',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Uji coba permainan langsung selama 30 detik di browser"
                    >
                      <Zap size={13} fill="#eab308" /> Coba Demo 30s
                    </button>

                    {/* Tombol Preview Video Gameplay */}
                    {game.previewVideoUrl && (
                      <button
                        onClick={() => setActiveVideoModal(game)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: 100,
                          border: `1.5px solid rgba(59, 130, 246, 0.4)`,
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        title="Tonton Cuplikan Video Gameplay"
                      >
                        <Video size={13} /> Video
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedGamePreview(game)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 100,
                        border: `1.5px solid ${cardBorder}`,
                        background: 'transparent',
                        color: textColor,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Play size={13} color={accentColor} /> Detail
                    </button>

                    <button
                      onClick={() => {
                        setActiveRentalModal(game);
                        setRentalForm({
                          brandName: '',
                          eventDate: '',
                          city: '',
                          packageType: 'rental_1day'
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 16px',
                        borderRadius: 100,
                        border: 'none',
                        background: accentColor,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: `0 4px 14px ${accentColor}35`
                      }}
                    >
                      <Calendar size={13} /> Sewa untuk Event
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedGamePreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 24, maxWidth: 540, width: '100%', padding: 24, border: `1.5px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gamepad2 size={24} color={accentColor} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: textColor }}>{selectedGamePreview.title}</h3>
              </div>
              <button
                onClick={() => setSelectedGamePreview(null)}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: textColor, border: 'none', cursor: 'pointer', fontSize: 12 }}
              >
                ✕
              </button>
            </div>

            {selectedGamePreview.thumbnailUrl && (
              <img src={selectedGamePreview.thumbnailUrl} alt={selectedGamePreview.title} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14 }} />
            )}

            <p style={{ margin: 0, fontSize: 13.5, color: subTextColor, lineHeight: 1.6 }}>
              {selectedGamePreview.description || 'Game interaktif berkualitas tinggi yang siap dimainkan langsung pada browser offline atau kiosk sentuh.'}
            </p>

            {/* EO Event Specs Detail */}
            {selectedGamePreview.eventSpecs && (
              <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 12, borderRadius: 14, border: `1px solid ${cardBorder}` }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: textColor, display: 'block', marginBottom: 8 }}>
                  Spesifikasi Teknis Permainan:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5, color: subTextColor }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={13} color={accentColor} />
                    <span>Durasi: <strong style={{ color: textColor }}>{selectedGamePreview.eventSpecs.estimatedDuration || '30 - 60 Detik'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Trophy size={13} color="#eab308" />
                    <span>Leaderboard: <strong style={{ color: textColor }}>{selectedGamePreview.eventSpecs.leaderboardCapacity || 'Top 10 Peserta'}</strong></span>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Monitor size={13} color="#3b82f6" />
                    <span>Perangkat: <strong style={{ color: textColor }}>{selectedGamePreview.eventSpecs.deviceSupport || 'Touchscreen Kiosk'}</strong></span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding: 14, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: textColor }}>Fitur Paket Event:</span>
              <span style={{ fontSize: 12, color: subTextColor }}>✓ Branding Logo & Background Hero Kustom</span>
              <span style={{ fontSize: 12, color: subTextColor }}>✓ Sistem Skor & Leaderboard Nama Peserta</span>
              <span style={{ fontSize: 12, color: subTextColor }}>✓ Akses offline murni tanpa butuh koneksi internet (Zero DRM)</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              {selectedGamePreview.previewVideoUrl && (
                <button
                  onClick={() => {
                    setActiveVideoModal(selectedGamePreview);
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 100, border: '1.5px solid rgba(59, 130, 246, 0.4)',
                    background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 800, fontSize: 13,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Video size={15} /> Tonton Video
                </button>
              )}
              <button
                onClick={() => setSelectedGamePreview(null)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 100, border: `1.5px solid ${cardBorder}`, background: 'transparent', color: textColor, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  handleHubungiSewa(selectedGamePreview);
                  setSelectedGamePreview(null);
                }}
                style={{ flex: 2, padding: '10px 20px', borderRadius: 100, border: 'none', background: accentColor, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <MessageCircle size={15} /> Hubungi untuk Sewa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 30-SECOND INTERACTIVE LIVE DEMO MODAL */}
      {activeDemoGame && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: cardBg, borderRadius: 24, maxWidth: 900, width: '100%', height: '88vh',
            border: `1.5px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8)'
          }}>
            {/* Header bar with live timer */}
            <div style={{
              padding: '14px 20px', borderBottom: `1px solid ${cardBorder}`, background: cardBg,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: 'rgba(234, 179, 8, 0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308'
                }}>
                  <Zap size={18} fill="#eab308" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                    Demo 30 Detik: {activeDemoGame.title}
                  </h3>
                  <span style={{ fontSize: 11.5, color: subTextColor }}>Uji coba gameplay interaktif di browser Anda</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 100,
                  background: demoSecondsLeft > 5 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                  color: demoSecondsLeft > 5 ? '#eab308' : '#ef4444',
                  fontWeight: 900, fontSize: 13, fontFamily: "'Outfit', sans-serif",
                  border: `1px solid ${demoSecondsLeft > 5 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`
                }}>
                  <Clock size={14} /> {demoSecondsLeft}s Tersisa
                </div>

                <button
                  onClick={() => setActiveDemoGame(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: 'none', color: textColor,
                    cursor: 'pointer', width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Timer Progress Line */}
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{
                height: '100%',
                width: `${(demoSecondsLeft / 30) * 100}%`,
                background: demoSecondsLeft > 5 ? '#eab308' : '#ef4444',
                transition: 'width 1s linear'
              }} />
            </div>

            {/* Iframe Viewport Container */}
            <div style={{ flex: 1, position: 'relative', background: '#09090e' }}>
              <iframe
                title="Live Game Demo"
                srcDoc={generateGameEngineHtml(activeDemoGame, { brandName: 'Demo Brand', title: activeDemoGame.title })}
                style={{ width: '100%', height: '100%', border: 'none' }}
                sandbox="allow-scripts allow-same-origin"
              />

              {/* Demo Expired Overlay */}
              {demoSecondsLeft === 0 && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(9, 9, 14, 0.94)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 24, textAlign: 'center', backdropFilter: 'blur(8px)', zIndex: 10
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: `${accentColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, marginBottom: 14
                  }}>
                    <Trophy size={28} />
                  </div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, color: textColor, margin: '0 0 8px' }}>
                    Waktu Uji Coba Demo Telah Berakhir!
                  </h3>
                  <p style={{ fontSize: 13.5, color: subTextColor, maxWidth: 440, margin: '0 0 24px', lineHeight: 1.6 }}>
                    Suka dengan gameplay <strong>{activeDemoGame.title}</strong>? Sewa sekarang untuk aktivasi event booth Anda lengkap dengan kustomisasi logo brand, warna, dan sistem leaderboard!
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => setDemoSecondsLeft(30)}
                      style={{
                        padding: '11px 20px', borderRadius: 100, border: `1.5px solid ${cardBorder}`,
                        background: 'transparent', color: textColor, fontSize: 13, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      Ulangi Demo 30s
                    </button>
                    <button
                      onClick={() => {
                        const target = activeDemoGame;
                        setActiveDemoGame(null);
                        setActiveRentalModal(target);
                        setRentalForm({ brandName: '', eventDate: '', city: '', packageType: 'rental_1day' });
                      }}
                      style={{
                        padding: '11px 24px', borderRadius: 100, border: 'none',
                        background: accentColor, color: '#fff', fontSize: 13, fontWeight: 900,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: `0 8px 24px ${accentColor}40`
                      }}
                    >
                      <Calendar size={15} /> Sewa untuk Event Anda
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div style={{
              padding: '12px 20px', borderTop: `1px solid ${cardBorder}`, background: cardBg,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
            }}>
              <span style={{ fontSize: 12, color: subTextColor }}>
                Ingin game ini berjalan offline tanpa kuota di touch kiosk pameran?
              </span>
              <button
                onClick={() => {
                  const target = activeDemoGame;
                  setActiveDemoGame(null);
                  setActiveRentalModal(target);
                  setRentalForm({ brandName: '', eventDate: '', city: '', packageType: 'rental_1day' });
                }}
                style={{
                  padding: '8px 18px', borderRadius: 100, border: 'none',
                  background: accentColor, color: '#fff', fontSize: 12.5, fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Calendar size={13} /> Sewa Game Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELF-SERVICE EVENT RENTAL MODAL */}
      {activeRentalModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: cardBg, borderRadius: 28, maxWidth: 520, width: '100%',
            border: `1.5px solid ${cardBorder}`, padding: '28px 24px', position: 'relative',
            boxShadow: '0 30px 80px rgba(0,0,0,0.8)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button
              onClick={() => setActiveRentalModal(null)}
              style={{
                position: 'absolute', top: 20, right: 20, background: 'transparent',
                border: 'none', color: subTextColor, cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: `${accentColor}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor
              }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
                  Sewa Game Event
                </h3>
                <span style={{ fontSize: 12, color: subTextColor }}>{activeRentalModal.title}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Nama Brand / Sponsor / Penyelenggara *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
                  <input
                    value={rentalForm.brandName}
                    onChange={e => setRentalForm({ ...rentalForm, brandName: e.target.value })}
                    placeholder="Cth: Brand X / EO Organizer"
                    style={{
                      width: '100%', height: 44, padding: '0 14px 0 40px', borderRadius: 14,
                      border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb',
                      color: textColor, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="date"
                    value={rentalForm.eventDate}
                    onChange={e => setRentalForm({ ...rentalForm, eventDate: e.target.value })}
                    style={{
                      width: '100%', height: 44, padding: '0 12px', borderRadius: 14,
                      border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb',
                      color: textColor, fontSize: 12.5, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                    Kota / Lokasi Event
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
                    <input
                      value={rentalForm.city}
                      onChange={e => setRentalForm({ ...rentalForm, city: e.target.value })}
                      placeholder="Cth: Jakarta / Surabaya"
                      style={{
                        width: '100%', height: 44, padding: '0 10px 0 34px', borderRadius: 14,
                        border: `1px solid ${cardBorder}`, background: isDark ? '#090a12' : '#f9fafb',
                        color: textColor, fontSize: 12.5, outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: subTextColor, marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                  Pilihan Paket Lisensi *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'rental_1day', title: 'Sewa 1 Hari Event', desc: 'Cocok untuk gathering, peluncuran produk, atau aktivasi 1 hari', estPrice: 'Mulai Rp 450.000' },
                    { id: 'rental_expo', title: 'Sewa 3 - 7 Hari Expo', desc: 'Cocok untuk pameran mall, booth expo multi-hari', estPrice: 'Mulai Rp 1.200.000' },
                    { id: 'buyout', title: 'Beli Putus Lisensi Lengkap', desc: 'Hak pakai selamanya, source code HTML5 single file, 100% DRM-Free', estPrice: 'Mulai Rp 3.500.000' }
                  ].map(pkg => (
                    <label
                      key={pkg.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                        borderRadius: 14, border: `1.5px solid ${rentalForm.packageType === pkg.id ? accentColor : cardBorder}`,
                        background: isDark ? '#090a12' : '#f9fafb', cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="rentalPackage"
                        value={pkg.id}
                        checked={rentalForm.packageType === pkg.id}
                        onChange={() => setRentalForm({ ...rentalForm, packageType: pkg.id as any })}
                        style={{ width: 16, height: 16, accentColor: accentColor, marginTop: 2 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>{pkg.title}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: accentColor }}>{pkg.estPrice}</span>
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: 11.5, color: subTextColor }}>{pkg.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* WhatsApp Checkout Button */}
              <button
                onClick={() => {
                  const rawWa = (businessProfile?.whatsapp || data?.footer?.whatsappNumber || '6281234567890').toString().replace(/[^0-9]/g, '');
                  const waNumber = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa;
                  const pkgName = rentalForm.packageType === 'rental_1day' ? 'Sewa 1 Hari Event' : (rentalForm.packageType === 'rental_expo' ? 'Sewa Expo 3-7 Hari' : 'Beli Putus Lisensi Penuh');
                  const msg = `Halo sumr.day crew! ☀️ Saya ingin memesan lisensi game interaktif untuk event:\n\n` +
                    `🎮 *Game:* ${activeRentalModal.title}\n` +
                    `🏢 *Brand / Sponsor:* ${rentalForm.brandName || '-'}\n` +
                    `📅 *Tanggal Event:* ${rentalForm.eventDate || '-'}\n` +
                    `📍 *Kota:* ${rentalForm.city || '-'}\n` +
                    `📦 *Paket:* ${pkgName}\n\n` +
                    `Mohon info penawaran resmi dan proses pengiriman berkasnya. Terima kasih!`;
                  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
                  setActiveRentalModal(null);
                }}
                disabled={!rentalForm.brandName}
                style={{
                  width: '100%', height: 48, borderRadius: 100, border: 'none',
                  background: !rentalForm.brandName ? 'rgba(150,150,150,0.3)' : accentColor,
                  color: '#fff', fontSize: 13.5, fontWeight: 900,
                  cursor: !rentalForm.brandName ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: "'Outfit', sans-serif", marginTop: 6,
                  boxShadow: `0 8px 24px ${accentColor}40`
                }}
              >
                <MessageCircle size={16} /> Ajukan Sewa via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
      {activeVideoModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: cardBg, borderRadius: 24, maxWidth: 760, width: '100%', overflow: 'hidden',
            border: `1.5px solid ${cardBorder}`, boxShadow: '0 25px 60px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Video size={20} color={accentColor} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: textColor }}>
                    {activeVideoModal.title}
                  </h3>
                  <span style={{ fontSize: 11, color: subTextColor }}>Gameplay Video Preview</span>
                </div>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', fontSize: 16 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player */}
            <div style={{ background: '#000', padding: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {activeVideoModal.previewVideoUrl ? (
                <video
                  src={activeVideoModal.previewVideoUrl}
                  controls
                  autoPlay
                  loop
                  style={{ width: '100%', maxHeight: '460px', borderRadius: 14, outline: 'none' }}
                />
              ) : (
                <div style={{ padding: '80px 20px', textAlign: 'center', color: subTextColor }}>
                  Video gameplay belum tersedia untuk game ini.
                </div>
              )}
            </div>

            {/* Modal Footer CTA */}
            <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12, color: subTextColor }}>
                Ingin custom visual & gameplay seperti ini untuk brand Anda?
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  style={{ padding: '8px 16px', borderRadius: 100, border: `1.5px solid ${cardBorder}`, background: 'transparent', color: textColor, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    handleHubungiSewa(activeVideoModal);
                    setActiveVideoModal(null);
                  }}
                  style={{ padding: '8px 18px', borderRadius: 100, border: 'none', background: accentColor, color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <MessageCircle size={14} /> Sewa Game Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LPFooter isDark={isDark} accentColor={accentColor} data={data?.footer} />
    </div>
  );
}
