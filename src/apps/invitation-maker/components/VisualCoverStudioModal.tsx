import React, { useState } from 'react';
import { 
  X, Sparkles, Check, Image as ImageIcon, Sliders, Layout, Type, 
  Eye, Calendar, UserCheck, RefreshCw, Palette
} from 'lucide-react';
import { 
  InvitationData, CoverConfig, BACKGROUND_GRADIENTS 
} from '../invitationData';

interface VisualCoverStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvitationData;
  onSave: (updated: InvitationData) => void;
  ImageUploadField: React.ComponentType<{
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }>;
}

export const VisualCoverStudioModal: React.FC<VisualCoverStudioModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  ImageUploadField
}) => {
  if (!isOpen) return null;

  const currentCover: CoverConfig = data.coverConfig || {
    style: 'classic',
    title: `${data.groomName} & ${data.brideName}`,
    subtitle: data.eventDate ? new Date(data.eventDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Save the Date',
    badge: 'The Wedding Of',
    openButtonText: 'Buka Undangan',
    guestLabel: 'Kepada Yth. Bapak/Ibu/Saudara/i:',
    bgType: 'theme',
    bgColor: '#09090e',
    bgGradient: BACKGROUND_GRADIENTS[0].gradient,
    bgImage: data.coverPhoto || '',
    bgOpacity: 0.5,
    align: 'center',
    showCountdown: false,
    showGuestName: true
  };

  const [cover, setCover] = useState<CoverConfig>(currentCover);
  const [activeTab, setActiveTab] = useState<'layout' | 'text' | 'background'>('layout');

  const updateCover = (partial: Partial<CoverConfig>) => {
    const updated = { ...cover, ...partial };
    setCover(updated);
    onSave({
      ...data,
      coverConfig: updated
    });
  };

  const COVER_PRESETS: Array<{
    id: NonNullable<CoverConfig['style']>;
    name: string;
    desc: string;
    badge: string;
    icon: string;
  }> = [
    {
      id: 'classic',
      name: 'Classic Romance',
      desc: 'Sentuhan elegan timeless, tipografi bersahaja dengan aksen klasik.',
      badge: 'Favorit',
      icon: '💍'
    },
    {
      id: 'modern',
      name: 'Modern Minimalist',
      desc: 'Clean, kontemporer dengan tipografi sans-serif tegas & rapi.',
      badge: 'Populer',
      icon: '✨'
    },
    {
      id: 'poster',
      name: 'Editorial Poster',
      desc: 'Tata letak layaknya cover majalah eksklusif dengan tipografi artistik.',
      badge: 'Artistik',
      icon: '📰'
    },
    {
      id: 'luxury_arch',
      name: 'Royal Arch Gold',
      desc: 'Kubah mewah bernuansa istana dengan aksen ornamen berkelas.',
      badge: 'Mewah',
      icon: '👑'
    },
    {
      id: 'hero_full',
      name: 'Cinematic Hero',
      desc: 'Foto cover megah fullscreen dengan kartu kaca informasi di bawah.',
      badge: 'Visual HD',
      icon: '🎬'
    }
  ];

  const COVER_IMAGE_PRESETS = [
    { name: 'Romantic Botanical', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Luxury Warm Lights', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Golden Sunset Silhouette', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Emerald Forest Mist', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80' }
  ];

  const SOLID_PALETTES = [
    { name: 'Obsidian Night', color: '#09090e' },
    { name: 'Deep Navy', color: '#070f1e' },
    { name: 'Emerald Velvet', color: '#081711' },
    { name: 'Burgundy Rose', color: '#1a0910' },
    { name: 'Warm Charcoal', color: '#131317' },
    { name: 'Pure Onyx', color: '#000000' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          background: '#121218',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(236,72,153,0.15)',
          animation: 'modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(236,72,153,0.3)'
              }}
            >
              <Layout size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                  Studio Desain Cover Pembuka
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: 'rgba(236,72,153,0.15)',
                    color: '#f472b6',
                    border: '1px solid rgba(236,72,153,0.3)'
                  }}
                >
                  Visual Studio
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Kustomisasi gerbang sambutan undangan: pilih preset layout, tata teks, dan visual backdrop.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigator */}
        <div
          style={{
            display: 'flex',
            padding: '12px 24px',
            gap: '8px',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {[
            { id: 'layout', label: '1. Gaya & Layout', icon: Layout },
            { id: 'text', label: '2. Teks & Tombol', icon: Type },
            { id: 'background', label: '3. Background Cover', icon: ImageIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #ec4899' : '1px solid transparent',
                  background: isActive ? 'rgba(236,72,153,0.15)' : 'transparent',
                  color: isActive ? '#f472b6' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* TAB 1: LAYOUT & GAYA */}
          {activeTab === 'layout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#f1f5f9', fontWeight: 600 }}>
                  Pilih Preset Gaya Cover
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Setiap gaya menghadirkan karakter visual istimewa saat tamu pertama kali membuka website undangan.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '12px'
                }}
              >
                {COVER_PRESETS.map((preset) => {
                  const isSelected = (cover.style || 'classic') === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => updateCover({ style: preset.id })}
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '24px' }}>{preset.icon}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: isSelected ? '#ec4899' : 'rgba(255,255,255,0.08)',
                            color: '#fff'
                          }}
                        >
                          {preset.badge}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>
                        {preset.name}
                      </div>

                      <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                        {preset.desc}
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ec4899',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Check size={12} color="#fff" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cover Alignment & Extras */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '8px'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>
                  Pengaturan Tampilan Tambahan
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                      Tampilkan Nama Tamu di Cover
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Menampilkan kartu salam personal untuk tamu undangan (dari link ?to=NamaTamu).
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cover.showGuestName !== false}
                    onChange={(e) => updateCover({ showGuestName: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#ec4899', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                      Tampilkan Countdown Waktu di Cover
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Menghitung mundur hari menuju acara langsung di halaman cover depan.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cover.showCountdown === true}
                    onChange={(e) => updateCover({ showCountdown: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#ec4899', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEKS & TOMBOL */}
          {activeTab === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#f1f5f9', fontWeight: 600 }}>
                  Teks Cover & Tombol Aksi
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Sesuaikan kata-kata sambutan, nama mempelai / acara, dan tombol pembuka.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Label Pembuka / Badge Atas
                  </label>
                  <input
                    type="text"
                    value={cover.badge || ''}
                    onChange={(e) => updateCover({ badge: e.target.value })}
                    placeholder="Contoh: The Wedding Celebration Of"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Judul Utama Cover (Nama Mempelai / Acara)
                  </label>
                  <input
                    type="text"
                    value={cover.title || ''}
                    onChange={(e) => updateCover({ title: e.target.value })}
                    placeholder="Contoh: Romeo & Juliet"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Sub-judul / Tanggal Acara
                  </label>
                  <input
                    type="text"
                    value={cover.subtitle || ''}
                    onChange={(e) => updateCover({ subtitle: e.target.value })}
                    placeholder="Contoh: Sabtu, 28 Oktober 2026"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Label Tamu Undangan
                    </label>
                    <input
                      type="text"
                      value={cover.guestLabel || ''}
                      onChange={(e) => updateCover({ guestLabel: e.target.value })}
                      placeholder="Kepada Yth. Bapak/Ibu/Saudara/i:"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Teks Tombol Buka Undangan
                    </label>
                    <input
                      type="text"
                      value={cover.openButtonText || ''}
                      onChange={(e) => updateCover({ openButtonText: e.target.value })}
                      placeholder="Buka Undangan"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKGROUND COVER */}
          {activeTab === 'background' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#f1f5f9', fontWeight: 600 }}>
                  Backdrop & Foto Cover
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Atur latar belakang khusus untuk gerbang pembuka (bisa foto prewed, gradasi, atau warna tema).
                </p>
              </div>

              {/* Source Mode */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '4px',
                  borderRadius: '12px'
                }}
              >
                {[
                  { id: 'theme', label: 'Ikuti Tema' },
                  { id: 'image', label: 'Foto / Gambar' },
                  { id: 'gradient', label: 'Gradasi Mewah' },
                  { id: 'color', label: 'Warna Solid' }
                ].map((m) => {
                  const isActive = (cover.bgType || 'theme') === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => updateCover({ bgType: m.id as any })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isActive ? '#ec4899' : 'transparent',
                        color: isActive ? '#fff' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* FOTO / GAMBAR */}
              {cover.bgType === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <ImageUploadField
                    label="Unggah Foto Cover Khusus"
                    value={cover.bgImage || ''}
                    onChange={(url) => updateCover({ bgImage: url })}
                    placeholder="URL gambar atau unggah file foto..."
                  />

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                      Atau Pilih Preset Gambar Estetik:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {COVER_IMAGE_PRESETS.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => updateCover({ bgImage: item.url })}
                          style={{
                            height: '60px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            border: cover.bgImage === item.url ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <img
                            src={item.url}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#fff',
                              padding: '4px',
                              textAlign: 'center'
                            }}
                          >
                            {item.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Darken overlay slider */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sliders size={14} /> Kegelapan Lapisan Overlay (Darken)
                      </span>
                      <span style={{ fontWeight: 700, color: '#ec4899' }}>
                        {Math.round((cover.bgOpacity ?? 0.5) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={cover.bgOpacity ?? 0.5}
                      onChange={(e) => updateCover({ bgOpacity: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              {/* GRADASI MEWAH */}
              {cover.bgType === 'gradient' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                    Pilih Palet Gradasi Mewah:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {BACKGROUND_GRADIENTS.map((g) => {
                      const isSel = cover.bgGradient === g.gradient;
                      return (
                        <div
                          key={g.id}
                          onClick={() => updateCover({ bgGradient: g.gradient })}
                          style={{
                            height: '64px',
                            borderRadius: '12px',
                            background: g.gradient,
                            border: isSel ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 14px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <span>{g.name}</span>
                          {isSel && <Check size={16} color="#ec4899" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* WARNA SOLID */}
              {cover.bgType === 'color' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                    Pilih Palet Warna Gelap Elegan:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {SOLID_PALETTES.map((p) => {
                      const isSel = cover.bgColor === p.color;
                      return (
                        <div
                          key={p.color}
                          onClick={() => updateCover({ bgColor: p.color })}
                          style={{
                            padding: '10px',
                            borderRadius: '10px',
                            background: p.color,
                            border: isSel ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>{p.name}</span>
                          {isSel && <Check size={14} color="#ec4899" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Perubahan langsung diterapkan secara realtime di layar visual pratinjau.
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(236,72,153,0.35)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Selesai Desain Cover
          </button>
        </div>
      </div>
    </div>
  );
};
