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

// kept for reference (unused icon import retained to avoid behavioral diffs)
void CheckCircle2;

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
  // Bento 2.0 Solid tokens
  const pageBg = isDark ? '#06070a' : '#eef2f6';
  const surface = isDark ? '#151824' : '#ffffff';
  const surface2 = isDark ? '#1f2436' : '#f1f5f9';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const ink = isDark ? '#ffffff' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const inkBtnBg = isDark ? '#ffffff' : '#0f1115';
  const inkBtnText = isDark ? '#0f1115' : '#ffffff';
  const tint = `color-mix(in srgb, ${accentColor} 14%, transparent)`;

  const firstSentence = bio ? bio.split('.')[0] + '.' : "Desainer & developer yang fokus pada kesederhanaan, keindahan, dan dampak nyata.";
  const restOfBio = bio && bio.split('.').length > 1 ? bio.split('.').slice(1).join('.').trim() : '';

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    padding: '6px 14px',
    borderRadius: 999,
    background: surface,
    border: `1px solid ${cardBorder}`,
    color: ink,
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 700,
  };
  const dot = <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, display: 'inline-block' }} />;

  return (
    <section
      id="about"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: pageBg,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* ── ABOUT ME ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 'clamp(28px, 5vw, 64px)',
            alignItems: 'center',
            marginBottom: 'clamp(56px, 8vw, 96px)',
          }}
        >
          {/* Visual block */}
          <div data-reveal="true" className="reveal-delay-1" style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                aspectRatio: '4/3',
                borderRadius: 22,
                position: 'relative',
                overflow: 'hidden',
                padding: 10,
                background: surface,
                border: `1px solid ${cardBorder}`,
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  background: surface2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {image ? (
                  <img src={image} alt="Profile" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: accentColor }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={32} />
                    </div>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 800, color: ink }}>sumr.day</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text block */}
          <div data-reveal="true" className="reveal-delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={badgeStyle}>
              {dot}
              <span>{localization?.aboutSectionTitle || 'TENTANG SAYA'}</span>
            </div>

            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(1.9rem, 4vw, 3rem)',
              fontWeight: 800,
              color: ink,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: '-0.035em',
            }}>
              {localization?.aboutMainTitle || firstSentence}
            </h2>

            {(localization?.aboutMainTitle ? bio : restOfBio) && (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 16,
                color: sub,
                lineHeight: 1.6,
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
                  gap: 12,
                  height: 44,
                  padding: '6px 6px 6px 20px',
                  background: inkBtnBg,
                  color: inkBtnText,
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 999,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: 'none',
                  transition: 'transform .2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span>Pelajari Lebih Lengkap</span>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: accentColor, color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={16} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── SERVICES & TOOLKIT ── */}
        <div data-reveal="true" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14, marginBottom: 40 }}>
          <div style={{ ...badgeStyle, alignSelf: 'center' }}>
            {dot}
            <span>LAYANAN &amp; KEAHLIAN</span>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(1.9rem, 4vw, 3rem)',
            fontWeight: 800,
            color: ink,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
          }}>
            Layanan &amp; Toolkit Profesional
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
            gap: 16,
          }}
        >
          {skills && skills.length > 0 ? skills.map((skill, index) => {
            const IconComponent = getIconComponent(skill.icon);
            const isAccent = index === 0;
            return (
              <div
                key={skill.id || index}
                data-reveal="true"
                data-card-3d="true"
                className={`reveal-delay-${(index % 4) + 1}`}
                style={{
                  background: isAccent ? accentColor : surface,
                  border: isAccent ? 'none' : `1px solid ${cardBorder}`,
                  borderRadius: 22,
                  padding: '26px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  boxShadow: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="skill-icon-badge"
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    minHeight: 44,
                    aspectRatio: '1 / 1',
                    flexShrink: 0,
                    borderRadius: 14,
                    background: isAccent ? 'rgba(255,255,255,0.22)' : tint,
                    color: isAccent ? '#ffffff' : accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  {skill.icon?.startsWith('http') ? (
                    <img src={skill.icon} alt={skill.name} style={{ width: 22, height: 22, objectFit: 'contain' }} />
                  ) : (
                    <IconComponent size={22} />
                  )}
                </div>

                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  color: isAccent ? '#ffffff' : ink,
                  margin: '0 0 8px',
                  letterSpacing: '-0.02em',
                }}>
                  {skill.name}
                </h3>

                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  color: isAccent ? 'rgba(255,255,255,0.85)' : sub,
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
              color: sub,
              padding: '40px 0',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              background: surface,
              border: `1px dashed ${cardBorder}`,
              borderRadius: 22,
            }}>
              Belum ada layanan yang ditambahkan.
            </div>
          )}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          #about {
            padding: 56px 18px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LPAbout;
