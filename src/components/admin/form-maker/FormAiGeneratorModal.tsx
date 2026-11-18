import React, { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, Lightbulb, CheckCircle2 } from 'lucide-react';
import { callGemini, getGeminiKey } from '../../../utils/ai';
import type { FormSchema, FormQuestion } from './formTypes';

interface FormAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormCreated: (form: FormSchema) => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

const QUICK_PROMPTS = [
  'Survei Kepuasan Klien & Rating Layanan',
  'Pendaftaran Webinar & Workshop Online',
  'Brief Desain Logo & Brand Identity',
  'Formulir Lamaran Kerja & Portofolio',
  'Booking Sesi Foto & Video Studio',
  'Pre-Order Merchandise & Kaos Custom'
];

export const FormAiGeneratorModal: React.FC<FormAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onFormCreated,
  notify,
  isDarkMode = true
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Harap masukkan deskripsi formulir yang ingin dibuat.');
      return;
    }

    const apiKey = getGeminiKey();
    if (!apiKey || apiKey.length < 10) {
      setError('API Key Google Gemini belum diatur. Silakan konfigurasi di menu Pengaturan -> AI & Automasi.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const systemInstruction = `Kamu adalah pakar pembuatan formulir dan survei profesional untuk Google Forms & Typeform.
Tugas: Buat formulir lengkap berdasarkan instruksi pengguna dan kembalikan HANYA JSON MURNI tanpa format markdown apapun (tanpa \`\`\`json).

Format JSON yang wajib diikuti:
{
  "title": "Judul Formulir yang Menarik",
  "description": "Deskripsi singkat dan ramah yang menjelaskan tujuan pengisian formulir.",
  "themeColor": "#673ab7",
  "questions": [
    {
      "id": "q_1",
      "type": "short_text" | "paragraph" | "multiple_choice" | "checkboxes" | "dropdown" | "linear_scale" | "rating" | "date" | "time",
      "title": "Teks pertanyaan yang jelas",
      "required": true,
      "page": 1,
      "options": [
        { "id": "opt_1", "text": "Opsi A" },
        { "id": "opt_2", "text": "Opsi B" }
      ],
      "scaleMin": 1,
      "scaleMax": 5,
      "scaleMinLabel": "Label minimum",
      "scaleMaxLabel": "Label maksimum"
    }
  ]
}

Aturan Penting:
1. Variasikan jenis pertanyaan (short_text, multiple_choice, dropdown, rating, linear_scale, paragraph, dll.) sesuai kebutuhan topik.
2. Buat 4 sampai 7 pertanyaan yang mendalam dan realistis dalam Bahasa Indonesia yang profesional dan ramah.
3. Untuk tipe multiple_choice, checkboxes, dan dropdown, berikan 3-5 opsi yang logis.
4. Gunakan tema warna heksadesimal yang serasi (misal #673ab7, #0284c7, #059669, #e11d48, #d97706).
5. Jangan gunakan emoji pada judul pertanyaan atau opsi.
6. HANYA cetak JSON tanpa teks pembuka atau penutup.`;

    try {
      const response = await callGemini(prompt, systemInstruction, 2500, true);

      // Sanitize JSON
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleaned);

      if (!parsed.title || !Array.isArray(parsed.questions)) {
        throw new Error('Format JSON AI tidak valid.');
      }

      const newForm: FormSchema = {
        id: 'form_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title: parsed.title,
        description: parsed.description || '',
        themeColor: parsed.themeColor || '#673ab7',
        acceptingResponses: true,
        autoSaveDrive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: parsed.questions.map((q: any, idx: number) => ({
          id: 'q_' + Math.random().toString(36).slice(2, 7),
          type: q.type || 'short_text',
          title: q.title || `Pertanyaan ${idx + 1}`,
          required: Boolean(q.required),
          page: q.page || 1,
          options: Array.isArray(q.options)
            ? q.options.map((o: any) => ({
                id: 'opt_' + Math.random().toString(36).slice(2, 7),
                text: typeof o === 'string' ? o : o.text || 'Opsi'
              }))
            : [],
          scaleMin: q.scaleMin || 1,
          scaleMax: q.scaleMax || 5,
          scaleMinLabel: q.scaleMinLabel,
          scaleMaxLabel: q.scaleMaxLabel
        }))
      };

      onFormCreated(newForm);
      onClose();
      if (notify) notify(`Formulir "${newForm.title}" berhasil dibuat oleh AI!`);
    } catch (err: any) {
      console.error('Failed to generate form via AI:', err);
      setError('Gagal membuat formulir dengan AI. Pastikan prompt jelas dan koneksi Gemini API aktif.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: 24,
          padding: '24px 28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'cmsPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>
                AI Form Generator
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Buat formulir cerdas otomatis dalam hitungan detik
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
            <X size={18} />
          </button>
        </div>

        {/* Prompt Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 800, color: isDarkMode ? '#e2e8f0' : '#334155' }}>
            Deskripsikan Formulir yang Anda Inginkan:
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Contoh: Buatkan kuesioner pendaftaran lomba desain UI/UX dengan 6 pertanyaan, ada pilihan paket lomba, tautan portofolio, dan skala rating kepuasan..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 16,
              border: `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              background: isDarkMode ? '#0f172a' : '#f8fafc',
              color: isDarkMode ? '#f8fafc' : '#1e293b',
              fontSize: 13.5,
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none'
            }}
          />
        </div>

        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 750, color: 'var(--cms-text-muted)' }}>
            <Lightbulb size={14} color="#f59e0b" />
            <span>Saran Cepat:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(`Buatkan ${item} dengan pertanyaan lengkap, terstruktur dan profesional.`)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  color: isDarkMode ? '#cbd5e1' : '#475569',
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.color = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
                  e.currentTarget.style.color = isDarkMode ? '#cbd5e1' : '#475569';
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: 12.5,
              fontWeight: 700
            }}
          >
            {error}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 100,
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#94a3b8' : '#64748b',
              fontSize: 13,
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 24px',
              borderRadius: 100,
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: '#ffffff',
              border: 'none',
              fontSize: 13.5,
              fontWeight: 850,
              cursor: isGenerating ? 'wait' : 'pointer',
              boxShadow: '0 4px 18px rgba(139, 92, 246, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="cms-spin" />
                <span>Membuat...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Buat Formulir</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormAiGeneratorModal;
