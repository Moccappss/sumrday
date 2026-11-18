import React, { useState, useEffect } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';

interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

interface LPFaqSectionProps {
  isDark: boolean;
  accentColor: string;
}

const DEFAULT_STUDIO_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Bagaimana cara memulai proyek atau pemesanan desain?',
    answer: 'Anda dapat langsung menggunakan fitur Kalkulator Proyek di halaman ini untuk estimasi biaya awal, atau mengklik tombol Hubungi Kami untuk konsultasi singkat mengenai kebutuhan dan ruang lingkup proyek Anda.'
  },
  {
    id: 'faq-2',
    question: 'Berapa lama rata-rata waktu pengerjaan untuk website atau desain UI/UX?',
    answer: 'Rata-rata pengerjaan berkisar antara 7 hingga 20 hari kerja tergantung kompleksitas fitur, jumlah halaman, dan kesiapan materi konten Anda. Kami selalu memberikan timeline transparan sebelum proyek dimulai.'
  },
  {
    id: 'faq-3',
    question: 'Apakah hasil karya mendapatkan file master dan hak cipta penuh?',
    answer: 'Ya, seluruh karya yang telah selesai dan diserahterimakan menjadi hak milik penuh klien, lengkap dengan master file (Figma, file aset grafis, atau repositori kode sumber).'
  },
  {
    id: 'faq-4',
    question: 'Apakah saya bisa mengelola konten website sendiri setelah selesai?',
    answer: 'Tentu saja! Website kami dilengkapi dengan Dashboard Admin CMS mandiri yang sangat mudah digunakan tanpa perlu keahlian koding untuk mengubah teks, foto portofolio, produk katalog, dan artikel.'
  },
  {
    id: 'faq-5',
    question: 'Bagaimana sistem pembayaran dan penagihan proyek?',
    answer: 'Pembayaran umumnya dibagi menjadi 2 tahap: deposit awal (DP) sebesar 50% untuk memulai pengerjaan, dan pelunasan 50% setelah website selesai diuji coba dan siap diluncurkan secara resmi.'
  }
];

export const LPFaqSection: React.FC<LPFaqSectionProps> = ({ isDark, accentColor = '#2563eb' }) => {
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_STUDIO_FAQS);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const saved = await storage.getItem<any[]>('porto_client_faqs', []);
        if (Array.isArray(saved) && saved.length > 0) {
          setFaqs(saved);
        }
      } catch {}
    };
    loadFaqs();
  }, []);

  const toggleFaq = (idx: number) => {
    try { haptic.light(); } catch {}
    setOpenIndex(prev => prev === idx ? null : idx);
  };

  const pageBg = isDark ? '#06070a' : '#eef2f6';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#151824' : '#ffffff';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <section
      id="faq"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        maxWidth: 1040,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div data-reveal="true" style={{ textAlign: 'center', marginBottom: 44 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            borderRadius: 100,
            background: isDark ? '#1c1f2e' : '#f3f4f6',
            border: `1px solid ${borderColor}`,
            color: accentColor,
            fontSize: 11.5,
            fontWeight: 750,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 16
          }}
        >
          <HelpCircle size={13} />
          <span>Pertanyaan Umum</span>
        </div>

        <h2
          style={{
            margin: '0 0 12px',
            fontSize: 'clamp(2rem, 3.8vw, 3rem)',
            fontWeight: 850,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: textColor
          }}
        >
          Frequently Asked Questions
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)',
            color: subTextColor,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6
          }}
        >
          Jawaban ringkas seputar alur kolaborasi, estimasi pengerjaan, dan transparansi pengerjaan studio kami.
        </p>
      </div>

      {/* Accordion List (Golfngv Minimalist Style) */}
      <div
        data-reveal="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id || idx}
              style={{
                borderRadius: 22,
                border: `1px solid ${isOpen ? accentColor : borderColor}`,
                background: cardBg,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease'
              }}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 750,
                    color: textColor,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.35
                  }}
                >
                  {faq.question}
                </span>

                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isOpen ? accentColor : (isDark ? '#222533' : '#e5e7eb'),
                    color: isOpen ? '#ffffff' : textColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                </span>
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: '0 24px 22px',
                    fontSize: 14.5,
                    lineHeight: 1.65,
                    color: subTextColor
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default LPFaqSection;

