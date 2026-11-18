import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, ShoppingBag, FolderGit2, FileText, 
  Zap, ArrowRight, CheckCircle2, Sparkles, Link2, 
  Tag, ExternalLink, Clock, Plus
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import { UpdateSticker, ProductSticker, PortfolioSticker, ArticleSticker, FlashSaleSticker } from '../../../types/socialUpdates';

interface ConnectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: {
    title?: string;
    projectTag?: string;
    category?: 'asset' | 'product' | 'article' | 'announcement' | 'general';
    ctaLabel?: string;
    projectUrl?: string;
    price?: string;
    mediaUrl?: string;
    sticker?: UpdateSticker;
  }) => void;
  notify?: (msg: string, type?: string) => void;
}

export const ConnectContentModal: React.FC<ConnectContentModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  notify
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'portfolio' | 'article'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Flash Sale quick setting
  const [fsDiscount, setFsDiscount] = useState(50);
  const [fsDurationHours, setFsDurationHours] = useState(24);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      try {
        const [pList, portoList, projList, artList] = await Promise.all([
          storage.getItem('porto_catalog_products', []),
          storage.getItem('porto_portfolio', []),
          storage.getItem('porto_projects', []),
          storage.getItem('porto_blog_posts', [])
        ]);
        setProducts(Array.isArray(pList) ? pList : []);
        // Combine portfolio items prioritizing showcase items
        const rawPortfolio = Array.isArray(portoList) ? portoList : [];
        const rawAgency = Array.isArray(projList) ? projList : [];
        const existingIds = new Set(rawPortfolio.map((p: any) => p.id));
        const combined = [...rawPortfolio, ...rawAgency.filter((a: any) => !existingIds.has(a.id))];
        setProjects(combined);
        setArticles(Array.isArray(artList) ? artList : []);
      } catch (err) {
        console.warn('Load connectable content error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen]);

  // Filtering
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      if (!q) return true;
      return (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    });
  }, [products, searchQuery]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(p => {
      if (!q) return true;
      return (p.title || p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    });
  }, [projects, searchQuery]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter(a => {
      if (!q) return true;
      return (a.title || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q);
    });
  }, [articles, searchQuery]);

  if (!isOpen) return null;

  const formatRp = (val: number | string) => {
    const n = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  };

  // 1. Connect Catalog Product
  const handleConnectProduct = (p: any, attachStickerType?: 'product_card' | 'flash_sale') => {
    const priceFormatted = formatRp(p.price || 0);
    const mediaUrl = p.gallery?.[0] || '';
    const targetUrl = `/katalog?product=${p.id}`;

    let stickerObj: UpdateSticker | undefined = undefined;

    if (attachStickerType === 'product_card') {
      stickerObj = {
        type: 'product_card',
        productId: p.id,
        title: p.name,
        price: p.price,
        originalPrice: p.originalPrice || undefined,
        imageUrl: mediaUrl || undefined,
        productUrl: targetUrl,
        badge: p.category || 'PRODUK KATALOG',
        buttonText: 'Lihat di Store'
      };
    } else if (attachStickerType === 'flash_sale') {
      const orig = Number(p.price || 0);
      const sale = Math.round(orig * (1 - fsDiscount / 100));
      const endD = new Date();
      endD.setHours(endD.getHours() + fsDurationHours);

      stickerObj = {
        type: 'flash_sale',
        productId: p.id,
        title: `Flash Sale: ${p.name}`,
        originalPrice: orig,
        salePrice: sale,
        discountPercent: fsDiscount,
        endTime: endD.toISOString(),
        productUrl: targetUrl,
        imageUrl: mediaUrl || undefined,
        stockLeft: p.stock || 10
      };
    }

    onConnect({
      title: p.name,
      projectTag: p.category || 'Katalog',
      category: 'product',
      ctaLabel: attachStickerType === 'flash_sale' ? 'Klaim Promo' : 'Beli Sekarang',
      projectUrl: targetUrl,
      price: attachStickerType === 'flash_sale' ? `${formatRp(Math.round(Number(p.price || 0) * (1 - fsDiscount / 100)))} (Promo)` : priceFormatted,
      mediaUrl: mediaUrl || undefined,
      sticker: stickerObj
    });

    notify?.(`Produk "${p.name}" terhubung.`, 'success');
    onClose();
  };

  // 2. Connect Portfolio Project
  const handleConnectProject = (p: any, attachSticker: boolean = false) => {
    const coverUrl = p.cover || p.image || p.coverImage || p.gallery?.[0] || (Array.isArray(p.mediaUrls) ? p.mediaUrls[0] : '') || '';
    const targetUrl = `/portfolio/${p.id}`;

    let stickerObj: UpdateSticker | undefined = undefined;
    if (attachSticker) {
      stickerObj = {
        type: 'portfolio_card',
        projectId: p.id,
        title: p.title || p.name,
        category: p.category || 'KARYA TERPILIH',
        imageUrl: coverUrl || undefined,
        projectUrl: targetUrl,
        buttonText: 'Lihat Karya'
      };
    }

    onConnect({
      title: p.title || p.name,
      projectTag: p.category || 'Portofolio',
      category: 'asset',
      ctaLabel: 'Lihat Karya',
      projectUrl: targetUrl,
      price: 'Portofolio',
      mediaUrl: coverUrl || undefined,
      sticker: stickerObj
    });

    notify?.(`Karya "${p.title || p.name}" terhubung.`, 'success');
    onClose();
  };

  // 3. Connect Blog Article
  const handleConnectArticle = (a: any, attachSticker: boolean = false) => {
    const coverUrl = a.thumbnail || a.coverImage || a.image || '';
    const targetUrl = `/blog/${a.slug || a.id}`;

    let stickerObj: UpdateSticker | undefined = undefined;
    if (attachSticker) {
      stickerObj = {
        type: 'article_card',
        articleId: a.id,
        title: a.title,
        category: a.category || 'ARTIKEL PILIHAN',
        imageUrl: coverUrl || undefined,
        articleUrl: targetUrl,
        readTime: a.readTime || '4 mnt baca',
        buttonText: 'Baca Artikel'
      };
    }

    onConnect({
      title: a.title,
      projectTag: a.category || 'Artikel',
      category: 'article',
      ctaLabel: 'Baca Artikel',
      projectUrl: targetUrl,
      price: 'Artikel',
      mediaUrl: coverUrl || undefined,
      sticker: stickerObj
    });

    notify?.(`Artikel "${a.title}" terhubung.`, 'success');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 720,
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--cms-card-bg, #ffffff)',
        color: 'var(--cms-text, #0f172a)',
        borderRadius: 24,
        border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        boxSizing: 'border-box'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(99, 102, 241, 0.3)'
            }}>
              <Link2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text)' }}>
                Hubungkan Konten
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted)' }}>
                Pilih produk, portofolio, atau artikel untuk mengisi data otomatis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--cms-border)',
              background: 'transparent',
              color: 'var(--cms-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          background: 'var(--cms-switcher-bg, rgba(0,0,0,0.04))',
          padding: 5,
          borderRadius: 14,
          border: '1px solid var(--cms-border, rgba(0,0,0,0.06))'
        }}>
          {[
            { id: 'catalog', label: `Katalog (${products.length})`, icon: ShoppingBag, color: '#10b981' },
            { id: 'portfolio', label: `Portofolio (${projects.length})`, icon: FolderGit2, color: '#6366f1' },
            { id: 'article', label: `Artikel (${articles.length})`, icon: FileText, color: '#f59e0b' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: isActive ? tab.color : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--cms-text-muted)',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari item..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 12,
              border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
              background: 'var(--cms-input-bg, transparent)',
              color: 'var(--cms-text)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* ── CONTENT STREAM ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 280, maxHeight: 380, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cms-text-muted)', fontSize: 13 }}>
              Memuat data...
            </div>
          ) : activeTab === 'catalog' ? (
            filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                Tidak ada produk yang cocok dengan pencarian.
              </div>
            ) : (
              filteredProducts.map(p => {
                const img = p.gallery?.[0] || '';
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: 'var(--cms-input-bg, rgba(0,0,0,0.02))',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.08))',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: '1 1 auto' }}>
                      {img ? (
                        <img src={img} alt={p.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                          <ShoppingBag size={22} />
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            {p.category || 'Store'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 850, color: '#10b981' }}>
                          {formatRp(p.price || 0)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleConnectProduct(p)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--cms-border)',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                        title="Isi judul, link target /katalog, dan teks CTA otomatis"
                      >
                        Isi CTA
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConnectProduct(p, 'product_card')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#10b981',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Stiker Produk</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConnectProduct(p, 'flash_sale')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <Zap size={12} />
                        <span>Flash Sale</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : activeTab === 'portfolio' ? (
            filteredProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                Tidak ada karya portofolio yang cocok.
              </div>
            ) : (
              filteredProjects.map(p => {
                const img = p.cover || p.image || p.gallery?.[0] || '';
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: 'var(--cms-input-bg, rgba(0,0,0,0.02))',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.08))'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: '1 1 auto' }}>
                      {img ? (
                        <img src={img} alt={p.title || p.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                          <FolderGit2 size={22} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>
                          {p.category || 'Karya'}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                          {p.title || p.name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleConnectProject(p, false)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--cms-border)',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >
                        Isi CTA
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConnectProject(p, true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#6366f1',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Stiker Karya</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            filteredArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                Tidak ada artikel blog yang cocok.
              </div>
            ) : (
              filteredArticles.map(a => {
                const img = a.coverImage || a.image || '';
                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: 'var(--cms-input-bg, rgba(0,0,0,0.02))',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.08))'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: '1 1 auto' }}>
                      {img ? (
                        <img src={img} alt={a.title} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                          <FileText size={22} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                          {a.category || 'Artikel'}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                          {a.title}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleConnectArticle(a, false)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                        title="Hanya isi judul, link artikel, dan tombol CTA"
                      >
                        Isi CTA
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConnectArticle(a, true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#ffffff',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Stiker Artikel</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--cms-border, rgba(0,0,0,0.08))', paddingTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
            Otomatis mengisi rilis.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: '1px solid var(--cms-border)',
              background: 'transparent',
              color: 'var(--cms-text)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectContentModal;
