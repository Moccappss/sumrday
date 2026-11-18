import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Globe, 
  Plus, 
  Trash2, 
  Edit3, 
  Server, 
  Layers, 
  BookOpen, 
  Sparkles, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Info,
  CheckCheck
} from 'lucide-react';

export interface DeployTarget {
  id: string;
  name: string;
  projectId: string;
  apiKey?: string;
  appId?: string;
  messagingSenderId?: string;
  measurementId?: string;
  geminiApiKey?: string;
  sheetId?: string;
  appsScriptUrl?: string;
  storagePrefix?: string;
  cloudinaryName?: string;
  cloudinaryPreset?: string;
  lastDeployedAt?: string;
}

interface DeployTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DeployTargetModal: React.FC<DeployTargetModalProps> = ({
  isOpen,
  onClose,
  notify = () => {}
}) => {
  // Targets List state (persisted in localStorage + auto-synced with deploy-targets.json via Vite API)
  const [targets, setTargets] = useState<DeployTarget[]>(() => {
    try {
      const saved = localStorage.getItem('porto_deploy_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'target-sumrday',
        name: 'sumr.day (Utama)',
        projectId: 'sumrday-7d6cb',
        apiKey: '',
        storagePrefix: 'sumrday'
      }
    ];
  });

  const [copiedCliId, setCopiedCliId] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [isFileSynced, setIsFileSynced] = useState<boolean>(true);
  const [isSyncingServer, setIsSyncingServer] = useState<boolean>(false);

  // Form View State
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formAppId, setFormAppId] = useState('');
  const [formMessagingSenderId, setFormMessagingSenderId] = useState('');
  const [formMeasurementId, setFormMeasurementId] = useState('');
  const [formGeminiApiKey, setFormGeminiApiKey] = useState('');
  const [formSheetId, setFormSheetId] = useState('');
  const [formAppsScriptUrl, setFormAppsScriptUrl] = useState('');
  const [formStoragePrefix, setFormStoragePrefix] = useState('');
  const [formCloudinaryName, setFormCloudinaryName] = useState('');
  const [formCloudinaryPreset, setFormCloudinaryPreset] = useState('');

  // Config Parser Box (Paste raw code snippet from Firebase Console)
  const [showConfigParser, setShowConfigParser] = useState(false);
  const [rawConfigInput, setRawConfigInput] = useState('');

  // Tutorial / Info Accordion
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  const [activeEnvProjectId, setActiveEnvProjectId] = useState<string>('');
  const [isSwitchingEnv, setIsSwitchingEnv] = useState<string | null>(null);

  // Sync targets to backend file deploy-targets.json
  const syncTargetsToFile = async (targetsList: DeployTarget[]) => {
    setIsSyncingServer(true);
    try {
      const res = await fetch('/api/deploy/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: targetsList })
      });
      if (res.ok) {
        setIsFileSynced(true);
      } else {
        setIsFileSynced(false);
      }
    } catch {
      // Running outside Vite dev server
      setIsFileSynced(false);
    } finally {
      setIsSyncingServer(false);
    }
  };

  // Fetch targets and active .env on modal open
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/deploy/targets')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.targets) && data.targets.length > 0) {
          setTargets(data.targets);
          localStorage.setItem('porto_deploy_targets', JSON.stringify(data.targets));
          setIsFileSynced(true);
        } else if (data.success && Array.isArray(data.targets) && data.targets.length === 0) {
          syncTargetsToFile(targets);
        }
      })
      .catch(() => {});

    fetch('/api/env/read')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.env && data.env.VITE_FIREBASE_PROJECT_ID) {
          setActiveEnvProjectId(data.env.VITE_FIREBASE_PROJECT_ID);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Alihkan konfigurasi .env lokal ke target yang dipilih
  const handleSwitchLocalhostEnv = async (target: DeployTarget) => {
    setIsSwitchingEnv(target.id);
    try {
      const updates: Record<string, string> = {
        VITE_FIREBASE_PROJECT_ID: target.projectId,
        VITE_FIREBASE_AUTH_DOMAIN: `${target.projectId}.firebaseapp.com`,
        VITE_FIREBASE_STORAGE_BUCKET: `${target.projectId}.firebasestorage.app`,
      };
      if (target.apiKey !== undefined) updates.VITE_FIREBASE_API_KEY = target.apiKey;
      if (target.appId !== undefined) updates.VITE_FIREBASE_APP_ID = target.appId;
      if (target.messagingSenderId !== undefined) updates.VITE_FIREBASE_MESSAGING_SENDER_ID = target.messagingSenderId;
      if (target.measurementId !== undefined) updates.VITE_FIREBASE_MEASUREMENT_ID = target.measurementId;
      if (target.storagePrefix !== undefined) updates.VITE_STORAGE_PREFIX = target.storagePrefix;
      if (target.geminiApiKey !== undefined && target.geminiApiKey) updates.VITE_GEMINI_API_KEY = target.geminiApiKey;
      if (target.sheetId !== undefined) updates.VITE_GOOGLE_SHEET_ID = target.sheetId;
      if (target.appsScriptUrl !== undefined) updates.VITE_GOOGLE_APPS_SCRIPT_URL = target.appsScriptUrl;
      if (target.cloudinaryName !== undefined) updates.VITE_CLOUDINARY_NAME = target.cloudinaryName;
      if (target.cloudinaryPreset !== undefined) updates.VITE_CLOUDINARY_PRESET = target.cloudinaryPreset;

      const res = await fetch('/api/env/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (res.ok) {
        setActiveEnvProjectId(target.projectId);
        notify(`Localhost sekarang terhubung ke database "${target.name}"! Refresh halaman untuk memuat data baru.`, 'success');
      } else {
        notify('Gagal memperbarui file .env lokal', 'error');
      }
    } catch (err: any) {
      notify(`Gagal beralih database: ${err.message}`, 'error');
    } finally {
      setIsSwitchingEnv(null);
    }
  };

  // Save targets to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('porto_deploy_targets', JSON.stringify(targets));
    } catch {}
  }, [targets]);

  if (!isOpen) return null;

  const toggleTutorial = (fieldKey: string) => {
    setActiveTutorial(prev => prev === fieldKey ? null : fieldKey);
  };

  // Parser otomatis dari kode JS Firebase Console
  const handleParseRawConfig = (rawText: string) => {
    if (!rawText.trim()) return;

    try {
      const extract = (key: string) => {
        const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
        const match = rawText.match(regex);
        return match ? match[1].trim() : '';
      };

      const extractedApiKey = extract('apiKey');
      const extractedProjectId = extract('projectId');
      const extractedAppId = extract('appId');
      const extractedSenderId = extract('messagingSenderId');
      const extractedMeasurementId = extract('measurementId');

      let filledCount = 0;
      if (extractedProjectId) {
        setFormProjectId(extractedProjectId);
        if (!formName) {
          const capitalized = extractedProjectId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          setFormName(capitalized);
        }
        if (!formStoragePrefix) {
          setFormStoragePrefix(extractedProjectId.replace(/[^a-zA-Z0-9]/g, ''));
        }
        filledCount++;
      }
      if (extractedApiKey) {
        setFormApiKey(extractedApiKey);
        filledCount++;
      }
      if (extractedAppId) {
        setFormAppId(extractedAppId);
        filledCount++;
      }
      if (extractedSenderId) {
        setFormMessagingSenderId(extractedSenderId);
        filledCount++;
      }
      if (extractedMeasurementId) {
        setFormMeasurementId(extractedMeasurementId);
        filledCount++;
      }

      if (filledCount > 0) {
        notify(`✨ Berhasil mengekstrak ${filledCount} field konfigurasi!`, 'success');
        setShowConfigParser(false);
        setRawConfigInput('');
      } else {
        notify('Format konfigurasi tidak dikenali. Pastikan menyalin objek config dengan benar.', 'warning');
      }
    } catch {
      notify('Gagal membaca format konfigurasi.', 'error');
    }
  };

  // Open Add Target Form
  const handleOpenAdd = () => {
    setEditingTargetId(null);
    setFormName('');
    setFormProjectId('');
    setFormApiKey('');
    setFormAppId('');
    setFormMessagingSenderId('');
    setFormMeasurementId('');
    setFormGeminiApiKey('');
    setFormSheetId('');
    setFormAppsScriptUrl('');
    setFormStoragePrefix('');
    setFormCloudinaryName('');
    setFormCloudinaryPreset('');
    setShowConfigParser(false);
    setActiveTutorial(null);
    setViewMode('add');
  };

  // Open Edit Target Form
  const handleOpenEdit = (target: DeployTarget) => {
    setEditingTargetId(target.id);
    setFormName(target.name);
    setFormProjectId(target.projectId);
    setFormApiKey(target.apiKey || '');
    setFormAppId(target.appId || '');
    setFormMessagingSenderId(target.messagingSenderId || '');
    setFormMeasurementId(target.measurementId || '');
    setFormGeminiApiKey(target.geminiApiKey || '');
    setFormSheetId(target.sheetId || '');
    setFormAppsScriptUrl(target.appsScriptUrl || '');
    setFormStoragePrefix(target.storagePrefix || '');
    setFormCloudinaryName(target.cloudinaryName || '');
    setFormCloudinaryPreset(target.cloudinaryPreset || '');
    setShowConfigParser(false);
    setActiveTutorial(null);
    setViewMode('edit');
  };

  // Save Target (Add or Edit)
  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formProjectId.trim()) {
      notify('Nama target dan Project ID wajib diisi.', 'error');
      return;
    }

    let updatedTargets: DeployTarget[];

    if (viewMode === 'edit' && editingTargetId) {
      updatedTargets = targets.map(t => {
        if (t.id === editingTargetId) {
          return {
            ...t,
            name: formName.trim(),
            projectId: formProjectId.trim(),
            apiKey: formApiKey.trim(),
            appId: formAppId.trim(),
            messagingSenderId: formMessagingSenderId.trim(),
            measurementId: formMeasurementId.trim(),
            geminiApiKey: formGeminiApiKey.trim(),
            sheetId: formSheetId.trim(),
            appsScriptUrl: formAppsScriptUrl.trim(),
            storagePrefix: formStoragePrefix.trim() || 'porto',
            cloudinaryName: formCloudinaryName.trim(),
            cloudinaryPreset: formCloudinaryPreset.trim(),
          };
        }
        return t;
      });
      setTargets(updatedTargets);
      notify('Target berhasil diperbarui.', 'success');
    } else {
      const newTarget: DeployTarget = {
        id: `target-${Date.now()}`,
        name: formName.trim(),
        projectId: formProjectId.trim(),
        apiKey: formApiKey.trim(),
        appId: formAppId.trim(),
        messagingSenderId: formMessagingSenderId.trim(),
        measurementId: formMeasurementId.trim(),
        geminiApiKey: formGeminiApiKey.trim(),
        sheetId: formSheetId.trim(),
        appsScriptUrl: formAppsScriptUrl.trim(),
        storagePrefix: formStoragePrefix.trim() || 'porto',
        cloudinaryName: formCloudinaryName.trim(),
        cloudinaryPreset: formCloudinaryPreset.trim(),
      };
      updatedTargets = [...targets, newTarget];
      setTargets(updatedTargets);
      notify('Target baru ditambahkan.', 'success');
    }

    await syncTargetsToFile(updatedTargets);
    setViewMode('list');
  };

  // Delete Target
  const handleDeleteTarget = async (id: string, name: string) => {
    if (!window.confirm(`Hapus target "${name}"?`)) return;
    const updated = targets.filter(t => t.id !== id);
    setTargets(updated);
    notify('Target telah dihapus.', 'info');
    await syncTargetsToFile(updated);
  };

  // Download deploy-targets.json
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(targets, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deploy-targets.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('File deploy-targets.json berhasil diunduh.', 'success');
  };

  // Copy command helper
  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    notify(`Perintah ${label} berhasil disalin!`, 'success');
    setTimeout(() => setCopiedCommand(null), 2500);
  };

  return (
    <div 
      className="cms-modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="cms-modal-content"
        style={{
          width: '100%',
          maxWidth: 740,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1px solid var(--cms-border, rgba(0, 0, 0, 0.1))',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          color: 'var(--cms-text, #0f172a)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--cms-border, rgba(0,0,0,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cms-card-bg, #ffffff)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Terminal size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16.5, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--cms-text, #0f172a)' }}>Multi-Deploy Target</h3>
                <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 6, background: '#dcfce7', color: '#15803d', fontWeight: 800, border: '1px solid rgba(22,163,74,0.2)' }}>
                  Terminal Lokal
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--cms-text-muted, #64748b)', margin: '2px 0 0', fontWeight: 500 }}>
                Kelola daftar target dan dapatkan perintah CLI 1-klik untuk deploy dari terminal Anda
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--cms-text-muted, #94a3b8)', 
              cursor: 'pointer', 
              padding: 6, 
              borderRadius: 8,
              transition: 'background 0.15s ease'
            }}
            className="hover-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* ════════ TERMINAL QUICK-DEPLOY HUB (AUTHENTIC SLEEK CLI CONSOLE) ════════ */}
          <div style={{ borderRadius: 16, border: '1px solid #1e293b', background: '#0b1120', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)' }}>
            
            {/* Console Top Header Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Traffic light dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>Terminal Hub (Eksekusi Lokal)</span>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isFileSynced ? (
                  <span style={{ fontSize: 10.5, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', padding: '2px 8px', borderRadius: 6 }}>
                    <CheckCircle2 size={12} /> deploy-targets.json tersinkron
                  </span>
                ) : (
                  <span style={{ fontSize: 10.5, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', padding: '2px 8px', borderRadius: 6 }}>
                    <AlertCircle size={12} /> Belum tersinkron ke file
                  </span>
                )}
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55 }}>
              Jalankan perintah di bawah ini langsung di terminal PowerShell / Command Prompt proyek Anda. Konfigurasi setiap target dibaca otomatis dari file <code style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>deploy-targets.json</code>:
            </div>

            {/* 2 Dedicated CLI Command Blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              
              {/* Box 1: Interactive Target Picker */}
              <div style={{ padding: '14px', borderRadius: 12, background: '#020617', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>❯</span> Menu Interaktif (Pilih Target)
                    </span>
                    <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 800 }}>
                      Paling Populer
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                    Buka menu interaktif untuk memilih 1 target yang ingin dibuild & dideploy.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <span style={{ color: '#10b981', fontWeight: 900, fontSize: 12 }}>$</span>
                    <code style={{ fontSize: 11.5, color: '#f1f5f9', fontWeight: 700, fontFamily: 'Consolas, monospace' }}>
                      npm run deploy:target
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('npm run deploy:target', 'Menu Interaktif')}
                    style={{
                      background: copiedCommand === 'npm run deploy:target' ? '#10b981' : 'rgba(56,189,248,0.15)',
                      border: '1px solid rgba(56,189,248,0.25)',
                      color: copiedCommand === 'npm run deploy:target' ? '#ffffff' : '#38bdf8',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                    title="Salin Perintah"
                  >
                    {copiedCommand === 'npm run deploy:target' ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                    <span>{copiedCommand === 'npm run deploy:target' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Deploy All Targets */}
              <div style={{ padding: '14px', borderRadius: 12, background: '#020617', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>❯</span> Batch Deploy (Semua Target)
                    </span>
                    <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: 'rgba(192,132,252,0.15)', color: '#c084fc', fontWeight: 800 }}>
                      Otomatis
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                    Build & deploy berurutan ke seluruh {targets.length} target sekaligus dengan laporan akhir.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#0f172a', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    <span style={{ color: '#a855f7', fontWeight: 900, fontSize: 12 }}>$</span>
                    <code style={{ fontSize: 11.5, color: '#f1f5f9', fontWeight: 700, fontFamily: 'Consolas, monospace' }}>
                      npm run deploy:all
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('npm run deploy:all', 'Batch Deploy')}
                    style={{
                      background: copiedCommand === 'npm run deploy:all' ? '#10b981' : 'rgba(192,132,252,0.15)',
                      border: '1px solid rgba(192,132,252,0.25)',
                      color: copiedCommand === 'npm run deploy:all' ? '#ffffff' : '#c084fc',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                    title="Salin Perintah"
                  >
                    {copiedCommand === 'npm run deploy:all' ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                    <span>{copiedCommand === 'npm run deploy:all' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Hub Footer: File actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Lokasi file: <code style={{ color: '#94a3b8' }}>deploy-targets.json</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => syncTargetsToFile(targets)}
                  disabled={isSyncingServer}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {isSyncingServer ? <Loader2 size={12} className="cms-spin" /> : <RefreshCw size={12} />}
                  Sinkronkan Ulang
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Download size={12} /> Unduh File JSON
                </button>
              </div>
            </div>

          </div>

          {/* ════════ VIEW: ADD / EDIT FORM ════════ */}
          {viewMode !== 'list' && (
            <form onSubmit={handleSaveTarget} style={{ borderRadius: 16, border: '1px solid var(--cms-border, rgba(0,0,0,0.12))', background: 'var(--cms-card-bg, #ffffff)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cms-border, rgba(0,0,0,0.08))', paddingBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #0f172a)' }}>
                  {viewMode === 'edit' ? 'Edit Target Firebase' : 'Tambah Target Firebase Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted, #64748b)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
              </div>

              {/* Quick Paste Banner */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} /> Tempel Otomatis Config Firebase
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfigParser(!showConfigParser)}
                    style={{ background: 'transparent', border: 'none', color: '#b45309', fontSize: 11, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showConfigParser ? 'Tutup Box' : 'Buka Box Tempel'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.5 }}>
                  Salin blok <code>const firebaseConfig = &#123; ... &#125;</code> dari Firebase Console, lalu tempel di sini agar Project ID, API Key, dan App ID terisi otomatis!
                </div>
                {showConfigParser && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <textarea
                      rows={4}
                      value={rawConfigInput}
                      onChange={(e) => setRawConfigInput(e.target.value)}
                      placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "sumrday-7d6cb",\n  appId: "1:..."\n};`}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #f59e0b', background: '#ffffff', color: '#0f172a', fontSize: 11, fontFamily: 'monospace', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleParseRawConfig(rawConfigInput)}
                      style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 7, background: '#f59e0b', color: '#000000', fontWeight: 900, fontSize: 11.5, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Sparkles size={13} /> Ekstrak Otomatis Sekarang
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                
                {/* Field 1: Nama Target */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Nama Target *</label>
                    <button type="button" onClick={() => toggleTutorial('name')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: sumr.day"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'name' && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, lineHeight: 1.5, color: '#1e40af' }}>
                      <strong>Nama Target:</strong> Nama brand atau nama klien proyek (contoh: sumr.day, Klien B).
                    </div>
                  )}
                </div>

                {/* Field 2: Project ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Project ID Firebase *</label>
                    <button type="button" onClick={() => toggleTutorial('projectId')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: sumrday-7d6cb"
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'projectId' && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, lineHeight: 1.5, color: '#1e40af' }}>
                      <strong>Lokasi Project ID:</strong> Salin dari baris <code>projectId: "..."</code> di Project Settings Firebase Console.
                    </div>
                  )}
                </div>

                {/* Field 3: Firebase API Key */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Firebase API Key</label>
                    <button type="button" onClick={() => toggleTutorial('apiKey')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: AIzaSyA0ebREB..."
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'apiKey' && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, lineHeight: 1.5, color: '#1e40af' }}>
                      <strong>Firebase API Key:</strong> Salin dari baris <code>apiKey: "..."</code> di Firebase Console.
                    </div>
                  )}
                </div>

                {/* Field 4: Firebase App ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Firebase App ID</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: 1:333413040741:web:03cd16..."
                    value={formAppId}
                    onChange={(e) => setFormAppId(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                </div>

                {/* Field 5: Storage Prefix */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Storage Prefix (Kunci Data)</label>
                    <button type="button" onClick={() => toggleTutorial('storagePrefix')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: sumrday"
                    value={formStoragePrefix}
                    onChange={(e) => setFormStoragePrefix(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'storagePrefix' && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, lineHeight: 1.5, color: '#1e40af' }}>
                      <strong>Storage Prefix:</strong> Prefix kunci penyimpanan lokal (contoh: <code>sumrday</code>) agar data cache browser terisolasi mandiri.
                    </div>
                  )}
                </div>

                {/* Field 6: Token AI (Gemini API Key) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Token AI (Gemini API Key)</label>
                  </div>
                  <input
                    type="password"
                    placeholder="Kosongkan jika pakai default studio"
                    value={formGeminiApiKey}
                    onChange={(e) => setFormGeminiApiKey(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                </div>

                {/* Field 7: Cloudinary Cloud Name */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Cloudinary Cloud Name</label>
                    <button type="button" onClick={() => toggleTutorial('cloudinary')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: dlvjat7lg (kosongkan jika pakai default)"
                    value={formCloudinaryName}
                    onChange={(e) => setFormCloudinaryName(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'cloudinary' && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, lineHeight: 1.5, color: '#1e40af' }}>
                      <strong>Cloudinary:</strong> Ambil <code>Cloud Name</code> dari dashboard Cloudinary target/klien ini agar penyimpanan gambar terpisah.
                    </div>
                  )}
                </div>

                {/* Field 8: Cloudinary Upload Preset */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Cloudinary Upload Preset</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: ml_default (Unsigned)"
                    value={formCloudinaryPreset}
                    onChange={(e) => setFormCloudinaryPreset(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                </div>

                {/* Field 9: Google Sheet ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Google Sheet ID</label>
                    <button type="button" onClick={() => toggleTutorial('sheetId')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: 11CteMG8hML3mIe1U-mU_..."
                    value={formSheetId}
                    onChange={(e) => setFormSheetId(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'sheetId' && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, lineHeight: 1.5, color: '#1e40af' }}>
                      <strong>Google Sheet ID:</strong> Salin string ID dari URL spreadsheet target: <code>docs.google.com/spreadsheets/d/<b>[ID-DI-SINI]</b>/edit</code>.
                    </div>
                  )}
                </div>

                {/* Field 10: Google Apps Script URL */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Google Apps Script URL (/exec)</label>
                    <button type="button" onClick={() => toggleTutorial('appsScript')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: https://script.google.com/macros/s/.../exec"
                    value={formAppsScriptUrl}
                    onChange={(e) => setFormAppsScriptUrl(e.target.value)}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #0f172a)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'appsScript' && (
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11, lineHeight: 1.5, color: '#1e40af' }}>
                      <strong>Apps Script URL:</strong> URL web app dari Deploy &rarr; New deployment di Google Apps Script yang berakhiran <code>/exec</code>.
                    </div>
                  )}
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid var(--cms-border, #cbd5e1)', background: 'transparent', color: 'var(--cms-text, #0f172a)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ height: 36, padding: '0 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.25)' }}
                >
                  {viewMode === 'edit' ? 'Simpan Perubahan' : 'Simpan Target'}
                </button>
              </div>
            </form>
          )}

          {/* ════════ VIEW: TARGETS LIST ════════ */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Controls Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text, #0f172a)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={16} style={{ color: '#2563eb' }} />
                  <span>Daftar Target Terdaftar ({targets.length})</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  style={{ 
                    height: 36, 
                    padding: '0 14px', 
                    borderRadius: 8, 
                    border: '1px solid rgba(37,99,235,0.3)', 
                    background: 'rgba(37,99,235,0.08)', 
                    color: '#2563eb', 
                    fontSize: 12, 
                    fontWeight: 800, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    cursor: 'pointer' 
                  }}
                >
                  <Plus size={15} strokeWidth={2.5} /> Tambah Target
                </button>
              </div>

              {/* Target Cards */}
              {targets.length === 0 ? (
                <div style={{ padding: '36px 18px', borderRadius: 14, border: '1px dashed var(--cms-border, rgba(0,0,0,0.15))', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'var(--cms-input-bg, #f8fafc)' }}>
                  <Server size={30} style={{ color: 'var(--cms-text-muted, #94a3b8)', opacity: 0.6 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--cms-text, #0f172a)' }}>Belum Ada Target Terdaftar</div>
                  <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted, #64748b)', maxWidth: 340 }}>
                    Daftarkan project Firebase tujuan Anda untuk menghasilkan perintah deploy terminal instan.
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    style={{ marginTop: 6, height: 34, padding: '0 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Tambah Target Pertama
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {targets.map((target, idx) => {
                    const targetCmd = `npm run deploy:target ${target.projectId}`;
                    const isCopied = copiedCliId === target.id;

                    return (
                      <div 
                        key={target.id}
                        style={{
                          borderRadius: 14,
                          border: '1px solid var(--cms-border, #e2e8f0)',
                          background: 'var(--cms-card-bg, #ffffff)',
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Top Target Meta Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Number badge */}
                            <div style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: 9, 
                              background: '#eff6ff', 
                              color: '#2563eb', 
                              border: '1px solid #bfdbfe',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: 13, 
                              fontWeight: 900 
                            }}>
                              {idx + 1}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #0f172a)' }}>
                                  {target.name}
                                </span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                                  prefix: {target.storagePrefix || 'porto'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #64748b)' }}>
                                  Project ID: <code style={{ color: '#2563eb', fontWeight: 800, background: '#eff6ff', padding: '1px 6px', borderRadius: 4 }}>{target.projectId}</code>
                                </span>
                                
                                <span style={{ 
                                  fontSize: 10, 
                                  fontWeight: 800, 
                                  padding: '1px 7px', 
                                  borderRadius: 5, 
                                  background: target.apiKey ? '#dcfce7' : '#fef3c7', 
                                  color: target.apiKey ? '#15803d' : '#b45309', 
                                  border: `1px solid ${target.apiKey ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.2)'}`,
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 4 
                                }}>
                                  {target.apiKey ? '● Config Mandiri' : '○ Default Config'}
                                </span>

                                {target.geminiApiKey && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5, background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
                                    AI Key
                                  </span>
                                )}

                                {target.cloudinaryName && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                                    Cloud: {target.cloudinaryName}
                                  </span>
                                )}

                                {target.sheetId && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                                    Sheets
                                  </span>
                                )}

                                {target.appsScriptUrl && (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5, background: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4' }}>
                                    Apps Script
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions (Localhost Switch, Globe, Edit, Delete) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {/* Localhost Switcher Button / Indicator */}
                            {target.projectId === activeEnvProjectId ? (
                              <span 
                                style={{ 
                                  height: 32,
                                  padding: '0 10px', 
                                  borderRadius: 8, 
                                  background: '#dcfce7', 
                                  color: '#15803d', 
                                  border: '1px solid #bbf7d0',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                                title="Database target ini sedang aktif digunakan di localhost (npm run dev)"
                              >
                                <CheckCircle2 size={13} strokeWidth={2.5} /> Aktif di Localhost
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSwitchLocalhostEnv(target)}
                                disabled={isSwitchingEnv === target.id}
                                style={{
                                  height: 32,
                                  padding: '0 11px',
                                  borderRadius: 8,
                                  border: '1px solid #bfdbfe',
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Alihkan file .env lokal ke database target ini agar localhost:5173 membaca data ini"
                              >
                                {isSwitchingEnv === target.id ? <Loader2 size={13} className="cms-spin" /> : <RefreshCw size={13} />}
                                <span>Aktifkan di Localhost</span>
                              </button>
                            )}

                            {/* Live Site Link */}
                            <a
                              href={`https://${target.projectId}.web.app`}
                              target="_blank"
                              rel="noreferrer"
                              title="Buka Website Target Online"
                              style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                            >
                              <Globe size={15} />
                            </a>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(target)}
                              title="Edit Target"
                              style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Edit3 size={15} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteTarget(target.id, target.name)}
                              title="Hapus Target"
                              style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #fecaca', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Dedicated High-Contrast Terminal Command Box */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          gap: 10, 
                          background: '#0f172a', 
                          border: '1px solid #1e293b', 
                          padding: '10px 12px', 
                          borderRadius: 10 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <span style={{ color: '#10b981', fontWeight: 900, fontSize: 12 }}>$</span>
                            <code style={{ fontSize: 11.5, color: '#f8fafc', fontWeight: 700, fontFamily: 'Consolas, monospace', letterSpacing: '0.02em' }}>
                              {targetCmd}
                            </code>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(targetCmd);
                              setCopiedCliId(target.id);
                              notify(`Perintah disalin: ${targetCmd}`, 'success');
                              setTimeout(() => setCopiedCliId(null), 2500);
                            }}
                            style={{
                              background: isCopied ? '#10b981' : '#2563eb',
                              border: 'none',
                              color: '#ffffff',
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: 7,
                              fontSize: 11,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              flexShrink: 0,
                              boxShadow: isCopied ? '0 2px 8px rgba(16,185,129,0.4)' : '0 2px 8px rgba(37,99,235,0.3)',
                              transition: 'all 0.15s ease'
                            }}
                            title="Salin perintah terminal untuk target ini"
                          >
                            {isCopied ? <CheckCheck size={13} strokeWidth={2.5} /> : <Copy size={13} />}
                            <span>{isCopied ? 'Tersalin!' : 'Salin Perintah CLI'}</span>
                          </button>
                        </div>

                        {target.lastDeployedAt && (
                          <div style={{ fontSize: 10, color: 'var(--cms-text-muted, #94a3b8)' }}>
                            Terakhir deploy: {new Date(target.lastDeployedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════ 3-STEP TERMINAL GUIDE (CLEAN & ELEGANT) ════════ */}
          <div style={{ padding: '16px 18px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={15} style={{ color: '#2563eb' }} />
              <span>Panduan Singkat Eksekusi di Terminal Komputer:</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>1</span>
                <span style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.45 }}>
                  Buka <strong>PowerShell</strong> atau terminal proyek ini.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>2</span>
                <span style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.45 }}>
                  Klik <strong>Salin</strong> pada target pilihan (atau perintah batch).
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>3</span>
                <span style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.45 }}>
                  Tempel (Paste) & tekan <strong>Enter</strong>. Selesai otomatis!
                </span>
              </div>
            </div>
          </div>

          {/* Security Guarantee Note */}
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#15803d' }}>
              <strong>Jaminan Keamanan:</strong> Masing-masing target terisolasi mandiri. Database Firestore lama dan data lokal tidak tersentuh.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--cms-border, rgba(0,0,0,0.08))', display: 'flex', justifyContent: 'flex-end', background: 'var(--cms-card-bg, #ffffff)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 36,
              padding: '0 22px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeployTargetModal;
