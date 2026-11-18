import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, Sparkles, Send, Tag, Share2, 
  Globe, CheckCircle2, FileText, Video, Image as ImageIcon, 
  Layers, Eye, Link, Trash2, ExternalLink
} from 'lucide-react';
import { createGoogleCalendarUrl } from '../../utils/calendarUtils';
import PillDatePicker from '../common/PillDatePicker';

export interface ContentPlanItem {
  id: string;
  title: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'blog' | 'twitter' | 'linkedin' | 'facebook';
  format: 'reels' | 'carousel' | 'single_post' | 'video' | 'article' | 'story';
  status: 'ide' | 'draft' | 'design' | 'review' | 'scheduled' | 'published';
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  caption?: string;
  hashtags?: string;
  mediaUrl?: string;
  holidayContext?: string;
  notes?: string;
  author?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ContentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ContentPlanItem) => void;
  onDelete?: (id: string) => void;
  initialData?: Partial<ContentPlanItem> | null;
  selectedDate?: string;
  holidayContext?: string;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#e1306c', icon: <Share2 size={13} /> },
  { id: 'tiktok', label: 'TikTok', color: '#00f2fe', icon: <Video size={13} /> },
  { id: 'youtube', label: 'YouTube', color: '#ff0000', icon: <Video size={13} /> },
  { id: 'blog', label: 'Blog / Web', color: '#3b82f6', icon: <Globe size={13} /> },
  { id: 'twitter', label: 'X / Twitter', color: '#1da1f2', icon: <Share2 size={13} /> },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', icon: <Share2 size={13} /> }
];

const FORMATS = [
  { id: 'reels', label: 'Reels / Shorts', icon: <Video size={13} /> },
  { id: 'carousel', label: 'Carousel (Slide)', icon: <Layers size={13} /> },
  { id: 'single_post', label: 'Single Post', icon: <ImageIcon size={13} /> },
  { id: 'article', label: 'Artikel Blog', icon: <FileText size={13} /> },
  { id: 'story', label: 'Story', icon: <Sparkles size={13} /> }
];

const STAGES = [
  { id: 'ide', label: 'Ide & Brainstorm', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'draft', label: 'Naskah & Draft', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  { id: 'design', label: 'Produksi & Desain', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  { id: 'review', label: 'Review & QC', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'scheduled', label: 'Terjadwal', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  { id: 'published', label: 'Selesai / Terbit', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
];

export const ContentPlanModal: React.FC<ContentPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  selectedDate,
  holidayContext
}) => {
  const [formData, setFormData] = useState<Partial<ContentPlanItem>>({
    title: '',
    platform: 'instagram',
    format: 'reels',
    status: 'ide',
    scheduledDate: selectedDate || new Date().toISOString().split('T')[0],
    scheduledTime: '19:00',
    caption: '',
    hashtags: '#DesainGrafis #StudioKreatif #Branding #AgencyLife',
    mediaUrl: '',
    holidayContext: holidayContext || '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        scheduledDate: initialData.scheduledDate || selectedDate || new Date().toISOString().split('T')[0],
        scheduledTime: initialData.scheduledTime || '19:00'
      });
    } else {
      setFormData({
        title: '',
        platform: 'instagram',
        format: 'reels',
        status: 'ide',
        scheduledDate: selectedDate || new Date().toISOString().split('T')[0],
        scheduledTime: '19:00',
        caption: '',
        hashtags: '#DesainGrafis #StudioKreatif #Branding',
        mediaUrl: '',
        holidayContext: holidayContext || '',
        notes: ''
      });
    }
  }, [initialData, selectedDate, holidayContext, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    const itemToSave: ContentPlanItem = {
      id: formData.id || `content_${Date.now()}`,
      title: formData.title.trim(),
      platform: formData.platform || 'instagram',
      format: formData.format || 'reels',
      status: formData.status || 'ide',
      scheduledDate: formData.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: formData.scheduledTime || '19:00',
      caption: formData.caption || '',
      hashtags: formData.hashtags || '',
      mediaUrl: formData.mediaUrl || '',
      holidayContext: formData.holidayContext || '',
      notes: formData.notes || '',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(itemToSave);
    onClose();
  };

  // Google Calendar URL for scheduled upload
  const gCalUrl = createGoogleCalendarUrl({
    title: `Upload Konten: ${formData.title || 'Konten Baru'} (${formData.platform?.toUpperCase()})`,
    description: `Jadwal Publikasi Konten:\n• Platform: ${formData.platform}\n• Format: ${formData.format}\n• Status: ${formData.status}\n• Konteks/Hari: ${formData.holidayContext || '-'}\n\nCaption:\n${formData.caption || '-'}\n\nHashtags: ${formData.hashtags || '-'}`,
    startDate: `${formData.scheduledDate}T${formData.scheduledTime || '19:00'}:00`,
    location: `${formData.platform?.toUpperCase()} Studio`
  });

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(4, 4, 8, 0.82)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--cms-card-bg)',
          borderRadius: 24,
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--cms-text)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1.5px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(var(--cms-accent-rgb), 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--cms-accent), #ec4899)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(var(--cms-accent-rgb), 0.25)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>
                {formData.id ? 'Edit Rencana Konten' : 'Rencanakan Konten Baru'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                Perencanaan & Jadwal Publikasi Konten Studio
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: 'none',
              background: 'var(--cms-input-bg)',
              color: 'var(--cms-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Holiday Badge Alert if triggered by holiday */}
          {formData.holidayContext && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Calendar size={15} />
              <span>Ide Konten Spesial Hari Besar: <strong>{formData.holidayContext}</strong></span>
            </div>
          )}

          {/* Judul / Topik Konten */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Judul / Topik Utama Konten *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 5 Rahasia Desain Logo yang Terlihat Mahal & Menjual"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px',
                borderRadius: 12,
                border: '1.5px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-text)',
                fontSize: 13,
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>

          {/* Platform & Format Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {/* Target Platform */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Platform Publikasi
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, platform: p.id as any }))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: formData.platform === p.id ? `2px solid ${p.color}` : '1.5px solid var(--glass-border)',
                      background: formData.platform === p.id ? `${p.color}18` : 'var(--cms-input-bg)',
                      color: formData.platform === p.id ? p.color : 'var(--cms-text)',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Konten */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Format Konten
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FORMATS.map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, format: fmt.id as any }))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: formData.format === fmt.id ? '2px solid var(--cms-accent)' : '1.5px solid var(--glass-border)',
                      background: formData.format === fmt.id ? 'rgba(var(--cms-accent-rgb), 0.15)' : 'var(--cms-input-bg)',
                      color: formData.format === fmt.id ? 'var(--cms-accent)' : 'var(--cms-text)',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {fmt.icon}
                    <span>{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Stage / Status */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Tahapan Produksi (Pipeline)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STAGES.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: st.id as any }))}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 100,
                    border: formData.status === st.id ? `2px solid ${st.color}` : '1.5px solid var(--glass-border)',
                    background: formData.status === st.id ? st.bg : 'var(--cms-input-bg)',
                    color: formData.status === st.id ? st.color : 'var(--cms-text-muted)',
                    fontSize: 11.5,
                    fontWeight: 850,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jadwal Upload: Tanggal & Jam */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Target Tanggal Upload
              </label>
              <PillDatePicker
                value={formData.scheduledDate}
                onChange={dateStr => setFormData(prev => ({ ...prev, scheduledDate: dateStr }))}
                placeholder="Pilih Tanggal Upload"
                accentColor="var(--cms-accent, #7c3aed)"
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Target Jam Upload (Prime Time)
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={e => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 12,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Caption & Copywriting */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Draft Caption / Script Naskah
            </label>
            <textarea
              rows={4}
              placeholder="Tuliskan hook awal, poin pembahasan, call to action (CTA), dll..."
              value={formData.caption}
              onChange={e => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-text)',
                fontSize: 12.5,
                lineHeight: 1.5,
                fontWeight: 500,
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Hashtags & Link Asset */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Hashtags
              </label>
              <input
                type="text"
                placeholder="#Desain #Branding"
                value={formData.hashtags}
                onChange={e => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Link Berkas / Canva / Drive
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={formData.mediaUrl}
                onChange={e => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 10,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1.5px solid var(--glass-border)',
            marginTop: 8
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {formData.id && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(formData.id!);
                    onClose();
                  }}
                  style={{
                    height: 38,
                    padding: '0 14px',
                    borderRadius: 100,
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Trash2 size={13} />
                  <span>Hapus</span>
                </button>
              )}

              <a
                href={gCalUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 100,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-card-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Calendar size={13} color="var(--cms-accent)" />
                <span>Sync Google Calendar</span>
                <ExternalLink size={11} color="var(--cms-text-muted)" />
              </a>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: 38,
                  padding: '0 18px',
                  borderRadius: 100,
                  border: '1.5px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--cms-text-muted)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>

              <button
                type="submit"
                style={{
                  height: 38,
                  padding: '0 22px',
                  borderRadius: 100,
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--cms-accent), #ec4899)',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <CheckCircle2 size={14} />
                <span>Simpan Rencana Konten</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentPlanModal;
