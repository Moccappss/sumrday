import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Search, Send, User, CheckCheck,
  ChevronLeft, Trash2, Bell, Circle, Paperclip, Plus, Zap, Edit3, HelpCircle,
  Receipt, UserPlus
} from 'lucide-react';
import { db, auth } from '../../firebase';
import {
  collection, query, onSnapshot, addDoc, orderBy,
  serverTimestamp, where, limit, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { addUserNotification } from '../../utils/notifications';
import { callGemini } from '../../utils/ai';
import { Sparkles, Loader2, Package, X, Image as ImageIcon, CheckCircle2, Check } from 'lucide-react';
import { useDialog } from './DialogProvider';
import { storage } from '../../utils/storage';
import { googleSync } from '../../utils/googleSync';
import { useContextMenu } from './ContextMenuProvider';

const DEFAULT_TEMPLATES = [
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

const ChatManager = () => {
  const { showConfirm, showPrompt } = useDialog();
  const { openContextMenu } = useContextMenu();
  const [conversations, setConversations] = useState([]);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [shouldSmoothScroll, setShouldSmoothScroll] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-Response Templates Manager State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [chatTemplates, setChatTemplates] = useState(DEFAULT_TEMPLATES);
  const [templateForm, setTemplateForm] = useState({ id: null, question: '', answer: '' });
  const [isGeneratingAiTemplate, setIsGeneratingAiTemplate] = useState(false);

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  /* ── Fetch Conversation List, Products & Templates ── */
  useEffect(() => {
    storage.getItem('porto_catalog_products', []).then(d => setAllProducts(d || []));
    storage.getItem('porto_chat_templates', DEFAULT_TEMPLATES).then(t => {
      if (t && Array.isArray(t) && t.length > 0) setChatTemplates(t);
    });

    const q = query(collection(db, 'porto_conversations'), orderBy('lastMessageTime', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => { console.error('Chat list error:', err); setLoading(false); });
    return () => unsub();
  }, []);

  /* ── Fetch Messages ── */
  useEffect(() => {

    if (!activeChatId) { setMessages([]); return; }
    const q = query(
      collection(db, 'porto_messages'),
      where('roomId', '==', activeChatId),
      limit(120)
    );
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setMessages(msgs);
      updateDoc(doc(db, 'porto_conversations', activeChatId), { unread: 0 }).catch(() => {});
    });
    return () => unsub();
  }, [activeChatId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (activeChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: shouldSmoothScroll ? 'smooth' : 'auto' });

      if (!shouldSmoothScroll) setShouldSmoothScroll(true);
    } else {
      setShouldSmoothScroll(false);
    }

  }, [messages, activeChatId]);

  /* ── Send ── */
  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeChatId) return;
    setInputText('');
    inputRef.current?.focus();
    try {
      const senderName = auth.currentUser?.displayName || 'Admin';
      await addDoc(collection(db, 'porto_messages'), {
        roomId: activeChatId, text,
        senderId: 'admin',
        senderName: senderName,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'porto_conversations', activeChatId), {
        lastMessage: text, lastMessageTime: serverTimestamp(), online: true
      });

      // Auto-sync chat to Google Sheets & Drive in background
      googleSync.syncChats([{
        createdAt: new Date().toISOString(),
        category: 'Live Chat Admin',
        senderName: senderName,
        role: 'Admin Studio',
        roomTitle: `Room #${activeChatId}`,
        text: text,
        isDeleted: false
      }]).catch(() => {});
    } catch (err) { console.error('Send error:', err); }
  };

  const handleAdminFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    setIsUploadingFile(true);
    try {
      const url = await googleSync.uploadFileToDrive(file, null, `Chat_Files/${activeChatId}`);
      const text = `📁 Berkas terlampir: ${file.name}\n${url}`;
      const senderName = auth.currentUser?.displayName || 'Admin';

      await addDoc(collection(db, 'porto_messages'), {
        roomId: activeChatId,
        text,
        senderId: 'admin',
        senderName: senderName,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'porto_conversations', activeChatId), {
        lastMessage: `📁 File: ${file.name}`,
        lastMessageTime: serverTimestamp(),
        online: true
      });

      // Auto-sync attachment message to Google Sheets & Drive in background
      googleSync.syncChats([{
        createdAt: new Date().toISOString(),
        category: 'File Lampiran Chat',
        senderName: senderName,
        role: 'Admin Studio',
        roomTitle: `Room #${activeChatId}`,
        text: `File: ${file.name}`,
        fileUrl: url,
        isDeleted: false
      }]).catch(() => {});
    } catch (err) {
      console.error('File upload error in ChatManager:', err);
      alert('Gagal mengupload file ke Google Drive');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Hapus percakapan ini?');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'porto_conversations', id));
      if (activeChatId === id) setActiveChatId(null);

      // Sync deletion status in Google Sheets (marks as TERHAPUS in soft-red)
      googleSync.syncChats([{
        createdAt: new Date().toISOString(),
        category: 'Arsip Percakapan Dihapus',
        senderName: 'Sistem',
        role: 'Admin',
        roomTitle: `Room #${id}`,
        text: `Percakapan #${id} telah dihapus dari CMS`,
        isDeleted: true
      }]).catch(() => {});
    } catch (e) { console.error(e); }
  };

  const toggleSelectChat = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedChatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllChats = () => {
    if (selectedChatIds.length === filtered.length && filtered.length > 0) {
      setSelectedChatIds([]);
    } else {
      setSelectedChatIds(filtered.map(c => c.id));
    }
  };

  const handleBulkDeleteChats = async () => {
    if (selectedChatIds.length === 0) return;
    const count = selectedChatIds.length;
    const confirmed = await showConfirm(`Hapus permanen ${count} percakapan yang ditandai?`);
    if (!confirmed) return;
    try {
      for (const id of selectedChatIds) {
        await deleteDoc(doc(db, 'porto_conversations', id));
      }
      if (selectedChatIds.includes(activeChatId)) {
        setActiveChatId(null);
      }
      setSelectedChatIds([]);
    } catch (err) {
      console.error('Failed to bulk delete chats:', err);
    }
  };

  const handleSidebarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e, {
      title: 'Konsultasi & Live Chat',
      subtitle: `${conversations.length} sesi terdata`,
      items: [
        {
          label: 'Buka Template Balasan Cepat',
          icon: <Zap size={15} color="#f59e0b" />,
          action: () => setIsTemplateModalOpen(true)
        },
        {
          label: selectedChatIds.length > 0 ? 'Batalkan Semua Pilihan' : 'Mode Pilih: Tandai Semua',
          icon: <Check size={15} color="#6366f1" />,
          action: selectedChatIds.length > 0 ? () => setSelectedChatIds([]) : handleSelectAllChats
        },
        ...(selectedChatIds.length > 0 ? [
          {
            label: `Hapus ${selectedChatIds.length} Percakapan Ditandai`,
            icon: <Trash2 size={15} color="#ef4444" />,
            danger: true,
            action: handleBulkDeleteChats
          }
        ] : [])
      ]
    });
  };

  const handleConvContextMenu = (e: React.MouseEvent, conv: any) => {
    e.preventDefault();
    e.stopPropagation();
    const isSelected = selectedChatIds.includes(conv.id);
    openContextMenu(e, {
      title: conv.userName || 'Anonymous Visitor',
      subtitle: conv.lastMessage || 'Tidak ada pesan',
      items: [
        {
          label: 'Buka Sesi Obrolan Ini',
          icon: <MessageSquare size={15} color="#6366f1" />,
          action: () => setActiveChatId(conv.id)
        },
        {
          label: isSelected ? 'Hilangkan Tanda' : 'Tandai / Mode Pilih',
          icon: <Check size={15} color="#10b981" />,
          action: () => toggleSelectChat(conv.id)
        },
        ...(selectedChatIds.length > 0 ? [
          {
            label: 'Batalkan Semua Pilihan',
            icon: <X size={15} color="#94a3b8" />,
            action: () => setSelectedChatIds([])
          }
        ] : []),
        { separator: true, label: '' },
        {
          label: 'Hapus Percakapan Ini',
          icon: <Trash2 size={15} color="#ef4444" />,
          danger: true,
          action: () => handleDelete(conv.id)
        }
      ]
    });
  };

  const handleNotify = async () => {
    if (!activeChatId) return;
    const msg = await showPrompt('Pesan notifikasi untuk user ini:');
    if (!msg) return;
    try {
      await addUserNotification(activeChatId, 'Pesan dari Admin', msg);

    } catch (e) { alert('Gagal mengirim notifikasi.'); }
  };

  const handleAiSuggest = async () => {
    if (!messages.length) return;
    setIsAiThinking(true);
    const lastUserMsg = [...messages].reverse().find(m => m.senderId !== 'admin')?.text;
    const history = messages.slice(-5).map(m => `${m.senderId === 'admin' ? 'sumr.day' : 'Visitor'}: ${m.text}`).join('\n');
    
    const prompt = `Ini adalah percakapan di website studio sumr.day.\nVisitor bertanya: "${lastUserMsg}"\nRiwayat: \n${history}\n\nBerikan saran balasan yang ramah, hangat, profesional, dan membantu untuk tim sumr.day (admin). Jawab langsung dengan isi pesan balasan saja.`;
    
    const suggestion = await callGemini(prompt, "Kamu adalah asisten studio sumr.day yang membantu membalas pesan pengunjung website dengan gaya hangat dan ramah.");
    if (suggestion) setInputText(suggestion.replace(/^"|"$/g, ''));
    setIsAiThinking(false);
  };

  const activeConv = conversations.find(c => c.id === activeChatId);
  const filtered = conversations.filter(c =>
    (c.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (ts) => {
    if (!ts?.seconds) return '';
    const d = new Date(ts.seconds * 1000);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let lastDate = '';
    msgs.forEach(msg => {
      const date = msg.timestamp?.seconds
        ? new Date(msg.timestamp.seconds * 1000).toDateString()
        : '';
      if (date && date !== lastDate) {
        groups.push({ type: 'date', label: formatDateLabel(msg.timestamp?.seconds) });
        lastDate = date;
      }
      groups.push({ type: 'message', msg });
    });
    return groups;
  };

  const formatDateLabel = (seconds) => {
    if (!seconds) return '';
    const d = new Date(seconds * 1000);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hari Ini';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.question.trim() || !templateForm.answer.trim()) return;

    let updated;
    if (templateForm.id) {
      updated = chatTemplates.map(t => t.id === templateForm.id ? { ...t, question: templateForm.question.trim(), answer: templateForm.answer.trim() } : t);
    } else {
      const newTpl = {
        id: `tpl_${Date.now()}`,
        question: templateForm.question.trim(),
        answer: templateForm.answer.trim()
      };
      updated = [...chatTemplates, newTpl];
    }

    setChatTemplates(updated);
    setTemplateForm({ id: null, question: '', answer: '' });
    await storage.setItem('porto_chat_templates', updated);
    window.dispatchEvent(new CustomEvent('porto_chat_templates_updated', { detail: updated }));
  };

  const handleDeleteTemplate = async (id) => {
    const updated = chatTemplates.filter(t => t.id !== id);
    setChatTemplates(updated);
    if (templateForm.id === id) setTemplateForm({ id: null, question: '', answer: '' });
    await storage.setItem('porto_chat_templates', updated);
    window.dispatchEvent(new CustomEvent('porto_chat_templates_updated', { detail: updated }));
  };

  const handleGenerateAiTemplates = async () => {
    setIsGeneratingAiTemplate(true);
    try {
      const prompt = `Buat 4 pasang Template Pertanyaan dan Jawaban Otomatis (FAQ / Auto-response) yang sering ditanyakan oleh calon klien agensi/studio desain atau website (Bahasa Indonesia).
Format keluaran HARUS berupa valid JSON array of objects tanpa markdown wrap atau teks lainnya:
[
  {
    "question": "Contoh pertanyaan...",
    "answer": "Contoh jawaban ramah, informatif, dan solutif..."
  }
]`;
      const reply = await callGemini(prompt, "Anda adalah sistem asisten bisnis studio desain.", 0.7);
      const cleaned = reply.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const newItems = parsed.map((item, idx) => ({
          id: `tpl_ai_${Date.now()}_${idx}`,
          question: item.question,
          answer: item.answer
        }));
        const updated = [...chatTemplates, ...newItems];
        setChatTemplates(updated);
        await storage.setItem('porto_chat_templates', updated);
        window.dispatchEvent(new CustomEvent('porto_chat_templates_updated', { detail: updated }));
      }
    } catch (err) {
      console.error('AI template generation failed:', err);
    } finally {
      setIsGeneratingAiTemplate(false);
    }
  };

  const handleCreateInvoiceFromChat = () => {
    const activeConv = conversations.find((c: any) => c.id === activeChatId) as any;
    if (!activeConv) return;
    const clientName = activeConv.userName || 'Klien Chat';
    const itemData = {
      id: `chat_${Date.now()}`,
      name: 'Layanan Konsultasi Online',
      price: 0,
      customer: {
        name: clientName,
        phone: activeConv.userPhone || '',
        email: activeConv.userEmail || ''
      },
      notes: `Invoice dibuat dari sesi konsultasi Live Chat (${clientName}).`
    };
    sessionStorage.setItem('porto_auto_create_transaction_item', JSON.stringify(itemData));
    window.dispatchEvent(new CustomEvent('porto_create_transaction_with_item', { detail: { item: itemData } }));
    window.dispatchEvent(new CustomEvent('porto_navigate_admin', { detail: { tab: 'transactions' } }));
  };

  const handleSaveClientFromChat = async () => {
    const activeConv = conversations.find((c: any) => c.id === activeChatId) as any;
    if (!activeConv) return;
    const clientName = activeConv.userName || 'Klien Chat';
    try {
      const existing = await storage.getItem('porto_customers', []);
      const list = Array.isArray(existing) ? existing : [];
      const already = list.find((c: any) => c.name?.toLowerCase() === clientName.toLowerCase());
      if (already) {
        alert(`Klien "${clientName}" sudah terdaftar di kontak.`);
        return;
      }
      const newCustomer = {
        id: `cli_${Date.now()}`,
        name: clientName,
        phone: activeConv.userPhone || '',
        email: activeConv.userEmail || '',
        address: '',
        notes: `Tersimpan dari Live Chat (${new Date().toLocaleDateString('id-ID')})`
      };
      await storage.setItem('porto_customers', [newCustomer, ...list]);
      alert(`✅ Kontak klien "${clientName}" berhasil disimpan ke database!`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
      background: 'var(--cms-bg)', position: 'relative'
    }}>

      {/* ══ SIDEBAR: Conversation List ══ */}
      <div className={`wa-sidebar ${activeChatId ? 'wa-sidebar-hidden' : ''}`}>
        
        {/* Sidebar Header */}
        <div style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.03em' }}>
              Pesan
            </div>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 100,
                background: 'var(--cms-accent)',
                color: '#ffffff',
                border: 'none',
                fontSize: 11.5,
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                transition: 'all 0.15s'
              }}
              title="Kelola Template Balasan Otomatis"
            >
              <Zap size={13} />
              <span>Template Balasan</span>
            </button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--cms-text-muted)', opacity: 0.5
            }} />
            <input
              className="wa-search-input"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', height: 36, paddingLeft: 36, paddingRight: 12,
                background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                borderRadius: 10, fontSize: 13, fontWeight: 500,
                color: 'var(--cms-text)', outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Bulk Selection Bar */}
          {selectedChatIds.length > 0 && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 12,
              background: 'var(--cms-card-bg, #1e293b)',
              border: '1.5px solid var(--cms-accent, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-accent, #6366f1)' }}>
                {selectedChatIds.length} Percakapan Ditandai
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleBulkDeleteChats}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Trash2 size={12} /> Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChatIds([])}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                    background: 'transparent',
                    color: 'var(--cms-text-muted, #94a3b8)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conversation Items */}
        <div 
          onContextMenu={handleSidebarContextMenu}
          style={{ flex: 1, overflowY: 'auto' }}
        >
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', opacity: 0.4 }}>
              <div style={{
                width: 24, height: 24, border: '2px solid var(--cms-input-bg)',
                borderTopColor: 'var(--cms-accent)', borderRadius: '50%',
                animation: 'cmsSpin 0.8s linear infinite', margin: '0 auto'
              }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', opacity: 0.45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={36} style={{ marginBottom: 12, color: 'var(--cms-text-muted)', display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cms-text-muted)' }}>
                {searchQuery ? 'Tidak ada hasil' : 'Belum ada percakapan'}
              </div>
            </div>
          ) : filtered.map(conv => {
            const isSelected = selectedChatIds.includes(conv.id);
            return (
              <button
                key={conv.id}
                onClick={() => setActiveChatId(conv.id)}
                onContextMenu={(e) => handleConvContextMenu(e, conv)}
                style={{
                  width: 'calc(100% - 16px)', display: 'flex', gap: 10, padding: '12px 14px', margin: '4px 8px',
                  background: isSelected ? 'rgba(99,102,241,0.18)' : activeChatId === conv.id ? 'var(--cms-accent-soft)' : 'transparent',
                  borderRadius: 16,
                  border: isSelected ? '1px solid var(--cms-accent)' : 'none',
                  textAlign: 'left', cursor: 'pointer',
                  alignItems: 'center', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: activeChatId === conv.id ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                  transform: activeChatId === conv.id ? 'scale(1)' : 'scale(0.98)'
                }}
              >
                {/* Multi-select checkbox (hanya tampil jika ada yang ditandai via klik kanan/context menu) */}
                {selectedChatIds.length > 0 && (
                  <div
                    onClick={(e) => toggleSelectChat(conv.id, e)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: isSelected ? 'none' : '1.5px solid var(--cms-border, rgba(255,255,255,0.3))',
                      background: isSelected ? 'var(--cms-accent, #6366f1)' : 'rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                    title={isSelected ? 'Batalkan pilihan' : 'Tandai percakapan'}
                  >
                    {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                  </div>
                )}

                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: activeChatId === conv.id
                      ? 'linear-gradient(135deg, var(--cms-accent), #9333ea)'
                      : 'var(--cms-input-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: activeChatId === conv.id ? '#fff' : 'var(--cms-text-muted)',
                    fontSize: 17, fontWeight: 700
                  }}>
                    {conv.userName ? conv.userName.charAt(0).toUpperCase() : <User size={20} />}
                  </div>
                  {conv.online && (
                    <div style={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 11, height: 11, borderRadius: '50%',
                      background: '#22c55e', border: '2px solid var(--cms-bg)'
                    }} />
                  )}
                </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 800, color: activeChatId === conv.id ? 'var(--cms-accent)' : 'var(--cms-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1, display: 'flex', alignItems: 'center'
                  }}>
                    <span>{conv.userName || 'Anonymous'}</span>
                    {conv.source === 'shop' ? (
                      <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, background: 'var(--cms-accent)', color: '#fff', padding: '2px 6px', borderRadius: 100 }}>SHOP</span>
                    ) : (
                      <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', padding: '2px 6px', borderRadius: 100 }}>WEB</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 500, marginLeft: 8, flexShrink: 0 }}>
                    {formatTime(conv.lastMessageTime)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{
                    fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                  }}>
                    {conv.lastMessage || 'Belum ada pesan'}
                  </div>
                  {conv.unread > 0 && (
                    <div className="premium-badge" style={{ position: 'relative', top: 'auto', left: 'auto', minWidth: 18, height: 18, fontSize: 10 }}>
                      {conv.unread > 9 ? '9+' : conv.unread}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        </div>
      </div>

      {/* ══ CHAT AREA ══ */}
      <div className={`wa-chat-area ${activeChatId ? 'wa-chat-active' : ''}`}>

        {activeChatId ? (
          <>
            {/* Chat Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', flexShrink: 0,
              background: 'var(--cms-card-bg)',
              borderBottom: '1px solid var(--glass-border)',
            }}>
              {/* Mobile Back */}
              <button
                className="wa-back-btn"
                onClick={() => { setActiveChatId(null); setShouldSmoothScroll(false); }}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: 'transparent', color: 'var(--cms-text)',
                  display: 'none', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0
                }}
              >
                <ChevronLeft size={22} />
              </button>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--cms-accent), #9333ea)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, fontWeight: 700
                }}>
                  {activeConv?.userName ? activeConv.userName.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                {activeConv?.online && (
                  <div style={{
                    position: 'absolute', bottom: 1, right: 1, width: 10, height: 10,
                    borderRadius: '50%', background: '#22c55e', border: '2px solid var(--cms-card-bg)'
                  }} />
                )}
              </div>

              {/* Name & Status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cms-text)', lineHeight: 1.2 }}>
                  {activeConv?.userName || 'Anonymous'}
                </div>
                <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <Circle size={6} fill="#22c55e" strokeWidth={0} />
                  online
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleSaveClientFromChat}
                  title="Simpan Kontak Klien ke Database"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <UserPlus size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleCreateInvoiceFromChat}
                  title="Buat Nota / Invoice untuk Klien ini"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'rgba(124, 58, 237, 0.1)', color: 'var(--cms-accent, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <Receipt size={16} />
                </button>
                <button
                  onClick={handleNotify}
                  title="Kirim Notifikasi"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <Bell size={16} />
                </button>
                <button
                  onClick={() => handleDelete(activeChatId)}
                  title="Hapus Percakapan"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="wa-messages-area"
              style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}
            >
              {groupMessagesByDate(messages).map((item, idx) => {
                if (item.type === 'date') {
                  return (
                    <div key={`date-${idx}`} style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--cms-text-muted)',
                        background: 'var(--cms-input-bg)', padding: '4px 12px',
                        borderRadius: 100, border: '1px solid var(--glass-border)'
                      }}>
                        {item.label}
                      </span>
                    </div>
                  );
                }

                const { msg } = item;
                const isMe = msg.senderId === 'admin';
                const time = msg.timestamp?.seconds
                  ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '...';

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {/* Bubble */}
                      <div style={{
                        padding: '10px 16px',
                        background: isMe
                          ? 'var(--cms-accent)'
                          : 'var(--cms-card-bg)',
                        color: isMe ? '#fff' : 'var(--cms-text)',
                        borderRadius: isMe
                          ? '20px 20px 4px 20px'
                          : '20px 20px 20px 4px',
                        border: isMe ? 'none' : '1px solid var(--glass-border)',
                        fontSize: 14, fontWeight: 500,
                        lineHeight: 1.5, wordBreak: 'break-word',
                        boxShadow: isMe ? '0 8px 20px rgba(var(--cms-accent-rgb), 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        maxWidth: '100%'
                      }}>
                        {msg.productAttachment && (
                          <div 
                            onClick={() => { setPreviewProduct(msg.productAttachment); setActiveImageIdx(0); }}
                            style={{
                              background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--cms-input-bg)',
                              borderRadius: 12, padding: 12, marginBottom: 8, cursor: 'pointer',
                              display: 'flex', gap: 12, alignItems: 'center', border: isMe ? 'none' : '1px solid var(--glass-border)'
                            }}>
                            {msg.productAttachment.image && (
                              <img src={msg.productAttachment.image} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{msg.productAttachment.name}</div>
                              {msg.productAttachment.variant && <div style={{ fontSize: 11, opacity: 0.8 }}>Varian: {msg.productAttachment.variant}</div>}
                              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{formatRp(msg.productAttachment.price)}</div>
                            </div>
                          </div>
                        )}
                        {msg.text}
                      </div>

                      {/* Time + read status */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        marginTop: 3, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 400 }}>
                          {time}
                        </span>
                        {isMe && <CheckCheck size={14} color="var(--cms-accent)" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} style={{ height: 4 }} />
            </div>

            {/* Input Bar */}
            <div style={{
              padding: window.innerWidth <= 500 ? '12px 16px 108px 16px' : '12px 16px',
              background: 'var(--cms-card-bg)',
              borderTop: '1px solid var(--glass-border)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                 <button 
                   type="button" 
                   onClick={handleAiSuggest}
                   disabled={isAiThinking || !messages.length}
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', 
                     borderRadius: 100, border: 'none', background: 'var(--cms-accent-soft)', 
                     color: 'var(--cms-accent)', fontSize: 11, fontWeight: 900, cursor: 'pointer',
                     opacity: isAiThinking ? 0.7 : 1
                   }}
                 >
                   {isAiThinking ? <Loader2 size={12} className="cms-spin" /> : <Sparkles size={12} />}
                   {isAiThinking ? 'AI BERPIKIR...' : '✨ SARAN BALASAN AI'}
                 </button>
              </div>
              <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Google Drive File Attachment Button */}
                <label 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--cms-input-bg)',
                    border: '1.5px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isUploadingFile ? 'not-allowed' : 'pointer',
                    color: isUploadingFile ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                  title="Lampirkan File ke Google Drive"
                >
                  {isUploadingFile ? <Loader2 size={18} className="cms-spin" /> : <Paperclip size={18} />}
                  <input 
                    type="file" 
                    onChange={handleAdminFileUpload} 
                    disabled={isUploadingFile} 
                    style={{ display: 'none' }} 
                  />
                </label>

                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Ketik balasan..."
                  style={{
                    flex: 1, height: 48, padding: '0 20px',
                    background: 'var(--cms-input-bg)',
                    border: '1.5px solid var(--glass-border)',
                    borderRadius: 100, fontSize: 14, fontWeight: 600,
                    color: 'var(--cms-text)', outline: 'none',
                    fontFamily: 'inherit', transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--cms-accent)'; e.target.style.boxShadow = '0 8px 24px rgba(var(--cms-accent-rgb), 0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: 'none',
                    background: inputText.trim()
                      ? 'var(--cms-accent)'
                      : 'var(--cms-input-bg)',
                    color: inputText.trim() ? '#fff' : 'var(--cms-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: inputText.trim() ? 'pointer' : 'default',
                    flexShrink: 0, transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: inputText.trim() ? 'scale(1)' : 'scale(0.9)',
                    boxShadow: inputText.trim() ? '0 8px 20px rgba(var(--cms-accent-rgb), 0.3)' : 'none'
                  }}
                >
                  <Send size={18} strokeWidth={2.5} style={{ marginLeft: 2 }} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16, padding: 40, textAlign: 'center'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--cms-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cms-accent)'
            }}>
              <MessageSquare size={32} strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cms-text)', marginBottom: 6 }}>
                Pilih Percakapan
              </div>
              <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', lineHeight: 1.6, maxWidth: 280 }}>
                Pilih chat dari daftar di sebelah kiri untuk mulai membalas pesan pelanggan.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Preview Modal */}
      {previewProduct && (() => {
        const fullProduct = allProducts.find((p) => p.id === previewProduct.id);
        const p = fullProduct || {
          name: previewProduct.name, price: previewProduct.price, originalPrice: previewProduct.price,
          description: 'Detail produk tidak ditemukan atau produk telah dihapus.',
          gallery: previewProduct.image ? [previewProduct.image] : [], category: 'Tidak Diketahui'
        };
        const hasDiscount = p.originalPrice > previewProduct.price;
        const discountPercent = hasDiscount ? Math.round(((p.originalPrice - previewProduct.price) / p.originalPrice) * 100) : 0;

        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            animation: 'cmsFadeIn 0.2s ease'
          }} onClick={() => setPreviewProduct(null)}>
            <div style={{
              background: 'var(--cms-card-bg)', borderRadius: 24,
              width: '100%', maxWidth: 1000, maxHeight: '90vh', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              border: '1px solid var(--glass-border)'
            }} onClick={e => e.stopPropagation()}>
              
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cms-bg)' }}>
                 <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--cms-text)' }}>Detail Produk (Preview)</h3>
                 <button onClick={() => setPreviewProduct(null)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}>
                    <X size={24} />
                 </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {/* Gallery */}
                <div style={{ flex: '1 1 400px' }}>
                  <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 24, overflow: 'hidden', background: 'var(--cms-input-bg)', marginBottom: 16, border: '1px solid var(--glass-border)' }}>
                    {p.gallery?.[activeImageIdx] ? (
                      <img src={p.gallery[activeImageIdx]} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : (
                      <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <Package size={64} color="var(--cms-text-muted)" opacity={0.3} />
                      </div>
                    )}
                  </div>
                  {p.gallery?.length > 1 && (
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                      {p.gallery.map((img: string, idx: number) => (
                        <button key={idx} onClick={() => setActiveImageIdx(idx)} style={{ width: 80, height: 80, borderRadius: 16, border: `2px solid ${activeImageIdx === idx ? 'var(--cms-accent)' : 'transparent'}`, overflow: 'hidden', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                          <img src={img} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                      {p.category}
                    </div>
                    <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1, color: 'var(--cms-text)', letterSpacing: '-1px' }}>
                      {p.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--cms-text)' }}>{formatRp(previewProduct.price)}</span>
                      {hasDiscount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 600, color: '#ef4444', textDecoration: 'line-through' }}>{formatRp(p.originalPrice)}</span>
                          <span style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 100 }}>-{discountPercent}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {previewProduct.variant && (
                    <div style={{ background: 'var(--cms-input-bg)', border: '1px dashed var(--glass-border)', padding: 16, borderRadius: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cms-text-muted)', marginBottom: 8 }}>Varian yang ditanyakan pengunjung:</div>
                      <div style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff', fontWeight: 600, alignItems: 'center', gap: 8 }}>
                        {previewProduct.variant} <CheckCircle2 size={16} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--cms-text)' }}>Deskripsi Produk:</div>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--cms-text-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {p.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ MODAL: Auto-Response Templates Manager ══ */}
      {isTemplateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            width: '100%', maxWidth: 580, maxHeight: '88vh',
            background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)',
            borderRadius: 24, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            animation: 'cmsModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 20px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--cms-bg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--cms-accent)', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                    Template Balasan Otomatis
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 500 }}>
                    Kelola pertanyaan cepat & jawaban otomatis bot chat
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setTemplateForm({ id: null, question: '', answer: '' });
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', padding: 6, borderRadius: 8
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Magic AI Generate Button */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(236, 72, 153, 0.12))',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={15} style={{ color: '#f97316' }} />
                    Susun Template dengan AI
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                    AI akan menganalisis dan menyusun 4 template FAQ & balasan otomatis.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiTemplates}
                  disabled={isGeneratingAiTemplate}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 100,
                    background: 'linear-gradient(135deg, #f97316, #ec4899)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: isGeneratingAiTemplate ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(249, 115, 22, 0.3)'
                  }}
                >
                  {isGeneratingAiTemplate ? (
                    <>
                      <Loader2 size={13} className="cms-spin" />
                      <span>Menyusun...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Buat dengan AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Add / Edit Form */}
              <form
                onSubmit={handleSaveTemplate}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: 'var(--cms-input-bg)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex', flexDirection: 'column', gap: 10
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>
                  {templateForm.id ? '✏️ Edit Template' : '➕ Tambah Template Manual'}
                </div>
                <div>
                  <input
                    placeholder="Pertanyaan Pemicu (misal: Berapa lama pengerjaan?)..."
                    value={templateForm.question}
                    onChange={e => setTemplateForm(prev => ({ ...prev, question: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px',
                      borderRadius: 10, border: '1px solid var(--glass-border)',
                      background: 'var(--cms-bg)', color: 'var(--cms-text)',
                      fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Isi Jawaban Balasan Otomatis..."
                    rows={3}
                    value={templateForm.answer}
                    onChange={e => setTemplateForm(prev => ({ ...prev, answer: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px',
                      borderRadius: 10, border: '1px solid var(--glass-border)',
                      background: 'var(--cms-bg)', color: 'var(--cms-text)',
                      fontSize: 13, outline: 'none', resize: 'vertical',
                      boxSizing: 'border-box', fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {templateForm.id && (
                    <button
                      type="button"
                      onClick={() => setTemplateForm({ id: null, question: '', answer: '' })}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        background: 'transparent', border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text-muted)', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!templateForm.question.trim() || !templateForm.answer.trim()}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: 'var(--cms-accent)', color: '#ffffff',
                      border: 'none', fontSize: 12.5, fontWeight: 800,
                      cursor: (!templateForm.question.trim() || !templateForm.answer.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {templateForm.id ? 'Perbarui Template' : 'Simpan Template'}
                  </button>
                </div>
              </form>

              {/* Template Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Daftar Template Aktif ({chatTemplates.length})
                </div>
                {chatTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: 'var(--cms-bg)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex', flexDirection: 'column', gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--cms-accent)' }}>⚡</span>
                        {tpl.question}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setTemplateForm({ id: tpl.id, question: tpl.question, answer: tpl.answer })}
                          style={{
                            padding: '4px 8px', borderRadius: 6,
                            background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                            color: 'var(--cms-text-muted)', cursor: 'pointer', fontSize: 11
                          }}
                          title="Edit Template"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          style={{
                            padding: '4px 8px', borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444', cursor: 'pointer', fontSize: 11
                          }}
                          title="Hapus Template"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--cms-text-muted)' }}>
                      {tpl.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Responsive Styles ── */}
      <style>{`
        .wa-sidebar {
          width: 320px;
          min-width: 320px;
          flex-shrink: 0;
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          background: var(--cms-bg);
          height: 100%;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .wa-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
          background: var(--cms-card-bg);
        }
        .wa-messages-area {
          background: var(--cms-bg);
        }
        .wa-search-input::placeholder { color: var(--cms-text-muted); opacity: 0.6; }

        @media (max-width: 768px) {
          .wa-sidebar {
            position: absolute;
            inset: 0;
            width: 100%;
            min-width: 100%;
            z-index: 10;
            transform: translateX(0);
            border-right: none;
            box-shadow: none;
            padding-bottom: calc(90px + env(safe-area-inset-bottom, 16px));
            box-sizing: border-box;
          }
          .wa-sidebar-hidden {
            transform: translateX(-100%);
            pointer-events: none;
          }
          .wa-chat-area {
            position: absolute;
            inset: 0 0 calc(90px + env(safe-area-inset-bottom, 16px)) 0;
            width: 100%;
            z-index: 20;
            opacity: 0;
            transform: translateX(100%);
            pointer-events: none;
            transition: transform 0.3s ease, opacity 0.3s ease;
          }
          .wa-chat-active {
            opacity: 1;
            transform: translateX(0);
            pointer-events: all;
          }
          .wa-back-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatManager;
