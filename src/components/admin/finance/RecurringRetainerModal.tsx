import React, { useState, useEffect } from 'react';
import { 
  Repeat, Plus, Trash2, Calendar, DollarSign, CheckCircle2, 
  Send, X, Sparkles, Clock, AlertCircle, User, FileText
} from 'lucide-react';
import { storage } from '../../../utils/storage';

export interface RecurringRetainer {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceTitle: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  billingDay: number; // e.g. 1st or 25th of the month
  nextBillingDate: string;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  createdAt: string;
}

interface RecurringRetainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onGenerateInvoice: (retainer: RecurringRetainer) => void;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const RecurringRetainerModal: React.FC<RecurringRetainerModalProps> = ({
  isOpen,
  onClose,
  notify,
  onGenerateInvoice,
}) => {
  const [retainers, setRetainers] = useState<RecurringRetainer[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    serviceTitle: 'Jasa Maintenance Website & SEO',
    amount: 1500000,
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    billingDay: 1,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      storage.getItem('porto_retainers', []).then(data => {
        if (Array.isArray(data)) setRetainers(data);
      });
    }
  }, [isOpen]);

  const handleSaveNew = async () => {
    if (!form.clientName.trim()) {
      notify?.('Nama klien wajib diisi!', 'error');
      return;
    }
    const today = new Date();
    const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, form.billingDay);

    const newRetainer: RecurringRetainer = {
      id: `ret_${Date.now()}`,
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      serviceTitle: form.serviceTitle.trim(),
      amount: Number(form.amount) || 0,
      frequency: form.frequency,
      billingDay: Number(form.billingDay) || 1,
      nextBillingDate: nextDate.toISOString().split('T')[0],
      status: 'active',
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [newRetainer, ...retainers];
    setRetainers(updated);
    await storage.setItem('porto_retainers', updated, true);
    setIsAdding(false);
    setForm({
      clientName: '',
      clientPhone: '',
      serviceTitle: 'Jasa Maintenance Website & SEO',
      amount: 1500000,
      frequency: 'monthly',
      billingDay: 1,
      notes: ''
    });
    notify?.(`Paket Retainer untuk ${newRetainer.clientName} berhasil dibuat! 🔄`, 'success');
  };

  const handleDelete = async (id: string) => {
    const updated = retainers.filter(r => r.id !== id);
    setRetainers(updated);
    await storage.setItem('porto_retainers', updated, true);
    notify?.('Paket retainer dihapus', 'info');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      animation: 'cmsFadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 750,
        height: 600,
        maxHeight: '90vh',
        background: 'var(--cms-card-bg, #1a1a24)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 70px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Repeat size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                Langganan & Retainer Rutin Agensi
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                Kelola kontrak recurring, SLA bulanan, dan auto-generate tagihan berkala
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: 'var(--cms-input-bg)',
              color: 'var(--cms-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{
          padding: 20,
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {!isAdding ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                Daftar Klien Retainer ({retainers.length})
              </div>
              <button
                onClick={() => setIsAdding(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--cms-accent, #6366f1)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                Tambah Klien Retainer
              </button>
            </div>
          ) : (
            <div style={{
              background: 'var(--cms-input-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 4 }}>
                Tambah Kontrak Retainer Baru
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Nama Klien / Perusahaan
                  </label>
                  <input
                    value={form.clientName}
                    onChange={e => setForm({ ...form, clientName: e.target.value })}
                    placeholder="Contoh: PT Kreatif Nusantara"
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Nomor WhatsApp Klien
                  </label>
                  <input
                    value={form.clientPhone}
                    onChange={e => setForm({ ...form, clientPhone: e.target.value })}
                    placeholder="08123456789"
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                  Nama Layanan / Scope Retainer
                </label>
                <input
                  value={form.serviceTitle}
                  onChange={e => setForm({ ...form, serviceTitle: e.target.value })}
                  placeholder="Contoh: Social Media Management (15 Post + Ads)"
                  className="cms-input"
                  style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Biaya per Periode (IDR)
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Siklus Tagihan
                  </label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value as any })}
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 12 }}
                  >
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="quarterly">3 Bulanan (Quarterly)</option>
                    <option value="yearly">Tahunan (Yearly)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Tanggal Tagih (Tiap Bln)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={form.billingDay}
                    onChange={e => setForm({ ...form, billingDay: Number(e.target.value) })}
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border)',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveNew}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Simpan Kontrak
                </button>
              </div>
            </div>
          )}

          {/* List of Retainers */}
          {retainers.length === 0 ? (
            <div style={{
              flex: 1,
              minHeight: isAdding ? 140 : 260,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '36px 16px',
              border: '1px dashed var(--glass-border)',
              borderRadius: 16,
              color: 'var(--cms-text-muted)'
            }}>
              <Repeat size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
              <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text)' }}>Belum ada klien retainer aktif</div>
              <div style={{ fontSize: 11.5, marginTop: 4, maxWidth: 360, lineHeight: 1.5 }}>
                Tambahkan kontrak bulanan untuk kemudahan pembuatan nota otomatis setiap bulan.
              </div>
            </div>
          ) : (
            retainers.map(r => (
              <div
                key={r.id}
                style={{
                  background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 16,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>
                      {r.clientName}
                    </span>
                    <span style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#6366f1',
                      fontWeight: 800
                    }}>
                      Tiap Tgl {r.billingDay}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                    {r.serviceTitle} • <strong style={{ color: 'var(--cms-text)' }}>{formatRp(r.amount)}</strong>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                    Tagihan berikutnya: <strong>{r.nextBillingDate}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onGenerateInvoice(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <FileText size={13} />
                    Buat Invoice Periode Ini
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid var(--glass-border)',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Hapus Kontrak"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringRetainerModal;
