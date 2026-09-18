import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { Star, MessageSquare, Send, CheckCircle2, Upload, Image, Sparkles, X, Heart } from 'lucide-react';
import SEOHelmet from '../components/SEOHelmet';

export const PublicFeedbackPage: React.FC = () => {
  const [businessProfile, setBusinessProfile] = useState<any>({});
  const [clientName, setClientName] = useState('');
  const [brand, setBrand] = useState('');
  const [role, setRole] = useState('');
  const [contact, setContact] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState<'review' | 'feedback'>('review');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await storage.getItem('porto_business_profile', {});
        setBusinessProfile(profile || {});
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
  }, []);

  const studioName = businessProfile?.name || businessProfile?.businessName || 'sumr.day';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !message.trim()) {
      alert('Nama dan pesan ulasan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      if (feedbackType === 'review') {
        // Save as review
        const currentReviews = await storage.getItem('porto_client_reviews', []);
        const newReview = {
          id: `rev-${Date.now()}`,
          clientName: clientName.trim(),
          brand: brand.trim() || undefined,
          role: role.trim() || undefined,
          rating,
          reviewText: message.trim(),
          avatarUrl: photoUrl || undefined,
          isFeatured: true,
          createdAt: now
        };
        const updated = [newReview, ...(Array.isArray(currentReviews) ? currentReviews : [])];
        await storage.setItem('porto_client_reviews', updated);
        window.dispatchEvent(new CustomEvent('porto_reviews_updated'));
      } else {
        // Save as feedback
        const currentFeedbacks = await storage.getItem('porto_client_feedbacks', []);
        const newFeedback = {
          id: `fb-${Date.now()}`,
          clientName: clientName.trim(),
          email: contact.includes('@') ? contact.trim() : undefined,
          feedbackText: message.trim(),
          createdAt: now,
          status: 'new'
        };
        const updated = [newFeedback, ...(Array.isArray(currentFeedbacks) ? currentFeedbacks : [])];
        await storage.setItem('porto_client_feedbacks', updated);
        window.dispatchEvent(new CustomEvent('porto_feedbacks_updated'));
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Terjadi kendala saat mengirimkan ulasan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #090d16 0%, #0f172a 100%)',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '50px 20px 80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <SEOHelmet
        title={`Kirim Ulasan & Masukan — ${studioName}`}
        description={`Bagikan pengalaman dan masukan Anda bekerja sama dengan ${studioName}.`}
      />

      <div style={{
        maxWidth: 580,
        width: '100%',
        background: 'rgba(30, 41, 59, 0.55)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: '36px 30px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
      }}>
        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#ffffff' }}>
              Terima Kasih Banyak!
            </h2>
            <p style={{ margin: '10px 0 24px', fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
              Ulasan dan apresiasi Anda sangat berarti bagi perkembangan {studioName}.
            </p>

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setClientName('');
                setMessage('');
                setPhotoUrl(null);
              }}
              style={{
                padding: '10px 24px',
                borderRadius: 100,
                border: 'none',
                background: '#8b5cf6',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Kirim Masukan Lainnya
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a78bfa',
                padding: '5px 14px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 10
              }}>
                <Heart size={13} fill="#a78bfa" />
                <span>Suara Klien</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#ffffff' }}>
                Bagikan Pengalaman Anda
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#94a3b8' }}>
                Bantu {studioName} terus berinovasi dan memberikan karya terbaik
              </p>
            </div>

            {/* Type selector: Testimoni vs Saran/Masukan */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 4,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <button
                type="button"
                onClick={() => setFeedbackType('review')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: feedbackType === 'review' ? '#8b5cf6' : 'transparent',
                  color: feedbackType === 'review' ? '#ffffff' : '#94a3b8',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ⭐ Testimoni Publik
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('feedback')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: feedbackType === 'feedback' ? '#8b5cf6' : 'transparent',
                  color: feedbackType === 'feedback' ? '#ffffff' : '#94a3b8',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                💡 Masukan / Saran Studio
              </button>
            </div>

            {/* Star Rating (if review) */}
            {feedbackType === 'review' && (
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Tingkat Kepuasan Anda:</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <Star
                        size={30}
                        fill={star <= rating ? '#f59e0b' : 'none'}
                        color={star <= rating ? '#f59e0b' : '#64748b'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name input */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 5, display: 'block' }}>Nama Lengkap *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Contoh: Rian Sanjaya"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: 13.5, boxSizing: 'border-box' }}
              />
            </div>

            {/* Brand / Role / Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 5, display: 'block' }}>Perusahaan / Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Nama Brand"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 5, display: 'block' }}>WhatsApp / Email</label>
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="08123456xxx"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 5, display: 'block' }}>Foto Profil / Logo Brand (Opsional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {photoUrl ? (
                  <div style={{ position: 'relative', width: 50, height: 50, borderRadius: 14, overflow: 'hidden', border: '1.5px solid #8b5cf6' }}>
                    <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 12,
                      border: '1px dashed rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#cbd5e1',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Upload size={14} />
                    <span>Pilih Foto dari Perangkat</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Message / Review text */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 5, display: 'block' }}>
                {feedbackType === 'review' ? 'Isi Ulasan / Pengalaman Bekerja Sama *' : 'Kritik, Saran & Ide Pengembangan *'}
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={feedbackType === 'review' ? 'Ceritakan bagaimana hasil kerja, ketepatan waktu, dan pelayanan studio...' : 'Apa yang bisa kami tingkatkan untuk pelayanan berikutnya?'}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#ffffff', fontSize: 13.5, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 6,
                height: 48,
                borderRadius: 100,
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 850,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Mengirim Ulasan...' : 'Kirim Ulasan Sekarang'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicFeedbackPage;
