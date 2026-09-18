import React, { useState } from 'react';
import { 
  Download, ArrowRight, Calendar, Award, Trophy, Star, Shield, 
  Sparkles, Image, CheckCircle, Flame, Heart, Compass, Bookmark, 
  Target, Zap, Briefcase, Code, PenTool, Layout, Layers, Lightbulb, 
  Box, Cpu, Globe, Rocket, Terminal, Camera, Video, Monitor, CheckCircle2
} from 'lucide-react';
import BookingModal from '../common/BookingModal';
import { haptic } from '../../utils/haptics';

const HERO_ICON_MAP: Record<string, React.FC<any>> = {
  Award, Trophy, Star, Shield, Sparkles, Image, CheckCircle, Flame, 
  Heart, Compass, Bookmark, Target, Zap, Briefcase, Code, PenTool, 
  Layout, Layers, Lightbulb, Box, Cpu, Globe, Rocket, Terminal, 
  Camera, Video, Monitor, Download, ArrowRight, Calendar
};

interface HeroData {
  greeting?: string;
  headline: string;
  subheadline: string;
  description: string;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
  heroImage: string | null;
  cards?: { id: string; icon: string; text: string }[];
  freelanceActive: boolean;
  badge?: {
    active: boolean;
    smallText: string;
    largeText: string;
  };
}

interface LPHeroProps {
  data: HeroData;
  isDark: boolean;
  accentColor: string;
}

const LPHero: React.FC<LPHeroProps> = ({ data, isDark, accentColor }) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    haptic.light();
    if (url.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(url);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="hero"
      className="lp-hero-section"
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 80,
      }}
    >
      {/* Background Ambient Glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(900px, 90vw)',
          height: '500px',
          background: `radial-gradient(ellipse at center, ${accentColor}25 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)`,
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none',
        }} 
      />

      <div
        className="lp-hero-grid"
        style={{
          width: '100%',
          maxWidth: 1240,
          margin: '0 auto',
          padding: '100px 24px 60px',
          display: 'grid',
          gridTemplateColumns: data?.heroImage ? '1.1fr 0.9fr' : '1fr',
          gap: 56,
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* ── Left: Main Content ── */}
        <div data-reveal="true" className="reveal-delay-1" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Top Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 100,
                background: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                  animation: 'lpPulse 2s infinite ease-in-out',
                }}
              />
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#10b981',
                  letterSpacing: '0.02em',
                }}
              >
                {data?.badge?.largeText || 'Tersedia untuk Proyek Baru'}
              </span>
            </div>

            {data?.subheadline && (
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: subTextColor,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                • {data.subheadline}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(36px, 4.8vw, 64px)',
              fontWeight: 850,
              lineHeight: 1.12,
              margin: '0 0 20px',
              letterSpacing: '-0.03em',
              color: textColor,
            }}
          >
            {data?.greeting && (!data?.headline || !data?.headline.toLowerCase().includes(data.greeting.toLowerCase())) && (
              <span style={{
                color: subTextColor,
                display: 'block',
                fontSize: 'clamp(18px, 2.2vw, 26px)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}>
                {data.greeting}
              </span>
            )}
            <span>
              {data?.headline || 'Studio Desain & Solusi Digital Kreatif'}
            </span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(15px, 1.6vw, 17px)',
              color: subTextColor,
              lineHeight: 1.7,
              margin: '0 0 36px',
              maxWidth: 540,
            }}
          >
            {data?.description || 'Membantu brand & bisnis tampil lebih memukau melalui desain visual presisi, teknologi modern, dan pengalaman pengguna kelas dunia.'}
          </p>

          {/* Buttons (Responsive 1-row on mobile) */}
          <style>{`
            .lp-hero-cta-group {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 44px;
              align-items: center;
            }
            .lp-cta-text-full {
              display: inline;
            }
            .lp-cta-text-short {
              display: none;
            }
            @media (max-width: 640px) {
              .lp-hero-cta-group {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 6px !important;
                margin-bottom: 30px !important;
                width: 100% !important;
              }
              .lp-hero-cta-btn {
                padding: 10px 4px !important;
                font-size: 12px !important;
                gap: 5px !important;
                justify-content: center !important;
                width: 100% !important;
                box-sizing: border-box !important;
                text-align: center !important;
                border-radius: 100px !important;
              }
              .lp-hero-cta-btn svg {
                width: 13px !important;
                height: 13px !important;
                flex-shrink: 0 !important;
              }
              .lp-cta-text-full {
                display: none !important;
              }
              .lp-cta-text-short {
                display: inline !important;
              }
            }
          `}</style>

          <div className="lp-hero-cta-group">
            {data?.ctaPrimaryLabel && (
              <a
                href={data.ctaPrimaryUrl || '#portfolio'}
                onClick={(e) => handleCtaClick(e, data.ctaPrimaryUrl || '#portfolio')}
                className="lp-hero-cta-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  background: accentColor,
                  color: '#fff',
                  borderRadius: 100,
                  textDecoration: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: `0 8px 24px ${accentColor}40`,
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${accentColor}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}40`;
                }}
              >
                <ArrowRight size={16} />
                <span className="lp-cta-text-full">{data.ctaPrimaryLabel}</span>
                <span className="lp-cta-text-short">Karya</span>
              </a>
            )}

            {data?.ctaSecondaryLabel && (
              <a
                href={data.ctaSecondaryUrl || '#'}
                onClick={(e) => handleCtaClick(e, data.ctaSecondaryUrl || '#')}
                className="lp-hero-cta-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  color: textColor,
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 100,
                  textDecoration: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                }}
              >
                <Download size={16} />
                <span className="lp-cta-text-full">{data.ctaSecondaryLabel}</span>
                <span className="lp-cta-text-short">CV</span>
              </a>
            )}

            {/* Google Calendar Consultation Booking Button */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setIsBookingModalOpen(true);
              }}
              className="lp-hero-cta-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 22px',
                background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                color: '#3b82f6',
                border: '1.5px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 100,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 800,
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)';
              }}
            >
              <Calendar size={16} />
              <span className="lp-cta-text-full">Konsultasi</span>
              <span className="lp-cta-text-short">Konsultasi</span>
            </button>
          </div>

          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
          />

          {/* Bento Stats / Cards Row */}
          {data?.cards && data.cards.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(data.cards.length, 3)}, 1fr)`,
                gap: 12,
                paddingTop: 24,
                borderTop: `1px solid ${cardBorder}`,
              }}
            >
              {data.cards.map((card) => {
                const Icon = HERO_ICON_MAP[card.icon || 'Award'] || Award;
                return (
                  <div
                    key={card.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: '14px 16px',
                      background: cardBg,
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: 16,
                      border: `1px solid ${cardBorder}`,
                    }}
                  >
                    <div style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
                      {card.icon?.startsWith('http') ? (
                        <img src={card.icon} alt={card.text} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      ) : (
                        <Icon size={20} strokeWidth={2} />
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: textColor,
                        lineHeight: 1.3,
                      }}
                    >
                      {card.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Image Showcase ── */}
        {data?.heroImage && (
          <div 
            data-reveal="true" 
            className="reveal-delay-2"
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Ambient Aura Frame */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 420,
                aspectRatio: '4/5',
                borderRadius: 32,
                padding: 10,
                background: isDark
                  ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(240,240,245,0.7) 100%)',
                boxShadow: isDark
                  ? `0 24px 64px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)`
                  : `0 24px 64px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 24,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={data.heroImage}
                  alt="Hero Profile"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              {/* Verified Floating Badge */}
              {data.badge?.active !== false && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    right: -12,
                    background: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    padding: '12px 18px',
                    borderRadius: 18,
                    boxShadow: isDark
                      ? '0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
                      : '0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    animation: 'lpFloat 4s ease-in-out infinite',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10,
                        color: subTextColor,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {data.badge?.smallText || 'STATUS'}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 14,
                        fontWeight: 800,
                        color: textColor,
                      }}
                    >
                      {data.badge?.largeText || 'Verified Designer'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lpPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        @keyframes lpFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @media (max-width: 900px) {
          .lp-hero-grid {
            grid-template-columns: 1fr !important;
            padding: 80px 20px 40px !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LPHero;
