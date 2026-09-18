import React, { useState } from 'react';
import { storage } from '../../utils/storage';

interface ContactFormBlockProps {
  block: any;
}

const ContactFormBlock: React.FC<ContactFormBlockProps> = ({ block }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    setSubmitting(true);
    try {
      const formResponses = await storage.getItem('porto_form_responses', []);
      const newResponse = {
        id: `res_${Date.now()}`,
        blockId: block.id,
        createdAt: new Date().toISOString(),
        ...formData
      };
      await storage.setItem('porto_form_responses', [newResponse, ...formResponses]);
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(30); } catch (e) {}
      }
      
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full py-12 px-6 bg-[var(--cms-card-bg,#fff)] border-y border-[var(--glass-border,rgba(0,0,0,0.08))] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[180px] h-[180px] pointer-events-none rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)' }} />

        {/* Animated Checkmark Circle */}
        <div className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-[0_12px_24px_rgba(16,185,129,0.25)] mb-5 animate-in zoom-in duration-500">
          <div className="absolute inset-[-8px] border-2 border-emerald-500/15 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
            <polyline points="20 6 9 17 4 12" className="animate-[drawCheck_0.4s_ease-out_0.2s_forwards]" style={{ strokeDasharray: 50, strokeDashoffset: 50 }} />
          </svg>
        </div>

        {/* Text Details */}
        <h4 className="m-0 mb-2 text-lg font-extrabold text-[var(--cms-text,#000)] tracking-tight leading-snug">
          Pesan Berhasil Terkirim!
        </h4>
        
        <p className="m-0 mb-6 text-[13px] text-[var(--cms-text-muted,#666)] max-w-[280px] leading-relaxed font-medium">
          Terima kasih telah menghubungi kami. Tim kami akan segera meninjau pesan Anda dan memberikan respon terbaik.
        </p>

        {/* Premium Button */}
        <button
          onClick={() => { setFormData({ name: '', email: '', message: '' }); setSubmitted(false); }}
          className="px-6 py-3 bg-[var(--cms-accent,#7c3aed)] text-white border-none rounded-full text-[13px] font-bold cursor-pointer inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
          style={{ boxShadow: '0 8px 20px var(--cms-accent-soft, rgba(var(--cms-accent-rgb), 0.25))' }}
        >
          Kirim Pesan Baru
        </button>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes drawCheck { to { stroke-dashoffset: 0; } }
        `}} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full p-6 bg-[var(--cms-card-bg,#fff)] flex flex-col gap-3 border-y border-[var(--glass-border,rgba(0,0,0,0.08))]">
      <input 
        type="text" 
        placeholder="Nama Anda" 
        value={formData.name}
        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
        className="w-full px-4 py-3 border border-[var(--glass-border,rgba(0,0,0,0.08))] rounded-lg text-sm bg-[var(--cms-input-bg,#f8f9fa)] text-[var(--cms-text,#000)] focus:outline-none focus:border-[var(--cms-accent,#7c3aed)] transition-colors"
        required 
      />
      <input 
        type="email" 
        placeholder="Email Anda" 
        value={formData.email}
        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
        className="w-full px-4 py-3 border border-[var(--glass-border,rgba(0,0,0,0.08))] rounded-lg text-sm bg-[var(--cms-input-bg,#f8f9fa)] text-[var(--cms-text,#000)] focus:outline-none focus:border-[var(--cms-accent,#7c3aed)] transition-colors"
        required 
      />
      <textarea 
        placeholder="Pesan Anda" 
        value={formData.message}
        onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
        className="w-full px-4 py-3 border border-[var(--glass-border,rgba(0,0,0,0.08))] rounded-lg text-sm min-h-[100px] bg-[var(--cms-input-bg,#f8f9fa)] text-[var(--cms-text,#000)] focus:outline-none focus:border-[var(--cms-accent,#7c3aed)] transition-colors resize-y"
        required 
      />
      <button 
        type="submit" 
        disabled={submitting}
        className="w-full p-3.5 text-white border-none rounded-lg font-semibold text-sm cursor-pointer flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: block.submitColor || 'var(--cms-accent, #7c3aed)' }}
      >
        {submitting ? 'Mengirim...' : (block.submitText || 'Kirim Pesan')}
      </button>
    </form>
  );
};

export default ContactFormBlock;
