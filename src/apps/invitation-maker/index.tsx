import React, { useState, useEffect } from 'react';
import { 
  Mail, Settings, Eye, Sparkles, Plus, Copy, Check, ExternalLink, 
  Trash2, ArrowLeft, Calendar, Users, MessageSquare, Heart, Globe,
  Edit3, Share2, Palette, KeyRound, Building, Star, PartyPopper, Music, Ticket,
  CheckSquare, CreditCard, Image as ImageIcon
} from 'lucide-react';
import ClientView from './components/ClientView';
import AdminView from './components/AdminView';
import { 
  InvitationData, getAllInvitations, saveInvitation, 
  deleteInvitation, duplicateInvitation, createNewInvitation 
} from './invitationData';
import './styles.css';

export const config = {
  name: "Invitation Studio",
  color: "#ec4899",
  description: "Pembuat & Pengelola Multi-Undangan Digital Web Interaktif dengan RSVP & Link Publik.",
  iconData: null
};

export default function App() {
  const [invitations, setInvitations] = useState<InvitationData[]>(getAllInvitations);

  // Helper to resolve active invitation from pathname (/admin/invitation/:slug, /admin/undangan/:slug, /invitation/:slug/admin) or searchParams (?invId=... or ?invitation=...)
  const resolveInitialInvitationId = (list: InvitationData[]): string | null => {
    if (typeof window === 'undefined' || list.length === 0) return list[0]?.id || null;
    
    // 1. Check pathname: /admin/invitation/:slug, /admin/undangan/:slug, /invitation/:slug/admin
    const pathname = window.location.pathname;
    const match = pathname.match(/\/(?:admin\/)?(?:invitation|undangan)\/([^\/?#]+)/i);
    if (match && match[1]) {
      const slugOrId = decodeURIComponent(match[1]);
      const found = list.find(i => i.slug.toLowerCase() === slugOrId.toLowerCase() || i.id === slugOrId);
      if (found) return found.id;
    }

    // 2. Check query params: ?invId=... or ?invitation=... or ?slug=...
    const params = new URLSearchParams(window.location.search);
    const query = params.get('invId') || params.get('invitation') || params.get('slug');
    if (query) {
      const found = list.find(i => i.slug.toLowerCase() === query.toLowerCase() || i.id === query);
      if (found) return found.id;
    }

    // If on /admin/apps?app=invitation-maker explicitly without invId, show the list of invitations
    if (params.get('app') === 'invitation-maker' && !query && !match) {
      return null;
    }

    return list[0]?.id || null;
  };

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const list = getAllInvitations();
    return resolveInitialInvitationId(list);
  });

  const [activeTab, setActiveTab] = useState<'client' | 'admin'>('admin');
  const [adminSubTab, setAdminSubTab] = useState<'editor' | 'guests'>('editor');
  const [builderSection, setBuilderSection] = useState<'theme' | 'widgets' | 'media' | 'couple' | 'events' | 'gifts' | 'security'>('theme');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'public' | 'admin' | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'universal' | 'exhibition' | 'wedding' | 'birthday' | 'conference' | 'event'>('universal');

  const renderHeaderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'sparkles':
      case 'ring':
        return <Sparkles size={16} />;
      case 'building':
        return <Building size={16} />;
      case 'star':
        return <Star size={16} />;
      case 'cake':
        return <PartyPopper size={16} />;
      case 'calendar':
        return <Calendar size={16} />;
      case 'music':
        return <Music size={16} />;
      case 'ticket':
        return <Ticket size={16} />;
      case 'heart':
        return <Heart size={16} />;
      default:
        return <Mail size={16} />;
    }
  };

  const refreshList = () => {
    setInvitations(getAllInvitations());
  };

  const activeInv = invitations.find(i => i.id === selectedId) || (selectedId ? invitations[0] : null);

  const handleSelectInvitation = (id: string | null) => {
    setSelectedId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (id) {
        const inv = invitations.find(i => i.id === id);
        const slug = inv?.slug || id;
        url.pathname = `/admin/invitation/${slug}`;
        url.searchParams.set('app', 'invitation-maker');
        url.searchParams.set('invId', slug);
      } else {
        url.pathname = '/admin/apps';
        url.searchParams.set('app', 'invitation-maker');
        url.searchParams.delete('invId');
        url.searchParams.delete('invitation');
        url.searchParams.delete('slug');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Sync browser URL whenever active invitation changes
  useEffect(() => {
    if (selectedId && activeInv && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const expectedPath = `/admin/invitation/${activeInv.slug || activeInv.id}`;
      if (url.pathname !== expectedPath || url.searchParams.get('invId') !== (activeInv.slug || activeInv.id)) {
        url.pathname = expectedPath;
        url.searchParams.set('app', 'invitation-maker');
        url.searchParams.set('invId', activeInv.slug || activeInv.id);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [selectedId, activeInv?.slug, activeInv?.id]);

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener('porto_invitations_updated', handleUpdate);
    return () => window.removeEventListener('porto_invitations_updated', handleUpdate);
  }, []);

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createNewInvitation(newTitle.trim() || undefined, newEventType);
    refreshList();
    handleSelectInvitation(created.id);
    setActiveTab('admin');
    setIsCreatingNew(false);
    setNewTitle('');
    setNewEventType('universal');
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup = duplicateInvitation(id);
    refreshList();
    handleSelectInvitation(dup.id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (invitations.length <= 1) {
      alert('Minimal harus ada 1 undangan.');
      return;
    }
    if (confirm('Yakin ingin menghapus undangan ini?')) {
      deleteInvitation(id);
      const remaining = getAllInvitations();
      refreshList();
      if (selectedId === id) {
        handleSelectInvitation(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const handleCopyPublicLink = (slug: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/invitation/${slug || id}`;
    navigator.clipboard.writeText(url);
    setCopiedType('public');
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const handleCopyClientAdminLink = (slug: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/invitation/${slug || id}/admin`;
    navigator.clipboard.writeText(url);
    setCopiedType('admin');
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  return (
    <div style={{
      background: 'var(--cms-card-bg, #12141f)',
      color: 'var(--cms-text, #ffffff)',
      flex: 1,
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 24,
      overflow: 'visible',
      border: '1.5px solid var(--glass-border, rgba(255,255,255,0.08))',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      
      {/* ── TOP HEADER / TOOLBAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'var(--cms-card-bg, #12141f)',
        borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Left branding & back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => {
              if (selectedId) {
                handleSelectInvitation(null);
              } else {
                const url = new URL(window.location.href);
                url.searchParams.delete('app');
                url.searchParams.delete('invId');
                url.pathname = '/admin/apps';
                window.history.replaceState({}, '', url.toString());
                window.dispatchEvent(new CustomEvent('cms_navigate_apps_root'));
              }
            }}
            className="sidebar-icon-btn"
            style={{ width: 36, height: 36, borderRadius: 10 }}
            title={selectedId ? "Lihat Semua Undangan" : "Kembali ke Galeri Apps"}
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'rgba(236, 72, 153, 0.15)',
            color: '#ec4899',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {renderHeaderIcon(activeInv?.mainIcon)}
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #ffffff)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{selectedId && activeInv ? activeInv.title : 'Invitation Studio'}</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', fontWeight: 850 }}>
                {selectedId ? `${(activeInv?.categoryBadge || 'UNDANGAN').toUpperCase()}` : `${invitations.length} UNDANGAN`}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>
              {selectedId ? 'Kelola desain visual, widget, media & data tamu' : 'Buat & kelola multi-undangan digital'}
            </div>
          </div>
        </div>

        {/* Right Action buttons (Single unified navbar, icon-only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {selectedId && activeInv ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Salin Link Tamu (Icon Only) */}
              <button
                type="button"
                onClick={(e) => handleCopyPublicLink(activeInv.slug, activeInv.id, e)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: (copiedType === 'public' && copiedId === activeInv.id) ? '#10b981' : 'rgba(236, 72, 153, 0.12)',
                  color: (copiedType === 'public' && copiedId === activeInv.id) ? '#fff' : '#ec4899',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title={copiedType === 'public' && copiedId === activeInv.id ? 'Link Tamu Disalin!' : 'Salin Link Tamu'}
              >
                {(copiedType === 'public' && copiedId === activeInv.id) ? <Check size={14} /> : <Share2 size={14} />}
              </button>

              {/* Salin Link Portal Klien (Icon Only) */}
              <button
                type="button"
                onClick={(e) => handleCopyClientAdminLink(activeInv.slug, activeInv.id, e)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: (copiedType === 'admin' && copiedId === activeInv.id) ? '#10b981' : 'rgba(59, 130, 246, 0.12)',
                  color: (copiedType === 'admin' && copiedId === activeInv.id) ? '#fff' : '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title={copiedType === 'admin' && copiedId === activeInv.id ? 'Link Klien Disalin!' : 'Salin Link Portal Klien'}
              >
                {(copiedType === 'admin' && copiedId === activeInv.id) ? <Check size={14} /> : <KeyRound size={14} />}
              </button>

              {/* Buka Web di Tab Baru (Icon Only) */}
              <a
                href={`/invitation/${activeInv.slug || activeInv.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--cms-text)',
                  border: '1px solid var(--glass-border, #e2e8f0)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                title="Buka Undangan di Tab Baru"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            /* Jika sedang di daftar undangan utama */
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(236,72,153,0.3)',
                transition: 'all 0.2s ease'
              }}
              title="Buat Undangan Baru"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── MODAL: BUAT UNDANGAN BARU (UNIVERSAL TEMPLATE) ── */}
      {isCreatingNew && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'var(--cms-card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 6 }}>
              Buat Undangan Baru
            </h2>
            <p style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginBottom: 18 }}>
              Pilih kategori acara dan buat link undangan digital interaktif mandiri.
            </p>
            <form onSubmit={handleCreateNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 8 }}>
                  PILIH KATEGORI ACARA
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                  {[
                    { id: 'universal', label: 'Acara Umum' },
                    { id: 'exhibition', label: 'Pameran / Expo' },
                    { id: 'conference', label: 'Seminar / Event' },
                    { id: 'wedding', label: 'Pernikahan' },
                    { id: 'birthday', label: 'Ulang Tahun' },
                    { id: 'event', label: 'Grand Opening' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewEventType(t.id as any)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 12,
                        border: newEventType === t.id ? '2px solid #ec4899' : '1px solid var(--glass-border)',
                        background: newEventType === t.id ? 'rgba(236, 72, 153, 0.15)' : 'var(--cms-input-bg)',
                        color: newEventType === t.id ? '#ec4899' : 'var(--cms-text)',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 6 }}>
                  JUDUL ACARA / NAMA PENYELENGGARA
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={
                    newEventType === 'exhibition' ? 'Contoh: Modern Art & Design Expo 2026' :
                    newEventType === 'conference' ? 'Contoh: Creative Digital Summit 2026' :
                    newEventType === 'birthday' ? 'Contoh: The 25th Birthday Celebration' :
                    newEventType === 'wedding' ? 'Contoh: The Wedding of Arif & Nadia' :
                    'Contoh: Grand Opening Sumr Creative Studio'
                  }
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  style={{ padding: '8px 16px', borderRadius: 99, border: 'none', background: 'transparent', color: 'var(--cms-text-muted)', cursor: 'pointer', fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', borderRadius: 99, border: 'none', background: '#ec4899', color: '#fff', cursor: 'pointer', fontWeight: 850 }}
                >
                  Simpan & Buat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONTENT AREA (FULL HEIGHT) ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
        {selectedId && activeInv ? (
          <AdminView 
            invitation={activeInv}
            builderSection={builderSection}
            onBuilderSectionChange={setBuilderSection}
            onUpdate={updated => {
              saveInvitation(updated);
              refreshList();
            }}
            onBack={() => handleSelectInvitation(null)}
          />
        ) : (
          /* ── DAFTAR SEMUA UNDANGAN (INVITATION LIST) ── */
          <div style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1 }}>
            {/* Grid Kartu Undangan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
              {invitations.map(inv => {
                const totalHadir = (inv.rsvps || []).filter(r => r.attendance === 'hadir').reduce((sum, r) => sum + (r.count || 1), 0);

                const badgeText = inv.categoryBadge || (
                  inv.eventType === 'exhibition' ? 'EXHIBITION & EXPO' :
                  inv.eventType === 'conference' ? 'CONFERENCE & SUMMIT' :
                  inv.eventType === 'birthday' ? 'BIRTHDAY CELEBRATION' :
                  inv.eventType === 'wedding' ? 'THE WEDDING OF' : 'OFFICIAL INVITATION'
                );

                return (
                  <div
                    key={inv.id}
                    className="cms-card premium-glass"
                    style={{
                      borderRadius: 20,
                      overflow: 'hidden',
                      border: '1.5px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {/* Cover Header */}
                    <div style={{
                      height: 125,
                      position: 'relative',
                      background: inv.coverImage ? `url(${inv.coverImage}) center/cover no-repeat` : 'linear-gradient(135deg, #ec4899, #7c3aed)',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }} />
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, background: 'rgba(0,0,0,0.6)', color: '#fff', fontWeight: 800 }}>
                          Tema: {inv.theme}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                        <div style={{ fontSize: 10.5, color: '#ec4899', fontWeight: 850, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {badgeText}
                        </div>
                        <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 900, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {inv.title}
                        </h3>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} color="#ec4899" />
                          <span>{inv.eventDate || 'Belum diatur'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={13} color="#3b82f6" />
                          <span>{(inv.guests || []).length} Tamu</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare size={13} color="#10b981" />
                          <span>{totalHadir} Hadir</span>
                        </div>
                      </div>

                      {/* Client Admin Link Box (Private for client) */}
                      <div style={{
                        padding: '6px 10px',
                        borderRadius: 10,
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#3b82f6', fontWeight: 850 }}>Portal Klien: </span>
                          /invitation/{inv.slug}/admin
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopyClientAdminLink(inv.slug, inv.id, e)}
                          className="sidebar-icon-btn sm"
                          style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }}
                          title="Salin link portal khusus klien (Buku Tamu & RSVP)"
                        >
                          {(copiedType === 'admin' && copiedId === inv.id) ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>

                      {/* Public Guest Link Box */}
                      <div style={{
                        padding: '6px 10px',
                        borderRadius: 10,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#ec4899', fontWeight: 850 }}>Tamu: </span>
                          /invitation/{inv.slug}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPublicLink(inv.slug, inv.id, e)}
                          className="sidebar-icon-btn sm"
                          style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0 }}
                          title="Salin link publik tamu"
                        >
                          {(copiedType === 'public' && copiedId === inv.id) ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                        <button
                          onClick={() => {
                            handleSelectInvitation(inv.id);
                            setActiveTab('admin');
                          }}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            borderRadius: 12,
                            background: '#ec4899',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 850,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Edit3 size={13} /> Kelola Undangan
                        </button>

                        <button
                          onClick={() => {
                            handleSelectInvitation(inv.id);
                            setActiveTab('client');
                          }}
                          className="sidebar-icon-btn"
                          style={{ width: 36, height: 36, borderRadius: 12 }}
                          title="Pratinjau Undangan"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={(e) => handleDuplicate(inv.id, e)}
                          className="sidebar-icon-btn"
                          style={{ width: 36, height: 36, borderRadius: 12 }}
                          title="Duplikasi Undangan"
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          onClick={(e) => handleDelete(inv.id, e)}
                          className="sidebar-icon-btn danger"
                          style={{ width: 36, height: 36, borderRadius: 12 }}
                          title="Hapus Undangan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
