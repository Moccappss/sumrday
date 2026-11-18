import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Trophy, Coins, Download, Upload, Image as ImageIcon, 
  FileText, CheckCircle2, Clock, ArrowUpRight, Share2, MessageCircle, 
  Copy, Trash2, Plus, ExternalLink, ShieldCheck, CreditCard, Search, 
  Filter, Layers, Check, X, AlertCircle, Info
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { openWhatsApp, whatsappTemplates } from '../../utils/whatsappTemplates';
const formatRp = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0);
};

interface WithdrawalRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'Pending' | 'Ditransfer' | 'Ditolak';
  requestedAt: string;
  transferredAt?: string;
  transferRef?: string;
}

interface MarketingKitItem {
  id: string;
  title: string;
  category: 'Banner Feed' | 'Banner Story' | 'Caption WA' | 'Copywriting IG' | 'Logo Pack';
  description: string;
  fileUrl?: string;
  previewUrl?: string;
  copyText?: string;
  dimensions?: string;
  createdAt: string;
}

interface ProjectRevisionTicket {
  id: string;
  projectName: string;
  clientName: string;
  clientPhone: string;
  revisionNumber: number;
  description: string;
  screenshotUrls: string[];
  status: 'Menunggu Review' | 'Sedang Dikerjakan' | 'Selesai';
  submittedAt: string;
  completedAt?: string;
  adminNotes?: string;
}

interface PartnershipHubManagerProps {
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (msg: string, onConfirm: () => void) => void;
  clients: any[];
}

export const PartnershipHubManager: React.FC<PartnershipHubManagerProps> = ({ notify, confirm, clients = [] }) => {
  const [subTab, setSubTab] = useState<'withdrawals' | 'media-kit' | 'revisions' | 'overview'>('overview');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── 1. Data Withdrawals ──
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);

  // ── 2. Data Marketing Kit ──
  const [mediaKit, setMediaKit] = useState<MarketingKitItem[]>([]);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [newMedia, setNewMedia] = useState<Partial<MarketingKitItem>>({
    title: '',
    category: 'Banner Feed',
    description: '',
    copyText: '',
    fileUrl: '',
    previewUrl: '',
    dimensions: '1080x1080'
  });

  // ── 3. Data Tiket Revisi ──
  const [revisions, setRevisions] = useState<ProjectRevisionTicket[]>([]);

  // Load Data on Mount
  useEffect(() => {
    // 1. Withdrawals
    storage.getItem('porto_affiliate_withdrawals', null).then((data: any) => {
      if (Array.isArray(data)) {
        setWithdrawals(data);
      } else {
        // Contoh awal jika belum ada key
        const sample: WithdrawalRequest[] = [
          {
            id: 'WD-001',
            clientId: clients[0]?.id || 'CLI-01',
            clientName: clients[0]?.name || 'Mitra Reseller Unggulan',
            clientPhone: clients[0]?.phone || '081234567890',
            clientEmail: clients[0]?.email || 'mitra@sumr.day',
            amount: 250000,
            bankName: 'BCA',
            accountNumber: '1234567890',
            accountHolder: 'Mitra Studio',
            status: 'Pending',
            requestedAt: new Date(Date.now() - 3600000 * 4).toISOString()
          }
        ];
        setWithdrawals(sample);
        storage.setItem('porto_affiliate_withdrawals', sample);
      }
      setLoadingWithdrawals(false);
    });

    // 2. Media Kit
    storage.getItem('porto_marketing_materials', null).then((data: any) => {
      if (Array.isArray(data)) {
        setMediaKit(data);
      } else {
        const defaultKits: MarketingKitItem[] = [
          {
            id: 'MK-01',
            title: 'Poster Promo Website & Desain Feed (1:1)',
            category: 'Banner Feed',
            description: 'Banner resolusi tinggi untuk postingan Instagram feed dan katalog WhatsApp.',
            previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
            fileUrl: 'https://drive.google.com',
            dimensions: '1080x1080 px',
            createdAt: new Date().toISOString()
          },
          {
            id: 'MK-02',
            title: 'Template Story WA & Instagram (9:16)',
            category: 'Banner Story',
            description: 'Format vertikal elegan dengan ruang stiker tautan referral di bagian tengah.',
            previewUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=600&auto=format&fit=crop&q=80',
            fileUrl: 'https://drive.google.com',
            dimensions: '1080x1920 px',
            createdAt: new Date().toISOString()
          },
          {
            id: 'MK-03',
            title: 'Caption Penawaran Jasa Pembuatan Website & Brand',
            category: 'Caption WA',
            description: 'Teks copywriting persuasif siap broadcast untuk status WhatsApp & grup komunitas.',
            copyText: '☀️ Mau punya website modern & portofolio profesional untuk bisnis kamu? Cek portofolio terbaru di sumr.day! Dapatkan diskon spesial dengan menggunakan link ini: {REFERRAL_LINK}',
            createdAt: new Date().toISOString()
          }
        ];
        setMediaKit(defaultKits);
        storage.setItem('porto_marketing_materials', defaultKits);
      }
    });

    // 3. Revisions
    storage.getItem('porto_project_revisions', null).then((data: any) => {
      if (Array.isArray(data)) {
        setRevisions(data);
      } else {
        const sampleRevs: ProjectRevisionTicket[] = [
          {
            id: 'REV-101',
            projectName: 'Website Landing Page Agency',
            clientName: 'PT Kreatif Nusantara',
            clientPhone: '081198765432',
            revisionNumber: 1,
            description: 'Ubah warna tombol CTA menjadi ungu neon dan ganti foto hero di bagian atas.',
            screenshotUrls: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'],
            status: 'Sedang Dikerjakan',
            submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            adminNotes: 'Aset foto baru sudah dimasukkan ke preview draft.'
          }
        ];
        setRevisions(sampleRevs);
        storage.setItem('porto_project_revisions', sampleRevs);
      }
    });
  }, []);

  // Summary Metrics
  const resellerCount = clients.filter(c => c.membershipTier === 'reseller' || c.membershipTier === 'vip').length;
  const affiliateCount = clients.filter(c => c.membershipTier === 'affiliate' || c.membershipTier === 'vip').length;
  const pendingWdCount = withdrawals.filter(w => w.status === 'Pending').length;
  const totalPendingAmount = withdrawals.filter(w => w.status === 'Pending').reduce((acc, w) => acc + (w.amount || 0), 0);
  const totalTransferredAmount = withdrawals.filter(w => w.status === 'Ditransfer').reduce((acc, w) => acc + (w.amount || 0), 0);

  // Handlers
  const handleApproveWithdrawal = async (wd: WithdrawalRequest) => {
    const updated = withdrawals.map(w => w.id === wd.id ? { ...w, status: 'Ditransfer' as const, transferredAt: new Date().toISOString() } : w);
    setWithdrawals(updated);
    await storage.setItem('porto_affiliate_withdrawals', updated);
    notify(`Pencairan ${formatRp(wd.amount)} ditandai Ditransfer`, 'success');
  };

  const handleDeleteWithdrawal = async (id: string) => {
    const doDelete = async () => {
      const next = withdrawals.filter(w => w.id !== id);
      setWithdrawals(next);
      await storage.setItem('porto_affiliate_withdrawals', next);
      notify('Pengajuan pencairan dihapus', 'info');
    };

    if (confirm) {
      confirm('Hapus data pengajuan pencairan ini?', doDelete);
    } else if (window.confirm('Hapus data pengajuan pencairan ini?')) {
      doDelete();
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedia.title) return;

    const item: MarketingKitItem = {
      id: `MK-${Date.now().toString().slice(-4)}`,
      title: newMedia.title,
      category: newMedia.category as any || 'Banner Feed',
      description: newMedia.description || '',
      copyText: newMedia.copyText || '',
      fileUrl: newMedia.fileUrl || '',
      previewUrl: newMedia.previewUrl || '',
      dimensions: newMedia.dimensions || '1080x1080 px',
      createdAt: new Date().toISOString()
    };

    const next = [item, ...mediaKit];
    setMediaKit(next);
    await storage.setItem('porto_marketing_materials', next);
    setShowAddMediaModal(false);
    setNewMedia({ title: '', category: 'Banner Feed', description: '', copyText: '', fileUrl: '', previewUrl: '' });
    notify('Materi promosi ditambahkan', 'success');
  };

  const handleDeleteMedia = async (id: string) => {
    const next = mediaKit.filter(m => m.id !== id);
    setMediaKit(next);
    await storage.setItem('porto_marketing_materials', next);
    notify('Materi promosi dihapus', 'info');
  };

  const handleUpdateRevisionStatus = async (revId: string, nextStatus: 'Menunggu Review' | 'Sedang Dikerjakan' | 'Selesai') => {
    const next = revisions.map(r => r.id === revId ? { ...r, status: nextStatus, completedAt: nextStatus === 'Selesai' ? new Date().toISOString() : r.completedAt } : r);
    setRevisions(next);
    await storage.setItem('porto_project_revisions', next);
    notify(`Status tiket diupdate: ${nextStatus}`, 'success');
  };

  const handleDeleteRevision = async (id: string) => {
    const doDelete = async () => {
      const next = revisions.filter(r => r.id !== id);
      setRevisions(next);
      await storage.setItem('porto_project_revisions', next);
      notify('Tiket revisi dihapus', 'info');
    };

    if (confirm) {
      confirm('Hapus tiket revisi ini?', doDelete);
    } else if (window.confirm('Hapus tiket revisi ini?')) {
      doDelete();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub Tabs Pill Switcher */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: 4,
        background: 'var(--cms-card-bg)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: 100,
        width: 'fit-content',
        overflowX: 'auto',
        maxWidth: '100%'
      }}>
        {[
          { key: 'overview', label: 'Ringkasan', icon: <Trophy size={16} /> },
          { key: 'withdrawals', label: 'Pencairan', count: pendingWdCount, icon: <CreditCard size={16} /> },
          { key: 'media-kit', label: 'Media Kit', count: mediaKit.length, icon: <Share2 size={16} /> },
          { key: 'revisions', label: 'Revisi', count: revisions.length, icon: <Layers size={16} /> },
        ].map(t => {
          const isActive = subTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key as any)}
              title={t.label}
              aria-label={t.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: t.count !== undefined ? '7px 12px' : '7px 14px',
                borderRadius: 100,
                border: 'none',
                background: isActive ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--cms-text-muted)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t.icon}
              {t.count !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 100,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--cms-input-bg)',
                    color: isActive ? '#ffffff' : 'var(--cms-text)',
                    fontWeight: 800
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SUB TAB 1: OVERVIEW & LEADERBOARD ── */}
      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top 4 KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ padding: 18, borderRadius: 20, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Reseller</span>
                <Sparkles size={16} color="#3b82f6" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#3b82f6', fontFamily: "'Outfit', sans-serif" }}>
                {resellerCount}
              </div>
            </div>

            <div style={{ padding: 18, borderRadius: 20, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Afiliasi</span>
                <Trophy size={16} color="#ec4899" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#ec4899', fontFamily: "'Outfit', sans-serif" }}>
                {affiliateCount}
              </div>
            </div>

            <div style={{ padding: 18, borderRadius: 20, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Pending</span>
                <Clock size={16} color="#f59e0b" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>
                {formatRp(totalPendingAmount)}
              </div>
            </div>

            <div style={{ padding: 18, borderRadius: 20, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Ditransfer</span>
                <CheckCircle2 size={16} color="#10b981" />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                {formatRp(totalTransferredAmount)}
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div style={{ padding: 22, borderRadius: 24, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                  Top Mitra
                </h3>
                <span title="Peringkat mitra dengan konversi referral dan transaksi katalog terbanyak" style={{ display: 'inline-flex', color: 'var(--cms-text-muted)', cursor: 'help' }}>
                  <Info size={13} />
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clients
                .slice()
                .sort((a, b) => (b.affiliateSalesCount || 0) - (a.affiliateSalesCount || 0))
                .slice(0, 5)
                .map((cli, idx) => (
                  <div key={cli.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : 'var(--glass-border)',
                        color: '#ffffff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {cli.name}
                          {cli.membershipTier === 'reseller' && (
                            <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 800 }}>Reseller</span>
                          )}
                          {cli.membershipTier === 'affiliate' && (
                            <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(236,72,153,0.15)', color: '#ec4899', fontWeight: 800 }}>Afiliasi</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                          Kode: <strong style={{ color: 'var(--cms-accent)' }}>{cli.affiliateCode || '-'}</strong> • {cli.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#10b981' }}>
                        {formatRp(cli.affiliateTotalEarnings || 0)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                        {cli.affiliateSalesCount || 0} Penjualan
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB TAB 2: ANTREAN PENCAIRAN KOMISI ── */}
      {subTab === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {withdrawals.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
              <CreditCard size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 800, color: 'var(--cms-text)' }}>Belum Ada Pengajuan</div>
              <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>Antrean pencairan komisi mitra akan tampil di sini.</div>
            </div>
          ) : (
            withdrawals.map((wd) => {
              const isPending = wd.status === 'Pending';
              return (
                <div key={wd.id} style={{
                  padding: 18,
                  borderRadius: 20,
                  background: 'var(--cms-card-bg)',
                  border: `1.5px solid ${isPending ? 'rgba(245,158,11,0.3)' : 'var(--glass-border)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: isPending ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: isPending ? '#f59e0b' : '#10b981' }}>
                        {wd.status}
                      </span>
                      <strong style={{ fontSize: 14, color: 'var(--cms-text)' }}>{wd.clientName}</strong>
                      <span style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>• {wd.clientPhone}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--cms-text-muted)' }}>
                      Rekening: <strong style={{ color: 'var(--cms-text)' }}>{wd.bankName} – {wd.accountNumber}</strong> • {wd.accountHolder}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                      Diajukan: {new Date(wd.requestedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-accent)', fontFamily: "'Outfit', sans-serif" }}>
                        {formatRp(wd.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>Nominal</div>
                    </div>

                    {isPending ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleApproveWithdrawal(wd)}
                          title="Transfer"
                          aria-label="Transfer"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: '#10b981',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Check size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWithdrawal(wd.id)}
                          title="Hapus"
                          aria-label="Hapus"
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={16} /> Lunas
                        </span>
                        {wd.clientPhone && (
                          <button
                            type="button"
                            title="Kirim WA"
                            aria-label="Kirim WA"
                            onClick={() => openWhatsApp(wd.clientPhone, whatsappTemplates.commissionPaid({
                              partnerName: wd.clientName,
                              amount: wd.amount,
                              bankInfo: `${wd.bankName} ${wd.accountNumber} a/n ${wd.accountHolder}`,
                              date: new Date(wd.transferredAt || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                            }))}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'rgba(34, 197, 94, 0.15)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: '#22c55e',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <MessageCircle size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteWithdrawal(wd.id)}
                          title="Hapus"
                          aria-label="Hapus"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SUB TAB 3: MEDIA KIT PROMOSI MITRA ── */}
      {subTab === 'media-kit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--cms-text)' }}>Media Kit</h3>
              <Info size={14} style={{ color: 'var(--cms-text-muted)', cursor: 'help' }} title="Materi promosi yang diunggah akan otomatis muncul di akun klien untuk diunduh." />
            </div>
            <button
              type="button"
              onClick={() => setShowAddMediaModal(true)}
              title="Tambah Materi"
              aria-label="Tambah Materi"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--cms-accent)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <Plus size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            {mediaKit.map(item => (
              <div key={item.id} style={{
                borderRadius: 20,
                background: 'var(--cms-card-bg)',
                border: '1.5px solid var(--glass-border)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {item.previewUrl && (
                  <div style={{ width: '100%', height: 160, overflow: 'hidden', background: 'var(--cms-input-bg)' }}>
                    <img src={item.previewUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'var(--cms-input-bg)', color: 'var(--cms-accent)' }}>
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(item.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                      title="Hapus"
                      aria-label="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>{item.description}</p>

                  {item.copyText && (
                    <div style={{ padding: 10, borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px dashed var(--glass-border)', fontSize: 11.5, color: 'var(--cms-text)', fontFamily: 'monospace' }}>
                      {item.copyText}
                    </div>
                  )}

                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginTop: 'auto',
                        padding: '8px 14px',
                        borderRadius: 100,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Download size={13} /> Berkas HD
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUB TAB 4: TIKET REVISI PROYEK ── */}
      {subTab === 'revisions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {revisions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', background: 'var(--cms-card-bg)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
              <Layers size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 800, color: 'var(--cms-text)' }}>Belum Ada Revisi</div>
              <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>Catatan revisi dari klien proyek akan terkumpul di sini.</div>
            </div>
          ) : (
            revisions.map(rev => (
              <div key={rev.id} style={{
                padding: 20,
                borderRadius: 22,
                background: 'var(--cms-card-bg)',
                border: '1.5px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: rev.status === 'Selesai' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: rev.status === 'Selesai' ? '#10b981' : '#f59e0b' }}>
                        {rev.status}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--cms-accent)', fontWeight: 800 }}>Revisi #{rev.revisionNumber}</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>{rev.projectName}</h4>
                    <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>Klien: <strong>{rev.clientName}</strong> ({rev.clientPhone})</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateRevisionStatus(rev.id, 'Sedang Dikerjakan')}
                      title="Proses"
                      style={{ height: 34, padding: '0 12px', borderRadius: 100, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Proses
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateRevisionStatus(rev.id, 'Selesai')}
                      title="Selesai"
                      style={{ height: 34, padding: '0 12px', borderRadius: 100, border: 'none', background: '#10b981', color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Selesai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRevision(rev.id)}
                      title="Hapus"
                      aria-label="Hapus"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: 14, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', fontSize: 13, color: 'var(--cms-text)', lineHeight: 1.6 }}>
                  <strong>Deskripsi Catatan Revisi: </strong>{rev.description}
                </div>

                {rev.screenshotUrls && rev.screenshotUrls.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Lampiran Screenshot (Tersimpan di Cloud):</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {rev.screenshotUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ width: 90, height: 90, borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--glass-border)', display: 'block' }}>
                          <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Tambah Materi Baru */}
      {showAddMediaModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100000 }} onClick={() => setShowAddMediaModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--cms-card-bg)', width: 'calc(100% - 32px)', maxWidth: 460, borderRadius: 24,
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)', border: '1.5px solid var(--glass-border)',
            zIndex: 100001, padding: 24, display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--cms-text)' }}>Tambah Materi Promosi Baru</h3>
              <button onClick={() => setShowAddMediaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddMedia} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Judul Materi</label>
                <input
                  type="text"
                  required
                  value={newMedia.title}
                  onChange={e => setNewMedia({ ...newMedia, title: e.target.value })}
                  placeholder="Cth: Poster Promo Web Landing Page"
                  style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Kategori</label>
                <select
                  value={newMedia.category}
                  onChange={e => setNewMedia({ ...newMedia, category: e.target.value as any })}
                  style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                >
                  <option value="Banner Feed">Banner Feed (1:1)</option>
                  <option value="Banner Story">Banner Story (9:16)</option>
                  <option value="Caption WA">Caption WhatsApp</option>
                  <option value="Copywriting IG">Copywriting Instagram / TikTok</option>
                  <option value="Logo Pack">Logo & Brand Pack</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>URL Gambar / File Google Drive</label>
                <input
                  type="url"
                  value={newMedia.previewUrl}
                  onChange={e => setNewMedia({ ...newMedia, previewUrl: e.target.value, fileUrl: e.target.value })}
                  placeholder="https://..."
                  style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Teks Copywriting (Opsional)</label>
                <textarea
                  value={newMedia.copyText}
                  onChange={e => setNewMedia({ ...newMedia, copyText: e.target.value })}
                  placeholder="Tulis draf caption yang siap disalin oleh mitra..."
                  style={{ width: '100%', height: 70, padding: '10px 14px', borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13, resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddMediaModal(false)} className="cms-btn cms-btn-secondary" style={{ flex: 1, height: 44, borderRadius: 100 }}>Batal</button>
                <button type="submit" className="cms-btn cms-btn-primary" style={{ flex: 1, height: 44, borderRadius: 100 }}>Simpan Materi</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
