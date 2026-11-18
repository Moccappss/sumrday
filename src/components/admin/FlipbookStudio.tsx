import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, Plus, Copy, Check, ExternalLink, Trash2, Edit3, 
  Download, Eye, Share2, FileText, Search, Sparkles, RefreshCw, X, Lock, CheckCircle2,
  ArrowLeft, MessageSquare
} from 'lucide-react';
import { ClientFlipbook } from '../../types/flipbook';
import { 
  getClientFlipbooks, saveClientFlipbook, deleteClientFlipbook, generateFlipbookShareUrl 
} from '../../services/flipbookService';
import { haptic } from '../../utils/haptics';

interface FlipbookStudioProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  onNavigate?: (page: string) => void;
}

/**
 * Interactive 3D Tilt Card Component
 * Ultra-smooth, minimalist, Apple-grade 3D hover physics with subtle specular light
 */
interface Interactive3DCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Interactive3DCard: React.FC<Interactive3DCardProps> = ({ children, className, style }) => {
  return (
    <div
      className={className}
      data-no-3d="true"
      style={{
        position: 'relative',
        borderRadius: 20,
        boxShadow: 'var(--cms-shadow-sm, 0 4px 18px rgba(0,0,0,0.04))',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const FlipbookStudio: React.FC<FlipbookStudioProps> = ({ notify, confirm, onNavigate }) => {
  const [flipbooks, setFlipbooks] = useState<ClientFlipbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientFlipbook | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formTotalPages, setFormTotalPages] = useState<number>(8);
  const [formPaperSize, setFormPaperSize] = useState<'a4' | 'us-letter' | 'square' | 'landscape'>('a4');
  const [formAllowDownload, setFormAllowDownload] = useState(true);
  const [formDefaultViewMode, setFormDefaultViewMode] = useState<'double' | 'single'>('double');
  const [formIsDark, setFormIsDark] = useState(true);
  const [formDescription, setFormDescription] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getClientFlipbooks();
      setFlipbooks(data);
    } catch (err) {
      console.error('Failed to load flipbooks:', err);
      notify?.('Gagal memuat', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = (e: any) => {
      if (e.detail) setFlipbooks(e.detail);
      else loadData();
    };

    window.addEventListener('porto_flipbooks_updated', handleUpdate);
    return () => window.removeEventListener('porto_flipbooks_updated', handleUpdate);
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return flipbooks;
    const q = searchQuery.toLowerCase();
    return flipbooks.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.clientName.toLowerCase().includes(q) || 
      b.slug.toLowerCase().includes(q)
    );
  }, [flipbooks, searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormClient('');
    setFormSlug('');
    setFormPdfUrl('');
    setFormTotalPages(8);
    setFormPaperSize('a4');
    setFormAllowDownload(true);
    setFormDefaultViewMode('double');
    setFormIsDark(true);
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: ClientFlipbook) => {
    setEditingItem(book);
    setFormTitle(book.title);
    setFormClient(book.clientName);
    setFormSlug(book.slug);
    setFormPdfUrl(book.pdfUrl || '');
    setFormTotalPages(book.totalPages || 8);
    setFormPaperSize(
      (book.paperSize as any) === 'custom' ? 'a4' : (book.paperSize || 'a4')
    );
    setFormAllowDownload(book.allowDownload ?? true);
    setFormDefaultViewMode(book.defaultViewMode || 'double');
    setFormIsDark(book.isDark ?? true);
    setFormDescription(book.description || '');
    setIsModalOpen(true);
  };

  const handleAutoSlug = (title: string) => {
    setFormTitle(title);
    if (!editingItem) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(generated);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      notify?.('Judul wajib', 'error');
      return;
    }

    const cleanSlug = formSlug.trim()
      ? formSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    let ratio = 0.7071;
    if (formPaperSize === 'us-letter') ratio = 0.7727;
    if (formPaperSize === 'square') ratio = 1.0;
    if (formPaperSize === 'landscape') ratio = 1.3333;

    const newBook: ClientFlipbook = {
      id: editingItem ? editingItem.id : `fb_${Date.now()}`,
      slug: cleanSlug,
      title: formTitle.trim(),
      clientName: formClient.trim() || 'sumr.day Studio',
      description: formDescription.trim(),
      pdfUrl: formPdfUrl.trim(),
      totalPages: Math.max(formTotalPages, 1),
      paperSize: formPaperSize,
      aspectRatio: ratio,
      allowDownload: formAllowDownload,
      defaultViewMode: formDefaultViewMode,
      isDark: formIsDark,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveClientFlipbook(newBook);
      setIsModalOpen(false);
      haptic.success();
      notify?.(editingItem ? 'Tersimpan' : 'Dibuat', 'success');
    } catch (err: any) {
      console.error('Failed to save flipbook:', err);
      notify?.('Gagal menyimpan', 'error');
    }
  };

  const handleDelete = (book: ClientFlipbook) => {
    const doDelete = async () => {
      try {
        await deleteClientFlipbook(book.id);
        haptic.medium();
        notify?.('Dihapus', 'info');
      } catch (err) {
        console.error('Failed to delete flipbook:', err);
        notify?.('Gagal menghapus', 'error');
      }
    };

    if (confirm) {
      confirm({
        title: 'Hapus Flipbook?',
        message: `Tautan "/flipbook/${book.slug}" tidak dapat dibuka lagi. Lanjutkan?`,
        isDestructive: true,
        onConfirm: doDelete
      });
    } else {
      if (window.confirm(`Hapus "${book.title}"?`)) {
        doDelete();
      }
    }
  };

  const handleCopyLink = (book: ClientFlipbook) => {
    const url = generateFlipbookShareUrl(book.slug);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(book.id);
      haptic.light();
      notify?.('Tautan tersalin', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleSendWhatsApp = (book: ClientFlipbook) => {
    const url = generateFlipbookShareUrl(book.slug);
    const clientName = book.clientName || 'Klien';
    const message = `Halo ${clientName}! Dokumen editorial & portofolio interaktif Anda telah siap dibuka:\n\n*${book.title}*\n${url}\n\nSilakan dibuka dan ditinjau ya. Terima kasih! ✨`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div
      className="flipbook-studio-root"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
        color: 'var(--cms-text, currentColor)',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
    >
      <style>{`
        .flipbook-studio-root {
          padding: 20px 28px 80px;
        }
        .flipbook-mobile-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .flipbook-studio-root {
            padding: 12px 14px calc(104px + env(safe-area-inset-bottom, 24px)) !important;
          }
          .flipbook-desktop-header {
            display: none !important;
          }
          .flipbook-desktop-search {
            display: none !important;
          }
          .flipbook-mobile-bar {
            display: flex !important;
            align-items: center;
            gap: 8px;
            margin-bottom: 14px;
            width: 100%;
          }
        }
      `}</style>

      {/* ── MOBILE COMPACT SINGLE-ROW BAR (NO DOUBLE NAVBAR) ── */}
      <div className="flipbook-mobile-bar">
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('tools')}
            title="Kembali"
            aria-label="Kembali"
            style={{
              width: 38,
              height: 38,
              minWidth: 38,
              borderRadius: 11,
              background: 'var(--cms-card-bg, rgba(255,255,255,0.06))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              color: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.55 }} />
          <input
            type="text"
            placeholder="Cari flipbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 38,
              padding: '0 28px 0 34px',
              borderRadius: 11,
              background: 'var(--cms-card-bg, rgba(255,255,255,0.04))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
              color: 'inherit',
              fontSize: 12.5,
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                opacity: 0.5,
                cursor: 'pointer',
                display: 'flex',
                padding: 2
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          title="Buat Baru"
          aria-label="Buat Flipbook Baru"
          style={{
            width: 38,
            height: 38,
            minWidth: 38,
            borderRadius: 11,
            background: 'var(--cms-accent, #D95629)',
            color: '#fff',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 4px 12px var(--cms-accent-soft, rgba(217, 86, 41, 0.35))'
          }}
        >
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>

      {/* ── TOP HEADER (DESKTOP) ── */}
      <div className="flipbook-desktop-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('tools')}
                title="Kembali ke Tool"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                  color: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: 'var(--cms-accent-soft, rgba(217, 86, 41, 0.12))',
              color: 'var(--cms-accent, #D95629)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={19} strokeWidth={2.4} />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 21,
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              Flipbook Studio
            </h1>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 100,
              background: 'var(--cms-accent, #D95629)',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {flipbooks.length} Buku
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.68, maxWidth: 580, lineHeight: 1.5 }}>
            Publikasi dokumen editorial, panduan, dan portofolio interaktif klien dengan tautan khusus mandiri.
          </p>
        </div>

        {/* Primary Action Button (Concise 1-2 Words) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 18px',
              borderRadius: 12,
              background: 'var(--cms-accent, #D95629)',
              color: '#fff',
              border: 'none',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13.5,
              fontWeight: 750,
              cursor: 'pointer',
              boxShadow: '0 4px 18px var(--cms-accent-soft, rgba(217, 86, 41, 0.35))',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>Buat Baru</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR (DESKTOP) ── */}
      <div className="flipbook-desktop-search" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20
      }}>
        <div style={{
          flex: 1,
          maxWidth: 380,
          position: 'relative'
        }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input
            type="text"
            placeholder="Cari flipbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              borderRadius: 10,
              background: 'var(--cms-card-bg, rgba(255,255,255,0.04))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
              color: 'inherit',
              fontSize: 13,
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                opacity: 0.5,
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3D INTERACTIVE CLIENT FLIPBOOK CARDS ── */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.6 }}>
          <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13 }}>Memuat...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div style={{
          padding: '50px 24px',
          textAlign: 'center',
          background: 'var(--cms-card-bg, rgba(255,255,255,0.03))',
          borderRadius: 18,
          border: '1.5px dashed var(--glass-border, rgba(255,255,255,0.1))'
        }}>
          <BookOpen size={36} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 750 }}>
            {searchQuery ? 'Tidak Ditemukan' : 'Belum Ada Flipbook'}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 12.5, opacity: 0.6, maxWidth: 380, marginInline: 'auto' }}>
            {searchQuery ? `Tidak ada data "${searchQuery}".` : 'Buat flipbook pertama Anda sekarang.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreateModal}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: 'var(--cms-accent, #D95629)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer'
              }}
            >
              + Buat Baru
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: 20
        }}>
          {filteredBooks.map((book) => {
            const shareUrl = generateFlipbookShareUrl(book.slug);
            const isCopied = copiedId === book.id;

            return (
              <Interactive3DCard
                key={book.id}
                style={{
                  background: 'var(--cms-card-bg, rgba(255,255,255,0.04))',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.09))',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxSizing: 'border-box'
                }}
              >
                {/* Header card: Client & Icon-Only Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--cms-accent, #D95629)',
                      display: 'block',
                      marginBottom: 3
                    }}>
                      {book.clientName || 'Klien'}
                    </span>
                    <h3 style={{
                      margin: 0,
                      fontSize: 15.5,
                      fontWeight: 800,
                      fontFamily: "'Outfit', sans-serif",
                      lineHeight: 1.35,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {book.title}
                    </h3>
                  </div>

                  {/* Icon Only Action Buttons */}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={() => handleOpenEditModal(book)}
                      title="Edit"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                        color: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(book)}
                      title="Hapus"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Description snippet */}
                {book.description && (
                  <p style={{
                    margin: 0,
                    fontSize: 12,
                    opacity: 0.65,
                    lineHeight: 1.45,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {book.description}
                  </p>
                )}

                {/* Minimalist 1-2 Word Badges / Icon Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {/* Page count */}
                  <span 
                    title={`${book.totalPages} Halaman`}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FileText size={11} opacity={0.7} />
                    <span>{book.totalPages} Hal</span>
                  </span>

                  {/* Paper Format */}
                  <span 
                    title="Format Kertas"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.08))'
                    }}
                  >
                    {book.paperSize?.toUpperCase() || 'A4'}
                  </span>

                  {/* Download Permission: Icon Only + Dot */}
                  <span 
                    title={book.allowDownload ? 'Izin Unduh Aktif' : 'Izin Unduh Dikunci'}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: book.allowDownload ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: book.allowDownload ? '#22c55e' : '#ef4444',
                      border: `1px solid ${book.allowDownload ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {book.allowDownload ? <Download size={11} /> : <Lock size={11} />}
                    <span>{book.allowDownload ? 'Unduh' : 'Kunci'}</span>
                  </span>

                  {/* View Mode */}
                  <span 
                    title={book.defaultViewMode === 'single' ? 'Tampilan 1 Sisi' : 'Tampilan 2 Sisi'}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <BookOpen size={11} opacity={0.7} />
                    <span>{book.defaultViewMode === 'single' ? '1 Sisi' : '2 Sisi'}</span>
                  </span>
                </div>

                {/* Unique Link & Icon-Only Actions */}
                <div style={{
                  marginTop: 'auto',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: 'var(--cms-sidebar-bg, rgba(0,0,0,0.22))',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.06))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}>
                  <div style={{
                    minWidth: 0,
                    flex: 1,
                    fontSize: 11.5,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'var(--cms-accent, #D95629)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    /flipbook/{book.slug}
                  </div>

                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {/* Copy Button (Icon-Only with state change) */}
                    <button
                      onClick={() => handleCopyLink(book)}
                      title={isCopied ? 'Tersalin' : 'Salin Tautan'}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: isCopied ? '#22c55e' : 'var(--cms-accent, #D95629)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isCopied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
                    </button>

                    {/* WhatsApp Dispatcher Button */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(book)}
                      title="Kirim ke WhatsApp Klien"
                      style={{
                        padding: '6px 9px',
                        borderRadius: 8,
                        background: '#25D366',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 750,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>WA</span>
                    </button>

                    {/* Open in New Tab (Icon-Only) */}
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buka Flipbook"
                      style={{
                        width: 29,
                        height: 29,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: 'inherit',
                        border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

              </Interactive3DCard>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL (Concise 1-2 Word Labels) ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            width: '100%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--cms-card-bg, #1e293b)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
            borderRadius: 20,
            padding: 24,
            color: 'inherit',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--cms-accent-soft, rgba(217, 86, 41, 0.15))',
                  color: 'var(--cms-accent, #D95629)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BookOpen size={17} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                    {editingItem ? 'Edit Pengaturan' : 'Buat Flipbook'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 11.5, opacity: 0.65 }}>
                    Dokumen & slug khusus klien
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                title="Tutup"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Judul Buku */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                  Judul Buku *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brand Guideline & Lookbook 2026"
                  value={formTitle}
                  onChange={(e) => handleAutoSlug(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 9,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                    color: 'inherit',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Nama Klien & Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Nama Klien
                  </label>
                  <input
                    type="text"
                    placeholder="sumr.day Studio"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 9,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                      color: 'inherit',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Slug URL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sumrday-brandbook"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 9,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                      color: 'inherit',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* URL PDF */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                  URL PDF
                </label>
                <input
                  type="text"
                  placeholder="https://res.cloudinary.com/.../doc.pdf (Opsional)"
                  value={formPdfUrl}
                  onChange={(e) => setFormPdfUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 9,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                    color: 'inherit',
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Halaman & Format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Jumlah Halaman
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={formTotalPages}
                    onChange={(e) => setFormTotalPages(parseInt(e.target.value, 10) || 8)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 9,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                      color: 'inherit',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Format Kertas
                  </label>
                  <select
                    value={formPaperSize}
                    onChange={(e) => setFormPaperSize(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 9,
                      background: 'var(--cms-card-bg, #1e293b)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                      color: 'inherit',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="a4">A4 (0.7071)</option>
                    <option value="us-letter">US Letter (0.7727)</option>
                    <option value="square">Persegi 1:1</option>
                    <option value="landscape">Landscape 4:3</option>
                  </select>
                </div>
              </div>

              {/* Toggles (1-2 Word Labels) */}
              <div style={{
                padding: '12px 14px',
                borderRadius: 11,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>Izin Unduh PDF</span>
                  <input
                    type="checkbox"
                    checked={formAllowDownload}
                    onChange={(e) => setFormAllowDownload(e.target.checked)}
                    style={{ width: 17, height: 17, accentColor: 'var(--cms-accent, #D95629)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ height: 1, background: 'var(--glass-border, rgba(255,255,255,0.06))' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>Tampilan Awal</span>
                  <select
                    value={formDefaultViewMode}
                    onChange={(e) => setFormDefaultViewMode(e.target.value as any)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 7,
                      background: 'var(--cms-card-bg, #1e293b)',
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                      color: 'inherit',
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    <option value="double">2 Sisi (Buku)</option>
                    <option value="single">1 Sisi (Kertas)</option>
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                  Catatan Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan dokumen..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 9,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                    color: 'inherit',
                    fontSize: 12.5,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Submit Buttons (1 Word Each!) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9,
                    background: 'transparent',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
                    color: 'inherit',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 9,
                    background: 'var(--cms-accent, #D95629)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 750,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px var(--cms-accent-soft, rgba(217, 86, 41, 0.3))'
                  }}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlipbookStudio;
