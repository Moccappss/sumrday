import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Users, MessageSquare, Save, Plus, Trash2, Copy, 
  ExternalLink, Share2, CheckCircle2, Clock, Calendar, Heart, 
  MapPin, CreditCard, Sparkles, RefreshCw, Send, Check,
  Download, Upload, UserCheck, QrCode, Search, Filter,
  Smartphone, Layers, X, FileText, Lock, Unlock, Eye,
  Music, Image as ImageIcon, Film, Sliders, ShieldCheck,
  ChevronRight, KeyRound, CheckSquare, Square, EyeOff,
  Building, Star, PartyPopper, Tag, Zap, Frame, Edit3, Ticket
} from 'lucide-react';
import { 
  InvitationData, Guest, RSVP, LoveStory, EnabledWidgets, PersonProfile,
  getInvitationData, saveInvitation, DEFAULT_INVITATION, getInvitationPersons,
  parseGuestCsv, exportGuestCsv, FRAME_PRESETS, CustomBlock, CoverConfig
} from '../invitationData';
import ClientView from './ClientView';
import { VisualWidgetModal } from './VisualWidgetModal';
import { VisualBackgroundModal } from './VisualBackgroundModal';
import { VisualCoverStudioModal } from './VisualCoverStudioModal';
import '../styles.css';

const THEME_SWATCHES = [
  { id: 'floral', name: 'Sakura Pink', color: '#ec4899', bg: '#140c10' },
  { id: 'luxury', name: 'Obsidian Gold', color: '#eab308', bg: '#0a0a0c' },
  { id: 'sage', name: 'Botanical Sage', color: '#10b981', bg: '#0f1b15' },
  { id: 'modern', name: 'Royal Sapphire', color: '#3b82f6', bg: '#090d16' },
  { id: 'crimson', name: 'Crimson Rose', color: '#e11d48', bg: '#180a0e' },
  { id: 'violet', name: 'Mystic Violet', color: '#8b5cf6', bg: '#120b1e' },
  { id: 'dark', name: 'Midnight Charcoal', color: '#64748b', bg: '#0a0a10' },
];

const ICON_OPTIONS: { id: any; label: string; icon: any }[] = [
  { id: 'heart', label: 'Cinta', icon: Heart },
  { id: 'sparkles', label: 'Kilau', icon: Sparkles },
  { id: 'building', label: 'Pameran', icon: Building },
  { id: 'star', label: 'Bintang', icon: Star },
  { id: 'cake', label: 'Pesta', icon: PartyPopper },
  { id: 'calendar', label: 'Agenda', icon: Calendar },
  { id: 'music', label: 'Musik', icon: Music },
  { id: 'ticket', label: 'Tiket', icon: Ticket }
];

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, value, onChange, placeholder }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [value]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onChange(event.target.result);
          setHasError(false);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="invite-label">{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {value && !hasError && (
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--glass-border, #e2e8f0)',
            flexShrink: 0,
            background: '#000'
          }}>
            <img 
              src={value} 
              alt="" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              onError={() => setHasError(true)}
            />
          </div>
        )}
        <input
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 12,
            background: 'var(--cms-input-bg, #edf0f6)',
            border: '1px solid var(--glass-border, #e2e8f0)',
            color: 'var(--cms-text, #0f172a)',
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box'
          }}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'URL gambar atau klik upload...'}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--glass-border, #e2e8f0)',
            color: 'var(--cms-text, #0f172a)',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap'
          }}
          title="Upload dari Komputer"
        >
          <Upload size={13} /> Upload
        </button>
      </div>
    </div>
  );
};

interface AdminViewProps {
  invitation?: InvitationData;
  adminMode?: 'super_admin' | 'client_admin';
  onAdminModeChange?: (mode: 'super_admin' | 'client_admin') => void;
  builderSection?: 'theme' | 'widgets' | 'media' | 'couple' | 'events' | 'gifts' | 'security' | 'guests';
  onBuilderSectionChange?: (sec: 'theme' | 'widgets' | 'media' | 'couple' | 'events' | 'gifts' | 'security' | 'guests') => void;
  onUpdate?: (inv: InvitationData) => void;
  onBack?: () => void;
}

export default function AdminView({ 
  invitation, 
  adminMode: propAdminMode, 
  onAdminModeChange, 
  builderSection: propBuilderSection,
  onBuilderSectionChange,
  onUpdate, 
  onBack 
}: AdminViewProps = {}) {
  const [data, setData] = useState<InvitationData>(invitation || getInvitationData);

  // Top mode: Super Admin (Visual Builder) vs Client Admin (Klien Pemesan - Buku Tamu & RSVP)
  const [internalAdminMode, setInternalAdminMode] = useState<'super_admin' | 'client_admin'>('super_admin');
  const adminMode = propAdminMode || internalAdminMode;
  const setAdminMode = (mode: 'super_admin' | 'client_admin') => {
    setInternalAdminMode(mode);
    if (onAdminModeChange) onAdminModeChange(mode);
  };

  // Client Portal Password Gate
  const [isClientUnlocked, setIsClientUnlocked] = useState(true);
  const [clientPasswordInput, setClientPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Super Admin active builder section
  // Studio top navbar tabs: strictly 'visual' | 'guests' | 'security' | 'theme'
  const [studioTab, setStudioTab] = useState<'visual' | 'guests' | 'security' | 'theme'>(() => {
    if (propBuilderSection === 'guests') return 'guests';
    if (propBuilderSection === 'security') return 'security';
    if (propBuilderSection === 'theme') return 'theme';
    return 'visual';
  });

  const [internalBuilderSection, setInternalBuilderSection] = useState<'theme' | 'widgets' | 'media' | 'couple' | 'events' | 'gifts' | 'security' | 'guests'>('theme');
  const builderSection = propBuilderSection || internalBuilderSection;
  const setBuilderSection = (sec: 'theme' | 'widgets' | 'media' | 'couple' | 'events' | 'gifts' | 'security' | 'guests') => {
    setInternalBuilderSection(sec);
    if (onBuilderSectionChange) onBuilderSectionChange(sec);
  };

  const handleStudioTabChange = (tab: 'visual' | 'guests' | 'security' | 'theme') => {
    setStudioTab(tab);
    if (onBuilderSectionChange) {
      if (tab === 'guests') onBuilderSectionChange('guests');
      else if (tab === 'security') onBuilderSectionChange('security');
      else if (tab === 'theme') onBuilderSectionChange('theme');
    }
  };
  
  // Mobile preview view switch on small screens ('editor' vs 'preview')
  const [mobileActivePane, setMobileActivePane] = useState<'editor' | 'preview'>('editor');
  const [previewKey, setPreviewKey] = useState(0); // to force refresh preview

  // Visual Studio state
  const [isVisualEditMode, setIsVisualEditMode] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showCoverStudioModal, setShowCoverStudioModal] = useState(false);
  const [widgetInsertAfterId, setWidgetInsertAfterId] = useState<string | undefined>(undefined);
  const [forceCoverView, setForceCoverView] = useState(false);

  // Client Admin Tabs
  const [clientTab, setClientTab] = useState<'guests' | 'rsvps'>('guests');

  // Guest list state
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestCategory, setNewGuestCategory] = useState('Teman');
  const [newGuestQuota, setNewGuestQuota] = useState(2);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [guestFilterStatus, setGuestFilterStatus] = useState<'all' | 'sent' | 'unsent' | 'checked_in'>('all');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvInputText, setCsvInputText] = useState('');

  // Media addition state
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [newStoryYear, setNewStoryYear] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [newStoryPhoto, setNewStoryPhoto] = useState('');

  // Audio upload state
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAudio(true);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const reader = new FileReader();
      reader.onload = (event) => {
        setIsUploadingAudio(false);
        if (typeof event.target?.result === 'string') {
          handleSave({
            ...data,
            musicUrl: event.target.result,
            musicTitle: data.musicTitle ? data.musicTitle : cleanTitle
          });
        }
      };
      reader.onerror = () => {
        setIsUploadingAudio(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        if (!invitation || e.detail.id === invitation.id || e.detail.slug === invitation.slug) {
          setData(e.detail);
        }
      }
    };
    window.addEventListener('porto_invitation_updated', handleUpdate);
    return () => window.removeEventListener('porto_invitation_updated', handleUpdate);
  }, [invitation]);

  useEffect(() => {
    if (invitation) setData(invitation);
  }, [invitation]);

  const handleSave = (updated: InvitationData) => {
    setData(updated);
    saveInvitation(updated);
    if (onUpdate) onUpdate(updated);
  };

  const handleWidgetToggle = (widgetKey: keyof EnabledWidgets) => {
    const current = data.enabledWidgets || {
      cover: true, quote: true, mempelai: true, countdown: true,
      acara: true, story: true, gallery: true, video: true,
      hadiah: true, ucapan: true, navbar: true
    };
    const nextWidgets: EnabledWidgets = {
      ...current,
      [widgetKey]: current[widgetKey] === false ? true : false
    };
    handleSave({
      ...data,
      enabledWidgets: nextWidgets
    });
  };

  // Visual Block Action Handlers
  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    if (blockId === 'cover') {
      setShowCoverStudioModal(true);
    } else if (blockId === 'hero') {
      setBuilderSection('theme');
    } else if (blockId === 'mempelai') {
      setBuilderSection('couple');
    } else if (blockId === 'acara') {
      setBuilderSection('events');
    } else if (blockId === 'story') {
      setBuilderSection('couple');
    } else if (blockId === 'video' || blockId === 'galeri') {
      setBuilderSection('media');
    } else if (blockId === 'hadiah') {
      setBuilderSection('gifts');
    } else if (blockId === 'ucapan') {
      setBuilderSection('guests');
    }
  };

  const handleOpenAddWidget = (insertAfterId?: string) => {
    setWidgetInsertAfterId(insertAfterId);
    setShowWidgetModal(true);
  };

  const handleSelectWidget = (widget: any) => {
    const updated = { ...data };
    if (widget.isCustomBlock) {
      const newBlock: CustomBlock = {
        id: `custom-${Date.now()}`,
        type: widget.type,
        title: widget.title,
        subtitle: widget.desc,
        content: widget.type === 'custom_text' ? 'Tuliskan informasi penting di sini...' : undefined,
        buttonText: widget.type === 'custom_button' ? 'Klik Di Sini' : undefined,
        buttonUrl: '#',
        icon: widget.icon,
        enabled: true
      };

      const blocks = [...(updated.customBlocks || [])];
      if (widgetInsertAfterId) {
        const idx = blocks.findIndex(b => b.id === widgetInsertAfterId);
        if (idx !== -1) {
          blocks.splice(idx + 1, 0, newBlock);
        } else {
          blocks.push(newBlock);
        }
      } else {
        blocks.push(newBlock);
      }
      updated.customBlocks = blocks;
      setSelectedBlockId(newBlock.id);
    } else {
      // Standard widget
      const enabledWidgets = { ...(updated.enabledWidgets || {}) };
      enabledWidgets[widget.type as keyof EnabledWidgets] = true;
      updated.enabledWidgets = enabledWidgets;
      setSelectedBlockId(widget.type);
    }

    handleSave(updated);
    setShowWidgetModal(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    const updated = { ...data };
    if (blockId.startsWith('custom-')) {
      updated.customBlocks = (updated.customBlocks || []).filter(b => b.id !== blockId);
    } else {
      const enabledWidgets = { ...(updated.enabledWidgets || {}) };
      (enabledWidgets as any)[blockId] = false;
      updated.enabledWidgets = enabledWidgets;
    }
    handleSave(updated);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const blocks = [...(data.customBlocks || [])];
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const temp = blocks[idx];
    blocks[idx] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    const updated = { ...data, customBlocks: blocks };
    handleSave(updated);
  };

  // Password verify for Client Admin
  const handleVerifyClientPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = data.clientAdminPassword || 'sumr';
    if (clientPasswordInput.trim() === correctPassword.trim()) {
      setIsClientUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Guest Management handlers
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    const code = `QR-${(data.slug || 'INV').toUpperCase().slice(0, 6)}-${Math.floor(Math.random() * 8999 + 1000)}`;
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
      ...data,
      guests: [newGuest, ...(data.guests || [])]
    };
    handleSave(updated);
    setNewGuestName('');
  };

  const handleDeleteGuest = (id: string) => {
    const updated = {
      ...data,
      guests: data.guests.filter(g => g.id !== id)
    };
    handleSave(updated);
  };

  const handleToggleSent = (id: string) => {
    const updated = {
      ...data,
      guests: data.guests.map(g => g.id === id ? { ...g, sent: !g.sent } : g)
    };
    handleSave(updated);
  };

  const handleToggleCheckIn = (id: string) => {
    const updated = {
      ...data,
      guests: data.guests.map(g => {
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
    handleSave(updated);
  };

  const handleExportCsv = () => {
    exportGuestCsv(data.guests || []);
  };

  const handleImportCsv = () => {
    if (!csvInputText.trim()) return;
    const parsed = parseGuestCsv(csvInputText, data.slug);
    if (parsed.length > 0) {
      handleSave({
        ...data,
        guests: [...parsed, ...(data.guests || [])]
      });
      setCsvInputText('');
      setShowCsvModal(false);
    }
  };

  // Add photo to gallery
  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    const updated = {
      ...data,
      galleryImages: [...(data.galleryImages || []), newGalleryUrl.trim()]
    };
    handleSave(updated);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (idx: number) => {
    const updated = {
      ...data,
      galleryImages: (data.galleryImages || []).filter((_, i) => i !== idx)
    };
    handleSave(updated);
  };

  // Add Love Story
  const handleAddLoveStory = () => {
    if (!newStoryTitle.trim() || !newStoryDesc.trim()) return;
    const newStory: LoveStory = {
      id: `story-${Date.now()}`,
      yearOrPhase: newStoryYear.trim() || 'Fase Baru',
      title: newStoryTitle.trim(),
      story: newStoryDesc.trim(),
      photo: newStoryPhoto.trim() || undefined
    };
    const updated = {
      ...data,
      loveStories: [...(data.loveStories || []), newStory]
    };
    handleSave(updated);
    setNewStoryYear('');
    setNewStoryTitle('');
    setNewStoryDesc('');
    setNewStoryPhoto('');
  };

  const handleRemoveLoveStory = (id: string) => {
    const updated = {
      ...data,
      loveStories: (data.loveStories || []).filter(s => s.id !== id)
    };
    handleSave(updated);
  };

  const publicUrl = `${window.location.origin}/invitation/${data.slug || data.id || 'undangan'}`;

  const getWaMessage = (guestName: string) => {
    const link = `${publicUrl}?to=${encodeURIComponent(guestName)}`;
    return `Yth. ${guestName},\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri acara pernikahan kami:\n\n*${data.title}*\n\nBerikut tautan undangan digital Anda:\n${link}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nTerima kasih.`;
  };

  const handleCopyWaText = (guestName: string) => {
    const text = getWaMessage(guestName);
    navigator.clipboard.writeText(text);
    setCopiedLink(guestName);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleOpenWa = (guestName: string, phone?: string) => {
    const text = encodeURIComponent(getWaMessage(guestName));
    const targetPhone = phone ? phone.replace(/\D/g, '') : '';
    const url = targetPhone ? `https://wa.me/${targetPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const widgets = data.enabledWidgets || {
    cover: true, quote: true, mempelai: true, countdown: true,
    acara: true, story: true, gallery: true, video: true,
    hadiah: true, ucapan: true, navbar: true
  };

  // RSVP statistics
  const totalHadir = data.rsvps.filter(r => r.attendance === 'hadir').reduce((sum, r) => sum + (r.count || 1), 0);
  const totalRagu = data.rsvps.filter(r => r.attendance === 'ragu').length;
  const totalTidakHadir = data.rsvps.filter(r => r.attendance === 'tidak_hadir').length;

  const renderGuestManager = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Sub-nav: Buku Tamu vs RSVP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, background: 'var(--cms-card-bg)', padding: 4, borderRadius: 99, border: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            onClick={() => setClientTab('guests')}
            style={{
              padding: '8px 18px',
              borderRadius: 99,
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: clientTab === 'guests' ? '#3b82f6' : 'transparent',
              color: clientTab === 'guests' ? '#fff' : 'var(--cms-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Users size={14} /> Buku Tamu ({data.guests.length})
          </button>
          <button
            type="button"
            onClick={() => setClientTab('rsvps')}
            style={{
              padding: '8px 18px',
              borderRadius: 99,
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: clientTab === 'rsvps' ? '#3b82f6' : 'transparent',
              color: clientTab === 'rsvps' ? '#fff' : 'var(--cms-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <MessageSquare size={14} /> RSVP & Doa ({data.rsvps.length})
          </button>
        </div>

        {adminMode === 'client_admin' && (
          <button
            type="button"
            onClick={() => setIsClientUnlocked(false)}
            style={{
              padding: '6px 14px',
              borderRadius: 99,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--glass-border)',
              color: 'var(--cms-text-muted)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Lock size={12} /> Kunci Kembali
          </button>
        )}
      </div>

      {/* ── CLIENT TAB: BUKU TAMU ── */}
      {clientTab === 'guests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Control Bar: Search & CSV */}
          <div style={{
            background: 'var(--cms-card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={15} color="var(--cms-text-muted)" style={{ position: 'absolute', left: 12, top: 10 }} />
              <input
                type="text"
                placeholder="Cari nama tamu..."
                value={guestSearchQuery}
                onChange={e => setGuestSearchQuery(e.target.value)}
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
                  border: '1px solid var(--glass-border)',
                  color: 'var(--cms-text)',
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

          {/* Add Guest Form */}
          <form onSubmit={handleAddGuest} style={{ background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 18 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)' }}>
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
                style={{ ...S_input, width: 120 }}
                value={newGuestCategory}
                onChange={e => setNewGuestCategory(e.target.value)}
              >
                <option value="VIP">VIP</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Teman">Teman</option>
                <option value="Kerja">Rekan Kerja</option>
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

          {/* Guest Filters */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'Semua Tamu', count: data.guests.length },
              { id: 'sent', label: 'Sudah Dikirim', count: data.guests.filter(g => g.sent).length },
              { id: 'unsent', label: 'Belum Dikirim', count: data.guests.filter(g => !g.sent).length },
              { id: 'checked_in', label: 'Hadir Check-In', count: data.guests.filter(g => g.hasCheckedIn).length }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setGuestFilterStatus(f.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 99,
                  background: guestFilterStatus === f.id ? '#3b82f6' : 'var(--cms-card-bg)',
                  color: guestFilterStatus === f.id ? '#fff' : 'var(--cms-text-muted)',
                  border: '1px solid var(--glass-border)',
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
          <div style={{ background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 18, overflowX: 'auto' }}>
            {(() => {
              const filtered = data.guests.filter(g => {
                const m = g.name.toLowerCase().includes(guestSearchQuery.toLowerCase());
                if (!m) return false;
                if (guestFilterStatus === 'sent') return g.sent;
                if (guestFilterStatus === 'unsent') return !g.sent;
                if (guestFilterStatus === 'checked_in') return g.hasCheckedIn;
                return true;
              });

              return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--cms-text-muted)', fontSize: 11 }}>
                      <th style={{ padding: '8px 10px' }}>Nama Tamu</th>
                      <th style={{ padding: '8px 10px' }}>Kategori / Kuota</th>
                      <th style={{ padding: '8px 10px' }}>Kode QR</th>
                      <th style={{ padding: '8px 10px' }}>Status Kirim</th>
                      <th style={{ padding: '8px 10px' }}>Check-In</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Aksi WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--cms-text-muted)' }}>
                          Tidak ada tamu yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map(g => {
                        const isCopied = copiedLink === g.name;
                        return (
                          <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '10px', fontWeight: 700, color: 'var(--cms-text)' }}>{g.name}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 700, marginRight: 6 }}>{g.category}</span>
                              <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>{g.paxQuota || 2} Pax</span>
                            </td>
                            <td style={{ padding: '10px', fontFamily: 'monospace', color: '#3b82f6', fontSize: 11 }}>{g.qrSecretCode}</td>
                            <td style={{ padding: '10px' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleSent(g.id)}
                                style={{
                                  background: g.sent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                  color: g.sent ? '#10b981' : 'var(--cms-text-muted)',
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
                                    color: 'var(--cms-text)',
                                    border: '1px solid var(--glass-border)',
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
                                    background: isCopied ? '#10b981' : 'var(--cms-input-bg)',
                                    color: isCopied ? '#fff' : 'var(--cms-text)',
                                    border: '1px solid var(--glass-border)',
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

      {/* ── CLIENT TAB: RSVP & DOA ── */}
      {clientTab === 'rsvps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          {/* Wishes list */}
          <div style={{ background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>
              Daftar Doa & Ucapan Tamu ({data.rsvps.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.rsvps.map(r => (
                <div key={r.id} style={{ background: 'var(--cms-bg)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: 12.5, color: 'var(--cms-text)' }}>{r.name}</strong>
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
                    <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>{r.createdAt}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
                    "{r.message}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );

  return (
    <div style={{ padding: 0, boxSizing: 'border-box', width: '100%' }}>
      
      {/* ── MODE 1: SUPER ADMIN - VISUAL-FIRST STUDIO ── */}
      {adminMode === 'super_admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', background: 'var(--cms-bg, #0a0a0f)' }}>

          {/* ── TOP NAVBAR: HANYA ADA 4 TAB (MODE VISUAL, TAMU, SANDI, TEMA) ── */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--cms-card-bg, #111116)',
            padding: '10px 16px',
            borderBottom: '1.5px solid var(--glass-border, rgba(255,255,255,0.1))',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.05)',
              padding: '4px 6px',
              borderRadius: 14,
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))'
            }}>
              {/* 1. ✨ Mode Visual (Default / Hero) */}
              <button
                type="button"
                onClick={() => handleStudioTabChange('visual')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: studioTab === 'visual' ? 'linear-gradient(135deg, #ec4899, #db2777)' : 'transparent',
                  color: studioTab === 'visual' ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                  boxShadow: studioTab === 'visual' ? '0 2px 10px rgba(236,72,153,0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={14} />
                <span>Mode Visual</span>
              </button>

              {/* 2. 👥 Tamu */}
              <button
                type="button"
                onClick={() => handleStudioTabChange('guests')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: studioTab === 'guests' ? '#3b82f6' : 'transparent',
                  color: studioTab === 'guests' ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                  boxShadow: studioTab === 'guests' ? '0 2px 10px rgba(59,130,246,0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users size={14} />
                <span>Tamu</span>
                {(data.guests || []).length > 0 && (
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 99,
                    background: studioTab === 'guests' ? 'rgba(255,255,255,0.25)' : 'rgba(59,130,246,0.2)',
                    color: studioTab === 'guests' ? '#fff' : '#60a5fa',
                    fontWeight: 900
                  }}>
                    {data.guests.length}
                  </span>
                )}
              </button>

              {/* 3. 🔑 Sandi */}
              <button
                type="button"
                onClick={() => handleStudioTabChange('security')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: studioTab === 'security' ? '#8b5cf6' : 'transparent',
                  color: studioTab === 'security' ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                  boxShadow: studioTab === 'security' ? '0 2px 10px rgba(139,92,246,0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <KeyRound size={14} />
                <span>Sandi</span>
              </button>

              {/* 4. 🎨 Tema */}
              <button
                type="button"
                onClick={() => handleStudioTabChange('theme')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: studioTab === 'theme' ? '#eab308' : 'transparent',
                  color: studioTab === 'theme' ? '#000000' : 'var(--cms-text-muted, #94a3b8)',
                  boxShadow: studioTab === 'theme' ? '0 2px 10px rgba(234,179,8,0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Palette size={14} />
                <span>Tema</span>
              </button>
            </div>
          </div>

          {/* ── TAB 1: ✨ MODE VISUAL (HERO STUDIO CANVAS - ZERO FORM CLUTTER) ── */}
          {studioTab === 'visual' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              padding: '16px 12px 40px',
              boxSizing: 'border-box'
            }}>
              {/* Studio Quick Action Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 16,
                maxWidth: 620,
                width: '100%'
              }}>
                <button
                  type="button"
                  onClick={() => handleOpenAddWidget()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: 'rgba(236,72,153,0.18)',
                    border: '1px solid rgba(236,72,153,0.4)',
                    color: '#f472b6',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Plus size={15} /> Tambah Widget
                </button>

                <button
                  type="button"
                  onClick={() => setShowBackgroundModal(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.18)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    color: '#60a5fa',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Palette size={15} /> Background
                </button>

                <button
                  type="button"
                  onClick={() => setShowCoverStudioModal(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: 'rgba(245,158,11,0.18)',
                    border: '1px solid rgba(245,158,11,0.4)',
                    color: '#fbbf24',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Layers size={15} /> Cover Studio
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = data.navigationMode === 'story_slide' ? 'vertical_scroll' : 'story_slide';
                    handleSave({ ...data, navigationMode: next });
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: data.navigationMode === 'story_slide' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid ' + (data.navigationMode === 'story_slide' ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.15)'),
                    color: data.navigationMode === 'story_slide' ? '#c084fc' : '#94a3b8',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Ganti Mode Tampilan (Story Slide 9:16 vs Scroll)"
                >
                  <Smartphone size={15} /> {data.navigationMode === 'story_slide' ? 'Story (9:16)' : 'Scroll'}
                </button>

                <button
                  type="button"
                  onClick={() => setForceCoverView(!forceCoverView)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    background: forceCoverView ? 'rgba(236,72,153,0.3)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {forceCoverView ? '📜 Pratinjau Isi' : '🚪 Pratinjau Cover'}
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewKey(k => k + 1)}
                  title="Segarkan Pratinjau"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <RefreshCw size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSave(data)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 10px rgba(16,185,129,0.3)'
                  }}
                >
                  <Save size={15} /> Simpan
                </button>
              </div>

              {/* Phone Device Mockup Wrapper — Dynamic 9:16 Instagram Story Canvas */}
              <div style={{
                height: 'min(780px, calc(100vh - 160px))',
                width: 'auto',
                aspectRatio: '9 / 16',
                maxHeight: 'calc(100vh - 160px)',
                maxWidth: 420,
                background: '#030305',
                borderRadius: 44,
                padding: '12px',
                border: '4px solid rgba(255,255,255,0.18)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(236,72,153,0.2)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxSizing: 'border-box',
                flexShrink: 0
              }}>
                {/* Dynamic Island / Notch */}
                <div style={{
                  position: 'absolute',
                  top: 18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 90,
                  height: 18,
                  background: '#000',
                  borderRadius: 99,
                  zIndex: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1c1c1e', marginRight: 8 }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0a0a0c' }} />
                </div>

                {/* Inner Screen Viewport with Realtime Live ClientView */}
                <div
                  key={previewKey}
                  style={{
                    flex: 1,
                    borderRadius: 34,
                    overflowY: data.navigationMode === 'story_slide' ? 'hidden' : 'auto',
                    overflowX: 'hidden',
                    background: '#000',
                    position: 'relative',
                    transform: 'translateZ(0)',
                    scrollbarWidth: 'none',
                    touchAction: data.navigationMode === 'story_slide' ? 'pan-x' : 'auto',
                    overscrollBehavior: 'none',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <ClientView
                    initialData={data}
                    isVisualEditMode={true}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={handleSelectBlock}
                    onOpenAddWidget={handleOpenAddWidget}
                    onOpenBackgroundPicker={() => setShowBackgroundModal(true)}
                    onOpenCoverStudio={() => setShowCoverStudioModal(true)}
                    onDeleteBlock={handleDeleteBlock}
                    onMoveBlock={handleMoveBlock}
                    onUpdateData={handleSave}
                    forceCoverOpen={forceCoverView}
                  />
                </div>

                {/* Bottom Home Indicator */}
                <div style={{
                  height: 4,
                  width: 100,
                  background: 'rgba(255,255,255,0.4)',
                  borderRadius: 99,
                  margin: '8px auto 2px'
                }} />
              </div>
            </div>
          )}

          {/* ── TAB 2: 👥 BUKU TAMU & RSVP ── */}
          {studioTab === 'guests' && (
            <div style={{ maxWidth: 960, margin: '24px auto', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
              {renderGuestManager()}
            </div>
          )}

          {/* ── TAB 3: 🔑 SANDI & AKSES KLIEN ── */}
          {studioTab === 'security' && (
            <div style={{ maxWidth: 580, margin: '32px auto', width: '100%', padding: '0 20px', boxSizing: 'border-box' }}>
              <div style={S_card}>
                <h3 style={S_cardTitle}>🔑 Sandi Portal Klien</h3>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
                  Sandi ini digunakan oleh pemesan undangan untuk membuka buku tamu, mengelola daftar tamu, dan melihat ucapan RSVP tanpa merubah tata letak desain undangan.
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    style={{ ...S_input, fontSize: 16, fontWeight: 800, letterSpacing: '0.1em' }}
                    value={data.clientAdminPassword || ''}
                    onChange={e => handleSave({ ...data, clientAdminPassword: e.target.value })}
                    placeholder="Contoh: 1234 atau sumr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000).toString();
                      handleSave({ ...data, clientAdminPassword: rand });
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      fontWeight: 750,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Acak PIN
                  </button>
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--cms-text-muted)' }}>
                  Sandi aktif saat ini: <strong style={{ color: 'var(--cms-accent, #ec4899)' }}>{data.clientAdminPassword || 'sumr'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: 🎨 TEMA & WARNA CEPAT ── */}
          {studioTab === 'theme' && (
            <div style={{ maxWidth: 740, margin: '24px auto', width: '100%', padding: '0 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Kategori Acara */}
              <div style={S_card}>
                <h3 style={S_cardTitle}>1. Kategori Acara & Judul</h3>
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
                      onClick={() => handleSave({
                        ...data,
                        eventType: t.id as any,
                        categoryBadge: t.id === 'exhibition' ? 'EXHIBITION & EXPO' :
                          t.id === 'conference' ? 'CONFERENCE & SUMMIT' :
                          t.id === 'birthday' ? 'BIRTHDAY CELEBRATION' :
                          t.id === 'wedding' ? 'THE WEDDING OF' : 'OFFICIAL INVITATION'
                      })}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 12,
                        border: (data.eventType || 'wedding') === t.id ? '2px solid var(--cms-accent, #ec4899)' : '1px solid var(--glass-border)',
                        background: (data.eventType || 'wedding') === t.id ? 'rgba(236, 72, 153, 0.15)' : 'var(--cms-bg)',
                        color: 'var(--cms-text)',
                        fontSize: 11.5,
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="invite-label">Judul Utama Undangan</label>
                    <input
                      style={S_input}
                      value={data.title || ''}
                      onChange={e => handleSave({ ...data, title: e.target.value })}
                      placeholder="Judul Acara / Pameran"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="invite-label">Badge Kategori Cover</label>
                      <input
                        style={S_input}
                        value={data.categoryBadge || ''}
                        onChange={e => handleSave({ ...data, categoryBadge: e.target.value })}
                        placeholder="EXHIBITION & EXPO"
                      />
                    </div>
                    <div>
                      <label className="invite-label">Penyelenggara / Host</label>
                      <input
                        style={S_input}
                        value={data.organizer || ''}
                        onChange={e => handleSave({ ...data, organizer: e.target.value })}
                        placeholder="Panitia / Studio"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Palet Warna Preset */}
              <div style={S_card}>
                <h3 style={S_cardTitle}>2. Palet Warna & Preset Tema</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  {THEME_SWATCHES.map(th => {
                    const isSelected = data.theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleSave({ ...data, theme: th.id as any, customBackgroundColor: th.bg, backgroundType: 'theme' })}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: th.color,
                          border: isSelected ? '3px solid #ffffff' : '2px solid transparent',
                          boxShadow: isSelected ? `0 0 14px ${th.color}` : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          outline: isSelected ? `2px solid ${th.color}` : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                        title={th.name}
                      >
                        {isSelected && <Check size={18} color="#fff" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── FOCUSED BLOCK DETAILS MODAL (IF BLOCK CLICKED IN VISUAL CANVAS) ── */}
          {selectedBlockId && !['cover', 'hero'].includes(selectedBlockId) && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 300,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16
              }}
              onClick={() => setSelectedBlockId(null)}
            >
              <div
                style={{
                  background: 'var(--cms-card-bg, #111116)',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                  borderRadius: 24,
                  maxWidth: 540,
                  width: '100%',
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  padding: 24,
                  boxSizing: 'border-box',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit3 size={18} color="var(--cms-accent, #ec4899)" />
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--cms-text, #fff)' }}>
                      Edit Blok: <span style={{ color: 'var(--cms-accent, #ec4899)', textTransform: 'capitalize' }}>{selectedBlockId}</span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBlockId(null)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* MEMPELAI QUICK EDIT */}
                {selectedBlockId === 'mempelai' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="invite-label">Nama Pria</label>
                        <input
                          style={S_input}
                          value={data.groom?.fullName || ''}
                          onChange={e => handleSave({ ...data, groom: { ...(data.groom || { fullName: '', nickname: '', parents: '' }), fullName: e.target.value } })}
                          placeholder="Nama lengkap pria"
                        />
                      </div>
                      <div>
                        <label className="invite-label">Panggilan Pria</label>
                        <input
                          style={S_input}
                          value={data.groom?.nickname || ''}
                          onChange={e => handleSave({ ...data, groom: { ...(data.groom || { fullName: '', nickname: '', parents: '' }), nickname: e.target.value } })}
                          placeholder="Panggilan"
                        />
                      </div>
                    </div>
                    <ImageUploadField
                      label="Foto Mempelai Pria"
                      value={data.groom?.photo || ''}
                      onChange={val => handleSave({ ...data, groom: { ...(data.groom || { fullName: '', nickname: '', parents: '' }), photo: val } })}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                      <div>
                        <label className="invite-label">Nama Wanita</label>
                        <input
                          style={S_input}
                          value={data.bride?.fullName || ''}
                          onChange={e => handleSave({ ...data, bride: { ...(data.bride || { fullName: '', nickname: '', parents: '' }), fullName: e.target.value } })}
                          placeholder="Nama lengkap wanita"
                        />
                      </div>
                      <div>
                        <label className="invite-label">Panggilan Wanita</label>
                        <input
                          style={S_input}
                          value={data.bride?.nickname || ''}
                          onChange={e => handleSave({ ...data, bride: { ...(data.bride || { fullName: '', nickname: '', parents: '' }), nickname: e.target.value } })}
                          placeholder="Panggilan"
                        />
                      </div>
                    </div>
                    <ImageUploadField
                      label="Foto Mempelai Wanita"
                      value={data.bride?.photo || ''}
                      onChange={val => handleSave({ ...data, bride: { ...(data.bride || { fullName: '', nickname: '', parents: '' }), photo: val } })}
                    />
                  </div>
                )}

                {/* ACARA QUICK EDIT */}
                {selectedBlockId === 'acara' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label className="invite-label">Nama Acara Utama</label>
                      <input
                        style={S_input}
                        value={data.akad?.title || ''}
                        onChange={e => handleSave({
                          ...data,
                          akad: { ...(data.akad || { title: '', time: '', venue: '', address: '', mapUrl: '' }), title: e.target.value }
                        })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="invite-label">Tanggal Acara</label>
                        <input
                          type="date"
                          style={S_input}
                          value={data.eventDate || ''}
                          onChange={e => handleSave({ ...data, eventDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="invite-label">Waktu (cth: 08.00 - Selesai)</label>
                        <input
                          style={S_input}
                          value={data.akad?.time || ''}
                          onChange={e => handleSave({
                            ...data,
                            akad: { ...(data.akad || { title: '', time: '', venue: '', address: '', mapUrl: '' }), time: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="invite-label">Nama Tempat / Gedung</label>
                      <input
                        style={S_input}
                        value={data.akad?.venue || ''}
                        onChange={e => handleSave({
                          ...data,
                          akad: { ...(data.akad || { title: '', time: '', venue: '', address: '', mapUrl: '' }), venue: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="invite-label">Alamat Lengkap</label>
                      <textarea
                        style={{ ...S_input, minHeight: 60 }}
                        value={data.akad?.address || ''}
                        onChange={e => handleSave({
                          ...data,
                          akad: { ...(data.akad || { title: '', time: '', venue: '', address: '', mapUrl: '' }), address: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}

                {/* HADIAH QUICK EDIT */}
                {selectedBlockId === 'hadiah' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="invite-label">Nama Bank</label>
                        <input
                          style={S_input}
                          value={data.bankAccounts?.[0]?.bank || ''}
                          onChange={e => {
                            const accs = [...(data.bankAccounts || [])];
                            accs[0] = { ...(accs[0] || { bank: '', accountNumber: '', accountName: '' }), bank: e.target.value };
                            handleSave({ ...data, bankAccounts: accs });
                          }}
                          placeholder="BCA / Mandiri / BRI"
                        />
                      </div>
                      <div>
                        <label className="invite-label">Nomor Rekening</label>
                        <input
                          style={S_input}
                          value={data.bankAccounts?.[0]?.accountNumber || ''}
                          onChange={e => {
                            const accs = [...(data.bankAccounts || [])];
                            accs[0] = { ...(accs[0] || { bank: '', accountNumber: '', accountName: '' }), accountNumber: e.target.value };
                            handleSave({ ...data, bankAccounts: accs });
                          }}
                          placeholder="123456789"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="invite-label">Nama Pemilik Rekening</label>
                      <input
                        style={S_input}
                        value={data.bankAccounts?.[0]?.accountName || ''}
                        onChange={e => {
                          const accs = [...(data.bankAccounts || [])];
                          accs[0] = { ...(accs[0] || { bank: '', accountNumber: '', accountName: '' }), accountName: e.target.value };
                          handleSave({ ...data, bankAccounts: accs });
                        }}
                        placeholder="Atas Nama..."
                      />
                    </div>
                  </div>
                )}

                {/* GENERIC BLOCK / CUSTOM BLOCK EDIT */}
                {!['mempelai', 'acara', 'hadiah'].includes(selectedBlockId) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--cms-text-muted)' }}>
                      Blok ini dapat diedit langsung pada layar pratinjau visual atau gunakan tombol di bawah untuk mengaturnya.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(selectedBlockId)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Trash2 size={14} /> Hapus Blok Ini Dari Undangan
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedBlockId(null)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #ec4899, #db2777)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 12.5,
                      cursor: 'pointer'
                    }}
                  >
                    Selesai & Simpan
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODE 2: 👥 CLIENT ADMIN (KLIEN PEMESAN - BUKU TAMU & RSVP)
         ═══════════════════════════════════════════════════════════════ */}
      {adminMode === 'client_admin' && (
        <div style={{ padding: '16px 20px' }}>
          {/* PASSWORD GATE FOR CLIENT */}
          {!isClientUnlocked ? (
            <div style={{
              maxWidth: 420,
              margin: '40px auto',
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 28,
              padding: '36px 28px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
            }}>
              <div style={{
                width: 50,
                height: 50,
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

              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: 'var(--cms-text)' }}>
                Portal Tamu & RSVP Klien
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
                Area ini khusus bagi calon pengantin / pemesan undangan untuk mengelola buku tamu dan memantau kehadiran RSVP.
              </p>

              <form onSubmit={handleVerifyClientPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <input
                    type="password"
                    style={{ ...S_input, textAlign: 'center', fontSize: 16, letterSpacing: '0.15em' }}
                    placeholder="Masukkan Sandi Klien..."
                    value={clientPasswordInput}
                    onChange={e => {
                      setClientPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    autoFocus
                    required
                  />
                  {passwordError && (
                    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginTop: 4, display: 'block' }}>
                      Sandi salah. Silakan hubungi pengelola CMS jika lupa.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '12px 20px',
                    borderRadius: 99,
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Unlock size={14} /> Masuk ke Buku Tamu
                </button>
              </form>

              {/* Bypass for Super Admin */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 8 }}>
                  Khusus Pemilik CMS ("Aku"):
                </span>
                <button
                  type="button"
                  onClick={() => setIsClientUnlocked(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 99,
                    background: 'rgba(236, 72, 153, 0.12)',
                    color: 'var(--cms-accent, #ec4899)',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  👑 Lewati Sandi (Akses Pemilik CMS)
                </button>
              </div>
            </div>
          ) : (
            /* CLIENT DASHBOARD UNLOCKED */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Sub-nav: Buku Tamu vs RSVP */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, background: 'var(--cms-card-bg)', padding: 4, borderRadius: 99, border: '1px solid var(--glass-border)' }}>
                  <button
                    type="button"
                    onClick={() => setClientTab('guests')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 99,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: clientTab === 'guests' ? '#3b82f6' : 'transparent',
                      color: clientTab === 'guests' ? '#fff' : 'var(--cms-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Users size={14} /> Buku Tamu ({data.guests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientTab('rsvps')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 99,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: clientTab === 'rsvps' ? '#3b82f6' : 'transparent',
                      color: clientTab === 'rsvps' ? '#fff' : 'var(--cms-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <MessageSquare size={14} /> RSVP & Doa ({data.rsvps.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsClientUnlocked(false)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 99,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text-muted)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Lock size={12} /> Kunci Kembali
                </button>
              </div>

              {/* ── CLIENT TAB: BUKU TAMU ── */}
              {clientTab === 'guests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Top Control Bar: Search & CSV */}
                  <div style={{
                    background: 'var(--cms-card-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 20,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div style={{ position: 'relative', flex: '1 1 240px' }}>
                      <Search size={15} color="var(--cms-text-muted)" style={{ position: 'absolute', left: 12, top: 10 }} />
                      <input
                        type="text"
                        placeholder="Cari nama tamu..."
                        value={guestSearchQuery}
                        onChange={e => setGuestSearchQuery(e.target.value)}
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
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
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

                  {/* Add Guest Form */}
                  <form onSubmit={handleAddGuest} style={{ background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 18 }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)' }}>
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
                        style={{ ...S_input, width: 120 }}
                        value={newGuestCategory}
                        onChange={e => setNewGuestCategory(e.target.value)}
                      >
                        <option value="VIP">VIP</option>
                        <option value="Keluarga">Keluarga</option>
                        <option value="Teman">Teman</option>
                        <option value="Kerja">Rekan Kerja</option>
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

                  {/* Guest Filters */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                    {[
                      { id: 'all', label: 'Semua Tamu', count: data.guests.length },
                      { id: 'sent', label: 'Sudah Dikirim', count: data.guests.filter(g => g.sent).length },
                      { id: 'unsent', label: 'Belum Dikirim', count: data.guests.filter(g => !g.sent).length },
                      { id: 'checked_in', label: 'Hadir Check-In', count: data.guests.filter(g => g.hasCheckedIn).length }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setGuestFilterStatus(f.id as any)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 99,
                          background: guestFilterStatus === f.id ? '#3b82f6' : 'var(--cms-card-bg)',
                          color: guestFilterStatus === f.id ? '#fff' : 'var(--cms-text-muted)',
                          border: '1px solid var(--glass-border)',
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
                  <div style={{ background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 18, overflowX: 'auto' }}>
                    {(() => {
                      const filtered = data.guests.filter(g => {
                        const m = g.name.toLowerCase().includes(guestSearchQuery.toLowerCase());
                        if (!m) return false;
                        if (guestFilterStatus === 'sent') return g.sent;
                        if (guestFilterStatus === 'unsent') return !g.sent;
                        if (guestFilterStatus === 'checked_in') return g.hasCheckedIn;
                        return true;
                      });

                      return (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--cms-text-muted)', fontSize: 11 }}>
                              <th style={{ padding: '8px 10px' }}>Nama Tamu</th>
                              <th style={{ padding: '8px 10px' }}>Kategori / Kuota</th>
                              <th style={{ padding: '8px 10px' }}>Kode QR</th>
                              <th style={{ padding: '8px 10px' }}>Status Kirim</th>
                              <th style={{ padding: '8px 10px' }}>Check-In</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Aksi WhatsApp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--cms-text-muted)' }}>
                                  Tidak ada tamu yang sesuai filter.
                                </td>
                              </tr>
                            ) : (
                              filtered.map(g => {
                                const isCopied = copiedLink === g.name;
                                return (
                                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--cms-text)' }}>{g.name}</td>
                                    <td style={{ padding: '10px' }}>
                                      <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 700, marginRight: 6 }}>{g.category}</span>
                                      <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>{g.paxQuota || 2} Pax</span>
                                    </td>
                                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#3b82f6', fontSize: 11 }}>{g.qrSecretCode}</td>
                                    <td style={{ padding: '10px' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSent(g.id)}
                                        style={{
                                          background: g.sent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                          color: g.sent ? '#10b981' : 'var(--cms-text-muted)',
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
                                            color: 'var(--cms-text)',
                                            border: '1px solid var(--glass-border)',
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
                                            background: isCopied ? '#10b981' : 'var(--cms-input-bg)',
                                            color: isCopied ? '#fff' : 'var(--cms-text)',
                                            border: '1px solid var(--glass-border)',
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

              {/* ── CLIENT TAB: RSVP & DOA ── */}
              {clientTab === 'rsvps' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

                  {/* Wishes list */}
                  <div style={{ background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 20 }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>
                      Daftar Doa & Ucapan Tamu ({data.rsvps.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {data.rsvps.map(r => (
                        <div key={r.id} style={{ background: 'var(--cms-bg)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <strong style={{ fontSize: 12.5, color: 'var(--cms-text)' }}>{r.name}</strong>
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
                            <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>{r.createdAt}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
                            "{r.message}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* ── MODAL IMPORT CSV TAMU ── */}
      {showCsvModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'var(--cms-card-bg)',
            border: '1.5px solid var(--glass-border)',
            borderRadius: 24,
            maxWidth: 540,
            width: '100%',
            padding: '24px 22px',
            position: 'relative',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={18} color="var(--cms-accent, #ec4899)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                  Import Tamu dari CSV
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
              Salin dan tempel data daftar tamu Anda dari spreadsheet (Excel/Google Sheets) dengan format:<br />
              <strong style={{ color: 'var(--cms-text)' }}>Nama Tamu, No WhatsApp, Kategori, Kuota Pax</strong>
            </p>

            <textarea
              value={csvInputText}
              onChange={e => setCsvInputText(e.target.value)}
              placeholder="Tempel baris CSV di sini..."
              style={{
                width: '100%',
                minHeight: 180,
                borderRadius: 14,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--cms-text)',
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
                  border: '1px solid var(--glass-border)',
                  color: 'var(--cms-text)',
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
                disabled={!csvInputText.trim()}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: csvInputText.trim() ? 'var(--cms-accent, #ec4899)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: csvInputText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Import Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VISUAL STUDIO MODALS ── */}
      <VisualWidgetModal
        isOpen={showWidgetModal}
        onClose={() => setShowWidgetModal(false)}
        onSelectWidget={handleSelectWidget}
      />

      <VisualBackgroundModal
        isOpen={showBackgroundModal}
        onClose={() => setShowBackgroundModal(false)}
        data={data}
        onSave={handleSave}
        ImageUploadField={ImageUploadField}
      />

      <VisualCoverStudioModal
        isOpen={showCoverStudioModal}
        onClose={() => setShowCoverStudioModal(false)}
        data={data}
        onSave={handleSave}
        ImageUploadField={ImageUploadField}
      />

    </div>
  );
}

const S_card: React.CSSProperties = {
  background: 'var(--cms-card-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 20,
  padding: '18px 20px',
  boxSizing: 'border-box'
};

const S_cardTitle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 13.5,
  fontWeight: 800,
  color: 'var(--cms-text)'
};

const S_input: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 12,
  border: '1px solid var(--glass-border)',
  background: 'var(--cms-input-bg)',
  color: 'var(--cms-text)',
  fontSize: 12.5,
  outline: 'none',
  boxSizing: 'border-box'
};
