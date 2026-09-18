import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit3, Eye, EyeOff, Pin, Calendar, Tag, Link2, 
  Image as ImageIcon, Video, Upload, Sparkles, CheckCircle2, 
  Clock, X, MessageSquare, Heart, Share2, Search, Filter,
  ArrowUpRight, AlertCircle, RefreshCw, Send, Check,
  BarChart2, Scale, Sliders
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { googleSync } from '../../../utils/googleSync';
import { SocialUpdate, DEFAULT_SOCIAL_UPDATES, UpdateSticker } from '../../../types/socialUpdates';
import MediaGalleryModal from '../MediaGalleryModal';
import PillDatePicker from '../../common/PillDatePicker';
import UpdateStickerModal from './UpdateStickerModal';

interface UpdatesFeedManagerProps {
  notify?: (msg: string, type?: string) => void;
  confirm?: (options: { title: string; message: string; isDestructive?: boolean; onConfirm: () => void }) => void;
}

export const UpdatesFeedManager: React.FC<UpdatesFeedManagerProps> = ({ notify, confirm }) => {
  const [updates, setUpdates] = useState<SocialUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  // Composer & Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'mixed'>('image');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [sticker, setSticker] = useState<UpdateSticker | null>(null);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Author profile
  const [author, setAuthor] = useState({
    name: 'sumr.day',
    role: 'Creative Digital Studio • Warm Tech & Skena-Aesthetic',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load updates & author info
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [savedUpdates, profile, biodata] = await Promise.all([
          storage.getItem('porto_social_updates', null),
          storage.getItem('porto_business_profile', null),
          storage.getItem('porto_biodata', null)
        ]);

        if (Array.isArray(savedUpdates) && savedUpdates.length > 0) {
          setUpdates(savedUpdates);
        } else {
          setUpdates(DEFAULT_SOCIAL_UPDATES);
          await storage.setItem('porto_social_updates', DEFAULT_SOCIAL_UPDATES);
        }

        // Sync author from profile/biodata
        const resolvedName = biodata?.fullName || profile?.name || profile?.fullName || 'sumr.day';
        const resolvedRole = biodata?.role || profile?.role || profile?.tagline || 'Creative Digital Studio • Warm Tech & Skena-Aesthetic';
        const resolvedAvatar = biodata?.avatarUrl || profile?.avatarUrl || profile?.logoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

        setAuthor({
          name: resolvedName,
          role: resolvedRole,
          avatar: resolvedAvatar
        });
      } catch (err) {
        console.error('Error loading updates:', err);
        setUpdates(DEFAULT_SOCIAL_UPDATES);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const handleRemoteUpdate = async () => {
      try {
        const fresh = await storage.getItem('porto_social_updates', null);
        if (Array.isArray(fresh)) {
          setUpdates(fresh);
        }
      } catch (e) {}
    };

    window.addEventListener('porto_updates_updated', handleRemoteUpdate);
    return () => window.removeEventListener('porto_updates_updated', handleRemoteUpdate);
  }, []);

  const saveUpdates = async (newList: SocialUpdate[]) => {
    setUpdates(newList);
    await storage.setItem('porto_social_updates', newList);
    window.dispatchEvent(new CustomEvent('porto_updates_updated', { detail: newList }));
    // Auto-sync ke Google Sheets di latar belakang jika URL Google Script sudah dikonfigurasi
    try {
      googleSync.syncSocialUpdates(newList).catch(() => {});
    } catch {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      let detectedType: 'image' | 'video' | 'mixed' = mediaType;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVid = file.type.startsWith('video');
        if (isVid) detectedType = 'video';
        
        const res = await uploadToCloudinary(file, isVid ? 'video' : 'image');
        if (res?.url) {
          newUrls.push(res.url);
        }
      }

      if (newUrls.length > 0) {
        setMediaUrls(prev => [...prev, ...newUrls]);
        setMediaType(detectedType);
        notify?.(`✓ Berhasil mengunggah ${newUrls.length} media!`, 'success');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      notify?.('Gagal mengunggah media: ' + (err.message || 'Coba lagi'), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddMediaUrl = () => {
    const trimmed = mediaUrlInput.trim();
    if (!trimmed) return;
    const isVid = trimmed.match(/\.(mp4|webm|ogg)$/i) || trimmed.includes('youtube.com') || trimmed.includes('youtu.be');
    setMediaUrls(prev => [...prev, trimmed]);
    if (isVid) setMediaType('video');
    setMediaUrlInput('');
    setShowUrlInput(false);
    notify?.('Tautan media ditambahkan', 'info');
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingId(null);
    setContent('');
    setProjectTag('');
    setProjectUrl('');
    setCustomDate(new Date().toISOString().split('T')[0]);
    setMediaUrls([]);
    setMediaType('image');
    setIsPinned(false);
    setIsPublished(true);
    setSticker(null);
    setShowUrlInput(false);
  };

  const handleStartEdit = (item: SocialUpdate) => {
    setEditingId(item.id);
    setContent(item.content);
    setProjectTag(item.projectTag || '');
    setProjectUrl(item.projectUrl || '');
    setCustomDate(item.customDate || new Date().toISOString().split('T')[0]);
    setMediaUrls(item.mediaUrls || []);
    setMediaType(item.mediaType || 'image');
    setIsPinned(!!item.isPinned);
    setIsPublished(item.isPublished !== false);
    setSticker(item.sticker || null);
    // Scroll to top of composer
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSavePost = async () => {
    if (!content.trim()) {
      notify?.('Harap tulis cerita atau progres aktivitas Anda!', 'error');
      return;
    }

    if (editingId) {
      // Update existing
      const updated = updates.map(u => {
        if (u.id === editingId) {
          return {
            ...u,
            content: content.trim(),
            projectTag: projectTag.trim() || undefined,
            projectUrl: projectUrl.trim() || undefined,
            customDate: customDate || new Date().toISOString().split('T')[0],
            mediaUrls,
            mediaType,
            isPinned,
            isPublished,
            sticker: sticker || undefined
          };
        }
        return u;
      });

      await saveUpdates(updated);
      notify?.('Tersimpan rapi! Cerita sudah diperbarui ✨', 'success');
      resetForm();
    } else {
      // Create new
      const newPost: SocialUpdate = {
        id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        content: content.trim(),
        projectTag: projectTag.trim() || undefined,
        projectUrl: projectUrl.trim() || undefined,
        customDate: customDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        mediaUrls,
        mediaType,
        likesCount: 0,
        isPinned,
        isPublished,
        sticker: sticker || undefined,
        author: {
          name: author.name,
          role: author.role,
          avatar: author.avatar
        }
      };

      const updated = [newPost, ...updates];
      await saveUpdates(updated);
      notify?.('Update baru berhasil mengudara! Vibe-nya makin dapet ✨☀️', 'success');
      resetForm();
    }
  };

  const handleDelete = (id: string) => {
    const doDelete = async () => {
      const filtered = updates.filter(u => u.id !== id);
      await saveUpdates(filtered);
      if (editingId === id) resetForm();
      notify?.('Update berhasil dilepas dari linimasa 🍃', 'info');
    };

    if (confirm) {
      confirm({
        title: 'Lepas Update?',
        message: 'Apakah Anda yakin ingin melepas postingan cerita ini dari linimasa sumr.day?',
        isDestructive: true,
        onConfirm: doDelete
      });
    } else {
      if (window.confirm('Lepas postingan cerita ini?')) doDelete();
    }
  };

  const handleTogglePublish = async (item: SocialUpdate) => {
    const nextState = !item.isPublished;
    const updated = updates.map(u => u.id === item.id ? { ...u, isPublished: nextState } : u);
    await saveUpdates(updated);
    notify?.(
      nextState ? '✓ Postingan aktif mengudara di linimasa! ☀️' : 'Postingan diistirahatkan (Draft).',
      nextState ? 'success' : 'info'
    );
  };

  const handleTogglePin = async (item: SocialUpdate) => {
    const nextPin = !item.isPinned;
    const updated = updates.map(u => u.id === item.id ? { ...u, isPinned: nextPin } : u);
    await saveUpdates(updated);
    notify?.(nextPin ? '📌 Postingan disematkan di baris terdepan!' : 'Pin postingan dilepas.', 'info');
  };

  // Extract all unique years from updates
  const availableYears = Array.from(new Set(
    updates.map(u => {
      const d = u.customDate ? new Date(u.customDate) : new Date(u.createdAt);
      return isNaN(d.getFullYear()) ? '2026' : String(d.getFullYear());
    })
  )).sort((a, b) => Number(b) - Number(a));

  // Filter & Sort updates (pinned first, then chronological descending)
  const filteredUpdates = updates
    .filter(u => {
      if (selectedYear !== 'all') {
        const d = u.customDate ? new Date(u.customDate) : new Date(u.createdAt);
        const y = isNaN(d.getFullYear()) ? '2026' : String(d.getFullYear());
        if (y !== selectedYear) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = u.content.toLowerCase().includes(q);
        const matchesTag = (u.projectTag || '').toLowerCase().includes(q);
        return matchesContent || matchesTag;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = new Date(a.customDate || a.createdAt).getTime();
      const dateB = new Date(b.customDate || b.createdAt).getTime();
      return dateB - dateA;
    });

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Baru saja';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '16px 14px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* ── HEADER BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(251, 191, 36, 0.08) 100%)',
        border: '1px solid var(--cms-border, rgba(245, 158, 11, 0.25))',
        borderRadius: 22,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: 'var(--cms-shadow-sm, 0 4px 16px rgba(0,0,0,0.03))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35)',
            fontSize: 20
          }}>
            ☀️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--cms-text)' }}>
                Jurnal & Utas Cerita
              </h2>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                sumr.day feed
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted)' }}>
              Bagikan progres karya, cerita seru, dan wawasan kreatif khas sumr.day studio ☀️
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            disabled={isSyncing}
            onClick={async () => {
              setIsSyncing(true);
              try {
                await googleSync.syncSocialUpdates(updates, notify);
              } finally {
                setIsSyncing(false);
              }
            }}
            className="cms-btn hover-scale"
            style={{
              padding: '7px 14px',
              borderRadius: 10,
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontSize: 12,
              fontWeight: 800,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Sinkronkan seluruh linimasa update & utas ke Google Sheets & Drive"
          >
            <RefreshCw size={13} className={isSyncing ? 'cms-spin' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron ke Sheets'}</span>
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
            {updates.length} Cerita Tersimpan
          </span>
        </div>
      </div>

      {/* ── 1. SOCIAL POST COMPOSER BOX ── */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: editingId ? '2px solid var(--cms-accent, #6366f1)' : '1px solid var(--cms-border, rgba(255,255,255,0.12))',
        borderRadius: 22,
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: 'var(--cms-shadow-md, 0 6px 24px rgba(0,0,0,0.05))',
        transition: 'all 0.2s ease'
      }}>
        {/* Composer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src={author.avatar} 
              alt={author.name}
              style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--cms-accent)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 850, fontSize: 14, color: 'var(--cms-text)' }}>
                  {author.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>•</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#10b981' }}>
                  Tayang di Beranda
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                {author.role}
              </span>
            </div>
          </div>

          {editingId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                Mode Mengedit Postingan
              </span>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '4px 10px',
                  borderRadius: 100,
                  border: '1px solid var(--cms-border)',
                  background: 'transparent',
                  color: 'var(--cms-text-muted)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Text Area Content */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Tuliskan cerita progres proyek, wawasan desain, atau update produktif yang ingin dilihat klien & HR..."
          style={{
            width: '100%',
            minHeight: 120,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14.5,
            lineHeight: 1.6,
            color: 'var(--cms-text)',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />

        {/* Media Preview Thumbnails */}
        {mediaUrls.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px dashed var(--cms-border, rgba(255,255,255,0.08))' }}>
            {mediaUrls.map((url, idx) => (
              <div 
                key={idx} 
                style={{ 
                  position: 'relative', 
                  width: 90, 
                  height: 90, 
                  borderRadius: 12, 
                  overflow: 'hidden', 
                  border: '1px solid var(--cms-border)',
                  background: '#000'
                }}
              >
                {url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={url} alt="Attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(idx)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Hapus media ini"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── ATTACHED STICKER PREVIEW ── */}
        {sticker && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 14,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1.5px solid rgba(245, 158, 11, 0.3)',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                flexShrink: 0
              }}>
                {sticker.type === 'poll' ? <BarChart2 size={16} /> : sticker.type === 'this_or_that' ? <Scale size={16} /> : sticker.type === 'slider_rate' ? <Sliders size={16} /> : <MessageSquare size={16} />}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 850, color: '#f59e0b' }}>
                  Stiker Terpasang: {sticker.type === 'poll' ? 'Poling' : sticker.type === 'this_or_that' ? 'This or That' : sticker.type === 'slider_rate' ? 'Rate Geser' : 'Tanya Jawab (QnA)'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {'question' in sticker ? sticker.question : sticker.prompt}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setIsStickerModalOpen(true)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 100,
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#f59e0b',
                  fontSize: 11.5,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Ubah Stiker
              </button>
              <button
                type="button"
                onClick={() => setSticker(null)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 100,
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Hapus Stiker"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ── METADATA BAR (BACKDATING & PROJECT TAG) ── */}
        <div style={{
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
          borderRadius: 14,
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          border: '1px solid var(--cms-border, rgba(255,255,255,0.06))'
        }}>
          {/* Backdating Picker (Pill Rounded) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Calendar size={13} color="#10b981" />
              <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                Tanggal Aktivitas (Bisa Backdated)
              </label>
            </div>
            
            <PillDatePicker
              value={customDate}
              onChange={setCustomDate}
              placeholder="Pilih Tanggal Aktivitas"
              accentColor="#10b981"
            />

            <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCustomDate(new Date().toISOString().split('T')[0])}
                className="cms-pill cms-pill-btn"
                style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 9999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontWeight: 800, cursor: 'pointer' }}
              >
                Hari Ini
              </button>
              {['2025', '2024', '2023', '2022'].map(yr => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setCustomDate(`${yr}-06-15`)}
                  className="cms-pill cms-pill-btn"
                  style={{
                    fontSize: 10.5,
                    padding: '3px 8px',
                    borderRadius: 9999,
                    background: customDate.startsWith(yr) ? '#10b981' : 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                    border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                    color: customDate.startsWith(yr) ? '#ffffff' : 'var(--cms-text-muted)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Project Tag & URL (Pill Rounded Inputs) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Tag size={13} color="#6366f1" />
              <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                Nama Proyek / Topik (Opsional)
              </label>
            </div>
            <input
              type="text"
              value={projectTag}
              onChange={e => setProjectTag(e.target.value)}
              placeholder="Contoh: Agenze CMS, UI Rebrand..."
              className="cms-pill"
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: 9999,
                border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
                background: 'var(--cms-input-bg, var(--cms-card-bg))',
                color: 'var(--cms-text)',
                fontSize: 12.5,
                fontWeight: 650,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 6
              }}
            />
            <input
              type="text"
              value={projectUrl}
              onChange={e => setProjectUrl(e.target.value)}
              placeholder="Tautan proyek/demo (opsional)..."
              className="cms-pill"
              style={{
                width: '100%',
                padding: '6px 14px',
                borderRadius: 9999,
                border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                background: 'var(--cms-input-bg, var(--cms-card-bg))',
                color: 'var(--cms-text)',
                fontSize: 11.5,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Media URL Input popup */}
        {showUrlInput && (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={mediaUrlInput}
              onChange={e => setMediaUrlInput(e.target.value)}
              placeholder="Tempel tautan gambar atau video (URL)..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--cms-border)',
                background: 'var(--cms-input-bg, var(--cms-card-bg))',
                color: 'var(--cms-text)',
                fontSize: 12.5
              }}
            />
            <button
              type="button"
              onClick={handleAddMediaUrl}
              style={{
                padding: '0 14px',
                borderRadius: 8,
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                fontWeight: 750,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Tambah
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              style={{
                padding: '0 10px',
                borderRadius: 8,
                background: 'transparent',
                color: 'var(--cms-text-muted)',
                border: '1px solid var(--cms-border)',
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
          </div>
        )}

        {/* Composer Bottom Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
        }}>
          {/* Media Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="cms-pill cms-pill-btn"
              style={{
                padding: '7px 14px',
                borderRadius: 9999,
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Unggah Foto atau Video"
            >
              <Upload size={13} color="#10b981" />
              <span>{isUploading ? 'Mengunggah...' : 'Upload Media'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="cms-pill cms-pill-btn"
              style={{
                padding: '7px 14px',
                borderRadius: 9999,
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Pilih dari Galeri Media yang sudah ada"
            >
              <ImageIcon size={13} color="#6366f1" />
              <span>Galeri</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="cms-pill cms-pill-btn"
              style={{
                padding: '7px 14px',
                borderRadius: 9999,
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Tempel URL Tautan Media"
            >
              <Link2 size={13} color="#f59e0b" />
              <span>Link URL</span>
            </button>

            {/* Interactive Sticker Button */}
            <button
              type="button"
              onClick={() => setIsStickerModalOpen(true)}
              className="cms-pill cms-pill-btn"
              style={{
                padding: '7px 14px',
                borderRadius: 9999,
                border: sticker ? '1.5px solid #f59e0b' : '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: sticker ? 'rgba(245, 158, 11, 0.16)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: sticker ? '#f59e0b' : 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Pasang Stiker Interaktif (Poling, A vs B, Rate Geser, QnA)"
            >
              <Sparkles size={13} color="#f59e0b" />
              <span>{sticker ? 'Kelola Stiker ✨' : 'Stiker'}</span>
            </button>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className="cms-pill cms-pill-btn"
              style={{
                padding: '7px 14px',
                borderRadius: 9999,
                border: isPinned ? '1px solid #10b981' : '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: isPinned ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: isPinned ? '#10b981' : 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Sematkan di posisi teratas linimasa"
            >
              <Pin size={13} />
              <span>{isPinned ? 'Disematkan' : 'Sematkan'}</span>
            </button>

            {/* Publish Toggle */}
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className="cms-pill cms-pill-btn"
              style={{
                padding: '7px 14px',
                borderRadius: 9999,
                border: isPublished ? '1px solid #10b981' : '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: isPublished ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: isPublished ? '#10b981' : 'var(--cms-text-muted)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Status publikasi di Beranda"
            >
              {isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{isPublished ? 'Tayang' : 'Draft'}</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSavePost}
            style={{
              padding: '8px 20px',
              borderRadius: 100,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Send size={14} />
            <span>{editingId ? 'Simpan Perubahan' : 'Bagikan Update'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. FILTER & TIMELINE CONTROLS ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '0 4px'
      }}>
        {/* Year Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginRight: 2 }}>
            Tahun:
          </span>
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            style={{
              padding: '4px 12px',
              borderRadius: 100,
              border: selectedYear === 'all' ? '1px solid var(--cms-accent, #6366f1)' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              background: selectedYear === 'all' ? 'var(--cms-accent, #6366f1)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
              color: selectedYear === 'all' ? '#fff' : 'var(--cms-text)',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            Semua Tahun
          </button>
          {availableYears.map(yr => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              style={{
                padding: '4px 12px',
                borderRadius: 100,
                border: selectedYear === yr ? '1px solid var(--cms-accent, #6366f1)' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                background: selectedYear === yr ? 'var(--cms-accent, #6366f1)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
                color: selectedYear === yr ? '#fff' : 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              {yr}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kata kunci atau tag proyek..."
            style={{
              width: '100%',
              padding: '6px 12px 6px 30px',
              borderRadius: 100,
              border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
              background: 'var(--cms-input-bg, var(--cms-card-bg))',
              color: 'var(--cms-text)',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* ── 3. FEED TIMELINE LIST ── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cms-text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13 }}>Memuat riwayat aktivitas...</p>
        </div>
      ) : filteredUpdates.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          background: 'var(--cms-card-bg, #ffffff)',
          borderRadius: 20,
          border: '1px dashed var(--cms-border)'
        }}>
          <MessageSquare size={32} color="var(--cms-text-muted)" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>
            Belum ada update di filter ini
          </h4>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--cms-text-muted)' }}>
            Gunakan kotak pembuat status di atas untuk membagikan progres baru atau arsip proyek masa lalu.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filteredUpdates.map(item => {
            const isBackdated = item.customDate && new Date(item.customDate).getFullYear() < new Date().getFullYear();
            
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: item.isPinned 
                    ? '1.5px solid rgba(16, 185, 129, 0.4)' 
                    : '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                  borderRadius: 20,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: 'var(--cms-shadow-sm, 0 3px 14px rgba(0,0,0,0.03))',
                  position: 'relative'
                }}
              >
                {/* Card Top: Author & Meta */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <img 
                      src={item.author?.avatar || author.avatar} 
                      alt={item.author?.name || author.name}
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 850, fontSize: 14, color: 'var(--cms-text)' }}>
                          {item.author?.name || author.name}
                        </span>
                        
                        {item.isPinned && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '1px 7px',
                            borderRadius: 100,
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            fontSize: 10.5,
                            fontWeight: 800
                          }}>
                            <Pin size={10} />
                            Disematkan
                          </span>
                        )}

                        <span style={{
                          padding: '1px 7px',
                          borderRadius: 100,
                          background: item.isPublished ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: item.isPublished ? '#10b981' : '#ef4444',
                          fontSize: 10.5,
                          fontWeight: 800
                        }}>
                          {item.isPublished ? 'Tayang di Beranda' : 'Draft'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                          {item.author?.role || author.role}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>•</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: isBackdated ? '#f59e0b' : 'var(--cms-text-muted)', fontSize: 11.5, fontWeight: 700 }}>
                          <Calendar size={11} />
                          <span>{formatDateDisplay(item.customDate)}</span>
                          {isBackdated && <span>(Arsip Linimasa)</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(item)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                        background: item.isPinned ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: item.isPinned ? '#10b981' : 'var(--cms-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title={item.isPinned ? 'Lepas Sematan' : 'Sematkan ke atas'}
                    >
                      <Pin size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(item)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                        background: 'transparent',
                        color: item.isPublished ? '#10b981' : 'var(--cms-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title={item.isPublished ? 'Sembunyikan dari Beranda' : 'Tayangkan di Beranda'}
                    >
                      {item.isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                        background: 'transparent',
                        color: 'var(--cms-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Edit Postingan"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Hapus Postingan"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Project Tag Banner (if present) */}
                {item.projectTag && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 100,
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      fontSize: 11.5,
                      fontWeight: 800
                    }}>
                      <Tag size={11} />
                      {item.projectTag}
                    </span>

                    {item.projectUrl && (
                      <a
                        href={item.projectUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--cms-text-muted)',
                          textDecoration: 'none'
                        }}
                      >
                        <ArrowUpRight size={12} />
                        Lihat Proyek
                      </a>
                    )}
                  </div>
                )}

                {/* Content Story */}
                <div style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: 'var(--cms-text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {item.content}
                </div>

                {/* Media Attachments */}
                {item.mediaUrls && item.mediaUrls.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: item.mediaUrls.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 8,
                    borderRadius: 14,
                    overflow: 'hidden',
                    maxHeight: item.mediaUrls.length === 1 ? 400 : 260
                  }}>
                    {item.mediaUrls.map((url, mIdx) => (
                      <div key={mIdx} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 180, background: '#000' }}>
                        {url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video 
                            src={url} 
                            controls 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          <img 
                            src={url} 
                            alt={`Media ${mIdx + 1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Attached Sticker Summary Badge */}
                {item.sticker && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', color: '#f59e0b' }}>
                        {item.sticker.type === 'poll' ? <BarChart2 size={14} /> : item.sticker.type === 'this_or_that' ? <Scale size={14} /> : item.sticker.type === 'slider_rate' ? <Sliders size={14} /> : <MessageSquare size={14} />}
                      </span>
                      <span style={{ fontWeight: 850, color: '#f59e0b' }}>
                        {item.sticker.type === 'poll' ? 'Poling' : item.sticker.type === 'this_or_that' ? 'This or That' : item.sticker.type === 'slider_rate' ? 'Rate Geser' : 'Tanya Jawab'}
                      </span>
                      <span style={{ color: 'var(--cms-text-muted)' }}>
                        — {'question' in item.sticker ? item.sticker.question : item.sticker.prompt}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#f59e0b' }}>
                      {item.sticker.type === 'poll' && `${item.sticker.options.reduce((acc, o) => acc + (o.votes || 0), 0)} voter`}
                      {item.sticker.type === 'this_or_that' && `${(item.sticker.optionA.votes || 0) + (item.sticker.optionB.votes || 0)} voter`}
                      {item.sticker.type === 'slider_rate' && `Rata-rata: ${item.sticker.averageScore || 0}% (${item.sticker.ratingsCount || 0} voter)`}
                      {item.sticker.type === 'qna' && `${item.sticker.responses?.length || 0} respon`}
                    </div>
                  </div>
                )}

                {/* Card Footer: Social stats info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                  fontSize: 12,
                  color: 'var(--cms-text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Heart size={13} color="#f43f5e" fill="#f43f5e" />
                      {item.likesCount || 0} Apresiasi
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Share2 size={12} />
                      Tautan Aktif
                    </span>
                  </div>

                  <span style={{ fontSize: 11 }}>
                    Dibuat: {formatDateDisplay(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Gallery Picker Modal */}
      {isGalleryOpen && (
        <MediaGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelectImage={(url) => {
            setMediaUrls(prev => [...prev, url]);
            setIsGalleryOpen(false);
            notify?.('Media dari galeri ditambahkan!', 'success');
          }}
          targetLabel="Lampirkan ke Utas Status"
        />
      )}

      {/* Interactive Sticker Configuration Modal */}
      <UpdateStickerModal
        isOpen={isStickerModalOpen}
        initialSticker={sticker}
        onClose={() => setIsStickerModalOpen(false)}
        onSave={(newSticker) => {
          setSticker(newSticker);
          setIsStickerModalOpen(false);
          if (newSticker) {
            notify?.('✓ Stiker interaktif siap mengudara bersama postingan! ✨', 'success');
          } else {
            notify?.('Stiker dilepas dari postingan.', 'info');
          }
        }}
      />
    </div>
  );
};

export default UpdatesFeedManager;
