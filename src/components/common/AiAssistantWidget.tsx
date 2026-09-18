import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, MessageSquare, X, Send, Bot, User, 
  Calendar, ArrowRight, Loader2, Minimize2, RefreshCw 
} from 'lucide-react';
import { callGemini } from '../../utils/ai';
import { storage } from '../../utils/storage';
import BookingModal from './BookingModal';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  showBookingAction?: boolean;
}

const AiAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hai! ☀️ Aku Sunny, asisten AI dari sumr.day. Ada yang bisa aku bantu seputar undangan web, landing page, atau kolaborasi proyek kreatifmu?',
      timestamp: Date.now(),
      showBookingAction: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [siteContext, setSiteContext] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Collect website data context for AI grounding
    const gatherContext = async () => {
      try {
        const [biodata, services, articles, projects, settings] = await Promise.all([
          storage.getItem('porto_biodata', {}),
          storage.getItem('porto_services', []),
          storage.getItem('porto_articles', []),
          storage.getItem('porto_projects', []),
          storage.getItem('porto_settings', {})
        ]);

        const context = `
Website Profile: ${settings.siteTitle || 'sumr.day | Creative Digital Studio'}
Tagline: ${biodata.tagline || 'A little sunshine for your screen'}
Deskripsi: ${biodata.bio || 'Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic'}
Nama Pemilik/Admin: ${biodata.fullName || 'Creative Director'}
Kontak WhatsApp: ${biodata.whatsapp || settings.phone || '-'}
Layanan yang ditawarkan: ${(services || []).map((s: any) => s.title).join(', ') || 'Undangan Web, Landing Page, Visual Branding, Interactive Games'}
Portofolio Proyek Terpilih: ${(projects || []).slice(0, 5).map((p: any) => p.title).join(', ')}
        `.trim();

        setSiteContext(context);
      } catch (err) {
        // Ignore fallback
      }
    };

    gatherContext();
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const systemPrompt = `
Anda adalah Sunny (Sunshine Co-Pilot), asisten AI yang ramah, hangat, dan cerdas dari sumr.day / Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic ("A little sunshine for your screen").
Tugas Anda adalah menyambut calon klien secara hangat, menjelaskan layanan kreatif (undangan web estetik, landing page modern, visual assets, game aktivasi), dan mengajak mereka untuk menjadwalkan ngobrol santai atau konsultasi proyek.

Data Website:
${siteContext}

Aturan Respons:
1. Jawab dengan ringkas, ramah, dan solutif (Bahasa Indonesia).
2. Jika pengguna tertarik dengan harga, waktu pengerjaan, atau diskusi proyek, tawarkan untuk menjadwalkan konsultasi gratis.
3. Jangan mengarang informasi kontak di luar data yang tersedia.
      `.trim();

      const aiReply = await callGemini(
        `Pertanyaan Klien: ${userText}`,
        systemPrompt,
        0.7
      );

      const isBookingRelevant = userText.toLowerCase().includes('konsultasi') ||
        userText.toLowerCase().includes('jadwal') ||
        userText.toLowerCase().includes('meeting') ||
        userText.toLowerCase().includes('harga') ||
        userText.toLowerCase().includes('proyek') ||
        userText.toLowerCase().includes('buat');

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiReply || 'Terima kasih atas pertanyaannya! Silakan jadwalkan konsultasi langsung dengan tim kami agar kami bisa memberikan solusi terbaik.',
        timestamp: Date.now(),
        showBookingAction: isBookingRelevant || messages.length % 2 === 0
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: 'Maaf, terjadi kendala koneksi AI sementara. Anda bisa langsung menjadwalkan konsultasi atau menghubungi kami via WhatsApp!',
          timestamp: Date.now(),
          showBookingAction: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="cms-btn"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            padding: '12px 20px', borderRadius: 100,
            background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #ec4899)',
            color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.45)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'cmsBounce 2s infinite ease-in-out'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
        >
          <Sparkles size={18} />
          <span style={{ fontSize: 13, fontWeight: 850 }}>Tanya AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Box */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 99999,
          width: '92vw', maxWidth: 380, height: '560px', maxHeight: '82vh',
          background: 'var(--cms-card-bg, #141518)',
          border: '1.5px solid var(--glass-border)',
          borderRadius: 24, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', boxShadow: '0 25px 70px rgba(0,0,0,0.5)',
          animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both'
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--cms-switcher-bg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #ec4899)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>AI Copilot Assistant</div>
                <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Online & Siap Membantu
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: 6
                }}
              >
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', borderRadius: 18,
                  background: msg.sender === 'user' ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-switcher-bg)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--cms-text)',
                  fontSize: 13, lineHeight: 1.5, fontWeight: 600,
                  borderBottomRightRadius: msg.sender === 'user' ? 4 : 18,
                  borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 18,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  {msg.text}
                </div>

                {/* Optional Action Callout */}
                {msg.showBookingAction && msg.sender === 'ai' && (
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 100, border: 'none',
                      background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
                      fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    <Calendar size={13} />
                    <span>Jadwalkan Konsultasi (Google Meet)</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cms-text-muted)', fontSize: 12, padding: '8px 12px' }}>
                <Loader2 size={14} className="animate-spin" />
                <span>AI sedang mengetik...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions & Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--glass-border)', background: 'var(--cms-switcher-bg)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                placeholder="Tulis pertanyaan Anda..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="cms-input"
                style={{ flex: 1, height: 40, borderRadius: 100, padding: '0 16px', fontSize: 13 }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: 'none',
                  background: 'var(--cms-accent, #7c3aed)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', opacity: !input.trim() || isLoading ? 0.5 : 1
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
};

export default AiAssistantWidget;
