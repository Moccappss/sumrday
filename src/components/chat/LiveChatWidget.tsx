import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, X, CheckCheck, Sparkles, FileText,
  ExternalLink, ChevronRight, Phone, Clock, ShieldCheck, CheckCircle2,
  Palette, Layout, Video, Wand2, Compass, Layers,
  Edit3, Plus, Trash2, Save, RotateCcw
} from 'lucide-react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, setDoc, doc, updateDoc } from 'firebase/firestore';
import { haptic } from '../../utils/haptics';
import { useClientAuth } from '../../context/ClientAuthContext';
import { storage } from '../../utils/storage';
import { useNativeBackHandler } from '../../utils/nativeNavigation';
import { callGemini } from '../../utils/ai';
import { googleSync } from '../../utils/googleSync';

export interface ConciergeSettings {
  txtFloatingButton: string;
  txtHeaderTitle: string;
  txtHeaderSubtitle: string;
  txtTabBrief: string;
  txtTabChat: string;
  txtStep1Title: string;
  serviceCategories: {
    id: string;
    name: string;
    desc: string;
    icon: string;
  }[];
  txtStep2Title: string;
  timelineOptions: {
    id: string;
    name: string;
  }[];
  txtStep3Title: string;
  txtStep3Placeholder: string;
  txtBtnWhatsapp: string;
  txtBtnLiveChat: string;
  txtChatEmpty: string;
  txtChatPlaceholder: string;
}

export const DEFAULT_CONCIERGE_SETTINGS: ConciergeSettings = {
  txtFloatingButton: 'Konsultasi & Chat',
  txtHeaderTitle: 'Studio Concierge',
  txtHeaderSubtitle: 'Konsultasi desain, chat langsung & AI Copilot',
  txtTabBrief: 'Brief Proyek',
  txtTabChat: 'Live Chat',
  txtStep1Title: '1. Kebutuhan Desain / Proyek',
  serviceCategories: [
    { id: 'branding', name: 'Branding & Identitas Visual', desc: 'Logo, visual identity, guideline, dan aset merek', icon: 'Palette' },
    { id: 'web', name: 'Desain UI/UX & Website', desc: 'Landing page modern, portofolio interaktif, dan web app', icon: 'Layout' },
    { id: 'social', name: 'Konten Media Sosial & Promo', desc: 'Feed Instagram, carousel, poster, dan banner digital', icon: 'Compass' },
    { id: 'motion', name: 'Video Editing & Motion Graphic', desc: 'Reels, YouTube editing, animasi intro, dan color grading', icon: 'Video' },
    { id: 'custom', name: 'Proyek Kustom / Kolaborasi Lain', desc: 'Konsultasi ide khusus atau paket desain terpadu', icon: 'Wand2' }
  ],
  txtStep2Title: '2. Target Waktu Pengerjaan',
  timelineOptions: [
    { id: 'urgent', name: '⚡ Cepat / Urgent (< 1 Minggu)' },
    { id: 'standard', name: '⏱️ Standar (2 - 4 Minggu)' },
    { id: 'flexible', name: '🎯 Fleksibel / Rencana' }
  ],
  txtStep3Title: '3. Ceritakan Ide atau Konsep Proyek',
  txtStep3Placeholder: 'Misal: Saya butuh redesain website portofolio dengan tema gelap minimalis, integrasi WhatsApp, dan estimasi waktu 3 minggu...',
  txtBtnWhatsapp: 'Kirim via WhatsApp',
  txtBtnLiveChat: 'Kirim ke Live Chat Studio',
  txtChatEmpty: 'Mulai percakapan dengan tim kami. Kami siap membantu ide desain & proyek Anda!',
  txtChatPlaceholder: 'Ketik pesan untuk tim studio...'
};

/** Generate a unique guest chat ID */
const genChatId = (): string => {
  return 'guest_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
};

const ICON_MAP: Record<string, React.ElementType> = {
  Palette, Layout, Compass, Video, Wand2, Layers, Sparkles, FileText
};

export interface ChatTemplate {
  id: string;
  question: string;
  answer: string;
}

export const DEFAULT_CHAT_TEMPLATES: ChatTemplate[] = [
  {
    id: 'tpl_1',
    question: 'Berapa perkiraan biaya jasa desain atau website?',
    answer: 'Halo! Biaya disesuaikan dengan skala proyek Anda. Untuk landing page mulai dari Rp 1.5jt, branding visual mulai Rp 800rb, dan custom web app mulai Rp 3.5jt. Anda juga bisa mengisi form di tab Brief untuk estimasi lebih detail!'
  },
  {
    id: 'tpl_2',
    question: 'Berapa lama estimasi pengerjaan proyek?',
    answer: 'Waktu pengerjaan standar berkisar antara 1 hingga 3 minggu tergantung kompleksitas kebutuhan Anda. Kami juga menyediakan opsi pengerjaan kilat (< 1 minggu).'
  },
  {
    id: 'tpl_3',
    question: 'Bagaimana sistem pembayaran dan garansi revisinya?',
    answer: 'Pembayaran dapat dilakukan dengan DP 50% di awal dan pelunasan setelah proyek rampung. Setiap paket sudah mencakup garansi revisi hingga hasil sesuai dengan visi brand Anda.'
  },
  {
    id: 'tpl_4',
    question: 'Bagaimana cara menjadwalkan konsultasi langsung?',
    answer: 'Anda bisa menjadwalkan konsultasi langsung atau chat tim kami via WhatsApp untuk berdiskusi santai mengenai ide Anda.'
  }
];

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'brief' | 'chat'>('brief');

  // Native 1-step back navigation
  useNativeBackHandler(isOpen, () => setIsOpen(false), 'live_chat_widget', 10);

  // Dynamic Settings
  const [cSettings, setCSettings] = useState<ConciergeSettings>(DEFAULT_CONCIERGE_SETTINGS);
  const [chatTemplates, setChatTemplates] = useState<ChatTemplate[]>(DEFAULT_CHAT_TEMPLATES);

  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatId, setChatId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentTimeRef = useRef<number>(0);
  const { client } = useClientAuth();

  // Project Brief Form State
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [selectedService, setSelectedService] = useState('branding');
  const [selectedTimeline, setSelectedTimeline] = useState('standard');
  const [projectDescription, setProjectDescription] = useState('');

  // In client widget, text editing is strictly disabled (configured via CMS Admin Dashboard)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  const handleSaveSettings = async () => {
    await storage.setItem('porto_concierge_settings', cSettings);
    window.dispatchEvent(new CustomEvent('porto_concierge_settings_updated', { detail: cSettings }));
    haptic.success();
    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2500);
    setIsEditMode(false);
  };

  const handleResetSettings = async () => {
    if (window.confirm('Kembalikan semua teks widget Studio Concierge ke pengaturan default?')) {
      setCSettings(DEFAULT_CONCIERGE_SETTINGS);
      await storage.setItem('porto_concierge_settings', DEFAULT_CONCIERGE_SETTINGS);
      window.dispatchEvent(new CustomEvent('porto_concierge_settings_updated', { detail: DEFAULT_CONCIERGE_SETTINGS }));
      haptic.warning();
    }
  };

  const handleAddCategory = () => {
    const newId = `srv_${Date.now()}`;
    setCSettings(prev => ({
      ...prev,
      serviceCategories: [
        ...(prev.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || []),
        { id: newId, name: 'Layanan Baru', desc: 'Deskripsi singkat layanan...', icon: 'Sparkles' }
      ]
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setCSettings(prev => ({
      ...prev,
      serviceCategories: (prev.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || []).filter(s => s.id !== id)
    }));
  };

  const handleAddTimeline = () => {
    const newId = `tml_${Date.now()}`;
    setCSettings(prev => ({
      ...prev,
      timelineOptions: [
        ...(prev.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions || []),
        { id: newId, name: 'Opsi Waktu Baru' }
      ]
    }));
  };

  const handleDeleteTimeline = (id: string) => {
    setCSettings(prev => ({
      ...prev,
      timelineOptions: (prev.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions || []).filter(t => t.id !== id)
    }));
  };

  // Theme support
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.documentElement.getAttribute('data-cms-theme') === 'dark';
  });

  useEffect(() => {
    // Load concierge settings
    storage.getItem('porto_concierge_settings', DEFAULT_CONCIERGE_SETTINGS).then(s => {
      if (s) {
        setCSettings({ ...DEFAULT_CONCIERGE_SETTINGS, ...s });
      }
    });

    // Load auto response templates
    storage.getItem('porto_chat_templates', DEFAULT_CHAT_TEMPLATES).then(t => {
      if (t && Array.isArray(t) && t.length > 0) {
        setChatTemplates(t);
      }
    });

    storage.getItem('porto_settings', {}).then(s => setGlobalSettings(s || {}));

    const handleThemeChange = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.documentElement.getAttribute('data-cms-theme') === 'dark';
      setIsDark(dark);
    };

    const handleSettingsUpdated = (e: Event) => {
      const updated = (e as CustomEvent)?.detail;
      if (updated) {
        setCSettings(prev => ({ ...prev, ...updated }));
      }
    };

    const handleTemplatesUpdated = (e: Event) => {
      const updated = (e as CustomEvent)?.detail;
      if (updated && Array.isArray(updated)) {
        setChatTemplates(updated);
      }
    };

    window.addEventListener('website_theme_changed', handleThemeChange);
    window.addEventListener('porto_concierge_settings_updated', handleSettingsUpdated);
    window.addEventListener('porto_chat_templates_updated', handleTemplatesUpdated);
    return () => {
      window.removeEventListener('website_theme_changed', handleThemeChange);
      window.removeEventListener('porto_concierge_settings_updated', handleSettingsUpdated);
      window.removeEventListener('porto_chat_templates_updated', handleTemplatesUpdated);
    };
  }, []);

  // Do not render on Admin or LP Image routes
  const isHiddenRoute = typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/lpimage') || window.location.pathname.startsWith('/admin'));

  // Hide floating button when modals request it
  const [isForceHidden, setIsForceHidden] = useState(false);

  useEffect(() => {
    const handleVisibility = (e: Event) => {
      const visible = (e as CustomEvent<{ visible?: boolean }>)?.detail?.visible ?? true;
      setIsForceHidden(!visible);
    };
    window.addEventListener('porto_chat_visibility', handleVisibility);
    return () => window.removeEventListener('porto_chat_visibility', handleVisibility);
  }, []);

  useEffect(() => {
    const handleOpen = (e?: any) => {
      haptic.light();
      setActiveTab('chat');
      setIsOpen(true);
      if (e?.detail?.message) {
        setInputText(e.detail.message);
      }
    };
    const handleOpenConcierge = (e?: any) => {
      haptic.light();
      setActiveTab('brief');
      setIsOpen(true);
      if (e?.detail?.service) {
        setSelectedService(e.detail.service);
      }
      if (e?.detail?.timeline) {
        setSelectedTimeline(e.detail.timeline);
      }
      if (e?.detail?.description) {
        setProjectDescription(e.detail.description);
      }
    };
    window.addEventListener('porto_open_chat', handleOpen);
    window.addEventListener('porto_open_concierge', handleOpenConcierge);
    return () => {
      window.removeEventListener('porto_open_chat', handleOpen);
      window.removeEventListener('porto_open_concierge', handleOpenConcierge);
    };
  }, []);

  const handleSendTemplateQuestion = async (tpl: ChatTemplate) => {
    haptic.medium();
    const senderName = client?.name || 'Pengunjung';
    const senderEmail = client?.email || '';

    try {
      // 1. Send client message
      await setDoc(doc(db, 'porto_conversations', chatId), {
        userName: senderName,
        userEmail: senderEmail,
        clientId: client?.id || null,
        avatar: client?.avatar || null,
        lastMessage: tpl.question,
        lastMessageTime: serverTimestamp(),
        unread: 1,
        online: true
      }, { merge: true });

      await addDoc(collection(db, 'porto_messages'), {
        roomId: chatId,
        senderId: client?.id || chatId,
        senderType: 'client',
        senderName: senderName,
        senderEmail: senderEmail,
        avatar: client?.avatar || null,
        text: tpl.question,
        timestamp: serverTimestamp()
      });

      // 2. Automatic Bot Auto-Reply after 400ms
      setTimeout(async () => {
        try {
          await addDoc(collection(db, 'porto_messages'), {
            roomId: chatId,
            senderId: 'admin_auto_bot',
            senderType: 'admin',
            senderName: 'Studio Auto-Reply',
            avatar: null,
            text: tpl.answer,
            timestamp: serverTimestamp()
          });

          await updateDoc(doc(db, 'porto_conversations', chatId), {
            lastMessage: tpl.answer,
            lastMessageTime: serverTimestamp()
          });
        } catch (e) {
          console.error('Auto reply error:', e);
        }
      }, 400);
    } catch (err) {
      console.error('Failed to send template message:', err);
    }
  };

  useEffect(() => {
    let currentId = client ? `client_chat_${client.id}` : localStorage.getItem('porto_guest_id');
    if (!currentId) {
      currentId = genChatId();
      localStorage.setItem('porto_guest_id', currentId);
    }
    setChatId(currentId);

    const q = query(
      collection(db, 'porto_messages'),
      where('roomId', '==', currentId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setMessages(msgs);
    }, (error) => {
      console.warn("LiveChatWidget snapshot warning:", error);
    });

    return () => unsubscribe();
  }, [client]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const serviceCategories = cSettings.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories;
  const timelineOptions = cSettings.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions;

  const currentService = serviceCategories.find(s => s.id === selectedService) || serviceCategories[0] || { name: 'Kustom' };
  const currentTimeline = timelineOptions.find(t => t.id === selectedTimeline) || timelineOptions[1] || { name: 'Standar' };

  const buildBriefText = () => {
    const clientName = client?.name ? ` dari *${client.name}*` : '';
    return `Halo Tim Studio! Saya ingin mengajukan brief proyek${clientName}:\n` +
      `• *Kebutuhan:* ${currentService.name}\n` +
      `• *Target Waktu:* ${currentTimeline.name}\n` +
      `• *Gambaran Ide:* ${projectDescription.trim() || 'Mohon diskusi lebih lanjut.'}`;
  };

  const handleSendBriefWhatsApp = () => {
    haptic.medium();
    const waNumber = globalSettings?.contactTarget || globalSettings?.whatsapp || '6281234567890';
    const cleanWa = waNumber.replace(/[^0-9]/g, '');
    const message = buildBriefText();
    window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendBriefToChat = async () => {
    haptic.medium();
    const briefText = buildBriefText();
    setActiveTab('chat');

    const senderName = client?.name || 'Pengunjung';
    const senderEmail = client?.email || '';

    try {
      await setDoc(doc(db, 'porto_conversations', chatId), {
        userName: senderName,
        userEmail: senderEmail,
        clientId: client?.id || null,
        avatar: client?.avatar || null,
        lastMessage: `[Brief Proyek] ${currentService.name}`,
        lastMessageTime: serverTimestamp(),
        source: 'project_brief',
        unread: 1,
        online: true
      }, { merge: true });

      await addDoc(collection(db, 'porto_messages'), {
        roomId: chatId,
        senderId: client?.id || chatId,
        senderType: 'client',
        senderName: senderName,
        senderEmail: senderEmail,
        avatar: client?.avatar || null,
        text: briefText,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to send brief to chat:', err);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const now = Date.now();
    if (now - lastSentTimeRef.current < 1500) {
      return; // Anti-spam throttle (min 1.5s interval)
    }
    lastSentTimeRef.current = now;

    haptic.medium();
    setInputText('');

    const senderName = client?.name || 'Pengunjung';
    const senderEmail = client?.email || '';

    try {
      await setDoc(doc(db, 'porto_conversations', chatId), {
        userName: senderName,
        userEmail: senderEmail,
        clientId: client?.id || null,
        avatar: client?.avatar || null,
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        source: 'client_web',
        unread: 1,
        online: true
      }, { merge: true });

      await addDoc(collection(db, 'porto_messages'), {
        roomId: chatId,
        senderId: client?.id || chatId,
        senderType: 'client',
        senderName: senderName,
        senderEmail: senderEmail,
        avatar: client?.avatar || null,
        text: text,
        timestamp: serverTimestamp()
      });

      // Sync message to Google Sheets
      try {
        googleSync.syncChats([{
          id: `msg_${Date.now()}`,
          roomId: chatId,
          senderName: senderName,
          senderId: client?.id || chatId,
          text: text,
          createdAt: new Date().toISOString()
        }]);
      } catch (e) { }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (isHiddenRoute) return null;

  const accent = 'var(--cms-accent, #7c3aed)';

  return (
    <>
      {/* Unified Single Floating Trigger Button */}
      {!isOpen && !isForceHidden && (
        <button
          type="button"
          onClick={() => {
            haptic.light();
            setIsOpen(true);
          }}
          className="live-chat-floating-btn"
          aria-label={cSettings.txtFloatingButton || 'Konsultasi & Chat'}
          style={{
            position: 'fixed',
            bottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
            right: 'max(16px, calc(env(safe-area-inset-right, 0px) + 16px))',
            zIndex: 8900,
            height: 48,
            padding: '0 18px',
            borderRadius: 100,
            background: 'var(--cms-accent, #7c3aed)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'cmsPopIn 0.3s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageCircle size={19} strokeWidth={2.4} />
            <span style={{
              position: 'absolute', top: -2, right: -2, width: 8, height: 8,
              borderRadius: '50%', background: '#10b981', border: '1.5px solid #fff'
            }} />
          </div>
          <span>{cSettings.txtFloatingButton || 'Konsultasi & Chat'}</span>
        </button>
      )}

      {/* Floating Concierge / Live Chat Window */}
      {isOpen && (
        <div
          className="live-chat-window"
          style={{
            position: 'fixed',
            bottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
            right: 'max(16px, calc(env(safe-area-inset-right, 0px) + 16px))',
            width: 'calc(100vw - 32px)',
            maxWidth: 410,
            height: 'min(600px, calc(100dvh - 80px))',
            zIndex: 9999,
            borderRadius: 24,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)'}`,
            background: isDark ? '#151824' : '#ffffff',
            boxShadow: isDark
              ? '0 24px 60px rgba(0, 0, 0, 0.8)'
              : '0 24px 60px rgba(15, 23, 42, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
            animation: 'cmsPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header with Title & Action Buttons */}
          <div style={{
            background: accent,
            padding: '12px 16px',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              {isEditMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 8 }}>
                  <input
                    type="text"
                    value={cSettings.txtHeaderTitle}
                    onChange={e => setCSettings({ ...cSettings, txtHeaderTitle: e.target.value })}
                    placeholder="Judul Header"
                    style={{
                      background: 'rgba(255,255,255,0.22)',
                      border: '1px solid rgba(255,255,255,0.45)',
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: 13.5,
                      fontWeight: 850,
                      padding: '3px 8px',
                      outline: 'none',
                      width: '100%',
                      fontFamily: "'Outfit', sans-serif"
                    }}
                  />
                  <input
                    type="text"
                    value={cSettings.txtHeaderSubtitle}
                    onChange={e => setCSettings({ ...cSettings, txtHeaderSubtitle: e.target.value })}
                    placeholder="Sub-judul Header"
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 10.5,
                      padding: '2px 8px',
                      outline: 'none',
                      width: '100%',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cSettings.txtHeaderTitle || 'Studio Concierge'}
                    </span>
                    <Sparkles size={14} style={{ flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 1, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {client ? `Halo, ${client.name}!` : (cSettings.txtHeaderSubtitle || 'Konsultasi desain & pesan langsung')}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
              <button
                onClick={() => {
                  haptic.light();
                  setIsOpen(false);
                }}
                className="live-chat-close-btn"
                aria-label="Tutup"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  width: 30,
                  height: 30,
                  minWidth: 30,
                  maxWidth: 30,
                  minHeight: 30,
                  maxHeight: 30,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.32)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'}
              >
                <X size={16} strokeWidth={2.4} style={{ width: 16, height: 16, flexShrink: 0, display: 'block' }} />
              </button>
            </div>
          </div>



          {/* Success Banner */}
          {isSavedNotify && (
            <div style={{
              background: '#10b981',
              color: '#ffffff',
              padding: '6px 14px',
              fontSize: 11.5,
              fontWeight: 800,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <CheckCheck size={14} />
              <span>Semua teks Studio Concierge berhasil disimpan!</span>
            </div>
          )}

          {/* Tab Navigation Switcher */}
          <div style={{
            display: 'flex',
            padding: 6,
            background: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            gap: 4
          }}>
            {isEditMode ? (
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 2 }}>Tab 1</div>
                  <input
                    type="text"
                    value={cSettings.txtTabBrief}
                    onChange={e => setCSettings({ ...cSettings, txtTabBrief: e.target.value })}
                    placeholder="Brief Proyek"
                    style={{ width: '100%', padding: '4px 8px', borderRadius: 8, border: '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 2 }}>Tab 2</div>
                  <input
                    type="text"
                    value={cSettings.txtTabChat}
                    onChange={e => setCSettings({ ...cSettings, txtTabChat: e.target.value })}
                    placeholder="Live Chat"
                    style={{ width: '100%', padding: '4px 8px', borderRadius: 8, border: '1px solid #cbd5e1', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setActiveTab('brief');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 100,
                    border: 'none',
                    background: activeTab === 'brief' ? accent : 'transparent',
                    color: activeTab === 'brief' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.2s'
                  }}
                >
                  <FileText size={13} /> {cSettings.txtTabBrief || 'Brief'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setActiveTab('chat');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 100,
                    border: 'none',
                    background: activeTab === 'chat' ? accent : 'transparent',
                    color: activeTab === 'chat' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s'
                  }}
                >
                  <MessageCircle size={14} /> {cSettings.txtTabChat || 'Live Chat'}
                  {activeTab !== 'chat' && messages.filter(m => (m.senderType === 'admin' || m.isAdmin) && !m.read && !m.isRead).length > 0 && (
                    <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 100, background: '#ef4444', color: '#ffffff', fontWeight: 900, animation: 'cmsPulse 1.5s infinite' }}>
                      {messages.filter(m => (m.senderType === 'admin' || m.isAdmin) && !m.read && !m.isRead).length}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* TAB 1: PROJECT BRIEF & CONSULTATION FORM */}
          {activeTab === 'brief' && (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              color: isDark ? '#f1f5f9' : '#0f172a'
            }}>
              <div>
                {isEditMode ? (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 2 }}>Edit Judul Bagian 1:</div>
                    <input
                      type="text"
                      value={cSettings.txtStep1Title}
                      onChange={e => setCSettings({ ...cSettings, txtStep1Title: e.target.value })}
                      placeholder="1. KEBUTUHAN DESAIN / PROYEK"
                      style={{ width: '100%', padding: '5px 9px', borderRadius: 8, border: '1px dashed #f59e0b', background: isDark ? 'rgba(245,158,11,0.08)' : '#fefce8', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11.5, fontWeight: 850, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ) : (
                  <label style={{ fontSize: 11, fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                    {cSettings.txtStep1Title || '1. Kebutuhan Desain / Proyek'}
                  </label>
                )}

                {isEditMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(cSettings.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || []).map((srv, idx) => (
                      <div key={srv.id || idx} style={{ padding: '8px 10px', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="text"
                            value={srv.name}
                            onChange={e => {
                              const cats = [...(cSettings.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || [])];
                              cats[idx] = { ...cats[idx], name: e.target.value };
                              setCSettings({ ...cSettings, serviceCategories: cats });
                            }}
                            placeholder="Nama Kategori Layanan"
                            style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', fontSize: 12, fontWeight: 800, outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(srv.id)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: 6, padding: '4px 7px', cursor: 'pointer' }}
                            title="Hapus Kategori"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={srv.desc || ''}
                          onChange={e => {
                            const cats = [...(cSettings.serviceCategories || DEFAULT_CONCIERGE_SETTINGS.serviceCategories || [])];
                            cats[idx] = { ...cats[idx], desc: e.target.value };
                            setCSettings({ ...cSettings, serviceCategories: cats });
                          }}
                          placeholder="Deskripsi singkat layanan..."
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#cbd5e1' : '#64748b', fontSize: 10.5, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px dashed #3b82f6', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Plus size={13} /> Tambah Layanan Baru
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {serviceCategories.map(srv => {
                      const isSel = selectedService === srv.id;
                      const IconComp = ICON_MAP[srv.icon] || Palette;
                      return (
                        <div
                          key={srv.id}
                          onClick={() => {
                            haptic.light();
                            setSelectedService(srv.id);
                          }}
                          style={{
                            padding: '9px 12px',
                            borderRadius: 14,
                            border: `1.5px solid ${isSel ? accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                            background: isSel ? `${accent}15` : (isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: isSel ? accent : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
                            color: isSel ? '#fff' : (isDark ? '#cbd5e1' : '#475569'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IconComp size={16} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: isSel ? accent : (isDark ? '#fff' : '#0f172a'), fontFamily: "'Outfit', sans-serif" }}>
                              {srv.name}
                            </div>
                            {srv.desc && (
                              <div style={{ fontSize: 10.5, color: isDark ? '#94a3b8' : '#64748b', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {srv.desc}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                {isEditMode ? (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 2 }}>Edit Judul Bagian 2:</div>
                    <input
                      type="text"
                      value={cSettings.txtStep2Title}
                      onChange={e => setCSettings({ ...cSettings, txtStep2Title: e.target.value })}
                      placeholder="2. TARGET WAKTU PENGERJAAN"
                      style={{ width: '100%', padding: '5px 9px', borderRadius: 8, border: '1px dashed #f59e0b', background: isDark ? 'rgba(245,158,11,0.08)' : '#fefce8', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11.5, fontWeight: 850, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ) : (
                  <label style={{ fontSize: 11, fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                    {cSettings.txtStep2Title || '2. Target Waktu Pengerjaan'}
                  </label>
                )}

                {isEditMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(cSettings.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions || []).map((t, idx) => (
                      <div key={t.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="text"
                          value={t.name}
                          onChange={e => {
                            const timelines = [...(cSettings.timelineOptions || DEFAULT_CONCIERGE_SETTINGS.timelineOptions || [])];
                            timelines[idx] = { ...timelines[idx], name: e.target.value };
                            setCSettings({ ...cSettings, timelineOptions: timelines });
                          }}
                          placeholder="Nama Opsi Waktu"
                          style={{ flex: 1, padding: '5px 10px', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11.5, fontWeight: 750, outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTimeline(t.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}
                          title="Hapus Opsi"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddTimeline}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #3b82f6', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Plus size={13} /> Tambah Opsi Waktu
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {timelineOptions.map(t => {
                      const isSel = selectedTimeline === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            haptic.light();
                            setSelectedTimeline(t.id);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 12,
                            border: `1.5px solid ${isSel ? accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                            background: isSel ? accent : (isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                            color: isSel ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{t.name}</span>
                          {isSel && <CheckCircle2 size={14} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                {isEditMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Edit Judul & Placeholder Bagian 3:</div>
                    <input
                      type="text"
                      value={cSettings.txtStep3Title}
                      onChange={e => setCSettings({ ...cSettings, txtStep3Title: e.target.value })}
                      placeholder="3. Ceritakan Ide atau Konsep Proyek"
                      style={{ width: '100%', padding: '5px 9px', borderRadius: 8, border: '1px dashed #f59e0b', background: isDark ? 'rgba(245,158,11,0.08)' : '#fefce8', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11.5, fontWeight: 850, outline: 'none', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      value={cSettings.txtStep3Placeholder}
                      onChange={e => setCSettings({ ...cSettings, txtStep3Placeholder: e.target.value })}
                      placeholder="Placeholder form catatan ide proyek..."
                      style={{ width: '100%', padding: '4px 8px', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`, background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#cbd5e1' : '#64748b', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ) : (
                  <>
                    <label style={{ fontSize: 11, fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6, fontFamily: "'Outfit', sans-serif" }}>
                      {cSettings.txtStep3Title || '3. Ceritakan Ide atau Konsep Proyek'}
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={e => setProjectDescription(e.target.value)}
                      placeholder={cSettings.txtStep3Placeholder || 'Contoh: Saya ingin membuat identitas visual brand coffee shop...'}
                      style={{
                        width: '100%',
                        height: 60,
                        padding: '9px 12px',
                        borderRadius: 14,
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                        background: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                        color: isDark ? '#fff' : '#0f172a',
                        fontSize: 12,
                        fontFamily: "'Inter', sans-serif",
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </>
                )}
              </div>

              {/* Action Buttons: WhatsApp & Direct Live Chat */}
              <div style={{
                marginTop: 'auto',
                padding: '12px 14px',
                borderRadius: 18,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                {isEditMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Edit Teks Tombol Aksi:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} color="#10b981" />
                      <input
                        type="text"
                        value={cSettings.txtBtnWhatsapp}
                        onChange={e => setCSettings({ ...cSettings, txtBtnWhatsapp: e.target.value })}
                        placeholder="Kirim via WhatsApp"
                        style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: '1px solid #10b981', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11.5, fontWeight: 750, outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MessageCircle size={14} color={accent} />
                      <input
                        type="text"
                        value={cSettings.txtBtnLiveChat}
                        onChange={e => setCSettings({ ...cSettings, txtBtnLiveChat: e.target.value })}
                        placeholder="Kirim ke Live Chat Studio"
                        style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: `1px solid ${accent}`, background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', fontSize: 11.5, fontWeight: 750, outline: 'none' }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSendBriefWhatsApp}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 100,
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <Phone size={14} /> {cSettings.txtBtnWhatsapp || 'Kirim Brief via WhatsApp'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendBriefToChat}
                      style={{
                        width: '100%',
                        height: 38,
                        borderRadius: 100,
                        border: `1.5px solid ${accent}`,
                        background: isDark ? `${accent}20` : `${accent}10`,
                        color: accent,
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Send size={13} /> {cSettings.txtBtnLiveChat || 'Kirim ke Live Chat Studio'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{
                flex: 1,
                padding: 16,
                overflowY: 'auto',
                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(248, 250, 252, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b', marginTop: 40, fontSize: 13, padding: '0 20px' }}>
                    {cSettings.txtChatEmpty || '👋 Halo! Ada pertanyaan seputar portofolio atau ide proyek? Silakan kirim pesan langsung di sini.'}
                  </div>
                )}

                {messages.map((msg) => {
                  const isAdminReply = msg.senderType === 'admin' || msg.senderRole === 'admin' || msg.senderId === 'admin' || msg.isAdmin === true;
                  const isMe = !isAdminReply;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        background: isMe ? accent : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff'),
                        color: isMe ? '#ffffff' : (isDark ? '#f1f5f9' : '#0f172a'),
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        border: isMe ? 'none' : (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)'),
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}>
                        {msg.text}
                        <div style={{
                          fontSize: 10,
                          opacity: 0.7,
                          marginTop: 4,
                          textAlign: 'right',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 4
                        }}>
                          {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          {isMe && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Auto-Response Templates Chips */}
              <div style={{
                padding: '8px 12px 6px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none'
              }}>
                {chatTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSendTemplateQuestion(tpl)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 100,
                      background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
                      border: '1px solid var(--glass-border)',
                      color: isDark ? '#e2e8f0' : '#334155',
                      fontSize: 11,
                      fontWeight: 750,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                    title={tpl.answer}
                  >
                    <span>⚡</span>
                    <span>{tpl.question}</span>
                  </button>
                ))}
              </div>

              {/* Chat Input Form */}
              <div style={{
                padding: '10px 12px 12px',
                background: isDark ? 'rgba(20, 20, 30, 0.9)' : '#ffffff',
                borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
              }}>
                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={cSettings.txtChatPlaceholder || 'Ketik pesan untuk tim studio...'}
                    style={{
                      flex: 1,
                      height: 44,
                      padding: '0 16px',
                      background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
                      borderRadius: 100,
                      fontSize: 13.5,
                      outline: 'none',
                      color: isDark ? '#ffffff' : '#0f172a',
                      transition: 'border 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = accent}
                    onBlur={e => e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    aria-label="Kirim Pesan"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: inputText.trim() ? accent : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                      transition: 'background 0.2s, transform 0.15s',
                      flexShrink: 0
                    }}
                    onMouseEnter={e => { if (inputText.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Send size={18} style={{ marginLeft: -2 }} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .live-chat-close-btn {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          min-height: 32px !important;
          max-width: 32px !important;
          max-height: 32px !important;
          aspect-ratio: 1 / 1 !important;
          border-radius: 50% !important;
          flex-shrink: 0 !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .live-chat-close-btn svg {
          width: 17px !important;
          height: 17px !important;
          min-width: 17px !important;
          min-height: 17px !important;
          max-width: 17px !important;
          max-height: 17px !important;
          flex-shrink: 0 !important;
          display: block !important;
        }
        @media (max-width: 768px) {
          .live-chat-floating-btn {
            width: 48px !important;
            height: 48px !important;
            padding: 0 !important;
            justify-content: center !important;
            border-radius: 50% !important;
            bottom: max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px)) !important;
            right: max(14px, calc(env(safe-area-inset-right, 0px) + 14px)) !important;
          }
          .live-chat-floating-btn span {
            display: none !important;
          }
          .live-chat-window {
            width: calc(100vw - 24px) !important;
            right: 12px !important;
            bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 12px)) !important;
            height: min(580px, calc(100dvh - 32px)) !important;
            border-radius: 20px !important;
          }
        }
      `}</style>
    </>
  );
}
