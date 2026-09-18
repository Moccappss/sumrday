import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Check, Trash2, MessageSquare, FileText, Zap, 
  Search, Filter, Clock, ChevronRight, AlertCircle, 
  CheckCircle2, FolderKanban, Copy, Eye, Calendar,
  ShoppingCart, Save, FileEdit, Layers, Settings2, ArrowLeft
} from 'lucide-react';
import { useContextMenu } from './ContextMenuProvider';
import { subscribeToNotifications, markAsRead, markAllAsRead, clearNotifications, NOTIF_TYPES } from '../../utils/notifications';

function getDayLabel(ts: any): string {
  if (!ts) return 'Hari Ini';
  try {
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (isNaN(date.getTime())) return 'Hari Ini';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hari Ini';
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';

    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  } catch (e) {
    return 'Hari Ini';
  }
}

function formatTimeOnly(ts: any): string {
  if (!ts) return 'Baru saja';
  try {
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (isNaN(date.getTime())) return 'Baru saja';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Baru saja';
  }
}

const ActivityManager: React.FC<{ onSwitchPage?: (page: string) => void }> = ({ onSwitchPage }) => {
  const { bindContextMenu } = useContextMenu();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsub = subscribeToNotifications((notifs) => {
      setNotifications(notifs || []);
    });
    return () => unsub();
  }, []);

  // Safe search and filter
  const filteredNotifs = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();
    return (notifications || []).filter(n => {
      if (!n) return false;
      const matchesFilter = filter === 'all' || n.type === filter;
      const title = String(n.title || '').toLowerCase();
      const msg = String(n.message || '').toLowerCase();
      const matchesSearch = !query || title.includes(query) || msg.includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, searchQuery]);

  // Group notifications by day
  const groupedNotifs = useMemo(() => {
    const groups: { label: string; items: any[] }[] = [];
    const map = new Map<string, any[]>();

    filteredNotifs.forEach(n => {
      const label = getDayLabel(n.timestamp);
      if (!map.has(label)) {
        map.set(label, []);
        groups.push({ label, items: map.get(label)! });
      }
      map.get(label)!.push(n);
    });

    return groups;
  }, [filteredNotifs]);

  const getIcon = (type: string) => {
    switch (type) {
      case NOTIF_TYPES.CHAT: return <MessageSquare size={16} />;
      case NOTIF_TYPES.TRANSACTION: return <ShoppingCart size={16} />;
      case NOTIF_TYPES.SAVE: return <Save size={16} />;
      case NOTIF_TYPES.PAGE: return <FileEdit size={16} />;
      case NOTIF_TYPES.BLOCK: return <Layers size={16} />;
      case NOTIF_TYPES.SETTINGS: return <Settings2 size={16} />;
      case 'project':
      case NOTIF_TYPES.PROJECT: return <FolderKanban size={16} />;
      default: return <Zap size={16} />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case NOTIF_TYPES.CHAT: return '#8b5cf6';
      case NOTIF_TYPES.TRANSACTION: return '#10b981';
      case NOTIF_TYPES.SAVE: return '#0ea5e9';
      case NOTIF_TYPES.PAGE: return '#f59e0b';
      case 'project':
      case NOTIF_TYPES.PROJECT: return '#f97316';
      default: return '#6366f1';
    }
  };

  const handleNotifClick = (n: any) => {
    if (!n) return;
    try {
      markAsRead(n.id);
      if (!onSwitchPage) return;

      if (n.type === NOTIF_TYPES.CHAT) {
        onSwitchPage('chat');
      } else if (n.type === NOTIF_TYPES.TRANSACTION) {
        onSwitchPage('transactions');
      } else if (n.type === NOTIF_TYPES.PROJECT || n.data?.projectId || n.data?.projectTitle) {
        onSwitchPage('projects');
        if (n.data?.projectId) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('porto_open_project', { detail: n.data.projectId }));
          }, 100);
        }
      } else if (n.data?.noteTitle) {
        onSwitchPage('notes');
      } else if (n.type === NOTIF_TYPES.SAVE) {
        if (n.data?.page) {
          onSwitchPage(n.data.page.toLowerCase() === 'home' ? 'home' : n.data.page);
        } else {
          onSwitchPage('notes');
        }
      } else if (n.type === NOTIF_TYPES.PAGE) {
        onSwitchPage('website');
      } else if (n.type === NOTIF_TYPES.SETTINGS) {
        onSwitchPage('settings');
      } else if (n.type === NOTIF_TYPES.SYSTEM) {
        if (n.data?.userName) onSwitchPage('users');
        else onSwitchPage('dashboard');
      }
    } catch (e) {
      console.warn('Notification click handle error:', e);
    }
  };

  const unreadCount = (notifications || []).filter(n => !n?.read).length;

  return (
    <div 
      className="activity-manager-root"
      style={{ 
        padding: isMobile ? '16px 16px 90px' : '24px 24px 80px', 
        height: '100%', 
        overflowY: 'auto', 
        background: 'var(--cms-bg)', 
        animation: 'cmsFadeIn 0.3s ease',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'flex-end', 
          gap: isMobile ? 12 : 20,
          marginBottom: isMobile ? 16 : 28 
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.1em', marginBottom: 4, textTransform: 'uppercase' }}>
              Log Sistem & Riwayat
            </div>
            <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--cms-text)' }}>
              Activity Space
            </h1>
            <p style={{ color: 'var(--cms-text-muted)', fontSize: isMobile ? 12 : 14, fontWeight: 500, marginTop: 4, marginBottom: 0 }}>
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi telah dibaca.'}
            </p>
          </div>

          {/* Top Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                title="Tandai Semua Dibaca"
                aria-label="Tandai Dibaca"
                style={{ 
                  padding: isMobile ? '0 10px' : '0 14px', 
                  height: 38, 
                  borderRadius: 12, 
                  fontWeight: 700, 
                  fontSize: 12,
                  gap: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                  color: 'var(--cms-text)'
                }}
              >
                <Check size={15} color="#10b981" /> {!isMobile && <span>Dibaca</span>}
              </button>
            )}
            <button 
              onClick={clearNotifications} 
              title="Bersihkan Semua Notifikasi"
              aria-label="Bersihkan"
              style={{ 
                background: 'rgba(239, 68, 68, 0.08)', 
                color: '#ef4444', 
                padding: isMobile ? '0 10px' : '0 14px', 
                height: 38, 
                borderRadius: 12, 
                fontWeight: 700, 
                fontSize: 12,
                gap: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} /> {!isMobile && <span>Bersihkan</span>}
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 10 : 12, 
          marginBottom: isMobile ? 16 : 24, 
          padding: isMobile ? 8 : 6, 
          background: 'var(--cms-card-bg, #ffffff)', 
          borderRadius: isMobile ? 16 : 18, 
          border: '1px solid var(--cms-border, rgba(0,0,0,0.1))', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              type="text" 
              placeholder="Cari notifikasi atau aktivitas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                height: isMobile ? 38 : 42, 
                background: 'transparent', 
                border: 'none', 
                padding: '0 14px 0 38px', 
                fontSize: 13, 
                fontWeight: 500, 
                color: 'var(--cms-text)', 
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ 
            display: 'flex', 
            gap: 5, 
            overflowX: 'auto', 
            paddingBottom: isMobile ? 2 : 0,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {[
              { key: 'all', label: 'Semua' },
              { key: NOTIF_TYPES.TRANSACTION, label: 'Transaksi' },
              { key: NOTIF_TYPES.PROJECT, label: 'Proyek' },
              { key: NOTIF_TYPES.SAVE, label: 'Simpan' },
              { key: NOTIF_TYPES.CHAT, label: 'Chat' }
            ].map(t => (
              <button 
                key={t.key}
                onClick={() => setFilter(t.key)}
                style={{ 
                  height: isMobile ? 32 : 36, 
                  padding: '0 12px', 
                  borderRadius: 10, 
                  border: 'none', 
                  cursor: 'pointer',
                  background: filter === t.key ? 'var(--cms-accent, #6366f1)' : 'transparent',
                  color: filter === t.key ? '#fff' : 'var(--cms-text-muted)',
                  fontSize: 11.5, 
                  fontWeight: 700, 
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped Day List */}
        {groupedNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isMobile ? '48px 16px' : '80px 0', opacity: 0.45 }}>
            <Bell size={40} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>Tidak ada notifikasi ditemukan</div>
            <p style={{ marginTop: 4, fontWeight: 500, fontSize: 12, color: 'var(--cms-text-muted)' }}>Semua riwayat dan log sistem Anda bersih.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {groupedNotifs.map((group, groupIdx) => (
              <div key={groupIdx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Day Header Badge */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '4px 0',
                  color: 'var(--cms-text-muted)',
                  fontSize: 11.5,
                  fontWeight: 800
                }}>
                  <Calendar size={13} style={{ opacity: 0.7 }} />
                  <span>{group.label}</span>
                  <span style={{ 
                    fontSize: 9.5, 
                    background: 'var(--cms-bg, #f3f4f6)', 
                    border: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
                    padding: '1px 6px', 
                    borderRadius: 100, 
                    fontWeight: 700 
                  }}>
                    {group.items.length}
                  </span>
                </div>

                {/* Items in this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
                  {group.items.map((n, i) => {
                    const badgeColor = getBadgeColor(n.type);
                    // Safe string cleansing (remove emojis)
                    const cleanTitle = String(n.title || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || 'Aktivitas';
                    const cleanMsg = String(n.message || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

                    return (
                      <div 
                        key={n.id || i}
                        onClick={() => handleNotifClick(n)}
                        className="cms-notif-full-card"
                        style={{ 
                          padding: isMobile ? '12px 14px' : '16px 20px', 
                          borderRadius: isMobile ? 14 : 16, 
                          cursor: 'pointer', 
                          display: 'flex', 
                          gap: isMobile ? 12 : 16, 
                          alignItems: 'center',
                          background: n.read ? 'var(--cms-card-bg, #ffffff)' : `${badgeColor}08`,
                          border: `1px solid ${n.read ? 'var(--cms-border, rgba(0,0,0,0.08))' : `${badgeColor}30`}`,
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* Icon Badge */}
                        <div style={{ 
                          width: isMobile ? 36 : 42, 
                          height: isMobile ? 36 : 42, 
                          borderRadius: isMobile ? 10 : 12, 
                          background: `${badgeColor}18`,
                          color: badgeColor,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0
                        }}>
                          {getIcon(n.type)}
                        </div>
                        
                        {/* Text Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <div style={{ fontSize: isMobile ? 13 : 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                              {cleanTitle}
                            </div>
                            {!n.read && (
                              <div style={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                background: badgeColor, 
                                flexShrink: 0 
                              }} />
                            )}
                          </div>
                          
                          {cleanMsg && (
                            <p style={{ 
                              fontSize: isMobile ? 11.5 : 12.5, 
                              color: 'var(--cms-text-muted)', 
                              fontWeight: 500, 
                              margin: 0, 
                              lineHeight: 1.35, 
                              wordBreak: 'break-word' 
                            }}>
                              {cleanMsg}
                            </p>
                          )}
                          
                          <div style={{ 
                            fontSize: 10, 
                            color: 'var(--cms-text-muted)', 
                            fontWeight: 600, 
                            marginTop: 4, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 4, 
                            opacity: 0.65 
                          }}>
                            <Clock size={10} />
                            <span>{formatTimeOnly(n.timestamp)}</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight size={16} color="var(--cms-text-muted)" style={{ opacity: 0.4, flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .cms-notif-full-card:hover {
          transform: translateY(-1.5px);
          border-color: var(--cms-accent, #6366f1) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
      `}</style>
    </div>
  );
};

export default ActivityManager;
