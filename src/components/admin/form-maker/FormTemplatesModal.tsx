import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, Search, X, Layers, ArrowRight, FileText,
  Briefcase, BarChart3, Users, GraduationCap, Palette, ShoppingBag
} from 'lucide-react';
import { OFFLINE_FORM_TEMPLATES, FORM_CATEGORIES, type FormTemplateItem } from './formTemplatesData';
import type { FormSchema } from './formTypes';

interface FormTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (schema: Omit<FormSchema, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isDarkMode?: boolean;
}

const getCategoryIcon = (category: string, size = 18) => {
  switch (category) {
    case 'business':
      return <Briefcase size={size} />;
    case 'survey':
      return <BarChart3 size={size} />;
    case 'hr':
      return <Users size={size} />;
    case 'education':
      return <GraduationCap size={size} />;
    case 'creative':
      return <Palette size={size} />;
    case 'order':
      return <ShoppingBag size={size} />;
    default:
      return <FileText size={size} />;
  }
};

export const FormTemplatesModal: React.FC<FormTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  isDarkMode = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTemplates = useMemo(() => {
    return OFFLINE_FORM_TEMPLATES.filter((tmpl) => {
      const matchCat = selectedCategory === 'all' || tmpl.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 1040,
          height: '88vh',
          maxHeight: '88vh',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          animation: 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 28px 16px 28px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'rgba(103, 58, 183, 0.15)',
                  color: '#673ab7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LayoutGrid size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
                  Koleksi Template Formulir
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  Pilih dari {OFFLINE_FORM_TEMPLATES.length} template siap pakai dengan pertanyaan terstruktur
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cms-text-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: '50%'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Search bar & Category Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 100,
                background: isDarkMode ? '#0f172a' : '#f1f5f9',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                minWidth: 220,
                flex: 1
              }}
            >
              <Search size={15} color="var(--cms-text-muted)" />
              <input
                type="text"
                placeholder="Cari template formulir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: isDarkMode ? '#f8fafc' : '#1e293b',
                  fontSize: 13,
                  outline: 'none',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {FORM_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 100,
                      border: isSelected ? '1.5px solid #673ab7' : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                      background: isSelected ? 'rgba(103, 58, 183, 0.15)' : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff'),
                      color: isSelected ? (isDarkMode ? '#c4b5fd' : '#673ab7') : (isDarkMode ? '#cbd5e1' : '#64748b'),
                      fontSize: 12,
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Body: Templates Grid */}
        <div
          style={{
            padding: '20px 28px 28px 28px',
            overflowY: 'auto',
            minHeight: 0,
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            alignContent: 'start',
            gap: 16
          }}
        >
          {filteredTemplates.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '48px 20px',
                color: 'var(--cms-text-muted)',
                fontSize: 14
              }}
            >
              Tidak ditemukan template yang cocok dengan kata kunci & kategori ini.
            </div>
          ) : (
            filteredTemplates.map((tmpl) => {
              const hasMultiPage = tmpl.schema.questions.some((q) => (q.page || 1) > 1);
              return (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    onSelectTemplate(tmpl.schema);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 20,
                    padding: '18px 20px 16px 20px',
                    boxSizing: 'border-box',
                    border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    background: isDarkMode ? '#0f172a' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isDarkMode ? '0 4px 18px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
                    position: 'relative',
                    gap: 12,
                    minHeight: 190,
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = tmpl.themeColor;
                    e.currentTarget.style.boxShadow = `0 14px 32px ${tmpl.themeColor}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                    e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 18px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)';
                  }}
                >
                  {/* Header Row: Category Badge & Soal Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 100,
                        background: `${tmpl.themeColor}15`,
                        color: tmpl.themeColor,
                        fontSize: 11.5,
                        fontWeight: 800,
                        letterSpacing: '0.01em'
                      }}
                    >
                      {getCategoryIcon(tmpl.category, 13)}
                      <span>{tmpl.categoryLabel}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {hasMultiPage && (
                        <span
                          title="Formulir Multi-Halaman"
                          style={{
                            fontSize: 11,
                            fontWeight: 750,
                            padding: '3px 8px',
                            borderRadius: 100,
                            background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                            color: isDarkMode ? '#94a3b8' : '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3.5
                          }}
                        >
                          <Layers size={11} />
                          <span>Multi-Step</span>
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 750,
                          color: isDarkMode ? '#94a3b8' : '#64748b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <FileText size={12} />
                        <span>{tmpl.questionCount} Soal</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 850,
                        color: isDarkMode ? '#f8fafc' : '#0f172a',
                        lineHeight: 1.35
                      }}
                    >
                      {tmpl.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {tmpl.description}
                    </p>
                  </div>

                  {/* Card Footer Action (Firmly docked inside the card) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      flexShrink: 0,
                      marginTop: 'auto'
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: tmpl.themeColor }} />
                      <span>Siap Pakai</span>
                    </span>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 12px',
                        borderRadius: 100,
                        background: `${tmpl.themeColor}18`,
                        color: tmpl.themeColor,
                        fontSize: 11.5,
                        fontWeight: 800,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>Gunakan</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FormTemplatesModal;
