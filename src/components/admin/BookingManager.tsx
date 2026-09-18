import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, XCircle, Trash2, ExternalLink, 
  Phone, Mail, MessageSquare, Plus, Save, RotateCw, Video, 
  Settings2, User, Search, Filter, AlertCircle, Check, Send, Globe, FolderKanban 
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { useDialog } from './DialogProvider';
import { createGoogleCalendarUrl } from '../../utils/calendarUtils';

const BookingManager: React.FC = () => {
  const { showConfirm } = useDialog();
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');

  // Booking Settings State
  const [settings, setSettings] = useState({
    externalCalendarUrl: '',
    telegramBotToken: '',
    telegramChatId: '',
    webhookUrl: '',
    autoConfirm: true,
    customServices: [
      { id: 'consultation', name: 'Konsultasi Desain & Branding', duration: '30 Menit', desc: 'Diskusi visual brand identity, UI/UX, dan positioning produk.' },
      { id: 'web_dev', name: 'Proyek Web & App Development', duration: '45 Menit', desc: 'Rancang arsitektur website, fitur CMS, dan integrasi custom.' },
      { id: 'marketing', name: 'Strategi Digital Marketing & Ads', duration: '30 Menit', desc: 'Evaluasi funnel penjualan, campaign media sosial, & SEO.' }
    ]
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [storedBookings, storedSettings] = await Promise.all([
      storage.getItem('porto_bookings', []),
      storage.getItem('porto_booking_settings', {})
    ]);
    setBookings(storedBookings || []);
    if (storedSettings && Object.keys(storedSettings).length > 0) {
      setSettings(prev => ({ ...prev, ...storedSettings }));
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: newStatus } : b);
    setBookings(updated);
    await storage.setItem('porto_bookings', updated);
  };

  const handleDeleteBooking = async (id: string) => {
    const confirmed = await showConfirm('Hapus data janji temu ini?');
    if (!confirmed) return;
    const updated = bookings.filter(b => b.id !== id);
    setBookings(updated);
    await storage.setItem('porto_bookings', updated);
  };

  const handleConvertToProject = async (item: any) => {
    const newProject = {
      id: `proj_${Date.now()}`,
      parentId: null,
      type: 'project',
      title: `${item.serviceName || 'Konsultasi'} - ${item.clientName}`,
      description: `Dikonversi dari Janji Temu Konsultasi.\nJadwal: ${item.date} ${item.time} WIB\nKontak: ${item.clientPhone} ${item.clientEmail ? '(' + item.clientEmail + ')' : ''}\nCatatan: ${item.clientNotes || '-'}`,
      client: item.clientName,
      clientPhone: item.clientPhone,
      clientEmail: item.clientEmail,
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      deadline: item.date,
      progress: 0,
      tasks: [
        { id: Date.now() + 1, text: `Sesi Diskusi Konsultasi dengan ${item.clientName}`, done: false },
        { id: Date.now() + 2, text: 'Kirim Penawaran / Invoice Layanan', done: false }
      ],
      notes: `Jadwal Pertemuan: ${item.date} ${item.time} WIB\nCatatan Klien: ${item.clientNotes || '-'}`,
      tags: ['Konsultasi', 'Klien'],
      icon: 'FolderKanban',
      coverImage: '',
      team: [{ name: 'Saya', role: 'Project Lead', color: '#10b981' }],
      files: [],
      activity: [{ id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: `Proyek dibuat dari janji temu ${item.clientName}` }]
    };

    const current = await storage.getItem('porto_projects', []);
    const updated = [newProject, ...(Array.isArray(current) ? current : [])];
    await storage.setItem('porto_projects', updated);
    window.dispatchEvent(new Event('porto_saved'));
    window.dispatchEvent(new CustomEvent('porto_open_project', { detail: newProject.id }));
    window.dispatchEvent(new CustomEvent('porto_navigate_admin', { detail: { tab: 'projects' } }));
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await storage.setItem('porto_booking_settings', settings);
      alert('✅ Pengaturan Jadwal & Notifikasi berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchSearch = (b.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.serviceName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.clientPhone || '').includes(searchQuery);
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '0 8px 32px' }}>
      {/* Header & Tabs */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 14, padding: '16px 20px', borderRadius: 20,
        background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text)', margin: 0 }}>Jadwal & Google Calendar Booking</h1>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Kelola konsultasi klien & integrasi Google Calendar</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: 'var(--cms-switcher-bg)', padding: 4, borderRadius: 100, border: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            style={{
              padding: '6px 16px', borderRadius: 100, border: 'none',
              background: activeTab === 'list' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
              color: activeTab === 'list' ? '#fff' : 'var(--cms-text-muted)',
              fontSize: 12, fontWeight: 800, cursor: 'pointer'
            }}
          >
            Daftar Janji Temu ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '6px 16px', borderRadius: 100, border: 'none',
              background: activeTab === 'settings' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
              color: activeTab === 'settings' ? '#fff' : 'var(--cms-text-muted)',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Settings2 size={13} /> Pengaturan & Notifikasi
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Controls: Search & Filter */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <input
                placeholder="Cari nama klien, layanan, atau nomor telepon..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cms-input"
                style={{ width: '100%', height: 42, borderRadius: 12, paddingLeft: 38 }}
              />
              <Search size={16} color="var(--cms-text-muted)" style={{ position: 'absolute', left: 12, top: 13 }} />
            </div>

            <div style={{ display: 'flex', gap: 6, background: 'var(--cms-card-bg)', padding: 4, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'confirmed', label: 'Terkonfirmasi' },
                { id: 'completed', label: 'Selesai' },
                { id: 'cancelled', label: 'Dibatalkan' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none',
                    background: statusFilter === st.id ? 'var(--cms-accent-soft)' : 'transparent',
                    color: statusFilter === st.id ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                    fontSize: 11.5, fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)' }}>Memuat jadwal...</div>
          ) : filteredBookings.length === 0 ? (
            <div style={{
              padding: 60, textAlign: 'center', background: 'var(--cms-card-bg)',
              borderRadius: 24, border: '1.5px dashed var(--glass-border)', color: 'var(--cms-text-muted)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <Calendar size={48} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 800 }}>Belum ada janji temu tercatat.</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Pengunjung yang menjadwalkan konsultasi dari website akan otomatis muncul di sini.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredBookings.map(item => {
                const statusColor = item.status === 'completed' ? '#10b981' : item.status === 'cancelled' ? '#ef4444' : '#3b82f6';
                const statusBg = item.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : item.status === 'cancelled' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--cms-card-bg)', borderRadius: 20, border: '1.5px solid var(--glass-border)',
                      padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 900, background: statusBg, color: statusColor, padding: '3px 8px', borderRadius: 100, textTransform: 'uppercase' }}>
                          {item.status}
                        </span>
                        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)', marginTop: 6 }}>
                          {item.clientName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--cms-accent)', fontWeight: 750 }}>
                          {item.serviceName}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteBooking(item.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--cms-text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} color="var(--cms-accent)" />
                        <span style={{ color: 'var(--cms-text)', fontWeight: 750 }}>{item.date} • {item.time} WIB</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} />
                        <span>{item.clientPhone}</span>
                      </div>
                      {item.clientEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={13} />
                          <span>{item.clientEmail}</span>
                        </div>
                      )}
                      {item.clientNotes && (
                        <div style={{ background: 'var(--cms-input-bg)', padding: '8px 12px', borderRadius: 10, marginTop: 4, fontStyle: 'italic', fontSize: 11.5 }}>
                          "{item.clientNotes}"
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                      {/* WhatsApp Chat */}
                      <a
                        href={`https://wa.me/${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${item.clientName}, salam hangat dari Agenze terkait jadwal konsultasi kita pada ${item.date} jam ${item.time} WIB.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="cms-btn"
                        style={{
                          flex: 1, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none'
                        }}
                      >
                        <Phone size={12} /> WhatsApp
                      </a>

                      {/* Google Calendar Link */}
                      {item.googleCalendarUrl && (
                        <a
                          href={item.googleCalendarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="cms-btn"
                          style={{
                            flex: 1, height: 34, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)',
                            color: '#3b82f6', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none'
                          }}
                        >
                          <Calendar size={12} /> Google Cal
                        </a>
                      )}

                      {/* Konversi ke Proyek Kanban */}
                      <button
                        type="button"
                        onClick={() => handleConvertToProject(item)}
                        className="cms-btn"
                        style={{
                          height: 34, padding: '0 10px', borderRadius: 10,
                          background: 'rgba(124, 58, 237, 0.12)', color: 'var(--cms-accent, #7c3aed)',
                          border: '1px solid rgba(124, 58, 237, 0.25)', cursor: 'pointer',
                          fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4
                        }}
                        title="Konversi janji temu ini menjadi Proyek aktif di Kanban Board"
                      >
                        <FolderKanban size={13} /> Ke Proyek
                      </button>

                      {/* Status switch */}
                      {item.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'completed')}
                          className="cms-btn"
                          style={{ height: 34, padding: '0 10px', borderRadius: 10, background: 'var(--cms-input-bg)', color: '#10b981', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                          title="Tandai Selesai"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Settings Tab */
        <div style={{
          background: 'var(--cms-card-bg)', borderRadius: 24, border: '1.5px solid var(--glass-border)',
          padding: 24, display: 'flex', flexDirection: 'column', gap: 20
        }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Integrasi Notifikasi Webhook & Telegram</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label className="cms-label">Telegram Bot Token (Notifikasi Instan)</label>
                <input
                  type="password"
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={settings.telegramBotToken}
                  onChange={e => setSettings({ ...settings, telegramBotToken: e.target.value })}
                  className="cms-input"
                  style={{ width: '100%', height: 44, borderRadius: 12 }}
                />
              </div>
              <div>
                <label className="cms-label">Telegram Chat ID</label>
                <input
                  placeholder="Contoh: 987654321 atau @channelname"
                  value={settings.telegramChatId}
                  onChange={e => setSettings({ ...settings, telegramChatId: e.target.value })}
                  className="cms-input"
                  style={{ width: '100%', height: 44, borderRadius: 12 }}
                />
              </div>
            </div>

            <div>
              <label className="cms-label">Custom Webhook URL (Make.com, Zapier, Slack, Discord)</label>
              <input
                placeholder="https://hook.eu2.make.com/... atau https://hooks.zapier.com/..."
                value={settings.webhookUrl}
                onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })}
                className="cms-input"
                style={{ width: '100%', height: 44, borderRadius: 12 }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="cms-btn cms-btn-primary"
            style={{ width: 'fit-content', padding: '0 24px', height: 44, borderRadius: 12, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Save size={15} />
            <span>{isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingManager;
