import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, BarChart2, Scale, Sliders, 
  MessageSquare, Plus, Trash2, CheckCircle2, Heart, HelpCircle,
  ShoppingBag, FolderGit2, Zap, ArrowRight, Clock, Tag, FileText,
  BookOpen, Eye, Check, Flame, ChevronDown, Star
} from 'lucide-react';
import { 
  UpdateSticker, UpdateStickerType, PollSticker, 
  ThisOrThatSticker, SliderRateSticker, QnASticker,
  ProductSticker, PortfolioSticker, ArticleSticker, FlashSaleSticker
} from '../../../types/socialUpdates';
import { storage } from '../../../utils/storage';

interface UpdateStickerModalProps {
  isOpen: boolean;
  initialSticker?: UpdateSticker | null;
  onClose: () => void;
  onSave: (sticker: UpdateSticker | null) => void;
}

const EMOJI_OPTIONS = ['☀️', '🔥', '☕', '⭐', '❤️', '⚡', '🏖️', '🎧', '🚀', '💯'];

export const UpdateStickerModal: React.FC<UpdateStickerModalProps> = ({
  isOpen,
  initialSticker,
  onClose,
  onSave
}) => {
  const [stickerType, setStickerType] = useState<UpdateStickerType>('product_card');

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('Fitur apa yang paling seru untuk update berikutnya?');
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Website Portofolio Interaktif',
    'Aset Skena & Icon Pack',
    'Tema Musik Lo-Fi'
  ]);

  // This or That state
  const [totQuestion, setTotQuestion] = useState('Pilih mana vibe favoritmu:');
  const [totOptionA, setTotOptionA] = useState('Warm Tech & Flow');
  const [totEmojiA, setTotEmojiA] = useState('☀️');
  const [totOptionB, setTotOptionB] = useState('Skena-Aesthetic Vibes');
  const [totEmojiB, setTotEmojiB] = useState('🎧');

  // Slider Rate state
  const [sliderQuestion, setSliderQuestion] = useState('Seberapa hangat vibe update ini?');
  const [sliderEmoji, setSliderEmoji] = useState('☀️');
  const [sliderMinLabel, setSliderMinLabel] = useState('Biasa Saja');
  const [sliderMaxLabel, setSliderMaxLabel] = useState('Hangat Pol! ☀️');
  const [previewSliderVal, setPreviewSliderVal] = useState(85);

  // QnA state
  const [qnaPrompt, setQnaPrompt] = useState('Tanya apa saja seputar karya & rilisan sumr.day club! ☀️');
  const [qnaPlaceholder, setQnaPlaceholder] = useState('Tulis pertanyaanmu di sini...');

  // Product sticker state
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOrigPrice, setProdOrigPrice] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodUrl, setProdUrl] = useState('/katalog');
  const [prodBadge, setProdBadge] = useState('PRODUK STORE');

  // Portfolio sticker state
  const [portTitle, setPortTitle] = useState('');
  const [portCategory, setPortCategory] = useState('KARYA TERPILIH');
  const [portImage, setPortImage] = useState('');
  const [portUrl, setPortUrl] = useState('/portfolio');

  // Article sticker state
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('ARTIKEL PILIHAN');
  const [artImage, setArtImage] = useState('');
  const [artUrl, setArtUrl] = useState('/blog');
  const [artReadTime, setArtReadTime] = useState('4 mnt baca');

  // Flash Sale sticker state
  const [fsTitle, setFsTitle] = useState('');
  const [fsOrigPrice, setFsOrigPrice] = useState('');
  const [fsSalePrice, setFsSalePrice] = useState('');
  const [fsDiscount, setFsDiscount] = useState<number>(50);
  const [fsEndTime, setFsEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d.toISOString();
  });
  const [fsImage, setFsImage] = useState('');
  const [fsUrl, setFsUrl] = useState('/katalog');
  const [fsStock, setFsStock] = useState('10');

  // Quick Select data from storage
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [portfolioProjects, setPortfolioProjects] = useState<any[]>([]);
  const [blogArticles, setBlogArticles] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    storage.getItem('porto_catalog_products', []).then((prods: any[]) => {
      setCatalogProducts(Array.isArray(prods) ? prods : []);
    });
    storage.getItem('porto_projects', []).then((projs: any[]) => {
      setPortfolioProjects(Array.isArray(projs) ? projs : []);
    });
    storage.getItem('porto_blog_posts', []).then((arts: any[]) => {
      setBlogArticles(Array.isArray(arts) ? arts : []);
    });
  }, [isOpen]);

  // Synchronize state when initialSticker or isOpen changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialSticker) {
      setStickerType(initialSticker.type);

      if (initialSticker.type === 'poll') {
        setPollQuestion(initialSticker.question || 'Poling sumr.day club');
        setPollOptions(initialSticker.options?.map(o => o.text) || ['Pilihan 1', 'Pilihan 2']);
      } else if (initialSticker.type === 'this_or_that') {
        setTotQuestion(initialSticker.question || 'Pilih mana favoritmu:');
        setTotOptionA(initialSticker.optionA?.text || 'Opsi A');
        setTotEmojiA(initialSticker.optionA?.emoji || '☀️');
        setTotOptionB(initialSticker.optionB?.text || 'Opsi B');
        setTotEmojiB(initialSticker.optionB?.emoji || '🎧');
      } else if (initialSticker.type === 'slider_rate') {
        setSliderQuestion(initialSticker.question || 'Seberapa hangat vibe update ini?');
        setSliderEmoji(initialSticker.emoji || '☀️');
        setSliderMinLabel(initialSticker.minLabel || 'Biasa');
        setSliderMaxLabel(initialSticker.maxLabel || 'Hangat Pol! ☀️');
        setPreviewSliderVal(initialSticker.averageScore || 85);
      } else if (initialSticker.type === 'qna') {
        setQnaPrompt(initialSticker.prompt || 'Tanya sumr.day club');
        setQnaPlaceholder(initialSticker.placeholder || 'Tulis pertanyaanmu di sini...');
      } else if (initialSticker.type === 'product_card') {
        setProdTitle(initialSticker.title || '');
        setProdPrice(String(initialSticker.price || ''));
        setProdOrigPrice(initialSticker.originalPrice ? String(initialSticker.originalPrice) : '');
        setProdImage(initialSticker.imageUrl || '');
        setProdUrl(initialSticker.productUrl || '/katalog');
        setProdBadge(initialSticker.badge || 'PRODUK STORE');
      } else if (initialSticker.type === 'portfolio_card') {
        setPortTitle(initialSticker.title || '');
        setPortCategory(initialSticker.category || 'KARYA TERPILIH');
        setPortImage(initialSticker.imageUrl || '');
        setPortUrl(initialSticker.projectUrl || '/portfolio');
      } else if (initialSticker.type === 'article_card') {
        setArtTitle(initialSticker.title || '');
        setArtCategory(initialSticker.category || 'ARTIKEL PILIHAN');
        setArtImage(initialSticker.imageUrl || '');
        setArtUrl(initialSticker.articleUrl || '/blog');
        setArtReadTime(initialSticker.readTime || '4 mnt baca');
      } else if (initialSticker.type === 'flash_sale') {
        setFsTitle(initialSticker.title || '');
        setFsOrigPrice(String(initialSticker.originalPrice || ''));
        setFsSalePrice(String(initialSticker.salePrice || ''));
        setFsDiscount(initialSticker.discountPercent || 50);
        setFsEndTime(initialSticker.endTime || new Date(Date.now() + 86400000).toISOString());
        setFsImage(initialSticker.imageUrl || '');
        setFsUrl(initialSticker.productUrl || '/katalog');
        setFsStock(initialSticker.stockLeft !== undefined ? String(initialSticker.stockLeft) : '10');
      }
    } else {
      // Default to product_card if no existing sticker
      setStickerType('product_card');
    }
  }, [isOpen, initialSticker]);

  if (!isOpen) return null;

  // Format IDR Helper
  const formatRupiah = (v: string | number) => {
    if (!v) return 'Rp 0';
    if (typeof v === 'string' && v.startsWith('Rp')) return v;
    const num = typeof v === 'number' ? v : parseInt(String(v).replace(/\D/g, ''), 10) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Poll helpers
  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, `Pilihan ${pollOptions.length + 1}`]);
    }
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleSave = () => {
    if (stickerType === 'poll') {
      const validOptions = pollOptions.filter(t => t.trim().length > 0);
      if (validOptions.length < 2) return;
      const poll: PollSticker = {
        type: 'poll',
        question: pollQuestion.trim() || 'Poling sumr.day club',
        options: validOptions.map((text, i) => ({
          id: `opt-${i + 1}`,
          text: text.trim(),
          votes: 0
        }))
      };
      onSave(poll);
    } else if (stickerType === 'this_or_that') {
      const tot: ThisOrThatSticker = {
        type: 'this_or_that',
        question: totQuestion.trim() || 'This or That',
        optionA: {
          id: 'opt-a',
          text: totOptionA.trim() || 'Opsi A',
          emoji: totEmojiA,
          votes: 0
        },
        optionB: {
          id: 'opt-b',
          text: totOptionB.trim() || 'Opsi B',
          emoji: totEmojiB,
          votes: 0
        }
      };
      onSave(tot);
    } else if (stickerType === 'slider_rate') {
      const rate: SliderRateSticker = {
        type: 'slider_rate',
        question: sliderQuestion.trim() || 'Beri Rating',
        emoji: sliderEmoji || '☀️',
        minLabel: sliderMinLabel.trim() || 'Biasa',
        maxLabel: sliderMaxLabel.trim() || 'Hangat Pol! ☀️',
        totalScore: 0,
        ratingsCount: 0,
        averageScore: 0
      };
      onSave(rate);
    } else if (stickerType === 'qna') {
      const qna: QnASticker = {
        type: 'qna',
        prompt: qnaPrompt.trim() || 'Tanya sumr.day club',
        placeholder: qnaPlaceholder.trim() || 'Tulis pesanmu...',
        responses: initialSticker?.type === 'qna' ? (initialSticker.responses || []) : []
      };
      onSave(qna);
    } else if (stickerType === 'product_card') {
      const pCard: ProductSticker = {
        type: 'product_card',
        title: prodTitle.trim() || 'Produk Store',
        price: prodPrice || '0',
        originalPrice: prodOrigPrice || undefined,
        imageUrl: prodImage || undefined,
        productUrl: prodUrl || '/katalog',
        badge: prodBadge || 'PRODUK STORE',
        buttonText: 'Lihat di Store'
      };
      onSave(pCard);
    } else if (stickerType === 'portfolio_card') {
      const port: PortfolioSticker = {
        type: 'portfolio_card',
        title: portTitle.trim() || 'Karya Unggulan',
        category: portCategory || 'KARYA TERPILIH',
        imageUrl: portImage || undefined,
        projectUrl: portUrl || '/portfolio',
        buttonText: 'Lihat Karya'
      };
      onSave(port);
    } else if (stickerType === 'article_card') {
      const art: ArticleSticker = {
        type: 'article_card',
        title: artTitle.trim() || 'Artikel Wawasan',
        category: artCategory || 'ARTIKEL PILIHAN',
        imageUrl: artImage || undefined,
        articleUrl: artUrl || '/blog',
        readTime: artReadTime || '4 mnt baca',
        buttonText: 'Baca Artikel'
      };
      onSave(art);
    } else if (stickerType === 'flash_sale') {
      const fs: FlashSaleSticker = {
        type: 'flash_sale',
        title: fsTitle.trim() || 'Flash Sale Spesial',
        originalPrice: fsOrigPrice || '100000',
        salePrice: fsSalePrice || '50000',
        discountPercent: fsDiscount || 50,
        endTime: fsEndTime,
        imageUrl: fsImage || undefined,
        productUrl: fsUrl || '/katalog',
        stockLeft: fsStock ? parseInt(fsStock, 10) : undefined
      };
      onSave(fs);
    }
  };

  const tabs = [
    { id: 'flash_sale', label: 'Flash Sale', icon: Zap, color: '#ef4444' },
    { id: 'product_card', label: 'Produk', icon: ShoppingBag, color: '#10b981' },
    { id: 'portfolio_card', label: 'Karya', icon: FolderGit2, color: '#6366f1' },
    { id: 'article_card', label: 'Artikel', icon: FileText, color: '#f59e0b' },
    { id: 'slider_rate', label: 'Rate Geser', icon: Sliders, color: '#f59e0b' },
    { id: 'poll', label: 'Poling', icon: BarChart2, color: '#0284c7' },
    { id: 'this_or_that', label: 'A vs B', icon: Scale, color: '#ec4899' },
    { id: 'qna', label: 'QnA', icon: MessageSquare, color: '#8b5cf6' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 620,
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'var(--cms-card-bg, #ffffff)',
        color: 'var(--cms-text, #0f172a)',
        borderRadius: 24,
        border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        padding: '24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        boxSizing: 'border-box'
      }}>
        {/* ── MODAL HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cms-border, rgba(0,0,0,0.06))', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--cms-text, #0f172a)' }}>
                  Stiker Interaktif
                </h3>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  Live Interactive
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #64748b)' }}>
                Pasang stiker produk, promo, poling, atau interaksi langsung di feed postingan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
              background: 'transparent',
              color: 'var(--cms-text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Tutup"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── STICKER TYPE TABS (MODERN SEGMENTED PILLS) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          background: 'var(--cms-switcher-bg, rgba(0,0,0,0.03))',
          padding: 6,
          borderRadius: 16,
          border: '1px solid var(--cms-border, rgba(0,0,0,0.06))'
        }}>
          {tabs.map(tab => {
            const isActive = stickerType === tab.id;
            const IconComp = tab.icon;
            const activeColor = tab.color;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStickerType(tab.id as UpdateStickerType)}
                style={{
                  padding: '9px 6px',
                  borderRadius: 12,
                  border: isActive ? `1.5px solid ${activeColor}` : '1px solid transparent',
                  background: isActive ? (activeColor === '#10b981' ? 'rgba(16, 185, 129, 0.15)' : `${activeColor}18`) : 'transparent',
                  color: isActive ? activeColor : 'var(--cms-text-muted, #64748b)',
                  fontSize: 11.5,
                  fontWeight: isActive ? 850 : 650,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp size={15} color={isActive ? activeColor : 'currentColor'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── FORM FIELDS CONTAINER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* ════════ 1. FLASH SALE FORM ════════ */}
          {stickerType === 'flash_sale' && (
            <>
              {catalogProducts.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Zap size={14} fill="#ef4444" />
                    <span>Ambil Cepat dari Produk Store untuk Flash Sale:</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const prod = catalogProducts.find(p => p.id === e.target.value);
                      if (prod) {
                        setFsTitle(`Flash Sale: ${prod.name}`);
                        const orig = Number(prod.price || 0);
                        setFsOrigPrice(String(orig));
                        setFsSalePrice(String(Math.round(orig * (1 - fsDiscount / 100))));
                        if (prod.gallery?.[0]) setFsImage(prod.gallery[0]);
                        setFsUrl(`/katalog?product=${prod.id}`);
                        setFsStock(String(prod.stock || 10));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12.5,
                      fontWeight: 650,
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Pilih Produk untuk Di-diskon (Otomatis Isi) --</option>
                    {catalogProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatRupiah(p.price || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Judul Promo Flash Sale
                </label>
                <input
                  type="text"
                  value={fsTitle}
                  onChange={e => setFsTitle(e.target.value)}
                  placeholder="Contoh: Flash Sale Bundle Desain Eksklusif..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Pricing & Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Harga Normal (Rp)
                  </label>
                  <input
                    type="number"
                    value={fsOrigPrice}
                    onChange={e => {
                      const v = e.target.value;
                      setFsOrigPrice(v);
                      const orig = Number(v) || 0;
                      setFsSalePrice(String(Math.round(orig * (1 - fsDiscount / 100))));
                    }}
                    placeholder="100000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 4, display: 'block', color: '#ef4444' }}>
                    Harga Flash Sale (Rp)
                  </label>
                  <input
                    type="number"
                    value={fsSalePrice}
                    onChange={e => setFsSalePrice(e.target.value)}
                    placeholder="50000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1.5px solid rgba(239, 68, 68, 0.4)',
                      background: 'var(--cms-input-bg, transparent)',
                      color: '#ef4444',
                      fontSize: 13,
                      fontWeight: 850,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Discount Presets */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 5, display: 'block', color: 'var(--cms-text-muted)' }}>
                  Persentase Diskon:
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[20, 30, 40, 50, 60, 70, 80].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setFsDiscount(pct);
                        const orig = Number(fsOrigPrice) || 0;
                        if (orig > 0) {
                          setFsSalePrice(String(Math.round(orig * (1 - pct / 100))));
                        }
                      }}
                      style={{
                        padding: '4px 11px',
                        borderRadius: 8,
                        border: fsDiscount === pct ? '1.5px solid #ef4444' : '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                        background: fsDiscount === pct ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        color: fsDiscount === pct ? '#ef4444' : 'var(--cms-text-muted)',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Sisa Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--cms-text)' }}>
                    <Clock size={12} color="#ef4444" />
                    <span>Batas Waktu Berakhir:</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={fsEndTime.slice(0, 16)}
                    onChange={e => {
                      try {
                        setFsEndTime(new Date(e.target.value).toISOString());
                      } catch {}
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text)' }}>
                    Sisa Slot Promo
                  </label>
                  <input
                    type="number"
                    value={fsStock}
                    onChange={e => setFsStock(e.target.value)}
                    placeholder="10"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Tautan Produk (/katalog)
                  </label>
                  <input
                    type="text"
                    value={fsUrl}
                    onChange={e => setFsUrl(e.target.value)}
                    placeholder="/katalog"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    URL Gambar (Thumbnail)
                  </label>
                  <input
                    type="text"
                    value={fsImage}
                    onChange={e => setFsImage(e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ════════ 2. PRODUCT CARD FORM ════════ */}
          {stickerType === 'product_card' && (
            <>
              {catalogProducts.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <label style={{ fontSize: 12, fontWeight: 850, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <ShoppingBag size={14} />
                    <span>Ambil Cepat dari Produk Store:</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const prod = catalogProducts.find(p => p.id === e.target.value);
                      if (prod) {
                        setProdTitle(prod.name);
                        setProdPrice(String(prod.price || 0));
                        if (prod.originalPrice) setProdOrigPrice(String(prod.originalPrice));
                        if (prod.gallery?.[0]) setProdImage(prod.gallery[0]);
                        setProdUrl(`/katalog?product=${prod.id}`);
                        setProdBadge(prod.category || 'PRODUK STORE');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12.5,
                      fontWeight: 650,
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Pilih Produk Store (Otomatis Isi) --</option>
                    {catalogProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatRupiah(p.price || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={prodTitle}
                  onChange={e => setProdTitle(e.target.value)}
                  placeholder="Contoh: Kaos Oversize Premium / Template UI..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 800, marginBottom: 4, display: 'block', color: '#10b981' }}>
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    placeholder="125000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1.5px solid rgba(16, 185, 129, 0.35)',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      fontWeight: 750,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Harga Asli Coret (Opsional)
                  </label>
                  <input
                    type="number"
                    value={prodOrigPrice}
                    onChange={e => setProdOrigPrice(e.target.value)}
                    placeholder="175000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Badge / Kategori
                  </label>
                  <input
                    type="text"
                    value={prodBadge}
                    onChange={e => setProdBadge(e.target.value)}
                    placeholder="PRODUK STORE"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Tautan Produk (/katalog)
                  </label>
                  <input
                    type="text"
                    value={prodUrl}
                    onChange={e => setProdUrl(e.target.value)}
                    placeholder="/katalog"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                  URL Gambar Produk (Thumbnail)
                </label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={e => setProdImage(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          {/* ════════ 3. PORTFOLIO CARD FORM ════════ */}
          {stickerType === 'portfolio_card' && (
            <>
              {portfolioProjects.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <label style={{ fontSize: 12, fontWeight: 850, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FolderGit2 size={14} />
                    <span>Ambil Cepat dari Portofolio Karya:</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const proj = portfolioProjects.find(p => p.id === e.target.value);
                      if (proj) {
                        setPortTitle(proj.title || proj.name);
                        setPortCategory(proj.category || 'KARYA TERPILIH');
                        const img = proj.cover || proj.image || proj.gallery?.[0] || '';
                        if (img) setPortImage(img);
                        setPortUrl(`/portfolio/${proj.id}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12.5,
                      fontWeight: 650,
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Pilih Karya Portofolio (Otomatis Isi) --</option>
                    {portfolioProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.name} — {p.category || 'Karya'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Judul Karya / Proyek
                </label>
                <input
                  type="text"
                  value={portTitle}
                  onChange={e => setPortTitle(e.target.value)}
                  placeholder="Contoh: Identitas Visual Brand Kopi Lokal..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Kategori Karya
                  </label>
                  <input
                    type="text"
                    value={portCategory}
                    onChange={e => setPortCategory(e.target.value)}
                    placeholder="BRANDING & UI/UX"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Tautan Proyek (/portfolio/...)
                  </label>
                  <input
                    type="text"
                    value={portUrl}
                    onChange={e => setPortUrl(e.target.value)}
                    placeholder="/portfolio"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                  URL Gambar Cover Karya
                </label>
                <input
                  type="text"
                  value={portImage}
                  onChange={e => setPortImage(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          {/* ════════ 4. ARTICLE CARD FORM ════════ */}
          {stickerType === 'article_card' && (
            <>
              {blogArticles.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <label style={{ fontSize: 12, fontWeight: 850, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FileText size={14} />
                    <span>Ambil Cepat dari Artikel Blog:</span>
                  </label>
                  <select
                    onChange={(e) => {
                      const art = blogArticles.find(a => a.id === e.target.value);
                      if (art) {
                        setArtTitle(art.title);
                        setArtCategory(art.category || 'ARTIKEL BLOG');
                        const img = art.coverImage || art.image || art.thumbnail || '';
                        if (img) setArtImage(img);
                        setArtUrl(`/blog/${art.slug || art.id}`);
                        setArtReadTime(art.readTime || '4 mnt baca');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12.5,
                      fontWeight: 650,
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Pilih Artikel Blog (Otomatis Isi) --</option>
                    {blogArticles.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title} — {a.category || 'Artikel'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Judul Artikel Blog
                </label>
                <input
                  type="text"
                  value={artTitle}
                  onChange={e => setArtTitle(e.target.value)}
                  placeholder="Contoh: Strategi Optimasi Web Berkinerja Tinggi..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Kategori / Topik
                  </label>
                  <input
                    type="text"
                    value={artCategory}
                    onChange={e => setArtCategory(e.target.value)}
                    placeholder="ARSITEKTUR WEB"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Waktu Baca
                  </label>
                  <input
                    type="text"
                    value={artReadTime}
                    onChange={e => setArtReadTime(e.target.value)}
                    placeholder="4 mnt baca"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                  URL Gambar Cover Artikel
                </label>
                <input
                  type="text"
                  value={artImage}
                  onChange={e => setArtImage(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          {/* ════════ 5. POLL FORM ════════ */}
          {stickerType === 'poll' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Pertanyaan Poling
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Tulis pertanyaan poling untuk kawan club..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 6, display: 'block', color: 'var(--cms-text-muted)' }}>
                  Opsi Pilihan (Min 2, Maks 4):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pollOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', width: 22 }}>
                        #{i + 1}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleUpdatePollOption(i, e.target.value)}
                        placeholder={`Opsi ${i + 1}`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                          background: 'var(--cms-input-bg, transparent)',
                          color: 'var(--cms-text)',
                          fontSize: 12.5,
                          outline: 'none'
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(i)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 8,
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 10,
                        border: '1px dashed var(--cms-border, rgba(0,0,0,0.2))',
                        background: 'transparent',
                        color: 'var(--cms-accent, #6366f1)',
                        fontSize: 12,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Plus size={13} />
                      <span>Tambah Opsi Pilihan</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ════════ 6. THIS OR THAT FORM ════════ */}
          {stickerType === 'this_or_that' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Pertanyaan Pilihan (A vs B)
                </label>
                <input
                  type="text"
                  value={totQuestion}
                  onChange={e => setTotQuestion(e.target.value)}
                  placeholder="Pilih mana favoritmu:"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Option A */}
                <div style={{ padding: 12, borderRadius: 14, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 850, color: '#f59e0b' }}>Opsi A</span>
                    <input
                      type="text"
                      value={totEmojiA}
                      onChange={e => setTotEmojiA(e.target.value)}
                      style={{ width: 34, textAlign: 'center', fontSize: 16, border: 'none', background: 'transparent', outline: 'none' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={totOptionA}
                    onChange={e => setTotOptionA(e.target.value)}
                    placeholder="Teks Opsi A"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Option B */}
                <div style={{ padding: 12, borderRadius: 14, background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 850, color: '#6366f1' }}>Opsi B</span>
                    <input
                      type="text"
                      value={totEmojiB}
                      onChange={e => setTotEmojiB(e.target.value)}
                      style={{ width: 34, textAlign: 'center', fontSize: 16, border: 'none', background: 'transparent', outline: 'none' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={totOptionB}
                    onChange={e => setTotOptionB(e.target.value)}
                    placeholder="Teks Opsi B"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      background: 'var(--cms-card-bg, #ffffff)',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ════════ 7. SLIDER RATE FORM ════════ */}
          {stickerType === 'slider_rate' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Pertanyaan Rating
                </label>
                <input
                  type="text"
                  value={sliderQuestion}
                  onChange={e => setSliderQuestion(e.target.value)}
                  placeholder="Seberapa hangat vibe update ini?"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 6, display: 'block', color: 'var(--cms-text-muted)' }}>
                  Pilih Emoji Geser:
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSliderEmoji(em)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: sliderEmoji === em ? '2px solid #f59e0b' : '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                        background: sliderEmoji === em ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                        fontSize: 18,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Label Minimal (0%)
                  </label>
                  <input
                    type="text"
                    value={sliderMinLabel}
                    onChange={e => setSliderMinLabel(e.target.value)}
                    placeholder="Biasa"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                    Label Maksimal (100%)
                  </label>
                  <input
                    type="text"
                    value={sliderMaxLabel}
                    onChange={e => setSliderMaxLabel(e.target.value)}
                    placeholder="Hangat Pol! ☀️"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ════════ 8. QNA FORM ════════ */}
          {stickerType === 'qna' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block', color: 'var(--cms-text)' }}>
                  Ajakan / Prompt Tanya Jawab
                </label>
                <input
                  type="text"
                  value={qnaPrompt}
                  onChange={e => setQnaPrompt(e.target.value)}
                  placeholder="Tanya apa saja seputar karya & rilisan sumr.day club! ☀️"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 750, marginBottom: 4, display: 'block', color: 'var(--cms-text-muted)' }}>
                  Placeholder Kolom Balasan
                </label>
                <input
                  type="text"
                  value={qnaPlaceholder}
                  onChange={e => setQnaPlaceholder(e.target.value)}
                  placeholder="Tulis pertanyaanmu di sini..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* ── PRATINJAU LIVE STIKER DI POSTINGAN (ALL 8 TYPES) ── */}
        <div style={{
          background: 'var(--cms-card-alt-bg, rgba(0,0,0,0.03))',
          borderRadius: 18,
          padding: 16,
          border: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={13} color="#f59e0b" />
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cms-text-muted, #64748b)' }}>
                Pratinjau Live Stiker di Postingan
              </span>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 750, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 7px', borderRadius: 100 }}>
              Simulasi Feed
            </span>
          </div>

          {/* 1. Preview: Flash Sale */}
          {stickerType === 'flash_sale' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.08) 100%)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed rgba(239, 68, 68, 0.25)', paddingBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: '#ef4444', color: '#fff', fontSize: 10.5, fontWeight: 900 }}>
                    <Zap size={11} fill="#fff" />
                    <span>FLASH SALE</span>
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#f59e0b', padding: '1px 6px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.18)' }}>
                    HEMAT {fsDiscount}%
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>
                  23:59:59 Sisa Waktu
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {fsImage ? (
                    <img src={fsImage} alt="FS" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(239, 68, 68, 0.25)' }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(239, 68, 68, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                      <Zap size={24} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text, #0f172a)' }}>
                      {fsTitle || 'Flash Sale Spesial'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 16, fontWeight: 950, color: '#ef4444' }}>
                        {formatRupiah(fsSalePrice || 50000)}
                      </span>
                      {fsOrigPrice && (
                        <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', textDecoration: 'line-through' }}>
                          {formatRupiah(fsOrigPrice)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 750, color: '#f59e0b', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Flame size={11} color="#f59e0b" fill="#f59e0b" />
                      <span>Tersisa {fsStock || 10} slot promo lagi!</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 850,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span>Klaim Flash Sale</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          )}

          {/* 2. Preview: Product Card */}
          {stickerType === 'product_card' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {prodImage ? (
                  <img src={prodImage} alt="Prod" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(16, 185, 129, 0.25)' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <ShoppingBag size={24} />
                  </div>
                )}
                <div>
                  <span style={{ fontSize: 9.5, fontWeight: 850, padding: '2px 7px', borderRadius: 100, background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {prodBadge || 'PRODUK STORE'}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #0f172a)', margin: '3px 0 2px' }}>
                    {prodTitle || 'Nama Produk Store'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 950, color: '#10b981' }}>
                      {formatRupiah(prodPrice || 125000)}
                    </span>
                    {prodOrigPrice && (
                      <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', textDecoration: 'line-through' }}>
                        {formatRupiah(prodOrigPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: '#10b981',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 850,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span>Lihat di Store</span>
                <ArrowRight size={13} />
              </div>
            </div>
          )}

          {/* 3. Preview: Portfolio Card */}
          {stickerType === 'portfolio_card' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {portImage ? (
                  <img src={portImage} alt="Port" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(99, 102, 241, 0.25)' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(99, 102, 241, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                    <FolderGit2 size={24} />
                  </div>
                )}
                <div>
                  <span style={{ fontSize: 9.5, fontWeight: 850, padding: '2px 7px', borderRadius: 100, background: 'rgba(99, 102, 241, 0.18)', color: '#6366f1', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {portCategory || 'KARYA TERPILIH'}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #0f172a)', margin: '3px 0 2px' }}>
                    {portTitle || 'Judul Karya Portofolio'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                    Studi kasus & dokumentasi proses visual
                  </div>
                </div>
              </div>

              <div style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: '#6366f1',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 850,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span>Lihat Karya</span>
                <ArrowRight size={13} />
              </div>
            </div>
          )}

          {/* 4. Preview: Article Card */}
          {stickerType === 'article_card' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 16,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1.5px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {artImage ? (
                  <img src={artImage} alt="Art" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(245, 158, 11, 0.25)' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <BookOpen size={24} />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 850, padding: '2px 7px', borderRadius: 100, background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {artCategory || 'ARTIKEL PILIHAN'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>• {artReadTime || '4 mnt baca'}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #0f172a)', margin: '3px 0 2px' }}>
                    {artTitle || 'Judul Artikel Blog'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                    Wawasan & studi kasus arsitektur web modern
                  </div>
                </div>
              </div>

              <div style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 850,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span>Baca Artikel</span>
                <ArrowRight size={13} />
              </div>
            </div>
          )}

          {/* 5. Preview: Poll */}
          {stickerType === 'poll' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
              border: '1.5px solid rgba(2, 132, 199, 0.25)',
              borderRadius: 16,
              padding: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 850, color: '#0284c7', textTransform: 'uppercase' }}>
                  Poling sumr.day club
                </span>
                <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700 }}>
                  Live Preview
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 850, marginBottom: 10, color: 'var(--cms-text)' }}>
                {pollQuestion || 'Pertanyaan Poling'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pollOptions.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'var(--cms-card-bg, #fff)',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt}</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Klik untuk vote</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Preview: This or That */}
          {stickerType === 'this_or_that' && (
            <div style={{
              background: 'rgba(236, 72, 153, 0.06)',
              border: '1.5px solid rgba(236, 72, 153, 0.25)',
              borderRadius: 16,
              padding: 14
            }}>
              <div style={{ fontSize: 13, fontWeight: 850, textAlign: 'center', marginBottom: 10, color: 'var(--cms-text)' }}>
                {totQuestion || 'Pilih salah satu:'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{totEmojiA}</div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{totOptionA}</div>
                </div>
                <div style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{totEmojiB}</div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{totOptionB}</div>
                </div>
              </div>
            </div>
          )}

          {/* 7. Preview: Slider Rate */}
          {stickerType === 'slider_rate' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(251, 191, 36, 0.04) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 20,
              padding: '16px 18px',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 100,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontSize: 10.5,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase'
                }}>
                  <Sliders size={12} strokeWidth={2.5} />
                  <span>SLIDER RATING</span>
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 100,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--cms-text-muted)',
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  <span>Rata-rata 95%</span>
                </span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 850, marginBottom: 8, color: 'var(--cms-text)' }}>
                {sliderQuestion || 'Beri rating'}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '6px 0 10px'
              }}>
                <div style={{
                  transform: `scale(${0.88 + (previewSliderVal / 100) * 0.3}) rotate(${(previewSliderVal - 50) * 0.12}deg)`,
                  transition: 'transform 0.1s ease',
                  filter: 'drop-shadow(0 4px 14px rgba(245, 158, 11, 0.5))'
                }}>
                  <Star size={38} fill="#f59e0b" color="#f59e0b" />
                </div>
              </div>
              <div style={{ padding: '0 6px', margin: '6px 0 10px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={previewSliderVal}
                  onChange={e => setPreviewSliderVal(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, #f59e0b 0%, #f59e0b ${previewSliderVal}%, rgba(0,0,0,0.12) ${previewSliderVal}%, rgba(0,0,0,0.12) 100%)`,
                    accentColor: '#f59e0b',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', fontSize: 11.5, color: 'var(--cms-text-muted)', fontWeight: 700 }}>
                <span>{sliderMinLabel}</span>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: 100,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#f59e0b',
                  fontWeight: 850,
                  fontSize: 11.5
                }}>
                  {previewSliderVal}%
                </span>
                <span>{sliderMaxLabel}</span>
              </div>
            </div>
          )}

          {/* 8. Preview: QnA */}
          {stickerType === 'qna' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1.5px solid rgba(139, 92, 246, 0.25)',
              borderRadius: 16,
              padding: 14
            }}>
              <div style={{ fontSize: 13, fontWeight: 850, marginBottom: 8, color: '#8b5cf6' }}>
                {qnaPrompt || 'Tanya sumr.day club'}
              </div>
              <div style={{
                padding: '9px 12px',
                borderRadius: 10,
                background: 'var(--cms-card-bg, #fff)',
                border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                fontSize: 12,
                color: 'var(--cms-text-muted)'
              }}>
                {qnaPlaceholder}
              </div>
            </div>
          )}
        </div>

        {/* ── MODAL ACTION BUTTONS ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4, borderTop: '1px solid var(--cms-border, rgba(0,0,0,0.06))', paddingTop: 14 }}>
          {initialSticker ? (
            <button
              type="button"
              onClick={() => onSave(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 100,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} />
              <span>Hapus Stiker</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 100,
                border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                background: 'transparent',
                color: 'var(--cms-text-muted)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '9px 24px',
                borderRadius: 100,
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 850,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <CheckCircle2 size={15} />
              <span>{initialSticker ? 'Simpan Stiker' : 'Pasang Stiker'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStickerModal;
