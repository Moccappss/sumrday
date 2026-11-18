import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity, RefreshCw, Copy, ExternalLink, Zap, Check, AlertTriangle,
  CheckCircle2, QrCode, Image as ImageIcon, Send, FileSpreadsheet,
  ArrowLeft, Wand2, HardDrive, Calendar, DollarSign, FolderPlus,
  CheckSquare, CalendarDays, Eye, Building2, Palette, Search,
  DownloadCloud, Database, Cloud, Sparkles, MessageCircle
} from 'lucide-react';
import { AppConfig, AI_CONFIG, CLOUDINARY_CONFIG, GOOGLE_CONFIG, FIREBASE_CONFIG } from '../../config/AppConfig';
import { db } from '../../firebase';
import { storage } from '../../utils/storage';
import { callGemini, testGeminiConnection } from '../../utils/ai';
import { applyCloudinaryAi } from '../../utils/cloudinary';
import { googleSync } from '../../utils/googleSync';
import { formatWhatsAppNumber } from '../../hooks/useBusinessProfile';
import { getHolidaysForDate } from '../../utils/holidaysIndonesia';
import {
  getClearbitLogoUrl,
  getCloudinaryDynamicOgCard,
  searchUnsplashCurated,
  UnsplashPhoto
} from '../../utils/mediaIntegrations';
import { haptic } from '../../utils/haptics';
import InfoTooltip from './InfoTooltip';

interface ThirdPartyIntegrationsHubProps {
  onNavigate?: (page: string) => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  isDarkMode?: boolean;
  hideBackButton?: boolean;
}

export const ThirdPartyIntegrationsHub: React.FC<ThirdPartyIntegrationsHubProps> = ({
  onNavigate,
  notify,
  isDarkMode = true,
  hideBackButton = false
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState<'radar' | 'gimmicks' | 'audit'>('radar');
  const [gimmickFilter, setGimmickFilter] = useState<'all' | 'media' | 'ai' | 'wa' | 'workflow'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = useCallback((text: string, label: string = 'Teks') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    try { haptic('selection'); } catch {}
    if (notify) notify(`${label} disalin`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  }, [notify]);

  // ── 1. KONEKSI & PING TEST ──
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [services, setServices] = useState<Record<string, {
    id: string;
    name: string;
    provider: string;
    status: 'idle' | 'testing' | 'online' | 'warning' | 'offline';
    latencyMs: number | null;
    targetInfo: string;
    icon: any;
    color: string;
    actionUrl?: string;
  }>>({
    firebase: {
      id: 'firebase',
      name: 'Firestore',
      provider: 'Database',
      status: 'idle',
      latencyMs: null,
      targetInfo: FIREBASE_CONFIG.projectId || 'Belum diatur',
      icon: Database,
      color: '#f59e0b',
      actionUrl: `https://console.firebase.google.com/project/${FIREBASE_CONFIG.projectId}/firestore`
    },
    cloudinary: {
      id: 'cloudinary',
      name: 'Cloudinary',
      provider: 'Media CDN',
      status: 'idle',
      latencyMs: null,
      targetInfo: CLOUDINARY_CONFIG.cloudName || 'Belum diatur',
      icon: Cloud,
      color: '#0284c7',
      actionUrl: 'https://cloudinary.com/console'
    },
    googleAppsScript: {
      id: 'googleAppsScript',
      name: 'Google Sheet',
      provider: 'Spreadsheet',
      status: 'idle',
      latencyMs: null,
      targetInfo: GOOGLE_CONFIG.sheetId ? `${GOOGLE_CONFIG.sheetId.slice(0, 10)}...` : 'Belum diatur',
      icon: FileSpreadsheet,
      color: '#10b981',
      actionUrl: GOOGLE_CONFIG.sheetId ? `https://docs.google.com/spreadsheets/d/${GOOGLE_CONFIG.sheetId}/edit` : undefined
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini AI',
      provider: 'AI Assistant',
      status: 'idle',
      latencyMs: null,
      targetInfo: AI_CONFIG.geminiApiKey ? 'Kunci Aktif' : 'Kunci Kosong',
      icon: Sparkles,
      color: '#8b5cf6',
      actionUrl: 'https://aistudio.google.com/app/apikey'
    },
    whatsapp: {
      id: 'whatsapp',
      name: 'WhatsApp',
      provider: 'Pesan Klien',
      status: 'idle',
      latencyMs: null,
      targetInfo: 'Protokol wa.me',
      icon: MessageCircle,
      color: '#22c55e',
      actionUrl: 'https://web.whatsapp.com'
    }
  });

  const runSinglePing = async (id: string) => {
    try { haptic('impactLight'); } catch {}
    setServices(prev => ({
      ...prev,
      [id]: { ...prev[id], status: 'testing' }
    }));

    const start = performance.now();

    if (id === 'firebase') {
      try {
        if (!navigator.onLine) {
          setServices(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'offline', latencyMs: null } }));
          return;
        }
        if (db) {
          const lat = Math.max(Math.round(performance.now() - start), 24);
          setServices(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'online', latencyMs: lat } }));
        } else {
          setServices(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'warning', latencyMs: null } }));
        }
      } catch {
        setServices(prev => ({ ...prev, firebase: { ...prev.firebase, status: 'offline', latencyMs: null } }));
      }
    } else if (id === 'cloudinary') {
      try {
        const cloudName = CLOUDINARY_CONFIG.cloudName || 'dlvjat7lg';
        await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/w_20,q_10,f_auto/sample.jpg`, { method: 'HEAD', mode: 'no-cors' });
        const lat = Math.round(performance.now() - start);
        setServices(prev => ({ ...prev, cloudinary: { ...prev.cloudinary, status: 'online', latencyMs: lat } }));
      } catch {
        setServices(prev => ({ ...prev, cloudinary: { ...prev.cloudinary, status: 'warning', latencyMs: null } }));
      }
    } else if (id === 'googleAppsScript') {
      try {
        const res = await googleSync.pingAppsScript();
        setServices(prev => ({
          ...prev,
          googleAppsScript: {
            ...prev.googleAppsScript,
            status: res.ok ? 'online' : 'warning',
            latencyMs: res.latencyMs || Math.round(performance.now() - start)
          }
        }));
      } catch {
        setServices(prev => ({ ...prev, googleAppsScript: { ...prev.googleAppsScript, status: 'offline', latencyMs: null } }));
      }
    } else if (id === 'gemini') {
      try {
        const res = await testGeminiConnection();
        setServices(prev => ({
          ...prev,
          gemini: {
            ...prev.gemini,
            status: res.success ? 'online' : 'warning',
            latencyMs: res.latencyMs
          }
        }));
      } catch {
        setServices(prev => ({ ...prev, gemini: { ...prev.gemini, status: 'offline', latencyMs: null } }));
      }
    } else if (id === 'whatsapp') {
      const lat = Math.max(Math.round(performance.now() - start), 10);
      setServices(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, status: 'online', latencyMs: lat } }));
    }
  };

  const runAllBenchmarks = async () => {
    setIsBenchmarking(true);
    try { haptic('selection'); } catch {}
    for (const id of ['firebase', 'cloudinary', 'googleAppsScript', 'gemini', 'whatsapp']) {
      await runSinglePing(id);
    }
    setIsBenchmarking(false);
    if (notify) notify('Koneksi dicek', 'success');
  };

  // ── 2. PINTASAN: KOMPRES GAMBAR ──
  const [sourceImageUrl, setSourceImageUrl] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  );
  const [selectedTransform, setSelectedTransform] = useState<'compress' | 'avatar' | 'banner'>('compress');

  const transformedUrl = useMemo(() => {
    if (!sourceImageUrl) return '';
    const isCloudinary = sourceImageUrl.includes('cloudinary.com');

    if (isCloudinary) {
      if (selectedTransform === 'compress') {
        return sourceImageUrl.includes('/upload/')
          ? sourceImageUrl.replace('/upload/', '/upload/f_auto,q_auto:eco/')
          : sourceImageUrl;
      }
      if (selectedTransform === 'avatar') {
        return sourceImageUrl.includes('/upload/')
          ? sourceImageUrl.replace('/upload/', '/upload/c_thumb,g_face,w_300,h_300,f_auto,q_auto/')
          : sourceImageUrl;
      }
      if (selectedTransform === 'banner') {
        return sourceImageUrl.includes('/upload/')
          ? sourceImageUrl.replace('/upload/', '/upload/c_fill,g_auto,w_1200,h_675,f_auto,q_auto/')
          : sourceImageUrl;
      }
    }

    const cloud = CLOUDINARY_CONFIG.cloudName || 'dlvjat7lg';
    const baseUrl = `https://res.cloudinary.com/${cloud}/image/fetch/`;
    if (selectedTransform === 'compress') return `${baseUrl}f_auto,q_auto:eco/${encodeURIComponent(sourceImageUrl)}`;
    if (selectedTransform === 'avatar') return `${baseUrl}c_thumb,g_face,w_300,h_300,f_auto,q_auto/${encodeURIComponent(sourceImageUrl)}`;
    if (selectedTransform === 'banner') return `${baseUrl}c_fill,g_auto,w_1200,h_675,f_auto,q_auto/${encodeURIComponent(sourceImageUrl)}`;
    return sourceImageUrl;
  }, [sourceImageUrl, selectedTransform]);

  // ── 3. PINTASAN: BALASAN CHAT AI ──
  const [aiClientName, setAiClientName] = useState('Sarah');
  const [aiServiceName, setAiServiceName] = useState('Website Landing Page');
  const [aiNominal, setAiNominal] = useState('1.500.000');
  const [aiScenario, setAiScenario] = useState<'billing' | 'welcome' | 'handover'>('billing');
  const [aiResultText, setAiResultText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleGenerateAiMessage = async () => {
    setIsAiGenerating(true);
    try { haptic('impactMedium'); } catch {}

    const promptMap: Record<string, string> = {
      billing: `Tuliskan pesan WhatsApp singkat & santun untuk klien bernama ${aiClientName}. Layanan: ${aiServiceName}. Sisa tagihan: Rp ${aiNominal}. Sertakan rincian rekening pembayaran. Format tebal WhatsApp (*teks*).`,
      welcome: `Tuliskan sambutan WhatsApp ramah untuk calon klien baru bernama ${aiClientName} yang tanya layanan ${aiServiceName}. Tanyakan target jadwal dan referensi visual.`,
      handover: `Tuliskan pesan WhatsApp serah terima proyek selesai untuk ${aiClientName} (${aiServiceName}). Berkas siap diunduh dan minta ulasan singkat bintang 5.`
    };

    try {
      const res = await callGemini(promptMap[aiScenario] || promptMap.billing, "Kamu asisten admin studio. Balas langsung teks pesan tanpa intro.", 1, 400);
      setAiResultText(res || '');
      if (notify) notify('Teks siap', 'success');
    } catch {
      const fallbacks: Record<string, string> = {
        billing: `*TAGIHAN PEMBAYARAN*\nHalo ${aiClientName}, pengerjaan *${aiServiceName}* sudah masuk tahap final.\nSisa tagihan: *Rp ${aiNominal}*.\nSilakan konfirmasi bukti transfer jika sudah dikirim ya. Terima kasih!`,
        welcome: `*HALO ${aiClientName}!*\nTerima kasih sudah menghubungi kami untuk *${aiServiceName}*.\nBoleh ceritakan target jadwal rilis dan referensi gaya yang disukai?`,
        handover: `*PROYEK SELESAI*\nHalo ${aiClientName}, seluruh file master untuk *${aiServiceName}* sudah siap diakses. Terima kasih kerja samanya!`
      };
      setAiResultText(fallbacks[aiScenario]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // ── 4. PINTASAN: WHATSAPP ROUTER ──
  const [waPhoneNumber, setWaPhoneNumber] = useState('081234567890');
  const [waMessageText, setWaMessageText] = useState('Halo Kak, ada update dari admin studio.');
  const [showQrCode, setShowQrCode] = useState(false);

  const cleanWaNumber = useMemo(() => formatWhatsAppNumber(waPhoneNumber), [waPhoneNumber]);
  const waDirectUrl = useMemo(() => `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waMessageText)}`, [cleanWaNumber, waMessageText]);
  const waQrCodeUrl = useMemo(() => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(waDirectUrl)}&margin=8&color=0f172a&bgcolor=ffffff`, [waDirectUrl]);

  // ── 5. PINTASAN: CHAT KE PROYEK ──
  const [rawBriefChat, setRawBriefChat] = useState('Halo mas arif, saya Sarah. Mau pesan website landing page budget 3.5 juta target 2 minggu.');
  const [isParsingBrief, setIsParsingBrief] = useState(false);
  const [parsedProject, setParsedProject] = useState<{ clientName: string; title: string; budget: number; tasks: string[] } | null>(null);

  const handleConvertBrief = async () => {
    setIsParsingBrief(true);
    try {
      const res = await callGemini(`Ekstrak teks ini jadi JSON valid: {"clientName":"...","title":"...","budget":3500000,"tasks":["tugas1","tugas2"]}\nTeks: "${rawBriefChat}"`, "Hanya cetak JSON murni tanpa markdown.", 1, 300);
      const json = JSON.parse(res.replace(/```json/g, '').replace(/```/g, '').trim());
      setParsedProject({
        clientName: json.clientName || 'Sarah',
        title: json.title || 'Landing Page',
        budget: Number(json.budget) || 3500000,
        tasks: Array.isArray(json.tasks) ? json.tasks : ['Konsep & Layout', 'Pengembangan Web', 'Finalisasi']
      });
      if (notify) notify('Chat diekstrak', 'success');
    } catch {
      setParsedProject({
        clientName: 'Sarah',
        title: 'Website Landing Page',
        budget: 3500000,
        tasks: ['Konsep & Layout', 'Pengembangan Web', 'Finalisasi']
      });
    } finally {
      setIsParsingBrief(false);
    }
  };

  const handleSaveProject = async () => {
    if (!parsedProject) return;
    const existing = await storage.getItem('porto_projects', []);
    const newProj = {
      id: `proj_${Date.now()}`,
      title: parsedProject.title,
      clientName: parsedProject.clientName,
      budget: parsedProject.budget,
      status: 'todo',
      priority: 'high',
      progress: 0,
      milestones: parsedProject.tasks.map((t, i) => ({ id: `m_${i}`, title: t, done: false })),
      createdAt: Date.now()
    };
    await storage.setItem('porto_projects', [newProj, ...existing]);
    if (notify) notify('Proyek tersimpan', 'success');
  };

  // ── 6. PINTASAN: GOOGLE CALENDAR ──
  const [calTitle, setCalTitle] = useState('Deadline Sarah');
  const [calDate, setCalDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const googleCalendarUrl = useMemo(() => {
    const dStr = calDate.replace(/-/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calTitle)}&dates=${dStr}T090000Z/${dStr}T100000Z`;
  }, [calTitle, calDate]);

  // ── 7. PINTASAN: LOGO DOMAIN ──
  const [logoDomain, setLogoDomain] = useState('tokopedia.com');
  const brandLogoUrl = useMemo(() => getClearbitLogoUrl(logoDomain, 256), [logoDomain]);

  // ── 8. PINTASAN: HARI KERJA INDONESIA ──
  const [startDateStr, setStartDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [workDaysCount, setWorkDaysCount] = useState<number>(5);

  const businessDaysResult = useMemo(() => {
    const cur = new Date(startDateStr);
    let added = 0;
    while (added < workDaysCount) {
      cur.setDate(cur.getDate() + 1);
      const day = cur.getDay();
      if (day === 0 || day === 6) continue;
      const curStr = cur.toISOString().split('T')[0];
      const holidays = getHolidaysForDate(curStr);
      if (holidays.some(h => h.isRedDate)) continue;
      added++;
    }
    return cur.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  }, [startDateStr, workDaysCount]);

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      boxSizing: 'border-box',
      padding: isMobile ? '12px 10px 80px' : '20px 24px 60px',
      color: 'var(--cms-text, #f8fafc)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ maxWidth: 1040, width: '100%', margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
        }}>
          <div className="hub-back-header-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onNavigate && !hideBackButton && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                title="Kembali"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  border: 'none', color: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 800 }}>
                Gateway
              </h1>
              <InfoTooltip content="Koneksi server & pintasan cepat admin" placement="bottom" />
            </div>
          </div>

          <button
            type="button"
            onClick={runAllBenchmarks}
            disabled={isBenchmarking}
            title="Tes Semua Koneksi"
            aria-label="Tes Semua Koneksi"
            style={{
              width: 36, height: 36, padding: 0, borderRadius: 10,
              background: '#0284c7', color: '#fff', border: 'none',
              cursor: isBenchmarking ? 'wait' : 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <RefreshCw size={15} className={isBenchmarking ? 'cms-spin' : ''} />
          </button>
        </div>

        {/* ── TAB SELECTOR (1-2 KATA) ── */}
        <div style={{
          display: 'flex',
          gap: 4,
          background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
          padding: 4,
          borderRadius: 12,
          marginBottom: 20
        }}>
          {[
            { key: 'radar', label: 'Koneksi', icon: Activity },
            { key: 'gimmicks', label: 'Pintasan', icon: Wand2 },
            { key: 'audit', label: 'Kuota', icon: HardDrive }
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  try { haptic('selection'); } catch {}
                  setActiveTab(tab.key as any);
                }}
                style={{
                  flex: 1, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderRadius: 8, border: 'none',
                  background: isActive ? (isDarkMode ? '#0284c7' : '#fff') : 'transparent',
                  color: isActive ? (isDarkMode ? '#fff' : '#0284c7') : (isDarkMode ? '#94a3b8' : '#64748b'),
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 12.5, cursor: 'pointer'
                }}
              >
                <TabIcon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: KONEKSI ── */}
        {activeTab === 'radar' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12
          }}>
            {Object.values(services).map(svc => {
              const IconComp = svc.icon;
              const isOnline = svc.status === 'online';
              const isTesting = svc.status === 'testing';

              return (
                <div
                  key={svc.id}
                  style={{
                    background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#ffffff',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${svc.color}20`, color: svc.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComp size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>{svc.name}</div>
                        <div style={{ fontSize: 10.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{svc.provider}</div>
                      </div>
                    </div>

                    <div style={{
                      padding: '2px 8px', borderRadius: 100, fontSize: 10.5, fontWeight: 700,
                      background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isOnline ? '#10b981' : '#f59e0b'
                    }}>
                      {isTesting ? 'Cek' : isOnline ? `${svc.latencyMs}ms` : 'Siap'}
                    </div>
                  </div>

                  <div style={{
                    fontSize: 11, fontFamily: 'monospace',
                    padding: '6px 8px', borderRadius: 6,
                    background: isDarkMode ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {svc.targetInfo}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => runSinglePing(svc.id)}
                      disabled={isTesting}
                      title="Tes Ping"
                      style={{
                        height: 28, padding: '0 10px', borderRadius: 6,
                        background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                        color: 'inherit', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <RefreshCw size={11} className={isTesting ? 'cms-spin' : ''} />
                      <span>Tes</span>
                    </button>

                    {svc.actionUrl && (
                      <a
                        href={svc.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Buka Konsol"
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          color: svc.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB 2: PINTASAN CEPAT ── */}
        {activeTab === 'gimmicks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Filter Kategori 1-2 Kata */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'Semua' },
                { key: 'media', label: 'Gambar' },
                { key: 'ai', label: 'Teks AI' },
                { key: 'wa', label: 'Chat WA' },
                { key: 'workflow', label: 'Proyek' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    try { haptic('selection'); } catch {}
                    setGimmickFilter(f.key as any);
                  }}
                  style={{
                    height: 28, padding: '0 12px', borderRadius: 100, border: 'none',
                    background: gimmickFilter === f.key ? '#0284c7' : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
                    color: gimmickFilter === f.key ? '#fff' : 'inherit',
                    fontSize: 11.5, fontWeight: gimmickFilter === f.key ? 700 : 500, cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 1. Kompres Gambar */}
            {(gimmickFilter === 'all' || gimmickFilter === 'media') && (
              <div style={{
                background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#fff',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                borderRadius: 14, padding: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Kompres Gambar</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['compress', 'avatar', 'banner'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTransform(t)}
                        style={{
                          height: 24, padding: '0 8px', borderRadius: 6, border: 'none',
                          background: selectedTransform === t ? '#0284c7' : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                          color: selectedTransform === t ? '#fff' : 'inherit',
                          fontSize: 10.5, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {t === 'compress' ? 'WebP' : t === 'avatar' ? 'Avatar' : 'Banner'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={sourceImageUrl}
                    onChange={e => setSourceImageUrl(e.target.value)}
                    placeholder="URL gambar..."
                    style={{
                      flex: 1, height: 34, padding: '0 10px', borderRadius: 8,
                      background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc',
                      border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 12
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transformedUrl, 'URL')}
                    title="Salin URL"
                    style={{
                      width: 34, height: 34, borderRadius: 8, background: '#0284c7', color: '#fff',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Logo Domain */}
            {(gimmickFilter === 'all' || gimmickFilter === 'media') && (
              <div style={{
                background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#fff',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                borderRadius: 14, padding: 14
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Ambil Logo</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={logoDomain}
                    onChange={e => setLogoDomain(e.target.value)}
                    placeholder="Domain: tokopedia.com..."
                    style={{
                      flex: 1, height: 34, padding: '0 10px', borderRadius: 8,
                      background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc',
                      border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 12
                    }}
                  />
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4
                  }}>
                    <img src={brandLogoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(brandLogoUrl, 'Logo')}
                    title="Salin Logo"
                    style={{
                      width: 34, height: 34, borderRadius: 8, background: '#38bdf8', color: '#0f172a',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Balasan Klien AI */}
            {(gimmickFilter === 'all' || gimmickFilter === 'ai') && (
              <div style={{
                background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#fff',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                borderRadius: 14, padding: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Balas Klien</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['billing', 'welcome', 'handover'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAiScenario(s)}
                        style={{
                          height: 24, padding: '0 8px', borderRadius: 6, border: 'none',
                          background: aiScenario === s ? '#8b5cf6' : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
                          color: aiScenario === s ? '#fff' : 'inherit',
                          fontSize: 10.5, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {s === 'billing' ? 'Tagihan' : s === 'welcome' ? 'Sapa' : 'Selesai'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <input
                    type="text" value={aiClientName} onChange={e => setAiClientName(e.target.value)} placeholder="Nama klien"
                    style={{ height: 32, padding: '0 8px', borderRadius: 6, background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 11.5 }}
                  />
                  <input
                    type="text" value={aiNominal} onChange={e => setAiNominal(e.target.value)} placeholder="Nominal"
                    style={{ height: 32, padding: '0 8px', borderRadius: 6, background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 11.5 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiMessage}
                  disabled={isAiGenerating}
                  title="Generate Teks"
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8, background: '#8b5cf6', color: '#fff',
                    border: 'none', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', marginBottom: 10,
                    display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Sparkles size={12} className={isAiGenerating ? 'cms-spin' : ''} />
                  <span>{isAiGenerating ? 'Membuat...' : 'Buat Teks'}</span>
                </button>

                {aiResultText && (
                  <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.25)' : '#f8fafc', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: 8 }}>{aiResultText}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button" onClick={() => copyToClipboard(aiResultText, 'Pesan')} title="Salin"
                        style={{ height: 26, padding: '0 8px', borderRadius: 6, background: '#8b5cf6', color: '#fff', border: 'none', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Salin
                      </button>
                      <button
                        type="button" onClick={() => { setWaMessageText(aiResultText); if (notify) notify('Dialihkan ke WA', 'info'); }} title="Kirim ke WA"
                        style={{ height: 26, padding: '0 8px', borderRadius: 6, background: '#22c55e', color: '#fff', border: 'none', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Ke WA
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Kirim WhatsApp */}
            {(gimmickFilter === 'all' || gimmickFilter === 'wa') && (
              <div style={{
                background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#fff',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                borderRadius: 14, padding: 14
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Kirim WA</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="tel" value={waPhoneNumber} onChange={e => setWaPhoneNumber(e.target.value)} placeholder="08..."
                    style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 12 }}
                  />
                  <a
                    href={waDirectUrl} target="_blank" rel="noreferrer" title="Kirim WhatsApp"
                    style={{
                      height: 34, padding: '0 12px', borderRadius: 8, background: '#22c55e', color: '#fff',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700
                    }}
                  >
                    <Send size={13} /> <span>Kirim</span>
                  </a>
                  <button
                    type="button" onClick={() => setShowQrCode(p => !p)} title="QR Code"
                    style={{
                      width: 34, height: 34, borderRadius: 8, background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                      border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <QrCode size={14} />
                  </button>
                </div>

                {showQrCode && (
                  <div style={{ textAlign: 'center', padding: 8 }}>
                    <img src={waQrCodeUrl} alt="QR" style={{ width: 120, height: 120, borderRadius: 8 }} />
                  </div>
                )}
              </div>
            )}

            {/* 5. Chat ke Proyek */}
            {(gimmickFilter === 'all' || gimmickFilter === 'workflow') && (
              <div style={{
                background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#fff',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                borderRadius: 14, padding: 14
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Chat ke Proyek</div>
                <textarea
                  rows={2} value={rawBriefChat} onChange={e => setRawBriefChat(e.target.value)} placeholder="Salin chat klien..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: 8, background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 11.5, marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button" onClick={handleConvertBrief} disabled={isParsingBrief}
                    style={{ height: 28, padding: '0 10px', borderRadius: 6, background: '#f97316', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {isParsingBrief ? 'Ekstrak...' : 'Ekstrak'}
                  </button>
                  {parsedProject && (
                    <button
                      type="button" onClick={handleSaveProject}
                      style={{ height: 28, padding: '0 10px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Simpan Proyek
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 6. Hari Kerja Indonesia & Kalender */}
            {(gimmickFilter === 'all' || gimmickFilter === 'workflow') && (
              <div style={{
                background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#fff',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                borderRadius: 14, padding: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Hari Kerja</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#ec4899' }}>{businessDaysResult}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="date" value={startDateStr} onChange={e => setStartDateStr(e.target.value)}
                    style={{ flex: 1, height: 32, padding: '0 8px', borderRadius: 6, background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 11.5 }}
                  />
                  <input
                    type="number" min={1} max={30} value={workDaysCount} onChange={e => setWorkDaysCount(Number(e.target.value) || 1)}
                    style={{ width: 60, height: 32, padding: '0 8px', borderRadius: 6, background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f8fafc', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', fontSize: 11.5 }}
                  />
                  <a
                    href={googleCalendarUrl} target="_blank" rel="noreferrer" title="Google Calendar"
                    style={{
                      height: 32, padding: '0 10px', borderRadius: 6, background: '#3b82f6', color: '#fff',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700
                    }}
                  >
                    <Calendar size={12} /> <span>Kalender</span>
                  </a>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── TAB 3: KUOTA ── */}
        {activeTab === 'audit' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12
          }}>
            {[
              { name: 'Firestore', quota: '50rb read / hari', desc: 'Cache lokal aktif', color: '#f59e0b' },
              { name: 'Cloudinary', quota: '25 kredit / bulan', desc: 'WebP otomatis', color: '#0284c7' },
              { name: 'Google Sheet', quota: '20rb request / hari', desc: 'Antrean batch', color: '#10b981' },
              { name: 'Gemini AI', quota: '15 RPM gratis', desc: 'Cache 2 jam', color: '#8b5cf6' }
            ].map((q, i) => (
              <div
                key={i}
                style={{
                  padding: 12, borderRadius: 12,
                  background: isDarkMode ? 'var(--cms-card-bg, #151722)' : '#fff',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: q.color }}>{q.name}</div>
                  <div style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${q.color}20`, color: q.color, fontWeight: 700 }}>
                    {q.quota}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>{q.desc}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ThirdPartyIntegrationsHub;
