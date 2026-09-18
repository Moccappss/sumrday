import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Sparkles, Plus, Clock, Target, Users, Share2, 
  RotateCw, AlertCircle, LayoutGrid, ListFilter, 
  Search, Trash2, Eye, Edit3, Settings2, CheckCircle2,
  CalendarCheck2, FolderKanban, Check, Layers, ChevronDown
} from 'lucide-react';
import { getHolidaysForMonth, HolidayItem, syncOnlineHolidays, autoSyncHolidaysIfNeeded } from '../../utils/holidaysIndonesia';
import { ContentPlanItem } from './ContentPlanModal';

interface CalendarGridViewProps {
  projects: any[];
  bookings: any[];
  contentPlans: ContentPlanItem[];
  onSelectProject: (proj: any) => void;
  onOpenContentPlan: (content?: ContentPlanItem | null, initialDate?: string, holidayPrompt?: string) => void;
  onOpenNewBooking: (initialDate?: string) => void;
  onAddProject?: (parentId?: string | null, isManual?: boolean, initialData?: any) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onOpenBookingSettings?: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  subView?: 'grid' | 'timeline' | 'feed';
  onSwitchSubView?: (mode: 'grid' | 'timeline') => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAY_NAMES_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function renderPlatformIcon(platform?: string) {
  const s = { width: 9, height: 9, display: 'inline-block', borderRadius: 2.5, flexShrink: 0 as const };
  if (!platform) return <Share2 size={9} />;
  switch (platform.toLowerCase()) {
    case 'instagram': return <div style={{ ...s, background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }} />;
    case 'youtube': return <div style={{ ...s, background: '#ff0000', borderRadius: '50%' }} />;
    case 'tiktok': return <div style={{ ...s, background: '#000' }} />;
    case 'twitter': case 'x': return <div style={{ ...s, background: '#1d9bf0' }} />;
    case 'linkedin': return <div style={{ ...s, background: '#0a66c2' }} />;
    case 'facebook': return <div style={{ ...s, background: '#1877f2' }} />;
    default: return <Share2 size={9} />;
  }
}

export const CalendarGridView: React.FC<CalendarGridViewProps> = ({
  projects = [],
  bookings = [],
  contentPlans = [],
  onSelectProject,
  onOpenContentPlan,
  onOpenNewBooking,
  onAddProject,
  onDeleteBooking,
  onOpenBookingSettings,
  notify,
  subView = 'grid',
  onSwitchSubView
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'all' | 'projects' | 'content' | 'bookings' | 'holidays'>('all');
  const [liveClock, setLiveClock] = useState<string>('');
  const [isSyncingHolidays, setIsSyncingHolidays] = useState(false);
  const [holidaySyncTick, setHolidaySyncTick] = useState(0);
  const [quickAddTarget, setQuickAddTarget] = useState<{ dateStr: string; holidayPrompt?: string } | null>(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any | null>(null);
  const [selectedDayAgenda, setSelectedDayAgenda] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubView, setActiveSubView] = useState<'grid' | 'timeline'>(subView === 'timeline' ? 'timeline' : 'grid');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isMobileFilterMenuOpen, setIsMobileFilterMenuOpen] = useState(false);
  const mobileFilterMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (mobileFilterMenuRef.current && !mobileFilterMenuRef.current.contains(e.target as Node)) {
        setIsMobileFilterMenuOpen(false);
      }
    };
    if (isMobileFilterMenuOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isMobileFilterMenuOpen]);

  useEffect(() => {
    setActiveSubView(subView === 'timeline' ? 'timeline' : 'grid');
  }, [subView]);

  const handleSetSubView = (mode: 'grid' | 'timeline') => {
    setActiveSubView(mode);
    onSwitchSubView?.(mode);
  };

  useEffect(() => {
    const updateTime = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const now = new Date();
      setLiveClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleUpdated = () => setHolidaySyncTick(prev => prev + 1);
    window.addEventListener('porto_holidays_updated', handleUpdated);
    return () => window.removeEventListener('porto_holidays_updated', handleUpdated);
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => { 
    autoSyncHolidaysIfNeeded(currentYear); 
  }, [currentYear]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const handleSyncOnlineHolidays = async () => {
    if (isSyncingHolidays) return;
    setIsSyncingHolidays(true);
    notify?.('Menghubungkan ke server hari libur nasional...', 'info');
    try {
      const res = await syncOnlineHolidays(currentYear);
      if (res.success) {
        setHolidaySyncTick(prev => prev + 1);
        notify?.(`✅ ${res.count} hari libur ${currentYear} berhasil disinkronkan`, 'success');
      } else {
        notify?.('Gagal sinkronisasi online, menggunakan data lokal', 'warning');
      }
    } catch {
      notify?.('Tidak dapat terhubung ke server hari libur', 'error');
    } finally {
      setIsSyncingHolidays(false);
    }
  };

  const handlePrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const handleTodayReset = () => setCurrentDate(new Date());

  const holidayMap = useMemo(() => {
    const map: Record<string, HolidayItem[]> = {};
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

    const holidays = [
      ...getHolidaysForMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth()),
      ...getHolidaysForMonth(currentYear, currentMonth),
      ...getHolidaysForMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth()),
    ];

    holidays.forEach(h => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    });
    return map;
  }, [currentYear, currentMonth, holidaySyncTick]);

  const calendarCells = useMemo(() => {
    const cells: any[] = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    let startDow = firstDay.getDay(); // 0=Sun
    // Mon=0..Sun=6
    startDow = startDow === 0 ? 6 : startDow - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevDays = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = 0; i < startDow; i++) {
      const day = prevDays - startDow + i + 1;
      const d = new Date(currentYear, currentMonth - 1, day);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hList = holidayMap[dateStr] || [];
      cells.push({ dayNumber: day, isCurrentMonth: false, isToday: dateStr === todayStr, isSunday: d.getDay() === 0, holidays: hList, projects: [], contentList: [], bookingList: [], dateStr });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hList = holidayMap[dateStr] || [];
      const dayProjects = (projects || []).filter(p => p && !p.isDeleted && !p.isTrash && p.deadline && p.deadline.startsWith(dateStr.substring(0, 10)));
      const dayContent = (contentPlans || []).filter(c => c && c.scheduledDate && c.scheduledDate.startsWith(dateStr.substring(0, 10)));
      const dayBookings = (bookings || []).filter(b => b && b.date && b.date.startsWith(dateStr.substring(0, 10)));
      cells.push({ dayNumber: day, isCurrentMonth: true, isToday: dateStr === todayStr, isSunday: d.getDay() === 0, holidays: hList, projects: dayProjects, contentList: dayContent, bookingList: dayBookings, dateStr });
    }

    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hList = holidayMap[dateStr] || [];
      cells.push({ dayNumber: i, isCurrentMonth: false, isToday: dateStr === todayStr, isSunday: d.getDay() === 0, holidays: hList, projects: [], contentList: [], bookingList: [], dateStr });
    }
    return cells;
  }, [currentYear, currentMonth, holidayMap, projects, contentPlans, bookings, holidaySyncTick, todayStr]);

  const stats = useMemo(() => {
    const totalProjects = (projects || []).filter(p => p && !p.isDeleted && !p.isTrash && p.type !== 'content').length;
    const totalContent = (contentPlans || []).length;
    const totalBookings = (bookings || []).length;
    return { totalAgenda: totalProjects + totalContent + totalBookings, totalProjects, totalContent, totalBookings };
  }, [projects, contentPlans, bookings]);

  // Timeline list items sorted chronologically
  const timelineItems = useMemo(() => {
    const items: any[] = [];
    const query = searchQuery.trim().toLowerCase();

    // 1. Projects
    if (filterType === 'all' || filterType === 'projects') {
      (projects || []).filter(p => p && !p.isDeleted && !p.isTrash && p.deadline).forEach(p => {
        const matches = !query || (p.title || '').toLowerCase().includes(query) || (p.category || '').toLowerCase().includes(query);
        if (matches) {
          items.push({
            type: 'project',
            id: p.id,
            title: p.title || 'Untitled Proyek',
            subtitle: p.category || 'Proyek Regular',
            date: p.deadline,
            time: '23:59',
            status: p.status || 'todo',
            priority: p.priority || 'medium',
            progress: p.progress || 0,
            icon: p.icon,
            data: p
          });
        }
      });
    }

    // 2. Content Plans
    if (filterType === 'all' || filterType === 'content') {
      (contentPlans || []).forEach(c => {
        const matches = !query || (c.title || '').toLowerCase().includes(query) || (c.platform || '').toLowerCase().includes(query);
        if (matches) {
          items.push({
            type: 'content',
            id: c.id,
            title: c.title || 'Rencana Konten',
            subtitle: `${(c.platform || 'Instagram').toUpperCase()} • ${c.format || 'Reels'}`,
            date: c.scheduledDate || todayStr,
            time: c.scheduledTime || '19:00',
            status: c.status || 'todo',
            platform: c.platform,
            data: c
          });
        }
      });
    }

    // 3. Bookings
    if (filterType === 'all' || filterType === 'bookings') {
      (bookings || []).forEach(b => {
        const matches = !query || (b.clientName || '').toLowerCase().includes(query) || (b.serviceName || '').toLowerCase().includes(query);
        if (matches) {
          items.push({
            type: 'booking',
            id: b.id,
            title: b.clientName || 'Janji Temu Klien',
            subtitle: b.serviceName || 'Konsultasi Layanan',
            date: b.date || todayStr,
            time: b.time || '10:00',
            status: b.status || 'confirmed',
            phone: b.clientPhone,
            email: b.clientEmail,
            notes: b.notes,
            data: b
          });
        }
      });
    }

    // 4. Holidays
    if (filterType === 'all' || filterType === 'holidays') {
      const holidays = getHolidaysForMonth(currentYear, currentMonth);
      holidays.forEach((h, idx) => {
        const matches = !query || h.name.toLowerCase().includes(query);
        if (matches) {
          items.push({
            type: 'holiday',
            id: `hol_${h.date}_${idx}`,
            title: h.name,
            subtitle: h.isRedDate ? 'Hari Libur Nasional (Tanggal Merah)' : 'Hari Peringatan',
            date: h.date,
            time: '00:00',
            status: h.isRedDate ? 'Libur Nasional' : 'Peringatan',
            isRedDate: h.isRedDate,
            data: h
          });
        }
      });
    }

    // Sort ascending
    items.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime() || 0;
      const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime() || 0;
      return timeA - timeB;
    });

    return items;
  }, [projects, contentPlans, bookings, filterType, searchQuery, currentYear, currentMonth, holidaySyncTick, todayStr]);

  // Pure icon-only filter definitions
  const ICON_FILTERS = [
    { id: 'all', label: 'Semua Agenda', icon: <Layers size={15} /> },
    { id: 'projects', label: 'Proyek Regular', icon: <Target size={15} color="#f59e0b" /> },
    { id: 'content', label: 'Rencana Konten', icon: <Sparkles size={15} color="#ec4899" /> },
    { id: 'bookings', label: 'Janji Temu Klien', icon: <Users size={15} color="#3b82f6" /> },
    { id: 'holidays', label: 'Hari Libur Nasional', icon: <AlertCircle size={15} color="#ef4444" /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12, width: '100%', paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 32px))', boxSizing: 'border-box' }}>
      
      {/* ── 1. CALENDAR TOOLBAR: 1-ROW COMPACT ON MOBILE (< 768px) & BALANCED ON DESKTOP ── */}
      {isMobile ? (
        <div style={{
          padding: '6px 10px',
          borderRadius: 18,
          background: 'var(--cms-card-bg)',
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          width: '100%',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          {/* Left: Super Compact Month Navigator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--cms-input-bg)',
            padding: '2px 4px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)'
          }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: 28, height: 28, minWidth: 28, minHeight: 28,
                borderRadius: 8, border: 'none',
                background: 'transparent', color: 'var(--cms-text)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0
              }}
              title="Bulan Lalu"
            >
              <ChevronLeft size={16} />
            </button>

            <div
              onClick={handleTodayReset}
              title="Klik untuk ke Hari Ini"
              style={{ padding: '0 6px', textAlign: 'center', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap' }}>
                {MONTH_NAMES[currentMonth].slice(0, 3)} {currentYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: 28, height: 28, minWidth: 28, minHeight: 28,
                borderRadius: 8, border: 'none',
                background: 'transparent', color: 'var(--cms-text)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0
              }}
              title="Bulan Depan"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Right: Grouped Quick Controls (Today, Grouped Filter Dropdown, View Toggle) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {/* Today Button */}
            <button
              type="button"
              onClick={handleTodayReset}
              style={{
                width: 32, height: 32, minWidth: 32, minHeight: 32,
                borderRadius: '50%',
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-accent)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title="Kembali ke Hari Ini"
            >
              <CalendarCheck2 size={15} />
            </button>

            {/* Grouped Filter Dropdown */}
            <div ref={mobileFilterMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsMobileFilterMenuOpen(!isMobileFilterMenuOpen)}
                style={{
                  height: 32,
                  padding: '0 9px',
                  borderRadius: 100,
                  border: filterType !== 'all' ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                  background: filterType !== 'all' ? 'rgba(var(--cms-accent-rgb), 0.15)' : 'var(--cms-input-bg)',
                  color: filterType !== 'all' ? 'var(--cms-accent)' : 'var(--cms-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 850,
                  cursor: 'pointer',
                  boxShadow: filterType !== 'all' ? '0 2px 10px rgba(var(--cms-accent-rgb), 0.25)' : 'none'
                }}
                title="Filter & Opsi Kalender"
              >
                <ListFilter size={13} />
                <span>
                  {filterType === 'all' ? 'Semua' : filterType === 'projects' ? 'Proyek' : filterType === 'content' ? 'Konten' : filterType === 'bookings' ? 'Booking' : 'Libur'}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 900,
                  background: 'var(--cms-card-bg)',
                  color: filterType !== 'all' ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                  padding: '1px 4.5px',
                  borderRadius: 6,
                  border: '1px solid var(--glass-border)',
                  lineHeight: 1.1
                }}>
                  {filterType === 'all' ? stats.totalAgenda : filterType === 'projects' ? stats.totalProjects : filterType === 'content' ? stats.totalContent : filterType === 'bookings' ? stats.totalBookings : (holidayMap[todayStr]?.length || 0)}
                </span>
                <ChevronDown size={11} style={{ transform: isMobileFilterMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {/* Mobile Filter Popup Card */}
              {isMobileFilterMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'var(--cms-card-bg)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 18,
                  padding: 8,
                  minWidth: 230,
                  zIndex: 100,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                  animation: 'cmsFadeIn 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3
                }}>
                  {/* Header with live clock */}
                  <div style={{ padding: '4px 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', marginBottom: 2 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 900, color: 'var(--cms-text-muted)', letterSpacing: '0.04em' }}>KATEGORI AGENDA</span>
                    {liveClock && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-accent)' }}>{liveClock}</span>
                    )}
                  </div>

                  {/* Category list items */}
                  {[
                    { id: 'all', label: 'Semua Agenda', count: stats.totalAgenda, icon: <Layers size={14} />, color: 'var(--cms-accent)' },
                    { id: 'projects', label: 'Proyek Regular', count: stats.totalProjects, icon: <Target size={14} color="#f59e0b" />, color: '#f59e0b' },
                    { id: 'content', label: 'Rencana Konten', count: stats.totalContent, icon: <Sparkles size={14} color="#ec4899" />, color: '#ec4899' },
                    { id: 'bookings', label: 'Janji Temu Klien', count: stats.totalBookings, icon: <Users size={14} color="#3b82f6" />, color: '#3b82f6' },
                    { id: 'holidays', label: 'Hari Libur Nasional', count: Object.values(holidayMap).flat().length, icon: <AlertCircle size={14} color="#ef4444" />, color: '#ef4444' }
                  ].map(cat => {
                    const isSelected = filterType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFilterType(cat.id as any);
                          setIsMobileFilterMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 9px',
                          borderRadius: 10,
                          border: 'none',
                          background: isSelected ? 'rgba(var(--cms-accent-rgb), 0.12)' : 'transparent',
                          color: isSelected ? 'var(--cms-accent)' : 'var(--cms-text)',
                          fontSize: 12,
                          fontWeight: isSelected ? 850 : 650,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          {cat.icon}
                          <span>{cat.label}</span>
                        </div>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 900,
                          padding: '1px 6px',
                          borderRadius: 6,
                          background: isSelected ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                          color: isSelected ? '#fff' : 'var(--cms-text-muted)'
                        }}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}

                  {/* Extra Utility Tools */}
                  <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: 4, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      type="button"
                      onClick={() => {
                        handleSyncOnlineHolidays();
                        setIsMobileFilterMenuOpen(false);
                      }}
                      disabled={isSyncingHolidays}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--cms-text-muted)',
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCw size={13} style={{ animation: isSyncingHolidays ? 'spin 1s linear infinite' : 'none' }} />
                      <span>Sinkron Libur Online</span>
                    </button>

                    {onOpenBookingSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBookingSettings();
                          setIsMobileFilterMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--cms-text-muted)',
                          fontSize: 11,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >
                        <Settings2 size={13} />
                        <span>Pengaturan Slot Booking</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle Button */}
            <button
              type="button"
              onClick={() => handleSetSubView(activeSubView === 'grid' ? 'timeline' : 'grid')}
              style={{
                width: 32, height: 32, minWidth: 32, minHeight: 32,
                borderRadius: '50%',
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title={activeSubView === 'grid' ? "Ganti ke Tampilan Daftar" : "Ganti ke Tampilan Kalender Grid"}
            >
              {activeSubView === 'grid' ? <LayoutGrid size={15} /> : <ListFilter size={15} />}
            </button>
          </div>
        </div>
      ) : (
        /* ── DESKTOP TOOLBAR (BALANCED & SPACIOUS) ── */
        <div style={{
          padding: '12px 16px',
          borderRadius: 22,
          background: 'var(--cms-card-bg)',
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          boxSizing: 'border-box',
          width: '100%'
        }}>
          {/* Row 1 / Left Side: Month Navigator & Quick Action Icons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            flex: '1 1 auto',
            minWidth: 260
          }}>
            {/* Month Prev/Next Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--cms-input-bg)',
              padding: '3px 4px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)'
            }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  width: 32, height: 32, minWidth: 32, minHeight: 32,
                  aspectRatio: '1 / 1', flexShrink: 0,
                  borderRadius: 9, border: 'none',
                  background: 'transparent', color: 'var(--cms-text)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', padding: 0
                }}
                title="Bulan Sebelumnya"
              >
                <ChevronLeft size={17} />
              </button>

              <div style={{ padding: '0 8px', textAlign: 'center', minWidth: 108, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 950, color: 'var(--cms-text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  width: 32, height: 32, minWidth: 32, minHeight: 32,
                  aspectRatio: '1 / 1', flexShrink: 0,
                  borderRadius: 9, border: 'none',
                  background: 'transparent', color: 'var(--cms-text)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', padding: 0
                }}
                title="Bulan Berikutnya"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Today Button */}
            <button
              type="button"
              onClick={handleTodayReset}
              style={{
                width: 36, height: 36, minWidth: 36, minHeight: 36,
                aspectRatio: '1 / 1', flexShrink: 0,
                borderRadius: 12,
                border: '1.5px solid var(--glass-border)',
                background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease', padding: 0
              }}
              title="Kembali ke Hari Ini"
            >
              <CalendarCheck2 size={16} color="var(--cms-accent)" />
            </button>

            {/* Holiday Sync */}
            <button
              type="button"
              onClick={handleSyncOnlineHolidays}
              disabled={isSyncingHolidays}
              title="Sinkronisasi Hari Libur Online"
              style={{
                width: 36, height: 36, minWidth: 36, minHeight: 36,
                aspectRatio: '1 / 1', flexShrink: 0,
                borderRadius: 12,
                border: '1.5px solid var(--glass-border)',
                background: 'rgba(var(--cms-accent-rgb), 0.08)',
                color: 'var(--cms-accent)',
                cursor: isSyncingHolidays ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease', padding: 0
              }}
            >
              <RotateCw size={15} style={{ animation: isSyncingHolidays ? 'spin 1s linear infinite' : 'none' }} />
            </button>

            {/* Settings / Service Config Button */}
            {onOpenBookingSettings && (
              <button
                type="button"
                onClick={onOpenBookingSettings}
                style={{
                  width: 36, height: 36, minWidth: 36, minHeight: 36,
                  aspectRatio: '1 / 1', flexShrink: 0,
                  borderRadius: 12,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', padding: 0
                }}
                title="Pengaturan Layanan & Slot Booking"
              >
                <Settings2 size={16} />
              </button>
            )}

            {/* Live Clock Badge */}
            {liveClock && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11.5, color: 'var(--cms-text-muted)', fontWeight: 800,
                padding: '6px 10px', borderRadius: 10, background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)', flexShrink: 0
              }}>
                <Clock size={13} color="var(--cms-accent)" />
                <span>{liveClock}</span>
              </div>
            )}
          </div>

          {/* Row 2 / Right Side: Stat Pills, Icon-Only Filters & Subview Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            flex: '1 1 auto',
            minWidth: 260,
            justifyContent: 'flex-end'
          }}>
            {/* Stat Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {[
                { count: stats.totalAgenda, color: 'var(--cms-accent)', bg: 'rgba(var(--cms-accent-rgb), 0.14)', icon: <CalendarIcon size={13} />, title: 'Total Agenda' },
                { count: stats.totalProjects, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)', icon: <Target size={13} />, title: 'Deadline Proyek' },
                { count: stats.totalContent, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.14)', icon: <Sparkles size={13} />, title: 'Konten Terjadwal' },
                { count: stats.totalBookings, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)', icon: <Users size={13} />, title: 'Janji Temu Klien' }
              ].map((st, i) => (
                <div
                  key={i}
                  title={`${st.title}: ${st.count}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 9999,
                    background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: 22, height: 22, minWidth: 22, minHeight: 22,
                    aspectRatio: '1 / 1', flexShrink: 0,
                    borderRadius: '50%', background: st.bg, color: st.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {st.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 950, color: st.color, lineHeight: 1 }}>
                    {st.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Filter Pills */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--cms-input-bg)', padding: '3px 5px',
              borderRadius: 9999, border: '1px solid var(--glass-border)',
              flexShrink: 0
            }}>
              {ICON_FILTERS.map(flt => {
                const isActive = filterType === flt.id;
                return (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setFilterType(flt.id as any)}
                    style={{
                      width: 32,
                      height: 32,
                      minWidth: 32,
                      minHeight: 32,
                      aspectRatio: '1 / 1',
                      flexShrink: 0,
                      borderRadius: '50%',
                      border: 'none',
                      background: isActive ? 'var(--cms-accent)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--cms-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 0.18s ease',
                      boxShadow: isActive ? '0 2px 10px rgba(var(--cms-accent-rgb), 0.4)' : 'none'
                    }}
                    title={flt.label}
                  >
                    {flt.icon}
                  </button>
                );
              })}
            </div>

            {/* Sub-view Switcher */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--cms-input-bg)', padding: '3px 5px',
              borderRadius: 9999, border: '1px solid var(--glass-border)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => handleSetSubView('grid')}
                title="Tampilan Kalender Grid"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  aspectRatio: '1 / 1',
                  flexShrink: 0,
                  borderRadius: '50%',
                  border: 'none',
                  background: activeSubView === 'grid' ? 'var(--cms-accent)' : 'transparent',
                  color: activeSubView === 'grid' ? '#fff' : 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.18s ease',
                  boxShadow: activeSubView === 'grid' ? '0 2px 10px rgba(var(--cms-accent-rgb), 0.4)' : 'none'
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleSetSubView('timeline')}
                title="Tampilan Daftar / Agenda Timeline"
                style={{
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  minHeight: 32,
                  aspectRatio: '1 / 1',
                  flexShrink: 0,
                  borderRadius: '50%',
                  border: 'none',
                  background: activeSubView === 'timeline' ? 'var(--cms-accent)' : 'transparent',
                  color: activeSubView === 'timeline' ? '#fff' : 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.18s ease',
                  boxShadow: activeSubView === 'timeline' ? '0 2px 10px rgba(var(--cms-accent-rgb), 0.4)' : 'none'
                }}
              >
                <ListFilter size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2A. MODE GRID (7-COLUMN RESPONSIVE CALENDAR WITH LARGER NUMBERS & ICONS) ── */}
      {activeSubView === 'grid' && (
        <div style={{
          background: 'var(--cms-card-bg)',
          borderRadius: 22,
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Day Names 7-Column Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            borderBottom: '1.5px solid var(--glass-border)',
            background: 'rgba(var(--cms-accent-rgb), 0.04)',
            width: '100%'
          }}>
            {DAY_NAMES_SHORT.map((name, i) => (
              <div
                key={name}
                style={{
                  padding: '9px 2px',
                  textAlign: 'center',
                  fontSize: 11.5,
                  fontWeight: 950,
                  color: i === 6 ? '#ef4444' : 'var(--cms-text)',
                  borderRight: i < 6 ? '1px solid var(--glass-border)' : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells Grid (Equal Symmetrical 7 Columns) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            width: '100%'
          }}>
            {calendarCells.map((cell, idx) => {
              const hasRedDate = cell.isSunday || cell.holidays.some((h: any) => h.isRedDate);
              const holidayPrompt = cell.holidays[0]?.contentIdeaPrompt;
              const visibleProjects = filterType === 'all' || filterType === 'projects' ? cell.projects : [];
              const visibleContent = filterType === 'all' || filterType === 'content' ? cell.contentList : [];
              const visibleBookings = filterType === 'all' || filterType === 'bookings' ? cell.bookingList : [];
              const visibleHolidays = filterType === 'all' || filterType === 'holidays' ? cell.holidays : [];

              return (
                <div
                  key={`${cell.dateStr}_${idx}`}
                  onClick={() => {
                    if (isMobile) {
                      const totalItems = visibleHolidays.length + visibleProjects.length + visibleContent.length + visibleBookings.length;
                      if (totalItems > 0) {
                        setSelectedDayAgenda({
                          dateStr: cell.dateStr,
                          dayNumber: cell.dayNumber,
                          isToday: cell.isToday,
                          hasRedDate,
                          holidays: visibleHolidays,
                          projects: visibleProjects,
                          contentList: visibleContent,
                          bookingList: visibleBookings,
                          holidayPrompt
                        });
                      } else {
                        setQuickAddTarget({ dateStr: cell.dateStr, holidayPrompt });
                      }
                    }
                  }}
                  style={{
                    minHeight: isMobile ? 52 : 96,
                    padding: isMobile ? '4px 2px' : '6px 5px',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--glass-border)' : 'none',
                    borderBottom: '1px solid var(--glass-border)',
                    background: cell.isToday
                      ? 'rgba(var(--cms-accent-rgb), 0.08)'
                      : cell.isCurrentMonth
                      ? (hasRedDate ? 'rgba(239, 68, 68, 0.02)' : 'transparent')
                      : 'rgba(0, 0, 0, 0.04)',
                    opacity: cell.isCurrentMonth ? 1 : 0.45,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 1 : 3,
                    position: 'relative',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    cursor: isMobile ? 'pointer' : 'default'
                  }}
                >
                  {/* Cell Header: Date Number on Left + Plus Quick-Add on Right (Desktop only) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'center' : 'space-between',
                    marginBottom: isMobile ? 1 : 2
                  }}>
                    <span style={{
                      fontSize: cell.isToday ? (isMobile ? 12 : 13) : (isMobile ? 12.5 : 13.5),
                      fontWeight: 950,
                      color: cell.isToday ? '#ffffff' : hasRedDate ? '#ef4444' : 'var(--cms-text)',
                      width: cell.isToday ? (isMobile ? 20 : 22) : 'auto',
                      height: cell.isToday ? (isMobile ? 20 : 22) : 'auto',
                      borderRadius: cell.isToday ? '50%' : 0,
                      background: cell.isToday ? 'var(--cms-accent)' : 'transparent',
                      boxShadow: cell.isToday ? '0 2px 8px rgba(var(--cms-accent-rgb), 0.45)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1
                    }}>
                      {cell.dayNumber}
                    </span>

                    {!isMobile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickAddTarget({ dateStr: cell.dateStr, holidayPrompt });
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: 'none',
                          background: 'rgba(var(--cms-accent-rgb), 0.12)',
                          color: 'var(--cms-accent)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                        title={`Tambah agenda pada ${cell.dateStr}`}
                      >
                        <Plus size={12} strokeWidth={2.8} />
                      </button>
                    )}
                  </div>

                  {/* ── MOBILE MODE: SLEEK COLORED DOT INDICATORS ── */}
                  {isMobile ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      marginTop: 'auto',
                      paddingBottom: 2,
                      minHeight: 8
                    }}>
                      {visibleHolidays.length > 0 && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                      )}
                      {visibleProjects.length > 0 && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cms-accent)', flexShrink: 0 }} />
                      )}
                      {visibleContent.length > 0 && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ec4899', flexShrink: 0 }} />
                      )}
                      {visibleBookings.length > 0 && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Desktop Holiday Badges */}
                      {visibleHolidays.map((h: any, hIdx: number) => (
                        <div
                          key={hIdx}
                          onClick={() => onOpenContentPlan(null, cell.dateStr, h.contentIdeaPrompt || h.name)}
                          style={{
                            padding: '2.5px 4px',
                            borderRadius: 5,
                            background: h.isRedDate ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            border: `1px solid ${h.isRedDate ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                            color: h.isRedDate ? '#ef4444' : '#f59e0b',
                            fontSize: 9.5,
                            fontWeight: 850,
                            lineHeight: 1.2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                          title={`Hari Libur: ${h.name}`}
                        >
                          {h.isRedDate ? <AlertCircle size={9.5} color="#ef4444" style={{ flexShrink: 0 }} /> : <Sparkles size={9.5} color="#f59e0b" style={{ flexShrink: 0 }} />}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
                        </div>
                      ))}

                      {/* Desktop Project Deadline Badges */}
                      {visibleProjects.map((proj: any) => (
                        <div
                          key={proj.id}
                          onClick={() => onSelectProject(proj)}
                          style={{
                            padding: '3px 5px',
                            borderRadius: 5,
                            background: 'rgba(99, 102, 241, 0.14)',
                            border: '1px solid rgba(99, 102, 241, 0.28)',
                            color: 'var(--cms-accent)',
                            fontSize: 10,
                            fontWeight: 850,
                            lineHeight: 1.2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                          title={`Proyek: ${proj.title}`}
                        >
                          <Target size={10} color="var(--cms-accent)" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{proj.title}</span>
                        </div>
                      ))}

                      {/* Desktop Content Plan Badges */}
                      {visibleContent.map((cnt: any) => (
                        <div
                          key={cnt.id}
                          onClick={() => onOpenContentPlan(cnt)}
                          style={{
                            padding: '3px 5px',
                            borderRadius: 5,
                            background: 'rgba(236, 72, 153, 0.14)',
                            border: '1px solid rgba(236, 72, 153, 0.28)',
                            color: '#ec4899',
                            fontSize: 10,
                            fontWeight: 850,
                            lineHeight: 1.2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                          title={`Konten: ${cnt.title}`}
                        >
                          {renderPlatformIcon(cnt.platform)}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{cnt.title}</span>
                        </div>
                      ))}

                      {/* Desktop Booking Badges */}
                      {visibleBookings.map((bk: any) => (
                        <div
                          key={bk.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBookingDetail(bk);
                          }}
                          style={{
                            padding: '3px 5px',
                            borderRadius: 5,
                            background: 'rgba(59, 130, 246, 0.14)',
                            border: '1px solid rgba(59, 130, 246, 0.28)',
                            color: '#3b82f6',
                            fontSize: 10,
                            fontWeight: 850,
                            lineHeight: 1.2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            transition: 'all 0.15s ease'
                          }}
                          title={`Janji Temu: ${bk.clientName} (Klik untuk detail / hapus)`}
                        >
                          <Users size={10} color="#3b82f6" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                            {bk.time ? `${bk.time} ` : ''}{bk.clientName}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2B. MODE DAFTAR / TIMELINE (STABLE & SYMMETRICAL FULL-WIDTH LIST) ── */}
      {activeSubView === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', boxSizing: 'border-box' }}>
          {/* Search Input Bar (Symmetrical with Card) */}
          <div style={{
            position: 'relative',
            width: '100%',
            background: 'var(--cms-card-bg)',
            borderRadius: 16,
            border: '1.5px solid var(--glass-border)',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxSizing: 'border-box'
          }}>
            <Search size={15} color="var(--cms-text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Cari agenda, proyek, konten, atau janji temu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 34,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--cms-text)',
                fontSize: 12.5,
                fontWeight: 650
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none', border: 'none', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Agenda Timeline Items List */}
          {timelineItems.length === 0 ? (
            <div style={{
              background: 'var(--cms-card-bg)',
              borderRadius: 20,
              border: '1.5px solid var(--glass-border)',
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxSizing: 'border-box'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(var(--cms-accent-rgb), 0.1)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarIcon size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Tidak ada agenda atau jadwal yang cocok</h4>
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--cms-text-muted)', maxWidth: 400 }}>
                  Semua tenggat waktu proyek, rencana konten, dan janji temu konsultasi klien yang disinkronkan akan muncul di sini secara terstruktur.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              {timelineItems.map((item) => {
                const isProject = item.type === 'project';
                const isContent = item.type === 'content';
                const isBooking = item.type === 'booking';
                const isHoliday = item.type === 'holiday';

                const themeColor = isProject ? '#f59e0b' : isContent ? '#ec4899' : isBooking ? '#3b82f6' : '#ef4444';
                const themeBg = isProject ? 'rgba(245, 158, 11, 0.12)' : isContent ? 'rgba(236, 72, 153, 0.12)' : isBooking ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--cms-card-bg)',
                      borderRadius: 16,
                      border: '1.5px solid var(--glass-border)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Left: Type Icon + Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: themeBg, color: themeColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isProject && <Target size={16} />}
                        {isContent && <Sparkles size={16} />}
                        {isBooking && <Users size={16} />}
                        {isHoliday && <AlertCircle size={16} />}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </span>
                          <span style={{
                            fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                            background: themeBg, color: themeColor
                          }}>
                            {item.subtitle}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CalendarIcon size={11} />
                            {item.date}
                          </span>
                          {item.time && item.time !== '00:00' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Clock size={11} />
                              {item.time} WIB
                            </span>
                          )}
                          {item.phone && (
                            <span>• {item.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {isProject && (
                        <button
                          type="button"
                          onClick={() => onSelectProject(item.data)}
                          style={{
                            padding: '6px 12px', borderRadius: 8,
                            border: '1.5px solid var(--glass-border)',
                            background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                            fontSize: 11, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Eye size={12} />
                          <span>Detail</span>
                        </button>
                      )}

                      {isContent && (
                        <button
                          type="button"
                          onClick={() => onOpenContentPlan(item.data)}
                          style={{
                            padding: '6px 12px', borderRadius: 8,
                            border: '1.5px solid var(--glass-border)',
                            background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                            fontSize: 11, fontWeight: 800, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      )}

                      {isBooking && (
                        <button
                          type="button"
                          onClick={() => onDeleteBooking?.(item.id)}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            border: '1.5px solid var(--glass-border)',
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Hapus Janji Temu"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 3. DIRECT QUICK ADD POPOVER MODAL ── */}
      {quickAddTarget && (
        <div
          onClick={() => setQuickAddTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483645,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'cmsFadeIn 0.15s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 20,
              padding: 14,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              animation: 'pmModalIn 0.2s cubic-bezier(0.16,1,0.3,1) both'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 8px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)' }}>
                Tambah Agenda ({quickAddTarget.dateStr})
              </div>
              <button
                type="button"
                onClick={() => setQuickAddTarget(null)}
                style={{
                  width: 24, height: 24, borderRadius: 6, border: 'none',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Option 1: Proyek Regular */}
            <button
              type="button"
              onClick={() => {
                const dt = quickAddTarget.dateStr;
                setQuickAddTarget(null);
                if (onAddProject) {
                  onAddProject(null, true, { type: 'project', deadline: dt });
                }
              }}
              style={{
                padding: '10px 12px', borderRadius: 12, border: 'none',
                background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(var(--cms-accent-rgb), 0.15)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Target size={16} />
              </div>
              <div>
                <div style={{ color: 'var(--cms-text)' }}>Proyek Regular</div>
                <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Tenggat deadline proyek</div>
              </div>
            </button>

            {/* Option 2: Rencana Konten */}
            <button
              type="button"
              onClick={() => {
                const { dateStr, holidayPrompt } = quickAddTarget;
                setQuickAddTarget(null);
                onOpenContentPlan(null, dateStr, holidayPrompt);
              }}
              style={{
                padding: '10px 12px', borderRadius: 12, border: 'none',
                background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ color: 'var(--cms-text)' }}>Rencana Konten</div>
                <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Jadwal publikasi medsos</div>
              </div>
            </button>

            {/* Option 3: Janji Temu */}
            <button
              type="button"
              onClick={() => {
                const dt = quickAddTarget.dateStr;
                setQuickAddTarget(null);
                onOpenNewBooking(dt);
              }}
              style={{
                padding: '10px 12px', borderRadius: 12, border: 'none',
                background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={16} />
              </div>
              <div>
                <div style={{ color: 'var(--cms-text)' }}>Janji Temu</div>
                <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Jadwal konsultasi klien</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. MODAL DETAIL & HAPUS JANJI TEMU ── */}
      {selectedBookingDetail && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedBookingDetail(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'cmsFadeIn 0.15s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 24,
              padding: 22,
              boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              animation: 'pmModalIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 14,
                  background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                    {selectedBookingDetail.clientName || 'Janji Temu'}
                  </h3>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span>Janji Temu Konsultasi Klien</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                style={{
                  width: 32, height: 32, borderRadius: 9, border: 'none',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800
                }}
              >
                ✕
              </button>
            </div>

            {/* Information Card */}
            <div style={{
              background: 'var(--cms-input-bg)',
              borderRadius: 16,
              padding: '14px 16px',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>Layanan:</span>
                <span style={{ fontWeight: 850, color: 'var(--cms-text)' }}>{selectedBookingDetail.serviceName || 'Konsultasi Layanan'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>Jadwal Pertemuan:</span>
                <span style={{ fontWeight: 850, color: 'var(--cms-accent)' }}>
                  {selectedBookingDetail.date} • {selectedBookingDetail.time || '10:00'} WIB
                </span>
              </div>

              {selectedBookingDetail.clientPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>WhatsApp:</span>
                  <a
                    href={`https://wa.me/${selectedBookingDetail.clientPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: 850, color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>{selectedBookingDetail.clientPhone}</span>
                    <span style={{ fontSize: 11 }}>↗</span>
                  </a>
                </div>
              )}

              {selectedBookingDetail.clientEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--cms-text-muted)', fontWeight: 700 }}>Email:</span>
                  <span style={{ fontWeight: 850, color: 'var(--cms-text)' }}>{selectedBookingDetail.clientEmail}</span>
                </div>
              )}

              {selectedBookingDetail.notes && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 8, marginTop: 2 }}>
                  <div style={{ color: 'var(--cms-text-muted)', fontSize: 11.5, fontWeight: 750, marginBottom: 3 }}>Catatan / Kebutuhan:</div>
                  <div style={{ color: 'var(--cms-text)', fontSize: 12.5, lineHeight: 1.5, background: 'rgba(0,0,0,0.02)', padding: '6px 10px', borderRadius: 8 }}>
                    {selectedBookingDetail.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              {selectedBookingDetail.clientPhone && (
                <a
                  href={`https://wa.me/${selectedBookingDetail.clientPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 12,
                    background: '#10b981',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 12.5,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(16,185,129,0.35)'
                  }}
                >
                  <Share2 size={14} />
                  <span>Chat WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const bId = selectedBookingDetail.id;
                  setSelectedBookingDetail(null);
                  setTimeout(() => {
                    if (onDeleteBooking) {
                      onDeleteBooking(bId);
                    }
                  }, 50);
                }}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 12,
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.14)',
                  color: '#ef4444',
                  fontSize: 12.5,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <Trash2 size={14} />
                <span>Hapus Janji Temu</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 5. MODAL AGENDA HARIAN KHUSUS MOBILE ── */}
      {selectedDayAgenda && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedDayAgenda(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'cmsFadeIn 0.15s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 500,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 24,
              padding: '20px 18px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              animation: 'pmSlideUp 0.22s cubic-bezier(0.16,1,0.3,1) both',
              boxSizing: 'border-box',
              maxHeight: 'calc(100dvh - 120px)',
              overflowY: 'auto'
            }}
          >
            {/* Grabber bar */}
            <div style={{ width: 36, height: 4, borderRadius: 10, background: 'var(--glass-border)', margin: '0 auto -4px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                  Agenda Tanggal {selectedDayAgenda.dayNumber}
                </h3>
                <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', fontWeight: 700 }}>
                  {selectedDayAgenda.dateStr}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayAgenda(null)}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: 'none',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800
                }}
              >
                ✕
              </button>
            </div>

            {/* Agenda Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Holidays */}
              {selectedDayAgenda.holidays?.map((h: any, hIdx: number) => (
                <div
                  key={`h_${hIdx}`}
                  onClick={() => {
                    setSelectedDayAgenda(null);
                    onOpenContentPlan(null, selectedDayAgenda.dateStr, h.contentIdeaPrompt || h.name);
                  }}
                  style={{
                    padding: '10px 12px', borderRadius: 12,
                    background: h.isRedDate ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: `1px solid ${h.isRedDate ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {h.isRedDate ? <AlertCircle size={16} color="#ef4444" /> : <Sparkles size={16} color="#f59e0b" />}
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 850, color: h.isRedDate ? '#ef4444' : '#f59e0b' }}>{h.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>Hari Libur / Momen Spesial</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)' }}>Ide Konten ↗</span>
                </div>
              ))}

              {/* Projects */}
              {selectedDayAgenda.projects?.map((proj: any) => (
                <div
                  key={`p_${proj.id}`}
                  onClick={() => {
                    setSelectedDayAgenda(null);
                    onSelectProject(proj);
                  }}
                  style={{
                    padding: '10px 12px', borderRadius: 12,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <Target size={16} color="var(--cms-accent)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 850, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>Tenggat Waktu Proyek</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)' }}>Buka Proyek ↗</span>
                </div>
              ))}

              {/* Content Plans */}
              {selectedDayAgenda.contentList?.map((cnt: any) => (
                <div
                  key={`c_${cnt.id}`}
                  onClick={() => {
                    setSelectedDayAgenda(null);
                    onOpenContentPlan(cnt);
                  }}
                  style={{
                    padding: '10px 12px', borderRadius: 12,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {renderPlatformIcon(cnt.platform)}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 850, color: 'var(--cms-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cnt.title}</div>
                      <div style={{ fontSize: 10.5, color: '#ec4899', fontWeight: 700 }}>Rencana Konten {cnt.platform}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#ec4899' }}>Edit ↗</span>
                </div>
              ))}

              {/* Bookings */}
              {selectedDayAgenda.bookingList?.map((bk: any) => (
                <div
                  key={`b_${bk.id}`}
                  style={{
                    padding: '10px 12px', borderRadius: 12,
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedDayAgenda(null);
                      setSelectedBookingDetail(bk);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, cursor: 'pointer' }}
                  >
                    <Users size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 850, color: 'var(--cms-text)' }}>
                        {bk.time ? `${bk.time} ` : ''}{bk.clientName}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#3b82f6', fontWeight: 700 }}>Janji Temu Konsultasi</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {bk.clientPhone && (
                      <a
                        href={`https://wa.me/${bk.clientPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: '#10b981', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none'
                        }}
                        title="Chat WhatsApp"
                      >
                        <Share2 size={13} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const bId = bk.id;
                        setSelectedDayAgenda(null);
                        setTimeout(() => {
                          onDeleteBooking?.(bId);
                        }, 50);
                      }}
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none',
                        background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title="Hapus Janji Temu"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={() => {
                const dt = selectedDayAgenda.dateStr;
                const hp = selectedDayAgenda.holidayPrompt;
                setSelectedDayAgenda(null);
                setQuickAddTarget({ dateStr: dt, holidayPrompt: hp });
              }}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 12,
                border: 'none',
                background: 'var(--cms-accent)',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 6,
                boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.35)'
              }}
            >
              <Plus size={15} strokeWidth={2.8} />
              <span>Tambah Agenda di Tanggal Ini</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CalendarGridView;
