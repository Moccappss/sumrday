import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Copy, Check, Download, FileCode, Search, ExternalLink, 
  HelpCircle, ChevronDown, ChevronUp, Code, Sparkles, Terminal, Info, ShieldCheck,
  RefreshCw, Layers
} from 'lucide-react';
interface GoogleScriptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const CACHE_KEY_MAIN = '_cached_gas_main_code';
const CACHE_KEY_GAME = '_cached_gas_game_code';

export const GoogleScriptViewerModal: React.FC<GoogleScriptViewerModalProps> = ({
  isOpen,
  onClose,
  notify
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'game'>('main');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Memuat...');
  
  // Real-time live code state (initialized from localStorage cache, updated live via fetch)
  const [mainCode, setMainCode] = useState<string>(() => {
    try {
      return localStorage.getItem(CACHE_KEY_MAIN) || '';
    } catch {
      return '';
    }
  });
  const [gameCode, setGameCode] = useState<string>(() => {
    try {
      return localStorage.getItem(CACHE_KEY_GAME) || '';
    } catch {
      return '';
    }
  });

  // Auto-fetch latest code on open to guarantee it's 100% up-to-date
  const fetchFreshCode = async () => {
    setIsRefreshing(true);
    try {
      const [resMain, resGame] = await Promise.allSettled([
        fetch('/google_apps_script.js?t=' + Date.now()).then(r => r.ok ? r.text() : Promise.reject()),
        fetch('/Code.gs?t=' + Date.now()).then(r => r.ok ? r.text() : Promise.reject())
      ]);

      if (resMain.status === 'fulfilled' && resMain.value && resMain.value.includes('doPost')) {
        setMainCode(resMain.value);
        try { localStorage.setItem(CACHE_KEY_MAIN, resMain.value); } catch {}
      }

      if (resGame.status === 'fulfilled' && resGame.value && resGame.value.includes('doPost')) {
        setGameCode(resGame.value);
        try { localStorage.setItem(CACHE_KEY_GAME, resGame.value); } catch {}
      }

      setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      setLastUpdated('Memuat dari Cache Lokal');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFreshCode();
    }
  }, [isOpen]);

  const currentCode = activeTab === 'main' ? mainCode : gameCode;
  const fileName = activeTab === 'main' ? 'google_apps_script.js' : 'Code.gs';
  const lineCount = currentCode ? currentCode.split('\n').length : 0;
  const fileSizeKb = (new Blob([currentCode || '']).size / 1024).toFixed(1);

  // Extract version from code comments
  const detectedVersion = useMemo(() => {
    if (!currentCode) return 'v6.0.0-ultra-executive-suite';
    const vMatch = currentCode.match(/version:\s*['"]([^'"]+)['"]/i) || currentCode.match(/v(\d+\.\d+\.\d+[-\w]*)/i);
    return vMatch ? vMatch[1] : 'v6.0.0-ultra-executive-suite';
  }, [currentCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      notify?.(`✓ Seluruh script "${fileName}" berhasil disalin ke clipboard!`, 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = currentCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      notify?.(`✓ Seluruh script "${fileName}" berhasil disalin!`, 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify?.(`File "${fileName}" berhasil diunduh.`, 'info');
  };

  // Search filter
  const filteredLines = useMemo(() => {
    if (!searchQuery.trim() || !currentCode) return null;
    const q = searchQuery.toLowerCase();
    const lines = currentCode.split('\n');
    return lines
      .map((text, idx) => ({ lineNum: idx + 1, text }))
      .filter(item => item.text.toLowerCase().includes(q));
  }, [currentCode, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 980,
          maxHeight: '92vh',
          background: 'var(--cms-card-bg, #11131f)',
          border: '1px solid var(--cms-border, rgba(255, 255, 255, 0.15))',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: 'var(--cms-text, #f1f5f9)'
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
            }}>
              <FileCode size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 17.5, fontWeight: 900, color: 'var(--cms-text)' }}>
                  Kode Sumber Google Apps Script (Code.gs)
                </h3>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {detectedVersion}
                </span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
                  Selalu Up-To-Date
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--cms-text-muted)' }}>
                Kode script otomatis tersinkron setiap ada pembaruan di proyek. Salin dan tempel ke <code>script.google.com</code>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={fetchFreshCode}
              disabled={isRefreshing}
              style={{
                height: 34,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: 'var(--cms-text)',
                fontSize: 11.5,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Periksa & Segarkan Kode dari File Sistem"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'transparent',
                color: 'var(--cms-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── TOOLBAR: TABS & ACTIONS ── */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: 'var(--cms-card-bg)'
        }}>
          {/* Script Type Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
            borderRadius: 100,
            padding: 3,
            border: '1px solid var(--cms-border, rgba(255,255,255,0.1))'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('main'); setSearchQuery(''); }}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: 'none',
                background: activeTab === 'main' ? '#10b981' : 'transparent',
                color: activeTab === 'main' ? '#fff' : 'var(--cms-text-muted)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Utama: google_apps_script.js ({fileSizeKb} KB)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('game'); setSearchQuery(''); }}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: 'none',
                background: activeTab === 'game' ? '#10b981' : 'transparent',
                color: activeTab === 'game' ? '#fff' : 'var(--cms-text-muted)',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Game Webhook: Code.gs
            </button>
          </div>

          {/* Search, Download & Copy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari fungsi / keyword..."
                style={{
                  padding: '6px 10px 6px 28px',
                  borderRadius: 8,
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                  background: 'var(--cms-input-bg, rgba(255,255,255,0.04))',
                  color: 'var(--cms-text)',
                  fontSize: 11.5,
                  outline: 'none',
                  width: 170
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Download .js */}
            <button
              type="button"
              onClick={handleDownload}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: 'var(--cms-text)',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Unduh file script mentah ke perangkat Anda"
            >
              <Download size={13} />
              <span>Unduh File</span>
            </button>

            {/* Copy All Code Button (Primary Action) */}
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: 'none',
                background: copied ? '#10b981' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 850,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.15s ease'
              }}
              title="Salin seluruh kode script ke clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Script'}</span>
            </button>
          </div>
        </div>

        {/* ── EXPANDABLE DEPLOYMENT GUIDE ── */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          padding: '10px 24px',
          fontSize: 12
        }}>
          <div 
            onClick={() => setShowGuide(!showGuide)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#38bdf8', fontWeight: 800 }}>
              <HelpCircle size={14} />
              <span>Panduan Cepat: Cara Memperbarui Script di Google Apps Script (Klik untuk buka panduan)</span>
            </div>
            {showGuide ? <ChevronUp size={14} color="#38bdf8" /> : <ChevronDown size={14} color="#38bdf8" />}
          </div>

          {showGuide && (
            <div style={{ marginTop: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.25)', color: 'var(--cms-text)', lineHeight: 1.65 }}>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>Klik tombol hijau <b>"Salin Seluruh Script"</b> di atas.</li>
                <li>Buka proyek Google Apps Script Anda di <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>script.google.com <ExternalLink size={10} style={{ display: 'inline' }} /></a>.</li>
                <li>Buka file <code>Code.gs</code>, tekan <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: 4 }}>Ctrl+A</kbd> (pilih semua kode lama), lalu <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: 4 }}>Ctrl+V</kbd> (tempel kode baru).</li>
                <li>Klik ikon <b>Simpan</b> (<kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: 4 }}>Ctrl+S</kbd>).</li>
                <li>
                  <strong style={{ color: '#f59e0b' }}>Tips Penting (Agar URL Web App Tidak Berubah)</strong>:
                  <br />
                  Klik tombol <b>Deploy</b> (kanan atas) &rarr; pilih <b>Kelola Deployment (Manage deployments)</b> &rarr; klik ikon <b>Pensil (Edit)</b> &rarr; pada bagian Versi pilih <b>"Versi Baru" (New Version)</b> &rarr; klik <b>Deploy</b> &rarr; Selesai!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* ── CODE VIEWER AREA ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#0a0b12',
          padding: '16px',
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
          fontSize: 12,
          lineHeight: 1.65,
          color: '#cbd5e1'
        }}>
          {filteredLines ? (
            /* Search Results */
            <div>
              <div style={{ padding: '4px 8px 12px', fontSize: 11, color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }}>
                Ditemukan {filteredLines.length} baris yang cocok dengan kata kunci <code>"{searchQuery}"</code>:
              </div>
              {filteredLines.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                  Tidak ada baris yang cocok dengan pencarian Anda.
                </div>
              ) : (
                filteredLines.map(item => (
                  <div key={item.lineNum} style={{ display: 'flex', gap: 14, padding: '2px 0' }}>
                    <span style={{ width: 44, color: '#64748b', textAlign: 'right', userSelect: 'none', flexShrink: 0 }}>
                      {item.lineNum}
                    </span>
                    <span style={{ color: '#f8fafc', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {item.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Full Raw Code */
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{currentCode}</code>
            </pre>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: 'var(--cms-card-bg)',
          fontSize: 12,
          color: 'var(--cms-text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Total Baris: <strong style={{ color: 'var(--cms-text)' }}>{lineCount.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Ukuran: <strong style={{ color: 'var(--cms-text)' }}>{fileSizeKb} KB</strong></span>
            <span>•</span>
            <span style={{ fontSize: 11 }}>Sinkron: <strong style={{ color: '#10b981' }}>{lastUpdated}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                background: copied ? '#10b981' : 'var(--cms-accent, #6366f1)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Tersalin!' : 'Salin Script'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: 'transparent',
                color: 'var(--cms-text)',
                border: '1px solid var(--cms-border)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleScriptViewerModal;
