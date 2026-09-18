import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, MessageSquare, CreditCard } from 'lucide-react';
import { storage } from '../../utils/storage';
import InfoTooltip from './InfoTooltip';
import { useDialog } from './DialogProvider';

const newId = () => `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ShopSettingsManager = ({ notify, globalSettings, onUpdateSettings }) => {
  const { showConfirm } = useDialog();
  const [waNumber, setWaNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shopEnabled, setShopEnabled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const s = globalSettings.shopSettings || {};

    setWaNumber(s.whatsappNumber || '');
    setPaymentMethods(s.paymentMethods || []);
    setShopEnabled(s.enabled || false);
  }, [globalSettings.shopSettings]);

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

  const handleSave = () => {
    // Validasi
    if (paymentMethods.some(p => !p.bankName || !p.accountName || !p.accountNumber)) {
      notify('⚠️ Harap lengkapi semua kolom metode pembayaran', 'error');
      return;
    }
    
    const newShopSettings = {
      ...globalSettings.shopSettings,
      whatsappNumber: waNumber,
      paymentMethods: paymentMethods,
      enabled: shopEnabled
    };
    
    onUpdateSettings({ shopSettings: newShopSettings });
    storage.setItem('porto_settings', { ...globalSettings, shopSettings: newShopSettings });
    setHasChanges(false);
    notify('✅ Pengaturan toko disimpan!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, animation: 'cmsFadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Pengaturan Toko</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted)' }}>Atur status toko, kontak, dan metode pembayaran.</p>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cms-panel-bg)', padding: 20, borderRadius: 24, border: '1px solid var(--glass-border)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Aktifkan Fitur Toko</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted)' }}>Tampilkan fitur Shop & Katalog di halaman web utama dan CMS.</p>
        </div>
        <button 
          type="button"
          role="switch"
          aria-checked={shopEnabled}
          className="cms-switch"
          onClick={() => { setShopEnabled(!shopEnabled); setHasChanges(true); }}
        >
          <div className="cms-switch-knob" />
        </button>
      </div>

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Metode Pembayaran</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted)' }}>Bank & E-Wallet yang muncul saat pelanggan checkout.</p>
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
