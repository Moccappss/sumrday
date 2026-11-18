import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Eye, Share2, Palette, Plus, Copy, Trash2, GripVertical, 
  Check, X, FileSpreadsheet, Cloud, CheckSquare, Radio, ChevronDown, 
  AlignLeft, AlignJustify, Calendar, Clock, Sliders, Star, HelpCircle,
  ExternalLink, Link, CopyCheck, Image as ImageIcon, Upload, Sparkles,
  FileText, BarChart3, Layers, Heading, Mail, Phone, Globe, PenTool
} from 'lucide-react';
import type { FormSchema, FormQuestion, QuestionType, FormResponse, QuestionOption } from './formTypes';
import { QUESTION_CARD_COLORS, FORM_HEADER_THEMES } from './formThemePresets';
import FormResponsesView from './FormResponsesView';
import FormPublicView from './FormPublicView';
import GlassColorPicker from '../GlassColorPicker';
import { downloadFormExcel } from '../../../utils/formExcelExport';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { RoundedPillDropdown } from './RoundedPillDropdown';

interface FormEditorProps {
  form: FormSchema;
  responses: FormResponse[];
  onUpdateForm: (updated: FormSchema) => void;
  onBack: () => void;
  onSubmitResponse: (resp: FormResponse) => Promise<void> | void;
  onClearAllResponses?: () => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  isDarkMode?: boolean;
}

const QUESTION_TYPES: { id: QuestionType; label: string; icon: any }[] = [
  { id: 'multiple_choice', label: 'Pilihan Ganda', icon: <Radio size={15} /> },
  { id: 'checkboxes', label: 'Kotak Centang', icon: <CheckSquare size={15} /> },
  { id: 'dropdown', label: 'Dropdown', icon: <ChevronDown size={15} /> },
  { id: 'short_text', label: 'Jawaban Singkat', icon: <AlignLeft size={15} /> },
  { id: 'paragraph', label: 'Paragraf', icon: <AlignJustify size={15} /> },
  { id: 'email', label: 'Email', icon: <Mail size={15} /> },
  { id: 'phone', label: 'WhatsApp', icon: <Phone size={15} /> },
  { id: 'website', label: 'Tautan Web', icon: <Globe size={15} /> },
  { id: 'linear_scale', label: 'Skala Linier', icon: <Sliders size={15} /> },
  { id: 'rating', label: 'Rating', icon: <Star size={15} /> },
  { id: 'date', label: 'Tanggal', icon: <Calendar size={15} /> },
  { id: 'time', label: 'Waktu', icon: <Clock size={15} /> },
  { id: 'file_upload', label: 'Unggah Berkas', icon: <Upload size={15} /> },
  { id: 'signature', label: 'Persetujuan', icon: <PenTool size={15} /> },
  { id: 'section_header', label: 'Judul Bagian', icon: <Heading size={15} /> },
  { id: 'info_text', label: 'Kalimat', icon: <FileText size={15} /> },
  { id: 'image_block', label: 'Gambar', icon: <ImageIcon size={15} /> }
];

/* ── Custom Rounded Pill Dropdown for Question Types ── */
const PillQuestionTypeDropdown: React.FC<{
  value: QuestionType;
  onChange: (t: QuestionType) => void;
  isDarkMode: boolean;
}> = ({ value, onChange, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const currentType = QUESTION_TYPES.find((t) => t.id === value) || QUESTION_TYPES[0];

  return (
    <div ref={ref} style={{ position: 'relative', width: 200 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 100, // ROUNDED PILL
          border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
          background: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#1e293b',
          fontSize: 13,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ color: 'var(--cms-accent, #6366f1)', display: 'flex' }}>
            {currentType.icon}
          </span>
          <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentType.label}
          </span>
        </div>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--cms-text-muted)', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          width: 220,
          maxHeight: 340,
          overflowY: 'auto',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 20,
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          padding: 6,
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          animation: 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {QUESTION_TYPES.map((t) => {
            const isSelected = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 100, // PILL LIST ITEM
                  background: isSelected ? (isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
                  color: isSelected ? 'var(--cms-accent, #6366f1)' : (isDarkMode ? '#e2e8f0' : '#334155'),
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: isSelected ? 'var(--cms-accent, #6366f1)' : 'var(--cms-text-muted)', display: 'flex' }}>
                    {t.icon}
                  </span>
                  <span>{t.label}</span>
                </div>
                {isSelected && <Check size={14} color="var(--cms-accent, #6366f1)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const THEME_PALETTES = [
  { name: 'Classic Purple', hex: '#673ab7' },
  { name: 'Indigo Space', hex: '#6366f1' },
  { name: 'Ocean Blue', hex: '#0284c7' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Amber Sunset', hex: '#f59e0b' },
  { name: 'Rose Pink', hex: '#ec4899' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Dark Slate', hex: '#334155' }
];

export const FormEditor: React.FC<FormEditorProps> = ({
  form,
  responses,
  onUpdateForm,
  onBack,
  onSubmitResponse,
  onClearAllResponses,
  notify,
  confirm,
  isDarkMode = true
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'preview'>('questions');
  const [activeQuestionId, setActiveQuestionId] = useState<string>(form.questions[0]?.id || '');
  const [showColorPalette, setShowColorPalette] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [uploadingOptionImg, setUploadingOptionImg] = useState<string | null>(null);
  
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    if (isViewMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isViewMenuOpen]);

  const headerFileInputRef = useRef<HTMLInputElement>(null);

  const themeColor = form.themeColor || '#673ab7';

  // Helper update question
  const updateQuestion = (qId: string, updates: Partial<FormQuestion>) => {
    const updatedQuestions = form.questions.map((q) =>
      q.id === qId ? { ...q, ...updates } : q
    );
    onUpdateForm({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
  };

  const totalPages = Math.max(1, ...form.questions.map((q) => q.page || 1));

  // Add Question to specific page or after a question
  const handleAddQuestion = (afterId?: string, targetPage?: number) => {
    let assignedPage = targetPage;
    if (!assignedPage && afterId) {
      const prevQ = form.questions.find(q => q.id === afterId);
      assignedPage = prevQ?.page || 1;
    } else if (!assignedPage) {
      const lastQ = form.questions[form.questions.length - 1];
      assignedPage = lastQ?.page || 1;
    }

    const newQ: FormQuestion = {
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      type: 'multiple_choice',
      title: 'Pertanyaan',
      required: false,
      page: assignedPage,
      options: [
        { id: 'opt_1', text: 'Opsi 1' }
      ]
    };

    let updatedQuestions: FormQuestion[];
    if (afterId) {
      const idx = form.questions.findIndex((q) => q.id === afterId);
      if (idx !== -1) {
        updatedQuestions = [
          ...form.questions.slice(0, idx + 1),
          newQ,
          ...form.questions.slice(idx + 1)
        ];
      } else {
        updatedQuestions = [...form.questions, newQ];
      }
    } else {
      updatedQuestions = [...form.questions, newQ];
    }

    onUpdateForm({
      ...form,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString()
    });
    setActiveQuestionId(newQ.id);
  };

  // Add New Page (Section Break)
  const handleAddPage = () => {
    const nextPg = totalPages + 1;
    const newQ: FormQuestion = {
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      type: 'multiple_choice',
      title: 'Pertanyaan',
      required: false,
      page: nextPg,
      options: [
        { id: 'opt_1', text: 'Opsi 1' }
      ]
    };

    const pTitles = {
      ...(form.pageTitles || {}),
      [nextPg]: { title: `Halaman ${nextPg}` }
    };

    onUpdateForm({
      ...form,
      pageTitles: pTitles,
      questions: [...form.questions, newQ],
      updatedAt: new Date().toISOString()
    });
    setActiveQuestionId(newQ.id);
    if (notify) notify(`Halaman ${nextPg} berhasil ditambahkan!`);
  };

  // Duplicate Question
  const handleDuplicateQuestion = (qId: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target) return;

    const dupQ: FormQuestion = {
      ...target,
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: `${target.title} (Salinan)`,
      options: target.options.map((o) => ({
        ...o,
        id: 'opt_' + Math.random().toString(36).slice(2, 7)
      }))
    };

    const idx = form.questions.findIndex((q) => q.id === qId);
    const updated = [
      ...form.questions.slice(0, idx + 1),
      dupQ,
      ...form.questions.slice(idx + 1)
    ];

    onUpdateForm({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
    setActiveQuestionId(dupQ.id);
  };

  // Delete Question
  const handleDeleteQuestion = (qId: string) => {
    if (form.questions.length <= 1) {
      if (notify) notify('Formulir harus memiliki minimal 1 pertanyaan.', 'info');
      return;
    }
    const updated = form.questions.filter((q) => q.id !== qId);
    onUpdateForm({
      ...form,
      questions: updated,
      updatedAt: new Date().toISOString()
    });
    if (activeQuestionId === qId) {
      setActiveQuestionId(updated[0]?.id || '');
    }
  };

  // Add Option to question
  const handleAddOption = (qId: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target) return;
    const newOpt: QuestionOption = {
      id: 'opt_' + Math.random().toString(36).slice(2, 7),
      text: `Opsi ${target.options.length + 1}`
    };
    updateQuestion(qId, {
      options: [...target.options, newOpt]
    });
  };

  // Update Option text
  const handleUpdateOptionText = (qId: string, optId: string, text: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target) return;
    updateQuestion(qId, {
      options: target.options.map((o) => (o.id === optId ? { ...o, text } : o))
    });
  };

  // Remove Option from question
  const handleRemoveOption = (qId: string, optId: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target || target.options.length <= 1) return;
    updateQuestion(qId, {
      options: target.options.filter((o) => o.id !== optId)
    });
  };

  // Upload image to option
  const handleOptionImageUpload = async (qId: string, optId: string, file: File) => {
    try {
      setUploadingOptionImg(optId);
      let finalUrl = '';
      try {
        const res = await uploadToCloudinary(file);
        finalUrl = (typeof res === 'object' && res?.url) ? res.url : (typeof res === 'string' ? res : '');
      } catch {
        finalUrl = '';
      }

      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        });
      }

      const target = form.questions.find((q) => q.id === qId);
      if (target) {
        updateQuestion(qId, {
          options: target.options.map((o) => (o.id === optId ? { ...o, imageUrl: finalUrl } : o))
        });
      }
      if (notify) notify('Gambar opsi berhasil diunggah!');
    } catch (err) {
      console.error('Failed to upload option image:', err);
      if (notify) notify('Gagal mengunggah gambar opsi', 'error');
    } finally {
      setUploadingOptionImg(null);
    }
  };

  // Remove image from option
  const handleRemoveOptionImage = (qId: string, optId: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target) return;
    updateQuestion(qId, {
      options: target.options.map((o) => (o.id === optId ? { ...o, imageUrl: undefined } : o))
    });
  };

  // Upload Header Banner
  const handleHeaderBannerUpload = async (file: File) => {
    try {
      if (notify) notify('Mengunggah banner tema formulir...');
      let finalUrl = '';
      try {
        const res = await uploadToCloudinary(file);
        finalUrl = (typeof res === 'object' && res?.url) ? res.url : (typeof res === 'string' ? res : '');
      } catch {
        finalUrl = '';
      }

      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        });
      }
      onUpdateForm({
        ...form,
        headerBanner: finalUrl,
        headerThemeId: 'custom',
        updatedAt: new Date().toISOString()
      });
      if (notify) notify('Banner tema berhasil diperbarui!');
    } catch (err) {
      console.error('Banner upload error:', err);
      if (notify) notify('Gagal mengunggah banner', 'error');
    }
  };

  // Share Link generator
  const formShareUrl = `${window.location.origin}/form/${form.id}`;

  return (
    <div style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── FLOATING PILL TOP NAVBAR (Strictly 1 Row, Icon-Only except Form Title) ── */}
      <div style={{
        position: 'sticky',
        top: 14,
        zIndex: 50,
        width: 'calc(100% - 32px)',
        maxWidth: 960,
        margin: '14px auto 0 auto',
        padding: '6px 14px',
        background: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 100,
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: isDarkMode ? '0 12px 36px rgba(0,0,0,0.45)' : '0 10px 30px rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: 10
      }}>
        {/* Left: Arrow-only Back button & Form Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <button
            onClick={onBack}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              color: 'var(--cms-text, #f8fafc)',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Kembali"
          >
            <ArrowLeft size={16} />
          </button>

          <input
            type="text"
            value={form.title}
            onChange={(e) => onUpdateForm({ ...form, title: e.target.value, updatedAt: new Date().toISOString() })}
            placeholder="Formulir"
            className="form-editor-title-input"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 15,
              fontWeight: 850,
              color: 'var(--cms-text, currentColor)',
              outline: 'none',
              width: '100%',
              maxWidth: 320,
              padding: '4px 8px',
              borderRadius: 100,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
            onFocus={(e) => (e.target.style.background = 'var(--cms-switcher-bg)')}
            onBlur={(e) => (e.target.style.background = 'transparent')}
          />
        </div>

        {/* Center: Main Tabs (Desktop) */}
        <div className="form-editor-desktop-tabs" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
          padding: 3,
          borderRadius: 100,
          flexShrink: 0
        }}>
          {/* Questions Tab */}
          <button
            onClick={() => setActiveTab('questions')}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: activeTab === 'questions' ? themeColor : 'transparent',
              color: activeTab === 'questions' ? '#ffffff' : 'var(--cms-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Pertanyaan"
          >
            <FileText size={16} />
          </button>

          {/* Responses Tab with Badge */}
          <button
            onClick={() => setActiveTab('responses')}
            style={{
              height: 34,
              padding: '0 8px',
              borderRadius: 100,
              border: 'none',
              background: activeTab === 'responses' ? themeColor : 'transparent',
              color: activeTab === 'responses' ? '#ffffff' : 'var(--cms-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease'
            }}
            title="Tanggapan"
          >
            <BarChart3 size={16} />
            <span style={{
              background: activeTab === 'responses' ? 'rgba(255,255,255,0.25)' : 'var(--cms-border)',
              padding: '1px 6px',
              borderRadius: 100,
              fontSize: 10.5,
              fontWeight: 800
            }}>
              {responses.length}
            </span>
          </button>

          {/* Preview Tab */}
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: activeTab === 'preview' ? themeColor : 'transparent',
              color: activeTab === 'preview' ? '#ffffff' : 'var(--cms-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Pratinjau"
          >
            <Eye size={16} />
          </button>
        </div>

        {/* Center: Mobile Single Dropdown Button */}
        <div ref={viewMenuRef} className="form-editor-mobile-view-container" style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 100,
              border: `1.5px solid ${themeColor}`,
              background: `${themeColor}15`,
              color: themeColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 800,
              transition: 'all 0.15s ease'
            }}
            title="Pilih Tampilan"
          >
            {activeTab === 'questions' && <FileText size={15} />}
            {activeTab === 'responses' && <BarChart3 size={15} />}
            {activeTab === 'preview' && <Eye size={15} />}
            <span style={{ maxWidth: 85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeTab === 'questions' ? 'Pertanyaan' : activeTab === 'responses' ? `Tanggapan (${responses.length})` : 'Pratinjau'}
            </span>
            <ChevronDown size={13} style={{ transform: isViewMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isViewMenuOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 175,
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderRadius: 20,
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
              padding: 6,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              animation: 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('questions'); setIsViewMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeTab === 'questions' ? `${themeColor}20` : 'transparent',
                  color: activeTab === 'questions' ? themeColor : 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: activeTab === 'questions' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <FileText size={15} />
                <span>Pertanyaan</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('responses'); setIsViewMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeTab === 'responses' ? `${themeColor}20` : 'transparent',
                  color: activeTab === 'responses' ? themeColor : 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: activeTab === 'responses' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={15} />
                  <span>Tanggapan</span>
                </div>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 100,
                  fontSize: 10.5,
                  fontWeight: 800,
                  background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                }}>
                  {responses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('preview'); setIsViewMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 100,
                  border: 'none',
                  background: activeTab === 'preview' ? `${themeColor}20` : 'transparent',
                  color: activeTab === 'preview' ? themeColor : 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: activeTab === 'preview' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Eye size={15} />
                <span>Pratinjau</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions (Icon Only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', flexShrink: 0 }}>
          {/* Color & Theme Toggle Button (Icon Only) */}
          <button
            onClick={() => setShowColorPalette(!showColorPalette)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid var(--cms-border)',
              background: 'var(--cms-switcher-bg)',
              color: themeColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Tema"
          >
            <Palette size={16} />
          </button>

          {/* Theme & Banner Customizer Modal/Popover */}
          {showColorPalette && (
            <div style={{
              position: 'absolute',
              top: 44,
              right: 0,
              background: 'var(--cms-card-bg, #ffffff)',
              border: '1px solid var(--cms-border)',
              borderRadius: 20,
              padding: 18,
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              width: 320
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)' }}>
                  Tema Formulir
                </span>
                <button
                  onClick={() => setShowColorPalette(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Theme Colors with GlassColorPicker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <GlassColorPicker
                  label="Warna Aksen"
                  value={form.themeColor || '#673ab7'}
                  onChange={(c) => onUpdateForm({ ...form, themeColor: c, updatedAt: new Date().toISOString() })}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4 }}>
                  {THEME_PALETTES.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateForm({ ...form, themeColor: c.hex, updatedAt: new Date().toISOString() })}
                      style={{
                        height: 28,
                        borderRadius: 100,
                        background: c.hex,
                        border: form.themeColor === c.hex ? '3px solid #ffffff' : 'none',
                        boxShadow: form.themeColor === c.hex ? '0 0 0 2px var(--cms-text)' : 'none',
                        cursor: 'pointer'
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Theme Header Banners */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--cms-border)', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)' }}>
                    Banner
                  </span>
                  {form.headerBanner && (
                    <button
                      onClick={() => onUpdateForm({ ...form, headerBanner: undefined, headerThemeId: undefined })}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, fontWeight: 750, cursor: 'pointer' }}
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {FORM_HEADER_THEMES.map((th) => (
                    <div
                      key={th.id}
                      onClick={() => onUpdateForm({ ...form, headerBanner: th.bannerUrl, headerThemeId: th.id, themeColor: th.defaultColor })}
                      style={{
                        height: 44,
                        borderRadius: 10,
                        backgroundImage: `url(${th.bannerUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        border: form.headerBanner === th.bannerUrl ? '2px solid var(--cms-accent, #6366f1)' : '1px solid var(--cms-border)',
                        position: 'relative'
                      }}
                      title={th.name}
                    />
                  ))}
                </div>

                {/* Upload Custom Banner File */}
                <input
                  type="file"
                  ref={headerFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleHeaderBannerUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => headerFileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 100,
                    border: '1px dashed var(--cms-border)',
                    background: 'var(--cms-switcher-bg)',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 750,
                    cursor: 'pointer',
                    marginTop: 4
                  }}
                >
                  <Upload size={14} />
                  <span>Unggah Gambar</span>
                </button>
              </div>
            </div>
          )}

          {/* Share Button (Icon Only) */}
          <button
            onClick={() => setShowShareModal(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--cms-switcher-bg)',
              border: '1px solid var(--cms-border)',
              color: 'var(--cms-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Bagikan"
          >
            <Share2 size={16} />
          </button>

          {/* Download Excel Button (Icon Only) */}
          <button
            onClick={async () => {
              const ok = await downloadFormExcel(form, responses);
              if (ok && notify) notify(`Excel "${form.title} (Tanggapan).xlsx" berhasil diunduh!`, 'success');
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#107c41',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 124, 65, 0.25)',
              transition: 'all 0.15s ease'
            }}
            title="Ekspor"
          >
            <FileSpreadsheet size={16} />
          </button>
        </div>
      </div>

      {/* ── SHARE MODAL ── */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border)',
            borderRadius: 24,
            padding: 26,
            maxWidth: 520,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--cms-text)' }}>
                Bagikan
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--cms-text-muted)' }}>
              Kirim tautan ini kepada klien atau responden untuk mengumpulkan data tanggapan:
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--cms-switcher-bg)',
              border: '1px solid var(--cms-border)',
              borderRadius: 100,
              padding: '8px 16px'
            }}>
              <Link size={16} color="var(--cms-text-muted)" />
              <input
                type="text"
                readOnly
                value={formShareUrl}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  fontSize: 13,
                  width: '100%',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formShareUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                  if (notify) notify('Tautan formulir disalin ke clipboard!');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 14px',
                  borderRadius: 100,
                  background: themeColor,
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {copiedLink ? <CopyCheck size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '9px 18px',
                  borderRadius: 100,
                  background: 'var(--cms-switcher-bg)',
                  border: '1px solid var(--cms-border)',
                  color: 'var(--cms-text)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Pratinjau
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 100,
                  background: themeColor,
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BODY TABS VIEW ── */}
      <div style={{
        flex: 1,
        background: isDarkMode ? '#0b1120' : '#f4f2f9',
        padding: '24px 16px 80px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        {/* VIEW 1: QUESTIONS EDITOR */}
        {activeTab === 'questions' && (
          <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Header Card (With optional theme banner image & rounded minimalist design) */}
            <div style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Optional Header Banner Image */}
              {form.headerBanner ? (
                <div style={{
                  width: '100%',
                  height: 160,
                  backgroundImage: `url(${form.headerBanner})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
              ) : null}

              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => onUpdateForm({ ...form, title: e.target.value, updatedAt: new Date().toISOString() })}
                  placeholder="Judul Formulir"
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: isDarkMode ? '#f8fafc' : '#1e293b',
                    border: 'none',
                    borderBottom: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    background: 'transparent',
                    padding: '6px 0',
                    outline: 'none',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = themeColor)}
                  onBlur={(e) => (e.target.style.borderBottomColor = isDarkMode ? '#334155' : '#e2e8f0')}
                />

                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => onUpdateForm({ ...form, description: e.target.value, updatedAt: new Date().toISOString() })}
                  placeholder="Deskripsi formulir (tujuan pengumpulan data, petunjuk pengisian, dll)"
                  style={{
                    fontSize: 14,
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    border: 'none',
                    borderBottom: `1.5px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    background: 'transparent',
                    padding: '6px 0',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = themeColor)}
                  onBlur={(e) => (e.target.style.borderBottomColor = isDarkMode ? '#334155' : '#e2e8f0')}
                />
              </div>
            </div>

             {/* 2. Questions Stack (Minimalist Rounded Cards with Custom Card Colors & Multi-Page Support) */}
            {form.questions.map((q, idx) => {
              const isActive = activeQuestionId === q.id;
              const cardAccent = q.cardColor || themeColor;
              const cardBackground = q.cardBg || (isDarkMode ? '#1e293b' : '#ffffff');
              const qPage = q.page || 1;
              const prevQPage = idx > 0 ? (form.questions[idx - 1].page || 1) : 1;
              const isPageHeader = totalPages > 1 && (idx === 0 || qPage !== prevQPage);

              return (
                <React.Fragment key={q.id}>
                  {isPageHeader && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 20px',
                        borderRadius: 100,
                        background: isDarkMode ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                        border: `1.5px solid ${cardAccent}35`,
                        color: cardAccent,
                        fontSize: 13,
                        fontWeight: 850,
                        marginTop: idx > 0 ? 14 : 0,
                        marginBottom: 4
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={15} />
                        <span>Halaman {qPage} dari {totalPages}</span>
                      </div>
                      <span style={{ fontSize: 11.5, opacity: 0.75 }}>Bagian {qPage}</span>
                    </div>
                  )}

                  <div
                    onClick={() => setActiveQuestionId(q.id)}
                    style={{
                      background: cardBackground,
                      borderRadius: 24,
                      padding: '22px 26px',
                      boxShadow: isActive ? '0 8px 26px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.03)',
                      borderLeft: isActive ? `6px solid ${cardAccent}` : '6px solid transparent',
                      border: isActive ? `1px solid ${cardAccent}40` : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                      borderLeftColor: isActive ? cardAccent : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Top: Drag handle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)', opacity: 0.4 }}>
                      <GripVertical size={16} />
                    </div>

                    {/* Title & Rounded Dropdown Selector */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      flexWrap: 'wrap'
                    }}>
                      {/* Question Title */}
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <input
                          type="text"
                          value={q.title}
                          onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                          placeholder={
                            q.type === 'section_header' ? 'Judul Bagian' :
                            q.type === 'info_text' ? 'Judul Teks' :
                            q.type === 'image_block' ? 'Judul Gambar' :
                            q.type === 'signature' ? 'Pernyataan' :
                            'Pertanyaan'
                          }
                          style={{
                            width: '100%',
                            fontSize: 16,
                            fontWeight: 800,
                            color: isDarkMode ? '#f8fafc' : '#1e293b',
                            background: isDarkMode ? '#0f172a' : '#f8fafc',
                            border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`,
                            borderBottom: `2px solid ${isActive ? cardAccent : (isDarkMode ? '#475569' : '#cbd5e1')}`,
                            padding: '10px 16px',
                            borderRadius: 14,
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Question Type Selector (ROUNDED PILL DROPDOWN) */}
                      <PillQuestionTypeDropdown
                        value={q.type}
                        onChange={(newType) => updateQuestion(q.id, { type: newType })}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    {/* Body: Options / Image Upload for Multiple Choice */}
                    <div style={{ paddingLeft: 4 }}>
                      {/* SHORT TEXT / PARAGRAPH preview */}
                      {q.type === 'short_text' && (
                        <div style={{ padding: '8px 0', borderBottom: '1px dashed var(--cms-border)', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          Teks jawaban singkat
                        </div>
                      )}
                      {q.type === 'paragraph' && (
                        <div style={{ padding: '14px 0', borderBottom: '1px dashed var(--cms-border)', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          Teks jawaban panjang
                        </div>
                      )}

                      {/* MULTIPLE CHOICE / CHECKBOXES / DROPDOWN options list with IMAGE UPLOAD */}
                      {(q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {q.options.map((opt, optIdx) => (
                            <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {q.type === 'multiple_choice' ? (
                                  <Radio size={16} color="var(--cms-text-muted)" />
                                ) : q.type === 'checkboxes' ? (
                                  <CheckSquare size={16} color="var(--cms-text-muted)" />
                                ) : (
                                  <span style={{ fontSize: 12, fontWeight: 850, color: 'var(--cms-text-muted)', minWidth: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {optIdx + 1}.
                                  </span>
                                )}

                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateOptionText(q.id, opt.id, e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: '8px 10px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1.5px solid transparent',
                                    color: isDarkMode ? '#f1f5f9' : '#334155',
                                    fontSize: 14,
                                    outline: 'none'
                                  }}
                                  onFocus={(e) => (e.target.style.borderBottomColor = cardAccent)}
                                  onBlur={(e) => (e.target.style.borderBottomColor = 'transparent')}
                                />

                                {/* Option Image Upload Button (Icon-Only Pill) */}
                                <label
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    color: 'var(--cms-text-muted)',
                                    cursor: 'pointer',
                                    border: '1px solid var(--cms-border)',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="Foto"
                                >
                                  <ImageIcon size={14} />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleOptionImageUpload(q.id, opt.id, file);
                                    }}
                                  />
                                </label>

                                {q.options.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(q.id, opt.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--cms-text-muted)',
                                      cursor: 'pointer',
                                      padding: 4
                                    }}
                                  >
                                    <X size={15} />
                                  </button>
                                )}
                              </div>

                              {/* Option Image Preview if attached */}
                              {opt.imageUrl && (
                                <div style={{
                                  position: 'relative',
                                  marginLeft: 26,
                                  marginTop: 4,
                                  width: 'fit-content'
                                }}>
                                  <img
                                    src={opt.imageUrl}
                                    alt="Option preview"
                                    style={{
                                      maxWidth: 180,
                                      maxHeight: 120,
                                      borderRadius: 14,
                                      objectFit: 'cover',
                                      border: '1px solid var(--cms-border)'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionImage(q.id, opt.id)}
                                    style={{
                                      position: 'absolute',
                                      top: -6,
                                      right: -6,
                                      background: '#ef4444',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: 20,
                                      height: 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                                    }}
                                    title="Hapus gambar"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Add option button (Pill) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleAddOption(q.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'none',
                                border: 'none',
                                color: cardAccent,
                                fontSize: 13,
                                fontWeight: 800,
                                cursor: 'pointer',
                                padding: '4px 0'
                              }}
                            >
                              <Plus size={14} />
                              <span>Opsi</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* LINEAR SCALE CONFIG (With Rounded Inputs) */}
                      {q.type === 'linear_scale' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span>Skala dari <strong>1</strong> sampai </span>
                            <RoundedPillDropdown
                              value={q.scaleMax || 5}
                              options={[
                                { value: 5, label: '5' },
                                { value: 7, label: '7' },
                                { value: 10, label: '10' }
                              ]}
                              onChange={(val) => updateQuestion(q.id, { scaleMax: Number(val) })}
                              isDarkMode={isDarkMode}
                              cardAccent={cardAccent}
                              size="sm"
                              minWidth={75}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              placeholder="Label nilai minimum (opsional, cth: Sangat Buruk)"
                              value={q.scaleMinLabel || ''}
                              onChange={(e) => updateQuestion(q.id, { scaleMinLabel: e.target.value })}
                              style={{
                                flex: 1,
                                minWidth: 200,
                                padding: '8px 14px',
                                borderRadius: 100,
                                border: '1px solid var(--cms-border)',
                                background: 'transparent',
                                color: 'var(--cms-text)',
                                fontSize: 12.5
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Label nilai maksimum (opsional, cth: Sangat Bagus)"
                              value={q.scaleMaxLabel || ''}
                              onChange={(e) => updateQuestion(q.id, { scaleMaxLabel: e.target.value })}
                              style={{
                                flex: 1,
                                minWidth: 200,
                                padding: '8px 14px',
                                borderRadius: 100,
                                border: '1px solid var(--cms-border)',
                                background: 'transparent',
                                color: 'var(--cms-text)',
                                fontSize: 12.5
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* RATING CONFIG */}
                      {q.type === 'rating' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          <span>Skala Bintang: 5 Bintang</span>
                        </div>
                      )}

                      {/* DATE / TIME PREVIEWS */}
                      {q.type === 'date' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          <span>Format: Hari, Bulan, Tahun</span>
                        </div>
                      )}
                      {q.type === 'time' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          <span>Format: Jam, Menit</span>
                        </div>
                      )}

                      {/* SECTION HEADER (JUDUL / SUB JUDUL) */}
                      {q.type === 'section_header' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input
                            type="text"
                            value={q.subtitle || ''}
                            onChange={(e) => updateQuestion(q.id, { subtitle: e.target.value })}
                            placeholder="Sub-judul atau deskripsi penjelas (opsional)"
                            style={{
                              width: '100%',
                              fontSize: 13.5,
                              color: 'var(--cms-text-muted)',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1.5px dashed var(--cms-border)',
                              padding: '6px 2px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      )}

                      {/* INFO TEXT (KALIMAT / INSTRUKSI) */}
                      {q.type === 'info_text' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <textarea
                            value={q.subtitle || ''}
                            onChange={(e) => updateQuestion(q.id, { subtitle: e.target.value })}
                            placeholder="Tuliskan kalimat instruksi, pengumuman, atau informasi penting..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: 14,
                              border: '1px solid var(--cms-border)',
                              background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                              color: 'var(--cms-text)',
                              fontSize: 13,
                              lineHeight: 1.5,
                              outline: 'none',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      )}

                      {/* IMAGE BLOCK (GAMBAR) */}
                      {q.type === 'image_block' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {q.imageUrl ? (
                            <div style={{ position: 'relative', width: 'fit-content', maxWidth: '100%' }}>
                              <img
                                src={q.imageUrl}
                                alt={q.title || 'Gambar'}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: 280,
                                  borderRadius: 16,
                                  objectFit: 'cover',
                                  border: '1px solid var(--cms-border)'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => updateQuestion(q.id, { imageUrl: undefined })}
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: '#ffffff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Hapus"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{
                              border: '2px dashed var(--cms-border)',
                              borderRadius: 16,
                              padding: '24px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 10,
                              background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                            }}>
                              <ImageIcon size={32} color="var(--cms-text-muted)" />
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <label style={{
                                  padding: '6px 14px',
                                  borderRadius: 100,
                                  background: cardAccent,
                                  color: '#fff',
                                  fontSize: 12.5,
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}>
                                  Unggah
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (re) => {
                                          updateQuestion(q.id, { imageUrl: re.target?.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                                <span style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>atau</span>
                                <input
                                  type="text"
                                  placeholder="URL Gambar..."
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 100,
                                    border: '1px solid var(--cms-border)',
                                    background: 'transparent',
                                    color: 'var(--cms-text)',
                                    fontSize: 12,
                                    width: 170
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                                      updateQuestion(q.id, { imageUrl: (e.target as HTMLInputElement).value });
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value) {
                                      updateQuestion(q.id, { imageUrl: e.target.value });
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          <input
                            type="text"
                            value={q.subtitle || ''}
                            onChange={(e) => updateQuestion(q.id, { subtitle: e.target.value })}
                            placeholder="Keterangan gambar / caption (opsional)"
                            style={{
                              fontSize: 12.5,
                              color: 'var(--cms-text-muted)',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px dashed var(--cms-border)',
                              padding: '4px 0',
                              outline: 'none'
                            }}
                          />
                        </div>
                      )}

                      {/* FILE UPLOAD PREVIEW */}
                      {q.type === 'file_upload' && (
                        <div style={{
                          border: '1.5px dashed var(--cms-border)',
                          borderRadius: 16,
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          color: 'var(--cms-text-muted)',
                          fontSize: 13,
                          background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                        }}>
                          <Upload size={22} color={cardAccent} />
                          <div>
                            <div style={{ fontWeight: 750, color: 'var(--cms-text)' }}>Unggah Berkas</div>
                            <div style={{ fontSize: 11.5 }}>PDF, DOCX, XLSX, JPG, PNG</div>
                          </div>
                        </div>
                      )}

                      {/* EMAIL PREVIEW */}
                      {q.type === 'email' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--cms-border)', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          <Mail size={16} color={cardAccent} />
                          <span>contoh@email.com</span>
                        </div>
                      )}

                      {/* PHONE / WHATSAPP PREVIEW */}
                      {q.type === 'phone' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--cms-border)', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          <Phone size={16} color={cardAccent} />
                          <span>+62 812-xxxx-xxxx</span>
                        </div>
                      )}

                      {/* WEBSITE PREVIEW */}
                      {q.type === 'website' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed var(--cms-border)', color: 'var(--cms-text-muted)', fontSize: 13 }}>
                          <Globe size={16} color={cardAccent} />
                          <span>https://situsanda.com</span>
                        </div>
                      )}

                      {/* SIGNATURE / PERSETUJUAN PREVIEW */}
                      {q.type === 'signature' && (
                        <div style={{
                          border: '1.5px dashed var(--cms-border)',
                          borderRadius: 14,
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                        }}>
                          <PenTool size={18} color={cardAccent} />
                          <span style={{ fontSize: 13, color: 'var(--cms-text-muted)' }}>Persetujuan digital</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions of Question Card: Color Picker, Duplicate, Delete, Required Switch */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                      borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                      marginTop: 4,
                      flexWrap: 'wrap',
                      gap: 12
                    }}>
                      {/* Left: Card Color Customizer (Direct GlassColorPicker) */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <GlassColorPicker
                          value={cardAccent}
                          onChange={(hex) => updateQuestion(q.id, { cardColor: hex })}
                          customTrigger={
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '5px 12px',
                                borderRadius: 100, // ROUNDED PILL
                                background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                border: `1.5px solid ${cardAccent}`,
                                color: 'var(--cms-text)',
                                fontSize: 12,
                                fontWeight: 750,
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              title="Ubah Warna Kartu"
                            >
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cardAccent }} />
                              <span>Warna</span>
                            </div>
                          }
                        />
                      </div>

                      {/* Right: Page Switcher, Duplicate, Delete, Required */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {totalPages > 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 700 }}>Halaman</span>
                            <RoundedPillDropdown
                              value={q.page || 1}
                              options={Array.from({ length: totalPages }, (_, i) => ({
                                value: i + 1,
                                label: `${i + 1}`
                              }))}
                              onChange={(val) => updateQuestion(q.id, { page: Number(val) })}
                              isDarkMode={isDarkMode}
                              cardAccent={cardAccent}
                              size="sm"
                              minWidth={65}
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(q.id);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          title="Duplikasi"
                        >
                          <Copy size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(q.id);
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>

                        {q.type !== 'section_header' && q.type !== 'info_text' && q.type !== 'image_block' && (
                          <>
                            <div style={{ width: 1, height: 18, background: 'var(--cms-border)' }} />

                            <label
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 750,
                                color: 'var(--cms-text)',
                                cursor: 'pointer'
                              }}
                            >
                              <span>Wajib</span>
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                style={{ width: 16, height: 16, accentColor: cardAccent, cursor: 'pointer' }}
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Bottom Add & Action Buttons (Pill Design) */}
            <div className="form-editor-bottom-bar" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginTop: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="form-editor-bottom-btn"
                onClick={() => handleAddQuestion()}
                style={{
                  flex: '1 1 140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 100, // ROUNDED PILL
                  border: `2px dashed ${themeColor}`,
                  background: `${themeColor}12`,
                  color: themeColor,
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Tambah"
              >
                <Plus size={16} />
                <span className="form-editor-btn-label">Tambah</span>
              </button>

              <button
                type="button"
                className="form-editor-bottom-btn"
                onClick={handleAddPage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 100, // ROUNDED PILL
                  border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
                  color: 'var(--cms-text)',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Halaman"
              >
                <Layers size={16} />
                <span className="form-editor-btn-label">Halaman</span>
              </button>

              <button
                type="button"
                className="form-editor-bottom-btn"
                onClick={() => setActiveTab('preview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 100, // ROUNDED PILL
                  border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
                  color: 'var(--cms-text)',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Pratinjau"
              >
                <Eye size={16} />
                <span className="form-editor-btn-label">Pratinjau</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: RESPONSES TAB */}
        {activeTab === 'responses' && (
          <div style={{ width: '100%', maxWidth: 840 }}>
            <FormResponsesView
              form={form}
              responses={responses}
              onUpdateForm={onUpdateForm}
              onClearAllResponses={onClearAllResponses}
              notify={notify}
              confirm={confirm}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* VIEW 3: LIVE PREVIEW TAB */}
        {activeTab === 'preview' && (
          <div style={{ width: '100%' }}>
            <FormPublicView
              form={form}
              onSubmitResponse={onSubmitResponse}
              onBack={() => setActiveTab('questions')}
              isPreview={true}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormEditor;
