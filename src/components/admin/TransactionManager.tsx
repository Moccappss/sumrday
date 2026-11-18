import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Receipt, Plus, Search, Printer, Edit3, Trash2, X, Save,
  Upload, Image as ImageIcon, Package, User, Phone, Mail,
  MapPin, Tag, CheckCircle2, Clock, AlertCircle, Settings2,
  ShoppingCart, FileText, ArrowLeft, RefreshCw, Eye, EyeOff,
  BarChart2, CreditCard, Wallet, BadgePercent, Truck, Landmark,
  Check, Download, Users, Store, PenTool, LayoutTemplate, Percent, ChevronDown,
  Hash, DollarSign, ZoomIn, ZoomOut, Info, Cloud, Copy, DownloadCloud, MessageCircle,
  FolderKanban, Send, Palette, Award, Stamp, ShieldCheck, MoreHorizontal, SlidersHorizontal,
  Layers, BellRing, QrCode, Repeat, Share2
} from 'lucide-react';
import { googleSync } from '../../utils/googleSync';
import { notifyTransaction } from '../../utils/notifications';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useContextMenu } from './ContextMenuProvider';
import MediaGalleryModal from './MediaGalleryModal';
import { ContractSpkModal } from './ContractSpkModal';
import { openWhatsApp, whatsappTemplates } from '../../utils/whatsappTemplates';
import PillDatePicker from '../common/PillDatePicker';
import ServiceOrderModal from './ServiceOrderModal';
import { normalizeGoogleDocUrl } from '../../utils/serviceOrderSync';
import { updateClientOrder } from '../../services/clientAuth';
import { Sparkles, Loader2 } from 'lucide-react';
import { analyzePaymentReceipt, ReceiptAnalysisResult } from '../../utils/ai';
import { updateAppBadge, shareNativeContent } from '../../utils/browserPowerHacks';
import RecurringRetainerModal, { RecurringRetainer } from './finance/RecurringRetainerModal';
import QrisSimulatorModal from './finance/QrisSimulatorModal';
import { syncUnifiedStudioData } from '../../utils/unifiedDataSync';
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
  perlu_verifikasi: { label: 'Cek Mutasi', color: '#d97706', bg: '#fef3c7', icon: <Clock size={12} /> },
  dp: { label: 'DP / Bertahap', color: '#0284c7', bg: '#e0f2fe', icon: <Clock size={12} /> },
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
  // For bookkeeping: base amount (before tax) and tax amount separately
  const baseAmount = afterDisc + (trx.shipping || 0);
  return { subtotal, discVal, taxVal, grandTotal, remaining, paid, uniqueCodeVal, baseAmount };
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

/* ─── 10 Executive Invoice Templates & Legal Terms ───────────── */
export const DEFAULT_INVOICE_TERMS = `1. Pembayaran dianggap sah hanya apabila dana telah terverifikasi efektif masuk ke rekening resmi atas nama studio.
2. Dokumen invoice ini merupakan bukti perikatan transaksi elektronik yang sah sesuai ketentuan UU ITE No. 11/2008 & PP No. 71/2019.
3. Seluruh berkas final proyek, akses repositori, dan lisensi komersial diserahterimakan penuh setelah verifikasi pelunasan.
4. Garansi perbaikan bug / revisi minor berlaku selama 30 hari kalender sejak penyerahan hasil pekerjaan.`;

export const INVOICE_TEMPLATES = [
  {
    id: 'swiss-minimal',
    name: 'Minimalist Monochrome',
    desc: 'Simpel, bersih, elegan & profesional. Layout hitam-putih presisi dengan logo & stempel tetap berwarna penuh.',
    badge: 'Default (B&W)',
    primaryColor: '#111827',
    accentColor: '#111827',
    paperBg: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    cardBg: '#fafafa',
    headBg: '#111827',
    headText: '#ffffff',
    totalBg: '#111827',
    totalText: '#ffffff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sealColor: '#dc2626',
    tableBorder: '1px solid #f3f4f6',
  },
  {
    id: 'corporate-slate',
    name: 'Executive Corporate',
    desc: 'Standar resmi perusahaan, kontras tegas navy slate & kredensial legalitas NIB/NPWP',
    badge: 'Resmi',
    primaryColor: '#0f172a',
    accentColor: '#D95629',
    paperBg: '#ffffff',
    text: '#0f172a',
    textMuted: '#475569',
    border: '#cbd5e1',
    cardBg: '#f8fafc',
    headBg: '#0f172a',
    headText: '#ffffff',
    totalBg: '#0f172a',
    totalText: '#ffffff',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif",
    sealColor: '#059669',
    tableBorder: '1px solid #e2e8f0',
  },
  {
    id: 'creative-warm',
    name: 'Creative Studio',
    desc: 'Aksen terracotta hangat sumr.day, dinamis, bersahabat dan elegan',
    badge: 'Studio',
    primaryColor: '#D95629',
    accentColor: '#D95629',
    paperBg: '#ffffff',
    text: '#1c1917',
    textMuted: '#78716c',
    border: '#fed7aa',
    cardBg: '#fffaf5',
    headBg: '#D95629',
    headText: '#ffffff',
    totalBg: '#D95629',
    totalText: '#ffffff',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    sealColor: '#D95629',
    tableBorder: '1px solid #ffedd5',
  },
  {
    id: 'royal-navy',
    name: 'Royal Navy Banking',
    desc: 'Inspirasi perbankan & institusi finansial, biru laut wibawa tinggi',
    badge: 'Finansial',
    primaryColor: '#1e3a8a',
    accentColor: '#2563eb',
    paperBg: '#ffffff',
    text: '#0f172a',
    textMuted: '#475569',
    border: '#bfdbfe',
    cardBg: '#f0f7ff',
    headBg: '#1e3a8a',
    headText: '#ffffff',
    totalBg: '#1e3a8a',
    totalText: '#ffffff',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    sealColor: '#1e3a8a',
    tableBorder: '1px solid #dbeafe',
  },
  {
    id: 'emerald-clean',
    name: 'Emerald Clean FinTech',
    desc: 'Warna hijau zamrud terpercaya, segar, modern & menyejukkan',
    badge: 'FinTech',
    primaryColor: '#059669',
    accentColor: '#10b981',
    paperBg: '#ffffff',
    text: '#064e3b',
    textMuted: '#047857',
    border: '#a7f3d0',
    cardBg: '#f0fdf4',
    headBg: '#059669',
    headText: '#ffffff',
    totalBg: '#059669',
    totalText: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    sealColor: '#059669',
    tableBorder: '1px solid #d1fae5',
  },
  {
    id: 'dark-executive',
    name: 'Obsidian Gold Luxury',
    desc: 'Dokumen eksekutif prestisius dengan aksen gold emas & header obsidian di atas kertas putih resmi',
    badge: 'Luxury Gold',
    primaryColor: '#b45309',
    accentColor: '#d97706',
    paperBg: '#ffffff',
    text: '#0f172a',
    textMuted: '#475569',
    border: '#cbd5e1',
    cardBg: '#fffdf5',
    headBg: '#0f172a',
    headText: '#fbbf24',
    totalBg: '#0f172a',
    totalText: '#fbbf24',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    sealColor: '#b45309',
    tableBorder: '1px solid #fef3c7',
    isDark: false,
  },
  {
    id: 'tech-monospace',
    name: 'Tech Architecture',
    desc: 'Gaya developer & insinyur software, tipografi kode monospace bersih',
    badge: 'Developer',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    paperBg: '#ffffff',
    text: '#0f172a',
    textMuted: '#475569',
    border: '#93c5fd',
    cardBg: '#f8fafc',
    headBg: '#1e3a8a',
    headText: '#ffffff',
    totalBg: '#0f172a',
    totalText: '#38bdf8',
    fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
    sealColor: '#2563eb',
    tableBorder: '1px solid #cbd5e1',
  },
  {
    id: 'classic-editorial',
    name: 'Classic Editorial',
    desc: 'Tipografi font serif sastra/majalah, garis ganda klasik, anggun',
    badge: 'Editorial',
    primaryColor: '#78350f',
    accentColor: '#92400e',
    paperBg: '#fdfbf7',
    text: '#1c1917',
    textMuted: '#57534e',
    border: '#d6d3d1',
    cardBg: '#f5f5f4',
    headBg: '#44403c',
    headText: '#f5f5f4',
    totalBg: '#292524',
    totalText: '#fafaf9',
    fontFamily: "'Georgia', 'Times New Roman', 'Playfair Display', serif",
    sealColor: '#991b1b',
    tableBorder: '1px solid #e7e5e4',
  },
  {
    id: 'modern-indigo',
    name: 'SaaS & Digital Platform',
    desc: 'Warna ungu indigo modern, kartu bayangan halus ala Stripe/Linear',
    badge: 'Modern SaaS',
    primaryColor: '#4f46e5',
    accentColor: '#6366f1',
    paperBg: '#ffffff',
    text: '#1e1b4b',
    textMuted: '#4338ca',
    border: '#c7d2fe',
    cardBg: '#f5f3ff',
    headBg: '#4f46e5',
    headText: '#ffffff',
    totalBg: '#4f46e5',
    totalText: '#ffffff',
    fontFamily: "'Inter', -apple-system, sans-serif",
    sealColor: '#4f46e5',
    tableBorder: '1px solid #e0e7ff',
  },
  {
    id: 'compact-thermal',
    name: 'Compact POS / Kasir',
    desc: 'Format struk kasir kasual, ringkas, garis putus-putus, cocok cepat kirim chat',
    badge: 'POS Ringkas',
    primaryColor: '#374151',
    accentColor: '#4b5563',
    paperBg: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#9ca3af',
    cardBg: '#f9fafb',
    headBg: '#f3f4f6',
    headText: '#111827',
    totalBg: '#111827',
    totalText: '#ffffff',
    fontFamily: "'Courier New', Courier, monospace",
    sealColor: '#374151',
    tableBorder: '1px dashed #d1d5db',
  },
];

/* ─── Invoice Print View ─────────────────────────────────────── */
function InvoicePrintView({ trx, settings, onClose, notify, globalConfig, onUploadSuccess, onGoToSettings }: any) {
  const { subtotal, discVal, taxVal, grandTotal, remaining, paid } = calcTotals(trx);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState(settings.templateId || 'swiss-minimal');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const invoiceRef = useRef(null);
  const isQuotation = trx.paymentStatus === 'quotation';

  const currentTpl = useMemo(() => {
    return INVOICE_TEMPLATES.find(t => t.id === selectedTemplateId) || INVOICE_TEMPLATES[0];
  }, [selectedTemplateId]);

  const termsContent = (settings.termsText && settings.termsText.trim()) 
    ? settings.termsText 
    : DEFAULT_INVOICE_TERMS;

  // Bank accounts helper
  const bankAccounts = useMemo(() => {
    const rawBanks = settings.banks && settings.banks.length > 0 ? settings.banks : [];
    return rawBanks.map((b: any, idx: number) => {
      let bName = (b.bankName || b.name || b.bank || '').trim();
      if (!bName) {
        bName = idx === 0 ? 'BCA (Bank Central Asia)' : 'Bank Transfer Resmi';
      }
      let accNum = (b.accountNumber || b.number || b.noRek || '').trim();
      if (!accNum) accNum = '-';
      let accHolder = (b.accountName || b.holder || b.an || '').trim();
      if (!accHolder) accHolder = settings.shopName || 'ARIF DARMAWAN';

      return {
        id: b.id || `bank-${idx}`,
        bankName: bName,
        accountNumber: accNum,
        accountName: accHolder,
        logo: b.bankLogo || b.logo || '',
        color: b.color || '#D95629'
      };
    });
  }, [settings.banks, settings.shopName]);

  const buildInvoicePdf = async (el: HTMLElement) => {
    const htmlToImage = await import('html-to-image');
    const { jsPDF } = await import('jspdf');

    // Use JPEG with 0.88 quality and 1.5 pixel ratio: crisp typography with tiny file size (~100-200 KB)
    const dataUrl = await htmlToImage.toJpeg(el, { 
      quality: 0.88, 
      backgroundColor: '#ffffff', 
      pixelRatio: 1.5,
      filter: (node: any) => {
        if (node?.classList && node.classList.contains('cms-no-pdf')) {
          return false;
        }
        return true;
      }
    });

    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4',
      compress: true 
    });

    const pdfW = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfH = pdf.internal.pageSize.getHeight(); // 297mm
    const imgAspect = el.offsetHeight / el.offsetWidth;
    const rawHeightMm = pdfW * imgAspect;

    // Single-page auto-fit: Ensure invoices (without extra MOU agreements) fit 100% on 1 A4 page without slicing
    if (!trx.mou?.enabled) {
      if (rawHeightMm > pdfH) {
        const fitScale = (pdfH - 2) / rawHeightMm;
        const fitW = pdfW * fitScale;
        const fitH = rawHeightMm * fitScale;
        const offsetX = (pdfW - fitW) / 2;
        pdf.addImage(dataUrl, 'JPEG', offsetX, 1, fitW, fitH, undefined, 'FAST');
      } else {
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfW, rawHeightMm, undefined, 'FAST');
      }
    } else {
      if (rawHeightMm <= pdfH) {
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfW, rawHeightMm, undefined, 'FAST');
      } else {
        let remainingHeight = rawHeightMm;
        let pageOffset = 0;
        while (remainingHeight > 0) {
          pdf.addImage(dataUrl, 'JPEG', 0, -pageOffset, pdfW, rawHeightMm, undefined, 'FAST');
          remainingHeight -= pdfH;
          pageOffset += pdfH;
          if (remainingHeight > 0) pdf.addPage();
        }
      }
    }

    return pdf;
  };

  const handleDownloadPDF = async () => {
    const el = invoiceRef.current;
    if (!el) return;
    setIsGenerating(true);
    notify(`Menyiapkan file ${isQuotation ? 'Surat Penawaran' : 'Invoice'} PDF (ringan & beresolusi tinggi)...`);
    try {
      const pdf = await buildInvoicePdf(el);
      pdf.save(`${isQuotation ? 'Penawaran' : 'Nota'}_${trx.id}.pdf`);
      notify(`${isQuotation ? 'Surat Penawaran' : 'Invoice'} PDF berhasil diunduh!`);
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
    notify(`Mengupload ${isQuotation ? 'Penawaran' : 'PDF'} ke Google Drive...`);
    try {
      const pdf = await buildInvoicePdf(el);
      const pdfBase64Data = pdf.output('datauristring');
      const b64 = pdfBase64Data.split(',')[1];
      
      const res = await fetch(effectiveWebhook, {
        method: 'POST',
        body: JSON.stringify({
          action: 'upload_file',
          fileName: `${isQuotation ? 'Penawaran' : 'Nota'}_${trx.id}.pdf`,
          fileType: 'application/pdf',
          fileBase64: b64
        })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        notify('PDF berhasil disimpan ke Google Drive!');
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

  const handleCopyBankAccounts = () => {
    if (bankAccounts.length === 0) {
      notify('Tidak ada informasi rekening bank tersimpan', 'error');
      return;
    }
    const txt = bankAccounts.map(b => `${b.bankName}: ${b.accountNumber} (a/n ${b.accountName})`).join('\n');
    navigator.clipboard.writeText(txt).then(() => {
      notify('Daftar rekening resmi studio berhasil disalin!');
    }).catch(() => {
      notify('Gagal menyalin info rekening', 'error');
    });
  };

  const handleCopyToWA = () => {
    let text = `*${isQuotation ? 'SURAT PENAWARAN KERJASAMA & ESTIMASI BIAYA' : 'NOTA TAGIHAN RESMI'} - ${settings.shopName || 'sumr.day Studio'}*\n`;
    text += `No. Ref: ${trx.id}\n`;
    text += `Tanggal: ${formatDate(trx.createdAt || trx.date)}\n`;
    if (isQuotation) {
      text += `Masa Berlaku: 30 Hari Kalender\n`;
    }
    text += `Klien: ${trx.customer?.name || 'Pelanggan'}\n\n`;
    
    text += `*RINCIAN SPESIFIKASI & LAYANAN:*\n`;
    (trx.items || []).forEach(i => {
      text += `• ${i.name} (${i.qty}x) = ${formatRp(i.price * i.qty)}\n`;
    });
    
    text += `\n*TOTAL INVESTASI: ${formatRp(grandTotal)}*\n`;
    
    if (isQuotation) {
      text += `Status: Dokumen Penawaran Resmi\n`;
      text += `Ketentuan Pembayaran: DP 50% kick-off, pelunasan 50% setelah serah terima hasil proyek.\n`;
    } else if (trx.paymentStatus === 'dp' && trx.termin && trx.termin.length > 0) {
      text += `\n*RINCIAN PEMBAYARAN:*\n`;
      trx.termin.forEach((t) => {
        text += `- ${t.name}: ${formatRp(t.amount)} ${t.isPaid ? '(LUNAS)' : '(BELUM BAYAR)'}\n`;
      });
      text += `Sisa Tagihan: ${formatRp(remaining)}\n`;
    } else if (trx.paymentStatus === 'belum') {
      text += `\nStatus: Belum Dibayar\n`;
    } else {
      text += `\nStatus: LUNAS & TERVERIFIKASI\n`;
    }
    
    if (bankAccounts.length > 0) {
      text += `\n*REKENING PEMBAYARAN RESMI:*\n`;
      bankAccounts.forEach(b => {
        text += `- ${b.bankName}: ${b.accountNumber} a/n ${b.accountName}\n`;
      });
    }
    
    text += `\nTerima kasih atas kepercayaannya bermitra dengan sumr.day studio!`;
    
    navigator.clipboard.writeText(text).then(() => {
      notify(`Teks ${isQuotation ? 'penawaran' : 'tagihan'} berhasil disalin untuk WhatsApp`);
    }).catch(() => {
      notify('Gagal menyalin teks', 'error');
    });
  };

  const handleNativeShare = async () => {
    let text = `*${isQuotation ? 'PENAWARAN KERJASAMA' : 'NOTA TAGIHAN RESMI'} #${trx.id}*\n`;
    text += `Klien: ${trx.customer?.name || 'Pelanggan'}\n`;
    text += `Total Investasi: ${formatRp(grandTotal)}\n`;
    text += `Status Pembayaran: ${trx.paymentStatus.toUpperCase()}\n`;
    if (bankAccounts.length > 0) {
      text += `\n*Rekening Resmi Studio:*\n${bankAccounts.map(b => `• ${b.bankName}: ${b.accountNumber} a/n ${b.accountName}`).join('\n')}\n`;
    }
    const res = await shareNativeContent({
      title: `${isQuotation ? 'Penawaran' : 'Invoice'} #${trx.id} — ${settings.shopName || 'sumr.day'}`,
      text,
      url: window.location.href
    });
    if (res.method === 'native') {
      notify('Menu bagikan berhasil dibuka!');
    } else if (res.method === 'clipboard') {
      notify('Ringkasan tagihan disalin ke clipboard!');
    }
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

  const studioName = settings.shopName || 'sumr.day studio';
  const studioPhone = settings.shopPhone || '0812-3456-7890';
  const studioEmail = settings.shopEmail || 'hi.sumrday@gmail.com';
  const studioAddress = settings.shopAddress || 'Jakarta Selatan, DKI Jakarta, Indonesia';

  const toolbarBtnStyle = (isActive = false, isClose = false) => ({
    width: 38,
    height: 38,
    borderRadius: 8,
    border: isActive ? '1px solid var(--cms-accent-border, rgba(217,86,41,0.4))' : '1px solid transparent',
    background: isActive ? 'var(--cms-accent-soft, rgba(217,86,41,0.18))' : 'transparent',
    color: isActive ? 'var(--cms-accent, #D95629)' : isClose ? 'var(--cms-text-secondary, #94a3b8)' : 'var(--cms-text-primary, #f1f5f9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    padding: 0
  });

  return (
    <div className="cms-official-doc-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)',
      zIndex: 9999, overflow: 'auto', padding: '32px 16px 120px',
    }}>
      {/* Floating Action Controls */}
      <div style={{
        position: 'fixed', bottom: window.innerWidth <= 500 ? '76px' : '24px', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--cms-bg-card, #1e293b)', border: '1px solid var(--cms-border, rgba(255,255,255,0.12))', 
        borderRadius: '20px', padding: '6px 8px', display: 'flex', flexDirection: 'row', gap: '6px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        zIndex: 10000, alignItems: 'center', width: 'max-content', maxWidth: '98%', overflow: 'visible'
      }}>
        <div className="toolbar-row" style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', flexShrink: 0, alignItems: 'center' }}>
          
          {/* Cluster 1: View Controls (Rekening & Zoom) */}
          <div style={{ display: 'flex', gap: '3px', background: 'var(--cms-bg, #0f172a)', padding: '3px', borderRadius: '10px', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', flexShrink: 0 }}>
            {bankAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBankInfo(!showBankInfo)}
                style={toolbarBtnStyle(showBankInfo)}
                title={showBankInfo ? "Sembunyikan Informasi Rekening Bank" : "Tampilkan Informasi Rekening Bank"}
              >
                <CreditCard size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              style={toolbarBtnStyle(isZoomed)}
              title={isZoomed ? "Sesuaikan Ukuran Layar" : "Perbesar Nota (Ukuran Penuh)"}
            >
              {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
            </button>
          </div>

          {/* Cluster 2: Design & Legal Terms (Template 10 & Peraturan) */}
          <div style={{ display: 'flex', gap: '3px', background: 'var(--cms-bg, #0f172a)', padding: '3px', borderRadius: '10px', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', flexShrink: 0 }}>
            {/* Template Switcher Dropdown (10 Desain) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                style={toolbarBtnStyle(showTemplateMenu)}
                title={`Pilih Desain Nota (Tersedia 10 Template - Aktif: ${currentTpl.name})`}
              >
                <Palette size={18} />
              </button>

              {showTemplateMenu && (
                <>
                  <div 
                    onClick={() => setShowTemplateMenu(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 100001, cursor: 'default' }} 
                  />
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 14px)', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--cms-panel-bg, #1e293b)',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.18))',
                    borderRadius: 18, padding: '12px 14px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)',
                    zIndex: 100002, display: 'flex', flexDirection: 'column', gap: 10,
                    backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)'
                  }}>
                    {/* Header Ringkas */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-accent, #D95629)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Tema Nota
                      </span>
                      <span style={{ fontSize: 9.5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                        {INVOICE_TEMPLATES.findIndex(t => t.id === selectedTemplateId) + 1}/10
                      </span>
                    </div>

                    {/* Grid 5x2 Icon Warna Lingkaran (Tidak Penyet di Ponsel) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 38px)',
                      gap: 8,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {INVOICE_TEMPLATES.map(tpl => {
                        const isSelected = selectedTemplateId === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            title={tpl.name}
                            onClick={() => {
                              setSelectedTemplateId(tpl.id);
                              setShowTemplateMenu(false);
                              const next = { ...settings, templateId: tpl.id };
                              storage.setItem('porto_invoice_settings', next);
                              notify(`Tema: ${tpl.name}`);
                            }}
                            style={{
                              width: 38,
                              height: 38,
                              minWidth: 38,
                              minHeight: 38,
                              maxWidth: 38,
                              maxHeight: 38,
                              aspectRatio: '1 / 1',
                              flexShrink: 0,
                              borderRadius: '50%',
                              background: tpl.primaryColor,
                              border: isSelected ? '2.5px solid #ffffff' : '2px solid rgba(255,255,255,0.25)',
                              boxShadow: isSelected
                                ? '0 0 0 2.5px var(--cms-accent, #D95629), 0 4px 12px rgba(0,0,0,0.45)'
                                : '0 2px 6px rgba(0,0,0,0.2)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              transition: 'transform 0.15s ease',
                              transform: isSelected ? 'scale(1.12)' : 'scale(1)'
                            }}
                          >
                            {isSelected && (
                              <Check size={18} strokeWidth={3} color="#ffffff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pointer Triangle */}
                    <div style={{
                      position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                      width: 10, height: 10, background: 'var(--cms-panel-bg, #1e293b)',
                      borderRight: '1px solid var(--glass-border, rgba(255,255,255,0.18))',
                      borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.18))'
                    }} />
                  </div>
                </>
              )}
            </div>

            {/* Peraturan Nota Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowTermsModal(true);
                const termsEl = document.getElementById('invoice-terms-section');
                if (termsEl) {
                  termsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  termsEl.style.transition = 'outline 0.3s, box-shadow 0.3s';
                  termsEl.style.outline = '2px solid var(--cms-accent)';
                  termsEl.style.boxShadow = '0 0 24px rgba(217,86,41,0.35)';
                  setTimeout(() => { 
                    termsEl.style.outline = 'none';
                    termsEl.style.boxShadow = 'none';
                  }, 2400);
                }
              }}
              style={toolbarBtnStyle(showTermsModal)}
              title="Peraturan & Ketentuan Nota (SLA & UU ITE)"
            >
              <FileText size={18} />
            </button>
          </div>

          {/* Cluster 3: Actions & Export (Salin Rekening, Salin WA, Download PDF, Drive) */}
          <div style={{ display: 'flex', gap: '3px', background: 'var(--cms-bg, #0f172a)', padding: '3px', borderRadius: '10px', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', flexShrink: 0 }}>
            {bankAccounts.length > 0 && (
              <button
                type="button"
                onClick={handleCopyBankAccounts}
                style={toolbarBtnStyle(false)}
                title="Salin Seluruh Rekening Bank Resmi"
              >
                <Landmark size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyToWA}
              style={toolbarBtnStyle(false)}
              title="Salin Teks Nota untuk WhatsApp"
            >
              <Copy size={18} />
            </button>
            <button
              type="button"
              onClick={handleNativeShare}
              style={toolbarBtnStyle(false)}
              title="Bagikan Langsung via Share Sheet (WhatsApp, Story, AirDrop)"
            >
              <Share2 size={18} />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={toolbarBtnStyle(false)}
              title="Cetak Nota Langsung / Print A4 (Kertas Putih Bersih)"
            >
              <Printer size={18} />
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: 'none',
                background: 'var(--cms-accent, #D95629)',
                color: '#ffffff',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isGenerating ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(217,86,41,0.35)',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                padding: 0
              }}
              title="Unduh Dokumen PDF Resmi"
            >
              {isGenerating ? <RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={17} />}
            </button>
            {(settings.webhookUrl || globalConfig?.googleAppsScriptUrl) && (
              <button
                type="button"
                onClick={handleUploadToDrive}
                disabled={isUploading}
                style={toolbarBtnStyle(false)}
                title="Simpan PDF ke Google Drive"
              >
                {isUploading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Cloud size={18} />}
              </button>
            )}
          </div>

          {/* Cluster 4: Close Action */}
          <div style={{ display: 'flex', background: 'var(--cms-bg, #0f172a)', padding: '3px', borderRadius: '10px', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={toolbarBtnStyle(false, true)}
              title="Tutup Pratinjau Nota"
            >
              <X size={18} />
            </button>
          </div>

        </div>
      </div>

      {/* Scaled Printable Document */}
      <div style={{ width: 794 * scale, margin: '0 auto', paddingBottom: 160 }}>
        <div style={{ width: 794, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <div ref={invoiceRef} id="invoice-capture" className="cms-nota-print-container cms-official-doc-paper official-doc-paper" style={{
            backgroundColor: currentTpl.paperBg || '#ffffff',
            color: currentTpl.text || '#0f172a',
            colorScheme: 'light',
            width: 794,
            minHeight: 1080,
            borderRadius: currentTpl.id === 'swiss-minimal' || currentTpl.id === 'tech-monospace' ? 0 : 16, 
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            fontFamily: currentTpl.fontFamily,
            fontSize: 13, lineHeight: 1.6, overflow: 'hidden',
            position: 'relative',
            border: currentTpl.id === 'compact-thermal' ? '2px dashed #9ca3af' : '1px solid #e2e8f0'
          }}>

            <style dangerouslySetInnerHTML={{__html: `
              .cms-nota-print-container, .cms-nota-print-container * {
                box-sizing: border-box;
              }
              @media print {
                .cms-no-pdf {
                  display: none !important;
                }
              }
            `}} />

            {/* Top Corporate Line */}
            <div style={{ height: 4, width: '100%', background: currentTpl.primaryColor }} />

            {/* Custom Header Banner Image (if configured) */}
            {settings.headerImage ? (
              <img src={settings.headerImage} alt="Header Nota" crossOrigin="anonymous" style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
            ) : settings.headerText ? (
              <div style={{ background: currentTpl.primaryColor, color: '#ffffff', padding: '24px 36px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#f8fafc' }}>{settings.headerText}</div>
              </div>
            ) : null}

            <div style={{ padding: '26px 36px 22px' }}>

              {/* ── 1. Header: Info Penjual & Judul Nota ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${currentTpl.primaryColor}`, paddingBottom: 14, marginBottom: 16 }}>
                
                {/* Info Penjual */}
                <div style={{ maxWidth: 420 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <img 
                      src={settings.shopLogo || '/logo.png'} 
                      alt="Logo Studio" 
                      crossOrigin="anonymous" 
                      style={{ height: 38, width: 'auto', objectFit: 'contain', borderRadius: 4, display: 'block' }} 
                      onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: currentTpl.text, lineHeight: 1.15 }}>
                        {studioName}
                      </div>
                      {settings.shopTagline && (
                        <div style={{ fontSize: 10, color: currentTpl.textMuted, marginTop: 1 }}>
                          {settings.shopTagline}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10.5, color: currentTpl.textMuted }}>
                    {studioAddress && <div>{studioAddress}</div>}
                    <div>
                      {studioPhone && <span>WA / Telp: <strong style={{ color: currentTpl.text }}>{studioPhone}</strong></span>}
                      {studioPhone && studioEmail && <span> &nbsp;·&nbsp; </span>}
                      {studioEmail && <span>Email: <strong style={{ color: currentTpl.text }}>{studioEmail}</strong></span>}
                    </div>
                  </div>
                </div>

                {/* Judul & Nomor Nota */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: isQuotation ? 22 : 24,
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    color: currentTpl.text
                  }}>
                    {isQuotation ? 'PENAWARAN' : 'NOTA PEMBAYARAN'}
                  </div>

                  <div style={{
                    display: 'inline-block',
                    background: currentTpl.cardBg,
                    color: currentTpl.text,
                    border: `1px solid ${currentTpl.border}`,
                    padding: '3px 10px',
                    borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6,
                    fontSize: 12.5,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '0.04em',
                    marginTop: 6
                  }}>
                    No: #{trx.id}
                  </div>

                  <div style={{ fontSize: 10.5, color: currentTpl.textMuted, marginTop: 6 }}>
                    Tanggal: <strong style={{ color: currentTpl.text }}>{formatDate(trx.createdAt || trx.date)}</strong>
                  </div>
                  {trx.dueDate && (
                    <div style={{ fontSize: 10.5, color: currentTpl.textMuted, marginTop: 2 }}>
                      Jatuh Tempo: <strong style={{ color: currentTpl.text }}>{formatDate(trx.dueDate)}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 2. Info Pembeli & Status Pembayaran ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
                
                {/* Info Pembeli */}
                <div style={{
                  border: `1px solid ${currentTpl.border}`,
                  borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 8,
                  padding: '12px 14px',
                  background: currentTpl.cardBg
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: currentTpl.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                    PEMBELI / KLIEN:
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 850, color: currentTpl.text, marginBottom: 2 }}>
                    {trx.customer?.name || 'Pelanggan'}
                  </div>
                  {trx.customer?.company && (
                    <div style={{ fontSize: 11, fontWeight: 650, color: currentTpl.textMuted, marginBottom: 3 }}>
                      {trx.customer.company}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10.5, color: currentTpl.textMuted }}>
                    {trx.customer?.phone && <div>No. HP / WA: <strong style={{ color: currentTpl.text }}>{trx.customer.phone}</strong></div>}
                    {trx.customer?.email && <div>Email: <strong style={{ color: currentTpl.text }}>{trx.customer.email}</strong></div>}
                    {trx.customer?.address && trx.customer.address !== '-' && (
                      <div>Alamat: <span style={{ color: currentTpl.text }}>{trx.customer.address}</span></div>
                    )}
                  </div>
                </div>

                {/* Status Pembayaran */}
                <div style={{
                  border: `1px solid ${currentTpl.border}`,
                  borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 8,
                  padding: '12px 14px',
                  background: currentTpl.cardBg,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: currentTpl.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                      STATUS PEMBAYARAN:
                    </div>
                    
                    <div>
                      {trx.paymentStatus === 'lunas' ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: currentTpl.id === 'swiss-minimal' ? '#111827' : '#ecfdf5',
                          color: currentTpl.id === 'swiss-minimal' ? '#ffffff' : '#047857',
                          border: currentTpl.id === 'swiss-minimal' ? '1.5px solid #111827' : '1.5px solid #059669',
                          padding: '4px 10px', borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6, fontSize: 11, fontWeight: 850
                        }}>
                          <Check size={12} strokeWidth={3} /> LUNAS
                        </div>
                      ) : trx.paymentStatus === 'dp' ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: currentTpl.id === 'swiss-minimal' ? '#ffffff' : '#fffbeb',
                          color: currentTpl.id === 'swiss-minimal' ? '#111827' : '#b45309',
                          border: currentTpl.id === 'swiss-minimal' ? '1.5px solid #111827' : '1.5px solid #d97706',
                          padding: '4px 10px', borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6, fontSize: 11, fontWeight: 850
                        }}>
                          <Clock size={12} /> DP (Sisa: {formatRp(remaining)})
                        </div>
                      ) : isQuotation ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: currentTpl.id === 'swiss-minimal' ? '#f4f4f5' : '#eef2ff',
                          color: currentTpl.id === 'swiss-minimal' ? '#111827' : '#3730a3',
                          border: currentTpl.id === 'swiss-minimal' ? '1.5px solid #d4d4d8' : '1.5px solid #4f46e5',
                          padding: '4px 10px', borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6, fontSize: 11, fontWeight: 850
                        }}>
                          <FileText size={12} /> PENAWARAN HARGA
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: currentTpl.id === 'swiss-minimal' ? '#ffffff' : '#fef2f2',
                          color: currentTpl.id === 'swiss-minimal' ? '#111827' : '#b91c1c',
                          border: currentTpl.id === 'swiss-minimal' ? '1.5px dashed #111827' : '1.5px solid #dc2626',
                          padding: '4px 10px', borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6, fontSize: 11, fontWeight: 850
                        }}>
                          <AlertCircle size={12} /> BELUM BAYAR
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: 10.5, color: currentTpl.textMuted, borderTop: `1px solid ${currentTpl.border}`, paddingTop: 6, marginTop: 6 }}>
                    <div>Metode: <strong style={{ color: currentTpl.text }}>{trx.paymentMethod || 'Transfer Bank'}</strong></div>
                    {trx.trackingNumber && <div>No. Resi: <strong style={{ color: currentTpl.text }}>{trx.trackingNumber}</strong></div>}
                  </div>
                </div>

              </div>

              {/* ── 3. Rincian Pesanan ── */}
              <div style={{ marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: currentTpl.headBg, borderTop: `1.5px solid ${currentTpl.primaryColor}`, borderBottom: `1.5px solid ${currentTpl.primaryColor}`, color: currentTpl.headText, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>
                      <th style={{ padding: '8px 6px', width: 30, textAlign: 'center' }}>NO</th>
                      <th style={{ padding: '8px 10px' }}>PESANAN / LAYANAN</th>
                      <th style={{ padding: '8px 6px', width: 44, textAlign: 'center' }}>QTY</th>
                      <th style={{ padding: '8px 10px', width: 120, textAlign: 'right' }}>HARGA</th>
                      <th style={{ padding: '8px 10px', width: 130, textAlign: 'right' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trx.items || []).map((item, i) => (
                      <tr key={i} style={{ borderBottom: currentTpl.tableBorder }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: currentTpl.textMuted, fontSize: 11 }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 750, fontSize: 12, color: currentTpl.text }}>{item.name}</div>
                          {item.notes && (
                            <div style={{ fontSize: 10, color: currentTpl.textMuted, marginTop: 1 }}>{item.notes}</div>
                          )}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', color: currentTpl.text, fontWeight: 600, fontSize: 11.5 }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: currentTpl.text, fontSize: 11.5, fontFamily: 'monospace' }}>
                          {formatRp(item.price)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: currentTpl.text, fontSize: 12, fontFamily: 'monospace' }}>
                          {formatRp(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── 4. Rekening & Total Pembayaran ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'flex-start' }}>
                
                {/* Rekening Pembayaran */}
                <div>
                  {showBankInfo && bankAccounts.length > 0 && (
                    <div style={{
                      border: `1px solid ${currentTpl.border}`,
                      borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 8,
                      padding: '10px 12px',
                      background: currentTpl.cardBg
                    }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, color: currentTpl.text, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
                        REKENING PEMBAYARAN:
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {bankAccounts.map((b, idx) => (
                          <div 
                            key={b.id || idx}
                            style={{
                              background: currentTpl.paperBg,
                              border: `1px solid ${currentTpl.border}`,
                              borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6,
                              padding: '6px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {b.logo && (
                                  <img 
                                    src={b.logo} 
                                    alt={b.bankName} 
                                    crossOrigin="anonymous" 
                                    style={{ height: 15, width: 'auto', maxWidth: 50, objectFit: 'contain', display: 'block' }} 
                                  />
                                )}
                                <span style={{ fontSize: 11, fontWeight: 800, color: currentTpl.text }}>{b.bankName}</span>
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 850, color: currentTpl.text, marginTop: 1 }}>
                                {b.accountNumber}
                              </div>
                              <div style={{ fontSize: 9.5, color: currentTpl.textMuted }}>
                                a.n. {b.accountName}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QRIS / Bayar Cepat untuk transaksi belum lunas / DP */}
                  {trx.paymentStatus !== 'lunas' && (
                    <div style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      background: currentTpl.cardBg,
                      border: `1px dashed ${currentTpl.primaryColor}`,
                      borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                          `${typeof window !== 'undefined' ? window.location.origin : 'https://sumrday.day'}/client/account?order=${trx.id}&pay=true&amount=${remaining}`
                        )}`}
                        alt="QRIS Quick Pay"
                        crossOrigin="anonymous"
                        style={{ width: 44, height: 44, borderRadius: 4, display: 'block', flexShrink: 0, border: '1px solid #e2e8f0' }}
                      />
                      <div style={{ fontSize: 9.5, color: currentTpl.textMuted, lineHeight: 1.3 }}>
                        <div style={{ fontWeight: 800, color: currentTpl.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>QRIS / BAYAR CEPAT</span>
                          <span style={{ color: '#ef4444', fontWeight: 900 }}>({formatRp(remaining)})</span>
                        </div>
                        <div>Pindai barcode untuk bayar langsung melalui Mobile Banking atau e-Wallet</div>
                      </div>
                    </div>
                  )}

                  {/* Catatan Klien (jika ada) */}
                  {trx.notes && trx.notes.trim() !== '' && trx.notes.trim() !== '-' && (
                    <div style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      background: currentTpl.cardBg,
                      border: `1px solid ${currentTpl.border}`,
                      borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6,
                      fontSize: 10,
                      color: currentTpl.textMuted
                    }}>
                      <strong style={{ color: currentTpl.text }}>Catatan:</strong> {trx.notes}
                    </div>
                  )}
                </div>

                {/* Ringkasan Biaya */}
                <div style={{
                  border: `1px solid ${currentTpl.border}`,
                  borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 8,
                  padding: '12px 14px',
                  background: currentTpl.cardBg
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: currentTpl.textMuted }}>
                      <span>Subtotal</span>
                      <strong style={{ color: currentTpl.text, fontFamily: 'monospace' }}>{formatRp(subtotal)}</strong>
                    </div>

                    {discVal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                        <span>Diskon</span>
                        <span style={{ fontFamily: 'monospace' }}>- {formatRp(discVal)}</span>
                      </div>
                    )}

                    {trx.shipping > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: currentTpl.textMuted }}>
                        <span>Ongkos Kirim</span>
                        <strong style={{ color: currentTpl.text, fontFamily: 'monospace' }}>{formatRp(trx.shipping)}</strong>
                      </div>
                    )}

                    {trx.tax?.enabled && taxVal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: currentTpl.textMuted }}>
                        <span>PPN ({trx.tax.percent}%)</span>
                        <strong style={{ color: currentTpl.text, fontFamily: 'monospace' }}>{formatRp(taxVal)}</strong>
                      </div>
                    )}

                    <div style={{ height: 1.5, background: currentTpl.primaryColor, margin: '2px 0' }} />

                    {/* Total Box */}
                    <div style={{
                      background: currentTpl.totalBg,
                      color: currentTpl.totalText,
                      borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6,
                      padding: '8px 10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>
                        {isQuotation ? 'TOTAL ESTIMASI' : 'TOTAL AKHIR'}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace' }}>
                        {formatRp(grandTotal)}
                      </div>
                    </div>

                    {/* DP / Balance Details */}
                    {trx.paymentStatus === 'dp' && (
                      <div style={{
                        marginTop: 2,
                        padding: '6px 8px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        fontSize: 10
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 700, marginBottom: 1 }}>
                          <span>DP Terbayar:</span>
                          <span style={{ fontFamily: 'monospace' }}>{formatRp(paid)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: 850 }}>
                          <span>Sisa Pembayaran:</span>
                          <span style={{ fontFamily: 'monospace' }}>{formatRp(remaining)}</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* ── 5. Syarat & Ketentuan Ringkas (Optional) ── */}
              {settings.termsText && settings.termsText.trim() !== '' && (
                <div id="invoice-terms-section" style={{
                  marginTop: 12,
                  padding: '8px 12px',
                  background: currentTpl.cardBg,
                  borderLeft: `3px solid ${currentTpl.primaryColor}`,
                  borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : '0 4px 4px 0',
                  fontSize: 9.5,
                  color: currentTpl.textMuted,
                  lineHeight: 1.4
                }}>
                  <div style={{ fontWeight: 800, color: currentTpl.text, marginBottom: 2, textTransform: 'uppercase' }}>
                    KETENTUAN:
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {settings.termsText}
                  </div>
                </div>
              )}

              {/* ── 6. Tanda Tangan & Verifikasi ── */}
              <div style={{
                marginTop: 18,
                paddingTop: 10,
                borderTop: `1px solid ${currentTpl.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 16
              }}>
                {/* Pembeli */}
                <div style={{ textAlign: 'center', width: 150 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: currentTpl.textMuted, textTransform: 'uppercase', marginBottom: 36 }}>
                    Diterima Oleh,
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 11.5, color: currentTpl.text, borderTop: `1px solid ${currentTpl.border}`, paddingTop: 4 }}>
                    {trx.customer?.name || 'Pelanggan'}
                  </div>
                </div>

                {/* QR Code Ringkas & Dinamis */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  background: currentTpl.cardBg,
                  border: `1px solid ${currentTpl.border}`,
                  borderRadius: currentTpl.id === 'swiss-minimal' ? 0 : 6
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      `${typeof window !== 'undefined' ? window.location.origin : 'https://sumrday.day'}/client/account?order=${trx.id}`
                    )}`}
                    alt="QR Code Verifikasi"
                    crossOrigin="anonymous"
                    style={{ width: 36, height: 36, borderRadius: 2, display: 'block', flexShrink: 0 }}
                  />
                  <div style={{ fontSize: 8.5, color: currentTpl.textMuted, lineHeight: 1.25 }}>
                    <div style={{ fontWeight: 800, color: currentTpl.text }}>VERIFIKASI RESMI</div>
                    <div>{trx.paymentStatus === 'lunas' ? 'Status: LUNAS' : 'Pindai ke Akun'}</div>
                  </div>
                </div>

                {/* Penjual */}
                <div style={{ textAlign: 'center', width: 170, position: 'relative' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: currentTpl.textMuted, textTransform: 'uppercase', marginBottom: 36 }}>
                    Hormat Kami,
                  </div>

                  {/* Stamp rendered in full color overlaying */}
                  <div style={{
                    position: 'absolute',
                    bottom: 6,
                    left: '50%',
                    transform: 'translateX(-50%) rotate(-7deg)',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}>
                    {settings.stampImage ? (
                      <img 
                        src={settings.stampImage} 
                        alt="Stempel" 
                        crossOrigin="anonymous" 
                        style={{ 
                          width: 82, 
                          height: 82, 
                          objectFit: 'contain', 
                          display: 'block' 
                        }} 
                      />
                    ) : (
                      <div style={{
                        width: 76, height: 76,
                        borderRadius: '50%',
                        border: `2px solid ${currentTpl.sealColor || '#dc2626'}`,
                        color: currentTpl.sealColor || '#dc2626',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: 2,
                        background: 'rgba(255,255,255,0.7)',
                        opacity: 0.95
                      }}>
                        <div style={{ fontSize: 5.5, fontWeight: 900, textTransform: 'uppercase' }}>
                          {studioName}
                        </div>
                        <div style={{ fontSize: 8, fontWeight: 950, margin: '1px 0', borderTop: `1px solid ${currentTpl.sealColor || '#dc2626'}`, borderBottom: `1px solid ${currentTpl.sealColor || '#dc2626'}`, padding: '0 3px' }}>
                          {trx.paymentStatus === 'lunas' ? 'LUNAS' : 'RESMI'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative', zIndex: 3, fontWeight: 800, fontSize: 11.5, color: currentTpl.text, borderTop: `1px solid ${currentTpl.border}`, paddingTop: 4 }}>
                    {settings.shopName || studioName}
                  </div>
                </div>
              </div>

              {settings.footerText && (
                <div style={{ textAlign: 'center', fontSize: 9.5, color: currentTpl.textMuted, marginTop: 12 }}>
                  {settings.footerText}
                </div>
              )}

            </div>

            {/* Custom Footer Banner Image */}
            {settings.footerImage && (
              <img src={settings.footerImage} alt="Footer Nota" crossOrigin="anonymous" style={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'cover' }} />
            )}

            {/* MOU / Agreement Contract (if enabled) */}
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

      {/* Peraturan & Klausul Hukum Modal Overlay */}
      {showTermsModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.68)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--cms-panel-bg, #1e293b)',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 580,
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              color: 'var(--cms-text, #fff)',
              animation: 'trxScaleIn 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(168,85,247,0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Peraturan &amp; Syarat Ketentuan Nota</h3>
                  <div style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontWeight: 700 }}>
                    <ShieldCheck size={13} /> Sesuai UU ITE No. 11/2008 &amp; PP No. 71/2019
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted, #94a3b8)', cursor: 'pointer', padding: 6, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: 'var(--cms-bg, #0f172a)',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              borderRadius: 16,
              padding: 16,
              fontSize: 12,
              lineHeight: 1.7,
              color: 'var(--cms-text, #f1f5f9)',
              whiteSpace: 'pre-line',
              maxHeight: 280,
              overflowY: 'auto'
            }}>
              {termsContent}
            </div>

            <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
              ℹ️ Klausul hukum ini otomatis dicetak lengkap dan seragam di semua 10 desain template nota &amp; dokumen PDF. Anda dapat mengedit atau menyesuaikan isi klausul ini langsung di tab <strong>Desain Nota</strong>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              {onGoToSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTermsModal(false);
                    onGoToSettings();
                  }}
                  className="cms-btn cms-btn-outline"
                  title="Atur & Sesuaikan Peraturan di Tab Nota"
                  aria-label="Atur Peraturan Nota"
                  style={{ borderRadius: 10, width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent, #D95629)', flexShrink: 0 }}
                >
                  <Settings2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="cms-btn cms-btn-primary"
                title="Tutup Modal Peraturan"
                aria-label="Tutup"
                style={{ borderRadius: 10, width: 38, height: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, milestoneStep }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.belum;
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
        color: cfg.color, background: cfg.bg,
      }}>
        {cfg.icon} {cfg.label}
      </span>
      {milestoneStep ? (
        <span style={{
          fontSize: 9.5,
          fontWeight: 800,
          color: 'var(--cms-accent)',
          background: 'var(--cms-accent-soft)',
          padding: '1px 6px',
          borderRadius: 4,
          fontFamily: 'monospace'
        }}>
          Step {milestoneStep}/5
        </span>
      ) : null}
    </div>
  );
}

function TrxStatusModal({ trx, STATUS_CONFIG, onClose, onSave }: { trx: any, STATUS_CONFIG: any, onClose: () => void, onSave: (trxId: string, newStatus: string, dpAmount?: number, milestoneStep?: number, trackingNumber?: string) => Promise<void> }) {
  const [selectedStatus, setSelectedStatus] = useState<string>(trx.paymentStatus || 'belum');
  const defaultStep = trx.milestoneStep || (trx.paymentStatus === 'lunas' ? 5 : (trx.paymentStatus === 'dp' ? 2 : 1));
  const [selectedStep, setSelectedStep] = useState<number>(defaultStep);
  const [trackingNumber, setTrackingNumber] = useState<string>(trx.trackingNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<ReceiptAnalysisResult | null>(null);

  const handleScanReceipt = async () => {
    if (!trx.paymentProofUrl) return;
    setIsScanningReceipt(true);
    setAiScanResult(null);
    try {
      const res = await analyzePaymentReceipt(trx.paymentProofUrl, trx.grandTotal);
      setAiScanResult(res);
    } catch (e: any) {
      setAiScanResult({
        success: false,
        message: e.message || 'Gagal menganalisis struk transfer.'
      });
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const isPO = trx.orderType === 'preorder' || Boolean(trx.preOrderBatch) || trx.items?.some((i: any) => i.isPreOrder || i.name?.toLowerCase().includes('pre-order') || i.name?.toLowerCase().includes('merch'));

  const steps = isPO ? [
    { step: 1, label: '1. Slot PO Terdaftar & DP Masuk', desc: 'Data pesanan merch & slot kuota terkunci' },
    { step: 2, label: '2. Batch PO Ditutup & Verifikasi', desc: 'Verifikasi jumlah kuota dan pesanan bahan' },
    { step: 3, label: '3. Proses Produksi Merch', desc: 'Pabrikasi / konveksi / pencetakan merchandise' },
    { step: 4, label: '4. Quality Check & Packing', desc: 'Inspeksi mutu merch & pengemasan pesanan' },
    { step: 5, label: '5. Pengiriman ke Alamat Pemesan', desc: 'Resi terbit & paket siap dikirim' },
  ] : [
    { step: 1, label: '1. Order & Brief Diterima', desc: 'Dokumen brief & form pesanan masuk ke sistem' },
    { step: 2, label: '2. Verifikasi & Pembayaran DP', desc: 'Pembayaran DP / lunas telah divalidasi studio' },
    { step: 3, label: '3. Pengerjaan & Produksi', desc: 'Desain, koding, dan pengerjaan proyek aktif' },
    { step: 4, label: '4. Review & QA Internal', desc: 'Pengecekan kualitas hasil kerja sebelum serah terima' },
    { step: 5, label: '5. Serah Terima & Selesai', desc: 'Penyerahan file final / live website & pelunasan' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(trx.id, selectedStatus, trx.dpAmount, selectedStep, trackingNumber.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="trx-modal-in" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100, background: isPO ? '#f59e0b20' : 'var(--cms-accent-soft)', color: isPO ? '#f59e0b' : 'var(--cms-accent)' }}>
                {isPO ? 'Pre-Order Merch' : 'Jasa / Proyek'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontFamily: 'monospace' }}>
                #{trx.id}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text)' }}>
              Status & Tahapan Pesanan
            </h3>
            <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>
              Klien: <strong style={{ color: 'var(--cms-text)' }}>{trx.customer?.name || 'Pelanggan'}</strong> ({trx.customer?.phone || '-'})
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Panel Verifikasi Bukti Transfer Klien (Safe Bank Verification) ── */}
        {(trx.paymentProofUrl || trx.paymentStatus === 'perlu_verifikasi') && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 14,
            background: 'var(--cms-switcher-bg)',
            border: '1.5px solid rgba(217,119,6,0.3)',
            boxShadow: '0 4px 12px rgba(217,119,6,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} /> Verifikasi Mutasi Bank / e-Wallet
              </span>
              {trx.paymentProofUrl && (
                <a
                  href={trx.paymentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--cms-accent)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Eye size={12} /> Lihat Struk Full ↗
                </a>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {trx.paymentProofUrl ? (
                <a href={trx.paymentProofUrl} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                  <img
                    src={trx.paymentProofUrl}
                    alt="Bukti Transfer"
                    style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--glass-border)' }}
                  />
                </a>
              ) : (
                <div style={{ width: 68, height: 68, borderRadius: 10, background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                  <AlertCircle size={24} />
                </div>
              )}
              <div style={{ flex: 1, fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                <div>Tagihan: <strong style={{ color: 'var(--cms-text)', fontSize: 12.5 }}>{formatRp(trx.grandTotal)}</strong></div>
                <div style={{ marginTop: 2 }}>Tujuan: <strong style={{ color: 'var(--cms-text)' }}>{trx.paymentMethod || 'Rekening Pribadi / e-Wallet'}</strong></div>
                <div style={{ marginTop: 4, color: '#d97706', fontSize: 10.5, lineHeight: 1.35 }}>
                  ⚠️ Buka aplikasi m-Banking/e-Wallet Anda. Pastikan dana sudah masuk efektif sebelum klik Lunas.
                </div>
              </div>
            </div>

            {/* AI Assistant OCR Struk */}
            {trx.paymentProofUrl && (
              <div style={{ marginTop: 10 }}>
                {!aiScanResult && (
                  <button
                    type="button"
                    onClick={handleScanReceipt}
                    disabled={isScanningReceipt}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      background: 'rgba(139, 92, 246, 0.08)',
                      color: '#8b5cf6',
                      fontSize: 11.5,
                      fontWeight: 750,
                      cursor: isScanningReceipt ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {isScanningReceipt ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>AI sedang menganalisis foto struk...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Analisis Bukti Transfer via AI (Cek Nominal Otomatis)</span>
                      </>
                    )}
                  </button>
                )}

                {aiScanResult && (
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: aiScanResult.isAmountMatched ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${aiScanResult.isAmountMatched ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    fontSize: 11,
                    color: aiScanResult.isAmountMatched ? '#10b981' : '#ef4444'
                  }}>
                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      {aiScanResult.isAmountMatched ? <Check size={12} strokeWidth={3} /> : <AlertCircle size={12} />}
                      <span>{aiScanResult.message}</span>
                    </div>
                    {aiScanResult.success && (
                      <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
                        <div>Bank: <strong style={{ color: 'var(--cms-text)' }}>{aiScanResult.detectedBank}</strong></div>
                        <div>Pengirim: <strong style={{ color: 'var(--cms-text)' }}>{aiScanResult.detectedSender}</strong></div>
                        <div>Waktu: <strong style={{ color: 'var(--cms-text)' }}>{aiScanResult.detectedDate}</strong></div>
                        <div>Ref: <strong style={{ color: 'var(--cms-text)' }}>{aiScanResult.refNumber}</strong></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedStatus !== 'lunas' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('lunas');
                  setSelectedStep(isPO ? 2 : 2);
                }}
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                }}
              >
                <Check size={14} strokeWidth={2.8} /> Sudah Cek m-Banking: Dana Masuk (Sahkan Lunas)
              </button>
            )}
          </div>
        )}

        {/* 1. Payment Status Selection */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)', marginBottom: 8 }}>
            1. Status Pembayaran
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]: [string, any]) => {
              const isSelected = selectedStatus === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedStatus(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? cfg.color : 'var(--glass-border)'}`,
                    background: isSelected ? cfg.bg : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                >
                  <span style={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</span>
                  <span style={{ fontWeight: isSelected ? 850 : 600, fontSize: 12, color: isSelected ? cfg.color : 'var(--cms-text)' }}>
                    {cfg.label}
                  </span>
                  {isSelected && (
                    <span style={{ position: 'absolute', right: 10, width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Milestone Tracking Step (1 to 5) */}
        <div style={{ marginBottom: 18, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)' }}>
              2. Tahapan Pelacakan Klien (Step 1–5)
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)', background: 'var(--cms-accent-soft)', padding: '2px 8px', borderRadius: 6 }}>
              Tahap {selectedStep} / 5
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {steps.map(s => {
              const isCurrent = selectedStep === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setSelectedStep(s.step)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: `1.5px solid ${isCurrent ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                    background: isCurrent ? 'var(--cms-accent-soft)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                    color: isCurrent ? '#ffffff' : 'var(--cms-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                    flexShrink: 0,
                    marginTop: 1
                  }}>
                    {s.step}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: isCurrent ? 850 : 650, color: isCurrent ? 'var(--cms-accent)' : 'var(--cms-text)' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                      {s.desc}
                    </div>
                  </div>
                  {isCurrent && (
                    <span style={{ fontSize: 10, fontWeight: 900, background: 'var(--cms-accent)', color: '#fff', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                      Aktif
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Nomor Resi / Tracking Link */}
        <div style={{ marginBottom: 22, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)', marginBottom: 6 }}>
            3. Nomor Resi / Tautan Pengiriman (Opsional)
          </label>
          <input
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            placeholder="Cth: JNE-0123456789 atau https://cekresi..."
            className="cms-input"
            style={{ width: '100%', height: 40, fontSize: 12.5, borderRadius: 10 }}
          />
          <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
            Nomor resi ini akan otomatis tampil di menu pelacakan pesanan customer.
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              color: 'var(--cms-text)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 22px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--cms-accent)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 850,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px var(--cms-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function TransactionManager({ notify, confirm }) {
  const [activeTab, setActiveTab] = useState('transactions');
  const { bindContextMenu, openContextMenu } = useContextMenu();
  const [expandedTrxId, setExpandedTrxId] = useState<string | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('porto_finance_privacy') === 'true';
    } catch {
      return false;
    }
  });

  const maskRp = useCallback((val: number | string) => {
    if (isPrivacyMode) return 'Rp •••••••';
    return formatRp(val);
  }, [isPrivacyMode]);

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
  const [galleryTarget, setGalleryTarget] = useState<'header' | 'footer' | 'bankLogo' | 'productImage' | 'stamp' | null>(null);
  const [targetBankIndex, setTargetBankIndex] = useState<number | null>(null);
  const [isServiceOrderModalOpen, setIsServiceOrderModalOpen] = useState(false);
  const [isRetainerModalOpen, setIsRetainerModalOpen] = useState(false);
  const [qrisModalTrx, setQrisModalTrx] = useState<any>(null);

  const handleGenerateInvoiceFromRetainer = async (retainer: RecurringRetainer) => {
    const today = new Date();
    const periodLabel = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const newTrx = {
      ...EMPTY_TRX,
      id: genId('INV'),
      date: today.toISOString().split('T')[0],
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
      customer: {
        id: '',
        name: retainer.clientName,
        phone: retainer.clientPhone || '',
        email: '',
        address: ''
      },
      items: [
        {
          id: `item_${Date.now()}`,
          name: `${retainer.serviceTitle} (Periode ${periodLabel})`,
          price: retainer.amount,
          qty: 1,
          sku: 'RETAINER'
        }
      ],
      paymentStatus: 'belum',
      notes: `Tagihan Retainer ${retainer.frequency} untuk periode ${periodLabel}.`
    };
    const { grandTotal, remaining } = calcTotals(newTrx);
    newTrx.grandTotal = grandTotal;
    newTrx.remaining = remaining;

    const updated = [newTrx, ...transactions];
    await saveTrx(updated);
    setIsRetainerModalOpen(false);
    notify(`Invoice Retainer periode ${periodLabel} berhasil dibuat (${newTrx.id})!`, 'success');
  };

  useEffect(() => {
    const handleOpenSvcOrder = () => setIsServiceOrderModalOpen(true);
    window.addEventListener('porto_open_service_order_modal', handleOpenSvcOrder);
    return () => window.removeEventListener('porto_open_service_order_modal', handleOpenSvcOrder);
  }, []);

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

  const generateOrderReceiptText = useCallback((trx: any) => {
    const { subtotal, discVal, taxVal, grandTotal, remaining, paid } = calcTotals(trx);
    const bank = invoiceSettings?.banks?.[0] || {
      bankName: 'BCA (Bank Central Asia)',
      accountNumber: '1234567890',
      accountName: invoiceSettings?.shopName || 'sumr.day Studio'
    };

    const statusText = trx.paymentStatus === 'lunas' 
      ? '✅ LUNAS' 
      : (trx.paymentStatus === 'dp' 
        ? '⏳ DP / BERTAHAP' 
        : (trx.paymentStatus === 'quotation' ? '📄 PENAWARAN (QUOTATION)' : '⚠️ BELUM BAYAR'));

    const lines = [
      `*RINCIAN PESANAN & STRUK RESMI*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🆔 *No. Order* : #${trx.id}`,
      `📅 *Tanggal*   : ${formatDate(trx.date)}`,
      `👤 *Klien*     : ${trx.customer?.name || 'Pelanggan'}`,
      trx.customer?.phone ? `📱 *Kontak*    : ${trx.customer.phone}` : null,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*ITEM PESANAN:*`,
      ...(trx.items || []).map((i: any, idx: number) => 
        `${idx + 1}. ${i.name} (${i.qty}x @${formatRp(i.price)}) = ${formatRp(i.qty * i.price)}`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• Subtotal   : ${formatRp(subtotal)}`,
      discVal > 0 ? `• Diskon     : -${formatRp(discVal)}` : null,
      (trx.shipping || 0) > 0 ? `• Ongkir     : +${formatRp(trx.shipping)}` : null,
      taxVal > 0 ? `• PPN 11%    : +${formatRp(taxVal)}` : null,
      (trx.uniqueCode || 0) > 0 ? `• Kode Unik  : +Rp ${trx.uniqueCode}` : null,
      `*TOTAL AKHIR : ${formatRp(grandTotal)}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*STATUS PEMBAYARAN:* ${statusText}`,
      trx.paymentStatus === 'dp' ? `• Terbayar : ${formatRp(paid)}\n• Sisa Tagihan : ${formatRp(remaining)}` : null,
      (trx.paymentStatus !== 'lunas' && trx.paymentStatus !== 'quotation') ? [
        `\n*REKENING TRANSFER RESMI:*`,
        `🏦 Bank     : ${bank.bankName || bank.name || 'BCA'}`,
        `💳 No. Rek  : ${bank.accountNumber || bank.number || '-'}`,
        `👤 A/N      : ${bank.accountName || bank.accountHolder || 'Studio'}`
      ].join('\n') : null,
      trx.trackingNumber ? `\n📦 *No. Resi / Pengiriman*: ${trx.trackingNumber}` : null,
      `\n🔗 *Tautan Pelacakan / Drop-Box*:`,
      `${window.location.origin}/drop/${trx.id}`,
      `\nTerima kasih atas kepercayaannya bersama ${invoiceSettings?.shopName || 'sumr.day Studio'}! ☀️`
    ].filter(Boolean).join('\n');

    return lines;
  }, [invoiceSettings]);

  const generateInvoiceReminderText = useCallback((trx: any) => {
    const { grandTotal, remaining, paid } = calcTotals(trx);
    const bank = invoiceSettings?.banks?.[0] || {
      bankName: 'BCA (Bank Central Asia)',
      accountNumber: '1234567890',
      accountName: invoiceSettings?.shopName || 'sumr.day Studio'
    };

    const isDp = trx.paymentStatus === 'dp';
    const tagihanLabel = isDp ? 'Pelunasan Sisa Pembayaran' : 'Pembayaran Tagihan / Faktur';

    const lines = [
      `Halo kak *${trx.customer?.name || 'Pelanggan'}*, salam hangat dari *${invoiceSettings?.shopName || 'sumr.day Studio'}*! ☀️`,
      ``,
      `Kami menginformasikan terkait tagihan untuk *${tagihanLabel}* dengan rincian:`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🆔 *No. Invoice* : #${trx.id}`,
      `📅 *Tanggal*     : ${formatDate(trx.date)}`,
      (trx.items || []).length > 0 ? `📦 *Pesanan*     : ${(trx.items || []).map((i: any) => `${i.name} (${i.qty}x)`).join(', ')}` : null,
      `💰 *Total Order* : ${formatRp(grandTotal)}`,
      isDp ? `💵 *Terbayar (DP)*: ${formatRp(paid)}` : null,
      `⚠️ *Sisa Tagihan*: *${formatRp(remaining)}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Pembayaran dapat disalurkan melalui rekening resmi studio:`,
      `🏦 *Bank*      : ${bank.bankName || bank.name || 'BCA'}`,
      `💳 *No. Rek*   : ${bank.accountNumber || bank.number || '-'}`,
      `👤 *A/N*       : ${bank.accountName || bank.accountHolder || 'Studio'}`,
      ``,
      `🔗 *Cek Progres & Detail Faktur*:`,
      `${window.location.origin}/drop/${trx.id}`,
      ``,
      `Setelah melakukan pembayaran, mohon konfirmasi kembali ke kami ya kak. Terima kasih banyak atas kerjasamanya! 🙏✨`
    ].filter(Boolean).join('\n');

    return lines;
  }, [invoiceSettings]);

  const getTransactionMenu = (trx) => {
    const { grandTotal, remaining } = calcTotals(trx);
    return {
      title: `Transaksi #${trx.id}`,
      subtitle: `${trx.customer?.name || 'Pelanggan'} · ${formatRp(grandTotal)}`,
      headerBadge: trx.paymentStatus?.toUpperCase(),
      items: [
        {
          label: 'Status',
          icon: <RefreshCw size={15} color="var(--cms-accent)" />,
          action: () => setStatusModal({ trx })
        },
        {
          label: 'SPK',
          icon: <PenTool size={15} color="#ec4899" />,
          action: () => setSpkModalTrx(trx)
        },
        {
          label: 'Kirim WA',
          icon: <MessageCircle size={15} color="#22c55e" />,
          action: () => {
            const { grandTotal, remaining } = calcTotals(trx);
            openWhatsApp(trx.customer?.phone, whatsappTemplates.invoiceOrder({
              customerName: trx.customer?.name || 'Pelanggan',
              orderId: trx.id,
              items: (trx.items || []).map((i: any) => `${i.name} (${i.qty}x)`).join(', ') || 'Layanan Digital',
              grandTotal,
              paymentStatus: trx.paymentStatus,
              remaining,
              bankInfo: invoiceSettings?.banks?.[0] ? `${invoiceSettings.banks[0].name || invoiceSettings.banks[0].bankName} ${invoiceSettings.banks[0].accountNumber} a/n ${invoiceSettings.banks[0].accountName || invoiceSettings.banks[0].accountHolder}` : 'BCA 1234567890 a/n Studio'
            }));
          }
        },
        ...((trx.customer?.phone && trx.paymentStatus !== 'lunas' && trx.paymentStatus !== 'quotation' && remaining > 0) ? [{
          label: 'Ingatkan Tagihan WA',
          icon: <BellRing size={15} color="#f59e0b" />,
          action: () => {
            let clean = (trx.customer.phone || '').replace(/[^0-9]/g, '');
            if (clean.startsWith('0')) clean = '62' + clean.slice(1);
            const msg = encodeURIComponent(generateInvoiceReminderText(trx));
            window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
          }
        }] : []),
        ...(trx.paymentStatus !== 'lunas' ? [{
          label: 'QRIS / Bayar Instan',
          icon: <QrCode size={15} color="var(--cms-accent)" />,
          action: () => setQrisModalTrx(trx)
        }] : []),
        {
          label: 'Drop-Box WA',
          icon: <Upload size={15} color="#3b82f6" />,
          action: () => {
            openWhatsApp(trx.customer?.phone, whatsappTemplates.requestAssetDrop({
              customerName: trx.customer?.name || 'Pelanggan',
              orderId: trx.id,
              projectTitle: (trx.items || []).map((i: any) => i.name).join(', ') || 'Proyek Desain'
            }));
          }
        },
        {
          label: 'Salin Link',
          icon: <Copy size={15} />,
          action: () => {
            const dropUrl = `${window.location.origin}/drop/${trx.id}`;
            navigator.clipboard?.writeText(dropUrl);
            notify('Link Drop-Box disalin');
          }
        },
        {
          label: 'Status & Tahapan',
          icon: <RefreshCw size={15} color="var(--cms-accent)" />,
          action: () => setStatusModal({ trx })
        },
        {
          label: 'SPK Kontrak',
          icon: <PenTool size={15} color="#ec4899" />,
          action: () => setSpkModalTrx(trx)
        },
        {
          label: trx.clientDriveUrl ? 'Buka Client Vault' : 'Buat Client Vault',
          icon: <FolderKanban size={15} color="#3b82f6" />,
          action: () => handleOpenOrCreateClientVault(trx)
        },
        ...(trx.customer?.email ? [{
          label: 'Kirim Invoice Email',
          icon: <Mail size={15} color="#6366f1" />,
          action: () => handleSendInvoiceEmail(trx)
        }] : []),
        {
          label: 'Salin No. Rekening Pribadi',
          icon: <Landmark size={15} color="#0ea5e9" />,
          action: () => {
            const rawBanks = invoiceSettings?.banks && invoiceSettings.banks.length > 0 ? invoiceSettings.banks : [];
            if (rawBanks.length === 0) {
              notify('Belum ada rekening bank yang diatur di pengaturan nota.', 'warning');
              return;
            }
            const txt = rawBanks.map((b: any) => `${b.bankName || b.name}: ${b.accountNumber} (a/n ${b.accountName || b.holder || 'Studio'})`).join('\n');
            navigator.clipboard?.writeText(txt);
            notify('Daftar rekening bank & e-wallet pribadi berhasil disalin!');
          }
        },
        {
          label: 'Salin Ringkasan Struk',
          icon: <Copy size={15} />,
          action: () => handleCopyReceipt(trx)
        },
        {
          label: 'Cetak Nota (PDF)',
          icon: <Download size={15} color="#10b981" />,
          action: () => setPrintingTrx(trx)
        },
        {
          label: 'Edit',
          icon: <Edit3 size={15} />,
          action: () => { setFormData({ ...trx }); setIsNewTrx(false); }
        },
        {
          label: 'Salin ID',
          icon: <Copy size={15} />,
          action: () => {
            navigator.clipboard?.writeText(trx.id);
            notify('ID Transaksi disalin');
          }
        },
        { separator: true },
        {
          label: 'Hapus',
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
  const [isUploadingStamp, setIsUploadingStamp] = useState(false);

  // Modals
  const [statusModal, setStatusModal] = useState<any>(null);
  const [milestoneResiInput, setMilestoneResiInput] = useState('');
  const [printingTrx, setPrintingTrx] = useState(null);
  const [spkModalTrx, setSpkModalTrx] = useState<any>(null);

  useEffect(() => {
    if (statusModal?.trx) {
      setMilestoneResiInput(statusModal.trx.trackingNumber || '');
    }
  }, [statusModal]);

  const headerImgRef = useRef(null);
  const footerImgRef = useRef(null);
  const stampImgRef = useRef(null);

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
        if (spkModalTrx) {
          setSpkModalTrx(null);
        } else if (statusModal) {
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
  }, [statusModal, printingTrx, formData, spkModalTrx]);

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
    try {
      const syncRes = await syncUnifiedStudioData({
        brandName: obj.shopName,
        whatsapp: obj.shopPhone,
        address: obj.shopAddress,
        bankAccounts: (obj.banks || []).map((b: any) => ({
          id: b.id,
          bankName: b.name || b.bankName || 'BCA',
          accountNumber: b.accountNumber,
          accountName: b.accountName || b.accountHolder || obj.shopName || '',
          bankLogo: b.logo || b.bankLogo || '',
          color: b.color || '#003399'
        }))
      }, 'Nota & Invoice');

      if (syncRes && syncRes.notificationText) {
        notify(syncRes.notificationText, 'success');
      } else {
        notify('Pengaturan nota disimpan & tersinkron ke semua modul');
      }
    } catch (err) {
      console.warn('Sync failed:', err);
      notify('Pengaturan nota disimpan');
    }
  }, [notify]);

  const handleOpenOrCreateClientVault = async (trx: any) => {
    if (trx.clientDriveUrl) {
      window.open(trx.clientDriveUrl, '_blank');
      return;
    }
    notify('Menyiapkan Client Vault di Google Drive...', 'info');
    try {
      const res = await googleSync.createClientVault({
        orderId: trx.id,
        clientName: trx.customer?.name || 'Klien',
        clientEmail: trx.customer?.email || ''
      }, notify);
      if (res && res.folderUrl) {
        const updated = transactions.map(t => t.id === trx.id ? { ...t, clientDriveUrl: res.folderUrl } : t);
        await saveTrx(updated);
        window.open(res.folderUrl, '_blank');
      }
    } catch (err: any) {
      notify('Gagal membuat Client Vault: ' + (err?.message || 'Error'), 'error');
    }
  };

  const handleSendInvoiceEmail = async (trx: any) => {
    if (!trx.customer?.email || !trx.customer.email.includes('@')) {
      notify('Alamat email klien belum diatur pada transaksi ini.', 'error');
      return;
    }
    const { grandTotal } = calcTotals(trx);
    notify(`Mengirim invoice ke ${trx.customer.email}...`, 'info');
    try {
      const success = await googleSync.sendEmailNotification({
        to: trx.customer.email,
        clientName: trx.customer?.name || 'Klien',
        orderId: trx.id,
        subject: `Invoice Resmi Pesanan #${trx.id} — sumr.day studio`,
        message: `Terima kasih! Rincian pesanan #${trx.id} Anda telah diperbarui dengan total ${formatRp(grandTotal)}. Status: ${trx.paymentStatus.toUpperCase()}. Tim sumr.day siap memproses pesanan Anda.`
      }, notify);
      if (success) {
        notify(`Email invoice berhasil dikirim ke ${trx.customer.email}`, 'success');
      }
    } catch (err: any) {
      notify('Gagal kirim email: ' + (err?.message || 'Error'), 'error');
    }
  };

  const handleCopyReceipt = useCallback((trx: any) => {
    const text = generateOrderReceiptText(trx);
    navigator.clipboard?.writeText(text);
    notify?.('Ringkasan struk pesanan disalin ke clipboard!', 'success');
  }, [generateOrderReceiptText, notify]);

  const filteredTrx = useMemo(() => transactions.filter(t => {
    const matchStatus = filterStatus === 'all' || t.paymentStatus === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchStatus;

    const cleanQueryDigits = q.replace(/\D/g, '');
    const cleanPhoneDigits = (t.customer?.phone || '').replace(/\D/g, '');
    const matchPhone = cleanQueryDigits && cleanPhoneDigits && cleanPhoneDigits.includes(cleanQueryDigits);

    const matchSearch = 
      t.id?.toLowerCase().includes(q) || 
      t.customer?.name?.toLowerCase().includes(q) ||
      t.customer?.email?.toLowerCase().includes(q) ||
      matchPhone ||
      t.notes?.toLowerCase().includes(q) ||
      t.trackingNumber?.toLowerCase().includes(q) ||
      (t.items || []).some((i: any) => 
        i.name?.toLowerCase().includes(q) || 
        i.sku?.toLowerCase().includes(q)
      );

    return matchStatus && matchSearch;
  }), [transactions, filterStatus, searchQuery]);

  const handleExportExcel = useCallback(async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = [
        'No', 'ID Order', 'Tanggal', 'Nama Pelanggan', 'WhatsApp', 'Email', 'Alamat',
        'Layanan / Produk', 'Subtotal (Rp)', 'Diskon (Rp)', 'PPN 11% (Rp)', 'Ongkir (Rp)',
        'Total Akhir (Rp)', 'Terbayar (Rp)', 'Sisa Piutang (Rp)', 'Status Bayar', 'Catatan'
      ];

      const rows = filteredTrx.map((t, idx) => {
        const { subtotal, discVal, taxVal, grandTotal, remaining, paid } = calcTotals(t);
        const itemsStr = (t.items || []).map((i: any) => `${i.name} (${i.qty}x)`).join('; ');
        return [
          idx + 1,
          t.id,
          t.date || '-',
          t.customer?.name || '-',
          t.customer?.phone || '-',
          t.customer?.email || '-',
          t.customer?.address || '-',
          itemsStr || t.serviceTitle || '-',
          subtotal,
          discVal,
          taxVal,
          t.shipping || 0,
          grandTotal,
          paid,
          remaining,
          t.paymentStatus ? t.paymentStatus.toUpperCase() : '-',
          t.notes || '-'
        ];
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 28 },
        { wch: 32 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Laporan_Keuangan_sumrday_${today}.xlsx`);
      notify?.(`Berhasil mengekspor ${filteredTrx.length} transaksi ke Excel!`, 'success');
    } catch (err: any) {
      console.error('Error exporting transactions excel:', err);
      notify?.('Gagal mengekspor laporan: ' + err?.message, 'error');
    }
  }, [filteredTrx, notify]);

  const stats = useMemo(() => ({
    total: transactions.length,
    perlu_verifikasi: transactions.filter(t => t.paymentStatus === 'perlu_verifikasi').length,
    lunas: transactions.filter(t => t.paymentStatus === 'lunas').length,
    dp: transactions.filter(t => t.paymentStatus === 'dp').length,
    belum: transactions.filter(t => t.paymentStatus === 'belum').length,
    quotation: transactions.filter(t => t.paymentStatus === 'quotation').length,
    totalRevenue: transactions.filter(t => t.paymentStatus === 'lunas').reduce((s, t) => s + (calcTotals(t).grandTotal || 0), 0),
    totalPiutang: transactions.filter(t => t.paymentStatus !== 'lunas').reduce((s, t) => s + (calcTotals(t).remaining || 0), 0),
    totalPPN: transactions.filter(t => t.paymentStatus === 'lunas' && t.tax?.enabled).reduce((s, t) => s + (calcTotals(t).taxVal || 0), 0),
    totalBaseRevenue: transactions.filter(t => t.paymentStatus === 'lunas').reduce((s, t) => s + (calcTotals(t).baseAmount || 0), 0),
    withProof: transactions.filter(t => t.paymentProofUrl || t.driveProofUrl).length,
  }), [transactions]);

  // Dynamic PWA Notification Badge & Tab Title Hack
  useEffect(() => {
    updateAppBadge(stats.perlu_verifikasi, 'Cek Mutasi');
  }, [stats.perlu_verifikasi]);

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
              customerPhone: finalTrx.customer.phone || '',
              customerEmail: finalTrx.customer.email || '',
              customerAddress: finalTrx.customer.address || '',
              items: finalTrx.items.map(i => `${i.name} (${i.qty}x @${formatRp(i.price)})`).join('; '),
              subtotal: subtotal,
              discount: discVal,
              shipping: finalTrx.shipping || 0,
              ppnEnabled: finalTrx.tax?.enabled ? 'YA' : 'TIDAK',
              ppnPercent: finalTrx.tax?.enabled ? (finalTrx.tax.percent || 0) : 0,
              ppnAmount: calcTotals(finalTrx).taxVal || 0,
              grandTotal: finalTrx.grandTotal,
              paymentStatus: finalTrx.paymentStatus,
              paymentMethod: finalTrx.paymentMethod?.bankName || '',
              dpAmount: finalTrx.dpAmount || 0,
              remaining: finalTrx.remaining,
              notes: finalTrx.notes || '',
              source: finalTrx.source || 'admin',
              paymentProofUrl: finalTrx.paymentProofUrl || '',
              driveProofUrl: finalTrx.driveProofUrl || '',
              invoiceDriveUrl: finalTrx.driveUrl || '',
              createdAt: finalTrx.createdAt || finalTrx.date,
            }
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        }).catch(e => console.error("Webhook error:", e));

      } catch (err) {}
    }

    notify(isNew ? 'Transaksi berhasil dibuat' : 'Transaksi diperbarui');
    // Push realtime notification to Firestore on new transaction
    if (isNew) {
      notifyTransaction(finalTrx.customer.name, finalTrx.grandTotal).catch(() => {});
    }
    setFormData(null);
    setShowNewCustomerForm(false);
  };

  const handleUpdateStatus = async (trxId: string, newStatus?: string, dpAmount?: number, milestoneStep?: number, trackingNumber?: string) => {
    const updated = transactions.map(t => {
      if (t.id !== trxId) return t;
      const next = { ...t, updatedAt: new Date().toISOString() };
      if (newStatus) {
        next.paymentStatus = newStatus;
        if (newStatus === 'dp') next.dpAmount = dpAmount || t.dpAmount || 0;
        if (newStatus === 'lunas') { next.dpAmount = next.grandTotal; next.remaining = 0; }
        if (newStatus === 'belum' || newStatus === 'perlu_verifikasi') { next.dpAmount = 0; next.remaining = next.grandTotal; }
        if (newStatus === 'dp') {
          const { remaining } = calcTotals(next);
          next.remaining = remaining;
        }
      }
      if (milestoneStep !== undefined) next.milestoneStep = milestoneStep;
      if (trackingNumber !== undefined) next.trackingNumber = trackingNumber;
      return next;
    });
    await saveTrx(updated);

    // Sync to Google Sheets
    syncToSheet('sync_transactions', updated);

    // Sync to local client orders cache & Firestore porto_orders
    try {
      const mappedStatus = newStatus === 'lunas' ? 'Selesai' : (newStatus === 'dp' ? 'Diproses' : (newStatus === 'perlu_verifikasi' ? 'Verifikasi' : (newStatus === 'belum' ? 'Pending' : undefined)));
      const orderUpdates: any = {};
      if (newStatus) {
        orderUpdates.paymentStatus = newStatus;
        if (newStatus === 'lunas') orderUpdates.assetStatus = 'active';
      }
      if (mappedStatus) orderUpdates.status = mappedStatus;
      if (milestoneStep !== undefined) orderUpdates.milestoneStep = milestoneStep;
      if (trackingNumber !== undefined) orderUpdates.trackingNumber = trackingNumber;

      await updateClientOrder(trxId, orderUpdates);
    } catch (eOrder) {
      console.warn('[TransactionManager] client order sync warning:', eOrder);
    }

    // Sync to service project pipeline (porto_projects)
    try {
      const projs = await storage.getItem<any[]>('porto_projects', []);
      if (Array.isArray(projs) && projs.length > 0) {
        let projChanged = false;
        const updatedProjs = projs.map((p: any) => {
          if (p.id === trxId || p.transactionId === trxId) {
            projChanged = true;
            return {
              ...p,
              paymentStatus: newStatus || p.paymentStatus,
              requiresAcc: newStatus === 'lunas' ? false : p.requiresAcc,
              status: (newStatus === 'lunas' && p.status === 'pending_acc') ? 'todo' : p.status,
              updatedAt: new Date().toISOString()
            };
          }
          return p;
        });
        if (projChanged) {
          await storage.setItem('porto_projects', updatedProjs);
          window.dispatchEvent(new CustomEvent('porto_projects_updated'));
        }
      }
    } catch (eProj) {
      console.warn('[TransactionManager] Project sync warning:', eProj);
    }

    window.dispatchEvent(new CustomEvent('porto_transactions_updated'));
    window.dispatchEvent(new CustomEvent('porto_client_orders_updated'));
    setStatusModal(null);
    notify('Status & tahapan progres berhasil disimpan');
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

        {/* Stats - 1 Baris Persimpel */}
        <div className={`trx-stats-grid ${!showMobileStats ? 'trx-stats-hidden-mobile' : ''}`}>
          {/* 1. Transaksi */}
          <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Transaksi</div>
              <div style={{ color: 'var(--cms-accent)', opacity: 0.8 }}><FileText size={18} /></div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--cms-text)', lineHeight: 1.1 }}>{stats.total}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 10.5, fontWeight: 700, marginTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span title="Lunas" style={{ color: '#10b981' }}>{stats.lunas} Lunas</span>
                <span style={{ opacity: 0.25 }}>·</span>
                <span title="DP" style={{ color: '#f59e0b' }}>{stats.dp} DP</span>
                <span style={{ opacity: 0.25 }}>·</span>
                <span title="Belum" style={{ color: '#ef4444' }}>{stats.belum} Belum</span>
              </div>
              <span title={`Rincian: ${stats.lunas} transaksi lunas, ${stats.dp} termin bertahap, ${stats.belum} belum dibayar.`} style={{ display: 'inline-flex', cursor: 'help', color: 'var(--cms-text-muted)' }}>
                <Info size={13} />
              </span>
            </div>
          </div>

          {/* 2. Pemasukan */}
          <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Pemasukan</div>
              <div style={{ color: '#10b981', opacity: 0.8 }}><CreditCard size={18} /></div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#10b981', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{maskRp(stats.totalRevenue)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 2 }}>
              <span>DPP: <b style={{ color: '#0ea5e9' }}>{maskRp(stats.totalBaseRevenue)}</b></span>
              <span title={`Dasar Pengenaan Pajak (DPP): Akumulasi omset bersih studio sebelum penambahan PPN (${formatRp(stats.totalPPN)}).`} style={{ display: 'inline-flex', cursor: 'help' }}>
                <Info size={13} />
              </span>
            </div>
          </div>

          {/* 3. Piutang */}
          <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Piutang</div>
              <div style={{ color: '#f59e0b', opacity: 0.8 }}><Wallet size={18} /></div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#f59e0b', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{maskRp(stats.totalPiutang)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 2 }}>
              <span>{stats.dp + stats.belum} Tagihan Aktif</span>
              <span title={`Total sisa tagihan dari ${stats.dp} transaksi DP dan ${stats.belum} transaksi yang belum lunas.`} style={{ display: 'inline-flex', cursor: 'help' }}>
                <Info size={13} />
              </span>
            </div>
          </div>

          {/* 4. PPN */}
          <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase' }}>PPN</div>
              <div style={{ color: '#6366f1', opacity: 0.8 }}><Percent size={18} /></div>
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#6366f1', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{maskRp(stats.totalPPN)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 2 }}>
              <span>Tarif 11%</span>
              <span title="Total PPN 11% yang telah ditarik dan terkumpul dari seluruh transaksi berstatus Lunas." style={{ display: 'inline-flex', cursor: 'help' }}>
                <Info size={13} />
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="trx-search-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="cms-input" style={{ paddingLeft: 38, height: 40, width: '100%', borderRadius: 100 }}
            />
          </div>
          <div className="sumr-chip-scroll" style={{ background: 'var(--cms-switcher-bg)', borderRadius: 9999, padding: '3px 4px', flexShrink: 0 }}>
            {[
              { id: 'all', label: 'Semua', count: stats.total, icon: Layers }, 
              { id: 'perlu_verifikasi', label: 'Cek Mutasi', count: stats.perlu_verifikasi, icon: Clock, highlight: stats.perlu_verifikasi > 0 },
              { id: 'lunas', label: 'Lunas', count: stats.lunas, icon: CheckCircle2 }, 
              { id: 'dp', label: 'DP', count: stats.dp, icon: Clock }, 
              { id: 'belum', label: 'Belum', count: stats.belum, icon: AlertCircle },
              { id: 'quotation', label: 'Penawaran', count: stats.quotation, icon: FileText }
            ].map(f => {
              const Icon = f.icon;
              const isActive = filterStatus === f.id;
              const hasAlert = f.highlight && !isActive;
              return (
                <button
                  key={f.id} 
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  title={`${f.label} (${f.count})`}
                  aria-label={`${f.label} (${f.count})`}
                  style={{
                    height: 32,
                    padding: '0 10px',
                    borderRadius: 9999,
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isActive ? 'var(--cms-accent)' : (hasAlert ? 'rgba(217,119,6,0.15)' : 'transparent'),
                    color: isActive ? '#fff' : (hasAlert ? '#d97706' : 'var(--cms-text-muted)'),
                    fontSize: 12,
                    fontWeight: 750,
                    fontFamily: "'Outfit', sans-serif",
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Icon size={13} style={{ flexShrink: 0 }} />
                  <span>{f.label}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 5.5px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(150,150,150,0.15)',
                    color: isActive ? '#fff' : 'inherit'
                  }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Privacy / Incognito Mode Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsPrivacyMode(prev => {
                const next = !prev;
                try { localStorage.setItem('porto_finance_privacy', String(next)); } catch {}
                notify?.(next ? 'Mode Privasi Aktif (Nominal disensor)' : 'Mode Privasi Nonaktif', 'info');
                return next;
              });
            }}
            className="cms-btn"
            style={{
              borderRadius: '50%',
              height: 38,
              width: 38,
              minWidth: 38,
              minHeight: 38,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: isPrivacyMode ? 'rgba(239, 68, 68, 0.12)' : 'var(--cms-switcher-bg)',
              border: isPrivacyMode ? '1.5px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)',
              color: isPrivacyMode ? '#ef4444' : 'var(--cms-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isPrivacyMode ? "Nonaktifkan Mode Privasi (Tampilkan Nominal)" : "Aktifkan Mode Privasi (Sensor Nominal Keuangan)"}
          >
            {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Export to Excel (.xlsx) */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="cms-btn"
            style={{
              borderRadius: '50%',
              height: 38,
              width: 38,
              minWidth: 38,
              minHeight: 38,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Download Laporan Keuangan ke format Excel (.xlsx)"
            aria-label="Download Excel Keuangan"
          >
            <Download size={16} />
          </button>

          {/* Retainer / Recurring Contracts Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsRetainerModalOpen(true)}
            className="cms-btn cms-circle-btn"
            style={{
              borderRadius: '50%',
              width: 38,
              height: 38,
              minWidth: 38,
              minHeight: 38,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              color: '#6366f1',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Kelola Retainer & Tagihan Bulanan Otomatis"
            aria-label="Kelola Retainer & Tagihan Bulanan Otomatis"
          >
            <Repeat size={16} />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData({ ...EMPTY_TRX, id: genId('TRX') });
              setIsNewTrx(true);
              setShowNewCustomerForm(false);
            }}
            className="cms-btn cms-btn-primary"
            style={{ borderRadius: '50%', height: 38, width: 38, minWidth: 38, minHeight: 38, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Tambah Transaksi Baru"
          >
            <Plus size={18} />
          </button>
        </div>

        {filteredTrx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--cms-panel-bg)', borderRadius: 20, border: '1px dashed var(--glass-border)' }}>
            <Receipt size={48} style={{ opacity: 0.12, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>Kosong</h3>
            <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 13 }}>Belum ada data transaksi tercatat.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="trx-table-wrap" style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)' }}>
                      {['ID', 'Tanggal', 'Pelanggan', 'Total', 'Status', 'Sisa', 'Aksi'].map(h => (
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
                                <span title={`Kode unik transfer: Rp ${trx.uniqueCode}`} style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                  {trx.uniqueCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--cms-text-muted)' }}>{formatDate(trx.date)}</td>
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{trx.customer?.name || '-'}</div>
                                {trx.isServiceOrder && (
                                  <span style={{ fontSize: 9.5, fontWeight: 900, padding: '1px 6px', borderRadius: 4, background: 'rgba(var(--cms-accent-rgb), 0.15)', color: 'var(--cms-accent)' }}>
                                    JASA
                                  </span>
                                )}
                                {trx.customerType === 'reseller' && (
                                  <span style={{ fontSize: 9.5, fontWeight: 900, padding: '1px 6px', borderRadius: 4, background: '#f3e8ff', color: '#7e22ce' }}>
                                    RESELLER
                                  </span>
                                )}
                                {(trx.customer?.phone || trx.customer?.email || trx.customer?.address) && (
                                  <div title={`Telepon: ${trx.customer?.phone || '-'}\nEmail: ${trx.customer?.email || '-'}\nAlamat: ${trx.customer?.address || '-'}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)', cursor: 'help' }}>
                                    <Info size={13} />
                                  </div>
                                )}
                              </div>

                              {/* Jasa Details, Google Doc & WhatsApp indicators */}
                              {(trx.serviceTitle || trx.googleDocUrl || trx.briefMode) && (
                                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  {trx.serviceTitle && <span style={{ fontWeight: 600 }}>{trx.serviceTitle}</span>}
                                  {trx.googleDocUrl && (
                                    <a
                                      href={normalizeGoogleDocUrl(trx.googleDocUrl)}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#3b82f6', textDecoration: 'none', fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(59,130,246,0.1)' }}
                                    >
                                      <FileText size={10} /> Google Doc
                                    </a>
                                  )}
                                  {trx.briefMode === 'whatsapp' && (
                                    <span style={{ color: '#15803d', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 5px', borderRadius: 4, background: 'rgba(34,197,94,0.1)' }}>
                                      <MessageCircle size={10} /> Brief via WA
                                    </span>
                                  )}
                                  {trx.accStatus === 'pending' && (
                                    <span style={{ color: '#b45309', fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#fef3c7', fontSize: 10 }}>
                                      ⏳ Butuh ACC Proyek
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '13px 14px', fontWeight: 800, fontSize: 13 }}>{maskRp(grandTotal)}</td>
                          <td style={{ padding: '13px 14px' }}>
                            <div onClick={() => setStatusModal({ trx })} style={{ cursor: 'pointer', display: 'inline-block' }} title="Klik untuk ubah status & tahapan">
                              <StatusBadge status={trx.paymentStatus} milestoneStep={trx.milestoneStep} />
                            </div>
                          </td>
                          <td style={{ padding: '13px 14px', fontSize: 13 }}>
                            {trx.paymentStatus === 'lunas' ? <span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>—</span> : <span style={{ color: '#ef4444', fontWeight: 700 }}>{maskRp(remaining)}</span>}
                          </td>
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {trx.customer?.phone && (
                                <button
                                  type="button"
                                  title="Kirim Struk WhatsApp"
                                  onClick={() => {
                                    let clean = (trx.customer.phone || '').replace(/[^0-9]/g, '');
                                    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                                    const msg = encodeURIComponent(generateOrderReceiptText(trx));
                                    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
                                  }}
                                  style={{ ...S.iconBtn('#22c55e', 'rgba(34,197,94,0.12)') }}
                                >
                                  <MessageCircle size={14} />
                                </button>
                              )}
                              {trx.customer?.phone && trx.paymentStatus !== 'lunas' && trx.paymentStatus !== 'quotation' && remaining > 0 && (
                                <button
                                  type="button"
                                  title="Kirim Pengingat Tagihan (Reminder WA)"
                                  onClick={() => {
                                    let clean = (trx.customer.phone || '').replace(/[^0-9]/g, '');
                                    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
                                    const msg = encodeURIComponent(generateInvoiceReminderText(trx));
                                    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
                                  }}
                                  style={{ ...S.iconBtn('#f59e0b', 'rgba(245,158,11,0.12)') }}
                                >
                                  <BellRing size={14} />
                                </button>
                              )}
                              {trx.paymentStatus !== 'lunas' && (
                                <button
                                  type="button"
                                  title="QRIS & Virtual Account Instan"
                                  onClick={() => setQrisModalTrx(trx)}
                                  style={{ ...S.iconBtn('var(--cms-accent)', 'rgba(var(--cms-accent-rgb), 0.12)') }}
                                >
                                  <QrCode size={14} />
                                </button>
                              )}
                              <button 
                                type="button" 
                                title="Cetak Nota" 
                                onClick={() => setPrintingTrx(trx)} 
                                style={{ ...S.iconBtn('#10b981', 'rgba(16,185,129,0.12)') }}
                              >
                                <Download size={14} />
                              </button>
                              <button 
                                type="button" 
                                title="Edit" 
                                onClick={() => { setFormData({ ...trx }); setIsNewTrx(false); }} 
                                style={{ ...S.iconBtn() }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                title="Menu Transaksi"
                                onClick={(e) => openContextMenu(e, getTransactionMenu(trx))}
                                style={{ ...S.iconBtn('var(--cms-text-muted)', 'var(--cms-switcher-bg)') }}
                              >
                                <MoreHorizontal size={14} />
                              </button>
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
                let cleanPhone = (trx.customer?.phone || '').replace(/[^0-9]/g, '');
                if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

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
                      <div onClick={() => setStatusModal({ trx })} style={{ cursor: 'pointer' }} title="Klik untuk atur status & tahapan">
                        <StatusBadge status={trx.paymentStatus} milestoneStep={trx.milestoneStep} />
                      </div>
                    </div>
                    {/* Card middle: amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total</div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--cms-text)' }}>{maskRp(grandTotal)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tanggal</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(trx.date)}</div>
                      </div>
                      {trx.paymentStatus !== 'lunas' && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Sisa</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>{maskRp(remaining)}</div>
                        </div>
                      )}
                    </div>
                    {/* Action Toolbar: Single Button yang bisa ekspand jadi pill icon-only */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingTop: 4, flexShrink: 0 }}>
                      {expandedTrxId === trx.id ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'var(--cms-switcher-bg)',
                          padding: '3px 8px',
                          borderRadius: 100,
                          border: '1.5px solid var(--cms-accent)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                          animation: 'fadeIn 0.18s ease'
                        }}>
                          {cleanPhone && (
                            <button
                              type="button"
                              title="Kirim Nota via WhatsApp"
                              aria-label="Kirim Nota via WhatsApp"
                              onClick={() => {
                                const msg = encodeURIComponent(generateOrderReceiptText(trx));
                                window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                              }}
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                          {cleanPhone && trx.paymentStatus !== 'lunas' && trx.paymentStatus !== 'quotation' && remaining > 0 && (
                            <button
                              type="button"
                              title="Kirim Reminder Tagihan WA"
                              aria-label="Kirim Reminder Tagihan WA"
                              onClick={() => {
                                const msg = encodeURIComponent(generateInvoiceReminderText(trx));
                                window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                              }}
                              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <BellRing size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Cetak Nota"
                            aria-label="Cetak Nota"
                            onClick={() => setPrintingTrx(trx)}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => { setFormData({ ...trx }); setIsNewTrx(false); }}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', border: '1px solid var(--glass-border)', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            title="Menu Transaksi"
                            aria-label="Menu"
                            onClick={(e) => openContextMenu(e, getTransactionMenu(trx))}
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', border: '1px solid var(--glass-border)', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          <button
                            type="button"
                            title="Tutup Aksi"
                            onClick={() => setExpandedTrxId(null)}
                            style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', color: 'var(--cms-text-muted)', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Tampilkan Aksi & Edit"
                          aria-label="Tampilkan Aksi & Edit"
                          onClick={() => setExpandedTrxId(trx.id)}
                          style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', border: '1px solid var(--glass-border)', borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <SlidersHorizontal size={15} />
                        </button>
                      )}
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
                  { value: 'NEW', label: 'Tambah Klien' },
                  ...combinedCustomers.map(c => ({ 
                    value: c.id, 
                    label: `${c.name}${c.isWebClient ? ' (Web)' : ''}${c.phone ? ` · ${c.phone}` : ''}` 
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
                <button onClick={addItemRow} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', borderRadius: 100, cursor: 'pointer' }} title="Tambah Item"><Plus size={15} /></button>
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
                                            Add-on
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
                                            Add-on
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
                  <PillDatePicker
                    value={formData.mou.date}
                    onChange={dateStr => setFormData(p => ({ ...p, mou: { ...p.mou, date: dateStr } }))}
                    placeholder="Pilih Tanggal Kontrak"
                    accentColor="var(--cms-accent, #7c3aed)"
                  />
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
              <PillDatePicker
                value={formData.date}
                onChange={dateStr => setFormData(p => ({ ...p, date: dateStr }))}
                placeholder="Pilih Tanggal Transaksi"
                accentColor="var(--cms-accent, #7c3aed)"
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
              <h3 style={{ ...S.sectionTitle }}><Truck size={14} color="var(--cms-accent)" /> Pengiriman & Pajak (PPN)</h3>
              <label style={{ ...S.label }}>Ongkos Kirim (Rp)</label>
              <input type="text" value={formatNumber(formData.shipping)} onChange={e => setFormData(p => ({ ...p, shipping: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', borderRadius: 9999, fontSize: 13, marginBottom: 12 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Landmark size={13} color="var(--cms-accent)" /> PPN
                  {globalConfig?.shopSettings?.ppn?.enabled && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 100, marginLeft: 4 }}>Global {globalConfig.shopSettings.ppn.percent}%</span>
                  )}
                </label>
                <input type="checkbox" className="trx-toggle" checked={formData.tax?.enabled || false} onChange={e => setFormData(p => ({ ...p, tax: { ...(p.tax || { percent: globalConfig?.shopSettings?.ppn?.percent || 11 }), enabled: e.target.checked } }))} />
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
                    <label style={{ ...S.label, margin: 0 }}>Daftar Termin</label>
                    <button onClick={() => setFormData(p => ({ ...p, termin: [...(p.termin||[]), { id: genId('TRM'), name: `Termin ${(p.termin?.length||0)+1}`, amount: 0, isPaid: false }] }))} style={{ background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', width: 26, height: 26, borderRadius: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tambah Termin"><Plus size={14} /></button>
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

            {/* ── Bukti Pembayaran (Transfer) ── */}
            <div style={{ ...S.panel }}>
              <h3 style={{ ...S.sectionTitle }}><ImageIcon size={14} color="var(--cms-accent)" /> Bukti Transfer / Pembayaran</h3>
              <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginBottom: 10 }}>
                Upload foto/scan bukti transfer. Akan disimpan & bisa dikirim ke Google Drive untuk arsip pembukuan.
              </div>

              {/* Preview */}
              {(formData.paymentProofUrl) && (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <img
                    src={formData.paymentProofUrl}
                    alt="Bukti Pembayaran"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <a href={formData.paymentProofUrl} target="_blank" rel="noreferrer"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10b981', textDecoration: 'none', border: '1px solid rgba(16,185,129,0.2)' }}
                    ><Eye size={12} /> Lihat Full</a>
                    {formData.driveProofUrl && (
                      <a href={formData.driveProofUrl} target="_blank" rel="noreferrer"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, background: 'rgba(251,191,36,0.1)', color: '#d97706', textDecoration: 'none', border: '1px solid rgba(251,191,36,0.2)' }}
                      ><Cloud size={12} /> Google Drive</a>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, paymentProofUrl: '', driveProofUrl: '' }))}
                      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}
                    ><X size={13} /></button>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {!formData.paymentProofUrl && (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '20px', borderRadius: 12, cursor: 'pointer',
                  border: '2px dashed var(--glass-border)', background: 'var(--cms-switcher-bg)',
                  transition: 'all 0.2s'
                }}>
                  <Upload size={20} color="var(--cms-text-muted)" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Klik untuk upload bukti transfer</span>
                  <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>JPG, PNG, WEBP (maks 10MB)</span>
                  <input
                    type="file" accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      notify('Mengupload bukti pembayaran...');
                      try {
                        // 1. Upload to Cloudinary for preview/storage
                        const res = await uploadToCloudinary(file);
                        const proofUrl = (res?.url || (typeof res === 'string' ? res : ''));
                        if (!proofUrl) { notify('Gagal upload bukti', 'error'); return; }
                        setFormData(p => ({ ...p, paymentProofUrl: proofUrl }));
                        notify('Bukti pembayaran berhasil diupload!');

                        // 2. If Google Drive webhook configured, also push to Drive
                        const webhook = globalConfig?.googleAppsScriptUrl;
                        if (webhook) {
                          notify('Menyimpan bukti ke Google Drive...');
                          try {
                            // Convert to base64
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const b64 = (ev.target?.result as string)?.split(',')[1];
                              if (!b64) return;
                              const driveRes = await fetch(webhook, {
                                method: 'POST',
                                body: JSON.stringify({
                                  action: 'upload_file',
                                  fileName: `BuktiTF_${formData.id || 'TRX'}_${Date.now()}.jpg`,
                                  fileType: 'image/jpeg',
                                  fileBase64: b64
                                })
                              });
                              const driveData = await driveRes.json();
                              if (driveData.status === 'success') {
                                setFormData(p => ({ ...p, driveProofUrl: driveData.url }));
                                notify('Bukti tersimpan di Google Drive!');
                              }
                            };
                            reader.readAsDataURL(file);
                          } catch (_) {}
                        }
                      } catch (err) {
                        notify('Gagal upload: ' + (err?.message || ''), 'error');
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              )}

              {/* If proof already on Drive, show link */}
              {formData.driveProofUrl && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <Cloud size={13} color="#d97706" />
                  <span style={{ flex: 1, color: 'var(--cms-text-muted)' }}>Tersimpan di Google Drive</span>
                  <a href={formData.driveProofUrl} target="_blank" rel="noreferrer" style={{ color: '#d97706', fontWeight: 700, textDecoration: 'none' }}>Buka ↗</a>
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
          <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Katalog</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleImportFromSheet('get_products', savePrd)} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Impor Data"><DownloadCloud size={16} /></button>
            <button onClick={() => setEditingProduct({ ...EMPTY_PRODUCT })} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tambah Produk"><Plus size={16} /></button>
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
          <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Diskon</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleImportFromSheet('get_discounts', saveDiscounts)} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Impor Data"><DownloadCloud size={16} /></button>
            <button onClick={() => setEditingDiscount({ ...EMPTY_DISCOUNT })} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tambah Diskon"><Plus size={16} /></button>
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
          <div><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Kontak</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleImportFromSheet('get_customers', saveCustomers)} className="cms-btn cms-btn-outline" style={{ borderRadius: 100, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Impor Data"><DownloadCloud size={16} /></button>
            <button onClick={() => setEditingCustomer({ ...EMPTY_CUSTOMER })} className="cms-btn cms-btn-primary" style={{ borderRadius: 100, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tambah Kontak"><Plus size={16} /></button>
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
    const activeTplId = invoiceSettings.templateId || 'swiss-minimal';
    const activeTpl = INVOICE_TEMPLATES.find(t => t.id === activeTplId) || INVOICE_TEMPLATES[0];

    return (
      <div style={{ animation: 'cmsFadeIn 0.3s ease', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 840, padding: '0 4px' }}>
          
          {/* Header Judul Halaman */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <LayoutTemplate size={22} />
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Pengaturan Nota</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--cms-text-muted)', fontSize: 13 }}>
              Atur tampilan desain, stempel, rekening pembayaran, dan ketentuan nota.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 1. Template Nota */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Palette size={17} color="var(--cms-accent)" /> Template Nota
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                    Pilih tema warna nota:
                  </p>
                </div>
                {transactions.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setPrintingTrx(transactions[0])} 
                    className="cms-btn cms-btn-outline" 
                    style={{ borderRadius: 10, fontSize: 12, height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Eye size={13} /> Lihat Nota
                  </button>
                )}
              </div>

              {/* Baris Lingkaran Warna - Tanpa Label & Penjelasan, Tidak Penyet di Ponsel */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '4px 0'
              }}>
                {INVOICE_TEMPLATES.map((tpl) => {
                  const isSelected = activeTplId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      title={tpl.name}
                      onClick={() => {
                        const next = { ...invoiceSettings, templateId: tpl.id };
                        setInvoiceSettings(next);
                        saveSettings(next);
                        notify(`Tema: ${tpl.name}`);
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        minHeight: 44,
                        maxWidth: 44,
                        maxHeight: 44,
                        aspectRatio: '1 / 1',
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: tpl.primaryColor,
                        border: isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.22)',
                        boxShadow: isSelected
                          ? '0 0 0 3px var(--cms-accent, #D95629), 0 4px 14px rgba(0,0,0,0.35)'
                          : '0 2px 6px rgba(0,0,0,0.18)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease',
                        transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                        padding: 0
                      }}
                    >
                      {isSelected && (
                        <Check size={20} strokeWidth={3} color="#ffffff" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Stempel Toko */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '20px 22px' }}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={17} color="var(--cms-accent)" /> Stempel Toko
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                  Unggah stempel PNG transparan untuk tanda tangan nota.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {/* Transparency Checkerboard Box */}
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: 14,
                  border: '1.5px dashed var(--glass-border)',
                  background: 'repeating-conic-gradient(rgba(128,128,128,0.2) 0% 25%, transparent 0% 50%) 50% / 12px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {invoiceSettings.stampImage ? (
                    <img
                      src={invoiceSettings.stampImage}
                      alt="Stempel PNG"
                      crossOrigin="anonymous"
                      style={{ width: '85%', height: '85%', objectFit: 'contain', transform: 'rotate(-7deg)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 6, color: 'var(--cms-text-muted)' }}>
                      <Stamp size={24} style={{ opacity: 0.35, margin: '0 auto 2px' }} />
                      <div style={{ fontSize: 9, lineHeight: 1.2 }}>Stempel Standar</div>
                    </div>
                  )}
                  {invoiceSettings.stampImage && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...invoiceSettings, stampImage: '' };
                        setInvoiceSettings(next);
                        saveSettings(next);
                        notify('Stempel kustom dihapus');
                      }}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Hapus Stempel"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Controls */}
                <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => stampImgRef.current?.click()}
                      disabled={isUploadingStamp}
                      className="cms-btn cms-btn-outline"
                      style={{ borderRadius: 10, padding: '0 14px', height: 38, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {isUploadingStamp ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />} Unggah Stempel
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGalleryTarget('stamp');
                        setIsGalleryOpen(true);
                      }}
                      className="cms-btn"
                      style={{ borderRadius: 10, padding: '0 14px', height: 38, fontSize: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    >
                      <ImageIcon size={13} /> Buka Galeri
                    </button>

                    <input
                      ref={stampImgRef}
                      type="file"
                      accept="image/png, image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={e => doUpload(e, setIsUploadingStamp, url => {
                        const next = { ...invoiceSettings, stampImage: url };
                        setInvoiceSettings(next);
                        saveSettings(next);
                        notify('Stempel PNG berhasil diunggah!');
                      })}
                    />
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                    {invoiceSettings.stampImage ? (
                      <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> Stempel aktif pada semua nota
                      </span>
                    ) : (
                      <span>Format PNG transparan resolusi 400×400px.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Ketentuan Nota */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={17} color="var(--cms-accent)" /> Ketentuan Nota
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                    Syarat atau catatan transaksi di bagian bawah nota.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...invoiceSettings, termsText: DEFAULT_INVOICE_TERMS };
                    setInvoiceSettings(next);
                    saveSettings(next);
                    notify('Ketentuan nota di-reset ke standar');
                  }}
                  className="cms-btn cms-btn-outline"
                  style={{ borderRadius: 10, fontSize: 11.5, height: 32, padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  title="Reset ke ketentuan standar"
                >
                  <RefreshCw size={12} /> Reset Default
                </button>
              </div>

              <div style={{ marginBottom: 6 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Teks Ketentuan
                </label>
                <textarea
                  value={invoiceSettings.termsText !== undefined ? invoiceSettings.termsText : DEFAULT_INVOICE_TERMS}
                  onChange={e => setInvoiceSettings(p => ({ ...p, termsText: e.target.value }))}
                  rows={8}
                  className="cms-input"
                  style={{
                    width: '100%',
                    minHeight: 180,
                    borderRadius: 14,
                    padding: '14px 16px',
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    border: '1.5px solid var(--glass-border)',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Tuliskan syarat transaksi, garansi, atau catatan nota..."
                />
              </div>
            </div>

            {/* 4. Rekening Bank */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Landmark size={17} color="var(--cms-accent)" /> Rekening Bank
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--cms-text-muted)' }}>
                    Daftar rekening transfer untuk pembayaran nota.
                  </p>
                </div>
                <button 
                  onClick={() => setInvoiceSettings(p => ({ ...p, banks: [...(p.banks || []), { id: genId('BNK'), name: '', accountNumber: '', accountName: '', logo: '' }] }))} 
                  className="cms-btn cms-btn-outline" 
                  style={{ borderRadius: 10, fontSize: 12, height: 34, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }} 
                  title="Tambah Rekening"
                >
                  <Plus size={14} /> Tambah Rekening
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                {(invoiceSettings.banks || []).map((b, i) => (
                  <div key={b.id} className="trx-bank-row" style={{ alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ position: 'relative', width: 54, height: 54, borderRadius: 12, background: 'var(--cms-panel-bg)', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
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
                        style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Galeri
                      </button>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Nama Bank</label>
                      <input value={b.name} onChange={e => {
                        const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === i ? { ...bk, name: e.target.value } : bk);
                        setInvoiceSettings(p => ({ ...p, banks: newBanks }));
                      }} className="cms-input" style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 13 }} placeholder="BCA / Mandiri / Dana" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>No. Rekening</label>
                      <input value={b.accountNumber} onChange={e => {
                        const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === i ? { ...bk, accountNumber: e.target.value } : bk);
                        setInvoiceSettings(p => ({ ...p, banks: newBanks }));
                      }} className="cms-input" style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 13 }} placeholder="1234567890" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Atas Nama</label>
                      <input value={b.accountName} onChange={e => {
                        const newBanks = (invoiceSettings.banks || []).map((bk, bi) => bi === i ? { ...bk, accountName: e.target.value } : bk);
                        setInvoiceSettings(p => ({ ...p, banks: newBanks }));
                      }} className="cms-input" style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 13 }} placeholder="Nama Pemilik" />
                    </div>
                    <button onClick={() => setInvoiceSettings(p => ({ ...p, banks: p.banks.filter(x => x.id !== b.id) }))} style={{ ...S.iconBtn('#ef4444', 'rgba(239,68,68,0.1)'), width: 38, height: 44, borderRadius: 10 }} title="Hapus Rekening"><Trash2 size={14} /></button>
                  </div>
                ))}
                {(!invoiceSettings.banks || invoiceSettings.banks.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '18px', color: 'var(--cms-text-muted)', fontSize: 12.5, border: '1px dashed var(--glass-border)', borderRadius: 12 }}>Belum ada informasi rekening bank.</div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Pajak PPN (%)</label>
                <input type="text" value={formatNumber(invoiceSettings.taxPercent || 0)} onChange={e => setInvoiceSettings(p => ({ ...p, taxPercent: parseNumber(e.target.value) }))} className="cms-input" style={{ width: '100%', height: 44, borderRadius: 10, maxWidth: 200, fontSize: 13 }} placeholder="0" />
              </div>
            </div>

            {/* 5. Header Nota */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '20px 22px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={17} color="var(--cms-accent)" /> Header Nota
              </h3>
              {invoiceSettings.headerImage && (
                <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                  <img src={invoiceSettings.headerImage} alt="Header" crossOrigin="anonymous" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setInvoiceSettings(p => ({ ...p, headerImage: '' }))} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => headerImgRef.current?.click()} disabled={isUploadingHeader} className="cms-btn cms-btn-outline" style={{ borderRadius: 10, padding: '0 14px', height: 40, fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isUploadingHeader ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />} Unggah Header
                </button>
                <button 
                  type="button" 
                  onClick={() => { setGalleryTarget('header'); setIsGalleryOpen(true); }} 
                  className="cms-btn" 
                  style={{ borderRadius: 10, padding: '0 14px', height: 40, fontSize: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={13} /> Buka Galeri
                </button>
                <input ref={headerImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, setIsUploadingHeader, url => {
                  const nextSettings = { ...invoiceSettings, headerImage: url };
                  setInvoiceSettings(nextSettings);
                  saveSettings(nextSettings);
                })} />
                <input value={invoiceSettings.headerText || ''} onChange={e => setInvoiceSettings(p => ({ ...p, headerText: e.target.value }))} placeholder="Teks banner header (opsional)" className="cms-input" style={{ flex: '1 1 180px', minWidth: 160, borderRadius: 10, height: 40 }} />
              </div>
            </div>

            {/* 6. Footer Nota */}
            <div style={{ background: 'var(--cms-panel-bg)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '20px 22px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenTool size={17} color="var(--cms-accent)" /> Footer Nota
              </h3>
              {invoiceSettings.footerImage && (
                <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                  <img src={invoiceSettings.footerImage} alt="Footer" crossOrigin="anonymous" style={{ width: '100%', maxHeight: 110, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setInvoiceSettings(p => ({ ...p, footerImage: '' }))} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => footerImgRef.current?.click()} disabled={isUploadingFooter} className="cms-btn cms-btn-outline" style={{ borderRadius: 10, padding: '0 14px', height: 40, fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isUploadingFooter ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={13} />} Unggah Footer
                </button>
                <button 
                  type="button" 
                  onClick={() => { setGalleryTarget('footer'); setIsGalleryOpen(true); }} 
                  className="cms-btn" 
                  style={{ borderRadius: 10, padding: '0 14px', height: 40, fontSize: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: '1px solid var(--cms-accent-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}
                >
                  <ImageIcon size={13} /> Buka Galeri
                </button>
                <input ref={footerImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => doUpload(e, setIsUploadingFooter, url => {
                  const nextSettings = { ...invoiceSettings, footerImage: url };
                  setInvoiceSettings(nextSettings);
                  saveSettings(nextSettings);
                })} />
                <input value={invoiceSettings.footerText || ''} onChange={e => setInvoiceSettings(p => ({ ...p, footerText: e.target.value }))} placeholder="Teks penutup / terima kasih" className="cms-input" style={{ flex: '1 1 180px', minWidth: 160, borderRadius: 10, height: 40 }} />
              </div>
            </div>

            {/* Tombol Simpan Pengaturan */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {transactions.length > 0 && (
                <button onClick={() => setPrintingTrx(transactions[0])} className="cms-btn cms-btn-outline" style={{ borderRadius: 12, padding: '0 20px', height: 44, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Eye size={15} /> Lihat Nota
                </button>
              )}
              <button onClick={() => saveSettings(invoiceSettings)} className="cms-btn cms-btn-primary" style={{ borderRadius: 12, padding: '0 28px', height: 44, fontSize: 13, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Save size={15} /> Simpan Pengaturan
              </button>
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
        .trx-tab { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; padding:0; border-radius:9999px; border:none; cursor:pointer; transition:all 0.2s; flex-shrink:0; }
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

        /* Stats Grid - 1 Row Clean Layout */
        .trx-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
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

          /* Search bar: responsive flex */
          .trx-search-bar {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 8px !important;
          }
          .trx-search-bar > div:first-child {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .trx-search-bar > div:nth-child(2) {
            flex: 1 1 auto !important;
            display: flex !important;
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
            scrollbar-width: none !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .trx-search-bar > button {
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
            min-height: 38px !important;
            padding: 0 !important;
            justify-content: center !important;
            border-radius: 9999px !important;
            flex-shrink: 0 !important;
          }
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
            width: 38px !important; 
            padding: 0 !important; 
            height: 38px !important;
            flex-shrink: 0;
            justify-content: center;
          }

          /* Content */
          .trx-content-area { padding: 14px 16px; }

          /* Stats: 2 columns on tablet */
          .trx-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }

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
            <p style={{ margin: '2px 0 0', color: 'var(--cms-text-muted)', fontSize: 13 }}>Arus Kas</p>
          </div>
        </div>

        {!formData && (
          <div className="trx-tabs-wrap">
            {TABS.map(tab => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`trx-tab ${activeTab === tab.id ? 'trx-tab-active' : 'trx-tab-inactive'}`}
                title={tab.label}
                aria-label={tab.label}
              >
                {tab.icon}
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
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
        <TrxStatusModal
          trx={statusModal.trx}
          STATUS_CONFIG={STATUS_CONFIG}
          onClose={() => setStatusModal(null)}
          onSave={async (trxId, newStatus, dpAmount, milestoneStep, trackingNumber) => {
            await handleUpdateStatus(trxId, newStatus, dpAmount, milestoneStep, trackingNumber);
          }}
        />
      )}

      {printingTrx && <InvoicePrintView 
        trx={printingTrx} 
        settings={invoiceSettings} 
        onClose={() => setPrintingTrx(null)} 
        notify={notify} 
        globalConfig={globalConfig || {}} 
        onGoToSettings={() => {
          setPrintingTrx(null);
          setActiveTab('settings');
        }}
        onUploadSuccess={async (url) => {
          const updated = transactions.map(t => t.id === printingTrx.id ? { ...t, driveUrl: url } : t);
          await saveTrx(updated);
          const effectiveWebhook = globalConfig?.googleAppsScriptUrl;
          if (effectiveWebhook) {
            const finalTrx = updated.find(t => t.id === printingTrx.id);
            const { subtotal: st, discVal: dv, taxVal: tv } = calcTotals(finalTrx);
            fetch(effectiveWebhook, {
              method: 'POST',
              body: JSON.stringify({
                action: 'sync_transactions',
                sheetId: globalConfig?.googleSheetId,
                payload: {
                  id: finalTrx.id,
                  date: finalTrx.date,
                  customerName: finalTrx.customer.name,
                  customerPhone: finalTrx.customer.phone || '',
                  customerEmail: finalTrx.customer.email || '',
                  customerAddress: finalTrx.customer.address || '',
                  items: finalTrx.items.map(i => `${i.name} (${i.qty}x @${formatRp(i.price)})`).join('; '),
                  subtotal: st,
                  discount: dv,
                  shipping: finalTrx.shipping || 0,
                  ppnEnabled: finalTrx.tax?.enabled ? 'YA' : 'TIDAK',
                  ppnPercent: finalTrx.tax?.enabled ? (finalTrx.tax.percent || 0) : 0,
                  ppnAmount: tv || 0,
                  grandTotal: finalTrx.grandTotal,
                  paymentStatus: finalTrx.paymentStatus,
                  paymentMethod: finalTrx.paymentMethod?.bankName || '',
                  dpAmount: finalTrx.dpAmount || 0,
                  remaining: finalTrx.remaining,
                  notes: finalTrx.notes || '',
                  source: finalTrx.source || 'admin',
                  paymentProofUrl: finalTrx.paymentProofUrl || '',
                  driveProofUrl: finalTrx.driveProofUrl || '',
                  invoiceDriveUrl: url,
                  createdAt: finalTrx.createdAt || finalTrx.date,
                }
              }),
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            }).catch(() => {});
          }
        }}
      />}

      {spkModalTrx && (
        <ContractSpkModal
          initialData={{
            orderId: spkModalTrx.id,
            clientName: spkModalTrx.customer?.name || '',
            clientCompany: '',
            clientPhone: spkModalTrx.customer?.phone || '',
            clientEmail: spkModalTrx.customer?.email || '',
            projectName: (spkModalTrx.items || []).map((i: any) => i.name).join(', ') || `Proyek Order #${spkModalTrx.id}`,
            projectScope: (spkModalTrx.items || []).map((i: any) => `• ${i.name} (${i.qty || 1}x)`).join('\n') || 'Pengerjaan aset kreatif & visual digital sesuai brief.',
            totalAmount: spkModalTrx.grandTotal || calcTotals(spkModalTrx).grandTotal || 0,
            dpAmount: spkModalTrx.dpAmount || 0,
            completionDays: 7,
            maxRevisions: 2
          }}
          onClose={() => setSpkModalTrx(null)}
          notify={notify}
        />
      )}

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
          } else if (galleryTarget === 'stamp') {
            const next = { ...invoiceSettings, stampImage: url };
            setInvoiceSettings(next);
            saveSettings(next);
            notify('Stempel resmi PNG dipilih dari galeri');
          } else if (galleryTarget === 'productImage') {
            setEditingProduct(p => ({ ...p, image: url }));
          }
          setIsGalleryOpen(false);
          setGalleryTarget(null);
        }}
      />

      {isServiceOrderModalOpen && (
        <ServiceOrderModal
          isOpen={isServiceOrderModalOpen}
          onClose={() => setIsServiceOrderModalOpen(false)}
          notify={notify}
        />
      )}

      {isRetainerModalOpen && (
        <RecurringRetainerModal
          isOpen={isRetainerModalOpen}
          onClose={() => setIsRetainerModalOpen(false)}
          notify={notify}
          onGenerateInvoice={handleGenerateInvoiceFromRetainer}
        />
      )}

      {qrisModalTrx && (
        <QrisSimulatorModal
          isOpen={Boolean(qrisModalTrx)}
          onClose={() => setQrisModalTrx(null)}
          transaction={qrisModalTrx}
          onPaymentSuccess={(trxId) => handleUpdateStatus(trxId, 'lunas')}
          notify={notify}
        />
      )}
    </div>
  );
}
