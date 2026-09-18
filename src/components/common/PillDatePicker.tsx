import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface PillDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  quickYears?: number[];
  accentColor?: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const PillDatePicker: React.FC<PillDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Pilih Tanggal',
  className = '',
  style = {},
  quickYears = [2026, 2025, 2024, 2023, 2022],
  accentColor = '#10b981'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const [viewYear, setViewYear] = useState(validDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validDate.getMonth()); // 0-11

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    haptic.selection();
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const newDateStr = `${viewYear}-${mm}-${dd}`;
    onChange(newDateStr);
    setIsOpen(false);
  };

  const handleQuickToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.success();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleQuickYear = (yr: number, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    setViewYear(yr);
    // Keep current selected month/day or set to mid-year
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    const month = !isNaN(d.getTime()) ? d.getMonth() : 5;
    const day = !isNaN(d.getTime()) ? d.getDate() : 15;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${yr}-${mm}-${dd}`);
  };

  // Format display label
  const formattedDisplay = (() => {
    if (!value) return placeholder;
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return value;
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  })();

  const todayObj = new Date();
  const isCurrentToday = (day: number) => {
    return (
      todayObj.getDate() === day &&
      todayObj.getMonth() === viewMonth &&
      todayObj.getFullYear() === viewYear
    );
  };

  const isSelectedDay = (day: number) => {
    if (!value) return false;
    const d = new Date(value + 'T00:00:00');
    return (
      !isNaN(d.getTime()) &&
      d.getDate() === day &&
      d.getMonth() === viewMonth &&
      d.getFullYear() === viewYear
    );
  };

  // Generate calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* ── PILL TRIGGER BUTTON ── */}
      <button
        type="button"
        onClick={() => {
          haptic.light();
          setIsOpen(prev => !prev);
        }}
        className={`cms-pill cms-pill-btn ${className}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 9999,
          border: isOpen ? `1.5px solid ${accentColor}` : '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
          background: 'var(--cms-input-bg, var(--cms-card-bg, #ffffff))',
          color: value ? 'var(--cms-text, #0f172a)' : 'var(--cms-text-muted, #94a3b8)',
          fontSize: 12.5,
          fontWeight: 750,
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: isOpen ? `0 0 0 3px ${accentColor}25` : '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        title="Pilih Tanggal Kalender"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Calendar size={14} color={accentColor} strokeWidth={2.4} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formattedDisplay}
          </span>
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: 9999,
          background: 'rgba(0,0,0,0.05)',
          color: 'var(--cms-text-muted, #64748b)',
          flexShrink: 0
        }}>
          {viewYear}
        </span>
      </button>

      {/* ── PILL ROUNDED POPUP CALENDAR ── */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: 300,
          maxWidth: '92vw',
          zIndex: 99999,
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1.5px solid var(--glass-border, rgba(255,255,255,0.18))',
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08)',
          padding: '16px 14px',
          boxSizing: 'border-box',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          animation: 'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Calendar Header: Month/Year & Navigation Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12
          }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="cms-circle-btn"
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
                background: 'var(--cms-switcher-bg, rgba(0,0,0,0.04))',
                color: 'var(--cms-text, #1e293b)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Bulan Sebelumnya"
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 850, color: 'var(--cms-text, #0f172a)' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="cms-circle-btn"
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
                background: 'var(--cms-switcher-bg, rgba(0,0,0,0.04))',
                color: 'var(--cms-text, #1e293b)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Bulan Berikutnya"
            >
              <ChevronRight size={16} strokeWidth={2.4} />
            </button>
          </div>

          {/* 7 Days Header (Min s/d Sab) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 3,
            textAlign: 'center',
            marginBottom: 6
          }}>
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: i === 0 ? '#f43f5e' : 'var(--cms-text-muted, #94a3b8)',
                  padding: '2px 0'
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid — Guaranteed 100% Round Pill Cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 4,
            marginBottom: 12
          }}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} style={{ width: '100%', height: 32 }} />;
              }

              const isSelected = isSelectedDay(day);
              const isToday = isCurrentToday(day);
              const isSunday = idx % 7 === 0;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  style={{
                    width: 32,
                    height: 32,
                    margin: '0 auto',
                    borderRadius: '50%',
                    border: isSelected 
                      ? 'none' 
                      : isToday 
                        ? `1.5px solid ${accentColor}` 
                        : 'none',
                    background: isSelected 
                      ? accentColor 
                      : isToday 
                        ? `${accentColor}18` 
                        : 'transparent',
                    color: isSelected 
                      ? '#ffffff' 
                      : isSunday 
                        ? '#f43f5e' 
                        : isToday 
                          ? accentColor 
                          : 'var(--cms-text, #1e293b)',
                    fontSize: 12,
                    fontWeight: isSelected || isToday ? 850 : 650,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 3px 10px ${accentColor}40` : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isToday ? `${accentColor}18` : 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  title={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Pill Presets (Hari Ini & Quick Years) */}
          <div style={{
            paddingTop: 10,
            borderTop: '1px solid var(--cms-border, rgba(0,0,0,0.06))',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={handleQuickToday}
              className="cms-pill cms-pill-btn"
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 9999,
                background: `${accentColor}15`,
                color: accentColor,
                border: `1px solid ${accentColor}30`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RotateCcw size={10} />
              <span>Hari Ini</span>
            </button>

            {quickYears.map(yr => (
              <button
                key={yr}
                type="button"
                onClick={e => handleQuickYear(yr, e)}
                className="cms-pill cms-pill-btn"
                style={{
                  fontSize: 10.5,
                  fontWeight: 750,
                  padding: '4px 8px',
                  borderRadius: 9999,
                  background: viewYear === yr ? accentColor : 'var(--cms-switcher-bg, rgba(0,0,0,0.04))',
                  color: viewYear === yr ? '#ffffff' : 'var(--cms-text-muted, #64748b)',
                  border: '1px solid var(--cms-border, rgba(0,0,0,0.06))',
                  cursor: 'pointer'
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PillDatePicker;
