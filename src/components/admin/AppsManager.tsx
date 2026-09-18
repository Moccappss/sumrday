
import React, { useState, useEffect } from 'react';
import { 
  Plus, BookOpen, Sparkles, Terminal, Rocket, 
  Settings, ExternalLink, Zap, Lightbulb, Code2, Copy, CheckCircle2,
  PackageX, LayoutGrid, Database, Globe, Package, ArrowLeft, Trash2, Edit3, X, ChevronDown
} from 'lucide-react';
import GlassColorPicker from './GlassColorPicker';
import { useContextMenu } from './ContextMenuProvider';

// Dynamically load apps from src/apps folder
const rawApps = import.meta.glob('/src/apps/*/index.tsx', { eager: true });
const apps = Object.entries(rawApps).map(([path, module]) => {
  const folderName = path.split('/')[3];
  return {
    id: folderName,
    config: module.config || { name: folderName, icon: <Package />, color: 'var(--cms-accent, #7c3aed)' },
    Component: module.default
  };
}).filter(app => app.id !== '_template');

// Simple Markdown Component for premium rendering in AI Panel
const MarkdownText = ({ text, maxLength = 300 }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!text) return null;
  
  let stringText = text;
  if (Array.isArray(text)) {
    stringText = text.join('\n');
  } else if (typeof text === 'object') {
    stringText = JSON.stringify(text, null, 2);
  } else {
    stringText = String(text);
  }

  const isLong = stringText.length > maxLength;
  const displayText = (!expanded && isLong) ? stringText.slice(0, maxLength) + '...' : stringText;

  const parts = displayText.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800, color: 'inherit' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
        }
        if (part === '\n') {
          return <br key={i} />;
        }
        return part;
      })}
      {isLong && (
        <button 
          type="button"
          onClick={() => setExpanded(!expanded)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--cms-accent)', 
            cursor: 'pointer', 
            fontSize: '0.9em', 
            fontWeight: 800, 
            padding: 0, 
            marginLeft: 5,
            textDecoration: 'underline'
          }}
        >
          {expanded ? 'Lihat Sedikit' : 'Lihat Selengkapnya'}
        </button>
      )}
    </span>
  );
};

const isDev = import.meta.env.DEV;

const AppsManager = () => {
  const { bindContextMenu } = useContextMenu();
  const [activeAppId, setActiveAppId] = useState(null);
  const [localApps, setLocalApps] = useState(apps);

  const getAppContextMenu = (app) => ({
    title: app.config.name || app.id,
    subtitle: app.config.description || 'Ekstensi Aplikasi CMS',
    headerBadge: 'APP',
    items: [
      {
        label: 'Buka Aplikasi',
        icon: <Rocket size={15} color="var(--cms-accent)" />,
        action: () => setActiveAppId(app.id)
      },
      ...(isDev ? [
        {
          label: 'Duplikasi (Copy App)',
          icon: <Copy size={15} />,
          action: () => setDuplicateModal({ sourceId: app.id, newId: `${app.id}_Copy`, newName: `${app.config.name} Copy` })
        },
        {
          label: 'Edit Info & Tema',
          icon: <Edit3 size={15} />,
          action: () => setEditModal({ appId: app.id, newName: app.config.name, newColor: app.config.color || '#7c3aed', newIconData: app.config.iconData })
        },
        { separator: true },
        {
          label: 'Hapus Aplikasi',
          icon: <Trash2 size={15} />,
          danger: true,
          action: () => handleDelete(app.id)
        }
      ] : [])
    ]
  });

  
  // Modal states
  const [duplicateModal, setDuplicateModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [promptModal, setPromptModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLayoutSelectOpen, setIsLayoutSelectOpen] = useState(false);

  // ── AUTO-OPEN CREATE APP (GLOBAL SHORTCUT / SLASH COMMAND / SEARCH INTENT) ──
  useEffect(() => {
    const triggerNewApp = () => {
      setDuplicateModal({ sourceId: '_template', newId: `App_${Date.now()}`, newName: 'Aplikasi Baru' });
    };

    if (typeof window !== 'undefined' && sessionStorage.getItem('porto_auto_create_app') === '1') {
      sessionStorage.removeItem('porto_auto_create_app');
      setTimeout(triggerNewApp, 150);
    }

    window.addEventListener('porto_create_app', triggerNewApp);
    return () => {
      window.removeEventListener('porto_create_app', triggerNewApp);
    };
  }, []);
  
  // AI Auto-Fill States

  const [aiIdea, setAiIdea] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Bulletproof JSON extractor to prevent crashes from Gemini hallucinations or conversational wrap
  const extractJsonFromText = (text) => {
    try {
      return JSON.parse(text);

    } catch (e) {
      // Find the first '{' and last '}'
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1 && firstOpen < lastClose) {
        const candidate = text.substring(firstOpen, lastClose + 1);
        try {
          return JSON.parse(candidate);
        } catch (err) {
          console.warn("Regex boundary JSON parsing failed:", err);
        }
      }
      // Line cleaning fallback
      const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      return JSON.parse(cleaned);
    }
  };

  // Heuristic generation function - Expanded & Highly Informative
  const generateHeuristicIdea = (name, desc) => {
    const text = (name + ' ' + desc).toLowerCase();
    let features = '🛠️ CORE FEATURES:\n- Halaman Dashboard Utama & Analitik Ringkas\n- Manajemen Pengguna / Akses Peran\n- Pengaturan Konfigurasi Aplikasi\n\n🔒 AUTH & SECURITY:\n- Autentikasi Pengguna Aman\n- Pembatasan Rute Sisi Klien';
    let reference = 'Modern SaaS Dashboard / Tailwind UI';
    let extraNotes = '💡 PANDUAN UI/UX:\n- Pastikan desain responsif dengan grid fleksibel.\n- Gunakan tabel data interaktif dengan pagination.\n- Terapkan micro-interaction pada tombol klik.';
    
    if (text.includes('toko') || text.includes('kasir') || text.includes('pos') || text.includes('dagang') || text.includes('jualan') || text.includes('pasar') || text.includes('shop') || text.includes('product') || text.includes('checkout')) {
      features = '🛠️ CORE FEATURES:\n- Point of Sales (POS) Kasir Cepat dengan Pencarian Barcode\n- Manajemen Stok & Inventaris Real-Time (Warning Stok Menipis)\n- Laporan Omset & Laba Harian/Bulanan Terintegrasi Chart\n- Cetak Struk Belanja Langsung (Printer Thermal)\n\n📦 DATABASE & STATE:\n- Integrasi Tabel Firebase untuk Transaksi & Inventaris\n- State Management Global untuk Keranjang Belanja';
      reference = 'Moka POS / Pawoon / Shopify POS';
      extraNotes = '💡 PANDUAN UI/UX:\n- Prioritaskan kecepatan input dengan barcode scanner/shortcut keyboard.\n- Desain popup keranjang dengan transisi slide-in yang bouncy.\n- Terapkan visual badge warna hijau untuk produk ready dan merah untuk stok habis.';
    } else if (text.includes('chat') || text.includes('pesan') || text.includes('messenger') || text.includes('room') || text.includes('dm') || text.includes('inbox') || text.includes('livechat') || text.includes('whatsapp') || text.includes('telegram')) {
      features = '🛠️ CORE FEATURES:\n- Real-time Chat Messaging menggunakan Firestore / Realtime Database\n- Indikator Status Pengguna (Online/Offline) & Sedang Mengetik (Typing...)\n- Fitur Unggah Media Instan (Gambar, File, Audio)\n- Push Notification saat ada Pesan Masuk\n\n🔒 AUTH & SECURITY:\n- Sistem Enkripsi Pesan Dasar';
      reference = 'WhatsApp Web / Telegram Web / Discord Chat';
      extraNotes = '💡 PANDUAN UI/UX:\n- Animasi bubble chat harus mulus dengan efek slide-up.\n- Gunakan scroll otomatis ke bawah saat menerima pesan baru.\n- Sediakan feedback visual instan saat media berhasil dikirim.';
    } else if (text.includes('blog') || text.includes('artikel') || text.includes('berita') || text.includes('news') || text.includes('cms') || text.includes('writing') || text.includes('post')) {
      features = '🛠️ CORE FEATURES:\n- Editor Artikel Kaya (Rich Text/WYSIWYG Editor)\n- Manajemen Kategori & Tag Artikel Dinamis\n- SEO Meta Setup Terpadu (Saran Tag & Deskripsi Otomatis)\n- Kolom Komentar Pembaca dengan Sistem Filter Spam\n\n🎨 ADVANCED VISUALS:\n- Fitur Mode Gelap Membaca (Reading Mode)';
      reference = 'Medium / WordPress Gutenberg / Ghost CMS';
      extraNotes = '💡 PANDUAN UI/UX:\n- Gunakan tipografi premium dengan kontras tinggi untuk kenyamanan membaca.\n- Buat tata letak grid kartu artikel yang bersih dengan hover scaling 1.02x.\n- Tampilkan bar penunjuk kemajuan membaca (Reading Progress Bar) di bagian atas.';
    } else if (text.includes('ai') || text.includes('bot') || text.includes('gemini') || text.includes('openai') || text.includes('chatgpt') || text.includes('llm') || text.includes('pintar') || text.includes('assistant')) {
      features = '🛠️ CORE FEATURES:\n- Interaksi Prompt Teks Cerdas dengan Streaming Response UI\n- Fitur "Preset Prompts" untuk Memulai Percakapan dengan Cepat\n- Manajemen Riwayat Obrolan AI (Bisa Disimpan & Dihapus)\n- Export Hasil AI ke File Markdown/PDF\n\n🎨 ADVANCED VISUALS:\n- Efek "Typing Simulator" yang Halus';
      reference = 'ChatGPT Plus / Claude AI / Google Gemini Advanced';
      extraNotes = '💡 PANDUAN UI/UX:\n- Tambahkan efek loading shimmer/pulse yang futuristik saat AI sedang berpikir.\n- Tombol copy satu-klik untuk menyalin hasil respons AI.\n- Skema warna gradasi ungu-pink neon untuk memperkuat nuansa AI cerdas.';
    } else if (text.includes('tugas') || text.includes('todo') || text.includes('task') || text.includes('kanban') || text.includes('project') || text.includes('scrum') || text.includes('board') || text.includes('workflow') || text.includes('tracker')) {
      features = '🛠️ CORE FEATURES:\n- Papan Kanban Drag-and-Drop untuk Status Tugas (To Do, In Progress, Done)\n- Label Prioritas Tugas (High, Medium, Low) dengan Kode Warna\n- Tenggat Waktu (Due Date) dengan Pengingat Keterlambatan\n- Anggota Tim yang Ditugaskan untuk Setiap Tugas\n\n📦 DATABASE & STATE:\n- Sinkronisasi Drag-and-Drop ke Database Secara Real-Time';
      reference = 'Trello / Jira / Linear App';
      extraNotes = '💡 PANDUAN UI/UX:\n- Drag-and-drop kartu harus responsif dan terasa elastis.\n- Gunakan efek tumpukan kartu bertingkat yang rapi.\n- Tampilkan diagram lingkaran (Pie Chart) untuk visualisasi status proyek.';
    } else if (text.includes('finance') || text.includes('uang') || text.includes('kas') || text.includes('dompet') || text.includes('ledger') || text.includes('budget') || text.includes('pengeluaran') || text.includes('pemasukan') || text.includes('salary') || text.includes('akuntansi')) {
      features = '🛠️ CORE FEATURES:\n- Pencatatan Pemasukan & Pengeluaran Kas Terkategori\n- Visualisasi Cash Flow Bulanan menggunakan Line & Bar Charts\n- Pengatur Anggaran Belanja Maksimal (Warning Overbudget)\n- Rekap Laporan PDF Ringkas yang Siap Diunduh\n\n🔒 AUTH & SECURITY:\n- Passcode Keamanan Tambahan Sebelum Mengakses';
      reference = 'Jenius / Wallet App / Money Lover';
      extraNotes = '💡 PANDUAN UI/UX:\n- Gunakan warna hijau tegas untuk nominal positif (pemasukan) dan merah hangat untuk negatif (pengeluaran).\n- Tombol tambah transaksi cepat diletakkan di posisi tengah bawah.\n- Desain angka nominal uang dengan ukuran font tebal agar mudah dibaca.';
    } else if (text.includes('belajar') || text.includes('lms') || text.includes('course') || text.includes('kelas') || text.includes('edu') || text.includes('school') || text.includes('materi') || text.includes('quiz')) {
      features = '🛠️ CORE FEATURES:\n- Struktur Bab Pembelajaran & Sub-Bab Dinamis\n- Modul Pemutar Video/Audio Materi dengan Progress Tracking\n- Sistem Kuis Kunci Jawaban Instan & Skor Otomatis\n- Unduh Sertifikat Elektronik Setelah Menyelesaikan Kelas\n\n📦 DATABASE & STATE:\n- Simpan Progress Terakhir Kelas untuk Setiap Siswa';
      reference = 'Duolingo / Udemy / Ruangguru';
      extraNotes = '💡 PANDUAN UI/UX:\n- Buat progress bar belajar yang mencolok di dashboard siswa.\n- Desain kartu kelas dengan gambar ilustrasi menarik dan detail sisa waktu belajar.\n- Berikan efek konfeti mini saat kuis dijawab 100% benar.';
    } else if (name.length > 2 || desc.length > 4) {
      features = `🛠️ CORE FEATURES:\n- Modul Utama Integrasi ${name || 'Utama'}\n- Sistem Manajemen CRUD Lengkap (Create, Read, Update, Delete)\n- Dashboard Analitik & Pencarian Instan Global\n- Export & Import Data ke Format Excel / CSV\n\n🔒 AUTH & SECURITY:\n- Sistem Validasi Input & Keamanan Hak Akses`;
      reference = 'Modern SaaS Dashboard / Ant Design UI';
      extraNotes = '💡 PANDUAN UI/UX:\n- Gunakan rounded corner 16px-24px untuk konsistensi modern.\n- Terapkan skema warna yang serasi dengan tema global Agency OS Anda.\n- Desain state kosong (Empty State) yang informatif dilengkapi dengan tombol aksi.';
    }

    return { features, reference, layout: 'Responsive', extraNotes };
  };



  const handleGeminiGenerate = async () => {
    let apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      alert("API Key belum diatur! Silakan buka menu 'Pengaturan -> AI & Automasi' di sidebar kiri.");
      return; 
    }

    setIsGeneratingAI(true);
    try {

      const { newName, description, features, reference, extraNotes } = duplicateModal;
      const baseIdea = generateHeuristicIdea(newName || '', description || '');
      
      const currentFeatures = features || baseIdea.features;
      const currentReference = reference || baseIdea.reference;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Bertindaklah sebagai Senior Product Architect & UI/UX Specialist kelas dunia. Saya sedang mendesain modul aplikasi web inovatif baru dalam platform "Agency OS":
- Nama Modul/Aplikasi: "${newName}"
- Deskripsi Awal: "${description || 'Aplikasi kustom dengan fungsionalitas modern.'}"
- Referensi Dasar: "${currentReference}"
- Fitur Awal: "${currentFeatures}"

Tugas Anda adalah memperluas spesifikasi ini menjadi dokumen produk yang SANGAT DETAIL, INOVATIF, dan POWERFUL (Superpower).
Format output Anda harus berupa JSON murni dengan struktur persis seperti berikut (jangan berikan komentar di luar JSON):
{
  "features": "[Buat daftar fitur modular yang sangat kaya dan taktis. Bagi menjadi beberapa kategori seperti: 🛠️ CORE FEATURES, 🔒 AUTH & SECURITY, 📦 DATABASE & STATE, 🎨 ADVANCED VISUALS. Jelaskan setiap fitur secara detail agar developer langsung mengerti cara membuatnya]",
  "reference": "[Rekomendasikan 2-3 aplikasi/produk startup kelas dunia yang sukses di bidang ini. Sebutkan kelebihan visual/arsitektur spesifik yang wajib kita tiru atau modifikasi dari mereka]",
  "extraNotes": "[Berikan panduan UI/UX mutakhir, skema desain (seperti glassmorphic/dark mode), jenis animasi/transisi mikro (misal Framer Motion / CSS keyframes), skema tabel database (Firebase/SQL) yang direkomendasikan, serta trik optimasi performa]"
}

Harap berikan respons dalam bahasa Indonesia yang profesional, penuh motivasi teknologi tinggi, dan tanpa menyisipkan blok pembungkus markdown \`\`\`json.`
            }]
          }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        const parsed = extractJsonFromText(textResponse);
        
        const stringifyVal = (val) => {
          if (!val) return '';
          if (typeof val === 'string') return val;
          if (Array.isArray(val)) return val.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join('\n');
          return JSON.stringify(val, null, 2);
        };

        setDuplicateModal(prev => ({
          ...prev,
          features: stringifyVal(parsed.features),
          reference: stringifyVal(parsed.reference),
          extraNotes: stringifyVal(parsed.extraNotes)
        }));
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Gagal memanggil Gemini API: ${errorData.error?.message || response.statusText}. Cek API Key Anda.`);
      }
    } catch (err) {
      console.warn("Gemini API Error", err);
      alert("Terjadi kesalahan saat memanggil Gemini API.");
    }
    setIsGeneratingAI(false);
  };

  const activeApp = apps.find(a => a.id === activeAppId);

  const submitDuplicate = async (e) => {
    e.preventDefault();
    if(!duplicateModal.newId || !duplicateModal.newName) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/apps/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateModal)
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if(res.ok && isJson) {
        const json = await res.json();
        setLocalApps([...localApps, { id: duplicateModal.newId, config: { name: duplicateModal.newName, color: '#10b981' }, Component: () => <div>Loading...</div> }]);
        setDuplicateModal(null);
        if (json.promptText) {
          setPromptModal(json.promptText);
        }
      } else {
        const errJson = isJson ? await res.json() : {};
        alert(`Gagal menduplikasi: ${errJson.error || 'Terjadi kesalahan di server lokal. Pastikan server (npm run dev) aktif.'}`);
      }
    } catch(err) {
      alert(`Error network: ${err.message}. Pastikan server menyala.`);
    }
    setIsProcessing(false);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/apps/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModal)
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if(res.ok && isJson) {
        setLocalApps(localApps.map(a => a.id === editModal.appId ? { ...a, config: { ...a.config, name: editModal.newName, color: editModal.newColor, iconData: editModal.newIconData || a.config.iconData } } : a));
        setEditModal(null);
      } else alert('Gagal mengupdate (Pastikan Anda sudah me-restart terminal npm run dev!)');

    } catch(err) {
      alert('Error: Fitur hanya tersedia di lokal (npm run dev)');
    }
    setIsProcessing(false);
  };

  const handleDelete = async (appId) => {
    if(!window.confirm(`Hapus permanen folder aplikasi: ${appId}?`)) return;
    try {
      const res = await fetch('/api/apps/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId })
      });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if(res.ok && isJson) {
        setLocalApps(localApps.filter(a => a.id !== appId));
      } else alert('Gagal menghapus (Pastikan Anda sudah me-restart terminal npm run dev!)');

    } catch(err) {
      alert('Error: Fitur hanya tersedia di lokal (npm run dev)');
    }
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditModal({...editModal, newIconData: event.target.result});
    };
    reader.readAsDataURL(file);
  };

  if (activeApp) {
    const { Component, config } = activeApp;
    return (
      <div style={{ animation: 'cmsFadeIn 0.4s ease', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <button onClick={() => setActiveAppId(null)} className="sidebar-icon-btn" style={{ width: 44, height: 44, borderRadius: 12 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: config.color || 'var(--cms-accent)', letterSpacing: '0.15em' }}>APLIKASI AKTIF</div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>{config.name}</div>
          </div>
        </div>
        <div className="cms-card premium-glass" style={{ borderRadius: 32, overflow: 'hidden', minHeight: '70vh' }}>
          <Component />
        </div>
      </div>
    );
  }

  return (
    <div className="apps-manager-root" style={{ animation: 'cmsFadeIn 0.5s ease', padding: '16px 12px 80px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', position: 'relative' }}>
      
      {/* HEADER SECTION */}
      <div className="apps-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ padding: '4px 12px', background: 'rgba(var(--cms-accent-rgb), 0.1)', color: 'var(--cms-accent, #7c3aed)', borderRadius: 100, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}>SUMR.DAY APPS</div>
            <div style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 100, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em' }}>INTERACTIVE</div>
          </div>
          <h1 className="apps-title" style={{ fontSize: 'clamp(24px, 5vw, 44px)', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', color: 'var(--cms-text)', lineHeight: 1.1 }}>Apps</h1>
          <p style={{ color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 8, fontSize: 13, maxWidth: 600, lineHeight: 1.5 }}>Modul cerah, aplikasi seru, dan ekstensi interaktif sumr.day studio ☀️</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="cms-card" style={{ padding: '8px 18px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-text)' }}>{localApps.length} Aplikasi Terpasang</div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {localApps.map((app) => (
          <div 
            key={app.id} 
            className="cms-card app-card premium-glass" 
            {...bindContextMenu(() => getAppContextMenu(app))}
            style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.25s ease', cursor: 'default', position: 'relative', overflow: 'hidden', border: '1.5px solid var(--glass-border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${app.config.color || '#7c3aed'}15`, color: app.config.color || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 16px ${app.config.color || '#7c3aed'}10` }}>
                {app.config.iconData ? <img src={app.config.iconData} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} /> : (app.config.icon || <Package size={24} />)}
              </div>
              {isDev && (
                <div style={{ display: 'flex', gap: 6, position: 'relative', zIndex: 10 }}>
                  <button onClick={() => setDuplicateModal({ sourceId: app.id, newId: `${app.id}_Copy`, newName: `${app.config.name} Copy` })} className="sidebar-icon-btn sm" title="Duplikasi (Copy)"><Copy size={13} /></button>
                  <button onClick={() => setEditModal({ appId: app.id, newName: app.config.name, newColor: app.config.color || '#7c3aed', newIconData: app.config.iconData })} className="sidebar-icon-btn sm" title="Edit App"><Edit3 size={13} /></button>
                  <button onClick={() => handleDelete(app.id)} className="sidebar-icon-btn danger sm" title="Hapus"><Trash2 size={13} /></button>
                </div>
              )}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 6px', color: 'var(--cms-text)', letterSpacing: '-0.02em' }}>{app.config.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600, lineHeight: 1.4, minHeight: 34, margin: 0 }}>{app.config.description || 'Gunakan aplikasi ini untuk meningkatkan fungsionalitas sumr.day OS.'}</p>
            </div>

            <button onClick={() => setActiveAppId(app.id)} className="cms-btn" style={{ position: 'relative', zIndex: 10, marginTop: 4, padding: '10px 16px', borderRadius: 12, background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, fontSize: 12, width: '100%', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb), 0.25)' }}>
              Buka Aplikasi
            </button>

            <div style={{ position: 'absolute', bottom: -5, right: 10, fontSize: 32, fontWeight: 900, opacity: 0.03, pointerEvents: 'none' }}>{app.id.toUpperCase()}</div>
          </div>
        ))}

        {isDev && (
          <div onClick={() => setDuplicateModal({ sourceId: '_template', newId: 'Template_Baru', newName: 'Aplikasi Baru' })} style={{ padding: 24, borderRadius: 16, border: '2px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, minHeight: 200, background: 'rgba(0,0,0,0.01)', cursor: 'pointer' }} className="hover-scale">
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)' }}><Plus size={20} /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Tambah Aplikasi Baru</div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 2 }}>Duplikasi template kosong</div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {duplicateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cms-card cms-modal-card premium-glass" style={{ padding: 24, borderRadius: 20, width: 600, maxWidth: '95%', display: 'flex', flexDirection: 'column', position: 'relative', maxHeight: '90vh' }}>
            <button onClick={() => setDuplicateModal(null)} className="sidebar-icon-btn sm" style={{ position: 'absolute', top: 20, right: 20 }}><X size={16} /></button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>Duplikasi Aplikasi</h3>
            </div>
            <form onSubmit={submitDuplicate} style={{ display: 'flex', flexDirection: 'column', gap: 15, overflowY: 'auto', padding: '4px 5px' }}>
              <div style={{ display: 'flex', gap: 15 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>NAMA FOLDER BARU</label>
                  <input required value={duplicateModal.newId} onChange={e => setDuplicateModal({...duplicateModal, newId: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')})} className="cms-input" style={{ width: '100%', padding: '12px 20px', borderRadius: 30, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)' }} placeholder="NamaFolderTanpaSpasi" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>NAMA APLIKASI (DISPLAY)</label>
                  <input required value={duplicateModal.newName} onChange={e => setDuplicateModal({...duplicateModal, newName: e.target.value})} className="cms-input" style={{ width: '100%', padding: '12px 20px', borderRadius: 30, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)' }} placeholder="Nama Aplikasi Keren" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>DESKRIPSI SINGKAT</label>
                <input value={duplicateModal.description || ''} onChange={e => setDuplicateModal({...duplicateModal, description: e.target.value})} className="cms-input" style={{ width: '100%', padding: '12px 20px', borderRadius: 30, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)' }} placeholder="Aplikasi untuk..." />
              </div>
              
              <button 
                type="button" 
                onClick={handleGeminiGenerate} 
                disabled={isGeneratingAI || !duplicateModal.newName}
                className="cms-btn hover-scale" 
                style={{ width: '100%', padding: '12px 10px', borderRadius: 99, background: 'var(--cms-card-bg)', color: 'var(--cms-accent)', fontWeight: 800, border: '2px solid var(--cms-accent)', cursor: (isGeneratingAI || !duplicateModal.newName) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, opacity: (!duplicateModal.newName) ? 0.5 : 1, marginTop: 5, marginBottom: 5 }}
              >
                <Sparkles size={16} /> 
                {isGeneratingAI ? 'Gemini Sedang Menulis...' : 'Tanya Gemini (Auto Fill Fitur & Catatan)'}
              </button>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>FITUR UTAMA</label>
                <textarea value={duplicateModal.features || ''} onChange={e => setDuplicateModal({...duplicateModal, features: e.target.value})} className="cms-input" style={{ width: '100%', padding: '15px 20px', borderRadius: 30, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', minHeight: 80 }} placeholder="- Bisa upload foto&#10;- Login via google" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>REFERENSI FITUR (TIRU DARI)</label>
                <input value={duplicateModal.reference || ''} onChange={e => setDuplicateModal({...duplicateModal, reference: e.target.value})} className="cms-input" style={{ width: '100%', padding: '12px 20px', borderRadius: 30, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)' }} placeholder="Contoh: Fitur mirip Tokopedia/Gojek" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>TAMPILAN CLIENT</label>
                <div style={{ position: 'relative' }}>
                  <div 
                    className="cms-input hover-scale"
                    onClick={() => setIsLayoutSelectOpen(!isLayoutSelectOpen)}
                    style={{ width: '100%', padding: '12px 20px', borderRadius: 30, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span>
                      {(!duplicateModal.layout || duplicateModal.layout === 'Responsive') ? 'Fleksibel (Portrait & Landscape, semua media)' : 
                       duplicateModal.layout === 'Mobile Portrait' ? 'Mobile Portrait Only (seperti TikTok)' : 
                       'Desktop Only'}
                    </span>
                    <ChevronDown size={16} style={{ transition: 'transform 0.3s', transform: isLayoutSelectOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </div>
                  {isLayoutSelectOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8, background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: 8, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', animation: 'cmsFadeIn 0.2s ease' }}>
                      {['Responsive', 'Mobile Portrait', 'Desktop Only'].map((val) => (
                        <div 
                          key={val}
                          onClick={() => {
                            setDuplicateModal({...duplicateModal, layout: val});
                            setIsLayoutSelectOpen(false);
                          }}
                          style={{ padding: '12px 16px', borderRadius: 16, cursor: 'pointer', fontWeight: 600, background: (duplicateModal.layout || 'Responsive') === val ? 'var(--cms-accent-soft)' : 'transparent', color: (duplicateModal.layout || 'Responsive') === val ? 'var(--cms-accent)' : 'var(--cms-text)' }}
                          onMouseEnter={e => { if((duplicateModal.layout || 'Responsive') !== val) e.currentTarget.style.background = 'var(--cms-switcher-bg)' }}
                          onMouseLeave={e => { if((duplicateModal.layout || 'Responsive') !== val) e.currentTarget.style.background = 'transparent' }}
                        >
                          {val === 'Responsive' ? 'Fleksibel (Portrait & Landscape, semua media)' : 
                           val === 'Mobile Portrait' ? 'Mobile Portrait Only (seperti TikTok)' : 
                           'Desktop Only'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>CATATAN TAMBAHAN (OPSIONAL)</label>
                <textarea value={duplicateModal.extraNotes || ''} onChange={e => setDuplicateModal({...duplicateModal, extraNotes: e.target.value})} className="cms-input" style={{ width: '100%', padding: '15px 20px', borderRadius: 30, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', minHeight: 60 }} placeholder="Tema gelap wajib" />
              </div>
              <button type="submit" disabled={isProcessing} className="cms-btn hover-scale" style={{ width: '100%', padding: '16px', borderRadius: 99, background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 10, boxShadow: '0 8px 20px rgba(var(--cms-accent-rgb), 0.3)' }}>
                {isProcessing ? 'Memproses...' : 'Buat Aplikasi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {promptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cms-card premium-glass" style={{ padding: 30, borderRadius: 24, width: 600, maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontWeight: 900, color: 'var(--cms-accent)' }}><Sparkles size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Prompt AI Siap Dicopy</h3>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted)' }}>Berikan teks ini ke AI assistant Anda (seperti saya) agar langsung memahami cara coding fitur Anda!</p>
              </div>
              <button onClick={() => setPromptModal(null)} className="sidebar-icon-btn sm"><X size={16} /></button>
            </div>
            <textarea 
              readOnly 
              value={promptModal} 
              className="cms-input" 
              style={{ width: '100%', height: 300, padding: '15px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--cms-text)', fontSize: 13, fontFamily: 'monospace', resize: 'vertical' }}
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(promptModal);
                alert("Prompt berhasil dicopy!");
              }} 
              className="cms-btn" 
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Copy size={16} /> Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cms-card cms-modal-card premium-glass" style={{ padding: 24, borderRadius: 20, width: 400, maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>Edit Aplikasi: {editModal.appId}</h3>
              <button onClick={() => setEditModal(null)} className="sidebar-icon-btn sm"><X size={16} /></button>
            </div>
            <form onSubmit={submitEdit}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>NAMA APLIKASI</label>
                <input required value={editModal.newName} onChange={e => setEditModal({...editModal, newName: e.target.value})} className="cms-input" style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <GlassColorPicker 
                  label="WARNA TEMA (HEX)"
                  value={editModal.newColor} 
                  onChange={val => setEditModal({...editModal, newColor: val})} 
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 8, color: 'var(--cms-text-muted)' }}>IKON APLIKASI (PNG/SVG)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {editModal.newIconData && <img src={editModal.newIconData} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />}
                  <input type="file" accept="image/png, image/svg+xml" onChange={handleIconUpload} className="cms-input" style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 12 }} />
                </div>
              </div>
              <button type="submit" disabled={isProcessing} className="cms-btn" style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'var(--cms-accent)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .apps-manager-root {
            padding: 16px 16px calc(90px + env(safe-area-inset-bottom, 16px)) 16px !important;
          }
          .apps-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; margin-bottom: 24px !important; }
          .apps-title { font-size: 24px !important; }
        }
        .hover-scale { transition: transform 0.2s ease; }
        .hover-scale:hover { transform: translateY(-4px); border-color: var(--cms-accent) !important; }
      `}</style>
    </div>
  );
};

export default AppsManager;
