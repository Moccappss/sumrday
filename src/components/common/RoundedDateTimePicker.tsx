import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface RoundedDateTimePickerProps {
  value: string; // e.g. "2026-09-20T23:59" or ISO string
  onChange: (val: string) => void;
  accentColor?: string;
  placeholder?: string;
  style?: React.CSSProperties;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const RoundedDateTimePicker: React.FC<RoundedDateTimePickerProps> = ({
  value,
  onChange,
  accentColor = '#ef4444',
  placeholder = 'Pilih Batas Waktu Promo...',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse Initial Date
  const parseValue = (valStr: string) => {
    if (!valStr) {
      const now = new Date();
      now.setDate(now.getDate() + 3);
      now.setHours(23, 59, 0, 0);
      return now;
    }
    const d = new Date(valStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseValue(value);
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());
  const [selectedHour, setSelectedHour] = useState(String(initialDate.getHours()).padStart(2, '0'));
  const [selectedMinute, setSelectedMinute] = useState(String(initialDate.getMinutes()).padStart(2, '0'));

  // Sync state if value changes externally
  useEffect(() => {
    if (value) {
      const d = parseValue(value);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
      setSelectedHour(String(d.getHours()).padStart(2, '0'));
      setSelectedMinute(String(d.getMinutes()).padStart(2, '0'));
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  // Commit selected date-time
  const commitDateTime = (y = selectedYear, m = selectedMonth, d = selectedDay, h = selectedHour, min = selectedMinute) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const hh = String(h).padStart(2, '0');
    const mi = String(min).padStart(2, '0');
    const result = `${y}-${mm}-${dd}T${hh}:${mi}`;
    onChange(result);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    commitDateTime(selectedYear, selectedMonth, day, selectedHour, selectedMinute);
  };

  const applyQuickPreset = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(23, 59, 0, 0);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setSelectedHour('23');
    setSelectedMinute('59');
    commitDateTime(d.getFullYear(), d.getMonth(), d.getDate(), '23', '59');
    setIsOpen(false);
  };

  // Formatted display text
  const displayString = value ? (() => {
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return placeholder;
      const day = d.getDate();
      const month = MONTHS[d.getMonth()]?.slice(0, 3);
      const year = d.getFullYear();
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hour}:${min} WIB`;
    } catch {
      return placeholder;
    }
  })() : placeholder;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: 38,
          padding: '0 14px',
          borderRadius: 100,
          border: `1.5px solid ${isOpen ? accentColor : 'var(--glass-border)'}`,
          background: 'var(--cms-switcher-bg)',
          color: value ? 'var(--cms-text)' : 'var(--cms-text-muted)',
          fontSize: 12,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? `0 0 12px ${accentColor}33` : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: `${accentColor}22`,
            color: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Calendar size={13} />
          </div>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayString}
          </span>
        </div>
        <Clock size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
      </div>

      {/* Rounded Popover Calendar */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 99999,
          width: 310,
          padding: 16,
          borderRadius: 24,
          background: 'var(--cms-card-bg, #181824)',
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxSizing: 'border-box',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Month & Year Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--cms-text)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)' }}>
              {MONTHS[selectedMonth]} {selectedYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--cms-text)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {[
              { label: '+1 Hari', days: 1 },
              { label: '+3 Hari', days: 3 },
              { label: '+7 Hari', days: 7 },
              { label: '+30 Hari', days: 30 }
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyQuickPreset(p.days)}
                style={{
                  padding: '4px 0',
                  borderRadius: 100,
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--cms-text-muted)',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: 2 }}>
            {DAYS.map(d => (
              <span key={d} style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)' }}>
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Actual day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = dayNum === selectedDay;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  style={{
                    height: 30,
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '1px solid transparent',
                    background: isSelected ? accentColor : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--cms-text)',
                    fontSize: 11.5,
                    fontWeight: isSelected ? 900 : 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 2px 10px ${accentColor}66` : 'none'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Time Picker Row */}
          <div style={{
            padding: '8px 12px',
            borderRadius: 16,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)' }}>
              <Clock size={12} color={accentColor} /> Jam : Menit
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <select
                value={selectedHour}
                onChange={e => {
                  setSelectedHour(e.target.value);
                  commitDateTime(selectedYear, selectedMonth, selectedDay, e.target.value, selectedMinute);
                }}
                style={{
                  height: 28,
                  padding: '0 6px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-switcher-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = String(i).padStart(2, '0');
                  return <option key={h} value={h}>{h}</option>;
                })}
              </select>
              <span style={{ fontWeight: 900, color: 'var(--cms-text-muted)' }}>:</span>
              <select
                value={selectedMinute}
                onChange={e => {
                  setSelectedMinute(e.target.value);
                  commitDateTime(selectedYear, selectedMonth, selectedDay, selectedHour, e.target.value);
                }}
                style={{
                  height: 28,
                  padding: '0 6px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-switcher-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: 60 }).map((_, i) => {
                  const m = String(i).padStart(2, '0');
                  return <option key={m} value={m}>{m}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => {
              commitDateTime();
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              height: 34,
              borderRadius: 100,
              border: 'none',
              background: `linear-gradient(135deg, ${accentColor}, #d97706)`,
              color: '#ffffff',
              fontSize: 11.5,
              fontWeight: 850,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Check size={13} /> Terapkan Waktu Promo
          </button>
        </div>
      )}
    </div>
  );
};

export default RoundedDateTimePicker;
