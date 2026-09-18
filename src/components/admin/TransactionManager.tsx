import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Receipt, Plus, Search, Printer, Edit3, Trash2, X, Save,
  Upload, Image as ImageIcon, Package, User, Phone, Mail,
  MapPin, Tag, CheckCircle2, Clock, AlertCircle, Settings2,
  ShoppingCart, FileText, ArrowLeft, RefreshCw, Eye,
  BarChart2, CreditCard, Wallet, BadgePercent, Truck, Landmark,
  Check, Download, Users, Store, PenTool, LayoutTemplate, Percent, ChevronDown,
  Hash, DollarSign, ZoomIn, ZoomOut, Info, Cloud, Copy, DownloadCloud, MessageCircle
} from 'lucide-react';
import { notifyTransaction } from '../../utils/notifications';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useContextMenu } from './ContextMenuProvider';
import MediaGalleryModal from './MediaGalleryModal';
// Dynamic imports used for pdf/image generation
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ─── Helpers ────────────────────────────────────────────────── */
const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(n || 0);

const formatDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const genId = (prefix) => `${prefix}-${Date.now()}`;

const EMPTY_TRX = {
  id: '',
  date: new Date().toISOString().slice(0, 10),
  customer: { id: '', name: '', phone: '', email: '', address: '' },
  items: [],
  discount: { type: 'percent', value: 0, label: '' },
  shipping: 0,
  tax: { enabled: false, percent: 11 },
  paymentStatus: 'belum',
  dpAmount: 0,
  notes: '',
  attachment: '',
  mou: { enabled: false, title: 'SURAT PERJANJIAN KERJA SAMA', content: '', date: '' },
};

const EMPTY_PRODUCT = { id: '', name: '', sku: '', price: 0, stock: 0, category: '', image: '' };
const EMPTY_DISCOUNT = { id: '', label: '', type: 'percent', value: 0 };
const EMPTY_CUSTOMER = { id: '', name: '', phone: '', email: '', address: '' };

const STATUS_CONFIG = {
  belum: { label: 'Belum Bayar', color: '#ef4444', bg: '#fee2e2', icon: <AlertCircle size={12} /> },
  dp: { label: 'DP / Bertahap', color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={12} /> },
  lunas: { label: 'Lunas', color: '#10b981', bg: '#d1fae5', icon: <CheckCircle2 size={12} /> },
  quotation: { label: 'Penawaran', color: '#6366f1', bg: '#e0e7ff', icon: <FileText size={12} /> },
};

/* ─── Reusable style tokens ──────────────────────────────────── */
const S = {
  panel: {
    background: 'var(--cms-panel-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 16,
    padding: '20px',
    backdropFilter: 'blur(16px)',
  },
  input: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    border: '1px solid var(--glass-border)',
    background: 'var(--cms-input-bg)',
    color: 'var(--cms-text)',
    padding: '0 12px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  },
  sectionTitle: { margin: '0 0 14px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cms-text)', letterSpacing: '-0.01em' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' },
  iconBtn: (color = 'var(--cms-text-muted)', bg = 'var(--cms-switcher-bg)') => ({
    width: 32, height: 32, borderRadius: 8, border: 'none', minHeight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color, background: bg, flexShrink: 0, transition: 'opacity 0.15s',
  }),
};

/* ─── Calc helpers ───────────────────────────────────────────── */
const parseNumber = (val) => parseInt(val.toString().replace(/[^0-9]/g, ''), 10) || 0;
const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

function calcTotals(trx) {
  const subtotal = (trx.items || []).reduce((s, i) => s + i.qty * i.price, 0);
  const discVal = trx.discount?.type === 'percent'
    ? Math.round(subtotal * (trx.discount.value || 0) / 100)
    : (trx.discount?.value || 0);
  const afterDisc = Math.max(0, subtotal - discVal);
  const taxVal = trx.tax?.enabled ? Math.round(afterDisc * (trx.tax.percent || 0) / 100) : 0;
  const uniqueCodeVal = trx.uniqueCode || 0;
  const grandTotal = (trx.grandTotal && trx.uniqueCode) 
    ? trx.grandTotal 
    : (afterDisc + taxVal + (trx.shipping || 0) + uniqueCodeVal);
  
  let paid = 0;
  if (trx.paymentStatus === 'lunas') {
    paid = grandTotal;
  } else if (trx.paymentStatus === 'dp') {
    if (trx.termin && trx.termin.length > 0) {
      paid = trx.termin.reduce((sum, t) => sum + (t.isPaid ? t.amount : 0), 0);
    } else {
      paid = trx.dpAmount || 0;
    }
  }
  
  const remaining = trx.paymentStatus === 'quotation' ? grandTotal : Math.max(0, grandTotal - paid);
  return { subtotal, discVal, taxVal, grandTotal, remaining, paid, uniqueCodeVal };
}

/* ─── Custom Select Component ────────────────────────────────── */
const CustomSelect = ({ value, options, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const clickOut = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', marginBottom: 12, zIndex: isOpen ? 50 : 1 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', height: 44, borderRadius: 9999, border: '1.5px solid var(--glass-border)',
          background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', color: selectedOpt ? 'var(--cms-text)' : 'var(--cms-text-muted)', fontSize: 13,
          cursor: 'pointer', outline: 'none', backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ color: 'var(--cms-accent)' }}>{icon}</span>}
          {selectedOpt ? selectedOpt.label : placeholder}
        </div>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--cms-panel-bg)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)', borderRadius: 20, padding: 8,
          boxShadow: '0 10px 32px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 220, overflowY: 'auto'
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{
                padding: '10px 16px', borderRadius: 12, fontSize: 13, cursor: 'pointer',
                background: value === opt.value ? 'var(--cms-accent-soft)' : 'transparent',
                color: value === opt.value ? 'var(--cms-accent)' : 'var(--cms-text)',
                fontWeight: value === opt.value ? 700 : 500, transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = value === opt.value ? 'var(--cms-accent-soft)' : 'var(--cms-switcher-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = value === opt.value ? 'var(--cms-accent-soft)' : 'transparent'}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--cms-text-muted)', textAlign: 'center' }}>Tidak ada data</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Invoice Print View ─────────────────────────────────────── */
function InvoicePrintView({ trx, settings, onClose, notify, globalConfig, onUploadSuccess }) {
  const { subtotal, discVal, taxVal, grandTotal, remaining } = calcTotals(trx);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(true);
  const invoiceRef = useRef(null);

  const handleDownloadPDF = async () => {
    const el = invoiceRef.current;
    if (!el) return;
    setIsGenerating(true);
    notify('Menyiapkan file PDF (resolusi tinggi)...');
    try {
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const dataUrl = await htmlToImage.toPng(el, { quality: 0.98, backgroundColor: '#ffffff', pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      
      const imgAspect = el.offsetHeight / el.offsetWidth;
      const imgHeightMm = pdfW * imgAspect;
      
      if (imgHeightMm <= pdfH) {
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, imgHeightMm);
      } else {
        let remainingHeight = imgHeightMm;
        let pageOffset = 0;
        while (remainingHeight > 0) {
          pdf.addImage(dataUrl, 'PNG', 0, -pageOffset, pdfW, imgHeightMm);
          remainingHeight -= pdfH;
          pageOffset += pdfH;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      pdf.save(`Nota_${trx.id}.pdf`);
      notify('✅ PDF berhasil diunduh!');
    } catch (err) {
      console.error('PDF error', err);
      notify('Gagal membuat PDF: ' + (err?.message || 'unknown error'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const handleUploadToDrive = async () => {
    const effectiveWebhook = globalConfig?.googleAppsScriptUrl;
    if (!effectiveWebhook) {
      notify('URL Google Script Webhook belum diatur di Pengaturan Global!', 'error');
      return;
    }
    const el = invoiceRef.current;
    if (!el) return;
    
    setIsUploading(true);
    notify('Mengupload PDF ke Google Drive...');
    try {
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const dataUrl = await htmlToImage.toPng(el, { quality: 0.98, backgroundColor: '#ffffff', pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgAspect = el.offsetHeight / el.offsetWidth;
      const imgHeightMm = pdfW * imgAspect;
      if (imgHeightMm <= pdfH) {
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, imgHeightMm);
      } else {
        let remainingHeight = imgHeightMm; let pageOffset = 0;
        while (remainingHeight > 0) {
          pdf.addImage(dataUrl, 'PNG', 0, -pageOffset, pdfW, imgHeightMm);
          remainingHeight -= pdfH; pageOffset += pdfH;
          if (remainingHeight > 0) pdf.addPage();
        }
      }
      
      const pdfBase64Data = pdf.output('datauristring');
      const b64 = pdfBase64Data.split(',')[1];
      
      const res = await fetch(effectiveWebhook, {
        method: 'POST',
        body: JSON.stringify({
          action: 'upload_file',
          fileName: `Nota_${trx.id}.pdf`,
          fileType: 'application/pdf',
          fileBase64: b64
        })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        notify('✅ PDF berhasil disimpan ke Google Drive!');
        if (onUploadSuccess) onUploadSuccess(data.url);
      } else {
        notify('Gagal ke Drive: ' + data.message, 'error');
      }
    } catch (err) {
      console.error('Drive upload error', err);
      notify('Gagal upload: ' + (err?.message || 'unknown error'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyToWA = () => {
    let text = `*NOTA TAGIHAN - ${settings.shopName || 'AGENSI'}*\n`;
    text += `No: ${trx.id}\n`;
    text += `Tanggal: ${formatDate(trx.createdAt)}\n`;
    text += `Klien: ${trx.customer.name}\n\n`;
    
    text += `*RINCIAN PESANAN:*\n`;
    trx.items.forEach(i => {
      text += `- ${i.name} (${i.qty}x) = ${formatRp(i.price * i.qty)}\n`;
    });
    
    text += `\n*TOTAL: ${formatRp(grandTotal)}*\n`;
    
    if (trx.paymentStatus === 'dp' && trx.termin && trx.termin.length > 0) {
      text += `\n*RINCIAN PEMBAYARAN:*\n`;

      trx.termin.forEach((t, idx) => {
        text += `- ${t.name}: ${formatRp(t.amount)} ${t.isPaid ? '(LUNAS)' : '(BELUM BAYAR)'}\n`;
      });
      text += `Sisa Tagihan: ${formatRp(remaining)}\n`;
    } else if (trx.paymentStatus === 'belum' || trx.paymentStatus === 'quotation') {
      text += `\nStatus: Belum Dibayar\n`;
    } else {
      text += `\nStatus: LUNAS\n`;
    }
    
    if (settings.bankInfo) {
      text += `\n*REKENING PEMBAYARAN:*\n${settings.bankInfo}\n`;
    }
    
    text += `\nTerima kasih atas kepercayaannya!`;
    
    navigator.clipboard.writeText(text).then(() => {
      notify('✅ Teks tagihan berhasil disalin (siap dipaste ke WA!)');
    }).catch(() => {
      notify('❌ Gagal menyalin teks', 'error');
    });
  };

  const [scale, setScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      if (isZoomed) { setScale(1); return; }
      const w = window.innerWidth;
      if (w < 820) {
        setScale((w - 32) / 794);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isZoomed]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 9999, overflow: 'auto', padding: '32px 16px 120px',
    }}>
      <div style={{
        position: 'fixed', bottom: window.innerWidth <= 500 ? '76px' : '24px', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--cms-bg-card)', border: '1px solid var(--cms-border)', 
        borderRadius: '24px', padding: '12px 16px', display: 'flex', flexDirection: 'row', gap: '8px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        zIndex: 10000, alignItems: 'center', width: 'max-content', maxWidth: '95%', overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        <div className="toolbar-row" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', flexShrink: 0, alignItems: 'center' }}>
          
          <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
            {settings.banks && settings.banks.length > 0 && (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: showBankInfo ? 'var(--cms-card-bg-hover)' : 'transparent', border: 'none', color: showBankInfo ? 'var(--cms-accent)' : 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }} title="Tampilkan Nomor Rekening" onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => { if(!showBankInfo) e.currentTarget.style.background = 'transparent'; }}>
                <input type="checkbox" checked={showBankInfo} onChange={e => setShowBankInfo(e.target.checked)} style={{ display: 'none' }} />
                <CreditCard size={20} />
              </label>
            )}
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              style={{ background: isZoomed ? 'var(--cms-card-bg-hover)' : 'transparent', border: 'none', color: isZoomed ? 'var(--cms-accent)' : 'var(--cms-text-primary)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              title={isZoomed ? "Perkecil" : "Perbesar"}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-card-bg-hover)'} onMouseOut={(e) => { if(!isZoomed) e.currentTarget.style.background = 'transparent'; }}
            >
              {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
            <button
              onClick={handleCopyToWA}
              style={{ background: 'transparent', border: 'none', color: '#10b981', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              title="Salin Teks (Untuk WhatsApp)"
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Copy size={20} />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', opacity: isGenerating ? 0.5 : 1 }}
              title="Download PDF"
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {isGenerating ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={20} />}
            </button>
            {(settings.webhookUrl || globalConfig.googleAppsScriptUrl) && (
              <button
                onClick={handleUploadToDrive}
                disabled={isUploading}
                style={{ background: 'transparent', border: 'none', color: '#f59e0b', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', opacity: isUploading ? 0.5 : 1 }}
                title="Simpan ke Google Drive"
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {isUploading ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Cloud size={20} />}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--cms-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--cms-border)', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              title="Tutup"
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={20} />
            </button>
          </div>

        </div>
      </div>

      <div style={{ width: 794 * scale, margin: '0 auto', paddingBottom: 160 }}>
        <div style={{ width: 794, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <div ref={invoiceRef} id="invoice-capture" className="cms-nota-print-container" style={{
            backgroundColor: 'white', color: 'black',
            width: 794,
            borderRadius: 8, boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            fontSize: 13, lineHeight: 1.6, overflow: 'hidden',
          }}>

        <style dangerouslySetInnerHTML={{__html: `
          .cms-nota-print-container, .cms-nota-print-container * {
            color-scheme: light !important;
          }
          [data-cms-theme="dark"] .cms-nota-print-container {
            background-color: white !important;
          }
          [data-cms-theme="dark"] .cms-nota-print-container div:not([style*="background"]) {
            background-color: transparent !important;
          }
          [data-cms-theme="dark"] .cms-nota-print-container table,
          [data-cms-theme="dark"] .cms-nota-print-container tbody,
          [data-cms-theme="dark"] .cms-nota-print-container tr,
          [data-cms-theme="dark"] .cms-nota-print-container td {
            background-color: transparent !important;
          }
        `}} />
        {settings.headerImage ? (
          <img src={settings.headerImage} alt="Header Nota" crossOrigin="anonymous" style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
        ) : settings.headerText ? (
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)', color: 'white', padding: '28px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>{settings.headerText}</div>
          </div>
        ) : null}

        <div style={{ padding: '28px 32px' }}>
          {/* Header: Customer + Invoice ID */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f9fafb', borderRadius: 16, padding: '24px', marginBottom: 28, border: '1px solid #e5e7eb' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ba3af', letterSpacing: '0.05em', marginBottom: 10 }}>DATA PEMBELI</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'black', marginBottom: 6 }}>{trx.customer.name || '-'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#6a7280' }}>
                {trx.customer.phone && <span>📞 {trx.customer.phone}</span>}
                {trx.customer.email && <span>✉️ {trx.customer.email}</span>}
                {trx.customer.address && <span>📍 {trx.customer.address}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '1px solid #e5e7eb', paddingLeft: 24 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e1b4b', letterSpacing: '-0.02em', lineHeight: 1 }}>NOTA</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#4b1d95', marginTop: 12 }}>#{trx.id}</div>
              <div style={{ fontSize: 12, color: '#6a7280', marginTop: 4 }}>{formatDate(trx.date)}</div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#1e1b4b', color: 'white' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, borderRadius: '4px 0 0 4px' }}>ITEM</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700 }}>QTY</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700 }}>HARGA</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, borderRadius: '0 4px 4px 0' }}>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(trx.items || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: 'black' }}>{item.name}</div>
                    {item.sku && <div style={{ fontSize: 11, color: '#9ba3af' }}>SKU: {item.sku}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6a7280' }}>{item.qty}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#6a7280' }}>{formatRp(item.price)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'black' }}>{formatRp(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bank Info + Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
            <div style={{ flex: 1 }}>
              {showBankInfo && settings.banks && settings.banks.length > 0 && (
                <div style={{ padding: '16px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ba3af', marginBottom: 12 }}>INFO PEMBAYARAN (REKENING / E-WALLET)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {settings.banks.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {b.logo && <img src={b.logo} alt={b.name} style={{ width: 40, height: 40, objectFit: 'contain' }} />}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'black' }}>{b.name} - {b.accountNumber}</div>
                          <div style={{ fontSize: 12, color: '#4b5563' }}>a/n {b.accountName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ width: '100%', maxWidth: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: '#6a7280' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'black' }}>{formatRp(subtotal)}</span>
              </div>
              {discVal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: '#10b981' }}>
                  <span>Diskon{trx.discount.label ? ` (${trx.discount.label})` : ''}</span>
                  <span style={{ fontWeight: 600 }}>- {formatRp(discVal)}</span>
                </div>
              )}
              {trx.shipping > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                  <span style={{ color: '#6a7280' }}>Ongkos Kirim</span>
                  <span style={{ fontWeight: 600, color: 'black' }}>{formatRp(trx.shipping)}</span>
                </div>
              )}
              {trx.tax.enabled && taxVal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                  <span style={{ color: '#6a7280' }}>Pajak (PPN {trx.tax.percent}%)</span>
                  <span style={{ fontWeight: 600, color: 'black' }}>{formatRp(taxVal)}</span>
                </div>
              )}
              {trx.uniqueCode > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: '#d97706' }}>
                  <span style={{ fontWeight: 600 }}>Kode Unik Verifikasi</span>
                  <span style={{ fontWeight: 700 }}>+ {formatRp(trx.uniqueCode)}</span>
                </div>
              )}
              <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'black' }}>TOTAL</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#4b1d95' }}>{formatRp(grandTotal)}</span>
              </div>
              <div style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 8,
                background: STATUS_CONFIG[trx.paymentStatus]?.bg || '#f3f4f6',
                border: `1px solid ${STATUS_CONFIG[trx.paymentStatus]?.color || '#e5e7eb'}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ba3af', marginBottom: 6 }}>STATUS PEMBAYARAN</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: STATUS_CONFIG[trx.paymentStatus]?.color }}>
                    {STATUS_CONFIG[trx.paymentStatus]?.icon}
                    {STATUS_CONFIG[trx.paymentStatus]?.label}
                  </div>
                  {trx.paymentStatus === 'dp' && (
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      {trx.termin && trx.termin.length > 0 ? (
                        <div style={{ marginBottom: 4 }}>
                          {trx.termin.map(t => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, color: t.isPaid ? 'black' : '#9ca3af', fontSize: 11 }}>
                              <span>{t.name} {t.isPaid ? '(Lunas)' : ''}:</span>
                              <strong>{formatRp(t.amount)}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#6a7280' }}>DP: <strong style={{color:'black'}}>{formatRp(trx.dpAmount)}</strong></div>
                      )}
                      <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 4 }}>Sisa: {formatRp(remaining)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {trx.attachment && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: '#eff6ff', borderRadius: 8, borderLeft: '3px solid #3b82f6' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>LAMPIRAN / REFERENSI KLIEN</div>
              <a href={trx.attachment} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}>{trx.attachment}</a>
            </div>
          )}
          {trx.notes && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: '#fffbeb', borderRadius: 8, borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>CATATAN</div>
              <div style={{ fontSize: 12, color: '#78350f' }}>{trx.notes}</div>
            </div>
          )}
          {settings.footerText && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#6a7280', marginTop: 16 }}>
              {settings.footerText}
            </div>
          )}
        </div>

        {settings.footerImage && (
          <img src={settings.footerImage} alt="Footer Nota" crossOrigin="anonymous" style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }} />
        )}

        {trx.mou?.enabled && (
          <div style={{ pageBreakBefore: 'always', background: '#fff', padding: 40, fontFamily: 'serif', color: 'black' }}>
            <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' }}>{trx.mou.title || 'SURAT PERJANJIAN KERJA SAMA'}</h2>
            <div style={{ textAlign: 'center', fontSize: 12, marginBottom: 32 }}>Tanggal: {formatDate(trx.mou.date || trx.createdAt)}</div>
            
            <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
              {trx.mou.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, padding: '0 40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 80, fontSize: 14 }}>Pihak Pertama (Klien)</div>
                <div style={{ fontWeight: 'bold', fontSize: 14, textDecoration: 'underline' }}>{trx.customer?.name}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 80, fontSize: 14 }}>Pihak Kedua (Agensi)</div>
                <div style={{ fontWeight: 'bold', fontSize: 14, textDecoration: 'underline' }}>{settings.shopName || '...........................'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.belum;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function TransactionManager({ notify, confirm }) {
  const [activeTab, setActiveTab] = useState('transactions');
  const { bindContextMenu } = useContextMenu();

  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [webClients, setWebClients] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [invoiceSettings, setInvoiceSettings] = useState({
    headerImage: '', footerImage: '', headerText: '', footerText: '',
    shopName: '', shopPhone: '', shopAddress: '', taxPercent: 11,
  });
  const [loading, setLoading] = useState(true);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'header' | 'footer' | 'bankLogo' | 'productImage' | null>(null);
  const [targetBankIndex, setTargetBankIndex] = useState<number | null>(null);

  // Combined customers (Local customers + Registered web clients)
  const combinedCustomers = useMemo(() => {
    const map = new Map();
    (customers || []).forEach(c => {
      if (c && c.name) {
        const key = (c.phone || c.email || c.name).toLowerCase();
        map.set(key, { ...c, isWebClient: false });
      }
    });
    (webClients || []).forEach(wc => {
      if (wc && wc.name) {
        const key = (wc.phone || wc.email || wc.name).toLowerCase();
        const existing = map.get(key);
        map.set(key, {
          id: wc.id || (existing ? existing.id : genId('CLI')),
          clientId: wc.id,
          name: wc.name,
          phone: wc.phone || (existing ? existing.phone : ''),
          email: wc.email || (existing ? existing.email : ''),
          address: wc.address || (existing ? existing.address : ''),
          avatar: wc.avatar,
          isWebClient: true,
        });
      }
    });
    return Array.from(map.values());
  }, [customers, webClients]);

  const getTransactionMenu = (trx) => {
    const { grandTotal } = calcTotals(trx);
    return {
      title: `Transaksi #${trx.id}`,
      subtitle: `${trx.customer?.name || 'Pelanggan'} · ${formatRp(grandTotal)}`,
      headerBadge: trx.paymentStatus?.toUpperCase(),
      items: [
        {
          label: 'Ubah Status Pembayaran',
          icon: <RefreshCw size={15} color="var(--cms-accent)" />,
          action: () => setStatusModal({ trx })
        },
        {
          label: 'Download / Print PDF Nota',
          icon: <Download size={15} color="#10b981" />,
          action: () => setPrintingTrx(trx)
        },
        {
          label: 'Edit Transaksi',
          icon: <Edit3 size={15} />,
          action: () => { setFormData({ ...trx }); setIsNewTrx(false); }
        },
        {
          label: 'Salin ID Transaksi',
          icon: <Copy size={15} />,
          action: () => {
            navigator.clipboard?.writeText(trx.id);
            notify('ID Transaksi disalin ke clipboard');
          }
        },
        { separator: true },
        {
          label: 'Hapus Transaksi',
          icon: <Trash2 size={15} />,
          danger: true,
          action: () => {
            confirm('Hapus transaksi ini?', async () => {
              await saveTrx(transactions.filter(t => t.id !== trx.id));
              notify('Transaksi berhasil dihapus');

              // Sync deletion status to Google Sheets (marks as TERHAPUS in soft-red)
              const effectiveWebhook = globalConfig?.googleAppsScriptUrl;
              if (effectiveWebhook) {
                try {
                  fetch(effectiveWebhook, {
                    method: 'POST',
                    body: JSON.stringify({
                      action: 'sync_transactions',
                      sheetId: globalConfig?.googleSheetId,
                      payload: {
                        id: trx.id,
                        date: trx.date,
                        customerName: trx.customer?.name || 'Pelanggan',
                        customerContact: trx.customer?.phone || trx.customer?.email || '',
                        items: (trx.items || []).map(i => `${i.name} (${i.qty})`).join(', '),
                        subtotal: trx.subtotal || 0,
                        discount: trx.discount || 0,
                        grandTotal: trx.grandTotal || 0,
                        paymentStatus: 'BATAL / DIHAPUS',
                        remaining: 0,
                        isDeleted: true
                      }
                    }),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                  }).catch(() => {});
                } catch (e) {}
              }
            });
          }
        }
      ]
    };
  };

  // Search & Filter
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Global Config
  const [globalConfig, setGlobalConfig] = useState({});

  // Forms
  const [formData, setFormData] = useState(null);
  const [isNewTrx, setIsNewTrx] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Semua');
  const [showProductPicker, setShowProductPicker] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [saveAsContact, setSaveAsContact] = useState(true);

  // Custom Entities
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState(null);

  // Upload state
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const [isUploadingFooter, setIsUploadingFooter] = useState(false);
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);

  // Modals
  const [statusModal, setStatusModal] = useState(null);
  const [printingTrx, setPrintingTrx] = useState(null);

  const headerImgRef = useRef(null);
  const footerImgRef = useRef(null);

  // ── AUTO-OPEN CREATE TRANSACTION (GLOBAL SHORTCUT / SLASH COMMAND / SEARCH INTENT) ──
  useEffect(() => {
    const triggerNewTransaction = (itemData?: any) => {
      setActiveTab('transactions');
      const baseTrx = { ...EMPTY_TRX, id: genId('TRX') };
      if (itemData) {
        if (itemData.name || itemData.price) {
          baseTrx.items = [{
            productId: itemData.id || itemData.productId || '',
            name: itemData.name || 'Layanan / Produk',
            sku: itemData.productCode || itemData.sku || '',
            price: Number(itemData.price) || 0,
            qty: 1
          }];
        }
        if (itemData.customer) {
          const cust = typeof itemData.customer === 'string' ? { name: itemData.customer } : itemData.customer;
          baseTrx.customer = {
            id: cust.id || '',
            name: cust.name || '',
            phone: cust.phone || '',
            email: cust.email || '',
            address: cust.address || ''
          };
        }
        if (itemData.notes) {
          baseTrx.notes = itemData.notes;
        }
      }
      setFormData(baseTrx);
      setIsNewTrx(true);
      setShowNewCustomerForm(false);
    };

    const handleCustomItemTrigger = (e: any) => {
      triggerNewTransaction(e?.detail?.item);
    };

    if (typeof window !== 'undefined') {
      const autoItemRaw = sessionStorage.getItem('porto_auto_create_transaction_item');
      if (autoItemRaw) {
        sessionStorage.removeItem('porto_auto_create_transaction_item');
        try {
          const parsed = JSON.parse(autoItemRaw);
          setTimeout(() => triggerNewTransaction(parsed), 150);
        } catch (_) {}
      } else if (sessionStorage.getItem('porto_auto_create_transaction') === '1') {
        sessionStorage.removeItem('porto_auto_create_transaction');
        setTimeout(() => triggerNewTransaction(), 150);
      }
    }

    window.addEventListener('porto_create_transaction', () => triggerNewTransaction());
    window.addEventListener('porto_add_transaction', () => triggerNewTransaction());
    window.addEventListener('porto_create_transaction_with_item', handleCustomItemTrigger);

    return () => {
      window.removeEventListener('porto_create_transaction', () => triggerNewTransaction());
      window.removeEventListener('porto_add_transaction', () => triggerNewTransaction());
      window.removeEventListener('porto_create_transaction_with_item', handleCustomItemTrigger);
    };
  }, []);

  // Keyboard accessibility: Escape key dismisses modals or open forms
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (statusModal) {
          setStatusModal(null);
        } else if (printingTrx) {
          setPrintingTrx(null);
        } else if (formData) {
          setFormData(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [statusModal, printingTrx, formData]);

  useEffect(() => {
    let initialLoads = 0;
    const checkLoaded = () => {
      initialLoads++;
      if (initialLoads >= 7) setLoading(false);
    };

    const unsubTrx = storage.listenItem('porto_transactions', (data) => {
      setTransactions(data || []);
      checkLoaded();
    }, []);

    const unsubPrd = storage.listenItem('porto_catalog_products', (data) => {
      setProducts(data || []);
      checkLoaded();
    }, []);

    const unsubCus = storage.listenItem('porto_trx_customers', (data) => {
      setCustomers(data || []);
      checkLoaded();
    }, []);

    const unsubCli = storage.listenItem('porto_clients', (data) => {
      setWebClients(data || []);
      checkLoaded();
    }, []);

    const unsubDis = storage.listenItem('porto_trx_discounts', (data) => {
      setDiscounts(data || []);
      checkLoaded();
    }, []);

    const unsubSet = storage.listenItem('porto_invoice_settings', (data) => {
      setInvoiceSettings(data || {
        headerImage: '', footerImage: '', headerText: '', footerText: '',
        shopName: '', shopPhone: '', shopAddress: '', taxPercent: 11,
      });
      checkLoaded();
    }, {});

    const unsubGlobal = storage.listenItem('porto_settings', (data) => {
      setGlobalConfig(data || {});
      checkLoaded();
    }, {});

    const unsubBusiness = storage.listenItem('porto_business_profile', (bProfile: any) => {
      if (bProfile) {
        setInvoiceSettings((prev: any) => ({
          ...prev,
          shopName: prev?.shopName || bProfile.brandName,
          shopPhone: prev?.shopPhone || bProfile.whatsapp,
          shopAddress: prev?.shopAddress || bProfile.address,
          banks: (prev?.banks && prev.banks.length > 0) ? prev.banks : (bProfile.bankAccounts || []),
        }));
      }
    });

    return () => {
      if (unsubTrx) unsubTrx();
      if (unsubPrd) unsubPrd();
      if (unsubCus) unsubCus();
      if (unsubCli) unsubCli();
      if (unsubDis) unsubDis();
      if (unsubSet) unsubSet();
      if (unsubGlobal) unsubGlobal();
      if (unsubBusiness) unsubBusiness();
    };
  }, []);

  const saveTrx = useCallback(async (list) => {
    setTransactions(list);
    // storage.setItem sekarang auto-sync ke Firestore untuk semua scope
    await storage.setItem('porto_transactions', list);
  }, []);

  const syncToSheet = (action, list) => {
    const effectiveWebhook = globalConfig?.googleAppsScriptUrl;
    if (effectiveWebhook) {
      fetch(effectiveWebhook, {
        method: 'POST',
        body: JSON.stringify({ action, sheetId: globalConfig?.googleSheetId, payload: list }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      }).catch(() => {});
    }
  };

  const savePrd = useCallback(async (list) => {
    setProducts(list);
    await storage.setItem('porto_catalog_products', list);
    syncToSheet('sync_products', list);

  }, [invoiceSettings?.webhookUrl, globalConfig?.googleAppsScriptUrl]);

  const saveCustomers = useCallback(async (list) => {
    setCustomers(list);
    await storage.setItem('porto_trx_customers', list);
    syncToSheet('sync_customers', list);

  }, [invoiceSettings?.webhookUrl, globalConfig?.googleAppsScriptUrl]);

  const saveDiscounts = useCallback(async (list) => {
    setDiscounts(list);
    await storage.setItem('porto_trx_discounts', list);
    syncToSheet('sync_discounts', list);

  }, [invoiceSettings?.webhookUrl, globalConfig?.googleAppsScriptUrl]);

  const saveSettings = useCallback(async (obj) => {
    setInvoiceSettings(obj);
    await storage.setItem('porto_invoice_settings', obj);
    notify('✅ Pengaturan nota disimpan');
  }, [notify]);

  const filteredTrx = useMemo(() => transactions.filter(t => {
    const matchStatus = filterStatus === 'all' || t.paymentStatus === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || t.id?.toLowerCase().includes(q) || t.customer?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [transactions, filterStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: transactions.length,
    lunas: transactions.filter(t => t.paymentStatus === 'lunas').length,
    dp: transactions.filter(t => t.paymentStatus === 'dp').length,
    belum: transactions.filter(t => t.paymentStatus === 'belum').length,
    totalRevenue: transactions.filter(t => t.paymentStatus === 'lunas').reduce((s, t) => s + (calcTotals(t).grandTotal || 0), 0),
    totalPiutang: transactions.filter(t => t.paymentStatus !== 'lunas').reduce((s, t) => s + (calcTotals(t).remaining || 0), 0),
  }), [transactions]);

  /* ── Upload ── */
  const doUpload = async (e, setUploadState, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState(true);
    try {
      const res = await uploadToCloudinary(file);
      if (res && res.url) setter(res.url);
      else if (typeof res === 'string' && res.startsWith('http')) setter(res);
      else notify('Gagal upload gambar', 'error');
    } catch(err) {
      console.error('Upload error:', err);
      notify('Gagal upload gambar', 'error');
    }
    setUploadState(false);
    e.target.value = '';
  };

  /* ── Transaction Logic ── */
  const addItemRow = () => setFormData(prev => ({ ...prev, items: [...prev.items, { productId: '', name: '', sku: '', price: 0, qty: 1 }] }));
  const removeItemRow = (idx) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  // Atomic item update — single setState call
  const updateItem = useCallback((idx, updates) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], ...updates };
      return { ...prev, items };
    });
  }, []);

  // Pick product: single atomic update instead of 4 separate calls
  const pickProduct = useCallback((rowIdx, p) => {
    updateItem(rowIdx, { productId: p.id, name: p.name, sku: p.sku || '', price: p.price });
    setShowProductPicker(null);
    setProductSearch('');
  }, [updateItem]);

  const handleSaveTrx = async () => {
    if (!formData.customer.name.trim()) { notify('Nama pembeli wajib diisi', 'error'); return; }
    if (!formData.items || formData.items.length === 0 || !formData.items.some(i => i.name)) { notify('Minimal 1 item diperlukan', 'error'); return; }

    let finalCustomer = { ...formData.customer };

    if (finalCustomer.name.trim()) {
      if (!finalCustomer.id && saveAsContact) {
        const newId = genId('CUS');
        finalCustomer.id = newId;
        await saveCustomers([...customers, { ...finalCustomer }]);
      } else if (finalCustomer.id) {
        const existingIdx = customers.findIndex(c => c.id === finalCustomer.id);
        if (existingIdx !== -1) {
          const updatedList = [...customers];
          updatedList[existingIdx] = { ...finalCustomer };
          await saveCustomers(updatedList);
        }
      }
    }

    const { subtotal, discVal, grandTotal, remaining } = calcTotals({ ...formData, customer: finalCustomer });
    const finalTrx = {
      ...formData,
      customer: finalCustomer,
      id: formData.id || genId('TRX'),
      grandTotal,
      remaining: formData.paymentStatus === 'quotation' ? grandTotal : remaining,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      magicLink: formData.magicLink || genId('link'),
    };

    const isNew = !transactions.some(t => t.id === finalTrx.id);
    const newList = isNew ? [finalTrx, ...transactions] : transactions.map(t => t.id === finalTrx.id ? finalTrx : t);
    await saveTrx(newList);

    // Auto-decrease stock for new transactions
    if (isNew && finalTrx.items && finalTrx.items.length > 0) {
      let stockChanged = false;
      const updatedProducts = products.map(p => {
        const orderedItem = finalTrx.items.find(i => 
          i.productId === p.id || 
          (i.name && p.name && i.name.trim().toLowerCase() === p.name.trim().toLowerCase())
        );
        if (orderedItem && Number(orderedItem.qty) > 0) {
          stockChanged = true;
          return { ...p, stock: Math.max(0, (Number(p.stock) || 0) - (Number(orderedItem.qty) || 1)) };
        }
        return p;
      });
      if (stockChanged) {
        await savePrd(updatedProducts);
      }
    }

    const effectiveWebhook = globalConfig?.googleAppsScriptUrl;
    if (effectiveWebhook) {
      try {
        fetch(effectiveWebhook, {
          method: 'POST',
          body: JSON.stringify({
            action: 'sync_transactions',
            sheetId: globalConfig?.googleSheetId,
            payload: {
              id: finalTrx.id,
              date: finalTrx.date,
              customerName: finalTrx.customer.name,
              customerContact: finalTrx.customer.phone || finalTrx.customer.email || '',
              items: finalTrx.items.map(i => `${i.name} (${i.qty})`).join(', '),
              subtotal: subtotal,
              discount: discVal,
              grandTotal: finalTrx.grandTotal,
              paymentStatus: finalTrx.paymentStatus,
              remaining: finalTrx.remaining
            }
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        }).catch(e => console.error("Webhook error:", e));

      } catch (err) {}
    }

    notify(isNew ? '✅ Transaksi berhasil dibuat!' : '✅ Transaksi diperbarui!');
    // Push realtime notification to Firestore on new transaction
    if (isNew) {
      notifyTransaction(finalTrx.customer.name, finalTrx.grandTotal).catch(() => {});
    }
    setFormData(null);
    setShowNewCustomerForm(false);
  };

  const handleUpdateStatus = async (trxId, newStatus, dpAmount) => {
    const updated = transactions.map(t => {
      if (t.id !== trxId) return t;
      const next = { ...t, paymentStatus: newStatus, updatedAt: new Date().toISOString() };
      if (newStatus === 'dp') next.dpAmount = dpAmount || t.dpAmount || 0;
      if (newStatus === 'lunas') { next.dpAmount = next.grandTotal; next.remaining = 0; }
      if (newStatus === 'belum') { next.dpAmount = 0; next.remaining = next.grandTotal; }
      if (newStatus === 'dp') {
        const { remaining } = calcTotals(next);
        next.remaining = remaining;
      }
      return next;
    });
    await saveTrx(updated);
    setStatusModal(null);
    notify('✅ Status pembayaran diperbarui');
  };

  /* ═══════════════════════════════════════════════
     RENDER: Transactions Tab
  ═══════════════════════════════════════════════ */
  const renderTransactionsTab = () => {
    if (formData) return renderCreateForm();

    return (
      <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
        {/* Mobile Stats Toggle */}
        <button className="trx-mobile-stats-toggle" onClick={() => setShowMobileStats(!showMobileStats)}>
          {showMobileStats ? 'Sembunyikan Statistik' : 'Lihat Statistik'}
        </button>

        {/* Stats */}
        <div className={`trx-stats-grid ${!showMobileStats ? 'trx-stats-hidden-mobile' : ''}`}>
          {[
            { label: 'Total Transaksi', value: stats.total, icon: <FileText size={18} />, color: 'var(--cms-accent)' },
            { label: 'Lunas', value: stats.lunas, icon: <CheckCircle2 size={18} />, color: '#10b981' },
            { label: 'DP / Piutang', value: stats.dp, icon: <Clock size={18} />, color: '#f59e0b' },
            { label: 'Belum Bayar', value: stats.belum, icon: <AlertCircle size={18} />, color: '#ef4444' },
            { label: 'Total Pemasukan', value: formatRp(stats.totalRevenue), icon: <CreditCard size={18} />, color: '#10b981' },
            { label: 'Total Piutang', value: formatRp(stats.totalPiutang), icon: <Wallet size={18} />, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, backdropFilter: 'blur(16px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ color: s.color, opacity: 0.6 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: typeof s.value === 'string' ? 14 : 22, fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="trx-search-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama pembeli atau ID transaksi..."
              className="cms-input" style={{ paddingLeft: 38, height: 40, width: '100%', borderRadius: 100 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--cms-switcher-bg)', borderRadius: 9999, padding: 3 }}>
            {[{ id: 'all', label: 'Semua' }, { id: 'lunas', label: 'Lunas' }, { id: 'dp', label: 'DP' }, { id: 'belum', label: 'Belum' }].map(f => (
              <button
                key={f.id} onClick={() => setFilterStatus(f.id)}
                style={{
                  padding: '0 14px', height: 34, borderRadius: 9999, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                  background: filterStatus === f.id ? 'var(--cms-accent)' : 'transparent',
                  color: filterStatus === f.id ? '#fff' : 'var(--cms-text-muted)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setFormData({ ...EMPTY_TRX, id: genId('TRX') });
              setIsNewTrx(true);
              setShowNewCustomerForm(false);
            }}
            className="cms-btn cms-btn-primary"
            style={{ borderRadius: 9999, padding: '0 18px', height: 40, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 13 }}
            title="Tambah Transaksi"
          >
            <Plus size={15} /> <span className="trx-btn-text">Tambah</span>
          </button>
        </div>

        {filteredTrx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--cms-panel-bg)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
            <Receipt size={48} style={{ opacity: 0.12, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>Tidak ada transaksi</h3>
            <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 13 }}>Buat transaksi baru untuk memulai.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="trx-table-wrap" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)' }}>
                      {['ID Transaksi', 'Tanggal', 'Pembeli', 'Total', 'Status', 'Sisa Tagihan', 'Aksi'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrx.map((trx, i) => {
                      const { grandTotal, remaining } = calcTotals(trx);
                      return (
                        <tr 
                          key={trx.id} 
                          className="trx-row" 
                          {...bindContextMenu(() => getTransactionMenu(trx))}
                          style={{ borderBottom: i < filteredTrx.length - 1 ? '1px solid var(--glass-border)' : 'none', transition: 'background 0.15s', cursor: 'context-menu' }}
                        >
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--cms-accent)', background: 'var(--cms-accent-soft)', display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>{trx.id}</div>
                              {trx.uniqueCode > 0 && (
                                <span title={`Kode unik transfer: +Rp ${trx.uniqueCode}`} style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                  +{trx.uniqueCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--cms-text-muted)' }}>{formatDate(trx.date)}</td>
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{trx.customer?.name || '-'}</div>
                              {(trx.customer?.phone || trx.customer?.email || trx.customer?.address) && (
                                <div title={`Phone: ${trx.customer?.phone || '-'}\nEmail: ${trx.customer?.email || '-'}\nAlamat: ${trx.customer?.address || '-'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)', cursor: 'help' }}>
                                  <Info size={14} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '13px 14px', fontWeight: 800, fontSize: 13 }}>{formatRp(grandTotal)}</td>
                          <td style={{ padding: '13px 14px' }}><StatusBadge status={trx.paymentStatus} /></td>
                          <td style={{ padding: '13px 14px', fontSize: 13 }}>
                            {trx.paymentStatus === 'lunas' ? <span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>—</span> : <span style={{ color: '#ef4444', fontWeight: 700 }}>{formatRp(remaining)}</span>}
                          </td>
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              {trx.customer?.phone && (
                                <button
                                  title="Hubungi / Konfirmasi via WhatsApp"
                                  onClick={() => {
                                    let clean = (trx.customer.phone || '').replace(/[^0-9]/g, '');
                                    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                                    const msg = encodeURIComponent(`Halo Kak ${trx.customer.name},\nKami dari tim terkait pesanan #${trx.id}.\n${trx.paymentStatus === 'lunas' ? '✅ Status pembayaran Anda SUDAH LUNAS. Akses / link produk Anda sudah aktif!' : `Total tagihan: ${formatRp(grandTotal)} (termasuk kode unik +${trx.uniqueCode || 0}). Mohon konfirmasi bukti transfer jika sudah transfer.`}`);
                                    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
                                  }}
                                  style={{ ...S.iconBtn('#22c55e', 'rgba(34,197,94,0.12)') }}
                                >
                                  <MessageCircle size={13} />
                                </button>
                              )}
                              <button title="Ubah Status" onClick={() => setStatusModal({ trx })} style={{ ...S.iconBtn('var(--cms-accent)', 'var(--cms-accent-soft)') }}><RefreshCw size={13} /></button>
                              <button title="Edit" onClick={() => { setFormData({ ...trx }); setIsNewTrx(false); }} style={{ ...S.iconBtn() }}><Edit3 size={13} /></button>
                              <button title="Download PDF" onClick={() => setPrintingTrx(trx)} style={{ ...S.iconBtn('#10b981', 'rgba(16,185,129,0.12)') }}><Download size={13} /></button>
                              <button title="Hapus" onClick={() => { confirm('Hapus transaksi permanen?', async () => { await saveTrx(transactions.filter(t => t.id !== trx.id)); notify('Transaksi dihapus'); }); }} style={{ ...S.iconBtn('#ef4444', 'rgba(239,68,68,0.1)') }}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List */}
            <div className="trx-card-list">
              {filteredTrx.map((trx) => {
                const { grandTotal, remaining } = calcTotals(trx);

                const cfg = STATUS_CONFIG[trx.paymentStatus];
                return (
                  <div 
                    key={trx.id} 
                    className="trx-card" 
                    {...bindContextMenu(() => getTransactionMenu(trx))}
                    style={{
                      background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)',
                      borderRadius: 16, padding: '16px', backdropFilter: 'blur(16px)',
                    }}
                  >
                    {/* Card top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: 'var(--cms-accent)', background: 'var(--cms-accent-soft)', display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>{trx.id}</div>
                          {trx.uniqueCode > 0 && (
                            <span title={`Kode unik transfer: +Rp ${trx.uniqueCode}`} style={{ fontSize: 9.5, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                              +{trx.uniqueCode}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{trx.customer?.name || '-'}</div>
                          {(trx.customer?.phone || trx.customer?.email || trx.customer?.address) && (
                            <div title={`Phone: ${trx.customer?.phone || '-'}\nEmail: ${trx.customer?.email || '-'}\nAlamat: ${trx.customer?.address || '-'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)', cursor: 'help' }}>
                              <Info size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={trx.paymentStatus} />
                    </div>
                    {/* Card middle: amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--cms-text)' }}>{formatRp(grandTotal)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tanggal</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(trx.date)}</div>
                      </div>
                      {trx.paymentStatus !== 'lunas' && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Sisa</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>{formatRp(remaining)}</div>
                        </div>
                      )}
                    </div>
                    {/* Card actions (Icon-only minimalist toolbar) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingTop: 4 }}>
                      {trx.customer?.phone && (
                        <button
                          type="button"
                          title="Chat WhatsApp"
                          aria-label="WhatsApp"
                          onClick={() => {
                            let clean = (trx.customer.phone || '').replace(/[^0-9]/g, '');
                            if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                            const msg = encodeURIComponent(`Halo Kak ${trx.customer.name},\nKami dari tim terkait pesanan #${trx.id}.\n${trx.paymentStatus === 'lunas' ? '✅ Status pembayaran Anda SUDAH LUNAS. Akses / link produk Anda sudah aktif!' : `Total tagihan: ${formatRp(grandTotal)} (termasuk kode unik +${trx.uniqueCode || 0}). Mohon konfirmasi bukti transfer jika sudah transfer.`}`);
                            window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
                          }}
                          style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'none', borderRadius: 10, cursor: 'pointer', flexShrink: 0 }}
                        >
                          <MessageCircle size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Ubah Status Pembayaran"
                        aria-label="Status"
                        onClick={() => setStatusModal({ trx })}
                        style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', borderRadius: 10, cursor: 'pointer', flexShrink: 0 }}
                      >
                        <RefreshCw size={15} />
                      </button>
                      <button
                        type="button"
                        title="Edit Transaksi"
                        aria-label="Edit"
                        onClick={() => { setFormData({ ...trx }); setIsNewTrx(false); }}
                        style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', border: '1px solid var(--glass-border)', borderRadius: 10, cursor: 'pointer', flexShrink: 0 }}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        title="Unduh / Cetak Invoice PDF"
                        aria-label="PDF"
                        onClick={() => setPrintingTrx(trx)}
                        style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'none', borderRadius: 10, cursor: 'pointer', flexShrink: 0 }}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        type="button"
                        title="Hapus Transaksi"
                        aria-label="Hapus"
                        onClick={() => { confirm('Hapus transaksi?', async () => { await saveTrx(transactions.filter(t => t.id !== trx.id)); notify('Transaksi dihapus'); }); }}
                        style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 10, cursor: 'pointer', flexShrink: 0 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ── CREATE FORM ── */
  const renderCreateForm = () => {
    const { subtotal, discVal, taxVal, grandTotal, remaining } = calcTotals(formData);
    const filteredProducts = products.filter(p =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
      <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
        {/* Form header */}
        <div className="trx-form-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{isNewTrx ? 'Transaksi Baru' : 'Edit Transaksi'}</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{isNewTrx ? 'Buat Transaksi Baru' : formData.id}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setFormData(null)} className="cms-btn cms-btn-outline trx-btn-back" style={{ borderRadius: 9999, padding: '0 18px', height: 40, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={14} /> <span className="trx-btn-label">Kembali</span></button>
            <button onClick={handleSaveTrx} className="cms-btn cms-btn-primary" style={{ borderRadius: 9999, padding: '0 20px', height: 40, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Save size={14} /> Simpan</button>
          </div>
        </div>

        <div className="trx-form-grid">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Customer */}
            <div style={{ ...S.panelLg, overflow: 'visible', position: 'relative', zIndex: 20 }}>
              <h3 style={{ ...S.sectionTitle }}><User size={14} color="var(--cms-accent)" /> Data Pembeli</h3>
              <label style={{ ...S.label }}>Pilih Pembeli / Kontak</label>
              <CustomSelect
                value={formData.customer.id ? formData.customer.id : (showNewCustomerForm ? 'NEW' : '')}
                onChange={val => {
                  if (val === 'NEW') {
                    setShowNewCustomerForm(true);
                    setFormData(prev => ({ ...prev, customer: { ...EMPTY_CUSTOMER } }));
                  } else if (val) {
                    setShowNewCustomerForm(false);
                    const c = combinedCustomers.find(x => x.id === val);
                    if (c) setFormData(prev => ({ ...prev, customer: { ...c } }));
                  } else {
                    setShowNewCustomerForm(false);
                    setFormData(prev => ({ ...prev, customer: { ...EMPTY_CUSTOMER } }));
                  }
                }}
                placeholder="-- Pilih Pembeli / Klien --"
                options={[
                  { value: 'NEW', label: '+ Tambah Pembeli Baru' },
                  ...combinedCustomers.map(c => ({ 
                    value: c.id, 
                    label: `${c.name}${c.isWebClient ? ' 🌐 (Klien Web)' : ''}${c.phone ? ` · ${c.phone}` : ''}` 
                  }))
                ]}
              />

              {(formData.customer.id || showNewCustomerForm) && (
                <div style={{ background: 'var(--cms-switcher-bg)', borderRadius: 14, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ ...S.label }}>Nama Pembeli *</label>
                    <input value={formData.customer.name} onChange={e => setFormData(p => ({ ...p, customer: { ...p.customer, name: e.target.value } }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                  </div>
                  <div>
                    <label style={{ ...S.label }}>WhatsApp / Telepon</label>
                    <input value={formData.customer.phone} onChange={e => setFormData(p => ({ ...p, customer: { ...p.customer, phone: e.target.value } }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                  </div>
                  <div>
                    <label style={{ ...S.label }}>Email</label>
                    <input value={formData.customer.email} onChange={e => setFormData(p => ({ ...p, customer: { ...p.customer, email: e.target.value } }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ ...S.label }}>Alamat</label>
                    <textarea value={formData.customer.address} onChange={e => setFormData(p => ({ ...p, customer: { ...p.customer, address: e.target.value } }))} className="cms-input" style={{ width: '100%', borderRadius: 14, minHeight: 56, resize: 'vertical' }} />
                  </div>
                  <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input type="checkbox" className="trx-toggle" checked={saveAsContact} onChange={e => setSaveAsContact(e.target.checked)} id="saveContactCheckbox" />
                    <label htmlFor="saveContactCheckbox" style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--cms-text)' }}>Simpan ke Kontak Pembeli (Buku Telepon)</label>
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div style={{ ...S.panelLg, position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ ...S.sectionTitle, margin: 0 }}><ShoppingCart size={14} color="var(--cms-accent)" /> Daftar Item</h3>
                <button onClick={addItemRow} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', borderRadius: 9999, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}><Plus size={13} /> Tambah</button>
              </div>
              {!formData.items || formData.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px', border: '1px dashed var(--glass-border)', borderRadius: 12, color: 'var(--cms-text-muted)', fontSize: 13 }}>Silakan tambah item pesanan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Desktop item header */}
                  <div className="trx-item-header" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 34px', gap: 6, padding: '0 2px' }}>
                    {['Produk', 'Qty', 'Harga', 'Subtotal', ''].map((h, i) => (
                      <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i > 1 ? 'right' : 'left', paddingRight: i === 3 ? 8 : 0 }}>{h}</div>
                    ))}
                  </div>
                  {(formData.items || []).map((item, idx) => (
                    <div key={idx}>
                      {/* Desktop item row */}
                      <div className="trx-item-row-desktop" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 34px', gap: 6, alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            value={item.name}
                            onChange={e => { updateItem(idx, { name: e.target.value }); setProductSearch(e.target.value); setShowProductPicker(idx); }}
                            onFocus={() => setShowProductPicker(idx)}
                            onBlur={() => setTimeout(() => setShowProductPicker(null), 200)}
                            placeholder="Pilih produk..." className="cms-input" style={{ width: '100%', fontSize: 13, borderRadius: 9999 }}
                          />
                          {showProductPicker === idx && filteredProducts.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, maxHeight: 160, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', backdropFilter: 'blur(20px)' }}>
                              {filteredProducts.map(p => {
                                const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                                return (
                                  <button key={p.id} type="button" onMouseDown={() => pickProduct(idx, p)} style={{ width: '100%', padding: '9px 14px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                      <span style={{ color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {p.name}
                                        {(p.type === 'Add-on' || p.isAddon) && (
                                          <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                                            ⚡ Add-on
                                          </span>
                                        )}
                                      </span>
                                      <span style={{ 
                                        fontSize: 10, 
                                        fontWeight: 700, 
                                        padding: '2px 8px', 
                                        borderRadius: 6, 
                                        background: isOutOfStock ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', 
                                        color: isOutOfStock ? '#ef4444' : '#10b981' 
                                      }}>
                                        {p.stock !== undefined ? `Stok: ${p.stock}` : 'Stok: ∞'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                                      {formatRp(p.price)}{p.sku ? ` · SKU: ${p.sku}` : ''}{p.category ? ` · ${p.category}` : ''}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, { qty: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })} className="cms-input" style={{ textAlign: 'center', fontSize: 13, borderRadius: 9999 }} />
                        <input type="text" value={formatNumber(item.price)} onChange={e => updateItem(idx, { price: parseNumber(e.target.value) })} className="cms-input" style={{ textAlign: 'right', fontSize: 13, borderRadius: 9999 }} />
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--cms-accent)', textAlign: 'right', paddingRight: 6 }}>{formatRp(item.qty * item.price)}</div>
                        <button onClick={() => removeItemRow(idx)} style={{ ...S.iconBtn('#ef4444', 'rgba(239,68,68,0.1)') }}><X size={13} /></button>
                      </div>
                      {/* Mobile item card */}
                      <div className="trx-item-row-mobile" style={{ background: 'var(--cms-switcher-bg)', borderRadius: 16, padding: 12 }}>
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                          <input
                            value={item.name}
                            onChange={e => { updateItem(idx, { name: e.target.value }); setProductSearch(e.target.value); setShowProductPicker(idx); }}
                            onFocus={() => setShowProductPicker(idx)}
                            onBlur={() => setTimeout(() => setShowProductPicker(null), 200)}
                            placeholder="Cari / ketik nama produk..." className="cms-input" style={{ width: '100%', fontSize: 14, borderRadius: 9999 }}
                          />
                          {showProductPicker === idx && filteredProducts.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, maxHeight: 200, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', backdropFilter: 'blur(20px)' }}>
                              {filteredProducts.map(p => {
                                const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                                return (
                                  <button key={p.id} type="button" onMouseDown={() => pickProduct(idx, p)} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                      <span style={{ color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {p.name}
                                        {(p.type === 'Add-on' || p.isAddon) && (
                                          <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                                            ⚡ Add-on
                                          </span>
                                        )}
                                      </span>
                                      <span style={{ 
                                        fontSize: 10, 
                                        fontWeight: 700, 
                                        padding: '2px 8px', 
                                        borderRadius: 6, 
                                        background: isOutOfStock ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', 
                                        color: isOutOfStock ? '#ef4444' : '#10b981' 
                                      }}>
                                        {p.stock !== undefined ? `Stok: ${p.stock}` : 'Stok: ∞'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 3 }}>
                                      {formatRp(p.price)}{p.sku ? ` · SKU: ${p.sku}` : ''}{p.category ? ` · ${p.category}` : ''}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Qty</div>
                            <input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, { qty: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })} className="cms-input" style={{ width: '100%', textAlign: 'center', fontSize: 14, borderRadius: 9999 }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Harga Satuan</div>
                            <input type="text" value={formatNumber(item.price)} onChange={e => updateItem(idx, { price: parseNumber(e.target.value) })} className="cms-input" style={{ width: '100%', textAlign: 'right', fontSize: 14, borderRadius: 9999 }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--cms-accent)' }}>{formatRp(item.qty * item.price)}</div>
                          <button
                            type="button"
                            title="Hapus Item"
                            aria-label="Hapus Item"
                            onClick={() => removeItemRow(idx)}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ ...S.panel }}>
              <h3 style={{ ...S.sectionTitle }}><FileText size={14} color="var(--cms-accent)" /> Catatan Pesanan</h3>
              <textarea
                value={formData.notes || ''}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Catatan tambahan untuk pembeli (opsional)..."
                className="cms-input"
                style={{ width: '100%', borderRadius: 14, minHeight: 80, resize: 'vertical', fontSize: 13 }}
              />
            </div>

            {/* MOU / Kontrak */}
            <div style={{ ...S.panel }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ ...S.sectionTitle, margin: 0 }}><FileText size={14} color="var(--cms-accent)" /> Surat Kontrak / SPK</h3>
                <input type="checkbox" className="trx-toggle" checked={formData.mou?.enabled} onChange={e => setFormData(p => ({ ...p, mou: { ...p.mou, enabled: e.target.checked } }))} title="Aktifkan Kontrak" />
              </div>
              {formData.mou?.enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'cmsFadeIn 0.3s ease' }}>
                  <input value={formData.mou.title} onChange={e => setFormData(p => ({ ...p, mou: { ...p.mou, title: e.target.value } }))} placeholder="Judul (Misal: Surat Perjanjian Kerja Sama)" className="cms-input" style={{ width: '100%', borderRadius: 100, fontSize: 13 }} />
                  <input type="date" value={formData.mou.date} onChange={e => setFormData(p => ({ ...p, mou: { ...p.mou, date: e.target.value } }))} className="cms-input" style={{ width: '100%', borderRadius: 100, fontSize: 13 }} />
                  <textarea
                    value={formData.mou.content || ''}
                    onChange={e => setFormData(p => ({ ...p, mou: { ...p.mou, content: e.target.value } }))}
                    placeholder="Tuliskan isi perjanjian, scope of work, timeline, atau hak & kewajiban di sini..."
                    className="cms-input"
                    style={{ width: '100%', borderRadius: 14, minHeight: 120, resize: 'vertical', fontSize: 13 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>*Kontrak otomatis masuk ke halaman terakhir dari PDF Nota.</div>
                </div>
              )}
            </div>

            {/* Lampiran / Attachment */}
            <div style={{ ...S.panel }}>
              <h3 style={{ ...S.sectionTitle }}><Upload size={14} color="var(--cms-accent)" /> Link Lampiran Eksternal</h3>
              <input value={formData.attachment || ''} onChange={e => setFormData(p => ({ ...p, attachment: e.target.value }))} placeholder="Contoh: https://drive.google.com/..." className="cms-input" style={{ width: '100%', borderRadius: 100, fontSize: 13 }} />
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 6 }}>*Link Google Drive, Figma, atau dokumen external klien.</div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Date */}
            <div style={{ ...S.panel }}>
              <h3 style={{ ...S.sectionTitle }}><Clock size={14} color="var(--cms-accent)" /> Tanggal Transaksi</h3>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                className="cms-input"
                style={{ width: '100%', borderRadius: 9999, fontSize: 13 }}
              />
            </div>

            {/* Promo */}
            <div style={{ ...S.panel, overflow: 'visible', position: 'relative', zIndex: 20 }}>
              <h3 style={{ ...S.sectionTitle }}><BadgePercent size={14} color="var(--cms-accent)" /> Diskon / Promo</h3>
              <CustomSelect
                value={formData.discount?.id || ''}
                onChange={val => {
                  const d = discounts.find(x => x.id === val);
                  if (d) setFormData(p => ({ ...p, discount: { id: d.id, type: d.type, value: d.value, label: d.label } }));
                  else setFormData(p => ({ ...p, discount: { type: 'percent', value: 0, label: '' } }));
                }}
                placeholder="-- Pilih Promo --"
                options={discounts.map(d => ({ value: d.id, label: `${d.label} (${d.type === 'percent' ? `${d.value}%` : formatRp(d.value)})` }))}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={formData.discount?.label || ''} onChange={e => setFormData(p => ({ ...p, discount: { ...(p.discount || { type: 'nominal', value: 0 }), label: e.target.value } }))} placeholder="Nama promo" className="cms-input" style={{ flex: 1, borderRadius: 9999, fontSize: 12 }} />
                <input type="text" value={formatNumber(formData.discount?.value || 0)} onChange={e => setFormData(p => ({ ...p, discount: { ...(p.discount || { type: 'nominal', label: '' }), value: parseNumber(e.target.value) } }))} className="cms-input" style={{ width: 72, borderRadius: 9999, fontSize: 12, textAlign: 'center' }} />
                <button onClick={() => setFormData(p => ({ ...p, discount: { ...(p.discount || { value: 0, label: '' }), type: (p.discount?.type || 'percent') === 'percent' ? 'nominal' : 'percent' } }))} style={{ width: 36, height: 36, borderRadius: 9999, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                  {(formData.discount?.type || 'percent') === 'percent' ? '%' : 'Rp'}
                </button>
              </div>
            </div>

            {/* Shipping & Tax */}
            <div style={{ ...S.panel, position: 'relative', zIndex: 10 }}>
              <h3 style={{ ...S.sectionTitle }}><Truck size={14} color="var(--cms-accent)" /> Pengiriman & Pajak</h3>
              <label style={{ ...S.label }}>Ongkos Kirim (Rp)</label>
              <input type="text" value={formatNumber(formData.shipping)} onChange={e => setFormData(p => ({ ...p, shipping: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', borderRadius: 9999, fontSize: 13, marginBottom: 12 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Landmark size={13} color="var(--cms-accent)" /> PPN</label>
                <input type="checkbox" className="trx-toggle" checked={formData.tax?.enabled || false} onChange={e => setFormData(p => ({ ...p, tax: { ...(p.tax || { percent: 0 }), enabled: e.target.checked } }))} />
              </div>
              {formData.tax?.enabled && (
                <input type="text" value={formatNumber(formData.tax?.percent || 0)} onChange={e => setFormData(p => ({ ...p, tax: { ...(p.tax || { enabled: true }), percent: parseNumber(e.target.value) } }))} className="cms-input" style={{ width: '100%', borderRadius: 9999, fontSize: 13, marginTop: 6 }} placeholder="Persen PPN" />
              )}
            </div>

            {/* Payment Status */}
            <div style={{ ...S.panel, position: 'relative', zIndex: 5 }}>
              <h3 style={{ ...S.sectionTitle }}><CreditCard size={14} color="var(--cms-accent)" /> Status Pembayaran</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.keys(STATUS_CONFIG).map(k => (
                  <button key={k} onClick={() => setFormData(p => ({ ...p, paymentStatus: k }))} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9999,
                    border: `1.5px solid ${formData.paymentStatus === k ? STATUS_CONFIG[k].color : 'var(--glass-border)'}`,
                    background: formData.paymentStatus === k ? STATUS_CONFIG[k].bg : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}>
                    <span style={{ color: STATUS_CONFIG[k].color }}>{STATUS_CONFIG[k].icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: formData.paymentStatus === k ? STATUS_CONFIG[k].color : 'var(--cms-text)' }}>{STATUS_CONFIG[k].label}</span>
                  </button>
                ))}
              </div>
              {formData.paymentStatus === 'dp' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ ...S.label, margin: 0 }}>Daftar Termin / Cicilan</label>
                    <button onClick={() => setFormData(p => ({ ...p, termin: [...(p.termin||[]), { id: genId('TRM'), name: `Termin ${(p.termin?.length||0)+1}`, amount: 0, isPaid: false }] }))} style={{ fontSize: 11, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', padding: '4px 8px', borderRadius: 100, cursor: 'pointer', fontWeight: 700 }}>+ Tambah</button>
                  </div>
                  {(!formData.termin || formData.termin.length === 0) ? (
                    <div>
                      <label style={{ ...S.label, fontSize: 10 }}>Nominal DP (Classic)</label>
                      <input type="text" value={formatNumber(formData.dpAmount)} onChange={e => setFormData(p => ({ ...p, dpAmount: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', borderRadius: 9999, fontWeight: 700 }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {formData.termin.map((t, idx) => (
                        <div key={t.id} style={{ display: 'flex', gap: 6, alignItems: 'center', background: t.isPaid ? 'rgba(16,185,129,0.05)' : 'transparent', padding: 4, borderRadius: 100, border: t.isPaid ? '1px solid rgba(16,185,129,0.2)' : 'none' }}>
                          <input type="checkbox" checked={t.isPaid} onChange={e => {
                            const newTermin = [...formData.termin];
                            newTermin[idx].isPaid = e.target.checked;
                            setFormData(p => ({ ...p, termin: newTermin }));
                          }} style={{ width: 16, height: 16, marginLeft: 6, cursor: 'pointer' }} title="Sudah Dibayar?" />
                          <input value={t.name} onChange={e => {
                            const newTermin = [...formData.termin];
                            newTermin[idx].name = e.target.value;
                            setFormData(p => ({ ...p, termin: newTermin }));
                          }} className="cms-input" style={{ flex: 1, borderRadius: 100, fontSize: 12, padding: '0 10px', height: 32 }} placeholder="Nama Termin" />
                          <input type="text" value={formatNumber(t.amount)} onChange={e => {
                            const newTermin = [...formData.termin];
                            newTermin[idx].amount = parseNumber(e.target.value);
                            setFormData(p => ({ ...p, termin: newTermin }));
                          }} className="cms-input" style={{ width: 90, borderRadius: 100, fontSize: 12, padding: '0 10px', textAlign: 'right', height: 32 }} />
                          <button onClick={() => {
                            const newTermin = formData.termin.filter((_, i) => i !== idx);
                            setFormData(p => ({ ...p, termin: newTermin }));
                          }} style={{ ...S.iconBtn('#ef4444', 'transparent'), width: 24, height: 24, marginRight: 2 }}><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--cms-accent)', borderRadius: 16, padding: '16px 18px', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Ringkasan Tagihan</div>
              {[
                { label: 'Subtotal', val: subtotal },
                discVal > 0 ? { label: 'Diskon', val: -discVal } : null,
                formData.shipping > 0 ? { label: 'Ongkir', val: formData.shipping } : null,
                taxVal > 0 ? { label: `PPN ${formData.tax?.percent || 0}%`, val: taxVal } : null,
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, opacity: 0.85 }}>
                  <span>{row.label}</span>
                  <span>{row.val < 0 ? `- ${formatRp(-row.val)}` : formatRp(row.val)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.25)', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.9 }}>GRAND TOTAL</span>
                <span style={{ fontSize: 20, fontWeight: 900 }}>{formatRp(grandTotal)}</span>
              </div>
              {formData.paymentStatus === 'dp' && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Dibayar</span>
                    <span style={{ fontWeight: 700 }}>{formatRp(calcTotals(formData).paid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span>Sisa Tagihan</span>
                    <span style={{ fontWeight: 800 }}>{formatRp(remaining)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     IMPORT DARI GOOGLE SHEETS
  ═══════════════════════════════════════════════ */
  const handleImportFromSheet = async (action, saveFunc) => {
    const effectiveWebhook = globalConfig?.googleAppsScriptUrl;
    if (!effectiveWebhook) return notify('Webhook URL Google Script belum diatur di Pengaturan Global!', 'error');
    notify('Mengimpor data dari Excel...');
    try {
      const res = await fetch(effectiveWebhook, {
        method: 'POST',
        body: JSON.stringify({ action, sheetId: globalConfig?.googleSheetId }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        const validData = data.data.filter(d => d.id || d.name);
        if (validData.length > 0) {
          const cleanedData = validData.map(item => {
             const cleanItem = { ...item };
             if (cleanItem.price) cleanItem.price = Number(cleanItem.price) || 0;
             if (cleanItem.value) cleanItem.value = Number(cleanItem.value) || 0;
             if (!cleanItem.id) cleanItem.id = genId('IMP');
             return cleanItem;
          });
          saveFunc(cleanedData);
          notify(`Berhasil mengimpor ${cleanedData.length} data!`);
        } else {
          notify('Data di Excel kosong / tidak ditemukan', 'error');
        }
      } else {
        notify('Gagal impor dari Excel: ' + (data.message || 'Error'), 'error');
      }
    } catch(err) {
      console.error(err);
      notify('Gagal impor data: ' + err.message, 'error');
    }
  };

  /* ═══════════════════════════════════════════════
     RENDER: Products Tab
  ═══════════════════════════════════════════════ */
  const renderProductsTab = () => {
    const categories = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
    const filteredPrd = products.filter(p => {
      const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCategoryFilter === 'Semua' || p.category === productCategoryFilter;
      return matchSearch && matchCat;
    });

    return (
      <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
        <div className="trx-pg-header">
          <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Katalog Produk</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleImportFromSheet('get_products', savePrd)} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><DownloadCloud size={14} /> <span>Impor</span></button>
            <button onClick={() => setEditingProduct({ ...EMPTY_PRODUCT })} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> <span>Tambah</span></button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Cari produk (nama / SKU)..." className="cms-input" style={{ flex: 1, borderRadius: 100, paddingLeft: 42, width: '100%', height: 44 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--cms-switcher-bg)', padding: 4, borderRadius: 100, overflowX: 'auto' }}>
            {categories.map(c => (
              <button
                key={c} onClick={() => setProductCategoryFilter(c)}
                style={{
                  padding: '0 16px', height: 36, borderRadius: 100, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  background: productCategoryFilter === c ? 'var(--cms-accent)' : 'transparent',
                  color: productCategoryFilter === c ? '#fff' : 'var(--cms-text-muted)',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="trx-table-wrap" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>PRODUK</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>KATEGORI / TAG</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>HARGA</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>STOK</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrd.map((p, i) => (
                  <tr key={p.id} className="trx-row" style={{ borderBottom: i < filteredPrd.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.gallery?.[0] || p.image ? (
                          <img src={p.gallery?.[0] || p.image} alt={p.name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--cms-switcher-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={18} style={{ opacity: 0.3 }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                          {p.sku && <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {p.category ? (
                        <span style={{ background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>{p.category}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800, color: 'var(--cms-accent)' }}>{formatRp(p.price)}</td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: p.stock > 0 ? 'var(--cms-text)' : '#ef4444' }}>{p.stock > 0 ? formatNumber(p.stock) : 'Habis'}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => setEditingProduct({ ...p })} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', marginRight: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={14} /></button>
                      <button onClick={() => { confirm('Hapus produk?', async () => { await savePrd(products.filter(x => x.id !== p.id)); notify('Terhapus'); }); }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {filteredPrd.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--cms-text-muted)' }}>Tidak ada produk ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="trx-card-list">
          {filteredPrd.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', background: 'var(--cms-panel-bg)', borderRadius: 20, border: '1px dashed var(--glass-border)', color: 'var(--cms-text-muted)' }}>Tidak ada produk ditemukan.</div>
          ) : filteredPrd.map(p => (
            <div key={p.id} style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', backdropFilter: 'blur(16px)' }}>
              {p.gallery?.[0] || p.image ? (
                <img src={p.gallery?.[0] || p.image} alt={p.name} style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--cms-switcher-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={22} style={{ opacity: 0.3 }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                {p.sku && <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--cms-accent)' }}>{formatRp(p.price)}</span>
                  {p.category && <span style={{ background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>{p.category}</span>}
                  <span style={{ color: p.stock > 0 ? 'var(--cms-text-muted)' : '#ef4444', fontSize: 12, fontWeight: 600 }}>Stok: {p.stock > 0 ? formatNumber(p.stock) : 'Habis'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => setEditingProduct({ ...p })} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={14} /></button>
                <button onClick={() => { confirm('Hapus produk?', async () => { await savePrd(products.filter(x => x.id !== p.id)); notify('Terhapus'); }); }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     RENDER: Discounts Tab
  ═══════════════════════════════════════════════ */
  const renderDiscountsTab = () => {
    return (
      <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
        <div className="trx-pg-header">
          <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Daftar Promo &amp; Diskon</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleImportFromSheet('get_discounts', saveDiscounts)} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><DownloadCloud size={14} /> <span>Impor</span></button>
            <button onClick={() => setEditingDiscount({ ...EMPTY_DISCOUNT })} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> <span>Tambah</span></button>
          </div>
        </div>
        {discounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--cms-panel-bg)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
            <BadgePercent size={48} style={{ opacity: 0.12, display: 'block', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>Belum ada promo</h3>
            <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 13 }}>Tambah template diskon untuk dipakai saat transaksi.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {discounts.map(d => (
              <div key={d.id} style={{ background: 'var(--cms-panel-bg)', border: '1px dashed var(--cms-accent)', borderRadius: 24, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {d.type === 'percent' ? <Percent size={16} /> : <DollarSign size={16} />}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cms-accent)' }}>{d.label}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>Potongan: {d.type === 'percent' ? `${d.value}%` : formatRp(d.value)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditingDiscount({ ...d })} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={14} /></button>
                  <button onClick={() => { confirm('Hapus promo?', async () => { await saveDiscounts(discounts.filter(x => x.id !== d.id)); notify('Terhapus'); }); }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     RENDER: Customers Tab
  ═══════════════════════════════════════════════ */
  const renderCustomersTab = () => {
    return (
      <div style={{ animation: 'cmsFadeIn 0.3s ease' }}>
        <div className="trx-pg-header">
          <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Buku Kontak Pelanggan</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleImportFromSheet('get_customers', saveCustomers)} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><DownloadCloud size={14} /> <span>Impor</span></button>
            <button onClick={() => setEditingCustomer({ ...EMPTY_CUSTOMER })} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> <span>Tambah</span></button>
          </div>
        </div>
        {customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--cms-panel-bg)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
            <Users size={48} style={{ opacity: 0.12, display: 'block', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>Belum ada kontak</h3>
            <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 13 }}>Kontak otomatis tersimpan saat Anda membuat transaksi baru.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="trx-table-wrap" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>NAMA</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>KONTAK</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>ALAMAT</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={c.id} style={{ borderBottom: i < customers.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                        <td style={{ padding: '16px', fontWeight: 600, fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            {c.name}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: 12 }}>
                          {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {c.phone}</div>}
                          {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}><Mail size={12} /> {c.email}</div>}
                        </td>
                        <td style={{ padding: '16px', fontSize: 12, color: 'var(--cms-text-muted)' }}>{c.address || '-'}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button onClick={() => setEditingCustomer({ ...c })} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', marginRight: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={14} /></button>
                          <button onClick={() => { confirm('Hapus kontak?', async () => { await saveCustomers(customers.filter(x => x.id !== c.id)); notify('Terhapus'); }); }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="trx-card-list">
              {customers.map(c => (
                <div key={c.id} style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: 16, backdropFilter: 'blur(16px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</div>
                        {c.phone && <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {c.phone}</div>}
                        {c.email && <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} /> {c.email}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setEditingCustomer({ ...c })} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={14} /></button>
                      <button onClick={() => { confirm('Hapus kontak?', async () => { await saveCustomers(customers.filter(x => x.id !== c.id)); notify('Terhapus'); }); }} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {c.address && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--cms-text-muted)', paddingLeft: 56, display: 'flex', alignItems: 'flex-start', gap: 4 }}><MapPin size={11} style={{ flexShrink: 0, marginTop: 1 }} /> {c.address}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     RENDER: Invoice Settings Tab
  ═══════════════════════════════════════════════ */
  const renderSettingsTab = () => {
    return (
      <div style={{ animation: 'cmsFadeIn 0.3s ease', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><LayoutTemplate size={24} /></div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Desain Nota</h2>
            <p style={{ margin: '8px 0 0', color: 'var(--cms-text-muted)', fontSize: 14 }}>Atur bagaimana nota Anda terlihat saat diunduh atau dicetak.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Bank & Payment */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><Landmark size={16} color="var(--cms-accent)" /> Pembayaran &amp; Rekening</h3>
                <button onClick={() => setInvoiceSettings(p => ({ ...p, banks: [...(p.banks || []), { id: genId('BNK'), name: '', accountNumber: '', accountName: '', logo: '' }] }))} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, height: 32, padding: '0 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={13} /> Tambah</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {(invoiceSettings.banks || []).map((b, i) => (
                  <div key={b.id} className="trx-bank-row">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 12, background: 'var(--cms-panel-bg)', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {b.logo ? <img src={b.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ImageIcon size={20} style={{ opacity: 0.3 }} />}
                        <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={async e => {
                          const file = e.target.files[0];
                          if (file) {
                            notify('Mengupload logo bank...');
                            try {
                              const res = await uploadToCloudinary(file);
                              const url = res?.url || (typeof res === 'string' ? res : null);
                              if (url) {
                                const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === i ? { ...bk, logo: url } : bk);
                                const nextSettings = { ...invoiceSettings, banks: newBanks };
                                setInvoiceSettings(nextSettings);
                                saveSettings(nextSettings);
                              }

                            } catch (err) { notify('Gagal upload', 'error'); }
                            e.target.value = '';
                          }
                        }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} title="Upload Logo" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetBankIndex(i);
                          setGalleryTarget('bankLogo');
                          setIsGalleryOpen(true);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', fontSize: 10.5, fontWeight: 750, cursor: 'pointer', padding: 0 }}
                      >
                        Galeri
                      </button>
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 10 }}>Bank/E-Wallet</label>
                      <input value={b.name} onChange={e => {
                        const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === i ? { ...bk, name: e.target.value } : bk);
                        setInvoiceSettings(p => ({ ...p, banks: newBanks }));
                      }} className="cms-input" style={{ width: '100%', borderRadius: 100 }} placeholder="BCA/DANA" />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 10 }}>No Rekening</label>
                      <input value={b.accountNumber} onChange={e => {
                        const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === i ? { ...bk, accountNumber: e.target.value } : bk);
                        setInvoiceSettings(p => ({ ...p, banks: newBanks }));
                      }} className="cms-input" style={{ width: '100%', borderRadius: 100 }} />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 10 }}>Atas Nama</label>
                      <input value={b.accountName} onChange={e => {
                        const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === i ? { ...bk, accountName: e.target.value } : bk);
                        setInvoiceSettings(p => ({ ...p, banks: newBanks }));
                      }} className="cms-input" style={{ width: '100%', borderRadius: 100 }} />
                    </div>
                    <button onClick={() => setInvoiceSettings(p => ({ ...p, banks: p.banks.filter(x => x.id !== b.id) }))} style={{ ...S.iconBtn('#ef4444', 'rgba(239,68,68,0.1)') }}><Trash2 size={14} /></button>
                  </div>
                ))}
                {(!invoiceSettings.banks || invoiceSettings.banks.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--cms-text-muted)', fontSize: 13, border: '1px dashed var(--glass-border)', borderRadius: 16 }}>Belum ada informasi bank/e-wallet.</div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 6 }}>Default PPN (%)</label>
                <input type="text" value={formatNumber(invoiceSettings.taxPercent || 0)} onChange={e => setInvoiceSettings(p => ({ ...p, taxPercent: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', borderRadius: 100 }} />
              </div>
            </div>

            {/* Header Section */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><ImageIcon size={16} color="var(--cms-accent)" /> Gambar Header <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(Saran: 794 x 200px)</span></h3>
              {invoiceSettings.headerImage && (
                <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                  <img src={invoiceSettings.headerImage} alt="Header" crossOrigin="anonymous" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setInvoiceSettings(p => ({ ...p, headerImage: '' }))} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 100, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => headerImgRef.current?.click()} disabled={isUploadingHeader} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 16px', height: 44, flexShrink: 0 }}>
                  {isUploadingHeader ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />} Upload Header
                </button>
                <button 
                  type="button" 
                  onClick={() => { setGalleryTarget('header'); setIsGalleryOpen(true); }} 
                  className="cms-btn" 
                  style={{ borderRadius: 100, padding: '0 16px', height: 44, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={14} /> Dari Galeri
                </button>
                <input ref={headerImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, setIsUploadingHeader, url => {
                  const nextSettings = { ...invoiceSettings, headerImage: url };
                  setInvoiceSettings(nextSettings);
                  saveSettings(nextSettings);
                })} />
                <input value={invoiceSettings.headerText || ''} onChange={e => setInvoiceSettings(p => ({ ...p, headerText: e.target.value }))} placeholder="Atau ketik teks header (Nama Toko)" className="cms-input" style={{ flex: 1, minWidth: 0, borderRadius: 100, height: 44 }} />
              </div>
            </div>


            {/* Footer Section */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><PenTool size={16} color="var(--cms-accent)" /> Gambar Footer <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(Saran: 794 x 160px)</span></h3>
              {invoiceSettings.footerImage && (
                <div style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                  <img src={invoiceSettings.footerImage} alt="Footer" crossOrigin="anonymous" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setInvoiceSettings(p => ({ ...p, footerImage: '' }))} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 100, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => footerImgRef.current?.click()} disabled={isUploadingFooter} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 16px', height: 44, flexShrink: 0 }}>
                  {isUploadingFooter ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />} Upload Footer
                </button>
                <button 
                  type="button" 
                  onClick={() => { setGalleryTarget('footer'); setIsGalleryOpen(true); }} 
                  className="cms-btn" 
                  style={{ borderRadius: 100, padding: '0 16px', height: 44, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={14} /> Dari Galeri
                </button>
                <input ref={footerImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, setIsUploadingFooter, url => {
                  const nextSettings = { ...invoiceSettings, footerImage: url };
                  setInvoiceSettings(nextSettings);
                  saveSettings(nextSettings);
                })} />
                <input value={invoiceSettings.footerText || ''} onChange={e => setInvoiceSettings(p => ({ ...p, footerText: e.target.value }))} placeholder="Atau ketik Ucapan Terima Kasih" className="cms-input" style={{ flex: 1, minWidth: 0, borderRadius: 100, height: 44 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              {transactions.length > 0 && (
                <button onClick={() => setPrintingTrx(transactions[0])} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', gap: 8 }}><Eye size={16} /> Preview Nota</button>
              )}
              <button onClick={() => saveSettings(invoiceSettings)} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, padding: '0 32px', height: 48, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> Simpan Pengaturan</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     MAIN RENDER
  ═══════════════════════════════════════════════ */
  const TABS = [
    { id: 'transactions', label: 'Transaksi', icon: <Receipt size={16} /> },
    { id: 'products', label: 'Produk', icon: <Package size={16} /> },
    { id: 'discounts', label: 'Diskon', icon: <BadgePercent size={16} /> },
    { id: 'customers', label: 'Club', icon: <Users size={16} /> },
    { id: 'settings', label: 'Nota', icon: <Settings2 size={16} /> },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cms-bg)', color: 'var(--cms-text)' }}>
      <style>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type='number'] { -moz-appearance: textfield; }
        .trx-select {
          border-radius: 9999px !important; appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px !important;
          background-color: var(--cms-input-bg) !important; color: var(--cms-text) !important;
          border: 1.5px solid var(--glass-border) !important; backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px); transition: border-color 0.2s, box-shadow 0.2s; cursor: pointer;
        }
        .trx-select:focus { border-color: var(--cms-accent) !important; box-shadow: 0 0 0 3px var(--cms-accent-soft) !important; outline: none; }
        .trx-select option { background: var(--cms-panel-bg); color: var(--cms-text); }
        .trx-tab { display:inline-flex; align-items:center; gap:6px; padding:0 18px; height:38px; border-radius:9999px; border:none; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .trx-tab-active { background:var(--cms-accent); color:#fff; box-shadow:0 4px 14px rgba(0,0,0,0.2); }
        .trx-tab-inactive { background:transparent; color:var(--cms-text-muted); }
        .trx-tab-inactive:hover { background:var(--cms-switcher-bg); color:var(--cms-text); }
        .trx-row:hover { background: var(--cms-switcher-bg) !important; }
        .cms-btn-outline { color: var(--cms-text) !important; }
        input[type='checkbox'].trx-toggle { width:18px; height:18px; accentColor:var(--cms-accent); cursor:pointer; }
        @keyframes trxScaleIn { from { opacity:0; transform:scale(0.98) translateY(6px); } to { opacity:1; transform:none; } }
        .trx-modal-in { animation: trxScaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .trx-mobile-stats-toggle { display: none; }

        /* ════ RESPONSIVE LAYOUT ════ */

        /* Stats Grid */
        .trx-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        /* Search Bar */
        .trx-search-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: center;
        }

        /* Desktop: show table, hide cards */
        .trx-table-wrap { display: block; }
        .trx-card-list { display: none; }

        /* Desktop: show desktop item rows, hide mobile cards */
        .trx-item-row-desktop { display: grid; }
        .trx-item-row-mobile { display: none; }
        .trx-item-header { display: grid; }

        /* Form Grid: 2 columns */
        .trx-form-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
          align-items: flex-start;
        }

        /* Form Header */
        .trx-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 12px;
        }

        /* Tab container in header */
        .trx-tabs-wrap {
          display: flex;
          gap: 6px;
          background: var(--cms-switcher-bg);
          border-radius: 9999px;
          padding: 4px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          max-width: 100%;
          flex-shrink: 0;
        }
        .trx-tabs-wrap::-webkit-scrollbar { display: none; }

        /* Main header wrap */
        .trx-header-wrap {
          padding: 20px 28px;
          border-bottom: 1px solid var(--glass-border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Content area */
        .trx-content-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 24px 80px;
          box-sizing: border-box;
        }
        .trx-content-area > div {
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        /* Products header row */
        .trx-pg-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Bank settings grid */
        .trx-bank-row {
          display: grid;
          grid-template-columns: 60px 1fr 1fr 1fr 40px;
          gap: 12px;
          align-items: center;
          background: var(--cms-switcher-bg);
          padding: 12px 16px;
          border-radius: 16px;
        }

        /* ════ MOBILE ≤ 767px ════ */
        @media (max-width: 767px) {
          /* Header & Tabs */
          .trx-header-wrap {
            padding: 14px 16px;
            gap: 10px;
          }
          .trx-header-wrap h1 { font-size: 16px !important; }
          .trx-header-wrap p { display: none; }
          .trx-tabs-wrap {
            order: 2;
            width: 100%;
            flex-shrink: 0;
            display: flex;
          }
          .trx-tab { font-size: 11px !important; padding: 0 !important; height: 38px !important; flex: 1; justify-content: center; }
          .trx-tab svg { width: 18px !important; height: 18px !important; }
          .trx-tab-label { display: none; }
          
          .trx-mobile-stats-toggle {
            display: flex;
            width: 100%;
            margin-bottom: 14px;
            background: var(--cms-panel-bg);
            border: 1px solid var(--glass-border);
            padding: 10px;
            border-radius: 12px;
            justify-content: center;
            align-items: center;
            font-size: 13px;
            font-weight: 700;
            color: var(--cms-text);
            cursor: pointer;
          }
          .trx-stats-hidden-mobile { display: none !important; }

          /* Content area */
          .trx-content-area { 
            padding: 16px 16px calc(90px + env(safe-area-inset-bottom, 16px)) 16px !important; 
            box-sizing: border-box !important;
          }

          /* Stats: 1 column on mobile */
          .trx-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 10px;
            margin-bottom: 14px;
          }

          /* Search bar: grid */
          .trx-search-bar {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
          }
          .trx-search-bar > div:first-child { grid-column: 1 / -1; width: 100%; }
          .trx-search-bar > div:nth-child(2) { width: 100%; display: flex; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; }
          .trx-search-bar > button { width: 44px; height: 38px !important; padding: 0 !important; justify-content: center; border-radius: 9999px; }
          .trx-search-bar > button .trx-btn-text { display: none; }

          /* Hide desktop table, show mobile cards */
          .trx-table-wrap { display: none; }
          .trx-card-list { display: flex; flex-direction: column; gap: 12px; }

          /* Form: single column */
          .trx-form-grid { grid-template-columns: 1fr; }

          /* Form header */
          .trx-form-header { flex-wrap: wrap; }
          .trx-form-header h2 { font-size: 15px !important; }
          .trx-btn-back span.trx-btn-label { display: none; }
          .trx-btn-back { padding: 0 12px !important; }

          /* Items: hide desktop row, show mobile card */
          .trx-item-row-desktop { display: none !important; }
          .trx-item-row-mobile { display: block !important; }
          .trx-item-header { display: none !important; }

          /* Page headers */
          .trx-pg-header > div h2 { font-size: 15px !important; }
          .trx-pg-header > button span { display: none; }

          /* Bank settings: stack on mobile */
          .trx-bank-row {
            grid-template-columns: 56px 1fr 40px;
            grid-template-areas:
              'logo name del'
              'logo acc del'
              'logo aname del';
          }
          .trx-bank-row > div:nth-child(1) { grid-area: logo; }
          .trx-bank-row > div:nth-child(2) { grid-area: name; }
          .trx-bank-row > div:nth-child(3) { grid-area: acc; }
          .trx-bank-row > div:nth-child(4) { grid-area: aname; }
          .trx-bank-row > button { grid-area: del; align-self: center; margin-top: 0 !important; }
        }

        /* ════ TABLET (501px – 1024px) ════ */
        @media (min-width: 501px) and (max-width: 1280px) {
          /* Header */
          .trx-header-wrap { padding: 16px 20px; gap: 10px; }
          .trx-header-wrap h1 { font-size: 18px !important; }
          .trx-header-wrap p { font-size: 12px; }

          /* Tabs: scrollable pill row, full width */
          .trx-tabs-wrap {
            order: 2;
            width: 100%;
            flex-shrink: 0;
            display: flex;
            overflow-x: auto;
          }
          .trx-tab { 
            font-size: 12px !important; 
            padding: 0 14px !important; 
            height: 36px !important;
            flex-shrink: 0;
          }

          /* Content */
          .trx-content-area { padding: 14px 16px; }

          /* Stats: 3 columns */
          .trx-stats-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }

          /* Search bar */
          .trx-search-bar { flex-wrap: wrap; }

          /* ── RIWAYAT: hide table, show card grid 2-col ── */
          .trx-table-wrap { display: none !important; }
          .trx-card-list {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }

          /* Form: single column */
          .trx-form-grid { grid-template-columns: 1fr; }

          /* Pg headers */
          .trx-pg-header { gap: 10px; }

          /* Bank row: simpler on tablet */
          .trx-bank-row {
            grid-template-columns: 52px 1fr 1fr 1fr 36px;
            gap: 8px;
          }
        }

      `}</style>

      {/* Header & Tabs */}
      <div className="trx-header-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Receipt size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>Finance</h1>
            <p style={{ margin: '2px 0 0', color: 'var(--cms-text-muted)', fontSize: 13 }}>Arus transaksi bahagia, tagihan rapi, dan rekapan sumr.day studio ☀️</p>
          </div>
        </div>

        {!formData && (
          <div className="trx-tabs-wrap">
            {TABS.map(tab => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`trx-tab ${activeTab === tab.id ? 'trx-tab-active' : 'trx-tab-inactive'}`}
              >
                {tab.icon} <span className="trx-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="trx-content-area">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--cms-text-muted)', marginTop: 40 }}>Memuat modul...</div>
        ) : (
          <>
            {activeTab === 'transactions' && renderTransactionsTab()}
            {activeTab === 'products' && !formData && renderProductsTab()}
            {activeTab === 'discounts' && !formData && renderDiscountsTab()}
            {activeTab === 'customers' && !formData && renderCustomersTab()}
            {activeTab === 'settings' && !formData && renderSettingsTab()}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="trx-modal-in" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>{editingProduct.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setEditingProduct(null)} style={{ ...S.iconBtn() }}><X size={16} /></button>
            </div>

            {/* Product Image */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 16, background: 'var(--cms-switcher-bg)', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {editingProduct.image ? (
                    <img src={editingProduct.image} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : isUploadingProductImg ? (
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }} />
                  ) : (
                    <ImageIcon size={24} style={{ opacity: 0.3 }} />
                  )}
                  <input
                    type="file" accept="image/*"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    title="Upload Gambar Produk"
                    onChange={e => doUpload(e, setIsUploadingProductImg, url => setEditingProduct(p => ({ ...p, image: url })))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryTarget('productImage');
                    setIsGalleryOpen(true);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 750, cursor: 'pointer', padding: 0 }}
                >
                  Dari Galeri
                </button>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...S.label }}>Nama Produk *</label>
                <input value={editingProduct.name} onChange={e => setEditingProduct(p => ({ ...p, name: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ ...S.label }}>Harga Jual (Rp) *</label>
                  <input type="text" value={formatNumber(editingProduct.price)} onChange={e => setEditingProduct(p => ({ ...p, price: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                </div>
                <div>
                  <label style={{ ...S.label }}>Stok</label>
                  <input type="text" value={formatNumber(editingProduct.stock)} onChange={e => setEditingProduct(p => ({ ...p, stock: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ ...S.label }}>SKU / Kode Produk</label>
                  <input value={editingProduct.sku || ''} onChange={e => setEditingProduct(p => ({ ...p, sku: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} placeholder="e.g. PRD-001" />
                </div>
                <div>
                  <label style={{ ...S.label }}>Kategori</label>
                  <input value={editingProduct.category || ''} onChange={e => setEditingProduct(p => ({ ...p, category: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} placeholder="e.g. Pakaian" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setEditingProduct(null)} className="cms-btn cms-btn-outline" style={{ flex: 1, borderRadius: 9999, height: 42 }}>Batal</button>
              <button onClick={() => {
                if (!editingProduct.name.trim()) return notify('Nama wajib diisi', 'error');
                const finalP = { ...editingProduct, id: editingProduct.id || genId('PRD') };
                savePrd(editingProduct.id ? products.map(x => x.id === finalP.id ? finalP : x) : [...products, finalP]);
                setEditingProduct(null); notify('Produk tersimpan');
              }} className="cms-btn cms-btn-primary" style={{ flex: 1, borderRadius: 9999, height: 42 }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {editingDiscount && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="trx-modal-in" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>{editingDiscount.id ? 'Edit Promo' : 'Tambah Promo'}</h2>
              <button onClick={() => setEditingDiscount(null)} style={{ ...S.iconBtn() }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ ...S.label }}>Nama Promo</label>
                <input value={editingDiscount.label} onChange={e => setEditingDiscount(p => ({ ...p, label: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...S.label }}>Nilai Potongan</label>
                  <input type="text" value={formatNumber(editingDiscount.value)} onChange={e => setEditingDiscount(p => ({ ...p, value: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                </div>
                <div>
                  <label style={{ ...S.label }}>Tipe</label>
                  <CustomSelect
                    value={editingDiscount.type}
                    onChange={val => setEditingDiscount(p => ({ ...p, type: val }))}
                    placeholder="Tipe"
                    options={[{ value: 'percent', label: '% Persen' }, { value: 'nominal', label: 'Rp Nominal' }]}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setEditingDiscount(null)} className="cms-btn cms-btn-outline" style={{ flex: 1, borderRadius: 9999, height: 42 }}>Batal</button>
              <button onClick={() => {
                if (!editingDiscount.label.trim()) return notify('Nama wajib diisi', 'error');
                const finalD = { ...editingDiscount, id: editingDiscount.id || genId('DSC') };
                saveDiscounts(editingDiscount.id ? discounts.map(x => x.id === finalD.id ? finalD : x) : [...discounts, finalD]);
                setEditingDiscount(null); notify('Promo tersimpan');
              }} className="cms-btn cms-btn-primary" style={{ flex: 1, borderRadius: 9999, height: 42 }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="trx-modal-in" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>{editingCustomer.id ? 'Edit Kontak' : 'Tambah Kontak'}</h2>
              <button onClick={() => setEditingCustomer(null)} style={{ ...S.iconBtn() }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ ...S.label }}>Nama Lengkap *</label>
                <input value={editingCustomer.name} onChange={e => setEditingCustomer(p => ({ ...p, name: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...S.label }}>Telepon / WA</label>
                  <input value={editingCustomer.phone} onChange={e => setEditingCustomer(p => ({ ...p, phone: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                </div>
                <div>
                  <label style={{ ...S.label }}>Email</label>
                  <input value={editingCustomer.email} onChange={e => setEditingCustomer(p => ({ ...p, email: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 9999 }} />
                </div>
              </div>
              <div>
                <label style={{ ...S.label }}>Alamat Lengkap</label>
                <textarea value={editingCustomer.address} onChange={e => setEditingCustomer(p => ({ ...p, address: e.target.value }))} className="cms-input" style={{ width: '100%', borderRadius: 14, minHeight: 60, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setEditingCustomer(null)} className="cms-btn cms-btn-outline" style={{ flex: 1, borderRadius: 9999, height: 42 }}>Batal</button>
              <button onClick={() => {
                if (!editingCustomer.name.trim()) return notify('Nama wajib diisi', 'error');
                const finalC = { ...editingCustomer, id: editingCustomer.id || genId('CUS') };
                saveCustomers(editingCustomer.id ? customers.map(x => x.id === finalC.id ? finalC : x) : [...customers, finalC]);
                setEditingCustomer(null); notify('Kontak tersimpan');
              }} className="cms-btn cms-btn-primary" style={{ flex: 1, borderRadius: 9999, height: 42 }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="trx-modal-in" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Ubah Status Pembayaran</h3>
              <button onClick={() => setStatusModal(null)} style={{ ...S.iconBtn() }}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginBottom: 14, fontFamily: 'monospace', background: 'var(--cms-switcher-bg)', padding: '6px 12px', borderRadius: 9999, display: 'inline-block' }}>{statusModal.trx.id}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleUpdateStatus(statusModal.trx.id, key, statusModal.trx.dpAmount)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 9999, border: `1.5px solid ${statusModal.trx.paymentStatus === key ? cfg.color : 'var(--glass-border)'}`, background: statusModal.trx.paymentStatus === key ? cfg.bg : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                >
                  <span style={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: statusModal.trx.paymentStatus === key ? cfg.color : 'var(--cms-text)' }}>Jadikan {cfg.label}</span>
                  {statusModal.trx.paymentStatus === key && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: cfg.color, opacity: 0.7 }}>Aktif</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {printingTrx && <InvoicePrintView 
        trx={printingTrx} 
        settings={invoiceSettings} 
        onClose={() => setPrintingTrx(null)} 
        notify={notify} 
        globalConfig={globalConfig || {}} 
        onUploadSuccess={async (url) => {
          const updated = transactions.map(t => t.id === printingTrx.id ? { ...t, driveUrl: url } : t);
          await saveTrx(updated);
          const effectiveWebhook = globalConfig?.googleAppsScriptUrl;
          if (effectiveWebhook) {
            const finalTrx = updated.find(t => t.id === printingTrx.id);
            fetch(effectiveWebhook, {
              method: 'POST',
              body: JSON.stringify({
                action: 'sync_transactions',
                sheetId: globalConfig?.googleSheetId,
                payload: {
                  id: finalTrx.id,
                  date: finalTrx.date,
                  customerName: finalTrx.customer.name,
                  customerContact: finalTrx.customer.phone || finalTrx.customer.email || '',
                  items: finalTrx.items.map(i => `${i.name} (${i.qty})`).join(', '),
                  subtotal: finalTrx.subtotal || 0,
                  discount: finalTrx.discount || 0,
                  grandTotal: finalTrx.grandTotal,
                  paymentStatus: finalTrx.paymentStatus,
                  remaining: finalTrx.remaining,
                  driveUrl: url
                }
              }),
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            }).catch(() => {});
          }
        }}
      />}

      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => {
          if (galleryTarget === 'header') {
            const next = { ...invoiceSettings, headerImage: url };
            setInvoiceSettings(next);
            saveSettings(next);
          } else if (galleryTarget === 'footer') {
            const next = { ...invoiceSettings, footerImage: url };
            setInvoiceSettings(next);
            saveSettings(next);
          } else if (galleryTarget === 'bankLogo' && targetBankIndex !== null) {
            const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === targetBankIndex ? { ...bk, logo: url } : bk);
            const nextSettings = { ...invoiceSettings, banks: newBanks };
            setInvoiceSettings(nextSettings);
            saveSettings(nextSettings);
            setTargetBankIndex(null);
          } else if (galleryTarget === 'productImage') {
            setEditingProduct(p => ({ ...p, image: url }));
          }
          setIsGalleryOpen(false);
          setGalleryTarget(null);
        }}
      />
    </div>
  );
}
