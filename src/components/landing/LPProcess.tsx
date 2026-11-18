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
  { accent: '#D95629', bg: 'rgba(217, 86, 41, 0.08)', border: 'rgba(217, 86, 41, 0.22)', icon: Lightbulb },
  { accent: '#F7BA38', bg: 'rgba(247, 186, 56, 0.08)', border: 'rgba(247, 186, 56, 0.22)', icon: Zap },
  { accent: '#1687A7', bg: 'rgba(22, 135, 167, 0.08)', border: 'rgba(22, 135, 167, 0.22)', icon: Code2 },
  { accent: '#52B3C5', bg: 'rgba(82, 179, 197, 0.08)', border: 'rgba(82, 179, 197, 0.22)', icon: Rocket },
];

const DEFAULT_PROCESS: ProcessData[] = [
  { id: 'proc-1', title: 'Eksplorasi & Kebutuhan', description: 'Menyelami ekspektasi, arah visual, dan sasaran proyek brand Anda secara mendalam.' },
  { id: 'proc-2', title: 'Perancangan Konsep', description: 'Merancang arsitektur informasi, moodboard visual, dan struktur antarmuka prototipe.' },
  { id: 'proc-3', title: 'Produksi & Visual', description: 'Membangun antarmuka interaktif dengan animasi presisi, performa gesit, dan standar web modern.' },
  { id: 'proc-4', title: 'Peluncuran & Rilis', description: 'Pengujian menyeluruh di semua perangkat, deployment live, serta pendampingan pasca-rilis.' },
];

const LPProcess: React.FC<LPProcessProps> = ({ process, isDark = false, accentColor, localization }) => {
  const activeProcess = (process && process.length > 0) ? process : DEFAULT_PROCESS;

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const sectionBg = isDark ? '#06070a' : '#eef2f6';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const cardBg = isDark ? '#151824' : '#ffffff';

  return (
    <section
      id="process"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: sectionBg,
        color: textColor,
        transition: 'background-color 0.3s ease, color 0.3s ease',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Section Header */}
        <div data-reveal="true" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11.5,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>{localization?.processSectionTitle || 'ALUR KOLABORASI'}</span>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(28px, 3.4vw, 42px)',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.025em',
            color: textColor,
          }}>
            {localization?.processMainTitle || 'Alur Pengerjaan'}
          </h2>
        </div>

        {/* 4-Step Colorful Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
          gap: 22,
          alignItems: 'stretch',
        }}>
          {activeProcess.map((step, index) => {
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
                  padding: '28px 22px',
                  borderRadius: 22,
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  boxShadow: 'none',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
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
                      minWidth: 40,
                      minHeight: 40,
                      aspectRatio: '1 / 1',
                      flexShrink: 0,
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
