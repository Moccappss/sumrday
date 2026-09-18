import React from 'react';
import { Star, Quote, CheckCircle2, MessageSquare } from 'lucide-react';

interface TestimonialData {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  company?: string;
  rating?: number;
}

interface LPTestimonialsProps {
  testimonials: TestimonialData[];
  isDark: boolean;
  accentColor: string;
  localization?: any;
}

const TESTIMONIAL_COLORS = [
  { accent: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.22)', glow: 'rgba(139, 92, 246, 0.15)' },
  { accent: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.08)', border: 'rgba(14, 165, 233, 0.22)', glow: 'rgba(14, 165, 233, 0.15)' },
  { accent: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.22)', glow: 'rgba(16, 185, 129, 0.15)' },
  { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.22)', glow: 'rgba(245, 158, 11, 0.15)' },
];

const LPTestimonials: React.FC<LPTestimonialsProps> = ({ testimonials = [], isDark, accentColor, localization }) => {
  if (!testimonials || testimonials.length === 0) return null;

  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const sectionBg = isDark ? '#0b0f19' : '#f8fafc';

  return (
    <section
      id="testimonials"
      style={{
        padding: '110px 24px',
        background: sectionBg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* Header */}
        <div data-reveal="true" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <MessageSquare size={14} />
            <span>{localization?.testimonialSectionTitle || 'TESTIMONI KLIEN'}</span>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(30px, 3.6vw, 44px)',
            fontWeight: 850,
            color: textColor,
            margin: 0,
            letterSpacing: '-0.025em',
          }}>
            {localization?.testimonialMainTitle || 'Apa Kata Klien Kami'}
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {testimonials.map((testi, index) => {
            const colorScheme = TESTIMONIAL_COLORS[index % TESTIMONIAL_COLORS.length];
            return (
              <div
                key={testi.id || index}
                data-reveal="true"
                className={`reveal-delay-${(index % 3) + 1}`}
                style={{
                  background: isDark ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${isDark ? colorScheme.border : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: 24,
                  padding: '30px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 22,
                  boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = colorScheme.accent;
                  e.currentTarget.style.boxShadow = `0 18px 40px ${colorScheme.glow}, 0 0 0 1px ${colorScheme.accent}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isDark ? colorScheme.border : 'rgba(0,0,0,0.06)';
                  e.currentTarget.style.boxShadow = isDark ? '0 10px 28px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.03)';
                }}
              >
                {/* Top Row: 5 Gold Stars & Quote Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 3, color: '#f59e0b' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>

                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: colorScheme.bg,
                      color: colorScheme.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Quote size={16} />
                  </div>
                </div>

                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14.5,
                  color: textColor,
                  lineHeight: 1.7,
                  margin: 0,
                  flex: 1,
                  fontStyle: 'italic',
                }}>
                  "{testi.quote}"
                </p>

                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: colorScheme.bg,
                    border: `1.5px solid ${colorScheme.border}`,
                    backgroundImage: testi.avatar ? `url(${testi.avatar})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colorScheme.accent,
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 16,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {!testi.avatar && (testi.author ? testi.author.charAt(0).toUpperCase() : 'K')}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 15,
                      fontWeight: 700,
                      color: textColor,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {testi.author}
                      </span>
                      <CheckCircle2 size={14} color="#10b981" />
                    </div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 12.5,
                      color: subTextColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {testi.role || 'Klien Puas'} {testi.company ? `• ${testi.company}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #testimonials {
            padding: 70px 18px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LPTestimonials;
