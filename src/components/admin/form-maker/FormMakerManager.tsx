import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Plus, Search, Eye, Share2, Copy, Trash2, 
  Cloud, CheckCircle2, ArrowRight, Sparkles, FolderPlus, 
  Clock, CheckSquare, Layers, Download, Check, LayoutGrid, RefreshCw
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import { googleSync } from '../../../utils/googleSync';
import type { FormSchema, FormResponse } from './formTypes';
import FormEditor from './FormEditor';
import FormPublicView from './FormPublicView';
import { downloadFormExcel, autoSaveFormExcelToDrive } from '../../../utils/formExcelExport';
import { FormAiGeneratorModal } from './FormAiGeneratorModal';
import { FormTemplatesModal } from './FormTemplatesModal';

interface FormMakerManagerProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  isDarkMode?: boolean;
}

const DEFAULT_TEMPLATES: FormSchema[] = [
  {
    id: 'form_template_client_onboarding',
    title: 'Pendaftaran Klien & Brief Proyek',
    description: 'Silakan lengkapi formulir di bawah ini agar tim agensi kami dapat memahami kebutuhan proyek dan jadwal Anda.',
    themeColor: '#673ab7',
    acceptingResponses: true,
    autoSaveDrive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        type: 'short_text',
        title: 'Nama Lengkap / Nama Bisnis Anda',
        required: true,
        options: []
      },
      {
        id: 'q2',
        type: 'short_text',
        title: 'Nomor WhatsApp Aktif',
        description: 'Untuk kemudahan koordinasi dan update status proyek',
        required: true,
        options: []
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        title: 'Kategori Layanan yang Dibutuhkan',
        required: true,
        options: [
          { id: 'opt_1', text: 'Pembuatan Website / Web App' },
          { id: 'opt_2', text: 'Branding & Identitas Visual' },
          { id: 'opt_3', text: 'Manajemen Media Sosial & Konten' },
          { id: 'opt_4', text: 'Konsultasi Strategi Digital' }
        ]
      },
      {
        id: 'q4',
        type: 'paragraph',
        title: 'Ceritakan Lebih Lanjut Mengenai Target & Harapan Anda',
        required: false,
        options: []
      },
      {
        id: 'q5',
        type: 'dropdown',
        title: 'Estimasi Anggaran Proyek',
        required: false,
        options: [
          { id: 'b1', text: 'Di bawah Rp 5.000.000' },
          { id: 'b2', text: 'Rp 5.000.000 - Rp 15.000.000' },
          { id: 'b3', text: 'Rp 15.000.000 - Rp 30.000.000' },
          { id: 'b4', text: 'Lebih dari Rp 30.000.000' }
        ]
      }
    ]
  },
  {
    id: 'form_template_feedback_csat',
    title: 'Survei Kepuasan Klien (CSAT & Feedback)',
    description: 'Kami terus berupaya meningkatkan kualitas layanan studio. Berikan pendapat jujur Anda.',
    themeColor: '#10b981',
    acceptingResponses: true,
    autoSaveDrive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'csat_1',
        type: 'rating',
        title: 'Seberapa puas Anda dengan hasil akhir proyek kami?',
        required: true,
        options: []
      },
      {
        id: 'csat_2',
        type: 'linear_scale',
        title: 'Kecepatan respon dan komunikasi tim kami',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Sangat Lambat',
        scaleMaxLabel: 'Sangat Cepat',
        required: true,
        options: []
      },
      {
        id: 'csat_3',
        type: 'paragraph',
        title: 'Kritik, saran, atau catatan tambahan untuk perbaikan kami ke depan',
        required: false,
        options: []
      }
    ]
  }
];

export const FormMakerManager: React.FC<FormMakerManagerProps> = ({
  notify,
  confirm,
  isDarkMode = true
}) => {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [responsesMap, setResponsesMap] = useState<Record<string, FormResponse[]>>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // View states
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [previewingFormId, setPreviewingFormId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load forms and responses
  const loadData = async () => {
    try {
      const [savedForms, savedResponses] = await Promise.all([
        storage.getItem('porto_forms', DEFAULT_TEMPLATES),
        storage.getItem('porto_form_responses', {})
      ]);

      const validForms = Array.isArray(savedForms) && savedForms.length > 0 
        ? savedForms 
        : DEFAULT_TEMPLATES;

      setForms(validForms);
      setResponsesMap(savedResponses && typeof savedResponses === 'object' ? savedResponses : {});
    } catch (err) {
      console.error('[FormMaker] Error loading data:', err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save forms
  const persistForms = async (updated: FormSchema[]) => {
    setForms(updated);
    await storage.setItem('porto_forms', updated);
  };

  // Save responses map
  const persistResponses = async (updated: Record<string, FormResponse[]>) => {
    setResponsesMap(updated);
    await storage.setItem('porto_form_responses', updated);
  };

  // Create new blank form
  const handleCreateBlankForm = async () => {
    const newForm: FormSchema = {
      id: 'form_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: 'Formulir Tanpa Judul',
      description: '',
      themeColor: '#673ab7',
      acceptingResponses: true,
      autoSaveDrive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q_' + Math.random().toString(36).slice(2, 7),
          type: 'multiple_choice',
          title: 'Pertanyaan Tanpa Judul',
          required: false,
          options: [{ id: 'opt_1', text: 'Opsi 1' }]
        }
      ]
    };

    const updated = [newForm, ...forms];
    await persistForms(updated);
    setEditingFormId(newForm.id);
    if (notify) notify('Formulir baru berhasil dibuat!');
  };

  // Create from template
  const handleCreateFromTemplate = async (template: FormSchema | Omit<FormSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newForm: FormSchema = {
      ...template,
      id: 'form_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: `${template.title}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: (template.questions || []).map((q) => ({
        ...q,
        id: 'q_' + Math.random().toString(36).slice(2, 7),
        options: (q.options || []).map((o) => ({
          ...o,
          id: 'opt_' + Math.random().toString(36).slice(2, 7)
        }))
      }))
    };

    const updated = [newForm, ...forms];
    await persistForms(updated);
    setEditingFormId(newForm.id);
    if (notify) notify(`Formulir "${template.title}" berhasil dibuat!`);
  };

  // Handle Form Created via AI
  const handleAiFormCreated = async (newForm: FormSchema) => {
    const updated = [newForm, ...forms];
    await persistForms(updated);
    setEditingFormId(newForm.id);
  };

  // Duplicate Form
  const handleDuplicateForm = async (form: FormSchema) => {
    const dup: FormSchema = {
      ...form,
      id: 'form_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: `${form.title} (Duplikat)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      driveFileUrl: undefined,
      lastDriveSync: undefined
    };

    const updated = [dup, ...forms];
    await persistForms(updated);
    if (notify) notify('Formulir berhasil diduplikasi!');
  };

  // Delete Form
  const handleDeleteForm = async (formId: string, formTitle: string) => {
    const doDelete = async () => {
      const updated = forms.filter((f) => f.id !== formId);
      await persistForms(updated);
      
      const copyResponses = { ...responsesMap };
      delete copyResponses[formId];
      await persistResponses(copyResponses);

      if (notify) notify(`Formulir "${formTitle}" berhasil dihapus.`);
    };

    if (confirm) {
      confirm({
        title: 'Hapus Formulir?',
        message: `Apakah Anda yakin ingin menghapus formulir "${formTitle}" beserta seluruh data tanggapannya?`,
        isDestructive: true,
        onConfirm: doDelete
      });
    } else if (window.confirm(`Hapus formulir "${formTitle}"?`)) {
      doDelete();
    }
  };

  // Update single form
  const handleUpdateForm = async (updatedForm: FormSchema) => {
    const updated = forms.map((f) => (f.id === updatedForm.id ? updatedForm : f));
    await persistForms(updated);
  };

  // Handle Submit Response (from Preview or live form)
  const handleSubmitResponse = async (resp: FormResponse) => {
    const currentResponses = responsesMap[resp.formId] || [];
    const updatedResponses = [resp, ...currentResponses];
    const updatedMap = { ...responsesMap, [resp.formId]: updatedResponses };
    await persistResponses(updatedMap);

    // Auto save to Drive if enabled on this form
    const targetForm = forms.find((f) => f.id === resp.formId);
    if (targetForm && targetForm.autoSaveDrive) {
      autoSaveFormExcelToDrive(targetForm, updatedResponses, notify).then((res) => {
        if (res.success && res.url) {
          handleUpdateForm({
            ...targetForm,
            driveFileUrl: res.url,
            lastDriveSync: new Date().toISOString()
          });
        }
      });
    }

    if (notify) notify('Tanggapan berhasil disimpan!');
  };

  // Clear all responses for a form
  const handleClearAllResponses = async (formId: string) => {
    const copy = { ...responsesMap, [formId]: [] };
    await persistResponses(copy);
    if (notify) notify('Seluruh tanggapan berhasil dikosongkan!');
  };

  // If in Editor View
  if (editingFormId) {
    const currentForm = forms.find((f) => f.id === editingFormId);
    if (currentForm) {
      return (
        <FormEditor
          form={currentForm}
          responses={responsesMap[currentForm.id] || []}
          onUpdateForm={handleUpdateForm}
          onBack={() => setEditingFormId(null)}
          onSubmitResponse={handleSubmitResponse}
          onClearAllResponses={() => handleClearAllResponses(currentForm.id)}
          notify={notify}
          confirm={confirm}
          isDarkMode={isDarkMode}
        />
      );
    }
  }

  // If in Preview / Standalone Form Filler View
  if (previewingFormId) {
    const currentForm = forms.find((f) => f.id === previewingFormId);
    if (currentForm) {
      return (
        <FormPublicView
          form={currentForm}
          onSubmitResponse={handleSubmitResponse}
          onBack={() => setPreviewingFormId(null)}
          isPreview={true}
          isDarkMode={isDarkMode}
        />
      );
    }
  }

  const filteredForms = forms.filter((f) =>
    (f.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      padding: isMobile ? '16px 16px 90px' : '28px 28px 80px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>
        {/* ── HEADER BANNER ── */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 22,
        padding: '24px 28px',
        boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'rgba(103, 58, 183, 0.12)',
            color: '#673ab7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileSpreadsheet size={24} strokeWidth={2.2} />
          </div>
          <h2 style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            color: 'var(--cms-text, currentColor)',
            fontFamily: "'Outfit', sans-serif"
          }}>
            Form Maker
          </h2>
        </div>

        {/* Top Actions: AI Generator, Offline Templates, Tambah (Icon Only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* AI Generator Button (Icon Only) */}
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.15s ease'
            }}
            title="AI Generator"
          >
            <Sparkles size={18} />
          </button>

          {/* Offline Templates Button (Icon Only) */}
          <button
            type="button"
            onClick={() => setShowTemplatesModal(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
              border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
            title="Template"
          >
            <LayoutGrid size={18} color="#673ab7" />
          </button>

          {/* Cloud Sync (Google Sheets) Button */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={async () => {
              setIsSyncing(true);
              try {
                await googleSync.syncForms(forms, notify);
              } catch (err: any) {
                if (notify) notify(err?.message || 'Gagal menyinkronkan formulir ke Google Sheets', 'error');
              } finally {
                setIsSyncing(false);
              }
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
              border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
            title="Sinkronisasi Cloud (Google Sheets)"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} color="#673ab7" />
          </button>

          {/* Create Blank Form Button (Icon Only) */}
          <button
            type="button"
            onClick={handleCreateBlankForm}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#673ab7',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(103, 58, 183, 0.3)',
              transition: 'all 0.15s ease'
            }}
            title="Tambah"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR & FORMS LIST ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--cms-text)' }}>
            Formulir Saya ({forms.length})
          </h3>

          {/* Search Input (ROUNDED PILL) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--cms-card-bg)',
            border: '1px solid var(--cms-border)',
            borderRadius: 100, // ROUNDED PILL
            padding: '8px 16px',
            width: '100%',
            maxWidth: 300
          }}>
            <Search size={15} color="var(--cms-text-muted)" />
            <input
              type="text"
              placeholder="Cari formulir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>

        {/* Forms Grid */}
        {filteredForms.length === 0 ? (
          <div style={{
            background: 'var(--cms-card-bg)',
            border: '1px dashed var(--cms-border)',
            borderRadius: 20,
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--cms-text-muted)',
            fontSize: 14
          }}>
            Belum ada formulir yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16
          }}>
            {filteredForms.map((form) => {
              const responses = responsesMap[form.id] || [];
              const theme = form.themeColor || '#673ab7';

              return (
                <div
                  key={form.id}
                  style={{
                    background: 'var(--cms-card-bg, #ffffff)',
                    border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Color Banner Header */}
                  <div style={{
                    height: 54,
                    background: theme,
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#ffffff'
                  }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {form.questions.length} Pertanyaan
                    </span>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.22)',
                      padding: '2px 8px',
                      borderRadius: 100
                    }}>
                      {responses.length} Tanggapan
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 850,
                      color: 'var(--cms-text)',
                      lineHeight: 1.3
                    }}>
                      {form.title || 'Formulir Tanpa Judul'}
                    </h4>

                    <p style={{
                      margin: 0,
                      fontSize: 12.5,
                      color: 'var(--cms-text-muted)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {form.description || 'Tidak ada deskripsi.'}
                    </p>

                    {/* Metadata & Drive Indicator */}
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: 10,
                      borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                      color: 'var(--cms-text-muted)'
                    }}>
                      <span>{new Date(form.updatedAt).toLocaleDateString('id-ID')}</span>
                      {form.driveFileUrl ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 700 }}>
                          <Cloud size={13} />
                          <span>Drive Sync</span>
                        </span>
                      ) : (
                        <span style={{ opacity: 0.6 }}>Lokal</span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
                    borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    {/* Primary: Edit Button (ROUNDED PILL) */}
                    <button
                      onClick={() => setEditingFormId(form.id)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 100, // ROUNDED PILL
                        background: theme,
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Kelola
                    </button>

                    {/* Secondary Icon Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {/* Preview / Fill */}
                      <button
                        onClick={() => setPreviewingFormId(form.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 5 }}
                        title="Pratinjau"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Download Excel */}
                      <button
                        onClick={async () => {
                          const ok = await downloadFormExcel(form, responses);
                          if (ok && notify) notify(`Excel "${form.title} (Tanggapan).xlsx" diunduh!`);
                        }}
                        style={{ background: 'none', border: 'none', color: '#107c41', cursor: 'pointer', padding: 5 }}
                        title="Ekspor Excel"
                      >
                        <FileSpreadsheet size={16} />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicateForm(form)}
                        style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 5 }}
                        title="Duplikasi Formulir"
                      >
                        <Copy size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteForm(form.id, form.title)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 5 }}
                        title="Hapus Formulir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* AI Form Generator Modal */}
      <FormAiGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onFormCreated={handleAiFormCreated}
        notify={notify}
        isDarkMode={isDarkMode}
      />

      {/* Offline Form Templates Modal */}
      <FormTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={handleCreateFromTemplate}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default FormMakerManager;
