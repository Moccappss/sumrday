import React from 'react';
import { ChevronRight, ArrowRight, Zap, Lightbulb, Code2, Rocket, Sparkles } from 'lucide-react';

interface ProcessData {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface LPProcessProps {
  process: ProcessData[];
  isDark?: boolean;
  accentColor: string;
  localization?: any;
}

const STEP_COLORS = [
  { accent: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.22)', glow: 'rgba(59, 130, 246, 0.15)', icon: Lightbulb },
  { accent: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.22)', glow: 'rgba(139, 92, 246, 0.15)', icon: Zap },
  { accent: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.22)', glow: 'rgba(236, 72, 153, 0.15)', icon: Code2 },
  { accent: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.22)', glow: 'rgba(16, 185, 129, 0.15)', icon: Rocket },
];

const LPProcess: React.FC<LPProcessProps> = ({ process, isDark = false, accentColor, localization }) => {
  if (!process || process.length === 0) return null;

  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const sectionBg = isDark ? '#08080f' : '#ffffff';

  return (
    <section
      id="process"
      style={{
        padding: '110px 24px',
        background: sectionBg,
        color: textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        
        {/* Section Header */}
        <div data-reveal="true" style={{ textAlign: 'center', marginBottom: 56 }}>
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
            <Sparkles size={14} />
            <span>{localization?.processSectionTitle || 'PROSES KERJA'}</span>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(30px, 3.6vw, 44px)',
            fontWeight: 850,
            margin: 0,
            letterSpacing: '-0.025em',
            color: textColor,
          }}>
            {localization?.processMainTitle || 'Bagaimana Kami Bekerja'}
          </h2>
        </div>

        {/* 4-Step Colorful Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 22,
          alignItems: 'stretch',
        }}>
          {process.map((step, index) => {
            const colorScheme = STEP_COLORS[index % STEP_COLORS.length];
            const StepIcon = colorScheme.icon;
            const stepNum = String(index + 1).padStart(2, '0');

            return (
              <div
                key={step.id || index}
                data-reveal="true"
                className={`reveal-delay-${(index % 4) + 1}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  padding: '30px 24px',
                  borderRadius: 24,
                  border: `1px solid ${isDark ? colorScheme.border : 'rgba(0,0,0,0.06)'}`,
                  background: isDark ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
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
                {/* Ambient Soft Glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: -24,
                    right: -24,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: colorScheme.accent,
                    opacity: 0.1,
                    filter: 'blur(20px)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Top Row: Number & Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 24,
                      fontWeight: 900,
                      color: colorScheme.accent,
                      letterSpacing: '-0.02em',
                      padding: '4px 12px',
                      borderRadius: 12,
                      background: colorScheme.bg,
                      border: `1px solid ${colorScheme.border}`,
                    }}
                  >
                    {stepNum}
                  </div>

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: colorScheme.bg,
                      color: colorScheme.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StepIcon size={20} strokeWidth={2} />
                  </div>
                </div>

                <div>
                  <h3 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 18,
                    fontWeight: 800,
                    margin: '0 0 8px',
                    color: textColor,
                    letterSpacing: '-0.01em',
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13.5,
                    color: subTextColor,
                    lineHeight: 1.65,
                    margin: 0,
                  }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #process {
            padding: 70px 18px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default LPProcess;
