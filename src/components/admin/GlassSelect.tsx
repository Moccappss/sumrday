import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Info, Trash2, Plus } from 'lucide-react';

const DROPDOWN_HEIGHT = 300; // max dropdown height in px
const DROPDOWN_MARGIN = 8;   // gap between trigger and dropdown

const GlassSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Pilih...', 
  style = {},
  onDeleteOption,
  onAddOption,
  addPlaceholder = 'Tambah baru...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close when clicking outside or scrolling
  useEffect(() => {
    const handleClose = (event) => {
      if (event.type === 'mousedown' && containerRef.current && containerRef.current.contains(event.target)) {
        return;
      }
      if (dropdownRef.current && (dropdownRef.current === event.target || dropdownRef.current.contains(event.target))) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleClose, { capture: true });

    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, { capture: true });
    };
  }, []);

  // Calculate position + decide open direction
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Number of options to estimate actual height (max 4 items visible without scroll)
      const estimatedHeight = Math.min(DROPDOWN_HEIGHT, options.length * 50 + 12);
      
      // Flip UP if not enough room below but enough above, otherwise open down
      const openUp = spaceBelow < estimatedHeight + DROPDOWN_MARGIN && spaceAbove > estimatedHeight + DROPDOWN_MARGIN;

      setCoords({
        // For opening down: position below trigger
        // For opening up: position above trigger (calculated in style)
        triggerBottom: rect.bottom + window.scrollY,
        triggerTop: rect.top + window.scrollY,
        triggerHeight: rect.height,
        left: rect.left + window.scrollX,
        width: rect.width,
        openUp,
      });
    }
  }, [isOpen, options.length]);

  const selectedOption = options.find(opt => opt.key === value || opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const isDark = document.documentElement.getAttribute('data-cms-theme') === 'dark';

  const dropdownStyle = {
    position: 'absolute',
    left: coords.left,
    width: coords.width,
    background: 'var(--cms-panel-bg)',
    backdropFilter: 'blur(40px) saturate(210%)',
    WebkitBackdropFilter: 'blur(40px) saturate(210%)',
    border: '1px solid var(--glass-border)',
    borderRadius: 24,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--glass-border)',
    overflow: 'hidden',
    zIndex: 99999,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'all' : 'none',
    transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    maxHeight: DROPDOWN_HEIGHT,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    padding: '6px',
    // Direction-aware positioning & animation
    ...(coords.openUp ? {
      bottom: window.innerHeight - coords.triggerTop + window.scrollY + DROPDOWN_MARGIN,
      top: 'auto',
      transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.97)',
      transformOrigin: 'bottom center',
    } : {
      top: (coords.triggerBottom || 0) + DROPDOWN_MARGIN,
      bottom: 'auto',
      transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.97)',
      transformOrigin: 'top center',
    }),
  };

  const triggerStyle = {
    width: '100%',
    height: 46,
    padding: '0 20px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(200%)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(200%)',
    border: '1px solid var(--glass-border)',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    color: 'var(--glass-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
    outline: 'none',
    ...style,
    // Override border when open
    ...(isOpen ? {
      borderColor: 'var(--cms-accent, #7c3aed)',
      boxShadow: '0 12px 32px rgba(var(--cms-accent-rgb), 0.2)',
    } : {}),
  };

  const optionStyle = (isActive) => ({
    padding: '12px 18px',
    margin: '2px 0',
    fontSize: 13,
    fontWeight: isActive ? 800 : 600,
    color: isActive ? '#ffffff' : 'var(--cms-text)',
    background: isActive ? 'var(--cms-accent)' : 'transparent',
    borderRadius: 100,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: isActive ? '0 4px 12px rgba(var(--cms-accent-rgb), 0.3)' : 'none',
  });

  const dropdownMenu = (
    <div ref={dropdownRef} className="glass-dropdown-portal" style={dropdownStyle}>
      {options.map((opt) => {
        const key = opt.key || opt.value;
        const isActive = key === value;
        return (
          <div
            key={key}
            onClick={() => {
              onChange({ target: { value: key } });
              setIsOpen(false);
            }}
            style={optionStyle(isActive)}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'var(--cms-switcher-bg)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {opt.desc && (
                <div title={opt.desc} style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                  <Info size={14} />
                </div>
              )}
              {onDeleteOption && opt.canDelete !== false && key !== 'Umum' && key !== '__NEW__' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteOption(key, opt);
                  }}
                  title="Hapus Kategori"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: 'none',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(239, 68, 68, 0.12)',
                    color: isActive ? '#ffffff' : '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    marginLeft: 4
                  }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {onAddOption && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 6px 4px',
            marginTop: 4,
            borderTop: '1px solid var(--glass-border)'
          }}
        >
          <input 
            type="text"
            placeholder={addPlaceholder}
            value={newOptionInput}
            onChange={e => setNewOptionInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newOptionInput.trim()) {
                e.preventDefault();
                e.stopPropagation();
                onAddOption(newOptionInput.trim());
                setNewOptionInput('');
              }
            }}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 100,
              border: '1px solid var(--glass-border)',
              background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
              color: 'var(--cms-text)',
              padding: '0 12px',
              fontSize: 12,
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (newOptionInput.trim()) {
                onAddOption(newOptionInput.trim());
                setNewOptionInput('');
              }
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--cms-accent, #7c3aed)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title="Tambah"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={triggerStyle}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          style={{
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.6,
            flexShrink: 0,
            marginLeft: 8,
            color: isOpen ? 'var(--cms-accent, #7c3aed)' : 'currentColor',
          }}
        />
      </button>

      {createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default GlassSelect;
