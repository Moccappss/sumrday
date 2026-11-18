import React, { useState } from 'react';
import { 
  QrCode, CheckCircle2, ShieldCheck, Copy, Check, 
  ExternalLink, Zap, X, Clock, Landmark, Loader2
} from 'lucide-react';

interface QrisSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onPaymentSuccess: (transactionId: string) => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const QrisSimulatorModal: React.FC<QrisSimulatorModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onPaymentSuccess,
  notify,
}) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !transaction) return null;

  const amount = transaction.paymentStatus === 'dp' && transaction.dpAmount 
    ? transaction.dpAmount 
    : (transaction.total || transaction.items?.reduce((s: number, i: any) => s + ((i.price || 0) * (i.qty || 1)), 0) || 0);

  const vaNumber = `8808${(transaction.id || '').replace(/[^0-9]/g, '').padEnd(10, '7')}`.slice(0, 16);

  const handleCopyVa = () => {
    navigator.clipboard.writeText(vaNumber);
    setCopied(true);
    notify?.('Nomor Virtual Account disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(transaction.id);
      notify?.(`Pembayaran ${transaction.id} berhasil diverifikasi secara otomatis via QRIS/VA!`, 'success');
      onClose();
    }, 900);
  };

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
      animation: 'cmsFadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'var(--cms-card-bg, #1e1e2d)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCode size={18} color="var(--cms-accent)" />
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>
              Pembayaran Instan (QRIS & VA)
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
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
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)' }}>
              TOTAL TAGIHAN INVOICE {transaction.id}
            </div>
            <div style={{ fontSize: 26, fontWeight: 950, color: 'var(--cms-text)', marginTop: 4 }}>
              {formatRp(amount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>
              Klien: <strong>{transaction.customer?.name || 'Pelanggan'}</strong>
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{
            padding: 16,
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`qris://sumrday/pay?trx=${transaction.id}&amount=${amount}`)}`}
              alt="QRIS Code"
              style={{ width: 180, height: 180, borderRadius: 8, display: 'block' }}
            />
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
              QRIS STANDAR PEMBAYARAN NASIONAL
            </div>
          </div>

          {/* Virtual Account Box */}
          <div style={{
            width: '100%',
            background: 'var(--cms-input-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)' }}>
                BCA / MANDIRI VIRTUAL ACCOUNT
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '0.05em', marginTop: 2 }}>
                {vaNumber}
              </div>
            </div>
            <button
              onClick={handleCopyVa}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-card-bg)',
                color: 'var(--cms-text)',
                fontSize: 11.5,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          {/* Simulation Instant Webhook Button */}
          <div style={{ width: '100%', paddingTop: 6 }}>
            <button
              onClick={handleSimulateSuccess}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 900,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              <span>Verifikasi & Set Lunas Otomatis</span>
            </button>
            <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 6 }}>
              Mensimulasikan webhook pembayaran sukses & mengupdate status invoice secara real-time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrisSimulatorModal;
