import React from 'react';
import { 
  X, Plus, Sparkles, Heart, Users, Clock, Calendar, 
  ImageIcon, Film, CreditCard, MessageSquare, MapPin, 
  FileText, Link2, Minus, Layout, Check
} from 'lucide-react';
import { CustomBlock } from '../invitationData';

export interface WidgetPresetItem {
  id: string;
  name: string;
  category: 'utama' | 'konten' | 'interaksi' | 'dekorasi';
  description: string;
  icon: any;
  color: string;
  createBlock?: () => CustomBlock;
}

export const WIDGET_CATALOG: WidgetPresetItem[] = [
  {
    id: 'cover',
    name: 'Sampul & Judul Acara',
    category: 'utama',
    description: 'Header pembuka dengan nama acara, tanggal, dan tombol buka undangan.',
    icon: Layout,
    color: '#ec4899'
  },
  {
    id: 'persons',
    name: 'Tokoh & Pemateri / Mempelai',
    category: 'utama',
    description: 'Profil pemateri seminar, keynote speaker, atau pasangan mempelai (bisa banyak orang).',
    icon: Users,
    color: '#3b82f6'
  },
  {
    id: 'countdown',
    name: 'Hitung Mundur Hari-H',
    category: 'utama',
    description: 'Jam countdown realtime menuju tanggal dan waktu acara.',
    icon: Clock,
    color: '#f59e0b'
  },
  {
    id: 'events',
    name: 'Jadwal & Agenda Acara',
    category: 'utama',
    description: 'Rincian sesi acara, waktu, nama venue, dan rute lokasi.',
    icon: Calendar,
    color: '#10b981'
  },
  {
    id: 'quote',
    name: 'Kutipan & Ayat Doa',
    category: 'konten',
    description: 'Kutipan suci, doa restu, kata mutiara, atau motto acara.',
    icon: Sparkles,
    color: '#8b5cf6'
  },
  {
    id: 'story',
    name: 'Timeline & Cerita Perjalanan',
    category: 'konten',
    description: 'Kisah cinta atau milestone perjalanan dari awal hingga sekarang.',
    icon: Heart,
    color: '#ec4899'
  },
  {
    id: 'gallery',
    name: 'Galeri Foto & Dokumentasi',
    category: 'konten',
    description: 'Kumpulan foto dokumentasi momen berharga dengan fitur popup lightbox.',
    icon: ImageIcon,
    color: '#06b6d4'
  },
  {
    id: 'video',
    name: 'Video Teaser / Streaming',
    category: 'konten',
    description: 'Sematkan video YouTube / Vimeo untuk teaser atau siaran langsung.',
    icon: Film,
    color: '#ef4444'
  },
  {
    id: 'gifts',
    name: 'Amplop Digital & Kado QRIS',
    category: 'interaksi',
    description: 'Nomor rekening bank, nama penerima, QRIS, dan tombol salin instan.',
    icon: CreditCard,
    color: '#10b981'
  },
  {
    id: 'rsvp',
    name: 'Buku Tamu & Form RSVP',
    category: 'interaksi',
    description: 'Form konfirmasi kehadiran tamu beserta kolom kirim pesan & doa.',
    icon: MessageSquare,
    color: '#3b82f6'
  },
  {
    id: 'map',
    name: 'Peta Lokasi Google Maps',
    category: 'konten',
    description: 'Peta venue interaktif lengkap dengan alamat dan petunjuk rute jalan.',
    icon: MapPin,
    color: '#f97316',
    createBlock: () => ({
      id: `block-map-${Date.now()}`,
      type: 'map',
      title: 'Lokasi & Petunjuk Arah',
      subtitle: 'Ketuk tombol di bawah untuk membuka navigasi rute Google Maps langsung.',
      content: 'The Grand Ballroom Sakura, Jl. Sudirman Kav. 45, Jakarta Selatan',
      buttonText: 'Buka Petunjuk Arah Google Maps',
      buttonUrl: 'https://maps.google.com',
      align: 'center',
      enabled: true
    })
  },
  {
    id: 'custom_text',
    name: 'Teks Bebas / Pengumuman & Dresscode',
    category: 'konten',
    description: 'Blok tulisan bebas untuk informasi dresscode, panduan parkir, atau sambutan.',
    icon: FileText,
    color: '#a855f7',
    createBlock: () => ({
      id: `block-text-${Date.now()}`,
      type: 'custom_text',
      title: 'Dress Code & Panduan Acara',
      subtitle: 'Informasi Penting Bagi Tamu Undangan',
      content: 'Diharapkan mengenakan busana bernuansa formal / batik / pastel. Mohon hadir 15 menit sebelum acara dimulai untuk registrasi kedatangan.',
      align: 'center',
      enabled: true
    })
  },
  {
    id: 'custom_button',
    name: 'Tombol Tautan Kustom / Link Khusus',
    category: 'interaksi',
    description: 'Tombol khusus untuk join link Zoom, download brosur PDF, atau beli tiket.',
    icon: Link2,
    color: '#0ea5e9',
    createBlock: () => ({
      id: `block-btn-${Date.now()}`,
      type: 'custom_button',
      title: 'Tautan Resmi Acara',
      subtitle: 'Akses ruang online atau dokumen panduan acara',
      buttonText: 'Gabung Live Zoom Meeting',
      buttonUrl: 'https://zoom.us',
      icon: 'video',
      align: 'center',
      enabled: true
    })
  },
  {
    id: 'divider',
    name: 'Ornamen Pemisah / Garis Hiasan',
    category: 'dekorasi',
    description: 'Pemisah estetis antar sesi dengan ornamen bintang atau garis keemasan.',
    icon: Minus,
    color: '#eab308',
    createBlock: () => ({
      id: `block-div-${Date.now()}`,
      type: 'divider',
      title: 'divider',
      enabled: true
    })
  }
];

interface VisualWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWidget: (widget: WidgetPresetItem) => void;
  activeWidgets?: Record<string, boolean>;
}

export const VisualWidgetModal: React.FC<VisualWidgetModalProps> = ({
  isOpen,
  onClose,
  onSelectWidget,
  activeWidgets = {}
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('semua');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  if (!isOpen) return null;

  const categories = [
    { id: 'semua', label: 'Semua Widget' },
    { id: 'utama', label: 'Bagian Utama' },
    { id: 'konten', label: 'Konten & Media' },
    { id: 'interaksi', label: 'Interaksi & Tamu' },
    { id: 'dekorasi', label: 'Dekorasi' }
  ];

  const filteredWidgets = WIDGET_CATALOG.filter(w => {
    const matchCat = selectedCategory === 'semua' || w.category === selectedCategory;
    const matchQuery = !searchQuery || 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
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
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          background: 'var(--cms-card-bg, #111116)',
          border: '1.5px solid var(--glass-border, rgba(255,255,255,0.14))',
          borderRadius: 24,
          boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 24px rgba(236,72,153,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 22px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.1))'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text, #fff)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} color="var(--cms-accent, #ec4899)" /> Tambah Widget Ke Undangan
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
              Pilih widget atau bagian yang ingin Anda tambahkan langsung ke undangan visual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cms-text, #fff)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          padding: '12px 22px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <input
            type="text"
            placeholder="Cari widget (misal: Countdown, Pemateri, Peta, Dresscode)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 12,
              border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
              background: 'var(--cms-bg, #0a0a0f)',
              color: 'var(--cms-text, #fff)',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: selectedCategory === c.id ? '1.5px solid var(--cms-accent, #ec4899)' : '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                  background: selectedCategory === c.id ? 'rgba(236,72,153,0.16)' : 'transparent',
                  color: selectedCategory === c.id ? 'var(--cms-accent, #ec4899)' : 'var(--cms-text-muted, #94a3b8)'
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Widget Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
          boxSizing: 'border-box'
        }}>
          {filteredWidgets.map(w => {
            const Icon = w.icon;
            const isEnabled = activeWidgets[w.id];

            return (
              <div
                key={w.id}
                onClick={() => {
                  onSelectWidget(w);
                  onClose();
                }}
                style={{
                  background: 'var(--cms-bg, #0b0b10)',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                  borderRadius: 16,
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = w.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${w.color}25`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--glass-border, rgba(255,255,255,0.1))';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: `${w.color}20`,
                  color: w.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: 'var(--cms-text, #fff)' }}>
                      {w.name}
                    </strong>
                    {isEnabled && (
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: '#10b981',
                        background: 'rgba(16,185,129,0.15)',
                        padding: '1px 6px',
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        <Check size={10} /> Aktif
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
                    {w.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
