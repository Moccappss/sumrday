import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, BrainCircuit, Terminal, Cpu, 
  Search, Zap, Bot, MessageSquare, Wand2, 
  ShieldCheck, Activity, Globe, Layout, 
  FolderKanban, StickyNote, Settings, X, 
  ChevronRight, Mic, Play, RefreshCw, BarChart3,
  Key, AlertCircle, Info, History, Plus, Trash2
} from 'lucide-react';
import { callGemini, getGeminiKey } from '../../utils/ai';

// Simple Markdown Component for better readability
const MarkdownText = ({ text }) => {
  if (!text) return null;
  
  // Replace bold **text** with <strong>
  // Replace code `text` with <code>
  // Handle new lines
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 800, color: 'inherit' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
        }
        if (part === '\n') {
          return <br key={i} />;
        }
        return part;
      })}
    </span>
  );
};

const AiAssistant = ({ isOpen, setIsOpen, pagesData, projects, canvases, globalSettings, onAction }) => {
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState(getGeminiKey());

  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Chat History & Sessions
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('porto_ai_sessions');
    return saved ? JSON.parse(saved) : [
      { id: 'default', title: 'Sesi Baru', messages: [
        { role: 'assistant', text: "Sistem Terhubung! Saya adalah AI Strategic Assistant Anda. Saya telah menganalisis ekosistem CMS Anda dan siap memberikan instruksi taktis. Ada yang bisa saya bantu?", type: 'text' }
      ]}
    ];
  });
  const [currentSessionId, setCurrentSessionId] = useState('default');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    localStorage.setItem('porto_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('porto_gemini_key', key);
    setShowKeyInput(false);
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      title: 'Percakapan Baru',
      messages: [{ role: 'assistant', text: "Siap membantu! Apa yang ingin kita bahas sekarang?", type: 'text' }]
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newId);
    setShowHistory(false);
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    const remaining = sessions.filter(s => s.id !== id);
    if (remaining.length === 0) {
      const freshId = Date.now().toString();
      const freshSession = {
        id: freshId,
        title: 'Sesi Baru',
        messages: [{ role: 'assistant', text: "Ruang chat telah dibersihkan. Ada yang ingin kita diskusikan?", type: 'text' }]
      };
      setSessions([freshSession]);
      setCurrentSessionId(freshId);
      return;
    }
    setSessions(remaining);
    if (currentSessionId === id) setCurrentSessionId(remaining[0].id);
  };

  const clearCurrentMessages = () => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: 'Sesi Baru',
          messages: [{ role: 'assistant', text: "Percakapan pada sesi ini telah dibersihkan. Silakan ajukan pertanyaan baru!", type: 'text' }]
        };
      }
      return s;
    }));
  };

  const generateResponse = async (query) => {
    setIsTyping(true);
    
    // Prepare CMS Context for AI
    const context = `
      CONTEXT CMS SAAT INI:
      - Branding: ${globalSettings?.cmsName || 'sumr.day'}
      - Total Halaman Builder: ${Object.keys(pagesData || {}).length} (${Object.keys(pagesData || {}).join(', ')})
      - Proyek: ${projects.length} proyek terdaftar.
    `;

    try {
      const aiText = await callGemini(query, context);
      
      // Update messages and potentially title
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const newMessages = [...s.messages, { role: 'assistant', text: aiText, type: 'text' }];
          let newTitle = s.title;
          
          // Generate title if it's the first exchange
          if (s.title === 'Percakapan Baru' || s.title === 'Sesi Baru') {
            newTitle = query.slice(0, 20) + (query.length > 20 ? '...' : '');
          }
          
          return { ...s, messages: newMessages, title: newTitle };
        }
        return s;
      }));

    } catch (error) {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, { role: 'assistant', text: "Koneksi terputus. Silakan coba lagi.", type: 'error' }] };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) return { ...s, messages: [...s.messages, userMsg] };
      return s;
    }));
    
    const q = input;
    setInput('');
    generateResponse(q);
  };

  const quickActions = [
    { label: 'Audit SEO', icon: Globe, query: 'Tolong analisis SEO halaman saya dan berikan saran optimasi.' },
    { label: 'Status Proyek', icon: FolderKanban, query: 'Berikan ringkasan status semua proyek saya.' },
    { label: 'Ide Desain', icon: Sparkles, query: 'Berikan ide desain untuk portofolio kreatif.' },
    { label: 'Cek Sistem', icon: ShieldCheck, query: 'Apakah ada masalah keamanan atau performa di CMS saya?' }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* AI Drawer / Panel */}
      <div 
        className="ai-assistant-panel open"
      >
        {/* Header */}
        <div className="ai-panel-header">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="cms-animate-float" style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, var(--cms-accent, #8b5cf6), #6d28d9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(139, 92, 246, 0.3)', flexShrink: 0 }}>
                     <BrainCircuit size={19} />
                  </div>
                 <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--cms-text)', letterSpacing: '-0.02em' }}>{currentSession.title}</h3>
                    <div style={{ fontSize: 10, fontWeight: 800, color: apiKey ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                       <div style={{ width: 6, height: 6, borderRadius: '50%', background: apiKey ? '#10b981' : '#f59e0b', animation: apiKey ? 'cmsPulse 2s infinite' : 'none' }} />
                       {apiKey ? 'AI Aktif' : 'Butuh API Key'}
                    </div>
                 </div>
              </div>
               <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={clearCurrentMessages} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} title="Bersihkan Chat"><Trash2 size={15} /></button>
                  <button onClick={() => setShowHistory(!showHistory)} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: showHistory ? 'var(--cms-accent)' : 'var(--cms-input-bg)', color: showHistory ? '#fff' : 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} title="Riwayat Chat"><History size={16} /></button>
                  <button onClick={() => setIsOpen(false)} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
               </div>
           </div>

           {!showHistory && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                {quickActions.map((act, i) => (
                  <button key={i} onClick={() => { setInput(act.query); }} style={{ padding: '8px 10px', borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', cursor: 'pointer', transition: '0.2s' }} className="quick-act-btn">
                     <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--cms-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)', border: '1px solid var(--glass-border)', flexShrink: 0 }}><act.icon size={11} /></div>
                     <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.label}</span>
                  </button>
                ))}
             </div>
           )}
        </div>

        {/* History Drawer */}
        {showHistory && (
          <div className="ai-panel-body" style={{ background: 'rgba(0,0,0,0.02)', animation: 'cmsFadeIn 0.3s ease' }}>
             <button onClick={createNewSession} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'var(--cms-accent)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, cursor: 'pointer' }}>
                <Plus size={15} /> Obrolan Baru
             </button>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map(s => (
                  <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setShowHistory(false); }} style={{ padding: '12px 16px', borderRadius: 14, background: currentSessionId === s.id ? 'rgba(139, 92, 246, 0.1)' : 'var(--cms-input-bg)', border: currentSessionId === s.id ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)', cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <MessageSquare size={15} color={currentSessionId === s.id ? 'var(--cms-accent)' : 'var(--cms-text-muted)'} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                     </div>
                     <button onClick={(e) => deleteSession(e, s.id)} style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={13} /></button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Messages */}
        {!showHistory && (
          <div ref={scrollRef} className="ai-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {messages.map((msg, i) => (
               <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                  <div className="cms-animate-pop" style={{ 
                    maxWidth: '88%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user' ? 'var(--cms-accent)' : msg.type === 'system' ? 'rgba(245, 158, 11, 0.1)' : 'var(--cms-switcher-bg)',
                    color: msg.role === 'user' ? '#fff' : msg.type === 'system' ? '#f59e0b' : 'var(--cms-text)',
                    fontSize: 13.5, fontWeight: 500, lineHeight: 1.55,
                    boxShadow: msg.role === 'user' ? '0 6px 16px rgba(var(--cms-accent-rgb), 0.15)' : 'none',
                    border: msg.type === 'system' ? '1px solid rgba(245, 158, 11, 0.3)' : 'none'
                  }}>
                    {msg.type === 'system' && <AlertCircle size={14} style={{ marginBottom: 6, display: 'block' }} />}
                    <MarkdownText text={msg.text} />
                  </div>
               </div>
             ))}
             {isTyping && (
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--cms-switcher-bg)', borderRadius: 100, width: 'fit-content' }}>
                  <Sparkles size={13} color="var(--cms-accent)" className="animate-pulse" />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-accent)', letterSpacing: '0.05em' }}>MENGANALISIS...</span>
               </div>
             )}
          </div>
        )}

        {/* Input */}
        <div className="ai-panel-footer">
           <form onSubmit={handleSend} style={{ position: 'relative', display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Kirim pesan strategis..."
                  style={{ width: '100%', height: 48, padding: '0 46px 0 18px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13, fontWeight: 600, outline: 'none', transition: '0.2s', boxSizing: 'border-box' }}
                  className="ai-input-field"
                />
                <button type="button" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--cms-text-muted)', cursor: 'pointer' }}><Mic size={18} /></button>
              </div>
              <button type="submit" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--cms-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(var(--cms-accent-rgb), 0.2)', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }} className="send-btn">
                 <Send size={18} />
              </button>
           </form>
           <p style={{ margin: '10px 0 0', fontSize: 9, textAlign: 'center', color: 'var(--cms-text-muted)', fontWeight: 800, letterSpacing: '0.05em', opacity: 0.7 }}>
             POWERED BY GOOGLE GEMINI 1.5 FLASH
           </p>
        </div>
      </div>

      <style>{`
        .ai-assistant-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 460px;
          max-width: 90vw;
          background: var(--cms-card-bg);
          border-left: 1.5px solid var(--glass-border);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.4s, box-shadow 0.3s ease;
          box-shadow: none !important;
          visibility: hidden;
          pointer-events: none;
        }

        .ai-assistant-panel.open {
          transform: translateX(0);
          visibility: visible;
          pointer-events: auto;
          box-shadow: -20px 0 60px rgba(0,0,0,0.3) !important;
        }

        .ai-panel-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid var(--glass-border);
          background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), transparent);
          flex-shrink: 0;
        }

        .ai-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }

        .ai-panel-footer {
          padding: 16px 24px 24px;
          border-top: 1px solid var(--glass-border);
          flex-shrink: 0;
        }

        /* Mobile Layout: Full screen docked above bottom navbar */
        @media (max-width: 768px) {
          .ai-assistant-panel {
            width: 100vw !important;
            max-width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            bottom: calc(64px + env(safe-area-inset-bottom, 12px)) !important;
            border-left: none !important;
            border-bottom: 1px solid var(--glass-border) !important;
            border-radius: 0 !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25) !important;
            transform: translateY(100%) !important;
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }

          .ai-assistant-panel.open {
            transform: translateY(0) !important;
          }

          .ai-panel-header {
            padding: 16px 16px 12px !important;
          }

          .ai-panel-body {
            padding: 14px 16px !important;
          }

          .ai-panel-footer {
            padding: 12px 16px 14px !important;
          }
        }

        .quick-act-btn:hover { border-color: var(--cms-accent); transform: translateY(-2px); background: var(--cms-card-bg); }
        .ai-input-field:focus { border-color: var(--cms-accent); box-shadow: 0 0 0 4px rgba(var(--cms-accent-rgb), 0.1); }
        .send-btn:hover { transform: scale(1.05); }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </>
  );
};

export default AiAssistant;
