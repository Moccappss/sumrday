import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image, PenTool, Video, Cpu, Star,
  Layers, Palette, Monitor, Package, Type,
  Layout, Wand2, Brush, Scissors, Code2, ArrowUpRight, CheckCircle2, Sparkles, User
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Image, PenTool, Video, Cpu, Star,
  Layers, Palette, Monitor, Package, Type,
  Layout, Wand2, Brush, Scissors, Code2,
  Figma: Layout,
  Camera: Monitor,
};

const CARD_PALETTES = [
  { accent: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)', glow: 'rgba(99, 102, 241, 0.18)' },
  { accent: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', glow: 'rgba(16, 185, 129, 0.18)' },
  { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', glow: 'rgba(245, 158, 11, 0.18)' },
  { accent: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.2)', glow: 'rgba(236, 72, 153, 0.18)' },
  { accent: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.08)', border: 'rgba(14, 165, 233, 0.2)', glow: 'rgba(14, 165, 233, 0.18)' },
  { accent: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.2)', glow: 'rgba(168, 85, 247, 0.18)' },
];

const getIconComponent = (iconName?: string): React.ComponentType<{ size?: number }> => {
  if (!iconName) return Sparkles;
  return ICON_MAP[iconName] || Sparkles;
};

interface LPAboutProps {
  bio: string;
  image?: string | null;
  skills: any[];
  isDark: boolean;
  accentColor: string;
  localization?: any;
}

const LPAbout: React.FC<LPAboutProps> = ({ bio, image, skills = [], isDark, accentColor, localization }) => {
  const navigate = useNavigate();
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const sectionBg = isDark ? '#0b0f19' : '#f8fafc';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const firstSentence = bio ? bio.split('.')[0] + '.' : "Desainer & developer yang fokus pada kesederhanaan, keindahan, dan dampak nyata.";
  const restOfBio = bio && bio.split('.').length > 1 ? bio.split('.').slice(1).join('.').trim() : '';

  return (
    <section
      id="about"
      style={{
        padding: '110px 24px',
        background: sectionBg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        {/* ── ABOUT ME BENTO ── */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 48,
            alignItems: 'center',
            marginBottom: 88,
          }}
        >
          {/* Visual block with soft ambient glow */}
          <div data-reveal="true" className="reveal-delay-1" style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                aspectRatio: '4/3',
                borderRadius: 28,
                position: 'relative',
                overflow: 'hidden',
                padding: 10,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                boxShadow: isDark
                  ? '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
                  : '0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  position: 'relative',
                  background: isDark ? '#111827' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {image ? (
                  <img src={image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: accentColor }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={32} />
                    </div>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700 }}>sumr.day</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text block */}
          <div data-reveal="true" className="reveal-delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Sparkles size={14} />
              <span>{localization?.aboutSectionTitle || 'TENTANG SAYA'}</span>
            </div>

            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(28px, 3.4vw, 42px)',
              fontWeight: 850,
              color: textColor,
              lineHeight: 1.18,
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {localization?.aboutMainTitle || firstSentence}
            </h2>

            {(localization?.aboutMainTitle ? bio : restOfBio) && (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                color: subTextColor,
                lineHeight: 1.8,
                margin: 0,
              }}>
                {restOfBio || bio}
              </p>
            )}

            <div style={{ paddingTop: 8 }}>
              <button
                onClick={() => navigate('/about')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 100,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: `0 8px 24px ${accentColor}35`,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${accentColor}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}35`;
                }}
              >
                <span>Pelajari Lebih Lengkap</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── COLORFUL SERVICES & TOOLKIT CARDS ── */}
        <div data-reveal="true" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            — LAYANAN & KEAHLIAN
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(28px, 3.5vw, 42px)',
            fontWeight: 850,
            color: textColor,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Layanan & Toolkit Profesional
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {skills && skills.length > 0 ? skills.map((skill, index) => {
            const IconComponent = getIconComponent(skill.icon);
            const palette = CARD_PALETTES[index % CARD_PALETTES.length];
            return (
              <div
                key={skill.id || index}
                data-reveal="true"
                className={`reveal-delay-${(index % 4) + 1}`}
                style={{
                  background: isDark ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${isDark ? palette.border : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: 22,
                  padding: '28px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = palette.accent;
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 16px 36px ${palette.glow}, 0 0 0 1px ${palette.accent}40`;
                  const badge = e.currentTarget.querySelector('.skill-icon-badge') as HTMLElement;
                  if (badge) {
                    badge.style.transform = 'scale(1.1) rotate(5deg)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? palette.border : 'rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.03)';
                  const badge = e.currentTarget.querySelector('.skill-icon-badge') as HTMLElement;
                  if (badge) {
                    badge.style.transform = 'scale(1) rotate(0deg)';
                  }
                }}
              >
                {/* Colorful top corner glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: palette.accent,
                    opacity: 0.12,
                    filter: 'blur(25px)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Colorful Icon Badge */}
                <div
                  className="skill-icon-badge"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    background: palette.bg,
                    border: `1px solid ${palette.border}`,
                    color: palette.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {skill.icon?.startsWith('http') ? (
                    <img src={skill.icon} alt={skill.name} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  ) : (
                    <IconComponent size={24} />
                  )}
                </div>

                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  color: textColor,
                  margin: '0 0 8px',
                  letterSpacing: '-0.01em',
                }}>
                  {skill.name}
                </h3>

                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13.5,
                  color: subTextColor,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {skill.description}
                </p>
              </div>
            );
          }) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: subTextColor,
              padding: '40px 0',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
            }}>
              Belum ada layanan yang ditambahkan.
            </div>
          )}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          #about {
            padding: 70px 18px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LPAbout;
