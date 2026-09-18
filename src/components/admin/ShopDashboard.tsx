import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Box, MessageSquare, Bell, Plus, Image as ImageIcon, Trash2, Edit3, X, Save, CheckCircle2, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useDialog } from './DialogProvider';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const newId = () => `p_${Date.now()}`;

export default function ShopDashboard({ notify, confirm }) {
  const { showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState('katalog');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Template', 'Jasa', 'Digital']);
  const [orders, setOrders] = useState([]);

  const [messages, setMessages] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Category Manager State
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [p, c, m] = await Promise.all([
        storage.getItem('porto_shop_products', []),
        storage.getItem('porto_shop_categories', ['Template', 'Jasa', 'Digital']),
        storage.getItem('porto_shop_messages', [])
      ]);
      setProducts(p);
      setCategories(c);
      setMessages(m);
      setLoading(false);
    };
    loadData();

    const unsubOrders = storage.listenItem('porto_shop_orders', (orders) => {
      setOrders(Array.isArray(orders) ? orders : []);
    });

    return () => unsubOrders();
  }, []);

  const saveProducts = async (newProducts) => {
    setProducts(newProducts);
    await storage.setItem('porto_shop_products', newProducts);
    notify('Katalog diperbarui');
  };

  const saveCategories = async (newCats) => {
    setCategories(newCats);
    await storage.setItem('porto_shop_categories', newCats);
  };

  const handleAddProduct = () => {
    setEditingProduct({
      id: newId(),
      name: '',
      category: categories[0] || '',
      type: 'Fisik',
      weight: 1,
      fileUrl: '',
      packages: [
        { name: 'Basic', price: 0, time: '3 Hari', desc: 'Paket dasar' },
        { name: 'Pro', price: 0, time: '7 Hari', desc: 'Paket profesional' },
        { name: 'Enterprise', price: 0, time: '14 Hari', desc: 'Paket lengkap' }
      ],
      price: 0,
      description: '',
      images: []
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct.name || editingProduct.images.length === 0) {
      notify('Nama dan minimal 1 gambar wajib diisi', 'error');
      return;
    }
    const isNew = !products.some(p => p.id === editingProduct.id);
    const newProducts = isNew 
      ? [...products, editingProduct]
      : products.map(p => p.id === editingProduct.id ? editingProduct : p);
    
    await saveProducts(newProducts);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id) => {
    if (await showConfirm('Hapus produk ini dari katalog?')) {
      saveProducts(products.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    
    const newUrls = [];
    for (const file of files) {
      const url = await uploadToCloudinary(file);
      if (url) newUrls.push(url);
    }
    
    if (newUrls.length > 0) {
      setEditingProduct(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
      notify(`${newUrls.length} gambar berhasil diunggah`);
    } else {
      notify('Gagal mengunggah gambar', 'error');
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setEditingProduct(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cms-bg)', color: 'var(--cms-text)' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>Toko & Katalog</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--cms-text-muted)', fontSize: 14 }}>Kelola produk, pesanan, dan komunikasi pelanggan.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 32px', borderBottom: '1px solid var(--glass-border)', background: 'var(--cms-panel-bg)' }}>
        {[
          { id: 'katalog', icon: <Box size={16} />, label: 'Katalog Produk' },
          { id: 'pesanan', icon: <Bell size={16} />, label: `Pesanan (${orders.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px 24px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? 'var(--cms-accent)' : 'transparent'}`,
              color: activeTab === tab.id ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: '0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)' }}>Memuat data...</div>
        ) : activeTab === 'katalog' ? (
          editingProduct ? (
            // FORM EDIT/TAMBAH PRODUK
            <div style={{ animation: 'cmsSlideIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{editingProduct.id.startsWith('p_') ? 'Tambah Produk' : 'Edit Produk'}</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setEditingProduct(null)} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 20px', height: 40 }}>Batal</button>
                  <button onClick={handleSaveProduct} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, padding: '0 24px', height: 40 }}><Save size={16} /> Simpan</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'var(--cms-panel-bg)', padding: 24, borderRadius: 24, border: '1px solid var(--glass-border)' }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8 }}>Nama Produk *</label>
                      <input type="text" value={editingProduct.name} onChange={e=>setEditingProduct({...editingProduct, name: e.target.value})} className="cms-input" style={{ width: '100%', fontSize: 16, fontWeight: 600 }} placeholder="Contoh: Template Agency Premium" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8 }}>Deskripsi Lengkap</label>
                      <textarea value={editingProduct.description} onChange={e=>setEditingProduct({...editingProduct, description: e.target.value})} className="cms-input" style={{ width: '100%', minHeight: 120, resize: 'vertical' }} placeholder="Jelaskan fitur, format file, keunggulan..." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8 }}>Tipe Produk *</label>
                        <select value={editingProduct.type || 'Fisik'} onChange={e=>setEditingProduct({...editingProduct, type: e.target.value})} className="cms-input" style={{ width: '100%', cursor: 'pointer', borderRadius: 100, padding: '0 16px' }}>
                          <option value="Fisik">Barang Fisik</option>
                          <option value="Digital">Produk Digital</option>
                          <option value="Jasa">Jasa / Layanan</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Kategori</label>
                          <button onClick={()=>setShowCatManager(true)} style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Kelola</button>
                        </div>
                        <select value={editingProduct.category} onChange={e=>setEditingProduct({...editingProduct, category: e.target.value})} className="cms-input" style={{ width: '100%', cursor: 'pointer', borderRadius: 100, padding: '0 16px' }}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                      {(!editingProduct.type || editingProduct.type === 'Fisik' || editingProduct.type === 'Digital') && (
                        <div style={{ marginTop: 16 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8 }}>Harga (Rp) *</label>
                          <input type="number" value={editingProduct.price} onChange={e=>setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} className="cms-input" style={{ width: '100%' }} />
                        </div>
                      )}

                      {(!editingProduct.type || editingProduct.type === 'Fisik') && (
                        <div style={{ marginTop: 16 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8 }}>Berat Barang (Kg) *</label>
                          <input type="number" step="0.1" value={editingProduct.weight || 1} onChange={e=>setEditingProduct({...editingProduct, weight: parseFloat(e.target.value) || 0})} className="cms-input" style={{ width: '100%' }} />
                        </div>
                      )}

                      {editingProduct.type === 'Digital' && (
                        <div style={{ marginTop: 16 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8 }}>URL File Download *</label>
                          <input type="text" value={editingProduct.fileUrl || ''} onChange={e=>setEditingProduct({...editingProduct, fileUrl: e.target.value})} className="cms-input" placeholder="Google Drive / Dropbox Link" style={{ width: '100%' }} />
                        </div>
                      )}

                      {editingProduct.type === 'Jasa' && (
                        <div style={{ marginTop: 16 }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 16 }}>Paket Layanan (Jasa) *</label>
                          {(editingProduct.packages || []).map((pkg, idx) => (
                            <div key={idx} style={{ background: 'var(--cms-switcher-bg)', padding: 16, borderRadius: 16, marginBottom: 12, border: '1px solid var(--glass-border)' }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--cms-accent)', marginBottom: 12 }}>Paket: {pkg.name}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>Harga (Rp)</label>
                                  <input type="number" value={pkg.price} onChange={e=>{
                                    const newPkgs = [...editingProduct.packages];
                                    newPkgs[idx].price = parseInt(e.target.value) || 0;
                                    setEditingProduct({...editingProduct, packages: newPkgs});
                                  }} className="cms-input" style={{ width: '100%', fontSize: 13 }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>Estimasi (Hari)</label>
                                  <input type="text" value={pkg.time} onChange={e=>{
                                    const newPkgs = [...editingProduct.packages];
                                    newPkgs[idx].time = e.target.value;
                                    setEditingProduct({...editingProduct, packages: newPkgs});
                                  }} className="cms-input" style={{ width: '100%', fontSize: 13 }} />
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>Deskripsi Paket</label>
                                <textarea value={pkg.desc} onChange={e=>{
                                  const newPkgs = [...editingProduct.packages];
                                  newPkgs[idx].desc = e.target.value;
                                  setEditingProduct({...editingProduct, packages: newPkgs});
                                }} className="cms-input" style={{ width: '100%', fontSize: 13, minHeight: 60, resize: 'vertical' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                {/* GALERI GAMBAR */}
                <div>
                  <div style={{ background: 'var(--cms-panel-bg)', padding: 24, borderRadius: 24, border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 800 }}>Galeri Gambar *</h3>
                    <p style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginBottom: 16 }}>Gambar pertama akan menjadi Cover/Thumbnail. Disarankan rasio 1:1 atau 4:3.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      {editingProduct.images.map((img, i) => (
                        <div key={i} style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--cms-switcher-bg)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {i === 0 && <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--cms-accent)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100 }}>COVER</div>}
                          <button onClick={()=>removeImage(i)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}><X size={14} /></button>
                        </div>
                      ))}
                      <div onClick={() => !isUploading && fileInputRef.current?.click()} style={{ aspectRatio: '1/1', border: '2px dashed var(--glass-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: isUploading ? 'wait' : 'pointer', color: 'var(--cms-text-muted)', transition: '0.2s' }}>
                        {isUploading ? <div style={{ animation: 'spin 1s linear infinite' }}><Upload size={24} /></div> : <><ImageIcon size={24} style={{ marginBottom: 8 }} /><span style={{ fontSize: 12, fontWeight: 700 }}>Tambah Foto</span></>}
                      </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple style={{ display: 'none' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // DAFTAR PRODUK
            <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Katalog Produk</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={handleAddProduct} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, padding: '0 24px', height: 44 }}>
                    <Plus size={18} /> Tambah Produk
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80, background: 'var(--cms-panel-bg)', borderRadius: 32, border: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Box size={48} color="var(--cms-text-muted)" style={{ opacity: 0.3, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800 }}>Belum ada produk</h3>
                  <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 14 }}>Tambahkan produk atau jasa pertama Anda ke toko.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                  {products.map(p => (
                    <div key={p.id} style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: 200, background: 'var(--cms-switcher-bg)', position: 'relative' }}>
                        {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)' }}><ImageIcon size={32} opacity={0.3} /></div>}
                        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                          <div style={{ background: 'var(--cms-accent)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{p.type || 'Fisik'}</div>
                          <div style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 100, backdropFilter: 'blur(8px)' }}>{p.category}</div>
                        </div>
                      </div>
                      <div style={{ padding: 20 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800 }}>{p.name}</h3>
                        <div style={{ color: 'var(--cms-accent)', fontWeight: 900, fontSize: 16, marginBottom: 16 }}>{formatRp(p.price)}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={()=>setEditingProduct(p)} className="cms-btn cms-btn-outline" style={{ flex: 1, borderRadius: 100, height: 36, fontSize: 13 }}><Edit3 size={14} /> Edit</button>
                          <button onClick={()=>handleDeleteProduct(p.id)} className="cms-btn cms-btn-danger" style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : activeTab === 'pesanan' ? (
          <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontWeight: 800 }}>Pesanan Masuk</h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, background: 'var(--cms-panel-bg)', borderRadius: 32, border: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={48} color="var(--cms-text-muted)" style={{ opacity: 0.3, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800 }}>Belum ada pesanan</h3>
                <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 14 }}>Pesanan dari pelanggan akan muncul di sini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map((o, i) => (
                  <div key={i} style={{ background: 'var(--cms-panel-bg)', padding: 20, borderRadius: 20, border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{o.name}</h4>
                        <span style={{ fontSize: 11, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', padding: '2px 8px', borderRadius: 100, fontWeight: 800 }}>{o.date ? new Date(o.date).toLocaleDateString() : 'Baru'}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', marginBottom: 4 }}>WA: {o.phone} {o.email && `| Email: ${o.email}`}</div>
                      <div style={{ fontSize: 13, color: 'var(--cms-text-muted)' }}>Metode: <strong>{o.paymentMethod || '-'}</strong></div>
                      <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', marginTop: 8 }}><strong>Item:</strong> {o.items}</div>
                      {o.note && <div style={{ fontSize: 13, background: 'var(--cms-switcher-bg)', padding: '8px 12px', borderRadius: 8, marginTop: 8, borderLeft: '2px solid var(--cms-accent)' }}>Catatan: {o.note}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginBottom: 4 }}>Total Pembayaran</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-accent)' }}>{formatRp(o.total)}</div>
                      <a href={`https://wa.me/${o.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="cms-btn cms-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 36, borderRadius: 100, fontSize: 12, marginTop: 12, textDecoration: 'none' }}>
                        <MessageSquare size={14} /> Chat Pembeli
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* MODAL MANAJER KATEGORI */}
      {showCatManager && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--cms-bg)', width: '100%', maxWidth: 400, borderRadius: 32, padding: 32, animation: 'cmsScaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Kelola Kategori</h2>
              <button onClick={()=>setShowCatManager(false)} style={{ background: 'none', border: 'none', color: 'var(--cms-text)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input type="text" value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="Nama Kategori Baru" className="cms-input" style={{ flex: 1, borderRadius: 100 }} onKeyDown={e => { if(e.key === 'Enter') { if(newCat) { saveCategories([...categories, newCat]); setNewCat(''); } } }} />
              <button onClick={()=>{ if(newCat) { saveCategories([...categories, newCat]); setNewCat(''); } }} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, padding: '0 16px' }}>Tambah</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {categories.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cms-panel-bg)', padding: '12px 16px', borderRadius: 16, border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{c}</span>
                  <button onClick={()=>{ saveCategories(categories.filter(cat => cat !== c)); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              ))}
              {categories.length === 0 && <div style={{ textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 13, padding: 20 }}>Tidak ada kategori</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
