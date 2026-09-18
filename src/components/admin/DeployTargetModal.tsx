import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Key, 
  HelpCircle,
  ShieldCheck,
  Globe,
  Plus,
  Trash2,
  Edit3,
  Server,
  Play,
  Layers,
  Send,
  CheckSquare,
  Square,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Terminal,
  Copy,
  Check
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
  lastDeployedAt?: string;
}

interface TargetRunStatus {
  status: 'idle' | 'triggering' | 'queued' | 'running' | 'success' | 'error';
  message: string;
  runUrl?: string;
}

export const normalizeGithubRepo = (raw: string): string => {
  if (!raw) return '';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^git@github\.com:/i, '');
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?github\.com\/?/i, '');
  cleaned = cleaned.replace(/\.git$/i, '');
  cleaned = cleaned.replace(/^\/+|\/+$/g, '');
  return cleaned;
};

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
  // Targets List state (persisted)
  const [targets, setTargets] = useState<DeployTarget[]>(() => {
    try {
      const saved = localStorage.getItem('porto_deploy_targets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Selected targets for batch deployment
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Per-target deployment status
  const [runStatuses, setRunStatuses] = useState<Record<string, TargetRunStatus>>({});

  // Form View state ('list' | 'add' | 'edit')
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  // Active Tutorial Accordion state (which field tutorial is expanded)
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  // Form Fields (Clean & Minimal)
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
  const [showConfigParser, setShowConfigParser] = useState(false);
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [copiedCliId, setCopiedCliId] = useState<string | null>(null);

  // GitHub Auth Settings (persisted)
  const [githubRepo, setGithubRepo] = useState(() => normalizeGithubRepo(localStorage.getItem('porto_gh_repo') || ''));
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('porto_gh_token') || '');
  const [showGhSettings, setShowGhSettings] = useState(false);

  // Batch Processing Indicator
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  // Save targets to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('porto_deploy_targets', JSON.stringify(targets));
    } catch {}
  }, [targets]);

  useEffect(() => {
    if (githubRepo) {
      const normalized = normalizeGithubRepo(githubRepo);
      localStorage.setItem('porto_gh_repo', normalized);
    }
    if (githubToken) localStorage.setItem('porto_gh_token', githubToken.trim());
  }, [githubRepo, githubToken]);

  if (!isOpen) return null;

  const toggleTutorial = (fieldKey: string) => {
    setActiveTutorial(prev => prev === fieldKey ? null : fieldKey);
  };

  // Parser otomatis dari kode JS Firebase Console
  const handleParseRawConfig = (rawText: string) => {
    if (!rawText.trim()) return;
    try {
      const extract = (key: string) => {
        const regex = new RegExp(`${key}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
        const match = rawText.match(regex);
        return match ? match[1].trim() : '';
      };

      const pId = extract('projectId');
      const key = extract('apiKey');
      const aId = extract('appId');
      const sId = extract('messagingSenderId');
      const mId = extract('measurementId');

      if (pId) setFormProjectId(pId);
      if (key) setFormApiKey(key);
      if (aId) setFormAppId(aId);
      if (sId) setFormMessagingSenderId(sId);
      if (mId) setFormMeasurementId(mId);

      if (pId && !formName) {
        setFormName(pId);
      }

      if (pId || key) {
        notify('Konfigurasi Firebase berhasil diekstrak otomatis!', 'success');
        setShowConfigParser(false);
        setRawConfigInput('');
      } else {
        notify('Format Firebase Config tidak dikenali. Pastikan menyalin blok kode firebaseConfig.', 'warning');
      }
    } catch {
      notify('Gagal membaca format konfigurasi.', 'error');
    }
  };

  // Open Form to Add
  const handleOpenAdd = () => {
    setFormName('');
    setFormProjectId('');
    setFormApiKey('');
    setFormAppId('');
    setFormMessagingSenderId('');
    setFormMeasurementId('');
    setFormGeminiApiKey('');
    setFormSheetId('');
    setFormAppsScriptUrl('');
    setFormStoragePrefix(`klien_${targets.length + 1}`);
    setEditingTargetId(null);
    setActiveTutorial(null);
    setShowConfigParser(false);
    setViewMode('add');
  };

  // Open Form to Edit
  const handleOpenEdit = (target: DeployTarget) => {
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
    setEditingTargetId(target.id);
    setActiveTutorial(null);
    setShowConfigParser(false);
    setViewMode('edit');
  };

  // Save Form (Add or Edit)
  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProject = formProjectId.trim();
    const cleanName = formName.trim() || cleanProject;

    if (!cleanProject) {
      notify('Project ID wajib diisi.', 'error');
      return;
    }

    if (viewMode === 'edit' && editingTargetId) {
      setTargets(prev => prev.map(t => t.id === editingTargetId ? {
        ...t,
        name: cleanName,
        projectId: cleanProject,
        apiKey: formApiKey.trim(),
        appId: formAppId.trim(),
        messagingSenderId: formMessagingSenderId.trim(),
        measurementId: formMeasurementId.trim(),
        geminiApiKey: formGeminiApiKey.trim(),
        sheetId: formSheetId.trim(),
        appsScriptUrl: formAppsScriptUrl.trim(),
        storagePrefix: formStoragePrefix.trim() || 'porto'
      } : t));
      notify('Target berhasil disimpan.', 'success');
    } else {
      const newTarget: DeployTarget = {
        id: `target_${Date.now()}`,
        name: cleanName,
        projectId: cleanProject,
        apiKey: formApiKey.trim(),
        appId: formAppId.trim(),
        messagingSenderId: formMessagingSenderId.trim(),
        measurementId: formMeasurementId.trim(),
        geminiApiKey: formGeminiApiKey.trim(),
        sheetId: formSheetId.trim(),
        appsScriptUrl: formAppsScriptUrl.trim(),
        storagePrefix: formStoragePrefix.trim() || 'porto',
      };
      setTargets(prev => [...prev, newTarget]);
      setSelectedIds(prev => [...prev, newTarget.id]);
      notify('Target baru ditambahkan.', 'success');
    }

    setViewMode('list');
  };

  // Delete Target
  const handleDeleteTarget = (id: string, name: string) => {
    if (!window.confirm(`Hapus target "${name}"?`)) return;
    setTargets(prev => prev.filter(t => t.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
    notify('Target telah dihapus.', 'info');
  };

  // Toggle Single Selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    if (selectedIds.length === targets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(targets.map(t => t.id));
    }
  };

  // Core Deploy Function for a Single Target
  const deploySingleTarget = async (target: DeployTarget): Promise<boolean> => {
    const cleanRepo = normalizeGithubRepo(githubRepo);
    const cleanToken = githubToken.trim();

    if (!cleanRepo || !cleanRepo.includes('/')) {
      setRunStatuses(prev => ({
        ...prev,
        [target.id]: { 
          status: 'error', 
          message: 'Format GitHub Repo belum benar. Harus berupa "username/repo" (contoh: Moccappss/sumrday).' 
        }
      }));
      return false;
    }

    if (!cleanToken) {
      setRunStatuses(prev => ({
        ...prev,
        [target.id]: { 
          status: 'error', 
          message: 'GitHub Token belum diisi. Buat token classic di GitHub dengan izin "repo" & "workflow".' 
        }
      }));
      return false;
    }

    setRunStatuses(prev => ({
      ...prev,
      [target.id]: { status: 'triggering', message: 'Mengirim sinyal build...' }
    }));

    try {
      const dispatchUrl = `https://api.github.com/repos/${cleanRepo}/actions/workflows/deploy-target.yml/dispatches`;
      const response = await fetch(dispatchUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${cleanToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            firebase_project_id: target.projectId,
            firebase_api_key: target.apiKey || '',
            firebase_app_id: target.appId || '',
            firebase_messaging_sender_id: target.messagingSenderId || '',
            firebase_measurement_id: target.measurementId || '',
            gemini_api_key: target.geminiApiKey || '',
            google_sheet_id: target.sheetId || '',
            google_apps_script_url: target.appsScriptUrl || '',
            storage_prefix: target.storagePrefix || 'porto',
            app_name: target.name
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let customMsg = errData.message || `Status ${response.status}`;
        if (response.status === 404) {
          customMsg = `Repo ${cleanRepo} belum memiliki file workflow .github/workflows/deploy-target.yml di branch main. Silakan push project ke GitHub terlebih dahulu, atau gunakan tombol CLI untuk deploy instan.`;
        } else if (response.status === 401 || response.status === 403) {
          customMsg = 'GitHub Token tidak valid atau tidak memiliki izin "workflow" & "repo". Silakan buat token classic baru di GitHub.';
        } else if (response.status === 422) {
          customMsg = 'Workflow deploy-target.yml belum aktif atau branch main belum ada di repo GitHub.';
        }
        throw new Error(customMsg);
      }

      setRunStatuses(prev => ({
        ...prev,
        [target.id]: { status: 'queued', message: 'Diterima GitHub. Menunggu antrean...' }
      }));

      // Update last deployed timestamp
      const now = new Date().toISOString();
      setTargets(prev => prev.map(t => t.id === target.id ? { ...t, lastDeployedAt: now } : t));

      // Attempt to retrieve latest run URL
      setTimeout(async () => {
        try {
          const runsRes = await fetch(`https://api.github.com/repos/${cleanRepo}/actions/runs?per_page=1`, {
            headers: {
              'Accept': 'application/vnd.github+json',
              'Authorization': `Bearer ${cleanToken}`
            }
          });
          if (runsRes.ok) {
            const runsData = await runsRes.json();
            if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
              const latestRun = runsData.workflow_runs[0];
              setRunStatuses(prev => ({
                ...prev,
                [target.id]: { 
                  status: 'running', 
                  message: `Build #${latestRun.run_number} sedang berjalan`,
                  runUrl: latestRun.html_url
                }
              }));
            }
          }
        } catch {}
      }, 2500);

      return true;
    } catch (err: any) {
      const rawMsg = err?.message || 'Gagal memulai deploy.';
      const displayMsg = rawMsg.toLowerCase().includes('failed to fetch')
        ? 'Gagal terhubung ke GitHub API (CORS/Network). Pastikan format repo "username/repo" dan token benar.'
        : rawMsg;
      setRunStatuses(prev => ({
        ...prev,
        [target.id]: { status: 'error', message: displayMsg }
      }));
      return false;
    }
  };

  // Deploy Individual Target
  const handleDeployIndividual = async (target: DeployTarget) => {
    if (!githubRepo.trim() || !githubToken.trim()) {
      setShowGhSettings(true);
      notify('Lengkapi Repo dan Token GitHub.', 'error');
      return;
    }
    await deploySingleTarget(target);
    notify(`Deploy untuk "${target.name}" dikirim.`, 'success');
  };

  // Batch Deploy All Selected
  const handleDeployBatch = async () => {
    if (selectedIds.length === 0) {
      notify('Pilih target yang akan dideploy.', 'warning');
      return;
    }

    if (!githubRepo.trim() || !githubToken.trim()) {
      setShowGhSettings(true);
      notify('Lengkapi Repo dan Token GitHub.', 'error');
      return;
    }

    const selectedTargets = targets.filter(t => selectedIds.includes(t.id));
    setIsBatchRunning(true);
    notify(`Memulai deploy ${selectedTargets.length} target...`, 'info');

    let successCount = 0;
    for (const target of selectedTargets) {
      const ok = await deploySingleTarget(target);
      if (ok) successCount++;
      await new Promise(res => setTimeout(res, 1200));
    }

    setIsBatchRunning(false);
    notify(`Selesai. ${successCount} dari ${selectedTargets.length} target terkirim.`, 'success');
  };

  return (
    <div 
      className="cms-modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: 680,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--cms-card-bg, #121826)',
          border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
          borderRadius: 18,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          color: 'var(--cms-text, #f8fafc)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header: Clean & 2-3 words */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>Multi-Deploy Target</h3>
              <p style={{ fontSize: 11.5, color: 'var(--cms-text-muted, #94a3b8)', margin: 0 }}>Kelola dan deploy ke beberapa Firebase</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted, #94a3b8)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* GitHub Config Header Banner */}
          <div style={{ borderRadius: 10, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', background: 'rgba(255,255,255,0.02)', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800 }}>
                <Key size={14} style={{ color: '#3b82f6' }} />
                <span>Akun GitHub</span>
                {(!githubRepo || !githubToken) ? (
                  <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>
                    Belum Lengkap
                  </span>
                ) : (
                  <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700 }}>
                    Siap
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowGhSettings(!showGhSettings)}
                style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {showGhSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showGhSettings ? 'Tutup' : 'Atur Akun'}
              </button>
            </div>

            {showGhSettings && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 800 }}>GitHub Repo</label>
                      <button type="button" onClick={() => toggleTutorial('github_repo')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <BookOpen size={11} /> Tutorial
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Moccappss/sumrday"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(normalizeGithubRepo(e.target.value))}
                      onBlur={(e) => setGithubRepo(normalizeGithubRepo(e.target.value))}
                      style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                    />
                    <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 3 }}>
                      Contoh: <code style={{ color: '#93c5fd' }}>Moccappss/sumrday</code>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 800 }}>GitHub Token</label>
                      <button type="button" onClick={() => toggleTutorial('github_token')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <BookOpen size={11} /> Tutorial
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="ghp_xxxx"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Tutorial Box: GitHub Repo */}
                {activeTutorial === 'github_repo' && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                    <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Lokasi GitHub Repo:</strong>
                    <div style={{ marginTop: 4 }}>
                      Buka repository GitHub Anda di browser (contoh: <code style={{ fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.25)', color: '#38bdf8' }}>github.com/sumrday/sumrday</code>). Masukkan bagian <code>username/nama-repo</code> (misal: <code>sumrday/sumrday</code>).
                    </div>
                  </div>
                )}

                {/* Tutorial Box: GitHub Token */}
                {activeTutorial === 'github_token' && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                    <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Cara Membuat Token GitHub:</strong>
                    <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
                      <li>Buka <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: '#ffffff', background: '#2563eb', fontWeight: 700, textDecoration: 'none', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>github.com/settings/tokens <ExternalLink size={11} color="#ffffff" /></a> (Tokens classic).</li>
                      <li>Klik <strong>Generate new token (classic)</strong>.</li>
                      <li>Centang izin <strong>repo</strong> dan <strong>workflow</strong>.</li>
                      <li>Klik Generate di bagian bawah, lalu salin kodenya.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* VIEW: ADD / EDIT FORM (Only 1-3 Words Labels + Tutorial Buttons) */}
          {viewMode !== 'list' && (
            <form onSubmit={handleSaveTarget} style={{ borderRadius: 12, border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.02)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.08))', paddingBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 900, color: '#3b82f6' }}>
                  {viewMode === 'edit' ? 'Edit Target' : 'Tambah Target Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted, #94a3b8)', fontSize: 11.5, cursor: 'pointer' }}
                >
                  Batal
                </button>
              </div>

              {/* Quick Paste Banner */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} /> Tempel Otomatis Config Firebase
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfigParser(!showConfigParser)}
                    style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: 11, fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showConfigParser ? 'Tutup Box' : 'Buka Box Tempel'}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.5 }}>
                  Salin blok <code>const firebaseConfig = &#123; ... &#125;</code> dari tab Firebase Console (seperti di layar kiri Anda), lalu tempel di sini agar Project ID, API Key, dan App ID terisi otomatis!
                </div>
                {showConfigParser && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <textarea
                      rows={4}
                      value={rawConfigInput}
                      onChange={(e) => setRawConfigInput(e.target.value)}
                      placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "sumr-day",\n  appId: "1:..."\n};`}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: 11, fontFamily: 'monospace', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleParseRawConfig(rawConfigInput)}
                      style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 7, background: '#f59e0b', color: '#000', fontWeight: 900, fontSize: 11.5, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Sparkles size={13} /> Ekstrak Otomatis Sekarang ✨
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                
                {/* Field 1: Nama Target */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Nama Target *</label>
                    <button type="button" onClick={() => toggleTutorial('name')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: sumr.day"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'name' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Nama Target:</strong> Nama panggilan brand atau proyek (contoh: sumr.day, Klien B, dll).
                    </div>
                  )}
                </div>

                {/* Field 2: Project ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Project ID *</label>
                    <button type="button" onClick={() => toggleTutorial('projectId')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: sumr-day"
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'projectId' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Lokasi Firebase Project ID:</strong>
                      <div style={{ marginTop: 4 }}>
                        Salin dari baris <code>projectId: "..."</code> di tab Project Settings Firebase Console.
                      </div>
                    </div>
                  )}
                </div>

                {/* Field 3: Firebase API Key */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Firebase API Key</label>
                    <button type="button" onClick={() => toggleTutorial('apiKey')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: AIzaSyA0ebREB..."
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'apiKey' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Firebase API Key:</strong> Salin dari baris <code>apiKey: "..."</code> di Firebase Console. Wajib diisi agar database dan login project target tidak nyangkut ke project lama.
                    </div>
                  )}
                </div>

                {/* Field 4: Firebase App ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Firebase App ID</label>
                    <button type="button" onClick={() => toggleTutorial('appId')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: 1:333413040741:web:03cd16..."
                    value={formAppId}
                    onChange={(e) => setFormAppId(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'appId' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Firebase App ID:</strong> Salin dari baris <code>appId: "..."</code> di Firebase Console.
                    </div>
                  )}
                </div>

                {/* Field 5: Storage Prefix */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Storage Prefix</label>
                    <button type="button" onClick={() => toggleTutorial('storagePrefix')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: sumrday"
                    value={formStoragePrefix}
                    onChange={(e) => setFormStoragePrefix(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'storagePrefix' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Fungsi Storage Prefix:</strong> Kata kunci unik tanpa spasi untuk memisahkan cache browser agar data tidak tertukar saat membuka dua website di browser yang sama.
                    </div>
                  )}
                </div>

                {/* Field 6: Token AI (Gemini API Key) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Token AI (Gemini)</label>
                    <button type="button" onClick={() => toggleTutorial('geminiApiKey')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="Kosongkan jika pakai default studio"
                    value={formGeminiApiKey}
                    onChange={(e) => setFormGeminiApiKey(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'geminiApiKey' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Token AI (Gemini Key):</strong> Dapatkan dari <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>Google AI Studio</a>. Jika dikosongkan, sistem otomatis memakai kuota AI default yang sudah tertanam di sistem.
                    </div>
                  )}
                </div>

                {/* Field 7: Sheet ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Sheet ID</label>
                    <button type="button" onClick={() => toggleTutorial('sheetId')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="ID Spreadsheet baru (Opsional)"
                    value={formSheetId}
                    onChange={(e) => setFormSheetId(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'sheetId' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Lokasi Sheet ID:</strong>
                      <div style={{ marginTop: 4 }}>
                        Buka spreadsheet baru di Google Sheets. Lihat URL di browser: <code>/d/<b>KODE_ID_DISINI</b>/edit</code>. Salin kode tersebut.
                      </div>
                    </div>
                  )}
                </div>

                {/* Field 8: Script URL */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Script URL</label>
                    <button type="button" onClick={() => toggleTutorial('scriptUrl')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <BookOpen size={11} /> Tutorial
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="https://script.google.com/.../exec (Opsional)"
                    value={formAppsScriptUrl}
                    onChange={(e) => setFormAppsScriptUrl(e.target.value)}
                    style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', color: 'var(--cms-text, #f8fafc)', fontSize: 12, outline: 'none' }}
                  />
                  {activeTutorial === 'scriptUrl' && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11.5, lineHeight: 1.6, color: 'var(--cms-text, #f1f5f9)' }}>
                      <strong style={{ color: 'var(--cms-text, #ffffff)' }}>Cara Membuat Script URL:</strong>
                      <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
                        <li>Di Google Sheets, klik menu <strong>Extensions &rarr; Apps Script</strong>.</li>
                        <li>Tempel kode dari file <code>google_apps_script.js</code> di project ini.</li>
                        <li>Klik <strong>Deploy &rarr; New deployment &rarr; Web app</strong>.</li>
                        <li>Pilih "Who has access" &rarr; <strong>Anyone</strong> (Wajib).</li>
                        <li>Klik Deploy dan salin link yang berakhiran <code>/exec</code>.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{ height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', background: 'transparent', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ height: 34, padding: '0 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  {viewMode === 'edit' ? 'Simpan Perubahan' : 'Simpan Target'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: TARGETS LIST */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Controls Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  disabled={targets.length === 0}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: targets.length > 0 ? 'pointer' : 'default' }}
                >
                  {selectedIds.length === targets.length && targets.length > 0 ? (
                    <CheckSquare size={16} style={{ color: '#3b82f6' }} />
                  ) : (
                    <Square size={16} style={{ color: 'var(--cms-text-muted)' }} />
                  )}
                  <span>Pilih Semua ({selectedIds.length}/{targets.length})</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--cms-border, rgba(255,255,255,0.2))', background: 'rgba(255,255,255,0.05)', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <Plus size={14} /> Tambah Target
                  </button>

                  <button
                    type="button"
                    onClick={handleDeployBatch}
                    disabled={isBatchRunning || selectedIds.length === 0}
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: (isBatchRunning || selectedIds.length === 0) ? 'rgba(59,130,246,0.3)' : '#3b82f6',
                      color: '#fff',
                      fontSize: 11.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: (isBatchRunning || selectedIds.length === 0) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isBatchRunning ? (
                      <>
                        <Loader2 size={13} className="cms-spin" /> Memproses...
                      </>
                    ) : (
                      <>
                        <Play size={12} fill="currentColor" /> Deploy {selectedIds.length} Target
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Target Cards */}
              {targets.length === 0 ? (
                <div style={{ padding: '32px 18px', borderRadius: 12, border: '1px dashed var(--cms-border, rgba(255,255,255,0.15))', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Server size={28} style={{ color: 'var(--cms-text-muted)', opacity: 0.5 }} />
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Belum Ada Target Terdaftar</div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', maxWidth: 320 }}>
                    Daftarkan project Firebase tujuan Anda untuk mulai melakukan deploy satu per satu atau bersama-sama.
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    style={{ marginTop: 4, height: 32, padding: '0 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <Plus size={13} /> Tambah Target Pertama
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {targets.map(target => {
                    const isSelected = selectedIds.includes(target.id);
                    const runState = runStatuses[target.id];

                    return (
                      <div 
                        key={target.id}
                        style={{
                          borderRadius: 10,
                          border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'var(--cms-border, rgba(255,255,255,0.08))'}`,
                          background: isSelected ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.02)',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              type="button"
                              onClick={() => toggleSelect(target.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--cms-text)', cursor: 'pointer', padding: 0 }}
                            >
                              {isSelected ? (
                                <CheckSquare size={17} style={{ color: '#3b82f6' }} />
                              ) : (
                                <Square size={17} style={{ color: 'var(--cms-text-muted)' }} />
                              )}
                            </button>

                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{target.name}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'var(--cms-text-muted)' }}>
                                  {target.storagePrefix || 'porto'}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                                ID: <code style={{ color: '#93c5fd' }}>{target.projectId}</code>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: target.apiKey ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: target.apiKey ? '#34d399' : '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  {target.apiKey ? '● Config Mandiri' : '○ Default Config'}
                                </span>
                                {target.geminiApiKey && (
                                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                                    AI Key Mandiri
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <a
                              href={`https://${target.projectId}.web.app`}
                              target="_blank"
                              rel="noreferrer"
                              title="Buka Website Target"
                              style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', background: 'transparent', color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                            >
                              <Globe size={13} />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(target)}
                              title="Edit Target"
                              style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', background: 'transparent', color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTarget(target.id, target.name)}
                              title="Hapus Target"
                              style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const cmd = `npm run build && npx firebase deploy --only hosting --project ${target.projectId}`;
                                navigator.clipboard.writeText(cmd);
                                setCopiedCliId(target.id);
                                notify('Perintah CLI berhasil disalin!', 'success');
                                setTimeout(() => setCopiedCliId(null), 2500);
                              }}
                              title="Salin Perintah Deploy Terminal (Deploy Langsung dari Komputer)"
                              style={{
                                height: 30,
                                padding: '0 8px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: 'rgba(255,255,255,0.03)',
                                color: copiedCliId === target.id ? '#34d399' : 'var(--cms-text-muted)',
                                fontSize: 10.5,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer'
                              }}
                            >
                              {copiedCliId === target.id ? <Check size={11} color="#34d399" /> : <Terminal size={11} />}
                              CLI
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeployIndividual(target)}
                              disabled={runState?.status === 'triggering' || runState?.status === 'queued'}
                              style={{
                                height: 30,
                                padding: '0 10px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'rgba(59,130,246,0.15)',
                                color: '#60a5fa',
                                fontSize: 11,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                cursor: 'pointer'
                              }}
                            >
                              <Send size={11} /> Deploy
                            </button>
                          </div>
                        </div>

                        {/* Status Bar per Target */}
                        {runState && runState.status !== 'idle' && (
                          <div style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: runState.status === 'error' ? 'rgba(239,68,68,0.1)' : runState.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                            border: `1px solid ${runState.status === 'error' ? 'rgba(239,68,68,0.25)' : runState.status === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {runState.status === 'triggering' || runState.status === 'queued' || runState.status === 'running' ? (
                                <Loader2 size={12} className="cms-spin" style={{ color: '#3b82f6' }} />
                              ) : runState.status === 'success' ? (
                                <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                              ) : (
                                <AlertCircle size={12} style={{ color: '#ef4444' }} />
                              )}
                              <span>{runState.message}</span>
                            </div>

                            {runState.runUrl && (
                              <a 
                                href={runState.runUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ fontSize: 10.5, fontWeight: 700, color: '#3b82f6', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 3 }}
                              >
                                Log <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        )}

                        {target.lastDeployedAt && !runState && (
                          <div style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
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

          {/* Guarantee Note */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: '#a7f3d0' }}>
              <strong>Jaminan Keamanan:</strong> Masing-masing target terisolasi mandiri. Database Firestore lama dan data lokal tidak tersentuh.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.1))', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 34,
              padding: '0 16px',
              borderRadius: 8,
              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
              background: 'transparent',
              color: 'var(--cms-text)',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer'
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
