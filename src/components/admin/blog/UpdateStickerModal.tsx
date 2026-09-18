import React, { useState } from 'react';
import { 
  X, Sparkles, BarChart2, Scale, Sliders, 
  MessageSquare, Plus, Trash2, CheckCircle2, Heart, HelpCircle
} from 'lucide-react';
import { 
  UpdateSticker, UpdateStickerType, PollSticker, 
  ThisOrThatSticker, SliderRateSticker, QnASticker 
} from '../../../types/socialUpdates';

interface UpdateStickerModalProps {
  isOpen: boolean;
  initialSticker?: UpdateSticker | null;
  onClose: () => void;
  onSave: (sticker: UpdateSticker | null) => void;
}

const EMOJI_OPTIONS = ['☀️', '🔥', '☕', '⭐', '❤️', '⚡', '🏖️', '🎧', '🚀', '💯'];

export const UpdateStickerModal: React.FC<UpdateStickerModalProps> = ({
  isOpen,
  initialSticker,
  onClose,
  onSave
}) => {
  const [stickerType, setStickerType] = useState<UpdateStickerType>(initialSticker?.type || 'slider_rate');

  // Poll state
  const [pollQuestion, setPollQuestion] = useState(
    initialSticker?.type === 'poll' ? initialSticker.question : 'Fitur apa yang paling seru untuk update berikutnya?'
  );
  const [pollOptions, setPollOptions] = useState<string[]>(
    initialSticker?.type === 'poll' && initialSticker.options.length > 0
      ? initialSticker.options.map(o => o.text)
      : ['Website Portofolio Interaktif', 'Aset Skena & Icon Pack', 'Tema Musik Lo-Fi']
  );

  // This or That state
  const [totQuestion, setTotQuestion] = useState(
    initialSticker?.type === 'this_or_that' ? initialSticker.question : 'Pilih mana vibe favoritmu:'
  );
  const [totOptionA, setTotOptionA] = useState(
    initialSticker?.type === 'this_or_that' ? initialSticker.optionA.text : 'Warm Tech & Flow'
  );
  const [totEmojiA, setTotEmojiA] = useState(
    initialSticker?.type === 'this_or_that' ? (initialSticker.optionA.emoji || '☀️') : '☀️'
  );
  const [totOptionB, setTotOptionB] = useState(
    initialSticker?.type === 'this_or_that' ? initialSticker.optionB.text : 'Skena-Aesthetic Vibes'
  );
  const [totEmojiB, setTotEmojiB] = useState(
    initialSticker?.type === 'this_or_that' ? (initialSticker.optionB.emoji || '🎧') : '🎧'
  );

  // Slider Rate state
  const [sliderQuestion, setSliderQuestion] = useState(
    initialSticker?.type === 'slider_rate' ? initialSticker.question : 'Seberapa hangat vibe update ini?'
  );
  const [sliderEmoji, setSliderEmoji] = useState(
    initialSticker?.type === 'slider_rate' ? initialSticker.emoji : '☀️'
  );
  const [sliderMinLabel, setSliderMinLabel] = useState(
    initialSticker?.type === 'slider_rate' ? (initialSticker.minLabel || 'Biasa Saja') : 'Biasa Saja'
  );
  const [sliderMaxLabel, setSliderMaxLabel] = useState(
    initialSticker?.type === 'slider_rate' ? (initialSticker.maxLabel || 'Hangat Pol! ☀️') : 'Hangat Pol! ☀️'
  );
  const [previewSliderVal, setPreviewSliderVal] = useState(85);

  // QnA state
  const [qnaPrompt, setQnaPrompt] = useState(
    initialSticker?.type === 'qna' ? initialSticker.prompt : 'Tanya apa saja seputar karya & rilisan sumr.day club! ☀️'
  );
  const [qnaPlaceholder, setQnaPlaceholder] = useState(
    initialSticker?.type === 'qna' ? (initialSticker.placeholder || 'Tulis pertanyaanmu di sini...') : 'Tulis pertanyaanmu di sini...'
  );

  if (!isOpen) return null;

  // Poll helpers
  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, `Pilihan ${pollOptions.length + 1}`]);
    }
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleSave = () => {
    if (stickerType === 'poll') {
      const validOptions = pollOptions.filter(t => t.trim().length > 0);
      if (validOptions.length < 2) return;
      const poll: PollSticker = {
        type: 'poll',
        question: pollQuestion.trim() || 'Poling sumr.day club',
        options: validOptions.map((text, i) => ({
          id: `opt-${i + 1}`,
          text: text.trim(),
          votes: 0
        }))
      };
      onSave(poll);
    } else if (stickerType === 'this_or_that') {
      const tot: ThisOrThatSticker = {
        type: 'this_or_that',
        question: totQuestion.trim() || 'This or That',
        optionA: {
          id: 'opt-a',
          text: totOptionA.trim() || 'Opsi A',
          emoji: totEmojiA,
          votes: 0
        },
        optionB: {
          id: 'opt-b',
          text: totOptionB.trim() || 'Opsi B',
          emoji: totEmojiB,
          votes: 0
        }
      };
      onSave(tot);
    } else if (stickerType === 'slider_rate') {
      const rate: SliderRateSticker = {
        type: 'slider_rate',
        question: sliderQuestion.trim() || 'Beri Rating',
        emoji: sliderEmoji || '☀️',
        minLabel: sliderMinLabel.trim() || 'Biasa',
        maxLabel: sliderMaxLabel.trim() || 'Hangat Pol! ☀️',
        totalScore: 0,
        ratingsCount: 0,
        averageScore: 0
      };
      onSave(rate);
    } else if (stickerType === 'qna') {
      const qna: QnASticker = {
        type: 'qna',
        prompt: qnaPrompt.trim() || 'Tanya sumr.day club',
        placeholder: qnaPlaceholder.trim() || 'Tulis pesanmu...',
        responses: initialSticker?.type === 'qna' ? (initialSticker.responses || []) : []
      };
      onSave(qna);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 580,
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'var(--cms-card-bg, #ffffff)',
        color: 'var(--cms-text, #0f172a)',
        borderRadius: 24,
        border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxSizing: 'border-box'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 18
            }}>
              ✨
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 850, letterSpacing: '-0.01em' }}>
                Stiker Interaktif Postingan
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted, #64748b)' }}>
                Tingkatkan interaksi dengan sumr.day club lewat poling, slider rating, atau QnA.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
              background: 'transparent',
              color: 'var(--cms-text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Sticker Type Switcher Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          background: 'var(--cms-switcher-bg, rgba(0,0,0,0.04))',
          padding: 5,
          borderRadius: 16,
          border: '1px solid var(--cms-border, rgba(0,0,0,0.06))'
        }}>
          {[
            { id: 'poll', label: 'Poling', icon: BarChart2 },
            { id: 'this_or_that', label: 'A vs B', icon: Scale },
            { id: 'slider_rate', label: 'Rate Geser', icon: Sliders },
            { id: 'qna', label: 'Tanya Jawab', icon: MessageSquare },
          ].map(tab => {
            const isActive = stickerType === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStickerType(tab.id as UpdateStickerType)}
                style={{
                  padding: '9px 4px 8px',
                  borderRadius: 12,
                  border: 'none',
                  background: isActive ? '#f59e0b' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--cms-text-muted, #64748b)',
                  fontSize: 11.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                }}
              >
                <IconComp size={17} strokeWidth={isActive ? 2.5 : 2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body for Selected Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 1. POLL FORM */}
          {stickerType === 'poll' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                  Pertanyaan Poling
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Contoh: Fitur apa yang paling ditunggu?"
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                  Opsi Pilihan (Maks. 4)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pollOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleUpdatePollOption(i, e.target.value)}
                        placeholder={`Opsi ${i + 1}...`}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: '1px solid var(--cms-border, rgba(0,0,0,0.1))',
                          background: 'var(--cms-input-bg, transparent)',
                          color: 'var(--cms-text)',
                          fontSize: 12.5,
                          outline: 'none'
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(i)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: 4
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    style={{
                      marginTop: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: '1px dashed #f59e0b',
                      background: 'rgba(245, 158, 11, 0.08)',
                      color: '#f59e0b',
                      fontSize: 11.5,
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>Tambah Opsi</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* 2. THIS OR THAT FORM */}
          {stickerType === 'this_or_that' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                  Judul Pertanyaan / Pengantar
                </label>
                <input
                  type="text"
                  value={totQuestion}
                  onChange={e => setTotQuestion(e.target.value)}
                  placeholder="Contoh: Mana vibe favoritmu?"
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Option A */}
                <div style={{
                  padding: 12,
                  borderRadius: 14,
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 850, color: '#f59e0b' }}>PILIHAN A</span>
                    <select
                      value={totEmojiA}
                      onChange={e => setTotEmojiA(e.target.value)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 8,
                        background: 'var(--cms-input-bg, #fff)',
                        border: '1px solid var(--cms-border)',
                        fontSize: 13
                      }}
                    >
                      {EMOJI_OPTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={totOptionA}
                    onChange={e => setTotOptionA(e.target.value)}
                    placeholder="Nama Opsi A..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--cms-border)',
                      background: 'var(--cms-input-bg, #fff)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Option B */}
                <div style={{
                  padding: 12,
                  borderRadius: 14,
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 850, color: '#6366f1' }}>PILIHAN B</span>
                    <select
                      value={totEmojiB}
                      onChange={e => setTotEmojiB(e.target.value)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 8,
                        background: 'var(--cms-input-bg, #fff)',
                        border: '1px solid var(--cms-border)',
                        fontSize: 13
                      }}
                    >
                      {EMOJI_OPTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={totOptionB}
                    onChange={e => setTotOptionB(e.target.value)}
                    placeholder="Nama Opsi B..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--cms-border)',
                      background: 'var(--cms-input-bg, #fff)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* 3. SLIDER RATE FORM */}
          {stickerType === 'slider_rate' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                  Pertanyaan Rating
                </label>
                <input
                  type="text"
                  value={sliderQuestion}
                  onChange={e => setSliderQuestion(e.target.value)}
                  placeholder="Contoh: Seberapa hangat vibe studio sumr.day?"
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                  Pilih Emoji Geser
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSliderEmoji(em)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        border: sliderEmoji === em ? '2px solid #f59e0b' : '1px solid var(--cms-border)',
                        background: sliderEmoji === em ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        fontSize: 18,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted)' }}>
                    Label Minimal (Kiri)
                  </label>
                  <input
                    type="text"
                    value={sliderMinLabel}
                    onChange={e => setSliderMinLabel(e.target.value)}
                    placeholder="Contoh: Dingin / Biasa"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border)',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      marginTop: 4,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted)' }}>
                    Label Maksimal (Kanan)
                  </label>
                  <input
                    type="text"
                    value={sliderMaxLabel}
                    onChange={e => setSliderMaxLabel(e.target.value)}
                    placeholder="Contoh: Hangat Pol! ☀️"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--cms-border)',
                      background: 'var(--cms-input-bg, transparent)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      marginTop: 4,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* 4. QNA FORM */}
          {stickerType === 'qna' && (
            <>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                  Prompt Kotak Tanya Jawab
                </label>
                <input
                  type="text"
                  value={qnaPrompt}
                  onChange={e => setQnaPrompt(e.target.value)}
                  placeholder="Contoh: Tanya apa saja seputar sumr.day club! ☀️"
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 12,
                    border: '1.5px solid var(--cms-border, rgba(0,0,0,0.12))',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    fontWeight: 650,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, display: 'block' }}>
                  Teks Placeholder Kolom Input Pengunjung
                </label>
                <input
                  type="text"
                  value={qnaPlaceholder}
                  onChange={e => setQnaPlaceholder(e.target.value)}
                  placeholder="Contoh: Tulis pertanyaan atau sapaanmu di sini..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--cms-border)',
                    background: 'var(--cms-input-bg, transparent)',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* ── LIVE PREVIEW IN CARD ── */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 18,
          background: 'var(--cms-switcher-bg, rgba(0,0,0,0.03))',
          border: '1px dashed var(--cms-border, rgba(0,0,0,0.15))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Sparkles size={12} color="#f59e0b" />
            <span style={{ fontSize: 11, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)' }}>
              Pratinjau Live Stiker di Postingan
            </span>
          </div>

          {/* Preview: Poll */}
          {stickerType === 'poll' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.04) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 16,
              padding: 14
            }}>
              <div style={{ fontSize: 13.5, fontWeight: 850, marginBottom: 10 }}>
                {pollQuestion || 'Pertanyaan Poling'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pollOptions.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'var(--cms-card-bg, #fff)',
                      border: '1px solid var(--cms-border)',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt}</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Klik untuk vote</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview: This or That */}
          {stickerType === 'this_or_that' && (
            <div style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1.5px solid var(--cms-border)',
              borderRadius: 16,
              padding: 14
            }}>
              <div style={{ fontSize: 13, fontWeight: 850, textAlign: 'center', marginBottom: 10 }}>
                {totQuestion || 'Pilih salah satu:'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, position: 'relative' }}>
                <div style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{totEmojiA}</div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{totOptionA}</div>
                </div>
                <div style={{
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{totEmojiB}</div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{totOptionB}</div>
                </div>
              </div>
            </div>
          )}

          {/* Preview: Slider Rate */}
          {stickerType === 'slider_rate' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(251, 191, 36, 0.04) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 16,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 13.5, fontWeight: 850, marginBottom: 6 }}>
                {sliderQuestion || 'Beri rating'}
              </div>
              <div style={{
                fontSize: `${28 + (previewSliderVal / 100) * 16}px`,
                margin: '8px 0',
                transition: 'font-size 0.1s ease',
                display: 'inline-block'
              }}>
                {sliderEmoji}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={previewSliderVal}
                onChange={e => setPreviewSliderVal(Number(e.target.value))}
                style={{
                  width: '90%',
                  accentColor: '#f59e0b',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 700 }}>
                <span>{sliderMinLabel}</span>
                <span style={{ color: '#f59e0b', fontWeight: 850 }}>Geser: {previewSliderVal}% (Rata-rata 95%)</span>
                <span>{sliderMaxLabel}</span>
              </div>
            </div>
          )}

          {/* Preview: QnA */}
          {stickerType === 'qna' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
              border: '1.5px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 16,
              padding: 14
            }}>
              <div style={{ fontSize: 13, fontWeight: 850, marginBottom: 8, color: '#6366f1' }}>
                💬 {qnaPrompt || 'Tanya sumr.day club'}
              </div>
              <div style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--cms-card-bg, #fff)',
                border: '1px solid var(--cms-border)',
                fontSize: 12,
                color: 'var(--cms-text-muted)'
              }}>
                {qnaPlaceholder}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
          {initialSticker ? (
            <button
              type="button"
              onClick={() => onSave(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 100,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} />
              <span>Hapus Stiker</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: 100,
                border: '1px solid var(--cms-border)',
                background: 'transparent',
                color: 'var(--cms-text-muted)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '9px 22px',
                borderRadius: 100,
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <CheckCircle2 size={14} />
              <span>{initialSticker ? 'Perbarui Stiker' : 'Pasang Stiker'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStickerModal;
