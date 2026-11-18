import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  Database, 
  Image, 
  Sparkles, 
  Code, 
  LayoutGrid, 
  Copy, 
  Download, 
  Save, 
  RefreshCw, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Server,
  Layers,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  FIREBASE_CONFIG, 
  CLOUDINARY_CONFIG, 
  GOOGLE_CONFIG, 
  AI_CONFIG, 
  APP_CONFIG, 
  STORAGE_KEYS,
  getEnvOverrides,
  saveEnvOverrides
} from '../../config/AppConfig';

export type ServiceTarget = 'all' | 'firebase' | 'cloudinary' | 'gemini' | 'appsScript' | 'sheets';

interface EnvConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: ServiceTarget;
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onSaved?: () => void;
}

export const EnvConfigModal: React.FC<EnvConfigModalProps> = ({
  isOpen,
  onClose,
  initialService = 'all',
  notify = () => {},
  onSaved = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<ServiceTarget>(initialService);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLocalServer, setIsLocalServer] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Form State initialized from effective configs
  const [form, setForm] = useState({
    // Firebase
    VITE_FIREBASE_PROJECT_ID: '',
    VITE_FIREBASE_AUTH_DOMAIN: '',
    VITE_FIREBASE_API_KEY: '',
    VITE_FIREBASE_STORAGE_BUCKET: '',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '',
    VITE_FIREBASE_APP_ID: '',
    VITE_FIREBASE_MEASUREMENT_ID: '',
    // Cloudinary
    VITE_CLOUDINARY_NAME: '',
    VITE_CLOUDINARY_PRESET: '',
    // Gemini AI
    VITE_GEMINI_API_KEY: '',
    // Google Services
    VITE_GOOGLE_APPS_SCRIPT_URL: '',
    VITE_GOOGLE_SHEET_ID: '',
    // App & Storage
    VITE_STORAGE_PREFIX: '',
    VITE_APP_NAME: '',
    VITE_APP_DOMAIN: ''
  });

  // Load current values whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialService) {
      setActiveTab(initialService);
    }

    // Check if running on local dev server
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    setIsLocalServer(isLocal);

    // Read existing overrides
    const overrides = getEnvOverrides();

    // Populate with effective values
    setForm({
      VITE_FIREBASE_PROJECT_ID: overrides.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId || '',
      VITE_FIREBASE_AUTH_DOMAIN: overrides.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG.authDomain || '',
      VITE_FIREBASE_API_KEY: overrides.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey || '',
      VITE_FIREBASE_STORAGE_BUCKET: overrides.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG.storageBucket || '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: overrides.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG.messagingSenderId || '',
      VITE_FIREBASE_APP_ID: overrides.VITE_FIREBASE_APP_ID || FIREBASE_CONFIG.appId || '',
      VITE_FIREBASE_MEASUREMENT_ID: overrides.VITE_FIREBASE_MEASUREMENT_ID || FIREBASE_CONFIG.measurementId || '',

      VITE_CLOUDINARY_NAME: overrides.VITE_CLOUDINARY_NAME || CLOUDINARY_CONFIG.cloudName || '',
      VITE_CLOUDINARY_PRESET: overrides.VITE_CLOUDINARY_PRESET || CLOUDINARY_CONFIG.uploadPreset || '',

      VITE_GEMINI_API_KEY: overrides.VITE_GEMINI_API_KEY || AI_CONFIG.geminiApiKey || '',

      VITE_GOOGLE_APPS_SCRIPT_URL: overrides.VITE_GOOGLE_APPS_SCRIPT_URL || GOOGLE_CONFIG.appsScriptUrl || '',
      VITE_GOOGLE_SHEET_ID: overrides.VITE_GOOGLE_SHEET_ID || GOOGLE_CONFIG.sheetId || '',

      VITE_STORAGE_PREFIX: overrides.VITE_STORAGE_PREFIX || STORAGE_KEYS.prefix || '',
      VITE_APP_NAME: overrides.VITE_APP_NAME || APP_CONFIG.name || '',
      VITE_APP_DOMAIN: overrides.VITE_APP_DOMAIN || APP_CONFIG.domain || ''
    });
  }, [isOpen, initialService]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleTutorial = (name: string) => {
    setActiveTutorial(prev => (prev === name ? null : name));
  };

  // Generate full .env formatted text
  const generateEnvText = () => {
    return `# Konfigurasi Environment Agenze Platform
# Diperbarui dari Pengaturan Admin pada ${new Date().toLocaleString('id-ID')}

# Firebase
VITE_FIREBASE_API_KEY=${form.VITE_FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${form.VITE_FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_PROJECT_ID=${form.VITE_FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${form.VITE_FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${form.VITE_FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${form.VITE_FIREBASE_APP_ID}
VITE_FIREBASE_MEASUREMENT_ID=${form.VITE_FIREBASE_MEASUREMENT_ID}

# Cloudinary
VITE_CLOUDINARY_NAME=${form.VITE_CLOUDINARY_NAME}
VITE_CLOUDINARY_PRESET=${form.VITE_CLOUDINARY_PRESET}

# Google Services
VITE_GOOGLE_APPS_SCRIPT_URL=${form.VITE_GOOGLE_APPS_SCRIPT_URL}
VITE_GOOGLE_SHEET_ID=${form.VITE_GOOGLE_SHEET_ID}

# AI / Gemini
VITE_GEMINI_API_KEY=${form.VITE_GEMINI_API_KEY}

# App & Storage
VITE_APP_NAME=${form.VITE_APP_NAME}
VITE_APP_DOMAIN=${form.VITE_APP_DOMAIN}
VITE_STORAGE_PREFIX=${form.VITE_STORAGE_PREFIX}
`;
  };

  const handleCopyEnv = () => {
    const text = generateEnvText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    notify('Format .env berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadEnv = () => {
    const text = generateEnvText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
    notify('File .env berhasil diunduh!', 'success');
  };

  const handleResetToBuildEnv = () => {
    if (window.confirm('Kembalikan semua nilai ke bawaan awal build? Override saat ini akan dihapus.')) {
      localStorage.removeItem('porto_env_overrides');
      notify('Override berhasil dihapus. Nilai kembali ke default.', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // Test Gemini Key Live
  const handleTestGemini = async () => {
    const key = form.VITE_GEMINI_API_KEY.trim();
    if (!key) {
      notify('Kunci Gemini AI belum diisi', 'warning');
      return;
    }
    setIsTestingAi(true);
    setAiTestResult(null);
    const start = performance.now();
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Halo' }] }]
          })
        }
      );
      const latency = Math.round(performance.now() - start);
      if (resp.ok) {
        setAiTestResult({ success: true, message: 'Koneksi Berhasil!', latency });
        notify(`Gemini AI aktif (${latency}ms)`, 'success');
      } else {
        const errData = await resp.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${resp.status}`;
        setAiTestResult({ success: false, message: `Gagal: ${msg}` });
        notify(`Uji Gemini gagal: ${msg}`, 'error');
      }
    } catch (e: any) {
      setAiTestResult({ success: false, message: e.message || 'Network error' });
      notify(`Gagal menghubungi Gemini: ${e.message}`, 'error');
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Simpan ke local storage vault (KEBAL RESET TOTAL)
      saveEnvOverrides(form);

      // Juga sinkronkan kunci Gemini khusus jika ada
      if (form.VITE_GEMINI_API_KEY) {
        localStorage.setItem('GEMINI_API_KEY', form.VITE_GEMINI_API_KEY);
      }

      // 2. Jika di environment lokal (Vite Dev Server), kirim ke endpoint /api/env/update
      let syncedToDisk = false;
      if (isLocalServer) {
        try {
          const resp = await fetch('/api/env/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: form })
          });
          if (resp.ok) {
            syncedToDisk = true;
          }
        } catch {
          // Dev server endpoint might not be available if not in dev mode
        }
      }

      notify(
        syncedToDisk
          ? 'Konfigurasi berhasil disimpan & langsung tersinkron ke file .env lokal!'
          : 'Konfigurasi berhasil disimpan di Brankas Aman (Kebal Reset Total)!',
        'success'
      );

      onSaved();
      onClose();

      // Refresh window agar semua module (Firebase, Cloudinary, AppConfig) me-reload config baru
      setTimeout(() => {
        window.location.reload();
      }, 700);

    } catch (err: any) {
      notify(`Gagal menyimpan: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: ServiceTarget; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Semua Layanan', icon: <Layers size={14} /> },
    { id: 'firebase', label: 'Firebase', icon: <Database size={14} /> },
    { id: 'cloudinary', label: 'Cloudinary', icon: <Image size={14} /> },
    { id: 'gemini', label: 'Gemini AI', icon: <Sparkles size={14} /> },
    { id: 'appsScript', label: 'Google Script', icon: <Code size={14} /> },
    { id: 'sheets', label: 'Google Sheets', icon: <LayoutGrid size={14} /> },
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(4, 4, 8, 0.82)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '92vh',
          background: 'var(--cms-card-bg, #111827)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          color: 'var(--cms-text, #f9fafb)'
        }}
      >
        {/* ── HEADER ── */}
        <div 
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))',
                color: 'var(--cms-accent, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>
                Pengaturan Environment (.env)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--cms-text-muted, #9ca3af)', fontWeight: 600 }}>
                Ubah kredensial & koneksi layanan sistem
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--cms-text-muted, #9ca3af)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="hover-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── STATUS VAULT BANNER ── */}
        <div 
          style={{
            padding: '10px 24px',
            background: isLocalServer ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            borderBottom: `1px solid ${isLocalServer ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 11.5
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color={isLocalServer ? '#10b981' : '#3b82f6'} />
            <span>
              <strong>{isLocalServer ? 'Mode Lokal' : 'Mode Deploy'}:</strong>{' '}
              {isLocalServer 
                ? 'Tersinkron otomatis ke file .env di coding laptop Anda.'
                : 'Tersimpan di Brankas Browser (Kebal dari tombol Reset Total & Hapus DB).'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleCopyEnv}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--cms-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
              title="Salin isi konfigurasi dalam format .env"
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              {copied ? 'Disalin' : 'Salin .env'}
            </button>

            <button
              type="button"
              onClick={handleDownloadEnv}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--cms-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
              title="Unduh file .env untuk coding"
            >
              <Download size={12} />
              Unduh .env
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div 
          style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '8px 24px',
            gap: 6,
            borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
            background: 'rgba(0,0,0,0.1)'
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                border: 'none',
                background: activeTab === tab.id ? 'var(--cms-accent, #8b5cf6)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--cms-text-muted, #9ca3af)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── BODY (SCROLLABLE) ── */}
        <div 
          style={{
            padding: 24,
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}
        >
          {/* EXPLANATION ACCORDION (Answers user's question about deploy mode) */}
          <div 
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))'
            }}
          >
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                cursor: 'pointer' 
              }}
              onClick={() => toggleTutorial('system_sync')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={14} color="var(--cms-accent)" />
                <span style={{ fontSize: 12, fontWeight: 850, color: 'var(--cms-text)' }}>
                  Cara Sistem Menyimpan ke Coding (Lokal vs Deploy)
                </span>
              </div>
              {activeTutorial === 'system_sync' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {activeTutorial === 'system_sync' && (
              <div style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>1. Saat Mode Coding / Lokal (npm run dev):</strong><br />
                  Sistem langsung mengirim perintah ke server lokal Vite untuk <strong>langsung menulis dan memperbarui file <code>.env</code> di laptop Anda</strong>. Coding langsung sinkron seketika.
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>2. Saat Mode Deploy (Sudah Online di Web):</strong><br />
                  Secara keamanan internet, browser tidak diizinkan membuka harddisk laptop Anda dari jarak jauh. Oleh karena itu, sistem menyimpannya di <strong>Brankas Override Browser (100% Kebal Reset Total)</strong>. Website online langsung bekerja dengan kredensial baru tanpa perlu upload ulang.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>3. Sinkronkan ke Coding dari Web:</strong><br />
                  Klik tombol <strong>"Salin .env"</strong> atau <strong>"Unduh .env"</strong> di pojok atas, lalu tempelkan ke file <code>.env</code> project di VS Code kapan saja Anda mau.
                </p>
              </div>
            )}
          </div>

          {/* ══════════ SECTION: FIREBASE ══════════ */}
          {(activeTab === 'all' || activeTab === 'firebase') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b' }}>
                  <Database size={16} /> Firebase Konfigurasi
                </h4>
                <button
                  type="button"
                  onClick={() => toggleTutorial('tut_firebase')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <BookOpen size={12} /> Tutorial Lokasi
                </button>
              </div>

              {activeTutorial === 'tut_firebase' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                  Buka <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#ffffff', background: '#2563eb', fontWeight: 700, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>console.firebase.google.com <ExternalLink size={11} color="#ffffff" /></a> &rarr; <strong>Project Settings &rarr; General &rarr; Your Apps &rarr; Web App</strong>. Salin nilai <code>projectId</code>, <code>apiKey</code>, <code>authDomain</code>, dll.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={form.VITE_FIREBASE_PROJECT_ID}
                    onChange={(e) => handleChange('VITE_FIREBASE_PROJECT_ID', e.target.value)}
                    placeholder="websiteagenzie"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={form.VITE_FIREBASE_AUTH_DOMAIN}
                    onChange={(e) => handleChange('VITE_FIREBASE_AUTH_DOMAIN', e.target.value)}
                    placeholder="websiteagenzie.firebaseapp.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    API Key
                  </label>
                  <input
                    type="text"
                    value={form.VITE_FIREBASE_API_KEY}
                    onChange={(e) => handleChange('VITE_FIREBASE_API_KEY', e.target.value)}
                    placeholder="AIzaSy..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={form.VITE_FIREBASE_STORAGE_BUCKET}
                    onChange={(e) => handleChange('VITE_FIREBASE_STORAGE_BUCKET', e.target.value)}
                    placeholder="websiteagenzie.firebasestorage.app"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Sender ID
                  </label>
                  <input
                    type="text"
                    value={form.VITE_FIREBASE_MESSAGING_SENDER_ID}
                    onChange={(e) => handleChange('VITE_FIREBASE_MESSAGING_SENDER_ID', e.target.value)}
                    placeholder="434116660065"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    App ID
                  </label>
                  <input
                    type="text"
                    value={form.VITE_FIREBASE_APP_ID}
                    onChange={(e) => handleChange('VITE_FIREBASE_APP_ID', e.target.value)}
                    placeholder="1:434116660065:web:..."
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════ SECTION: CLOUDINARY ══════════ */}
          {(activeTab === 'all' || activeTab === 'cloudinary') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
                  <Image size={16} /> Cloudinary Gambar
                </h4>
                <button
                  type="button"
                  onClick={() => toggleTutorial('tut_cloudinary')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <BookOpen size={12} /> Tutorial Lokasi
                </button>
              </div>

              {activeTutorial === 'tut_cloudinary' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                  Buka <a href="https://cloudinary.com/console" target="_blank" rel="noreferrer" style={{ color: '#ffffff', background: '#2563eb', fontWeight: 700, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>Cloudinary Dashboard <ExternalLink size={11} color="#ffffff" /></a> &rarr; Salin <strong>Cloud Name</strong>. Untuk preset: Buka <strong>Settings &rarr; Upload &rarr; Upload Presets</strong>, buat preset dengan Signing Mode: <strong>Unsigned</strong>.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Cloud Name
                  </label>
                  <input
                    type="text"
                    value={form.VITE_CLOUDINARY_NAME}
                    onChange={(e) => handleChange('VITE_CLOUDINARY_NAME', e.target.value)}
                    placeholder="dlvjat7lg"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Upload Preset
                  </label>
                  <input
                    type="text"
                    value={form.VITE_CLOUDINARY_PRESET}
                    onChange={(e) => handleChange('VITE_CLOUDINARY_PRESET', e.target.value)}
                    placeholder="ml_default"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════ SECTION: GEMINI AI ══════════ */}
          {(activeTab === 'all' || activeTab === 'gemini') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
                  <Sparkles size={16} /> Gemini AI
                </h4>
                <button
                  type="button"
                  onClick={() => toggleTutorial('tut_gemini')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <BookOpen size={12} /> Tutorial Lokasi
                </button>
              </div>

              {activeTutorial === 'tut_gemini' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                  Buka <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#ffffff', background: '#2563eb', fontWeight: 700, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>aistudio.google.com/app/apikey <ExternalLink size={11} color="#ffffff" /></a>. Klik <strong>Create API Key</strong>, lalu salin kuncinya ke kolom di bawah.
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                  Gemini Key
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    value={form.VITE_GEMINI_API_KEY}
                    onChange={(e) => handleChange('VITE_GEMINI_API_KEY', e.target.value)}
                    placeholder="AQ.Ab8RN6KQ6..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={isTestingAi || !form.VITE_GEMINI_API_KEY}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: 10,
                      padding: '0 16px',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: isTestingAi ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {isTestingAi ? <Loader2 size={13} className="cms-spin" /> : <Sparkles size={13} />}
                    Tes Gemini
                  </button>
                </div>

                {aiTestResult && (
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: aiTestResult.success ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {aiTestResult.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {aiTestResult.message} {aiTestResult.latency ? `(${aiTestResult.latency}ms)` : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ SECTION: GOOGLE SERVICES ══════════ */}
          {(activeTab === 'all' || activeTab === 'appsScript' || activeTab === 'sheets') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, color: '#34d399' }}>
                  <Code size={16} /> Google Script & Sheets
                </h4>
                <button
                  type="button"
                  onClick={() => toggleTutorial('tut_google')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <BookOpen size={12} /> Tutorial Lokasi
                </button>
              </div>

              {activeTutorial === 'tut_google' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                  <strong>Script URL:</strong> Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: '#ffffff', background: '#2563eb', fontWeight: 700, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>script.google.com <ExternalLink size={11} color="#ffffff" /></a> &rarr; <strong>Deploy &rarr; New Deployment &rarr; Web App (Access: Anyone)</strong> &rarr; Salin URL yang berakhiran <code>/exec</code>.<br />
                  <strong>Sheet ID:</strong> Buka spreadsheet Google Sheets &rarr; Ambil ID panjang di antara <code>/d/</code> dan <code>/edit</code> pada URL browser.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Script URL (/exec)
                  </label>
                  <input
                    type="text"
                    value={form.VITE_GOOGLE_APPS_SCRIPT_URL}
                    onChange={(e) => handleChange('VITE_GOOGLE_APPS_SCRIPT_URL', e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Sheet ID
                  </label>
                  <input
                    type="text"
                    value={form.VITE_GOOGLE_SHEET_ID}
                    onChange={(e) => handleChange('VITE_GOOGLE_SHEET_ID', e.target.value)}
                    placeholder="11CteMG8hM_W0Eh6cvXF9sHJ-bbsu0NhnWSfR3OtAhaw"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════ SECTION: STORAGE & APP ══════════ */}
          {activeTab === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cms-accent)' }}>
                <Layers size={16} /> Prefix & Brand
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    Storage Prefix
                  </label>
                  <input
                    type="text"
                    value={form.VITE_STORAGE_PREFIX}
                    onChange={(e) => handleChange('VITE_STORAGE_PREFIX', e.target.value)}
                    placeholder="porto"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    App Name
                  </label>
                  <input
                    type="text"
                    value={form.VITE_APP_NAME}
                    onChange={(e) => handleChange('VITE_APP_NAME', e.target.value)}
                    placeholder="sumr.day"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>
                    App Domain
                  </label>
                  <input
                    type="text"
                    value={form.VITE_APP_DOMAIN}
                    onChange={(e) => handleChange('VITE_APP_DOMAIN', e.target.value)}
                    placeholder="https://websiteagenzie.web.app"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div 
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <button
            type="button"
            onClick={handleResetToBuildEnv}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--cms-text-muted)',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            className="hover-opacity"
            title="Hapus override dan kembali ke nilai default saat build"
          >
            <RotateCcw size={13} />
            Reset ke Bawaan
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0 18px',
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
                background: 'transparent',
                color: 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 800,
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
                padding: '0 22px',
                height: 40,
                borderRadius: 10,
                border: 'none',
                background: 'var(--cms-accent, #8b5cf6)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 850,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
              }}
            >
              {isSaving ? <Loader2 size={15} className="cms-spin" /> : <Save size={15} />}
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
  background: 'var(--cms-input-bg, rgba(255, 255, 255, 0.05))',
  color: 'var(--cms-text, #f9fafb)',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box'
};
