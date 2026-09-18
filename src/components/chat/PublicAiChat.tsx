import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, X, Mic, BrainCircuit, 
  ChevronRight, Bot, Info, User, Zap
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PublicAiChat = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Halo! Saya adalah asisten virtual Arif. Ada yang bisa saya bantu terkait portofolio atau layanan Arif?", type: 'text' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    const loadKey = async () => {
      const key = localStorage.getItem('porto_gemini_key');
      if (key) setApiKey(key);
    };
    loadKey();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const generateResponse = async (query) => {
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Maaf, asisten AI sedang dalam pemeliharaan (API Key tidak ditemukan). Silakan hubungi Arif melalui WhatsApp di panel kontak.", type: 'error' }]);
      return;
    }

    setIsTyping(true);
    
    try {
      // Get brief context about the owner and published portfolio from storage
      const s = await storage.getItem('porto_settings', {});
      const bio = await storage.getItem('porto_bio', {});
      const portfolioWorks = await storage.getItem('porto_portfolio', []);
      
      const activeProjects = portfolioWorks
        .map((p: any) => ({ title: p.title, tags: p.tags, client: p.client, desc: p.description }))
        .slice(0, 8);
      
      const context = `
        KAMU ADALAH: Asisten Virtual Arif (Arif's Virtual Assistant).
        TENTANG ARIF: 
        - Nama CMS / Portofolio: ${s.cmsName || s.siteTitle || 'Porto Arif'}
        - Deskripsi Singkat: ${bio.tagline || 'Seorang kreatif dan pengembang.'}
        - Keahlian: ${JSON.stringify(bio.skills || [])}
        - Proyek Terbaru: ${JSON.stringify(activeProjects)}
        
        INSTRUKSI:
        - Jawablah pengunjung website dengan ramah, cerdas, dan profesional.
        - Jika ditanya tentang proyek atau portofolio Arif, gunakan data proyek di atas.
        - Jangan memberikan informasi sensitif atau rahasia dapur CMS.
        - Gunakan Bahasa Indonesia yang sopan dan sedikit santai (Gen-Z friendly but professional).
        - Berikan respon yang terstruktur dan ringkas. Jangan membuat paragraf terlalu panjang.
      `;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${context}\n\nPERTANYAAN PENGUNJUNG: ${query}` }] }]
      });

      const aiText = result.response.text() || "Maaf, saya sedang kehilangan fokus sejenak. Bisa diulangi?";
      
      setMessages(prev => [...prev, { role: 'assistant', text: aiText, type: 'text' }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: "Koneksi asisten sedang terganggu. Silakan coba sesaat lagi.", type: 'error' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const q = input;
    setInput('');
    generateResponse(q);
  };

  if (!isOpen) return null;

  return (
    <div className="public-ai-chat-overlay" style={{
      position: 'absolute', inset: 0, zIndex: 5000,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'cmsFadeIn 0.3s ease'
    }} onClick={onClose}>
      
      <div className="public-ai-chat-card" style={{
        width: '100%', maxWidth: 500, height: '80dvh',
        background: 'var(--cms-card-bg)', borderRadius: '32px 32px 0 0',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.2)',
        animation: 'cmsSlideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--cms-accent-rgb), 0.03)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cms-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Sparkles size={20} />
              </div>
              <div>
                 <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Arif's AI Assistant</h4>
                 <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'cmsPulse 2s infinite' }} />
                    ONLINE & READY
                 </div>
              </div>
           </div>
           <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
           {messages.map((msg, i) => (
             <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                <div style={{ 
                  maxWidth: '85%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.role === 'user' ? 'var(--cms-accent)' : 'var(--cms-switcher-bg)',
                  color: msg.role === 'user' ? '#fff' : 'var(--cms-text)',
                  fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                  boxShadow: msg.role === 'user' ? '0 10px 20px rgba(var(--cms-accent-rgb), 0.15)' : 'none'
                }}>
                  {msg.text}
                </div>
             </div>
           ))}
           {isTyping && (
             <div style={{ display: 'flex', gap: 6, padding: 12, background: 'var(--cms-switcher-bg)', borderRadius: 16, width: 'fit-content' }}>
                <div className="dot-blink" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cms-accent)' }} />
                <div className="dot-blink" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cms-accent)', animationDelay: '0.2s' }} />
                <div className="dot-blink" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cms-accent)', animationDelay: '0.4s' }} />
             </div>
           )}
        </div>

        {/* Input */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)' }}>
           <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tanya apapun tentang Arif..."
                style={{ flex: 1, height: 48, padding: '0 20px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, outline: 'none' }}
              />
              <button type="submit" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(var(--cms-accent-rgb), 0.2)', cursor: 'pointer' }}>
                 <Send size={18} />
              </button>
           </form>
        </div>
      </div>

      <style>{`
        .dot-blink { animation: dotBlink 1.4s infinite; }
        @keyframes dotBlink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default PublicAiChat;
