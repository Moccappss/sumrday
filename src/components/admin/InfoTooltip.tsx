import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, placement = 'top' }) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; arrowStyle: React.CSSProperties }>({
    top: 0,
    left: 0,
    arrowStyle: {}
  });

  const calculateCoords = useCallback(() => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 230;
    const gap = 8;

    let targetTop = 0;
    let targetLeft = 0;
    let arrowCss: React.CSSProperties = {};

    if (placement === 'top') {
      targetTop = rect.top - gap;
      targetLeft = rect.left + rect.width / 2;
      arrowCss = {
        bottom: -4,
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        borderRight: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)'
      };
    } else if (placement === 'bottom') {
      targetTop = rect.bottom + gap;
      targetLeft = rect.left + rect.width / 2;
      arrowCss = {
        top: -4,
        left: '50%',
        transform: 'translateX(-50%) rotate(-135deg)',
        borderRight: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)'
      };
    } else if (placement === 'left') {
      targetTop = rect.top + rect.height / 2;
      targetLeft = rect.left - gap;
      arrowCss = {
        right: -4,
        top: '50%',
        transform: 'translateY(-50%) rotate(-45deg)',
        borderRight: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)'
      };
    } else {
      targetTop = rect.top + rect.height / 2;
      targetLeft = rect.right + gap;
      arrowCss = {
        left: -4,
        top: '50%',
        transform: 'translateY(-50%) rotate(135deg)',
        borderRight: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)'
      };
    }

    // Boundary protection within window
    const clampedLeft = Math.max(16 + tooltipWidth / 2, Math.min(window.innerWidth - tooltipWidth / 2 - 16, targetLeft));
    const arrowOffset = targetLeft - clampedLeft;

    if (placement === 'top' || placement === 'bottom') {
      arrowCss.left = `calc(50% + ${arrowOffset}px)`;
    }

    return {
      top: targetTop,
      left: clampedLeft,
      arrowStyle: arrowCss
    };
  }, [placement]);

  const handleOpen = () => {
    const nextCoords = calculateCoords();
    if (nextCoords) {
      setCoords(nextCoords);
    }
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (visible) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  useEffect(() => {
    if (visible) {
      const handleReposition = () => {
        const nextCoords = calculateCoords();
        if (nextCoords) setCoords(nextCoords);
      };
      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);
      const handleOutside = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setVisible(false);
        }
      };
      document.addEventListener('mousedown', handleOutside);
      return () => {
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('resize', handleReposition);
        document.removeEventListener('mousedown', handleOutside);
      };
    }
  }, [visible, calculateCoords]);

  return (
    <div 
      ref={triggerRef}
      className="cms-info-tooltip-container"
      style={{ 
        display: 'inline-flex', 
        position: 'relative', 
        verticalAlign: 'middle', 
        cursor: 'pointer',
        marginLeft: 6,
        flexShrink: 0
      }}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onClick={handleToggle}
    >
      <div 
        style={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 17, 
          height: 17, 
          borderRadius: '50%',
          background: visible ? 'var(--cms-accent)' : 'var(--cms-accent-soft)', 
          color: visible ? '#fff' : 'var(--cms-accent)',
          border: '1px solid var(--glass-border)',
          transition: 'all 0.15s ease',
          opacity: 0.85
        }}
        className="cms-info-icon"
      >
        <Info size={10.5} strokeWidth={2.5} />
      </div>

      {visible && coords.top > 0 && createPortal(
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: placement === 'top' ? 'translate(-50%, -100%)' :
                       placement === 'bottom' ? 'translate(-50%, 0)' :
                       placement === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
            zIndex: 2147483644,
            pointerEvents: 'none',
            animation: 'cmsTooltipPureFade 0.15s ease-out'
          }}
        >
          <div
            className="cms-info-tooltip-bubble"
            style={{
              position: 'relative',
              width: 230,
              maxWidth: 'calc(100vw - 32px)',
              padding: '10px 14px',
              background: 'var(--cms-card-bg, #1a1a24)',
              color: 'var(--cms-text, #fff)',
              borderRadius: 12,
              border: '1.5px solid var(--glass-border)',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.5,
              letterSpacing: '-0.01em',
              textAlign: 'left',
              wordBreak: 'break-word'
            }}
          >
            {content}
            
            {/* Arrow */}
            <div 
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                background: 'var(--cms-card-bg, #1a1a24)',
                ...coords.arrowStyle
              }}
            />
          </div>
        </div>,
        document.body
      )}
      
      <style>{`
        @keyframes cmsTooltipPureFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .cms-info-tooltip-container:hover .cms-info-icon {
          transform: scale(1.1);
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default InfoTooltip;
