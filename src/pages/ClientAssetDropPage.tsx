import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, HardDrive, CheckCircle2, FileText, Image as ImageIcon, 
  Video, FileArchive, X, ArrowLeft, Loader2, Sparkles, ShieldCheck, 
  AlertCircle, ExternalLink, Send, Layers, Check, Clock, ChevronRight,
  Search, Copy
} from 'lucide-react';
import { storage } from '../utils/storage';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useToast } from '../context/ToastContext';
import SEOHelmet from '../components/SEOHelmet';

interface UploadedAsset {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
  uploadedAt: string;
}

const MILESTONES = [
  { key: 'briefing', label: 'Briefing', desc: 'Materi & Arahan', icon: FileText },
  { key: 'concept', label: 'Konsep', desc: 'Eksplorasi Desain', icon: Sparkles },
  { key: 'revision', label: 'Revisi', desc: 'Penyesuaian Visual', icon: Layers },
  { key: 'finalizing', label: 'Finalisasi', desc: 'Pengecekan Kualitas', icon: ShieldCheck },
  { key: 'delivered', label: 'Selesai', desc: 'Serah Terima File', icon: CheckCircle2 }
];

export default function ClientAssetDropPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [orderData, setOrderData] = useState<any>(null);
  const [clientName, setClientName] = useState('');
  const [orderTitle, setOrderTitle] = useState('');
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing assets and order information from both transactions and client orders
  useEffect(() => {
    let resolvedId = orderId;
    if (!resolvedId) {
      try {
        const lastId = localStorage.getItem('porto_last_order_id');
        if (lastId) resolvedId = lastId;
      } catch {}
    }
    const currentOrderId = resolvedId || 'GENERAL-DROP';
    
    const loadData = async () => {
      try {
        const trxs = await storage.getItem<any[]>('porto_transactions', []);
        const allOrders = await storage.getItem<any[]>('porto_client_orders', []);

        // Store up to 6 recent distinct orders for client quick-switcher
        const map = new Map<string, any>();
        [...trxs, ...allOrders].forEach((item: any) => {
          if (item?.id && !map.has(item.id)) {
            map.set(item.id, {
              id: item.id,
              title: item.customer?.name || item.clientName || item.productName || item.serviceTitle || item.id,
              paymentStatus: item.paymentStatus || (item.status === 'Selesai' ? 'lunas' : 'belum'),
              date: item.date || item.createdAt
            });
          }
        });
        const recents = Array.from(map.values()).slice(0, 6);
        setRecentOrders(recents);

        const foundTrx = trxs.find((t: any) => t.id === currentOrderId);
        const foundOrder = allOrders.find((o: any) => o.id === currentOrderId);

        if (foundTrx) {
          setOrderData(foundTrx);
          setClientName(foundTrx.customer?.name || 'Klien');
          const itemsStr = (foundTrx.items || []).map((i: any) => i.name).join(', ');
          setOrderTitle(itemsStr || foundTrx.serviceTitle || `Proyek #${currentOrderId}`);
          try { localStorage.setItem('porto_last_order_id', currentOrderId); } catch {}
        } else if (foundOrder) {
          setOrderData(foundOrder);
          setClientName(foundOrder.clientName || 'Klien');
          setOrderTitle(foundOrder.productName || `Proyek #${currentOrderId}`);
          try { localStorage.setItem('porto_last_order_id', currentOrderId); } catch {}
        } else {
          setClientName('Klien');
          setOrderTitle(`Proyek #${currentOrderId}`);
        }

        const savedAssets = await storage.getItem<any[]>(`sumr_client_drop_assets_${currentOrderId}`, []);
        if (Array.isArray(savedAssets)) {
          setAssets(savedAssets);
        }
      } catch (e) {
        console.warn('Error loading order drop data:', e);
      }
    };

    loadData();

    // Listen to realtime transaction updates
    const unsub = storage.listenItem<any[]>('porto_transactions', (trxs) => {
      const found = (trxs || []).find((t: any) => t.id === currentOrderId);
      if (found) {
        setOrderData(found);
        setClientName(found.customer?.name || 'Klien');
        const itemsStr = (found.items || []).map((i: any) => i.name).join(', ');
        setOrderTitle(itemsStr || found.serviceTitle || `Proyek #${currentOrderId}`);
      }
    }, []);

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [orderId]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const currentOrderId = orderId || 'GENERAL-DROP';
    const newAssets: UploadedAsset[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Mengunggah berkas ${i + 1} dari ${files.length}: "${file.name}"...`);

      try {
        let uploadedUrl = '';
        // Upload ke Cloudinary / Cloud Storage
        uploadedUrl = await uploadToCloudinary(file);

        if (!uploadedUrl) {
          throw new Error('Gagal mengunggah berkas');
        }

        const assetItem: UploadedAsset = {
          id: `drop_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          url: uploadedUrl,
          type: file.type || 'file',
          uploadedAt: new Date().toISOString()
        };

        newAssets.push(assetItem);

        // Also add to global media vault so it automatically appears in CMS File Manager under folder "Bahan Klien"
        const existingVault = await storage.getItem<any[]>('porto_media_vault', []);
        const vaultItem = {
          id: `mv-${Date.now()}-${i}`,
          name: `[Materi #${currentOrderId}] ${file.name}`,
          url: uploadedUrl,
          type: file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'document'),
          source: 'cloudinary',
          folder: `Proyek #${currentOrderId}`,
          size: file.size,
          createdAt: new Date().toISOString()
        };
        await storage.setItem('porto_media_vault', [vaultItem, ...(Array.isArray(existingVault) ? existingVault : [])]);
      } catch (err: any) {
        showToast(`Gagal mengunggah ${file.name}: ${err?.message || 'Error'}`, 'error');
      }
    }

    const updated = [...newAssets, ...assets];
    setAssets(updated);
    await storage.setItem(`sumr_client_drop_assets_${currentOrderId}`, updated);

    setIsUploading(false);
    setUploadProgress(null);
    showToast(`Berhasil menambahkan ${newAssets.length} berkas ke studio!`, 'success');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDeleteAsset = async (assetId: string) => {
    const currentOrderId = orderId || 'GENERAL-DROP';
    const next = assets.filter(a => a.id !== assetId);
    setAssets(next);
    await storage.setItem(`sumr_client_drop_assets_${currentOrderId}`, next);
    showToast('Berkas dihapus dari daftar drop-box.', 'info');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #090d16 0%, #030712 100%)',
      color: '#f8fafc',
      fontFamily: "'Outfit', sans-serif",
      padding: '40px 20px 80px'
    }}>
      <SEOHelmet
        title={`Client Asset Drop-Box • ${orderTitle}`}
        description="Portal pengiriman berkas materi mentah dan aset beresolusi tinggi langsung ke Google Drive studio sumr.day."
      />

      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '8px 16px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backdropFilter: 'blur(10px)'
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            <span>Koneksi Aman Studio Cloud</span>
          </div>
        </div>

        {/* Quick Order Switcher & Search Bar */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 18,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/lacak/${searchQuery.trim()}`);
                  }
                }}
                placeholder="Lacak nomor pesanan / invoice (TRX-...)"
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (searchQuery.trim()) {
                  navigate(`/lacak/${searchQuery.trim()}`);
                }
              }}
              style={{
                padding: '9px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>Cek Progres</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setCopiedLink(true);
                showToast('Tautan pelacakan disalin ke clipboard!', 'success');
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              style={{
                padding: '9px 14px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
            </button>
          </div>

          {/* Recent Orders Pills */}
          {recentOrders.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Pesanan Terakhir:
              </span>
              {recentOrders.map((rec) => {
                const currentId = orderId || orderData?.id;
                const isActive = currentId === rec.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => navigate(`/lacak/${rec.id}`)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 100,
                      background: isActive ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isActive ? '#0ea5e9' : 'rgba(255, 255, 255, 0.1)'}`,
                      color: isActive ? '#38bdf8' : '#94a3b8',
                      fontSize: 11.5,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <span>#{rec.id}</span>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: rec.paymentStatus === 'lunas' ? '#10b981' : '#f59e0b'
                    }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Header Hero Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 24,
          padding: '30px 28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(14, 165, 233, 0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            <HardDrive size={15} /> Studio Client Asset Drop-Box
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: '#ffffff' }}>
            Pengiriman Bahan & Materi Proyek
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.6, maxWidth: 640 }}>
            Kirimkan foto produk resolusi tinggi, logo vektor (AI/EPS/SVG/PNG), teks materi dokumen, atau video footage langsung ke Google Drive studio kami tanpa kompresi WhatsApp.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.1)', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
              Proyek: <strong style={{ color: '#ffffff' }}>{orderTitle}</strong>
            </div>
            <span style={{ color: '#64748b' }}>•</span>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
              No. Pesanan: <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 800 }}>#{orderId || 'GENERAL'}</span>
            </div>
            {orderData?.paymentStatus && (
              <>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: orderData.paymentStatus === 'lunas' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: orderData.paymentStatus === 'lunas' ? '#10b981' : '#f59e0b',
                  border: `1px solid ${orderData.paymentStatus === 'lunas' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}>
                  {orderData.paymentStatus === 'lunas' ? '✅ Lunas' : (orderData.paymentStatus === 'dp' ? '⏳ Termin DP' : '⚠️ Belum Bayar')}
                </span>
              </>
            )}
            {orderData?.trackingNumber && (
              <div style={{ marginLeft: 'auto', fontSize: 12, color: '#e2e8f0', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
                📦 Resi: <strong style={{ color: '#38bdf8' }}>{orderData.trackingNumber}</strong>
              </div>
            )}
          </div>
        </div>

        {/* ── REALTIME MILESTONE PROGRESS TRACKER ── */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          padding: '24px 22px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Tahapan Pengerjaan Realtime
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#ffffff' }}>
                Status Progres Desain Studio
              </h3>
            </div>
            <div style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: 11.5, fontWeight: 800 }}>
              Live Sync
            </div>
          </div>

          {/* Stepper Grid */}
          {(() => {
            const currentStepKey = orderData?.milestoneStep || (orderData?.paymentStatus === 'lunas' ? 'concept' : 'briefing');
            const stepIndex = MILESTONES.findIndex(m => m.key === currentStepKey);
            const activeIdx = stepIndex >= 0 ? stepIndex : 0;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                {MILESTONES.map((step, idx) => {
                  const isDone = idx < activeIdx;
                  const isCurrent = idx === activeIdx;
                  const StepIcon = step.icon;

                  return (
                    <div
                      key={step.key}
                      style={{
                        padding: '14px 12px',
                        borderRadius: 16,
                        background: isCurrent 
                          ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)' 
                          : (isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                        border: `1.5px solid ${isCurrent ? '#0ea5e9' : (isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.06)')}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 6,
                        boxShadow: isCurrent ? '0 8px 24px rgba(14, 165, 233, 0.25)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: isCurrent 
                          ? '#0ea5e9' 
                          : (isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                        color: isCurrent 
                          ? '#ffffff' 
                          : (isDone ? '#10b981' : '#64748b'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isDone ? <Check size={18} strokeWidth={3} /> : <StepIcon size={16} />}
                      </div>

                      <div style={{ fontSize: 12.5, fontWeight: isCurrent ? 850 : 700, color: isCurrent ? '#ffffff' : (isDone ? '#10b981' : '#94a3b8') }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: isCurrent ? '#bae6fd' : '#64748b', lineHeight: 1.2 }}>
                        {step.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Delivery Download Bridge (If Google Drive Link is set by Studio) */}
          {(orderData?.driveProofUrl || orderData?.driveResultUrl) && (
            <div style={{
              marginTop: 18,
              padding: '16px 20px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(14, 165, 233, 0.12) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                  <Sparkles size={14} /> Berkas Hasil Akhir Siap
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                  File Master Desain & Aset Cetak / Digital
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Tersedia di Google Drive studio resmi sumr.day.
                </div>
              </div>

              <a
                href={orderData.driveResultUrl || orderData.driveProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 100,
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <ExternalLink size={15} /> Buka Google Drive
              </a>
            </div>
          )}
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: isDragOver ? 'rgba(14, 165, 233, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: isDragOver ? '2px dashed #0ea5e9' : '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: 24,
            padding: '50px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 28
          }}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(99, 102, 241, 0.2))',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isUploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
          </div>

          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
              {isUploading ? 'Sedang Mengunggah Materi ke Studio...' : 'Tarik & Letakkan Berkas di Sini'}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
              atau <span style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 700 }}>klik untuk memilih berkas dari HP / Komputer</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>Foto HD (PNG, JPG)</span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>Vektor (AI, SVG, PDF)</span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>Arsip (ZIP, RAR)</span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>Dokumen (DOCX, XLSX)</span>
          </div>

          {uploadProgress && (
            <div style={{ marginTop: 8, fontSize: 12.5, color: '#38bdf8', fontWeight: 700 }}>
              {uploadProgress}
            </div>
          )}
        </div>

        {/* Uploaded Assets List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#ffffff' }}>
              Daftar Berkas Terkirim ({assets.length})
            </h3>
            {assets.length > 0 && (
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> Berkas aman di Google Drive Vault
              </span>
            )}
          </div>

          {assets.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 18,
              padding: '36px 20px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              Belum ada berkas yang Anda upload untuk proyek ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 16,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(14, 165, 233, 0.15)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {asset.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 750, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {asset.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {formatBytes(asset.size)} • {new Date(asset.uploadedAt).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Pratinjau Berkas di Tab Baru"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#cbd5e1',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <ExternalLink size={12} /> Buka Tab
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      title="Hapus Berkas"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 6
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
