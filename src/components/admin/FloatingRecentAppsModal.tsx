import React, { useState, useEffect } from 'react';
import { 
  Clock, X, ArrowRight, Trash2, StickyNote, FolderKanban, Globe2, 
  Receipt, MessageSquareMore, Database, Users, Settings2, Link2, 
  FileText, Sparkles, LayoutDashboard, QrCode, Globe
} from 'lucide-react';
import { haptic } from '../../utils/haptics';

export interface RecentAppItem {
  id: string;
  module: string;
  label: string;
  title: string;
  subTitle?: string;
  statePayload?: any;
  icon?: string;
  timestamp: number;
}

const MODULE_ICONS: Record<string, React.ComponentType<any>> = {
  dashboard: LayoutDashboard,
  website: Globe2,
  links: Link2,
  qr: QrCode,
  notes: StickyNote,
  whiteboard: FileText,
  projects: FolderKanban,
  transactions: Receipt,
  chat: MessageSquareMore,
  broadcast: MegaphoneIcon,
  storage: Database,
  users: Users,
  settings: Settings2,
  home: Globe,
  portofolio: Globe,
  biodata: Globe
};

function MegaphoneIcon(props: any) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 11 18-5v12L3 14v-3z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}

export const FloatingRecentAppsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string, payload?: any) => void;
  isMobile?: boolean;
}> = ({ isOpen, onClose, onNavigate, isMobile }) => {
  const [items, setItems] = useState<RecentAppItem[]>(() => {
    try {
      const saved = localStorage.getItem('porto_recent_apps_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'dash_default', module: 'dashboard', label: 'Dashboard Utama', title: 'Dashboard', subTitle: 'Overview Sistem', timestamp: Date.now() }
    ];
  });

  // Listen to track events from any module
  useEffect(() => {
    const handleTrack = (e: any) => {
      const detail = e?.detail;
      if (!detail || !detail.module) return;

      setItems(prev => {
        const filtered = prev.filter(item => item.id !== detail.id && item.label !== detail.label);
        const newItem: RecentAppItem = {
          id: detail.id || `rec_${Date.now()}`,
          module: detail.module,
          label: detail.label || detail.title || detail.module,
          title: detail.title || detail.label || detail.module,
          subTitle: detail.subTitle || 'Aplikasi',
          statePayload: detail.statePayload || null,
          icon: detail.icon || detail.module,
          timestamp: Date.now()
        };
        const updated = [newItem, ...filtered].slice(0, 12);
        try {
          localStorage.setItem('porto_recent_apps_v2', JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
    };

    window.addEventListener('porto_track_recent_item', handleTrack);
    return () => window.removeEventListener('porto_track_recent_item', handleTrack);
  }, []);

  const handleClearAll = () => {
    haptic.medium();
    const defaultList: RecentAppItem[] = [
      { id: 'dash_default', module: 'dashboard', label: 'Dashboard Utama', title: 'Dashboard', subTitle: 'Overview Sistem', timestamp: Date.now() }
    ];
    setItems(defaultList);
    try {
      localStorage.setItem('porto_recent_apps_v2', JSON.stringify(defaultList));
    } catch (err) {}
  };

  const handleRemoveOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.light();
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('porto_recent_apps_v2', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const handleSelect = (item: RecentAppItem) => {
    haptic.light();
    onClose();
    onNavigate(item.module, item.statePayload);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'cmsFadeIn 0.2s ease forwards'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1.5px solid var(--glass-border, rgba(255,255,255,0.12))',
          borderRadius: '24px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cmsScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--cms-header-bg, rgba(255,255,255,0.02))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--cms-accent-soft, rgba(99, 102, 241, 0.15))',
              color: 'var(--cms-accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.01em' }}>
                Recent Apps & Files
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 650 }}>
                {items.length} aktivitas terakhir yang dibuka
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {items.length > 1 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  height: 28,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--cms-text-muted)',
                  fontSize: 11,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Bersihkan riwayat recent apps"
              >
                <Trash2 size={12} />
                <span>Bersihkan</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-switcher-bg)',
                color: 'var(--cms-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List of Recent Items */}
        <div style={{
          padding: '14px 16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1
        }}>
          {items.map((item, idx) => {
            const IconComp = MODULE_ICONS[item.module] || LayoutDashboard;
            return (
              <div
                key={item.id || idx}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'var(--cms-input-bg)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = 'var(--cms-accent)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--cms-card-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComp size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 850,
                      color: 'var(--cms-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.title || item.label}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', fontWeight: 650, marginTop: 1 }}>
                      {item.subTitle || item.module.toUpperCase()} {item.statePayload?.noteId ? '• Catatan Aktif' : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'var(--cms-accent-soft)',
                    color: 'var(--cms-accent)',
                    fontSize: 10.5,
                    fontWeight: 850,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span>Buka</span>
                    <ArrowRight size={11} />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={e => handleRemoveOne(item.id, e)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--cms-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6
                      }}
                      title="Hapus dari recent"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
