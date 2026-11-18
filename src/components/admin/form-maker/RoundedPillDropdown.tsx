import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface RoundedPillDropdownProps {
  value: string | number;
  options: DropdownOption[];
  placeholder?: string;
  onChange: (val: any) => void;
  isDarkMode?: boolean;
  cardAccent?: string;
  minWidth?: number | string;
  size?: 'sm' | 'md';
}

export const RoundedPillDropdown: React.FC<RoundedPillDropdownProps> = ({
  value,
  options,
  placeholder = '-- Pilih salah satu opsi --',
  onChange,
  isDarkMode = true,
  cardAccent = '#6366f1',
  minWidth = 260,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOpt = options.find((o) => String(o.value) === String(value));

  const isSm = size === 'sm';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: minWidth || '100%', boxSizing: 'border-box' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isSm ? 6 : 12,
          padding: isSm ? '6px 14px' : '11px 20px',
          borderRadius: 100, // ROUNDED PILL
          border: `1.5px solid ${isOpen ? cardAccent : (isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')}`,
          background: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : '#ffffff',
          color: selectedOpt ? (isDarkMode ? '#f8fafc' : '#1e293b') : 'var(--cms-text-muted, #94a3b8)',
          fontSize: isSm ? 12.5 : 14,
          fontWeight: 750,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? `0 0 0 3px ${cardAccent}25` : '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <ChevronDown
          size={isSm ? 13 : 16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            color: 'var(--cms-text-muted)',
            flexShrink: 0
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: '100%',
            maxWidth: '100vw',
            maxHeight: 250,
            overflowY: 'auto',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 20, // ROUNDED PILL LIST CONTAINER
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            padding: 6,
            zIndex: 110,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            animation: 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: isSm ? '7px 12px' : '9px 14px',
                  borderRadius: 100, // ROUNDED PILL LIST ITEM
                  background: isSelected ? `${cardAccent}20` : 'transparent',
                  color: isSelected ? cardAccent : (isDarkMode ? '#e2e8f0' : '#334155'),
                  border: 'none',
                  fontSize: isSm ? 12 : 13.5,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 'unset',
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} color={cardAccent} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoundedPillDropdown;
