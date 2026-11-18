import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, MessageSquare, Plus, Trash2, Copy, Check, Send, 
  ExternalLink, Download, Upload, Search, Lock, Unlock, 
  X, CheckCircle2, QrCode, Calendar, Sparkles, LogOut, Heart
} from 'lucide-react';
import { 
  InvitationData, Guest, RSVP,
  getInvitationBySlug, getAllInvitations, saveInvitation,
  parseGuestCsv, exportGuestCsv
} from '../apps/invitation-maker/invitationData';

export default function ClientInvitationAdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Active Tab: guests vs rsvps
  const [activeTab, setActiveTab] = useState<'guests' | 'rsvps'>('guests');

  // Guest list state
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestCategory, setNewGuestCategory] = useState('VIP');
  const [newGuestQuota, setNewGuestQuota] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'unsent' | 'checked_in'>('all');
  const [copiedName, setCopiedName] = useState<string | null>(null);

  // CSV Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Load invitation
  useEffect(() => {
    if (!slug) return;
    const inv = getInvitationBySlug(slug) || getAllInvitations().find(i => i.id === slug);
    if (inv) {
      setInvitation(inv);
      // Check session
      const authKey = `client_admin_auth_${inv.id}`;
      if (sessionStorage.getItem(authKey) === 'true') {
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, [slug]);

  // Handle Password Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    const correct = (invitation.clientAdminPassword || 'sumr').trim();
    if (passwordInput.trim() === correct) {
      setIsAuthenticated(true);
      setPasswordError(false);
      sessionStorage.setItem(`client_admin_auth_${invitation.id}`, 'true');
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    if (invitation) {
      sessionStorage.removeItem(`client_admin_auth_${invitation.id}`);
    }
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const handleSaveData = (updated: InvitationData) => {
    setInvitation(updated);
    saveInvitation(updated);
  };

  // Guest actions
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim() || !invitation) return;
    const code = `QR-${(invitation.slug || 'INV').toUpperCase().slice(0, 6)}-${Math.floor(Math.random() * 8999 + 1000)}`;
    const newGuest: Guest = {
      id: `g-${Date.now()}`,
      name: newGuestName.trim(),
      category: newGuestCategory,
      sent: false,
      qrSecretCode: code,
      paxQuota: newGuestQuota,
      hasCheckedIn: false
    };
    const updated = {
      ...invitation,
      guests: [newGuest, ...(invitation.guests || [])]
    };
    handleSaveData(updated);
    setNewGuestName('');
  };

  const handleDeleteGuest = (id: string) => {
    if (!invitation) return;
    const updated = {
      ...invitation,
      guests: invitation.guests.filter(g => g.id !== id)
    };
    handleSaveData(updated);
  };

  const handleToggleSent = (id: string) => {
    if (!invitation) return;
    const updated = {
      ...invitation,
      guests: invitation.guests.map(g => g.id === id ? { ...g, sent: !g.sent } : g)
    };
    handleSaveData(updated);
  };

  const handleToggleCheckIn = (id: string) => {
    if (!invitation) return;
    const updated = {
      ...invitation,
      guests: invitation.guests.map(g => {
        if (g.id === id) {
          const willCheckIn = !g.hasCheckedIn;
          return {
            ...g,
            hasCheckedIn: willCheckIn,
            checkedInAt: willCheckIn ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : undefined
          };
        }
        return g;
      })
    };
    handleSaveData(updated);
  };

  const handleExportCsv = () => {
    if (!invitation) return;
    exportGuestCsv(invitation.guests || []);
  };

  const handleImportCsv = () => {
    if (!csvText.trim() || !invitation) return;
    const parsed = parseGuestCsv(csvText, invitation.slug);
    if (parsed.length > 0) {
      handleSaveData({
        ...invitation,
        guests: [...parsed, ...(invitation.guests || [])]
      });
      setCsvText('');
      setShowCsvModal(false);
    }
  };

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/invitation/${invitation?.slug || slug}` : '';

  const getWaMessage = (guestName: string) => {
    const link = `${publicUrl}?to=${encodeURIComponent(guestName)}`;
    return `Yth. ${guestName},\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri acara kami:\n\n*${invitation?.title || 'Undangan Resmi'}*\n\nBerikut tautan undangan digital Anda:\n${link}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nTerima kasih.`;
  };

  const handleCopyWaText = (guestName: string) => {
    const text = getWaMessage(guestName);
    navigator.clipboard.writeText(text);
    setCopiedName(guestName);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const handleOpenWa = (guestName: string, phone?: string) => {
    const text = encodeURIComponent(getWaMessage(guestName));
    const targetPhone = phone ? phone.replace(/\D/g, '') : '';
    const url = targetPhone ? `https://wa.me/${targetPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Memuat portal undangan...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 400, background: '#13141f', padding: '36px 28px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>Undangan Tidak Ditemukan</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 20px' }}>
            Tautan pengelola undangan digital yang Anda akses tidak terdaftar atau telah diubah.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '10px 20px', borderRadius: 99, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // ── PASSWORD GATE (LOGIN SCREEN) ──
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #141829 0%, #08090d 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(18, 20, 31, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.1)',
          borderRadius: 28,
          padding: '40px 30px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#3b82f6',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <Lock size={24} />
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3b82f6', marginBottom: 4 }}>
            PORTAL PENGELOLA UNDANGAN
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 8px', color: '#ffffff' }}>
            {invitation.title}
          </h2>
          <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px' }}>
            Masukkan kata sandi pengelola untuk membuka buku tamu, mengirim tautan WhatsApp, dan melihat RSVP.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <input
                type="password"
                autoFocus
                required
                placeholder="Masukkan Sandi / PIN..."
                value={passwordInput}
                onChange={e => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 14,
                  background: 'rgba(0,0,0,0.3)',
                  border: passwordError ? '1.5px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  fontSize: 15,
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {passwordError && (
                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginTop: 6, display: 'block' }}>
                  Sandi salah. Silakan periksa kembali atau hubungi pengelola.
                </span>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 99,
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)'
              }}
            >
              <Unlock size={15} /> Masuk ke Portal Tamu
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11.5, color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <ExternalLink size={12} /> Lihat Halaman Undangan Tamu
            </a>
          </div>
        </div>
      </div>
    );
  }

  // RSVP statistics
  const totalHadir = (invitation.rsvps || []).filter(r => r.attendance === 'hadir').reduce((sum, r) => sum + (r.count || 1), 0);
  const totalRagu = (invitation.rsvps || []).filter(r => r.attendance === 'ragu').length;
  const totalTidakHadir = (invitation.rsvps || []).filter(r => r.attendance === 'tidak_hadir').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090a10',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ── TOP NAV BAR (STANDALONE CLIENT HEADER) ── */}
      <header style={{
        padding: '16px 24px',
        background: 'rgba(15, 17, 26, 0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3b82f6' }}>
              {invitation.categoryBadge || 'OFFICIAL INVITATION'}
            </div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#ffffff' }}>
              {invitation.title}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '7px 14px',
              borderRadius: 99,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: 11.5,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ExternalLink size={12} /> Buka Undangan Publik
          </a>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '7px 14px',
              borderRadius: 99,
              background: 'rgba(255,255,255,0.06)',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 11.5,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Keluar dari portal pengelola"
          >
            <LogOut size={13} /> Kunci
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 1100, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, background: '#121422', padding: 4, borderRadius: 99, border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content', marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setActiveTab('guests')}
            style={{
              padding: '8px 20px',
              borderRadius: 99,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeTab === 'guests' ? '#3b82f6' : 'transparent',
              color: activeTab === 'guests' ? '#fff' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Users size={14} /> Buku Tamu ({(invitation.guests || []).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rsvps')}
            style={{
              padding: '8px 20px',
              borderRadius: 99,
              border: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              background: activeTab === 'rsvps' ? '#3b82f6' : 'transparent',
              color: activeTab === 'rsvps' ? '#fff' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <MessageSquare size={14} /> RSVP & Doa ({(invitation.rsvps || []).length})
          </button>
        </div>

        {/* ── TAB 1: BUKU TAMU & KIRIM WHATSAPP ── */}
        {activeTab === 'guests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={S_metricCard}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Total Tamu Terdaftar</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>{(invitation.guests || []).length} <span style={{ fontSize: 12, fontWeight: 600 }}>Orang/Instansi</span></div>
              </div>
              <div style={S_metricCard}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Sudah Terkirim</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', marginTop: 4 }}>{(invitation.guests || []).filter(g => g.sent).length} <span style={{ fontSize: 12, fontWeight: 600 }}>Tamu</span></div>
              </div>
              <div style={S_metricCard}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Hadir Check-In</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{(invitation.guests || []).filter(g => g.hasCheckedIn).length} <span style={{ fontSize: 12, fontWeight: 600 }}>Tamu</span></div>
              </div>
            </div>

            {/* Top Toolbar: Search & CSV */}
            <div style={{
              background: '#121422',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 10 }} />
                <input
                  type="text"
                  placeholder="Cari nama tamu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...S_input, paddingLeft: 34 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Download size={13} /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowCsvModal(true)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 10,
                    background: '#3b82f6',
                    border: 'none',
                    color: '#fff',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Upload size={13} /> Import CSV Tamu
                </button>
              </div>
            </div>

            {/* Form Tambah Tamu */}
            <form onSubmit={handleAddGuest} style={{ background: '#121422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 18 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 800, color: '#fff' }}>
                Tambah Tamu Undangan Baru
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  style={{ ...S_input, flex: '1 1 240px' }}
                  placeholder="Contoh: Bapak Ir. Bambang & Keluarga"
                  value={newGuestName}
                  onChange={e => setNewGuestName(e.target.value)}
                  required
                />
                <select
                  style={{ ...S_input, width: 130 }}
                  value={newGuestCategory}
                  onChange={e => setNewGuestCategory(e.target.value)}
                >
                  <option value="VIP">VIP</option>
                  <option value="Reguler">Reguler</option>
                  <option value="Keluarga">Keluarga</option>
                  <option value="Teman">Teman</option>
                  <option value="Media/Pers">Media / Pers</option>
                </select>
                <select
                  style={{ ...S_input, width: 100 }}
                  value={newGuestQuota}
                  onChange={e => setNewGuestQuota(Number(e.target.value))}
                >
                  <option value={1}>1 Pax</option>
                  <option value={2}>2 Pax</option>
                  <option value={3}>3 Pax</option>
                  <option value={4}>4 Pax</option>
                  <option value={5}>5 Pax</option>
                </select>
                <button
                  type="submit"
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '0 18px',
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Plus size={15} /> Tambah
                </button>
              </div>
            </form>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {[
                { id: 'all', label: 'Semua Tamu', count: (invitation.guests || []).length },
                { id: 'sent', label: 'Sudah Dikirim', count: (invitation.guests || []).filter(g => g.sent).length },
                { id: 'unsent', label: 'Belum Dikirim', count: (invitation.guests || []).filter(g => !g.sent).length },
                { id: 'checked_in', label: 'Hadir Check-In', count: (invitation.guests || []).filter(g => g.hasCheckedIn).length }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 99,
                    background: filterStatus === f.id ? '#3b82f6' : '#121422',
                    color: filterStatus === f.id ? '#fff' : '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 11,
                    fontWeight: 750,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Table of Guests */}
            <div style={{ background: '#121422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 18, overflowX: 'auto' }}>
              {(() => {
                const filtered = (invitation.guests || []).filter(g => {
                  const m = g.name.toLowerCase().includes(searchQuery.toLowerCase());
                  if (!m) return false;
                  if (filterStatus === 'sent') return g.sent;
                  if (filterStatus === 'unsent') return !g.sent;
                  if (filterStatus === 'checked_in') return g.hasCheckedIn;
                  return true;
                });

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#94a3b8', fontSize: 11 }}>
                        <th style={{ padding: '8px 10px' }}>Nama Tamu</th>
                        <th style={{ padding: '8px 10px' }}>Kategori / Kuota</th>
                        <th style={{ padding: '8px 10px' }}>Kode QR</th>
                        <th style={{ padding: '8px 10px' }}>Status Kirim</th>
                        <th style={{ padding: '8px 10px' }}>Hari-H Check-In</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Aksi WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8' }}>
                            Tidak ada tamu yang cocok dengan pencarian / filter.
                          </td>
                        </tr>
                      ) : (
                        filtered.map(g => {
                          const isCopied = copiedName === g.name;
                          return (
                            <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px', fontWeight: 700, color: '#fff' }}>{g.name}</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 700, marginRight: 6 }}>{g.category}</span>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>{g.paxQuota || 2} Pax</span>
                              </td>
                              <td style={{ padding: '10px', fontFamily: 'monospace', color: '#60a5fa', fontSize: 11 }}>{g.qrSecretCode}</td>
                              <td style={{ padding: '10px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSent(g.id)}
                                  style={{
                                    background: g.sent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                    color: g.sent ? '#10b981' : '#94a3b8',
                                    border: 'none',
                                    padding: '2px 8px',
                                    borderRadius: 99,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {g.sent ? '✓ Terkirim' : 'Belum'}
                                </button>
                              </td>
                              <td style={{ padding: '10px' }}>
                                {g.hasCheckedIn ? (
                                  <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: 10, fontWeight: 800 }}>
                                    ✓ Hadir ({g.checkedInAt || 'Hari-H'})
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCheckIn(g.id)}
                                    style={{
                                      background: 'rgba(255,255,255,0.06)',
                                      color: '#fff',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      padding: '2px 8px',
                                      borderRadius: 99,
                                      fontSize: 10,
                                      fontWeight: 750,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Check-In
                                  </button>
                                )}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyWaText(g.name)}
                                    style={{
                                      background: isCopied ? '#10b981' : 'rgba(255,255,255,0.06)',
                                      color: isCopied ? '#fff' : '#f8fafc',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      borderRadius: 6,
                                      padding: '4px 8px',
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    {isCopied ? <Check size={11} /> : <Copy size={11} />} Salin WA
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWa(g.name, g.phone)}
                                    style={{
                                      background: '#25D366',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '4px 8px',
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <Send size={11} /> WA
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGuest(g.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </div>

          </div>
        )}

        {/* ── TAB 2: RSVP & UCAPAN DOA ── */}
        {activeTab === 'rsvps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 16, padding: '14px 18px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>Pasti Hadir</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', marginTop: 4 }}>{totalHadir} <span style={{ fontSize: 12, fontWeight: 600 }}>Tamu</span></div>
              </div>
              <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 16, padding: '14px 18px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#eab308', textTransform: 'uppercase' }}>Masih Ragu</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#eab308', marginTop: 4 }}>{totalRagu} <span style={{ fontSize: 12, fontWeight: 600 }}>Konfirmasi</span></div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 16, padding: '14px 18px' }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Berhalangan</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444', marginTop: 4 }}>{totalTidakHadir} <span style={{ fontSize: 12, fontWeight: 600 }}>Orang</span></div>
              </div>
            </div>

            {/* List of Messages */}
            <div style={{ background: '#121422', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                Daftar Doa & Ucapan Tamu ({(invitation.rsvps || []).length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(invitation.rsvps || []).map(r => (
                  <div key={r.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 12.5, color: '#fff' }}>{r.name}</strong>
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 99,
                          background: r.attendance === 'hadir' ? 'rgba(16, 185, 129, 0.15)' : r.attendance === 'ragu' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: r.attendance === 'hadir' ? '#10b981' : r.attendance === 'ragu' ? '#eab308' : '#ef4444'
                        }}>
                          {r.attendance === 'hadir' ? `Hadir (${r.count})` : r.attendance === 'ragu' ? 'Ragu' : 'Absen'}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{r.createdAt}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5 }}>
                      "{r.message}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── MODAL IMPORT CSV ── */}
      {showCsvModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#121422',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            maxWidth: 500,
            width: '100%',
            padding: 22,
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={18} color="#3b82f6" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>
                  Import Tamu dari CSV
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
              Salin dan tempel data daftar tamu Anda dari spreadsheet (Excel/Google Sheets) dengan format:<br />
              <strong style={{ color: '#fff' }}>Nama Tamu, No WhatsApp, Kategori, Kuota Pax</strong>
            </p>

            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="Tempel baris CSV di sini..."
              style={{
                width: '100%',
                minHeight: 160,
                borderRadius: 14,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '12px 14px',
                fontSize: 12,
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical',
                marginBottom: 16
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                disabled={!csvText.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: csvText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: csvText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Import Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const S_metricCard: React.CSSProperties = {
  background: '#121422',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: '14px 18px'
};

const S_input: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.3)',
  color: '#fff',
  fontSize: 12.5,
  outline: 'none',
  boxSizing: 'border-box'
};
