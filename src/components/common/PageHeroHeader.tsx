import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface PageHeroStat {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
}

export interface PageHeroBreadcrumb {
  label: string;
  url?: string;
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
  isDark?: boolean;
  breadcrumb?: PageHeroBreadcrumb[];
  bgPattern?: 'grid' | 'dots' | 'stripes' | 'waves' | 'none';
  posterImage?: string;
  actionButtons?: React.ReactNode;
  isEditable?: boolean;
  onPatternChange?: (pattern: 'grid' | 'dots' | 'stripes' | 'waves' | 'none') => void;
  onBadgeChange?: (val: string) => void;
  onTitleChange?: (val: string) => void;
  onDescriptionChange?: (val: string) => void;
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
  children,
  isDark,
  breadcrumb,
  bgPattern = 'grid',
  posterImage,
  actionButtons,
  isEditable = false,
  onPatternChange,
  onBadgeChange,
  onTitleChange,
  onDescriptionChange,
}) => {
  const isDarkMode = typeof isDark === 'boolean'
    ? isDark
    : (textColor === '#ffffff' || textColor === '#f8fafc' || textColor === '#f5f6f8' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')));

  const cardBg = isDarkMode ? '#151824' : '#ffffff';
  const cardBorder = isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const resolvedTextColor = textColor || (isDarkMode ? '#ffffff' : '#0f172a');
  const resolvedSubTextColor = subTextColor || (isDarkMode ? '#94a3b8' : '#64748b');

  // Title rendering with clean flat accent highlight
  const renderTitle = () => {
    if (!title) return null;

    if (highlightText && title.includes(highlightText)) {
      const parts = title.split(highlightText);
      return (
        <>
          {parts[0]}
          <span style={{ color: accentColor }}>
            {highlightText}
          </span>
          {parts.slice(1).join(highlightText)}
        </>
      );
    }

    // Default: Highlight the last 2 words if title is long enough
    const words = title.split(' ');
    if (words.length > 2) {
      const normalPart = words.slice(0, -2).join(' ');
      const highlightPart = words.slice(-2).join(' ');
      return (
        <>
          {normalPart}{' '}
          <span style={{ color: accentColor }}>
            {highlightPart}
          </span>
        </>
      );
    }

    return title;
  };

  const isCenter = align === 'center' && !posterImage;

  return (
    <div
      className={`page-hero-header ${className}`}
      data-card-3d="true"
      style={{
        position: 'relative',
        borderRadius: 28,
        border: `1px solid ${cardBorder}`,
        background: cardBg,
        minHeight: 'clamp(360px, 42vh, 400px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(34px, 4.5vw, 52px) clamp(24px, 4vw, 48px)',
        marginBottom: 36,
        boxShadow: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%',
        textAlign: isCenter ? 'center' : 'left',
        ...style
      }}
    >
      {/* Animated Background Pattern Layer */}
      {bgPattern !== 'none' && (
        <div
          aria-hidden="true"
          className={`phh-pattern-layer phh-pattern-${bgPattern}`}
          style={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)'
          }}
        />
      )}

      {/* Editor Pattern Switcher Pill (Top-Right when isEditable) */}
      {isEditable && onPatternChange && (
        <div style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          padding: 4,
          borderRadius: 999,
          background: isDarkMode ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.94)',
          border: `1px solid ${cardBorder}`,
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        }}>
          {(
            [
              { key: 'grid', label: 'Grid' },
              { key: 'dots', label: 'Dots' },
              { key: 'stripes', label: 'Garis' },
              { key: 'waves', label: 'Gelombang' },
              { key: 'none', label: 'Polos' },
            ] as const
          ).map((p) => {
            const active = bgPattern === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onPatternChange(p.key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: 'none',
                  background: active ? accentColor : 'transparent',
                  color: active ? '#fff' : resolvedSubTextColor,
                  fontSize: 11,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Grid (Supports 2-column with posterImage) */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: posterImage ? 'minmax(0, 1.25fr) minmax(0, 0.75fr)' : '1fr',
        gap: 28,
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCenter ? 'center' : 'flex-start',
          width: '100%',
          maxWidth: isCenter ? 820 : '100%',
          margin: isCenter ? '0 auto' : '0'
        }}>
          {/* Breadcrumb Navigation */}
          {breadcrumb && breadcrumb.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12.5,
                color: resolvedSubTextColor,
                marginBottom: 16
              }}
            >
              {breadcrumb.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
                  {crumb.url ? (
                    <Link
                      to={crumb.url}
                      style={{
                        color: resolvedSubTextColor,
                        textDecoration: 'none',
                        fontWeight: 600,
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = resolvedSubTextColor)}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span style={{ color: resolvedTextColor, fontWeight: 750 }}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Badge Pill */}
          {badgeText && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 100,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
              border: `1px solid ${cardBorder}`,
              color: resolvedTextColor,
              fontSize: 11.5,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 16,
              boxShadow: 'none'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
              {badgeIcon}
              <span
                contentEditable={isEditable && Boolean(onBadgeChange)}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const v = e.currentTarget.textContent?.trim();
                  if (v !== undefined && onBadgeChange) onBadgeChange(v);
                }}
                style={{ outline: 'none' }}
              >
                {badgeText}
              </span>
            </div>
          )}

          {/* Headline */}
          {title && (
            <h1
              contentEditable={isEditable && Boolean(onTitleChange)}
              suppressContentEditableWarning
              onBlur={(e) => {
                const v = e.currentTarget.textContent?.trim();
                if (v !== undefined && onTitleChange) onTitleChange(v);
              }}
              style={{
                margin: '0 0 14px 0',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(28px, 4.5vw, 44px)',
                fontWeight: 900,
                letterSpacing: '-0.035em',
                lineHeight: 1.15,
                color: resolvedTextColor,
                outline: 'none'
              }}
            >
              {isEditable ? title : renderTitle()}
            </h1>
          )}

          {/* Description */}
          {description && (
            <p
              contentEditable={isEditable && Boolean(onDescriptionChange)}
              suppressContentEditableWarning
              onBlur={(e) => {
                const v = e.currentTarget.textContent?.trim();
                if (v !== undefined && onDescriptionChange) onDescriptionChange(v);
              }}
              style={{
                margin: isCenter ? '0 auto 22px' : '0 0 22px',
                maxWidth: 720,
                fontSize: 'clamp(14px, 1.8vw, 15.5px)',
                color: resolvedSubTextColor,
                outline: 'none',
                lineHeight: 1.65
            }}>
              {description}
            </p>
          )}

          {/* Live Dynamic Stats */}
          {stats && stats.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: isCenter ? 'center' : 'flex-start',
              marginBottom: actionButtons || children ? 22 : 0
            }}>
              {stats.map((st, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 14px',
                    borderRadius: 100,
                    background: isDarkMode ? 'rgba(0, 0, 0, 0.28)' : '#eef2f6',
                    border: `1px solid ${cardBorder}`,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: resolvedSubTextColor
                  }}
                >
                  {st.icon && <span style={{ color: accentColor, display: 'flex' }}>{st.icon}</span>}
                  <strong style={{ color: resolvedTextColor }}>{st.value}</strong>
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons Row */}
          {actionButtons && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: isCenter ? 'center' : 'flex-start',
              marginBottom: children ? 20 : 0
            }}>
              {actionButtons}
            </div>
          )}

          {/* Children (e.g. search bars, filters) */}
          {children && (
            <div style={{
              width: '100%',
              maxWidth: isCenter ? 520 : '100%',
              margin: isCenter ? '0 auto' : '0'
            }}>
              {children}
            </div>
          )}
        </div>

        {/* Optional Right Photo Poster Card */}
        {posterImage && (
          <div style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            height: '100%',
            minHeight: 280,
            border: `1px solid ${cardBorder}`
          }}>
            <img
              src={posterImage}
              alt={title || 'Poster'}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes phhMoveGrid {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 36px 36px, 36px 36px; }
        }
        @keyframes phhMoveDots {
          0% { background-position: 0 0; }
          100% { background-position: 24px 24px; }
        }
        @keyframes phhMoveStripes {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes phhMoveWaves {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 48px 48px, -48px -48px; }
        }

        .phh-pattern-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          z-index: 0;
        }

        .phh-pattern-grid {
          background-image: 
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px);
          background-size: 36px 36px;
          animation: phhMoveGrid 24s linear infinite;
        }

        .phh-pattern-dots {
          background-image: radial-gradient(currentColor 1.5px, transparent 1.5px);
          background-size: 24px 24px;
          animation: phhMoveDots 18s linear infinite;
        }

        .phh-pattern-stripes {
          background-image: repeating-linear-gradient(
            45deg,
            currentColor 0,
            currentColor 12px,
            transparent 12px,
            transparent 24px
          );
          background-size: 34px 34px;
          animation: phhMoveStripes 16s linear infinite;
        }

        .phh-pattern-waves {
          background-image: 
            radial-gradient(ellipse at center, currentColor 0%, transparent 65%),
            linear-gradient(135deg, currentColor 25%, transparent 25%);
          background-size: 48px 48px, 48px 48px;
          animation: phhMoveWaves 24s linear infinite;
        }

        @media (max-width: 820px) {
          .page-hero-header > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PageHeroHeader;
