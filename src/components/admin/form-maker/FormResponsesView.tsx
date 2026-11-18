import React, { useState } from 'react';
import { 
  FileSpreadsheet, Cloud, CloudCheck, RefreshCw, Trash2, ExternalLink, 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Search, 
  BarChart3, ListOrdered, User, Table2, Rocket, FolderKanban, Loader2
} from 'lucide-react';
import type { FormSchema, FormResponse } from './formTypes';
import { downloadFormExcel, autoSaveFormExcelToDrive } from '../../../utils/formExcelExport';
import { RoundedPillDropdown } from './RoundedPillDropdown';
import { convertFormResponseToProjectAndQuote } from '../../../utils/leadToProject';

interface FormResponsesViewProps {
  form: FormSchema;
  responses: FormResponse[];
  onUpdateForm: (updated: FormSchema) => void;
  onClearAllResponses?: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  isDarkMode?: boolean;
}

export const FormResponsesView: React.FC<FormResponsesViewProps> = ({
  form,
  responses,
  onUpdateForm,
  onClearAllResponses,
  notify,
  confirm,
  isDarkMode = true
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'question' | 'individual' | 'table'>('summary');
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [individualIdx, setIndividualIdx] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [isConvertingLead, setIsConvertingLead] = useState<boolean>(false);

  // Handle Convert Lead to Project Pipeline
  const handleConvertToProject = async (targetResp: FormResponse) => {
    setIsConvertingLead(true);
    try {
      const res = await convertFormResponseToProjectAndQuote(form, targetResp, notify);
      if (res && res.success) {
        // Broadcast event so other modules know new project/quote was created
        window.dispatchEvent(new CustomEvent('porto_project_created', { detail: { projectId: res.projectId } }));
      }
    } finally {
      setIsConvertingLead(false);
    }
  };

  // Handle Download Excel
  const handleDownload = async () => {
    if (responses.length === 0) {
      if (notify) notify('Belum ada data tanggapan untuk diekspor', 'info');
      return;
    }
    const ok = await downloadFormExcel(form, responses);
    if (ok && notify) {
      notify(`Data berhasil diekspor sebagai Excel: "${form.title || 'Formulir'} (Tanggapan).xlsx"`, 'success');
    }
  };

  // Handle Auto-Save to Google Drive
  const handleSyncDrive = async () => {
    if (responses.length === 0) {
      if (notify) notify('Belum ada tanggapan untuk disimpan ke Drive', 'info');
      return;
    }
    setIsSyncingDrive(true);
    try {
      const result = await autoSaveFormExcelToDrive(form, responses, notify);
      if (result.success && result.url) {
        onUpdateForm({
          ...form,
          driveFileUrl: result.url,
          lastDriveSync: new Date().toISOString()
        });
      }
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Handle Toggle Accepting Responses
  const handleToggleAccepting = () => {
    const updated = { ...form, acceptingResponses: !form.acceptingResponses };
    onUpdateForm(updated);
    if (notify) {
      notify(updated.acceptingResponses ? 'Formulir sekarang menerima tanggapan' : 'Formulir ditutup (tidak menerima tanggapan)');
    }
  };

  // Handle Toggle Auto-Save to Drive
  const handleToggleAutoSaveDrive = () => {
    const updated = { ...form, autoSaveDrive: !form.autoSaveDrive };
    onUpdateForm(updated);
    if (notify) {
      notify(updated.autoSaveDrive ? 'Auto-save Excel ke Google Drive AKTIF' : 'Otomatisasi Drive dinonaktifkan');
    }
  };

  const safeIndividual = responses[individualIdx] || responses[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* Top Banner Control Header */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 20,
        padding: '20px 24px',
        boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Row 1: Title & Main Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 900,
                color: 'var(--cms-text, currentColor)',
                fontFamily: "'Outfit', sans-serif"
              }}>
                {responses.length} Tanggapan
              </h2>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 100,
                background: form.acceptingResponses ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: form.acceptingResponses ? '#10b981' : '#ef4444',
                border: `1px solid ${form.acceptingResponses ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
              }}>
                {form.acceptingResponses ? 'Aktif' : 'Tutup'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--cms-text-muted, #64748b)' }}>
              Data terintegrasi secara langsung dengan format Microsoft Excel dan Google Drive
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Download Excel Button */}
            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 100, // ROUNDED PILL
                background: '#107c41',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 124, 65, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Download respons ke format .xlsx"
            >
              <FileSpreadsheet size={16} />
              <span>Ekspor</span>
            </button>

            {/* Sync Drive Button */}
            <button
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 100, // ROUNDED PILL
                background: isSyncingDrive ? 'rgba(59, 130, 246, 0.2)' : 'var(--cms-accent, #6366f1)',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 800,
                cursor: isSyncingDrive ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Simpan dan perbarui file Excel di Google Drive"
            >
              {isSyncingDrive ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
              <span>{isSyncingDrive ? 'Menyimpan...' : 'Drive'}</span>
            </button>

            {/* Clear all button */}
            {responses.length > 0 && onClearAllResponses && (
              <button
                onClick={() => {
                  if (confirm) {
                    confirm({
                      title: 'Hapus Semua Tanggapan?',
                      message: `Apakah Anda yakin ingin menghapus seluruh ${responses.length} tanggapan untuk formulir "${form.title}"? Tindakan ini tidak dapat dibatalkan.`,
                      isDestructive: true,
                      onConfirm: onClearAllResponses
                    });
                  } else if (window.confirm('Hapus seluruh tanggapan?')) {
                    onClearAllResponses();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 100, // ROUNDED PILL
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
                title="Hapus seluruh data tanggapan"
              >
                <Trash2 size={15} />
                <span>Kosongkan</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Drive & Toggles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
        }}>
          {/* Drive status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--cms-text-muted)' }}>
            {form.driveFileUrl ? (
              <>
                <CloudCheck size={16} color="#10b981" />
                <span>
                  Tersimpan di Drive: <strong>{form.title || 'Formulir'} (Tanggapan).xlsx</strong>
                </span>
                <a
                  href={form.driveFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--cms-accent, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  Buka di Drive <ExternalLink size={12} />
                </a>
                {form.lastDriveSync && (
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    ({new Date(form.lastDriveSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </>
            ) : (
              <>
                <Cloud size={16} opacity={0.6} />
                <span>Belum disinkronkan ke Google Drive</span>
              </>
            )}
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {/* Auto save to Drive toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!form.autoSaveDrive}
                onChange={handleToggleAutoSaveDrive}
                style={{ width: 16, height: 16, accentColor: 'var(--cms-accent, #6366f1)', cursor: 'pointer' }}
              />
              <span>Auto-sync Excel ke Drive saat ada respons baru</span>
            </label>

            {/* Accepting responses switch */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.acceptingResponses}
                onChange={handleToggleAccepting}
                style={{ width: 16, height: 16, accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span>Menerima Tanggapan</span>
            </label>
          </div>
        </div>

        {/* Row 3: Sub-view Tabs (Ringkasan, Pertanyaan, Individual, Tabel) */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
          padding: 5,
          borderRadius: 100, // ROUNDED PILL
          width: 'fit-content',
          marginTop: 4
        }}>
          {[
            { id: 'summary', label: 'Ringkasan', icon: <BarChart3 size={15} /> },
            { id: 'question', label: 'Pertanyaan', icon: <ListOrdered size={15} /> },
            { id: 'individual', label: 'Individual', icon: <User size={15} /> },
            { id: 'table', label: 'Tabel Spreadsheet', icon: <Table2 size={15} /> }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 100, // ROUNDED PILL
                border: 'none',
                background: activeTab === t.id ? 'var(--cms-accent, #6366f1)' : 'transparent',
                color: activeTab === t.id ? '#ffffff' : 'var(--cms-text-muted, #64748b)',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* No Responses Empty State */}
      {responses.length === 0 ? (
        <div style={{
          background: 'var(--cms-card-bg, #ffffff)',
          border: '1px dashed var(--cms-border, rgba(255,255,255,0.15))',
          borderRadius: 20,
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cms-text-muted)'
          }}>
            <FileSpreadsheet size={28} opacity={0.6} />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--cms-text)' }}>
            Menunggu Tanggapan Pertama
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cms-text-muted)', maxWidth: 420 }}>
            Bagikan link formulir ini kepada klien atau audiens Anda. Setiap tanggapan yang masuk akan otomatis terekam di sini dan bisa diekspor ke Excel.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: RINGKASAN (SUMMARY) */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {form.questions.map((q, idx) => {
                const total = responses.length;
                const answerList = responses
                  .map((r) => r.answers?.[q.id])
                  .filter((a) => a !== undefined && a !== null && a !== '');

                return (
                  <div
                    key={q.id}
                    style={{
                      background: 'var(--cms-card-bg, #ffffff)',
                      border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                      borderRadius: 18,
                      padding: 22,
                      boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>
                        {idx + 1}. {q.title || 'Pertanyaan Tanpa Judul'}
                      </h4>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
                        {answerList.length} tanggapan
                      </span>
                    </div>

                    {/* Chart / List per question type */}
                    {(q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {q.options.map((opt) => {
                          let count = 0;
                          answerList.forEach((ans) => {
                            if (Array.isArray(ans)) {
                              if (ans.includes(opt.text)) count++;
                            } else if (ans === opt.text) {
                              count++;
                            }
                          });
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                          return (
                            <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                                <span style={{ color: 'var(--cms-text)' }}>{opt.text}</span>
                                <span style={{ color: 'var(--cms-text-muted)' }}>{count} ({pct}%)</span>
                              </div>
                              <div style={{ width: '100%', height: 8, borderRadius: 100, background: 'var(--cms-switcher-bg, rgba(255,255,255,0.08))', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: form.themeColor || 'var(--cms-accent, #6366f1)',
                                  borderRadius: 100,
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(q.type === 'linear_scale' || q.type === 'rating') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(() => {
                          const nums = answerList.map((n) => Number(n)).filter((n) => !isNaN(n));
                          const avg = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 0;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div style={{
                                fontSize: 32,
                                fontWeight: 900,
                                color: form.themeColor || 'var(--cms-accent, #6366f1)',
                                fontFamily: "'Outfit', sans-serif"
                              }}>
                                {avg}
                              </div>
                              <div style={{ fontSize: 12.5, color: 'var(--cms-text-muted)' }}>
                                Rata-rata dari {nums.length} penilaian (Skala {q.scaleMin || 1} - {q.scaleMax || 5})
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {(q.type === 'short_text' || q.type === 'paragraph' || q.type === 'date' || q.type === 'time') && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        maxHeight: 240,
                        overflowY: 'auto',
                        paddingRight: 4
                      }}>
                        {answerList.slice(0, 20).map((ans, aIdx) => (
                          <div
                            key={aIdx}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                              border: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                              fontSize: 13,
                              color: 'var(--cms-text)'
                            }}
                          >
                            {String(ans)}
                          </div>
                        ))}
                        {answerList.length > 20 && (
                          <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', textAlign: 'center', padding: 6 }}>
                            + {answerList.length - 20} tanggapan lainnya (lihat di tab Tabel Spreadsheet atau download Excel)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: PERTANYAAN (BY QUESTION) */}
          {activeTab === 'question' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Question selector (ROUNDED PILL DROPDOWN) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--cms-card-bg)',
                border: '1px solid var(--cms-border)',
                padding: '14px 20px',
                borderRadius: 20
              }}>
                <span style={{ fontSize: 13, fontWeight: 750, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap' }}>Pilih Pertanyaan:</span>
                <RoundedPillDropdown
                  value={selectedQuestionIdx}
                  options={form.questions.map((q, qIdx) => ({
                    value: qIdx,
                    label: `${qIdx + 1}. ${q.title || 'Pertanyaan Tanpa Judul'}`
                  }))}
                  onChange={(val) => setSelectedQuestionIdx(Number(val))}
                  isDarkMode={isDarkMode}
                  cardAccent={form.themeColor || '#673ab7'}
                  minWidth="100%"
                />
              </div>

              {/* Answers breakdown */}
              {(() => {
                const currQ = form.questions[selectedQuestionIdx];
                if (!currQ) return null;
                const items = responses.map((r, rIdx) => ({
                  id: r.id,
                  idx: rIdx + 1,
                  date: r.submittedAt,
                  answer: r.answers?.[currQ.id]
                })).filter(x => x.answer !== undefined && x.answer !== null && x.answer !== '');

                return (
                  <div style={{
                    background: 'var(--cms-card-bg)',
                    border: '1px solid var(--cms-border)',
                    borderRadius: 18,
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--cms-text)' }}>
                        {currQ.title}
                      </h4>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
                        {items.length} dari {responses.length} menjawab
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {items.map((it) => (
                        <div
                          key={it.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                            border: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 13.5
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--cms-text)' }}>
                            {Array.isArray(it.answer) ? it.answer.join(', ') : String(it.answer)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                            #{it.idx} • {it.date ? new Date(it.date).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: INDIVIDUAL (LEMBAR PERORANGAN) */}
          {activeTab === 'individual' && safeIndividual && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Pagination bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--cms-card-bg)',
                border: '1px solid var(--cms-border)',
                padding: '12px 18px',
                borderRadius: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    disabled={individualIdx <= 0}
                    onClick={() => setIndividualIdx((p) => Math.max(0, p - 1))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--cms-border)',
                      background: 'transparent',
                      color: individualIdx <= 0 ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                      cursor: individualIdx <= 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                    {individualIdx + 1} dari {responses.length}
                  </span>
                  <button
                    disabled={individualIdx >= responses.length - 1}
                    onClick={() => setIndividualIdx((p) => Math.min(responses.length - 1, p + 1))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--cms-border)',
                      background: 'transparent',
                      color: individualIdx >= responses.length - 1 ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                      cursor: individualIdx >= responses.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                  Dikirim pada: {safeIndividual.submittedAt ? new Date(safeIndividual.submittedAt).toLocaleString('id-ID') : '-'}
                </div>
              </div>

              {/* Form Individual Card Sheet */}
              <div style={{
                background: 'var(--cms-card-bg, #ffffff)',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                borderRadius: 20,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}>
                <div style={{
                  paddingBottom: 16,
                  borderBottom: '2px solid var(--cms-border, rgba(255,255,255,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--cms-text)' }}>
                      {form.title}
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                      ID Responden: <code>{safeIndividual.id}</code>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isConvertingLead}
                    onClick={() => handleConvertToProject(safeIndividual)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 850,
                      cursor: isConvertingLead ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {isConvertingLead ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                    <span>Konversi Jadi Proyek & Penawaran</span>
                  </button>
                </div>

                {form.questions.map((q, idx) => {
                  const ans = safeIndividual.answers?.[q.id];
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '16px 18px',
                        borderRadius: 14,
                        background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                        {idx + 1}. {q.title}
                      </div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: ans !== undefined && ans !== null && ans !== '' ? (form.themeColor || 'var(--cms-accent, #6366f1)') : 'var(--cms-text-muted)'
                      }}>
                        {ans !== undefined && ans !== null && ans !== '' ? (
                          typeof ans === 'object' && ans?.url ? (
                            <a
                              href={ans.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                color: form.themeColor || 'var(--cms-accent, #6366f1)',
                                textDecoration: 'underline'
                              }}
                            >
                              <ExternalLink size={14} />
                              <span>{ans.name || 'Lihat Berkas Lampiran'}</span>
                              {ans.size ? <span style={{ opacity: 0.7, fontSize: 12 }}>({(ans.size / 1024).toFixed(0)} KB)</span> : null}
                            </a>
                          ) : Array.isArray(ans) ? (
                            ans.join(', ')
                          ) : (
                            String(ans)
                          )
                        ) : (
                          <em style={{ opacity: 0.6 }}>(Tidak diisi)</em>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TABEL SPREADSHEET (DATA VIEW) */}
          {activeTab === 'table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Search filter */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--cms-card-bg)',
                border: '1px solid var(--cms-border)',
                borderRadius: 14,
                padding: '8px 14px'
              }}>
                <Search size={16} color="var(--cms-text-muted)" />
                <input
                  type="text"
                  placeholder="Cari dalam semua kolom tanggapan..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Table Container */}
              <div style={{
                background: 'var(--cms-card-bg, #ffffff)',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                borderRadius: 18,
                overflowX: 'auto',
                boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 12.5,
                  textAlign: 'left'
                }}>
                  <thead>
                    <tr style={{
                      background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
                      borderBottom: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))'
                    }}>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap' }}>#</th>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap' }}>Aksi</th>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--cms-text)', whiteSpace: 'nowrap' }}>Waktu</th>
                      {form.questions.map((q) => (
                        <th key={q.id} style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--cms-text)', minWidth: 160 }}>
                          {q.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responses
                      .filter((r) => {
                        if (!searchKeyword.trim()) return true;
                        const kw = searchKeyword.toLowerCase();
                        return Object.values(r.answers || {}).some((val) =>
                          String(val).toLowerCase().includes(kw)
                        );
                      })
                      .map((resp, rIdx) => (
                        <tr
                          key={resp.id}
                          style={{
                            borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--cms-text-muted)' }}>
                            {rIdx + 1}
                          </td>
                          <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => handleConvertToProject(resp)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 8,
                                border: 'none',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Jadikan Proyek & Penawaran"
                            >
                              <Rocket size={12} />
                              <span>Proyek</span>
                            </button>
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--cms-text-muted)', whiteSpace: 'nowrap' }}>
                            {resp.submittedAt ? new Date(resp.submittedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                          </td>
                          {form.questions.map((q) => {
                            const val = resp.answers?.[q.id];
                            return (
                              <td key={q.id} style={{ padding: '10px 16px', color: 'var(--cms-text)', maxWidth: 260, wordBreak: 'break-word' }}>
                                {val !== undefined && val !== null ? (
                                  typeof val === 'object' && val?.url ? (
                                    <a
                                      href={val.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        color: 'var(--cms-accent, #6366f1)',
                                        textDecoration: 'underline'
                                      }}
                                    >
                                      <ExternalLink size={12} />
                                      <span>{val.name || 'Lihat Berkas'}</span>
                                    </a>
                                  ) : Array.isArray(val) ? (
                                    val.join(', ')
                                  ) : (
                                    String(val)
                                  )
                                ) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FormResponsesView;
