import React, { useState } from 'react';
import { 
  Bell, Clock, CheckCircle2, MessageCircle, FileText, 
  ExternalLink, ChevronDown, ChevronUp, AlertCircle, 
  DollarSign, Sparkles, Send, X, ArrowRight, Check,
  User, ShieldAlert
} from 'lucide-react';
import { openWhatsApp, whatsappTemplates } from '../../utils/whatsappTemplates';
import { approveServiceOrder, rejectServiceOrder, normalizeGoogleDocUrl } from '../../utils/serviceOrderSync';

interface ProjectRemindersBarProps {
  projects: any[];
  onProjectUpdated?: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (msg: string, onConfirm: () => void) => void;
  onOpenServiceOrderModal?: () => void;
  onSelectProject?: (proj: any) => void;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const ProjectRemindersBar: React.FC<ProjectRemindersBarProps> = ({
  projects = [],
  onProjectUpdated,
  notify,
  confirm,
  onOpenServiceOrderModal,
  onSelectProject
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending_acc' | 'wa_brief' | 'deadline' | 'payment'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Compute reminders
  const activeProjects = projects.filter(p => !p.isDeleted && !p.isTrash);

  // 1. Pending ACC
  const pendingAccProjects = activeProjects.filter(p => 
    p.status === 'pending_acc' || (p.requiresAcc && !p.isApproved)
  );

  // 2. WhatsApp Brief explanation requests
  const waBriefProjects = activeProjects.filter(p => 
    p.briefMode === 'whatsapp' && p.status !== 'done'
  );

  // 3. Smart Predictive Deadline Risk & Burndown Engine
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineAlertProjects = activeProjects.map(p => {
    if (!p.deadline || p.status === 'done' || p.status === 'pending_acc') return null;
    const dl = new Date(p.deadline);
    dl.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Hitung checklist tugas
    const tasks = Array.isArray(p.tasks) ? p.tasks : [];
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t: any) => t.completed || t.status === 'done').length;
    const taskPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : (Number(p.progress) || 0);

    // Hitung Tingkat Risiko
    let riskLevel: 'critical' | 'warning' | 'normal' | 'overdue' = 'normal';
    let riskLabel = 'On Track';
    let riskColor = '#10b981';

    if (diffDays < 0) {
      riskLevel = 'overdue';
      riskLabel = `Terlambat ${Math.abs(diffDays)} Hari`;
      riskColor = '#dc2626';
    } else if (diffDays <= 2 && taskPercent < 60) {
      riskLevel = 'critical';
      riskLabel = 'Risiko Tinggi (Perlu Sprint)';
      riskColor = '#ef4444';
    } else if (diffDays <= 4 && taskPercent < 40) {
      riskLevel = 'warning';
      riskLabel = 'Perlu Akselerasi';
      riskColor = '#f59e0b';
    } else if (diffDays <= 3) {
      riskLevel = 'warning';
      riskLabel = diffDays === 0 ? 'Hari Ini' : `Sisa ${diffDays} Hari`;
      riskColor = '#f59e0b';
    }

    if (riskLevel === 'normal' && diffDays > 3) return null;

    return {
      ...p,
      diffDays,
      totalTasks,
      doneTasks,
      taskPercent,
      riskLevel,
      riskLabel,
      riskColor
    };
  }).filter(Boolean) as any[];

  // 4. Unpaid balance alerts
  const paymentAlertProjects = activeProjects.filter(p => {
    if (p.status === 'done' || p.status === 'pending_acc') return false;
    const rem = Number(p.remainingAmount) || 0;
    return rem > 0 && p.paymentStatus !== 'lunas';
  });

  const totalReminders = pendingAccProjects.length + waBriefProjects.length + deadlineAlertProjects.length + paymentAlertProjects.length;

  if (totalReminders === 0) {
    return null;
  }

  const handleAcc = async (proj: any) => {
    setProcessingId(proj.id);
    try {
      await approveServiceOrder(proj.id, proj.transactionId);
      notify?.(`✅ Pesanan "${proj.title}" berhasil di-ACC & masuk ke Papan Proyek!`, 'success');
      onProjectUpdated?.();

      // Offer to notify client via WhatsApp
      if (proj.clientPhone) {
        const confirmNotify = window.confirm(
          `Pesanan "${proj.title}" telah di-ACC!\n\nKirimkan konfirmasi penerimaan pengerjaan via WhatsApp kepada ${proj.client}?`
        );
        if (confirmNotify) {
          const msg = whatsappTemplates.serviceOrderAccApproved({
            clientName: proj.client,
            projectName: proj.title,
            orderId: proj.transactionId || 'ORD',
            deadline: proj.deadline || undefined,
            dpPaid: proj.dpAmount || undefined
          });
          openWhatsApp(proj.clientPhone, msg);
        }
      }
    } catch (e) {
      console.error(e);
      notify?.('Gagal menyetujui pesanan jasa', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (proj: any) => {
    const doReject = async () => {
      setProcessingId(proj.id);
      try {
        await rejectServiceOrder(proj.id, proj.transactionId);
        notify?.(`Pesanan "${proj.title}" dibatalkan.`, 'info');
        onProjectUpdated?.();
      } catch (e) {
        notify?.('Gagal membatalkan pesanan', 'error');
      } finally {
        setProcessingId(null);
      }
    };

    if (confirm) {
      confirm(`Tolak atau batalkan pesanan jasa "${proj.title}"?`, doReject);
    } else {
      if (window.confirm(`Tolak atau batalkan pesanan jasa "${proj.title}"?`)) {
        doReject();
      }
    }
  };

  const handleOpenDoc = (url?: string) => {
    const cleanUrl = normalizeGoogleDocUrl(url);
    if (!cleanUrl) {
      notify?.('Tautan Google Doc belum dilampirkan pada pesanan ini.', 'info');
      return;
    }
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  const handleChatWa = (proj: any) => {
    if (!proj.clientPhone) {
      notify?.('Nomor WhatsApp klien tidak tersedia.', 'error');
      return;
    }
    const text = whatsappTemplates.serviceBriefDiscussion({
      clientName: proj.client || 'Klien',
      projectName: proj.title || 'Proyek Desain/Jasa',
      orderId: proj.transactionId || 'ORD',
      googleDocUrl: proj.googleDocUrl || undefined,
      briefSummary: proj.briefDescription || proj.notes || undefined
    });
    openWhatsApp(proj.clientPhone, text);
  };

  const handleSendSprintUpdate = (proj: any) => {
    if (!proj.clientPhone) {
      notify?.('Nomor WhatsApp klien tidak tersedia.', 'error');
      return;
    }
    const msg = whatsappTemplates.projectSprintUpdate({
      clientName: proj.client || 'Klien',
      projectName: proj.title || 'Proyek',
      progressPercent: proj.taskPercent ?? (Number(proj.progress) || 0),
      completedTasksCount: proj.doneTasks || 0,
      totalTasksCount: proj.totalTasks || 0,
      estCompletion: proj.deadline ? new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined
    });
    openWhatsApp(proj.clientPhone, msg);
    notify?.(`Draft laporan progres disiapkan untuk ${proj.client || 'Klien'}`, 'info');
  };

  return (
    <div style={{
      width: '100%',
      marginBottom: 14,
      borderRadius: 18,
      background: 'linear-gradient(135deg, rgba(var(--cms-accent-rgb), 0.08), rgba(245, 158, 11, 0.06))',
      border: '1.5px solid rgba(var(--cms-accent-rgb), 0.25)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Header Banner */}
      <div style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'rgba(var(--cms-accent-rgb), 0.04)',
        cursor: 'pointer'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: pendingAccProjects.length > 0 ? '#f59e0b' : 'var(--cms-accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            animation: pendingAccProjects.length > 0 ? 'pmCountdownPulse 2s infinite' : 'none'
          }}>
            <Bell size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Pengingat & Tindakan Studio</span>
              {pendingAccProjects.length > 0 && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: '#fef3c7',
                  color: '#b45309',
                  fontSize: 11,
                  fontWeight: 900
                }}>
                  {pendingAccProjects.length} Pesanan Butuh ACC
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
              {pendingAccProjects.length > 0
                ? 'Proyek baru hanya muncul di Kanban setelah Anda setujui (ACC).'
                : 'Pusat tindak lanjut koordinasi brief via WA, deadline & tagihan klien.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onOpenServiceOrderModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenServiceOrderModal();
              }}
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 9999,
                border: 'none',
                background: 'var(--cms-accent)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Sparkles size={13} />
              <span>+ Pesanan Jasa</span>
            </button>
          )}

          <button
            type="button"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--cms-switcher-bg)',
              color: 'var(--cms-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(var(--cms-accent-rgb), 0.15)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '4px 12px',
                borderRadius: 100,
                border: 'none',
                background: activeTab === 'all' ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                color: activeTab === 'all' ? '#fff' : 'var(--cms-text-muted)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Semua ({totalReminders})
            </button>

            {pendingAccProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('pending_acc')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeTab === 'pending_acc' ? '#f59e0b' : 'rgba(245, 158, 11, 0.15)',
                  color: activeTab === 'pending_acc' ? '#fff' : '#b45309',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Menunggu ACC ({pendingAccProjects.length})
              </button>
            )}

            {waBriefProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('wa_brief')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeTab === 'wa_brief' ? '#22c55e' : 'rgba(34, 197, 94, 0.15)',
                  color: activeTab === 'wa_brief' ? '#fff' : '#15803d',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Brief via WA ({waBriefProjects.length})
              </button>
            )}

            {deadlineAlertProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('deadline')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeTab === 'deadline' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                  color: activeTab === 'deadline' ? '#fff' : '#b91c1c',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Deadline Dekat ({deadlineAlertProjects.length})
              </button>
            )}

            {paymentAlertProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('payment')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeTab === 'payment' ? '#3b82f6' : 'rgba(59, 130, 246, 0.15)',
                  color: activeTab === 'payment' ? '#fff' : '#1d4ed8',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Sisa Tagihan ({paymentAlertProjects.length})
              </button>
            )}
          </div>

          {/* Cards List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
            {/* 1. Pending ACC Cards */}
            {(activeTab === 'all' || activeTab === 'pending_acc') && pendingAccProjects.map(proj => (
              <div
                key={proj.id}
                style={{
                  background: 'var(--cms-card-bg)',
                  borderRadius: 14,
                  border: '1.5px solid #f59e0b',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309', fontWeight: 900 }}>
                        MENUNGGU ACC
                      </span>
                      {proj.clientType === 'reseller' && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f3e8ff', color: '#7e22ce', fontWeight: 900 }}>
                          🤝 RESELLER
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                        {proj.category || 'Jasa Custom'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)' }}>
                      {proj.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <User size={12} />
                      <span>{proj.client}</span>
                      {proj.clientPhone && <span>• {proj.clientPhone}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981' }}>
                      {formatRp(proj.budget || 0)}
                    </div>
                    {proj.dpAmount > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                        DP: {formatRp(proj.dpAmount)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Brief Info */}
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'var(--cms-panel-bg)',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {proj.briefMode === 'gdoc' ? (
                      <>
                        <FileText size={13} color="#3b82f6" />
                        <span style={{ color: '#3b82f6', fontWeight: 700 }}>Google Doc Brief</span>
                      </>
                    ) : proj.briefMode === 'whatsapp' ? (
                      <>
                        <MessageCircle size={13} color="#22c55e" />
                        <span style={{ color: '#22c55e', fontWeight: 700 }}>Penjelasan via WA</span>
                      </>
                    ) : (
                      <>
                        <FileText size={13} color="var(--cms-text-muted)" />
                        <span>Brief Catatan Form</span>
                      </>
                    )}
                    {proj.deadline && (
                      <span style={{ color: 'var(--cms-text-muted)' }}>
                        • Target: {new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>

                  {proj.googleDocUrl && (
                    <button
                      type="button"
                      onClick={() => handleOpenDoc(proj.googleDocUrl)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid #3b82f6',
                        background: 'transparent',
                        color: '#3b82f6',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}
                    >
                      <ExternalLink size={10} /> Buka Doc
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 4 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {proj.clientPhone && (
                      <button
                        type="button"
                        onClick={() => handleChatWa(proj)}
                        title="Chat WA Klien untuk Diskusi Brief"
                        style={{
                          height: 28,
                          padding: '0 10px',
                          borderRadius: 8,
                          border: '1px solid #22c55e',
                          background: 'rgba(34, 197, 94, 0.08)',
                          color: '#22c55e',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Send size={11} /> Chat WA
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleReject(proj)}
                      title="Tolak Pesanan"
                      disabled={processingId === proj.id}
                      style={{
                        height: 28,
                        padding: '0 8px',
                        borderRadius: 8,
                        border: '1px solid var(--glass-border)',
                        background: 'transparent',
                        color: '#ef4444',
                        fontSize: 11,
                        cursor: 'pointer'
                      }}
                    >
                      Tolak
                    </button>
                  </div>

                  {/* Primary ACC Button */}
                  <button
                    type="button"
                    onClick={() => handleAcc(proj)}
                    disabled={processingId === proj.id}
                    style={{
                      height: 30,
                      padding: '0 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#10b981',
                      color: '#fff',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{processingId === proj.id ? 'Memproses...' : '✅ ACC (Masuk ke Antrian Papan)'}</span>
                  </button>
                </div>
              </div>
            ))}

            {/* 2. WhatsApp Brief Projects */}
            {(activeTab === 'all' || activeTab === 'wa_brief') && waBriefProjects.filter(p => p.status !== 'pending_acc').map(proj => (
              <div
                key={proj.id}
                style={{
                  background: 'var(--cms-card-bg)',
                  borderRadius: 14,
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#15803d', fontWeight: 900 }}>
                        BRIEF VIA WA
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>{proj.status}</span>
                    </div>
                    <div 
                      onClick={() => onSelectProject?.(proj)}
                      style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', cursor: 'pointer' }}
                    >
                      {proj.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                      Klien: {proj.client} ({proj.clientPhone || 'No WA belum ada'})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                    Opsi penjelasan via WhatsApp
                  </span>
                  {proj.clientPhone && (
                    <button
                      type="button"
                      onClick={() => handleChatWa(proj)}
                      style={{
                        height: 28,
                        padding: '0 10px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#22c55e',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Send size={11} /> Koordinasi WA
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* 3. Deadline Alert Projects (Smart Predictive Burndown) */}
            {(activeTab === 'all' || activeTab === 'deadline') && deadlineAlertProjects.map(proj => (
              <div
                key={proj.id}
                style={{
                  background: 'var(--cms-card-bg)',
                  borderRadius: 14,
                  border: `1px solid ${proj.riskColor}55`,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: 10, 
                        padding: '2px 8px', 
                        borderRadius: 9999, 
                        background: `${proj.riskColor}18`, 
                        color: proj.riskColor, 
                        border: `1px solid ${proj.riskColor}40`,
                        fontWeight: 850 
                      }}>
                        {proj.riskLabel}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 650 }}>
                        Target: {new Date(proj.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div 
                      onClick={() => onSelectProject?.(proj)}
                      style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', cursor: 'pointer' }}
                    >
                      {proj.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                      Klien: {proj.client || 'Klien Studio'}
                    </div>

                    {/* Burndown Mini Progress Bar */}
                    <div style={{ marginTop: 8, width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 3 }}>
                        <span>Checklist: {proj.doneTasks}/{proj.totalTasks} Selesai</span>
                        <span style={{ color: proj.riskColor }}>{proj.taskPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${proj.taskPercent}%`, 
                          height: '100%', 
                          background: proj.riskColor,
                          borderRadius: 9999,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontStyle: 'italic' }}>
                    {proj.diffDays < 0 ? 'Wajib eskalasi segera' : proj.diffDays <= 2 ? 'Fokus sprint tugas aktif' : 'Pantau jadwal sprint'}
                  </span>
                  {proj.clientPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleSendSprintUpdate(proj)}
                        title="Kirim Laporan Progres Sprint via WhatsApp"
                        style={{
                          height: 26,
                          padding: '0 8px',
                          borderRadius: 6,
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        📲 Laporan Progres
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChatWa(proj)}
                        style={{
                          height: 26,
                          padding: '0 8px',
                          borderRadius: 6,
                          border: '1px solid var(--glass-border)',
                          background: 'transparent',
                          color: 'var(--cms-text)',
                          fontSize: 10.5,
                          cursor: 'pointer'
                        }}
                      >
                        Follow-up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectRemindersBar;
