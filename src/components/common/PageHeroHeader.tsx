import React from 'react';
import { Sparkles, Compass } from 'lucide-react';

export interface PageHeroStat {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
}

export interface PageHeroHeaderProps {
  badgeIcon?: React.ReactNode;
  badgeText?: string;
  title?: string;
  highlightText?: string;
  description?: string;
  stats?: PageHeroStat[];
  accentColor?: string;
  textColor?: string;
  subTextColor?: string;
  align?: 'center' | 'left';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const PageHeroHeader: React.FC<PageHeroHeaderProps> = ({
  badgeIcon,
  badgeText,
  title = '',
  highlightText,
  description = '',
  stats = [],
  accentColor = '#0ea5e9',
  textColor,
  subTextColor,
  align = 'center',
  className = '',
  style = {},
  children
}) => {
  // Determine highlighted title rendering
  const renderTitle = () => {
    if (!title) return null;

    const gradientSpanStyle: React.CSSProperties = {
      backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, #9333ea 50%, #ec4899 100%)`,
      WebkitBackgroundImage: `linear-gradient(135deg, ${accentColor} 0%, #9333ea 50%, #ec4899 100%)`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
      display: 'inline',
      fontWeight: 'inherit',
    };

    if (highlightText && title.includes(highlightText)) {
      const parts = title.split(highlightText);
      return (
        <>
          {parts[0]}
          <span style={gradientSpanStyle}>
            {highlightText}
          </span>
          {parts.slice(1).join(highlightText)}
        </>
      );
    }

    // Default: Highlight the last 2 words if no specific highlightText is provided
    const words = title.split(' ');
    if (words.length > 2) {
      const normalPart = words.slice(0, -2).join(' ');
      const highlightPart = words.slice(-2).join(' ');
      return (
        <>
          {normalPart}{' '}
          <span style={gradientSpanStyle}>
            {highlightPart}
          </span>
        </>
      );
    }

    return (
      <span style={gradientSpanStyle}>
        {title}
      </span>
    );
  };

  const isCenter = align === 'center';
  const resolvedTextColor = textColor || 'inherit';
  const resolvedSubTextColor = subTextColor || 'var(--blog-text-muted, var(--cms-text-secondary, #94a3b8))';

  return (
    <div
      data-reveal="true"
      className={`page-hero-header ${className}`}
      style={{
        textAlign: align,
        marginBottom: 40,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCenter ? 'center' : 'flex-start',
        ...style
      }}
    >
      {/* Subtle Glow Backdrop */}
      <div style={{
        position: 'absolute',
        top: -40,
        left: isCenter ? '50%' : '20%',
        transform: isCenter ? 'translateX(-50%)' : 'none',
        width: 420,
        height: 180,
        background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
        filter: 'blur(42px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 900 }}>
        {/* Badge Pill */}
        {badgeText && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 99,
            background: 'var(--blog-accent-12, rgba(14,165,233,0.12))',
            color: accentColor,
            fontSize: 12,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 16,
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 2px 10px ${accentColor}15`
          }}>
            {badgeIcon || <Sparkles size={14} />}
            <span>{badgeText}</span>
          </div>
        )}

        {/* Main Headline */}
        {title && (
          <h1 style={{
            margin: '0 0 14px 0',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(28px, 4.5vw, 46px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.18,
            color: resolvedTextColor
          }}>
            {renderTitle()}
          </h1>
        )}

        {/* Subtitle Description */}
        {description && (
          <p style={{
            margin: isCenter ? '0 auto 26px' : '0 0 26px',
            maxWidth: 680,
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            color: resolvedSubTextColor,
            lineHeight: 1.7
          }}>
            {description}
          </p>
        )}

        {/* Dynamic Live Stats Bar */}
        {stats && stats.length > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: isCenter ? 'center' : 'flex-start',
            marginBottom: children ? 24 : 0
          }}>
            {stats.map((st, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--blog-border, rgba(255,255,255,0.15))' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: resolvedSubTextColor }}>
                  {st.icon && <span style={{ color: accentColor, display: 'flex' }}>{st.icon}</span>}
                  <span>
                    <strong style={{ color: resolvedTextColor, marginRight: 4 }}>
                      {st.value}
                    </strong>
                    {st.label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Additional children (e.g. search bars, filters) */}
        {children && (
          <div style={{ marginTop: 24, width: '100%' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeroHeader;
