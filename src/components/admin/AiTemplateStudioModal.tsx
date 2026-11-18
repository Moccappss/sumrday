import React, { useState, useMemo } from 'react';
import { 
  X, Sparkles, Wand2, CheckSquare, Square, Download, Copy, Check,
  Send, FileText, ShoppingBag, CreditCard, MessageSquare, Globe2,
  StickyNote, ChevronRight, Eye, Code, RefreshCw, Loader2, ArrowRight
} from 'lucide-react';
import { callGemini, getGeminiKey } from '../../utils/ai';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';

interface AiTemplateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onNavigate?: (page: string) => void;
}

type FileType = 
  | 'blog' 
  | 'spk_contract' 
  | 'catalog_product' 
  | 'whatsapp_broadcast' 
  | 'creative_brief' 
  | 'web_component' 
  | 'memo_roadmap';

interface CheckboxOption {
  id: string;
  label: string;
  desc: string;
  defaultChecked: boolean;
}

const FILE_TYPE_OPTIONS: { id: FileType; label: string; icon: any; badge: string; defaultExtension: string }[] = [
  { id: 'blog', label: 'Artikel Blog / Jurnal', icon: FileText, badge: 'Markdown', defaultExtension: '.md' },
  { id: 'spk_contract', label: 'Surat SPK & Kontrak Proyek', icon: CreditCard, badge: 'Dokumen', defaultExtension: '.md' },
  { id: 'catalog_product', label: 'Produk / Jasa Katalog', icon: ShoppingBag, badge: 'Listing', defaultExtension: '.md' },
  { id: 'whatsapp_broadcast', label: 'WhatsApp Broadcast & Copywriting', icon: MessageSquare, badge: 'Chat Copy', defaultExtension: '.txt' },
  { id: 'creative_brief', label: 'Creative Brief & Spesifikasi', icon: CheckSquare, badge: 'Briefing', defaultExtension: '.md' },
  { id: 'web_component', label: 'Web Block Component', icon: Globe2, badge: 'HTML / Bento', defaultExtension: '.html' },
  { id: 'memo_roadmap', label: 'Roadmap & Action Checklist', icon: StickyNote, badge: 'Task List', defaultExtension: '.md' },
];

const CHECKLIST_OPTIONS: CheckboxOption[] = [
  { id: 'includeCta', label: 'Sertakan Call to Action (CTA)', desc: 'Tombol & link WhatsApp / konsultasi / checkout', defaultChecked: true },
  { id: 'includePricing', label: 'Sertakan Struktur Harga / Opsi Paket', desc: 'Rincian biaya, starter/pro tier, atau skema termin', defaultChecked: true },
  { id: 'includeFaq', label: 'Sertakan Tanya Jawab (FAQ)', desc: '3-4 pertanyaan umum dan solusinya', defaultChecked: false },
  { id: 'includeTerms', label: 'Sertakan Syarat & Ketentuan / Garansi', desc: 'Batasan revisi, hak cipta, dan SLA pengerjaan', defaultChecked: true },
  { id: 'includeSeo', label: 'Optimasi SEO & Meta Data', desc: 'Meta title, meta description, keywords & URL slug', defaultChecked: true },
  { id: 'includeTable', label: 'Format Tabel Rinci', desc: 'Perbandingan fitur atau deliverables dalam tabel', defaultChecked: false },
  { id: 'includeEmojis', label: 'Gaya Visual dengan Emoji Estetik', desc: 'Membuat tampilan modern, hidup, dan mudah dipindai', defaultChecked: true },
  { id: 'includeCodeSnippet', label: 'Sertakan Data Struktur / Kode', desc: 'Blok JSON atau markup siap pakai untuk integrasi', defaultChecked: false },
];

export const AiTemplateStudioModal: React.FC<AiTemplateStudioModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  onNavigate
}) => {
  const [topic, setTopic] = useState('');
  const [fileType, setFileType] = useState<FileType>('blog');
  const [tone, setTone] = useState<'professional' | 'casual' | 'persuasive' | 'luxury'>('professional');
  const [outputFormat, setOutputFormat] = useState<'markdown' | 'text' | 'html' | 'json'>('markdown');
  const [checkedOptions, setCheckedOptions] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    CHECKLIST_OPTIONS.forEach(opt => {
      init[opt.id] = opt.defaultChecked;
    });
    return init;
  });
  const [extraNotes, setExtraNotes] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'result'>('form');
  const [copySuccess, setCopySuccess] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');

  const toggleCheck = (id: string) => {
    haptic.selection();
    setCheckedOptions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = useMemo(() => {
    return Object.values(checkedOptions).filter(Boolean).length;
  }, [checkedOptions]);

  // ── Smart Offline Template Synthesizer (Fallback jika tanpa API Key atau Offline) ──
  const synthesizeOfflineTemplate = (): string => {
    const currentTopic = topic.trim() || 'Layanan Desain & Kreatif Digital';
    const hasCta = checkedOptions.includeCta;
    const hasPricing = checkedOptions.includePricing;
    const hasFaq = checkedOptions.includeFaq;
    const hasTerms = checkedOptions.includeTerms;
    const hasSeo = checkedOptions.includeSeo;
    const hasTable = checkedOptions.includeTable;
    const hasEmojis = checkedOptions.includeEmojis;
    const hasCode = checkedOptions.includeCodeSnippet;

    const e = (emoji: string) => hasEmojis ? emoji + ' ' : '';

    if (fileType === 'blog') {
      return `# ${e('✨')}${currentTopic}

${hasSeo ? `> **Meta Title:** Panduan Lengkap ${currentTopic} | sumr.day Studio
> **Slug:** /blog/${currentTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-panduan
> **Target Keywords:** ${currentTopic}, desain visual, branding studio, digital creative
---` : ''}

## ${e('📌')}Pendahuluan
Dalam era transformasi digital, **${currentTopic}** menjadi salah satu pilar paling krusial untuk membangun diferensiasi dan kredibilitas brand di pasar modern.

## ${e('💡')}Strategi & Implementasi Utama
1. **Analisis Kebutuhan Audiens:** Memahami persona dan pain-point pelanggan secara mendalam.
2. **Visual Direction yang Konsisten:** Memadukan estetika visual dengan navigasi yang intuitif.
3. **Eksekusi Presisi:** Pengoptimalan aset visual resolusi tinggi untuk seluruh perangkat.

${hasTable ? `### ${e('📊')}Tabel Perbandingan Opsi
| Pendekatan | Waktu Pengerjaan | Skalabilitas | Efektivitas Biaya |
| :--- | :--- | :--- | :--- |
| Metode Standar | 2 - 3 Minggu | Menengah | Ekonomis |
| Sistem Ekosistem Pro | 1 - 2 Minggu | Sangat Tinggi | ROI Maksimal |
` : ''}

${hasPricing ? `## ${e('💰')}Investasi & Rekomendasi Paket
- **Paket Starter:** Rp 1.500.000 (Cocok untuk UMKM / Brand Baru)
- **Paket Signature Pro:** Rp 3.500.000 (Solusi Terintegrasi Lengkap)
- **Custom Enterprise:** Konsultasi Eksklusif
` : ''}

${hasTerms ? `## ${e('🛡️')}Garansi & Ketentuan Pengerjaan
- Maksimal 2x siklus revisi minor tanpa biaya tambahan.
- Hak cipta penuh menjadi milik klien setelah pelunasan invoice.
- SLA pengerjaan terjamin sesuai timeline yang disepakati.
` : ''}

${hasFaq ? `## ${e('❓')}Pertanyaan Umum (FAQ)
**Q: Berapa lama waktu pengerjaan untuk proyek ini?**
A: Rata-rata 5 hingga 10 hari kerja tergantung kompleksitas materi.

**Q: Format file apa saja yang diserahkan?**
A: Berkas master lengkap (Figma / AI / PDF / SVG) siap cetak dan rilis digital.
` : ''}

${hasCta ? `---
### ${e('🚀')}Siap Mengembangkan Brand Anda?
Konsultasikan kebutuhan **${currentTopic}** bersama tim studio kami hari ini.
👉 **Hubungi WhatsApp:** +62 812-3456-7890 | **Website:** sumr.day
` : ''}

${hasCode ? `\`\`\`json
{
  "title": "${currentTopic}",
  "type": "article",
  "author": "sumr.day Creative Studio",
  "tags": ["design", "branding", "growth"]
}
\`\`\`` : ''}`;
    }

    if (fileType === 'spk_contract') {
      return `# SURAT PERJANJIAN KERJASAMA (SPK) PROYEK
**Nomor:** SPK/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}
**Tanggal:** ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}

---

### PIHAK PERTAMA (Pemberi Tugas / Klien)
- **Nama:** [Nama Klien / Perusahaan]
- **Kontak / WhatsApp:** [Nomor Klien]

### PIHAK KEDUA (Pelaksana Pekerjaan)
- **Nama:** sumr.day Digital & Creative Studio
- **Layanan:** **${currentTopic}**

---

### PASAL 1: RUANG LINGKUP PEKERJAAN
Pihak Kedua berkewajiban menyelesaikan perancangan dan implementasi **${currentTopic}** dengan rincian deliverable resmi.

${hasTable ? `| Deliverable | Format Berkas | Estimasi Selesai |
| :--- | :--- | :--- |
| Konsep & Moodboard | PDF Resolusi Tinggi | Hari ke-3 |
| Desain Final & Proofing | Master Vector / Source | Hari ke-7 |
| Handover & Aset Jadi | Cloud Archive Link | Hari ke-10 |
` : ''}

${hasPricing ? `### PASAL 2: NILAI INVESTASI & SKEMA TERMIN
Total nilai kontrak disepakati sebesar **Rp 3.500.000,-** dengan skema pembayaran:
1. **Termin 1 (DP 50%):** Rp 1.750.000,- dibayarkan sebelum pekerjaan dimulai.
2. **Termin 2 (Pelunasan 50%):** Rp 1.750.000,- dibayarkan setelah persetujuan (ACC) final sebelum rilis master file.
` : ''}

${hasTerms ? `### PASAL 3: KETENTUAN REVISI & HAK CIPTA
1. Pihak Pertama berhak mengajukan hingga 2 (dua) kali revisi minor.
2. Revisi mayor di luar brief awal akan dikenakan biaya adendum proporsional.
3. Hak kepemilikan komersial diserahkan penuh kepada Pihak Pertama setelah pembayaran lunas 100%.
` : ''}

${hasCta ? `---
*Disetujui bersama secara sadar tanpa paksaan oleh Pihak Pertama dan Pihak Kedua.*
**Konfirmasi & Pertanyaan:** WhatsApp Official sumr.day
` : ''}`;
    }

    if (fileType === 'whatsapp_broadcast') {
      return `${e('🔥')}*PENAWARAN SPESIAL: ${currentTopic.toUpperCase()}*

Halo Kak! ${e('👋')}
Pernah merasa visual brand Anda kurang menonjol di mata kompetitor? 

Sekarang saatnya upgrade identitas brand dan kehadiran digital Anda dengan layanan *${currentTopic}* dari sumr.day Studio!

${e('✨')}*Apa yang Anda Dapatkan:*
${e('✔')} Desain eksklusif & modern multi-device
${e('✔')} Pengerjaan cepat & profesional
${e('✔')} Berkas master lengkap beresolusi tinggi

${hasPricing ? `${e('💰')}*Penawaran Eksklusif Minggu Ini:*
Harga normal: ~Rp 2.500.000~
👉 *Harga Promo Khusus:* Hanya *Rp 1.499.000* (Hemat 40%!)
` : ''}

${hasTerms ? `${e('🛡️')}*Garansi sumr.day:*
Free 2x revisi & jaminan kepuasan hasil desain.
` : ''}

${hasCta ? `Slot terbatas hanya untuk *5 klien pertama* bulan ini!
Klik tautan di bawah untuk klaim promo & konsultasi instan:
👉 https://wa.me/6281234567890?text=Halo%20sumr.day,%20saya%20tertarik%20promo%20${encodeURIComponent(currentTopic)}
` : ''}`;
    }

    // Default Fallback
    return `# ${e('📌')}${currentTopic}
Dihasilkan otomatis berdasarkan preferensi centang-centang yang dipilih.

- **Kategori:** ${fileType}
- **Tone:** ${tone}
- **Fitur Aktif:** ${Object.entries(checkedOptions).filter(([, v]) => v).map(([k]) => k).join(', ')}

${hasPricing ? `### Estimasi Biaya\nRp 2.500.000 (Paket Studio Standard)\n` : ''}
${hasTerms ? `### Syarat Pengerjaan\nRevisi maksimal 2x, pengerjaan 7 hari kerja.\n` : ''}
${hasCta ? `### Aksi Cepat\nHubungi studio via WhatsApp untuk memulai kolaborasi.\n` : ''}`;
  };

  // ── Eksekusi Generate AI ──
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    haptic.medium();

    const activeChecklistText = Object.entries(checkedOptions)
      .filter(([, val]) => val)
      .map(([key]) => {
        const item = CHECKLIST_OPTIONS.find(c => c.id === key);
        return item ? `- Wajib sertakan: ${item.label} (${item.desc})` : '';
      })
      .filter(Boolean)
      .join('\n');

    const prompt = `Buatkan konten profesional bertipe: "${fileType}" tentang topik: "${topic.trim()}".
Gaya bahasa / tone: ${tone}.
Format output yang diinginkan: ${outputFormat}.

Instruksi Centang Spesifikasi yang WAJIB dipenuhi:
${activeChecklistText}

Catatan tambahan dari pengguna:
${extraNotes.trim() || 'Tidak ada catatan tambahan, buat selengkap dan seprofesional mungkin.'}

PENTING: Buat konten terstruktur rapi, siap pakai langsung untuk keperluan studio kreatif digital.`;

    const systemInstruction = `Kamu adalah AI Creative Director & Content Strategist senior untuk sumr.day Digital Studio. Kamu menghasilkan template, dokumen, atau konten yang sangat presisi sesuai checklist yang dicentang oleh pengguna.`;

    try {
      const apiKey = getGeminiKey();
      if (apiKey && apiKey.length > 10) {
        const response = await callGemini(prompt, systemInstruction, 2200, true);
        if (response && !response.includes('API Key belum diatur')) {
          setGeneratedOutput(response);
          setActiveTab('result');
          haptic.success();
          return;
        }
      }
      
      // Fallback ke Smart Offline Synthesizer
      const offlineResult = synthesizeOfflineTemplate();
      setGeneratedOutput(offlineResult);
      setActiveTab('result');
      haptic.success();
    } catch (err) {
      console.warn('AI generation error, using smart fallback template:', err);
      const offlineResult = synthesizeOfflineTemplate();
      setGeneratedOutput(offlineResult);
      setActiveTab('result');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Salin Output ──
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopySuccess(true);
    haptic.success();
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // ── Download File ──
  const handleDownloadFile = () => {
    haptic.selection();
    const typeObj = FILE_TYPE_OPTIONS.find(f => f.id === fileType);
    const ext = typeObj?.defaultExtension || '.md';
    const cleanTopic = (topic.trim() || 'template-sumrday').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `${cleanTopic}-${fileType}${ext}`;

    const blob = new Blob([generatedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Kirim Langsung ke Modul Terkait ──
  const handleSendToModule = async (targetModule: 'blog' | 'memo' | 'projects' | 'whatsapp') => {
    haptic.medium();
    const cleanTitle = topic.trim() || 'Template Dihasilkan AI';

    if (targetModule === 'blog') {
      try {
        const existing = await storage.getItem('porto_blogs', []);
        const newPost = {
          id: 'blog_' + Date.now(),
          title: cleanTitle,
          slug: cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          content: generatedOutput,
          excerpt: cleanTitle + ' - Dihasilkan oleh AI Studio',
          author: 'Studio AI',
          category: 'Creative Spill',
          createdAt: new Date().toISOString(),
          isPublished: false
        };
        await storage.setItem('porto_blogs', [newPost, ...(Array.isArray(existing) ? existing : [])]);
        setSendSuccess('Tersimpan sebagai draf di Modul Blog!');
        setTimeout(() => setSendSuccess(''), 2500);
      } catch (e) {
        console.error(e);
      }
    } else if (targetModule === 'memo') {
      try {
        const existing = await storage.getItem('porto_memos', []);
        const newMemo = {
          id: 'memo_' + Date.now(),
          title: cleanTitle,
          content: generatedOutput,
          category: 'AI Template',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await storage.setItem('porto_memos', [newMemo, ...(Array.isArray(existing) ? existing : [])]);
        setSendSuccess('Tersimpan di Modul Catatan & Memo!');
        setTimeout(() => setSendSuccess(''), 2500);
      } catch (e) {
        console.error(e);
      }
    } else if (targetModule === 'whatsapp') {
      const url = `https://wa.me/?text=${encodeURIComponent(generatedOutput)}`;
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 2147483640,
          animation: 'cmsFadeIn 0.2s ease-out'
        }}
      />

      {/* Modal Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '94%',
          maxWidth: 780,
          maxHeight: '90vh',
          background: isDarkMode ? '#13141f' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
          border: isDarkMode ? '1.5px solid rgba(255, 255, 255, 0.14)' : '1.5px solid #e2e8f0',
          borderRadius: 20,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)',
          zIndex: 2147483641,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}>
              <Wand2 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>AI Template Studio</h2>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: 'var(--cms-accent-soft, rgba(59,130,246,0.18))',
                  color: 'var(--cms-accent, #3b82f6)'
                }}>
                  Mode Centang-Centang
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, opacity: 0.7 }}>
                Pilih elemen yang diinginkan, AI dan template otomatis menyesuaikan formatnya
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {generatedOutput && (
              <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0', borderRadius: 8, padding: 3 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 650,
                    border: 'none',
                    background: activeTab === 'form' ? 'var(--cms-accent, #3b82f6)' : 'transparent',
                    color: activeTab === 'form' ? '#fff' : 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  Konfigurasi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 650,
                    border: 'none',
                    background: activeTab === 'result' ? 'var(--cms-accent, #3b82f6)' : 'transparent',
                    color: activeTab === 'result' ? '#fff' : 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  Hasil Output
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          {activeTab === 'form' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* 1. TOPIK UTAMA */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  1. Topik Konten / Nama File *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Redesign Identitas Kopi Nusantara, Paket Pembuatan Web Express..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: isDarkMode ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid #cbd5e1',
                    background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    color: 'inherit',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    fontWeight: 500
                  }}
                />
              </div>

              {/* 2. PILIH TIPE FILE */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  2. Jenis File & Format Output
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
                  {FILE_TYPE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSel = fileType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setFileType(opt.id);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: isSel 
                            ? '1.5px solid var(--cms-accent, #3b82f6)' 
                            : (isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'),
                          background: isSel 
                            ? 'var(--cms-accent-soft, rgba(59,130,246,0.14))' 
                            : (isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff'),
                          color: isSel ? 'var(--cms-accent, #3b82f6)' : 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon size={16} />
                          <span style={{ fontSize: 12, fontWeight: 650 }}>{opt.label}</span>
                        </div>
                        <span style={{ fontSize: 9.5, opacity: 0.6, fontWeight: 700 }}>{opt.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. MODE CENTANG-CENTANG (CHECKLIST HARUS TERMASUK APA SAJA) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block' }}>
                    3. Mode Centang Spesifikasi ({selectedCount} Elemen Aktif)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allChecked = selectedCount === CHECKLIST_OPTIONS.length;
                      const next: Record<string, boolean> = {};
                      CHECKLIST_OPTIONS.forEach(o => { next[o.id] = !allChecked; });
                      setCheckedOptions(next);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cms-accent, #3b82f6)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {selectedCount === CHECKLIST_OPTIONS.length ? 'Batal Centang Semua' : 'Centang Semua'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
                  {CHECKLIST_OPTIONS.map(opt => {
                    const isChecked = !!checkedOptions[opt.id];
                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleCheck(opt.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: isChecked 
                            ? '1px solid rgba(59, 130, 246, 0.4)' 
                            : (isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0'),
                          background: isChecked 
                            ? (isDarkMode ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff') 
                            : (isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ marginTop: 2, color: isChecked ? 'var(--cms-accent, #3b82f6)' : (isDarkMode ? 'rgba(255,255,255,0.3)' : '#94a3b8') }}>
                          {isChecked ? <CheckSquare size={17} /> : <Square size={17} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isChecked ? 'inherit' : (isDarkMode ? '#94a3b8' : '#64748b') }}>
                            {opt.label}
                          </div>
                          <div style={{ fontSize: 10.5, opacity: 0.65, marginTop: 2 }}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. TONE & GAYA BAHASA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    4. Gaya Bahasa (Tone of Voice)
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[
                      { id: 'professional', label: 'Profesional' },
                      { id: 'casual', label: 'Santai & Modern' },
                      { id: 'persuasive', label: 'Persuasif Sales' },
                      { id: 'luxury', label: 'Minimalis Luxury' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id as any)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 650,
                          border: 'none',
                          background: tone === t.id ? 'var(--cms-accent, #3b82f6)' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                          color: tone === t.id ? '#fff' : 'inherit',
                          cursor: 'pointer'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Fokus ke target pasar agensi & korporat..."
                    value={extraNotes}
                    onChange={e => setExtraNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                      background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                      color: 'inherit',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

            </div>
          ) : (
            // TAB RESULT PREVIEW
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  Pratinjau Hasil Template ({fileType})
                </span>
                <span style={{ fontSize: 11, opacity: 0.65 }}>
                  {generatedOutput.length} karakter
                </span>
              </div>

              <textarea
                readOnly
                rows={16}
                value={generatedOutput}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 12,
                  border: isDarkMode ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid #cbd5e1',
                  background: isDarkMode ? 'rgba(0,0,0,0.35)' : '#f8fafc',
                  color: isDarkMode ? '#e2e8f0' : '#0f172a',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />

              {sendSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Check size={16} />
                  {sendSuccess}
                </div>
              )}

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: copySuccess ? '#10b981' : 'var(--cms-accent, #3b82f6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  {copySuccess ? <Check size={15} /> : <Copy size={15} />}
                  {copySuccess ? 'Tersalin!' : 'Salin Teks'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFile}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                    background: 'transparent',
                    color: 'inherit',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  Download File
                </button>

                {fileType === 'blog' && (
                  <button
                    type="button"
                    onClick={() => handleSendToModule('blog')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'rgba(139, 92, 246, 0.18)',
                      color: '#8b5cf6',
                      fontWeight: 700,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <FileText size={15} />
                    Kirim ke Blog
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSendToModule('memo')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(59, 130, 246, 0.18)',
                    color: '#3b82f6',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                >
                  <StickyNote size={15} />
                  Kirim ke Memo
                </button>

                {fileType === 'whatsapp_broadcast' && (
                  <button
                    type="button"
                    onClick={() => handleSendToModule('whatsapp')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'rgba(37, 211, 102, 0.18)',
                      color: '#25D366',
                      fontWeight: 700,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <MessageSquare size={15} />
                    Kirim via WhatsApp
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'
        }}>
          <div style={{ fontSize: 11, opacity: 0.65 }}>
            {activeTab === 'form' 
              ? `${selectedCount} opsi centang aktif • Gemini / Smart Engine`
              : 'Siap disalin atau diekspor ke modul studio'
            }
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {activeTab === 'result' ? (
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1',
                  background: 'transparent',
                  color: 'inherit',
                  fontWeight: 650,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                ← Ubah Centang / Konfigurasi
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'transparent',
                  color: 'inherit',
                  fontWeight: 650,
                  fontSize: 12,
                  cursor: 'pointer',
                  opacity: 0.7
                }}
              >
                Batal
              </button>
            )}

            {activeTab === 'form' && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                style={{
                  padding: '10px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--cms-accent, #3b82f6), #8b5cf6)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
                  opacity: (!topic.trim() || isGenerating) ? 0.6 : 1
                }}
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGenerating ? 'Menyesuaikan Template...' : 'Hasilkan Template AI'}
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default AiTemplateStudioModal;
