import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, MessageSquare, CreditCard, Percent, Info, RefreshCw } from 'lucide-react';
import { storage } from '../../utils/storage';
import InfoTooltip from './InfoTooltip';
import { useDialog } from './DialogProvider';
import { syncUnifiedStudioData } from '../../utils/unifiedDataSync';

const newId = () => `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ShopSettingsManager = ({ notify, globalSettings, onUpdateSettings }) => {
  const { showConfirm } = useDialog();
  const [waNumber, setWaNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shopEnabled, setShopEnabled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // PPN / Tax settings
  const [ppnEnabled, setPpnEnabled] = useState(false);
  const [ppnPercent, setPpnPercent] = useState(11);
  const [ppnIncluded, setPpnIncluded] = useState<'inclusive' | 'exclusive'>('exclusive');

  useEffect(() => {
    const s = globalSettings.shopSettings || {};

    setWaNumber(s.whatsappNumber || '');
    setPaymentMethods(s.paymentMethods || []);
    setShopEnabled(s.enabled || false);

    // PPN
    const ppn = s.ppn || {};
    setPpnEnabled(ppn.enabled || false);
    setPpnPercent(ppn.percent ?? 11);
    setPpnIncluded(ppn.included ?? 'exclusive');
  }, [globalSettings.shopSettings]);

  // Listen to profile updates from other forms (e.g. BusinessProfileManager or TransactionManager)
  useEffect(() => {
    const handleProfileSync = (e: any) => {
      const p = e.detail;
      if (!p) return;
      if (p.whatsapp) setWaNumber(p.whatsapp);
      if (p.bankAccounts && Array.isArray(p.bankAccounts)) {
        setPaymentMethods(p.bankAccounts.map((b: any) => ({
          id: b.id || newId(),
          bankName: b.bankName || b.name || 'BCA',
          accountName: b.accountName || b.accountHolder || '',
          accountNumber: b.accountNumber || '',
          bankLogo: b.bankLogo || b.logo || '',
          color: b.color || '#003399'
        })));
      }
    };
    window.addEventListener('porto_business_profile_updated', handleProfileSync);
    return () => window.removeEventListener('porto_business_profile_updated', handleProfileSync);
  }, []);

  const handleAddPayment = () => {
    setPaymentMethods([...paymentMethods, { id: newId(), bankName: '', accountName: '', accountNumber: '' }]);
    setHasChanges(true);
  };

  const handleRemovePayment = async (id) => {
    if (await showConfirm('Hapus metode pembayaran ini?')) {
      setPaymentMethods(paymentMethods.filter(p => p.id !== id));
      setHasChanges(true);
    }
  };

  const updatePaymentField = (id, field, value) => {
    setPaymentMethods(paymentMethods.map(p => p.id === id ? { ...p, [field]: value } : p));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (paymentMethods.some(p => !p.bankName || !p.accountName || !p.accountNumber)) {
      notify('⚠️ Harap lengkapi semua kolom metode pembayaran', 'error');
      return;
    }

    const newShopSettings = {
      ...globalSettings.shopSettings,
      whatsappNumber: waNumber,
      paymentMethods: paymentMethods,
      enabled: shopEnabled,
      ppn: {
        enabled: ppnEnabled,
        percent: ppnPercent,
        included: ppnIncluded, // 'exclusive' = ditambah ke harga, 'inclusive' = sudah termasuk
      }
    };

    onUpdateSettings({ shopSettings: newShopSettings });
    await storage.setItem('porto_settings', { ...globalSettings, shopSettings: newShopSettings });

    // Sync to Master Database & All Form Modules
    try {
      const syncRes = await syncUnifiedStudioData({
        whatsapp: waNumber,
        bankAccounts: paymentMethods.map(p => ({
          id: p.id,
          bankName: p.bankName,
          accountName: p.accountName,
          accountNumber: p.accountNumber,
          bankLogo: p.bankLogo || '',
          color: p.color || '#003399'
        }))
      }, 'Pengaturan Toko');

      setHasChanges(false);
      if (syncRes && syncRes.notificationText) {
        notify(syncRes.notificationText, 'success');
      } else {
        notify('✅ Pengaturan toko disimpan & tersinkron ke semua modul!');
      }
    } catch (err) {
      console.warn('Sync failed:', err);
      setHasChanges(false);
      notify('✅ Pengaturan toko disimpan!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, animation: 'cmsFadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Pengaturan Toko</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted)' }}>Atur status toko, kontak, PPN, dan metode pembayaran.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="cms-btn cms-btn-primary"
          style={{ opacity: hasChanges ? 1 : 0.5, cursor: hasChanges ? 'pointer' : 'not-allowed', borderRadius: 100, padding: '0 20px', height: 40, fontSize: 13 }}
        >
          <Save size={16} /> Simpan
        </button>
      </div>

      {/* Aktifkan Toko */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cms-panel-bg)', padding: 20, borderRadius: 24, border: '1px solid var(--glass-border)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Aktifkan Fitur Toko</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted)' }}>Tampilkan fitur Shop &amp; Katalog di halaman web utama dan CMS.</p>
        </div>
        <button
          type="button" role="switch" aria-checked={shopEnabled}
          className="cms-switch"
          onClick={() => { setShopEnabled(!shopEnabled); setHasChanges(true); }}
        >
          <div className="cms-switch-knob" />
        </button>
      </div>

      {/* WhatsApp */}
      <div style={{ background: 'var(--cms-panel-bg)', padding: 20, borderRadius: 24, border: '1px solid var(--glass-border)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800 }}>Nomor WhatsApp Admin</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MessageSquare size={16} color="var(--cms-accent)" />
          <div style={{ fontSize: 13, fontWeight: 800 }}>Nomor WhatsApp</div>
        </div>
        <input
          type="text"
          placeholder="Cth: 6281234567890 (Gunakan kode negara 62)"
          value={waNumber}
          onChange={(e) => { setWaNumber(e.target.value); setHasChanges(true); }}
          className="cms-input"
          style={{ width: '100%', maxWidth: 400 }}
        />
      </div>

      {/* ─── PPN / TAX SETTINGS ─── */}
      <div style={{ background: 'var(--cms-panel-bg)', padding: 20, borderRadius: 24, border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Percent size={16} color="#6366f1" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Pajak Pertambahan Nilai (PPN)</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                Untuk pencatatan akuntansi &amp; laporan pembukuan tahunan
              </p>
            </div>
          </div>
          <button
            type="button" role="switch" aria-checked={ppnEnabled}
            className="cms-switch"
            onClick={() => { setPpnEnabled(!ppnEnabled); setHasChanges(true); }}
          >
            <div className="cms-switch-knob" />
          </button>
        </div>

        {/* Info box */}
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          background: ppnEnabled ? 'rgba(99,102,241,0.06)' : 'var(--cms-switcher-bg)',
          border: `1px solid ${ppnEnabled ? 'rgba(99,102,241,0.2)' : 'var(--glass-border)'}`,
          marginBottom: ppnEnabled ? 16 : 0, fontSize: 12.5,
          color: 'var(--cms-text-muted)',
          display: 'flex', alignItems: 'flex-start', gap: 8
        }}>
          <Info size={14} style={{ marginTop: 1, flexShrink: 0, color: '#6366f1' }} />
          <span>
            {ppnEnabled
              ? `PPN ${ppnPercent}% aktif — dicatat otomatis di setiap transaksi dari shop maupun admin. Tampil di nota/invoice. Berguna untuk laporan pajak & pembukuan tahunan.`
              : 'Aktifkan PPN agar setiap transaksi mencatat nilai pajak secara otomatis. Wajib jika bisnis Anda terdaftar sebagai PKP (Pengusaha Kena Pajak).'}
          </span>
        </div>

        {ppnEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Tarif PPN */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Tarif PPN (%)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number" min={0} max={100}
                  value={ppnPercent}
                  onChange={e => { setPpnPercent(Math.max(0, Math.min(100, Number(e.target.value)))); setHasChanges(true); }}
                  className="cms-input"
                  style={{ width: 90, textAlign: 'center', fontWeight: 800, fontSize: 15 }}
                />
                <span style={{ fontSize: 14, fontWeight: 700 }}>%</span>
              </div>
              {/* Quick presets */}
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[0, 10, 11, 12].map(pct => (
                  <button
                    key={pct} type="button"
                    onClick={() => { setPpnPercent(pct); setHasChanges(true); }}
                    style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                      border: ppnPercent === pct ? '1.5px solid #6366f1' : '1px solid var(--glass-border)',
                      background: ppnPercent === pct ? '#6366f1' : 'transparent',
                      color: ppnPercent === pct ? '#fff' : 'var(--cms-text-muted)'
                    }}
                  >{pct === 0 ? 'Bebas PPN' : `${pct}%`}</button>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
                🇮🇩 Tarif resmi: 11% (April 2022). Barang mewah tertentu naik menjadi 12% (Jan 2025).
              </div>
            </div>

            {/* Tipe PPN */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Cara Perhitungan
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  {
                    value: 'exclusive',
                    label: 'Eksklusif (ditambahkan)',
                    sub: `Harga belum termasuk PPN. ${ppnPercent}% ditambahkan ke harga saat checkout/invoice.`
                  },
                  {
                    value: 'inclusive',
                    label: 'Inklusif (sudah termasuk)',
                    sub: 'Harga sudah termasuk PPN. Nilai PPN dihitung & dicatat untuk pembukuan, tidak menambah total.'
                  },
                ] as const).map(opt => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                      border: ppnIncluded === opt.value ? '1.5px solid #6366f1' : '1px solid var(--glass-border)',
                      background: ppnIncluded === opt.value ? 'rgba(99,102,241,0.06)' : 'transparent'
                    }}
                  >
                    <input
                      type="radio" name="ppnIncluded" value={opt.value}
                      checked={ppnIncluded === opt.value}
                      onChange={() => { setPpnIncluded(opt.value); setHasChanges(true); }}
                      style={{ accentColor: '#6366f1', marginTop: 2, flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metode Pembayaran */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Metode Pembayaran</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted)' }}>Bank &amp; E-Wallet yang muncul saat pelanggan checkout.</p>
        </div>
        <button onClick={handleAddPayment} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 16px', height: 36, fontSize: 12 }}>
          <Plus size={14} /> Tambah Metode
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {paymentMethods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--cms-switcher-bg)', borderRadius: 24, border: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={32} color="var(--cms-text-muted)" style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text-muted)' }}>Belum ada metode pembayaran</div>
            <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 4 }}>Pelanggan tidak bisa checkout tanpa metode pembayaran.</div>
          </div>
        ) : paymentMethods.map((p, idx) => (
          <div key={p.id} style={{ background: 'var(--cms-panel-bg)', padding: 20, borderRadius: 24, border: '1px solid var(--glass-border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Nama Bank / E-Wallet</div>
                  <input type="text" placeholder="BCA / GoPay / OVO" value={p.bankName} onChange={e => updatePaymentField(p.id, 'bankName', e.target.value)} className="cms-input" style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Atas Nama</div>
                  <input type="text" placeholder="Nama Pemilik Rekening" value={p.accountName} onChange={e => updatePaymentField(p.id, 'accountName', e.target.value)} className="cms-input" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Nomor Rekening / HP</div>
                <input type="text" placeholder="Cth: 1234567890" value={p.accountNumber} onChange={e => updatePaymentField(p.id, 'accountNumber', e.target.value)} className="cms-input" style={{ width: '100%', maxWidth: 300 }} />
              </div>
            </div>
            <button onClick={() => handleRemovePayment(p.id)} className="cms-btn cms-btn-danger" style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopSettingsManager;
