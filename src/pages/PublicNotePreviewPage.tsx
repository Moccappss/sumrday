import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, Layers, Share2, Check, ExternalLink, Printer,
  MessageSquare, CheckCircle2, Circle, Lightbulb, Code, Quote,
  Calendar, Tag, Folder, ArrowLeft, Download, Eye, Sparkles, Copy,
  ShieldCheck, AlertCircle, RefreshCw, Sun, Moon, Lock, Key,
  ThumbsUp, Edit3, X, CheckSquare, Clock, Shield
} from 'lucide-react';
import { storage } from '../utils/storage';
import SEOHelmet from '../components/SEOHelmet';
import WhiteboardModule from '../components/admin/WhiteboardModule';
import { useBusinessProfile, formatWhatsAppNumber } from '../hooks/useBusinessProfile';
import { NoteItem } from '../components/admin/MemoManager';

interface NoteBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'number' | 'quote' | 'callout' | 'code' | 'table' | 'image' | 'divider' | 'p';
  text: string;
  checked?: boolean;
  url?: string;
  size?: 'small' | 'medium' | 'full';
  wrap?: 'inline' | 'left' | 'right' | 'center';
}

// ── Block parser for rich document presentation ──
const parseTextToPreviewBlocks = (text: string, startIdx: number): NoteBlock[] => {
  const lines = text.split('\n');
  const blocks: NoteBlock[] = [];
  let codeBuffer: string[] = [];
  let inCode = false;
  let tableBuffer: string[] = [];
  let inTable = false;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ id: `p_${blocks.length + startIdx}`, type: 'p', text: paragraphBuffer.join('\n') });
      paragraphBuffer = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      flushParagraph();
      const validRows = tableBuffer.filter(r => !/^\|[\s\-:|]+\|$/.test(r.trim()));
      if (validRows.length > 0) {
        blocks.push({ id: `tbl_${blocks.length + startIdx}`, type: 'table', text: validRows.join('\n') });
      }
      tableBuffer = [];
    }
    inTable = false;
  };

  const flushCode = () => {
    flushTable();
    flushParagraph();
    blocks.push({ id: `code_${blocks.length + startIdx}`, type: 'code', text: codeBuffer.join('\n') });
    codeBuffer = [];
    inCode = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        flushCode();
      } else {
        flushTable();
        flushParagraph();
        inCode = true;
        codeBuffer = [];
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushParagraph();
      inTable = true;
      tableBuffer.push(line.trim());
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      blocks.push({ id: `div_${blocks.length + startIdx}`, type: 'divider', text: '' });
      continue;
    }
    if (/^# /.test(line)) {
      flushParagraph();
      blocks.push({ id: `h1_${blocks.length + startIdx}`, type: 'h1', text: line.replace(/^# /, '') });
      continue;
    }
    if (/^## /.test(line)) {
      flushParagraph();
      blocks.push({ id: `h2_${blocks.length + startIdx}`, type: 'h2', text: line.replace(/^## /, '') });
      continue;
    }
    if (/^### /.test(line)) {
      flushParagraph();
      blocks.push({ id: `h3_${blocks.length + startIdx}`, type: 'h3', text: line.replace(/^### /, '') });
      continue;
    }
    if (/^- \[x\] /i.test(line)) {
      flushParagraph();
      blocks.push({ id: `todo_${blocks.length + startIdx}`, type: 'todo', text: line.replace(/^- \[x\] /i, ''), checked: true });
      continue;
    }
    if (/^- \[ \] /.test(line)) {
      flushParagraph();
      blocks.push({ id: `todo_${blocks.length + startIdx}`, type: 'todo', text: line.replace(/^- \[ \] /, ''), checked: false });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      flushParagraph();
      blocks.push({ id: `num_${blocks.length + startIdx}`, type: 'number', text: line.replace(/^\d+\. /, '') });
      continue;
    }
    if (/^- /.test(line)) {
      flushParagraph();
      blocks.push({ id: `bullet_${blocks.length + startIdx}`, type: 'bullet', text: line.replace(/^- /, '') });
      continue;
    }
    if (/^> 💡 /.test(line)) {
      flushParagraph();
      blocks.push({ id: `callout_${blocks.length + startIdx}`, type: 'callout', text: line.replace(/^> 💡 /, '') });
      continue;
    }
    if (/^> /.test(line)) {
      flushParagraph();
      blocks.push({ id: `quote_${blocks.length + startIdx}`, type: 'quote', text: line.replace(/^> /, '') });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushTable();
  flushParagraph();
  if (inCode) flushCode();
  return blocks;
};

const parseDocumentBlocks = (content: string): NoteBlock[] => {
  if (!content || !content.trim()) return [];

  const imgRegex = /(!\[.*?\]\(.*?\))/g;
  const rawParts = content.split(imgRegex);
  const blocks: NoteBlock[] = [];

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;

    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      let rawAlt = imgMatch[1] || '';
      let size: 'small' | 'medium' | 'full' = 'full';
      let wrap: 'inline' | 'left' | 'right' | 'center' = 'inline';
      const segs = rawAlt.split(/[|:]/);
      let cleanAlt = segs[0] || 'Pratinjau Gambar';
      for (let p = 1; p < segs.length; p++) {
        const seg = segs[p].toLowerCase().trim();
        if (seg === 'small' || seg === 'kecil' || seg === '25%') size = 'small';
        else if (seg === 'medium' || seg === 'sedang' || seg === '50%' || seg === '75%') size = 'medium';
        else if (seg === 'full' || seg === 'penuh' || seg === '100%') size = 'full';
        else if (seg === 'left') wrap = 'left';
        else if (seg === 'right') wrap = 'right';
        else if (seg === 'center') wrap = 'center';
      }
      blocks.push({
        id: `img_${blocks.length}`,
        type: 'image',
        text: cleanAlt,
        url: imgMatch[2],
        size,
        wrap
      });
    } else {
      const lineBlocks = parseTextToPreviewBlocks(part, blocks.length);
      blocks.push(...lineBlocks);
    }
  }

  return blocks;
};

// ── Inline Rich Text Renderer (bold, italic, strikethrough, code, links) ──
const renderInlineFormatted = (text: string, isDark: boolean = true) => {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|~~.*?~~|`.*?`|\[.*?\]\(.*?\))/g);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return <span key={i} style={{ textDecoration: 'line-through', opacity: 0.72 }}>{part.slice(2, -2)}</span>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code 
          key={i} 
          style={{ 
            background: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)', 
            color: isDark ? '#a5b4fc' : '#4f46e5', 
            padding: '2px 6px', 
            borderRadius: 6, 
            fontSize: '0.9em', 
            fontFamily: 'monospace' 
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a 
          key={i} 
          href={linkMatch[2]} 
          target="_blank" 
          rel="noreferrer" 
          style={{ 
            color: isDark ? '#818cf8' : '#4f46e5', 
            fontWeight: 750, 
            textDecoration: 'underline', 
            textUnderlineOffset: 3 
          }}
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const PublicNotePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useBusinessProfile();
  const [note, setNote] = useState<NoteItem | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Security: PIN Gate State
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Client Feedback & Decision Modals
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Theme Mode: dark by default, toggleable to light paper
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('sumr_note_preview_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const togglePreviewTheme = () => {
    const next = previewTheme === 'dark' ? 'light' : 'dark';
    setPreviewTheme(next);
    try {
      localStorage.setItem('sumr_note_preview_theme', next);
    } catch {}
  };

  const isDark = previewTheme === 'dark';

  // ── High Contrast Color Tokens ──
  const t = useMemo(() => ({
    pageBg: isDark ? '#080c14' : '#f1f5f9',
    pageGlow: isDark 
      ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.18), transparent)' 
      : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.08), transparent)',
    
    // Header
    headerBg: isDark ? 'rgba(8, 12, 20, 0.94)' : 'rgba(255, 255, 255, 0.94)',
    headerBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    headerText: isDark ? '#f8fafc' : '#0f172a',
    headerSubtext: isDark ? '#94a3b8' : '#64748b',
    headerBtnBg: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    headerBtnBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    headerBtnText: isDark ? '#e2e8f0' : '#1e293b',

    // Document Card / Presentation Sheet
    sheetBg: isDark ? '#0f172a' : '#ffffff',
    sheetBorder: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
    sheetShadow: isDark 
      ? '0 25px 65px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.04)' 
      : '0 20px 45px -10px rgba(15, 23, 42, 0.1), 0 2px 10px rgba(15, 23, 42, 0.05)',
    
    // Document Meta Card
    metaCardBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
    metaCardBorder: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #e2e8f0',
    metaDateColor: isDark ? '#94a3b8' : '#64748b',
    tagBg: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
    tagBorder: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1',
    tagText: isDark ? '#cbd5e1' : '#334155',

    // Typography
    titleColor: isDark ? '#ffffff' : '#0f172a',
    h1Color: isDark ? '#ffffff' : '#0f172a',
    h2Color: isDark ? '#f1f5f9' : '#1e293b',
    h3Color: isDark ? '#e2e8f0' : '#334155',
    pColor: isDark ? '#cbd5e1' : '#334155',
    dividerColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
    
    // Checklist / Todos
    todoBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
    todoBorder: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #e2e8f0',
    todoText: isDark ? '#f8fafc' : '#0f172a',
    todoCheckedBg: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
    todoCheckedBorder: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #bbf7d0',
    todoCheckedText: isDark ? '#64748b' : '#94a3b8',

    // Lists
    listText: isDark ? '#e2e8f0' : '#334155',

    // Quotes
    quoteBg: isDark ? 'rgba(99, 102, 241, 0.08)' : '#f5f3ff',
    quoteBorder: '#6366f1',
    quoteText: isDark ? '#e0e7ff' : '#3730a3',

    // Callout
    calloutBg: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
    calloutBorder: isDark ? '1.5px solid rgba(245, 158, 11, 0.3)' : '1.5px solid #fde68a',
    calloutText: isDark ? '#fef3c7' : '#92400e',

    // Code
    codeBg: isDark ? '#050811' : '#0f172a',
    codeHeaderBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#1e293b',
    codeBorder: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #334155',
    codeText: '#e2e8f0',

    // Attachments
    attBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
    attBorder: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
    attText: isDark ? '#ffffff' : '#0f172a',

    // Bottom CTA
    ctaBg: isDark 
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(168, 85, 247, 0.16) 100%)' 
      : 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
    ctaBorder: isDark ? '1.5px solid rgba(99, 102, 241, 0.3)' : '1.5px solid #c7d2fe',
    ctaTitle: isDark ? '#ffffff' : '#1e1b4b',
    ctaSubtitle: isDark ? 'rgba(255, 255, 255, 0.75)' : '#4338ca',
  }), [isDark]);

  // Close modals / lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImg) setLightboxImg(null);
        else if (isAccModalOpen) setIsAccModalOpen(false);
        else if (isRevisionModalOpen) setIsRevisionModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImg, isAccModalOpen, isRevisionModalOpen]);

  // Fetch note by id & verify PIN unlock
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsPinUnlocked(false);
    setEnteredPin('');
    setPinError('');

    const loadNoteData = async () => {
      try {
        const [savedNotes, savedFolders] = await Promise.all([
          storage.getItem('porto_memo_notes', []),
          storage.getItem('porto_memo_folders', [])
        ]);

        if (!isMounted) return;

        if (Array.isArray(savedFolders)) {
          setFolders(savedFolders);
        }

        let targetNote: NoteItem | null = null;

        if (Array.isArray(savedNotes)) {
          const found = savedNotes.find(n => n.id === id);
          if (found) targetNote = found;
        }

        // Fallback from localStorage
        if (!targetNote) {
          const localRaw = localStorage.getItem('idb_porto_memo_notes');
          if (localRaw) {
            try {
              const parsed = JSON.parse(localRaw);
              const foundLocal = Array.isArray(parsed) ? parsed.find((n: any) => n.id === id) : null;
              if (foundLocal) targetNote = foundLocal;
            } catch (e) {
              console.error('Failed to parse local memo notes', e);
            }
          }
        }

        // Cloud fallback if visitor has stale local cache without the newly shared note ID
        if (!targetNote && id) {
          const freshCloudNotes = await storage.getItem('porto_memo_notes', [], true);
          if (Array.isArray(freshCloudNotes)) {
            const foundCloud = freshCloudNotes.find((n: any) => n.id === id);
            if (foundCloud) targetNote = foundCloud;
          }
        }

        if (targetNote && isMounted) {
          setNote(targetNote);

          // Check PIN lock
          if (!targetNote.sharePassword) {
            setIsPinUnlocked(true);
          } else {
            const unlocked = sessionStorage.getItem(`sumr_pin_unlocked_${targetNote.id}`);
            if (unlocked === 'true' || unlocked === targetNote.sharePassword) {
              setIsPinUnlocked(true);
            }
          }

          // Track view count (once per session to avoid inflation)
          const sessionKey = `sumr_view_tracked_${targetNote.id}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            const updatedViews = (targetNote.viewCount || 0) + 1;
            const updatedTime = new Date().toISOString();
            
            // Save view update to storage
            if (Array.isArray(savedNotes)) {
              const updatedNotes = savedNotes.map(n => n.id === targetNote!.id ? {
                ...n,
                viewCount: updatedViews,
                lastViewedAt: updatedTime
              } : n);
              storage.debouncedSetItem('porto_memo_notes', updatedNotes, 1000);
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching note preview', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadNoteData();

    // Listen for live updates if active
    const unsub = storage.listenItem('porto_memo_notes', (incomingNotes: any) => {
      if (!isMounted || !Array.isArray(incomingNotes)) return;
      const found = incomingNotes.find((n: any) => n.id === id);
      if (found) {
        setNote(found);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, [id]);

  const folderName = useMemo(() => {
    if (!note?.folderId) return '';
    const f = folders.find(item => item.id === note.folderId);
    return f?.name || '';
  }, [note, folders]);

  const documentBlocks = useMemo(() => {
    if (!note || note.type === 'canvas') return [];
    return parseDocumentBlocks(note.content);
  }, [note]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note?.sharePassword) {
      setIsPinUnlocked(true);
      return;
    }

    if (enteredPin.trim() === note.sharePassword.trim()) {
      setIsPinUnlocked(true);
      setPinError('');
      sessionStorage.setItem(`sumr_pin_unlocked_${note.id}`, 'true');
    } else {
      setPinError('PIN yang Anda masukkan salah. Silakan coba lagi.');
    }
  };

  // Helper to persist note updates (such as Approval & Revision status)
  const saveNoteFeedback = async (patch: Partial<NoteItem>) => {
    if (!note) return;
    try {
      const savedNotes = await storage.getItem('porto_memo_notes', []);
      if (Array.isArray(savedNotes)) {
        const updated = savedNotes.map(n => n.id === note.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n);
        await storage.setItem('porto_memo_notes', updated);
      }
      setNote(prev => prev ? { ...prev, ...patch } : null);
    } catch (err) {
      console.error('Failed to save note feedback', err);
    }
  };

  // Handle Client ACC (Approval)
  const handleApproveNote = async () => {
    if (!note) return;
    const approvalDate = new Date().toISOString();
    await saveNoteFeedback({
      approvalStatus: 'approved',
      approvalDate
    });
    setIsAccModalOpen(false);

    // Open WhatsApp
    const studioPhone = formatWhatsAppNumber(profile?.whatsapp || profile?.phone || '6281234567890');
    const noteTitle = note.title || 'Draf Konsep Proyek';
    const currentUrl = window.location.href;
    const msg = `Halo tim sumr.day Studio! 👋\n\nSaya telah meninjau draf konsep:\n📌 *${noteTitle}*\n🔗 ${currentUrl}\n\n✅ *STATUS: KAMI SETUJUI (ACC)*\nKonsep ini sudah sesuai dan siap dilanjutkan ke tahap berikutnya. Terima kasih banyak!`;
    const target = studioPhone ? `https://wa.me/${studioPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(target, '_blank');
  };

  // Handle Client Revision Request
  const handleSubmitRevision = async () => {
    if (!note || !revisionNotes.trim()) return;
    const approvalDate = new Date().toISOString();
    await saveNoteFeedback({
      approvalStatus: 'revision',
      approvalNote: revisionNotes.trim(),
      approvalDate
    });
    setIsRevisionModalOpen(false);

    // Open WhatsApp with detailed revision
    const studioPhone = formatWhatsAppNumber(profile?.whatsapp || profile?.phone || '6281234567890');
    const noteTitle = note.title || 'Draf Konsep Proyek';
    const currentUrl = window.location.href;
    const msg = `Halo tim sumr.day Studio! 👋\n\nTerkait draf konsep:\n📌 *${noteTitle}*\n🔗 ${currentUrl}\n\n✏️ *CATATAN REVISI KAMI:*\n${revisionNotes.trim()}\n\nMohon bantuannya untuk diperbarui ya. Terima kasih!`;
    const target = studioPhone ? `https://wa.me/${studioPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(target, '_blank');
  };

  const handleShareWhatsApp = () => {
    const studioPhone = formatWhatsAppNumber(profile?.whatsapp || profile?.phone || '6281234567890');
    const noteTitle = note?.title || 'Draf Konsep Proyek';
    const currentUrl = window.location.href;
    const msg = `Halo sumr.day Studio! Saya ingin mendiskusikan draf konsep "${noteTitle}".\n\nLink Pratinjau:\n${currentUrl}\n\nTerima kasih!`;
    const target = studioPhone ? `https://wa.me/${studioPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(target, '_blank');
  };

  const formattedDate = useMemo(() => {
    if (!note?.updatedAt && !note?.createdAt) return '';
    try {
      const d = new Date(note.updatedAt || note.createdAt);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }, [note]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#080c14',
        color: '#ffffff',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: 14, fontWeight: 600, opacity: 0.85 }}>Menyiapkan Pratinjau Konsep...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!note || note.isTrash) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#080c14',
        color: '#ffffff',
        fontFamily: "'Outfit', sans-serif",
        textAlign: 'center'
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          <AlertCircle size={36} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Draf Catatan Tidak Ditemukan</h1>
        <p style={{ fontSize: 15, opacity: 0.75, maxWidth: 440, lineHeight: 1.6, marginBottom: 28, color: '#cbd5e1' }}>
          Tautan pratinjau ini mungkin telah diarsipkan, diperbarui, atau sudah tidak berlaku lagi. Silakan hubungi tim studio kami untuk tautan terbaru.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 12,
            background: '#6366f1',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 14
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // ── PIN GATE SCREEN (Security Gate for Protected Drafts) ──
  if (note.sharePassword && !isPinUnlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#080c14',
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99,102,241,0.2), transparent 70%)',
        color: '#ffffff',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Logo & Lock Icon */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            marginBottom: 20
          }}>
            <Lock size={30} />
          </div>

          <div style={{
            fontSize: 11,
            fontWeight: 850,
            color: '#818cf8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6
          }}>
            sumr.day Studio • Dokumen Rahasia
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px 0', color: '#ffffff' }}>
            Draf Konsep Terkunci
          </h2>

          <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.55 }}>
            Draf konsep <strong>"{note.title || 'Proyek'}"</strong> dilindungi PIN keamanan. Silakan masukkan PIN akses yang diberikan studio untuk membuka.
          </p>

          <form onSubmit={handleUnlockPin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                value={enteredPin}
                onChange={e => {
                  setEnteredPin(e.target.value);
                  setPinError('');
                }}
                placeholder="Masukkan PIN Akses"
                style={{
                  width: '100%',
                  height: 48,
                  textAlign: 'center',
                  fontSize: 20,
                  letterSpacing: '0.3em',
                  fontWeight: 900,
                  borderRadius: 14,
                  border: pinError ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.14)',
                  background: '#080c14',
                  color: '#ffffff',
                  outline: 'none',
                  boxShadow: pinError ? '0 0 12px rgba(239,68,68,0.3)' : 'none'
                }}
              />
            </div>

            {pinError && (
              <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertCircle size={14} />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              style={{
                height: 48,
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 850,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
                marginTop: 4
              }}
            >
              <Key size={16} />
              <span>Buka Dokumen Konsep</span>
            </button>
          </form>

          <div style={{ marginTop: 24, fontSize: 11.5, color: '#64748b' }}>
            Belum menerima PIN? Hubungi desainer atau tim studio sumr.day.
          </div>
        </div>
      </div>
    );
  }

  const isCanvas = note.type === 'canvas';

  return (
    <div 
      className="sumr-client-preview-root"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: isCanvas ? (isDark ? '#080c14' : '#f8fafc') : t.pageBg,
        backgroundImage: t.pageGlow,
        color: t.titleColor,
        fontFamily: "'Outfit', sans-serif",
        transition: 'background 0.25s ease, color 0.25s ease',
        position: 'relative'
      }}
    >
      <SEOHelmet
        title={`${note.title || 'Draf Catatan Konsep'} | sumr.day Studio Client Preview`}
        description={`Pratinjau konsep dan draf kerja ${note.title || ''} dari sumr.day Creative Digital Studio.`}
      />

      {/* ── DIAGONAL WATERMARK OVERLAY (When enabled) ── */}
      {note.showWatermark && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            pointerEvents: 'none',
            userSelect: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'space-around',
            justifyContent: 'space-around',
            opacity: isDark ? 0.05 : 0.045
          }}
        >
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              style={{
                transform: 'rotate(-25deg)',
                fontSize: 'clamp(18px, 2.5vw, 28px)',
                fontWeight: 900,
                color: isDark ? '#ffffff' : '#000000',
                letterSpacing: '0.15em',
                padding: '40px 60px',
                whiteSpace: 'nowrap'
              }}
            >
              {note.watermarkText || 'DRAFT • SUMR.DAY STUDIO'}
            </div>
          ))}
        </div>
      )}

      {/* ── TOP EXECUTIVE APP BAR (Responsive & Sticky) ── */}
      <header 
        className="preview-no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: t.headerBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${t.headerBorder}`,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          transition: 'background 0.25s ease, border-color 0.25s ease'
        }}
      >
        {/* Brand & Note Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flexWrap: 'wrap' }}>
          <Link
            to="/"
            title="Kunjungi Website sumr.day Studio"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              color: 'inherit',
              flexShrink: 0
            }}
          >
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 16,
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
            }}>
              S
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13.5, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: t.headerText }}>
                sumr.day
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#6366f1', letterSpacing: '0.05em' }}>
                CLIENT PREVIEW
              </span>
            </div>
          </Link>

          <div style={{ width: 1, height: 22, background: t.headerBorder, flexShrink: 0 }} />

          {/* Mode Pill Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 11px',
            borderRadius: 100,
            background: isCanvas ? 'rgba(168, 85, 247, 0.14)' : 'rgba(99, 102, 241, 0.14)',
            border: `1px solid ${isCanvas ? 'rgba(168, 85, 247, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
            color: isCanvas ? '#a855f7' : '#6366f1',
            fontSize: 11,
            fontWeight: 800,
            flexShrink: 0
          }}>
            {isCanvas ? <Layers size={13} /> : <FileText size={13} />}
            <span>{isCanvas ? 'Whiteboard Wireframe' : 'Dokumen Konsep'}</span>
          </div>

          {/* Approval Status Badge */}
          {note.approvalStatus === 'approved' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10b981',
              fontSize: 10.5,
              fontWeight: 850,
              flexShrink: 0
            }}>
              <Check size={13} />
              <span>Sudah Disetujui (ACC)</span>
            </div>
          ) : note.approvalStatus === 'revision' ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              fontSize: 10.5,
              fontWeight: 850,
              flexShrink: 0
            }}>
              <Edit3 size={13} />
              <span>Dalam Tahap Revisi</span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 100,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: 10.5,
              fontWeight: 800,
              flexShrink: 0
            }}>
              <ShieldCheck size={13} />
              <span>Read-Only Draft</span>
            </div>
          )}

          {/* PIN Lock indicator if protected */}
          {note.sharePassword && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px',
              borderRadius: 100,
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#818cf8',
              fontSize: 10.5,
              fontWeight: 800,
              flexShrink: 0
            }} title="Draf ini dilindungi PIN akses">
              <Lock size={12} />
              <span>PIN Aktif</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          {/* Quick Decision Buttons in Header for Fast Client Action */}
          <button
            type="button"
            onClick={() => setIsAccModalOpen(true)}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 850,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <ThumbsUp size={13} />
            <span>ACC Konsep</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRevisionModalOpen(true)}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <Edit3 size={13} />
            <span>Minta Revisi</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={togglePreviewTheme}
            style={{
              height: 34,
              padding: '0 11px',
              borderRadius: 10,
              border: `1px solid ${t.headerBtnBorder}`,
              background: t.headerBtnBg,
              color: t.headerBtnText,
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
            title={isDark ? 'Ganti ke Mode Terang (Kertas)' : 'Ganti ke Mode Gelap (Studio)'}
          >
            {isDark ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#6366f1" />}
            <span className="hidden sm:inline">{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
          </button>

          {/* Print/Download Document Button (Only in Doc mode) */}
          {!isCanvas && (
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                height: 34,
                padding: '0 11px',
                borderRadius: 10,
                border: `1px solid ${t.headerBtnBorder}`,
                background: t.headerBtnBg,
                color: t.headerBtnText,
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              title="Cetak atau Simpan Dokumen sebagai PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>
          )}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              height: 34,
              padding: '0 11px',
              borderRadius: 10,
              border: `1px solid ${t.headerBtnBorder}`,
              background: copiedLink ? 'rgba(16, 185, 129, 0.2)' : t.headerBtnBg,
              color: copiedLink ? '#10b981' : t.headerBtnText,
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
            title="Salin tautan pratinjau ini"
          >
            {copiedLink ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Tersalin!' : 'Bagi Link'}</span>
          </button>
        </div>
      </header>

      {/* ── MODE 2: INTERACTIVE READ-ONLY WHITEBOARD CANVAS ── */}
      {isCanvas ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Subtle client helper banner */}
          <div style={{
            background: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
            borderBottom: isDark ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(99, 102, 241, 0.2)',
            padding: '9px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 12,
            fontWeight: 750,
            color: isDark ? '#c7d2fe' : '#4338ca',
            textAlign: 'center'
          }}>
            <Sparkles size={14} color="#6366f1" style={{ flexShrink: 0 }} />
            <span>
              <strong>Mode Whiteboard Interaktif:</strong> Anda dapat menggeser (drag/pan) kanvas dan memperbesar/memperkecil (zoom) dengan scroll wheel atau tombol navigasi di bawah.
            </span>
          </div>

          <div style={{ flex: 1, position: 'relative', height: 'calc(100vh - 105px)', overflow: 'hidden' }}>
            <WhiteboardModule
              embedded={true}
              readOnly={true}
              canvasNotes={note.canvasNotes || []}
              canvasLines={note.canvasLines || []}
              canvasBg={note.canvasBg || 'grid'}
            />
          </div>
        </div>
      ) : (
        /* ── MODE 1: CONTINUOUS EDITORIAL PRESENTATION SHEET ── */
        <main 
          className="preview-doc-main"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '36px 16px 120px',
            overflowY: 'auto'
          }}
        >
          {/* Main Document Floating Paper/Card Container */}
          <article 
            className="preview-sheet-card"
            style={{
              width: '100%',
              maxWidth: 840,
              background: t.sheetBg,
              border: t.sheetBorder,
              borderRadius: 24,
              boxShadow: t.sheetShadow,
              padding: '32px 36px 44px',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease'
            }}
          >
            {/* Document Header Card */}
            <div style={{
              padding: '22px 24px',
              borderRadius: 18,
              background: t.metaCardBg,
              border: t.metaCardBorder,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {/* Note Meta Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {folderName && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: '#6366f1',
                    background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
                    padding: '3px 11px',
                    borderRadius: 100
                  }}>
                    <Folder size={12} />
                    <span>{folderName}</span>
                  </div>
                )}

                {formattedDate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11.5,
                    fontWeight: 650,
                    color: t.metaDateColor
                  }}>
                    <Calendar size={12} />
                    <span>Diperbarui {formattedDate}</span>
                  </div>
                )}
              </div>

              {/* Document Title */}
              <h1 style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
                margin: 0,
                color: t.titleColor
              }}>
                {note.title || 'Draf Catatan Konsep'}
              </h1>

              {/* Tags */}
              {Array.isArray(note.tags) && note.tags.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 2 }}>
                  {note.tags.map((tg, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: t.tagBg,
                        border: t.tagBorder,
                        color: t.tagText,
                        fontSize: 11,
                        fontWeight: 750
                      }}
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Document Body Blocks */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              {documentBlocks.map((block, blockIdx) => {
                switch (block.type) {
                  case 'h1':
                    return (
                      <h2
                        key={block.id}
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          letterSpacing: '-0.02em',
                          color: t.h1Color,
                          marginTop: 22,
                          marginBottom: 4,
                          paddingBottom: 8,
                          borderBottom: '2px solid rgba(99, 102, 241, 0.35)'
                        }}
                      >
                        {renderInlineFormatted(block.text, isDark)}
                      </h2>
                    );

                  case 'h2':
                    return (
                      <h3
                        key={block.id}
                        style={{
                          fontSize: 21,
                          fontWeight: 850,
                          letterSpacing: '-0.015em',
                          color: t.h2Color,
                          marginTop: 18,
                          marginBottom: 2
                        }}
                      >
                        {renderInlineFormatted(block.text, isDark)}
                      </h3>
                    );

                  case 'h3':
                    return (
                      <h4
                        key={block.id}
                        style={{
                          fontSize: 17.5,
                          fontWeight: 800,
                          color: t.h3Color,
                          marginTop: 14,
                          marginBottom: 2
                        }}
                      >
                        {renderInlineFormatted(block.text, isDark)}
                      </h4>
                    );

                  case 'todo':
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '8px 14px',
                          borderRadius: 12,
                          background: block.checked ? t.todoCheckedBg : t.todoBg,
                          border: block.checked ? t.todoCheckedBorder : t.todoBorder,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{
                          marginTop: 2,
                          color: block.checked ? '#10b981' : (isDark ? '#64748b' : '#94a3b8'),
                          display: 'flex'
                        }}>
                          {block.checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </span>
                        <span style={{
                          fontSize: 15,
                          fontWeight: 650,
                          lineHeight: 1.5,
                          textDecoration: block.checked ? 'line-through' : 'none',
                          color: block.checked ? t.todoCheckedText : t.todoText
                        }}>
                          {renderInlineFormatted(block.text, isDark)}
                        </span>
                      </div>
                    );

                  case 'bullet':
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          paddingLeft: 6
                        }}
                      >
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#6366f1',
                          marginTop: 9,
                          flexShrink: 0
                        }} />
                        <span style={{ fontSize: 15.5, lineHeight: 1.65, color: t.listText }}>
                          {renderInlineFormatted(block.text, isDark)}
                        </span>
                      </div>
                    );

                  case 'number': {
                    let orderNum = 1;
                    for (let k = blockIdx - 1; k >= 0; k--) {
                      if (documentBlocks[k].type === 'number') orderNum++;
                      else break;
                    }
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          paddingLeft: 6
                        }}
                      >
                        <span style={{
                          fontSize: 14,
                          fontWeight: 850,
                          color: '#6366f1',
                          marginTop: 2,
                          flexShrink: 0,
                          minWidth: 20
                        }}>
                          {orderNum}.
                        </span>
                        <span style={{ fontSize: 15.5, lineHeight: 1.65, color: t.listText }}>
                          {renderInlineFormatted(block.text, isDark)}
                        </span>
                      </div>
                    );
                  }

                  case 'table': {
                    const rows = block.text
                      .split('\n')
                      .map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()))
                      .filter(r => r.length > 0);
                    return (
                      <div
                        key={block.id}
                        style={{
                          margin: '10px 0',
                          overflowX: 'auto',
                          borderRadius: 14,
                          border: t.sheetBorder,
                          background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                          <tbody>
                            {rows.map((cells, rIdx) => (
                              <tr
                                key={rIdx}
                                style={{
                                  background: rIdx === 0
                                    ? (isDark ? 'rgba(99, 102, 241, 0.14)' : 'rgba(99, 102, 241, 0.08)')
                                    : 'transparent',
                                  borderBottom: rIdx < rows.length - 1 ? `1px solid ${t.dividerColor}` : 'none'
                                }}
                              >
                                {cells.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    style={{
                                      padding: '10px 14px',
                                      fontWeight: rIdx === 0 ? 800 : 500,
                                      color: rIdx === 0 ? t.titleColor : t.pColor,
                                      borderRight: cIdx < cells.length - 1 ? `1px solid ${t.dividerColor}` : 'none'
                                    }}
                                  >
                                    {renderInlineFormatted(cell, isDark)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  case 'callout':
                    return (
                      <div
                        key={block.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                          padding: '16px 20px',
                          borderRadius: 16,
                          background: t.calloutBg,
                          border: t.calloutBorder,
                          margin: '6px 0'
                        }}
                      >
                        <Lightbulb size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.6, color: t.calloutText }}>
                          {renderInlineFormatted(block.text, isDark)}
                        </div>
                      </div>
                    );

                  case 'quote':
                    return (
                      <blockquote
                        key={block.id}
                        style={{
                          margin: '8px 0',
                          padding: '14px 20px',
                          borderLeft: `4px solid ${t.quoteBorder}`,
                          background: t.quoteBg,
                          borderRadius: '0 14px 14px 0',
                          color: t.quoteText,
                          fontSize: 15.5,
                          fontStyle: 'italic',
                          lineHeight: 1.65
                        }}
                      >
                        {renderInlineFormatted(block.text, isDark)}
                      </blockquote>
                    );

                  case 'code':
                    return (
                      <div
                        key={block.id}
                        style={{
                          position: 'relative',
                          margin: '8px 0',
                          borderRadius: 14,
                          background: t.codeBg,
                          border: t.codeBorder,
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{
                          padding: '8px 16px',
                          background: t.codeHeaderBg,
                          borderBottom: t.codeBorder,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Snippet / Kode
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(block.text);
                              setCopiedCodeId(block.id);
                              setTimeout(() => setCopiedCodeId(null), 2000);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedCodeId === block.id ? '#10b981' : '#cbd5e1',
                              fontSize: 11.5,
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            {copiedCodeId === block.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedCodeId === block.id ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                        <pre style={{
                          margin: 0,
                          padding: '16px 20px',
                          overflowX: 'auto',
                          fontFamily: 'monospace',
                          fontSize: 13.5,
                          lineHeight: 1.6,
                          color: t.codeText
                        }}>
                          <code>{block.text}</code>
                        </pre>
                      </div>
                    );

                  case 'divider':
                    return (
                      <hr
                        key={block.id}
                        style={{
                          margin: '18px 0',
                          border: 'none',
                          borderTop: `1px solid ${t.dividerColor}`
                        }}
                      />
                    );

                  case 'image':
                    return (
                      <div
                        key={block.id}
                        style={{
                          margin: '14px 0',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                      >
                        <div
                          onClick={() => block.url && setLightboxImg(block.url)}
                          style={{
                            maxWidth: block.size === 'small' ? 320 : block.size === 'medium' ? 520 : '100%',
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: t.sheetBorder,
                            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                            cursor: 'zoom-in',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <img
                            src={block.url}
                            alt={block.text || 'Pratinjau Gambar'}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block',
                              objectFit: 'contain'
                            }}
                          />
                        </div>
                        {block.text && block.text !== 'Gambar' && (
                          <span style={{
                            fontSize: 12,
                            fontWeight: 650,
                            color: t.metaDateColor,
                            marginTop: 6
                          }}>
                            {block.text}
                          </span>
                        )}
                      </div>
                    );

                  case 'p':
                  default:
                    if (!block.text.trim()) return <div key={block.id} style={{ height: 6 }} />;
                    return (
                      <p
                        key={block.id}
                        style={{
                          fontSize: 15.5,
                          lineHeight: 1.75,
                          color: t.pColor,
                          margin: 0
                        }}
                      >
                        {renderInlineFormatted(block.text, isDark)}
                      </p>
                    );
                }
              })}
            </div>

            {/* Attachments Section if exists */}
            {Array.isArray(note.attachments) && note.attachments.length > 0 && (
              <div style={{
                marginTop: 12,
                padding: '20px 24px',
                borderRadius: 18,
                background: t.metaCardBg,
                border: t.metaCardBorder,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ fontSize: 13, fontWeight: 850, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Lampiran Berkas Proyek ({note.attachments.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {note.attachments.map((att: any, idx: number) => (
                    <a
                      key={att.id || idx}
                      href={att.url || att.downloadUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: t.attBg,
                        border: t.attBorder,
                        color: t.attText,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        fontSize: 13,
                        fontWeight: 700
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.name || att.title || `Lampiran ${idx + 1}`}
                      </span>
                      <ExternalLink size={14} opacity={0.7} style={{ flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Executive Decision & Call-To-Action Box */}
            <div 
              className="preview-no-print"
              style={{
                marginTop: 24,
                padding: '28px',
                borderRadius: 22,
                background: t.ctaBg,
                border: t.ctaBorder,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 18
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(99,102,241,0.4)'
              }}>
                <Sparkles size={26} />
              </div>

              <div>
                <h3 style={{ fontSize: 21, fontWeight: 900, margin: '0 0 6px 0', color: t.ctaTitle }}>
                  Konfirmasi atau Tanggapi Konsep
                </h3>
                <p style={{ fontSize: 14, color: t.ctaSubtitle, margin: 0, maxWidth: 500, lineHeight: 1.55 }}>
                  Anda dapat langsung menyetujui (ACC) konsep ini atau mengajukan poin perbaikan dengan cepat kepada tim kreatif sumr.day Studio.
                </p>
              </div>

              {/* Decision Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsAccModalOpen(true)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <ThumbsUp size={16} />
                  <span>Setujui Konsep (ACC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(true)}
                  style={{
                    padding: '12px 22px',
                    borderRadius: 14,
                    border: '1.5px solid rgba(245, 158, 11, 0.5)',
                    background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                    color: '#f59e0b',
                    fontSize: 14,
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <Edit3 size={16} />
                  <span>Minta Revisi Konsep</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 14,
                    border: `1px solid ${t.headerBtnBorder}`,
                    background: t.headerBtnBg,
                    color: t.headerBtnText,
                    fontSize: 14,
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Diskusi via WhatsApp</span>
                </button>
              </div>
            </div>
          </article>
        </main>
      )}

      {/* ── ACC / APPROVAL CONFIRMATION MODAL ── */}
      {isAccModalOpen && (
        <div
          onClick={() => setIsAccModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(4, 4, 8, 0.82)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 460,
              background: isDark ? '#0f172a' : '#ffffff',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              borderRadius: 24,
              padding: '30px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              color: isDark ? '#ffffff' : '#0f172a'
            }}
          >
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <CheckCircle2 size={34} />
            </div>

            <h3 style={{ fontSize: 21, fontWeight: 900, margin: '0 0 8px 0' }}>
              Setujui Konsep (ACC)?
            </h3>

            <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 24px 0', lineHeight: 1.55 }}>
              Dengan menyetujui konsep <strong>"{note.title}"</strong>, status draf akan ditandai sebagai <strong>ACC</strong> dan Anda akan dialihkan ke WhatsApp untuk konfirmasi langsung ke studio.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <button
                type="button"
                onClick={() => setIsAccModalOpen(false)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cbd5e1',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 13.5,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleApproveNote}
                style={{
                  flex: 2,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <ThumbsUp size={16} />
                <span>Ya, ACC & Kirim WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVISION REQUEST MODAL ── */}
      {isRevisionModalOpen && (
        <div
          onClick={() => setIsRevisionModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(4, 4, 8, 0.82)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 500,
              background: isDark ? '#0f172a' : '#ffffff',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              borderRadius: 24,
              padding: '28px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              color: isDark ? '#ffffff' : '#0f172a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                    Catatan Revisi Konsep
                  </h3>
                  <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                    Tuliskan hal-hal yang perlu disesuaikan
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              autoFocus
              rows={5}
              value={revisionNotes}
              onChange={e => setRevisionNotes(e.target.value)}
              placeholder="Contoh: Tolong sesuaikan warna palet menjadi lebih hangat, dan tambahkan poin tentang alur pengiriman di tahap 3..."
              style={{
                width: '100%',
                borderRadius: 14,
                border: isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #cbd5e1',
                background: isDark ? '#080c14' : '#f8fafc',
                color: isDark ? '#ffffff' : '#0f172a',
                padding: '14px',
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                style={{
                  height: 42,
                  padding: '0 18px',
                  borderRadius: 12,
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #cbd5e1',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>

              <button
                type="button"
                disabled={!revisionNotes.trim()}
                onClick={handleSubmitRevision}
                style={{
                  height: 42,
                  padding: '0 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: !revisionNotes.trim() ? '#64748b' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 850,
                  cursor: !revisionNotes.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: !revisionNotes.trim() ? 'none' : '0 4px 14px rgba(245, 158, 11, 0.35)'
                }}
              >
                <MessageSquare size={15} />
                <span>Kirim Revisi via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox Modal for Fullscreen Image Viewing ── */}
      {lightboxImg && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999999,
            background: 'rgba(4, 4, 8, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxImg}
            alt="Fullscreen view"
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              objectFit: 'contain',
              borderRadius: 16,
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}
          />
        </div>,
        document.body
      )}

      {/* Print-specific style */}
      <style>{`
        @media print {
          .preview-no-print {
            display: none !important;
          }
          .sumr-client-preview-root {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .preview-doc-main {
            padding: 0 !important;
          }
          .preview-sheet-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            background: #ffffff !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicNotePreviewPage;
