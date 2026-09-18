import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, X, Check, Trash2, MessageSquare, FileText, Zap, ChevronRight,
  Clock, FolderKanban, ShoppingCart, Save, FileEdit, Layers, Settings2,
  AlertTriangle, XCircle, CheckCircle2, Users, Filter, Megaphone
} from 'lucide-react';
import { subscribeToNotifications, markAsRead, markAllAsRead, clearNotifications, NOTIF_TYPES } from '../../utils/notifications';

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  [NOTIF_TYPES.CHAT]:        { icon: MessageSquare, color: '#8b5cf6', label: 'Chat'        },
  [NOTIF_TYPES.FORM]:        { icon: FileText,      color: '#3b82f6', label: 'Form'        },
  [NOTIF_TYPES.SYSTEM]:      { icon: Zap,           color: '#64748b', label: 'Sistem'      },
  [NOTIF_TYPES.TRANSACTION]: { icon: ShoppingCart,  color: '#10b981', label: 'Transaksi'   },
  [NOTIF_TYPES.SAVE]:        { icon: Save,          color: '#0ea5e9', label: 'Simpan'      },
  [NOTIF_TYPES.PAGE]:        { icon: FileEdit,      color: '#f59e0b', label: 'Halaman'     },
  [NOTIF_TYPES.BLOCK]:       { icon: Layers,        color: '#ec4899', label: 'Blok'        },
  [NOTIF_TYPES.SETTINGS]:    { icon: Settings2,     color: '#6366f1', label: 'Settings'    },
  [NOTIF_TYPES.WARNING]:     { icon: AlertTriangle, color: '#f59e0b', label: 'Peringatan'  },
  [NOTIF_TYPES.ERROR]:       { icon: XCircle,       color: '#ef4444', label: 'Error'       },
  [NOTIF_TYPES.SUCCESS]:     { icon: CheckCircle2,  color: '#10b981', label: 'Sukses'      },
  [NOTIF_TYPES.PROJECT]:     { icon: FolderKanban,  color: '#f97316', label: 'Proyek'      },
};
const DEFAULT_CONFIG = { icon: Zap, color: '#64748b', label: 'Info' };

const getConfig = (type: string) => TYPE_CONFIG[type] || DEFAULT_CONFIG;

const formatTime = (ts: any) => {
  if (!ts) return 'Baru saja';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)   return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

interface NotificationCenterProps {
  onSwitchPage?: (page: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSwitchPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMobileScreen, setIsMobileScreen] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => localStorage.getItem('cms_sidebar_expanded') !== 'false');
  const [anchorPos, setAnchorPos] = useState<{ left: number; bottom: number } | null>(null);
  const [openSource, setOpenSource] = useState<'sidebar' | 'top_header'>('sidebar');

  const calculateAnchorPos = () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) {
      setAnchorPos(null);
      return;
    }
    const frame = document.querySelector('.cms-main-container') || document.querySelector('.cms-body-wrapper');
    if (frame) {
      const frameRect = frame.getBoundingClientRect();
      // Exactly 20px gap from the main frame's left border & bottom border
      const left = Math.min(frameRect.left + 20, window.innerWidth - 400);
      const bottom = Math.max(20, (window.innerHeight - frameRect.bottom) + 20);
      setAnchorPos({ left, bottom });
    } else {
      const isExp = localStorage.getItem('cms_sidebar_expanded') !== 'false';
      setAnchorPos({ left: isExp ? 280 : 104, bottom: 36 });
    }
  };

  useEffect(() => {
    const unsub = subscribeToNotifications((notifs) => setNotifications(notifs));

    const handleToggle = (e?: any) => {
      const source = e?.detail?.source || 'sidebar';
      setOpenSource(source);
      setIsOpen(prev => {
        const next = !prev;
        if (next) {
          calculateAnchorPos();
          if (window.innerWidth < 768) {
            window.dispatchEvent(new CustomEvent('cms_sidebar_set_expanded', { detail: { isExpanded: false } }));
          }
        }
        return next;
      });
    };
    window.addEventListener('porto_toggle_notifications', handleToggle);

    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
      calculateAnchorPos();
    };
    const handleSidebar = (e: any) => {
      setSidebarExpanded(e.detail?.isExpanded);
      setTimeout(calculateAnchorPos, 150);
    };
    const handleCloseOnAction = () => setIsOpen(false);

    window.addEventListener('resize', handleResize);
    window.addEventListener('cms_sidebar_toggle', handleSidebar);
    window.addEventListener('porto_switch_page', handleCloseOnAction);
    window.addEventListener('cms_sidebar_toggle_request', handleCloseOnAction);
    window.addEventListener('cms_global_add', handleCloseOnAction);
    window.addEventListener('porto_open_sync_modal', handleCloseOnAction);

    return () => {
      unsub();
      window.removeEventListener('porto_toggle_notifications', handleToggle);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('cms_sidebar_toggle', handleSidebar);
      window.removeEventListener('porto_switch_page', handleCloseOnAction);
      window.removeEventListener('cms_sidebar_toggle_request', handleCloseOnAction);
      window.removeEventListener('cms_global_add', handleCloseOnAction);
      window.removeEventListener('porto_open_sync_modal', handleCloseOnAction);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter groups (Clean & Sleek)
  const FILTERS = [
    { key: 'all', label: 'Semua' },
    { key: 'unread', label: `Belum Dibaca (${unreadCount})` },
    { key: NOTIF_TYPES.CHAT, label: 'Pesan' },
    { key: NOTIF_TYPES.SAVE, label: 'Simpan' },
    { key: NOTIF_TYPES.PROJECT, label: 'Proyek' },
    { key: NOTIF_TYPES.PAGE, label: 'Blog & Karya' },
    { key: NOTIF_TYPES.TRANSACTION, label: 'Transaksi' },
  ];

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const handleNotifClick = (n: any) => {
    if (!n) return;
    markAsRead(n.id);
    setIsOpen(false);
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
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent Backdrop for Clean Popover Focus */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: isMobileScreen ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
          backdropFilter: isMobileScreen ? 'blur(3px)' : 'none',
          WebkitBackdropFilter: isMobileScreen ? 'blur(3px)' : 'none',
          zIndex: 99998,
          cursor: 'default'
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Solid Compact Card Popover */}
      <div
        className="cms-notif-popover"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: openSource === 'top_header' ? (isMobileScreen ? 64 : 64) : 'auto',
          bottom: openSource === 'top_header' ? 'auto' : (isMobileScreen ? 85 : (anchorPos ? anchorPos.bottom : 36)),
          left: isMobileScreen 
            ? '50%' 
            : (openSource === 'top_header' ? 'auto' : (anchorPos ? anchorPos.left : (sidebarExpanded ? 280 : 104))),
          right: !isMobileScreen && openSource === 'top_header' ? 24 : 'auto',
          transform: isMobileScreen ? 'translateX(-50%)' : 'none',
          width: isMobileScreen ? 'calc(100vw - 32px)' : 370,
          maxWidth: 390,
          maxHeight: isMobileScreen ? '72vh' : '520px',
          zIndex: 99999,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 45px rgba(0,0,0,0.25), 0 4px 14px rgba(0,0,0,0.1)',
          animation: isMobileScreen ? 'cmsFadeIn 0.2s ease-out' : 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
          overflow: 'hidden',
          background: 'var(--cms-card-bg, #ffffff)',
          color: 'var(--cms-text)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
          background: 'var(--cms-bg, #f9fafb)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Bell size={16} style={{ color: 'var(--cms-accent, #6366f1)' }} />
                Pusat Notifikasi
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  title="Tandai semua dibaca"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                    borderRadius: 7,
                    padding: '4px 6px',
                    cursor: 'pointer',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Check size={13} />
                </button>
              )}
              <button 
                onClick={clearNotifications} 
                title="Hapus semua"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                  borderRadius: 7,
                  padding: '4px 6px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Trash2 size={13} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Push Broadcast Action Button */}
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => {
                onSwitchPage?.('broadcast');
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(6, 182, 212, 0.12))',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: 'var(--cms-accent, #7c3aed)',
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Megaphone size={13} />
              <span>Kirim Push Notifikasi / Promosi</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: '4px 9px',
                  borderRadius: 100,
                  fontSize: 9.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: activeFilter === f.key ? 'var(--cms-accent, #6366f1)' : 'transparent',
                  color: activeFilter === f.key ? '#fff' : 'var(--cms-text-muted)',
                  borderColor: activeFilter === f.key ? 'var(--cms-accent, #6366f1)' : 'var(--cms-border, rgba(0,0,0,0.1))',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', scrollbarWidth: 'thin' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', opacity: 0.45 }}>
              <Bell size={28} strokeWidth={1.2} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 12, fontWeight: 700 }}>Tidak ada notifikasi</div>
              <div style={{ fontSize: 10.5, marginTop: 2, fontWeight: 600, color: 'var(--cms-text-muted)' }}>
                {activeFilter !== 'all' ? 'Coba filter lain' : 'Semua bersih!'}
              </div>
            </div>
          ) : (
            filtered.map(n => {
              const cfg = getConfig(n.type);
              const Icon = cfg.icon;
              // Clean title (remove emojis)
              const cleanTitle = (n.title || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
              const cleanMessage = (n.message || '').replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: n.read ? 'transparent' : `${cfg.color}08`,
                    border: `1px solid ${n.read ? 'var(--cms-border, rgba(0,0,0,0.06))' : `${cfg.color}25`}`,
                    marginBottom: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.read ? 'transparent' : `${cfg.color}08`; }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Icon Badge */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${cfg.color}15`, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)', lineHeight: 1.3 }}>
                          {cleanTitle || n.title}
                        </div>
                        {!n.read && (
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: cfg.color, flexShrink: 0, marginTop: 3,
                            boxShadow: `0 0 5px ${cfg.color}`,
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 500, marginTop: 2, lineHeight: 1.35 }}>
                        {cleanMessage || n.message}
                      </div>
                      <div style={{ fontSize: 9.5, opacity: 0.5, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={8.5} />
                        {formatTime(n.timestamp)}
                        <span style={{ marginLeft: 3, padding: '1px 5px', borderRadius: 100, background: `${cfg.color}15`, color: cfg.color, fontWeight: 700 }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--cms-border, rgba(0,0,0,0.08))', flexShrink: 0 }}>
          <button
            onClick={() => { onSwitchPage?.('activity'); setIsOpen(false); }}
            style={{
              width: '100%', height: 34, borderRadius: 10,
              background: 'var(--cms-accent-soft, rgba(99, 102, 241, 0.1))', color: 'var(--cms-accent, #6366f1)',
              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontFamily: 'inherit',
            }}
          >
            Lihat Semua Aktivitas <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
