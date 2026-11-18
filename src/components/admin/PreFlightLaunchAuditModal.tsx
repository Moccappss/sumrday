import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, XCircle, Rocket, RefreshCw, 
  ShieldCheck, MessageCircle, TrendingUp, Activity, Wrench
} from 'lucide-react';
import { autonomousLaunchAuditor, LaunchAuditReport } from '../../utils/autonomousLaunchAuditor';
import { smartCashFlowPredictor, CashFlowForecast, AgingReceivableItem } from '../../utils/smartCashFlowPredictor';
import { crashProofEngine } from '../../utils/crashProofZeroDowntimeEngine';
import { haptic } from '../../utils/haptics';

interface PreFlightLaunchAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const PreFlightLaunchAuditModal: React.FC<PreFlightLaunchAuditModalProps> = ({
  isOpen,
  onClose,
  notify
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'finance' | 'stability'>('audit');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<LaunchAuditReport | null>(null);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState<string[]>([]);
  const [incidentLogs, setIncidentLogs] = useState<any[]>([]);

  // ── DYNAMIC THEME & MOBILE SCREEN SYNCHRONIZER ──
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const cmsStorage = localStorage.getItem('cms_dark_mode');
    if (cmsStorage !== null) return cmsStorage !== 'false';
    return document.documentElement.classList.contains('dark') ||
           document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.documentElement.getAttribute('data-cms-theme') === 'dark' ||
           !!document.querySelector('[data-cms-theme="dark"]');
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 640 : false;
  });

  useEffect(() => {
    const updateTheme = () => {
      const cmsStorage = localStorage.getItem('cms_dark_mode');
      if (cmsStorage !== null) {
        setIsDark(cmsStorage !== 'false');
        return;
      }
      const dark = document.documentElement.classList.contains('dark') ||
                   document.documentElement.getAttribute('data-theme') === 'dark' ||
                   document.documentElement.getAttribute('data-cms-theme') === 'dark' ||
                   !!document.querySelector('[data-cms-theme="dark"]');
      setIsDark(dark);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    updateTheme();
    const obs = new MutationObserver(updateTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-cms-theme'] });
    window.addEventListener('cms_theme_changed', updateTheme);
    window.addEventListener('resize', handleResize);
    return () => {
      obs.disconnect();
      window.removeEventListener('cms_theme_changed', updateTheme);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [auditRes, forecastRes] = await Promise.all([
        autonomousLaunchAuditor.runAudit(),
        smartCashFlowPredictor.calculateForecast()
      ]);
      setReport(auditRes);
      setForecast(forecastRes);
      setIncidentLogs(crashProofEngine.getIncidentLogs());
    } catch (err: any) {
      notify?.('Gagal memuat audit: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAuditData();
    }
  }, [isOpen]);

  const handleRunAutoFix = async () => {
    setIsFixing(true);
    haptic.medium();
    try {
      const res = await autonomousLaunchAuditor.runAutoFix();
      setFixResults(res.details);
      notify?.(`✅ Selesai: ${res.fixedCount} item diperbaiki!`, 'success');
      await loadAuditData();
    } catch (err: any) {
      notify?.('Gagal perbaikan: ' + err.message, 'error');
    } finally {
      setIsFixing(false);
    }
  };

  const handleSendReminder = (item: AgingReceivableItem) => {
    haptic.light();
    if (!item.clientPhone) {
      notify?.('WhatsApp klien kosong.', 'warning');
      return;
    }
    const text = smartCashFlowPredictor.generateWhatsAppReminder(item, 'sumr.day Studio');
    const cleanPhone = item.clientPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  // ── PALET TEMA TERKALIBRASI (LIGHT & DARK MODE) ──
  const t = {
    modalBg: isDark ? '#0f172a' : '#ffffff',
    subHeaderBg: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
    tabBarBg: isDark ? 'rgba(0, 0, 0, 0.15)' : '#f1f5f9',
    cardItemBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
    cardItemBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#475569',
    textMuted: isDark ? '#64748b' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    accent: '#d95629',
    accentLight: isDark ? 'rgba(217, 86, 41, 0.15)' : 'rgba(217, 86, 41, 0.08)',
    accentBorder: isDark ? 'rgba(217, 86, 41, 0.35)' : 'rgba(217, 86, 41, 0.25)',
    footerBg: isDark ? 'rgba(0, 0, 0, 0.35)' : '#f8fafc',
    scoreRingBg: isDark ? '#0b1120' : '#ffffff'
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      padding: isMobile ? 10 : 16,
      boxSizing: 'border-box'
    }}>
      <div style={{
        // Ukuran tetap (fixed & consistent dimension, zero jumping)
        width: isMobile ? 'calc(100vw - 20px)' : 760,
        maxWidth: isMobile ? 'calc(100vw - 20px)' : '92vw',
        height: isMobile ? 'calc(100dvh - 24px)' : 640,
        maxHeight: isMobile ? 'calc(100dvh - 24px)' : '88vh',
        background: t.modalBg,
        border: `1px solid ${t.border}`,
        borderRadius: isMobile ? 16 : 20,
        boxShadow: isDark 
          ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(217, 86, 41, 0.12)' 
          : '0 20px 50px -10px rgba(15, 23, 42, 0.18), 0 0 20px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: t.textPrimary,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif',
        transition: 'background 0.2s ease, border-color 0.2s ease'
      }}>
        {/* ── 1. HEADER (FIXED TOP) ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px 14px' : '14px 20px',
          borderBottom: `1px solid ${t.border}`,
          background: isDark 
            ? 'linear-gradient(135deg, rgba(217, 86, 41, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#d95629',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Rocket size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: isMobile ? 14.5 : 15.5,
                  fontWeight: 800,
                  color: t.textPrimary,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Launch Auditor
                </h3>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 750,
                  padding: '1px 6px',
                  borderRadius: 6,
                  background: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  whiteSpace: 'nowrap'
                }}>
                  Zero-Defect
                </span>
              </div>
              <p style={{
                margin: '1px 0 0',
                fontSize: 11,
                color: t.textSecondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Inspeksi sistem & radar stabilitas arus kas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            title="Tutup"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              border: 'none',
              color: t.textSecondary,
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── 2. SCORE STRIP (FIXED) ── */}
        <div style={{
          flexShrink: 0,
          padding: isMobile ? '10px 14px' : '12px 20px',
          background: t.subHeaderBg,
          borderBottom: `1px solid ${t.border}`,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: isMobile ? 10 : 14
        }}>
          {/* Circular Score Gauge */}
          <div style={{
            width: isMobile ? 48 : 54,
            height: isMobile ? 48 : 54,
            borderRadius: '50%',
            background: 'conic-gradient(#d95629 0%, #10b981 85%, #cbd5e1 100%)',
            padding: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: t.scoreRingBg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 900, color: t.textPrimary, lineHeight: 1 }}>
                {report ? `${report.overallScore}%` : '...'}
              </span>
              <span style={{ fontSize: 8.5, fontWeight: 800, color: '#f59e0b' }}>
                {report?.grade || 'A'}
              </span>
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: isMobile ? 12 : 13,
              fontWeight: 800,
              color: t.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {report?.readinessStatus || 'Memeriksa sistem...'}
            </div>
            <div style={{
              fontSize: 10.5,
              color: t.textSecondary,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Partisi Database Aman • {report?.metrics.totalProjects || 0} Proyek • {report?.metrics.totalTransactions || 0} Transaksi
            </div>
          </div>

          <button
            onClick={loadAuditData}
            disabled={loading}
            title="Audit Ulang"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
              border: `1px solid ${t.border}`,
              color: t.textPrimary,
              padding: isMobile ? '6px 8px' : '6px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              flexShrink: 0
            }}
          >
            <RefreshCw size={12} className={loading ? 'cms-spin' : ''} />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>Audit Ulang</span>
          </button>
        </div>

        {/* ── 3. TAB BAR (1-2 KATA DENGAN ICON) ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          borderBottom: `1px solid ${t.border}`,
          background: t.tabBarBg,
          padding: '0 14px',
          gap: 4
        }}>
          {[
            { id: 'audit', label: 'Audit Launch', icon: <ShieldCheck size={14} /> },
            { id: 'finance', label: 'Arus Kas', icon: <TrendingUp size={14} /> },
            { id: 'stability', label: 'Stabilitas', icon: <Activity size={14} /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); haptic.light(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: isMobile ? '10px 12px' : '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#d95629' : t.textSecondary,
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid #d95629' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 4. BODY CONTENT (SCROLLABLE DENGAN TINGGI TETAP) ── */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? 12 : 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {/* TAB 1: AUDIT LAUNCH */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {report?.checks.map(check => {
                const isPass = check.status === 'pass';
                const isWarn = check.status === 'warning';
                const statusColor = isPass ? '#059669' : isWarn ? '#d97706' : '#dc2626';
                const StatusIcon = isPass ? CheckCircle2 : isWarn ? AlertTriangle : XCircle;

                return (
                  <div
                    key={check.id}
                    style={{
                      background: t.cardItemBg,
                      border: `1px solid ${isPass ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5') : isWarn ? (isDark ? 'rgba(245, 158, 11, 0.25)' : '#fef3c7') : (isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2')}`,
                      borderRadius: 10,
                      padding: isMobile ? 10 : 12,
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: 10,
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ color: statusColor, marginTop: 1, flexShrink: 0 }}>
                      <StatusIcon size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 750, color: t.textPrimary }}>
                          {check.name}
                        </span>
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 750,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: isPass ? (isDark ? 'rgba(16,185,129,0.2)' : '#ecfdf5') : isWarn ? (isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : (isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2'),
                          color: statusColor,
                          whiteSpace: 'nowrap'
                        }}>
                          {isPass ? 'Lolos (100%)' : isWarn ? 'Perhatian' : 'Kritis'}
                        </span>
                      </div>
                      <p style={{ margin: '3px 0 2px', fontSize: 11, color: t.textSecondary, lineHeight: 1.45 }}>
                        {check.message}
                      </p>
                      <div style={{ fontSize: 10.5, color: isDark ? '#94a3b8' : '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                        💡 Saran: {check.recommendation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ARUS KAS & PIUTANG */}
          {activeTab === 'finance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 3 Metric Cards Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{
                  background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                  border: isDark ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #bbf7d0',
                  padding: 10,
                  borderRadius: 10
                }}>
                  <div style={{ fontSize: 10, fontWeight: 750, color: '#059669' }}>Kas Masuk</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.textPrimary, marginTop: 2 }}>
                    Rp {(forecast?.currentCashIn || 0).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: 9.5, color: t.textSecondary }}>Pelunasan & DP diterima</div>
                </div>

                <div style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #fecaca',
                  padding: 10,
                  borderRadius: 10
                }}>
                  <div style={{ fontSize: 10, fontWeight: 750, color: '#dc2626' }}>Piutang</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.textPrimary, marginTop: 2 }}>
                    Rp {(forecast?.totalReceivables || 0).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: 9.5, color: t.textSecondary }}>{forecast?.agingReceivables.length || 0} Invoice tertunda</div>
                </div>

                <div style={{
                  background: isDark ? 'rgba(217, 86, 41, 0.08)' : '#fff7ed',
                  border: isDark ? '1px solid rgba(217, 86, 41, 0.25)' : '1px solid #fed7aa',
                  padding: 10,
                  borderRadius: 10
                }}>
                  <div style={{ fontSize: 10, fontWeight: 750, color: '#d95629' }}>Prediksi 30h</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: t.textPrimary, marginTop: 2 }}>
                    Rp {(forecast?.predicted30DaysInflow || 0).toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: 9.5, color: t.textSecondary }}>Pipeline proyek aktif</div>
                </div>
              </div>

              {/* Aging Receivables */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: t.textPrimary, marginBottom: 6 }}>
                  Radar Piutang & Pengingat WhatsApp
                </div>

                {forecast && forecast.agingReceivables.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {forecast.agingReceivables.map(item => {
                      const isCritical = item.statusCategory === 'critical';
                      const badgeColor = isCritical ? '#dc2626' : '#d97706';

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: t.cardItemBg,
                            border: `1px solid ${isCritical ? (isDark ? 'rgba(239, 68, 68, 0.3)' : '#fca5a5') : t.cardItemBorder}`,
                            borderRadius: 8,
                            padding: '8px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 750, color: t.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.clientName}
                              </span>
                              <span style={{
                                fontSize: 9,
                                fontWeight: 750,
                                padding: '1px 5px',
                                borderRadius: 4,
                                background: isCritical ? (isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2') : (isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7'),
                                color: badgeColor,
                                whiteSpace: 'nowrap'
                              }}>
                                {item.daysAging} Hari
                              </span>
                            </div>
                            <div style={{ fontSize: 10.5, color: t.textSecondary, marginTop: 2 }}>
                              Sisa: <strong style={{ color: t.textPrimary }}>Rp {item.remainingAmount.toLocaleString('id-ID')}</strong> • {item.projectTitle}
                            </div>
                          </div>

                          <button
                            onClick={() => handleSendReminder(item)}
                            title="Kirim Pesan WhatsApp"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              background: '#25D366',
                              color: '#ffffff',
                              border: 'none',
                              padding: isMobile ? '6px 8px' : '6px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 750,
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            <MessageCircle size={13} />
                            <span style={{ display: isMobile ? 'none' : 'inline' }}>Kirim WA</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center', color: t.textSecondary, fontSize: 12 }}>
                    ✅ Seluruh invoice berstatus lunas.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STABILITAS RUNTIME */}
          {activeTab === 'stability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #bbf7d0',
                borderRadius: 10,
                padding: 10,
                display: 'flex',
                gap: 10,
                alignItems: 'center'
              }}>
                <ShieldCheck size={24} color="#059669" />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#059669' }}>
                    Shield Runtime Aktif
                  </div>
                  <div style={{ fontSize: 10.5, color: t.textSecondary, marginTop: 1 }}>
                    Pelindung zero-white-screen dan isolasi otomatis beroperasi normal.
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: t.textPrimary, marginBottom: 6 }}>
                  Riwayat Insiden ({incidentLogs.length})
                </div>

                {incidentLogs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {incidentLogs.map((log, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: t.cardItemBg,
                          border: `1px solid ${t.cardItemBorder}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 10.5,
                          color: t.textSecondary
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: t.textMuted, fontSize: 9.5 }}>
                          <span>Tipe: {log.type}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                        </div>
                        <div style={{ marginTop: 2, color: t.textPrimary, fontWeight: 600 }}>
                          {log.message}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center', color: t.textSecondary, fontSize: 11.5 }}>
                    🛡️ Nol insiden fatal. Runtime browser stabil.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto-Fix Feedback */}
          {fixResults.length > 0 && (
            <div style={{
              background: isDark ? 'rgba(217, 86, 41, 0.1)' : '#fff7ed',
              border: `1px solid ${t.accentBorder}`,
              borderRadius: 8,
              padding: 8,
              fontSize: 11,
              color: isDark ? '#fdba74' : '#c2410c'
            }}>
              <strong>Hasil Perbaikan:</strong>
              <ul style={{ margin: '3px 0 0', paddingLeft: 14 }}>
                {fixResults.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── 5. FOOTER (FIXED BOTTOM - 1-2 KATA & ICON ONLY) ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '10px 14px' : '12px 20px',
          borderTop: `1px solid ${t.border}`,
          background: t.footerBg
        }}>
          <div style={{ fontSize: 10.5, color: t.textMuted, whiteSpace: 'nowrap' }}>
            Production Suite 2026
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleRunAutoFix}
              disabled={isFixing}
              title="Perbaiki Cepat Otomatis"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#d95629',
                color: '#ffffff',
                border: 'none',
                padding: isMobile ? '7px 12px' : '8px 16px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 750,
                cursor: isFixing ? 'not-allowed' : 'pointer'
              }}
            >
              <Wrench size={13} className={isFixing ? 'cms-spin' : ''} />
              <span>{isFixing ? 'Memperbaiki...' : 'Auto-Heal'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                color: t.textPrimary,
                border: `1px solid ${t.border}`,
                padding: isMobile ? '7px 12px' : '8px 16px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 650,
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
