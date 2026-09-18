import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  isDark?: boolean;
  accentColor?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi',
  isDark = false,
  accentColor = '#7c3aed',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const bg       = isDark ? 'rgba(20,28,44,0.85)'   : 'rgba(255,255,255,0.95)';
  const border   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const textPri  = isDark ? '#f1f5f9' : '#0d1117';
  const textSub  = isDark ? '#8899b4' : '#64748b';
  const hoverBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const dropBg   = isDark ? 'rgba(15,20,35,0.97)'   : '#ffffff';
  const dropShadow = isDark
    ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
    : '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: '100%',
          padding: '13px 16px',
          borderRadius: 12,
          border: `1px solid ${isOpen ? accentColor + '80' : border}`,
          background: bg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: value ? textPri : textSub,
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: value ? 500 : 400,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: isOpen ? `0 0 0 3px ${accentColor}20` : 'none',
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: textSub,
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: dropBg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${border}`,
            borderRadius: 16,
            boxShadow: dropShadow,
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'customSelectIn 0.18s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <style>{`
            @keyframes customSelectIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Empty / placeholder option */}
          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); }}
            style={{
              width: '100%',
              padding: '11px 16px',
              background: 'transparent',
              border: 'none',
              color: textSub,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ color: textSub, fontStyle: 'italic' }}>{placeholder}</span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: border, marginInline: 12 }} />

          {/* Options */}
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  background: isSelected ? `${accentColor}12` : 'transparent',
                  border: 'none',
                  color: isSelected ? accentColor : textPri,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  transition: 'background 0.15s',
                  // Round last item
                  borderRadius: i === options.length - 1 ? '0 0 15px 15px' : 0,
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget.style.background = hoverBg);
                }}
                onMouseLeave={e => {
                  (e.currentTarget.style.background = isSelected ? `${accentColor}12` : 'transparent');
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
