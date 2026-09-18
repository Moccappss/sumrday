import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, Send, Star, ArrowLeft, ChevronLeft, ChevronRight,
  Mail, Phone, Globe, Upload, FileText, CheckSquare, Image as ImageIcon, Heading, PenTool
} from 'lucide-react';
import type { FormSchema, FormResponse } from './formTypes';
import { RoundedPillDropdown } from './RoundedPillDropdown';

interface FormPublicViewProps {
  form: FormSchema;
  onSubmitResponse: (response: FormResponse) => Promise<void> | void;
  onBack?: () => void;
  isPreview?: boolean;
  isDarkMode?: boolean;
}

export const FormPublicView: React.FC<FormPublicViewProps> = ({
  form,
  onSubmitResponse,
  onBack,
  isPreview = false,
  isDarkMode = true
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.max(1, ...form.questions.map((q) => q.page || 1));
  const themeColor = form.themeColor || '#673ab7';

  // Handle Input Changes
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  // Handle Checkboxes Toggle
  const handleCheckboxToggle = (questionId: string, optionText: string) => {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    const exists = current.includes(optionText);
    const updated = exists
      ? current.filter((x: string) => x !== optionText)
      : [...current, optionText];
    handleAnswerChange(questionId, updated);
  };

  // Handle Next Page with Validation
  const handleNextPage = () => {
    const pageQuestions = form.questions.filter((q) => (q.page || 1) === currentPage);
    const newErrors: Record<string, string> = {};
    pageQuestions.forEach((q) => {
      if (q.required) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[q.id] = 'Pertanyaan ini wajib diisi';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      const firstErrorId = Object.keys(newErrors)[0];
      const el = document.getElementById(`form-q-${firstErrorId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Previous Page
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acceptingResponses && !isPreview) return;

    // Validate Required Fields across all questions
    const newErrors: Record<string, string> = {};
    form.questions.forEach((q) => {
      if (q.required && q.type !== 'section_header' && q.type !== 'info_text' && q.type !== 'image_block') {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[q.id] = 'Pertanyaan ini wajib diisi';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorId = Object.keys(newErrors)[0];
      const errQ = form.questions.find((q) => q.id === firstErrorId);
      if (errQ && (errQ.page || 1) !== currentPage) {
        setCurrentPage(errQ.page || 1);
      }
      setTimeout(() => {
        const el = document.getElementById(`form-q-${firstErrorId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setIsSubmitting(true);
    try {
      const responsePayload: FormResponse = {
        id: 'resp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        formId: form.id,
        submittedAt: new Date().toISOString(),
        answers
      };

      await onSubmitResponse(responsePayload);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting form response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset / Send Another Response
  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setIsSubmitted(false);
    setCurrentPage(1);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: isDarkMode ? '#0b1120' : '#f4f2f9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '30px 16px 80px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Preview Navigation Banner if in Admin Preview */}
      {isPreview && (
        <div style={{
          width: '100%',
          maxWidth: 700,
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 100,
          padding: '10px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          fontWeight: 750,
          color: isDarkMode ? '#c7d2fe' : '#4338ca'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Pratinjau Responden</span>
          </span>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 100,
                background: 'var(--cms-accent, #6366f1)',
                color: '#ffffff',
                border: 'none',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} /> <span>Editor</span>
            </button>
          )}
        </div>
      )}

      {/* Main Container */}
      <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* If Form is Closed */}
        {!form.acceptingResponses && !isPreview ? (
          <div style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: 24,
            padding: 36,
            textAlign: 'center',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: '0 4px 18px rgba(0,0,0,0.06)'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 900, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
              {form.title}
            </h2>
            <p style={{ fontSize: 14, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              Formulir ini saat ini tidak lagi menerima tanggapan. Silakan hubungi pemilik formulir jika Anda merasa ini adalah kesalahan.
            </p>
          </div>
        ) : isSubmitted ? (
          /* Confirmation / Success Screen (Minimalist Pill Style) */
          <div style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: 24,
            padding: '40px 32px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={32} color="#10b981" />
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
                {form.title}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 15, color: isDarkMode ? '#cbd5e1' : '#334155', lineHeight: 1.5 }}>
              Tanggapan Anda telah berhasil direkam. Terima kasih telah mengisi formulir ini!
            </p>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 'none',
                  color: themeColor,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Kirim tanggapan lain
              </button>
            </div>
          </div>
        ) : (
          /* Actual Form Cards */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Header Card (With optional header banner theme image) */}
            <div style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
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
                  backgroundPosition: 'center',
                  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                }} />
              ) : null}

              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h1 style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 900,
                  color: isDarkMode ? '#f8fafc' : '#1e293b',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  {form.title || 'Formulir Tanpa Judul'}
                </h1>

                {form.description && (
                  <p style={{
                    margin: 0,
                    fontSize: 14.5,
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {form.description}
                  </p>
                )}

                <div style={{
                  fontSize: 12.5,
                  color: '#ef4444',
                  fontWeight: 700,
                  paddingTop: 10,
                  borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                }}>
                  * Menunjukkan pertanyaan yang wajib diisi
                </div>
              </div>
            </div>

            {/* MULTI-PAGE PROGRESS BAR */}
            {totalPages > 1 && (
              <div
                style={{
                  background: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: 20,
                  padding: '14px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 800 }}>
                  <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <span style={{ color: themeColor }}>
                    {Math.round((currentPage / totalPages) * 100)}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 100,
                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${(currentPage / totalPages) * 100}%`,
                      height: '100%',
                      borderRadius: 100,
                      background: themeColor,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* 2. Questions Stack with Custom Question Card Color & Option Images */}
            {form.questions
              .filter((q) => (q.page || 1) === currentPage)
              .map((q, idx) => {
              const hasError = !!errors[q.id];
              const value = answers[q.id];
              const cardAccent = q.cardColor || themeColor;
              const cardBackground = q.cardBg || (isDarkMode ? '#1e293b' : '#ffffff');

              return (
                <div
                  key={q.id}
                  id={`form-q-${q.id}`}
                  style={{
                    background: cardBackground,
                    borderRadius: 24,
                    padding: '24px 28px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    borderLeft: `6px solid ${cardAccent}`,
                    border: hasError
                      ? '2px solid #ef4444'
                      : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                    borderLeftColor: cardAccent,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Question / Block Header */}
                  {q.type === 'section_header' ? (
                    <div style={{ borderBottom: `2px solid ${cardAccent}30`, paddingBottom: 10 }}>
                      <h2 style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 900,
                        color: cardAccent,
                        letterSpacing: '-0.02em'
                      }}>
                        {q.title || 'Bagian Baru'}
                      </h2>
                      {q.subtitle && (
                        <p style={{ margin: '6px 0 0 0', fontSize: 13.5, color: isDarkMode ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>
                          {q.subtitle}
                        </p>
                      )}
                    </div>
                  ) : q.type === 'info_text' ? (
                    <div style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: `${cardAccent}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={18} color={cardAccent} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {q.title && (
                          <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 850, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
                            {q.title}
                          </h3>
                        )}
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: isDarkMode ? '#cbd5e1' : '#475569', whiteSpace: 'pre-line' }}>
                          {q.subtitle || q.description || ''}
                        </p>
                      </div>
                    </div>
                  ) : q.type === 'image_block' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                      {q.title && (
                        <div style={{ alignSelf: 'flex-start', fontSize: 16, fontWeight: 850, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
                          {q.title}
                        </div>
                      )}
                      {q.imageUrl ? (
                        <img
                          src={q.imageUrl}
                          alt={q.title || 'Gambar'}
                          style={{
                            width: '100%',
                            maxHeight: 420,
                            borderRadius: 18,
                            objectFit: 'contain',
                            background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f1f5f9'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          padding: 36,
                          borderRadius: 18,
                          border: '2px dashed var(--cms-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          color: 'var(--cms-text-muted)'
                        }}>
                          <ImageIcon size={32} />
                          <span style={{ fontSize: 13 }}>Gambar tidak tersedia</span>
                        </div>
                      )}
                      {q.subtitle && (
                        <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                          {q.subtitle}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label style={{
                        fontSize: 16,
                        fontWeight: 850,
                        color: isDarkMode ? '#f8fafc' : '#1e293b',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 4
                      }}>
                        <span>{q.title || `Pertanyaan ${idx + 1}`}</span>
                        {q.required && <span style={{ color: '#ef4444', fontSize: 16 }}>*</span>}
                      </label>
                      {q.description && (
                        <p style={{ margin: '4px 0 0 0', fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                          {q.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Input Rendering per Question Type */}
                  <div>
                    {/* SHORT TEXT */}
                    {q.type === 'short_text' && (
                      <input
                        type="text"
                        placeholder="Jawaban Anda"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{
                          width: '100%',
                          maxWidth: 380,
                          padding: '10px 0',
                          border: 'none',
                          borderBottom: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                          background: 'transparent',
                          color: isDarkMode ? '#f8fafc' : '#1e293b',
                          fontSize: 14.5,
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => (e.target.style.borderBottomColor = cardAccent)}
                        onBlur={(e) => (e.target.style.borderBottomColor = isDarkMode ? '#475569' : '#cbd5e1')}
                      />
                    )}

                    {/* PARAGRAPH */}
                    {q.type === 'paragraph' && (
                      <textarea
                        rows={3}
                        placeholder="Jawaban Anda"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 18,
                          border: `1.5px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                          background: isDarkMode ? 'rgba(0,0,0,0.15)' : '#f8fafc',
                          color: isDarkMode ? '#f8fafc' : '#1e293b',
                          fontSize: 14,
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = cardAccent)}
                        onBlur={(e) => (e.target.style.borderColor = isDarkMode ? '#475569' : '#cbd5e1')}
                      />
                    )}

                    {/* MULTIPLE CHOICE (RADIO) */}
                    {q.type === 'multiple_choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {q.options.map((opt) => {
                          const isSelected = value === opt.text;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleAnswerChange(q.id, opt.text)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                padding: '10px 14px',
                                borderRadius: 16,
                                background: isSelected
                                  ? (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)')
                                  : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    border: `2px solid ${isSelected ? cardAccent : (isDarkMode ? '#64748b' : '#94a3b8')}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  {isSelected && (
                                    <div
                                      style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: cardAccent
                                      }}
                                    />
                                  )}
                                </div>
                                <span style={{
                                  fontSize: 14.5,
                                  color: isDarkMode ? '#e2e8f0' : '#334155',
                                  fontWeight: isSelected ? 750 : 500
                                }}>
                                  {opt.text}
                                </span>
                              </div>

                              {/* Option image if any */}
                              {opt.imageUrl && (
                                <div style={{ marginLeft: 32 }}>
                                  <img
                                    src={opt.imageUrl}
                                    alt={opt.text}
                                    style={{
                                      maxWidth: 220,
                                      maxHeight: 140,
                                      borderRadius: 14,
                                      objectFit: 'cover',
                                      border: '1px solid var(--cms-border)'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* CHECKBOXES (MULTI-SELECT) */}
                    {q.type === 'checkboxes' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {q.options.map((opt) => {
                          const currentVals = Array.isArray(value) ? value : [];
                          const isChecked = currentVals.includes(opt.text);
                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleCheckboxToggle(q.id, opt.text)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                padding: '10px 14px',
                                borderRadius: 16,
                                background: isChecked
                                  ? (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)')
                                  : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    border: `2px solid ${isChecked ? cardAccent : (isDarkMode ? '#64748b' : '#94a3b8')}`,
                                    background: isChecked ? cardAccent : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  {isChecked && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                                </div>
                                <span style={{
                                  fontSize: 14.5,
                                  color: isDarkMode ? '#e2e8f0' : '#334155',
                                  fontWeight: isChecked ? 750 : 500
                                }}>
                                  {opt.text}
                                </span>
                              </div>

                              {/* Option image if any */}
                              {opt.imageUrl && (
                                <div style={{ marginLeft: 32 }}>
                                  <img
                                    src={opt.imageUrl}
                                    alt={opt.text}
                                    style={{
                                      maxWidth: 220,
                                      maxHeight: 140,
                                      borderRadius: 14,
                                      objectFit: 'cover',
                                      border: '1px solid var(--cms-border)'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* DROPDOWN (CUSTOM ROUNDED PILL LIST) */}
                    {q.type === 'dropdown' && (
                      <RoundedPillDropdown
                        value={value || ''}
                        options={q.options.map((opt) => ({
                          value: opt.text,
                          label: opt.text
                        }))}
                        placeholder="-- Pilih salah satu opsi --"
                        onChange={(val) => handleAnswerChange(q.id, val)}
                        isDarkMode={isDarkMode}
                        cardAccent={cardAccent}
                        minWidth={280}
                      />
                    )}

                    {/* LINEAR SCALE */}
                    {q.type === 'linear_scale' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          {q.scaleMinLabel && (
                            <span style={{ fontSize: 12.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                              {q.scaleMinLabel}
                            </span>
                          )}
                          {Array.from(
                            { length: (q.scaleMax || 5) - (q.scaleMin || 1) + 1 },
                            (_, i) => (q.scaleMin || 1) + i
                          ).map((val) => {
                            const isSelected = value === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleAnswerChange(q.id, val)}
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: '50%',
                                  border: `2px solid ${isSelected ? cardAccent : (isDarkMode ? '#475569' : '#cbd5e1')}`,
                                  background: isSelected ? cardAccent : 'transparent',
                                  color: isSelected ? '#ffffff' : (isDarkMode ? '#f8fafc' : '#1e293b'),
                                  fontSize: 14,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {val}
                              </button>
                            );
                          })}
                          {q.scaleMaxLabel && (
                            <span style={{ fontSize: 12.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                              {q.scaleMaxLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RATING */}
                    {q.type === 'rating' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {Array.from({ length: q.ratingMax || 5 }, (_, i) => i + 1).map((starVal) => {
                          const isFilled = (value || 0) >= starVal;
                          return (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, starVal)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                color: isFilled ? '#eab308' : (isDarkMode ? '#475569' : '#cbd5e1'),
                                transition: 'transform 0.1s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              <Star size={28} fill={isFilled ? '#eab308' : 'none'} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* DATE */}
                    {q.type === 'date' && (
                      <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{
                          padding: '11px 18px',
                          borderRadius: 100,
                          border: `1.5px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                          background: isDarkMode ? '#0f172a' : '#ffffff',
                          color: isDarkMode ? '#f8fafc' : '#1e293b',
                          fontSize: 14,
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    )}

                    {/* TIME */}
                    {q.type === 'time' && (
                      <input
                        type="time"
                        value={value || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{
                          padding: '11px 18px',
                          borderRadius: 100,
                          border: `1.5px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                          background: isDarkMode ? '#0f172a' : '#ffffff',
                          color: isDarkMode ? '#f8fafc' : '#1e293b',
                          fontSize: 14,
                          fontWeight: 700,
                          outline: 'none'
                        }}
                      />
                    )}

                    {/* EMAIL */}
                    {q.type === 'email' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 420 }}>
                        <Mail size={18} color="var(--cms-text-muted)" />
                        <input
                          type="email"
                          placeholder="nama@email.com"
                          value={value || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            border: 'none',
                            borderBottom: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                            background: 'transparent',
                            color: isDarkMode ? '#f8fafc' : '#1e293b',
                            fontSize: 14.5,
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => (e.target.style.borderBottomColor = cardAccent)}
                          onBlur={(e) => (e.target.style.borderBottomColor = isDarkMode ? '#475569' : '#cbd5e1')}
                        />
                      </div>
                    )}

                    {/* PHONE / WHATSAPP */}
                    {q.type === 'phone' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 420 }}>
                        <Phone size={18} color="var(--cms-text-muted)" />
                        <input
                          type="tel"
                          placeholder="+62 812-xxxx-xxxx"
                          value={value || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            border: 'none',
                            borderBottom: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                            background: 'transparent',
                            color: isDarkMode ? '#f8fafc' : '#1e293b',
                            fontSize: 14.5,
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => (e.target.style.borderBottomColor = cardAccent)}
                          onBlur={(e) => (e.target.style.borderBottomColor = isDarkMode ? '#475569' : '#cbd5e1')}
                        />
                      </div>
                    )}

                    {/* WEBSITE */}
                    {q.type === 'website' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 450 }}>
                        <Globe size={18} color="var(--cms-text-muted)" />
                        <input
                          type="url"
                          placeholder="https://..."
                          value={value || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '10px 0',
                            border: 'none',
                            borderBottom: `2px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
                            background: 'transparent',
                            color: isDarkMode ? '#f8fafc' : '#1e293b',
                            fontSize: 14.5,
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => (e.target.style.borderBottomColor = cardAccent)}
                          onBlur={(e) => (e.target.style.borderBottomColor = isDarkMode ? '#475569' : '#cbd5e1')}
                        />
                      </div>
                    )}

                    {/* FILE UPLOAD */}
                    {q.type === 'file_upload' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{
                          border: `2px dashed ${value ? cardAccent : (isDarkMode ? '#475569' : '#cbd5e1')}`,
                          borderRadius: 18,
                          padding: '24px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          background: value ? `${cardAccent}0d` : (isDarkMode ? 'rgba(0,0,0,0.15)' : '#f8fafc'),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                          <Upload size={28} color={value ? cardAccent : 'var(--cms-text-muted)'} />
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 750, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
                              {value ? (typeof value === 'string' ? value : value.name || 'Berkas dipilih') : 'Klik untuk memilih berkas'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                              PDF, DOCX, XLSX, JPG, PNG (Maks 10MB)
                            </div>
                          </div>
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleAnswerChange(q.id, `${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
                              }
                            }}
                          />
                        </label>
                        {value && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleAnswerChange(q.id, '')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: 12,
                                fontWeight: 750,
                                cursor: 'pointer'
                              }}
                            >
                              Hapus berkas
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SIGNATURE / PERSETUJUAN */}
                    {q.type === 'signature' && (
                      <div
                        onClick={() => handleAnswerChange(q.id, !value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 18px',
                          borderRadius: 16,
                          border: `1.5px solid ${value ? cardAccent : (isDarkMode ? '#475569' : '#cbd5e1')}`,
                          background: value ? `${cardAccent}10` : (isDarkMode ? 'rgba(0,0,0,0.15)' : '#f8fafc'),
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: `2px solid ${value ? cardAccent : (isDarkMode ? '#64748b' : '#94a3b8')}`,
                            background: value ? cardAccent : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {value && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: value ? 750 : 500, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
                          Saya menyatakan dan menyetujui data yang diisikan adalah benar dan valid.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {hasError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: 12.5, fontWeight: 750 }}>
                      <AlertCircle size={15} />
                      <span>{errors[q.id]}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Navigation & Submit Buttons (Pill Design) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {totalPages > 1 && currentPage > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 24px',
                      borderRadius: 100,
                      background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                      color: isDarkMode ? '#f8fafc' : '#1e293b',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ChevronLeft size={16} />
                    <span>Sebelumnya</span>
                  </button>
                )}

                {totalPages > 1 && currentPage < totalPages ? (
                  <button
                    type="button"
                    onClick={handleNextPage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 28px',
                      borderRadius: 100,
                      background: themeColor,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 850,
                      cursor: 'pointer',
                      boxShadow: `0 4px 18px ${themeColor}45`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Berikutnya</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '13px 32px',
                      borderRadius: 100, // ROUNDED PILL
                      background: themeColor,
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 14.5,
                      fontWeight: 850,
                      cursor: isSubmitting ? 'wait' : 'pointer',
                      boxShadow: `0 4px 18px ${themeColor}45`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSubmitting ? (
                      <span>Mengirimkan...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Kirim</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Kosongkan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FormPublicView;
