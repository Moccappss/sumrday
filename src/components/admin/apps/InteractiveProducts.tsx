import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  Box, Sparkles, ShoppingBag, ArrowLeft, Loader2, 
  Image as ImageIcon, Video, Layers, CheckCircle2, AlertCircle
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import { useDialog } from '../DialogProvider';

const InteractiveProducts = ({ onBack }) => {
  const { showConfirm } = useDialog();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const saved = await storage.getItem('porto_interactive_products', []);
        setProducts(saved);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProduct = {
      id: Date.now().toString(),
      name: formData.get('name'),
      price: formData.get('price'),
      category: formData.get('category'),
      description: formData.get('description'),
      previewUrl: formData.get('previewUrl') || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    await storage.setItem('porto_interactive_products', updated);
    setShowAddModal(false);
  };

  const handleDeleteProduct = async (id) => {
    const confirmed = await showConfirm("Hapus produk ini?");
    if (!confirmed) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    await storage.setItem('porto_interactive_products', updated);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cms-bg)', animation: 'cmsFadeIn 0.4s ease' }}>
      {/* App Header */}
      <div style={{ 
        padding: '24px 40px', 
        background: 'var(--cms-panel-bg)', 
        borderBottom: '1px solid var(--glass-border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button onClick={onBack} className="sidebar-icon-btn" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-accent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Produk Interaktif v1.0</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--cms-text)' }}>Katalog Produk</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                height: 48, width: 280, borderRadius: 14, background: 'var(--cms-input-bg)', 
                border: '1px solid var(--glass-border)', padding: '0 16px 0 44px', color: 'var(--cms-text)',
                fontSize: 14, fontWeight: 600, outline: 'none'
              }} 
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="cms-btn cms-btn-primary" 
            style={{ height: 48, padding: '0 24px', borderRadius: 14, fontWeight: 800, gap: 10 }}
          >
            <Plus size={18} /> Tambah Produk
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--cms-accent)' }} />
          </div>
        ) : products.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.5 }}>
            <ShoppingBag size={64} style={{ marginBottom: 24 }} />
            <div style={{ fontSize: 24, fontWeight: 900 }}>Belum Ada Produk</div>
            <p style={{ marginTop: 8, fontWeight: 600 }}>Klik tombol "Tambah Produk" untuk mulai mengelola katalog.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product, i) => (
              <div 
                key={product.id} 
                className="cms-card premium-glass"
                style={{ 
                  padding: 20, borderRadius: 24, border: '1px solid var(--glass-border)',
                  animation: 'cmsSlideIn 0.5s ease forwards', animationDelay: `${i * 0.05}s`, opacity: 0
                }}
              >
                <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: '#000', position: 'relative' }}>
                  <img src={product.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '6px 12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderRadius: 100, fontSize: 10, fontWeight: 800, color: '#fff' }}>
                    {product.category || 'Umum'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{product.name}</h4>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-accent)', marginTop: 4 }}>
                      Rp {Number(product.price).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="sidebar-icon-btn small"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="sidebar-icon-btn small danger"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Box size={14} style={{ opacity: 0.5 }} />
                    <Sparkles size={14} style={{ opacity: 0.5 }} />
                    <Layers size={14} style={{ opacity: 0.5 }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>
                    ID: {product.id.slice(-6)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="cms-modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
          <div className="cms-card" style={{ width: 500, padding: 40, borderRadius: 32, background: 'var(--cms-panel-bg)', animation: 'cmsPopIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Tambah Produk Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="sidebar-icon-btn"><ArrowLeft size={18} style={{ transform: 'rotate(90deg)' }} /></button>
            </div>
            
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="cms-label">Nama Produk</label>
                <input name="name" required className="cms-input" placeholder="Contoh: Premium Sneakers" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="cms-label">Harga (Rp)</label>
                  <input name="price" type="number" required className="cms-input" placeholder="0" />
                </div>
                <div>
                  <label className="cms-label">Kategori</label>
                  <input name="category" className="cms-input" placeholder="Fashion, Tech, etc." />
                </div>
              </div>
              <div>
                <label className="cms-label">Deskripsi</label>
                <textarea name="description" className="cms-input" style={{ height: 100, resize: 'none', padding: 16 }} placeholder="Jelaskan detail produk..." />
              </div>
              <div>
                <label className="cms-label">URL Preview (3D/Image)</label>
                <input name="previewUrl" className="cms-input" placeholder="https://..." />
              </div>
              <button type="submit" className="cms-btn cms-btn-primary" style={{ height: 60, marginTop: 12, borderRadius: 16, fontWeight: 900 }}>
                Simpan Produk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveProducts;
