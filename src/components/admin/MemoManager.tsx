import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  StickyNote, Folder, FolderPlus, Plus, Search, Star, Trash2, 
  Pin, Edit3, CheckSquare, Square, List, ListOrdered, Hash, 
  Tag, Download, Copy, Printer, Check, ChevronRight, ChevronLeft, 
  MoreVertical, Clock, Sparkles, Filter, X, ArrowLeft, RefreshCw,
  FolderOpen, BookOpen, AlertCircle, Share2, Archive, Eye, Code,
  FileText, Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, Quote, Minus,
  LayoutGrid, Columns, ChevronDown, CheckCircle2, ChevronUp, Layers, FolderKanban,
  RotateCcw, AlertTriangle, ArrowRight, Home, CornerDownRight, FolderTree,
  Image as ImageIcon, Upload, Library, Loader2, Sparkle, Palette, Layout,
  Table as TableIcon, Link as LinkIcon, Lightbulb, CheckCheck, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify, Info, Rocket,
  PenTool, MessageSquare, Receipt, Briefcase, ListTodo, Megaphone, Compass, UserCheck, Wand2, Zap, Bookmark,
  Shield, ShieldCheck, Cloud, CloudOff, Maximize2, Minimize2, ZoomIn, ExternalLink, ArrowUp, ArrowDown, Paperclip, RotateCw, Undo2, Redo2,
  Lock, Key, EyeOff, Mic, MicOff
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { googleSync } from '../../utils/googleSync';
import { notifyNote } from '../../utils/notifications';
import { useContextMenu } from './ContextMenuProvider';
import MediaGalleryModal from './MediaGalleryModal';
import WhiteboardModule from './WhiteboardModule';
import { generateAiNote, callGemini } from '../../utils/ai';
import { OFFLINE_NOTE_TEMPLATES, buildOfflineNote, OfflineNoteTemplate } from '../../utils/offlineTemplates';
import { 
  getCustomNoteTemplates, 
  saveCustomNoteTemplate, 
  deleteCustomNoteTemplate, 
  getCustomNoteCategories, 
  addCustomNoteCategory, 
  CustomNoteTemplate 
} from '../../utils/customTemplatesStorage';
import CustomDropdown from './CustomDropdown';
import DriveAttachmentPicker from '../common/DriveAttachmentPicker';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useNativeBackHandler } from '../../utils/nativeNavigation';

const getSafeArray = (arr: any) => (Array.isArray(arr) ? arr : []);

export interface NoteComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  type?: 'doc' | 'canvas';
  canvasNotes?: any[];
  canvasLines?: any[];
  canvasBg?: string;
  folderId: string;
  tags: string[];
  taggedAdmins?: string[];
  comments?: NoteComment[];
  attachments?: any[];
  isPinned: boolean;
  isFavorite: boolean;
  isTrash: boolean;
  isOfflineOnly?: boolean; // When true: stored strictly on local device, never uploaded to cloud
  color?: string;
  // Client Preview & Sharing Enhancements
  sharePassword?: string;
  showWatermark?: boolean;
  watermarkText?: string;
  viewCount?: number;
  lastViewedAt?: string;
  approvalStatus?: 'pending' | 'approved' | 'revision';
  approvalNote?: string;
  approvalDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteFolder {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null; // null or 'root' for top-level, or parent folderId for subfolders
  createdAt: string;
}

const DEFAULT_FOLDERS: NoteFolder[] = [
  { id: 'general', name: 'Catatan Umum', color: '#6366f1', parentId: null, createdAt: new Date().toISOString() },
  { id: 'ideas', name: 'Ide & Konsep', color: '#f59e0b', parentId: null, createdAt: new Date().toISOString() },
  { id: 'clients', name: 'Catatan Klien', color: '#10b981', parentId: null, createdAt: new Date().toISOString() },
  { id: 'tasks', name: 'To-Do & Proyek', color: '#ec4899', parentId: null, createdAt: new Date().toISOString() }
];

const NOTE_COLORS = [
  { id: 'default', label: 'Default', bg: 'var(--cms-card-bg)', border: 'var(--glass-border)', dot: '#64748b' },
  { id: 'amber', label: 'Amber', bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.4)', dot: '#f59e0b' },
  { id: 'emerald', label: 'Emerald', bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.4)', dot: '#10b981' },
  { id: 'sky', label: 'Sky', bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.4)', dot: '#38bdf8' },
  { id: 'purple', label: 'Purple', bg: 'rgba(168, 85, 247, 0.14)', border: 'rgba(168, 85, 247, 0.4)', dot: '#a855f7' },
  { id: 'rose', label: 'Rose', bg: 'rgba(244, 63, 94, 0.14)', border: 'rgba(244, 63, 94, 0.4)', dot: '#f43f5e' },
];

// ---------------------------------------------------------
// NOTE ICON MAPPER (100% Lucide SVG Icons, No Emoji)
// ---------------------------------------------------------

const NOTE_ICON_MAP: Record<string, any> = {
  PenTool,
  Layout,
  ImageIcon,
  MessageSquare,
  Receipt,
  UserCheck,
  ListTodo,
  Briefcase,
  CheckCircle2,
  Megaphone,
  FileText,
  Sparkle,
  Compass,
  BookOpen,
  Wand2,
  Zap,
  Layers,
  Palette
};

const INITIAL_NOTE_CONTENT = `# Rencana Kerja & To-Do List

Tulis ide kreatif, konsep proyek, atau daftar pekerjaan harian Anda di sini.

- [ ] Selesaikan brief proyek portofolio
- [ ] Review palet warna & tipografi desain
- [x] Siapkan materi rilis website baru

> "Kreativitas berawal dari ide kecil yang dicatat dan dieksekusi dengan tekun."

### Catatan Tambahan
Gunakan toolbar di atas untuk menambahkan checklist to-do, gambar dari Cloudinary/Galeri, heading tebal, kutipan, dan code block.
`;

interface NoteBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'number' | 'quote' | 'callout' | 'code' | 'table' | 'image' | 'divider' | 'p';
  text: string;
  checked?: boolean;
  url?: string;
  size?: 'small' | 'medium' | 'full';
  wrap?: 'inline' | 'left' | 'right' | 'center';
}

const cleanMarkdownAsterisks = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');
};

// ── Parse a text segment (non-image) into typed blocks (grouping consecutive plain lines for seamless selection) ──
const parseTextSegmentToBlocks = (text: string, startIdx: number, existingBlocks?: NoteBlock[]): NoteBlock[] => {
  const lines = text.split('\n');
  const blocks: NoteBlock[] = [];
  let codeBuffer: string[] = [];
  let inCode = false;
  let paragraphBuffer: string[] = [];

  const getStableId = (pos: number, type: NoteBlock['type']) => {
    const existing = existingBlocks?.[startIdx + pos];
    if (existing && existing.type === type) return existing.id;
    return `blk_${startIdx + pos}_${type}`;
  };

  const flushParagraph = (i: number) => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ id: getStableId(blocks.length, 'p'), type: 'p', text: paragraphBuffer.join('\n') });
      paragraphBuffer = [];
    }
  };

  const flushCode = (i: number) => {
    flushParagraph(i);
    blocks.push({ id: getStableId(blocks.length, 'code'), type: 'code', text: codeBuffer.join('\n') });
    codeBuffer = [];
    inCode = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      if (inCode) {
        flushCode(i);
      } else {
        flushParagraph(i);
        inCode = true;
        codeBuffer = [];
      }
      continue;
    }
    if (inCode) { codeBuffer.push(line); continue; }

    // Divider
    if (/^---+$/.test(line.trim())) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'divider'), type: 'divider', text: '' });
      continue;
    }
    // H1
    if (/^# /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'h1'), type: 'h1', text: line.replace(/^# /, '') });
      continue;
    }
    // H2
    if (/^## /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'h2'), type: 'h2', text: line.replace(/^## /, '') });
      continue;
    }
    // H3
    if (/^### /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'h3'), type: 'h3', text: line.replace(/^### /, '') });
      continue;
    }
    // Todo checked
    if (/^- \[x\] /i.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'todo'), type: 'todo', text: line.replace(/^- \[x\] /i, ''), checked: true });
      continue;
    }
    // Todo unchecked
    if (/^- \[ \] /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'todo'), type: 'todo', text: line.replace(/^- \[ \] /, ''), checked: false });
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'number'), type: 'number', text: line.replace(/^\d+\. /, '') });
      continue;
    }
    // Bullet list
    if (/^- /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'bullet'), type: 'bullet', text: line.replace(/^- /, '') });
      continue;
    }
    // Callout
    if (/^> 💡 /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'callout'), type: 'callout', text: line.replace(/^> 💡 /, '') });
      continue;
    }
    // Quote
    if (/^> /.test(line)) {
      flushParagraph(i);
      blocks.push({ id: getStableId(blocks.length, 'quote'), type: 'quote', text: line.replace(/^> /, '') });
      continue;
    }
    // Plain paragraph (accumulate contiguous lines into single multiline block for 100% fluid selection)
    paragraphBuffer.push(line);
  }

  flushParagraph(lines.length);
  if (inCode) flushCode(lines.length);
  return blocks;
};

const parseContentToBlocks = (content: string, existingBlocks?: NoteBlock[]): NoteBlock[] => {
  if (!content || !content.trim()) {
    const fallbackId = existingBlocks?.[0]?.id || 'b_0';
    return [{ id: fallbackId, type: 'p', text: '' }];
  }

  // Split on markdown image tokens first
  const imgRegex = /(!\[.*?\]\(.*?\))/g;
  const rawParts = content.split(imgRegex);
  const blocks: NoteBlock[] = [];

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;

    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      let rawAlt = imgMatch[1] || '';
      let size: 'small' | 'medium' | 'full' = 'small';
      let wrap: 'inline' | 'left' | 'right' | 'center' = 'inline';
      const segs = rawAlt.split(/[|:]/);
      let cleanAlt = segs[0] || 'Gambar';
      for (let p = 1; p < segs.length; p++) {
        const seg = segs[p].toLowerCase().trim();
        if (seg === 'small' || seg === 'kecil' || seg === '25%') size = 'small';
        else if (seg === 'medium' || seg === 'sedang' || seg === '50%' || seg === '75%') size = 'medium';
        else if (seg === 'full' || seg === 'penuh' || seg === '100%') size = 'full';
        else if (seg === 'left' || seg === 'wrap-left' || seg === 'square-left') wrap = 'left';
        else if (seg === 'right' || seg === 'wrap-right' || seg === 'square-right') wrap = 'right';
        else if (seg === 'center' || seg === 'tengah') wrap = 'center';
        else if (seg === 'inline' || seg === 'top-bottom' || seg === 'atas-bawah') wrap = 'inline';
      }
      const existingImg = existingBlocks?.find(eb => eb.type === 'image' && eb.url === imgMatch[2]);
      const imgId = existingImg?.id || `blk_img_${blocks.length}`;
      blocks.push({
        id: imgId,
        type: 'image', text: cleanAlt, url: imgMatch[2], size, wrap
      });
    } else {
      // Parse text segment line-by-line into typed blocks
      const lineBlocks = parseTextSegmentToBlocks(part, blocks.length, existingBlocks);
      blocks.push(...lineBlocks);
    }
  }

  // Always ensure trailing text block after image
  if (blocks.length === 0 || blocks[blocks.length - 1].type === 'image') {
    const lastId = existingBlocks?.[blocks.length]?.id || `blk_text_end_${blocks.length}`;
    blocks.push({ id: lastId, type: 'p', text: '' });
  }

  return blocks.length > 0 ? blocks : [{ id: existingBlocks?.[0]?.id || 'b_0', type: 'p', text: '' }];
};

// Serialize typed blocks back to markdown text
const serializeBlocksToContent = (blocks: NoteBlock[]): string => {
  return blocks.map((b, idx) => {
    if (b.type === 'image') {
      const sizeTag = b.size || 'small';
      const wrapTag = b.wrap || 'inline';
      return `![${(b.text || 'Gambar')}|${sizeTag}|${wrapTag}](${b.url})`;
    }
    if (b.type === 'h1') return `# ${b.text}`;
    if (b.type === 'h2') return `## ${b.text}`;
    if (b.type === 'h3') return `### ${b.text}`;
    if (b.type === 'todo') return `- ${b.checked ? '[x]' : '[ ]'} ${b.text}`;
    if (b.type === 'bullet') return `- ${b.text}`;
    if (b.type === 'number') return `${idx + 1}. ${b.text}`;
    if (b.type === 'quote') return `> ${b.text}`;
    if (b.type === 'callout') return `> 💡 ${b.text}`;
    if (b.type === 'code') return `\`\`\`\n${b.text}\n\`\`\``;
    if (b.type === 'divider') return `---`;
    return b.text; // 'p'
  }).join('\n');
};

// ── TRUE WYSIWYG AUTO-GROW TEXTAREA (100% TRANSPARENT, ZERO GREY BOXES) ──
const AutoGrowTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onCaretChange?: (pos: number) => void;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}> = ({ value, onChange, onFocus, onKeyDown, onPaste, onCaretChange, inputRef, placeholder, style, className }) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const el = localRef.current;
    if (el) {
      el.style.height = 'auto';
      const targetH = Math.max(28, el.scrollHeight);
      el.style.height = `${targetH}px`;
    }
  };

  useEffect(() => {
    resize();
    const handleWinResize = () => resize();
    window.addEventListener('resize', handleWinResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && localRef.current) {
      ro = new ResizeObserver(() => resize());
      if (localRef.current.parentElement) {
        ro.observe(localRef.current.parentElement);
      }
    }

    return () => {
      window.removeEventListener('resize', handleWinResize);
      ro?.disconnect();
    };
  }, [value]);

  const updateCaret = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (onCaretChange) {
      onCaretChange(e.currentTarget.selectionStart || 0);
    }
  };

  return (
    <textarea
      ref={el => {
        localRef.current = el;
        if (inputRef) inputRef(el);
      }}
      value={value}
      onChange={e => {
        onChange(e.target.value);
        resize();
        updateCaret(e);
      }}
      onFocus={() => {
        if (onFocus) onFocus();
        if (typeof window !== 'undefined' && window.innerWidth <= 768 && localRef.current) {
          setTimeout(() => {
            localRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 80);
        }
      }}
      onSelect={updateCaret}
      onClick={updateCaret}
      onKeyUp={updateCaret}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      placeholder={placeholder}
      rows={1}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      className={`memo-clean-block-input ${className || ''}`}
      style={{
        width: '100%',
        background: 'transparent',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        WebkitBoxShadow: 'none',
        WebkitAppearance: 'none',
        appearance: 'none',
        color: 'var(--cms-text)',
        resize: 'none',
        display: 'block',
        padding: '4px 0',
        margin: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        lineHeight: 1.7,
        ...style
      }}
    />
  );
};

const RichBlockNotepad: React.FC<{
  content: string;
  onChange: (newContent: string) => void;
  activeBlockIndex: number;
  setActiveBlockIndex: (idx: number) => void;
  onCaretChange?: (blockIdx: number, caretPos: number) => void;
}> = ({ content, onChange, activeBlockIndex, setActiveBlockIndex, onCaretChange }) => {
  const [blocks, setBlocks] = useState<NoteBlock[]>(() => parseContentToBlocks(content));
  const blocksRef = useRef<NoteBlock[]>(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string; size: 'small' | 'medium' | 'full'; blockIdx: number } | null>(null);
  useNativeBackHandler(!!lightboxImage, () => setLightboxImage(null), 'memo_lightbox', 35);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isGlobalAllSelected, setIsGlobalAllSelected] = useState(false);
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    const currentSerialized = serializeBlocksToContent(blocksRef.current);
    if (currentSerialized === content) {
      return;
    }
    setBlocks(parseContentToBlocks(content, blocksRef.current));
  }, [content]);

  // Click outside to deselect image and reset global all-selected state
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.memo-doc-image-card')) {
        setActiveImageId(null);
      }
      if (!target.closest('.memo-canvas-container')) {
        setIsGlobalAllSelected(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Keyboard handler when isGlobalAllSelected is active
  useEffect(() => {
    if (!isGlobalAllSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy All (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const fullText = serializeBlocksToContent(blocks);
        navigator.clipboard?.writeText(fullText);
        window.dispatchEvent(new CustomEvent('porto_notify', { 
          detail: { message: "Seluruh isi catatan disalin ke clipboard!", type: "success" } 
        }));
        return;
      }

      // Delete All (Backspace / Delete)
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const emptyBlock = [{ id: `blk_${Date.now()}`, type: 'p' as const, text: '' }];
        isInternalChangeRef.current = true;
        setBlocks(emptyBlock);
        onChange(serializeBlocksToContent(emptyBlock));
        setIsGlobalAllSelected(false);
        setActiveBlockIndex(0);
        setTimeout(() => focusBlock(0, 'start'), 20);
        return;
      }

      // Deselect on navigation
      if (e.key === 'Escape' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setIsGlobalAllSelected(false);
        return;
      }

      // Type replacement on standard character input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const newBlock = [{ id: `blk_${Date.now()}`, type: 'p' as const, text: e.key }];
        isInternalChangeRef.current = true;
        setBlocks(newBlock);
        onChange(serializeBlocksToContent(newBlock));
        setIsGlobalAllSelected(false);
        setActiveBlockIndex(0);
        setTimeout(() => focusBlock(0, 'end'), 20);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalAllSelected, blocks, onChange, setActiveBlockIndex]);

  const focusBlock = (idx: number, pos?: 'start' | 'end' | number) => {
    const el = inputRefs.current[idx];
    if (el) {
      el.focus();
      if (pos === 'start') {
        el.setSelectionRange(0, 0);
      } else if (pos === 'end') {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } else if (typeof pos === 'number') {
        el.setSelectionRange(pos, pos);
      }
    }
  };

  const handleBlockKeyDown = (idx: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const targetEl = e.currentTarget;
    const block = blocks[idx];
    const caret = targetEl.selectionStart || 0;
    const selEnd = targetEl.selectionEnd || 0;
    const isCollapsed = caret === selEnd;

    // Ctrl+A / Cmd+A Document-Wide Selection
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      if (blocks.length > 1) {
        if (targetEl.selectionStart === 0 && targetEl.selectionEnd === targetEl.value.length) {
          e.preventDefault();
          setIsGlobalAllSelected(true);
          setActiveImageId(null);
        } else if (blocks.some(b => b.type === 'image')) {
          e.preventDefault();
          setIsGlobalAllSelected(true);
          setActiveImageId(null);
        }
      }
      return;
    }

    // ENTER KEY:
    if (e.key === 'Enter' && !e.shiftKey) {
      // In code blocks or standard 'p' paragraph blocks, Enter creates natural multiline text inside the same textarea!
      // This allows the user to write continuously across lines and freely drag-select up and down without stuttering.
      if (block.type === 'code' || block.type === 'p') {
        return;
      }

      e.preventDefault();

      // List Items (todo, bullet, number):
      if (['todo', 'bullet', 'number'].includes(block.type)) {
        // If pressing Enter on empty list item, exit list mode -> turn to normal paragraph (p)
        if (!block.text.trim()) {
          handleUpdateBlock(idx, { type: 'p', text: '' });
          return;
        }

        // Split list item at caret
        const textBefore = block.text.slice(0, caret);
        const textAfter = block.text.slice(caret);

        const updated = [
          ...blocks.slice(0, idx),
          { ...block, text: textBefore },
          { id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, type: block.type, text: textAfter, checked: false },
          ...blocks.slice(idx + 1)
        ];

        isInternalChangeRef.current = true;
        setBlocks(updated);
        onChange(serializeBlocksToContent(updated));
        setActiveBlockIndex(idx + 1);
        setTimeout(() => focusBlock(idx + 1, 'start'), 15);
        return;
      }

      // Headings, Quote, Callout:
      // Pressing Enter creates a standard 'p' paragraph below it
      const textBefore = block.text.slice(0, caret);
      const textAfter = block.text.slice(caret);

      const updated = [
        ...blocks.slice(0, idx),
        { ...block, text: textBefore },
        { id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, type: 'p', text: textAfter },
        ...blocks.slice(idx + 1)
      ];

      isInternalChangeRef.current = true;
      setBlocks(updated);
      onChange(serializeBlocksToContent(updated));
      setActiveBlockIndex(idx + 1);
      setTimeout(() => focusBlock(idx + 1, 'start'), 15);
      return;
    }

    // BACKSPACE KEY: Seamless block joining & type degradation
    if (e.key === 'Backspace' && isCollapsed && caret === 0) {
      // 1. If currently in a special block type (heading, list, quote, etc.), backspace turns it back to normal paragraph 'p'
      if (block.type !== 'p') {
        e.preventDefault();
        handleUpdateBlock(idx, { type: 'p' });
        return;
      }

      // 2. If already 'p' and there is a previous block, merge with previous block
      if (idx > 0) {
        e.preventDefault();
        const prevBlock = blocks[idx - 1];

        // If previous block is image or divider: delete it
        if (prevBlock.type === 'image' || prevBlock.type === 'divider') {
          handleDeleteBlock(idx - 1);
          return;
        }

        // If previous block is text: join texts
        const prevLen = (prevBlock.text || '').length;
        const mergedText = (prevBlock.text || '') + (block.text || '');

        const updated = [
          ...blocks.slice(0, idx - 1),
          { ...prevBlock, text: mergedText },
          ...blocks.slice(idx + 1)
        ];

        isInternalChangeRef.current = true;
        setBlocks(updated);
        onChange(serializeBlocksToContent(updated));
        setActiveBlockIndex(idx - 1);
        setTimeout(() => focusBlock(idx - 1, prevLen), 15);
        return;
      }
    }

    // ARROW NAVIGATION: Smooth cross-block caret movement
    if (e.key === 'ArrowUp' && isCollapsed && caret === 0) {
      if (idx > 0) {
        e.preventDefault();
        setActiveBlockIndex(idx - 1);
        focusBlock(idx - 1, 'end');
      }
    } else if (e.key === 'ArrowDown' && isCollapsed && caret === targetEl.value.length) {
      if (idx < blocks.length - 1) {
        e.preventDefault();
        setActiveBlockIndex(idx + 1);
        focusBlock(idx + 1, 'start');
      }
    }
  };

  const handleUpdateBlock = (idx: number, updates: Partial<NoteBlock>) => {
    const updated = blocks.map((b, i) => i === idx ? { ...b, ...updates } : b);
    isInternalChangeRef.current = true;
    setBlocks(updated);
    onChange(serializeBlocksToContent(updated));
  };

  const handleMoveBlock = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx > 0) {
      const updated = [...blocks];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      isInternalChangeRef.current = true;
      setBlocks(updated);
      onChange(serializeBlocksToContent(updated));
      setActiveBlockIndex(idx - 1);
      setTimeout(() => focusBlock(idx - 1, 'end'), 20);
    } else if (direction === 'down' && idx < blocks.length - 1) {
      const updated = [...blocks];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      isInternalChangeRef.current = true;
      setBlocks(updated);
      onChange(serializeBlocksToContent(updated));
      setActiveBlockIndex(idx + 1);
      setTimeout(() => focusBlock(idx + 1, 'end'), 20);
    }
  };

  const handleDeleteBlock = (idx: number) => {
    const updated = blocks.filter((_, i) => i !== idx);
    isInternalChangeRef.current = true;
    const finalBlocks = updated.length > 0 ? updated : [{ id: `blk_${Date.now()}`, type: 'p' as const, text: '' }];
    setBlocks(finalBlocks);
    onChange(serializeBlocksToContent(finalBlocks));
    const targetIdx = Math.max(0, idx - 1);
    setActiveBlockIndex(targetIdx);
    setActiveImageId(null);
    setTimeout(() => {
      focusBlock(targetIdx, 'end');
    }, 20);
  };

  useEffect(() => {
    const handleFocusFirst = () => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
        inputRefs.current[0].setSelectionRange(0, 0);
      }
    };
    const handleSelectAllTrigger = () => {
      setIsGlobalAllSelected(true);
      setActiveImageId(null);
    };
    const handleFocusBlock = (e: Event) => {
      const ce = e as CustomEvent<{ idx: number; pos?: 'start' | 'end' | number }>;
      if (ce.detail && typeof ce.detail.idx === 'number') {
        focusBlock(ce.detail.idx, ce.detail.pos);
      }
    };

    window.addEventListener('porto_memo_focus_first_block', handleFocusFirst);
    window.addEventListener('porto_memo_select_all_doc', handleSelectAllTrigger);
    window.addEventListener('porto_memo_focus_block', handleFocusBlock);
    return () => {
      window.removeEventListener('porto_memo_focus_first_block', handleFocusFirst);
      window.removeEventListener('porto_memo_select_all_doc', handleSelectAllTrigger);
      window.removeEventListener('porto_memo_focus_block', handleFocusBlock);
    };
  }, []);

  return (
    <div
      className={`memo-blocks-flow ${isGlobalAllSelected ? 'is-all-selected' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setActiveImageId(null);
          const lastIdx = blocks.length - 1;
          if (lastIdx >= 0) {
            if (blocks[lastIdx].type === 'image') {
              const updated = [...blocks, { id: `blk_t_${Date.now()}`, type: 'p' as const, text: '' }];
              setBlocks(updated);
              onChange(serializeBlocksToContent(updated));
              setActiveBlockIndex(updated.length - 1);
              setTimeout(() => focusBlock(updated.length - 1, 'start'), 20);
            } else {
              focusBlock(lastIdx, 'end');
            }
          }
        }
      }}
      style={{ display: 'block', width: '100%', flex: '0 0 auto', background: 'transparent', cursor: 'text' }}
    >
      {blocks.map((block, idx) => {
        // MS Word / Google Docs Style Block Image
        if (block.type === 'image') {
          const isSelected = activeImageId === block.id;
          const isSmall = block.size === 'small' || !block.size;
          const isMed = block.size === 'medium';
          const isFull = block.size === 'full';
          const wrap = block.wrap || 'inline';

          let widthStyle = '260px';
          if (isMed) widthStyle = '460px';
          else if (isFull) widthStyle = '100%';

          // Word-Style Wrap Behavior
          let containerStyle: React.CSSProperties = {
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
            margin: '20px 0',
            clear: 'both',
            position: 'relative'
          };

          if (wrap === 'center') {
            containerStyle = { width: '100%', display: 'flex', justifyContent: 'center', margin: '20px auto', clear: 'both', position: 'relative' };
          } else if (wrap === 'left') {
            // Square Left: Text wraps on the right
            containerStyle = { float: 'left', width: widthStyle, margin: '8px 20px 14px 0', clear: 'left', position: 'relative' };
          } else if (wrap === 'right') {
            // Square Right: Text wraps on the left
            containerStyle = { float: 'right', width: widthStyle, margin: '8px 0 14px 20px', clear: 'right', position: 'relative' };
          }

          return (
            <div
              key={block.id}
              className={`memo-doc-image-row is-wrap-${wrap}`}
              style={containerStyle}
            >
              {/* Image Frame Card */}
              <div
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageId(block.id);
                  setActiveBlockIndex(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.preventDefault();
                    handleDeleteBlock(idx);
                  } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (idx < blocks.length - 1 && blocks[idx + 1].type === 'p') {
                      setActiveImageId(null);
                      setActiveBlockIndex(idx + 1);
                      focusBlock(idx + 1, 'start');
                    } else {
                      const updated = [
                        ...blocks.slice(0, idx + 1),
                        { id: `blk_t_${Date.now()}`, type: 'p' as const, text: '' },
                        ...blocks.slice(idx + 1)
                      ];
                      setBlocks(updated);
                      onChange(serializeBlocksToContent(updated));
                      setActiveImageId(null);
                      setActiveBlockIndex(idx + 1);
                      setTimeout(() => focusBlock(idx + 1, 'start'), 20);
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (idx > 0 && blocks[idx - 1].type === 'p') {
                      setActiveImageId(null);
                      setActiveBlockIndex(idx - 1);
                      focusBlock(idx - 1, 'end');
                    }
                  } else if (e.key === 'Escape') {
                    setActiveImageId(null);
                  }
                }}
                className={`memo-doc-image-card is-${block.size || 'small'} ${isSelected ? 'is-selected' : ''}`}
                style={{
                  width: (wrap === 'left' || wrap === 'right') ? '100%' : widthStyle,
                  maxWidth: '100%',
                  position: 'relative',
                  borderRadius: 14,
                  border: isSelected ? '2.5px solid var(--cms-accent, #6366f1)' : '1.5px solid var(--glass-border)',
                  background: 'var(--cms-card-bg)',
                  boxShadow: isSelected ? '0 8px 28px rgba(99, 102, 241, 0.25)' : '0 4px 18px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {/* Clickable Image Body */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageId(prev => prev === block.id ? null : block.id);
                    setActiveBlockIndex(idx);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage({ url: block.url || '', title: block.text, size: block.size || 'small', blockIdx: idx });
                  }}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={block.url}
                    alt={block.text || 'Gambar Catatan'}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '520px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />

                  {/* Clean Floating Toolbar Inside Image at the bottom (NEVER covers text outside) */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        background: 'rgba(15, 23, 42, 0.92)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        padding: '3px 6px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                        zIndex: 20,
                        whiteSpace: 'nowrap',
                        maxWidth: '96%',
                        overflowX: 'auto'
                      }}
                    >
                      {/* Word Wrap Text Modes (Icon Only): In-Line | Wrap Kiri | Tengah | Wrap Kanan */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="cms-circle-btn"
                          onClick={() => handleUpdateBlock(idx, { wrap: 'inline' })}
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                            background: wrap === 'inline' ? 'var(--cms-accent, #6366f1)' : 'transparent',
                            color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0, boxSizing: 'border-box'
                          }}
                          title="Atas & Bawah (In Line with Text)"
                        >
                          <AlignJustify size={14} />
                        </button>

                        <button
                          type="button"
                          className="cms-circle-btn"
                          onClick={() => handleUpdateBlock(idx, { wrap: 'left' })}
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                            background: wrap === 'left' ? 'var(--cms-accent, #6366f1)' : 'transparent',
                            color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0, boxSizing: 'border-box'
                          }}
                          title="Wrap Kiri (Square Left)"
                        >
                          <AlignLeft size={14} />
                        </button>

                        <button
                          type="button"
                          className="cms-circle-btn"
                          onClick={() => handleUpdateBlock(idx, { wrap: 'center' })}
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                            background: wrap === 'center' ? 'var(--cms-accent, #6366f1)' : 'transparent',
                            color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0, boxSizing: 'border-box'
                          }}
                          title="Tengah (Center)"
                        >
                          <AlignCenter size={14} />
                        </button>

                        <button
                          type="button"
                          className="cms-circle-btn"
                          onClick={() => handleUpdateBlock(idx, { wrap: 'right' })}
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                            background: wrap === 'right' ? 'var(--cms-accent, #6366f1)' : 'transparent',
                            color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0, boxSizing: 'border-box'
                          }}
                          title="Wrap Kanan (Square Right)"
                        >
                          <AlignRight size={14} />
                        </button>
                      </div>

                      {/* Sizing (Icon Only with tooltip) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="cms-circle-btn"
                          onClick={() => {
                            const nextSize = isSmall ? 'medium' : isMed ? 'full' : 'small';
                            handleUpdateBlock(idx, { size: nextSize });
                          }}
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8,
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0, boxSizing: 'border-box'
                          }}
                          title={`Ukuran saat ini: ${isSmall ? 'Kecil' : isMed ? 'Sedang' : 'Penuh'} (Klik untuk beralih)`}
                        >
                          <Maximize2 size={13} />
                        </button>
                      </div>

                      {/* Move Up / Down (Icon Only) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="cms-circle-btn"
                          disabled={idx === 0}
                          onClick={() => handleMoveBlock(idx, 'up')}
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                            background: 'transparent', opacity: idx === 0 ? 0.35 : 1,
                            color: '#ffffff', cursor: idx === 0 ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0, boxSizing: 'border-box'
                          }}
                          title="Pindahkan ke atas"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="cms-circle-btn"
                          disabled={idx === blocks.length - 1}
                          onClick={() => handleMoveBlock(idx, 'down')}
                          style={{
                            width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                            background: 'transparent', opacity: idx === blocks.length - 1 ? 0.35 : 1,
                            color: '#ffffff', cursor: idx === blocks.length - 1 ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0, boxSizing: 'border-box'
                          }}
                          title="Pindahkan ke bawah"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Lightbox Zoom (Icon Only) */}
                      <button
                        type="button"
                        className="cms-circle-btn"
                        onClick={() => setLightboxImage({ url: block.url || '', title: block.text, size: block.size || 'small', blockIdx: idx })}
                        style={{
                          width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                          background: 'transparent', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, padding: 0, boxSizing: 'border-box'
                        }}
                        title="Perbesar gambar (Lightbox)"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Delete (Icon Only - Symmetrical Squircle/Circle) */}
                      <button
                        type="button"
                        className="cms-circle-btn"
                        onClick={() => handleDeleteBlock(idx)}
                        style={{
                          width: 28, height: 28, minWidth: 28, minHeight: 28, aspectRatio: '1 / 1', borderRadius: 8, border: 'none',
                          background: '#ef4444', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, padding: 0, boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                        }}
                        title="Hapus gambar"
                      >
                        <Trash2 size={13.5} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Editable Caption / Image Source Footer */}
                <div style={{
                  padding: '4px 8px',
                  background: 'var(--cms-input-bg)',
                  borderTop: '1px solid var(--glass-border)',
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14
                }}>
                  <input
                    type="text"
                    value={block.text || ''}
                    onChange={e => handleUpdateBlock(idx, { text: e.target.value })}
                    placeholder="Sumber / keterangan gambar..."
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: 11.5,
                      color: 'var(--cms-text)',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                      padding: '4px 0',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }

        // Divider
        if (block.type === 'divider') {
          return (
            <div key={block.id} style={{ width: '100%', padding: '8px 0', cursor: 'pointer' }} onClick={() => setActiveBlockIndex(idx)}>
              <hr style={{ border: 'none', borderTop: '2px solid var(--glass-border)', margin: 0 }} />
            </div>
          );
        }

        // Determine block-specific styles
        let blockWrapStyle: React.CSSProperties = { width: '100%', minHeight: 28, background: 'transparent', position: 'relative', marginBottom: 6 };
        let textareaStyle: React.CSSProperties = {
          fontSize: 15, lineHeight: 1.7, fontFamily: "'Inter', sans-serif",
          color: 'var(--cms-text)',
          background: isGlobalAllSelected ? 'var(--cms-accent-soft, rgba(99, 102, 241, 0.25))' : 'transparent',
          borderRadius: isGlobalAllSelected ? 4 : 0,
          transition: 'background 0.15s ease'
        };
        let prefix: React.ReactNode = null;

        if (block.type === 'h1') {
          textareaStyle = { ...textareaStyle, fontSize: 28, fontWeight: 900, lineHeight: 1.3, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', color: 'var(--cms-text)', paddingTop: 16, paddingBottom: 4 };
          blockWrapStyle = { ...blockWrapStyle, marginTop: 8 };
        } else if (block.type === 'h2') {
          textareaStyle = { ...textareaStyle, fontSize: 21, fontWeight: 800, lineHeight: 1.35, fontFamily: "'Outfit', sans-serif", color: 'var(--cms-text)', paddingTop: 10, paddingBottom: 2 };
        } else if (block.type === 'h3') {
          textareaStyle = { ...textareaStyle, fontSize: 16, fontWeight: 800, lineHeight: 1.4, fontFamily: "'Outfit', sans-serif", color: 'var(--cms-text)', paddingTop: 6 };
        } else if (block.type === 'todo') {
          blockWrapStyle = { ...blockWrapStyle, display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 2 };
          prefix = (
            <button
              type="button"
              className="memo-todo-checkbox"
              onClick={(e) => { e.stopPropagation(); handleUpdateBlock(idx, { checked: !block.checked }); }}
              style={{
                flexShrink: 0, marginTop: 4, width: 18, height: 18, minWidth: 18, minHeight: 18, maxWidth: 18, maxHeight: 18, aspectRatio: '1 / 1', borderRadius: 5,
                border: `2px solid ${block.checked ? 'var(--cms-accent, #6366f1)' : 'var(--glass-border)'}`,
                background: block.checked ? 'var(--cms-accent, #6366f1)' : 'transparent',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, boxSizing: 'border-box'
              }}
            >
              {block.checked && <Check size={11} color="#fff" strokeWidth={3} />}
            </button>
          );
          textareaStyle = { ...textareaStyle, textDecoration: block.checked ? 'line-through' : 'none', color: block.checked ? 'var(--cms-text-muted)' : 'var(--cms-text)', flex: 1 };
        } else if (block.type === 'bullet') {
          blockWrapStyle = { ...blockWrapStyle, display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 4 };
          prefix = <span style={{ flexShrink: 0, marginTop: 10, width: 7, height: 7, borderRadius: '50%', background: 'var(--cms-text-muted)', display: 'inline-block' }} />;
          textareaStyle = { ...textareaStyle, flex: 1 };
        } else if (block.type === 'number') {
          blockWrapStyle = { ...blockWrapStyle, display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 4 };
          const numVal = (() => { let n = 0; for (let j = 0; j < idx; j++) { if (blocks[j].type === 'number') n++; } return n + 1; })();
          prefix = <span style={{ flexShrink: 0, marginTop: 4, fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', minWidth: 22, textAlign: 'right' }}>{numVal}.</span>;
          textareaStyle = { ...textareaStyle, flex: 1 };
        } else if (block.type === 'quote') {
          blockWrapStyle = {
            ...blockWrapStyle,
            borderLeft: '3.5px solid var(--cms-accent, #6366f1)',
            paddingLeft: 16,
            margin: '4px 0',
            background: 'var(--cms-accent-soft, rgba(99,102,241,0.07))',
            borderRadius: '0 8px 8px 0'
          };
          textareaStyle = { ...textareaStyle, fontStyle: 'italic', color: 'var(--cms-text-muted)', fontSize: 15 };
        } else if (block.type === 'callout') {
          blockWrapStyle = {
            ...blockWrapStyle,
            background: 'rgba(245,158,11,0.08)', borderRadius: 10,
            border: '1.5px solid rgba(245,158,11,0.3)',
            padding: '8px 14px', margin: '4px 0'
          };
          textareaStyle = { ...textareaStyle, color: 'var(--cms-text)', fontSize: 14 };
        } else if (block.type === 'code') {
          blockWrapStyle = {
            ...blockWrapStyle,
            background: 'var(--cms-input-bg, rgba(0,0,0,0.06))', borderRadius: 10,
            border: '1.5px solid var(--glass-border)', padding: '10px 14px', margin: '4px 0'
          };
          textareaStyle = { ...textareaStyle, fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", fontSize: 13, color: 'var(--cms-text)', lineHeight: 1.6 };
        }

        // Standard Natural Text Section (Continuous multiline textarea)
        return (
          <div key={block.id} onClick={() => setActiveBlockIndex(idx)} style={blockWrapStyle}>
            {prefix}
            <AutoGrowTextarea
              inputRef={el => { inputRefs.current[idx] = el; }}
              value={block.text}
              onChange={t => handleUpdateBlock(idx, { text: t })}
              onFocus={() => { 
                setActiveImageId(null); 
                setIsGlobalAllSelected(false); 
                setActiveBlockIndex(idx);
              }}
              onCaretChange={pos => onCaretChange?.(idx, pos)}
              onKeyDown={(e) => handleBlockKeyDown(idx, e)}
              placeholder={idx === 0 && blocks.length === 1 && !block.text ? "Mulai menulis catatan bebas di sini..." : ""}
              style={textareaStyle}
            />

            {/* Interactive Drive File Button Chips in Writing Area */}
            {block.text && /\[(📎\s*[^\]]+)\]\(([^)]+)\)/.test(block.text) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '6px 0 12px', userSelect: 'none' }}>
                {Array.from(block.text.matchAll(/\[(📎\s*[^\]]+)\]\(([^)]+)\)/g)).map((match, mIdx) => (
                  <a
                    key={mIdx}
                    href={match[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 12px',
                      borderRadius: 10,
                      background: 'var(--cms-card-bg, #ffffff)',
                      border: '1.5px solid rgba(59, 130, 246, 0.4)',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.12)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.25)';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Paperclip size={12} color="#3b82f6" />
                    </div>
                    <span>{match[1].replace(/^📎\s*/, '')}</span>
                    <Download size={12} style={{ opacity: 0.7, marginLeft: 2 }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {lightboxImage && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(4, 4, 8, 0.92)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'cmsFadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              padding: '0 4px'
            }}
          >
            <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
              {lightboxImage.title || 'Preview Gambar'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lightboxImage.blockIdx !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    const newSize = lightboxImage.size === 'small' ? 'full' : 'small';
                    handleUpdateBlock(lightboxImage.blockIdx, { size: newSize });
                    setLightboxImage(prev => prev ? { ...prev, size: newSize } : null);
                  }}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  {lightboxImage.size === 'small' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                  <span>{lightboxImage.size === 'small' ? 'Jadikan Mode Besar' : 'Jadikan Mode Kecil'}</span>
                </button>
              )}
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
                title="Buka gambar di tab baru"
              >
                <ExternalLink size={16} />
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxHeight: 'calc(100vh - 120px)',
              maxWidth: 'calc(100vw - 32px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title || 'Preview'}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 120px)',
                objectFit: 'contain',
                borderRadius: 12,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
              }}
            />
          </div>

          {/* Caption at bottom if available */}
          {lightboxImage.title && lightboxImage.title !== 'Gambar' && lightboxImage.title !== 'Gambar Catatan' && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                marginTop: 12,
                padding: '6px 16px',
                borderRadius: 20,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 13,
                fontStyle: 'italic',
                maxWidth: '80%',
                textAlign: 'center'
              }}
            >
              {lightboxImage.title}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export const MemoManager: React.FC<{ notify?: (msg: string, type?: string) => void; confirm?: (msg: string, onOk: () => void) => void }> = ({
  notify = (msg) => console.log(msg),
  confirm = (msg, onOk) => { if (window.confirm(msg)) onOk(); }
}) => {
  const { bindContextMenu } = useContextMenu();

  // State: Data
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>(DEFAULT_FOLDERS);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('note') || null;
  });
  const [selectedBulkNoteIds, setSelectedBulkNoteIds] = useState<string[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  const lastCaretPosRef = useRef<{ blockIdx: number; caretPos: number }>({ blockIdx: 0, caretPos: 0 });
  
  // State: Undo & Redo History for Notes & Content
  const [undoStack, setUndoStack] = useState<{ id: string; title: string; content: string; canvasNotes?: any[]; updatedAt: string }[]>([]);
  const [redoStack, setRedoStack] = useState<{ id: string; title: string; content: string; canvasNotes?: any[]; updatedAt: string }[]>([]);
  const lastSnapshotRef = useRef<{ id: string; content: string; title: string } | null>(null);
  const isUndoRedoingRef = useRef(false);
  
  // State: Layout & View Modes (Default: 'gallery')
  const [viewMode, setViewMode] = useState<'gallery' | 'editor'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('view') as 'gallery' | 'editor') || 'gallery';
  });
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('preview');
  
  // Persistent Sidebar & Note List States (Remembers show/hide state on reload)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('porto_memo_folder_sidebar_open');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [isEditorListOpen, setIsEditorListOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('porto_memo_list_visible');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('porto_memo_folder_sidebar_open', String(isSidebarOpen));
    } catch (e) {}
  }, [isSidebarOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('porto_memo_list_visible', String(isEditorListOpen));
    } catch (e) {}
  }, [isEditorListOpen]);
  
  // State: File Explorer Navigation Level ('root' | 'all' | 'favorites' | 'trash' | folderId)
  const [currentFolderId, setCurrentFolderId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('folder') || 'root';
  });
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  
  // State: Folder Deletion Modal & Options
  const [folderToDelete, setFolderToDelete] = useState<NoteFolder | null>(null);
  const [folderDeleteChoice, setFolderDeleteChoice] = useState<'move' | 'general' | 'trash'>('move');
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string>('general');

  // State: Media & Images
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // State: UI & Modals
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');
  const [newTagInput, setNewTagInput] = useState('');
  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [copiedNote, setCopiedNote] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving'>('saved');

  // State: Admin Users Tagging & Comments
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isTagAdminMenuOpen, setIsTagAdminMenuOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // State: Client Note Preview / Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);


  useEffect(() => {
    // Muat dari penyimpanan lokal / Google Drive partitions (Zero Firestore reads)
    const unsub = storage.listenItem('porto_users', (users) => {
      if (Array.isArray(users) && users.length > 0) {
        setAdminUsers(users);
      } else {
        storage.getItem('porto_settings', {}).then(settings => {
          if (Array.isArray(settings?.adminUsers) && settings.adminUsers.length > 0) {
            setAdminUsers(settings.adminUsers);
          }
        }).catch(() => {});
      }
    });
    return () => unsub();
  }, []);
  
  // State: AI & Offline Note Generator
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [noteGeneratorMode, setNoteGeneratorMode] = useState<'ai' | 'offline'>('offline');
  const [aiPrompt, setAiPrompt] = useState('Buatkan lembar creative brief desain klien yang rapi dan terstruktur.');
  const [aiTemplateType, setAiTemplateType] = useState<string>('brief_desain_klien');
  const [aiCategoryFilter, setAiCategoryFilter] = useState<'all' | 'custom' | 'design' | 'business' | 'tasks' | 'marketing' | 'personal'>('all');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  const handleToggleVoiceDictation = () => {
    const SpeechRec = (typeof window !== 'undefined') && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SpeechRec) {
      notify('Browser tidak mendukung Speech Recognition. Silakan gunakan Google Chrome.', 'error');
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        notify('Mendengarkan suara... Silakan berbicara.', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (!transcript) return;

        const dateStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const voiceTitle = `Suara: ${transcript.slice(0, 28)}${transcript.length > 28 ? '...' : ''}`;

        const newNote: NoteItem = {
          id: `note_voice_${Date.now()}`,
          title: voiceTitle,
          content: `<p><strong>Dikte Suara (${dateStr}):</strong></p><p>${transcript}</p>`,
          type: 'doc',
          folderId: 'general',
          tags: ['voice', 'suara'],
          isPinned: false,
          isFavorite: false,
          isTrash: false,
          color: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const updated = [newNote, ...notes];
        setNotes(updated);
        setSelectedNoteId(newNote.id);
        saveNotesToStorage(updated);
        setViewMode('editor');
        notify('Catatan suara berhasil dibuat!', 'success');
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
        notify('Perekaman suara dibatalkan atau tidak terdengar.', 'info');
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
      notify('Gagal memulai rekaman suara.', 'error');
    }
  };
  const [aiError, setAiError] = useState('');
  const [isEditorAiMenuOpen, setIsEditorAiMenuOpen] = useState(false);

  // State: Custom Note Templates & Categories
  const [customNoteTemplates, setCustomNoteTemplates] = useState<CustomNoteTemplate[]>(() => getCustomNoteTemplates());
  const [customNoteCategories, setCustomNoteCategories] = useState<{ id: string; label: string }[]>(() => getCustomNoteCategories());
  const [isCreatingCustomTemplate, setIsCreatingCustomTemplate] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    label: '',
    category: 'design',
    newCategoryInput: '',
    title: '',
    prompt: '',
    tags: '',
    folder: 'general'
  });

  const handleSaveNewCustomTemplate = () => {
    if (!newTemplateForm.label.trim()) {
      notify('Nama template wajib diisi', 'error');
      return;
    }

    let finalCategory = newTemplateForm.category;
    if (newTemplateForm.newCategoryInput.trim()) {
      const addedCat = addCustomNoteCategory(newTemplateForm.newCategoryInput.trim());
      setCustomNoteCategories(getCustomNoteCategories());
      finalCategory = addedCat.id;
    }

    const tagsArray = newTemplateForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const saved = saveCustomNoteTemplate({
      label: newTemplateForm.label.trim(),
      category: finalCategory,
      title: newTemplateForm.title.trim() || newTemplateForm.label.trim(),
      prompt: newTemplateForm.prompt.trim() || 'Template catatan kustom',
      tags: tagsArray.length > 0 ? tagsArray : ['Kustom'],
      folder: newTemplateForm.folder || 'general'
    });

    setCustomNoteTemplates(getCustomNoteTemplates());
    setAiTemplateType(saved.id);
    setIsCreatingCustomTemplate(false);
    setNewTemplateForm({ label: '', category: 'design', newCategoryInput: '', title: '', prompt: '', tags: '', folder: 'general' });
    notify(`⭐ Template "${saved.label}" berhasil disimpan!`, 'success');
  };

  const handleDeleteCustomTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCustomNoteTemplate(id);
    setCustomNoteTemplates(getCustomNoteTemplates());
    if (aiTemplateType === id) {
      setAiTemplateType('brief_desain_klien');
    }
    notify('Template kustom dihapus', 'info');
  };

  const handleSaveActiveNoteAsTemplate = () => {
    if (!currentNote) {
      notify('Buka atau pilih catatan terlebih dahulu', 'warning');
      return;
    }
    const saved = saveCustomNoteTemplate({
      label: currentNote.title || 'Catatan Kustom',
      category: 'personal',
      title: currentNote.title || 'Catatan Kustom',
      prompt: currentNote.content ? currentNote.content.slice(0, 500) : 'Template catatan kustom',
      tags: currentNote.tags && currentNote.tags.length > 0 ? currentNote.tags : ['Kustom'],
      folder: currentNote.folderId || 'general'
    });
    setCustomNoteTemplates(getCustomNoteTemplates());
    notify(`⭐ Catatan "${currentNote.title}" berhasil disimpan sebagai template!`, 'success');
  };

  const [mobilePane, setMobilePane] = useState<'sidebar' | 'gallery' | 'editor'>('gallery');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCompactToolbar, setIsCompactToolbar] = useState(window.innerWidth < 1200);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsCompactToolbar(window.innerWidth < 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  // ── URL DEEP-LINKING SYNC (PRESERVES STATE ON REFRESH) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('folder', currentFolderId);
    if (selectedNoteId && viewMode === 'editor') {
      params.set('note', selectedNoteId);
    } else {
      params.delete('note');
    }
    params.set('view', viewMode);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentFolderId, selectedNoteId, viewMode]);

  // Deep Link listener: Open specific note from Recent Apps / Deep Link / Projects Module
  useEffect(() => {
    const handleOpenNoteEvent = (e: any) => {
      const targetId = e?.detail?.noteId || e?.detail?.id;
      if (targetId) {
        setSelectedNoteId(targetId);
        setViewMode('editor');
        setEditorMode('write');
        setMobilePane('editor');
        if (e.detail?.folderId) {
          setCurrentFolderId(e.detail.folderId);
        }
      }
    };
    window.addEventListener('porto_memo_open_note', handleOpenNoteEvent);
    return () => window.removeEventListener('porto_memo_open_note', handleOpenNoteEvent);
  }, []);

  // Current active note
  const currentNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Navigate back to Projects Module & reopen the project
  const handleBackToProject = async () => {
    const returnProjectId = currentNote?.projectId || sessionStorage.getItem('porto_memo_return_project_id');
    
    // Auto-sync note content back to project before returning
    if (currentNote && returnProjectId) {
      try {
        const savedProjects = await storage.getItem('porto_projects', []);
        if (Array.isArray(savedProjects) && savedProjects.length > 0) {
          const updatedProjects = savedProjects.map((p: any) => {
            if (String(p.id) === String(returnProjectId)) {
              return {
                ...p,
                notes: currentNote.content,
                caseStudyHtml: currentNote.content,
                updatedAt: new Date().toISOString()
              };
            }
            return p;
          });
          await storage.setItem('porto_projects', updatedProjects);
        }
      } catch (err) {
        console.error('Failed to sync note back to project', err);
      }
    }

    if (returnProjectId) {
      sessionStorage.setItem('porto_open_project_on_mount', String(returnProjectId));
      window.dispatchEvent(new CustomEvent('porto_pm_open_project', { detail: { id: returnProjectId, projectId: returnProjectId } }));
      window.dispatchEvent(new CustomEvent('porto_open_project', { detail: returnProjectId }));
    }
    const targetUrl = returnProjectId ? `/admin/projects?project=${returnProjectId}` : `/admin/projects`;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetUrl);
    }
    window.dispatchEvent(new CustomEvent('porto_switch_page', { detail: 'projects' }));
    window.dispatchEvent(new CustomEvent('cms_switch_page', { detail: 'projects' }));
  };

  // Client Note Preview / Sharing Handlers
  const handleOpenClientPreview = () => {
    if (!currentNote) return;
    window.open(`/preview/note/${currentNote.id}`, '_blank');
  };

  const handleCopyClientPreviewLink = () => {
    if (!currentNote) return;
    const url = `${window.location.origin}/preview/note/${currentNote.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedShareLink(true);
    notify('Tautan pratinjau klien berhasil disalin!', 'success');
    setTimeout(() => setCopiedShareLink(false), 2200);
  };

  const handleUpdateCurrentNoteMeta = (patch: Partial<NoteItem>) => {
    if (!currentNote) return;
    const updated = notes.map(n => n.id === currentNote.id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    saveNotesToStorage(updated);
  };

  const handleShareToClientWhatsApp = () => {
    if (!currentNote) return;
    const url = `${window.location.origin}/preview/note/${currentNote.id}`;
    const modeDesc = currentNote.type === 'canvas' ? 'Whiteboard Wireframe / Mindmap' : 'Dokumen Konsep';
    const pinPart = currentNote.sharePassword ? `\n🔑 PIN Akses: ${currentNote.sharePassword}` : '';
    const text = `Halo! Berikut kami lampirkan tautan pratinjau draf ${modeDesc} "${currentNote.title || 'Konsep Proyek'}":\n${url}${pinPart}\n\nSilakan dibuka dan ditinjau ya. Terima kasih! - sumr.day Studio`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Track active note to Recent Apps manager
  useEffect(() => {
    if (selectedNoteId && currentNote) {
      window.dispatchEvent(new CustomEvent('porto_track_recent_item', {
        detail: {
          id: `note_${selectedNoteId}`,
          module: 'notes',
          label: `Catatan: ${currentNote.title || 'Tanpa Judul'}`,
          title: currentNote.title || 'Catatan',
          subTitle: 'Catatan & Memo',
          statePayload: { noteId: selectedNoteId, folderId: currentNote.folderId },
          icon: 'StickyNote',
          updatedAt: Date.now()
        }
      }));
    }
  }, [selectedNoteId, currentNote?.title]);

  // Toggle Dropdown with accurate Fixed Screen Coordinates
  const handleToggleDropdown = () => {
    if (!isFolderDropdownOpen && dropdownTriggerRef.current) {
      const rect = dropdownTriggerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 6,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - 260))
      });
      setIsFolderDropdownOpen(true);
    } else {
      setIsFolderDropdownOpen(false);
    }
  };

  // Close popups on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        dropdownTriggerRef.current && !dropdownTriggerRef.current.contains(e.target as Node)
      ) {
        setIsFolderDropdownOpen(false);
      }
      if (
        colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
      if (
        imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node)
      ) {
        setIsImageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const notesRef = useRef<NoteItem[]>(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  const foldersRef = useRef<NoteFolder[]>(folders);
  useEffect(() => { foldersRef.current = folders; }, [folders]);

  const lastSavedNotesJsonRef = useRef<string>('');

  // Save Notes to storage with aggressive debouncing or instant cloud push
  const saveNotesToStorage = useCallback(async (updatedNotes: NoteItem[], immediate = false) => {
    setSaveIndicator('saving');
    lastSavedNotesJsonRef.current = JSON.stringify(updatedNotes);
    try {
      if (immediate) {
        await storage.setItem('porto_memo_notes', updatedNotes, true);
        await storage.flushAllPendingWrites();
        setSaveIndicator('saved');
        notify('Catatan berhasil disimpan ke Cloud!', 'success');
      } else {
        storage.debouncedSetItem('porto_memo_notes', updatedNotes, 1500);
        setTimeout(() => setSaveIndicator('saved'), 600);
      }
      try {
        localStorage.setItem('idb_porto_memo_notes', JSON.stringify(updatedNotes));
      } catch (_) {}
      try {
        window.dispatchEvent(new CustomEvent('porto_memo_updated'));
      } catch (_) {}
    } catch (e) {
      console.error('Failed to save notes', e);
      setSaveIndicator('saved');
    }
  }, [notify]);

  // Real-time Cloud & Local Synchronization
  useEffect(() => {
    let isInitialMount = true;

    const unsubNotes = storage.listenItem('porto_memo_notes', (incomingNotes) => {
      if (Array.isArray(incomingNotes) && incomingNotes.length > 0) {
        const incomingJson = JSON.stringify(incomingNotes);
        if (incomingJson !== lastSavedNotesJsonRef.current) {
          lastSavedNotesJsonRef.current = incomingJson;
          setNotes(incomingNotes);

          if (isInitialMount) {
            const params = new URLSearchParams(window.location.search);
            const noteFromUrl = params.get('note');
            if (noteFromUrl && incomingNotes.some(n => n.id === noteFromUrl)) {
              setSelectedNoteId(noteFromUrl);
            } else if (!selectedNoteId) {
              setSelectedNoteId(incomingNotes.find(n => !n.isTrash)?.id || incomingNotes[0].id);
            }
          }
        }
      } else if (isInitialMount && (!incomingNotes || incomingNotes.length === 0)) {
        // Fallback only if database is completely empty
        storage.getItem('porto_memo_notes', []).then((localNotes) => {
          if (Array.isArray(localNotes) && localNotes.length > 0) {
            setNotes(localNotes);
            setSelectedNoteId(localNotes[0].id);
          } else {
            const starterNote: NoteItem = {
              id: `note_${Date.now()}`,
              title: 'Rencana Kerja & To-Do List',
              content: INITIAL_NOTE_CONTENT,
              type: 'doc',
              folderId: 'general',
              tags: ['Penting'],
              isPinned: true,
              isFavorite: true,
              isTrash: false,
              color: 'purple',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setNotes([starterNote]);
            setSelectedNoteId(starterNote.id);
            storage.setItem('porto_memo_notes', [starterNote]);
          }
        });
      }
      isInitialMount = false;
    });

    const unsubFolders = storage.listenItem('porto_memo_folders', (incomingFolders) => {
      if (Array.isArray(incomingFolders) && incomingFolders.length > 0) {
        setFolders(incomingFolders);
      }
    });

    return () => {
      unsubNotes();
      unsubFolders();
    };
  }, []);

  // Keyboard shortcut: Ctrl + S (Immediate Cloud Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        if (notesRef.current && notesRef.current.length > 0) {
          saveNotesToStorage(notesRef.current, true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [saveNotesToStorage]);

  // Save Folders to storage
  const saveFoldersToStorage = useCallback(async (updatedFolders: NoteFolder[]) => {
    try {
      await storage.setItem('porto_memo_folders', updatedFolders);
    } catch (e) {
      console.error('Failed to save folders', e);
    }
  }, []);


  // Broadcast note state to CmsDashboard bottom navbar
  useEffect(() => {
    const commentCount = currentNote ? getSafeArray(currentNote.comments).length : 0;
    const hasNote = !!currentNote;
    window.dispatchEvent(new CustomEvent('memo_nav_state_changed', { detail: { commentCount, hasNote } }));
  }, [currentNote]);

  // Listen for open-comments event triggered from bottom navbar
  useEffect(() => {
    const handler = () => { if (currentNote) setIsCommentsOpen(true); };
    window.addEventListener('memo_open_comments', handler);
    return () => window.removeEventListener('memo_open_comments', handler);
  }, [currentNote]);

  // AUTO-HIDE TAGS: Only compute tags used by at least one non-trash note!
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    notes
      .filter(n => !n.isTrash)
      .forEach(n => {
        (n.tags || []).forEach(t => {
          if (t && t.trim()) set.add(t.trim());
        });
      });
    return Array.from(set);
  }, [notes]);

  // If selected tag no longer exists, reset filter
  useEffect(() => {
    if (selectedTagFilter && !allUniqueTags.includes(selectedTagFilter)) {
      setSelectedTagFilter(null);
    }
  }, [allUniqueTags, selectedTagFilter]);

  // ── FILE EXPLORER BREADCRUMB TRAIL COMPUTATION ──
  const breadcrumbs = useMemo(() => {
    // If in Editor view and currently editing a note: show accurate path to this note
    if (viewMode === 'editor' && currentNote) {
      const trail: { id: string; name: string; isNote?: boolean }[] = [];
      let curFolderId: string | null | undefined = currentNote.folderId;
      const visited = new Set<string>();

      while (curFolderId && curFolderId !== 'root' && !visited.has(curFolderId)) {
        visited.add(curFolderId);
        const f = folders.find(folder => folder.id === curFolderId);
        if (f) {
          trail.unshift({ id: f.id, name: f.name });
          curFolderId = f.parentId;
        } else {
          break;
        }
      }

      // Append the active note being edited
      trail.push({ id: currentNote.id, name: currentNote.title || 'Catatan Baru', isNote: true });
      return [{ id: 'root', name: 'Beranda' }, ...trail];
    }

    if (currentFolderId === 'root') {
      return [{ id: 'root', name: 'Beranda' }];
    }
    if (currentFolderId === 'all') {
      return [{ id: 'root', name: 'Beranda' }, { id: 'all', name: 'Semua Catatan' }];
    }
    if (currentFolderId === 'favorites') {
      return [{ id: 'root', name: 'Beranda' }, { id: 'favorites', name: 'Favorit' }];
    }
    if (currentFolderId === 'trash') {
      return [{ id: 'root', name: 'Beranda' }, { id: 'trash', name: 'Kotak Sampah' }];
    }

    const trail: { id: string; name: string; isNote?: boolean }[] = [];
    let curId: string | null | undefined = currentFolderId;
    const visited = new Set<string>();

    while (curId && curId !== 'root' && !visited.has(curId)) {
      visited.add(curId);
      const f = folders.find(folder => folder.id === curId);
      if (f) {
        trail.unshift({ id: f.id, name: f.name });
        curId = f.parentId;
      } else {
        break;
      }
    }

    return [{ id: 'root', name: 'Beranda' }, ...trail];
  }, [viewMode, currentNote, currentFolderId, folders]);

  // Current folder object (if inside a specific folder)
  const activeCustomFolder = useMemo(() => {
    if (['root', 'all', 'favorites', 'trash'].includes(currentFolderId)) return null;
    return folders.find(f => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Subfolders belonging to current folder level
  const currentSubFolders = useMemo(() => {
    if (['all', 'favorites', 'trash'].includes(currentFolderId)) return [];
    return folders.filter(f => {
      if (currentFolderId === 'root') {
        return !f.parentId || f.parentId === 'root';
      }
      return f.parentId === currentFolderId;
    });
  }, [folders, currentFolderId]);

  // Helper: Count notes in folder and all its subfolders recursively
  const getRecursiveNoteCount = useCallback((folderId: string): number => {
    let count = notes.filter(n => n.folderId === folderId && !n.isTrash).length;
    const childFolders = folders.filter(f => f.parentId === folderId);
    childFolders.forEach(child => {
      count += getRecursiveNoteCount(child.id);
    });
    return count;
  }, [notes, folders]);

  // Filtered Notes List (In current directory)
  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        if (currentFolderId === 'trash') {
          if (!n.isTrash) return false;
        } else {
          if (n.isTrash) return false;
          if (currentFolderId === 'favorites') {
            if (!n.isFavorite) return false;
          } else if (currentFolderId === 'all') {
            // Include all active notes
          } else if (currentFolderId === 'root') {
            // Notes in root or default general
            if (n.folderId && n.folderId !== 'root' && n.folderId !== 'general') return false;
          } else {
            // Notes in this specific folder
            if (n.folderId !== currentFolderId) return false;
          }
        }

        if (selectedTagFilter && (!n.tags || !n.tags.includes(selectedTagFilter))) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTags = (n.tags || []).some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (currentFolderId !== 'trash') {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
        }

        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, currentFolderId, selectedTagFilter, searchQuery, sortBy]);

  // Handler: Create Note (supports 'doc' and 'canvas')
  const handleCreateNote = (type: 'doc' | 'canvas' = 'doc', folderIdOverride?: string) => {
    let targetFolder = 'general';
    if (folderIdOverride) {
      targetFolder = folderIdOverride;
    } else if (!['trash', 'favorites', 'all', 'root'].includes(currentFolderId)) {
      targetFolder = currentFolderId;
    } else if (currentFolderId === 'root') {
      targetFolder = 'general';
    }

    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      title: type === 'canvas' ? 'Papan Kreatif Baru' : 'Catatan Baru',
      content: '',
      type,
      canvasNotes: type === 'canvas' ? [] : undefined,
      canvasBg: type === 'canvas' ? 'grid' : undefined,
      folderId: targetFolder,
      tags: selectedTagFilter ? [selectedTagFilter] : [],
      isPinned: false,
      isFavorite: currentFolderId === 'favorites',
      isTrash: false,
      color: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newNote, ...notes];
    setNotes(updated);
    setSelectedNoteId(newNote.id);
    saveNotesToStorage(updated);
    setViewMode('editor');
    setEditorMode('write');
    setMobilePane('editor');
    notify(type === 'canvas' ? 'Kanvas kreatif baru dibuat' : 'Catatan baru dibuat', 'success');
    notifyNote(newNote.title || 'Catatan Baru', 'dibuat');

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // ── AUTO-OPEN CREATE NOTE / MEMO (GLOBAL SHORTCUT / SLASH COMMAND / SEARCH INTENT) ──
  useEffect(() => {
    const triggerNewNote = () => {
      handleCreateNote('doc');
    };

    if (typeof window !== 'undefined' && sessionStorage.getItem('porto_auto_create_memo') === '1') {
      sessionStorage.removeItem('porto_auto_create_memo');
      setTimeout(triggerNewNote, 150);
    }

    window.addEventListener('porto_create_memo', triggerNewNote);
    window.addEventListener('porto_add_memo', triggerNewNote);
    return () => {
      window.removeEventListener('porto_create_memo', triggerNewNote);
      window.removeEventListener('porto_add_memo', triggerNewNote);
    };
  }, [notes, currentFolderId, selectedTagFilter]);

  // Handler: Generate Note from Modal (Instant Offline or AI Generator)
  const handleGenerateAiNoteSubmit = async (forceOffline: boolean = false) => {
    // 100% Instant Offline Generation (0ms, 0 tokens)
    if (noteGeneratorMode === 'offline' || forceOffline) {
      const customMatch = customNoteTemplates.find(t => t.id === aiTemplateType);
      let offlineNote: any;
      if (customMatch) {
        offlineNote = {
          id: `note_${Date.now()}`,
          title: customMatch.title || customMatch.label,
          content: `# ${customMatch.title || customMatch.label}\n\n${customMatch.prompt}\n`,
          type: 'doc',
          folderId: customMatch.folder || 'general',
          tags: customMatch.tags || ['Kustom'],
          isPinned: false,
          isFavorite: false,
          isTrash: false,
          color: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        offlineNote = buildOfflineNote(aiTemplateType, aiPrompt);
      }

      const updated = [offlineNote, ...notes];
      setNotes(updated);
      setSelectedNoteId(offlineNote.id);
      setCurrentFolderId(offlineNote.folderId);
      await storage.setItem('porto_memo_notes', updated);
      try {
        localStorage.setItem('idb_porto_memo_notes', JSON.stringify(updated));
      } catch (_) {}
      saveNotesToStorage(updated);
      try {
        window.dispatchEvent(new CustomEvent('porto_memo_updated'));
      } catch (_) {}
      setIsAiModalOpen(false);
      setViewMode('editor');
      setEditorMode('preview');
      setMobilePane('editor');
      notify(`Catatan "${offlineNote.title}" berhasil dibuat dari Template Instan`, 'success');
      return;
    }

    if (!aiPrompt.trim() && noteGeneratorMode === 'ai') return;
    setIsAiGenerating(true);
    setAiError('');
    try {
      const rawResult = await generateAiNote(aiPrompt, aiTemplateType);
      if (!rawResult || rawResult.startsWith('API Key belum') || rawResult.startsWith('Koneksi AI Terkendala') || rawResult.startsWith('⚠️')) {
        // Fallback to offline template seamlessly
        const fallbackNote = buildOfflineNote(aiTemplateType, aiPrompt);
        const updated = [fallbackNote, ...notes];
        setNotes(updated);
        setSelectedNoteId(fallbackNote.id);
        setCurrentFolderId(fallbackNote.folderId);
        await storage.setItem('porto_memo_notes', updated);
        try {
          localStorage.setItem('idb_porto_memo_notes', JSON.stringify(updated));
        } catch (_) {}
        saveNotesToStorage(updated);
        try {
          window.dispatchEvent(new CustomEvent('porto_memo_updated'));
        } catch (_) {}
        setIsAiModalOpen(false);
        setViewMode('editor');
        setEditorMode('preview');
        setMobilePane('editor');
        notify(`Menggunakan Template Offline karena koneksi AI offline/terkendala.`, 'warning');
        return;
      }

      // Parse Title (# Title) and content
      const lines = rawResult.trim().split('\n');
      let title = 'Catatan AI Baru';
      let contentLines = lines;

      if (lines[0].startsWith('# ')) {
        title = lines[0].replace(/^#\s*/, '').trim();
        contentLines = lines.slice(1);
      } else if (lines[0].startsWith('## ')) {
        title = lines[0].replace(/^##\s*/, '').trim();
        contentLines = lines.slice(1);
      }
      const content = contentLines.join('\n').trim();

      // Auto-assign folder based on template
      let targetFolder = 'general';
      if (['logo', 'uiux', 'social_media', 'moodboard_konsep', 'kalender_editorial_30hari', 'copywriting_aida_formula', 'jurnal_ide_kreatif'].includes(aiTemplateType)) targetFolder = 'ideas';
      else if (['todo_sprint', 'project_plan', 'qa_checklist', 'sprint_todo_harian', 'qa_checklist_final'].includes(aiTemplateType)) targetFolder = 'tasks';
      else if (['client_reply', 'invoice_proposal', 'handoff_sop', 'brief_desain_klien', 'sop_serah_terima_file', 'draf_balas_klien', 'template_invoice_penawaran', 'notula_rapat_klien'].includes(aiTemplateType)) targetFolder = 'clients';
      else if (['travel', 'study_plan', 'rencana_belajar_skill'].includes(aiTemplateType)) targetFolder = 'general';

      if (!folders.some(f => f.id === targetFolder)) targetFolder = 'general';

      const tmplMeta = OFFLINE_NOTE_TEMPLATES.find(t => t.id === aiTemplateType);
      const tagLabel = tmplMeta ? tmplMeta.label.split(' ')[0] : 'AI';

      const newNote: NoteItem = {
        id: `note_${Date.now()}`,
        title,
        content,
        type: 'doc',
        folderId: targetFolder,
        tags: [tagLabel],
        isPinned: false,
        isFavorite: false,
        isTrash: false,
        color: ['logo', 'uiux', 'brief_desain_klien'].includes(aiTemplateType) ? 'purple' : ['client_reply', 'invoice_proposal', 'draf_balas_klien'].includes(aiTemplateType) ? 'sky' : ['todo_sprint', 'project_plan', 'sprint_todo_harian'].includes(aiTemplateType) ? 'emerald' : 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updated = [newNote, ...notes];
      setNotes(updated);
      setSelectedNoteId(newNote.id);
      setCurrentFolderId(targetFolder);
      await storage.setItem('porto_memo_notes', updated);
      try {
        localStorage.setItem('idb_porto_memo_notes', JSON.stringify(updated));
      } catch (_) {}
      saveNotesToStorage(updated);
      try {
        window.dispatchEvent(new CustomEvent('porto_memo_updated'));
      } catch (_) {}
      setIsAiModalOpen(false);
      setViewMode('editor');
      setEditorMode('preview');
      setMobilePane('editor');
      notify('Catatan AI berhasil dibuat dan disimpan', 'success');
    } catch (err: any) {
      const fallbackNote = buildOfflineNote(aiTemplateType, aiPrompt);
      const updated = [fallbackNote, ...notes];
      setNotes(updated);
      setSelectedNoteId(fallbackNote.id);
      setCurrentFolderId(fallbackNote.folderId);
      await storage.setItem('porto_memo_notes', updated);
      try {
        localStorage.setItem('idb_porto_memo_notes', JSON.stringify(updated));
      } catch (_) {}
      saveNotesToStorage(updated);
      try {
        window.dispatchEvent(new CustomEvent('porto_memo_updated'));
      } catch (_) {}
      setIsAiModalOpen(false);
      setViewMode('editor');
      setEditorMode('preview');
      setMobilePane('editor');
      notify(`⚡ Terjadi kendala AI. Berhasil membuat dari Template Offline.`, 'warning');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handler: In-Editor AI Writer Tools
  const handleInEditorAiAction = async (action: 'expand' | 'todo' | 'polish' | 'summarize') => {
    if (!currentNote) return;
    setIsAiGenerating(true);
    setIsEditorAiMenuOpen(false);
    notify('Asisten AI sedang memproses...', 'info');
    try {
      let instruction = "";
      if (action === 'expand') {
        instruction = "Lanjutkan dan kembangkan catatan ini dengan ide-ide kreatif tambahan, tahapan praktis, dan detail teknis yang komprehensif. JANGAN gunakan emoji dan JANGAN gunakan bintang tebal berlebih.";
      } else if (action === 'todo') {
        instruction = "Ubah seluruh isi catatan ini menjadi checklist to-do list terstruktur memakai format markdown - [ ] yang jelas dan dapat dieksekusi. JANGAN gunakan emoji.";
      } else if (action === 'polish') {
        instruction = "Rapikan tata bahasa, format markdown (gunakan heading ##, bullet, callout > Catatan:), perbaiki ejaan, dan buat lebih profesional tanpa emoji dan tanpa bintang berlebih.";
      } else if (action === 'summarize') {
        instruction = "Buat ringkasan eksekutif poin-poin kunci dari catatan ini secara padat dan terstruktur tanpa emoji.";
      }
      const res = await callGemini(currentNote.content || currentNote.title, instruction);
      if (res && !res.startsWith('API Key belum') && !res.startsWith('Koneksi AI Terkendala') && !res.startsWith('⚠️')) {
        const cleanedRes = cleanMarkdownAsterisks(res);
        if (action === 'expand') {
          handleUpdateNote({ content: (currentNote.content || '') + '\n\n' + cleanedRes });
        } else {
          handleUpdateNote({ content: cleanedRes });
        }
        notify('AI berhasil memperbarui catatan', 'success');
      } else {
        notify(res, 'error');
      }
    } catch (err: any) {
      notify('Gagal memproses AI: ' + err.message, 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handler: Open Note in Editor
  const handleOpenNoteInEditor = (noteId: string) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (targetNote && targetNote.folderId && !['root', 'all', 'favorites', 'trash'].includes(currentFolderId)) {
      setCurrentFolderId(targetNote.folderId);
    }
    setSelectedNoteId(noteId);
    setViewMode('editor');
    setEditorMode('preview');
    setMobilePane('editor');
  };

  // Handler: Back to Files / Gallery Explorer in Memo
  const handleBackToGallery = () => {
    if (currentNote && currentNote.folderId && currentFolderId !== 'all') {
      setCurrentFolderId(currentNote.folderId);
    }
    setViewMode('gallery');
    setMobilePane('gallery');
    setSelectedNoteId(null);
  };

  // Handler: Export Note as PDF (opens clean print dialog with pure notes content as seen in editor)
  const handleExportPdf = (note: NoteItem) => {
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const parseLineFormatting = (str: string) => {
      let res = esc(str);
      // Bold
      res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Inline Code
      res = res.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px; font-family:monospace; font-size:10pt;">$1</code>');
      // Inline Images
      res = res.replace(/!\[(.*?)\]\((.*?)\)/g, (match, altRaw, url) => {
        const segs = (altRaw || '').split(/[|:]/);
        const altText = segs[0] || '';
        
        let size = 'small';
        let wrap = 'inline';
        for (let p = 1; p < segs.length; p++) {
          const seg = segs[p].toLowerCase().trim();
          if (['small', 'kecil', '25%'].includes(seg)) size = 'small';
          else if (['medium', 'sedang', '50%', '75%'].includes(seg)) size = 'medium';
          else if (['full', 'penuh', '100%'].includes(seg)) size = 'full';
          else if (['left', 'wrap-left', 'square-left'].includes(seg)) wrap = 'left';
          else if (['right', 'wrap-right', 'square-right'].includes(seg)) wrap = 'right';
          else if (['center'].includes(seg)) wrap = 'center';
          else if (['inline'].includes(seg)) wrap = 'inline';
        }

        let width = '100%';
        if (size === 'small') width = '180pt';
        else if (size === 'medium') width = '340pt';

        let extraStyles = `width: ${width}; max-width: 100%; border-radius: 6pt; object-fit: contain; vertical-align: middle;`;
        
        if (wrap === 'left') extraStyles += ' float: left; margin: 4pt 12pt 4pt 0;';
        else if (wrap === 'right') extraStyles += ' float: right; margin: 4pt 0 4pt 12pt;';
        else if (wrap === 'center') extraStyles += ' display: block; margin: 12pt auto; clear: both;';
        else extraStyles += ' display: inline-block; margin: 4pt 4pt 4pt 0;';

        return '<img src="' + url + '" alt="' + altText + '" style="' + extraStyles + '" />';
      });
      return res;
    };

    // Convert markdown lines → clean HTML with image support
    const lines = (note.content || '').split('\n');
    const contentParts: string[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        contentParts.push('<p style="font-size: 11.5pt; line-height: 1.8; color: #0f172a; margin: 0 0 8pt;">' + currentParagraph.join('<br />') + '</p>');
        currentParagraph = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        flushParagraph();
        contentParts.push('<div style="height: 10pt;"></div>');
        continue;
      }

      // Check for Markdown Image: ![alt|size|wrap](url) or ![alt](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        flushParagraph();
        const altText = imgMatch[1].split('|')[0] || '';
        const imgUrl = imgMatch[2];
        contentParts.push(
          '<div style="text-align: center; margin: 14pt 0; page-break-inside: avoid;">' +
            '<img src="' + imgUrl + '" alt="" style="max-width: 100%; border-radius: 8pt; object-fit: contain;" />' +
            (altText && altText !== 'Gambar' ? '<div style="font-size: 9.5pt; color: #475569; margin-top: 4pt; font-style: italic;">' + esc(altText) + '</div>' : '') +
          '</div>'
        );
        continue;
      }

      // Check for raw image URL lines (e.g. Cloudinary, Firebase, or .png/.jpg/.webp)
      if (/^https?:\/\/.*\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(line) || /^https:\/\/res\.cloudinary\.com\/.*$/i.test(line)) {
        flushParagraph();
        contentParts.push(
          '<div style="text-align: center; margin: 14pt 0; page-break-inside: avoid;">' +
            '<img src="' + line + '" alt="" style="max-width: 100%; border-radius: 8pt; object-fit: contain;" />' +
          '</div>'
        );
        continue;
      }

      // Headings & Text
      if (line.startsWith('# ')) {
        flushParagraph();
        contentParts.push('<h1 style="font-size: 20pt; font-weight: 900; color: #0f172a; margin: 18pt 0 8pt; letter-spacing: -0.02em;">' + parseLineFormatting(line.slice(2)) + '</h1>');
      } else if (line.startsWith('## ')) {
        flushParagraph();
        contentParts.push('<h2 style="font-size: 16pt; font-weight: 800; color: #1e293b; margin: 14pt 0 6pt;">' + parseLineFormatting(line.slice(3)) + '</h2>');
      } else if (line.startsWith('### ')) {
        flushParagraph();
        contentParts.push('<h3 style="font-size: 13pt; font-weight: 750; color: #334155; margin: 12pt 0 5pt;">' + parseLineFormatting(line.slice(4)) + '</h3>');
      } else if (line.startsWith('- [x] ') || line.startsWith('* [x] ')) {
        flushParagraph();
        contentParts.push('<div style="display:flex; align-items:center; gap:6pt; margin: 4pt 0; font-size: 11.5pt; color: #475569;"><span style="color:#10b981; font-weight:bold;">&#x2713;</span> <span style="text-decoration: line-through; color: #94a3b8;">' + parseLineFormatting(line.slice(6)) + '</span></div>');
      } else if (line.startsWith('- [ ] ') || line.startsWith('* [ ] ')) {
        flushParagraph();
        contentParts.push('<div style="display:flex; align-items:center; gap:6pt; margin: 4pt 0; font-size: 11.5pt; color: #1e293b;"><span style="color:#94a3b8;">&#x25A1;</span> <span>' + parseLineFormatting(line.slice(6)) + '</span></div>');
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        flushParagraph();
        contentParts.push('<li style="margin: 3pt 0 3pt 16pt; font-size: 11.5pt; color: #1e293b; line-height: 1.7;">' + parseLineFormatting(line.slice(2)) + '</li>');
      } else if (line.startsWith('> ')) {
        flushParagraph();
        contentParts.push('<blockquote style="border-left: 3.5px solid #6366f1; padding: 6pt 14pt; margin: 10pt 0; background: #f8fafc; color: #334155; font-style: italic; border-radius: 0 8pt 8pt 0;">' + parseLineFormatting(line.slice(2)) + '</blockquote>');
      } else if (line === '---' || line === '***') {
        flushParagraph();
        contentParts.push('<hr style="border: none; border-top: 1.5px solid #e2e8f0; margin: 16pt 0;" />');
      } else {
        currentParagraph.push(parseLineFormatting(line));
      }
    }
    flushParagraph();

    const contentHtml = contentParts.join('');

    const html =
      '<div style="font-family: \'Inter\', -apple-system, sans-serif; width: 100%; color: #0f172a; background: #ffffff !important;">' +
        (note.title ? '<h1 style="font-size: 24pt; font-weight: 900; color: #0f172a; margin: 0 0 16pt; line-height: 1.25; letter-spacing: -0.025em;">' + esc(note.title) + '</h1>' : '') +
        '<div class="memo-print-content" style="font-size: 11.5pt; line-height: 1.8; color: #0f172a;">' + contentHtml + '</div>' +
      '</div>';

    // Remove any stale print root
    const oldRoot = document.getElementById('memo-print-root');
    if (oldRoot) oldRoot.remove();

    const printRoot = document.createElement('div');
    printRoot.id = 'memo-print-root';
    printRoot.style.cssText = 'display:none;';
    printRoot.innerHTML = html;
    document.body.appendChild(printRoot);

    // Give images a brief moment to decode before triggering print dialog
    setTimeout(() => {
      window.print();
    }, 150);

    // Cleanup after print dialog closes
    setTimeout(() => {
      const root = document.getElementById('memo-print-root');
      if (root) root.remove();
    }, 4000);
  };

  // Push snapshot to undo stack before editing
  const pushHistorySnapshot = useCallback((note: NoteItem) => {
    if (!note || !note.id || isUndoRedoingRef.current) return;
    const snap = {
      id: note.id,
      title: note.title || '',
      content: note.content || '',
      canvasNotes: note.canvasNotes ? JSON.parse(JSON.stringify(note.canvasNotes)) : undefined,
      updatedAt: note.updatedAt || new Date().toISOString()
    };
    if (lastSnapshotRef.current && lastSnapshotRef.current.id === snap.id && lastSnapshotRef.current.content === snap.content && lastSnapshotRef.current.title === snap.title) {
      return;
    }
    setUndoStack(prev => [...prev.slice(-30), snap]);
    setRedoStack([]);
    lastSnapshotRef.current = snap;
  }, []);

  // Handler: Undo Note Edit
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !selectedNoteId) return;
    const current = notes.find(n => n.id === selectedNoteId);
    if (!current) return;

    const targetSnap = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);

    isUndoRedoingRef.current = true;
    setRedoStack(prev => [...prev, {
      id: current.id,
      title: current.title || '',
      content: current.content || '',
      canvasNotes: current.canvasNotes ? JSON.parse(JSON.stringify(current.canvasNotes)) : undefined,
      updatedAt: current.updatedAt
    }]);
    setUndoStack(newUndo);

    const updated = notes.map(n => n.id === targetSnap.id ? {
      ...n,
      title: targetSnap.title,
      content: targetSnap.content,
      canvasNotes: targetSnap.canvasNotes ? JSON.parse(JSON.stringify(targetSnap.canvasNotes)) : n.canvasNotes,
      updatedAt: new Date().toISOString()
    } : n);

    setNotes(updated);
    saveNotesToStorage(updated);
    lastSnapshotRef.current = targetSnap;
    notify('↩️ Undo: Perubahan dibatalkan', 'info');
    setTimeout(() => { isUndoRedoingRef.current = false; }, 150);
  }, [undoStack, selectedNoteId, notes, saveNotesToStorage, notify]);

  // Handler: Redo Note Edit
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !selectedNoteId) return;
    const current = notes.find(n => n.id === selectedNoteId);
    if (!current) return;

    const targetSnap = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);

    isUndoRedoingRef.current = true;
    setUndoStack(prev => [...prev, {
      id: current.id,
      title: current.title || '',
      content: current.content || '',
      canvasNotes: current.canvasNotes ? JSON.parse(JSON.stringify(current.canvasNotes)) : undefined,
      updatedAt: current.updatedAt
    }]);
    setRedoStack(newRedo);

    const updated = notes.map(n => n.id === targetSnap.id ? {
      ...n,
      title: targetSnap.title,
      content: targetSnap.content,
      canvasNotes: targetSnap.canvasNotes ? JSON.parse(JSON.stringify(targetSnap.canvasNotes)) : n.canvasNotes,
      updatedAt: new Date().toISOString()
    } : n);

    setNotes(updated);
    saveNotesToStorage(updated);
    lastSnapshotRef.current = targetSnap;
    notify('↪️ Redo: Perubahan dikembalikan', 'info');
    setTimeout(() => { isUndoRedoingRef.current = false; }, 150);
  }, [redoStack, selectedNoteId, notes, saveNotesToStorage, notify]);

  // Global Keyboard listener for Ctrl+Z & Ctrl+Y in MemoManager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Handler: Update Note Fields
  const handleUpdateNote = (fields: Partial<NoteItem>) => {
    if (!selectedNoteId) return;

    const current = notes.find(n => n.id === selectedNoteId);
    if (current && (fields.content !== undefined || fields.title !== undefined || fields.canvasNotes !== undefined)) {
      pushHistorySnapshot(current);
    }

    const updated = notes.map(n => {
      if (n.id === selectedNoteId) {
        return {
          ...n,
          ...fields,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    });

    setNotes(updated);
    saveNotesToStorage(updated);
  };

  // Handler: Move to Trash / Restore / Delete Permanently
  const handleToggleTrash = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (note.isTrash) {
      const updated = notes.map(n => n.id === noteId ? { ...n, isTrash: false, updatedAt: new Date().toISOString() } : n);
      setNotes(updated);
      saveNotesToStorage(updated);
      notify('Catatan berhasil dipulihkan', 'success');
    } else {
      const updated = notes.map(n => n.id === noteId ? { ...n, isTrash: true, isPinned: false, updatedAt: new Date().toISOString() } : n);
      setNotes(updated);
      saveNotesToStorage(updated);
      notify('Catatan dipindahkan ke Kotak Sampah');
    }
  };

  const handleDuplicateNote = (noteId: string) => {
    const src = notes.find(n => n.id === noteId);
    if (!src) return;
    const duplicated: NoteItem = {
      ...src,
      id: `note_${Date.now()}`,
      title: `${src.title || 'Catatan'} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [duplicated, ...notes];
    setNotes(updated);
    saveNotesToStorage(updated);
    notify('Catatan berhasil diduplikasi', 'success');
  };

  const toggleSelectBulkNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBulkNoteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllNotes = (list: NoteItem[]) => {
    if (selectedBulkNoteIds.length === list.length && list.length > 0) {
      setSelectedBulkNoteIds([]);
    } else {
      setSelectedBulkNoteIds(list.map(n => n.id));
    }
  };

  const handleBulkDeleteNotes = () => {
    if (selectedBulkNoteIds.length === 0) return;
    const count = selectedBulkNoteIds.length;
    const isTrashView = currentFolderId === 'trash';

    confirm(
      isTrashView
        ? `Hapus PERMANEN ${count} catatan yang ditandai? Tindakan ini tidak dapat dibatalkan.`
        : `Pindahkan ${count} catatan yang ditandai ke Kotak Sampah?`,
      () => {
        let updated: NoteItem[];
        if (isTrashView) {
          updated = notes.filter(n => !selectedBulkNoteIds.includes(n.id));
          notify(`🗑️ ${count} catatan berhasil dihapus permanen`, 'success');
        } else {
          updated = notes.map(n => selectedBulkNoteIds.includes(n.id) ? { ...n, isTrash: true, isPinned: false, updatedAt: new Date().toISOString() } : n);
          notify(`🗑️ ${count} catatan dipindahkan ke Kotak Sampah`, 'success');
        }
        setNotes(updated);
        saveNotesToStorage(updated);
        setSelectedBulkNoteIds([]);
      }
    );
  };

  const getNoteContextMenu = (note: NoteItem) => ({
    title: note.title || 'Catatan Baru',
    subtitle: `Folder: ${folders.find(f => f.id === note.folderId)?.name || 'Umum'} · ${new Date(note.updatedAt || note.createdAt).toLocaleDateString('id-ID')}`,
    headerBadge: note.type === 'canvas' ? 'KANVAS' : 'DOKUMEN',
    items: [
      {
        label: 'Buka di Editor',
        icon: <Edit3 size={15} color="var(--cms-accent)" />,
        action: () => handleOpenNoteInEditor(note.id)
      },
      {
        label: selectedBulkNoteIds.includes(note.id) ? 'Hilangkan Tanda' : 'Tandai / Mode Pilih',
        icon: <Check size={15} color="#10b981" />,
        action: () => toggleSelectBulkNote(note.id)
      },
      ...(selectedBulkNoteIds.length > 0 ? [
        {
          label: 'Batalkan Semua Pilihan',
          icon: <X size={15} color="#94a3b8" />,
          action: () => setSelectedBulkNoteIds([])
        }
      ] : []),
      {
        label: note.isFavorite ? 'Hapus dari Favorit' : 'Tandai Favorit',
        icon: <Star size={15} color="#f59e0b" />,
        action: () => {
          const updated = notes.map(n => n.id === note.id ? { ...n, isFavorite: !n.isFavorite, updatedAt: new Date().toISOString() } : n);
          setNotes(updated);
          saveNotesToStorage(updated);
          notify(note.isFavorite ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit', 'success');
        }
      },
      {
        label: 'Duplikasi Catatan',
        icon: <Copy size={15} />,
        action: () => handleDuplicateNote(note.id)
      },
      { separator: true },
      {
        label: note.isTrash ? 'Hapus Permanen' : 'Pindahkan ke Sampah',
        icon: <Trash2 size={15} />,
        danger: true,
        action: () => note.isTrash ? handleDeletePermanently(note.id) : handleToggleTrash(note.id)
      }
    ]
  });

  const getFolderContextMenu = (folder: NoteFolder) => ({
    title: folder.name || 'Folder',
    subtitle: 'Direktori Catatan',
    headerBadge: 'FOLDER',
    items: [
      {
        label: 'Buka Folder Ini',
        icon: <FolderOpen size={15} color="var(--cms-accent)" />,
        action: () => {
          setCurrentFolderId(folder.id);
          setSelectedTagFilter(null);
        }
      },
      {
        label: 'Buat Catatan Baru',
        icon: <Plus size={15} color="#10b981" />,
        action: () => {
          setCurrentFolderId(folder.id);
          handleCreateNote('doc');
        }
      },
      ...(folder.id !== 'general' ? [
        { separator: true },
        {
          label: 'Hapus Folder',
          icon: <Trash2 size={15} />,
          danger: true,
          action: () => handlePromptDeleteFolder(folder)
        }
      ] : [])
    ]
  });

  const handleDeletePermanently = (noteId: string) => {
    confirm('Hapus catatan ini secara permanen? Catatan tidak dapat dipulihkan lagi.', () => {
      const updated = notes.filter(n => n.id !== noteId);
      setNotes(updated);
      saveNotesToStorage(updated);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(updated.find(n => n.isTrash)?.id || null);
      }
      notify('Catatan dihapus permanen');
    });
  };

  const handleEmptyTrash = () => {
    const trashCount = notes.filter(n => n.isTrash).length;
    if (trashCount === 0) {
      notify('Kotak sampah sudah kosong');
      return;
    }

    confirm(`Hapus permanen semua ${trashCount} catatan di Kotak Sampah?`, () => {
      const updated = notes.filter(n => !n.isTrash);
      setNotes(updated);
      saveNotesToStorage(updated);
      setSelectedNoteId(updated[0]?.id || null);
      notify('Kotak sampah berhasil dikosongkan', 'success');
    });
  };

  // Handler: Create Folder / Sub-Folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const parent = (!['all', 'favorites', 'trash', 'root'].includes(currentFolderId))
      ? currentFolderId
      : null;

    const newFolder: NoteFolder = {
      id: `fld_${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      parentId: parent,
      createdAt: new Date().toISOString()
    };

    const updated = [...folders, newFolder];
    setFolders(updated);
    saveFoldersToStorage(updated);
    setNewFolderName('');
    setIsCreatingFolder(false);
    setCurrentFolderId(newFolder.id);
    notify(`Folder "${newFolder.name}" dibuat`, 'success');
  };

  // Trigger Delete Folder Modal with Options
  const handlePromptDeleteFolder = (folder: NoteFolder) => {
    setFolderToDelete(folder);
    setFolderDeleteChoice('move');
    const alternativeFolder = folders.find(f => f.id !== folder.id && f.parentId !== folder.id)?.id || 'general';
    setTargetMoveFolderId(alternativeFolder);
  };

  // Confirm Delete Folder Execution (Handles nested folders recursively)
  const handleConfirmDeleteFolder = () => {
    if (!folderToDelete) return;
    const folderId = folderToDelete.id;
    const folderName = folderToDelete.name;

    // Collect all subfolder IDs recursively
    const collectFolderIds = (id: string): string[] => {
      const children = folders.filter(f => f.parentId === id);
      return [id, ...children.flatMap(c => collectFolderIds(c.id))];
    };

    const affectedFolderIds = collectFolderIds(folderId);

    let updatedNotes = [...notes];
    let updatedFolders = folders.filter(f => !affectedFolderIds.includes(f.id));

    if (folderDeleteChoice === 'move') {
      updatedNotes = updatedNotes.map(n => affectedFolderIds.includes(n.folderId) ? { ...n, folderId: targetMoveFolderId, updatedAt: new Date().toISOString() } : n);
    } else if (folderDeleteChoice === 'general') {
      updatedNotes = updatedNotes.map(n => affectedFolderIds.includes(n.folderId) ? { ...n, folderId: 'general', updatedAt: new Date().toISOString() } : n);
    } else if (folderDeleteChoice === 'trash') {
      updatedNotes = updatedNotes.map(n => affectedFolderIds.includes(n.folderId) ? { ...n, isTrash: true, isPinned: false, updatedAt: new Date().toISOString() } : n);
    }

    setFolders(updatedFolders);
    setNotes(updatedNotes);
    saveFoldersToStorage(updatedFolders);
    saveNotesToStorage(updatedNotes);

    if (affectedFolderIds.includes(currentFolderId)) {
      setCurrentFolderId('root');
    }

    setFolderToDelete(null);
    notify(`Folder "${folderName}" berhasil dihapus`, 'success');
  };

  // Handler: Add & Remove Tag
  const handleAddTag = (tag: string) => {
    if (!currentNote || !tag.trim()) return;
    const cleanTag = tag.trim();
    if (currentNote.tags?.includes(cleanTag)) return;

    const newTags = [...(currentNote.tags || []), cleanTag];
    handleUpdateNote({ tags: newTags });
    setNewTagInput('');
    setIsTagInputOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!currentNote) return;
    const newTags = (currentNote.tags || []).filter(t => t !== tagToRemove);
    handleUpdateNote({ tags: newTags });
  };

  // REAL INTERACTIVE CHECKLIST TOGGLE
  const handleToggleChecklistLine = (lineIdx: number) => {
    if (!currentNote) return;
    const lines = (currentNote.content || '').split('\n');
    if (lines[lineIdx] !== undefined) {
      if (lines[lineIdx].includes('- [ ]')) {
        lines[lineIdx] = lines[lineIdx].replace('- [ ]', '- [x]');
      } else if (lines[lineIdx].includes('- [x]')) {
        lines[lineIdx] = lines[lineIdx].replace('- [x]', '- [ ]');
      }
      handleUpdateNote({ content: lines.join('\n') });
    }
  };

  // WYSIWYG Block Transformation Handlers (Inserts/Transforms at Current Cursor / Active Line)
  const handleApplyBlockType = (type: NoteBlock['type']) => {
    if (!currentNote) return;
    const { blockIdx, caretPos } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));
    const targetBlock = blocks[targetIdx];

    if (!targetBlock || targetBlock.type === 'image' || targetBlock.type === 'divider') {
      // If no valid target block or on an image/divider, insert new block after it
      const newBlock: NoteBlock = {
        id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type,
        text: '',
        checked: type === 'todo' ? false : undefined
      };
      const updated = [
        ...blocks.slice(0, targetIdx + 1),
        newBlock,
        ...blocks.slice(targetIdx + 1)
      ];
      handleUpdateNote({ content: serializeBlocksToContent(updated) });
      setActiveBlockIndex(targetIdx + 1);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('porto_memo_focus_block', { detail: { idx: targetIdx + 1, pos: 'end' } }));
      }, 30);
      return;
    }

    // If target block exists and is a text block:
    const text = targetBlock.text || '';
    
    // Case A: Block is empty -> Simply change the block type!
    if (!text.trim()) {
      targetBlock.type = type;
      if (type === 'todo') targetBlock.checked = false;
      const updated = [...blocks];
      handleUpdateNote({ content: serializeBlocksToContent(updated) });
      setActiveBlockIndex(targetIdx);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('porto_memo_focus_block', { detail: { idx: targetIdx, pos: 'start' } }));
      }, 30);
      return;
    }

    // Case B: Caret is at start (pos 0) or user clicked to convert whole line -> Change block type of this line!
    if (caretPos === 0 || caretPos >= text.length) {
      targetBlock.type = type;
      if (type === 'todo' && targetBlock.checked === undefined) targetBlock.checked = false;
      const updated = [...blocks];
      handleUpdateNote({ content: serializeBlocksToContent(updated) });
      setActiveBlockIndex(targetIdx);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('porto_memo_focus_block', { detail: { idx: targetIdx, pos: caretPos } }));
      }, 30);
      return;
    }

    // Case C: Caret is in middle of text -> Split block at caret position!
    const textBefore = text.slice(0, caretPos);
    const textAfter = text.slice(caretPos);
    
    targetBlock.text = textBefore;
    const newBlock: NoteBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      text: textAfter,
      checked: type === 'todo' ? false : undefined
    };

    const updated = [
      ...blocks.slice(0, targetIdx + 1),
      newBlock,
      ...blocks.slice(targetIdx + 1)
    ];

    handleUpdateNote({ content: serializeBlocksToContent(updated) });
    setActiveBlockIndex(targetIdx + 1);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_memo_focus_block', { detail: { idx: targetIdx + 1, pos: 'start' } }));
    }, 30);
  };

  const handleInsertDividerBlock = () => {
    if (!currentNote) return;
    const { blockIdx } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));

    const dividerBlock: NoteBlock = {
      id: `blk_div_${Date.now()}`,
      type: 'divider',
      text: ''
    };
    const nextTextBlock: NoteBlock = {
      id: `blk_p_${Date.now() + 1}`,
      type: 'p',
      text: ''
    };

    const updated = [
      ...blocks.slice(0, targetIdx + 1),
      dividerBlock,
      nextTextBlock,
      ...blocks.slice(targetIdx + 1)
    ];
    handleUpdateNote({ content: serializeBlocksToContent(updated) });
    setActiveBlockIndex(targetIdx + 2);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_memo_focus_block', { detail: { idx: targetIdx + 2, pos: 'start' } }));
    }, 30);
  };

  const handleInsertCodeBlock = () => {
    if (!currentNote) return;
    const { blockIdx } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));

    const codeBlock: NoteBlock = {
      id: `blk_code_${Date.now()}`,
      type: 'code',
      text: '// Tulis kode atau catatan teknis di sini...'
    };

    const updated = [
      ...blocks.slice(0, targetIdx + 1),
      codeBlock,
      ...blocks.slice(targetIdx + 1)
    ];
    handleUpdateNote({ content: serializeBlocksToContent(updated) });
    setActiveBlockIndex(targetIdx + 1);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_memo_focus_block', { detail: { idx: targetIdx + 1, pos: 'end' } }));
    }, 30);
  };

  const handleInsertCallout = () => {
    if (!currentNote) return;
    const { blockIdx } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));

    const calloutBlock: NoteBlock = {
      id: `blk_callout_${Date.now()}`,
      type: 'callout',
      text: '💡 Catatan penting atau tips ide...'
    };

    const updated = [
      ...blocks.slice(0, targetIdx + 1),
      calloutBlock,
      ...blocks.slice(targetIdx + 1)
    ];
    handleUpdateNote({ content: serializeBlocksToContent(updated) });
    setActiveBlockIndex(targetIdx + 1);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('porto_memo_focus_block', { detail: { idx: targetIdx + 1, pos: 'end' } }));
    }, 30);
  };

  const handleInsertTable = () => {
    if (!currentNote) return;
    const { blockIdx } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));

    const tableBlock: NoteBlock = {
      id: `blk_tbl_${Date.now()}`,
      type: 'p',
      text: '| Kolom 1 | Kolom 2 | Kolom 3 |\n|---|---|---|\n| Data A | Data B | Data C |'
    };

    const updated = [
      ...blocks.slice(0, targetIdx + 1),
      tableBlock,
      ...blocks.slice(targetIdx + 1)
    ];
    handleUpdateNote({ content: serializeBlocksToContent(updated) });
    setActiveBlockIndex(targetIdx + 1);
    notify('Tabel berhasil disisipkan di baris kursor', 'success');
  };

  const handleInsertLink = () => {
    if (!currentNote) return;
    const url = prompt('Masukkan Tautan Web (URL):', 'https://');
    if (!url || !url.trim()) return;
    const text = prompt('Label Tautan (opsional):', 'Tautan Web') || 'Tautan';
    const linkBadge = `[${text}](${url})`;

    const { blockIdx, caretPos } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));
    const targetBlock = blocks[targetIdx];

    if (targetBlock && targetBlock.type !== 'image' && targetBlock.type !== 'divider') {
      const currentText = targetBlock.text || '';
      const textBefore = currentText.slice(0, caretPos);
      const textAfter = currentText.slice(caretPos);
      targetBlock.text = `${textBefore} ${linkBadge} ${textAfter}`.trim();
      handleUpdateNote({ content: serializeBlocksToContent(blocks) });
    } else {
      const current = currentNote.content || '';
      handleUpdateNote({ content: (current ? `${current}\n` : '') + linkBadge });
    }
    notify('Tautan berhasil disisipkan di posisi kursor', 'success');
  };

  const handleToggleAllChecklists = (completeAll: boolean) => {
    if (!currentNote) return;
    let content = currentNote.content || '';
    if (!content.includes('- [ ]') && !content.includes('- [x]')) {
      notify('Tidak ada checklist to-do di catatan ini');
      return;
    }
    if (completeAll) {
      content = content.replace(/- \[ \]/g, '- [x]');
    } else {
      content = content.replace(/- \[x\]/g, '- [ ]');
    }
    handleUpdateNote({ content });
    notify(completeAll ? 'Semua checklist ditandai selesai' : 'Semua checklist di-reset');
  };

  // Handler: Insert Image URL into Note at Exact Caret Position
  const handleInsertImage = (url: string, alt: string = 'Gambar') => {
    if (!url || !currentNote) return;
    const cleanAlt = alt || 'Gambar';
    const { blockIdx, caretPos } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));
    const targetBlock = blocks[targetIdx] || { id: `blk_${Date.now()}`, type: 'p', text: '' };

    const newImgBlock: NoteBlock = {
      id: `blk_img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'image',
      text: cleanAlt,
      url,
      size: 'small',
      wrap: 'inline'
    };

    let updated: NoteBlock[] = [];

    if (targetBlock.type === 'image' || targetBlock.type === 'divider') {
      updated = [
        ...blocks.slice(0, targetIdx + 1),
        newImgBlock,
        { id: `blk_p_${Date.now()}`, type: 'p', text: '' },
        ...blocks.slice(targetIdx + 1)
      ];
    } else {
      const text = targetBlock.text || '';
      const textBefore = text.slice(0, caretPos);
      const textAfter = text.slice(caretPos);

      const newBlocks: NoteBlock[] = [];
      if (textBefore.length > 0 || caretPos > 0) {
        newBlocks.push({ ...targetBlock, id: `blk_t1_${Date.now()}`, text: textBefore });
      }
      newBlocks.push(newImgBlock);
      if (textAfter.length > 0) {
        newBlocks.push({ id: `blk_t2_${Date.now() + 1}`, type: 'p', text: textAfter });
      } else {
        newBlocks.push({ id: `blk_t2_${Date.now() + 1}`, type: 'p', text: '' });
      }

      updated = [
        ...blocks.slice(0, targetIdx),
        ...newBlocks,
        ...blocks.slice(targetIdx + 1)
      ];
    }

    const newContent = serializeBlocksToContent(updated);
    handleUpdateNote({ content: newContent });
    setActiveBlockIndex(targetIdx + 1);

    notify('Gambar berhasil disisipkan di posisi baris kursor', 'success');
    setIsImageMenuOpen(false);
    setIsMediaGalleryOpen(false);
  };

  // Google Drive Modal State & File Button Insertion Handler
  const [isDriveAttachmentsModalOpen, setIsDriveAttachmentsModalOpen] = useState(false);

  const handleInsertFileButtonToNote = (attachment: any) => {
    if (!currentNote) return;
    const fileName = attachment.name || 'Berkas';
    const fileUrl = attachment.downloadUrl || attachment.url;
    const fileBadge = `[📎 ${fileName}](${fileUrl})`;

    const { blockIdx, caretPos } = lastCaretPosRef.current;
    const blocks = parseContentToBlocks(currentNote.content);
    const targetIdx = Math.min(Math.max(0, blockIdx), Math.max(0, blocks.length - 1));
    const targetBlock = blocks[targetIdx];

    if (targetBlock && targetBlock.type !== 'image' && targetBlock.type !== 'divider') {
      const text = targetBlock.text || '';
      const textBefore = text.slice(0, caretPos);
      const textAfter = text.slice(caretPos);
      targetBlock.text = `${textBefore} ${fileBadge} ${textAfter}`;
      const newContent = serializeBlocksToContent(blocks);
      handleUpdateNote({ content: newContent });
    } else {
      const current = currentNote.content || '';
      handleUpdateNote({ content: `${current}\n${fileBadge}\n` });
    }

    notify(`✅ Tombol berkas "${fileName}" berhasil disisipkan ke catatan!`, 'success');
    setIsDriveAttachmentsModalOpen(false);
  };

  // Mobile / Hardware Back button management: 1-step back hierarchy inside MemoManager
  useNativeBackHandler(isAiModalOpen, () => setIsAiModalOpen(false), 'memo_ai_modal', 30);
  useNativeBackHandler(isCommentsOpen, () => setIsCommentsOpen(false), 'memo_comments_modal', 30);
  useNativeBackHandler(isMediaGalleryOpen, () => setIsMediaGalleryOpen(false), 'memo_media_gallery', 30);
  useNativeBackHandler(isDriveAttachmentsModalOpen, () => setIsDriveAttachmentsModalOpen(false), 'memo_drive_modal', 30);
  useNativeBackHandler(selectedBulkNoteIds.length > 0, () => setSelectedBulkNoteIds([]), 'memo_bulk_select', 25);
  useNativeBackHandler(isSidebarOpen && typeof window !== 'undefined' && window.innerWidth <= 768, () => setIsSidebarOpen(false), 'memo_sidebar', 20);
  useNativeBackHandler(
    !!selectedNoteId && typeof window !== 'undefined' && window.innerWidth <= 768,
    () => {
      setSelectedNoteId(null);
      setViewMode('gallery');
    },
    'memo_active_note_editor',
    15
  );

  // Handler: Sync Notes & Creative Canvases to Google Sheets
  const handleSyncGoogleSheets = async () => {
    setIsSyncingSheets(true);
    try {
      await googleSync.syncNotes(notes, folders, notify);
    } catch (err: any) {
      notify('Gagal sinkronisasi: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Handler: Direct Image File Upload (Local Base64 for offline notes, Cloudinary for online notes)
  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // IF OFFLINE MODE: Convert directly to base64 and save locally without cloud upload
    if (currentNote?.isOfflineOnly) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (base64) {
          handleInsertImage(base64, file.name.split('.')[0] || 'Gambar');
          notify('🛡️ Gambar disimpan lokal di memori offline Anda (Tidak diupload)', 'success');
        }
      };
      reader.readAsDataURL(file);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      return;
    }

    setIsUploadingImage(true);
    notify('Mengupload gambar ke Cloudinary...');
    try {
      const res: any = await uploadToCloudinary(file, 'image');
      const finalUrl = typeof res === 'string' ? res : res?.url || res?.secure_url || '';
      if (finalUrl) {
        handleInsertImage(finalUrl, file.name.split('.')[0] || 'Gambar');
      }
    } catch (err) {
      console.warn('Cloudinary upload failed, fallback to local base64:', err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (base64) {
          handleInsertImage(base64, file.name.split('.')[0] || 'Gambar');
          notify('🛡️ Gambar disimpan lokal (Mode offline aktif)', 'info');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    }
  };

  // Handler: Toggle Offline / Cloud Sync Mode on active note
  const handleToggleOfflineMode = (noteId: string) => {
    const updated = notes.map(n => {
      if (n.id === noteId) {
        const nextOffline = !n.isOfflineOnly;
        notify(
          nextOffline 
            ? '🛡️ Mode Offline Aktif: Catatan ini hanya tersimpan lokal & tidak diunggah ke cloud' 
            : '☁️ Mode Online Aktif: Catatan ini tersinkronisasi ke cloud',
          'success'
        );
        return { ...n, isOfflineOnly: nextOffline, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    setNotes(updated);
    saveNotesToStorage(updated);
  };

  // Handler: Export Note as .agzmemo or .agzboard file
  const handleExportNoteFile = (noteToExport?: NoteItem | null) => {
    const target = noteToExport || currentNote;
    if (!target) return;

    const filePayload = {
      format: 'SUMRDAY_STUDIO_MEMO',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      note: target
    };

    const ext = target.type === 'canvas' ? 'agzboard' : 'agzmemo';
    const cleanTitle = (target.title || 'Catatan').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const fileName = `${cleanTitle}_${Date.now()}.${ext}`;

    const blob = new Blob([JSON.stringify(filePayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`📁 Berkas ${fileName} berhasil disimpan ke komputer Anda`, 'success');
  };

  // Handler: Import & Open Note File (.agzmemo / .agzboard / .json)
  const readAndLoadNoteFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let importedNote: NoteItem;
        if (json.note && json.note.id) {
          importedNote = {
            ...json.note,
            id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: json.note.title || file.name.replace(/\.[^/.]+$/, ""),
            updatedAt: new Date().toISOString()
          };
        } else if (json.title || json.content || json.canvasNotes) {
          importedNote = {
            id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: json.title || file.name.replace(/\.[^/.]+$/, ""),
            content: json.content || '',
            type: json.type || (json.canvasNotes ? 'canvas' : 'doc'),
            canvasNotes: json.canvasNotes,
            canvasBg: json.canvasBg || 'grid',
            folderId: 'general',
            tags: json.tags || ['Impor'],
            isPinned: false,
            isFavorite: false,
            isTrash: false,
            isOfflineOnly: json.isOfflineOnly ?? true,
            color: json.color || 'default',
            createdAt: json.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          throw new Error('Format berkas tidak dikenali');
        }

        const updated = [importedNote, ...notes];
        setNotes(updated);
        setSelectedNoteId(importedNote.id);
        saveNotesToStorage(updated);
        setViewMode('editor');
        setEditorMode('preview');
        notify(`✨ Berkas "${importedNote.title}" berhasil dimuat & dibuka`, 'success');
      } catch (err: any) {
        notify(`Gagal membaca berkas: ${err?.message || 'Format tidak valid'}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportNoteFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndLoadNoteFile(file);
    if (e.target) e.target.value = '';
  };

  // Global Drag & Drop for .agzmemo / .agzboard / .json
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };
    const handleDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.agzmemo') || file.name.endsWith('.agzboard') || file.name.endsWith('.json')) {
          e.preventDefault();
          readAndLoadNoteFile(file);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [notes]);

  // Copy Note Text
  const handleCopyNote = () => {
    if (!currentNote) return;
    const formatted = `${currentNote.title}\n\n${currentNote.content}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formatted);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
      notify('Catatan disalin ke clipboard');
    }
  };

  // Export Note as file
  const handleExportNote = (format: 'txt' | 'md' | 'json') => {
    if (!currentNote) return;
    let data = '';
    let mime = 'text/plain';
    let ext = format;

    if (format === 'json') {
      data = JSON.stringify(currentNote, null, 2);
      mime = 'application/json';
    } else {
      data = `${currentNote.title}\n\n${currentNote.content}`;
    }

    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Catatan diunduh sebagai .${ext}`);
  };

  // Statistics
  const noteStats = useMemo(() => {
    if (!currentNote) return { words: 0, chars: 0, lines: 0 };
    const text = currentNote.content || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split('\n').length;
    return { words, chars, lines };
  }, [currentNote]);

  const activeColorObj = NOTE_COLORS.find(c => c.id === currentNote?.color) || NOTE_COLORS[0];
  const activeFolderName = folders.find(f => f.id === currentNote?.folderId)?.name || 'Catatan Umum';
  const trashNotesCount = useMemo(() => notes.filter(n => n.isTrash).length, [notes]);

  return (
    <div className="memo-manager-root" style={{
      display: 'flex',
      height: '100%',
      minHeight: '100%',
      width: '100%',
      maxWidth: '100%',
      background: (isMobile && mobilePane === 'editor' && currentNote) ? (activeColorObj.bg || 'var(--cms-card-bg)') : 'var(--cms-bg)',
      color: 'var(--cms-text)',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
      transition: 'background 0.25s ease'
    }}>
      <style>{`
        .memo-editor-pane textarea,
        .memo-editor-pane input,
        .memo-editor-pane textarea:focus,
        .memo-editor-pane textarea:not(:focus),
        .memo-canvas-container input,
        .memo-canvas-container textarea,
        .memo-clean-block-input,
        .memo-clean-block-input:focus,
        .memo-clean-block-input:hover,
        .memo-clean-block-input:not(:focus),
        .memo-title-input,
        .memo-title-input:focus,
        .memo-title-input:not(:focus) {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          border: none !important;
          border-color: transparent !important;
          box-shadow: none !important;
          -webkit-box-shadow: none !important;
          outline: none !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        .memo-canvas-container textarea,
        .memo-canvas-container input,
        .memo-title-input {
          color: var(--cms-text) !important;
        }
        .memo-todo-checkbox,
        button.memo-todo-checkbox {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          max-width: 18px !important;
          max-height: 18px !important;
          aspect-ratio: 1 / 1 !important;
          flex-shrink: 0 !important;
          border-radius: 5px !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .memo-quote-block {
          border-left: 4px solid var(--cms-accent, #6366f1) !important;
          padding-left: 14px !important;
          margin: 8px 0 !important;
          background: transparent !important;
        }

        /* Smooth Fluid Transitions for Sidebar & Gallery Layout Changes */
        .memo-sidebar {
          transition: width 0.35s cubic-bezier(0.25, 1, 0.5, 1),
                      min-width 0.35s cubic-bezier(0.25, 1, 0.5, 1),
                      border-color 0.25s ease !important;
          will-change: width, min-width;
        }
        .memo-gallery-content {
          transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .memo-explorer-grid {
          transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .memo-explorer-card {
          transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                      border-color 0.25s ease,
                      background-color 0.25s ease,
                      opacity 0.25s ease !important;
          will-change: transform, box-shadow;
        }
        .memo-explorer-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.09) !important;
        }
        .memo-top-header {
          transition: padding 0.35s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* Image blocks: responsive sizing and modes */
        .memo-canvas-container .memo-image-block,
        .memo-document-sheet .memo-image-block {
          flex-shrink: 0 !important;
          box-sizing: border-box !important;
        }
        .memo-canvas-container .memo-image-block.is-full,
        .memo-document-sheet .memo-image-block.is-full {
          width: 100% !important;
          max-width: 100% !important;
        }
        .memo-canvas-container .memo-image-block.is-small,
        .memo-document-sheet .memo-image-block.is-small {
          width: auto !important;
          max-width: 320px !important;
        }
        @media (max-width: 768px) {
          .memo-canvas-container .memo-image-block.is-small,
          .memo-document-sheet .memo-image-block.is-small {
            max-width: 240px !important;
          }
        }
        .memo-canvas-container .memo-image-block.is-full img,
        .memo-document-sheet .memo-image-block.is-full img {
          width: 100% !important;
          height: auto !important;
          display: block !important;
          max-width: 100% !important;
        }
      `}</style>
      
      {/* ── 1. COLLAPSIBLE FOLDERS SIDEBAR ── */}
      <div 
        className={`memo-sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${mobilePane === 'sidebar' ? 'mobile-active' : ''}`}
        style={{
          width: isSidebarOpen ? 260 : 0,
          minWidth: isSidebarOpen ? 260 : 0,
          background: 'var(--cms-card-bg)',
          borderRight: isSidebarOpen ? '1px solid var(--glass-border)' : '1px solid transparent',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden',
          transition: 'width 0.35s cubic-bezier(0.25, 1, 0.5, 1), min-width 0.35s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.25s ease',
          pointerEvents: isSidebarOpen ? 'auto' : 'none'
        }}
      >
        {/* Inner container */}
        <div style={{
          width: 260,
          minWidth: 260,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transform: isSidebarOpen ? 'translateX(0px)' : 'translateX(-24px)',
          opacity: isSidebarOpen ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
          pointerEvents: isSidebarOpen ? 'auto' : 'none'
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '18px 16px',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--cms-accent), #ec4899)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb), 0.25)'
              }}>
                <FolderTree size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--cms-text)' }}>
                  FILE EXPLORER
                </div>
                <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                  {notes.filter(n => !n.isTrash).length} Catatan Aktif
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'thin' }}>
            
            {/* Main System Locations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { id: 'root', label: 'Beranda Explorer', icon: Home, count: folders.filter(f => !f.parentId).length, color: 'var(--cms-accent)' },
                { id: 'all', label: 'Semua Catatan', icon: BookOpen, count: notes.filter(n => !n.isTrash).length, color: 'var(--cms-accent)' },
                { id: 'favorites', label: 'Favorit', icon: Star, count: notes.filter(n => n.isFavorite && !n.isTrash).length, color: '#f59e0b' },
                { id: 'trash', label: 'Kotak Sampah', icon: Trash2, count: trashNotesCount, color: '#ef4444' },
              ].map(item => {
                const isActive = currentFolderId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentFolderId(item.id);
                      setSelectedTagFilter(null);
                      setMobilePane('gallery');
                    }}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 12,
                      border: 'none',
                      background: isActive ? (item.id === 'trash' ? 'rgba(239,68,68,0.15)' : 'var(--cms-accent-soft)') : 'transparent',
                      color: isActive ? (item.id === 'trash' ? '#ef4444' : 'var(--cms-accent)') : 'var(--cms-text)',
                      fontSize: 13,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <item.icon size={16} style={{ color: isActive ? (item.id === 'trash' ? '#ef4444' : 'var(--cms-accent)') : item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 100,
                      background: isActive ? (item.id === 'trash' ? '#ef4444' : 'var(--cms-accent)') : 'var(--cms-switcher-bg)',
                      color: isActive ? '#fff' : 'var(--cms-text-muted)'
                    }}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tree of Folders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 6px', fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <span>DAFTAR FOLDER ({folders.length})</span>
                <button 
                  onClick={() => setIsCreatingFolder(true)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-accent)', cursor: 'pointer', padding: 2 }}
                  title="Tambah Folder Baru"
                >
                  <Plus size={15} />
                </button>
              </div>

              {folders.map(folder => {
                const isActive = currentFolderId === folder.id;
                const count = getRecursiveNoteCount(folder.id);
                const isSub = Boolean(folder.parentId);
                return (
                  <div
                    key={folder.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px',
                      paddingLeft: isSub ? 22 : 10,
                      borderRadius: 10,
                      background: isActive ? 'var(--cms-accent-soft)' : 'transparent',
                      color: isActive ? 'var(--cms-accent)' : 'var(--cms-text)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setCurrentFolderId(folder.id);
                      setSelectedTagFilter(null);
                      setMobilePane('gallery');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      {isSub && <CornerDownRight size={12} style={{ opacity: 0.4, flexShrink: 0 }} />}
                      <Folder size={15} style={{ color: folder.color || 'var(--cms-accent)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {folder.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* AUTO-HIDING TAGS SECTION */}
            {allUniqueTags.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ padding: '0 6px', fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  LABEL & TAGS ({allUniqueTags.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 4px' }}>
                  {allUniqueTags.map(tag => {
                    const isSelected = selectedTagFilter === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTagFilter(isSelected ? null : tag);
                          setMobilePane('gallery');
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 100,
                          border: `1px solid ${isSelected ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                          background: isSelected ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                          color: isSelected ? '#ffffff' : 'var(--cms-text-muted)',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Hash size={10} />
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {trashNotesCount > 0 && (
            <div style={{ padding: 12, borderTop: '1px solid var(--glass-border)' }}>
              <button
                onClick={handleEmptyTrash}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <Trash2 size={15} /> Kosongkan Sampah
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. MAIN BODY AREA (GALLERY VIEW OR SPLIT EDITOR) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', maxWidth: '100%', width: '100%', minWidth: 0, position: 'relative', boxSizing: 'border-box' }}>
        
        {/* Top Control Bar - Clean Responsive Layout with Path & Breadcrumbs */}
        <div className={`memo-top-header ${mobilePane === 'editor' ? 'mobile-hidden' : ''}`} style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--cms-card-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Main Row: Left (Sidebar toggle + Interactive Breadcrumbs Trail) */}
          <div className="memo-top-row-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flex: 1, minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
              <button
                onClick={() => {
                  if (isMobile) {
                    if (viewMode === 'editor') {
                      handleBackToGallery();
                    } else if (currentFolderId !== 'root') {
                      if (activeCustomFolder && activeCustomFolder.parentId && activeCustomFolder.parentId !== 'root') {
                        setCurrentFolderId(activeCustomFolder.parentId);
                      } else {
                        setCurrentFolderId('root');
                      }
                      setSelectedTagFilter(null);
                    } else {
                      setIsSidebarOpen(prev => !prev);
                    }
                  } else {
                    if (viewMode === 'editor') {
                      setIsEditorListOpen(prev => !prev);
                    } else {
                      setIsSidebarOpen(prev => !prev);
                    }
                  }
                }}
                style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: 'var(--cms-input-bg)',
                  border: '1.5px solid var(--glass-border)',
                  color: 'var(--cms-text)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease', flexShrink: 0
                }}
                title={
                  isMobile
                    ? (currentFolderId !== 'root' || viewMode === 'editor' ? 'Kembali' : 'Folder Sidebar')
                    : (viewMode === 'editor'
                        ? (isEditorListOpen ? 'Sembunyikan Daftar Catatan' : 'Tampilkan Daftar Catatan')
                        : (isSidebarOpen ? 'Sembunyikan Sidebar Folder' : 'Tampilkan Sidebar Folder'))
                }
              >
                {isMobile ? <ArrowLeft size={18} /> : <Columns size={18} />}
              </button>

              {/* ── Interactive File Explorer Breadcrumb Trail ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, overflowX: 'auto', scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.id + '_' + idx}>
                      {idx > 0 && <span style={{ color: 'var(--cms-text-muted)', opacity: 0.5, fontSize: 13, fontWeight: 700 }}>/</span>}
                      <button
                        onClick={() => {
                          if (crumb.isNote) return;
                          setCurrentFolderId(crumb.id);
                          setSelectedTagFilter(null);
                          setViewMode('gallery');
                        }}
                        style={{
                          background: isLast ? 'var(--cms-accent-soft)' : 'transparent',
                          border: isLast ? '1px solid rgba(var(--cms-accent-rgb), 0.2)' : 'none',
                          color: isLast ? (crumb.id === 'trash' ? '#ef4444' : 'var(--cms-accent)') : 'var(--cms-text-muted)',
                          padding: isLast ? '4px 10px' : '4px 6px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isLast ? 850 : 600,
                          cursor: crumb.isNote ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          flexShrink: 0,
                          transition: 'all 0.15s',
                          maxWidth: 200
                        }}
                        title={crumb.name}
                      >
                        {idx === 0 ? <Home size={14} /> : crumb.isNote ? <StickyNote size={14} color="var(--cms-accent)" /> : <Folder size={14} />}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crumb.name}</span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Quick Search Bar (Desktop) */}
              <div className="memo-search-box" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 100,
                background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                maxWidth: 200, width: '100%', flexShrink: 0
              }}>
                <Search size={14} style={{ color: 'var(--cms-text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Cari memo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--cms-text)', fontSize: 12, width: '100%'
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 0 }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Only: Top-Right Create Buttons */}
            {currentFolderId !== 'trash' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleCreateNote('doc')}
                  className="memo-mobile-create-btn"
                  style={{
                    height: 38,
                    padding: '0 12px', borderRadius: 100, border: 'none',
                    background: 'var(--cms-accent)', color: '#fff',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'none', alignItems: 'center', gap: 5,
                    boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb), 0.25)',
                    flexShrink: 0
                  }}
                  title="Catatan Dokumen Baru"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={handleToggleVoiceDictation}
                  className="memo-mobile-create-btn"
                  style={{
                    background: isListeningVoice ? '#ef4444' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Dikte Suara"
                >
                  {isListeningVoice ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>Suara</span>
                </button>

                <button
                  onClick={() => handleCreateNote('canvas')}
                  className="memo-mobile-create-btn"
                  style={{
                    height: 38,
                    width: 38,
                    padding: 0, borderRadius: '50%', border: 'none',
                    background: '#a855f7', color: '#fff',
                    cursor: 'pointer',
                    display: 'none', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(168,85,247, 0.25)',
                    flexShrink: 0
                  }}
                  title="Kanvas Kreatif Baru"
                  aria-label="Kanvas Kreatif Baru"
                >
                  <Layout size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Sub Row: View Switchers & Cloud Actions */}
          <div className="memo-top-row-sub" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* View Mode Toggle */}
            <div className="memo-view-mode-toggle" style={{
              display: 'flex', background: 'var(--cms-switcher-bg)',
              padding: 3, borderRadius: 100, border: '1px solid var(--glass-border)'
            }}>
              <button
                onClick={() => setViewMode('gallery')}
                style={{
                  width: 34, height: 32, padding: 0, borderRadius: 100, border: 'none',
                  background: viewMode === 'gallery' ? 'var(--cms-accent)' : 'transparent',
                  color: viewMode === 'gallery' ? '#fff' : 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                title="Tampilan Galeri Kartu"
                aria-label="Tampilan Galeri Kartu"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => {
                  if (!selectedNoteId && filteredNotes.length > 0) setSelectedNoteId(filteredNotes[0].id);
                  setViewMode('editor');
                }}
                style={{
                  width: 34, height: 32, padding: 0, borderRadius: 100, border: 'none',
                  background: viewMode === 'editor' ? 'var(--cms-accent)' : 'transparent',
                  color: viewMode === 'editor' ? '#fff' : 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                title="Tampilan Editor Menulis"
                aria-label="Tampilan Editor Menulis"
              >
                <Edit3 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── VIEW A: UNIFIED FILE EXPLORER GALLERY (FOLDERS & NOTES SHARE EXACT SAME SIZING & GRID!) ── */}
        {viewMode === 'gallery' && (
          <div className="memo-gallery-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', maxWidth: '100%', width: '100%', boxSizing: 'border-box', padding: '20px 24px 100px', display: 'flex', flexDirection: 'column', gap: 18, scrollbarWidth: 'thin' }}>
            
            {/* Top Explorer Banner with Location Actions */}
            <div 
              className="memo-explorer-banner"
              style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '14px 18px',
              borderRadius: 20,
              background: currentFolderId === 'trash' ? 'rgba(239,68,68,0.08)' : currentFolderId === 'favorites' ? 'rgba(245,158,11,0.08)' : 'var(--cms-card-bg)',
              border: `1.5px solid ${currentFolderId === 'trash' ? 'rgba(239,68,68,0.2)' : currentFolderId === 'favorites' ? 'rgba(245,158,11,0.25)' : 'var(--glass-border)'}`,
              boxShadow: 'var(--cms-shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: currentFolderId === 'trash' ? 'rgba(239,68,68,0.15)' : currentFolderId === 'favorites' ? 'rgba(245,158,11,0.15)' : 'var(--cms-accent-soft)',
                  color: currentFolderId === 'trash' ? '#ef4444' : currentFolderId === 'favorites' ? '#f59e0b' : 'var(--cms-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {currentFolderId === 'root' ? <Home size={20} /> : currentFolderId === 'trash' ? <Trash2 size={20} /> : currentFolderId === 'favorites' ? <Star size={20} fill="#f59e0b" /> : currentFolderId === 'all' ? <BookOpen size={20} /> : <FolderOpen size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: currentFolderId === 'trash' ? '#ef4444' : currentFolderId === 'favorites' ? '#f59e0b' : 'var(--cms-text)' }}>
                    {breadcrumbs[breadcrumbs.length - 1]?.name || 'Explorer'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                    {currentSubFolders.length > 0 ? `${currentSubFolders.length} folder • ` : ''}
                    {filteredNotes.length} item di direktori ini
                  </div>
                </div>
              </div>

              {/* Location Action Buttons */}
              <div className="memo-explorer-banner-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {currentFolderId === 'trash' ? (
                  trashNotesCount > 0 && (
                    <button
                      onClick={handleEmptyTrash}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: '#ef4444', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.25)', flexShrink: 0
                      }}
                      title="Kosongkan Sampah"
                      aria-label="Kosongkan Sampah"
                    >
                      <Trash2 size={16} />
                    </button>
                  )
                ) : (
                  <>
                    {!['favorites', 'all'].includes(currentFolderId) && (
                      <button
                        onClick={() => setIsCreatingFolder(true)}
                        style={{
                          width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--glass-border)',
                          background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s', flexShrink: 0
                        }}
                        title={currentFolderId === 'root' ? 'Folder Baru' : 'Sub-Folder'}
                        aria-label={currentFolderId === 'root' ? 'Folder Baru' : 'Sub-Folder'}
                      >
                        <FolderPlus size={16} color="var(--cms-accent)" />
                      </button>
                    )}

                    <label
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--glass-border)',
                        background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', boxShadow: 'var(--cms-shadow-sm)', flexShrink: 0
                      }}
                      title="Buka Berkas (.agzmemo / .agzboard) dari Explorer Komputer"
                      aria-label="Buka Berkas"
                    >
                      <Upload size={16} color="var(--cms-accent)" />
                      <input
                        type="file"
                        accept=".agzmemo,.agzboard,.json"
                        onChange={handleImportNoteFile}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      onClick={() => { setIsAiModalOpen(true); setAiError(''); }}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--cms-accent)',
                        background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.15)', transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                      title="Buat Catatan Otomatis dengan AI"
                      aria-label="Buat Catatan Otomatis dengan AI"
                    >
                      <Wand2 size={16} />
                    </button>

                    <button
                      onClick={() => handleCreateNote('doc')}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: 'var(--cms-accent)', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb), 0.25)', flexShrink: 0
                      }}
                      title="Buat Catatan Dokumen Teks"
                      aria-label="Buat Catatan Dokumen Teks"
                    >
                      <FileText size={16} />
                    </button>

                    <button
                      onClick={handleToggleVoiceDictation}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: isListeningVoice ? '#ef4444' : '#10b981', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isListeningVoice ? '0 0 16px rgba(239,68,68,0.7)' : '0 4px 12px rgba(16,185,129,0.25)',
                        flexShrink: 0
                      }}
                      title={isListeningVoice ? 'Sedang merekam...' : 'Dikte Suara'}
                      aria-label="Dikte Suara"
                    >
                      {isListeningVoice ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>

                    <button
                      onClick={() => handleCreateNote('canvas')}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: '#a855f7', color: '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(168,85,247, 0.25)', flexShrink: 0
                      }}
                      title="Buat Kanvas Kreatif Bebas"
                      aria-label="Buat Kanvas Kreatif Bebas"
                    >
                      <Layout size={16} />
                    </button>

                    {activeCustomFolder && activeCustomFolder.id !== 'general' && (
                      <button
                        onClick={() => handlePromptDeleteFolder(activeCustomFolder)}
                        style={{
                          width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}
                        title="Hapus folder ini dan kelola isinya"
                        aria-label="Hapus folder ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bulk Selection Action Bar */}
            {selectedBulkNoteIds.length > 0 && (
              <div style={{
                marginBottom: 16,
                padding: '12px 18px',
                borderRadius: 14,
                background: 'var(--cms-card-bg, #1e293b)',
                border: '1.5px solid var(--cms-accent, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                animation: 'cmsFadeIn 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'var(--cms-accent-soft)',
                    color: 'var(--cms-accent)',
                    fontSize: 12.5,
                    fontWeight: 900
                  }}>
                    {selectedBulkNoteIds.length} Catatan Ditandai
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectAllNotes(filteredNotes)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                      background: 'transparent',
                      color: 'var(--cms-text, #f8fafc)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {selectedBulkNoteIds.length === filteredNotes.length && filteredNotes.length > 0 ? 'Batalkan Semua' : 'Tandai Semua Catatan'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleBulkDeleteNotes}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                    }}
                  >
                    <Trash2 size={14} />
                    {currentFolderId === 'trash' ? 'Hapus Permanen' : 'Hapus Ditandai'} ({selectedBulkNoteIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBulkNoteIds([])}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                      background: 'transparent',
                      color: 'var(--cms-text-muted, #94a3b8)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* ── UNIFIED FILE EXPLORER GRID: FOLDERS AT BEGINNING, TRASH AT END OF FOLDERS, NOTES COEXIST IN SAME GRID ── */}
            <div 
              className="memo-explorer-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
                transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            >
              {/* 1. "Semua Catatan" Quick Access Card (at Root, always at the beginning) */}
              {currentFolderId === 'root' && (
                <div
                  onClick={() => {
                    setCurrentFolderId('all');
                    setSelectedTagFilter(null);
                  }}
                  className="memo-explorer-card memo-card-folder memo-gallery-card"
                  style={{
                    padding: '16px',
                    borderRadius: 16,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 180,
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    boxShadow: 'var(--cms-shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, background: 'var(--cms-accent-soft)',
                      color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <BookOpen size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-accent)', padding: '4px 10px', borderRadius: 100, background: 'var(--cms-accent-soft)' }}>
                      {notes.filter(n => !n.isTrash).length} Catatan
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                      Semua Catatan
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                      Akses cepat seluruh memo aktif
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--glass-border)', fontSize: 11, color: 'var(--cms-accent)', fontWeight: 800 }}>
                    <span>Buka Semua</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              )}

              {/* 2. Sub-Folders & Custom Folders */}
              {currentSubFolders.map(folder => {
                const count = getRecursiveNoteCount(folder.id);
                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setCurrentFolderId(folder.id);
                      setSelectedTagFilter(null);
                    }}
                    {...bindContextMenu(() => getFolderContextMenu(folder))}
                    className="memo-explorer-card memo-card-folder memo-gallery-card"
                    style={{
                      padding: '16px',
                      borderRadius: 16,
                      border: '1.5px solid var(--glass-border)',
                      background: 'var(--cms-card-bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 180,
                      transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                      boxShadow: 'var(--cms-shadow-sm)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: `${folder.color || 'var(--cms-accent)'}20`,
                        color: folder.color || 'var(--cms-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Folder size={20} />
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 100,
                        background: `${folder.color || 'var(--cms-accent)'}15`,
                        color: folder.color || 'var(--cms-accent)'
                      }}>
                        {count} Memo
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                        {folder.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                        Direktori Folder
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--glass-border)', fontSize: 11, color: folder.color || 'var(--cms-accent)', fontWeight: 800 }}>
                      <span>Masuk Folder</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}

              {/* 3. "Kotak Sampah" Card (Always placed at the end of the folder items) */}
              {currentFolderId === 'root' && (
                <div
                  onClick={() => {
                    setCurrentFolderId('trash');
                    setSelectedTagFilter(null);
                  }}
                  className="memo-explorer-card memo-card-trash memo-gallery-card"
                  style={{
                    padding: '16px',
                    borderRadius: 16,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 180,
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    boxShadow: 'var(--cms-shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, background: 'rgba(239,68,68,0.12)',
                      color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Trash2 size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', padding: '4px 10px', borderRadius: 100, background: 'rgba(239,68,68,0.1)' }}>
                      {trashNotesCount} Terhapus
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>
                      Kotak Sampah
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                      Memo yang dibuang sementara
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--glass-border)', fontSize: 11, color: '#ef4444', fontWeight: 800 }}>
                    <span>Buka Sampah</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              )}

              {/* 4. Notes / Files in Current Directory (Sharing exact same grid!) */}
              {filteredNotes.map(note => {
                const isBulkSelected = selectedBulkNoteIds.includes(note.id);
                const colorObj = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
                const folder = folders.find(f => f.id === note.folderId);
                
                // Extract first image if present in note content
                const imgMatch = (note.content || '').match(/!\[.*?\]\((.*?)\)/);
                const firstImageUrl = imgMatch ? imgMatch[1] : null;

                const previewSnippet = (note.content || '')
                  .replace(/^!\[.*?\]\(.*?\)/gm, '')
                  .replace(/^#+\s/gm, '')
                  .replace(/[-*]\s/gm, '')
                  .replace(/\[[ x]\]/gm, '')
                  .trim()
                  .slice(0, 120) || 'Catatan kosong...';

                return (
                  <div
                    key={note.id}
                    onClick={() => currentFolderId !== 'trash' && handleOpenNoteInEditor(note.id)}
                    {...bindContextMenu(() => getNoteContextMenu(note))}
                    className="memo-explorer-card memo-card-note memo-gallery-card"
                    style={{
                      padding: '16px',
                      borderRadius: 16,
                      border: isBulkSelected ? '2px solid var(--cms-accent, #6366f1)' : `1.5px solid ${note.isTrash ? 'rgba(239,68,68,0.3)' : colorObj.border || 'var(--glass-border)'}`,
                      background: isBulkSelected ? 'rgba(99,102,241,0.09)' : note.isTrash ? 'rgba(239,68,68,0.04)' : colorObj.bg || 'var(--cms-card-bg)',
                      cursor: currentFolderId === 'trash' ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                      boxShadow: isBulkSelected ? '0 8px 24px rgba(99,102,241,0.2)' : 'var(--cms-shadow-sm)',
                      minHeight: 180,
                      position: 'relative',
                      minWidth: 0,
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {/* Multi-Select Checkbox Badge (Hanya tampil saat mode pilih aktif) */}
                    {selectedBulkNoteIds.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => toggleSelectBulkNote(note.id, e)}
                        title={isBulkSelected ? 'Batalkan pilihan' : 'Tandai catatan ini'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: isBulkSelected ? 'var(--cms-accent, #6366f1)' : 'rgba(0,0,0,0.35)',
                          border: isBulkSelected ? '2px solid #ffffff' : '1.5px solid rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}
                      >
                        {isBulkSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                      </button>
                    )}

                    {/* Optional Note Image Thumbnail */}
                    {firstImageUrl && (
                      <div style={{ height: 90, margin: '-6px -6px 0 -6px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                        <img src={firstImageUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    {/* Card Top Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <span 
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 100,
                            background: 'var(--cms-switcher-bg)',
                            color: folder?.color || 'var(--cms-text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                            maxWidth: 110,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flexShrink: 1
                          }}
                          title={folder?.name || 'Umum'}
                        >
                          <Folder size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {folder?.name || 'Umum'}
                          </span>
                        </span>

                        {note.type === 'canvas' ? (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 100,
                            background: 'rgba(168,85,247,0.15)', color: '#a855f7',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            whiteSpace: 'nowrap', flexShrink: 0
                          }}>
                            <Layout size={11} style={{ flexShrink: 0 }} />
                            <span>Kanvas</span>
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 100,
                            background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            whiteSpace: 'nowrap', flexShrink: 0
                          }}>
                            <FileText size={11} style={{ flexShrink: 0 }} />
                            <span>Dokumen</span>
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {note.isPinned && !note.isTrash && (
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Disematkan">
                            <Pin size={12} style={{ transform: 'rotate(45deg)' }} />
                          </div>
                        )}
                        {note.isFavorite && !note.isTrash && (
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Favorit">
                            <Star size={12} fill="#f59e0b" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: 'var(--cms-text)',
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as any
                    }}>
                      {note.title || 'Tanpa Judul'}
                    </div>

                    {/* Content Preview */}
                    <div style={{
                      fontSize: 12,
                      color: 'var(--cms-text-muted)',
                      lineHeight: 1.5,
                      flex: 1,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: firstImageUrl ? 2 : 3,
                      WebkitBoxOrient: 'vertical' as any
                    }}>
                      {note.type === 'canvas' 
                        ? (note.canvasNotes?.length ? `${note.canvasNotes.length} elemen di papan kanvas` : 'Papan kanvas kreatif siap diisi ide & sticky notes...')
                        : previewSnippet}
                    </div>

                    {/* Card Footer: If in Trash, show Restore & Permanent Delete buttons! */}
                    {note.isTrash ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--glass-border)', gap: 8 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleTrash(note.id); }}
                          style={{
                            flex: 1, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
                            background: 'var(--cms-input-bg)', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                          }}
                        >
                          <RotateCcw size={12} /> Pulihkan
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePermanently(note.id); }}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 11, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                          }}
                        >
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--glass-border)', fontSize: 10, color: 'var(--cms-text-muted)' }}>
                        <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
                          {(note.tags || []).slice(0, 2).map((t, idx) => (
                            <span key={idx} style={{ padding: '2px 7px', borderRadius: 100, background: 'var(--cms-switcher-bg)', fontWeight: 700 }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontWeight: 600 }}>{new Date(note.updatedAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty State when Directory has no subfolders & no notes */}
            {currentSubFolders.length === 0 && filteredNotes.length === 0 && currentFolderId !== 'root' && (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--cms-text-muted)', border: '1px dashed var(--glass-border)', borderRadius: 24, margin: '20px auto', maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {currentFolderId === 'favorites' ? (
                  <Star size={44} fill="#f59e0b" style={{ opacity: 0.8, color: '#f59e0b', margin: '0 auto 12px', display: 'block' }} />
                ) : (
                  <FolderOpen size={44} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                )}
                <div style={{ fontSize: 15, fontWeight: 800, color: currentFolderId === 'favorites' ? '#f59e0b' : 'var(--cms-text)' }}>
                  {currentFolderId === 'trash' ? 'Kotak Sampah Kosong' : currentFolderId === 'favorites' ? 'Belum Ada Catatan Favorit' : 'Folder Ini Masih Kosong'}
                </div>
                <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
                  {currentFolderId === 'trash' 
                    ? 'Tidak ada memo yang dibuang di kotak sampah.'
                    : currentFolderId === 'favorites'
                    ? 'Tandai catatan dengan ikon bintang (Favorit) agar dapat diakses dengan cepat di sini.'
                    : 'Tambahkan sub-folder atau mulai buat catatan baru di dalam direktori ini.'}
                </div>
                {currentFolderId !== 'trash' && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                    {!['favorites', 'all'].includes(currentFolderId) && (
                      <button
                        onClick={() => setIsCreatingFolder(true)}
                        style={{
                          padding: '10px 18px', borderRadius: 100, border: '1px solid var(--glass-border)',
                          background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <FolderPlus size={14} color="var(--cms-accent)" /> <span>Sub-Folder</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCreateNote('doc')}
                      style={{
                        padding: '10px 20px', borderRadius: 100, border: 'none',
                        background: 'var(--cms-accent)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <FileText size={14} /> <span>Catatan Teks</span>
                    </button>
                    <button
                      onClick={() => handleCreateNote('canvas')}
                      style={{
                        padding: '10px 20px', borderRadius: 100, border: 'none',
                        background: '#a855f7', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Layout size={14} /> <span>Kanvas Kreatif</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── VIEW B: 2-COLUMN SPLIT EDITOR VIEW ── */}
        {viewMode === 'editor' && (
          <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
            
            {/* Middle: Notes Compact List Pane (Collapsible & Persistent) */}
            <div 
              className={`memo-list-pane ${mobilePane === 'editor' ? 'mobile-hidden' : ''}`}
              style={{
                width: isEditorListOpen ? 260 : 0,
                minWidth: isEditorListOpen ? 260 : 0,
                maxWidth: isEditorListOpen ? 260 : 0,
                background: 'var(--cms-card-bg)',
                borderRight: isEditorListOpen ? '1px solid var(--glass-border)' : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                height: '100%',
                overflow: 'hidden',
                opacity: isEditorListOpen ? 1 : 0,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, border-color 0.2s ease',
                pointerEvents: isEditorListOpen ? 'auto' : 'none'
              }}
            >
              <div style={{
                width: 260,
                minWidth: 260,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin' }}>
                  {filteredNotes.map(note => {
                    const isSelected = selectedNoteId === note.id;
                    const colorObj = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          setSelectedNoteId(note.id);
                          setMobilePane('editor');
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 14,
                          border: `1.5px solid ${isSelected ? 'var(--cms-accent)' : colorObj.border || 'var(--glass-border)'}`,
                          background: isSelected ? 'var(--cms-accent-soft)' : colorObj.bg || 'var(--cms-card-bg)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            {note.type === 'canvas' ? (
                              <Layout size={13} color="#a855f7" style={{ flexShrink: 0 }} />
                            ) : (
                              <FileText size={13} color="var(--cms-accent)" style={{ flexShrink: 0 }} />
                            )}
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {note.title || 'Tanpa Judul'}
                            </div>
                          </div>
                          {note.isPinned && <Pin size={12} color="var(--cms-accent)" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', paddingLeft: 19 }}>
                          {new Date(note.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Full Writing Canvas & Swipable Toolbars */}
            <div 
              className={`memo-editor-pane ${mobilePane === 'editor' ? 'mobile-active' : ''}`}
              style={{
                flex: 1,
                background: activeColorObj.bg || 'var(--cms-card-bg)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                transition: 'background 0.25s ease'
              }}
            >
              {currentNote ? (
                <>
                  {/* ── 1. ROW 1: HEADER NAVIGATION & ICON-ONLY ACTIONS (LARGER MOBILE ICONS & NO CROPPING) ── */}
                  <div 
                    className="memo-editor-top-nav"
                    style={{
                      padding: isMobile ? '8px 10px' : '8px 18px',
                      borderBottom: '1px solid var(--glass-border)',
                      background: 'var(--cms-card-bg, #ffffff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: isMobile ? 6 : 10,
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      zIndex: 20
                    }}
                  >
                    {/* Left: Back, Folder Selector & Color Palette */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, minWidth: 0, flexShrink: 0 }}>
                      {/* Back Button */}
                      <button 
                        onClick={handleBackToGallery}
                        style={{
                          width: isMobile ? 36 : 34, height: isMobile ? 36 : 34, borderRadius: 10, border: '1.5px solid var(--glass-border)',
                          background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          transition: 'all 0.15s ease'
                        }}
                        title="Kembali ke Galeri File & Folder"
                      >
                        <ArrowLeft size={isMobile ? 18 : 16} />
                      </button>

                      {/* Folder Dropdown */}
                      <div style={{ position: 'relative', minWidth: 0, maxWidth: isMobile ? 90 : 170, flexShrink: 1 }}>
                        <button
                          ref={dropdownTriggerRef}
                          type="button"
                          onClick={handleToggleDropdown}
                          style={{
                            height: isMobile ? 36 : 34,
                            padding: isMobile ? '0 7px' : '0 9px',
                            borderRadius: 10,
                            border: '1.5px solid var(--glass-border)',
                            background: 'var(--cms-card-bg, #ffffff)',
                            color: 'var(--cms-text)',
                            fontSize: isMobile ? 11.5 : 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            width: '100%',
                            overflow: 'hidden'
                          }}
                          title={`Folder: ${activeFolderName}`}
                        >
                          <Folder size={isMobile ? 15 : 13} color="var(--cms-accent)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeFolderName}</span>
                          <ChevronDown size={11} color="var(--cms-text-muted)" style={{ flexShrink: 0 }} />
                        </button>
                      </div>

                      {/* Color Palette */}
                      <div ref={colorPickerRef} style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setIsColorPickerOpen(prev => !prev)}
                          style={{
                            height: isMobile ? 36 : 34,
                            width: isMobile ? 36 : 34,
                            borderRadius: 10,
                            border: '1.5px solid var(--glass-border)',
                            background: 'var(--cms-card-bg, #ffffff)',
                            color: 'var(--cms-text)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                          }}
                          title="Ganti Warna Catatan"
                        >
                          <div
                            style={{
                              width: isMobile ? 16 : 14,
                              height: isMobile ? 16 : 14,
                              borderRadius: '50%',
                              background: activeColorObj.dot,
                              boxShadow: '0 0 0 1.5px var(--glass-border)'
                            }}
                          />
                        </button>

                        {/* Floating Glass Color Palette */}
                        {isColorPickerOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 6px)',
                              left: isMobile ? -30 : 0,
                              background: 'var(--cms-card-bg, #1a1a2e)',
                              backdropFilter: 'blur(24px) saturate(180%)',
                              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                              borderRadius: 14,
                              border: '1.5px solid var(--glass-border)',
                              boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              zIndex: 10000,
                              animation: 'cmsFadeIn 0.15s ease'
                            }}
                          >
                            {NOTE_COLORS.map(c => {
                              const isSelected = currentNote.color === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateNote({ color: c.id });
                                    setIsColorPickerOpen(false);
                                  }}
                                  style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: c.dot, border: 'none', cursor: 'pointer',
                                    padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: isSelected ? '0 0 0 2px var(--cms-card-bg), 0 0 0 4px var(--cms-accent)' : 'none',
                                    flexShrink: 0
                                  }}
                                  title={c.label}
                                >
                                  {isSelected && <Check size={13} color="#fff" strokeWidth={3.5} />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Clean Icon-Only Action Group with zero clipping */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 6, minWidth: 0, flexShrink: 0 }}>
                      {/* Doc / Canvas Switcher */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--cms-input-bg)',
                        borderRadius: 10,
                        padding: 2,
                        border: '1.5px solid var(--glass-border)',
                        flexShrink: 0
                      }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateNote({ type: 'doc' })}
                          style={{
                            width: isMobile ? 32 : 30, height: isMobile ? 32 : 28, borderRadius: 8, border: 'none',
                            background: (currentNote.type || 'doc') === 'doc' ? 'var(--cms-accent)' : 'transparent',
                            color: (currentNote.type || 'doc') === 'doc' ? '#fff' : 'var(--cms-text-muted)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Mode Dokumen Teks"
                        >
                          <FileText size={isMobile ? 16 : 14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateNote({ type: 'canvas' })}
                          style={{
                            width: isMobile ? 32 : 30, height: isMobile ? 32 : 28, borderRadius: 8, border: 'none',
                            background: currentNote.type === 'canvas' ? '#a855f7' : 'transparent',
                            color: currentNote.type === 'canvas' ? '#fff' : 'var(--cms-text-muted)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Mode Kanvas Kreatif"
                        >
                          <Layout size={isMobile ? 16 : 14} />
                        </button>
                      </div>

                      {/* AI Menu Button */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setIsEditorAiMenuOpen(prev => !prev)}
                          style={{
                            width: isMobile ? 36 : 34, height: isMobile ? 36 : 34, borderRadius: 10,
                            border: '1.5px solid var(--glass-border)',
                            background: isEditorAiMenuOpen ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                            color: 'var(--cms-accent)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                          }}
                          title="Asisten AI Penulis (Ringkas, Ide, Checklist)"
                        >
                          <Wand2 size={isMobile ? 18 : 15} />
                        </button>

                        {isEditorAiMenuOpen && (
                          <div
                            style={{
                              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                              background: 'var(--cms-card-bg)', backdropFilter: 'blur(20px)',
                              borderRadius: 14, border: '1.5px solid var(--glass-border)',
                              boxShadow: '0 12px 30px rgba(0,0,0,0.25)', padding: '6px',
                              width: 220, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 3
                            }}
                          >
                            <button
                              onClick={() => handleInEditorAiAction('expand')}
                              style={{
                                padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, textAlign: 'left',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Rocket size={13} color="#3b82f6" /> <span>Lanjutkan & Kembangkan Ide</span>
                            </button>
                            <button
                              onClick={() => handleInEditorAiAction('todo')}
                              style={{
                                padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, textAlign: 'left',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <CheckSquare size={13} color="#10b981" /> <span>Ubah Jadi Checklist To-Do</span>
                            </button>
                            <button
                              onClick={() => handleInEditorAiAction('polish')}
                              style={{
                                padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, textAlign: 'left',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Sparkles size={13} color="#eab308" /> <span>Rapikan & Buat Profesional</span>
                            </button>
                            <button
                              onClick={() => handleInEditorAiAction('summarize')}
                              style={{
                                padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
                                color: 'var(--cms-text)', fontSize: 11, fontWeight: 700, textAlign: 'left',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <FileText size={13} color="#8b5cf6" /> <span>Ringkas Poin Utama</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Client Preview & Share Button */}
                      <button
                        type="button"
                        onClick={() => setIsShareModalOpen(true)}
                        style={{
                          height: 34,
                          padding: isMobile ? '0 10px' : '0 13px',
                          borderRadius: 10,
                          border: '1.5px solid rgba(99, 102, 241, 0.4)',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                          color: 'var(--cms-accent, #6366f1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontWeight: 800,
                          fontSize: 11.5,
                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                        }}
                        title="Bagikan Pratinjau Klien (Read-Only Preview)"
                      >
                        <Share2 size={14} />
                        <span className="hidden sm:inline">Pratinjau Klien</span>
                      </button>

                      {/* PDF Print / Export Button */}
                      {!isMobile && (
                        <button
                          type="button"
                          onClick={() => {
                            if (currentNote.type === 'canvas') {
                              window.dispatchEvent(new CustomEvent('print-whiteboard'));
                            } else {
                              handleExportPdf(currentNote);
                            }
                          }}
                          style={{
                            width: 34, height: 34, borderRadius: 10,
                            border: '1.5px solid var(--glass-border)',
                            background: 'var(--cms-card-bg, #ffffff)',
                            color: 'var(--cms-text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                          }}
                          title="Simpan / Cetak Dokumen PDF"
                        >
                          <Printer size={15} />
                        </button>
                      )}

                      {/* Offline / Cloud Sync Toggle Button — hidden on mobile to prevent top nav overflow */}
                      {!isMobile && (
                        <button
                          type="button"
                          onClick={() => handleToggleOfflineMode(currentNote.id)}
                          style={{
                            width: 34, height: 34, borderRadius: 10,
                            border: `1.5px solid ${currentNote.isOfflineOnly ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                            background: currentNote.isOfflineOnly ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: currentNote.isOfflineOnly ? '#f59e0b' : '#10b981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                          }}
                          title={
                            currentNote.isOfflineOnly 
                              ? 'Mode Offline Aktif (Tersimpan Lokal Saja)' 
                              : 'Mode Online Aktif (Tersinkronisasi ke Cloud)'
                          }
                        >
                          {currentNote.isOfflineOnly ? <Shield size={15} /> : <Zap size={15} />}
                        </button>
                      )}

                      {/* Desktop Extended Action Buttons */}
                      {!isMobile ? (
                        <>
                          {/* Buka Berkas (.agzmemo / .agzboard) Button */}
                          <label
                            style={{
                              width: 34, height: 34, borderRadius: 10,
                              border: '1.5px solid var(--glass-border)',
                              background: 'var(--cms-card-bg, #ffffff)',
                              color: 'var(--cms-accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title="Buka Berkas (.agzmemo / .agzboard) dari Komputer"
                          >
                            <Upload size={15} />
                            <input
                              type="file"
                              accept=".agzmemo,.agzboard,.json"
                              onChange={handleImportNoteFile}
                              style={{ display: 'none' }}
                            />
                          </label>

                          {/* Simpan Berkas (.agzmemo / .agzboard) Button */}
                          <button
                            type="button"
                            onClick={() => handleExportNoteFile(currentNote)}
                            style={{
                              width: 34, height: 34, borderRadius: 10,
                              border: '1.5px solid var(--glass-border)',
                              background: 'var(--cms-card-bg, #ffffff)',
                              color: 'var(--cms-text)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title={`Simpan Berkas (.${currentNote.type === 'canvas' ? 'agzboard' : 'agzmemo'})`}
                          >
                            <Download size={15} />
                          </button>

                          {/* Save Template Button */}
                          <button
                            type="button"
                            onClick={handleSaveActiveNoteAsTemplate}
                            style={{
                              width: 34, height: 34, borderRadius: 10, border: '1.5px solid rgba(16, 185, 129, 0.3)',
                              background: 'rgba(16, 185, 129, 0.08)',
                              color: '#10b981',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title="Simpan sebagai Template"
                          >
                            <Bookmark size={15} />
                          </button>

                          {/* Favorite Button */}
                          <button
                            onClick={() => handleUpdateNote({ isFavorite: !currentNote.isFavorite })}
                            style={{
                              width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--glass-border)',
                              background: currentNote.isFavorite ? 'rgba(245, 158, 11, 0.2)' : 'var(--cms-card-bg, #ffffff)',
                              color: currentNote.isFavorite ? '#f59e0b' : 'var(--cms-text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title={currentNote.isFavorite ? 'Hapus dari Favorit' : 'Tandai Favorit'}
                          >
                            <Star size={15} fill={currentNote.isFavorite ? '#f59e0b' : 'none'} />
                          </button>

                          {/* Pin Button */}
                          <button
                            onClick={() => handleUpdateNote({ isPinned: !currentNote.isPinned })}
                            style={{
                              width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--glass-border)',
                              background: currentNote.isPinned ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg, #ffffff)',
                              color: currentNote.isPinned ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title={currentNote.isPinned ? 'Lepas Pin' : 'Sematkan ke Atas'}
                          >
                            <Pin size={15} style={{ transform: currentNote.isPinned ? 'rotate(45deg)' : 'none' }} />
                          </button>

                          {/* Copy Note Button */}
                          <button
                            onClick={handleCopyNote}
                            style={{
                              width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--glass-border)',
                              background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title="Salin Catatan"
                          >
                            {copiedNote ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => currentNote.isTrash ? handleDeletePermanently(currentNote.id) : handleToggleTrash(currentNote.id)}
                            style={{
                              width: 34, height: 34, borderRadius: 10, border: '1.5px solid var(--glass-border)',
                              background: 'var(--cms-card-bg, #ffffff)', color: '#ef4444',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title="Pindahkan ke Kotak Sampah"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        /* Mobile "More Options" Popover Trigger (Ensures 0% Cropping on Mobile!) */
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => setIsMoreMenuOpen(prev => !prev)}
                            style={{
                              width: 36, height: 36, borderRadius: 10,
                              border: '1.5px solid var(--glass-border)',
                              background: isMoreMenuOpen ? 'var(--cms-accent-soft)' : 'var(--cms-card-bg)',
                              color: isMoreMenuOpen ? 'var(--cms-accent)' : 'var(--cms-text)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                            }}
                            title="Opsi Lengkap Catatan"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {isMoreMenuOpen && (
                            <div
                              style={{
                                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                background: 'var(--cms-card-bg)', backdropFilter: 'blur(24px)',
                                borderRadius: 16, border: '1.5px solid var(--glass-border)',
                                boxShadow: '0 16px 36px rgba(0,0,0,0.3)', padding: '6px',
                                width: 220, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 2,
                                animation: 'cmsModalPop 0.15s ease-out'
                              }}
                            >
                              <button
                                onClick={() => { setIsMoreMenuOpen(false); setIsShareModalOpen(true); }}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'rgba(99, 102, 241, 0.1)',
                                  color: 'var(--cms-accent, #6366f1)', fontSize: 12.5, fontWeight: 800, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Share2 size={16} color="var(--cms-accent, #6366f1)" />
                                <span>Pratinjau Klien (Preview)</span>
                              </button>
                              <label
                                onClick={() => setIsMoreMenuOpen(false)}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                                  color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 750, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Upload size={16} color="var(--cms-accent)" />
                                <span>Buka Berkas File</span>
                                <input
                                  type="file"
                                  accept=".agzmemo,.agzboard,.json"
                                  onChange={handleImportNoteFile}
                                  style={{ display: 'none' }}
                                />
                              </label>
                              <button
                                onClick={() => { setIsMoreMenuOpen(false); handleExportNoteFile(currentNote); }}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                                  color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 750, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Download size={16} color="var(--cms-accent)" />
                                <span>Simpan Berkas (.agz)</span>
                              </button>
                              <button
                                onClick={() => { setIsMoreMenuOpen(false); handleSaveActiveNoteAsTemplate(); }}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                                  color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 750, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Bookmark size={16} color="#10b981" />
                                <span>Simpan Template</span>
                              </button>
                              <button
                                onClick={() => { setIsMoreMenuOpen(false); handleUpdateNote({ isFavorite: !currentNote.isFavorite }); }}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                                  color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 750, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Star size={16} fill={currentNote.isFavorite ? '#f59e0b' : 'none'} color="#f59e0b" />
                                <span>{currentNote.isFavorite ? 'Hapus Favorit' : 'Tandai Favorit'}</span>
                              </button>
                              <button
                                onClick={() => { setIsMoreMenuOpen(false); handleUpdateNote({ isPinned: !currentNote.isPinned }); }}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                                  color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 750, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Pin size={16} color="var(--cms-accent)" />
                                <span>{currentNote.isPinned ? 'Lepas Pin' : 'Sematkan Pin'}</span>
                              </button>
                              <button
                                onClick={() => { setIsMoreMenuOpen(false); handleCopyNote(); }}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                                  color: 'var(--cms-text)', fontSize: 12.5, fontWeight: 750, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Copy size={16} />
                                <span>Salin Catatan</span>
                              </button>
                              <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                              <button
                                onClick={() => { setIsMoreMenuOpen(false); currentNote.isTrash ? handleDeletePermanently(currentNote.id) : handleToggleTrash(currentNote.id); }}
                                style={{
                                  padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
                                  color: '#ef4444', fontSize: 12.5, fontWeight: 750, textAlign: 'left',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9
                                }}
                              >
                                <Trash2 size={16} color="#ef4444" />
                                <span>{currentNote.isTrash ? 'Hapus Permanen' : 'Pindahkan Sampah'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Linked Project / Content Banner (Single Clean Row) ── */}
                  {currentNote?.projectId && (
                    <div style={{
                      padding: '6px 14px',
                      background: 'rgba(var(--cms-accent-rgb), 0.08)',
                      borderBottom: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'nowrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--cms-accent)', minWidth: 0 }}>
                        <FolderKanban size={15} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11.5 }}>
                          Terhubung ke Proyek
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToProject}
                        title="Kembali ke Modul Proyek & Buka Detail Proyek"
                        style={{
                          padding: '4px 12px',
                          borderRadius: 100,
                          border: 'none',
                          background: 'var(--cms-accent)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 850,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.25)',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <ArrowLeft size={12} />
                        <span>Ke Proyek</span>
                      </button>
                    </div>
                  )}

                  {/* ── 2. ROW 2: DEDICATED VISIBLE FORMATTING TOOLBAR RIBBON (DESKTOP & MOBILE) ── */}
                  {(currentNote.type || 'doc') === 'doc' && (
                    <div
                      className="memo-doc-formatting-ribbon"
                      style={{
                        padding: '6px 14px',
                        borderBottom: '1px solid var(--glass-border)',
                        background: 'var(--cms-card-bg, #ffffff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 6,
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        zIndex: 15
                      }}
                    >
                      {/* Hidden Native File Input for Direct Upload */}
                      <input
                        type="file"
                        ref={imageFileInputRef}
                        accept="image/*"
                        onChange={handleDirectImageUpload}
                        style={{ display: 'none' }}
                      />

                      {/* Image Inserter Button */}
                      <button
                        onClick={() => setIsImageMenuOpen(true)}
                        disabled={isUploadingImage}
                        style={{
                          height: 30, padding: '0 10px', borderRadius: 8, border: 'none',
                          background: 'var(--cms-accent, #6366f1)', color: '#ffffff',
                          display: 'flex', alignItems: 'center', gap: 5,
                          cursor: 'pointer', fontWeight: 800, fontSize: 11, flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(99,102,241,0.25)'
                        }}
                        title="Sisipkan Gambar (Upload / Galeri)"
                      >
                        {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                        <span>Gambar</span>
                      </button>

                      {/* Google Drive File Attachment Button in Toolbar */}
                      <button
                        type="button"
                        onClick={() => setIsDriveAttachmentsModalOpen(true)}
                        style={{
                          height: 30, padding: '0 11px', borderRadius: 8,
                          border: '1.5px solid rgba(59, 130, 246, 0.35)',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                          display: 'flex', alignItems: 'center', gap: 6,
                          cursor: 'pointer', fontWeight: 800, fontSize: 11, flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.15)',
                          transition: 'all 0.2s ease'
                        }}
                        title="Buka Modul Lampiran File Google Drive"
                      >
                        <Paperclip size={13} />
                        <span>File Drive</span>
                        {getSafeArray(currentNote.attachments).length > 0 && (
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: 100,
                            background: '#3b82f6',
                            color: '#ffffff',
                            fontSize: 9.5,
                            fontWeight: 900
                          }}>
                            {getSafeArray(currentNote.attachments).length}
                          </span>
                        )}
                      </button>

                      {/* Undo & Redo History Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--cms-card-bg, #ffffff)', padding: '2px 4px', borderRadius: 8, border: '1.5px solid var(--glass-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={handleUndo}
                          disabled={undoStack.length === 0}
                          style={{
                            height: 26, padding: '0 8px', borderRadius: 6, border: 'none',
                            background: 'transparent',
                            color: undoStack.length > 0 ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                            opacity: undoStack.length > 0 ? 1 : 0.35,
                            cursor: undoStack.length > 0 ? 'pointer' : 'not-allowed',
                            fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 4,
                            transition: 'all 0.15s ease'
                          }}
                          title="Undo / Batalkan Perubahan (Ctrl+Z)"
                        >
                          <Undo2 size={13} />
                          <span>Undo</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRedo}
                          disabled={redoStack.length === 0}
                          style={{
                            height: 26, padding: '0 8px', borderRadius: 6, border: 'none',
                            background: 'transparent',
                            color: redoStack.length > 0 ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                            opacity: redoStack.length > 0 ? 1 : 0.35,
                            cursor: redoStack.length > 0 ? 'pointer' : 'not-allowed',
                            fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 4,
                            transition: 'all 0.15s ease'
                          }}
                          title="Redo / Kembalikan Perubahan (Ctrl+Y atau Ctrl+Shift+Z)"
                        >
                          <Redo2 size={13} />
                          <span>Redo</span>
                        </button>
                      </div>

                      {/* Headings */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--cms-card-bg, #ffffff)', padding: '2px 4px', borderRadius: 8, border: '1.5px solid var(--glass-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                        <button onClick={() => handleApplyBlockType('h1')} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 2 }} title="Heading 1"><Heading1 size={13} /><span>H1</span></button>
                        <button onClick={() => handleApplyBlockType('h2')} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 2 }} title="Heading 2"><Heading2 size={13} /><span>H2</span></button>
                        <button onClick={() => handleApplyBlockType('h3')} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 2 }} title="Heading 3"><Heading3 size={13} /><span>H3</span></button>
                      </div>

                      {/* Lists */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--cms-card-bg, #ffffff)', padding: '2px 4px', borderRadius: 8, border: '1.5px solid var(--glass-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                        <button onClick={() => handleApplyBlockType('todo')} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Checklist To-Do"><CheckSquare size={13} /><span>To-Do</span></button>
                        <button onClick={() => handleApplyBlockType('bullet')} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Daftar Poin"><List size={13} /><span>Poin</span></button>
                        <button onClick={() => handleApplyBlockType('number')} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Daftar Nomor"><ListOrdered size={13} /><span>Nomor</span></button>
                      </div>

                      {/* Rich Blocks */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--cms-card-bg, #ffffff)', padding: '2px 4px', borderRadius: 8, border: '1.5px solid var(--glass-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                        <button onClick={() => handleApplyBlockType('quote')} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Kutipan"><Quote size={13} /><span>Kutipan</span></button>
                        <button onClick={handleInsertCallout} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Callout Catatan"><Lightbulb size={14} color="#f59e0b" /><span>Callout</span></button>
                        <button onClick={handleInsertCodeBlock} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Blok Kode"><Code size={13} color="var(--cms-accent)" /><span>Kode</span></button>
                        <button onClick={handleInsertTable} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Tabel"><TableIcon size={13} /><span>Tabel</span></button>
                        <button onClick={handleInsertLink} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Tautan Web"><LinkIcon size={13} /><span>Tautan</span></button>
                        <button onClick={handleInsertDividerBlock} style={{ height: 26, padding: '0 7px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 3 }} title="Garis Pemisah"><Minus size={13} /><span>Garis</span></button>
                      </div>

                      {/* Checklist Power Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                        <button 
                          onClick={() => handleToggleAllChecklists(true)} 
                          style={{ height: 26, padding: '0 7px', borderRadius: 8, border: '1.5px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.12)', color: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}
                          title="Tandai semua to-do selesai"
                        >
                          <CheckCheck size={13} />
                          <span>Check All</span>
                        </button>
                        <button 
                          onClick={() => handleToggleAllChecklists(false)} 
                          style={{ height: 26, padding: '0 7px', borderRadius: 8, border: '1.5px solid var(--glass-border)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}
                          title="Reset semua to-do"
                        >
                          <RotateCcw size={12} />
                          <span>Reset</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => window.dispatchEvent(new Event('porto_memo_select_all_doc'))} 
                          style={{ height: 26, padding: '0 8px', borderRadius: 8, border: '1.5px solid var(--cms-accent, #6366f1)', background: 'var(--cms-accent-soft, rgba(99, 102, 241, 0.15))', color: 'var(--cms-accent, #6366f1)', cursor: 'pointer', fontSize: 11, fontWeight: 850, display: 'flex', alignItems: 'center', gap: 3 }}
                          title="Pilih seluruh dokumen catatan & gambar (Ctrl+A)"
                        >
                          <CheckSquare size={12} />
                          <span>Pilih Semua</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (currentNote) {
                              navigator.clipboard?.writeText(currentNote.content || '');
                              window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: "📋 Seluruh catatan berhasil disalin ke clipboard!", type: "success" } }));
                            }
                          }} 
                          style={{ height: 26, padding: '0 8px', borderRadius: 8, border: '1.5px solid var(--glass-border)', background: 'var(--cms-card-bg, #ffffff)', color: 'var(--cms-text)', cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}
                          title="Salin seluruh isi catatan ke clipboard"
                        >
                          <Copy size={12} />
                          <span>Salin</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── 3. CONTINUOUS DOCUMENT SHEET OR CREATIVE WHITEBOARD CANVAS ── */}
                  {currentNote.type === 'canvas' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      {/* Note Title & Tag Bar in Canvas View */}
                      <div style={{ padding: '12px 20px 8px', display: 'flex', flexDirection: 'column', gap: 6, background: 'transparent', borderBottom: '1px solid var(--glass-border)', zIndex: 10, flexShrink: 0 }}>
                        <AutoGrowTextarea
                          className="memo-title-input memo-clean-block-input"
                          value={currentNote.title}
                          onChange={t => handleUpdateNote({ title: t })}
                          onKeyDown={() => {}}
                          placeholder="Judul Kanvas Kreatif..."
                          style={{
                            fontSize: 22,
                            fontWeight: 900,
                            fontFamily: "'Outfit', sans-serif",
                            letterSpacing: '-0.02em',
                            lineHeight: 1.3
                          }}
                        />
                        {/* Tag Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {(currentNote.tags || []).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '3px 8px', borderRadius: 100,
                                background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)',
                                fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              #{tag}
                              <X size={11} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => handleRemoveTag(tag)} />
                            </span>
                          ))}
                          {isTagInputOpen ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="text"
                                placeholder="Tag baru..."
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                autoFocus
                                style={{
                                  padding: '3px 8px', borderRadius: 100, border: '1px solid var(--glass-border)',
                                  background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 11, outline: 'none'
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddTag(newTagInput);
                                  if (e.key === 'Escape') setIsTagInputOpen(false);
                                }}
                              />
                              <button onClick={() => handleAddTag(newTagInput)} style={{ border: 'none', background: 'var(--cms-accent)', color: '#fff', padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>OK</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsTagInputOpen(true)}
                              style={{
                                padding: '3px 8px', borderRadius: 100, border: '1px dashed var(--glass-border)',
                                background: 'transparent', color: 'var(--cms-text-muted)', fontSize: 11, fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Plus size={12} /> Tag
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Embedded Creative Canvas Engine */}
                      <div style={{
                        flex: 1, position: 'relative',
                        height: '100%'
                      }}>
                        <WhiteboardModule
                          embedded={true}
                          canvasNotes={currentNote.canvasNotes || []}
                          canvasLines={currentNote.canvasLines || []}
                          canvasBg={currentNote.canvasBg || 'grid'}
                          onUpdateNotes={(updatedNotes) => handleUpdateNote({ canvasNotes: updatedNotes })}
                          onUpdateLines={(updatedLines) => handleUpdateNote({ canvasLines: updatedLines })}
                          onUpdateBg={(newBg) => handleUpdateNote({ canvasBg: newBg })}
                          notify={notify}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Continuous Document Sheet (Centered on Desktop) */
                    <div 
                      className="memo-canvas-container" 
                      style={{ 
                        flex: 1, 
                        minHeight: 0,
                        overflowY: 'auto', 
                        overflowX: 'hidden',
                        background: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center', // Centers document sheet on desktop!
                        padding: isMobile ? '16px 14px 20px 14px' : '44px 32px 180px',
                        scrollbarWidth: 'thin',
                        overscrollBehaviorY: 'contain',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      <div 
                        className="memo-document-sheet"
                        style={{
                          width: '100%',
                          maxWidth: 840, // Notion/Medium centered layout
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '100%',
                          paddingBottom: isMobile ? 'calc(240px + env(safe-area-inset-bottom, 30px))' : '120px'
                        }}
                      >
                        {/* Note Title */}
                        <div style={{ width: '100%', marginBottom: 14, paddingTop: 8, background: 'transparent' }}>
                          <AutoGrowTextarea
                            className="memo-title-input memo-clean-block-input"
                            value={currentNote.title}
                            onChange={t => handleUpdateNote({ title: t })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setActiveBlockIndex(0);
                                window.dispatchEvent(new CustomEvent('porto_memo_focus_first_block'));
                              }
                            }}
                            placeholder="Judul Catatan..."
                            style={{
                              fontSize: isMobile ? 24 : 32,
                              fontWeight: 900,
                              fontFamily: "'Outfit', sans-serif",
                              letterSpacing: '-0.02em',
                              lineHeight: 1.35,
                              padding: '4px 0 8px',
                              color: 'var(--cms-text)'
                            }}
                          />
                        </div>

                        {/* Tag Pills */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16, background: 'transparent' }}>
                          {(currentNote.tags || []).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 10px', borderRadius: 100,
                                background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)',
                                fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              #{tag}
                              <X size={11} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => handleRemoveTag(tag)} />
                            </span>
                          ))}

                          {isTagInputOpen ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="text"
                                placeholder="Tag baru..."
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                autoFocus
                                style={{
                                  padding: '4px 10px', borderRadius: 100, border: '1px solid var(--glass-border)',
                                  background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 11, outline: 'none'
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddTag(newTagInput);
                                  if (e.key === 'Escape') setIsTagInputOpen(false);
                                }}
                              />
                              <button onClick={() => handleAddTag(newTagInput)} style={{ border: 'none', background: 'var(--cms-accent)', color: '#fff', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>OK</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsTagInputOpen(true)}
                              style={{
                                padding: '4px 10px', borderRadius: 100, border: '1px dashed var(--glass-border)',
                                background: 'transparent', color: 'var(--cms-text-muted)', fontSize: 11, fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Plus size={13} /> Tag
                            </button>
                          )}

                          {/* Tag Admin Team Members */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', position: 'relative' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <UserCheck size={13} color="var(--cms-accent)" /> Tim:
                            </span>
                            {getSafeArray(currentNote.taggedAdmins).map((adminNameOrId) => {
                              const foundUser = adminUsers.find(u => u.name === adminNameOrId || u.id === adminNameOrId);
                              const displayName = foundUser?.name || adminNameOrId;
                              const avatar = foundUser?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(displayName)}`;
                              return (
                                <span
                                  key={adminNameOrId}
                                  style={{
                                    padding: '3px 8px 3px 4px', borderRadius: 100,
                                    background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                                    fontSize: 11, fontWeight: 750, display: 'inline-flex', alignItems: 'center', gap: 5,
                                    border: '1px solid rgba(var(--cms-accent-rgb), 0.25)'
                                  }}
                                >
                                  <img src={avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                                  <span>{displayName}</span>
                                  <X 
                                    size={12} 
                                    style={{ cursor: 'pointer', opacity: 0.7 }} 
                                    onClick={() => {
                                      const updated = getSafeArray(currentNote.taggedAdmins).filter(t => t !== adminNameOrId);
                                      handleUpdateNote({ taggedAdmins: updated });
                                    }} 
                                  />
                                </span>
                              );
                            })}

                            {/* Add/Tag Admin Dropdown Button */}
                            <button
                              type="button"
                              onClick={() => setIsTagAdminMenuOpen(prev => !prev)}
                              style={{
                                padding: '4px 10px', borderRadius: 100, border: '1px dashed var(--glass-border)',
                                background: 'transparent', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Plus size={13} /> Tag Admin
                            </button>

                            {isTagAdminMenuOpen && (
                              <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: 6,
                                background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                                borderRadius: 16, padding: '8px', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                                zIndex: 99, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4
                              }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                                  Pilih Admin untuk Ditag:
                                </div>
                                {adminUsers.length === 0 ? (
                                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', padding: '6px 8px' }}>Tidak ada user admin lain</div>
                                ) : (
                                  adminUsers.map(u => {
                                    const isTagged = getSafeArray(currentNote.taggedAdmins).includes(u.name) || getSafeArray(currentNote.taggedAdmins).includes(u.id);
                                    return (
                                      <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => {
                                          const currentTags = getSafeArray(currentNote.taggedAdmins);
                                          const updated = isTagged ? currentTags.filter(t => t !== u.name && t !== u.id) : [...currentTags, u.name];
                                          handleUpdateNote({ taggedAdmins: updated });
                                        }}
                                        style={{
                                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                          padding: '6px 10px', borderRadius: 8, border: 'none',
                                          background: isTagged ? 'var(--cms-accent-soft)' : 'transparent',
                                          color: isTagged ? 'var(--cms-accent)' : 'var(--cms-text)',
                                          fontSize: 12, fontWeight: isTagged ? 800 : 600, cursor: 'pointer', textAlign: 'left'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                          <img src={u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(u.name)}`} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                                          <span>{u.name}</span>
                                        </div>
                                        {isTagged && <Check size={14} />}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unified Interactive Free-Text & Visual Media Canvas */}
                        <RichBlockNotepad
                          content={currentNote.content}
                          onChange={c => handleUpdateNote({ content: c })}
                          activeBlockIndex={activeBlockIndex}
                          setActiveBlockIndex={setActiveBlockIndex}
                          onCaretChange={(blockIdx, caretPos) => {
                            lastCaretPosRef.current = { blockIdx, caretPos };
                          }}
                        />

                        {/* Document Footer Metadata Flow (Clean Notion/Docs Style) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 2px 4px',
                          marginTop: 36,
                          borderTop: '1px solid var(--glass-border)',
                          fontSize: 11,
                          color: 'var(--cms-text-muted)',
                          opacity: 0.7,
                          userSelect: 'none',
                          fontWeight: 600,
                          flexShrink: 0,
                          clear: 'both',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{noteStats.words} Kata</span>
                            <span>•</span>
                            <span>{noteStats.chars} Karakter</span>
                            <span>•</span>
                            <span>{noteStats.lines} Baris</span>
                          </div>
                          <div>
                            Diedit: {new Date(currentNote.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* Generous bottom clearance spacer so all content effortlessly scrolls way above the floating navbar dock */}
                        <div 
                          className="memo-bottom-clearance-spacer"
                          style={{
                            height: isMobile ? 260 : 140,
                            width: '100%',
                            flexShrink: 0,
                            pointerEvents: 'none'
                          }} 
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)', gap: 12 }}>
                  <StickyNote size={44} style={{ opacity: 0.3 }} />
                  <div style={{ fontSize: 15, fontWeight: 800 }}>Pilih catatan dari daftar di sebelah kiri</div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ── COMMENTS MODAL – floating centered ── */}
      {isCommentsOpen && currentNote && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 16px'
          }}
          onClick={() => setIsCommentsOpen(false)}
        >
          {/* Backdrop – no blur */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none'
          }} />

          {/* Floating Panel */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%', maxWidth: 480,
              maxHeight: isMobile ? 'calc(100vh - 140px)' : '75vh',
              borderRadius: 20,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column',
              animation: 'cmsModalSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--glass-border)', flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} color="var(--cms-accent)" />
                <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                  Diskusi & Komentar Tim
                </span>
                {getSafeArray(currentNote.comments).length > 0 && (
                  <span style={{
                    background: 'var(--cms-accent)', color: '#fff',
                    borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 800
                  }}>
                    {getSafeArray(currentNote.comments).length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: 10, border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Comments list */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              {getSafeArray(currentNote.comments).length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '40px 20px', gap: 10, color: 'var(--cms-text-muted)', textAlign: 'center'
                }}>
                  <MessageSquare size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto' }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Belum ada komentar</div>
                  <div style={{ fontSize: 11, textAlign: 'center', opacity: 0.7 }}>
                    Tulis komentar atau instruksi di bawah untuk tim kamu
                  </div>
                </div>
              ) : (
                getSafeArray(currentNote.comments).map((comm, idx) => (
                  <div key={comm.id} style={{
                    display: 'flex', gap: 10,
                    background: 'var(--cms-input-bg)', padding: '11px 14px',
                    borderRadius: 14, border: '1px solid var(--glass-border)'
                  }}>
                    <img
                      src={comm.userAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(comm.userName)}`}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>{comm.userName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>
                            {new Date(comm.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => {
                              const filtered = getSafeArray(currentNote.comments).filter((_, i) => i !== idx);
                              handleUpdateNote({ comments: filtered });
                            }}
                            style={{
                              background: 'transparent', border: 'none', cursor: 'pointer',
                              color: '#ef4444', opacity: 0.5, padding: 2, lineHeight: 1
                            }}
                            title="Hapus komentar"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--cms-text)', lineHeight: 1.5 }}>{comm.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div style={{
              padding: '12px 16px 16px',
              borderTop: '1px solid var(--glass-border)', flexShrink: 0
            }}>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!newCommentText.trim()) return;
                  const currentUserName = auth.currentUser?.displayName || 'Admin';
                  const currentUserAvatar = auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUserName)}`;
                  const comment: NoteComment = {
                    id: `comm_${Date.now()}`,
                    userId: auth.currentUser?.uid || 'admin',
                    userName: currentUserName,
                    userAvatar: currentUserAvatar,
                    text: newCommentText.trim(),
                    createdAt: new Date().toISOString()
                  };
                  handleUpdateNote({ comments: [...getSafeArray(currentNote.comments), comment] });
                  setNewCommentText('');
                  notify?.('Komentar ditambahkan', 'success');
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  type="text"
                  placeholder="Tulis komentar atau instruksi untuk tim..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1, height: 42, borderRadius: 12,
                    background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    padding: '0 14px', fontSize: 13, color: 'var(--cms-text)', outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  style={{
                    height: 42, padding: '0 18px', borderRadius: 12,
                    background: newCommentText.trim() ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                    color: newCommentText.trim() ? '#fff' : 'var(--cms-text-muted)',
                    border: 'none', fontSize: 13, fontWeight: 800,
                    cursor: newCommentText.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s ease', flexShrink: 0
                  }}
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── GLOBAL FIXED PORTAL DROPDOWN (PILIH FOLDER DENGAN STRUKTUR POHON) ── */}
      {isFolderDropdownOpen && currentNote && (
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownCoords.top,
            left: dropdownCoords.left,
            width: 250,
            maxHeight: 340,
            overflowY: 'auto',
            borderRadius: 18,
            background: 'var(--cms-card-bg)',
            border: '1.5px solid var(--glass-border)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
            padding: '8px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'cmsModalPop 0.16s ease-out',
            scrollbarWidth: 'thin'
          }}
        >
          <div style={{ padding: '6px 8px 4px', fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PILIH FOLDER TUJUAN
          </div>
          {folders.map(f => {
            const isSelected = f.id === currentNote.folderId;
            const isSub = Boolean(f.parentId);
            return (
              <div
                key={f.id}
                onClick={() => {
                  handleUpdateNote({ folderId: f.id });
                  setIsFolderDropdownOpen(false);
                }}
                style={{
                  padding: '9px 12px',
                  paddingLeft: isSub ? 24 : 12,
                  borderRadius: 12,
                  background: isSelected ? 'var(--cms-accent-soft)' : 'transparent',
                  color: isSelected ? 'var(--cms-accent)' : 'var(--cms-text)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {isSub && <CornerDownRight size={12} style={{ opacity: 0.5, flexShrink: 0 }} />}
                  <Folder size={15} style={{ color: f.color || 'var(--cms-accent)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                </div>
                {isSelected && <Check size={16} color="var(--cms-accent)" style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── IMAGE INSERTER MODAL (NEVER CLIPPED BY SCROLL CONTAINERS) ── */}
      {isImageMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'cmsFadeIn 0.15s ease-out'
        }}>
          <div style={{
            width: '100%', maxWidth: 420, borderRadius: 24,
            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 18
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--cms-text)' }}>
                    Sisipkan Gambar
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                    Pilih sumber foto atau gambar untuk catatan ini
                  </div>
                </div>
              </div>
              <button onClick={() => setIsImageMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Option 1: Direct Upload */}
              <div
                onClick={() => {
                  imageFileInputRef.current?.click();
                  setIsImageMenuOpen(false);
                }}
                style={{
                  padding: '20px 16px',
                  borderRadius: 18,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 10,
                  transition: 'all 0.15s'
                }}
                className="memo-folder-card"
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 850, color: 'var(--cms-text)' }}>Upload Foto</div>
                  <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 2 }}>Dari HP / Komputer</div>
                </div>
              </div>

              {/* Option 2: Media Gallery */}
              <div
                onClick={() => {
                  setIsImageMenuOpen(false);
                  setIsMediaGalleryOpen(true);
                }}
                style={{
                  padding: '20px 16px',
                  borderRadius: 18,
                  border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 10,
                  transition: 'all 0.15s'
                }}
                className="memo-folder-card"
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Library size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 850, color: 'var(--cms-text)' }}>Galeri Media</div>
                  <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 2 }}>Pilih aset tersimpan</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsImageMenuOpen(false)}
              style={{
                width: '100%', padding: '11px', borderRadius: 100, border: '1px solid var(--glass-border)',
                background: 'transparent', color: 'var(--cms-text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ── MEDIA GALLERY MODAL INTEGRATION ── */}
      <MediaGalleryModal
        isOpen={isMediaGalleryOpen}
        onClose={() => setIsMediaGalleryOpen(false)}
        onSelect={(media: any) => {
          const finalUrl = typeof media === 'string' ? media : (media?.secure_url || media?.url || '');
          if (finalUrl) {
            handleInsertImage(finalUrl, (typeof media === 'object' && media?.original_filename) ? media.original_filename : 'Gambar Galeri');
          }
        }}
      />

      {/* ── CREATE FOLDER / SUB-FOLDER MODAL ── */}
      {isCreatingFolder && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'cmsFadeIn 0.15s ease-out'
        }}>
          <div style={{
            width: '100%', maxWidth: 360, borderRadius: 24,
            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderPlus size={20} color="var(--cms-accent)" />
                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--cms-text)' }}>
                  {!['all', 'favorites', 'trash', 'root'].includes(currentFolderId) ? `Buat Sub-Folder` : `Buat Folder Baru`}
                </span>
              </div>
              <button onClick={() => setIsCreatingFolder(false)} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {!['all', 'favorites', 'trash', 'root'].includes(currentFolderId) && (
              <div style={{ fontSize: 11, color: 'var(--cms-accent)', background: 'var(--cms-accent-soft)', padding: '6px 10px', borderRadius: 8, fontWeight: 700 }}>
                Di dalam: 📁 {folders.find(f => f.id === currentFolderId)?.name}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Nama Folder</label>
              <input
                type="text"
                placeholder="Misal: Proyek Desain, Referensi..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                autoFocus
                style={{
                  padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 13, outline: 'none'
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setIsCreatingFolder(false); }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>Warna Ikon Folder</label>
              <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                {['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444'].map(col => (
                  <div
                    key={col}
                    onClick={() => setNewFolderColor(col)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: col,
                      cursor: 'pointer', border: newFolderColor === col ? '3px solid #fff' : '2px solid transparent',
                      boxShadow: newFolderColor === col ? '0 0 0 2px var(--cms-accent)' : 'none',
                      transition: 'transform 0.15s'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setIsCreatingFolder(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 100, border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleCreateFolder}
                style={{
                  flex: 1, padding: '12px', borderRadius: 100, border: 'none',
                  background: 'var(--cms-accent)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.3)'
                }}
              >
                Simpan Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADVANCED DELETE FOLDER MODAL WITH 3 NOTE CHOICES ── */}
      {folderToDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'simpleOverlayFade 0.18s ease-out'
        }}>
          <div style={{
            width: '100%', maxWidth: 430, borderRadius: 24,
            background: 'var(--cms-card-bg)', border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.25)', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 16,
            animation: 'simpleCardFade 0.18s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: 'var(--cms-text)' }}>
                  Hapus Folder "{folderToDelete.name}"?
                </div>
                <div style={{ fontSize: 12, color: 'var(--cms-text-muted)' }}>
                  {getRecursiveNoteCount(folderToDelete.id)} catatan berada di dalam hierarki folder ini.
                </div>
              </div>
            </div>

            {getRecursiveNoteCount(folderToDelete.id) > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>
                  Pilih tindakan untuk catatan di dalamnya:
                </div>

                {/* Option 1: Move to another folder */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${folderDeleteChoice === 'move' ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                  background: folderDeleteChoice === 'move' ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <input
                    type="radio"
                    name="folderDeleteChoice"
                    checked={folderDeleteChoice === 'move'}
                    onChange={() => setFolderDeleteChoice('move')}
                    style={{ marginTop: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Pindahkan Catatan ke Folder Lain</div>
                    {folderDeleteChoice === 'move' && (
                      <select
                        value={targetMoveFolderId}
                        onChange={e => setTargetMoveFolderId(e.target.value)}
                        style={{
                          marginTop: 8, width: '100%', padding: '8px 12px', borderRadius: 10,
                          border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)',
                          color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                        }}
                      >
                        {folders.filter(f => f.id !== folderToDelete.id).map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                {/* Option 2: General / Without folder */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${folderDeleteChoice === 'general' ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                  background: folderDeleteChoice === 'general' ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <input
                    type="radio"
                    name="folderDeleteChoice"
                    checked={folderDeleteChoice === 'general'}
                    onChange={() => setFolderDeleteChoice('general')}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Jadikan Tanpa Folder (Catatan Umum)</div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Catatan tetap aman tersimpan di Catatan Umum.</div>
                  </div>
                </label>

                {/* Option 3: Delete notes to trash */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${folderDeleteChoice === 'trash' ? '#ef4444' : 'var(--glass-border)'}`,
                  background: folderDeleteChoice === 'trash' ? 'rgba(239,68,68,0.1)' : 'var(--cms-input-bg)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <input
                    type="radio"
                    name="folderDeleteChoice"
                    checked={folderDeleteChoice === 'trash'}
                    onChange={() => setFolderDeleteChoice('trash')}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444' }}>Pindahkan Semua Catatan ke Kotak Sampah</div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Semua catatan dalam hierarki folder ini ikut dihapus ke Sampah.</div>
                  </div>
                </label>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', lineHeight: 1.6 }}>
                Folder ini kosong. Menghapus folder ini tidak akan mempengaruhi catatan lain.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setFolderToDelete(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 100, border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteFolder}
                style={{
                  flex: 1, padding: '12px', borderRadius: 100, border: 'none',
                  background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)'
                }}
              >
                Konfirmasi Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REDESIGNED UNIFIED AI & OFFLINE NOTE TEMPLATE MODAL ── */}
      {isAiModalOpen && createPortal(
        <div 
          onClick={() => !isAiGenerating && setIsAiModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483640,
            background: isMobile ? 'var(--cms-panel-bg, var(--cms-bg))' : 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 20,
            boxSizing: 'border-box',
            animation: 'cmsFadeIn 0.2s ease both'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={isMobile ? {
              position: 'relative',
              width: '100vw',
              height: '100dvh',
              maxHeight: '100dvh',
              background: 'var(--cms-panel-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'nativeSheetUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
              overflow: 'hidden',
              boxSizing: 'border-box'
            } : {
              position: 'relative',
              width: '100%',
              maxWidth: 700,
              height: 'min(660px, 90vh)',
              minHeight: 600,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 24,
              boxShadow: '0 28px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'pmModalIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '12px 14px' : '16px 20px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: noteGeneratorMode === 'offline' ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-accent-soft)',
                  color: noteGeneratorMode === 'offline' ? '#10b981' : 'var(--cms-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: noteGeneratorMode === 'offline' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px var(--cms-accent-soft)'
                }}>
                  {noteGeneratorMode === 'offline' ? <Zap size={18} /> : <Wand2 size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{noteGeneratorMode === 'offline' ? 'Template Catatan Instan' : 'AI Note Generator'}</span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                      background: noteGeneratorMode === 'offline' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(124, 58, 237, 0.15)',
                      color: noteGeneratorMode === 'offline' ? '#10b981' : '#8b5cf6',
                      border: `1px solid ${noteGeneratorMode === 'offline' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(124, 58, 237, 0.3)'}`,
                      display: 'inline-flex', alignItems: 'center', gap: 3
                    }}>
                      {noteGeneratorMode === 'offline' ? <><Zap size={10} /> 0 Kuota</> : <><Sparkles size={10} /> Gemini AI</>}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 1 }}>
                    {noteGeneratorMode === 'offline' ? 'Pilih template catatan & SOP siap pakai' : 'Generate struktur catatan & to-do otomatis dengan AI'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isAiGenerating}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '12px 14px' : '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              WebkitOverflowScrolling: 'touch'
            }}>
              {/* 1. Sleek Mode Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 12,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: noteGeneratorMode === 'ai' ? 'var(--cms-accent-soft)' : 'rgba(16, 185, 129, 0.15)',
                    color: noteGeneratorMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {noteGeneratorMode === 'ai' ? <Sparkles size={14} /> : <Zap size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 850, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{noteGeneratorMode === 'ai' ? 'Mode AI Generator' : 'Mode Template Instan'}</span>
                    </div>
                  </div>
                </div>

                {/* Switch Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={noteGeneratorMode === 'ai'}
                  onClick={() => setNoteGeneratorMode(noteGeneratorMode === 'ai' ? 'offline' : 'ai')}
                  title={noteGeneratorMode === 'ai' ? 'Beralih ke Template (Offline)' : 'Beralih ke AI Generator'}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    borderRadius: 100,
                    border: `1.5px solid ${noteGeneratorMode === 'ai' ? 'var(--cms-accent)' : '#10b981'}`,
                    background: noteGeneratorMode === 'ai' ? 'var(--cms-accent-soft)' : 'rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 2,
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    background: noteGeneratorMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: noteGeneratorMode === 'ai' ? 'translateY(-50%) translateX(20px)' : 'translateY(-50%) translateX(0)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                  }}>
                    {noteGeneratorMode === 'ai' ? <Sparkles size={10} /> : <Zap size={10} />}
                  </div>
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* MODE 1: TEMPLATE INSTAN                                      */}
              {/* 1. Mode Switcher -> 2. Live Preview -> 3. Controls -> 4. Grid */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {noteGeneratorMode === 'offline' && (() => {
                const allTemplates = [...customNoteTemplates, ...OFFLINE_NOTE_TEMPLATES];
                const currentTemplate = allTemplates.find(t => t.id === aiTemplateType) || allTemplates[0];
                const baseCategories = [
                  { id: 'all', label: 'Semua' },
                  ...(customNoteTemplates.length > 0 ? [{ id: 'custom', label: '⭐ Kustom' }] : []),
                  { id: 'design', label: 'Desain' },
                  { id: 'business', label: 'Bisnis' },
                  { id: 'tasks', label: 'Tugas' },
                  { id: 'marketing', label: 'Marketing' },
                  { id: 'personal', label: 'Personal' },
                  ...customNoteCategories
                ];

                return (
                  <>
                    {/* 2. LIVE PREVIEW BOX (TEPAT DI BAWAH SWITCH MODE) */}
                    {currentTemplate && (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        flexShrink: 0
                      }}>
                        {/* Header Preview */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 850, color: '#10b981', minWidth: 0 }}>
                            <Eye size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Preview Template: {currentTemplate.label}
                            </span>
                            {currentTemplate.id.startsWith('custom_') && (
                              <span style={{ fontSize: 8.5, fontWeight: 850, padding: '1px 5px', borderRadius: 4, background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', flexShrink: 0 }}>
                                ⭐ KUSTOM
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 5, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                              FOLDER: {(currentTemplate.folder || 'general').toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 850, color: 'var(--cms-text)' }}>
                            {currentTemplate.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', lineHeight: 1.4, marginTop: 3 }}>
                            {currentTemplate.prompt || 'Format catatan terstruktur dengan checklist, bullet point, dan tabel rapi.'}
                          </div>
                        </div>

                        {/* Tags Preview */}
                        {currentTemplate.tags && currentTemplate.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 1 }}>
                            {currentTemplate.tags.map((tag: string, idx: number) => (
                              <span key={idx} style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                                background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)'
                              }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. SEARCH BAR + CATEGORY FILTER CHIPS + +TEMPLATE BUTTON (JADI SATU KONTROL) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          flex: 1,
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 10px', borderRadius: 10,
                          background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)'
                        }}>
                          <Search size={13} style={{ color: 'var(--cms-text-muted)', flexShrink: 0 }} />
                          <input
                            type="text"
                            value={aiSearchQuery}
                            onChange={e => setAiSearchQuery(e.target.value)}
                            placeholder="Cari template catatan..."
                            style={{
                              width: '100%', background: 'transparent', border: 'none',
                              outline: 'none', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 600
                            }}
                          />
                          {aiSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setAiSearchQuery('')}
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--cms-text-muted)',
                                cursor: 'pointer', padding: 0, display: 'flex'
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* + Buat Template Baru Button */}
                        <button
                          type="button"
                          onClick={() => setIsCreatingCustomTemplate(true)}
                          style={{
                            padding: '6px 11px',
                            borderRadius: 10,
                            border: '1px solid #10b981',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontSize: 11,
                            fontWeight: 850,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Plus size={13} />
                          <span>Template</span>
                        </button>
                      </div>

                      {/* Category Filter Chips */}
                      <div style={{
                        display: 'flex', flexWrap: 'nowrap', gap: 5, padding: '1px 0',
                        overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
                      }}>
                        {baseCategories.map(cat => {
                          const isActive = aiCategoryFilter === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setAiCategoryFilter(cat.id as any)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 100,
                                border: `1px solid ${isActive ? '#10b981' : 'var(--glass-border)'}`,
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-input-bg)',
                                color: isActive ? '#10b981' : 'var(--cms-text-muted)',
                                fontSize: 10.5, fontWeight: isActive ? 850 : 650,
                                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                transition: 'all 0.12s ease'
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. TEMPLATE CARDS GRID (DI BAWAH MENEMPEL TOMBOL AKSI, MENGISI SELURUH RUANG KE BAWAH) */}
                    <div style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 6,
                      padding: '1px',
                      alignContent: 'start'
                    }}>
                      {allTemplates
                        .filter(t => {
                          const isCustom = t.id.startsWith('custom_');
                          let matchesCategory = true;
                          if (aiCategoryFilter === 'custom') {
                            matchesCategory = isCustom;
                          } else if (aiCategoryFilter !== 'all') {
                            matchesCategory = t.category === aiCategoryFilter;
                          }
                          const matchesSearch = !aiSearchQuery.trim() || 
                            t.label.toLowerCase().includes(aiSearchQuery.toLowerCase()) || 
                            t.title.toLowerCase().includes(aiSearchQuery.toLowerCase()) ||
                            (t.tags || []).some(tag => tag.toLowerCase().includes(aiSearchQuery.toLowerCase()));
                          return matchesCategory && matchesSearch;
                        })
                        .map(tmpl => {
                          const isSelected = aiTemplateType === tmpl.id;
                          const isCustom = tmpl.id.startsWith('custom_');
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => setAiTemplateType(tmpl.id)}
                              style={{
                                padding: isMobile ? '9px 12px' : '8px 10px',
                                borderRadius: 10,
                                border: `1.5px solid ${isSelected ? '#10b981' : 'var(--glass-border)'}`,
                                background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-input-bg)',
                                color: isSelected ? '#10b981' : 'var(--cms-text)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 9,
                                textAlign: 'left',
                                transition: 'all 0.12s ease',
                                boxShadow: isSelected ? '0 2px 10px rgba(16, 185, 129, 0.15)' : 'none',
                                width: '100%',
                                boxSizing: 'border-box',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--cms-card-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isSelected ? '#10b981' : 'var(--cms-text-muted)'
                              }}>
                                <FileText size={14} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: 12,
                                  fontWeight: isSelected ? 850 : 700,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  <span>{tmpl.label}</span>
                                  {isCustom && (
                                    <span style={{ fontSize: 8.5, padding: '1px 4px', borderRadius: 4, background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', fontWeight: 900 }}>
                                      ⭐
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                  {(tmpl.folder || 'GENERAL').toUpperCase()}
                                </div>
                              </div>
                              {isCustom ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomTemplate(e, tmpl.id)}
                                  title="Hapus template kustom"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--cms-text-muted)',
                                    cursor: 'pointer',
                                    padding: 2,
                                    display: 'flex',
                                    borderRadius: 4
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                isSelected && (
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                                )
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </>
                );
              })()}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* MODE 2: GEMINI AI GENERATOR (Hanya Form Prompt + Tombol)     */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {noteGeneratorMode === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  {/* Quick Chips Topik */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={11} color="var(--cms-accent)" /> Rekomendasi Format Catatan:
                    </div>
                    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                      {[
                        'Notulen Meeting Klien',
                        'Checklist SOP Onboarding',
                        'Daftar To-Do Sprint Mingguan',
                        'Ide Konten & Storyboard'
                      ].map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiPrompt(sug)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: 8,
                            border: '1px solid var(--glass-border)',
                            background: 'var(--cms-card-bg)',
                            color: 'var(--cms-text)',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Textarea Instruksi */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 850, color: 'var(--cms-text)' }}>
                        <FileText size={13} color="var(--cms-accent)" />
                        <span>Instruksi & Topik Catatan</span>
                      </div>
                      {/* Info Tooltip with Fade Transition */}
                      <div 
                        title="AI akan menyusun draf catatan terstruktur lengkap dengan heading, bullet points, dan checklist."
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 10, color: 'var(--cms-text-muted)', cursor: 'help'
                        }}
                      >
                        <Info size={12} />
                        <span>Format Bebas</span>
                      </div>
                    </div>

                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Contoh: Buatkan catatan rencana peluncuran aplikasi mobile baru, lengkap dengan checklist timeline dan pembagian tim..."
                      rows={isMobile ? 3 : 4}
                      disabled={isAiGenerating}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-input-bg)',
                        border: '1.5px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--cms-accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>

                  {aiError && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', fontSize: 11, fontWeight: 700
                    }}>
                      {aiError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div style={{
              display: 'flex',
              gap: 8,
              padding: isMobile ? '10px 14px max(14px, env(safe-area-inset-bottom, 14px)) 14px' : '14px 20px',
              borderTop: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isAiGenerating}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleGenerateAiNoteSubmit()}
                disabled={isAiGenerating}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: noteGeneratorMode === 'offline' ? '#10b981' : 'var(--cms-accent)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 850,
                  cursor: isAiGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: noteGeneratorMode === 'offline' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : '0 4px 14px var(--cms-accent-soft)',
                  opacity: isAiGenerating ? 0.7 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {isAiGenerating ? (
                  <><Loader2 size={13} className="cms-spin" /><span>Memproses...</span></>
                ) : (
                  <>{noteGeneratorMode === 'offline' ? <Zap size={14} /> : <Wand2 size={14} />}<span>{noteGeneratorMode === 'offline' ? 'Terapkan Template' : 'Buat dengan AI'}</span></>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CREATE CUSTOM NOTE TEMPLATE MODAL ── */}
      {isCreatingCustomTemplate && createPortal(
        <div
          onClick={() => setIsCreatingCustomTemplate(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483645,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={isMobile ? {
              position: 'relative',
              width: '100vw',
              height: '100dvh',
              maxHeight: '100dvh',
              background: 'var(--cms-panel-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'nativeSheetUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
              overflow: 'hidden',
              boxSizing: 'border-box'
            } : {
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '12px 16px' : '14px 18px', borderBottom: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>
                <Plus size={16} color="#10b981" />
                <span>Buat Template Catatan Baru</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingCustomTemplate(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: isMobile ? '12px 16px' : '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Nama Template Catatan *
                </label>
                <input
                  type="text"
                  value={newTemplateForm.label}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, label: e.target.value })}
                  placeholder="Contoh: SOP Sprint Harian Developer"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Kategori
                  </label>
                  <CustomDropdown
                    value={newTemplateForm.category}
                    onChange={(val) => setNewTemplateForm({ ...newTemplateForm, category: val })}
                    options={[
                      { value: 'design', label: 'Desain' },
                      { value: 'business', label: 'Bisnis' },
                      { value: 'tasks', label: 'Tugas' },
                      { value: 'marketing', label: 'Marketing' },
                      { value: 'personal', label: 'Personal' },
                      ...customNoteCategories.map(c => ({ value: c.id, label: c.label }))
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    + Buat Kategori Baru
                  </label>
                  <input
                    type="text"
                    value={newTemplateForm.newCategoryInput}
                    onChange={e => setNewTemplateForm({ ...newTemplateForm, newCategoryInput: e.target.value })}
                    placeholder="Nama kategori..."
                    style={{
                      width: '100%', height: 38, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 10, padding: '0 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Judul Standar Catatan
                </label>
                <input
                  type="text"
                  value={newTemplateForm.title}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, title: e.target.value })}
                  placeholder="Contoh: Checklist Sprint Review & To-Do Tim"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Isi / Kerangka Template Catatan
                </label>
                <textarea
                  rows={4}
                  value={newTemplateForm.prompt}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, prompt: e.target.value })}
                  placeholder="Tuliskan format markdown, checklist to-do - [ ] atau poin-poin standar..."
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', resize: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Folder Tujuan
                  </label>
                  <CustomDropdown
                    value={newTemplateForm.folder}
                    onChange={(val) => setNewTemplateForm({ ...newTemplateForm, folder: val })}
                    options={[
                      { value: 'general', label: 'Catatan Umum' },
                      { value: 'ideas', label: 'Ide & Konsep' },
                      { value: 'clients', label: 'Catatan Klien' },
                      { value: 'tasks', label: 'To-Do & Proyek' },
                      ...folders.filter(f => !['general', 'ideas', 'clients', 'tasks'].includes(f.id)).map(f => ({ value: f.id, label: f.name }))
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Tags (Pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={newTemplateForm.tags}
                    onChange={e => setNewTemplateForm({ ...newTemplateForm, tags: e.target.value })}
                    placeholder="SOP, Dev, Checklist"
                    style={{
                      width: '100%', height: 38, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 10, padding: '0 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
              padding: isMobile ? '10px 16px max(14px, env(safe-area-inset-bottom, 14px)) 16px' : '12px 18px',
              borderTop: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)'
            }}>
              <button
                type="button"
                onClick={() => setIsCreatingCustomTemplate(false)}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 750, cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewCustomTemplate}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none',
                  background: '#10b981', color: '#fff', fontSize: 11.5, fontWeight: 850, cursor: 'pointer'
                }}
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODUL LAMPIRAN GOOGLE DRIVE (POPUP MODAL DIALOG) ── */}
      {isDriveAttachmentsModalOpen && currentNote && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsDriveAttachmentsModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            animation: 'cmsFadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 680,
              background: 'var(--cms-card-bg)', borderRadius: 24,
              border: '1.5px solid var(--glass-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cms-card-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Paperclip size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.01em' }}>Modul Lampiran Google Drive</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {currentNote.title ? `Catatan: "${currentNote.title}"` : 'Catatan Dokumen Aktif'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveAttachmentsModalOpen(false)}
                style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--cms-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--cms-text-muted)'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', maxHeight: '68vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 14, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: 12, color: 'var(--cms-text)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <div>
                  Unggah berkas dokumen atau arsip ke Google Drive. Klik tombol <strong>"Sisipkan"</strong> untuk menambahkan tombol berkas interaktif langsung di posisi kursor catatan Anda.
                </div>
              </div>

              <DriveAttachmentPicker
                attachments={getSafeArray(currentNote.attachments)}
                onChange={(newAttachments) => {
                  handleUpdateNote({ attachments: newAttachments });
                  notify?.('Lampiran catatan disimpan ke Google Drive');
                }}
                onInsertToNote={(att) => handleInsertFileButtonToNote(att)}
                folderCategory={`Notes_Attachments/${currentNote.title || currentNote.id}`}
                notify={notify}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--cms-card-bg)' }}>
              <button
                type="button"
                onClick={() => setIsDriveAttachmentsModalOpen(false)}
                style={{
                  height: 38,
                  padding: '0 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--cms-accent, #6366f1)',
                  color: '#fff',
                  fontSize: 12.5,
                  fontWeight: 850,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CLIENT PREVIEW & SHARE MODAL (READ-ONLY FOR CLIENTS) ── */}
      {isShareModalOpen && currentNote && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsShareModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            animation: 'cmsFadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 540,
              background: 'var(--cms-card-bg, #0f172a)',
              borderRadius: 24,
              border: '1.5px solid var(--glass-border, rgba(255,255,255,0.12))',
              boxShadow: '0 30px 70px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'cmsModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: 'rgba(var(--cms-accent-rgb, 99, 102, 241), 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: 'var(--cms-accent, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Share2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.015em' }}>
                    Pratinjau Klien (Preview Only)
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 2 }}>
                    Tunjukkan konsep draf kepada klien secara aman tanpa akses edit.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Unified Card 1: Draf & Status Hub */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: 'var(--cms-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Draf Aktif
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 900, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {currentNote.title || 'Tanpa Judul'}
                    </div>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 11px',
                    borderRadius: 100,
                    background: currentNote.type === 'canvas' ? 'rgba(168, 85, 247, 0.14)' : 'rgba(99, 102, 241, 0.14)',
                    border: `1px solid ${currentNote.type === 'canvas' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                    color: currentNote.type === 'canvas' ? '#a855f7' : 'var(--cms-accent, #6366f1)',
                    fontSize: 11,
                    fontWeight: 850,
                    flexShrink: 0
                  }}>
                    {currentNote.type === 'canvas' ? <Layers size={12} /> : <FileText size={12} />}
                    <span>{currentNote.type === 'canvas' ? 'Whiteboard Canvas' : 'Dokumen Konsep'}</span>
                  </div>
                </div>

                {/* Status Chips Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted)' }}>
                    <Eye size={13} />
                    <span>Dilihat <strong>{currentNote.viewCount || 0}x</strong></span>
                  </div>

                  <span style={{ color: 'var(--glass-border)', fontSize: 10 }}>•</span>

                  <div>
                    {currentNote.approvalStatus === 'approved' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 11.5, fontWeight: 850 }}>
                        <Check size={12} /> Disetujui (ACC)
                      </span>
                    ) : currentNote.approvalStatus === 'revision' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: 11.5, fontWeight: 850 }}>
                        <Edit3 size={12} /> Minta Revisi
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--cms-text-muted)', fontSize: 11.5, fontWeight: 700 }}>
                        <Clock size={12} /> Menunggu Review
                      </span>
                    )}
                  </div>

                  <span style={{ color: 'var(--glass-border)', fontSize: 10 }}>•</span>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: '#10b981' }}>
                    <ShieldCheck size={13} />
                    <span>Terkunci Read-Only</span>
                  </div>
                </div>

                {currentNote.approvalNote && (
                  <div style={{ fontSize: 11, color: '#f59e0b', fontStyle: 'italic', background: 'rgba(245,158,11,0.08)', padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
                    Catatan Klien: "{currentNote.approvalNote}"
                  </div>
                )}
              </div>

              {/* Unified Card 2: Proteksi & Hak Cipta */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: 'var(--cms-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={13} color="var(--cms-accent)" />
                  <span>Proteksi Akses & Hak Cipta</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* PIN Protection */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 5 }}>
                      Kunci PIN Akses
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="Contoh: 1234"
                        value={currentNote.sharePassword || ''}
                        onChange={e => handleUpdateCurrentNoteMeta({ sharePassword: e.target.value.trim() })}
                        style={{
                          width: '100%',
                          height: 38,
                          padding: '0 12px 0 32px',
                          borderRadius: 10,
                          border: '1.5px solid var(--glass-border)',
                          background: 'var(--cms-card-bg)',
                          color: 'var(--cms-text)',
                          fontSize: 12.5,
                          fontWeight: 750,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <Lock size={13} style={{ position: 'absolute', left: 10, top: 12, color: currentNote.sharePassword ? '#10b981' : 'var(--cms-text-muted)' }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4, display: 'block' }}>
                      {currentNote.sharePassword ? '🔒 Wajib PIN untuk buka' : '🔓 Kosong = Akses publik'}
                    </span>
                  </div>

                  {/* Watermark Toggle */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', cursor: 'pointer', marginBottom: 5 }}>
                      <input
                        type="checkbox"
                        checked={!!currentNote.showWatermark}
                        onChange={e => handleUpdateCurrentNoteMeta({ showWatermark: e.target.checked })}
                        style={{ accentColor: 'var(--cms-accent)', width: 15, height: 15, cursor: 'pointer' }}
                      />
                      <span>Watermark Draf</span>
                    </label>
                    {currentNote.showWatermark ? (
                      <input
                        type="text"
                        placeholder="Teks watermark (cth: DRAFT)"
                        value={currentNote.watermarkText || ''}
                        onChange={e => handleUpdateCurrentNoteMeta({ watermarkText: e.target.value })}
                        style={{
                          width: '100%',
                          height: 38,
                          padding: '0 10px',
                          borderRadius: 10,
                          border: '1.5px solid var(--glass-border)',
                          background: 'var(--cms-card-bg)',
                          color: 'var(--cms-text)',
                          fontSize: 11.5,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    ) : (
                      <div style={{ height: 38, display: 'flex', alignItems: 'center', fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
                        Watermark nonaktif
                      </div>
                    )}
                    <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4, display: 'block' }}>
                      Mencegah konsep dipakai tanpa izin
                    </span>
                  </div>
                </div>
              </div>

              {/* Shareable Link Input & Copy */}
              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tautan Pratinjau Publik Klien
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/preview/note/${currentNote.id}`}
                    style={{
                      flex: 1,
                      height: 40,
                      padding: '0 14px',
                      borderRadius: 12,
                      border: '1.5px solid var(--glass-border)',
                      background: 'var(--cms-bg)',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      fontWeight: 650,
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyClientPreviewLink}
                    style={{
                      height: 40,
                      padding: '0 18px',
                      borderRadius: 12,
                      border: 'none',
                      background: copiedShareLink ? '#10b981' : 'var(--cms-accent, #6366f1)',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 850,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(var(--cms-accent-rgb, 99, 102, 241), 0.25)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    {copiedShareLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedShareLink ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}>
                <button
                  type="button"
                  onClick={handleOpenClientPreview}
                  style={{
                    height: 42,
                    padding: '0 16px',
                    borderRadius: 12,
                    border: '1.5px solid var(--glass-border)',
                    background: 'var(--cms-bg)',
                    color: 'var(--cms-text)',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  <ExternalLink size={14} color="var(--cms-accent)" />
                  <span>Buka Pratinjau Klien</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareToClientWhatsApp}
                  style={{
                    height: 42,
                    padding: '0 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <MessageSquare size={14} />
                  <span>Kirim via WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--glass-border)',
              background: 'var(--cms-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11.5,
              color: 'var(--cms-text-muted)'
            }}>
              <span>💡 Draf dapat diedit kapan saja, link pratinjau tetap sama.</span>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  fontWeight: 750,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .show-on-mobile { display: none; }
        .checklist-interactive-row:hover {
          background: rgba(var(--cms-accent-rgb), 0.08) !important;
        }
        .memo-editor-header-scroll::-webkit-scrollbar,
        .memo-toolbox-scroll::-webkit-scrollbar {
          display: none;
        }
        .memo-explorer-card:hover {
          transform: translateY(-4px);
          border-color: var(--cms-accent) !important;
          box-shadow: 0 14px 34px rgba(0,0,0,0.14);
        }
        .memo-manager-root, .memo-gallery-content, .memo-top-header {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        @media (max-width: 900px) {
          .memo-sidebar.sidebar-open { width: 220px !important; min-width: 220px !important; }
          .memo-sidebar.sidebar-closed { width: 0 !important; min-width: 0 !important; border: none !important; }
        }
        @media (max-width: 768px) {
          .show-on-mobile { display: flex !important; }
          .memo-search-box { display: none !important; }
          .memo-desktop-create-btn { display: none !important; }
          .memo-mobile-create-btn { display: flex !important; }

          .memo-top-header {
            padding: 10px 14px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .memo-top-row-main {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          .memo-top-row-sub {
            display: flex !important;
            align-items: center !important;
            width: 100% !important;
          }
          .memo-view-mode-toggle {
            width: 100% !important;
            display: flex !important;
          }
          .memo-view-mode-toggle button {
            flex: 1 !important;
            justify-content: center !important;
          }

          .memo-gallery-content {
            padding: 16px 16px calc(90px + env(safe-area-inset-bottom, 16px)) 16px !important;
            gap: 16px !important;
            overflow-x: hidden !important;
            max-width: 100% !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .memo-sidebar {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            z-index: 20;
            display: none !important;
          }
          .memo-sidebar.mobile-active { display: flex !important; }
          .memo-sidebar.sidebar-closed { display: none !important; width: 0 !important; min-width: 0 !important; }
          .memo-list-pane.mobile-hidden { display: none !important; }
          .memo-top-header.mobile-hidden { display: none !important; }
          .memo-manager-root {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
          }
          .memo-editor-pane {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            z-index: 10;
            display: none !important;
          }
          .memo-editor-pane.mobile-active { display: flex !important; }

          /* Mobile Redesign for Notes Editor */
          .memo-editor-header-scroll {
            padding: 12px 16px !important;
            gap: 10px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          }
          .memo-canvas-container {
            flex: 1 1 0% !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            box-sizing: border-box !important;
            padding: 16px 14px 20px 14px !important;
            background: transparent !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior-y: contain !important;
          }
          .memo-document-sheet {
            width: 100% !important;
            min-height: min-content !important;
            padding-bottom: calc(240px + env(safe-area-inset-bottom, 30px)) !important;
          }
          .memo-title-input {
            font-size: 24px !important;
            line-height: 1.4 !important;
            margin-bottom: 6px !important;
          }
          .memo-editor-header-scroll button {
            height: 42px !important;
            border-radius: 12px !important;
          }

          /* Mobile Redesign for Explorer Banner */
          .memo-explorer-banner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .memo-explorer-banner-actions {
            width: 100% !important;
          }
          .memo-explorer-banner-actions button {
            flex: 1 1 auto !important;
            min-width: 120px !important;
            justify-content: center !important;
            padding: 12px 16px !important;
            height: 44px !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MemoManager;
