import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MessageCircle, Send, Copy, Plus, Trash2, Edit3, RotateCcw, 
  Sparkles, Check, CheckCheck, Phone, User, DollarSign, 
  CheckCircle2, Search, Save, Zap, Tag
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { useBusinessProfile, formatWhatsAppNumber } from '../../hooks/useBusinessProfile';
import { haptic } from '../../utils/haptics';

export interface WhatsAppTemplateItem {
  id: string;
  shortcut: string;
  category: 'welcome' | 'billing' | 'progress' | 'handover' | 'review';
  title: string;
  description: string;
  content: string;
  isCustom?: boolean;
}

// ── Default Template & Pintasan WA Studio (Judul 1-2 Kata) ──
export const DEFAULT_WA_TEMPLATES: WhatsAppTemplateItem[] = [
  {
    id: 'tpl-welcome-intro',
    shortcut: '/halo',
    category: 'welcome',
    title: 'Salam Kenal',
    description: 'Pesan sambutan calon klien baru.',
    content: `*HALO KAK {nama_klien}! SELAMAT DATANG DI {nama_studio}* ✨

Terima kasih banyak sudah menghubungi kami. Kami adalah studio desain & digital yang siap membantu mewujudkan visual brand dan website impian Anda.

Agar kami dapat memberikan solusi dan estimasi biaya yang paling tepat, boleh ceritakan sedikit tentang:
1. Jenis kebutuhan (Logo / Website / Kemasan / Desain Promosi)
2. Target peluncuran proyek
3. Referensi gaya visual yang disukai (jika ada)

Katalog & estimasi harga awal juga dapat dicek langsung di sini:
👉 {link_portal}

Senang sekali bisa terhubung dengan Kak {nama_klien}! 🙏`
  },
  {
    id: 'tpl-welcome-after-hours',
    shortcut: '/jamkerja',
    category: 'welcome',
    title: 'Luar Jam',
    description: 'Balasan otomatis malam hari/libur.',
    content: `*TERIMA KASIH TELAH MENGHUBUNGI {nama_studio}* 🌙

Halo Kak {nama_klien}! Pesan Anda telah kami terima dengan baik. Saat ini tim kami sedang di luar jam operasional studio (Senin - Sabtu, 09:00 - 18:00 WIB).

Kami akan membalas dan mereview kebutuhan Anda segera saat jam operasional kembali aktif besok pagi.

Sembari menunggu, Kakak bisa melihat portofolio karya terbaru kami di:
👉 {link_portal}

Terima kasih atas kesabarannya, selamat beristirahat! ✨`
  },
  {
    id: 'tpl-billing-invoice-dp',
    shortcut: '/dp',
    category: 'billing',
    title: 'Invoice DP',
    description: 'Rincian tagihan termin pertama.',
    content: `*INVOICE PEMESANAN PROYEK - {nama_studio}* 📋
Kepada Yth. *Kak {nama_klien}*

Berikut rincian tagihan pemesanan Anda:
• No. Pesanan: *#{id_pesanan}*
• Layanan: *{nama_proyek}*
• Skema Bayar: *DP 50% (Uang Muka)*
• Nominal DP: *Rp {nominal_tagihan}*

💳 *Informasi Rekening Pembayaran Resmi:*
• Bank: *{nama_bank}*
• No. Rekening: *{nomor_rekening}*
• Atas Nama: *{nama_studio}*

Silakan kirimkan bukti transfer di chat ini atau unggah di portal akun Anda. Setelah pembayaran diverifikasi, proyek langsung dijadwalkan ke antrean pengerjaan tim. Terima kasih! 🙏`
  },
  {
    id: 'tpl-billing-dp-received',
    shortcut: '/terimadp',
    category: 'billing',
    title: 'Konfirmasi DP',
    description: 'Pemberitahuan proyek mulai masuk antrean.',
    content: `*PEMBAYARAN DIVERIFIKASI & PROYEK DIMULAI* 🚀
Halo Kak {nama_klien}!

Kabar baik, pembayaran DP untuk pesanan *#{id_pesanan}* (*{nama_proyek}*) telah kami terima dan diverifikasi lunas.

📅 *Rincian Jadwal Pengerjaan:*
• Status: *Masuk Antrean Produksi Tim*
• Target Draf Konsep / Deadline: *{deadline}*

Pantau linimasa perkembangan proyek secara real-time di portal klien Anda:
👉 {link_portal}

Tim kami akan segera memberikan update saat draf konsep awal siap ditinjau. Semangat berkarya! 🔥`
  },
  {
    id: 'tpl-billing-reminder',
    shortcut: '/pelunasan',
    category: 'billing',
    title: 'Pelunasan',
    description: 'Penagihan pelunasan sebelum rilis file final.',
    content: `*PEMBERITAHUAN PELUNASAN PROYEK - {nama_studio}* 📄
Halo Kak {nama_klien},

Pengerjaan proyek *{nama_proyek}* (*#{id_pesanan}*) telah selesai dikerjakan dan disetujui.

Untuk penyerahan seluruh *Master File Resolusi Tinggi (.AI, .EPS, .SVG, .PDF Cetak)* dan hak kepemilikan penuh, silakan menyelesaikan sisa pelunasan:

• Sisa Tagihan: *Rp {sisa_tagihan}*
• Rekening: *{nama_bank}* (*{nomor_rekening}*) a.n *{nama_studio}*

Setelah pelunasan terverifikasi, gembok master file di Brand Vault Anda akan langsung terbuka otomatis. Terima kasih atas kerja samanya! ✨`
  },
  {
    id: 'tpl-billing-bank-info',
    shortcut: '/rek',
    category: 'billing',
    title: 'Rekening Bank',
    description: 'Rincian cepat nomor rekening studio.',
    content: `*REKENING PEMBAYARAN RESMI {nama_studio}* 🏛️

Berikut informasi rekening resmi studio kami:
• Bank: *{nama_bank}*
• No. Rekening: *{nomor_rekening}*
• Atas Nama: *{nama_studio}*

Mohon lampirkan tangkapan layar bukti transfer setelah melakukan pembayaran agar segera kami verifikasi ya Kak. Terima kasih! 🙏`
  },
  {
    id: 'tpl-progress-asset-drop',
    shortcut: '/brief',
    category: 'progress',
    title: 'Kirim Bahan',
    description: 'Permintaan aset foto/teks ke portal upload.',
    content: `*PERMINTAAN MATERI & ASET PROYEK* 📂
Halo Kak {nama_klien}!

Agar pengerjaan *{nama_proyek}* (*#{id_pesanan}*) dapat segera dimulai dengan lancar, mohon bantuannya untuk mengunggah materi berkas mentah (logo, teks brief, foto resolusi tinggi, atau referensi):

👉 *Tautan Drop-Box Klien:*
{link_portal}

Berkas yang diunggah akan langsung tersimpan aman di server penyimpanan studio kami. Jika ada kendala mengunggah, materi juga bisa dikirimkan langsung di chat ini ya Kak. Terima kasih! 🙏`
  },
  {
    id: 'tpl-progress-proofing-ready',
    shortcut: '/preview',
    category: 'progress',
    title: 'Review Draf',
    description: 'Draf konsep selesai dan siap ditinjau.',
    content: `*DRAF DESAIN SUDAH SIAP DITINJAU!* 🎨
Halo Kak {nama_klien}!

Kabar gembira, draf konsep desain untuk proyek *{nama_proyek}* (*#{id_pesanan}*) telah selesai dikerjakan oleh tim kreatif kami.

Kakak bisa melihat pratinjau resolusi tinggi dan memberikan catatan revisi interaktif langsung di canvas review kami:
👉 {link_proofing}

Silakan dicek dan beri tahu kami jika ada detail yang ingin disesuaikan ya Kak. Kami siap menyempurnakannya! ✨`
  },
  {
    id: 'tpl-progress-revision-received',
    shortcut: '/revisi',
    category: 'progress',
    title: 'Proses Revisi',
    description: 'Masukan revisi sedang diproses tim.',
    content: `*CATATAN REVISI DITERIMA & SEDANG DIPROSES* ✍️
Halo Kak {nama_klien}!

Catatan revisi untuk proyek *{nama_proyek}* telah kami pelajari bersama tim. Masukan Kakak sangat jelas dan membantu kami mempertajam konsep desain.

Tim kami sedang melakukan penyesuaian sesuai poin-poin yang diminta. Kami akan mengirimkan update versi perbaikan segera.

Terima kasih banyak atas kerjasamanya yang komunikatif! 🙏`
  },
  {
    id: 'tpl-handover-complete',
    shortcut: '/master',
    category: 'handover',
    title: 'Serah Terima',
    description: 'Akses unduh master file Brand Vault.',
    content: `*SELAMAT! PROYEK TELAH SELESAI SEMPURNA* 🏆
Kepada Yth. *Kak {nama_klien}*

Seluruh rangkaian pengerjaan *{nama_proyek}* (*#{id_pesanan}*) telah resmi rampung dan diserahterimakan.

Semua berkas master (*Vector AI, SVG, PDF Print-Ready, Font, dan Preview PNG/JPG*) kini sudah siap diunduh kapan saja melalui Brand Vault akun Anda:
👉 {link_portal}

Tautan penyimpanan ini aktif permanen sebagai cadangan aman jika sewaktu-waktu Kakak membutuhkan file master kembali.

Sebuah kehormatan besar bagi *{nama_studio}* dapat menjadi bagian dari perjalanan bisnis Anda. Sukses selalu untuk usahanya! 🚀`
  },
  {
    id: 'tpl-review-request',
    shortcut: '/ulasan',
    category: 'review',
    title: 'Minta Ulasan',
    description: 'Undangan testimoni review singkat.',
    content: `*BANTU KAMI DENGAN 1 MENIT ULASAN KAK {nama_klien}?* ⭐

Halo Kak {nama_klien}! Bagaimana kepuasan Anda terhadap hasil pengerjaan *{nama_proyek}* dari tim *{nama_studio}*?

Ulasan dan masukan dari Kakak sangat berarti bagi perkembangan studio kami agar terus menghadirkan karya yang semakin baik.

Jika Kakak puas dengan hasil dan pelayanan kami, bolehkah meminta 1 menit waktunya untuk meninggalkan ulasan singkat di tautan ini?
👉 {link_portal}/feedback

Sebagai tanda terima kasih, Kakak akan mendapatkan voucher diskon 15% untuk pemesanan proyek berikutnya. Terima kasih banyak Kak! ❤️`
  },
  {
    id: 'tpl-review-retainer-offer',
    shortcut: '/retainer',
    category: 'review',
    title: 'Paket Retainer',
    description: 'Kemitraan desain bulanan hemat 30%.',
    content: `*PENAWARAN KHUSUS KEMITRAAN BULANAN (RETAINER)* 💼
Halo Kak {nama_klien}! Semoga bisnis dan aktivitasnya semakin berkembang pesat.

Melihat kecocokan kolaborasi kita pada proyek *{nama_proyek}* sebelumnya, kami ingin menawarkan paket *Retainer Desain Bulanan* khusus untuk brand Anda:

✨ *Keuntungan Retainer sumr.day:*
• Prioritas antrean pengerjaan (Dedicated Designer)
• Kuota desain berkala tanpa perlu invoice berulang
• Penghematan biaya hingga 30% dibanding tarif per-proyek

Detail paket retainer dapat didiskusikan santai di chat ini jika Kakak berminat. Sukses selalu! 🌟`
  }
];

// ── Kategori Minimalis (1 Kata & Icon) ──
const CATEGORY_TABS = [
  { id: 'all', label: 'Semua', icon: <Tag size={13} /> },
  { id: 'welcome', label: 'Sambutan', icon: <User size={13} /> },
  { id: 'billing', label: 'Tagihan', icon: <DollarSign size={13} /> },
  { id: 'progress', label: 'Progres', icon: <Sparkles size={13} /> },
  { id: 'handover', label: 'Final', icon: <CheckCircle2 size={13} /> },
  { id: 'review', label: 'Ulasan', icon: <MessageCircle size={13} /> },
];

// ── Variabel Dinamis Minimalis (1 Kata) ──
const AVAILABLE_VARIABLES = [
  { key: '{nama_klien}', label: 'Klien' },
  { key: '{nama_proyek}', label: 'Proyek' },
  { key: '{id_pesanan}', label: 'Order' },
  { key: '{nominal_tagihan}', label: 'Nominal' },
  { key: '{sisa_tagihan}', label: 'Sisa' },
  { key: '{deadline}', label: 'Deadline' },
  { key: '{link_portal}', label: 'Portal' },
  { key: '{link_proofing}', label: 'Proofing' },
  { key: '{nama_bank}', label: 'Bank' },
  { key: '{nomor_rekening}', label: 'Rekening' },
  { key: '{nama_studio}', label: 'Studio' },
];

export const WhatsAppStudio: React.FC = () => {
  const { profile: businessProfile } = useBusinessProfile();
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCleanId, setCopiedCleanId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedShortcut, setCopiedShortcut] = useState<string | null>(null);

  // Deteksi Realtime Light Mode vs Dark Mode
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-cms-theme') === 'light' || 
           document.documentElement.getAttribute('data-theme') === 'light' ||
           document.documentElement.classList.contains('light');
  });

  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.documentElement.getAttribute('data-cms-theme') === 'light' || 
                      document.documentElement.getAttribute('data-theme') === 'light' ||
                      document.documentElement.classList.contains('light');
      setIsLightMode(isLight);
    };

    const handleThemeChange = (e: any) => {
      if (e?.detail?.isDark !== undefined) {
        setIsLightMode(!e.detail.isDark);
      } else {
        checkTheme();
      }
    };

    window.addEventListener('cms_theme_changed', handleThemeChange);
    window.addEventListener('website_theme_changed', handleThemeChange);

    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-cms-theme', 'class', 'data-theme'] });

    return () => {
      window.removeEventListener('cms_theme_changed', handleThemeChange);
      window.removeEventListener('website_theme_changed', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editShortcut, setEditShortcut] = useState('');
  const [editCategory, setEditCategory] = useState<WhatsAppTemplateItem['category']>('welcome');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');

  // Simulator target state
  const [simClientName, setSimClientName] = useState('Budi Pratama');
  const [simProjectName, setSimProjectName] = useState('Identitas Visual & Web Modern');
  const [simTargetPhone, setSimTargetPhone] = useState('');
  const [simOrderId, setSimOrderId] = useState('ORD-7821');
  const [simAmount, setSimAmount] = useState('3.500.000');
  const [simRemaining, setSimRemaining] = useState('1.750.000');
  const [simDeadline, setSimDeadline] = useState('28 Oktober 2026');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Nilai Dinamis Otomatis untuk Studio & Link
  const studioOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sumr.day';
  const autoStudioName = businessProfile?.studioName || 'sumr.day';
  const primaryBank = businessProfile?.banks?.[0] || { bankName: 'BCA', accountNumber: '123-456-7890' };

  // Helper compiler otomatis yang menggantikan {nama_studio}, {link_portal}, dll.
  const resolveStudioAutoTags = (raw: string) => {
    return raw
      .replaceAll('{nama_studio}', autoStudioName)
      .replaceAll('{link_portal}', `${studioOrigin}/client`)
      .replaceAll('{link_proofing}', `${studioOrigin}/client?tab=tracker`)
      .replaceAll('{nama_bank}', primaryBank.bankName || 'BCA')
      .replaceAll('{nomor_rekening}', primaryBank.accountNumber || '123-456-7890');
  };

  // Load templates from storage with fallback
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const stored = await storage.getItem<WhatsAppTemplateItem[]>('porto_wa_templates', []);
        if (Array.isArray(stored) && stored.length > 0) {
          const merged = stored.map(item => {
            if (!item.shortcut) {
              const def = DEFAULT_WA_TEMPLATES.find(d => d.id === item.id);
              return { ...item, shortcut: def?.shortcut || '/pesan' };
            }
            return item;
          });
          setTemplates(merged);
          setSelectedTemplateId(merged[0].id);
        } else {
          setTemplates(DEFAULT_WA_TEMPLATES);
          setSelectedTemplateId(DEFAULT_WA_TEMPLATES[0].id);
        }
      } catch {
        setTemplates(DEFAULT_WA_TEMPLATES);
        setSelectedTemplateId(DEFAULT_WA_TEMPLATES[0].id);
      }
    };
    loadTemplates();
  }, []);

  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0] || null;
  }, [templates, selectedTemplateId]);

  // Sync edit form when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      setEditTitle(selectedTemplate.title);
      setEditShortcut(selectedTemplate.shortcut || '/pesan');
      setEditCategory(selectedTemplate.category);
      setEditDescription(selectedTemplate.description);
      setEditContent(selectedTemplate.content);
      setIsEditing(false);
    }
  }, [selectedTemplate]);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory;
      const matchSearch = searchQuery.trim() === '' || 
        (t.shortcut && t.shortcut.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templates, activeCategory, searchQuery]);

  // Dynamic variable replacement engine untuk simulasi live chat
  const compiledMessage = useMemo(() => {
    if (!selectedTemplate) return '';
    const raw = isEditing ? editContent : selectedTemplate.content;

    const replacements: Record<string, string> = {
      '{nama_klien}': simClientName || 'Budi Pratama',
      '{nama_proyek}': simProjectName || 'Proyek Desain Studio',
      '{id_pesanan}': simOrderId || 'ORD-9801',
      '{nominal_tagihan}': simAmount || '2.500.000',
      '{sisa_tagihan}': simRemaining || '2.500.000',
      '{deadline}': simDeadline || '28 Oktober 2026',
      '{link_portal}': `${studioOrigin}/client`,
      '{link_proofing}': `${studioOrigin}/client?tab=tracker`,
      '{nama_bank}': primaryBank.bankName || 'BCA',
      '{nomor_rekening}': primaryBank.accountNumber || '123-456-7890',
      '{nama_studio}': autoStudioName,
    };

    let result = raw;
    Object.entries(replacements).forEach(([key, val]) => {
      result = result.replaceAll(key, val);
    });
    return result;
  }, [selectedTemplate, isEditing, editContent, simClientName, simProjectName, simOrderId, simAmount, simRemaining, simDeadline, autoStudioName, studioOrigin, primaryBank]);

  // Versi teks bersih untuk copas ke WhatsApp Business
  const cleanShortcutReadyText = useMemo(() => {
    if (!selectedTemplate) return '';
    const raw = isEditing ? editContent : selectedTemplate.content;
    return resolveStudioAutoTags(raw);
  }, [selectedTemplate, isEditing, editContent, autoStudioName, studioOrigin, primaryBank]);

  // Insert variable into textarea cursor position
  const handleInsertVariable = (varKey: string) => {
    haptic.light();
    if (!isEditing) setIsEditing(true);

    const textarea = textareaRef.current;
    if (!textarea) {
      setEditContent(prev => prev + ' ' + varKey);
      return;
    }

    const start = textarea.selectionStart || editContent.length;
    const end = textarea.selectionEnd || editContent.length;
    const next = editContent.substring(0, start) + varKey + editContent.substring(end);
    setEditContent(next);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + varKey.length, start + varKey.length);
      }
    }, 50);
  };

  // Save current template edit
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    haptic.medium();
    const cleanShortcut = editShortcut.trim().startsWith('/') ? editShortcut.trim() : `/${editShortcut.trim()}`;
    const updated = templates.map(t => {
      if (t.id === selectedTemplate.id) {
        return {
          ...t,
          title: editTitle.trim() || t.title,
          shortcut: cleanShortcut || t.shortcut || '/pesan',
          category: editCategory,
          description: editDescription.trim(),
          content: editContent,
          isCustom: true
        };
      }
      return t;
    });
    setTemplates(updated);
    setIsEditing(false);
    await storage.setItem('porto_wa_templates', updated, true);
  };

  // Add brand new template
  const handleCreateNewTemplate = async () => {
    haptic.medium();
    const newTpl: WhatsAppTemplateItem = {
      id: `tpl-custom-${Date.now()}`,
      shortcut: `/pesan${templates.length + 1}`,
      category: activeCategory !== 'all' ? (activeCategory as any) : 'welcome',
      title: 'Pesan Baru',
      description: 'Pesan kustom studio',
      content: `*HALO KAK {nama_klien}* ✨\n\nPesan dari {nama_studio} mengenai proyek {nama_proyek}.\n\nPortal: {link_portal}\n\nTerima kasih! 🙏`,
      isCustom: true
    };
    const next = [newTpl, ...templates];
    setTemplates(next);
    setSelectedTemplateId(newTpl.id);
    setIsEditing(true);
    await storage.setItem('porto_wa_templates', next, true);
  };

  // Delete custom template
  const handleDeleteTemplate = async (id: string) => {
    haptic.light();
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    if (selectedTemplateId === id) {
      setSelectedTemplateId(next[0]?.id || '');
    }
    await storage.setItem('porto_wa_templates', next, true);
  };

  // Reset to default factory templates
  const handleResetToDefaults = async () => {
    if (confirm('Kembalikan seluruh daftar pesan WhatsApp ke template bawaan studio?')) {
      haptic.medium();
      setTemplates(DEFAULT_WA_TEMPLATES);
      setSelectedTemplateId(DEFAULT_WA_TEMPLATES[0].id);
      setIsEditing(false);
      await storage.setItem('porto_wa_templates', DEFAULT_WA_TEMPLATES, true);
    }
  };

  // Copy clean shortcut text
  const handleCopyCleanShortcutText = () => {
    haptic.light();
    navigator.clipboard?.writeText(cleanShortcutReadyText);
    setCopiedCleanId(selectedTemplate?.id || 'copied_clean');
    setTimeout(() => setCopiedCleanId(null), 2500);
  };

  // Copy compiled message
  const handleCopyMessage = () => {
    haptic.light();
    navigator.clipboard?.writeText(compiledMessage);
    setCopiedId(selectedTemplate?.id || 'copied');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copy shortcut keyword code
  const handleCopyShortcutCode = (sc: string) => {
    haptic.light();
    navigator.clipboard?.writeText(sc);
    setCopiedShortcut(sc);
    setTimeout(() => setCopiedShortcut(null), 2000);
  };

  // Open direct WhatsApp chat
  const handleSendWhatsApp = () => {
    haptic.medium();
    const clean = formatWhatsAppNumber(simTargetPhone);
    const encoded = encodeURIComponent(compiledMessage);
    const url = clean ? `https://wa.me/${clean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Dynamic theme colors
  const panelBg = isLightMode ? '#ffffff' : 'var(--surface-panel, #121318)';
  const panelBorder = isLightMode ? '#e2e8f0' : 'var(--surface-border-subtle, rgba(255,255,255,0.08))';
  const panelShadow = isLightMode ? '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px -2px rgba(0,0,0,0.03)' : 'none';
  const textPrimary = isLightMode ? '#0f172a' : '#ffffff';
  const textMuted = isLightMode ? '#64748b' : '#94a3b8';
  const inputBg = isLightMode ? '#f8fafc' : 'var(--surface-card, #181920)';
  const inputBorder = isLightMode ? '#e2e8f0' : 'var(--surface-border-subtle, rgba(255,255,255,0.1))';

  return (
    <div style={{
      padding: '16px 20px 20px',
      maxWidth: 1640,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      height: 'calc(100vh - 40px)',
      maxHeight: 'calc(100vh - 40px)',
      boxSizing: 'border-box',
      overflow: 'hidden',
      fontFamily: 'var(--font-family-cms)'
    }}>
      {/* ── 1. Page Header Minimalis (Ultra-Clean, 1-2 Kata) ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 10,
        borderBottom: `1px solid ${panelBorder}`,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: isLightMode ? 'rgba(22, 163, 74, 0.12)' : 'rgba(34, 197, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLightMode ? '#16a34a' : '#22c55e',
            flexShrink: 0
          }}>
            <MessageCircle size={18} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: textPrimary, margin: 0, letterSpacing: -0.4 }}>
              WhatsApp Hub
            </h1>
            <span style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: isLightMode ? '#15803d' : '#4ade80',
              background: isLightMode ? 'rgba(22, 163, 74, 0.1)' : 'rgba(34, 197, 94, 0.12)',
              padding: '2px 7px',
              borderRadius: 6,
              border: `1px solid ${isLightMode ? 'rgba(22, 163, 74, 0.2)' : 'rgba(34, 197, 94, 0.25)'}`
            }}>
              {autoStudioName}
            </span>
          </div>
        </div>

        {/* Action Buttons Minimalis (Icon Only + 1 Kata) */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleResetToDefaults}
            title="Reset Bawaan"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: inputBg,
              border: `1px solid ${panelBorder}`,
              color: textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={handleCreateNewTemplate}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'var(--cms-accent, #D95629)',
              border: 'none',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <Plus size={14} strokeWidth={2.5} /> Baru
          </button>
        </div>
      </div>

      {/* ── 2. Category Filter & Search Bar Minimalis (1 Kata) ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0
      }}>
        {/* Category Tabs (1 Kata & Icon) */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {CATEGORY_TABS.map(tab => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  haptic.light();
                  setActiveCategory(tab.id);
                }}
                style={{
                  padding: '5px 11px',
                  borderRadius: 100,
                  border: `1px solid ${isActive ? 'var(--cms-accent, #D95629)' : panelBorder}`,
                  background: isActive ? 'var(--cms-accent, #D95629)' : panelBg,
                  color: isActive ? '#ffffff' : textMuted,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: isActive ? '0 2px 8px rgba(217, 86, 41, 0.25)' : 'none'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Minimalis */}
        <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 30,
              paddingLeft: 30,
              paddingRight: 10,
              borderRadius: 7,
              background: panelBg,
              border: `1px solid ${panelBorder}`,
              color: textPrimary,
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* ── 3. Main Workspace: 3 Columns Grid (Tinggi Sejajar, Scroll Isi Saja) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(250px, 1fr) minmax(340px, 1.4fr) minmax(300px, 1.1fr)',
        gap: 14,
        flex: 1,
        minHeight: 0,
        height: '100%',
        alignItems: 'stretch'
      }}>
        
        {/* ── KOLOM 1: Daftar Pesan Minimalis ── */}
        <div style={{
          background: panelBg,
          borderRadius: 14,
          border: `1px solid ${panelBorder}`,
          boxShadow: panelShadow,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Header Kotak 1 */}
          <div style={{
            padding: '11px 14px',
            borderBottom: `1px solid ${panelBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: textPrimary }}>
              Pesan ({filteredTemplates.length})
            </span>
          </div>

          {/* Isi Konten Kotak 1: Scrollable List dengan Badge Pintasan */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 8,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            {filteredTemplates.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: textMuted, fontSize: 12 }}>
                Tidak ada pesan.
              </div>
            ) : (
              filteredTemplates.map(item => {
                const isSelected = selectedTemplate?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      haptic.light();
                      setSelectedTemplateId(item.id);
                    }}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 9,
                      background: isSelected ? (isLightMode ? 'rgba(217, 86, 41, 0.1)' : 'rgba(217, 86, 41, 0.15)') : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--cms-accent, #D95629)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.shortcut && (
                          <span style={{
                            fontSize: 10.5,
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            color: isLightMode ? '#15803d' : '#4ade80',
                            background: isLightMode ? 'rgba(22, 163, 74, 0.1)' : 'rgba(34, 197, 94, 0.15)',
                            padding: '1px 5px',
                            borderRadius: 4,
                            border: `1px solid ${isLightMode ? 'rgba(22, 163, 74, 0.25)' : 'rgba(34, 197, 94, 0.3)'}`
                          }}>
                            {item.shortcut}
                          </span>
                        )}
                      </div>

                      {item.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(item.id);
                          }}
                          title="Hapus"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: textMuted,
                            cursor: 'pointer',
                            padding: 2
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    <div style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: isSelected ? 'var(--cms-accent, #D95629)' : textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.title}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── KOLOM 2: Editor Template, Variabel & Pintasan Minimalis ── */}
        <div style={{
          background: panelBg,
          borderRadius: 14,
          border: `1px solid ${panelBorder}`,
          boxShadow: panelShadow,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Header Kotak 2 (1 Kata Aksi) */}
          <div style={{
            padding: '11px 14px',
            borderBottom: `1px solid ${panelBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0
          }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 13.5, fontWeight: 900, color: textPrimary, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isEditing ? 'Edit Pesan' : selectedTemplate?.title || 'Pesan'}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: `1px solid ${panelBorder}`,
                      color: textMuted,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: '#10b981',
                      border: 'none',
                      color: '#fff',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Save size={12} /> Simpan
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 6,
                    background: inputBg,
                    border: `1px solid ${panelBorder}`,
                    color: textPrimary,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Edit3 size={12} /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Isi Konten Kotak 2: Scrollable Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            {selectedTemplate ? (
              <>
                {/* Baris Pintasan Shortcut Minimalis */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: isLightMode ? 'rgba(22, 163, 74, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                  border: `1px solid ${isLightMode ? 'rgba(22, 163, 74, 0.2)' : 'rgba(34, 197, 94, 0.25)'}`,
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <Zap size={13} color={isLightMode ? '#16a34a' : '#34d399'} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editShortcut}
                        onChange={e => setEditShortcut(e.target.value)}
                        placeholder="/pintasan"
                        style={{
                          height: 24,
                          padding: '0 6px',
                          borderRadius: 4,
                          background: panelBg,
                          border: `1px solid ${isLightMode ? '#16a34a' : '#22c55e'}`,
                          color: isLightMode ? '#15803d' : '#4ade80',
                          fontFamily: 'monospace',
                          fontSize: 12,
                          fontWeight: 900,
                          outline: 'none',
                          width: 100
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: 12,
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        color: isLightMode ? '#15803d' : '#4ade80'
                      }}>
                        {selectedTemplate.shortcut || '/pesan'}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyShortcutCode(selectedTemplate.shortcut || '')}
                    title="Salin Kode Pintasan"
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      background: isLightMode ? 'rgba(22, 163, 74, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                      border: 'none',
                      color: isLightMode ? '#15803d' : '#4ade80',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {copiedShortcut === selectedTemplate.shortcut ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedShortcut === selectedTemplate.shortcut ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                {/* Edit Mode Inputs (Minimalis) */}
                {isEditing && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <input
                      type="text"
                      placeholder="Judul pesan..."
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      style={{
                        width: '100%',
                        height: 30,
                        padding: '0 8px',
                        borderRadius: 6,
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        color: textPrimary,
                        fontSize: 12,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                {/* Variabel Toolbar Minimalis (Chips 1 Kata) */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                    Variabel:
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {AVAILABLE_VARIABLES.map(v => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v.key)}
                        title={v.key}
                        style={{
                          padding: '3px 7px',
                          borderRadius: 5,
                          background: isLightMode ? 'rgba(217, 86, 41, 0.08)' : 'rgba(217, 86, 41, 0.1)',
                          border: `1px solid ${isLightMode ? 'rgba(217, 86, 41, 0.2)' : 'rgba(217, 86, 41, 0.25)'}`,
                          color: 'var(--cms-accent, #D95629)',
                          fontSize: 10.5,
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Editor Fleksibel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minHeight: 180 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: textMuted, textTransform: 'uppercase' }}>
                      Konten
                    </span>
                    <span style={{ fontSize: 10, color: textMuted }}>
                      *tebal* _miring_ ~coret~ `kode`
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    disabled={!isEditing}
                    value={isEditing ? editContent : selectedTemplate.content}
                    onChange={e => setEditContent(e.target.value)}
                    style={{
                      width: '100%',
                      flex: 1,
                      minHeight: 180,
                      padding: 10,
                      borderRadius: 8,
                      background: isEditing ? inputBg : (isLightMode ? '#f8fafc' : 'rgba(0,0,0,0.25)'),
                      border: `1px solid ${isEditing ? 'var(--cms-accent, #D95629)' : panelBorder}`,
                      color: textPrimary,
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      fontFamily: 'monospace',
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            ) : (
              <div style={{ padding: 30, textAlign: 'center', color: textMuted, fontSize: 12 }}>
                Pilih pesan.
              </div>
            )}
          </div>
        </div>

        {/* ── KOLOM 3: Smartphone Simulator & Dispatcher Cepat Minimalis ── */}
        <div style={{
          background: panelBg,
          borderRadius: 14,
          border: `1px solid ${panelBorder}`,
          boxShadow: panelShadow,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Header Kotak 3 Minimalis */}
          <div style={{
            padding: '11px 14px',
            borderBottom: `1px solid ${panelBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} color={isLightMode ? '#16a34a' : '#22c55e'} />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: textPrimary }}>
                Pratinjau
              </span>
              {selectedTemplate?.shortcut && (
                <span style={{
                  fontSize: 10.5,
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  color: isLightMode ? '#15803d' : '#4ade80'
                }}>
                  {selectedTemplate.shortcut}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: isLightMode ? '#15803d' : '#22c55e',
              background: isLightMode ? 'rgba(22, 163, 74, 0.1)' : 'rgba(34, 197, 94, 0.12)',
              padding: '1px 6px',
              borderRadius: 100
            }}>
              Live
            </span>
          </div>

          {/* Form Simulasi Minimalis */}
          <div style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${panelBorder}`,
            background: inputBg,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            flexShrink: 0
          }}>
            <input
              type="text"
              placeholder="Nama Klien"
              value={simClientName}
              onChange={e => setSimClientName(e.target.value)}
              style={{
                height: 28,
                padding: '0 8px',
                borderRadius: 5,
                background: panelBg,
                border: `1px solid ${panelBorder}`,
                color: textPrimary,
                fontSize: 11.5,
                outline: 'none'
              }}
            />
            <input
              type="text"
              placeholder="No. WA"
              value={simTargetPhone}
              onChange={e => setSimTargetPhone(e.target.value)}
              style={{
                height: 28,
                padding: '0 8px',
                borderRadius: 5,
                background: panelBg,
                border: `1px solid ${panelBorder}`,
                color: textPrimary,
                fontSize: 11.5,
                outline: 'none'
              }}
            />
          </div>

          {/* Isi Konten Kotak 3: WhatsApp Chat Bubble Scrollable (Light & Dark Asli) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            minHeight: 0,
            background: isLightMode ? '#efeae2' : '#0b141a',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              background: isLightMode ? '#d9fdd3' : '#005c4b',
              color: isLightMode ? '#111b21' : '#e9edef',
              padding: '10px 12px 6px',
              borderRadius: '10px 10px 2px 10px',
              fontSize: 12,
              lineHeight: 1.45,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              boxShadow: isLightMode ? '0 1px 1px rgba(11,20,26,0.13)' : '0 1px 2px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              {compiledMessage}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
                marginTop: 4,
                fontSize: 10,
                color: isLightMode ? '#667781' : '#8696a0'
              }}>
                <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                <CheckCheck size={12} color="#53bdeb" />
              </div>
            </div>
          </div>

          {/* Tombol Aksi Minimalis (1-2 Kata) */}
          <div style={{
            padding: '10px 12px',
            borderTop: `1px solid ${panelBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: panelBg,
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              style={{
                width: '100%',
                height: 36,
                borderRadius: 8,
                background: '#22c55e',
                border: 'none',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 3px 12px rgba(34, 197, 94, 0.25)'
              }}
            >
              <Send size={14} /> WhatsApp
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button
                type="button"
                onClick={handleCopyCleanShortcutText}
                title="Salin Teks Siap Copas ke Balas Cepat WA Bisnis"
                style={{
                  height: 32,
                  borderRadius: 6,
                  background: isLightMode ? 'rgba(22, 163, 74, 0.1)' : 'rgba(34, 197, 94, 0.12)',
                  border: `1px solid ${isLightMode ? 'rgba(22, 163, 74, 0.25)' : 'rgba(34, 197, 94, 0.3)'}`,
                  color: isLightMode ? '#15803d' : '#4ade80',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                {copiedCleanId ? <Check size={12} /> : <Zap size={12} />}
                <span>{copiedCleanId ? 'Tersalin' : 'Pintasan'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                title="Salin Pesan Hasil Simulasi Klien"
                style={{
                  height: 32,
                  borderRadius: 6,
                  background: inputBg,
                  border: `1px solid ${panelBorder}`,
                  color: textPrimary,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                {copiedId ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedId ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default WhatsAppStudio;
