import React, { useState, useEffect, useRef } from 'react';
import { 
  Quote, Star, MessageSquare, HelpCircle, Plus, Trash2, Edit3, Check, 
  Sparkles, X, ChevronDown, CheckCircle2, AlertCircle, Heart, User, 
  Building, Search, Upload, Image, Share2, Copy, ExternalLink, ArrowRight,
  Code2, Award, BarChart2, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import type { ClientReviewItem, ClientFeedbackItem, ClientFaqItem } from './stashTypes';

const DEFAULT_REVIEWS: ClientReviewItem[] = [
  {
    id: 'rev-1',
    clientName: 'Alif Pratama',
    brand: 'Nusantara Creative',
    role: 'Founder & Art Director',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    reviewText: 'Eksekusi desain dan sistem interaktifnya luar biasa memukau. Klien kami sangat terkesan dengan kecepatan dan estetika visual yang dihadirkan.',
    serviceCategory: 'Branding & Web',
    isFeatured: true,
    isPublished: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rev-2',
    clientName: 'Siti Rahmania',
    brand: 'Kopi Kenangan Senja',
    role: 'Marketing Lead',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    reviewText: 'Pelayanan responsif, revisi cepat, dan hasil akhir benar-benar melampaui ekspektasi. Sangat merekomendasikan studio ini!',
    serviceCategory: 'Social & Promo',
    isFeatured: true,
    isPublished: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_FAQS: ClientFaqItem[] = [
  {
    id: 'faq-1',
    question: 'Berapa lama rata-rata waktu pengerjaan sebuah proyek?',
    answer: 'Untuk proyek landing page atau branding standar berkisar antara 3-7 hari kerja. Jadwal tentatif akan kami berikan sebelum pembayaran komitmen.',
    category: 'Layanan',
    order: 1
  },
  {
    id: 'faq-2',
    question: 'Apakah ada kuota revisi untuk setiap paket layanan?',
    answer: 'Ya, rata-rata paket kami mencakup 2 hingga 3 kali revisi minor tanpa biaya tambahan agar hasil akhir sesuai visi Anda.',
    category: 'Ketentuan',
    order: 2
  },
  {
    id: 'faq-3',
    question: 'Metode pembayaran apa saja yang diterima?',
    answer: 'Kami menerima transfer bank lokal (BCA, Mandiri), QRIS, e-Wallet, dan pembayaran kartu bertahap (Down Payment 50%).',
    category: 'Pembayaran',
    order: 3
  }
];

interface ClientVoiceManagerProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  isDarkMode?: boolean;
  onBack?: () => void;
}

export const ClientVoiceManager: React.FC<ClientVoiceManagerProps> = ({
  notify,
  confirm,
  isDarkMode = true,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'feedbacks' | 'faqs'>('reviews');
  const [reviews, setReviews] = useState<ClientReviewItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<ClientFeedbackItem[]>([]);
  const [faqs, setFaqs] = useState<ClientFaqItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<ClientReviewItem | null>(null);
  const [reviewDraft, setReviewDraft] = useState<Partial<ClientReviewItem>>({
    rating: 5,
    clientName: '',
    brand: '',
    role: '',
    reviewText: '',
    serviceCategory: 'Umum',
    isFeatured: true,
    avatarUrl: ''
  });

  // Manual Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackDraft, setFeedbackDraft] = useState({
    clientName: '',
    email: '',
    feedbackText: ''
  });

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<ClientFaqItem | null>(null);
  const [faqDraft, setFaqDraft] = useState<Partial<ClientFaqItem>>({
    question: '',
    answer: '',
    category: 'Umum'
  });

  const [copiedFeedbackLink, setCopiedFeedbackLink] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedEmbedCode, setCopiedEmbedCode] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [savedReviews, savedFeedbacks, savedFaqs] = await Promise.all([
          storage.getItem('porto_client_reviews', null),
          storage.getItem('porto_client_feedbacks', []),
          storage.getItem('porto_client_faqs', null)
        ]);

        if (Array.isArray(savedReviews) && savedReviews.length > 0) {
          setReviews(savedReviews);
        } else {
          setReviews(DEFAULT_REVIEWS);
          await storage.setItem('porto_client_reviews', DEFAULT_REVIEWS);
        }

        setFeedbacks(Array.isArray(savedFeedbacks) ? savedFeedbacks : []);

        if (Array.isArray(savedFaqs) && savedFaqs.length > 0) {
          setFaqs(savedFaqs);
        } else {
          setFaqs(DEFAULT_FAQS);
          await storage.setItem('porto_client_faqs', DEFAULT_FAQS);
        }
      } catch (err) {
        setReviews(DEFAULT_REVIEWS);
        setFaqs(DEFAULT_FAQS);
      }
    };
    loadAll();

    const handleDataUpdate = () => {
      loadAll();
    };
    window.addEventListener('porto_reviews_updated', handleDataUpdate);
    window.addEventListener('porto_feedbacks_updated', handleDataUpdate);
    window.addEventListener('porto_faqs_updated', handleDataUpdate);

    return () => {
      window.removeEventListener('porto_reviews_updated', handleDataUpdate);
      window.removeEventListener('porto_feedbacks_updated', handleDataUpdate);
      window.removeEventListener('porto_faqs_updated', handleDataUpdate);
    };
  }, []);

  const saveReviews = async (updated: ClientReviewItem[]) => {
    setReviews(updated);
    await storage.setItem('porto_client_reviews', updated);

    // Auto-sync published reviews to website testimonials for client web display
    try {
      const publishedReviews = updated.filter(r => r.isPublished !== false);
      const mappedTestimonials = publishedReviews.map(r => ({
        id: r.id,
        quote: r.reviewText,
        author: r.clientName,
        role: r.role ? (r.brand ? `${r.role} at ${r.brand}` : r.role) : (r.brand || 'Klien Studio'),
        avatar: r.avatarUrl || '',
        rating: r.rating || 5
      }));
      await storage.setItem('porto_testimonials', mappedTestimonials);
      window.dispatchEvent(new CustomEvent('porto_testimonials_updated', { detail: mappedTestimonials }));
    } catch (err) {
      console.error('Failed to sync published reviews to testimonials:', err);
    }

    window.dispatchEvent(new CustomEvent('porto_reviews_updated'));
  };

  const handleToggleReviewPublish = (id: string) => {
    const updated = reviews.map(r => {
      if (r.id === id) {
        const next = !r.isPublished;
        notify?.(
          next
            ? `✓ Ulasan "${r.clientName}" aktif tayang di web klien!`
            : `Ulasan "${r.clientName}" kini Draft (Mata Tertutup).`,
          'info'
        );
        return { ...r, isPublished: next };
      }
      return r;
    });
    saveReviews(updated);
  };

  const saveFeedbacks = async (updated: ClientFeedbackItem[]) => {
    setFeedbacks(updated);
    await storage.setItem('porto_client_feedbacks', updated);
    window.dispatchEvent(new CustomEvent('porto_feedbacks_updated'));
  };

  const saveFaqs = async (updated: ClientFaqItem[]) => {
    setFaqs(updated);
    await storage.setItem('porto_client_faqs', updated);
    window.dispatchEvent(new CustomEvent('porto_faqs_updated'));
  };

  // Handlers for Reviews
  const handleSaveReview = () => {
    if (!reviewDraft.clientName?.trim() || !reviewDraft.reviewText?.trim()) {
      notify?.('Nama klien dan isi ulasan wajib diisi', 'error');
      return;
    }

    if (editingReview) {
      const updated = reviews.map(r => r.id === editingReview.id ? { ...r, ...reviewDraft } as ClientReviewItem : r);
      saveReviews(updated);
      notify?.('Testimoni klien diperbarui!', 'success');
    } else {
      const newReview: ClientReviewItem = {
        id: `rev-${Date.now()}`,
        clientName: reviewDraft.clientName || 'Klien Anonim',
        brand: reviewDraft.brand || undefined,
        role: reviewDraft.role || undefined,
        avatarUrl: reviewDraft.avatarUrl || undefined,
        rating: reviewDraft.rating || 5,
        reviewText: reviewDraft.reviewText || '',
        serviceCategory: reviewDraft.serviceCategory || 'Umum',
        isFeatured: reviewDraft.isFeatured !== false,
        isPublished: reviewDraft.isPublished ?? false, // default draft (mata tertutup)
        createdAt: new Date().toISOString()
      };
      saveReviews([newReview, ...reviews]);
      notify?.('Testimoni baru berhasil ditambahkan (Draft)!', 'success');
    }

    setShowReviewModal(false);
    setEditingReview(null);
  };

  const handleDeleteReview = (id: string, name: string) => {
    const action = () => {
      saveReviews(reviews.filter(r => r.id !== id));
      notify?.(`Testimoni dari "${name}" dihapus.`, 'info');
    };

    if (confirm) {
      confirm({
        title: 'Hapus Testimoni?',
        message: `Hapus ulasan dari "${name}"?`,
        isDestructive: true,
        onConfirm: action
      });
    } else {
      if (window.confirm(`Hapus ulasan dari "${name}"?`)) action();
    }
  };

  // Handle Image Upload for Testimonial Avatar / Logo
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notify?.('Ukuran gambar maksimal 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReviewDraft(prev => ({ ...prev, avatarUrl: reader.result as string }));
      notify?.('Foto profil klien berhasil dimuat!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Handlers for Feedback
  const handleSaveFeedbackManual = () => {
    if (!feedbackDraft.clientName.trim() || !feedbackDraft.feedbackText.trim()) {
      notify?.('Nama dan pesan masukan wajib diisi', 'error');
      return;
    }

    const newFb: ClientFeedbackItem = {
      id: `fb-${Date.now()}`,
      clientName: feedbackDraft.clientName.trim(),
      email: feedbackDraft.email.trim() || undefined,
      feedbackText: feedbackDraft.feedbackText.trim(),
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    saveFeedbacks([newFb, ...feedbacks]);
    setShowFeedbackModal(false);
    setFeedbackDraft({ clientName: '', email: '', feedbackText: '' });
    notify?.('Masukan klien berhasil dicatat!', 'success');
  };

  // Convert Feedback to 5-Star Testimonial
  const handleConvertFeedbackToReview = (fb: ClientFeedbackItem) => {
    setEditingReview(null);
    setReviewDraft({
      clientName: fb.clientName,
      reviewText: fb.feedbackText,
      rating: 5,
      brand: '',
      role: '',
      isFeatured: true,
      serviceCategory: 'Klien Studio',
      avatarUrl: ''
    });
    setShowReviewModal(true);
  };

  // Handlers for FAQ
  const handleSaveFaq = () => {
    if (!faqDraft.question?.trim() || !faqDraft.answer?.trim()) {
      notify?.('Pertanyaan dan jawaban wajib diisi', 'error');
      return;
    }

    if (editingFaq) {
      const updated = faqs.map(f => f.id === editingFaq.id ? { ...f, ...faqDraft } as ClientFaqItem : f);
      saveFaqs(updated);
      notify?.('QnA berhasil diperbarui!', 'success');
    } else {
      const newFaq: ClientFaqItem = {
        id: `faq-${Date.now()}`,
        question: faqDraft.question || '',
        answer: faqDraft.answer || '',
        category: faqDraft.category || 'Umum',
        order: faqs.length + 1
      };
      saveFaqs([...faqs, newFaq]);
      notify?.('Pertanyaan baru ditambahkan ke FAQ!', 'success');
    }

    setShowFaqModal(false);
    setEditingFaq(null);
  };

  const handleDeleteFaq = (id: string) => {
    const action = () => {
      saveFaqs(faqs.filter(f => f.id !== id));
      notify?.('FAQ dihapus', 'info');
    };

    if (confirm) {
      confirm({
        title: 'Hapus FAQ?',
        message: 'Hapus pertanyaan ini dari bank QnA?',
        isDestructive: true,
        onConfirm: action
      });
    } else {
      if (window.confirm('Hapus pertanyaan ini?')) action();
    }
  };

  const publicFeedbackUrl = `${window.location.origin}/feedback`;

  const handleCopyFeedbackLink = () => {
    navigator.clipboard.writeText(publicFeedbackUrl);
    setCopiedFeedbackLink(true);
    setTimeout(() => setCopiedFeedbackLink(false), 2000);
    notify?.('Tautan formulir masukan disalin!', 'success');
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1) 
    : '5.0';
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;

  const embedSnippet = `<iframe src="${window.location.origin}/feedback?embed=true" width="100%" height="600" frameborder="0" style="border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbedCode(true);
    setTimeout(() => setCopiedEmbedCode(false), 2000);
    notify?.('Kode embed widget berhasil disalin!', 'success');
  };

  return (
    <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header Banner ── */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 22,
        padding: '18px 24px',
        boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Kembali"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                color: 'var(--cms-text, currentColor)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Quote size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
              Ulasan
            </h2>
          </div>
        </div>

        {/* Action Buttons (Icon-only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Embed Widget Button */}
          <button
            type="button"
            onClick={() => setShowEmbedModal(true)}
            title="Embed Widget"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: 'var(--cms-text, currentColor)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <Code2 size={16} color="#8b5cf6" />
          </button>

          {/* Copy Public Feedback Form Link (Icon only) */}
          <button
            type="button"
            onClick={handleCopyFeedbackLink}
            title={copiedFeedbackLink ? 'Link Formulir Tersalin!' : 'Salin Link Formulir Masukan Klien'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: 'var(--cms-text, currentColor)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            {copiedFeedbackLink ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#8b5cf6" />}
          </button>

          {/* Open Public Feedback Form (Icon only) */}
          <button
            type="button"
            onClick={() => window.open(publicFeedbackUrl, '_blank')}
            title="Buka Formulir Masukan Klien (Tab Baru)"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: 'var(--cms-text, currentColor)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <ExternalLink size={16} color="#8b5cf6" />
          </button>

          {activeTab === 'reviews' && (
            <button
              type="button"
              onClick={() => {
                setEditingReview(null);
                setReviewDraft({ rating: 5, clientName: '', brand: '', role: '', reviewText: '', isFeatured: true, avatarUrl: '' });
                setShowReviewModal(true);
              }}
              title="Tambah Ulasan"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={18} />
            </button>
          )}

          {activeTab === 'feedbacks' && (
            <button
              type="button"
              onClick={() => {
                setFeedbackDraft({ clientName: '', email: '', feedbackText: '' });
                setShowFeedbackModal(true);
              }}
              title="Catat Masukan"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={18} />
            </button>
          )}

          {activeTab === 'faqs' && (
            <button
              type="button"
              onClick={() => {
                setEditingFaq(null);
                setFaqDraft({ question: '', answer: '', category: 'Umum' });
                setShowFaqModal(true);
              }}
              title="Tambah FAQ"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── SOCIAL PROOF & CLIENT SATISFACTION STATS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14
      }}>
        {/* Card 1 */}
        <div style={{
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          borderRadius: 18,
          padding: '16px 20px',
          boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Star size={20} fill="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
              Rating
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
              {avgRating} <span style={{ fontSize: 13, color: 'var(--cms-text-muted)' }}>/ 5.0</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          borderRadius: 18,
          padding: '16px 20px',
          boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
              Bintang
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
              {fiveStarCount}
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          borderRadius: 18,
          padding: '16px 20px',
          boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
              Masukan
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
              {feedbacks.length}
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div style={{
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          borderRadius: 18,
          padding: '16px 20px',
          boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <HelpCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
              FAQ
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
              {faqs.length}
            </div>
          </div>
        </div>
      </div>

      {/* ── Segmented Tab Switcher (Ulasan | Masukan | FAQ) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'var(--cms-card-bg, #ffffff)',
        padding: '10px 16px',
        borderRadius: 16,
        border: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
      }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))', padding: 4, borderRadius: 100, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '7px 18px',
              borderRadius: 100,
              border: 'none',
              background: activeTab === 'reviews' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'reviews' ? '#ffffff' : 'var(--cms-text-muted)',
              fontWeight: activeTab === 'reviews' ? 850 : 600,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <Star size={14} />
            <span>Ulasan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedbacks')}
            style={{
              padding: '7px 18px',
              borderRadius: 100,
              border: 'none',
              background: activeTab === 'feedbacks' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'feedbacks' ? '#ffffff' : 'var(--cms-text-muted)',
              fontWeight: activeTab === 'feedbacks' ? 850 : 600,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={14} />
            <span>Masukan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            style={{
              padding: '7px 18px',
              borderRadius: 100,
              border: 'none',
              background: activeTab === 'faqs' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'faqs' ? '#ffffff' : 'var(--cms-text-muted)',
              fontWeight: activeTab === 'faqs' ? 850 : 600,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <HelpCircle size={14} />
            <span>FAQ</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: 180 }}>
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 14px 7px 32px',
              borderRadius: 100,
              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
              color: 'var(--cms-text, currentColor)',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
        </div>
      </div>

      {/* ── TAB 1: REVIEWS / TESTIMONI ── */}
      {activeTab === 'reviews' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 18
        }}>
          {reviews.filter(r => !searchQuery || r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || r.reviewText.toLowerCase().includes(searchQuery.toLowerCase())).map(rev => (
            <div
              key={rev.id}
              style={{
                background: 'var(--cms-card-bg, #ffffff)',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                borderRadius: 20,
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
                boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                {/* Client Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {rev.avatarUrl ? (
                      <img
                        src={rev.avatarUrl}
                        alt={rev.clientName}
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #8b5cf6' }}
                      />
                    ) : (
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 850,
                        fontSize: 16
                      }}>
                        {rev.clientName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text, currentColor)' }}>
                        {rev.clientName}
                      </h4>
                      {(rev.role || rev.brand) && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #64748b)' }}>
                          {rev.role} {rev.brand ? `• ${rev.brand}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? '#f59e0b' : 'none'}
                        color={i < rev.rating ? '#f59e0b' : 'var(--cms-text-muted)'}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Quote */}
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--cms-text, currentColor)', fontStyle: 'italic', opacity: 0.9 }}>
                  "{rev.reviewText}"
                </p>
              </div>

              {/* Card Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.06))'
              }}>
                <span style={{ fontSize: 11, fontWeight: 750, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '3px 10px', borderRadius: 100 }}>
                  {rev.serviceCategory || 'Proyek Klien'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Eye Toggle: Publish review on client website */}
                  <button
                    type="button"
                    onClick={() => handleToggleReviewPublish(rev.id)}
                    style={{
                      background: rev.isPublished ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${rev.isPublished ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                      color: rev.isPublished ? '#10b981' : '#ef4444',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 100,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 750,
                      transition: 'all 0.15s ease'
                    }}
                    title={rev.isPublished ? "Aktif tayang di web klien (Klik untuk jadikan Draft)" : "Draft / Tersembunyi (Klik untuk tayangkan di web klien)"}
                  >
                    {rev.isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{rev.isPublished ? 'Tayang' : 'Draft'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingReview(rev);
                      setReviewDraft(rev);
                      setShowReviewModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}
                    title="Edit Ulasan"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id, rev.clientName)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                    title="Hapus Ulasan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: FEEDBACKS / MASUKAN KLIEN ── */}
      {activeTab === 'feedbacks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {feedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1px dashed var(--cms-border)' }}>
              <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 13.5 }}>
                Belum ada masukan tersimpan. Klik "Catat Masukan Manual" atau bagikan tautan formulir ke klien Anda.
              </p>
            </div>
          ) : (
            feedbacks.map(fb => (
              <div
                key={fb.id}
                style={{
                  background: 'var(--cms-card-bg, #ffffff)',
                  borderRadius: 18,
                  padding: '18px 22px',
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 14,
                  boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.03))'
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                      {fb.clientName}
                    </h4>
                    {fb.email && (
                      <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                        ({fb.email})
                      </span>
                    )}
                    <span style={{ fontSize: 10.5, fontWeight: 750, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 100 }}>
                      Masukan Masuk
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cms-text)', lineHeight: 1.5 }}>
                    "{fb.feedbackText}"
                  </p>
                </div>

                {/* Actions: Convert to Testimonial & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleConvertFeedbackToReview(fb)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: 'none',
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#8b5cf6',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                    title="Ubah masukan ini menjadi testimoni bintang 5 publik"
                  >
                    <Star size={13} fill="#8b5cf6" />
                    <span>Jadikan Testimoni</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => saveFeedbacks(feedbacks.filter(f => f.id !== fb.id))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Hapus Masukan"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 3: QNA / FAQ ── */}
      {activeTab === 'faqs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.filter(f => !searchQuery || f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase())).map((faq, idx) => (
            <div
              key={faq.id}
              style={{
                background: 'var(--cms-card-bg, #ffffff)',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                borderRadius: 18,
                padding: '18px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.03))'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {idx + 1}
                  </span>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>
                    {faq.question}
                  </h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFaq(faq);
                      setFaqDraft(faq);
                      setShowFaqModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}
                    title="Edit FAQ"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                    title="Hapus FAQ"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 0 36px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--cms-text-muted)' }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL TAMBAH/EDIT REVIEW (DENGAN UPLOAD GAMBAR) ── */}
      {showReviewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setShowReviewModal(false)}>
          <div style={{
            maxWidth: 540,
            width: '100%',
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 22,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: 'var(--cms-text)' }}>
                {editingReview ? 'Edit Testimoni Klien' : 'Tambah Testimoni Baru'}
              </h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Avatar / Photo Upload Field */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6, display: 'block' }}>
                  Foto Profil Klien / Logo Perusahaan (Upload)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {reviewDraft.avatarUrl ? (
                    <div style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid #8b5cf6' }}>
                      <img src={reviewDraft.avatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setReviewDraft(prev => ({ ...prev, avatarUrl: '' }))}
                        style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Hapus Foto"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 14,
                        border: '1.5px dashed var(--cms-border, rgba(255,255,255,0.2))',
                        background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                        color: 'var(--cms-text)',
                        fontSize: 12.5,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <Upload size={15} color="#8b5cf6" />
                      <span>Unggah Foto dari Perangkat</span>
                    </button>
                  )}
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                  {reviewDraft.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      style={{ fontSize: 12, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Ganti Foto
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Nama Klien / Instansi *</label>
                <input
                  type="text"
                  value={reviewDraft.clientName || ''}
                  onChange={e => setReviewDraft({ ...reviewDraft, clientName: e.target.value })}
                  placeholder="Contoh: Rian Sanjaya"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Brand & Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Brand / Perusahaan</label>
                  <input
                    type="text"
                    value={reviewDraft.brand || ''}
                    onChange={e => setReviewDraft({ ...reviewDraft, brand: e.target.value })}
                    placeholder="Contoh: Studio Kita"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Jabatan / Role</label>
                  <input
                    type="text"
                    value={reviewDraft.role || ''}
                    onChange={e => setReviewDraft({ ...reviewDraft, role: e.target.value })}
                    placeholder="Contoh: CEO"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Rating Bintang (1 - 5)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewDraft({ ...reviewDraft, rating: star })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star size={24} fill={star <= (reviewDraft.rating || 5) ? '#f59e0b' : 'none'} color={star <= (reviewDraft.rating || 5) ? '#f59e0b' : '#cbd5e1'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Isi Ulasan / Testimoni *</label>
                <textarea
                  rows={4}
                  value={reviewDraft.reviewText || ''}
                  onChange={e => setReviewDraft({ ...reviewDraft, reviewText: e.target.value })}
                  placeholder="Kutipan kepuasan hasil kerja, profesionalitas, dll..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Publication & Featured Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))', padding: '12px 14px', borderRadius: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 750, color: reviewDraft.isPublished ? '#10b981' : 'var(--cms-text)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!reviewDraft.isPublished}
                    onChange={e => setReviewDraft({ ...reviewDraft, isPublished: e.target.checked })}
                    style={{ accentColor: '#10b981', width: 16, height: 16 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {reviewDraft.isPublished ? <Eye size={15} color="#10b981" /> : <EyeOff size={15} color="var(--cms-text-muted)" />}
                    <span>Aktifkan Mata (Tayangkan Ulasan ini di Web Klien)</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={reviewDraft.isFeatured !== false}
                    onChange={e => setReviewDraft({ ...reviewDraft, isFeatured: e.target.checked })}
                    style={{ accentColor: '#8b5cf6', width: 16, height: 16 }}
                  />
                  <span>Tandai sebagai Ulasan Unggulan (Featured Highlight)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{ height: 42, padding: '0 16px', borderRadius: 100, border: '1px solid var(--cms-border)', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                style={{ height: 42, padding: '0 22px', borderRadius: 100, border: 'none', background: '#8b5cf6', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Simpan Testimoni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CATAT MASUKAN MANUAL ── */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setShowFeedbackModal(false)}>
          <div style={{
            maxWidth: 500,
            width: '100%',
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 22,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: 'var(--cms-text)' }}>
                Catat Masukan Klien Manual
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Nama Klien *</label>
                <input
                  type="text"
                  value={feedbackDraft.clientName}
                  onChange={e => setFeedbackDraft({ ...feedbackDraft, clientName: e.target.value })}
                  placeholder="Contoh: Maya Anggraini"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Kontak WhatsApp / Email (Opsional)</label>
                <input
                  type="text"
                  value={feedbackDraft.email}
                  onChange={e => setFeedbackDraft({ ...feedbackDraft, email: e.target.value })}
                  placeholder="08123456789 atau email@client.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Pesan Masukan / Saran *</label>
                <textarea
                  rows={4}
                  value={feedbackDraft.feedbackText}
                  onChange={e => setFeedbackDraft({ ...feedbackDraft, feedbackText: e.target.value })}
                  placeholder="Kritik, saran perbaikan alur kerja, atau ide fitur..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                style={{ height: 42, padding: '0 16px', borderRadius: 100, border: '1px solid var(--cms-border)', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFeedbackManual}
                style={{ height: 42, padding: '0 22px', borderRadius: 100, border: 'none', background: '#8b5cf6', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Simpan Masukan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH/EDIT FAQ ── */}
      {showFaqModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setShowFaqModal(false)}>
          <div style={{
            maxWidth: 500,
            width: '100%',
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 22,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: 'var(--cms-text)' }}>
                {editingFaq ? 'Edit FAQ / QnA' : 'Tambah Pertanyaan Baru'}
              </h3>
              <button onClick={() => setShowFaqModal(false)} style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Kategori FAQ</label>
                <input
                  type="text"
                  value={faqDraft.category || ''}
                  onChange={e => setFaqDraft({ ...faqDraft, category: e.target.value })}
                  placeholder="Contoh: Layanan / Ketentuan / Pembayaran"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Pertanyaan (Q) *</label>
                <input
                  type="text"
                  value={faqDraft.question || ''}
                  onChange={e => setFaqDraft({ ...faqDraft, question: e.target.value })}
                  placeholder="Contoh: Berapa lama waktu pengerjaan proyek?"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>Jawaban (A) *</label>
                <textarea
                  rows={4}
                  value={faqDraft.answer || ''}
                  onChange={e => setFaqDraft({ ...faqDraft, answer: e.target.value })}
                  placeholder="Jawaban penjelasan ramah dan jelas bagi calon klien..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 14, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                style={{ height: 42, padding: '0 16px', borderRadius: 100, border: '1px solid var(--cms-border)', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveFaq}
                style={{ height: 42, padding: '0 22px', borderRadius: 100, border: 'none', background: '#8b5cf6', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Simpan FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMBED CODE & SOCIAL PROOF WIDGET MODAL ── */}
      {showEmbedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
            borderRadius: 24,
            width: '100%',
            maxWidth: 580,
            padding: '28px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Code2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)' }}>
                    Embed Widget & Social Proof
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--cms-text-muted, #64748b)' }}>
                    Pasang formulir & testimoni di landing page eksternal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Code Snippet Box */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: '14px 16px',
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#38bdf8',
              wordBreak: 'break-all',
              lineHeight: 1.5,
              position: 'relative',
              marginBottom: 16
            }}>
              {embedSnippet}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button
                type="button"
                onClick={handleCopyEmbed}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 12,
                  border: 'none',
                  background: copiedEmbedCode ? '#10b981' : '#8b5cf6',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  transition: 'all 0.15s ease'
                }}
              >
                {copiedEmbedCode ? <Check size={16} /> : <Copy size={15} />}
                <span>{copiedEmbedCode ? 'Kode Tersalin ke Clipboard!' : 'Salin Kode Iframe'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`${window.location.origin}/feedback`, '_blank')}
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 12,
                  border: '1px solid var(--cms-border)',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <ExternalLink size={14} />
                <span>Buka Form Klien</span>
              </button>
            </div>

            {/* Feature Highlights */}
            <div style={{
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 12.5,
              color: 'var(--cms-text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={13} color="#10b981" />
                <span>Responsif di semua perangkat (Desktop, Tablet, Mobile)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={13} color="#10b981" />
                <span>Masukan langsung tersimpan realtime di Agenze OS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={13} color="#10b981" />
                <span>Bisa dikonversi menjadi Testimoni 5-Bintang dengan 1 klik</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientVoiceManager;
