import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Check, Sparkles, Send, Heart, Flame, Star, 
  MessageCircle, HelpCircle, CheckCircle2, ChevronRight, User
} from 'lucide-react';
import { 
  UpdateSticker, PollSticker, ThisOrThatSticker, 
  SliderRateSticker, QnASticker, QnAResponse 
} from '../../types/socialUpdates';

interface UpdateStickerRendererProps {
  postId: string;
  sticker: UpdateSticker;
  isDark?: boolean;
  accentColor?: string;
  onUpdateSticker?: (updatedSticker: UpdateSticker) => void;
}

export const UpdateStickerRenderer: React.FC<UpdateStickerRendererProps> = ({
  postId,
  sticker,
  isDark = false,
  accentColor = '#f59e0b',
  onUpdateSticker
}) => {
  // Theme styling tokens
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const borderCard = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  // ─────────────────────────────────────────────────────────────
  // 1. POLL LOGIC
  // ─────────────────────────────────────────────────────────────
  const [pollVotedId, setPollVotedId] = useState<string | null>(null);

  useEffect(() => {
    if (sticker.type === 'poll') {
      const saved = localStorage.getItem(`porto_poll_voted_${postId}`);
      if (saved) setPollVotedId(saved);
    }
  }, [postId, sticker.type]);

  const handleVotePoll = (optionId: string) => {
    if (pollVotedId || sticker.type !== 'poll') return;

    const poll = sticker as PollSticker;
    const nextOptions = poll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );

    const updatedPoll: PollSticker = {
      ...poll,
      options: nextOptions
    };

    setPollVotedId(optionId);
    localStorage.setItem(`porto_poll_voted_${postId}`, optionId);
    onUpdateSticker?.(updatedPoll);
  };

  // ─────────────────────────────────────────────────────────────
  // 2. THIS OR THAT LOGIC
  // ─────────────────────────────────────────────────────────────
  const [totVoted, setTotVoted] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    if (sticker.type === 'this_or_that') {
      const saved = localStorage.getItem(`porto_tot_voted_${postId}`) as 'A' | 'B' | null;
      if (saved) setTotVoted(saved);
    }
  }, [postId, sticker.type]);

  const handleVoteThisOrThat = (choice: 'A' | 'B') => {
    if (totVoted || sticker.type !== 'this_or_that') return;

    const tot = sticker as ThisOrThatSticker;
    const nextA = choice === 'A' ? { ...tot.optionA, votes: (tot.optionA.votes || 0) + 1 } : tot.optionA;
    const nextB = choice === 'B' ? { ...tot.optionB, votes: (tot.optionB.votes || 0) + 1 } : tot.optionB;

    const updatedTot: ThisOrThatSticker = {
      ...tot,
      optionA: nextA,
      optionB: nextB
    };

    setTotVoted(choice);
    localStorage.setItem(`porto_tot_voted_${postId}`, choice);
    onUpdateSticker?.(updatedTot);
  };

  // ─────────────────────────────────────────────────────────────
  // 3. SLIDER RATE LOGIC
  // ─────────────────────────────────────────────────────────────
  const sliderSticker = sticker.type === 'slider_rate' ? (sticker as SliderRateSticker) : null;
  const [sliderVal, setSliderVal] = useState<number>(sliderSticker?.averageScore || 85);
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (sticker.type === 'slider_rate') {
      const saved = localStorage.getItem(`porto_slider_rated_${postId}`);
      if (saved) {
        setHasRated(true);
        setUserRating(Number(saved));
        setSliderVal(Number(saved));
      }
    }
  }, [postId, sticker.type]);

  const handleSubmitSliderRate = (finalVal?: number) => {
    if (hasRated || sticker.type !== 'slider_rate') return;
    const val = finalVal !== undefined ? finalVal : sliderVal;

    const rate = sticker as SliderRateSticker;
    const prevCount = rate.ratingsCount || 0;
    const prevTotal = rate.totalScore || (rate.averageScore ? rate.averageScore * prevCount : 0);

    const newCount = prevCount + 1;
    const newTotal = prevTotal + val;
    const newAvg = Math.round(newTotal / newCount);

    const updatedRate: SliderRateSticker = {
      ...rate,
      ratingsCount: newCount,
      totalScore: newTotal,
      averageScore: newAvg
    };

    setHasRated(true);
    setUserRating(val);
    localStorage.setItem(`porto_slider_rated_${postId}`, String(val));
    onUpdateSticker?.(updatedRate);
  };

  // ─────────────────────────────────────────────────────────────
  // 4. QNA LOGIC
  // ─────────────────────────────────────────────────────────────
  const [qnaMessage, setQnaMessage] = useState('');
  const [qnaName, setQnaName] = useState('');
  const [isQnaSent, setIsQnaSent] = useState(false);
  const [showResponses, setShowResponses] = useState(false);

  const handleSubmitQnA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qnaMessage.trim() || sticker.type !== 'qna') return;

    const qna = sticker as QnASticker;
    const newResponse: QnAResponse = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: qnaMessage.trim(),
      authorName: qnaName.trim() || 'sumr.day club',
      createdAt: new Date().toISOString()
    };

    const updatedQna: QnASticker = {
      ...qna,
      responses: [newResponse, ...(qna.responses || [])]
    };

    setIsQnaSent(true);
    setQnaMessage('');
    onUpdateSticker?.(updatedQna);

    setTimeout(() => {
      setIsQnaSent(false);
    }, 4000);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER PER TYPE
  // ─────────────────────────────────────────────────────────────

  // ── 1. POLL RENDERER ──
  if (sticker.type === 'poll') {
    const totalVotes = sticker.options.reduce((acc, o) => acc + (o.votes || 0), 0);
    const hasVoted = !!pollVotedId;

    return (
      <div style={{
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 20,
        padding: '16px 18px',
        background: isDark 
          ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 20, 30, 0.7) 100%)'
          : 'linear-gradient(145deg, rgba(245, 158, 11, 0.09) 0%, rgba(254, 243, 199, 0.4) 100%)',
        border: `1.5px solid ${accentColor}35`,
        boxShadow: `0 8px 24px ${accentColor}0e`
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <span style={{
              fontSize: 11,
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: accentColor
            }}>
              Poling sumr.day club
            </span>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: textSecondary }}>
            {totalVotes} suara
          </span>
        </div>

        <div style={{
          fontSize: 14.5,
          fontWeight: 850,
          color: textPrimary,
          marginBottom: 14,
          lineHeight: 1.4
        }}>
          {sticker.question}
        </div>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sticker.options.map((opt) => {
            const votes = opt.votes || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = pollVotedId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={hasVoted}
                onClick={() => handleVotePoll(opt.id)}
                style={{
                  position: 'relative',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: isSelected ? `2px solid ${accentColor}` : `1px solid ${borderCard}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                  color: textPrimary,
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: hasVoted ? 'default' : 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 4px 14px ${accentColor}25` : 'none'
                }}
              >
                {/* Percentage progress bar fill */}
                {hasVoted && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: isSelected ? `${accentColor}30` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'none'
                  }} />
                )}

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isSelected && (
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: accentColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                  <span>{opt.text}</span>
                </div>

                <div style={{ position: 'relative', zIndex: 1, fontWeight: 800, fontSize: 13, color: isSelected ? accentColor : textSecondary }}>
                  {hasVoted ? `${pct}%` : (
                    <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>Pilih</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {hasVoted && (
          <div style={{ marginTop: 10, fontSize: 11, textAlign: 'center', color: accentColor, fontWeight: 750 }}>
            ✓ Suaramu sudah tercatat! Terima kasih telah berkontribusi ✨
          </div>
        )}
      </div>
    );
  }

  // ── 2. THIS OR THAT RENDERER ──
  if (sticker.type === 'this_or_that') {
    const votesA = sticker.optionA.votes || 0;
    const votesB = sticker.optionB.votes || 0;
    const total = votesA + votesB;
    const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
    const pctB = total > 0 ? 100 - pctA : 50;
    const hasVoted = !!totVoted;

    return (
      <div style={{
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 20,
        padding: '16px 18px',
        background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        border: `1.5px solid ${borderCard}`,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 100,
            background: `${accentColor}18`,
            color: accentColor,
            fontSize: 10.5,
            fontWeight: 850,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 6
          }}>
            ⚖️ THIS OR THAT
          </span>
          <div style={{ fontSize: 14, fontWeight: 850, color: textPrimary }}>
            {sticker.question || 'Mana yang lebih kamu suka?'}
          </div>
        </div>

        {/* Dual Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          position: 'relative'
        }}>
          {/* Central VS Badge */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: accentColor,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10.5,
            fontWeight: 900,
            boxShadow: `0 4px 12px ${accentColor}40`,
            border: `2px solid ${isDark ? '#0e0e18' : '#ffffff'}`
          }}>
            VS
          </div>

          {/* Option A */}
          <button
            type="button"
            disabled={hasVoted}
            onClick={() => handleVoteThisOrThat('A')}
            style={{
              padding: '16px 12px',
              borderRadius: 16,
              border: totVoted === 'A' ? `2px solid ${accentColor}` : `1px solid ${borderCard}`,
              background: totVoted === 'A' 
                ? (isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(254, 243, 199, 0.7)')
                : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
              color: textPrimary,
              cursor: hasVoted ? 'default' : 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: totVoted === 'A' ? `0 6px 18px ${accentColor}25` : 'none'
            }}
          >
            <div style={{ fontSize: 26 }}>{sticker.optionA.emoji || '☀️'}</div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{sticker.optionA.text}</div>
            {hasVoted && (
              <div style={{ fontSize: 15, fontWeight: 900, color: totVoted === 'A' ? accentColor : textSecondary, marginTop: 4 }}>
                {pctA}%
              </div>
            )}
          </button>

          {/* Option B */}
          <button
            type="button"
            disabled={hasVoted}
            onClick={() => handleVoteThisOrThat('B')}
            style={{
              padding: '16px 12px',
              borderRadius: 16,
              border: totVoted === 'B' ? `2px solid ${accentColor}` : `1px solid ${borderCard}`,
              background: totVoted === 'B' 
                ? (isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(254, 243, 199, 0.7)')
                : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
              color: textPrimary,
              cursor: hasVoted ? 'default' : 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: totVoted === 'B' ? `0 6px 18px ${accentColor}25` : 'none'
            }}
          >
            <div style={{ fontSize: 26 }}>{sticker.optionB.emoji || '🎧'}</div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{sticker.optionB.text}</div>
            {hasVoted && (
              <div style={{ fontSize: 15, fontWeight: 900, color: totVoted === 'B' ? accentColor : textSecondary, marginTop: 4 }}>
                {pctB}%
              </div>
            )}
          </button>
        </div>

        {hasVoted && (
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11.5, color: textSecondary, fontWeight: 650 }}>
            {total} anggota telah memilih pilihan mereka
          </div>
        )}
      </div>
    );
  }

  // ── 3. SLIDER RATE RENDERER (DENGAN RATA-RATA VOTER) ──
  if (sticker.type === 'slider_rate') {
    const avg = sticker.averageScore || 0;
    const count = sticker.ratingsCount || 0;

    return (
      <div style={{
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 22,
        padding: '18px 20px',
        background: isDark 
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 20, 32, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(254, 243, 199, 0.5) 100%)',
        border: `1.5px solid ${accentColor}40`,
        boxShadow: `0 8px 30px ${accentColor}12`,
        textAlign: 'center'
      }}>
        {/* Top Header & Average Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 15 }}>🎚️</span>
            <span style={{
              fontSize: 11,
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: accentColor
            }}>
              SLIDER RATING
            </span>
          </div>

          {/* Rata-Rata Rating Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 100,
            background: `${accentColor}25`,
            border: `1px solid ${accentColor}45`,
            color: accentColor,
            fontSize: 12,
            fontWeight: 850
          }}>
            <span>Rata-rata: {avg > 0 ? `${avg}%` : 'Belum ada'}</span>
            {count > 0 && <span style={{ opacity: 0.7, fontSize: 11 }}>({count} voter)</span>}
          </div>
        </div>

        {/* Question */}
        <div style={{ fontSize: 15, fontWeight: 850, color: textPrimary, marginBottom: 10 }}>
          {sticker.question}
        </div>

        {/* Dynamic Emoji Scale */}
        <div style={{
          fontSize: `${32 + (sliderVal / 100) * 22}px`,
          margin: '6px 0',
          transition: 'font-size 0.1s ease',
          display: 'inline-block',
          filter: `drop-shadow(0 4px 12px ${accentColor}40)`
        }}>
          {sticker.emoji || '☀️'}
        </div>

        {/* Slider Input */}
        <div style={{ padding: '0 8px', margin: '8px 0 10px' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderVal}
            disabled={hasRated}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            onMouseUp={() => !hasRated && handleSubmitSliderRate(sliderVal)}
            onTouchEnd={() => !hasRated && handleSubmitSliderRate(sliderVal)}
            style={{
              width: '100%',
              height: 8,
              borderRadius: 6,
              accentColor: accentColor,
              cursor: hasRated ? 'default' : 'pointer'
            }}
          />
        </div>

        {/* Labels & Feedback */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11.5,
          color: textSecondary,
          fontWeight: 700,
          padding: '0 6px'
        }}>
          <span>{sticker.minLabel || 'Biasa'}</span>
          <span style={{ color: accentColor, fontWeight: 850, fontSize: 13 }}>
            {hasRated ? `Nilaimu: ${userRating}% ✨` : `Geser: ${sliderVal}%`}
          </span>
          <span>{sticker.maxLabel || 'Hangat Pol! ☀️'}</span>
        </div>

        {!hasRated && (
          <button
            type="button"
            onClick={() => handleSubmitSliderRate(sliderVal)}
            style={{
              marginTop: 12,
              padding: '6px 18px',
              borderRadius: 100,
              border: 'none',
              background: `linear-gradient(135deg, ${accentColor} 0%, #d97706 100%)`,
              color: '#fff',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${accentColor}35`
            }}
          >
            Kirim Rating
          </button>
        )}
      </div>
    );
  }

  // ── 4. QNA / TANYA JAWAB RENDERER ──
  if (sticker.type === 'qna') {
    const responses = sticker.responses || [];

    return (
      <div style={{
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 20,
        padding: '16px 18px',
        background: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.04)',
        border: '1.5px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.06)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <span style={{
              fontSize: 11,
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#6366f1'
            }}>
              KOTAK TANYA JAWAB
            </span>
          </div>
          {responses.length > 0 && (
            <button
              type="button"
              onClick={() => setShowResponses(!showResponses)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontSize: 11.5,
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              {showResponses ? 'Tutup Respon' : `Lihat ${responses.length} Respon`}
            </button>
          )}
        </div>

        <div style={{ fontSize: 14.5, fontWeight: 850, color: textPrimary, marginBottom: 12, lineHeight: 1.4 }}>
          {sticker.prompt}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmitQnA} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={qnaMessage}
              onChange={(e) => setQnaMessage(e.target.value)}
              placeholder={sticker.placeholder || 'Ketik pertanyaan atau sapaanmu...'}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 12,
                border: `1px solid ${borderCard}`,
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                color: textPrimary,
                fontSize: 13,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!qnaMessage.trim()}
              style={{
                padding: '0 18px',
                borderRadius: 12,
                border: 'none',
                background: qnaMessage.trim() ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 750,
                cursor: qnaMessage.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={13} />
              <span>Kirim</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: textSecondary }}>Dari:</span>
            <input
              type="text"
              value={qnaName}
              onChange={(e) => setQnaName(e.target.value)}
              placeholder="Nama kamu (opsional)"
              style={{
                maxWidth: 180,
                padding: '4px 8px',
                borderRadius: 8,
                border: `1px solid ${borderCard}`,
                background: 'transparent',
                color: textPrimary,
                fontSize: 11,
                outline: 'none'
              }}
            />
          </div>
        </form>

        {isQnaSent && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: 12,
            fontWeight: 750,
            textAlign: 'center'
          }}>
            ✓ Pesanmu terkirim ke sumr.day studio! ☀️
          </div>
        )}

        {/* Responses Accordion / Stream */}
        {showResponses && responses.length > 0 && (
          <div style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `1px dashed ${borderCard}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 220,
            overflowY: 'auto'
          }}>
            {responses.map((res) => (
              <div
                key={res.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  border: `1px solid ${borderCard}`,
                  fontSize: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, color: '#6366f1' }}>
                    {(res.authorName || 'sumr.day club').replace(/^kawan\s+/i, '').replace(/^kawan\s*-\s*kawan\s+/i, '') || 'sumr.day club'}
                  </span>
                  <span style={{ fontSize: 10, color: textSecondary }}>
                    {new Date(res.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div style={{ color: textPrimary, lineHeight: 1.4 }}>{res.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default UpdateStickerRenderer;
