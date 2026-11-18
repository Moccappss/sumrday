import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, BarChart3, Check, Sparkles, Send, Heart, Flame, Star, 
  MessageCircle, MessageSquare, HelpCircle, CheckCircle2, ChevronRight, User,
  ShoppingBag, ExternalLink, Timer, ArrowRight, Zap, FolderGit2, Package, FileText, BookOpen,
  SlidersHorizontal, Scale, Award
} from 'lucide-react';
import { 
  UpdateSticker, PollSticker, ThisOrThatSticker, 
  SliderRateSticker, QnASticker, QnAResponse,
  ProductSticker, PortfolioSticker, ArticleSticker, FlashSaleSticker
} from '../../types/socialUpdates';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';

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
  const navigate = useNavigate();
  // Theme styling tokens
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const borderCard = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  // Live Catalog Sync for Product & Flash Sale Stickers
  const [liveCatalogProduct, setLiveCatalogProduct] = useState<any>(null);

  useEffect(() => {
    if (sticker.type === 'flash_sale' || sticker.type === 'product_card') {
      const pId = (sticker as any).productId;
      if (pId) {
        storage.getItem('porto_catalog_products', []).then((list: any[]) => {
          if (Array.isArray(list)) {
            const found = list.find((p: any) => p.id === pId);
            if (found) setLiveCatalogProduct(found);
          }
        }).catch(() => {});
      }
    }
  }, [sticker]);

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
    if (sticker.type !== 'slider_rate') return;
    const val = finalVal !== undefined ? finalVal : sliderVal;
    haptic.success();

    const rate = sticker as SliderRateSticker;
    const prevCount = rate.ratingsCount || 0;
    const prevTotal = rate.totalScore || (rate.averageScore ? rate.averageScore * prevCount : 0);

    const prevUserScore = userRating;
    const newCount = prevUserScore !== null ? Math.max(1, prevCount) : prevCount + 1;
    const newTotal = prevUserScore !== null ? Math.max(0, prevTotal - prevUserScore + val) : prevTotal + val;
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
        marginTop: 10,
        marginBottom: 8,
        borderRadius: 16,
        padding: '14px 16px',
        background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${borderCard}`,
        boxShadow: 'none'
      }}>
        {/* Header: Question & Total Votes */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: textPrimary,
            lineHeight: 1.4
          }}>
            {sticker.question}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: textSecondary, whiteSpace: 'nowrap', paddingTop: 2 }}>
            {totalVotes} suara
          </span>
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
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: isSelected ? `1.5px solid ${accentColor}` : `1px solid ${borderCard}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                  color: textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: hasVoted ? 'default' : 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.18s ease'
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
                    background: isSelected ? `${accentColor}25` : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'none'
                  }} />
                )}

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isSelected && (
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: accentColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                  <span>{opt.text}</span>
                </div>

                <div style={{ position: 'relative', zIndex: 1, fontWeight: 700, fontSize: 12.5, color: isSelected ? accentColor : textSecondary }}>
                  {hasVoted ? `${pct}%` : (
                    <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.65 }}>Pilih</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {hasVoted && (
          <div style={{ marginTop: 8, fontSize: 11, textAlign: 'center', color: accentColor, fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <CheckCircle2 size={11} color={accentColor} />
            <span>Pilihan tersimpan</span>
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
        marginTop: 10,
        marginBottom: 8,
        borderRadius: 16,
        padding: '14px 16px',
        background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${borderCard}`,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary }}>
            {sticker.question || 'Pilih salah satu'}
          </div>
          {total > 0 && (
            <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
              {total} orang telah memilih
            </div>
          )}
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
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: isDark ? '#1e2230' : '#ffffff',
            color: textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9.5,
            fontWeight: 800,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            border: `1px solid ${borderCard}`
          }}>
            vs
          </div>

          {/* Option A */}
          <button
            type="button"
            disabled={hasVoted}
            onClick={() => handleVoteThisOrThat('A')}
            style={{
              padding: '12px 10px',
              borderRadius: 12,
              border: totVoted === 'A' ? `1.5px solid ${accentColor}` : `1px solid ${borderCard}`,
              background: totVoted === 'A' 
                ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
                : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
              color: textPrimary,
              cursor: hasVoted ? 'default' : 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.18s ease'
            }}
          >
            {sticker.optionA.emoji && <div style={{ fontSize: 20 }}>{sticker.optionA.emoji}</div>}
            <div style={{ fontSize: 12.5, fontWeight: 650 }}>{sticker.optionA.text}</div>
            {hasVoted && (
              <div style={{ fontSize: 13, fontWeight: 800, color: totVoted === 'A' ? accentColor : textSecondary, marginTop: 2 }}>
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
              padding: '12px 10px',
              borderRadius: 12,
              border: totVoted === 'B' ? `1.5px solid ${accentColor}` : `1px solid ${borderCard}`,
              background: totVoted === 'B' 
                ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
                : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
              color: textPrimary,
              cursor: hasVoted ? 'default' : 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.18s ease'
            }}
          >
            {sticker.optionB.emoji && <div style={{ fontSize: 20 }}>{sticker.optionB.emoji}</div>}
            <div style={{ fontSize: 12.5, fontWeight: 650 }}>{sticker.optionB.text}</div>
            {hasVoted && (
              <div style={{ fontSize: 13, fontWeight: 800, color: totVoted === 'B' ? accentColor : textSecondary, marginTop: 2 }}>
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
        marginTop: 10,
        marginBottom: 8,
        borderRadius: 16,
        padding: '14px 16px',
        background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${borderCard}`,
        textAlign: 'center',
        position: 'relative'
      }}>
        <style>{`
          .sumr-slider-rate-range {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 7px;
            border-radius: 99px;
            outline: none;
            cursor: pointer;
            touch-action: none !important;
            transition: all 0.08s ease;
          }
          .sumr-slider-rate-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #ffffff;
            border: 2.5px solid ${accentColor};
            box-shadow: none;
            cursor: pointer;
            transition: transform 0.1s ease;
          }
          .sumr-slider-rate-range:active::-webkit-slider-thumb {
            cursor: grabbing;
            transform: scale(1.15);
            box-shadow: none;
          }
          .sumr-slider-rate-range::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #ffffff;
            border: 2.5px solid ${accentColor};
            box-shadow: none;
            cursor: pointer;
          }
        `}</style>

        {/* Top Header: Question & Average Rating */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, lineHeight: 1.4, textAlign: 'left' }}>
            {sticker.question}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 100,
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            border: `1px solid ${borderCard}`,
            color: textSecondary,
            fontSize: 11,
            fontWeight: 650,
            whiteSpace: 'nowrap'
          }}>
            <Star size={10} fill={accentColor} color={accentColor} />
            <span>{avg > 0 ? `${avg}%` : '-'}</span>
            {count > 0 && <span style={{ opacity: 0.65, fontSize: 10 }}>({count})</span>}
          </div>
        </div>

        {/* Sleek Gradient-Filled Slider Track */}
        <div style={{ padding: '0 2px', margin: '4px 0 8px' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            onPointerUp={() => handleSubmitSliderRate(sliderVal)}
            onTouchEnd={() => handleSubmitSliderRate(sliderVal)}
            onMouseUp={() => handleSubmitSliderRate(sliderVal)}
            onKeyUp={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter') {
                handleSubmitSliderRate(sliderVal);
              }
            }}
            className="sumr-slider-rate-range"
            style={{
              background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${sliderVal}%, ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)'} ${sliderVal}%, ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)'} 100%)`,
              touchAction: 'none'
            }}
          />
        </div>

        {/* Labels & Live Value Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: textSecondary,
          fontWeight: 600,
          padding: '0 2px'
        }}>
          <span>{sticker.minLabel || 'Cukup'}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 9px',
            borderRadius: 100,
            background: hasRated && sliderVal === userRating ? 'rgba(16, 185, 129, 0.12)' : `${accentColor}14`,
            border: `1px solid ${hasRated && sliderVal === userRating ? 'rgba(16, 185, 129, 0.35)' : `${accentColor}28`}`,
            color: hasRated && sliderVal === userRating ? '#10b981' : accentColor,
            fontWeight: 700,
            fontSize: 11
          }}>
            {hasRated && sliderVal === userRating ? (
              <>
                <CheckCircle2 size={11} />
                <span>Tersimpan: {userRating}%</span>
              </>
            ) : (
              <span>{sliderVal}%</span>
            )}
          </span>
          <span>{sticker.maxLabel || 'Sangat Memuaskan'}</span>
        </div>
      </div>
    );
  }

  // ── 4. QNA / TANYA JAWAB RENDERER ──
  if (sticker.type === 'qna') {
    const responses = sticker.responses || [];

    return (
      <div style={{
        marginTop: 10,
        marginBottom: 8,
        borderRadius: 16,
        padding: '14px 16px',
        background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${borderCard}`
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: textPrimary, lineHeight: 1.4 }}>
            {sticker.prompt || 'Tanya Jawab'}
          </div>
          {responses.length > 0 && (
            <button
              type="button"
              onClick={() => setShowResponses(!showResponses)}
              style={{
                background: 'none',
                border: 'none',
                color: accentColor,
                fontSize: 11,
                fontWeight: 650,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                paddingTop: 2
              }}
            >
              {showResponses ? 'Tutup Respon' : `${responses.length} Respon`}
            </button>
          )}
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
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            <CheckCircle2 size={13.5} color="#10b981" />
            <span>Pesanmu berhasil terkirim ke sumr.day studio!</span>
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

  // ─────────────────────────────────────────────────────────────
  // 5. PRODUCT CARD STICKER
  // ─────────────────────────────────────────────────────────────
  if (sticker.type === 'product_card') {
    const prodSticker = sticker as ProductSticker;
    const formatRupiah = (v: string | number) => {
      if (!v) return 'Rp 0';
      if (typeof v === 'string' && v.startsWith('Rp')) return v;
      const num = typeof v === 'number' ? v : parseInt(String(v).replace(/\D/g, ''), 10) || 0;
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    // Live catalog synchronization for inventory, price, and media
    const effectivePrice = liveCatalogProduct?.price !== undefined ? liveCatalogProduct.price : prodSticker.price;
    const effectiveOriginalPrice = liveCatalogProduct?.originalPrice || prodSticker.originalPrice;
    const effectiveImage = liveCatalogProduct?.image || liveCatalogProduct?.gallery?.[0] || prodSticker.imageUrl;
    const effectiveTitle = liveCatalogProduct?.name || prodSticker.title;
    const liveStock = typeof liveCatalogProduct?.stock === 'number' ? liveCatalogProduct.stock : undefined;
    const isOutOfStock = liveStock !== undefined && liveStock <= 0;
    const isLowStock = liveStock !== undefined && liveStock > 0 && liveStock <= 5;

    return (
      <div style={{
        marginTop: 10,
        marginBottom: 8,
        padding: '12px 14px',
        borderRadius: 16,
        background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${borderCard}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220, flex: '1 1 auto' }}>
          {effectiveImage ? (
            <img 
              src={effectiveImage} 
              alt={effectiveTitle}
              style={{ 
                width: 72, 
                height: 72, 
                borderRadius: 14, 
                objectFit: 'cover', 
                border: isOutOfStock ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
                filter: isOutOfStock ? 'grayscale(0.6)' : 'none'
              }}
            />
          ) : (
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              background: isOutOfStock ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOutOfStock ? '#ef4444' : '#10b981'
            }}>
              <ShoppingBag size={28} />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 100,
                background: isOutOfStock ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                color: isOutOfStock ? '#ef4444' : '#10b981',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                {isOutOfStock ? 'STOK HABIS' : (prodSticker.badge || 'PRODUK KATALOG')}
              </span>
              {isLowStock && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 100,
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#f59e0b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}>
                  <Flame size={11} color="#f59e0b" fill="#f59e0b" />
                  <span>Sisa {liveStock}</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 850, color: textPrimary, marginBottom: 4 }}>
              {effectiveTitle}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: isOutOfStock ? '#94a3b8' : '#10b981' }}>
                {formatRupiah(effectivePrice)}
              </span>
              {effectiveOriginalPrice && Number(effectiveOriginalPrice) > Number(effectivePrice) && (
                <span style={{ fontSize: 12, color: textSecondary, textDecoration: 'line-through' }}>
                  {formatRupiah(effectiveOriginalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            window.dispatchEvent(new CustomEvent('porto_open_product_modal', {
              detail: {
                productId: prodSticker.productId,
                sticker: {
                  ...prodSticker,
                  price: effectivePrice,
                  originalPrice: effectiveOriginalPrice,
                  title: effectiveTitle,
                  imageUrl: effectiveImage
                },
                product: liveCatalogProduct
              }
            }));
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: isOutOfStock ? '#64748b' : '#10b981',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: isOutOfStock ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>{isOutOfStock ? 'Tanya Restock via WA' : (prodSticker.buttonText || 'Lihat di Store')}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 6. PORTFOLIO CARD STICKER
  // ─────────────────────────────────────────────────────────────
  if (sticker.type === 'portfolio_card') {
    const portSticker = sticker as PortfolioSticker;
    return (
      <div style={{
        marginTop: 10,
        marginBottom: 8,
        padding: '12px 14px',
        borderRadius: 16,
        background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${borderCard}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220, flex: '1 1 auto' }}>
          {portSticker.imageUrl ? (
            <img 
              src={portSticker.imageUrl} 
              alt={portSticker.title}
              style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(99, 102, 241, 0.2)' }}
            />
          ) : (
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1'
            }}>
              <FolderGit2 size={28} />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 100,
                background: 'rgba(99, 102, 241, 0.18)',
                color: '#6366f1',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                {portSticker.category || 'KARYA TERPILIH'}
              </span>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 850, color: textPrimary, marginBottom: 4 }}>
              {portSticker.title}
            </div>
            <div style={{ fontSize: 12, color: textSecondary }}>
              Studi kasus & dokumentasi proses visual
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const url = portSticker.projectUrl || '/portfolio';
            if (url.startsWith('#')) {
              document.querySelector(url)?.scrollIntoView({ behavior: 'smooth' });
            } else {
              navigate(url);
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: '#6366f1',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>{portSticker.buttonText || 'Lihat Karya'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 6.5 ARTICLE CARD STICKER
  // ─────────────────────────────────────────────────────────────
  if (sticker.type === 'article_card') {
    const artSticker = sticker as ArticleSticker;
    return (
      <div style={{
        marginTop: 10,
        marginBottom: 8,
        padding: '12px 14px',
        borderRadius: 16,
        background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${borderCard}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220, flex: '1 1 auto' }}>
          {artSticker.imageUrl ? (
            <img 
              src={artSticker.imageUrl} 
              alt={artSticker.title}
              style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(245, 158, 11, 0.25)' }}
            />
          ) : (
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b'
            }}>
              <BookOpen size={28} />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 100,
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#f59e0b',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                {artSticker.category || 'ARTIKEL PILIHAN'}
              </span>
              {artSticker.readTime && (
                <span style={{ fontSize: 11, color: textSecondary, fontWeight: 600 }}>
                  • {artSticker.readTime}
                </span>
              )}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 850, color: textPrimary, marginBottom: 4 }}>
              {artSticker.title}
            </div>
            <div style={{ fontSize: 12, color: textSecondary }}>
              Wawasan & studi kasus arsitektur web modern
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const url = artSticker.articleUrl || '/blog';
            navigate(url);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>{artSticker.buttonText || 'Baca Artikel'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 7. FLASH SALE STICKER WITH COUNTDOWN & AUTO POPUP
  // ─────────────────────────────────────────────────────────────
  if (sticker.type === 'flash_sale') {
    const fsSticker = sticker as FlashSaleSticker;
    const formatRupiah = (v: string | number) => {
      if (!v) return 'Rp 0';
      if (typeof v === 'string' && v.startsWith('Rp')) return v;
      const num = typeof v === 'number' ? v : parseInt(String(v).replace(/\D/g, ''), 10) || 0;
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    // Real-time synchronization with live catalog product
    const liveFs = liveCatalogProduct?.flashSale?.isActive ? liveCatalogProduct.flashSale : null;
    const effectiveSalePrice = liveFs?.salePrice || fsSticker.salePrice || 0;
    const effectiveOriginalPrice = liveFs?.originalPrice || fsSticker.originalPrice || liveCatalogProduct?.price || 0;
    const effectiveEndTime = liveFs?.endTime || fsSticker.endTime;
    const effectiveStockLeft = liveFs?.stockLeft !== undefined ? liveFs.stockLeft : fsSticker.stockLeft;

    const calcDiscount = () => {
      if (liveFs?.discountPercent) return liveFs.discountPercent;
      if (fsSticker.discountPercent) return fsSticker.discountPercent;
      const orig = Number(effectiveOriginalPrice) || 0;
      const sale = Number(effectiveSalePrice) || 0;
      if (orig > sale && orig > 0) {
        return Math.round(((orig - sale) / orig) * 100);
      }
      return 50;
    };

    const effectiveDiscount = calcDiscount();

    // Trigger Pop-up directly with discounted item
    const handleOpenFlashSaleModal = () => {
      haptic.medium();
      window.dispatchEvent(new CustomEvent('porto_open_flash_sale_modal', {
        detail: {
          productId: fsSticker.productId,
          sticker: {
            ...fsSticker,
            salePrice: effectiveSalePrice,
            originalPrice: effectiveOriginalPrice,
            discountPercent: effectiveDiscount,
            endTime: effectiveEndTime,
            stockLeft: effectiveStockLeft
          },
          product: liveCatalogProduct
        }
      }));
    };

    return (
      <div 
        onClick={handleOpenFlashSaleModal}
        style={{
          marginTop: 10,
          marginBottom: 8,
          padding: '14px 16px',
          borderRadius: 16,
          background: isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${borderCard}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.25)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 8px 26px rgba(239, 68, 68, 0.12)';
        }}
      >
        {/* Flash Sale Header: Live Badge + Countdown Timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderBottom: '1px dashed rgba(239, 68, 68, 0.25)', paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 100,
              background: (effectiveStockLeft !== undefined && effectiveStockLeft <= 0) ? '#64748b' : '#ef4444',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              <Zap size={13} fill="#fff" />
              <span>FLASH SALE</span>
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 850,
              color: (effectiveStockLeft !== undefined && effectiveStockLeft <= 0) ? '#94a3b8' : '#f59e0b',
              padding: '2px 8px',
              borderRadius: 6,
              background: (effectiveStockLeft !== undefined && effectiveStockLeft <= 0) ? 'rgba(148, 163, 184, 0.15)' : 'rgba(245, 158, 11, 0.15)'
            }}>
              {(effectiveStockLeft !== undefined && effectiveStockLeft <= 0) ? 'KUOTA HABIS' : `HEMAT ${effectiveDiscount}%`}
            </span>
          </div>

          {/* Countdown Clock */}
          {effectiveEndTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary }}>
                Berakhir Dalam:
              </span>
              <CountdownTimer endTime={effectiveEndTime} />
            </div>
          )}
        </div>

        {/* Flash Sale Main Body */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 220, flex: '1 1 auto' }}>
            {(liveCatalogProduct?.image || fsSticker.imageUrl) ? (
              <img 
                src={liveCatalogProduct?.image || fsSticker.imageUrl} 
                alt={fsSticker.title}
                style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', border: '1.5px solid rgba(239, 68, 68, 0.3)' }}
              />
            ) : (
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <Zap size={30} />
              </div>
            )}

            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: textPrimary, marginBottom: 4 }}>
                {liveCatalogProduct?.name || fsSticker.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 950, color: '#ef4444' }}>
                  {formatRupiah(effectiveSalePrice)}
                </span>
                {effectiveOriginalPrice && Number(effectiveOriginalPrice) > Number(effectiveSalePrice) && (
                  <span style={{ fontSize: 12.5, color: textSecondary, textDecoration: 'line-through' }}>
                    {formatRupiah(effectiveOriginalPrice)}
                  </span>
                )}
              </div>
              {effectiveStockLeft !== undefined && (
                <div style={{ fontSize: 11, fontWeight: 700, color: effectiveStockLeft <= 0 ? '#ef4444' : '#f59e0b', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={12} color={effectiveStockLeft <= 0 ? '#ef4444' : '#f59e0b'} fill={effectiveStockLeft <= 0 ? '#ef4444' : '#f59e0b'} />
                  <span>{effectiveStockLeft <= 0 ? 'Promo telah penuh!' : `Tersisa ${effectiveStockLeft} slot promo lagi!`}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenFlashSaleModal();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '11px 22px',
              borderRadius: 12,
              border: 'none',
              background: (effectiveStockLeft !== undefined && effectiveStockLeft <= 0)
                ? '#64748b'
                : 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 850,
              cursor: 'pointer',
              boxShadow: (effectiveStockLeft !== undefined && effectiveStockLeft <= 0)
                ? 'none'
                : '0 6px 18px rgba(239, 68, 68, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>{(effectiveStockLeft !== undefined && effectiveStockLeft <= 0) ? 'Kuota Habis' : 'Klaim Flash Sale'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// ── Countdown Timer Component ──
const CountdownTimer: React.FC<{ endTime: string }> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft.isExpired) {
    return <span style={{ color: '#ef4444', fontWeight: 800, fontSize: 11 }}>Berakhir</span>;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'monospace', fontWeight: 900, fontSize: 12 }}>
      <span style={{ padding: '2px 5px', borderRadius: 4, background: '#ef4444', color: '#fff' }}>{pad(timeLeft.hours)}</span>:
      <span style={{ padding: '2px 5px', borderRadius: 4, background: '#ef4444', color: '#fff' }}>{pad(timeLeft.minutes)}</span>:
      <span style={{ padding: '2px 5px', borderRadius: 4, background: '#ef4444', color: '#fff' }}>{pad(timeLeft.seconds)}</span>
    </div>
  );
};

export default UpdateStickerRenderer;
