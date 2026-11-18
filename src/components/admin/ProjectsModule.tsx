import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderKanban, Plus, Trash2, CheckCircle2, Clock,
  AlertCircle, ChevronRight, ChevronDown, MoreVertical, Calendar,
  Tag, ListTodo, Search, Loader2, Paperclip, LayoutGrid, X,
  List, PieChart, TrendingUp, History, Upload, File, Download,
  Edit3, Check, Image as ImageIcon, ArrowLeft, LayoutPanelLeft,
  RotateCw, Zap, Workflow, Table, Pin, CheckSquare, Layers, Eye,
  Copy, ExternalLink, Wand2, Sparkles, PenTool, Layout, Code, Briefcase, MessageSquare,
  Palette, Monitor, FileText, Globe, Info, Rocket, Target, Star, Bookmark, Flag, Lightbulb, Box, ShoppingBag, ShieldCheck, Heart, User, Users, Compass, Megaphone, Terminal, Cpu, Camera, Film, Music, Coffee, Flame, Award, Trophy, Smile, UserCheck, Mic,
  Phone, Mail, Settings2, Video, XCircle, Save, Maximize2, Minimize2,
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, ListOrdered, Quote, Minus, CheckCheck, RotateCcw, Table as TableIcon, Link as LinkIcon, Volume2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, ArrowUp, ArrowDown, MoreHorizontal, Receipt,
  MessageCircle, Store, Share2, Archive
} from 'lucide-react';
import { downloadFilesAsZip } from '../../utils/zipExporter';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { useDialog } from './DialogProvider';
import { useContextMenu } from './ContextMenuProvider';
import PremiumPreloader from './PremiumPreloader';
import { addNotification } from '../../utils/notifications';
import { googleSync } from '../../utils/googleSync';
import { generateAiProject, generateAiProjectTasks, callGemini } from '../../utils/ai';
import { OFFLINE_PROJECT_TEMPLATES, buildOfflineProject, OfflineProjectTemplate } from '../../utils/offlineTemplates';
import {
  getCustomProjectTemplates,
  saveCustomProjectTemplate,
  deleteCustomProjectTemplate,
  getCustomProjectCategories,
  addCustomProjectCategory
} from '../../utils/customTemplatesStorage';
import CustomDropdown from './CustomDropdown';
import { generateProjectCalendarEvent, downloadIcsFile, createGoogleCalendarUrl } from '../../utils/calendarUtils';
import DriveAttachmentPicker from '../common/DriveAttachmentPicker';
import ProtectedPreviewImage from '../common/ProtectedPreviewImage';
import MediaGalleryModal from './MediaGalleryModal';
import CalendarGridView from './CalendarGridView';
import ContentPlanModal, { ContentPlanItem } from './ContentPlanModal';
import InfoTooltip from './InfoTooltip';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { haptic } from '../../utils/haptics';
import ProjectRemindersBar from './ProjectRemindersBar';
import ServiceOrderModal from './ServiceOrderModal';
import { normalizeGoogleDocUrl } from '../../utils/serviceOrderSync';
import TimelineGanttView from './projects/TimelineGanttView';
import {
  type NoteBlock,
  parseContentToBlocks,
  serializeBlocksToContent
} from './NoteBlockEditor';
import ProjectProofingModal from './projects/ProjectProofingModal';
import { ImageInputWithActions } from '../common/ImageInputWithActions';

// ---------------------------------------------------------
// CONSTANTS & UTILS
// ---------------------------------------------------------

const NOTE_COLOR_THEMES: Record<string, { dot: string; bg: string; border: string; text: string; lightBg: string }> = {
  default: { dot: 'var(--cms-accent)', bg: 'rgba(var(--cms-accent-rgb), 0.12)', border: 'rgba(var(--cms-accent-rgb), 0.35)', text: 'var(--cms-accent)', lightBg: 'rgba(var(--cms-accent-rgb), 0.05)' },
  purple: { dot: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.35)', text: '#a855f7', lightBg: 'rgba(168, 85, 247, 0.05)' },
  blue: { dot: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', text: '#3b82f6', lightBg: 'rgba(59, 130, 246, 0.05)' },
  emerald: { dot: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', text: '#10b981', lightBg: 'rgba(16, 185, 129, 0.05)' },
  amber: { dot: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', text: '#f59e0b', lightBg: 'rgba(245, 158, 11, 0.08)' },
  rose: { dot: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.35)', text: '#f43f5e', lightBg: 'rgba(244, 63, 94, 0.05)' },
};
// NoteBlock, parseContentToBlocks, and serializeBlocksToContent are imported from ./NoteBlockEditor


// ── TRUE WYSIWYG AUTO-GROW TEXTAREA (100% TRANSPARENT, ZERO GREY BOXES, FLUID MULTILINE) ──
const AutoGrowTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onCaretChange?: (pos: number) => void;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}> = ({ value, onChange, onFocus, onKeyDown, onCaretChange, inputRef, placeholder, style, className }) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    if (localRef.current) {
      localRef.current.style.height = 'auto';
      localRef.current.style.height = `${Math.max(28, localRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    resize();
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
      }}
      onSelect={updateCaret}
      onClick={updateCaret}
      onKeyUp={updateCaret}
      onKeyDown={onKeyDown}
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

// ── INLINE FORMATTED TEXT RENDERER (BOLD, ITALIC, STRIKE, CODE, LINKS, BADGES) ──
function renderInlineFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  // Check for specialized badges
  if (text.includes('**[SCENE]**') || text.includes('[SCENE]')) {
    const clean = text.replace(/\*\*\[SCENE\]\*\*|\[SCENE\]/g, '').trim();
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: 'rgba(6, 182, 212, 0.16)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Film size={12} /> SCENE
        </span>
        <span>{renderInlineFormattedText(clean)}</span>
      </span>
    );
  }
  if (text.includes('**[HOOK]**') || text.includes('[HOOK]')) {
    const clean = text.replace(/\*\*\[HOOK\]\*\*|\[HOOK\]/g, '').trim();
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.16)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Target size={12} /> HOOK
        </span>
        <span>{renderInlineFormattedText(clean)}</span>
      </span>
    );
  }
  if (text.includes('**[CTA]**') || text.includes('[CTA]')) {
    const clean = text.replace(/\*\*\[CTA\]\*\*|\[CTA\]/g, '').trim();
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.16)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Megaphone size={12} /> CTA
        </span>
        <span>{renderInlineFormattedText(clean)}</span>
      </span>
    );
  }
  if (text.includes('**[VO]**') || text.includes('[VO]')) {
    const clean = text.replace(/\*\*\[VO\]\*\*|\[VO\]/g, '').trim();
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: 'rgba(139, 92, 246, 0.16)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Mic size={12} /> VO
        </span>
        <span>{renderInlineFormattedText(clean)}</span>
      </span>
    );
  }

  // Regex split for bold, italic, code, link, strikethrough
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|~~.*?~~|`.*?`|\[.*?\]\(.*?\))/g);
  return tokens.map((tok, i) => {
    if (!tok) return null;
    if (tok.startsWith('**') && tok.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 850, color: 'var(--cms-text)' }}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith('*') && tok.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic' }}>{tok.slice(1, -1)}</em>;
    }
    if (tok.startsWith('~~') && tok.endsWith('~~')) {
      return <span key={i} style={{ textDecoration: 'line-through', opacity: 0.7 }}>{tok.slice(2, -2)}</span>;
    }
    if (tok.startsWith('`') && tok.endsWith('`')) {
      return (
        <code key={i} style={{ fontSize: '0.9em', padding: '2px 5px', borderRadius: 5, background: 'rgba(var(--cms-accent-rgb), 0.1)', color: 'var(--cms-accent)', fontFamily: 'monospace', border: '1px solid var(--glass-border)' }}>
          {tok.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = tok.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" style={{ color: 'var(--cms-accent)', textDecoration: 'underline', fontWeight: 700 }} onClick={e => e.stopPropagation()}>
          {linkMatch[1]}
        </a>
      );
    }
    return tok;
  });
}

// ── FULL INTERACTIVE MARKDOWN DOCUMENT PARSER & RENDERER ──
const InteractiveMarkdownRenderer: React.FC<{
  content: string;
  onToggleChecklist: (lineIdx: number, newChecked: boolean) => void;
  onOpenEdit: () => void;
}> = ({ content, onToggleChecklist, onOpenEdit }) => {
  const lines = content.split('\n');

  if (!content || !content.trim()) {
    return (
      <div
        onClick={onOpenEdit}
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--cms-text-muted)',
          cursor: 'pointer',
          borderRadius: 16,
          border: '1.5px dashed var(--glass-border)',
          background: 'rgba(0,0,0,0.01)',
          margin: '20px 0'
        }}
      >
        <Edit3 size={24} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
        <div style={{ fontSize: 14, fontWeight: 750 }}>Catatan masih kosong</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Klik di sini untuk mulai mengetik naskah atau to-do</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 300, cursor: 'default' }}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 1. Checklist: - [ ] or - [x]
        const checkMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
        if (checkMatch) {
          const isChecked = checkMatch[2].toLowerCase() === 'x';
          const label = checkMatch[3];
          return (
            <div
              key={lineIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '4px 8px',
                borderRadius: 10,
                background: isChecked ? 'rgba(var(--cms-accent-rgb), 0.04)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleChecklist(lineIdx, !isChecked);
                }}
                style={{
                  width: 22, height: 22, minWidth: 22, minHeight: 22,
                  borderRadius: 6,
                  border: isChecked ? 'none' : '1.8px solid var(--cms-accent)',
                  background: isChecked ? 'var(--cms-accent)' : 'transparent',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, marginTop: 2,
                  boxShadow: isChecked ? '0 2px 8px rgba(var(--cms-accent-rgb), 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title={isChecked ? "Tandai belum selesai" : "Tandai selesai"}
              >
                {isChecked && <Check size={14} strokeWidth={3} />}
              </button>
              <div style={{
                fontSize: 14.5,
                color: isChecked ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                textDecoration: isChecked ? 'line-through' : 'none',
                lineHeight: 1.6,
                flex: 1,
                wordBreak: 'break-word'
              }}>
                {renderInlineFormattedText(label)}
              </div>
            </div>
          );
        }

        // 2. Heading 1: # Title
        if (line.startsWith('# ')) {
          return (
            <h1 key={lineIdx} style={{ fontSize: 22, fontWeight: 950, color: 'var(--cms-text)', margin: '14px 0 6px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {renderInlineFormattedText(line.slice(2))}
            </h1>
          );
        }

        // 3. Heading 2: ## Subtitle
        if (line.startsWith('## ')) {
          return (
            <h2 key={lineIdx} style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text)', margin: '12px 0 4px', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '-0.01em' }}>
              <span style={{ width: 4, height: 16, borderRadius: 2, background: 'var(--cms-accent)' }} />
              {renderInlineFormattedText(line.slice(3))}
            </h2>
          );
        }

        // 4. Heading 3: ### Section
        if (line.startsWith('### ')) {
          return (
            <h3 key={lineIdx} style={{ fontSize: 15.5, fontWeight: 850, color: 'var(--cms-text)', margin: '10px 0 3px' }}>
              {renderInlineFormattedText(line.slice(4))}
            </h3>
          );
        }

        // 5. Callout: > 💡 or Quote: >
        if (line.startsWith('> ')) {
          const quoteText = line.slice(2);
          const isCallout = quoteText.startsWith('💡');
          return (
            <div
              key={lineIdx}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                background: isCallout ? 'rgba(245, 158, 11, 0.08)' : 'rgba(var(--cms-accent-rgb), 0.06)',
                borderLeft: `4px solid ${isCallout ? '#f59e0b' : 'var(--cms-accent)'}`,
                borderTop: '1px solid var(--glass-border)',
                borderRight: '1px solid var(--glass-border)',
                borderBottom: '1px solid var(--glass-border)',
                margin: '8px 0',
                fontSize: 13.5,
                color: 'var(--cms-text)',
                lineHeight: 1.6
              }}
            >
              {renderInlineFormattedText(quoteText)}
            </div>
          );
        }

        // 6. Bullet: - or *
        if (line.match(/^(\s*)[-*]\s+(.*)$/)) {
          const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
          return (
            <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 6px', fontSize: 14.5, lineHeight: 1.6 }}>
              <span style={{ color: 'var(--cms-accent)', fontWeight: 900, marginTop: -2 }}>•</span>
              <span style={{ flex: 1 }}>{renderInlineFormattedText(bulletMatch ? bulletMatch[2] : line)}</span>
            </div>
          );
        }

        // 7. Divider: ---
        if (trimmed === '---' || trimmed === '***') {
          return (
            <hr key={lineIdx} style={{ border: 'none', height: 1, background: 'var(--glass-border)', margin: '14px 0' }} />
          );
        }

        // 8. Empty line
        if (!trimmed) {
          return <div key={lineIdx} style={{ height: 10 }} />;
        }

        // 9. Standard Paragraph with full formatting
        return (
          <p key={lineIdx} style={{ fontSize: 14.5, color: 'var(--cms-text)', lineHeight: 1.7, margin: '2px 0' }}>
            {renderInlineFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
};

// ── TRUE INLINE LIVE WYSIWYG DOCUMENT EDITOR (NOTION / APPLE NOTES STYLE) ──
const InlineLiveDocumentEditor: React.FC<{
  text: string;
  onChange: (newText: string) => void;
  placeholder?: string;
}> = ({ text, onChange, placeholder }) => {
  const lines = (text || '').split('\n');
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const handleUpdateLine = (lineIdx: number, newLineText: string) => {
    const nextLines = [...lines];
    nextLines[lineIdx] = newLineText;
    onChange(nextLines.join('\n'));
  };

  const handleToggleTodo = (lineIdx: number) => {
    const nextLines = [...lines];
    const match = nextLines[lineIdx].match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
    if (match) {
      const isChecked = match[2].toLowerCase() === 'x';
      nextLines[lineIdx] = `${match[1]}- [${isChecked ? ' ' : 'x'}] ${match[3]}`;
      onChange(nextLines.join('\n'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, lineIdx: number, currentType: string, currentVal: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const nextLines = [...lines];
      if (currentType === 'todo') {
        if (!currentVal.trim()) {
          // Empty todo -> convert to normal paragraph
          nextLines[lineIdx] = '';
          onChange(nextLines.join('\n'));
          setTimeout(() => inputRefs.current[lineIdx]?.focus(), 10);
          return;
        }
        nextLines.splice(lineIdx + 1, 0, '- [ ] ');
      } else if (currentType === 'bullet') {
        if (!currentVal.trim()) {
          nextLines[lineIdx] = '';
          onChange(nextLines.join('\n'));
          setTimeout(() => inputRefs.current[lineIdx]?.focus(), 10);
          return;
        }
        nextLines.splice(lineIdx + 1, 0, '- ');
      } else {
        nextLines.splice(lineIdx + 1, 0, '');
      }
      onChange(nextLines.join('\n'));
      setTimeout(() => {
        const nextInput = inputRefs.current[lineIdx + 1];
        if (nextInput) nextInput.focus();
      }, 10);
    } else if (e.key === 'Backspace' && !currentVal) {
      if (currentType !== 'p') {
        e.preventDefault();
        const nextLines = [...lines];
        nextLines[lineIdx] = '';
        onChange(nextLines.join('\n'));
      } else if (lines.length > 1 && lineIdx > 0) {
        e.preventDefault();
        const nextLines = [...lines];
        nextLines.splice(lineIdx, 1);
        onChange(nextLines.join('\n'));
        setTimeout(() => {
          const prevInput = inputRefs.current[lineIdx - 1];
          if (prevInput) prevInput.focus();
        }, 10);
      }
    } else if (e.key === 'ArrowUp' && lineIdx > 0) {
      const prev = inputRefs.current[lineIdx - 1];
      if (prev) prev.focus();
    } else if (e.key === 'ArrowDown' && lineIdx < lines.length - 1) {
      const next = inputRefs.current[lineIdx + 1];
      if (next) next.focus();
    }
  };

  if (lines.length === 0 || (lines.length === 1 && !lines[0])) {
    return (
      <div style={{ width: '100%', minHeight: 280 }}>
        <AutoGrowTextarea
          value={text}
          onChange={onChange}
          placeholder={placeholder || "Mulai menulis catatan proyek, brief, naskah, ide, atau to-do di sini..."}
          style={{ fontSize: 14.5, color: 'var(--cms-text)', lineHeight: 1.7, minHeight: 280 }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minHeight: 280 }}>
      {lines.map((line, lineIdx) => {
        // 1. Checklist Line (DIRECT INLINE INTERACTIVE CHECKBOX)
        const todoMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
        if (todoMatch) {
          const isChecked = todoMatch[2].toLowerCase() === 'x';
          const label = todoMatch[3];
          return (
            <div
              key={lineIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
                padding: '2px 0',
                borderRadius: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <button
                type="button"
                className="memo-todo-checkbox"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTodo(lineIdx);
                }}
                style={{
                  width: 18, height: 18, minWidth: 18, minHeight: 18, maxWidth: 18, maxHeight: 18, aspectRatio: '1 / 1',
                  borderRadius: 5,
                  border: isChecked ? 'none' : '1.8px solid var(--cms-accent)',
                  background: isChecked ? 'var(--cms-accent)' : 'transparent',
                  color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, marginTop: 4, flexShrink: 0, boxSizing: 'border-box',
                  boxShadow: isChecked ? '0 2px 6px rgba(var(--cms-accent-rgb), 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title={isChecked ? "Tandai belum selesai" : "Tandai selesai"}
              >
                {isChecked && <Check size={12} strokeWidth={3} />}
              </button>
              <AutoGrowTextarea
                inputRef={el => { inputRefs.current[lineIdx] = el; }}
                value={label}
                onChange={val => handleUpdateLine(lineIdx, `${todoMatch[1]}- [${todoMatch[2]}] ${val}`)}
                onKeyDown={e => handleKeyDown(e, lineIdx, 'todo', label)}
                placeholder="Tulis tugas / to-do..."
                style={{
                  fontSize: 14.5,
                  color: isChecked ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                  textDecoration: isChecked ? 'line-through' : 'none',
                  lineHeight: 1.6,
                  padding: '2px 0'
                }}
              />
            </div>
          );
        }

        // 2. Heading 1 (# )
        if (line.startsWith('# ')) {
          const h1Text = line.slice(2);
          return (
            <AutoGrowTextarea
              key={lineIdx}
              inputRef={el => { inputRefs.current[lineIdx] = el; }}
              value={h1Text}
              onChange={val => handleUpdateLine(lineIdx, `# ${val}`)}
              onKeyDown={e => handleKeyDown(e, lineIdx, 'h1', h1Text)}
              placeholder="Heading 1..."
              style={{ fontSize: 22, fontWeight: 950, color: 'var(--cms-text)', lineHeight: 1.3, margin: '8px 0 2px' }}
            />
          );
        }

        // 3. Heading 2 (## )
        if (line.startsWith('## ')) {
          const h2Text = line.slice(3);
          return (
            <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '6px 0 2px' }}>
              <span style={{ width: 4, height: 20, borderRadius: 2, background: 'var(--cms-accent)', marginTop: 5, flexShrink: 0 }} />
              <AutoGrowTextarea
                inputRef={el => { inputRefs.current[lineIdx] = el; }}
                value={h2Text}
                onChange={val => handleUpdateLine(lineIdx, `## ${val}`)}
                onKeyDown={e => handleKeyDown(e, lineIdx, 'h2', h2Text)}
                placeholder="Heading 2..."
                style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text)', lineHeight: 1.4 }}
              />
            </div>
          );
        }

        // 4. Heading 3 (### )
        if (line.startsWith('### ')) {
          const h3Text = line.slice(4);
          return (
            <AutoGrowTextarea
              key={lineIdx}
              inputRef={el => { inputRefs.current[lineIdx] = el; }}
              value={h3Text}
              onChange={val => handleUpdateLine(lineIdx, `### ${val}`)}
              onKeyDown={e => handleKeyDown(e, lineIdx, 'h3', h3Text)}
              placeholder="Heading 3..."
              style={{ fontSize: 15.5, fontWeight: 850, color: 'var(--cms-text)', lineHeight: 1.4, margin: '4px 0 2px' }}
            />
          );
        }

        // 5. Bullet List (- or *)
        const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
        if (bulletMatch) {
          const bulletText = bulletMatch[2];
          return (
            <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '2px 0' }}>
              <span style={{ color: 'var(--cms-accent)', fontWeight: 900, fontSize: 18, lineHeight: 1.5, marginTop: 1, flexShrink: 0 }}>•</span>
              <AutoGrowTextarea
                inputRef={el => { inputRefs.current[lineIdx] = el; }}
                value={bulletText}
                onChange={val => handleUpdateLine(lineIdx, `${bulletMatch[1]}- ${val}`)}
                onKeyDown={e => handleKeyDown(e, lineIdx, 'bullet', bulletText)}
                placeholder="Poin bullet..."
                style={{ fontSize: 14.5, color: 'var(--cms-text)', lineHeight: 1.6 }}
              />
            </div>
          );
        }

        // 6. Quote / Callout (> )
        if (line.startsWith('> ')) {
          const quoteText = line.slice(2);
          const isCallout = quoteText.startsWith('💡');
          return (
            <div
              key={lineIdx}
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                background: isCallout ? 'rgba(245, 158, 11, 0.08)' : 'rgba(var(--cms-accent-rgb), 0.06)',
                borderLeft: `4px solid ${isCallout ? '#f59e0b' : 'var(--cms-accent)'}`,
                borderTop: '1px solid var(--glass-border)',
                borderRight: '1px solid var(--glass-border)',
                borderBottom: '1px solid var(--glass-border)',
                margin: '4px 0'
              }}
            >
              <AutoGrowTextarea
                inputRef={el => { inputRefs.current[lineIdx] = el; }}
                value={quoteText}
                onChange={val => handleUpdateLine(lineIdx, `> ${val}`)}
                onKeyDown={e => handleKeyDown(e, lineIdx, 'quote', quoteText)}
                placeholder="Kutipan atau catatan..."
                style={{ fontSize: 13.5, color: 'var(--cms-text)', lineHeight: 1.6 }}
              />
            </div>
          );
        }

        // 7. Divider (---)
        if (line.trim() === '---' || line.trim() === '***') {
          return (
            <div key={lineIdx} style={{ padding: '6px 0', cursor: 'pointer' }} onClick={() => handleUpdateLine(lineIdx, '')}>
              <hr style={{ border: 'none', height: 1, background: 'var(--glass-border)', margin: '8px 0' }} />
            </div>
          );
        }

        // 8. Normal Paragraph Line
        return (
          <div key={lineIdx} style={{ width: '100%', minHeight: 28 }}>
            <AutoGrowTextarea
              inputRef={el => { inputRefs.current[lineIdx] = el; }}
              value={line}
              onChange={val => handleUpdateLine(lineIdx, val)}
              onKeyDown={e => handleKeyDown(e, lineIdx, 'p', line)}
              placeholder={lines.length === 1 && !line ? (placeholder || "Mulai menulis catatan proyek, brief, naskah, ide, atau to-do di sini...") : ""}
              style={{
                fontSize: 14.5,
                color: 'var(--cms-text)',
                lineHeight: 1.7,
                minHeight: 28
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const ProjectRichBlockNotepad: React.FC<{
  content: string;
  onChange: (newContent: string) => void;
  activeBlockIndex: number;
  setActiveBlockIndex: (idx: number) => void;
  onCaretChange?: (blockIdx: number, caretPos: number) => void;
  onOpenLightbox?: (img: any) => void;
}> = ({ content, onChange, activeBlockIndex, setActiveBlockIndex, onCaretChange, onOpenLightbox }) => {
  const [blocks, setBlocks] = useState<NoteBlock[]>(() => parseContentToBlocks(content));
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    setBlocks(parseContentToBlocks(content));
  }, [content]);

  const handleUpdateBlock = (idx: number, updates: Partial<NoteBlock>) => {
    const updated = blocks.map((b, i) => i === idx ? { ...b, ...updates } : b);
    isInternalChangeRef.current = true;
    setBlocks(updated);
    onChange(serializeBlocksToContent(updated));
  };

  const handleToggleChecklist = (targetLineIdx: number, newChecked: boolean) => {
    const lines = content.split('\n');
    if (targetLineIdx < 0 || targetLineIdx >= lines.length) return;
    const oldLine = lines[targetLineIdx];
    const updatedLine = oldLine.replace(/^(\s*-\s*\[)[ xX](\]\s*.*)$/, `$1${newChecked ? 'x' : ' '}$2`);
    lines[targetLineIdx] = updatedLine;
    const nextContent = lines.join('\n');
    onChange(nextContent);
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
    } else if (direction === 'down' && idx < blocks.length - 1) {
      const updated = [...blocks];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      isInternalChangeRef.current = true;
      setBlocks(updated);
      onChange(serializeBlocksToContent(updated));
    }
  };

  const handleDeleteBlock = (idx: number) => {
    const updated = blocks.filter((_, i) => i !== idx);
    isInternalChangeRef.current = true;
    const finalBlocks = updated.length > 0 ? updated : [{ id: `blk_${Date.now()}`, type: 'p' as const, text: '' }];
    setBlocks(finalBlocks);
    onChange(serializeBlocksToContent(finalBlocks));
  };

  return (
    <div style={{ display: 'block', width: '100%', minHeight: '65vh', background: 'transparent', cursor: 'text', paddingBottom: 80 }}>
      {blocks.map((block, idx) => {
        // ── 1. MS Word / Google Docs Style Block Image ──
        if (block.type === 'image') {
          const isSelected = activeImageId === block.id;
          const isSmall = block.size === 'small' || !block.size;
          const isMed = block.size === 'medium';
          const isFull = block.size === 'full';
          const wrap = block.wrap || 'inline';

          let widthStyle = '260px';
          if (isMed) widthStyle = '460px';
          else if (isFull) widthStyle = '100%';

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
            containerStyle = { float: 'left', width: widthStyle, margin: '8px 20px 14px 0', clear: 'left', position: 'relative' };
          } else if (wrap === 'right') {
            containerStyle = { float: 'right', width: widthStyle, margin: '8px 0 14px 20px', clear: 'right', position: 'relative' };
          }

          return (
            <div
              key={block.id}
              className={`project-doc-image-row is-wrap-${wrap}`}
              style={containerStyle}
            >
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
                  }
                }}
                className={`project-doc-image-card is-${block.size || 'small'} ${isSelected ? 'is-selected' : ''}`}
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
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageId(prev => prev === block.id ? null : block.id);
                    setActiveBlockIndex(idx);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onOpenLightbox?.({ url: block.url || '', title: block.text, size: block.size || 'small', blockIdx: idx });
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
                      {/* Wrap Controls */}
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { wrap: 'inline' })}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: wrap === 'inline' ? 'var(--cms-accent)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Inline"
                      >
                        <AlignJustify size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { wrap: 'left' })}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: wrap === 'left' ? 'var(--cms-accent)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Wrap Kiri"
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { wrap: 'right' })}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: wrap === 'right' ? 'var(--cms-accent)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Wrap Kanan"
                      >
                        <AlignRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { wrap: 'center' })}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: wrap === 'center' ? 'var(--cms-accent)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Rata Tengah"
                      >
                        <AlignCenter size={14} />
                      </button>

                      {/* Size Controls */}
                      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 4, display: 'flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSize = isSmall ? 'medium' : isMed ? 'full' : 'small';
                            handleUpdateBlock(idx, { size: nextSize });
                          }}
                          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={`Ukuran: ${isSmall ? '25%' : isMed ? '50%' : '100%'}`}
                        >
                          <Maximize2 size={13} />
                        </button>
                      </div>

                      {/* Move Controls */}
                      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveBlock(idx, 'up')}
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', opacity: idx === 0 ? 0.35 : 1, color: '#fff', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Geser Naik"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === blocks.length - 1}
                          onClick={() => handleMoveBlock(idx, 'down')}
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', opacity: idx === blocks.length - 1 ? 0.35 : 1, color: '#fff', cursor: idx === blocks.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Geser Turun"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Lightbox & Delete */}
                      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button
                          type="button"
                          onClick={() => onOpenLightbox?.({ url: block.url || '', title: block.text, size: block.size || 'small', blockIdx: idx })}
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Perbesar"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(idx)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Hapus Gambar"
                        >
                          <Trash2 size={13.5} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Caption Footer */}
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
                    placeholder="Keterangan / sumber gambar..."
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

        // ── 2. TRUE WYSIWYG INLINE LIVE DOCUMENT CANVAS (NOTION / APPLE NOTES STYLE) ──
        return (
          <div key={block.id} onClick={() => setActiveBlockIndex(idx)} style={{ width: '100%', minHeight: 28, background: 'transparent' }}>
            <InlineLiveDocumentEditor
              text={block.text}
              onChange={t => handleUpdateBlock(idx, { text: t })}
              placeholder={idx === 0 && blocks.length === 1 && !block.text ? "Mulai menulis catatan proyek, brief, naskah, ide, atau to-do di sini..." : ""}
            />
          </div>
        );
      })}
    </div>
  );
};

const STATUSES = [
  { id: 'todo', label: 'To Do', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
  { id: 'progress', label: 'In Progress', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  { id: 'review', label: 'Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 'hold', label: 'On Hold', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
  { id: 'done', label: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  { id: 'medium', label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { id: 'high', label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
];

const CONTENT_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#e1306c' },
  { id: 'tiktok', label: 'TikTok', color: '#00f2fe' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000' },
  { id: 'blog', label: 'Blog / Web', color: '#3b82f6' },
  { id: 'twitter', label: 'X / Twitter', color: '#1da1f2' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2' }
];

const CONTENT_FORMATS = [
  { id: 'reels', label: 'Reels / Shorts', color: '#ec4899' },
  { id: 'carousel', label: 'Carousel (Slide)', color: '#8b5cf6' },
  { id: 'single_post', label: 'Single Post', color: '#3b82f6' },
  { id: 'article', label: 'Artikel Blog', color: '#10b981' },
  { id: 'story', label: 'Story', color: '#f59e0b' }
];

const CONTENT_STATUSES = [
  { id: 'todo', label: 'Ide & Brainstorm', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'draft', label: 'Naskah & Draft', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  { id: 'progress', label: 'Desain Visual', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  { id: 'review', label: 'Review & QC', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { id: 'done', label: 'Terjadwal & Terbit', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
];

// Helper untuk mencegah crash saat render data dari array yang korup
const getSafeArray = (arr) => (Array.isArray(arr) ? arr : []);
const getSafeString = (str) => (typeof str === 'string' ? str : '');
const getSafeProgress = (num) => (typeof num === 'number' && !isNaN(num) ? num : 0);

const ListViewSortDropdown = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = [
    { id: 'title', label: 'Nama Proyek' },
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Prioritas' },
    { id: 'progress', label: 'Kemajuan' },
    { id: 'deadline', label: 'Tenggat Waktu' }
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find(o => o.id === value) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--cms-input-bg)',
          color: 'var(--cms-text)',
          border: '1.5px solid var(--glass-border)',
          borderRadius: 100,
          padding: '6px 14px',
          fontSize: 11.5,
          fontWeight: 900,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'var(--cms-shadow-sm)'
        }}
      >
        <span>{selected.label}</span>
        <ChevronDown size={13} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 9999,
            minWidth: 150,
            background: 'var(--cms-card-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px solid var(--glass-border)',
            borderRadius: 16,
            padding: 6,
            boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {options.map(opt => {
            const isSel = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                style={{
                  textAlign: 'left',
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: isSel ? 'var(--cms-accent-soft)' : 'transparent',
                  color: isSel ? 'var(--cms-accent)' : 'var(--cms-text)',
                  fontSize: 11.5,
                  fontWeight: isSel ? 900 : 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (!isSel) e.currentTarget.style.background = 'var(--cms-input-bg)';
                }}
                onMouseLeave={e => {
                  if (!isSel) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSel && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Returns deadline label with color & urgency flag
const getDeadlineInfo = (deadline, status) => {
  if (!deadline || status === 'done') return null;
  const diff = new Date(deadline) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Overdue!', color: '#ef4444', urgent: true };
  if (days === 0) return { label: 'Due today', color: '#ef4444', urgent: true };
  if (days <= 3) return { label: `${days}d left`, color: '#ef4444', urgent: true };
  if (days <= 7) return { label: `${days}d left`, color: '#f59e0b', urgent: false };
  return { label: `${days}d`, color: '#10b981', urgent: false };
};

const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: '140px' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select ${selectedOption.label}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
          background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
          color: 'var(--cms-text)', width: '100%', outline: 'none',
          fontSize: 13.5, fontWeight: 750, padding: '10px 14px', borderRadius: 12, transition: '0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedOption.color }} aria-hidden="true" />
        {selectedOption.label}
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: '110%', left: 0, width: '100%', zIndex: 9999,
            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
            borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 8,
            backdropFilter: 'blur(20px)'
          }}>
          {options.map(opt => (
            <div
              key={opt.id}
              role="option"
              aria-selected={value === opt.id}
              tabIndex={0}
              onClick={() => { onChange(opt.id); setIsOpen(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onChange(opt.id); setIsOpen(false); e.preventDefault(); } }}
              style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                background: value === opt.id ? 'rgba(var(--cms-accent-rgb), 0.1)' : 'transparent',
                color: value === opt.id ? 'var(--cms-accent)' : 'var(--cms-text)',
                transition: '0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = value === opt.id ? 'rgba(var(--cms-accent-rgb), 0.1)' : 'transparent'}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} aria-hidden="true" />
              {opt.label}
              {value === opt.id && <Check size={16} style={{ marginLeft: 'auto' }} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── SVG Circular Progress Ring ──
const ProgressRing = ({ progress, size = 36, color }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, getSafeProgress(progress)));
  const offset = circ - (pct / 100) * circ;
  const ringColor = color || (pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444');
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cms-input-bg)" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={3}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size <= 32 ? 7 : 9, fontWeight: 900, color: ringColor, letterSpacing: '-0.03em' }}>
        {pct}
      </div>
    </div>
  );
};

const TagSelect = ({ project, projects, updateProject }) => {
  const { showConfirm } = useDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allExistingTags = useMemo(() => {
    const tags = new Set();
    getSafeArray(projects).forEach(p => {
      getSafeArray(p.tags).forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [projects]);

  const toggleTag = (tag) => {
    const currentTags = getSafeArray(project.tags);
    const updated = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateProject(project.id, { tags: updated });
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (newTag.trim()) {
      toggleTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Add Tag"
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px dashed var(--glass-border)', background: 'transparent', color: 'var(--cms-text-muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: '0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.color = 'var(--cms-accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--cms-text-muted)'; }}
      >
        + Add Tag
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: '120%', left: 0, width: '280px', zIndex: 9999,
            background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
            borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: 12,
            backdropFilter: 'blur(30px)'
          }}>
          <form onSubmit={handleAddCustom} style={{ marginBottom: 16 }}>
            <input
              autoFocus
              placeholder="New tag name..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: 10, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, outline: 'none' }}
            />
          </form>

          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px', marginBottom: 4 }}>Suggestions</div>
            {allExistingTags.length === 0 && <div style={{ padding: '8px', fontSize: 12, color: 'var(--cms-text-muted)', textAlign: 'center' }}>No existing tags yet.</div>}
            {allExistingTags.map(tag => (
              <div
                key={tag}
                role="option"
                aria-selected={getSafeArray(project.tags).includes(tag)}
                tabIndex={0}
                onClick={() => toggleTag(tag)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { toggleTag(tag); e.preventDefault(); } }}
                className="tag-suggestion-item"
                style={{
                  padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: getSafeArray(project.tags).includes(tag) ? 'rgba(var(--cms-accent-rgb), 0.1)' : 'transparent',
                  color: getSafeArray(project.tags).includes(tag) ? 'var(--cms-accent)' : 'var(--cms-text)',
                  transition: '0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.querySelector('.tag-delete-btn').style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.querySelector('.tag-delete-btn').style.opacity = '0'}
              >
                <Tag size={14} />
                <span style={{ flex: 1 }}>{tag}</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                  {getSafeArray(project.tags).includes(tag) && <Check size={14} style={{ color: 'var(--cms-accent)' }} />}

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmed = await showConfirm(`Hapus tag "${tag}" dari SEMUA proyek?`);
                      if (confirmed) {
                        projects.forEach(p => {
                          if (getSafeArray(p.tags).includes(tag)) {
                            updateProject(p.id, { tags: getSafeArray(p.tags).filter(t => t !== tag) });
                          }
                        });
                      }
                    }}
                    style={{
                      padding: 4, borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0,
                      transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    className="tag-delete-btn"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GlassDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateObj = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(dateObj);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSelect = (day) => {
    const d = new Date(year, month, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const prevMonth = (e) => { e.stopPropagation(); setCurrentMonth(new Date(year, month - 1, 1)); };
  const nextMonth = (e) => { e.stopPropagation(); setCurrentMonth(new Date(year, month + 1, 1)); };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const displayValue = value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set Deadline';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left',
          background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
          color: value ? 'var(--cms-text)' : 'var(--cms-text-muted)', width: '100%', outline: 'none',
          fontSize: 13.5, fontWeight: 750, padding: '10px 16px', borderRadius: 100, transition: '0.2s',
          height: 42, boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={15} color="var(--cms-accent)" /> {displayValue}
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '120%', left: 0, width: '280px', zIndex: 9999,
          background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
          borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: 16,
          backdropFilter: 'blur(30px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ padding: 4, background: 'transparent', border: 'none', color: 'var(--cms-text)', cursor: 'pointer', borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>{monthNames[month]} {year}</div>
            <button onClick={nextMonth} style={{ padding: 4, background: 'transparent', border: 'none', color: 'var(--cms-text)', cursor: 'pointer', borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, textAlign: 'center' }}>
            {dayNames.map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', opacity: 0.6 }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {days.map((day, i) => {
              const isSelected = value && day && new Date(value).getDate() === day && new Date(value).getMonth() === month && new Date(value).getFullYear() === year;
              const isToday = !value && day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              if (!day) return <div key={i} />;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(day)}
                  style={{
                    height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'var(--cms-accent)' : isToday ? 'var(--cms-accent-soft)' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? 'var(--cms-accent)' : 'var(--cms-text)',
                    transition: '0.2s'
                  }}
                  onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--cms-switcher-bg)')}
                  onMouseLeave={e => !isSelected && (e.currentTarget.style.background = isToday ? 'var(--cms-accent-soft)' : 'transparent')}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const GlassTimePicker = ({ value, onChange }: { value?: string; onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeStr = value || '19:00';
  const [hourPart, minutePart] = timeStr.split(':');
  const currentHour = parseInt(hourPart || '19', 10);
  const currentMinute = parseInt(minutePart || '00', 10);

  const isPM = currentHour >= 12;
  const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
  const displayStr = `${String(displayHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;

  const setHour = (h: number) => {
    const newH = isPM ? (h % 12) + 12 : (h % 12);
    onChange(`${String(newH).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
  };

  const setMinute = (m: number) => {
    onChange(`${String(currentHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const setAmpm = (pm: boolean) => {
    let newH = currentHour % 12;
    if (pm) newH += 12;
    onChange(`${String(newH).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
  };

  const hours12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesStep = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left',
          background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
          color: 'var(--cms-text)', width: '100%', outline: 'none',
          fontSize: 13, fontWeight: 750, padding: '10px 14px', borderRadius: 100, transition: '0.2s',
          height: 42, boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Clock size={14} color="var(--cms-accent)" />
          <span>{displayStr}</span>
        </span>
        <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s', opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '220px', zIndex: 99999,
          background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
          borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: 12,
          backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          animation: 'pmModalIn 0.2s ease'
        }}>
          {/* AM / PM Toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--cms-input-bg)', padding: 3, borderRadius: 100, marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setAmpm(false)}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 100, border: 'none',
                background: !isPM ? 'var(--cms-accent)' : 'transparent',
                color: !isPM ? '#fff' : 'var(--cms-text-muted)',
                fontSize: 11, fontWeight: 900, cursor: 'pointer'
              }}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setAmpm(true)}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 100, border: 'none',
                background: isPM ? 'var(--cms-accent)' : 'transparent',
                color: isPM ? '#fff' : 'var(--cms-text-muted)',
                fontSize: 11, fontWeight: 900, cursor: 'pointer'
              }}
            >
              PM
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {/* Hour Column */}
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>Jam</div>
              <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, scrollbarWidth: 'none' }}>
                {hours12.map(h => {
                  const isSelected = displayHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHour(h)}
                      style={{
                        padding: '5px 0', borderRadius: 8, border: 'none',
                        background: isSelected ? 'var(--cms-accent)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--cms-text)',
                        fontSize: 12, fontWeight: isSelected ? 900 : 600,
                        cursor: 'pointer', textAlign: 'center', transition: '0.15s'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--cms-input-bg)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minute Column */}
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>Menit</div>
              <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, scrollbarWidth: 'none' }}>
                {minutesStep.map(m => {
                  const isSelected = Math.abs(currentMinute - m) < 3 || currentMinute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinute(m)}
                      style={{
                        padding: '5px 0', borderRadius: 8, border: 'none',
                        background: isSelected ? 'var(--cms-accent)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--cms-text)',
                        fontSize: 12, fontWeight: isSelected ? 900 : 600,
                        cursor: 'pointer', textAlign: 'center', transition: '0.15s'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--cms-input-bg)'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none',
                background: 'var(--cms-accent)', color: '#fff', fontSize: 10.5, fontWeight: 850, cursor: 'pointer'
              }}
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// PROJECT ICON MAPPER & UNIVERSAL RENDERER
// ---------------------------------------------------------

const PROJECT_ICON_MAP: Record<string, any> = {
  PenTool,
  Layers,
  ImageIcon,
  Palette,
  Layout,
  Code,
  Workflow,
  Zap,
  Monitor,
  MessageSquare,
  Briefcase,
  FileText,
  Sparkles,
  FolderKanban,
  Wand2,
  Calendar,
  Globe,
  Rocket,
  Target,
  Star,
  Bookmark,
  Flag,
  Lightbulb,
  Box,
  ShoppingBag,
  ShieldCheck,
  Heart,
  User,
  Users,
  Compass,
  Megaphone,
  Terminal,
  Cpu,
  Camera,
  Film,
  Music,
  Coffee,
  Flame,
  Award,
  Trophy,
  Smile
};

const POPULAR_PROJECT_ICONS = [
  { id: 'FolderKanban', label: 'Folder', icon: FolderKanban },
  { id: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'Rocket', label: 'Rocket', icon: Rocket },
  { id: 'Zap', label: 'Zap', icon: Zap },
  { id: 'PenTool', label: 'Design', icon: PenTool },
  { id: 'Palette', label: 'Art', icon: Palette },
  { id: 'Layout', label: 'Layout', icon: Layout },
  { id: 'Code', label: 'Code', icon: Code },
  { id: 'Workflow', label: 'Workflow', icon: Workflow },
  { id: 'Monitor', label: 'Web/App', icon: Monitor },
  { id: 'Globe', label: 'Global', icon: Globe },
  { id: 'FileText', label: 'Docs', icon: FileText },
  { id: 'Briefcase', label: 'Business', icon: Briefcase },
  { id: 'Target', label: 'Goal', icon: Target },
  { id: 'Star', label: 'Featured', icon: Star },
  { id: 'Lightbulb', label: 'Idea', icon: Lightbulb },
  { id: 'Box', label: 'Product', icon: Box },
  { id: 'ShoppingBag', label: 'Shop', icon: ShoppingBag },
  { id: 'Megaphone', label: 'Marketing', icon: Megaphone },
  { id: 'Users', label: 'Team', icon: Users },
  { id: 'Award', label: 'Award', icon: Award },
  { id: 'Trophy', label: 'Trophy', icon: Trophy },
  { id: 'Terminal', label: 'Dev', icon: Terminal },
  { id: 'Flame', label: 'Urgent', icon: Flame },
  { id: 'Camera', label: 'Media', icon: Camera },
  { id: 'MessageSquare', label: 'Chat', icon: MessageSquare },
  { id: 'Layers', label: 'Layers', icon: Layers },
  { id: 'Compass', label: 'Strategy', icon: Compass }
];

const POPULAR_PROJECT_EMOJIS = [
  '🚀', '💡', '🎨', '⚡', '💼', '📊', '🎯', '💻', '📱', '🌐',
  '📝', '🔥', '✨', '🛠️', '📦', '🏆', '⭐', '💰', '🤖', '👑',
  '💎', '🎉', '📌', '📈', '🔒', '🤝', '☕', '🌟', '🔮', '🏷️'
];

const renderProjectIcon = (icon: any, size = 18, style?: React.CSSProperties, fallbackColor?: string) => {
  if (!icon) {
    return <FolderKanban size={size} style={{ color: fallbackColor, ...style }} />;
  }

  if (React.isValidElement(icon)) {
    return icon;
  }

  if (typeof icon === 'string') {
    const IconComp = PROJECT_ICON_MAP[icon];
    if (IconComp) {
      return <IconComp size={size} style={{ color: fallbackColor, ...style }} />;
    }

    if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:')) {
      return <img src={icon} alt="icon" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4, ...style }} />;
    }

    return (
      <span style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        {icon}
      </span>
    );
  }

  return <FolderKanban size={size} style={{ color: fallbackColor, ...style }} />;
};

const ProjectIconPicker = ({
  value,
  onChange,
  onClose
}: {
  value: string;
  onChange: (newIcon: string) => void;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'lucide' | 'emoji'>('lucide');
  const [search, setSearch] = useState('');
  const [customVal, setCustomVal] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [onClose]);

  const filteredLucide = POPULAR_PROJECT_ICONS.filter(item =>
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={popoverRef}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        zIndex: 100005,
        width: 320,
        maxWidth: '90vw',
        background: 'var(--cms-card-bg)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: 18,
        boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        backdropFilter: 'blur(20px)',
        animation: 'pmModalIn 0.2s cubic-bezier(0.16,1,0.3,1) both'
      }}
    >
      {/* Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('lucide')}
            style={{
              padding: '4px 10px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'lucide' ? 'var(--cms-card-bg)' : 'transparent',
              color: activeTab === 'lucide' ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: activeTab === 'lucide' ? 'var(--cms-shadow-sm)' : 'none'
            }}
          >
            Lucide Icons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            style={{
              padding: '4px 10px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'emoji' ? 'var(--cms-card-bg)' : 'transparent',
              color: activeTab === 'emoji' ? 'var(--cms-accent)' : 'var(--cms-text-muted)',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: activeTab === 'emoji' ? 'var(--cms-shadow-sm)' : 'none'
            }}
          >
            Emoji
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Search Bar for Lucide */}
      {activeTab === 'lucide' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 9, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
          <Search size={12} color="var(--cms-text-muted)" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari icon..."
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 11.5, color: 'var(--cms-text)' }}
          />
        </div>
      )}

      {/* Icon Grid */}
      <div style={{ maxHeight: 180, overflowY: 'auto', display: 'grid', gridTemplateColumns: activeTab === 'lucide' ? 'repeat(5, 1fr)' : 'repeat(6, 1fr)', gap: 6, padding: '2px 0' }}>
        {activeTab === 'lucide' ? (
          filteredLucide.map(item => {
            const IconComp = item.icon;
            const isSelected = value === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() => { onChange(item.id); onClose(); }}
                style={{
                  height: 38,
                  borderRadius: 10,
                  border: isSelected ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'rgba(var(--cms-accent-rgb), 0.15)' : 'var(--cms-input-bg)',
                  color: isSelected ? 'var(--cms-accent)' : 'var(--cms-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--cms-accent)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <IconComp size={18} />
              </button>
            );
          })
        ) : (
          POPULAR_PROJECT_EMOJIS.map((em, idx) => {
            const isSelected = value === em;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => { onChange(em); onClose(); }}
                style={{
                  height: 38,
                  borderRadius: 10,
                  border: isSelected ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'rgba(var(--cms-accent-rgb), 0.15)' : 'var(--cms-input-bg)',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.12s ease'
                }}
              >
                {em}
              </button>
            );
          })
        )}
      </div>

      {/* Custom Input */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: '1px solid var(--glass-border)' }}>
        <input
          type="text"
          value={customVal}
          onChange={e => setCustomVal(e.target.value)}
          placeholder="Ketik emoji atau paste URL..."
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--glass-border)',
            background: 'var(--cms-input-bg)',
            color: 'var(--cms-text)',
            fontSize: 11.5,
            outline: 'none'
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (customVal.trim()) {
              onChange(customVal.trim());
              setCustomVal('');
              onClose();
            }
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--cms-accent)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Set
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// MAIN MODULE
// ---------------------------------------------------------

interface ProjectsModuleProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  confirm?: any;
  projects?: any[];
  setProjects?: any;
  initialViewMode?: string;
}

const ProjectsModule: React.FC<ProjectsModuleProps> = ({ notify, confirm: confirmFn, projects = [], setProjects, initialViewMode }) => {
  const { showConfirm } = useDialog();
  const [stickyNotes, setStickyNotes] = useState([]);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isScheduleSettingsOpen, setIsScheduleSettingsOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isServiceOrderModalOpen, setIsServiceOrderModalOpen] = useState(false);

  const pendingAccCount = useMemo(() => {
    return (projects || []).filter(p => !p.isDeleted && !p.isTrash && (p.status === 'pending_acc' || (p.requiresAcc && !p.isApproved))).length;
  }, [projects]);

  useEffect(() => {
    const handleOpenSvcOrder = () => setIsServiceOrderModalOpen(true);
    window.addEventListener('porto_open_service_order_modal', handleOpenSvcOrder);
    return () => window.removeEventListener('porto_open_service_order_modal', handleOpenSvcOrder);
  }, []);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingSettings, setBookingSettings] = useState<any>({
    customServices: [
      { name: 'Konsultasi Proyek', duration: '30 Menit' },
      { name: 'Review Desain', duration: '45 Menit' },
      { name: 'Sesi Diskusi Kreatif', duration: '60 Menit' }
    ]
  });
  const [newBookingForm, setNewBookingForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: 'Konsultasi Proyek',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: ''
  });

  const addMenuRef = useRef<HTMLDivElement>(null);
  const addMenuMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storage.getItem('porto_bookings', []).then(saved => {
      if (Array.isArray(saved)) setBookings(saved);
    }).catch(() => { });
    storage.getItem('porto_settings', {}).then(sett => {
      if (sett?.bookingSettings) setBookingSettings(sett.bookingSettings);
    }).catch(() => { });
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingForm.clientName.trim() || !newBookingForm.date) {
      notify?.('Nama klien dan tanggal pertemuan wajib diisi!', 'error');
      return;
    }
    const newBooking = {
      id: `bk_${Date.now()}`,
      clientName: newBookingForm.clientName.trim(),
      clientPhone: newBookingForm.clientPhone.trim(),
      clientEmail: newBookingForm.clientEmail.trim(),
      serviceName: newBookingForm.serviceName,
      date: newBookingForm.date,
      time: newBookingForm.time || '10:00',
      notes: newBookingForm.notes.trim(),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    await storage.setItem('porto_bookings', updated);
    setIsNewBookingOpen(false);
    setNewBookingForm({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      serviceName: 'Konsultasi Proyek',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      notes: ''
    });
    notify?.(`Janji temu dengan ${newBooking.clientName} berhasil dijadwalkan! 📅`, 'success');
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const isInsideDesktop = addMenuRef.current && addMenuRef.current.contains(e.target as Node);
      const isInsideMobile = addMenuMobileRef.current && addMenuMobileRef.current.contains(e.target as Node);
      if (!isInsideDesktop && !isInsideMobile) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const [viewMode, setViewMode] = useState<string>(() => {
    if (initialViewMode) return initialViewMode;
    if (typeof window !== 'undefined') return localStorage.getItem('porto_pm_view_mode') || 'board';
    return 'board';
  });

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth <= 1200) : false);

  // ── AI & OFFLINE PROJECT PLANNER STATE ──
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [plannerMode, setPlannerMode] = useState<'ai' | 'offline'>('offline');
  const [aiPrompt, setAiPrompt] = useState('Buatkan rencana proyek perancangan identitas visual & desain logo brand profesional dari riset hingga brand guideline.');
  const [aiTemplateType, setAiTemplateType] = useState('brand_identity');
  const [aiCategoryFilter, setAiCategoryFilter] = useState('all');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // ── CUSTOM TEMPLATES & CATEGORIES STATE ──
  const [customProjectTemplates, setCustomProjectTemplates] = useState<OfflineProjectTemplate[]>(() => getCustomProjectTemplates());
  const [customProjectCategories, setCustomProjectCategories] = useState(() => getCustomProjectCategories());
  const [isCreatingCustomTemplate, setIsCreatingCustomTemplate] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState<{
    label: string;
    category: string;
    newCategoryInput: string;
    priority: 'low' | 'medium' | 'high';
    estimatedDays: number;
    description: string;
    tasks: string;
    icon: string;
  }>({
    label: '',
    category: 'design',
    newCategoryInput: '',
    priority: 'medium',
    estimatedDays: 7,
    description: '',
    tasks: '',
    icon: 'FolderKanban'
  });

  const handleSaveNewCustomTemplate = () => {
    if (!newTemplateForm.label.trim()) {
      notify?.('Nama template harus diisi!', 'error');
      return;
    }

    let finalCategory = newTemplateForm.category;
    if (newTemplateForm.newCategoryInput.trim()) {
      const added = addCustomProjectCategory(newTemplateForm.newCategoryInput.trim());
      setCustomProjectCategories(added);
      finalCategory = newTemplateForm.newCategoryInput.trim().toLowerCase().replace(/\s+/g, '_');
    }

    const subtasksList = newTemplateForm.tasks
      .split('\n')
      .map(t => t.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter(Boolean);

    const newTemplate: OfflineProjectTemplate = {
      id: `custom_${Date.now()}`,
      label: newTemplateForm.label.trim(),
      category: finalCategory as any,
      icon: newTemplateForm.icon || 'FolderKanban',
      title: newTemplateForm.label.trim(),
      description: newTemplateForm.description.trim() || 'Template kustom saya',
      priority: newTemplateForm.priority,
      tags: ['Custom', finalCategory],
      estimatedDays: Number(newTemplateForm.estimatedDays) || 7,
      tasks: subtasksList.length > 0 ? subtasksList : ['Perencanaan proyek', 'Eksekusi & revisi', 'Penyelesaian & serah terima'],
      notes: 'Template kustom disimpan oleh pengguna.',
      prompt: newTemplateForm.description.trim() || newTemplateForm.label.trim()
    };

    const updated = saveCustomProjectTemplate(newTemplate);
    setCustomProjectTemplates(updated);
    setAiTemplateType(newTemplate.id);
    setIsCreatingCustomTemplate(false);
    setNewTemplateForm({
      label: '',
      category: 'design',
      newCategoryInput: '',
      priority: 'medium',
      estimatedDays: 7,
      description: '',
      tasks: '',
      icon: 'FolderKanban'
    });
    notify?.('Template kustom berhasil disimpan! ⭐', 'success');
  };

  const handleDeleteCustomTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteCustomProjectTemplate(id);
    setCustomProjectTemplates(updated);
    if (aiTemplateType === id) {
      setAiTemplateType(OFFLINE_PROJECT_TEMPLATES[0]?.id || '');
    }
    notify?.('Template kustom berhasil dihapus', 'info');
  };

  const handleSaveActiveProjectAsTemplate = (proj: any) => {
    if (!proj) return;
    const taskList = (proj.subtasks || proj.tasks || []).map((t: any) => typeof t === 'string' ? t : t.title || t.text).filter(Boolean);
    const newTemplate: OfflineProjectTemplate = {
      id: `custom_from_${proj.id}_${Date.now()}`,
      label: proj.title || 'Template Proyek',
      category: (proj.category || 'design').toLowerCase().replace(/\s+/g, '_') as any,
      icon: proj.icon || 'FolderKanban',
      title: proj.title || 'Template Proyek',
      description: proj.description || 'Disimpan langsung dari proyek aktif',
      priority: proj.priority || 'medium',
      tags: Array.isArray(proj.tags) ? proj.tags : ['Custom'],
      estimatedDays: 14,
      tasks: taskList.length > 0 ? taskList : ['Tahap 1: Persiapan', 'Tahap 2: Pengerjaan', 'Tahap 3: Finalisasi'],
      notes: proj.notes || '',
      prompt: proj.description || proj.title || ''
    };
    const updated = saveCustomProjectTemplate(newTemplate);
    setCustomProjectTemplates(updated);
    notify?.(`Proyek "${proj.title}" berhasil disimpan sebagai Template! ⭐`, 'success');
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setIsMobileModeMenuOpen(false);
  };
  const [isMobileModeMenuOpen, setIsMobileModeMenuOpen] = useState(false);
  const viewModeButtonRef = useRef(null);
  const [viewModePopupPos, setViewModePopupPos] = useState({ x: 0, y: 0 });
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBoardFilter, setActiveBoardFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isGlobalProofingOpen, setIsGlobalProofingOpen] = useState(false);
  const [proofingTargetProject, setProofingTargetProject] = useState<any>(null);

  const handleOpenProofingManager = (proj?: any) => {
    let target = proj;
    if (!target) {
      target = selectedProject || (projects && projects.length > 0 ? projects[0] : null);
    }
    if (!target) {
      target = {
        id: `PRJ-${Date.now().toString().slice(-5)}`,
        title: 'Proyek Desain Visual Klien',
        client: 'Klien Studio',
        status: 'progress',
        priority: 'high',
        createdAt: new Date().toISOString(),
        proofingImages: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85'
        ]
      };
      saveProjects([target]);
    }
    setProofingTargetProject(target);
    setIsGlobalProofingOpen(true);
    notify?.('✨ Membuka pengunggah preview & link proofing klien', 'info');
  };
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isModuleFullscreen, setIsModuleFullscreen] = useState(false);

  // ── FULLSCREEN ESCAPE KEY LISTENER ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModuleFullscreen && !selectedProject) {
        setIsModuleFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModuleFullscreen, selectedProject]);

  // ── MOBILE BACK BUTTON SUPPORT ──
  useEffect(() => {
    const handleBack = () => {
      if (selectedProject) setSelectedProject(null);
      else if (isModuleFullscreen) setIsModuleFullscreen(false);
    };
    window.addEventListener('cms_back_event', handleBack);
    return () => window.removeEventListener('cms_back_event', handleBack);
  }, [selectedProject, isModuleFullscreen]);

  // ── 2-WAY URL & DEEP LINK SYNC FOR PROJECTS / CONTENT / SCHEDULES ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (selectedProject) {
        url.searchParams.set('project', selectedProject.id);
        window.history.replaceState({ projectOpen: true, projectId: selectedProject.id }, '', url.toString());
      } else {
        if (url.searchParams.has('project') || url.searchParams.has('id')) {
          url.searchParams.delete('project');
          url.searchParams.delete('id');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (e) { }
  }, [selectedProject]);

  // Read URL query parameter ?project=... or ?id=... on initial mount / popstate navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkUrlProject = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const projId = params.get('project') || params.get('id') || sessionStorage.getItem('porto_open_project_on_mount');
        if (projId && projects.length > 0) {
          const found = projects.find(p => String(p.id) === String(projId));
          if (found && (!selectedProject || String(selectedProject.id) !== String(projId))) {
            setSelectedProject(found);
            setModalTab('overview');
            sessionStorage.removeItem('porto_open_project_on_mount');
          }
        }
      } catch (e) { }
    };
    checkUrlProject();
    window.addEventListener('popstate', checkUrlProject);
    return () => window.removeEventListener('popstate', checkUrlProject);
  }, [projects]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalTab, setModalTab] = useState('overview');
  const [isUploading, setIsUploading] = useState(false);

  // Load Data
  useEffect(() => {
    const load = async () => {
      try {
        const savedNotes = await storage.getItem('porto_sticky_notes', []);
        setStickyNotes(getSafeArray(savedNotes));
      } catch (e) {
        console.error('Failed to load sticky notes', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleOpenProject = (e: any) => {
      const projectId = typeof e.detail === 'string' ? e.detail : e.detail?.projectId || e.detail?.id;
      if (!projectId) return;
      let list = projects;
      if (list.length === 0) {
        try {
          const parsed = JSON.parse(localStorage.getItem('idb_porto_projects') || '[]');
          list = Array.isArray(parsed) ? parsed : [];
        } catch {
          list = [];
        }
      }
      const proj = list.find((p: any) => String(p.id) === String(projectId));
      if (proj) {
        setSelectedProject(proj);
        setModalTab('overview');
      }
    };
    window.addEventListener('porto_open_project', handleOpenProject);
    window.addEventListener('porto_pm_open_project', handleOpenProject);
    return () => {
      window.removeEventListener('porto_open_project', handleOpenProject);
      window.removeEventListener('porto_pm_open_project', handleOpenProject);
    };
  }, [projects]);

  // ── UNDO & REDO HISTORY STATE FOR PROJECTS ──
  const [undoStack, setUndoStack] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);
  const isUndoRedoActionRef = useRef(false);

  // Save projects with history tracking
  const saveProjectsWithHistory = (updated: any[], skipHistory = false) => {
    if (!skipHistory && !isUndoRedoActionRef.current && Array.isArray(projects) && projects.length > 0) {
      setUndoStack(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(projects))]);
      setRedoStack([]);
    }
    setProjects(updated);
    storage.setItem('porto_projects', updated);
    window.dispatchEvent(new Event('porto_saved'));
  };

  const saveProjects = async (updated: any[]) => {
    saveProjectsWithHistory(updated);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevSnapshot = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    isUndoRedoActionRef.current = true;
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(projects))]);
    setUndoStack(newUndoStack);
    setProjects(prevSnapshot);
    storage.setItem('porto_projects', prevSnapshot);
    window.dispatchEvent(new Event('porto_saved'));
    notify?.('↩️ Undo: Perubahan proyek dibatalkan', 'info');
    setTimeout(() => { isUndoRedoActionRef.current = false; }, 200);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextSnapshot = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    isUndoRedoActionRef.current = true;
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(projects))]);
    setRedoStack(newRedoStack);
    setProjects(nextSnapshot);
    storage.setItem('porto_projects', nextSnapshot);
    window.dispatchEvent(new Event('porto_saved'));
    notify?.('↪️ Redo: Perubahan proyek dikembalikan', 'info');
    setTimeout(() => { isUndoRedoActionRef.current = false; }, 200);
  };

  // Global Keyboard shortcut listener for Ctrl+Z & Ctrl+Y / Ctrl+Shift+Z in ProjectsModule
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
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
  }, [undoStack, redoStack, projects]);

  const saveNotes = async (updated) => {
    setStickyNotes(updated);
    await storage.setItem('porto_sticky_notes', updated);
  };

  // ── PROJECT TEMPLATE & AI HANDLERS ──
  const handleSelectAiTemplate = (tmpl: OfflineProjectTemplate) => {
    setAiTemplateType(tmpl.id);
    if (tmpl.prompt) {
      setAiPrompt(tmpl.prompt);
    }
  };

  const handleGenerateAiProjectSubmit = async (e?: React.FormEvent, forceOffline: boolean = false) => {
    if (e) e.preventDefault();

    // 100% Instant Offline Generation (0ms, 0 tokens)
    if (plannerMode === 'offline' || forceOffline) {
      const offlineProj = buildOfflineProject(aiTemplateType, aiPrompt);
      const updated = [offlineProj, ...(Array.isArray(projects) ? projects : [])];
      saveProjects(updated);
      setIsAiModalOpen(false);
      setSelectedProject(offlineProj);
      setModalTab('overview');
      notify(`⚡ Proyek "${offlineProj.title}" berhasil dibuat dari Template Instan`, 'success');
      addNotification('project', 'Proyek Baru', `"${offlineProj.title}" telah dibuat dengan rencana kerja lengkap.`, { projectId: offlineProj.id });
      return;
    }

    if (!aiPrompt.trim() && plannerMode === 'ai') return;
    setIsAiGenerating(true);
    setAiError('');
    try {
      const result = await generateAiProject(aiPrompt, aiTemplateType);
      if (result.error) {
        // Fallback to instant offline template
        const fallbackProj = buildOfflineProject(aiTemplateType, aiPrompt);
        const updated = [fallbackProj, ...(Array.isArray(projects) ? projects : [])];
        saveProjects(updated);
        setIsAiModalOpen(false);
        setSelectedProject(fallbackProj);
        setModalTab('overview');
        notify(`⚡ Menggunakan Template Offline karena koneksi AI offline/terkendala.`, 'warning');
        return;
      }

      const calculatedDeadline = result.estimatedDays
        ? new Date(Date.now() + result.estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const formattedTasks = Array.isArray(result.tasks)
        ? result.tasks.map((t, idx) => ({ id: Date.now() + idx, text: t, done: false }))
        : [];

      const newProj = {
        id: `proj_${Date.now()}`,
        parentId: null,
        title: result.title || 'Proyek Baru AI',
        description: result.description || aiPrompt,
        status: 'todo',
        priority: ['low', 'medium', 'high'].includes(result.priority) ? result.priority : 'medium',
        createdAt: new Date().toISOString(),
        deadline: calculatedDeadline,
        progress: 0,
        tasks: formattedTasks,
        notes: result.notes || '',
        tags: Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : ['AI-Plan'],
        icon: 'FolderKanban',
        coverImage: '',
        team: [{ name: 'Saya', role: 'Project Lead', color: '#10b981' }],
        files: [],
        activity: [{ id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: 'Proyek dirancang dengan AI Project Planner' }]
      };

      const updated = [newProj, ...projects];
      saveProjects(updated);
      setIsAiModalOpen(false);
      setSelectedProject(newProj);
      setModalTab('overview');
      notify('✨ Proyek berhasil dirancang & dibuat dengan AI', 'success');
      addNotification('project', 'Proyek AI Baru', `"${newProj.title}" telah dibuat dengan rencana kerja lengkap.`, { projectId: newProj.id });
    } catch (err: any) {
      const fallbackProj = buildOfflineProject(aiTemplateType, aiPrompt);
      const updated = [fallbackProj, ...(Array.isArray(projects) ? projects : [])];
      saveProjects(updated);
      setIsAiModalOpen(false);
      setSelectedProject(fallbackProj);
      setModalTab('overview');
      notify(`⚡ Terjadi kendala AI. Berhasil membuat dari Template Offline.`, 'warning');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const addProject = (parentId: any = null, shouldSelect = true, initialProps: any = {}) => {
    const isContent = initialProps?.type === 'content';
    const newProj = {
      id: `proj_${Date.now()}`,
      parentId: parentId,
      type: isContent ? 'content' : 'project',
      platform: initialProps.platform || (isContent ? 'instagram' : undefined),
      format: initialProps.format || (isContent ? 'reels' : undefined),
      title: parentId ? 'Sub-task Baru' : isContent ? 'Ide Konten Baru' : 'Proyek Baru',
      description: '',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      deadline: initialProps.deadline || '',
      progress: 0,
      tasks: [],
      notes: '',
      tags: isContent ? ['Konten', 'MediaSosial'] : parentId ? ['Sub-task'] : ['Proyek'],
      icon: isContent ? 'Sparkles' : parentId ? 'FileText' : 'FolderKanban',
      coverImage: '',
      team: [{ name: 'Admin', role: 'Lead', color: 'var(--cms-accent, #7c3aed)' }],
      files: [],
      activity: [{ id: Date.now(), time: new Date().toISOString(), message: isContent ? 'Rencana Konten Dibuat' : 'Proyek Dibuat' }],
      ...initialProps
    };
    const updated = [newProj, ...(Array.isArray(projects) ? projects : [])];
    saveProjects(updated);
    if (shouldSelect) {
      setSelectedProject(newProj);
      setModalTab('overview');
    }
    notify?.(isContent ? 'Rencana Konten Baru Dibuat' : 'Proyek Baru Ditambahkan', 'success');
    addNotification('project', parentId ? 'Sub-task Baru' : isContent ? 'Konten Baru' : 'Proyek Baru', `"${newProj.title}" telah ditambahkan.`, { projectId: newProj.id });
  };

  // ── AUTO-OPEN CREATE PROJECT MODAL (GLOBAL SHORTCUT / SLASH COMMAND / SEARCH INTENT) ──
  useEffect(() => {
    const handleCreateTrigger = () => {
      addProject(null, true);
    };

    if (typeof window !== 'undefined' && sessionStorage.getItem('porto_auto_create_project') === '1') {
      sessionStorage.removeItem('porto_auto_create_project');
      setTimeout(() => {
        addProject(null, true);
      }, 150);
    }

    window.addEventListener('porto_create_project', handleCreateTrigger);
    return () => {
      window.removeEventListener('porto_create_project', handleCreateTrigger);
    };
  }, [projects]);

  const updateProject = (id, props) => {
    const updated = (Array.isArray(projects) ? projects : []).map(p => {
      if (p.id === id) {
        let activity = props.activity || getSafeArray(p.activity);
        if (props.status && props.status !== p.status) {
          const statusLabel = STATUSES.find(s => s.id === props.status)?.label || props.status;
          activity = [{ id: Date.now(), time: new Date().toISOString(), message: `Status diubah menjadi ${statusLabel}` }, ...activity];
          addNotification('project', 'Pembaruan Proyek', `Status "${p.title}" diubah menjadi ${statusLabel}.`, { projectId: p.id });
        }
        return { ...p, ...props, activity };
      }
      return p;
    });
    saveProjects(updated);
    if (selectedProject?.id === id) {
      setSelectedProject(updated.find(p => p.id === id));
    }
  };

  const handleCreateInvoiceForProject = (proj: any) => {
    if (!proj) return;
    const itemData = {
      id: proj.id,
      name: proj.title || 'Proyek Klien',
      price: Number(proj.budget) || 0,
      customer: {
        name: proj.client || '',
        phone: proj.clientPhone || '',
        email: proj.clientEmail || ''
      },
      notes: `Tagihan Proyek: ${proj.title}\nDeadline: ${proj.deadline || '-'}`
    };
    sessionStorage.setItem('porto_auto_create_transaction_item', JSON.stringify(itemData));
    window.dispatchEvent(new CustomEvent('porto_create_transaction_with_item', { detail: { item: itemData } }));
    window.dispatchEvent(new CustomEvent('porto_navigate_admin', { detail: { tab: 'transactions' } }));
    notify?.(`Membuka pembuatan invoice untuk "${proj.title}"`, 'info');
  };

  const handleSendAssetDropLinkForProject = (proj: any) => {
    if (!proj) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sumr.day';
    const dropUrl = `${origin}/drop/${encodeURIComponent(proj.id)}`;

    try {
      navigator.clipboard?.writeText(dropUrl);
    } catch { }

    const rawPhone = proj.clientPhone || proj.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phoneToUse = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const clientName = proj.client || proj.clientName || 'Klien';

    const text = `Halo Kak *${clientName}*! 👋☀️

Untuk memulai pengerjaan proyek *"${proj.title || 'Proyek'}"*, silakan kirimkan materi brand (logo vektor, foto produk HD, dokumen brief) melalui portal serah terima materi resmi sumr.day berikut:

🔗 ${dropUrl}

(Bisa langsung drag & drop file ukuran besar tanpa repot login). Terima kasih! 🙏✨`;

    if (phoneToUse) {
      window.open(`https://wa.me/${phoneToUse}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      notify?.(`Tautan /drop disalin & membuka WhatsApp klien (${clientName})`, 'success');
    } else {
      notify?.(`Tautan serah terima berkas disalin: ${dropUrl}`, 'success');
    }
  };

  const removeProject = (id: any, direct = false) => {
    const doRemove = async () => {
      const currentList = Array.isArray(projects) ? projects : [];
      const updated = currentList.map(p =>
        String(p.id) === String(id) ? { ...p, isDeleted: true, isTrash: true, deletedAt: new Date().toISOString() } : p
      );
      await saveProjects(updated);
      setSelectedProject(null);
      if (selectedIds.includes(id)) {
        setSelectedIds(prev => prev.filter(i => String(i) !== String(id)));
      }
      notify?.('Proyek dipindahkan ke Sampah', 'info');
    };

    if (direct) {
      doRemove();
      return;
    }

    if (typeof confirmFn === 'function') {
      confirmFn('Pindahkan proyek ini ke Sampah?', doRemove);
    } else if (typeof showConfirm === 'function') {
      showConfirm('Pindahkan proyek ini ke Sampah?').then(ok => {
        if (ok) doRemove();
      });
    } else {
      if (window.confirm('Pindahkan proyek ini ke Sampah?')) {
        doRemove();
      }
    }
  };

  const restoreProject = async (id: any) => {
    const currentList = Array.isArray(projects) ? projects : [];
    const updated = currentList.map(p =>
      String(p.id) === String(id) ? { ...p, isDeleted: false, isTrash: false, deletedAt: null } : p
    );
    await saveProjects(updated);
    notify?.('Proyek berhasil dipulihkan', 'success');
  };

  const permanentDeleteProject = (id: any, direct = false) => {
    const doPermanent = async () => {
      const currentList = Array.isArray(projects) ? projects : [];
      const updated = currentList.filter(p => String(p.id) !== String(id));
      await saveProjects(updated);
      setSelectedProject(null);
      if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => String(i) !== String(id)));
      notify?.('Proyek dihapus permanen', 'info');
    };

    if (direct) {
      doPermanent();
      return;
    }

    if (typeof confirmFn === 'function') {
      confirmFn('Hapus PERMANEN proyek ini? Data tidak dapat dikembalikan.', doPermanent);
    } else if (typeof showConfirm === 'function') {
      showConfirm('Hapus PERMANEN proyek ini? Data tidak dapat dikembalikan.').then(ok => {
        if (ok) doPermanent();
      });
    } else {
      if (window.confirm('Hapus PERMANEN proyek ini? Data tidak dapat dikembalikan.')) {
        doPermanent();
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedProject) return;
    setIsUploading(true);
    try {
      const url = await googleSync.uploadFileToDrive(file, (msg, type) => notify(msg, type));
      const newFile = {
        id: Date.now(), name: file.name, url, type: file.type,
        size: (file.size / 1024).toFixed(1) + ' KB', uploadedAt: new Date().toISOString()
      };
      updateProject(selectedProject.id, { files: [...getSafeArray(selectedProject.files), newFile] });
      notify?.('Berkas berhasil dilampirkan ke Google Drive', 'success');
    } catch (err) {
      notify?.('Upload gagal', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (viewMode === 'trash') {
      return (projects || []).filter(p => p.isDeleted || p.isTrash);
    }
    return (projects || []).filter(p => {
      if (p.isDeleted || p.isTrash) return false;
      const isPendingAcc = p.status === 'pending_acc' || (p.requiresAcc && !p.isApproved);
      if (activeBoardFilter === 'pending_acc') {
        return isPendingAcc;
      }
      // "manajemen proyek baru muncul kalau aku acc":
      // Hide pending ACC projects from regular active Kanban board/table/gallery/list views
      if (isPendingAcc) return false;

      const isSearchActive = searchQuery.length > 0;
      if (!isSearchActive && p.parentId) return false;
      const title = getSafeString(p.title).toLowerCase();
      const desc = getSafeString(p.description).toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || title.includes(q) || desc.includes(q);
      const matchesBoard = activeBoardFilter === 'all' || p.status === activeBoardFilter;
      return matchesSearch && matchesBoard;
    });
  }, [projects, searchQuery, activeBoardFilter, viewMode]);

  const toggleSelection = (id, isChecked) => {
    if (id === 'all') {
      setSelectedIds(isChecked ? filteredProjects.map(p => p.id) : []);
    } else {
      setSelectedIds(prev => isChecked ? [...prev, id] : prev.filter(i => i !== id));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (viewMode === 'trash') {
      const confirmed = await showConfirm(`Hapus PERMANEN ${selectedIds.length} projects?`);
      if (confirmed) {
        saveProjects(projects.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        notify(`❌ ${selectedIds.length} Projects Deleted Forever`);
      }
    } else {
      const confirmed = await showConfirm(`Pindahkan ${selectedIds.length} projects ke Trash?`);
      if (confirmed) {
        saveProjects(projects.map(p => selectedIds.includes(p.id) ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() } : p));
        setSelectedIds([]);
        notify(`🗑️ ${selectedIds.length} Projects moved to Trash`);
      }
    }
  };

  const bulkStatusUpdate = (newStatus) => {
    const updated = projects.map(p => selectedIds.includes(p.id) ? { ...p, status: newStatus } : p);
    saveProjects(updated);
    setSelectedIds([]);
    notify(`Status Updated for ${selectedIds.length} Projects`);
  };

  const analytics = useMemo(() => {
    const mainProjects = projects.filter(p => !p.parentId && !p.isDeleted);
    const total = mainProjects.length;
    if (total === 0) return { total: 0, completed: 0, avgProgress: 0, atRisk: 0 };

    const normalizeStatusLocal = (s) => {
      if (!s || typeof s !== 'string') return 'todo';
      const norm = s.toLowerCase().replace(/[^a-z]/g, '');
      if (norm.includes('done') || norm.includes('complet')) return 'done';
      if (norm.includes('progress') || norm.includes('ongoing') || norm.includes('run')) return 'progress';
      if (norm.includes('review') || norm.includes('check') || norm.includes('qa')) return 'review';
      if (norm.includes('hold') || norm.includes('pause') || norm.includes('wait')) return 'hold';
      return 'todo';
    };

    const completed = mainProjects.filter(p => normalizeStatusLocal(p.status) === 'done').length;
    const avgProgress = Math.round(mainProjects.reduce((acc, p) => acc + getSafeProgress(p.progress), 0) / total);
    const atRisk = mainProjects.filter(p => {
      if (!p.deadline || normalizeStatusLocal(p.status) === 'done') return false;
      return (new Date(p.deadline) - new Date()) < (1000 * 60 * 60 * 24 * 3) && getSafeProgress(p.progress) < 70;
    }).length;
    return { total, completed, avgProgress, atRisk };
  }, [projects]);

  // Drag and drop HTML5 API with full browser support & visual drop target
  const onDragStart = (e, projectId) => {
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.setData('projectId', projectId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(projectId);
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };
  const onDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };
  const onDragLeave = (e, colId) => {
    // Only reset if leaving
  };
  const onDrop = (e, status) => {
    e.preventDefault();
    setDragOverCol(null);
    const droppedId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('projectId') || draggingId;
    setDraggingId(null);
    if (droppedId) {
      const proj = projects.find(p => p.id === droppedId);
      if (proj && proj.status !== status) {
        updateProject(droppedId, { status });
        const targetStatusLabel = STATUSES.find(s => s.id === status)?.label || status;
        notify(`Status: ${targetStatusLabel}`);
      }
    }
  };

  // SYNC GLOBAL SEARCH FROM NAVBAR
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setSearchQuery(e.detail || '');
    };
    window.addEventListener('cms_search_update', handleGlobalSearch);
    return () => window.removeEventListener('cms_search_update', handleGlobalSearch);
  }, []);

  // AUTO-SYNC TO GOOGLE SHEETS Dihapus (Kini menggunakan tombol manual atau global save untuk menghindari kuota terkuras)

  if (isLoading) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
      <Loader2 size={32} className="cms-spin" style={{ color: 'var(--cms-text-muted)', opacity: 0.5 }} />
    </div>
  );

  return (
    <div className="projects-pro-module cms-projects-module" style={{
      ...(isModuleFullscreen ? {
        position: 'fixed',
        top: isMobile ? '8px' : '14px',
        left: isMobile ? '8px' : '14px',
        right: isMobile ? '8px' : '14px',
        bottom: isMobile ? '8px' : '14px',
        width: isMobile ? 'calc(100vw - 16px)' : 'calc(100vw - 28px)',
        height: isMobile ? 'calc(100vh - 16px)' : 'calc(100vh - 28px)',
        minHeight: isMobile ? 'calc(100vh - 16px)' : 'calc(100vh - 28px)',
        maxHeight: isMobile ? 'calc(100vh - 16px)' : 'calc(100vh - 28px)',
        borderRadius: isMobile ? '18px' : '26px',
        boxShadow: '0 25px 80px -10px rgba(0,0,0,0.5), 0 0 0 1.5px var(--glass-border)',
        border: '1.5px solid var(--glass-border)',
        zIndex: 99990,
        background: 'var(--cms-bg)',
        padding: isMobile ? '12px 10px calc(80px + env(safe-area-inset-bottom, 20px))' : '18px 24px 24px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--cms-text)',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      } : {
        padding: isMobile ? '10px 8px 60px 8px' : '16px 20px 12px 20px',
        height: '100%', minHeight: '100%', width: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        background: 'var(--cms-bg)', color: 'var(--cms-text)',
        overflowX: 'hidden', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      })
    }}>

      {/* ── Top Navigation & Analytics (Baris 1: Stat Cards + 4 Circular Actions) ── */}
      <div className="projects-top-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, width: '100%', flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Sisi Kiri / Center: Stat Cards (Interactive Quick Filters) */}
        <div className="projects-stats-grid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {[
            { label: 'WORKS', val: analytics.total, color: 'var(--cms-accent)', icon: <FolderKanban size={14} />, filter: 'all' },
            { label: 'EFFICIENCY', val: analytics.avgProgress + '%', color: 'var(--cms-accent, #8b5cf6)', icon: <TrendingUp size={14} />, filter: 'all' },
            { label: 'COMPLETED', val: analytics.completed, color: '#10b981', icon: <CheckCircle2 size={14} />, filter: 'done' },
            { label: 'AT RISK', val: analytics.atRisk, color: analytics.atRisk > 0 ? '#ef4444' : 'var(--cms-text-muted)', icon: <AlertCircle size={14} />, filter: 'review' }
          ].map((stat, i) => {
            const isFilterActive = stat.filter !== 'all' && activeBoardFilter === stat.filter;
            return (
              <div
                key={i}
                onClick={() => {
                  haptic.selection();
                  setActiveBoardFilter(prev => prev === stat.filter ? 'all' : stat.filter);
                }}
                className="projects-stat-card"
                title={`Klik untuk memfilter: ${stat.label}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: isFilterActive ? 'rgba(var(--cms-accent-rgb), 0.14)' : 'var(--cms-card-bg)',
                  border: isFilterActive ? `1.5px solid ${stat.color}` : '1.5px solid var(--glass-border)',
                  flexShrink: 0,
                  boxShadow: 'var(--cms-shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isFilterActive ? 'scale(1.03)' : 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = stat.color;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isFilterActive ? stat.color : 'var(--glass-border)';
                  e.currentTarget.style.transform = isFilterActive ? 'scale(1.03)' : 'none';
                }}
              >
                <div className="stat-card-icon" style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
                  {stat.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
                  <div className="stat-card-label" style={{ fontSize: 9, fontWeight: 900, color: 'var(--cms-text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{stat.label}</div>
                  <div className="stat-card-val" style={{ fontSize: 13, fontWeight: 900, color: stat.color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{stat.val}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sisi Kanan: Primary Actions (5 Circular Icon Buttons) */}
        <div className="projects-primary-actions hide-tablet hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', flexShrink: 0 }}>

          {/* Undo Action Button */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo / Batalkan Perubahan Proyek (Ctrl+Z)"
            style={{
              height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              color: undoStack.length > 0 ? 'var(--cms-text)' : 'var(--cms-text-muted)',
              opacity: undoStack.length > 0 ? 1 : 0.4,
              cursor: undoStack.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
            onMouseEnter={e => { if (undoStack.length > 0) { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <RotateCcw size={16} />
          </button>

          {/* Redo Action Button */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo / Kembalikan Perubahan Proyek (Ctrl+Y atau Ctrl+Shift+Z)"
            style={{
              height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              color: redoStack.length > 0 ? 'var(--cms-text)' : 'var(--cms-text-muted)',
              opacity: redoStack.length > 0 ? 1 : 0.4,
              cursor: redoStack.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
            onMouseEnter={e => { if (redoStack.length > 0) { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <RotateCw size={16} />
          </button>

          {/* 1. AI Planner Circular Icon */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            title="Rancang & Buat Proyek dengan AI"
            style={{
              height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              color: 'var(--cms-accent)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Wand2 size={16} color="var(--cms-accent)" />
          </button>

          {/* 2. Settings Circular Icon */}
          <button
            type="button"
            onClick={() => setIsScheduleSettingsOpen(true)}
            title="Pengaturan Kalender & Jadwal Booking"
            style={{
              height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              color: 'var(--cms-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.color = 'var(--cms-text)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--cms-text-muted)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Settings2 size={16} />
          </button>

          {/* 3. Multi-Select Checkbox Circular Icon */}
          <button
            onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds([]); }}
            title={isSelectionMode ? "Batal Mode Pilih" : "Mode Pilih (Multi-Select)"}
            className="selection-mode-btn"
            style={{
              height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: isSelectionMode ? '2px solid var(--cms-accent)' : '1.5px solid var(--glass-border)',
              background: isSelectionMode ? 'rgba(var(--cms-accent-rgb), 0.12)' : 'var(--cms-card-bg)',
              color: isSelectionMode ? 'var(--cms-accent)' : 'var(--cms-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--cms-text)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = isSelectionMode ? 'var(--cms-accent)' : 'var(--cms-text-muted)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <CheckSquare size={16} strokeWidth={isSelectionMode ? 2.8 : 2} />
          </button>

          {/* 3.5. Service / Custom Order (ACC) Circular Icon */}
          <button
            type="button"
            onClick={() => setIsServiceOrderModalOpen(true)}
            title="Antrian & Pesanan Baru (Sistem ACC)"
            style={{
              height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.35)',
              background: 'rgba(16,185,129,0.1)',
              color: '#10b981', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Sparkles size={16} />
          </button>

          {/* 3.6. Visual Design Proofing & Review Launcher */}
          <button
            type="button"
            onClick={() => handleOpenProofingManager()}
            title="Kelola & Kirim Gambar Proofing ke Klien"
            style={{
              height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.35)',
              background: 'rgba(6,182,212,0.1)',
              color: '#06b6d4', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <ShieldCheck size={16} />
          </button>

          {/* 4. Universal Plus Button with Popup Menu */}
          <div ref={addMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="add-project-btn"
              title="Tambah Proyek, Konten, atau Janji Temu"
              style={{
                height: 38, width: 38, minWidth: 38, minHeight: 38, maxWidth: 38, maxHeight: 38, padding: 0, boxSizing: 'border-box',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--cms-accent)', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.3)', transition: 'all 0.2s ease', flexShrink: 0
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
            >
              <Plus size={20} strokeWidth={2.8} style={{ width: 20, height: 20, minWidth: 20, minHeight: 20, display: 'block', flexShrink: 0 }} />
            </button>

            {isAddMenuOpen && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 9999,
                  minWidth: 190,
                  background: 'var(--cms-card-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 16,
                  padding: 6,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  animation: 'pmModalIn 0.2s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsServiceOrderModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(var(--cms-accent-rgb), 0.1)',
                    color: 'var(--cms-accent)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.1)'}
                >
                  <Sparkles size={15} color="var(--cms-accent)" />
                  <span>Pesanan Jasa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addProject(null, true, { type: 'project' });
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Target size={15} color="var(--cms-accent)" />
                  <span>Proyek Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addProject(null, true, { type: 'content' });
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Sparkles size={15} color="#ec4899" />
                  <span>Konten Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNewBookingOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Users size={15} color="#3b82f6" />
                  <span>Janji Temu</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* ── PM Design Tokens ── */
        .cms-projects-module {
          --pm-gap-xs: 4px;
          --pm-gap-sm: 8px;
          --pm-gap-md: 12px;
          --pm-gap-lg: 16px;
          --pm-gap-xl: 20px;
          --pm-gap-2xl: 24px;
          --pm-gap-3xl: 32px;
          --pm-radius-sm: 10px;
          --pm-radius-md: 14px;
          --pm-radius-lg: 20px;
          --pm-radius-xl: 24px;
          --pm-radius-2xl: 32px;
          --pm-pad-card: 16px;
          --pm-pad-section: 24px;
          --pm-t: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── Keyframe Animations ── */
        @keyframes pmFadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pmBulkBarIn {
          from { opacity: 0; transform: translate(-50%, 110%); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes pmModalIn {
          0% { opacity: 0; transform: scale(0.98) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pmCountdownPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        @keyframes pmColEnter {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Board Column Staggered Entrance ── */
        .pm-board-col { animation: pmColEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .pm-board-col:nth-child(1) { animation-delay: 0ms; }
        .pm-board-col:nth-child(2) { animation-delay: 60ms; }
        .pm-board-col:nth-child(3) { animation-delay: 120ms; }
        .pm-board-col:nth-child(4) { animation-delay: 180ms; }
        .pm-board-col:nth-child(5) { animation-delay: 240ms; }

        /* ── Board Card Hover ── */
        .pm-board-card { transition: var(--pm-t); }

        /* ── Countdown Urgent Pulse ── */
        .pm-countdown-urgent { animation: pmCountdownPulse 1.8s ease infinite; }

        /* ── Floating Bulk Action Bar ── */
        .pm-bulk-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translate(-50%, 0);
          z-index: 7000;
          background: var(--cms-card-bg, rgba(255,255,255,0.97));
          border: 1.5px solid var(--glass-border);
          border-radius: 100px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          animation: pmBulkBarIn 0.32s cubic-bezier(0.16,1,0.3,1) both;
          white-space: nowrap;
          max-width: calc(100vw - 40px);
        }

        /* ── Gallery Grid ── */
        .pm-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--pm-gap-2xl, 24px);
          padding: 8px 8px 24px;
        }

        /* ── Progress Range Input ── */
        .pm-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--cms-accent);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .pm-range::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--cms-accent);
          cursor: pointer;
          border: none;
        }
        .pm-range { appearance: none; -webkit-appearance: none; height: 5px; border-radius: 100px; outline: none; }

        /* ── Hide/Show Responsive ── */
        @media (max-width: 1024px) {
          .btn-label-text, .view-mode-label, .hide-tablet { display: none !important; }
          .show-tablet-mobile { display: flex !important; }
          .projects-view-mode-pill button { padding: 0 10px !important; }
        }
        @media (min-width: 1025px) {
          .show-tablet-mobile { display: none !important; }
        }

        /* ── MOBILE (≤768px) ── */
        @media (max-width: 768px) {
          .cms-projects-module {
            padding: 14px 14px 0 14px !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100vw !important;
            height: 100% !important;
            min-height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            --pm-pad-card: 14px;
            --pm-pad-section: 14px;
            --pm-gap-2xl: 14px;
          }
          .projects-top-header { margin-bottom: 10px !important; width: 100% !important; }
          .projects-stats-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .projects-stat-card {
            min-width: 0 !important; width: 100% !important;
            box-sizing: border-box !important; padding: 10px 6px !important;
            border-radius: 14px !important; flex-direction: column !important;
            align-items: center !important; justify-content: center !important; gap: 4px !important;
          }
          .stat-card-icon { width: 24px !important; height: 24px !important; }
          .stat-card-label { display: none !important; }
          .stat-card-val { font-size: 14px !important; font-weight: 900 !important; line-height: 1 !important; }
          .projects-actions-row {
            display: flex !important; flex-direction: row !important;
            align-items: center !important; justify-content: space-between !important;
            gap: 4px !important; width: 100% !important; max-width: 100% !important; margin-bottom: 10px !important; flex-wrap: nowrap !important;
          }
          .projects-view-mode-group { display: flex !important; align-items: center !important; gap: 4px !important; flex-shrink: 0 !important; }
          .projects-view-mode-group > div > button {
            height: 30px !important; padding: 0 9px !important; font-size: 11px !important; gap: 4px !important;
          }
          .projects-view-mode-group > button {
            width: 30px !important; height: 30px !important; min-width: 30px !important; min-height: 30px !important;
            max-width: 30px !important; max-height: 30px !important; padding: 0 !important; aspect-ratio: 1/1 !important; flex-shrink: 0 !important;
          }
          .projects-primary-actions-mobile { display: flex !important; align-items: center !important; justify-content: flex-end !important; gap: 4px !important; flex-shrink: 0 !important; }
          .projects-primary-actions-mobile > button,
          .projects-primary-actions-mobile > div > button {
            width: 30px !important; height: 30px !important; min-width: 30px !important; min-height: 30px !important;
            max-width: 30px !important; max-height: 30px !important; padding: 0 !important; aspect-ratio: 1/1 !important; flex-shrink: 0 !important;
          }
          .projects-primary-actions-mobile > button svg,
          .projects-primary-actions-mobile > div > button svg {
            width: 14px !important; height: 14px !important; min-width: 14px !important; min-height: 14px !important;
          }
          @media (max-width: 360px) {
            .projects-actions-row { gap: 3px !important; }
            .projects-view-mode-group { gap: 3px !important; }
            .projects-view-mode-group > div > button { height: 28px !important; padding: 0 7px !important; font-size: 10.5px !important; }
            .projects-view-mode-group > button,
            .projects-primary-actions-mobile > button,
            .projects-primary-actions-mobile > div > button {
              width: 28px !important; height: 28px !important; min-width: 28px !important; min-height: 28px !important;
              max-width: 28px !important; max-height: 28px !important;
            }
            .projects-primary-actions-mobile { gap: 3px !important; }
          }
          .projects-search-filters-wrapper {
            display: flex !important; flex-direction: column !important;
            align-items: stretch !important; width: 100% !important; gap: 8px !important; margin-bottom: 10px !important;
          }
          .projects-search-filters-wrapper > div:first-child { max-width: 100% !important; width: 100% !important; }
          .projects-filter-pills { 
            width: 100% !important; 
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            overflow-x: auto !important; 
            scrollbar-width: none !important; 
            padding: 4px 6px !important; 
            box-sizing: border-box !important; 
            gap: 4px !important;
          }
          .projects-filter-pills button {
            flex: 1 1 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 34px !important;
            padding: 0 !important;
          }
          .projects-board-wrapper { 
            margin: 0 !important; 
            width: 100% !important; 
            flex: 1 !important; 
            min-height: 0 !important; 
            display: flex !important; 
            flex-direction: column !important; 
            overflow: hidden !important; 
            box-sizing: border-box !important; 
          }
          .projects-scroll-area { 
            padding: 4px 2px calc(90px + env(safe-area-inset-bottom, 24px)) 2px !important; 
            overflow-y: auto !important; 
            -webkit-overflow-scrolling: touch !important; 
            width: 100% !important; 
            flex: 1 !important; 
            min-height: 0 !important; 
            box-sizing: border-box !important; 
          }
          .projects-board-container {
            flex-direction: column !important; height: auto !important;
            padding-bottom: 0 !important; box-sizing: border-box !important; width: 100% !important; gap: 14px !important;
          }
          .projects-board-container > .pm-board-col { 
            min-width: 0 !important; width: 100% !important; max-width: 100% !important; 
            box-sizing: border-box !important; margin: 0 !important; border-radius: 20px !important; 
            flex: none !important; min-height: auto !important;
          }
          .pm-gallery-grid { grid-template-columns: 1fr !important; gap: 14px !important; padding-bottom: 0 !important; }
          .pm-mobile-table-list { padding-bottom: 0 !important; }
          .projects-list-container { padding-bottom: 0 !important; }
          .pm-bulk-bar { bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important; padding: 8px 14px !important; gap: 8px !important; }
        }

        /* ── TABLET, SPLIT-SCREEN & MEDIUM SCREENS (769–1200px) ── */
        @media (min-width: 769px) and (max-width: 1200px) {
          .cms-projects-module {
            padding: 14px 16px 20px 16px !important;
            box-sizing: border-box !important;
            height: 100% !important;
            min-height: 100% !important;
            flex: 1 !important;
            --pm-pad-card: 14px;
            --pm-pad-section: 20px;
          }
          .projects-top-header { margin-bottom: 8px !important; width: 100% !important; }
          .projects-stats-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; width: 100% !important; }
          .projects-actions-row {
            display: flex !important; flex-direction: row !important;
            align-items: center !important; justify-content: space-between !important;
            gap: 8px !important; width: 100% !important; margin-bottom: 8px !important; flex-wrap: nowrap !important;
          }
          .projects-board-wrapper { margin: 0 !important; width: 100% !important; box-sizing: border-box !important; flex: 1 !important; display: flex !important; flex-direction: column !important; min-height: 0 !important; height: 100% !important; }
          .projects-scroll-area { padding: 4px 2px 14px 2px !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; width: 100% !important; flex: 1 !important; display: flex !important; flex-direction: column !important; box-sizing: border-box !important; min-height: 0 !important; }
          .projects-board-container { display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 12px !important; padding-bottom: 8px !important; width: 100% !important; flex: 1 !important; height: 100% !important; min-height: 0 !important; }
          .projects-board-container > .pm-board-col { min-width: 210px !important; flex: 1 1 0 !important; display: flex !important; flex-direction: column !important; height: 100% !important; min-height: 0 !important; box-sizing: border-box !important; }
          .pm-gallery-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important; gap: 14px !important; }
        }

        /* ── DESKTOP (≥1201px) ── */
        @media (min-width: 1201px) {
          .cms-projects-module { height: 100% !important; min-height: 100% !important; flex: 1 !important; }
          .projects-board-wrapper { margin: 0 !important; width: 100% !important; box-sizing: border-box !important; flex: 1 !important; display: flex !important; flex-direction: column !important; min-height: 0 !important; height: 100% !important; }
          .projects-scroll-area { overflow-x: auto !important; width: 100% !important; flex: 1 !important; display: flex !important; flex-direction: column !important; padding: 4px 2px 14px 2px !important; box-sizing: border-box !important; min-height: 0 !important; }
          .projects-board-container { display: flex !important; flex-direction: row !important; gap: 16px !important; width: 100% !important; min-width: 100% !important; flex: 1 !important; height: 100% !important; min-height: 0 !important; }
          .projects-board-container > .pm-board-col { min-width: 230px !important; flex: 1 1 0 !important; display: flex !important; flex-direction: column !important; height: 100% !important; min-height: 0 !important; box-sizing: border-box !important; }
        }
      `}</style>


      {/* ── BARIS 2: View Switcher (Kiri) & Actions / Filters (Kanan) ── */}
      <div className="projects-actions-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', marginBottom: 10, flexWrap: isMobile || isTablet ? 'nowrap' : 'nowrap' }}>
        {/* Sisi Kiri: View Mode Switcher + Pin */}
        <div className="projects-view-mode-group" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isMobile ? (
            <div style={{ position: 'relative' }}>
              <button
                ref={viewModeButtonRef}
                onClick={() => {
                  const rect = viewModeButtonRef.current?.getBoundingClientRect();
                  if (rect) {
                    const popupWidth = Math.min(322, window.innerWidth - 24);
                    const halfPopup = popupWidth / 2;
                    const margin = 12;
                    const rawX = rect.left + rect.width / 2;
                    const clampedX = Math.max(margin + halfPopup, Math.min(window.innerWidth - margin - halfPopup, rawX));
                    setViewModePopupPos({
                      x: clampedX,
                      y: rect.bottom + 8
                    });
                  }
                  setIsMobileModeMenuOpen(prev => !prev);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 36, padding: '0 12px', borderRadius: 100, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', cursor: 'pointer', transition: '0.2s', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 900 }}
              >
                {viewMode === 'board' ? <LayoutGrid size={14} color="var(--cms-accent)" /> :
                  viewMode === 'table' ? <Table size={14} color="var(--cms-accent)" /> :
                    viewMode === 'gallery' ? <ImageIcon size={14} color="var(--cms-accent)" /> :
                      viewMode === 'list' ? <List size={14} color="var(--cms-accent)" /> :
                        viewMode === 'schedule' ? <Calendar size={14} color="var(--cms-accent)" /> :
                          viewMode === 'timeline' ? <TrendingUp size={14} color="var(--cms-accent)" /> :
                            viewMode === 'analytics' ? <PieChart size={14} color="var(--cms-accent)" /> :
                              <Trash2 size={14} color="var(--cms-accent)" />}
                <span style={{ textTransform: 'capitalize' }}>{viewMode === 'schedule' ? 'Jadwal' : viewMode === 'timeline' ? 'Timeline' : viewMode}</span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
              </button>

              {isMobileModeMenuOpen && createPortal(
                <>
                  <div
                    onClick={() => setIsMobileModeMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'transparent' }}
                  />
                  <div
                    style={{
                      position: 'fixed',
                      left: viewModePopupPos.x,
                      top: viewModePopupPos.y,
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      flexDirection: 'row',
                      flexWrap: 'nowrap',
                      background: 'var(--cms-panel-bg, rgba(255,255,255,0.95))',
                      padding: 6,
                      borderRadius: 100,
                      gap: 6,
                      border: '1px solid var(--glass-border)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.1)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      zIndex: 99999,
                      animation: 'cmsFadeIn 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {[
                      { id: 'board', icon: <LayoutGrid size={16} />, label: 'Board' },
                      { id: 'table', icon: <Table size={16} />, label: 'Table' },
                      { id: 'gallery', icon: <ImageIcon size={16} />, label: 'Galeri' },
                      { id: 'list', icon: <List size={16} />, label: 'List' },
                      { id: 'schedule', icon: <Calendar size={16} />, label: 'Jadwal' },
                      { id: 'timeline', icon: <TrendingUp size={16} />, label: 'Timeline' },
                      { id: 'analytics', icon: <PieChart size={16} />, label: 'Analisis' },
                      { id: 'trash', icon: <Trash2 size={16} />, label: 'Sampah' }
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={(e) => { e.stopPropagation(); handleViewModeChange(v.id); }}
                        title={v.label}
                        style={{
                          width: 36, height: 36, border: 'none', borderRadius: '50%',
                          background: v.id === viewMode ? 'var(--cms-accent)' : 'transparent',
                          color: v.id === viewMode ? '#fff' : 'var(--cms-text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {v.icon}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
            </div>
          ) : (
            <div className="projects-view-mode-pill" style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              padding: '3px 4px',
              borderRadius: '100px',
              gap: '2px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: 'var(--cms-shadow-sm)'
            }}>
              {[
                { id: 'board', icon: <LayoutGrid size={14} />, label: 'Board' },
                { id: 'table', icon: <Table size={14} />, label: 'Table' },
                { id: 'gallery', icon: <ImageIcon size={14} />, label: 'Galeri' },
                { id: 'list', icon: <List size={14} />, label: 'List' },
                { id: 'schedule', icon: <Calendar size={14} />, label: 'Jadwal' },
                { id: 'timeline', icon: <TrendingUp size={14} />, label: 'Timeline' },
                { id: 'analytics', icon: <PieChart size={14} />, label: 'Analisis' },
                { id: 'trash', icon: <Trash2 size={14} />, label: 'Sampah' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => handleViewModeChange(v.id)}
                  title={v.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    padding: 0,
                    borderRadius: '50%',
                    border: 'none',
                    background: v.id === viewMode ? 'var(--cms-accent)' : 'transparent',
                    color: v.id === viewMode ? '#fff' : 'var(--cms-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    if (v.id !== viewMode) {
                      e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.08)';
                      e.currentTarget.style.color = 'var(--cms-text)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (v.id !== viewMode) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--cms-text-muted)';
                    }
                  }}
                >
                  {v.icon}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => { localStorage.setItem('porto_pm_view_mode', viewMode); notify(`📌 ${viewMode.toUpperCase()} set as default`); }}
            title="Set as Default View"
            style={{ width: 36, height: 36, border: '1.5px solid var(--glass-border)', borderRadius: '50%', background: 'var(--cms-card-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--cms-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--cms-text-muted)'}
          >
            <Pin size={14} />
          </button>
        </div>

        {/* Sisi Kanan (Desktop): Minimalist Search & Glass Status Filters */}
        {!isMobile && !isTablet && viewMode !== 'notes' && viewMode !== 'analytics' && viewMode !== 'trash' && (
          <div className="projects-search-filters-wrapper" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 200, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)', opacity: 0.6, pointerEvents: 'none' }} />
              <input
                placeholder="Cari project..."
                style={{
                  paddingLeft: 30, paddingRight: searchQuery ? 26 : 10, borderRadius: 100, height: 32,
                  background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', border: '1px solid var(--glass-border)',
                  width: '100%', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 600, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <div className="projects-filter-pills" style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: 'var(--cms-input-bg, rgba(255,255,255,0.04))',
              padding: '3px 4px', borderRadius: 100, border: '1px solid var(--glass-border)'
            }}>
              {[
                { id: 'all', label: 'Semua', icon: Layers },
                ...(pendingAccCount > 0 ? [{ id: 'pending_acc', label: `ACC (${pendingAccCount})`, icon: Clock, isAcc: true }] : []),
                { id: 'todo', label: 'Todo', icon: Clock },
                { id: 'progress', label: 'Proses', icon: Zap },
                { id: 'review', label: 'Review', icon: Eye },
                { id: 'done', label: 'Selesai', icon: CheckCircle2 }
              ].map(tab => {
                const IconComp = tab.icon;
                const isActive = activeBoardFilter === tab.id;
                const isAccTab = (tab as any).isAcc;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveBoardFilter(tab.id)}
                    title={tab.label}
                    aria-label={tab.label}
                    style={{
                      width: isAccTab && pendingAccCount > 0 ? 'auto' : 32,
                      padding: isAccTab && pendingAccCount > 0 ? '0 8px' : 0,
                      height: 28, borderRadius: 100, border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                      background: isActive ? (isAccTab ? '#f59e0b' : 'var(--cms-card-bg)') : (isAccTab ? 'rgba(245, 158, 11, 0.15)' : 'transparent'),
                      color: isActive ? (isAccTab ? '#fff' : 'var(--cms-text)') : (isAccTab ? '#b45309' : 'var(--cms-text-muted)'),
                      fontSize: 11, fontWeight: isActive || isAccTab ? 850 : 650, transition: 'all 0.15s ease', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      boxShadow: isActive ? 'var(--cms-shadow-sm)' : 'none', flexShrink: 0
                    }}
                  >
                    <IconComp size={14} style={{ color: isAccTab ? (isActive ? '#fff' : '#f59e0b') : (isActive ? 'var(--cms-accent)' : 'inherit'), opacity: isActive ? 1 : 0.75, flexShrink: 0 }} />
                    {isAccTab && pendingAccCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 900 }}>{pendingAccCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sisi Kanan (Tablet & Mobile): Primary Actions (5 Circular Actions) */}
        <div className="projects-primary-actions-mobile show-tablet-mobile" style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap', flexShrink: 0 }}>


          {/* 1. AI Planner Icon */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            title="Rancang Proyek dengan AI"
            style={{
              height: 36, width: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36, padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              color: 'var(--cms-accent)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
          >
            <Wand2 size={16} color="var(--cms-accent)" />
          </button>

          {/* 2. Settings Icon */}
          <button
            type="button"
            onClick={() => setIsScheduleSettingsOpen(true)}
            title="Pengaturan Kalender & Jadwal"
            style={{
              height: 36, width: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36, padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              color: 'var(--cms-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
          >
            <Settings2 size={16} />
          </button>

          {/* 3. Multi-Select Checkbox Icon */}
          <button
            onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds([]); }}
            title={isSelectionMode ? "Batal Mode Pilih" : "Mode Pilih (Multi-Select)"}
            className="selection-mode-btn"
            style={{
              height: 36, width: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: isSelectionMode ? '2px solid var(--cms-accent)' : '1.5px solid var(--glass-border)',
              background: isSelectionMode ? 'rgba(var(--cms-accent-rgb), 0.12)' : 'var(--cms-card-bg)',
              color: isSelectionMode ? 'var(--cms-accent)' : 'var(--cms-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
          >
            <CheckSquare size={15} strokeWidth={isSelectionMode ? 2.8 : 2} />
          </button>

          {/* 3.5. Service / Custom Order (ACC) Circular Icon */}
          <button
            type="button"
            onClick={() => setIsServiceOrderModalOpen(true)}
            title="Antrian & Pesanan Baru (Sistem ACC)"
            style={{
              height: 36, width: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid rgba(16,185,129,0.35)',
              background: 'rgba(16,185,129,0.1)',
              color: '#10b981', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
          >
            <Sparkles size={15} />
          </button>

          {/* 3.6. Visual Design Proofing Launcher */}
          <button
            type="button"
            onClick={() => handleOpenProofingManager()}
            title="Kelola & Kirim Gambar Proofing ke Klien"
            style={{
              height: 36, width: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36, aspectRatio: '1/1', padding: 0, boxSizing: 'border-box',
              borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.35)',
              background: 'rgba(6,182,212,0.1)',
              color: '#06b6d4', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: 'var(--cms-shadow-sm)'
            }}
          >
            <ShieldCheck size={15} />
          </button>

          {/* 4. Universal Plus Button with Popup Menu */}
          <div ref={addMenuMobileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="add-project-btn"
              title="Tambah Proyek, Konten, atau Janji Temu"
              style={{
                height: 36, width: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36, padding: 0, boxSizing: 'border-box',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--cms-accent)', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(var(--cms-accent-rgb), 0.3)', transition: 'all 0.2s ease', flexShrink: 0
              }}
            >
              <Plus size={20} strokeWidth={2.8} style={{ width: 20, height: 20, minWidth: 20, minHeight: 20, display: 'block', flexShrink: 0 }} />
            </button>

            {isAddMenuOpen && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 9999,
                  minWidth: 200,
                  background: 'var(--cms-card-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid var(--glass-border)',
                  borderRadius: 16,
                  padding: 6,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  animation: 'pmModalIn 0.2s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsServiceOrderModalOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(16,185,129,0.12)',
                    color: '#10b981',
                    fontSize: 12.5,
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <Sparkles size={15} color="#10b981" />
                  <div>
                    <div>+ Pesanan Jasa / Custom</div>
                    <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', fontWeight: 500 }}>Form brief, Doc/WA & ACC</div>
                  </div>
                </button>

                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button
                  type="button"
                  onClick={() => {
                    addProject(null, true, { type: 'project' });
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <Target size={15} color="var(--cms-accent)" />
                  <span>Proyek Regular</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    addProject(null, true, { type: 'content' });
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <Sparkles size={15} color="#ec4899" />
                  <span>Rencana Konten</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNewBookingOpen(true);
                    setIsAddMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <Users size={15} color="#3b82f6" />
                  <span>Janji Temu</span>
                </button>

                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    if (projects && projects.length > 0) {
                      handleOpenProofingManager(projects[0]);
                    } else {
                      window.open('/proofing', '_blank');
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(6,182,212,0.1)',
                    color: '#06b6d4',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <ShieldCheck size={15} color="#06b6d4" />
                  <span>Pratinjau Proofing Desain</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-row (Mobile & Tablet): Minimalist Search & Filter Pills */}
      {(isMobile || isTablet) && viewMode !== 'notes' && viewMode !== 'analytics' && viewMode !== 'trash' && (
        <div className="projects-search-filters-wrapper" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 6, width: '100%', marginBottom: 8, alignItems: isTablet ? 'center' : 'stretch' }}>
          <div style={{ flex: isTablet ? 1 : 'none', width: isTablet ? 'auto' : '100%', position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)', opacity: 0.6, pointerEvents: 'none' }} />
            <input
              placeholder="Cari project..."
              style={{
                paddingLeft: 32, paddingRight: searchQuery ? 28 : 12, borderRadius: 100, height: 32,
                background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', border: '1px solid var(--glass-border)',
                width: '100%', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 600, outline: 'none', boxSizing: 'border-box'
              }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
              >
                <X size={11} />
              </button>
            )}
          </div>
          <div className="projects-filter-pills" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            background: 'var(--cms-input-bg, rgba(255,255,255,0.04))',
            padding: '4px 6px', borderRadius: 100, border: '1px solid var(--glass-border)',
            overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none', width: '100%', boxSizing: 'border-box'
          }}>
            {[
              { id: 'all', label: 'Semua Status', icon: Layers },
              ...(pendingAccCount > 0 ? [{ id: 'pending_acc', label: `ACC (${pendingAccCount})`, icon: Clock, isAcc: true }] : []),
              { id: 'todo', label: 'Todo', icon: Clock },
              { id: 'progress', label: 'Proses', icon: Zap },
              { id: 'review', label: 'Review', icon: Eye },
              { id: 'done', label: 'Selesai', icon: CheckCircle2 }
            ].map(tab => {
              const IconComp = tab.icon;
              const isActive = activeBoardFilter === tab.id;
              const isAccTab = (tab as any).isAcc;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveBoardFilter(tab.id)}
                  title={tab.label}
                  style={{
                    flex: 1, height: 34, borderRadius: 100, border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                    background: isActive ? (isAccTab ? '#f59e0b' : 'var(--cms-card-bg)') : (isAccTab ? 'rgba(245, 158, 11, 0.15)' : 'transparent'),
                    color: isActive ? (isAccTab ? '#fff' : 'var(--cms-accent)') : (isAccTab ? '#b45309' : 'var(--cms-text-muted)'),
                    transition: 'all 0.15s ease', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: isActive ? 'var(--cms-shadow-sm)' : 'none',
                    padding: 0
                  }}
                >
                  <IconComp size={16} style={{ color: isAccTab ? (isActive ? '#fff' : '#f59e0b') : (isActive ? 'var(--cms-accent)' : 'inherit'), opacity: isActive ? 1 : 0.65, strokeWidth: isActive ? 2.6 : 2, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>

        {/* ── Smart Reminders & Action Bar for Service Orders, ACC & Deadlines ── */}
        <ProjectRemindersBar
          projects={projects}
          onProjectUpdated={() => {
            storage.getItem('porto_projects', []).then(saved => {
              if (Array.isArray(saved)) setProjects(saved);
            });
          }}
          notify={notify}
          confirm={confirmFn}
          onOpenServiceOrderModal={() => setIsServiceOrderModalOpen(true)}
          onSelectProject={proj => setSelectedProject(proj)}
        />

        <div className="projects-board-wrapper" style={{ flex: 1, display: 'flex', gap: 16, margin: 0, minHeight: 0, width: '100%', height: '100%' }}>
          <div className="projects-scroll-area" style={{ flex: 1, height: '100%', overflow: 'auto', padding: isMobile ? '4px 2px calc(95px + env(safe-area-inset-bottom, 24px)) 2px' : '4px 2px 2px 2px', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {viewMode === 'board' ? (
              <BoardView projects={filteredProjects} draggingId={draggingId} dragOverCol={dragOverCol} onSelect={setSelectedProject} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} addProject={addProject} isSelectionMode={isSelectionMode} selectedIds={selectedIds} toggleSelection={toggleSelection} updateProject={updateProject} removeProject={removeProject} handleSendAssetDropLinkForProject={handleSendAssetDropLinkForProject} handleCreateInvoiceForProject={handleCreateInvoiceForProject} />
            ) : viewMode === 'table' ? (
              <TableView projects={filteredProjects} onSelect={setSelectedProject} updateProject={updateProject} toggleSelection={toggleSelection} selectedIds={selectedIds} bulkDelete={bulkDelete} bulkStatusUpdate={bulkStatusUpdate} isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode} />
            ) : viewMode === 'gallery' ? (
              <GalleryView projects={filteredProjects} onSelect={setSelectedProject} isSelectionMode={isSelectionMode} selectedIds={selectedIds} toggleSelection={toggleSelection} updateProject={updateProject} addProject={addProject} removeProject={removeProject} />
            ) : viewMode === 'list' ? (
              <ListView projects={filteredProjects} onSelect={setSelectedProject} isSelectionMode={isSelectionMode} selectedIds={selectedIds} toggleSelection={toggleSelection} updateProject={updateProject} addProject={addProject} removeProject={removeProject} />
            ) : viewMode === 'schedule' ? (
              <ScheduleAndBookingView projects={projects} onSelect={setSelectedProject} notify={notify} addProject={addProject} saveProjects={saveProjects} />
            ) : viewMode === 'timeline' ? (
              <TimelineGanttView projects={filteredProjects} onSelect={setSelectedProject} updateProject={updateProject} />
            ) : viewMode === 'notes' ? (
              <StickyNotesBoard stickyNotes={stickyNotes} saveNotes={saveNotes} />
            ) : viewMode === 'trash' ? (
              <TrashView
                projects={filteredProjects}
                restoreProject={restoreProject}
                permanentDeleteProject={permanentDeleteProject}
                bulkDelete={bulkDelete}
                toggleSelection={toggleSelection}
                selectedIds={selectedIds}
              />
            ) : (
              <AnalyticsView projects={filteredProjects} onSelect={setSelectedProject} updateProject={updateProject} />
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Bulk Action Bar ── */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="pm-bulk-bar">
          <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-text-muted)', paddingRight: 8, borderRight: '1px solid var(--glass-border)', flexShrink: 0 }}>
            {selectedIds.length} dipilih
          </span>
          <select
            onChange={(e) => { if (e.target.value) { bulkStatusUpdate(e.target.value); e.target.value = ''; } }}
            style={{ background: 'var(--cms-input-bg)', color: 'var(--cms-text)', border: '1px solid var(--glass-border)', padding: '5px 10px', borderRadius: 100, fontSize: 11, fontWeight: 800, outline: 'none', cursor: 'pointer', maxWidth: 130 }}
          >
            <option value="">Pindah ke...</option>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button
            onClick={bulkDelete}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            <Trash2 size={13} /> Trash
          </button>
          <button
            onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text-muted)', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}
          >
            <X size={13} /> Batal
          </button>
        </div>
      )}

      {selectedProject && (
        <ProjectPillModal
          project={selectedProject} onClose={() => setSelectedProject(null)}
          updateProject={updateProject} removeProject={removeProject}
          activeTab={modalTab} setActiveTab={setModalTab}
          handleFileUpload={handleFileUpload} isUploading={isUploading}
          handleCreateInvoiceForProject={handleCreateInvoiceForProject}
          notify={notify} projects={projects}
          addProject={addProject} setSelectedProject={setSelectedProject}
        />
      )}

      {/* ── CLIENT PROOFING & WATERMARK MODAL (GLOBAL LAUNCHER) ── */}
      {isGlobalProofingOpen && proofingTargetProject && (
        <ProjectProofingModal
          isOpen={isGlobalProofingOpen}
          onClose={() => setIsGlobalProofingOpen(false)}
          project={proofingTargetProject}
          updateProject={(id, data) => {
            updateProject(id, data);
            setProofingTargetProject((prev: any) => prev ? { ...prev, ...data } : null);
          }}
          notify={notify}
        />
      )}

      {/* ── SERVICE ORDER (JASA & CUSTOM) MODAL ── */}
      {isServiceOrderModalOpen && (
        <ServiceOrderModal
          isOpen={isServiceOrderModalOpen}
          onClose={() => setIsServiceOrderModalOpen(false)}
          notify={notify}
        />
      )}

      {/* ── PROJECT & SCHEDULE SETTINGS MODAL ── */}
      <ProjectAndScheduleSettingsModal
        isOpen={isScheduleSettingsOpen}
        onClose={() => setIsScheduleSettingsOpen(false)}
        projects={projects}
        saveProjects={saveProjects}
        notify={notify}
      />

      {/* ── AI PROJECT PLANNER MODAL ── */}
      {/* ── REDESIGNED UNIFIED AI & TEMPLATE PLANNER MODAL ── */}
      {isAiModalOpen && createPortal(
        <div
          onClick={() => !isAiGenerating && setIsAiModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483640,
            background: isMobile ? 'var(--cms-panel-bg, var(--cms-bg))' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
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
            style={{
              width: isMobile ? '100vw' : '900px',
              maxWidth: isMobile ? '100vw' : '96vw',
              height: isMobile ? '100dvh' : 'auto',
              maxHeight: isMobile ? '100dvh' : '88vh',
              background: 'var(--cms-panel-bg, #1a1a2e)',
              border: isMobile ? 'none' : '1.5px solid var(--glass-border)',
              borderRadius: isMobile ? 0 : 24,
              boxShadow: isMobile ? 'none' : '0 25px 70px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxSizing: 'border-box'
            }}
          >
            {/* Header Planner */}
            <div style={{
              padding: '12px 18px',
              borderBottom: '1.5px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: plannerMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {plannerMode === 'ai' ? <Sparkles size={16} /> : <Zap size={16} />}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 950, color: 'var(--cms-text)' }}>
                    {plannerMode === 'ai' ? 'AI Smart Project & Content Planner' : 'Template Library Instan (100+ Template)'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 1 }}>
                    {plannerMode === 'ai'
                      ? 'Kombinasi AI Gemini online & 100+ Preset lokal 0ms offline'
                      : 'Generate struktur proyek & naskah konten lengkap tanpa kuota'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div style={{
              padding: isMobile ? 12 : 16,
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {/* 1. TOP SWITCHER: PILIH MODE */}
              <div style={{
                padding: '8px 12px',
                borderRadius: 12,
                background: 'var(--cms-input-bg)',
                border: '1.5px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: plannerMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    boxShadow: plannerMode === 'ai' ? '0 0 8px var(--cms-accent)' : '0 0 8px #10b981'
                  }} />
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--cms-text)' }}>
                    Mode: {plannerMode === 'ai' ? 'Kreativitas Fleksibel AI Gemini' : 'Template Instan (0ms Tanpa Kuota)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setPlannerMode(prev => prev === 'ai' ? 'offline' : 'ai')}
                  style={{
                    width: 46,
                    height: 24,
                    borderRadius: 100,
                    border: '1.5px solid var(--glass-border)',
                    background: plannerMode === 'ai' ? 'var(--cms-accent-soft)' : 'rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                    outline: 'none'
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: plannerMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: plannerMode === 'ai' ? 'translateX(24px)' : 'translateX(3px)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
                  }}>
                    {plannerMode === 'ai' ? <Sparkles size={10} /> : <Zap size={10} />}
                  </div>
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* MODE 1: TEMPLATE INSTAN                                      */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {plannerMode === 'offline' && (() => {
                const allTemplates = [...customProjectTemplates, ...OFFLINE_PROJECT_TEMPLATES];
                const currentTemplate = allTemplates.find(t => t.id === aiTemplateType) || allTemplates[0];
                const baseCategories = [
                  { id: 'all', label: 'Semua' },
                  ...(customProjectTemplates.length > 0 ? [{ id: 'custom', label: '⭐ Kustom' }] : []),
                  { id: 'content', label: '📢 Konten Medsos' },
                  { id: 'design', label: 'Desain' },
                  { id: 'web', label: 'Web / App' },
                  { id: 'business', label: 'Bisnis' },
                  { id: 'marketing', label: 'Marketing' },
                  ...customProjectCategories
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
                              Preview: {currentTemplate.label}
                            </span>
                            {currentTemplate.id.startsWith('custom_') && (
                              <span style={{ fontSize: 8.5, fontWeight: 850, padding: '1px 5px', borderRadius: 4, background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', flexShrink: 0 }}>
                                ⭐ KUSTOM
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 5, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                              {currentTemplate.estimatedDays} Hari
                            </span>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 5, background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)' }}>
                              {currentTemplate.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', lineHeight: 1.4 }}>
                          {currentTemplate.description}
                        </div>

                        {/* Subtasks Preview Checklist */}
                        {currentTemplate.tasks && currentTemplate.tasks.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 1 }}>
                            <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <ListTodo size={11} color="#10b981" /> Rencana Subtasks ({currentTemplate.tasks.length}):
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                              gap: 3,
                              maxHeight: isMobile ? 68 : 80,
                              overflowY: 'auto'
                            }}>
                              {currentTemplate.tasks.map((taskText, idx) => (
                                <div key={idx} style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  padding: '3px 6px', borderRadius: 5,
                                  background: 'var(--cms-input-bg)',
                                  fontSize: 10, color: 'var(--cms-text)'
                                }}>
                                  <CheckCircle2 size={10} color="#10b981" style={{ flexShrink: 0 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{taskText}</span>
                                </div>
                              ))}
                            </div>
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
                            placeholder="Cari template proyek..."
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
                              onClick={() => setAiCategoryFilter(cat.id)}
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
                        .filter(tmpl => {
                          const isCustom = tmpl.id.startsWith('custom_');
                          let matchesCategory = true;
                          if (aiCategoryFilter === 'custom') {
                            matchesCategory = isCustom;
                          } else if (aiCategoryFilter !== 'all') {
                            matchesCategory = tmpl.category === aiCategoryFilter;
                          }
                          const matchesSearch = !aiSearchQuery.trim() ||
                            tmpl.label.toLowerCase().includes(aiSearchQuery.toLowerCase()) ||
                            tmpl.title.toLowerCase().includes(aiSearchQuery.toLowerCase()) ||
                            (tmpl.tags || []).some(t => t.toLowerCase().includes(aiSearchQuery.toLowerCase()));
                          return matchesCategory && matchesSearch;
                        })
                        .map(tmpl => {
                          const isSelected = aiTemplateType === tmpl.id;
                          const isCustom = tmpl.id.startsWith('custom_');
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => handleSelectAiTemplate(tmpl)}
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
                                {renderProjectIcon(tmpl.icon, 14)}
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
                                  {tmpl.tasks?.length || 0} subtasks • {tmpl.estimatedDays || 14} hari
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
              {plannerMode === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  {/* Quick Chips Topik */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={11} color="var(--cms-accent)" /> Rekomendasi Topik Cepat:
                    </div>
                    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                      {[
                        'Brand Identity & Logo Guideline',
                        'Website Portfolio Interaktif',
                        'UI/UX Mobile App Figma to Code',
                        'Kampanye Iklan Digital & SOP Konten'
                      ].map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiPrompt(sug)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: 100,
                            border: '1px solid var(--glass-border)',
                            background: 'var(--cms-input-bg)',
                            color: 'var(--cms-text)',
                            fontSize: 10.5,
                            fontWeight: 650,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea Instruksi */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)' }}>
                        Instruksi / Brief Proyek:
                      </label>
                      <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                        Detailkan cakupan & durasi
                      </span>
                    </div>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Contoh: Rancang proyek redesain brand agensi kreatif mencakup discovery brief, riset kompetitor, 3 opsi logo, brand guideline PDF, dan asset medsos..."
                      rows={4}
                      style={{
                        width: '100%',
                        background: 'var(--cms-input-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: 12,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: 'var(--cms-text)',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {aiError && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <AlertCircle size={13} />
                      <span>{aiError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Buttons (Sticky di Bawah) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              padding: isMobile ? '10px 14px' : '12px 20px',
              borderTop: '1px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isAiGenerating}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text)',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>

              {plannerMode === 'offline' ? (
                <button
                  type="button"
                  onClick={(e) => handleGenerateAiProjectSubmit(e, true)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Zap size={14} />
                  <span>Terapkan Template</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleGenerateAiProjectSubmit(e, false)}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 10,
                    border: 'none',
                    background: isAiGenerating || !aiPrompt.trim() ? 'var(--cms-input-bg)' : 'var(--cms-accent)',
                    color: isAiGenerating || !aiPrompt.trim() ? 'var(--cms-text-muted)' : '#fff',
                    fontSize: 12,
                    fontWeight: 850,
                    cursor: isAiGenerating || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: isAiGenerating || !aiPrompt.trim() ? 'none' : '0 4px 14px var(--cms-accent-soft)'
                  }}
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 size={14} className="pm-spin" />
                      <span>Merancang Proyek...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Rancang Proyek AI</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CREATE CUSTOM PROJECT TEMPLATE MODAL ── */}
      {isCreatingCustomTemplate && createPortal(
        <div
          onClick={() => setIsCreatingCustomTemplate(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483645,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
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
                <span>Buat Template Proyek Baru</span>
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
                  Nama / Judul Template *
                </label>
                <input
                  type="text"
                  value={newTemplateForm.label}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, label: e.target.value })}
                  placeholder="Contoh: Redesain Brand & Sosmed"
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
                      { value: 'web', label: 'Web / App' },
                      { value: 'business', label: 'Bisnis' },
                      { value: 'marketing', label: 'Marketing' },
                      ...customProjectCategories.map(c => ({ value: c.id, label: c.label }))
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Prioritas
                  </label>
                  <CustomDropdown
                    value={newTemplateForm.priority}
                    onChange={(val) => setNewTemplateForm({ ...newTemplateForm, priority: val as any })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Estimasi Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newTemplateForm.estimatedDays}
                    onChange={e => setNewTemplateForm({ ...newTemplateForm, estimatedDays: Number(e.target.value) })}
                    style={{
                      width: '100%', height: 38, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 10, padding: '0 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Deskripsi Template
                </label>
                <textarea
                  rows={2}
                  value={newTemplateForm.description}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, description: e.target.value })}
                  placeholder="Ringkasan atau panduan alur proyek..."
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', resize: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Daftar Subtasks (1 baris per subtask)
                </label>
                <textarea
                  rows={4}
                  value={newTemplateForm.tasks}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, tasks: e.target.value })}
                  placeholder="Discovery & brief klien&#10;Riset & moodboard visual&#10;Eksplorasi 3 opsi desain&#10;Penyusunan file master"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5
                  }}
                />
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

    </div>
  );
};

// ---------------------------------------------------------
// VIEWS
// ---------------------------------------------------------

const BoardView = ({ projects, draggingId, dragOverCol, onSelect, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, addProject, isSelectionMode, selectedIds, toggleSelection, updateProject, removeProject, handleSendAssetDropLinkForProject, handleCreateInvoiceForProject }: any) => {
  const isDraggingRef = useRef(false);
  const [statusMenuProjId, setStatusMenuProjId] = useState(null);
  const { bindContextMenu } = useContextMenu();

  const getProjectMenu = (proj) => ({
    title: getSafeString(proj.title) || 'Proyek',
    subtitle: `Status: ${STATUSES.find(s => s.id === proj.status)?.label || proj.status}`,
    headerBadge: proj.priority ? `${proj.priority}` : undefined,
    items: [
      {
        label: 'Buka & Edit Detail',
        icon: <Edit3 size={15} />,
        action: () => onSelect(proj)
      },
      {
        label: 'Tandai Selesai (Done)',
        icon: <CheckCircle2 size={15} color="#10b981" />,
        action: () => updateProject(proj.id, { status: 'done', progress: 100 })
      },
      {
        label: 'Pindah ke In Progress',
        icon: <Zap size={15} color="#6366f1" />,
        action: () => updateProject(proj.id, { status: 'progress' })
      },
      ...(proj.link ? [{
        label: 'Buka Tautan Demo',
        icon: <ExternalLink size={15} />,
        action: () => window.open(proj.link, '_blank')
      }] : []),
      {
        label: 'Duplikasi Proyek',
        icon: <Copy size={15} />,
        action: () => addProject({ ...proj, id: `PRJ-${Date.now()}`, title: `${proj.title || 'Project'} (Copy)` })
      },
      { separator: true },
      {
        label: 'Pindahkan ke Sampah',
        icon: <Trash2 size={15} />,
        danger: true,
        action: () => removeProject(proj.id)
      }
    ]
  });

  const handleCardDragStart = (e, projId) => {
    isDraggingRef.current = true;
    e.dataTransfer.setData('text/plain', projId);
    e.dataTransfer.setData('projectId', projId);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, projId);
  };

  const handleCardDragEnd = () => {
    onDragEnd();
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleCardClick = (proj, isSelected) => {
    if (isDraggingRef.current) return;
    if (isSelectionMode) {
      toggleSelection(proj.id, !isSelected);
    } else {
      onSelect(proj);
    }
  };

  return (
    <div className="projects-board-container" style={{ display: 'flex', gap: 16, width: '100%', minHeight: '100%', height: '100%', flex: 1, paddingBottom: 0, boxSizing: 'border-box' }}>
      {STATUSES.map(col => {
        const colProjects = projects.filter(p => p.status === col.id);
        const isColumnActive = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            className="pm-board-col"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              onDragOver(e, col.id);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              onDragOver(e, col.id);
            }}
            onDragLeave={(e) => onDragLeave(e, col.id)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDrop(e, col.id);
            }}
            style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
              background: isColumnActive ? `${col.color}12` : 'var(--cms-input-bg)',
              borderRadius: 22, padding: '16px 14px 16px 14px',
              border: isColumnActive ? `2px dashed ${col.color}` : `1.5px solid ${col.color}28`,
              borderTop: `3.5px solid ${col.color}`,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              height: '100%',
              minHeight: 'calc(100vh - 240px)',
              boxSizing: 'border-box'
            }}
          >
            {/* Column Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, boxShadow: `0 0 8px ${col.color}80`, flexShrink: 0 }} />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{col.label}</h3>
                <span style={{ background: col.bg || `${col.color}18`, color: col.color, fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 100, border: `1px solid ${col.color}33`, minWidth: 22, textAlign: 'center' }}>
                  {colProjects.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => addProject()}
                title={`Add to ${col.label}`}
                style={{
                  width: 28, height: 28, minWidth: 28, minHeight: 28,
                  aspectRatio: '1/1', borderRadius: '50%',
                  background: `${col.color}18`, border: `1.5px solid ${col.color}33`,
                  color: col.color, cursor: 'pointer', transition: '0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, padding: 0, boxSizing: 'border-box'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = col.color; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${col.color}18`; e.currentTarget.style.color = col.color; }}
              >
                <Plus size={14} strokeWidth={2.8} style={{ flexShrink: 0 }} />
              </button>
            </div>

            {/* Column Content */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                onDragOver(e, col.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDrop(e, col.id);
              }}
              style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 2px 14px 2px', boxSizing: 'border-box' }}
            >
              {colProjects.map(proj => {
                const isSelected = selectedIds && selectedIds.includes(proj.id);
                const isStatusMenuOpen = statusMenuProjId === proj.id;

                return (
                  <div
                    key={proj.id}
                    draggable={!isSelectionMode}
                    onDragStart={(e) => handleCardDragStart(e, proj.id)}
                    onDragEnd={handleCardDragEnd}
                    onClick={() => handleCardClick(proj, isSelected)}
                    {...bindContextMenu(() => getProjectMenu(proj))}
                    style={{
                      position: 'relative',
                      background: 'var(--cms-card-bg)', borderRadius: 16, padding: '14px 14px 14px 14px',
                      cursor: isSelectionMode ? 'pointer' : 'grab', display: 'flex', flexDirection: 'column', gap: 10,
                      border: draggingId === proj.id ? `3px solid ${col.color}` : isSelected ? '2px solid var(--cms-accent)' : '1.5px solid var(--glass-border)',
                      boxShadow: draggingId === proj.id ? 'none !important' : isSelected ? '0 12px 30px rgba(var(--cms-accent-rgb), 0.15)' : '0 4px 16px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      opacity: draggingId === proj.id ? 0.35 : 1,
                      backdropFilter: draggingId === proj.id ? 'none' : 'blur(20px)',
                      transform: draggingId === proj.id ? 'scale(0.96)' : 'none',
                      userSelect: 'none',
                      zIndex: isStatusMenuOpen ? 50 : 1,
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={e => {
                      if (draggingId || isSelected) return;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.07)';
                      e.currentTarget.style.borderColor = col.color;
                    }}
                    onMouseLeave={e => {
                      if (draggingId || isSelected) return;
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.03)';
                      e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                  >
                    {isSelectionMode && (
                      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          border: isSelected ? '2px solid var(--cms-accent)' : '2px solid var(--glass-border)',
                          background: isSelected ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                        </div>
                      </div>
                    )}

                    {/* Top Row: Tags & Quick Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, minWidth: 0, flex: 1 }}>
                        {proj.priority === 'high' && <span style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontSize: 10, fontWeight: 900, padding: '3px 7px', borderRadius: 7, whiteSpace: 'nowrap' }}>Urgent</span>}
                        {getSafeArray(proj.tags).slice(0, 2).map((tag, i) => (
                          <span key={i} style={{ background: col.bg || 'var(--cms-input-bg)', color: col.color || 'var(--cms-text)', fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 7, whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tag}</span>
                        ))}
                      </div>

                      {/* Quick Status Dropdown & Trash Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setStatusMenuProjId(isStatusMenuOpen ? null : proj.id)}
                          title="Ubah Status Proyek"
                          style={{
                            padding: '3px 8px', borderRadius: 100, border: `1px solid ${col.color}40`,
                            background: `${col.color}15`, color: col.color, fontSize: 10.5, fontWeight: 850,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color }} />
                          <span>{col.label}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendAssetDropLinkForProject(proj);
                          }}
                          title="Kirim Magic Link Asset Drop (/drop) via WhatsApp"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--cms-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#0ea5e9';
                            e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--cms-text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Upload size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateInvoiceForProject(proj);
                          }}
                          title="Buat Invoice DP / Pelunasan"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--cms-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#8b5cf6';
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--cms-text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Receipt size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeProject(proj.id);
                          }}
                          title="Pindahkan ke Sampah"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--cms-text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--cms-text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={12} />
                        </button>

                        {isStatusMenuOpen && (
                          <>
                            <div
                              onClick={(e) => { e.stopPropagation(); setStatusMenuProjId(null); }}
                              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                            />
                            <div style={{
                              position: 'absolute', right: 0, top: 'calc(100% + 5px)', zIndex: 9999,
                              background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                              borderRadius: 14, boxShadow: '0 16px 36px rgba(0,0,0,0.3)', padding: 6,
                              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                              display: 'flex', flexDirection: 'column', gap: 3, minWidth: 140,
                              animation: 'simpleCardFade 0.15s ease-out'
                            }}>
                              <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--cms-text-muted)', padding: '4px 8px 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Status
                              </div>
                              {STATUSES.map(st => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateProject(proj.id, { status: st.id });
                                    setStatusMenuProjId(null);
                                  }}
                                  style={{
                                    padding: '7px 10px', borderRadius: 9, border: 'none',
                                    background: proj.status === st.id ? `${st.color}20` : 'transparent',
                                    color: proj.status === st.id ? st.color : 'var(--cms-text)',
                                    fontSize: 11.5, fontWeight: proj.status === st.id ? 850 : 650,
                                    cursor: 'pointer', textAlign: 'left',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    transition: 'background 0.12s ease'
                                  }}
                                  onMouseOver={e => { if (proj.status !== st.id) e.currentTarget.style.background = 'var(--cms-input-bg)'; }}
                                  onMouseOut={e => { if (proj.status !== st.id) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color }} />
                                    <span>{st.label}</span>
                                  </div>
                                  {proj.status === st.id && <Check size={13} color={st.color} strokeWidth={3} />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Icon + Title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, minWidth: 36, borderRadius: 10,
                        background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: col.color || 'var(--cms-accent)', flexShrink: 0, marginTop: 1
                      }}>
                        {renderProjectIcon(proj.icon, 18, { color: col.color || 'var(--cms-accent)' })}
                      </div>
                      <h4 style={{
                        fontSize: 13.5, fontWeight: 850, margin: 0,
                        color: 'var(--cms-text)', lineHeight: 1.35, flex: 1, minWidth: 0,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden', wordBreak: 'break-word'
                      }}>
                        {getSafeString(proj.title) || 'Untitled'}
                      </h4>
                    </div>

                    {/* Client & Service/Brief Badges */}
                    {(proj.client || proj.googleDocUrl || proj.briefMode || proj.clientType) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                        {proj.client && (
                          <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', fontWeight: 700 }}>
                            👤 {proj.client}
                          </span>
                        )}
                        {proj.clientType === 'reseller' && (
                          <span style={{ fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4, background: '#f3e8ff', color: '#7e22ce' }}>
                            🤝 RESELLER
                          </span>
                        )}
                        {proj.googleDocUrl && (
                          <a
                            href={normalizeGoogleDocUrl(proj.googleDocUrl)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Buka Dokumen Google Doc"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', textDecoration: 'none' }}
                          >
                            <FileText size={10} /> Doc
                          </a>
                        )}
                        {proj.briefMode === 'whatsapp' && (
                          <span title="Opsi penjelasan brief via WhatsApp" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.12)', color: '#15803d' }}>
                            <MessageCircle size={10} /> WA Brief
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Progress Ring + Countdown + Team */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTop: '1px dashed var(--glass-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        {getSafeArray(proj.tasks).length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--cms-text-muted)', fontSize: 10.5, fontWeight: 800, flexShrink: 0 }}>
                            <CheckCircle2 size={11} />
                            <span>{proj.tasks.filter(t => t?.done).length}/{getSafeArray(proj.tasks).length}</span>
                          </div>
                        )}
                        {(() => {
                          const info = getDeadlineInfo(proj.deadline, proj.status);
                          if (!info) return null;
                          return (
                            <div
                              className={info.urgent ? 'pm-countdown-urgent' : ''}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontWeight: 900, color: info.color, background: `${info.color}14`, padding: '2px 6px', borderRadius: 100, flexShrink: 0, whiteSpace: 'nowrap' }}
                            >
                              <Clock size={9} />
                              {info.label}
                            </div>
                          );
                        })()}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 6 }}>
                        <ProgressRing progress={getSafeProgress(proj.progress)} size={28} color={col.color} />
                        {getSafeArray(proj.team).slice(0, 2).map((tm, idx) => (
                          <div key={idx} title={tm?.name} style={{ width: 20, height: 20, borderRadius: '50%', background: tm?.color || 'var(--cms-accent, #8b5cf6)', border: '2px solid var(--cms-card-bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, marginLeft: idx > 0 ? -6 : 0, zIndex: 3 - idx, flexShrink: 0 }}>
                            {tm?.name ? tm.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        ))}
                        {getSafeArray(proj.team).length > 2 && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--cms-input-bg)', border: '2px solid var(--cms-card-bg)', color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, marginLeft: -6, flexShrink: 0 }}>
                            +{getSafeArray(proj.team).length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── Per-Column Empty State ── */}
              {colProjects.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', color: 'var(--cms-text-muted)', minHeight: 120 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${col.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: col.color, marginBottom: 10 }}>
                    {col.id === 'todo' ? <ListTodo size={22} strokeWidth={2.2} /> :
                      col.id === 'progress' ? <Zap size={22} strokeWidth={2.2} /> :
                        col.id === 'review' ? <Eye size={22} strokeWidth={2.2} /> :
                          col.id === 'hold' ? <Clock size={22} strokeWidth={2.2} /> :
                            <CheckCircle2 size={22} strokeWidth={2.2} />}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: col.color, marginBottom: 3 }}>
                    {col.id === 'done' ? 'All complete!' : `No ${col.label}`}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, textAlign: 'center', lineHeight: 1.4 }}>
                    {col.id === 'done' ? 'Completed tasks appear here' : 'Drag & drop or use +'}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GalleryView = ({ projects, onSelect, isSelectionMode, selectedIds, toggleSelection, updateProject, addProject, removeProject }) => {
  const { bindContextMenu } = useContextMenu();

  const getProjectMenu = (proj) => ({
    title: getSafeString(proj.title) || 'Proyek',
    subtitle: `Status: ${STATUSES.find(s => s.id === proj.status)?.label || proj.status}`,
    headerBadge: proj.priority ? `${proj.priority}` : undefined,
    items: [
      {
        label: 'Buka & Edit Detail',
        icon: <Edit3 size={15} />,
        action: () => onSelect(proj)
      },
      {
        label: 'Tandai Selesai (Done)',
        icon: <CheckCircle2 size={15} color="#10b981" />,
        action: () => updateProject(proj.id, { status: 'done', progress: 100 })
      },
      ...(proj.link ? [{
        label: 'Buka Tautan Demo',
        icon: <ExternalLink size={15} />,
        action: () => window.open(proj.link, '_blank')
      }] : []),
      {
        label: 'Duplikasi Proyek',
        icon: <Copy size={15} />,
        action: () => addProject({ ...proj, id: `PRJ-${Date.now()}`, title: `${proj.title || 'Project'} (Copy)` })
      },
      { separator: true },
      {
        label: 'Pindahkan ke Sampah',
        icon: <Trash2 size={15} />,
        danger: true,
        action: () => removeProject ? removeProject(proj.id) : updateProject(proj.id, { isTrash: true })
      }
    ]
  });

  return (
    <div className="pm-gallery-grid">
      {projects.map(proj => {
        const isSelected = selectedIds && selectedIds.includes(proj.id);
        return (
          <div
            key={proj.id}
            onClick={() => isSelectionMode ? toggleSelection(proj.id, !isSelected) : onSelect(proj)}
            {...bindContextMenu(() => getProjectMenu(proj))}
            style={{
              position: 'relative',
              background: 'var(--cms-card-bg)', borderRadius: 20,
              border: isSelected ? '2.5px solid var(--cms-accent)' : '1.5px solid var(--glass-border)',
              boxShadow: isSelected ? '0 16px 40px rgba(var(--cms-accent-rgb), 0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
              overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex', flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = 'var(--cms-accent)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }
            }}
          >
            <div style={{ height: 200, position: 'relative', background: proj.coverImage ? `url(${proj.coverImage}) center/cover` : 'linear-gradient(135deg, var(--cms-accent-soft), var(--glass-border))' }}>
              {isSelectionMode && (
                <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: isSelected ? '2px solid var(--cms-accent)' : '2.5px solid rgba(255,255,255,0.8)',
                    background: isSelected ? 'var(--cms-accent)' : 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                    {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                  </div>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: -32, left: 32, width: 68, height: 68, borderRadius: 22, background: 'var(--cms-card-bg)', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 2 }}>
                {renderProjectIcon(proj.icon, 28)}
              </div>
              {proj.priority === 'high' && (
                <div style={{ position: 'absolute', top: 20, right: 20, background: '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 900, letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>URGENT</div>
              )}
            </div>

            <div style={{ padding: '56px 32px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: 20, fontWeight: 900, color: 'var(--cms-text)', margin: '0 0 16px 0', lineHeight: 1.3 }}>{getSafeString(proj.title) || 'Untitled'}</h4>
              <p style={{ fontSize: 15, color: 'var(--cms-text-muted)', lineHeight: 1.6, margin: '0 0 32px 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {getSafeString(proj.description) || 'No description provided.'}
              </p>

              <div style={{ borderTop: '1.5px solid var(--glass-border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getSafeArray(proj.team).slice(0, 3).map((tm, idx) => (
                    <div key={idx} style={{ width: 36, height: 36, borderRadius: '50%', background: tm?.color || 'var(--cms-accent, #8b5cf6)', border: '2.5px solid var(--cms-card-bg)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, marginLeft: idx > 0 ? -12 : 0, zIndex: 3 - idx }}>
                      {tm?.name ? tm.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 80, height: 8, background: 'var(--cms-input-bg)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ width: `${getSafeProgress(proj.progress)}%`, height: '100%', background: 'var(--cms-accent)', borderRadius: 100 }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>{getSafeProgress(proj.progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ListView = ({ projects, onSelect, isSelectionMode, selectedIds, toggleSelection }) => (
  <div className="projects-list-container" style={{ padding: '8px 8px calc(130px + env(safe-area-inset-bottom, 32px)) 8px', width: '100%', boxSizing: 'border-box' }}>
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 16px' }}>
      <tbody>
        {projects.map(proj => {
          const st = STATUSES.find(s => s.id === proj.status) || STATUSES[0];
          const isSelected = selectedIds && selectedIds.includes(proj.id);
          return (
            <tr key={proj.id} onClick={() => isSelectionMode ? toggleSelection(proj.id, !isSelected) : onSelect(proj)} style={{ cursor: 'pointer' }}>
              <td style={{ padding: 0 }}>
                <div className="projects-list-card" style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 60px',
                  alignItems: 'center', padding: '24px 40px',
                  background: 'var(--cms-card-bg)', borderRadius: 24,
                  border: isSelected ? '2px solid var(--cms-accent)' : '1.5px solid var(--glass-border)',
                  boxShadow: isSelected ? '0 12px 30px rgba(var(--cms-accent-rgb), 0.12)' : 'none',
                  transition: '0.3s'
                }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateX(8px)'; e.currentTarget.style.borderColor = 'var(--cms-accent)'; } }}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--glass-border)'; } }}>
                  <div className="list-card-col" style={{ display: 'flex', alignItems: 'center', gap: 24, fontWeight: 900, color: 'var(--cms-text)', fontSize: 17 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)', flexShrink: 0 }}>
                      {renderProjectIcon(proj.icon, 20)}
                    </div>
                    <span>{getSafeString(proj.title) || 'Untitled'}</span>
                  </div>
                  <div className="list-card-col">
                    <span style={{ background: st.bg, color: st.color, padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 900 }}>{st.label}</span>
                  </div>
                  <div className="list-card-col" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--cms-input-bg)', borderRadius: 100, overflow: 'hidden' }}><div style={{ width: `${getSafeProgress(proj.progress)}%`, height: '100%', background: 'var(--cms-accent)', borderRadius: 100 }} /></div>
                    <span style={{ fontSize: 15, fontWeight: 900, width: 40 }}>{getSafeProgress(proj.progress)}%</span>
                  </div>
                  <div className="list-card-col">
                    <span style={{ background: proj.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'var(--cms-input-bg)', color: proj.priority === 'high' ? '#ef4444' : 'var(--cms-text-muted)', padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 900, textTransform: 'capitalize' }}>{proj.priority}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {isSelectionMode ? (
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        border: isSelected ? '2px solid var(--cms-accent)' : '2px solid var(--glass-border)',
                        background: isSelected ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                      </div>
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} color="var(--cms-text-muted)" /></div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const AnalyticsView = ({ projects, onSelect, updateProject }) => {
  const validProjects = projects.filter(p => !p.parentId && !p.isDeleted);
  const totalRaw = validProjects.length;

  const total = totalRaw || 1;

  const normalizeStatus = (s) => {
    if (!s || typeof s !== 'string') return 'todo';
    const norm = s.toLowerCase().replace(/[^a-z]/g, '');
    if (norm.includes('done') || norm.includes('complet')) return 'done';
    if (norm.includes('progress') || norm.includes('ongoing') || norm.includes('run')) return 'progress';
    if (norm.includes('review') || norm.includes('check') || norm.includes('qa')) return 'review';
    if (norm.includes('hold') || norm.includes('pause') || norm.includes('wait')) return 'hold';
    return 'todo';
  };

  const byStatus = useMemo(() => {
    const counts = { todo: 0, progress: 0, review: 0, hold: 0, done: 0 };
    validProjects.forEach(p => counts[normalizeStatus(p.status)]++);
    return counts;
  }, [validProjects]);

  const byPriority = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    validProjects.forEach(p => {
      const prio = p.priority || 'medium';
      if (counts[prio] !== undefined) counts[prio]++;
      else counts['medium']++;
    });
    return counts;
  }, [validProjects]);

  const taskStats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    validProjects.forEach(p => {
      const tasks = getSafeArray(p.tasks);
      totalTasks += tasks.length;
      completedTasks += tasks.filter(t => t.done).length;
    });
    return {
      total: totalTasks,
      completed: completedTasks,
      pct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [validProjects]);

  const atRiskProjects = useMemo(() => {
    return validProjects.filter(p => {
      if (!p.deadline || normalizeStatus(p.status) === 'done') return false;
      const daysLeft = (new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft < 3 && getSafeProgress(p.progress) < 70;
    });
  }, [validProjects]);

  const avgProgress = useMemo(() => {
    if (totalRaw === 0) return 0;
    const sum = validProjects.reduce((acc, p) => acc + getSafeProgress(p.progress), 0);
    return Math.round(sum / totalRaw);
  }, [validProjects, totalRaw]);

  // AI Diagnostic State
  const [aiReport, setAiReport] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const triggerAiDiagnostic = () => {
    setIsAiLoading(true);
    setAiReport('');
    setTimeout(() => {
      let insights = [];

      if (avgProgress > 75) {
        insights.push(`🚀 **Sinergi Kecepatan Tinggi**: Kemajuan portofolio rata-rata berada pada level superior (${avgProgress}%). Eksekusi operasional tim dinilai sangat tangkas dan efisien.`);
      } else if (avgProgress < 40 && totalRaw > 0) {
        insights.push(`⚠️ **Inersia Operasional**: Rata-rata penyelesaian portofolio rendah (${avgProgress}%). Hambatan eksekusi terdeteksi. Disarankan melakukan re-prioritisasi backlog agar menghindari bottleneck.`);
      } else {
        insights.push(`📈 **Stabilitas Portofolio**: Rata-rata progress berada pada tingkat aman ${avgProgress}%. Penyelarasan timeline berjalan stabil.`);
      }

      if (byStatus.review > 2) {
        insights.push(`🔍 **Penyumbatan Ulasan (QA Backlog)**: Terdapat ${byStatus.review} proyek di fase 'Review'. Terdapat hambatan persetujuan eksternal atau verifikasi internal. Prioritaskan fase penyelesaian.`);
      }

      if (atRiskProjects.length > 0) {
        const titles = atRiskProjects.map(p => `"${p.title}"`).join(', ');
        insights.push(`🚨 **Deteksi Ancaman Tenggat**: ${atRiskProjects.length} proyek terancam terlambat karena deadline mendekati (< 3 hari) dengan progress < 70%: ${titles}. Tindakan segera: Redistribusi beban kerja untuk mempercepat penyelesaian.`);
      } else {
        insights.push("✅ **Nol Hambatan Waktu**: Seluruh lini waktu proyek terpantau aman dari ancaman tenggat waktu kritis tanpa progress.");
      }

      const lowProgressHighPrio = validProjects.filter(p => p.priority === 'high' && getSafeProgress(p.progress) < 30 && normalizeStatus(p.status) !== 'done');
      if (lowProgressHighPrio.length > 0) {
        const names = lowProgressHighPrio.map(p => `"${p.title}"`).join(', ');
        insights.push(`🔥 **Fokus Prioritas Tinggi**: Proyek krusial ${names} tertinggal di bawah 30% progress. Alokasikan sumber daya utama untuk memulai fase penetrasi awal.`);
      }

      if (taskStats.total > 0) {
        insights.push(`📊 **Statistik Mikrotask**: ${taskStats.completed} dari ${taskStats.total} sub-tugas (${taskStats.pct}%) telah diselesaikan. Kedisiplinan pemenuhan daftar tugas mikro dinilai sangat baik.`);
      }

      const reportText = insights.map(i => `- ${i}`).join('\n');

      setAiReport(reportText);
      setIsAiLoading(false);
    }, 1200);
  };

  useEffect(() => {
    if (totalRaw > 0 && !aiReport) {

      triggerAiDiagnostic();
    }

  }, [projects]);

  const [sortField, setSortField] = useState('title');
  const [sortAsc, setSortAsc] = useState(true);

  const sortedList = useMemo(() => {
    const list = [...validProjects];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'progress') {
        aVal = getSafeProgress(aVal);
        bVal = getSafeProgress(bVal);
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [validProjects, sortField, sortAsc]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', padding: '0 8px 24px 8px' }}>

      {/* Grid Utama Grid Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20
      }}>
        {/* Total Projects Card */}
        <div style={{
          background: 'var(--cms-card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1.5px solid var(--glass-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 160
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Portfolio</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(var(--cms-accent-rgb), 0.1)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={14} />
            </div>
          </div>
          <div style={{ margin: '16px 0 8px' }}>
            <h2 style={{ fontSize: 36, fontWeight: 950, color: 'var(--cms-text)', margin: 0 }}>{totalRaw}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 100 }}>{byPriority.high} High</span>
              <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 100 }}>{byPriority.medium} Med</span>
              <span style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--cms-text-muted)', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 100 }}>{byPriority.low} Low</span>
            </div>
          </div>
        </div>

        {/* Velocity Card */}
        <div style={{
          background: 'var(--cms-card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1.5px solid var(--glass-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 160
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Progress</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div style={{ margin: '16px 0 8px' }}>
            <h2 style={{ fontSize: 36, fontWeight: 950, color: 'var(--cms-text)', margin: 0 }}>{avgProgress}%</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)' }}>
              <ListTodo size={12} />
              <span>{taskStats.completed}/{taskStats.total} tasks ({taskStats.pct}%) done</span>
            </div>
          </div>
        </div>

        {/* Risk Card */}
        <div style={{
          background: 'var(--cms-card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1.5px solid var(--glass-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 160
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk & Bottlenecks</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: atRiskProjects.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: atRiskProjects.length > 0 ? '#ef4444' : 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={14} />
            </div>
          </div>
          <div style={{ margin: '16px 0 8px' }}>
            <h2 style={{ fontSize: 36, fontWeight: 950, color: atRiskProjects.length > 0 ? '#ef4444' : 'var(--cms-text)', margin: 0 }}>{atRiskProjects.length}</h2>
            <span style={{ display: 'block', marginTop: 8, fontSize: 11, fontWeight: 800, color: atRiskProjects.length > 0 ? '#ef4444' : 'var(--cms-text-muted)' }}>
              {atRiskProjects.length > 0 ? '⚠️ High-risk deadline breaches' : '🎉 Zero timeline risks detected'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Strategy Insights Card */}
      <div style={{
        background: 'var(--cms-card-bg)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: 24,
        border: '1.5px solid var(--glass-border)',
        padding: '24px 32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.05)'
      }}>
        {/* Soft glowing purple radial background to give a premium AI look */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(var(--cms-accent-rgb), 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--cms-accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px var(--cms-accent-soft)'
            }}>
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--cms-text)',
                letterSpacing: '-0.02em'
              }}>Asisten Strategis AI</h3>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>DIAGNOSTIK PORTOFOLIO AKTIF & REKOMENDASI TAKTIKAL</span>
            </div>
          </div>

          <button
            onClick={triggerAiDiagnostic}
            disabled={isAiLoading || totalRaw === 0}
            style={{
              height: 38,
              padding: '0 16px',
              borderRadius: 100,
              background: 'var(--cms-input-bg)',
              color: 'var(--cms-text)',
              border: '1.5px solid var(--cms-border)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: '0.2s',
              zIndex: 2,
              boxShadow: 'none'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--cms-border)'}
          >
            {isAiLoading ? <Loader2 size={14} className="cms-spin" /> : <RotateCw size={14} />}
            <span>Analisis Ulang Strategi</span>
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 1, minHeight: 120 }}>
          {totalRaw === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--cms-text-muted)' }}>
              <Zap size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Data Portofolio Kosong</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>AI memerlukan minimal 1 proyek aktif untuk memulai simulasi diagnostik.</div>
            </div>
          ) : isAiLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Loader2 size={18} className="cms-spin" style={{ color: 'var(--cms-accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-accent)' }}>Mengevaluasi kecepatan kemajuan portofolio...</span>
              </div>
              <div style={{ height: 12, background: 'var(--cms-input-bg)', borderRadius: 100, overflow: 'hidden', width: '60%' }}>
                <div style={{ height: '100%', background: 'var(--cms-accent)', borderRadius: 100, width: '100%' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Analisis kecerdasan portofolio terhadap</span>
                <span style={{
                  background: 'rgba(var(--cms-accent-rgb), 0.1)',
                  color: 'var(--cms-accent)',
                  padding: '2px 8px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 900
                }}>{totalRaw} Proyek Aktif</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aiReport.split('\n').map((line, lIdx) => {
                  let cleaned = line.replace('-', '').trim();
                  if (!cleaned) return null;

                  let isWarning = cleaned.includes('🚨') || cleaned.includes('⚠️') || cleaned.includes('🔥');
                  let isSuccess = cleaned.includes('✅') || cleaned.includes('🚀') || cleaned.includes('📈');
                  let isInfo = cleaned.includes('🔍') || cleaned.includes('📊');

                  let accentColor = 'var(--cms-text-muted)';
                  let itemBg = 'var(--cms-input-bg)';
                  if (isWarning) {
                    accentColor = '#ef4444';
                  } else if (isSuccess) {
                    accentColor = '#10b981';
                  } else if (isInfo) {
                    accentColor = 'var(--cms-accent)';
                  }

                  let content = [];
                  let parts = cleaned.split('**');
                  parts.forEach((p, idx) => {
                    if (idx % 2 === 1) {
                      content.push(
                        <strong key={idx} style={{ color: isWarning ? '#ef4444' : isSuccess ? '#10b981' : 'var(--cms-text)', fontWeight: 800 }}>
                          {p}
                        </strong>
                      );
                    } else {
                      content.push(p);
                    }
                  });

                  return (
                    <div
                      key={lIdx}
                      style={{
                        display: 'flex',
                        gap: 12,
                        background: itemBg,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: '1px solid var(--glass-border)',
                        borderLeft: `4px solid ${accentColor}`,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s',
                        alignItems: 'center'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.backgroundColor = 'rgba(var(--cms-accent-rgb), 0.04)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.backgroundColor = 'var(--cms-input-bg)';
                      }}
                    >
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--cms-text)', lineHeight: 1.5 }}>
                        {content}
                      </div>
                    </div>
                  );
                })}
              </div>

              <style>{`
                @keyframes cmsLivePing {
                  0% { transform: scale(0.9); opacity: 0.5; }
                  50% { transform: scale(1.2); opacity: 1; }
                  100% { transform: scale(0.9); opacity: 0.5; }
                }
                .cms-live-ping {
                  animation: cmsLivePing 2s infinite ease-in-out;
                }
              `}</style>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 10.5,
                color: 'var(--cms-text-muted)',
                marginTop: 12,
                borderTop: '1px solid var(--glass-border)',
                paddingTop: 12,
                fontWeight: 800,
                opacity: 0.7
              }}>
                <span
                  className="cms-live-ping"
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }}
                />
                Diagnostik AI disinkronkan secara real-time dengan status database CMS Anda
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Executive Projects Details Table Section */}
      <div style={{
        background: 'var(--cms-card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 24,
        border: '1.5px solid var(--glass-border)',
        padding: '24px 0',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
      }}>
        <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--glass-border)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 950, color: 'var(--cms-text)', letterSpacing: '-0.01em' }}>Tabel Detail Portofolio</h3>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)' }}>DAFTAR EKSEKUTIF PROYEK TERINTEGRASI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)' }}>Urutkan:</span>
            <ListViewSortDropdown value={sortField} onChange={setSortField} />
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? "Urutkan Menurun" : "Urutkan Menaik"}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: 'var(--cms-shadow-sm)'
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 900 }}>{sortAsc ? '↑' : '↓'}</span>
            </button>
          </div>
        </div>

        {/* Responsive Table Wrapper */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead>
              <tr style={{ background: 'var(--cms-input-bg)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 950, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyek</th>
                <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 950, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 150 }}>Status</th>
                <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 950, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Prioritas</th>
                <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 950, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 160 }}>Kemajuan</th>
                <th style={{ padding: '14px 24px', fontSize: 10, fontWeight: 950, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Deadline</th>
                <th style={{ padding: '14px 24px', width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((proj, idx) => {
                const tasks = getSafeArray(proj.tasks);
                const completed = tasks.filter(t => t.done).length;
                return (
                  <tr
                    key={proj.id}
                    onClick={() => onSelect(proj)}
                    style={{
                      borderBottom: '1px solid var(--glass-border)',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                      background: 'transparent',
                      position: 'relative',
                      zIndex: sortedList.length - idx
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)', flexShrink: 0 }}>
                          {renderProjectIcon(proj.icon, 16)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getSafeString(proj.title) || 'Untitled'}</div>
                          {tasks.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--cms-text-muted)', marginTop: 2, fontWeight: 700 }}>
                              <ListTodo size={10} />
                              <span>{completed}/{tasks.length} sub-tasks</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }} onClick={e => e.stopPropagation()}>
                      <TableSelect
                        value={proj.status}
                        onChange={(val) => updateProject(proj.id, { status: val })}
                        options={STATUSES}
                      />
                    </td>
                    <td style={{ padding: '16px 24px' }} onClick={e => e.stopPropagation()}>
                      <TableSelect
                        value={proj.priority}
                        onChange={(val) => updateProject(proj.id, { priority: val })}
                        options={PRIORITIES}
                      />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 60, height: 5, background: 'var(--cms-input-bg)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ width: `${getSafeProgress(proj.progress)}%`, height: '100%', background: 'var(--cms-accent)', borderRadius: 100 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-text)', width: 28, textAlign: 'right' }}>{getSafeProgress(proj.progress)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--cms-text-muted)', fontSize: 12, fontWeight: 800 }}>
                      {proj.deadline ? new Date(proj.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect(proj); }}
                        style={{
                          padding: '5px 10px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: '0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--cms-accent)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--cms-input-bg)'; e.currentTarget.style.color = 'var(--cms-text)'; }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
              {totalRaw === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 14, fontWeight: 800 }}>Tidak ada proyek aktif untuk dianalisis.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TableSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', textAlign: 'left',
          background: selectedOption.bg || 'var(--cms-accent-soft)',
          border: '1px solid var(--glass-border)',
          color: selectedOption.color || 'var(--cms-text)',
          width: '100%', outline: 'none',
          fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 100,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.filter = 'brightness(1.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.filter = 'none';
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedOption.color, flexShrink: 0 }} />
        <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{selectedOption.label}</span>
        <ChevronRight size={10} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0, opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: '110%', left: 0, width: '130px', zIndex: 9999,
            background: 'var(--cms-panel-bg, rgba(255,255,255,0.95))',
            border: '1px solid var(--glass-border)',
            borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,0.18)', padding: 6,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            animation: 'cmsSmoothFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transformOrigin: 'top center'
          }}>
          {options.map(opt => (
            <div
              key={opt.id}
              onClick={() => { onChange(opt.id); setIsOpen(false); }}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                background: value === opt.id ? 'rgba(var(--cms-accent-rgb), 0.1)' : 'transparent',
                color: value === opt.id ? 'var(--cms-accent)' : 'var(--cms-text)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = value === opt.id ? 'rgba(var(--cms-accent-rgb), 0.1)' : 'transparent'}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: opt.color }} />
              {opt.label}
              {value === opt.id && <Check size={10} style={{ marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------
// PROJECT & SCHEDULE SETTINGS MODAL
// ---------------------------------------------------------

const ProjectAndScheduleSettingsModal = ({
  isOpen,
  onClose,
  projects,
  saveProjects,
  notify
}: {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  saveProjects: (updated: any[]) => void;
  notify?: (msg: string, type?: any) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'platforms' | 'booking' | 'backup'>('categories');
  const [bookingSettings, setBookingSettings] = useState({
    externalCalendarUrl: '',
    autoConfirm: true,
    meetLink: 'https://meet.google.com/new',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00'
  });

  const [categories, setCategories] = useState([
    { id: 'design', label: 'Branding & Desain Grafis', color: '#6366f1' },
    { id: 'web', label: 'Website & Web Application', color: '#3b82f6' },
    { id: 'business', label: 'Manajemen Bisnis & Klien', color: '#10b981' },
    { id: 'marketing', label: 'Pemasaran & Kampanye Iklan', color: '#f59e0b' },
    { id: 'content', label: 'Produksi Konten Media Sosial', color: '#ec4899' }
  ]);

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  useEffect(() => {
    storage.getItem('porto_booking_settings', null).then(saved => {
      if (saved) setBookingSettings(prev => ({ ...prev, ...saved }));
    });
    storage.getItem('porto_project_categories', null).then(saved => {
      if (Array.isArray(saved) && saved.length > 0) setCategories(saved);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveBookingSettings = async () => {
    await storage.setItem('porto_booking_settings', bookingSettings);
    notify?.('Pengaturan jadwal booking berhasil disimpan', 'success');
    onClose();
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat_${Date.now()}`,
      label: newCatName.trim(),
      color: newCatColor
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    await storage.setItem('porto_project_categories', updated);
    setNewCatName('');
    notify?.(`Kategori "${newCat.label}" ditambahkan`, 'success');
  };

  const handleDeleteCategory = async (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    await storage.setItem('porto_project_categories', updated);
    notify?.('Kategori dihapus', 'info');
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `porto_projects_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify?.('Data proyek & konten berhasil diexport ke JSON', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          saveProjects(imported);
          notify?.(`Berhasil memulihkan ${imported.length} proyek dari backup!`, 'success');
          onClose();
        } else {
          notify?.('Format file backup tidak valid', 'error');
        }
      } catch (err) {
        notify?.('Gagal membaca file JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--cms-card-bg, #1a1a2e)',
          borderRadius: 24,
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'pmModalIn 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(var(--cms-accent-rgb), 0.15)',
              color: 'var(--cms-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Settings2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Pengaturan Proyek & Jadwal</div>
              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>Kelola kategori, platform konten, jadwal meet, dan cadangan</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'var(--cms-input-bg)', color: 'var(--cms-text)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', gap: 4, padding: '10px 18px',
          background: 'var(--cms-input-bg)', borderBottom: '1px solid var(--glass-border)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'categories', label: 'Kategori Proyek', icon: Layers },
            { id: 'platforms', label: 'Platform Konten', icon: Sparkles },
            { id: 'booking', label: 'Jadwal & Meet', icon: Video },
            { id: 'backup', label: 'Backup & Export', icon: Download }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '7px 14px', borderRadius: 100, border: 'none',
                  background: isActive ? 'var(--cms-accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--cms-text-muted)',
                  fontSize: 12, fontWeight: 850, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s ease', whiteSpace: 'nowrap'
                }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          {activeTab === 'categories' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>Daftar Kategori Proyek:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      padding: '10px 14px', borderRadius: 12,
                      background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>{cat.label}</span>
                    </div>
                    {cat.id.startsWith('cat_') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Category */}
              <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Nama kategori baru..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  style={{
                    flex: 1, height: 38, padding: '0 12px', borderRadius: 10,
                    border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                  }}
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                  style={{ width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 2, background: 'transparent' }}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  style={{
                    padding: '0 16px', borderRadius: 10, border: 'none',
                    background: 'var(--cms-accent)', color: '#fff', fontSize: 12, fontWeight: 850, cursor: 'pointer'
                  }}
                >
                  Tambah
                </button>
              </div>
            </div>
          )}

          {activeTab === 'platforms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>Platform Media Sosial Aktif:</div>
              {[
                { name: 'Instagram', desc: 'Reels, Carousel, Feed Post, Story', color: '#ec4899' },
                { name: 'TikTok', desc: 'Video Pendek Vertikal, Sound Trending', color: '#00f2fe' },
                { name: 'YouTube', desc: 'Video Panjang & YouTube Shorts', color: '#ff0000' },
                { name: 'LinkedIn', desc: 'Artikel Otoritas & Dokumen PDF Slide', color: '#0077b5' },
                { name: 'X / Twitter', desc: 'Thread Viral & Update Instan', color: '#1da1f2' }
              ].map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>{p.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 100, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    AKTIF
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'booking' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Link Ruang Rapat Google Meet Default
                </div>
                <input
                  type="text"
                  value={bookingSettings.meetLink}
                  onChange={e => setBookingSettings(prev => ({ ...prev, meetLink: e.target.value }))}
                  style={{
                    width: '100%', height: 38, padding: '0 12px', borderRadius: 10,
                    border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Mulai Jam Operasional
                  </div>
                  <input
                    type="time"
                    value={bookingSettings.workingHoursStart}
                    onChange={e => setBookingSettings(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                    style={{
                      width: '100%', height: 38, padding: '0 12px', borderRadius: 10,
                      border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)',
                      color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Selesai Jam Operasional
                  </div>
                  <input
                    type="time"
                    value={bookingSettings.workingHoursEnd}
                    onChange={e => setBookingSettings(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                    style={{
                      width: '100%', height: 38, padding: '0 12px', borderRadius: 10,
                      border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)',
                      color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveBookingSettings}
                style={{
                  marginTop: 10, height: 40, borderRadius: 10, border: 'none',
                  background: 'var(--cms-accent)', color: '#fff', fontSize: 12.5, fontWeight: 850, cursor: 'pointer'
                }}
              >
                Simpan Pengaturan Booking
              </button>
            </div>
          )}

          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                padding: '14px', borderRadius: 14, background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 8
              }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)' }}>Cadangkan Semua Proyek & Konten</div>
                <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>Unduh seluruh basis data proyek, naskah konten, tugas, dan aktivitas ke dalam satu file JSON lokal.</div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none',
                    background: 'var(--cms-accent)', color: '#fff', fontSize: 12, fontWeight: 850,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start'
                  }}
                >
                  <Download size={14} />
                  <span>Download Backup JSON ({projects.length} Proyek)</span>
                </button>
              </div>

              <div style={{
                padding: '14px', borderRadius: 14, background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 8
              }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text)' }}>Pulihkan Data dari File JSON</div>
                <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)' }}>Impor file cadangan JSON yang pernah Anda unduh sebelumnya.</div>
                <label
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--glass-border)',
                    background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 850,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start'
                  }}
                >
                  <Upload size={14} />
                  <span>Pilih File Backup JSON</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ---------------------------------------------------------
// SCHEDULE & GOOGLE CALENDAR BOOKING VIEW
// ---------------------------------------------------------

const ScheduleAndBookingView = ({ projects = [], onSelect, notify, addProject, saveProjects }: any) => {
  const { showConfirm } = useDialog();
  const [calendarSubView, setCalendarSubView] = useState('grid');
  const [bookings, setBookings] = useState([]);
  const [contentPlans, setContentPlans] = useState([]);
  const [bookingSettings, setBookingSettings] = useState({
    externalCalendarUrl: '',
    telegramBotToken: '',
    telegramChatId: '',
    webhookUrl: '',
    autoConfirm: true,
    customServices: [
      { id: 'consultation', name: 'Konsultasi Desain & Branding', duration: '30 Menit', desc: 'Diskusi visual brand identity, UI/UX, dan positioning produk.' },
      { id: 'web_dev', name: 'Proyek Web & App Development', duration: '45 Menit', desc: 'Rancang arsitektur website, fitur CMS, dan integrasi custom.' },
      { id: 'marketing', name: 'Strategi Digital Marketing & Ads', duration: '30 Menit', desc: 'Evaluasi funnel penjualan, campaign media sosial, & SEO.' }
    ]
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New manual booking form
  const [newBookingForm, setNewBookingForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceName: 'Konsultasi Desain & Branding',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [storedBookings, storedSettings, storedContentPlans] = await Promise.all([
        storage.getItem('porto_bookings', []),
        storage.getItem('porto_booking_settings', {}),
        storage.getItem('porto_content_plans', [])
      ]);
      setBookings(storedBookings || []);
      setContentPlans(Array.isArray(storedContentPlans) ? storedContentPlans : []);
      if (storedSettings && Object.keys(storedSettings).length > 0) {
        setBookingSettings(prev => ({ ...prev, ...storedSettings }));
      }
    } catch (e) {
      console.error('Failed to load bookings & content plans in schedule view:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveContentPlan = async (plan) => {
    const existingIndex = contentPlans.findIndex(c => c.id === plan.id);
    let updated;
    if (existingIndex > -1) {
      updated = contentPlans.map(c => c.id === plan.id ? plan : c);
    } else {
      updated = [plan, ...contentPlans];
    }
    setContentPlans(updated);
    await storage.setItem('porto_content_plans', updated);
    notify?.('✅ Rencana konten berhasil disimpan & terjadwal!', 'success');
  };

  const handleDeleteContentPlan = async (id) => {
    const updated = contentPlans.filter(c => c.id !== id);
    setContentPlans(updated);
    await storage.setItem('porto_content_plans', updated);
    notify?.('Rencana konten berhasil dihapus', 'info');
  };

  const handleUpdateBookingStatus = async (id, newStatus) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: newStatus } : b);
    setBookings(updated);
    await storage.setItem('porto_bookings', updated);
    notify?.(`Status janji temu diperbarui: ${newStatus}`, 'success');
  };

  const handleDeleteBooking = async (id: any) => {
    if (!id) return;
    let confirmed = true;
    try {
      if (typeof showConfirm === 'function') {
        confirmed = await showConfirm('Hapus data janji temu ini?');
      } else {
        confirmed = window.confirm('Hapus data janji temu ini?');
      }
    } catch {
      confirmed = window.confirm('Hapus data janji temu ini?');
    }
    if (!confirmed) return;

    try {
      const stored = (await storage.getItem('porto_bookings', [])) || [];
      const baseList = Array.isArray(stored) && stored.length > 0 ? stored : (Array.isArray(bookings) ? bookings : []);
      const updated = baseList.filter((b: any) => String(b?.id) !== String(id));
      setBookings(updated);
      await storage.setItem('porto_bookings', updated);
      notify?.('✅ Janji temu berhasil dihapus', 'info');
    } catch (err) {
      console.error('Error deleting booking:', err);
      notify?.('Gagal menghapus janji temu', 'error');
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await storage.setItem('porto_booking_settings', bookingSettings);
      notify?.('✅ Pengaturan Jadwal Booking berhasil disimpan!', 'success');
      setIsSettingsOpen(false);
    } catch (err) {
      notify?.('Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!newBookingForm.clientName.trim()) {
      notify?.('Nama klien wajib diisi', 'error');
      return;
    }
    const newBooking = {
      id: `book_${Date.now()}`,
      ...newBookingForm,
      status: bookingSettings.autoConfirm ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString()
    };
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    await storage.setItem('porto_bookings', updated);
    notify?.('✅ Janji temu berhasil ditambahkan!', 'success');
    setIsNewBookingOpen(false);
    setNewBookingForm({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      serviceName: bookingSettings.customServices?.[0]?.name || 'Konsultasi Desain & Branding',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      notes: ''
    });
  };

  // Valid projects with deadline
  const validProjectsWithDeadline = useMemo(() => {
    return projects.filter(p => !p.parentId && !p.isTrash && p.deadline);
  }, [projects]);

  // Combine deadlines & bookings into unified agenda timeline
  const timelineItems = useMemo(() => {
    const items = [];

    // 1. Projects Deadlines
    if (activeFilter === 'all' || activeFilter === 'projects') {
      validProjectsWithDeadline.forEach(p => {
        const matchesSearch = !searchQuery ||
          (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.client || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesSearch) {
          items.push({
            itemType: 'project',
            id: p.id,
            title: p.title || 'Untitled Project',
            subtitle: p.client ? `Klien: ${p.client}` : 'Deadline Pengerjaan Proyek',
            date: p.deadline,
            time: '23:59',
            status: p.status || 'progress',
            priority: p.priority || 'medium',
            progress: getSafeProgress(p.progress),
            icon: p.icon,
            data: p
          });
        }
      });
    }

    // 2. Client Bookings
    if (activeFilter === 'all' || activeFilter === 'bookings') {
      bookings.forEach(b => {
        const matchStatus = statusFilter === 'all' || b.status === statusFilter;
        const matchesSearch = !searchQuery ||
          (b.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.serviceName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.clientPhone || '').includes(searchQuery);

        if (matchStatus && matchesSearch) {
          items.push({
            itemType: 'booking',
            id: b.id,
            title: b.clientName || 'Janji Temu Klien',
            subtitle: b.serviceName || 'Konsultasi Layanan',
            date: b.date || new Date().toISOString().split('T')[0],
            time: b.time || '10:00',
            status: b.status || 'confirmed',
            phone: b.clientPhone,
            email: b.clientEmail,
            notes: b.notes,
            data: b
          });
        }
      });
    }

    // 3. Content Plans
    if (activeFilter === 'all' || activeFilter === 'content') {
      contentPlans.forEach(c => {
        const matchesSearch = !searchQuery ||
          (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.platform || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesSearch) {
          items.push({
            itemType: 'content',
            id: c.id,
            title: c.title,
            subtitle: `[${c.platform.toUpperCase()}] • ${c.format} (${c.status})`,
            date: c.scheduledDate,
            time: c.scheduledTime || '19:00',
            status: c.status,
            data: c
          });
        }
      });
    }

    // Sort by date ascending (closest first)
    items.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime() || 0;
      const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime() || 0;
      return timeA - timeB;
    });

    return items;
  }, [validProjectsWithDeadline, bookings, contentPlans, activeFilter, statusFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', boxSizing: 'border-box' }}>
      <CalendarGridView
        projects={projects}
        bookings={bookings}
        contentPlans={contentPlans}
        onSelectProject={onSelect}
        onAddProject={addProject}
        onOpenContentPlan={(item, initDate, hPrompt) => {
          if (item) {
            onSelect(item);
          } else if (addProject) {
            addProject(null, true, {
              type: 'content',
              title: hPrompt ? `Konten: ${hPrompt}` : 'Ide Konten Baru',
              deadline: initDate || new Date().toISOString().split('T')[0],
              scheduledDate: initDate || new Date().toISOString().split('T')[0],
              scheduledTime: '19:00',
              platform: 'instagram',
              format: 'reels'
            });
          }
        }}
        onOpenNewBooking={(initDate) => {
          if (initDate) {
            setNewBookingForm(prev => ({ ...prev, date: initDate }));
          }
          setIsNewBookingOpen(true);
        }}
        onDeleteBooking={handleDeleteBooking}
        onOpenBookingSettings={() => setIsSettingsOpen(true)}
        notify={notify}
        subView={calendarSubView}
        onSwitchSubView={setCalendarSubView}
      />

      {/* ── 4. MODAL: Pengaturan Slot Booking & Layanan ── */}
      {isSettingsOpen && createPortal(
        <div
          onClick={() => setIsSettingsOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 560, maxHeight: '90vh',
              background: 'var(--cms-card-bg)', borderRadius: 24,
              border: '1.5px solid var(--glass-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Pengaturan Jadwal & Booking</h3>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>Konfigurasi slot konsultasi & notifikasi otomatis</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Auto Confirm Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Konfirmasi Otomatis (Auto-Confirm)</div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>Janji temu klien langsung terkonfirmasi tanpa persetujuan manual</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(bookingSettings.autoConfirm)}
                  onChange={e => setBookingSettings(prev => ({ ...prev, autoConfirm: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--cms-accent)' }}
                />
              </div>

              {/* External Calendar URL */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 6 }}>
                  Link Kalender Eksternal (Google Calendar / Calendly)
                </label>
                <input
                  type="url"
                  placeholder="https://calendar.google.com/... atau https://calendly.com/..."
                  value={bookingSettings.externalCalendarUrl || ''}
                  onChange={e => setBookingSettings(prev => ({ ...prev, externalCalendarUrl: e.target.value }))}
                  style={{ width: '100%', height: 40, padding: '0 14px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none' }}
                />
              </div>

              {/* Custom Services List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text)' }}>Daftar Layanan Konsultasi</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newService = { id: `srv_${Date.now()}`, name: 'Layanan Baru', duration: '30 Menit', desc: 'Deskripsi singkat layanan.' };
                      setBookingSettings(prev => ({ ...prev, customServices: [...(prev.customServices || []), newService] }));
                    }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    + Layanan
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(bookingSettings.customServices || []).map((srv, idx) => (
                    <div key={srv.id || idx} style={{ padding: 10, borderRadius: 12, background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={srv.name}
                          onChange={e => {
                            const updated = [...bookingSettings.customServices];
                            updated[idx].name = e.target.value;
                            setBookingSettings(prev => ({ ...prev, customServices: updated }));
                          }}
                          placeholder="Nama Layanan"
                          style={{ flex: 1, height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 700 }}
                        />
                        <input
                          type="text"
                          value={srv.duration}
                          onChange={e => {
                            const updated = [...bookingSettings.customServices];
                            updated[idx].duration = e.target.value;
                            setBookingSettings(prev => ({ ...prev, customServices: updated }));
                          }}
                          placeholder="Durasi"
                          style={{ width: 90, height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)', color: 'var(--cms-text)', fontSize: 11.5 }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = bookingSettings.customServices.filter((_, i) => i !== idx);
                            setBookingSettings(prev => ({ ...prev, customServices: updated }));
                          }}
                          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={srv.desc || ''}
                        onChange={e => {
                          const updated = [...bookingSettings.customServices];
                          updated[idx].desc = e.target.value;
                          setBookingSettings(prev => ({ ...prev, customServices: updated }));
                        }}
                        placeholder="Deskripsi singkat layanan..."
                        style={{ width: '100%', height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)', color: 'var(--cms-text-muted)', fontSize: 11 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--cms-card-bg)' }}>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-text-muted)', fontSize: 12, fontWeight: 750, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontSize: 12, fontWeight: 850, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {isSavingSettings ? <Loader2 size={14} className="cms-spin" /> : <Save size={14} />}
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── 5. MODAL: Tambah Janji Temu Manual ── */}
      {isNewBookingOpen && createPortal(
        <div
          onClick={() => setIsNewBookingOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <form
            onSubmit={handleCreateBooking}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--cms-card-bg)', borderRadius: 24,
              border: '1.5px solid var(--glass-border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>Tambah Janji Temu Manual</h3>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>Jadwalkan konsultasi atau pertemuan klien</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBookingOpen(false)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>Nama Klien *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Kreatif Nusantara / Bpk. Budi"
                  value={newBookingForm.clientName}
                  onChange={e => setNewBookingForm(prev => ({ ...prev, clientName: e.target.value }))}
                  style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>No. WhatsApp / HP</label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={newBookingForm.clientPhone}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, clientPhone: e.target.value }))}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>Email</label>
                  <input
                    type="email"
                    placeholder="klien@gmail.com"
                    value={newBookingForm.clientEmail}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>Pilihan Layanan</label>
                <select
                  value={newBookingForm.serviceName}
                  onChange={e => setNewBookingForm(prev => ({ ...prev, serviceName: e.target.value }))}
                  style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none' }}
                >
                  {(bookingSettings.customServices || []).map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name} ({s.duration})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>Tanggal Pertemuan</label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.date}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>Waktu / Jam</label>
                  <input
                    type="time"
                    required
                    value={newBookingForm.time}
                    onChange={e => setNewBookingForm(prev => ({ ...prev, time: e.target.value }))}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 4 }}>Catatan Tambahan</label>
                <textarea
                  placeholder="Kebutuhan atau topik yang ingin dibahas..."
                  rows={2}
                  value={newBookingForm.notes}
                  onChange={e => setNewBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 12, outline: 'none', resize: 'none' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsNewBookingOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--cms-text-muted)', fontSize: 12, fontWeight: 750, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: 'var(--cms-accent)', color: '#fff', fontSize: 12, fontWeight: 850, cursor: 'pointer' }}
              >
                Simpan Janji Temu
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};

const TableView = ({ projects, onSelect, updateProject, toggleSelection, selectedIds, bulkDelete, bulkStatusUpdate, isSelectionMode, setIsSelectionMode }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sortedProjects = useMemo(() => {
    let sortableItems = [...projects];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'progress') {
          aValue = getSafeProgress(aValue);
          bValue = getSafeProgress(bValue);
        } else if (sortConfig.key === 'status') {
          aValue = STATUSES.findIndex(s => s.id === a.status);
          bValue = STATUSES.findIndex(s => s.id === b.status);
        } else if (sortConfig.key === 'priority') {
          aValue = PRIORITIES.findIndex(p => p.id === a.priority);
          bValue = PRIORITIES.findIndex(p => p.id === b.priority);
        } else if (sortConfig.key === 'title') {
          aValue = getSafeString(a.title).toLowerCase();
          bValue = getSafeString(b.title).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [projects, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Actions Bar */}
      <div style={{ background: 'var(--cms-card-bg)', borderRadius: 24, border: '1.5px solid var(--glass-border)', padding: '16px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-text-muted)' }}>{projects.length} Projects</span>
          {selectedIds && selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1.5px solid var(--glass-border)' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-accent)' }}>{selectedIds.length} Selected</span>

              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  onChange={(e) => {
                    if (e.target.value) bulkStatusUpdate(e.target.value);
                    e.target.value = '';
                  }}
                  style={{ background: 'var(--cms-input-bg)', color: 'var(--cms-text)', border: '1.5px solid var(--glass-border)', padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 800, outline: 'none' }}
                >
                  <option value="">Update Status...</option>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button onClick={bulkDelete} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> Trash
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        /* Mobile Card View optimized specifically for screens < 768px */
        <div className="pm-mobile-table-list" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 32px))' }}>
          {sortedProjects.map((proj, idx) => {
            const isSelected = selectedIds && selectedIds.includes(proj.id);
            return (
              <div
                key={proj.id}
                onClick={() => {
                  if (isSelectionMode) toggleSelection(proj.id, !isSelected);
                  else onSelect(proj);
                }}
                style={{
                  background: isSelected ? 'rgba(var(--cms-accent-rgb), 0.08)' : 'var(--cms-card-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 24,
                  border: isSelected ? '2px solid var(--cms-accent)' : '1px solid var(--glass-border)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                  position: 'relative',
                  zIndex: sortedProjects.length - idx
                }}
              >
                {/* Top Header: Icon, Title & Open action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {toggleSelection && isSelectionMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); toggleSelection(proj.id, !isSelected); }}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: isSelected ? '2px solid var(--cms-accent)' : '2px solid var(--glass-border)',
                        background: isSelected ? 'var(--cms-accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
                      }}>
                      {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                    </div>
                  )}

                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)', flexShrink: 0 }}>
                    {renderProjectIcon(proj.icon, 16)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      value={getSafeString(proj.title)}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                      style={{ background: 'transparent', border: 'none', color: 'var(--cms-text)', fontSize: 14, fontWeight: 800, width: '100%', outline: 'none' }}
                      placeholder="Untitled"
                    />
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(proj); }}
                    style={{
                      padding: '6px 12px', borderRadius: 100,
                      background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)', fontSize: 11, fontWeight: 900, cursor: 'pointer'
                    }}
                  >
                    Open
                  </button>
                </div>

                {/* Dropdowns: Status & Priority */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Status</div>
                    <TableSelect
                      value={proj.status}
                      onChange={(val) => updateProject(proj.id, { status: val })}
                      options={STATUSES}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Priority</div>
                    <TableSelect
                      value={proj.priority}
                      onChange={(val) => updateProject(proj.id, { priority: val })}
                      options={PRIORITIES}
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)' }}>Progress</span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text)' }}>{getSafeProgress(proj.progress)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--cms-input-bg)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ width: `${getSafeProgress(proj.progress)}%`, height: '100%', background: 'var(--cms-accent)', borderRadius: 100 }} />
                  </div>
                </div>

                {/* Footer info: Deadline & Tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--glass-border)', paddingTop: 10, marginTop: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
                    <Clock size={12} />
                    {proj.deadline ? new Date(proj.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {getSafeArray(proj.tags).slice(0, 1).map((tag, i) => (
                      <span key={i} style={{ background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>{tag}</span>
                    ))}
                    {getSafeArray(proj.tags).length > 1 && <span style={{ color: 'var(--cms-text-muted)', fontSize: 10, fontWeight: 800 }}>+{getSafeArray(proj.tags).length - 1}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 14, fontWeight: 800 }}>No projects found in this view.</div>
          )}
        </div>
      ) : (
        /* Desktop Fluid Glassmorphic Table */
        <div style={{ background: 'var(--cms-card-bg)', borderRadius: 24, border: '1.5px solid var(--glass-border)', overflow: 'clip' }}>
          <div style={{ overflowX: 'auto', borderRadius: '0 0 24px 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1000 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--glass-border)', background: 'var(--cms-input-bg)' }}>
                  {toggleSelection && isSelectionMode && (
                    <th style={{ padding: '16px 24px', borderBottom: '1.5px solid var(--glass-border)', width: 40 }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleSelection('all', !(selectedIds && projects.length > 0 && selectedIds.length === projects.length)); }}
                        style={{
                          width: 28, height: 28, borderRadius: 8, border: (selectedIds && projects.length > 0 && selectedIds.length === projects.length) ? '2px solid var(--cms-accent)' : '2px solid var(--glass-border)',
                          background: (selectedIds && projects.length > 0 && selectedIds.length === projects.length) ? 'var(--cms-accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
                        }}>
                        {(selectedIds && projects.length > 0 && selectedIds.length === projects.length) && <Check size={18} color="#fff" strokeWidth={3} />}
                      </div>
                    </th>
                  )}
                  <th style={{ padding: '16px 24px', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => requestSort('title')}>Project Name {getSortIcon('title')}</th>
                  <th style={{ padding: '16px 24px', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 160 }} onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
                  <th style={{ padding: '16px 24px', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }} onClick={() => requestSort('priority')}>Priority {getSortIcon('priority')}</th>
                  <th style={{ padding: '16px 24px', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 180 }} onClick={() => requestSort('progress')}>Progress {getSortIcon('progress')}</th>
                  <th style={{ padding: '16px 24px', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }} onClick={() => requestSort('deadline')}>Deadline {getSortIcon('deadline')}</th>
                  <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</th>
                  <th style={{ padding: '16px 24px', width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map(proj => {
                  const isSelected = selectedIds && selectedIds.includes(proj.id);
                  let pressTimer = null;
                  return (
                    <tr key={proj.id}
                      onClick={() => {
                        if (isSelectionMode) toggleSelection(proj.id, !isSelected);
                        else onSelect(proj);
                      }}

                      onPointerDown={(e) => {
                        if (isSelectionMode) return;
                        pressTimer = setTimeout(() => { setIsSelectionMode(true); toggleSelection(proj.id, true); }, 500);
                      }}
                      onPointerUp={() => clearTimeout(pressTimer)}
                      onPointerLeave={() => clearTimeout(pressTimer)}
                      style={{ borderBottom: '1px solid var(--glass-border)', background: isSelected ? 'rgba(var(--cms-accent-rgb), 0.05)' : 'transparent', transition: '0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.02)'} onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(var(--cms-accent-rgb), 0.05)' : 'transparent'}>
                      {toggleSelection && isSelectionMode && (
                        <td className="td-normal" style={{ padding: '16px 24px' }}>
                          <div
                            onClick={(e) => { e.stopPropagation(); toggleSelection(proj.id, !isSelected); }}
                            style={{
                              width: 28, height: 28, borderRadius: 8, border: isSelected ? '2px solid var(--cms-accent)' : '2px solid var(--glass-border)',
                              background: isSelected ? 'var(--cms-accent)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
                            }}>
                            {isSelected && <Check size={18} color="#fff" strokeWidth={3} />}
                          </div>
                        </td>
                      )}
                      <td className="td-normal" style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-accent)', flexShrink: 0 }}>
                            {renderProjectIcon(proj.icon, 15)}
                          </div>
                          <input
                            value={getSafeString(proj.title)}
                            onClick={e => e.stopPropagation()}
                            onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                            style={{ background: 'transparent', border: 'none', color: 'var(--cms-text)', fontSize: 15, fontWeight: 800, width: '100%', outline: 'none' }}
                            placeholder="Untitled"
                          />
                        </div>
                      </td>
                      <td className="td-normal" style={{ padding: '16px 24px' }}>
                        <TableSelect
                          value={proj.status}
                          onChange={(val) => updateProject(proj.id, { status: val })}
                          options={STATUSES}
                        />
                      </td>
                      <td className="td-normal" style={{ padding: '16px 24px' }}>
                        <TableSelect
                          value={proj.priority}
                          onChange={(val) => updateProject(proj.id, { priority: val })}
                          options={PRIORITIES}
                        />
                      </td>
                      <td className="td-normal" style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 80, height: 6, background: 'var(--cms-input-bg)', borderRadius: 100, overflow: 'hidden' }}><div style={{ width: `${getSafeProgress(proj.progress)}%`, height: '100%', background: 'var(--cms-accent)', borderRadius: 100 }} /></div>
                          <span style={{ fontSize: 13, fontWeight: 800, width: 32 }}>{getSafeProgress(proj.progress)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--cms-text-muted)', fontSize: 13, fontWeight: 700 }}>
                        {proj.deadline ? new Date(proj.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </td>
                      <td className="td-normal" style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {getSafeArray(proj.tags).length === 0 && <span style={{ color: 'var(--cms-text-muted)', fontSize: 11, fontWeight: 800 }}>-</span>}
                          {getSafeArray(proj.tags).slice(0, 2).map((tag, i) => (
                            <span key={i} style={{ background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{tag}</span>
                          ))}
                          {getSafeArray(proj.tags).length > 2 && <span style={{ color: 'var(--cms-text-muted)', fontSize: 11, fontWeight: 800 }}>+{getSafeArray(proj.tags).length - 2}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(proj); }} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--cms-accent)'; e.currentTarget.style.color = '#fff'; }}>Open</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {projects.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 15, fontWeight: 800 }}>No projects found in this view.</div>
          )}
        </div>
      )}
    </div>
  );
};
const TrashView = ({ projects, restoreProject, permanentDeleteProject, bulkDelete, toggleSelection, selectedIds }) => {
  return (
    <div style={{ background: 'var(--cms-card-bg)', borderRadius: 24, border: '1.5px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1.5px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="checkbox" checked={selectedIds.length === projects.length && projects.length > 0} onChange={(e) => toggleSelection('all', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text-muted)' }}>{selectedIds.length} Selected</span>
          {selectedIds.length > 0 && (
            <button onClick={bulkDelete} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={14} /> Delete Forever
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--glass-border)', background: 'var(--cms-input-bg)' }}>
              <th style={{ padding: '16px 24px', width: 40 }}></th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Name</th>
              <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deleted At</th>
              <th style={{ padding: '16px 24px', width: 200 }}></th>
            </tr>
          </thead>
          <tbody>
            {projects.map(proj => (
              <tr key={proj.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td className="td-normal" style={{ padding: '16px 24px' }}>
                  <input type="checkbox" checked={selectedIds.includes(proj.id)} onChange={(e) => toggleSelection(proj.id, e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--cms-accent)' }} />
                </td>
                <td className="td-normal" style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)', flexShrink: 0 }}>
                      {renderProjectIcon(proj.icon, 15)}
                    </div>
                    <div style={{ color: 'var(--cms-text)', fontSize: 15, fontWeight: 800 }}>{getSafeString(proj.title) || 'Untitled'}</div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--cms-text-muted)', fontSize: 13, fontWeight: 700 }}>
                  {proj.deletedAt ? new Date(proj.deletedAt).toLocaleDateString() : '-'}
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => restoreProject(proj.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10b981', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Restore</button>
                    <button onClick={() => permanentDeleteProject(proj.id)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: 15, fontWeight: 800 }}>Trash is empty.</div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// STICKY NOTES BOARD
// ---------------------------------------------------------

const STICKY_COLORS = [
  { bg: '#fef9c3', border: '#fde68a', text: '#78350f' },
  { bg: '#dbeafe', border: '#bfdbfe', text: '#1e3a8a' },
  { bg: '#dcfce7', border: '#bbf7d0', text: '#14532d' },
  { bg: '#fce7f3', border: '#fbcfe8', text: '#831843' },
  { bg: '#ede9fe', border: '#ddd6fe', text: '#4c1d95' },
  { bg: '#ffedd5', border: '#fed7aa', text: '#7c2d12' },
];

const StickyNotesBoard = ({ stickyNotes, saveNotes }) => {
  const [editingId, setEditingId] = useState(null);
  const addNote = () => {
    const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
    const note = { id: `note_${Date.now()}`, text: '', color, createdAt: new Date().toISOString() };
    saveNotes([note, ...getSafeArray(stickyNotes)]);
    setEditingId(note.id);
  };
  const updateNote = (id, text) => saveNotes(getSafeArray(stickyNotes).map(n => n.id === id ? { ...n, text } : n));
  const deleteNote = (id) => saveNotes(getSafeArray(stickyNotes).filter(n => n.id !== id));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button onClick={addNote} style={{ padding: '10px 20px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} strokeWidth={3} /> Add Note
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
        {getSafeArray(stickyNotes).map(note => (
          <div key={note.id} style={{ background: note.color?.bg || '#fef9c3', border: `2px solid ${note.color?.border || '#fde68a'}`, borderRadius: 16, padding: 16, minHeight: 140, display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', transition: '0.2s' }}>
            <button onClick={() => deleteNote(note.id)} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: note.color?.text || '#78350f' }}>
              <X size={12} />
            </button>
            <textarea
              autoFocus={editingId === note.id}
              value={note.text}
              onChange={e => updateNote(note.id, e.target.value)}
              onFocus={() => setEditingId(note.id)}
              onBlur={() => setEditingId(null)}
              placeholder="Write a note..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 14, fontWeight: 600, color: note.color?.text || '#78350f', fontFamily: 'inherit', lineHeight: 1.6, paddingRight: 20 }}
            />
            <div style={{ fontSize: 10, fontWeight: 700, color: note.color?.text || '#78350f', opacity: 0.5, marginTop: 8 }}>
              {new Date(note.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {getSafeArray(stickyNotes).length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--cms-text-muted)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--cms-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--cms-text-muted)' }}>
              <Pin size={28} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>No sticky notes yet</div>
            <div style={{ fontSize: 13, marginTop: 8, opacity: 0.6 }}>Click "Add Note" to create one</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// PROJECT PILL MODAL
// ---------------------------------------------------------

const getSafeTasksArray = (tasks: any): Array<{ id: string | number; text: string; done: boolean }> => {
  if (!tasks) return [];
  const rawList = Array.isArray(tasks) ? tasks : [];
  return rawList.map((t, idx) => {
    if (typeof t === 'string') {
      return { id: `task_${idx}_${Date.now()}`, text: t, done: false };
    }
    if (typeof t === 'object' && t !== null) {
      return {
        id: t.id !== undefined ? t.id : `task_${idx}_${Date.now()}`,
        text: t.text || t.title || t.name || 'Untitled Task',
        done: Boolean(t.done || t.completed || t.isDone)
      };
    }
    return { id: `task_${idx}_${Date.now()}`, text: String(t), done: false };
  });
};

const ProjectPillModal = ({ project, onClose, updateProject, removeProject, activeTab, setActiveTab, handleFileUpload, isUploading, notify, projects, addProject, setSelectedProject, handleCreateInvoiceForProject }) => {
  const [newTask, setNewTask] = useState('');
  const [newSubProjectTitle, setNewSubProjectTitle] = useState('');
  const [isAddingSubProject, setIsAddingSubProject] = useState(false);
  const [isAiTaskLoading, setIsAiTaskLoading] = useState(false);
  const [isAiBriefLoading, setIsAiBriefLoading] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false);
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);
  const [isHeaderActionsMenuOpen, setIsHeaderActionsMenuOpen] = useState(false);
  const [isProofingModalOpen, setIsProofingModalOpen] = useState(false);
  const [proofingWatermarkStyle, setProofingWatermarkStyle] = useState<'grid' | 'center' | 'bottom'>('grid');
  const [proofingWatermarkTheme, setProofingWatermarkTheme] = useState<'frosted' | 'gold' | 'crimson'>('frosted');
  const [isPipelineMenuOpen, setIsPipelineMenuOpen] = useState(false);
  const [isZippingFiles, setIsZippingFiles] = useState(false);
  const [zippingProgressText, setZippingProgressText] = useState('');
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [activeEditingNoteId, setActiveEditingNoteId] = useState<string | null>(null);
  const [isNoteAiMenuOpen, setIsNoteAiMenuOpen] = useState(false);
  const [isNoteColorPickerOpen, setIsNoteColorPickerOpen] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── INTEGRATED MULTI-NOTE ENGINE (DIRECTLY STORED IN PROJECT) ──
  const projectNotes = useMemo(() => {
    if (Array.isArray(project.projectNotes) && project.projectNotes.length > 0) {
      return project.projectNotes;
    }
    const list: Array<{ id: string; title: string; content: string; type: string; color?: string; updatedAt: string }> = [];
    if (project.notes && project.notes.trim()) {
      list.push({
        id: `pnote_default_1`,
        title: project.type === 'content' ? 'Naskah Konten' : 'Catatan Proyek',
        content: project.notes,
        type: project.type === 'content' ? 'script' : 'note',
        color: 'default',
        updatedAt: project.updatedAt || new Date().toISOString()
      });
    }
    if (project.caseStudyHtml && project.caseStudyHtml.trim() && project.caseStudyHtml !== project.notes) {
      list.push({
        id: `pnote_default_2`,
        title: 'Studi Kasus',
        content: project.caseStudyHtml,
        type: 'casestudy',
        color: 'purple',
        updatedAt: project.updatedAt || new Date().toISOString()
      });
    }
    return list;
  }, [project.projectNotes, project.notes, project.caseStudyHtml, project.type]);

  const currentActiveNote = useMemo(() => {
    return projectNotes.find(n => n.id === activeEditingNoteId) || null;
  }, [projectNotes, activeEditingNoteId]);

  const handleAddProjectNote = (title = 'Catatan Baru', content = '', type = 'note') => {
    const newId = `pnote_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newNoteItem = {
      id: newId,
      title,
      content,
      type,
      color: 'default',
      updatedAt: new Date().toISOString()
    };
    const updated = [newNoteItem, ...projectNotes];
    updateProject(project.id, {
      projectNotes: updated,
      notes: updated[0]?.content || '',
      caseStudyHtml: updated[0]?.content || ''
    });
    setActiveEditingNoteId(newId);
  };

  const handleUpdateCurrentNote = (fields: Partial<{ title: string; content: string; type: string; color: string }>) => {
    if (!activeEditingNoteId) return;
    const updated = projectNotes.map(n => {
      if (n.id === activeEditingNoteId) {
        return { ...n, ...fields, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    updateProject(project.id, {
      projectNotes: updated,
      notes: updated[0]?.content || '',
      caseStudyHtml: updated[0]?.content || ''
    });
  };

  const handleDeleteProjectNote = (noteId: string) => {
    const updated = projectNotes.filter(n => n.id !== noteId);
    updateProject(project.id, {
      projectNotes: updated,
      notes: updated[0]?.content || '',
      caseStudyHtml: updated[0]?.content || ''
    });
    if (activeEditingNoteId === noteId) {
      setActiveEditingNoteId(null);
    }
    notify?.('Catatan dihapus', 'info');
  };

  // ── NOTE EDITOR STATES & HANDLERS (STABLE ARCHITECTURE FROM MEMO MANAGER) ──
  const [isNoteGalleryOpen, setIsNoteGalleryOpen] = useState(false);
  const [activeNoteImageId, setActiveNoteImageId] = useState<string | null>(null);
  const [noteLightboxImage, setNoteLightboxImage] = useState<{ url: string; title?: string; size: 'small' | 'medium' | 'full'; blockIdx: number } | null>(null);
  const lastNoteCaretPosRef = useRef<{ blockIdx: number; caretPos: number }>({ blockIdx: 0, caretPos: 0 });
  const [activeNoteBlockIndex, setActiveNoteBlockIndex] = useState<number>(0);
  const noteImageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isNoteUploadingImage, setIsNoteUploadingImage] = useState(false);
  const noteInputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const handleInsertImageToNote = (url: string, altText?: string) => {
    if (!currentActiveNote) return;
    const cleanAlt = (altText || 'Gambar').replace(/[\r\n|[\]()]/g, ' ').trim();
    const { blockIdx, caretPos } = lastNoteCaretPosRef.current;
    const blocks = parseContentToBlocks(currentActiveNote.content || '');

    const targetIdx = Math.min(Math.max(0, blockIdx), blocks.length - 1);
    const targetBlock = blocks[targetIdx];

    if (targetBlock && targetBlock.type === 'p') {
      const text = targetBlock.text || '';
      const textBefore = text.slice(0, caretPos);
      const textAfter = text.slice(caretPos);

      const newImgBlock: NoteBlock = {
        id: `blk_img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'image',
        text: cleanAlt,
        url,
        size: 'small',
        wrap: 'inline'
      };

      const newBlocks: NoteBlock[] = [];
      if (textBefore.trim() || textBefore.endsWith('\n')) {
        newBlocks.push({ id: `blk_t1_${Date.now()}`, type: 'p', text: textBefore });
      }
      newBlocks.push(newImgBlock);
      if (textAfter.trim() || textAfter.startsWith('\n')) {
        newBlocks.push({ id: `blk_t2_${Date.now() + 1}`, type: 'p', text: textAfter });
      } else {
        newBlocks.push({ id: `blk_t2_${Date.now() + 1}`, type: 'p', text: '' });
      }

      const updated = [
        ...blocks.slice(0, targetIdx),
        ...newBlocks,
        ...blocks.slice(targetIdx + 1)
      ];

      const newContent = serializeBlocksToContent(updated);
      handleUpdateCurrentNote({ content: newContent });
      setActiveNoteBlockIndex(targetIdx + 1);
    } else {
      const current = currentActiveNote.content || '';
      const imgTag = `\n\n![${cleanAlt}|small|inline](${url})\n\n`;
      const newContent = current.trim() ? `${current.trimEnd()}${imgTag}` : `![${cleanAlt}|small|inline](${url})\n\n`;
      handleUpdateCurrentNote({ content: newContent });
    }

    notify?.('Gambar berhasil disisipkan', 'success');
    setIsNoteGalleryOpen(false);
  };

  const handleDirectImageUploadToNote = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsNoteUploadingImage(true);
    notify?.('Mengupload gambar...', 'info');
    try {
      const res: any = await uploadToCloudinary(file, 'image');
      const finalUrl = typeof res === 'string' ? res : res?.url || res?.secure_url || '';
      if (finalUrl) {
        handleInsertImageToNote(finalUrl, file.name.split('.')[0] || 'Gambar');
      }
    } catch (err) {
      console.error('Failed to upload image', err);
      notify?.('Gagal mengupload gambar', 'error');
    } finally {
      setIsNoteUploadingImage(false);
      if (noteImageFileInputRef.current) noteImageFileInputRef.current.value = '';
    }
  };

  const handleMoveNoteBlock = (idx: number, direction: 'up' | 'down') => {
    if (!currentActiveNote) return;
    const blocks = parseContentToBlocks(currentActiveNote.content || '');
    if (direction === 'up' && idx > 0) {
      const updated = [...blocks];
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      handleUpdateCurrentNote({ content: serializeBlocksToContent(updated) });
    } else if (direction === 'down' && idx < blocks.length - 1) {
      const updated = [...blocks];
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      handleUpdateCurrentNote({ content: serializeBlocksToContent(updated) });
    }
  };

  const handleDeleteNoteBlock = (idx: number) => {
    if (!currentActiveNote) return;
    const blocks = parseContentToBlocks(currentActiveNote.content || '');
    const updated = blocks.filter((_, i) => i !== idx);
    const finalBlocks = updated.length > 0 ? updated : [{ id: `blk_${Date.now()}`, type: 'p' as const, text: '' }];
    handleUpdateCurrentNote({ content: serializeBlocksToContent(finalBlocks) });
    setActiveNoteImageId(null);
  };

  const handleUpdateNoteBlock = (idx: number, updates: Partial<NoteBlock>) => {
    if (!currentActiveNote) return;
    const blocks = parseContentToBlocks(currentActiveNote.content || '');
    const updated = blocks.map((b, i) => i === idx ? { ...b, ...updates } : b);
    handleUpdateCurrentNote({ content: serializeBlocksToContent(updated) });
  };

  const handleApplyBlockFormat = (type: string) => {
    if (!currentActiveNote) return;
    const { blockIdx, caretPos } = lastNoteCaretPosRef.current;
    const blocks = parseContentToBlocks(currentActiveNote.content || '');
    const targetIdx = Math.min(Math.max(0, blockIdx), blocks.length - 1);
    const targetBlock = blocks[targetIdx];

    let snippet = '';
    let selectionOffset = 0;
    let selectionLength = 0;

    switch (type) {
      case 'bold':
        snippet = '**Teks Tebal**';
        selectionOffset = 2;
        selectionLength = 10;
        break;
      case 'italic':
        snippet = '*Teks Miring*';
        selectionOffset = 1;
        selectionLength = 11;
        break;
      case 'strikethrough':
        snippet = '~~Teks Coret~~';
        selectionOffset = 2;
        selectionLength = 10;
        break;
      case 'inline-code':
        snippet = '`kode`';
        selectionOffset = 1;
        selectionLength = 4;
        break;
      case 'codeblock':
        snippet = '\n```javascript\n// Tulis kode di sini\n```\n';
        selectionOffset = 15;
        selectionLength = 20;
        break;
      case 'link':
        snippet = '[Tautan](https://example.com)';
        selectionOffset = 1;
        selectionLength = 6;
        break;
      case 'h1':
        snippet = '\n# Judul Utama\n';
        selectionOffset = 3;
        selectionLength = 11;
        break;
      case 'h2':
        snippet = '\n## Sub Judul\n';
        selectionOffset = 4;
        selectionLength = 9;
        break;
      case 'h3':
        snippet = '\n### Bagian\n';
        selectionOffset = 5;
        selectionLength = 6;
        break;
      case 'todo':
        snippet = '\n- [ ] ';
        selectionOffset = 7;
        selectionLength = 0;
        break;
      case 'bullet':
        snippet = '\n- ';
        selectionOffset = 3;
        selectionLength = 0;
        break;
      case 'number':
        snippet = '\n1. ';
        selectionOffset = 4;
        selectionLength = 0;
        break;
      case 'quote':
        snippet = '\n> ';
        selectionOffset = 3;
        selectionLength = 0;
        break;
      case 'callout':
        snippet = '\n> 💡 Catatan penting: ';
        selectionOffset = 22;
        selectionLength = 0;
        break;
      case 'scene':
        snippet = '\n🎬 **[SCENE]** ';
        selectionOffset = 15;
        selectionLength = 0;
        break;
      case 'hook':
        snippet = '\n🎯 **[HOOK]** ';
        selectionOffset = 14;
        selectionLength = 0;
        break;
      case 'cta':
        snippet = '\n📢 **[CTA]** ';
        selectionOffset = 13;
        selectionLength = 0;
        break;
      case 'voiceover':
        snippet = '\n🎙️ **[VO]** ';
        selectionOffset = 12;
        selectionLength = 0;
        break;
      case 'divider':
        snippet = '\n\n---\n\n';
        selectionOffset = 7;
        selectionLength = 0;
        break;
      case 'table':
        snippet = '\n\n| Item / Scene | Deskripsi Visual | Status |\n| :--- | :--- | :--- |\n| Slide 1 | Intro hook visual | Siap |\n| Slide 2 | Poin pembahasan | Proses |\n\n';
        selectionOffset = 2;
        selectionLength = 12;
        break;
      default:
        break;
    }

    if (!snippet) return;

    if (!targetBlock || targetBlock.type === 'image') {
      const freshBlock: NoteBlock = {
        id: `blk_p_${Date.now()}`,
        type: 'p',
        text: snippet
      };
      const nextBlocks = [...blocks, freshBlock];
      handleUpdateCurrentNote({ content: serializeBlocksToContent(nextBlocks) });
      return;
    }

    const text = targetBlock.text || '';
    const before = text.slice(0, caretPos);
    const after = text.slice(caretPos);

    targetBlock.text = `${before}${snippet}${after}`;
    const newContent = serializeBlocksToContent(blocks);
    handleUpdateCurrentNote({ content: newContent });

    const newPos = before.length + selectionOffset;
    lastNoteCaretPosRef.current = { blockIdx: targetIdx, caretPos: newPos };
    setTimeout(() => {
      const el = noteInputRefs.current[targetIdx];
      if (el) {
        el.focus();
        if (selectionLength > 0) {
          el.setSelectionRange(newPos, newPos + selectionLength);
        } else {
          el.setSelectionRange(newPos, newPos);
        }
      }
    }, 20);
  };

  // Checklist Power Actions
  const handleToggleAllChecklists = (done: boolean) => {
    if (!currentActiveNote) return;
    const current = currentActiveNote.content || '';
    const updated = done
      ? current.replace(/- \[\s*\]/g, '- [x]')
      : current.replace(/- \[[xX]\]/g, '- [ ]');
    handleUpdateCurrentNote({ content: updated });
    notify?.(done ? 'Semua to-do selesai' : 'Semua to-do direset', 'info');
  };

  // Copy Note Content
  const handleCopyNoteContent = () => {
    if (!currentActiveNote) return;
    navigator.clipboard?.writeText(currentActiveNote.content || '');
    notify?.('Catatan disalin ke clipboard', 'success');
  };

  // In-Editor AI Actions
  const handleInEditorAiAction = async (action: 'polish' | 'expand' | 'todo' | 'summarize') => {
    if (!currentActiveNote || isAiBriefLoading) return;
    setIsAiBriefLoading(true);
    setIsNoteAiMenuOpen(false);
    notify?.('Memproses AI...', 'info');
    try {
      let instruction = '';
      if (action === 'polish') {
        instruction = 'Rapikan tata bahasa, format markdown (gunakan ## Heading, bullet, callout > Catatan:), perbaiki ejaan, dan buat lebih profesional & terstruktur tanpa emoji.';
      } else if (action === 'expand') {
        instruction = 'Lanjutkan dan kembangkan catatan ini dengan ide kreatif tambahan, tahapan praktis, breakdown scene, dan rincian teknis tanpa emoji.';
      } else if (action === 'todo') {
        instruction = 'Ubah seluruh isi catatan ini menjadi checklist to-do list terstruktur memakai format markdown - [ ] tanpa emoji.';
      } else if (action === 'summarize') {
        instruction = 'Buat ringkasan eksekutif poin-poin kunci secara padat, jelas, dan terstruktur tanpa emoji.';
      }
      const prompt = `Proyek: ${project.title}\nJudul: ${currentActiveNote.title}\nIsi:\n${currentActiveNote.content || currentActiveNote.title}`;
      const res = await callGemini(prompt, instruction);
      if (res && !res.startsWith('API Key belum') && !res.startsWith('Koneksi AI Terkendala') && !res.startsWith('⚠️')) {
        if (action === 'expand') {
          handleUpdateCurrentNote({ content: (currentActiveNote.content || '') + '\n\n' + res });
        } else {
          handleUpdateCurrentNote({ content: res });
        }
        notify?.('Catatan diperbarui AI', 'success');
      } else {
        notify?.(res || 'Gagal memproses AI', 'error');
      }
    } catch (err: any) {
      notify?.('Gagal memproses AI: ' + err.message, 'error');
    } finally {
      setIsAiBriefLoading(false);
    }
  };

  const handleGenerateAiDocument = async (type = 'casestudy') => {
    if (!project || isAiBriefLoading) return;
    setIsAiBriefLoading(true);
    notify?.('Menyusun dokumen AI...', 'info');
    try {
      const isContent = project.type === 'content';
      const prompt = `Proyek: ${project.title}\nDeskripsi: ${project.description || ''}\nKategori: ${project.platform || project.category || 'Desain'}`;
      const instruction = isContent
        ? `Susun naskah lengkap dan copywriting konten media sosial (${project.platform || 'Instagram'} - ${project.format || 'Reels/Post'}). Sertakan: 1. Hook / Opening, 2. Poin Inti (Scene breakdown / Carousel slides), 3. Call to Action (CTA), 4. Rekomendasi Visual & Caption. JANGAN gunakan emoji.`
        : `Susun studi kasus (case study) & brief proyek profesional. Sertakan: 1. Latar Belakang & Problem Statement, 2. Pendekatan Solusi, 3. Tahapan Eksekusi, 4. Hasil Akhir & Dampak. JANGAN gunakan emoji.`;

      const res = await callGemini(prompt, instruction);
      if (res && !res.startsWith('API Key belum') && !res.startsWith('Koneksi AI Terkendala') && !res.startsWith('⚠️')) {
        const newDocTitle = isContent ? `Naskah AI (${projectNotes.length + 1})` : `Studi Kasus AI (${projectNotes.length + 1})`;
        handleAddProjectNote(newDocTitle, res, isContent ? 'script' : 'casestudy');
        notify?.('Dokumen AI berhasil dibuat', 'success');
      } else {
        notify?.(res || 'Gagal membuat dokumen AI', 'error');
      }
    } catch (err: any) {
      notify?.('Gagal memproses AI: ' + err.message, 'error');
    } finally {
      setIsAiBriefLoading(false);
    }
  };

  const normalizedTasks = useMemo(() => {
    const raw = project.tasks || project.subtasks || [];
    return getSafeTasksArray(raw);
  }, [project.tasks, project.subtasks]);

  const completedTasks = normalizedTasks.filter(t => t.done).length;
  const totalTasks = normalizedTasks.length;

  const handleAddQuickSubProject = (titleText = 'Sub-modul Baru') => {
    const newSubId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newSubItem = {
      id: newSubId,
      parentId: project.id,
      type: project.type || 'project',
      platform: project.platform,
      format: project.format,
      category: project.category || 'Sub-modul',
      title: titleText,
      description: '',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      deadline: '',
      progress: 0,
      tasks: [],
      notes: '',
      tags: ['Sub-modul'],
      icon: 'FolderKanban',
      coverImage: '',
      team: [{ name: 'Admin', role: 'Lead', color: 'var(--cms-accent, #7c3aed)' }],
      files: [],
      activity: [{ id: Date.now(), time: new Date().toISOString(), message: 'Sub-modul Dibuat' }]
    };

    addProject(project.id, false, newSubItem);
    const existing = Array.isArray(project.submodules) ? project.submodules : [];
    updateProject(project.id, { submodules: [...existing, newSubItem] });
    notify?.('✨ Kartu sub-modul baru berhasil ditambahkan', 'success');
  };

  const handleGenerateAiSubProjects = async () => {
    if (!project || isAiTaskLoading) return;
    setIsAiTaskLoading(true);
    notify('Asisten AI sedang menyusun sub-modul...', 'info');
    try {
      const generated = await generateAiProjectTasks(project.title, project.description);
      if (generated && generated.length > 0) {
        const newItems: any[] = [];
        generated.forEach((taskTitle: string, idx: number) => {
          const subId = `proj_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`;
          const subItem = {
            id: subId,
            parentId: project.id,
            type: project.type || 'project',
            platform: project.platform,
            format: project.format,
            category: project.category || 'Sub-modul',
            title: taskTitle,
            description: '',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date().toISOString(),
            deadline: '',
            progress: 0,
            tasks: [],
            notes: '',
            tags: ['Sub-modul'],
            icon: 'FolderKanban',
            coverImage: '',
            team: [{ name: 'Admin', role: 'Lead', color: 'var(--cms-accent, #7c3aed)' }],
            files: [],
            activity: [{ id: Date.now(), time: new Date().toISOString(), message: 'Sub-modul AI Dibuat' }]
          };
          addProject(project.id, false, subItem);
          newItems.push(subItem);
        });
        const existing = Array.isArray(project.submodules) ? project.submodules : [];
        updateProject(project.id, { submodules: [...existing, ...newItems] });
        notify(`✨ Berhasil menambahkan ${generated.length} sub-modul dari AI`, 'success');
      } else {
        notify('Gagal menghasilkan sub-modul dari AI', 'error');
      }
    } catch (err: any) {
      notify('Gagal memproses AI: ' + err.message, 'error');
    } finally {
      setIsAiTaskLoading(false);
    }
  };

  const handleGenerateAiSubtasks = async () => {
    if (!project || isAiTaskLoading) return;
    setIsAiTaskLoading(true);
    notify('Asisten AI sedang menyusun sub-tasks...', 'info');
    try {
      const generated = await generateAiProjectTasks(project.title, project.description);
      if (generated && generated.length > 0) {
        const newTasks = generated.map((t, idx) => ({ id: Date.now() + idx, text: t, done: false }));
        updateProject(project.id, { tasks: [...newTasks, ...normalizedTasks] });
        notify(`✨ Berhasil menambahkan ${generated.length} sub-tasks dari AI`, 'success');
      } else {
        notify('Gagal menghasilkan sub-tasks dari AI', 'error');
      }
    } catch (err: any) {
      notify('Gagal memproses AI: ' + err.message, 'error');
    } finally {
      setIsAiTaskLoading(false);
    }
  };

  const handleGenerateAiCaseStudy = async () => {
    if (!project || isAiBriefLoading) return;
    setIsAiBriefLoading(true);
    notify('Asisten AI sedang menyusun Case Study...', 'info');
    try {
      const prompt = `Proyek: ${project.title}\nDeskripsi: ${project.description || ''}\nKategori: ${project.category || 'Desain'}`;
      const instruction = `Susun studi kasus (case study) proyek profesional yang komprehensif.
Sertakan bagian:
1. Latar Belakang & Problem Statement
2. Pendekatan & Solusi Desain
3. Tahapan Eksekusi & Deliverables
4. Hasil Akhir & Dampak Kunci

JANGAN gunakan emoji. Gunakan format teks bersih dan profesional.`;
      const res = await callGemini(prompt, instruction);
      if (res && !res.startsWith('API Key belum') && !res.startsWith('Koneksi AI Terkendala') && !res.startsWith('⚠️')) {
        updateProject(project.id, { caseStudyHtml: res });
        notify('✨ Case study proyek berhasil disusun AI', 'success');
      } else {
        notify(res, 'error');
      }
    } catch (err: any) {
      notify('Gagal memproses AI: ' + err.message, 'error');
    } finally {
      setIsAiBriefLoading(false);
    }
  };

  const handleOpenInNotes = async (mode = 'notes') => {
    try {
      const isContent = project.type === 'content';
      const targetFolderId = isContent ? 'fld_content_plans' : 'fld_projects_regular';
      const targetFolderName = isContent ? 'Rencana Konten' : 'Proyek Regular';
      const targetFolderColor = isContent ? '#ec4899' : '#6366f1';

      // 1. Pastikan target folder tersedia di porto_memo_folders
      const existingFolders = await storage.getItem('porto_memo_folders', []);
      const safeFolders = Array.isArray(existingFolders) ? existingFolders : [];
      if (!safeFolders.some((f: any) => f.id === targetFolderId)) {
        const newFld = {
          id: targetFolderId,
          name: targetFolderName,
          color: targetFolderColor,
          parentId: null,
          createdAt: new Date().toISOString()
        };
        await storage.setItem('porto_memo_folders', [...safeFolders, newFld]);
      }

      // 2. Ambil catatan eksisting
      const existingNotes = await storage.getItem('porto_memo_notes', []);
      const safeNotes = Array.isArray(existingNotes) ? existingNotes : [];

      let note = safeNotes.find((n: any) => n.projectId === project.id);
      let noteId = note?.id;

      const title = project.title || (isContent ? 'Rencana Konten' : 'Proyek Regular');
      const rawContent = mode === 'casestudy'
        ? (project.caseStudyHtml || project.description || '')
        : (project.notes || project.caption || project.description || '');

      const noteTags = isContent
        ? ['Konten', project.platform || 'Instagram', project.format || 'Reels', project.status || 'To Do'].filter(Boolean)
        : ['Proyek', project.category || 'Desain', project.status || 'To Do'].filter(Boolean);

      const headerOpening = `> **📌 Terhubung ke Modul Proyek & Konten**
> **Tipe:** ${isContent ? 'Rencana Konten Media Sosial' : 'Proyek Regular'}
> **Platform / Kategori:** ${isContent ? `${project.platform || 'Instagram'} (${project.format || 'Reels'})` : (project.category || 'Branding & Desain')}
> **Status:** ${project.status || 'To Do'} | **Prioritas:** ${project.priority || 'Medium'}
> **Jadwal:** ${project.deadline || project.scheduledDate || '-'} ${project.scheduledTime ? `(${project.scheduledTime} WIB)` : ''}

---

### 📝 Naskah, Brief & Catatan Eksekusi
`;

      const formattedContent = rawContent.includes('Terhubung ke Modul Proyek & Konten')
        ? rawContent
        : `${headerOpening}${rawContent || 'Tuliskan naskah lengkap, hook video, konsep visual, call-to-action, atau catatan internal di sini...'}`;

      if (!note) {
        note = {
          id: `note_prj_${project.id}_${Date.now()}`,
          projectId: project.id,
          title: `[${isContent ? 'Konten' : 'Proyek'}] ${title}`,
          content: formattedContent,
          folderId: targetFolderId,
          tags: noteTags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await storage.setItem('porto_memo_notes', [note, ...safeNotes]);
        noteId = note.id;
      } else {
        const updated = safeNotes.map((n: any) => {
          if (n.id === note.id) {
            return {
              ...n,
              folderId: targetFolderId,
              tags: noteTags,
              updatedAt: new Date().toISOString()
            };
          }
          return n;
        });
        await storage.setItem('porto_memo_notes', updated);
      }

      sessionStorage.setItem('porto_memo_return_module', 'projects');
      sessionStorage.setItem('porto_memo_return_project_id', String(project.id));
      sessionStorage.setItem('porto_open_project_on_mount', String(project.id));

      const targetNotesUrl = `/admin/notes?folder=${targetFolderId}&view=editor&note=${noteId}`;
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', targetNotesUrl);
      }

      window.dispatchEvent(new CustomEvent('porto_memo_open_note', {
        detail: {
          id: noteId,
          noteId: noteId,
          folderId: targetFolderId,
          mode: 'write',
          note
        }
      }));
      window.dispatchEvent(new CustomEvent('porto_switch_page', { detail: 'notes' }));
      window.dispatchEvent(new CustomEvent('cms_switch_page', { detail: 'notes' }));
      notify?.('Membuka catatan di Aplikasi Notes...', 'success');
      onClose();
    } catch (err) {
      notify?.('Gagal menghubungkan ke Notes', 'error');
    }
  };

  const status = STATUSES.find(s => s.id === project.status) || STATUSES[0];
  const priority = PRIORITIES.find(p => p.id === project.priority) || PRIORITIES[0];

  // ── 1-CLICK PIPELINE: PUBLISH TO PORTFOLIO ──
  const handlePublishToPortfolio = async (proj: any) => {
    try {
      const existingPorto = await storage.getItem('porto_portfolio', []);
      const safePorto = Array.isArray(existingPorto) ? existingPorto : [];

      const exists = safePorto.some((p: any) => p.projectId === proj.id || (p.title && p.title.toLowerCase() === (proj.title || '').toLowerCase()));
      if (exists) {
        notify?.('Karya ini sudah ada di Portofolio Publik ⭐', 'info');
        return;
      }

      const files = Array.isArray(proj.files) ? proj.files : Array.isArray(proj.attachments) ? proj.attachments : [];
      const coverUrl = proj.coverImage || (files[0] && files[0].url) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

      const newPortoItem = {
        id: `portfolio-${Date.now()}`,
        projectId: proj.id,
        title: proj.title || 'Proyek Desain & Kreatif',
        category: proj.category || 'Branding & Desain',
        client: proj.client || proj.clientName || 'Klien sumr.day',
        year: new Date().getFullYear().toString(),
        description: proj.description || proj.notes || 'Karya desain dan pengembangan proyek oleh sumr.day Studio.',
        coverImage: coverUrl,
        gallery: files.map((f: any) => f.url).filter(Boolean),
        tags: Array.isArray(proj.tags) && proj.tags.length > 0 ? proj.tags : ['Design', 'Agency', 'Creative'],
        featured: false,
        createdAt: new Date().toISOString()
      };

      const updated = [newPortoItem, ...safePorto];
      await storage.setItem('porto_portfolio', updated);
      notify?.(`⭐ "${proj.title}" berhasil dipublikasikan ke Portofolio Publik!`, 'success');
    } catch (err) {
      console.error('Error publishing to portfolio:', err);
      notify?.('Gagal mempublikasikan ke portofolio', 'error');
    }
  };

  // ── 1-CLICK PIPELINE: PUBLISH TO SHOP CATALOG ──
  const handlePublishToShopCatalog = async (proj: any) => {
    try {
      const existingProducts = await storage.getItem('porto_catalog_products', []);
      const safeProducts = Array.isArray(existingProducts) ? existingProducts : [];

      const files = Array.isArray(proj.files) ? proj.files : Array.isArray(proj.attachments) ? proj.attachments : [];
      const coverUrl = proj.coverImage || (files[0] && files[0].url) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

      const newProduct = {
        id: `prod-${Date.now()}`,
        productCode: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
        name: proj.title || 'Template & Aset Digital',
        category: proj.category || 'Digital',
        type: 'Digital',
        price: 0,
        originalPrice: 0,
        stock: 999,
        description: proj.description || proj.notes || 'Aset dan template digital siap pakai dari sumr.day Studio.',
        gallery: [coverUrl, ...files.map((f: any) => f.url).filter(Boolean)].slice(0, 5),
        isPublished: true,
        isDigitalAsset: true,
        accessModel: 'lifetime',
        downloadUrl: (files[0] && files[0].url) || '',
        createdAt: new Date().toISOString()
      };

      const updated = [newProduct, ...safeProducts];
      await storage.setItem('porto_catalog_products', updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: updated }));
      }
      notify?.(`🛍️ "${proj.title}" berhasil dijadikan Template di Katalog Toko!`, 'success');
    } catch (err) {
      console.error('Error publishing to shop:', err);
      notify?.('Gagal menyimpan ke katalog toko', 'error');
    }
  };

  // ── SMART WHATSAPP STATUS NOTIFICATION ──
  const handleSendWaStatusUpdate = () => {
    const rawPhone = project.clientPhone || project.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phoneToUse = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const clientName = project.client || project.clientName || 'Klien';
    const statusLabel = status.label || 'Dalam Pengerjaan';
    const deadlineStr = project.deadline ? new Date(project.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sumr.day';
    const proofingLink = `${origin}/client/account?order=${encodeURIComponent(project.id)}&tab=proofing`;

    const text = `Halo Kak *${clientName}*! 👋

Update terbaru pengerjaan proyek dari *sumr.day Studio*:
📌 Proyek: *${project.title || 'Proyek'}*
📊 Status Terkini: *${statusLabel}*
📅 Target Deadline: *${deadlineStr}*

🔗 Cek perkembangan dan pratinjau desain Anda melalui Portal Klien:
${proofingLink}

Silakan kabari kami jika ada masukan atau pertanyaan ya Kak. Terima kasih! 🙏✨`;

    if (!phoneToUse) {
      const inputPhone = window.prompt('Masukkan nomor WhatsApp Klien (contoh: 08123456789):', '');
      if (!inputPhone) return;
      const cleanInput = inputPhone.replace(/\D/g, '');
      const formatted = cleanInput.startsWith('0') ? '62' + cleanInput.slice(1) : cleanInput;
      updateProject(project.id, { clientPhone: formatted });
      window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      notify?.('Membuka WhatsApp untuk update status', 'success');
      return;
    }

    window.open(`https://wa.me/${phoneToUse}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    notify?.('Membuka WhatsApp untuk update status', 'success');
  };

  // ── SMART ASSET DROP LINK GENERATOR & SENDER ──
  const handleSendAssetDropLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sumr.day';
    const dropUrl = `${origin}/drop/${encodeURIComponent(project.id)}`;

    try {
      navigator.clipboard.writeText(dropUrl);
    } catch { }

    const rawPhone = project.clientPhone || project.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phoneToUse = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const clientName = project.client || project.clientName || 'Klien';

    const text = `Halo Kak *${clientName}*! 👋☀️

Untuk memulai pengerjaan proyek *"${project.title || 'Proyek'}"*, silakan kirimkan materi brand (logo vektor, foto produk HD, dokumen brief) melalui portal serah terima materi resmi sumr.day berikut:

🔗 ${dropUrl}

(Bisa langsung drag & drop file ukuran besar tanpa repot login). Terima kasih! 🙏✨`;

    if (phoneToUse) {
      window.open(`https://wa.me/${phoneToUse}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      notify?.(`Tautan /drop disalin & membuka WhatsApp klien (${clientName})`, 'success');
    } else {
      notify?.(`Tautan serah terima berkas disalin: ${dropUrl}`, 'success');
    }
  };

  const addTask = (e: any) => {
    e?.preventDefault?.();
    if (!newTask.trim()) return;
    const task = { id: Date.now(), text: newTask.trim(), done: false };
    updateProject(project.id, { tasks: [task, ...normalizedTasks] });
    setNewTask('');
  };

  const toggleTask = (taskId: any) => {
    const updated = normalizedTasks.map(t => String(t.id) === String(taskId) ? { ...t, done: !t.done } : t);
    updateProject(project.id, { tasks: updated });
  };

  const deleteTask = (taskId: any) => {
    const updated = normalizedTasks.filter(t => String(t.id) !== String(taskId));
    updateProject(project.id, { tasks: updated });
  };

  const subProjects = useMemo(() => {
    const fromGlobal = (Array.isArray(projects) ? projects : []).filter(
      p => p && p.parentId && String(p.parentId) === String(project.id) && !p.isDeleted && !p.isTrash
    );
    const fromLocal = (Array.isArray(project.submodules) ? project.submodules : []).filter(
      (p: any) => p && !p.isDeleted && !p.isTrash
    );
    const map = new Map();
    fromGlobal.forEach(p => map.set(String(p.id), p));
    fromLocal.forEach((p: any) => {
      if (!map.has(String(p.id))) {
        map.set(String(p.id), { ...p, parentId: project.id });
      }
    });
    return Array.from(map.values());
  }, [projects, project.id, project.submodules]);

  const parentProject = useMemo(() => {
    return project.parentId ? (Array.isArray(projects) ? projects : []).find(p => String(p.id) === String(project.parentId)) : null;
  }, [projects, project.parentId]);

  // Real-time Admin Users from Firestore
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');

  useEffect(() => {
    const unsub = storage.listenItem('porto_users', (users) => {
      if (Array.isArray(users) && users.length > 0) {
        setAdminUsers(users);
      } else {
        storage.getItem('porto_settings', {}).then(settings => {
          if (Array.isArray(settings?.adminUsers) && settings.adminUsers.length > 0) {
            setAdminUsers(settings.adminUsers);
          }
        }).catch(() => { });
      }
    });
    return () => unsub();
  }, []);

  const TABS = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: <FolderKanban size={13} /> },
    { id: 'tasks', label: `Tasks ${totalTasks > 0 ? `(${completedTasks}/${totalTasks})` : ''}`, shortLabel: `Tasks ${totalTasks > 0 ? `(${completedTasks})` : ''}`, icon: <ListTodo size={13} /> },
    { id: 'team', label: `Tim / Tag (${getSafeArray(project.team).length})`, shortLabel: `Tim (${getSafeArray(project.team).length})`, icon: <UserCheck size={13} /> },
    { id: 'comments', label: `Diskusi (${getSafeArray(project.comments).length})`, shortLabel: `Diskusi (${getSafeArray(project.comments).length})`, icon: <MessageSquare size={13} /> },
    { id: 'files', label: `Files ${getSafeArray(project.files).length > 0 ? `(${getSafeArray(project.files).length})` : ''}`, shortLabel: 'Files', icon: <Paperclip size={13} /> },
    { id: 'activity', label: 'Activity', shortLabel: 'Log', icon: <History size={13} /> },
  ];

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="project-pill-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483640,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: isMobile ? 'none' : 'blur(4px)',
        WebkitBackdropFilter: isMobile ? 'none' : 'blur(4px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 20,
        boxSizing: 'border-box',
        animation: 'cmsFadeIn 0.2s ease both'
      }}
    >
      {/* Modal Container */}
      <div
        className="project-pill-modal-inner"
        onClick={(e) => e.stopPropagation()}
        style={isMobile ? {
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100dvh',
          maxHeight: '100dvh',
          background: 'var(--cms-card-bg)',
          borderRadius: 0,
          boxShadow: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          animation: 'cmsFadeIn 0.22s ease both',
          overflow: 'hidden',
          boxSizing: 'border-box',
          zIndex: 2147483645
        } : {
          position: 'relative',
          width: isModalFullscreen ? 'calc(100vw - 40px)' : '100%',
          maxWidth: isModalFullscreen ? '1420px' : '850px',
          height: isModalFullscreen ? 'calc(100vh - 40px)' : '82vh',
          maxHeight: isModalFullscreen ? 'calc(100dvh - 40px)' : '82dvh',
          background: 'var(--cms-card-bg)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: isModalFullscreen ? '24px' : '32px',
          boxShadow: '0 25px 80px -10px rgba(0,0,0,0.45), 0 0 0 1px var(--glass-border)',
          border: '1.5px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'pmModalIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* ── IN-MODAL FULL-SIZE DOCUMENT & SCRIPT EDITOR OVERLAY ── */}
        {activeEditingNoteId && (() => {
          const activeNoteTheme = NOTE_COLOR_THEMES[currentActiveNote?.color || 'default'] || NOTE_COLOR_THEMES.default;
          const blocks = parseContentToBlocks(currentActiveNote?.content || '');

          return (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--cms-card-bg)',
              borderTop: `3px solid ${activeNoteTheme.dot}`,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: isMobile ? 0 : 32,
              overflow: 'hidden',
              animation: 'cmsFadeIn 0.18s ease-out'
            }}>
              {/* Hidden File Input for Direct Local Image Upload */}
              <input
                type="file"
                ref={noteImageFileInputRef}
                accept="image/*"
                onChange={handleDirectImageUploadToNote}
                style={{ display: 'none' }}
              />

              {/* ── 1. TOP BAR: NAVIGATION, TITLE & PRIMARY ACTIONS ── */}
              <div style={{
                padding: isMobile ? '8px 12px' : '12px 20px',
                borderBottom: '1.5px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                background: 'var(--cms-card-bg)',
                flexShrink: 0,
                zIndex: 20,
                paddingTop: isMobile ? 'max(8px, env(safe-area-inset-top))' : '12px'
              }}>
                {/* Left: Back, Color & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => setActiveEditingNoteId(null)}
                    style={{
                      width: 32, height: 32, borderRadius: 10, border: '1.5px solid var(--glass-border)',
                      background: 'var(--cms-input-bg)', color: 'var(--cms-text)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                    title="Kembali"
                  >
                    <ArrowLeft size={15} />
                  </button>

                  {/* Color Picker Dot */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setIsNoteColorPickerOpen(!isNoteColorPickerOpen)}
                      style={{
                        width: 22, height: 22, minWidth: 22, minHeight: 22,
                        borderRadius: '50%',
                        background: activeNoteTheme.dot,
                        border: 'none',
                        cursor: 'pointer', padding: 0, flexShrink: 0,
                        boxShadow: `0 0 0 2px var(--cms-card-bg), 0 0 0 3.5px ${activeNoteTheme.dot}`
                      }}
                      title="Ubah Tema Warna"
                    />


                    {isNoteColorPickerOpen && (
                      <>
                        {/* Backdrop dismiss */}
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                          onClick={() => setIsNoteColorPickerOpen(false)}
                        />
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                          background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                          borderRadius: 14, padding: '8px 10px',
                          display: 'flex', gap: 8, zIndex: 50, flexWrap: 'nowrap',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.35)', animation: 'cmsPopIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
                          alignItems: 'center'
                        }}>
                          {Object.entries(NOTE_COLOR_THEMES).map(([k, c]) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                handleUpdateCurrentNote({ color: k });
                                setIsNoteColorPickerOpen(false);
                              }}
                              style={{
                                width: 26, height: 26, minWidth: 26, minHeight: 26,
                                borderRadius: '50%', background: c.dot,
                                border: currentActiveNote?.color === k ? '2.5px solid #fff' : '2px solid transparent',
                                cursor: 'pointer', padding: 0, flexShrink: 0,
                                transform: currentActiveNote?.color === k ? 'scale(1.2)' : 'scale(1)',
                                transition: 'all 0.15s ease',
                                boxShadow: currentActiveNote?.color === k ? `0 0 0 2px ${c.dot}` : 'none'
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    value={currentActiveNote?.title || ''}
                    onChange={e => handleUpdateCurrentNote({ title: e.target.value })}
                    placeholder="Judul..."
                    style={{
                      fontSize: isMobile ? 14 : 16.5,
                      fontWeight: 900,
                      color: 'var(--cms-text)',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      minWidth: 0
                    }}
                  />
                </div>

                {/* Right: AI Tools & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {/* AI Menu Button & Dropdown */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setIsNoteAiMenuOpen(!isNoteAiMenuOpen)}
                      disabled={isAiBriefLoading}
                      style={{
                        height: 30,
                        padding: '0 8px',
                        borderRadius: 10,
                        border: '1.5px solid var(--glass-border)',
                        background: isNoteAiMenuOpen ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)',
                        color: 'var(--cms-accent)',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: isAiBriefLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Asisten AI"
                    >
                      {isAiBriefLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      {!isMobile && <span>AI</span>}
                      <ChevronDown size={10} />
                    </button>

                    {isNoteAiMenuOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                        background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                        borderRadius: 14, padding: 6, display: 'flex', flexDirection: 'column', gap: 3,
                        minWidth: 180, zIndex: 60, boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                        animation: 'cmsFadeIn 0.15s ease'
                      }}>
                        <button type="button" onClick={() => handleInEditorAiAction('polish')} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Sparkles size={14} color="var(--cms-accent)" /><span>Rapikan Teks</span>
                        </button>
                        <button type="button" onClick={() => handleInEditorAiAction('expand')} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <PenTool size={14} color="#a855f7" /><span>Kembangkan Ide</span>
                        </button>
                        <button type="button" onClick={() => handleInEditorAiAction('todo')} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <CheckSquare size={14} color="#10b981" /><span>Checklist To-Do</span>
                        </button>
                        <button type="button" onClick={() => handleInEditorAiAction('summarize')} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <FileText size={14} color="#3b82f6" /><span>Ringkasan</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyNoteContent}
                    style={{
                      width: 30, height: 30, borderRadius: 9, border: '1.5px solid var(--glass-border)',
                      background: 'var(--cms-input-bg)', color: 'var(--cms-text)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Salin Catatan"
                  >
                    <Copy size={13} />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteProjectNote(activeEditingNoteId);
                      setActiveEditingNoteId(null);
                    }}
                    style={{
                      width: 30, height: 30, borderRadius: 9, border: 'none',
                      background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Hapus"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Selesai Button — icon-only on mobile */}
                  <button
                    type="button"
                    onClick={() => setActiveEditingNoteId(null)}
                    style={{
                      padding: isMobile ? '0' : '0 14px',
                      width: isMobile ? 30 : 'auto',
                      height: 30,
                      borderRadius: isMobile ? 9 : 100,
                      border: 'none',
                      background: 'var(--cms-accent)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.3)'
                    }}
                    title="Selesai"
                  >
                    {isMobile ? <Check size={14} /> : <><Check size={14} /><span>Selesai</span></>}
                  </button>
                </div>
              </div>

              {/* ── 2. PURE ICON-ONLY TOOLBAR (SCROLLABLE ON MOBILE) ── */}
              <div
                style={{
                  padding: isMobile ? '5px 10px' : '6px 14px',
                  borderBottom: '1px solid var(--glass-border)',
                  background: 'var(--cms-card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 4 : 6,
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}
              >
                {/* Text Styling */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'var(--cms-input-bg)', padding: '2px 3px', borderRadius: 8, border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                  <button type="button" onClick={() => handleApplyBlockFormat('bold')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Tebal"><Bold size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('italic')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Miring"><Italic size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('strikethrough')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Coret"><Strikethrough size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('inline-code')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }} title="Kode">&lt;/&gt;</button>
                </div>

                {/* Headings */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'var(--cms-input-bg)', padding: '2px 3px', borderRadius: 8, border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                  <button type="button" onClick={() => handleApplyBlockFormat('h1')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="H1"><Heading1 size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('h2')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="H2"><Heading2 size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('h3')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="H3"><Heading3 size={12} /></button>
                </div>

                {/* Lists & To-Do */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'var(--cms-input-bg)', padding: '2px 3px', borderRadius: 8, border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                  <button type="button" onClick={() => handleApplyBlockFormat('todo')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Checklist"><CheckSquare size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('bullet')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Bullet"><List size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('number')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Nomor"><ListOrdered size={12} /></button>
                </div>

                {/* Blocks */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'var(--cms-input-bg)', padding: '2px 3px', borderRadius: 8, border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                  <button type="button" onClick={() => handleApplyBlockFormat('quote')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Quote"><Quote size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('callout')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Callout"><Lightbulb size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('codeblock')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Kode Blok"><Code size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('divider')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Garis"><Minus size={12} /></button>
                </div>

                {/* Image */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'var(--cms-input-bg)', padding: '2px 3px', borderRadius: 8, border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                  <button type="button" onClick={() => setIsNoteGalleryOpen(true)} disabled={isNoteUploadingImage} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-accent)', cursor: isNoteUploadingImage ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Galeri">{isNoteUploadingImage ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}</button>
                  <button type="button" onClick={() => noteImageFileInputRef.current?.click()} disabled={isNoteUploadingImage} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Upload"><Upload size={11} /></button>
                </div>

                {/* Creative Snippets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, background: 'var(--cms-input-bg)', padding: '2px 3px', borderRadius: 8, border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                  <button type="button" onClick={() => handleApplyBlockFormat('scene')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--cms-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Scene"><Film size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('hook')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Hook"><Target size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('cta')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="CTA"><Megaphone size={12} /></button>
                  <button type="button" onClick={() => handleApplyBlockFormat('voiceover')} style={{ height: 24, width: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="VO"><Volume2 size={12} /></button>
                </div>

                {/* Checklist Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginLeft: 'auto' }}>
                  <button type="button" onClick={() => handleToggleAllChecklists(true)} style={{ height: 24, width: 24, borderRadius: 7, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.12)', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Centang Semua"><CheckCheck size={12} /></button>
                  <button type="button" onClick={() => handleToggleAllChecklists(false)} style={{ height: 24, width: 24, borderRadius: 7, border: '1px solid var(--glass-border)', background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reset"><RotateCcw size={11} /></button>
                </div>
              </div>

              {/* ── 3. CONTINUOUS DOCUMENT CANVAS (SEAMLESS & STABLE TYPING) ── */}
              <div
                className="memo-canvas-container"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: isMobile ? '12px 10px 20px 10px' : '24px 32px 100px',
                  scrollbarWidth: 'thin',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  className="memo-document-sheet"
                  style={{
                    width: '100%',
                    maxWidth: 840,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                    paddingBottom: isMobile ? 'calc(84px + env(safe-area-inset-bottom, 12px))' : '100px'
                  }}
                >
                  <ProjectRichBlockNotepad
                    content={currentActiveNote?.content || ''}
                    onChange={(newContent) => {
                      handleUpdateCurrentNote({ content: newContent });
                    }}
                    activeBlockIndex={activeNoteBlockIndex}
                    setActiveBlockIndex={setActiveNoteBlockIndex}
                    onCaretChange={(blockIdx, caretPos) => {
                      lastNoteCaretPosRef.current = { blockIdx, caretPos };
                    }}
                    onOpenLightbox={(img) => setNoteLightboxImage(img)}
                  />
                  {/* Generous bottom clearance spacer */}
                  <div style={{ height: isMobile ? 220 : 100, width: '100%', flexShrink: 0, pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Bottom Footer Info */}
              <div style={{
                padding: isMobile ? '6px 14px' : '8px 18px',
                borderTop: '1px solid var(--glass-border)',
                background: 'var(--cms-card-bg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: isMobile ? 10 : 11,
                color: 'var(--cms-text-muted)',
                fontWeight: 600,
                flexShrink: 0
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeNoteTheme.dot }} />
                  {isMobile ? 'Auto-save' : 'Tersimpan otomatis'}
                </span>
                <span>
                  {currentActiveNote?.content?.length || 0} kar • {(currentActiveNote?.content || '').split(/\s+/).filter(Boolean).length} kata
                </span>
              </div>
            </div>
          );
        })()}

        {/* ── MEDIA GALLERY MODAL INTEGRATION FOR NOTE EDITOR ── */}
        <MediaGalleryModal
          isOpen={isNoteGalleryOpen}
          onClose={() => setIsNoteGalleryOpen(false)}
          onSelect={(media: any) => {
            if (media && (media.secure_url || media.url)) {
              handleInsertImageToNote(media.secure_url || media.url, media.original_filename || media.title || 'Gambar');
            }
          }}
        />

        {/* ── LIGHTBOX ZOOM MODAL FOR NOTE IMAGES ── */}
        {noteLightboxImage && (
          <div
            onClick={() => setNoteLightboxImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              background: 'rgba(4, 4, 8, 0.92)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              animation: 'cmsFadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              <button
                type="button"
                onClick={() => setNoteLightboxImage(null)}
                style={{
                  position: 'absolute',
                  top: -16,
                  right: -16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <X size={18} />
              </button>
              <img
                src={noteLightboxImage.url}
                alt={noteLightboxImage.title || 'Preview'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '82vh',
                  borderRadius: 16,
                  objectFit: 'contain',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                }}
              />
              {noteLightboxImage.title && (
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700 }}>
                  {noteLightboxImage.title}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: isMobile ? '16px 16px 0' : '24px 24px 0', paddingTop: isMobile ? 'max(16px, env(safe-area-inset-top))' : '24px', display: 'flex', alignItems: 'flex-start', gap: 14, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
              title="Klik untuk ganti icon proyek"
              style={{
                width: isMobile ? 44 : 52,
                height: isMobile ? 44 : 52,
                borderRadius: 16,
                background: 'var(--cms-input-bg)',
                border: '1.5px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cms-accent)',
                flexShrink: 0,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--cms-accent)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {renderProjectIcon(project.icon, isMobile ? 22 : 26)}
              <div style={{
                position: 'absolute',
                bottom: -3,
                right: -3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'var(--cms-accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--cms-panel-bg)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                <Edit3 size={9} strokeWidth={2.5} />
              </div>
            </button>

            {isIconPickerOpen && (
              <ProjectIconPicker
                value={project.icon || 'FolderKanban'}
                onChange={(newIcon) => {
                  updateProject(project.id, { icon: newIcon });
                  notify('✨ Icon proyek berhasil diperbarui', 'success');
                }}
                onClose={() => setIsIconPickerOpen(false)}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {parentProject && (
              <button
                onClick={() => { setSelectedProject(parentProject); setActiveTab('overview'); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(var(--cms-accent-rgb), 0.08)', color: 'var(--cms-accent)',
                  border: 'none', padding: '5px 12px', borderRadius: 100,
                  fontSize: 11, fontWeight: 900, cursor: 'pointer', marginBottom: 6,
                  outline: 'none', transition: 'all 0.2s ease',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.15)';
                  e.currentTarget.style.transform = 'translateX(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.08)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <ArrowLeft size={12} strokeWidth={3} /> Back to {parentProject.title}
              </button>
            )}
            <input
              value={getSafeString(project.title)}
              onChange={e => updateProject(project.id, { title: e.target.value })}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: isMobile ? 18 : 20, fontWeight: 900, color: 'var(--cms-text)', fontFamily: 'inherit' }}
              placeholder="Project Title"
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: status.bg, color: status.color, fontSize: 10, fontWeight: 900, padding: '3px 9px', borderRadius: 100 }}>{status.label}</span>
              <span style={{ background: priority.bg, color: priority.color, fontSize: 10, fontWeight: 900, padding: '3px 9px', borderRadius: 100 }}>{priority.label}</span>
              {project.deadline && (
                <span style={{ background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, position: 'relative', alignItems: 'center' }}>
            {/* On mobile: single kebab menu button + close. On desktop: all buttons visible */}
            {isMobile ? (
              <>
                {/* Mobile: single "More" button */}
                <button
                  type="button"
                  onClick={() => setIsHeaderActionsMenuOpen(prev => !prev)}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: isHeaderActionsMenuOpen ? 'var(--cms-accent-soft)' : 'var(--cms-input-bg)', border: isHeaderActionsMenuOpen ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)', color: isHeaderActionsMenuOpen ? 'var(--cms-accent)' : 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                  title="Aksi Lainnya"
                >
                  <MoreHorizontal size={17} />
                </button>
                <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
                  <X size={17} />
                </button>
                {/* Mobile: dropdown menu for all actions */}
                {isHeaderActionsMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={() => setIsHeaderActionsMenuOpen(false)} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 230,
                      background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: 8,
                      zIndex: 9998, animation: 'cmsPopIn 0.2s cubic-bezier(0.16,1,0.3,1) both'
                    }}>
                      <button type="button" onClick={() => { const { googleUrl } = generateProjectCalendarEvent(project, 'deadline'); window.open(googleUrl, '_blank', 'noopener,noreferrer'); setIsHeaderActionsMenuOpen(false); notify('Membuka Google Calendar', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Calendar size={15} color="#3b82f6" /> <span>Google Calendar</span>
                      </button>
                      <button type="button" onClick={() => { const { googleUrl } = generateProjectCalendarEvent(project, 'review'); window.open(googleUrl, '_blank', 'noopener,noreferrer'); setIsHeaderActionsMenuOpen(false); notify('Membuka Google Meet', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Users size={15} color="#3b82f6" /> <span>Review Meet</span>
                      </button>
                      <button type="button" onClick={() => { const { icsContent } = generateProjectCalendarEvent(project, 'deadline'); downloadIcsFile(`${project.title || 'proyek'}-deadline.ics`, icsContent); setIsHeaderActionsMenuOpen(false); notify('Berkas iCal diunduh', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Download size={15} color="#10b981" /> <span>Unduh iCal</span>
                      </button>
                      <button type="button" onClick={() => { handleSendWaStatusUpdate(); setIsHeaderActionsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#22c55e', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <MessageCircle size={15} color="#22c55e" /> <span>Update WA</span>
                      </button>
                      <button type="button" onClick={() => { setIsProofingModalOpen(true); setIsHeaderActionsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#06b6d4', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <ShieldCheck size={15} color="#06b6d4" /> <span>Proofing Klien</span>
                      </button>
                      <button type="button" onClick={() => { handlePublishToPortfolio(project); setIsHeaderActionsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#f59e0b', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Award size={15} color="#f59e0b" /> <span>Jadikan Portofolio</span>
                      </button>
                      <button type="button" onClick={() => { handlePublishToShopCatalog(project); setIsHeaderActionsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#10b981', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Store size={15} color="#10b981" /> <span>Template Toko</span>
                      </button>
                      <button type="button" onClick={() => { handleSendAssetDropLink(); setIsHeaderActionsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#0ea5e9', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Upload size={15} color="#0ea5e9" /> <span>Serah Terima</span>
                      </button>
                      <button type="button" onClick={() => { handleCreateInvoiceForProject(project); onClose(); setIsHeaderActionsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Receipt size={15} color="#8b5cf6" /> <span>Buat Tagihan</span>
                      </button>
                      <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
                      <button type="button" onClick={() => { const taskList = (project.subtasks || project.tasks || []).map((t: any) => typeof t === 'string' ? t : t.text || t.title).filter(Boolean); const newTmpl: OfflineProjectTemplate = { id: `custom_from_${project.id}_${Date.now()}`, label: project.title || 'Template Proyek', category: (project.category || 'design').toLowerCase().replace(/\s+/g, '_') as any, icon: project.icon || 'FolderKanban', title: project.title || 'Template Proyek', description: project.description || 'Disimpan dari proyek aktif', priority: project.priority || 'medium', tags: Array.isArray(project.tags) ? project.tags : ['Custom'], estimatedDays: 14, tasks: taskList.length > 0 ? taskList : ['Persiapan', 'Pengerjaan', 'Finalisasi'], notes: project.notes || '', prompt: project.description || project.title || '' }; saveCustomProjectTemplate(newTmpl); setIsHeaderActionsMenuOpen(false); notify?.(`Disimpan sebagai Template ⭐`, 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Bookmark size={15} color="#10b981" /> <span>Simpan Template</span>
                      </button>
                      <button type="button" onClick={async () => { await removeProject(project.id); onClose(); setIsHeaderActionsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, border: 'none', background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Trash2 size={15} /> <span>Hapus Proyek</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Desktop: all buttons visible */}
                <button
                  type="button"
                  onClick={() => setIsCalendarMenuOpen(!isCalendarMenuOpen)}
                  title="Hubungkan & Sinkron ke Google Calendar"
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Calendar size={15} />
                </button>

                {isCalendarMenuOpen && (
                  <div
                    style={{
                      position: 'absolute', top: '120%', right: 0, width: 260,
                      background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.4)', padding: 10,
                      zIndex: 9999, backdropFilter: 'blur(20px)', animation: 'cmsPopIn 0.2s cubic-bezier(0.16,1,0.3,1) both'
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} color="#3b82f6" /> Google Calendar Sync
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      <button type="button" onClick={() => { const { googleUrl } = generateProjectCalendarEvent(project, 'deadline'); window.open(googleUrl, '_blank', 'noopener,noreferrer'); setIsCalendarMenuOpen(false); notify('Membuka Google Calendar untuk target deadline', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Target size={14} color="#ef4444" /><span>Target Deadline</span>
                      </button>
                      <button type="button" onClick={() => { const { googleUrl } = generateProjectCalendarEvent(project, 'review'); window.open(googleUrl, '_blank', 'noopener,noreferrer'); setIsCalendarMenuOpen(false); notify('Membuka Google Calendar untuk review', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Users size={14} color="#3b82f6" /><span>Review Meet</span>
                      </button>
                      <button type="button" onClick={() => { const { icsContent } = generateProjectCalendarEvent(project, 'deadline'); downloadIcsFile(`${project.title || 'proyek'}-deadline.ics`, icsContent); setIsCalendarMenuOpen(false); notify('Berkas iCal diunduh', 'success'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Download size={14} color="#10b981" /><span>Unduh iCal</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const taskList = (project.subtasks || project.tasks || []).map((t: any) => typeof t === 'string' ? t : t.text || t.title).filter(Boolean);
                    const newTmpl: OfflineProjectTemplate = {
                      id: `custom_from_${project.id}_${Date.now()}`,
                      label: project.title || 'Template Proyek',
                      category: (project.category || 'design').toLowerCase().replace(/\s+/g, '_') as any,
                      icon: project.icon || 'FolderKanban',
                      title: project.title || 'Template Proyek',
                      description: project.description || 'Disimpan dari proyek aktif',
                      priority: project.priority || 'medium',
                      tags: Array.isArray(project.tags) ? project.tags : ['Custom'],
                      estimatedDays: 14,
                      tasks: taskList.length > 0 ? taskList : ['Persiapan', 'Pengerjaan', 'Finalisasi'],
                      notes: project.notes || '',
                      prompt: project.description || project.title || ''
                    };
                    saveCustomProjectTemplate(newTmpl);
                    notify?.(`Proyek "${project.title}" berhasil disimpan sebagai Template! ⭐`, 'success');
                  }}
                  title="Simpan Proyek Ini sebagai Template"
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Bookmark size={15} />
                </button>
                {/* WhatsApp Status Update */}
                <button
                  type="button"
                  onClick={handleSendWaStatusUpdate}
                  title="Kirim Update Status via WhatsApp"
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <MessageCircle size={15} />
                </button>

                {/* Proofing & Watermark */}
                <button
                  type="button"
                  onClick={() => setIsProofingModalOpen(true)}
                  title="Pratinjau Watermark & Proofing Klien"
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#06b6d4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <ShieldCheck size={15} />
                </button>

                {/* 1-Click Pipeline (Portofolio & Toko) */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsPipelineMenuOpen(!isPipelineMenuOpen)}
                    title="Jadikan Portofolio atau Template Produk Toko"
                    style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <Share2 size={15} />
                  </button>

                  {isPipelineMenuOpen && (
                    <div
                      style={{
                        position: 'absolute', top: '120%', right: 0, width: 220,
                        background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                        borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.4)', padding: 8,
                        zIndex: 9999, backdropFilter: 'blur(20px)', animation: 'cmsPopIn 0.2s ease both'
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
                        1-Click Pipeline
                      </div>
                      <button
                        type="button"
                        onClick={() => { handlePublishToPortfolio(project); setIsPipelineMenuOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Award size={14} color="#f59e0b" />
                        <span>Jadikan Portofolio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { handlePublishToShopCatalog(project); setIsPipelineMenuOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Store size={14} color="#10b981" />
                        <span>Template Toko</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSendAssetDropLink}
                  title="Kirim Magic Link Asset Drop (/drop) ke Klien via WhatsApp"
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', color: '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <Upload size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCreateInvoiceForProject(project);
                    onClose();
                  }}
                  title="Buat Invoice / Nota Tagihan Proyek"
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <Receipt size={15} />
                </button>
                <button
                  onClick={async () => {
                    await removeProject(project.id);
                    onClose();
                  }}
                  title="Pindahkan ke Sampah"
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <Trash2 size={15} />
                </button>
                {/* Fullscreen Modal Toggle - desktop only */}
                <button
                  type="button"
                  onClick={() => setIsModalFullscreen(prev => !prev)}
                  style={{ width: 34, height: 34, borderRadius: '50%', background: isModalFullscreen ? 'rgba(var(--cms-accent-rgb), 0.15)' : 'var(--cms-input-bg)', border: isModalFullscreen ? '1.5px solid var(--cms-accent)' : '1px solid var(--glass-border)', color: isModalFullscreen ? 'var(--cms-accent)' : 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                  title={isModalFullscreen ? "Kecilkan Tampilan Modal" : "Tampilan Penuh (Fullscreen)"}
                >
                  {isModalFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', color: 'var(--cms-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cms-hover-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--cms-input-bg)'}
                >
                  <X size={17} />
                </button>
              </>
            )}
          </div>
        </div>



        {/* Progress Slider */}
        <div style={{ padding: isMobile ? '10px 16px 0' : '12px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ProgressRing progress={getSafeProgress(project.progress)} size={28} color="var(--cms-accent)" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={getSafeProgress(project.progress)}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  updateProject(project.id, { progress: val === '' ? 0 : Math.max(0, Math.min(100, Number(val))) });
                }}
                style={{ width: 44, height: 28, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 8, padding: '2px 4px', fontSize: 13, fontWeight: 900, color: 'var(--cms-text)', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>%</span>
            </div>
          </div>
          <input
            type="range" min={0} max={100}
            value={getSafeProgress(project.progress)}
            onChange={e => updateProject(project.id, { progress: Number(e.target.value) })}
            className="pm-range"
            style={{ width: '100%', cursor: 'pointer', background: `linear-gradient(to right, var(--cms-accent) ${getSafeProgress(project.progress)}%, var(--cms-input-bg) ${getSafeProgress(project.progress)}%)` }}
          />
        </div>

        {/* ── SINGLE ROW: ICON-ONLY TABS + ICON-ONLY TYPE SWITCHER (GAMBAR 2) ── */}
        <div style={{
          padding: isMobile ? '10px 16px 14px' : '12px 24px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {/* Left: Icon-Only Tabs with Count Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {TABS.map(tab => {
              const badgeCount =
                tab.id === 'tasks' ? subProjects.length :
                  tab.id === 'team' ? getSafeArray(project.team).length :
                    tab.id === 'chat' ? (project.comments?.length || 0) :
                      tab.id === 'files' ? (project.files?.length || 0) : 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  style={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    minWidth: isMobile ? 32 : 36,
                    minHeight: isMobile ? 32 : 36,
                    aspectRatio: '1/1',
                    padding: 0,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    background: activeTab === tab.id ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                    color: activeTab === tab.id ? '#fff' : 'var(--cms-text-muted)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  {tab.icon}
                  {badgeCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      background: activeTab === tab.id ? '#fff' : 'var(--cms-accent)',
                      color: activeTab === tab.id ? 'var(--cms-accent)' : '#fff',
                      fontSize: 9,
                      fontWeight: 900,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Icon-Only Type Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: 'var(--cms-input-bg)',
            padding: 3,
            borderRadius: 100,
            border: '1.5px solid var(--glass-border)',
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={() => updateProject(project.id, { type: 'project' })}
              style={{
                width: 28,
                height: 28,
                minWidth: 28,
                minHeight: 28,
                aspectRatio: '1/1',
                padding: 0,
                flexShrink: 0,
                borderRadius: '50%',
                border: 'none',
                background: project.type !== 'content' ? 'var(--cms-accent)' : 'transparent',
                color: project.type !== 'content' ? '#fff' : 'var(--cms-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Proyek Regular"
            >
              <FolderKanban size={14} />
            </button>
            <button
              type="button"
              onClick={() => updateProject(project.id, { type: 'content' })}
              style={{
                width: 28,
                height: 28,
                minWidth: 28,
                minHeight: 28,
                aspectRatio: '1/1',
                padding: 0,
                flexShrink: 0,
                borderRadius: '50%',
                border: 'none',
                background: project.type === 'content' ? 'var(--cms-accent)' : 'transparent',
                color: project.type === 'content' ? '#fff' : 'var(--cms-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Konten"
            >
              <Sparkles size={14} />
            </button>
          </div>
        </div>

        {/* Tab Content Box with Rounded Border & Distinct Scroll Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          margin: isMobile ? '0 12px calc(85px + env(safe-area-inset-bottom, 16px)) 12px' : '0 24px 24px 24px',
          background: 'var(--cms-card-bg)',
          border: '1.5px solid var(--glass-border)',
          borderRadius: isMobile ? 20 : 24,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px 14px 24px' : '20px 24px 32px',
            boxSizing: 'border-box'
          }}>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Parent Project Breadcrumb if this is a sub-module */}
                {parentProject && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--cms-accent-soft)',
                    borderRadius: 14, border: '1.5px solid rgba(var(--cms-accent-rgb), 0.25)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 800, color: 'var(--cms-text)' }}>
                      <span style={{ color: 'var(--cms-text-muted)', fontSize: 11 }}>Sub-modul dari:</span>
                      <span style={{ color: 'var(--cms-accent)' }}>{parentProject.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProject(parentProject)}
                      style={{
                        background: 'var(--cms-accent)', border: 'none', color: '#fff',
                        fontSize: 11, fontWeight: 850, padding: '5px 12px', borderRadius: 100,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <span>Induk Proyek</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}

                {project.type === 'content' ? (
                  <div key="mode-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'cmsFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                    {/* Status / Tahapan Produksi, Platform, Format, Priority Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Tahapan</div>
                        <CustomSelect value={project.status || 'todo'} onChange={val => updateProject(project.id, { status: val })} options={CONTENT_STATUSES} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Prioritas</div>
                        <CustomSelect value={project.priority || 'medium'} onChange={val => updateProject(project.id, { priority: val })} options={PRIORITIES} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Platform</div>
                        <CustomSelect value={project.platform || 'instagram'} onChange={val => updateProject(project.id, { platform: val })} options={CONTENT_PLATFORMS} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Format</div>
                        <CustomSelect value={project.format || 'reels'} onChange={val => updateProject(project.id, { format: val })} options={CONTENT_FORMATS} />
                      </div>
                    </div>

                    {/* Jadwal & Jam Publikasi */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>Jadwal Publikasi</span>
                          <InfoTooltip content="Target tanggal tayang konten" />
                        </div>
                        <GlassDatePicker value={project.deadline || project.scheduledDate} onChange={val => updateProject(project.id, { deadline: val, scheduledDate: val })} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Jam</div>
                        <GlassTimePicker
                          value={project.scheduledTime}
                          onChange={val => updateProject(project.id, { scheduledTime: val })}
                        />
                      </div>
                    </div>

                    {/* Caption & Copywriting */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Caption & Naskah</div>
                      <textarea
                        value={getSafeString(project.caption || project.description)}
                        onChange={e => updateProject(project.id, { caption: e.target.value, description: e.target.value })}
                        placeholder="Tuliskan naskah caption, hook, dan CTA..."
                        rows={3}
                        style={{ width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 14, padding: '12px 16px', fontSize: 14, fontWeight: 500, color: 'var(--cms-text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      />
                    </div>

                    {/* Hashtags */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Hashtags</div>
                      <input
                        value={getSafeString(project.hashtags)}
                        onChange={e => updateProject(project.id, { hashtags: e.target.value })}
                        placeholder="#branding #desain #uiux"
                        style={{ width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13.5, fontWeight: 700, padding: '10px 16px', borderRadius: 12, outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      />
                    </div>

                    {/* ── UNIFIED PROJECT NOTES & DOCUMENTS LIST (CONTENT) ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Naskah & Catatan ({projectNotes.length})
                          </div>
                          <InfoTooltip content="Naskah video, script scene by scene, dan arahan visual" />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {/* Naskah AI — circle icon only */}
                          <button
                            type="button"
                            onClick={() => handleGenerateAiDocument('script')}
                            disabled={isAiBriefLoading}
                            className="cms-circle-btn"
                            style={{
                              width: 30, height: 30, minWidth: 30, minHeight: 30,
                              borderRadius: '50%',
                              border: '1.5px solid var(--glass-border)',
                              background: 'var(--cms-accent-soft)',
                              color: 'var(--cms-accent)',
                              cursor: isAiBriefLoading ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, padding: 0
                            }}
                            title="Susun Naskah AI"
                          >
                            {isAiBriefLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                          </button>

                          {/* Tambah — circle icon only */}
                          <button
                            type="button"
                            onClick={() => handleAddProjectNote('Naskah Baru', '', 'script')}
                            className="cms-circle-btn"
                            style={{
                              width: 30, height: 30, minWidth: 30, minHeight: 30,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'var(--cms-accent)',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, padding: 0
                            }}
                            title="Tambah Naskah Baru"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                      {/* Notes Cards List with Color Theming */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {projectNotes.length === 0 ? (
                          <div
                            onClick={() => handleAddProjectNote('Naskah Konten', '', 'script')}
                            style={{
                              padding: '16px',
                              borderRadius: 14,
                              background: 'var(--cms-input-bg)',
                              border: '1.5px dashed var(--glass-border)',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <FileText size={20} color="var(--cms-accent)" style={{ margin: '0 auto 4px', display: 'block', opacity: 0.6 }} />
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>Belum ada naskah</div>
                            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Klik untuk menulis naskah atau brief</div>
                          </div>
                        ) : (
                          projectNotes.map((noteItem, nIdx) => {
                            const snippet = (noteItem.content || '').replace(/^[#\s*>•\-]+/gm, '').trim();
                            const cardTheme = NOTE_COLOR_THEMES[noteItem.color || 'default'] || NOTE_COLOR_THEMES.default;

                            return (
                              <div
                                key={noteItem.id || nIdx}
                                onClick={() => setActiveEditingNoteId(noteItem.id)}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 14,
                                  background: 'var(--cms-input-bg)',
                                  border: `1.5px solid ${cardTheme.border}`,
                                  borderLeft: `4px solid ${cardTheme.dot}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.borderColor = cardTheme.dot;
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.borderColor = cardTheme.border;
                                  e.currentTarget.style.borderLeftColor = cardTheme.dot;
                                  e.currentTarget.style.transform = 'none';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: cardTheme.bg,
                                    color: cardTheme.text,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <FileText size={15} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 850, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {noteItem.title || 'Naskah'}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                      {snippet || 'Klik untuk membuka naskah...'}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveEditingNoteId(noteItem.id)}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: 6,
                                      border: '1px solid var(--glass-border)',
                                      background: 'var(--cms-card-bg)',
                                      color: cardTheme.text,
                                      fontSize: 11,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 3
                                    }}
                                    title="Buka"
                                  >
                                    <Maximize2 size={11} />
                                    <span>Buka</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProjectNote(noteItem.id)}
                                    style={{
                                      width: 26, height: 26, borderRadius: 6,
                                      border: 'none', background: 'transparent',
                                      color: 'var(--cms-text-muted)', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color = '#ef4444';
                                      e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color = 'var(--cms-text-muted)';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                    title="Hapus"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key="mode-project" style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'cmsFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                    {/* Status, Priority, Category & Featured Label Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</div>
                        <CustomSelect value={project.status} onChange={val => updateProject(project.id, { status: val })} options={STATUSES} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Prioritas</div>
                        <CustomSelect value={project.priority} onChange={val => updateProject(project.id, { priority: val })} options={PRIORITIES} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Kategori</div>
                        <input
                          value={getSafeString(project.category)}
                          onChange={e => updateProject(project.id, { category: e.target.value })}
                          placeholder="Branding, UI/UX"
                          style={{ width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13.5, fontWeight: 700, padding: '10px 14px', borderRadius: 12, outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Label</div>
                        <input
                          value={getSafeString(project.featuredLabel)}
                          onChange={e => updateProject(project.id, { featuredLabel: e.target.value })}
                          placeholder="Pilihan Editor"
                          style={{ width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 13.5, fontWeight: 700, padding: '10px 14px', borderRadius: 12, outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                        />
                      </div>
                    </div>

                    {/* Deadline & Target Waktu */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Target Deadline</div>
                      <GlassDatePicker value={project.deadline} onChange={val => updateProject(project.id, { deadline: val })} />
                    </div>

                    {/* Description */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Deskripsi Proyek</div>
                      <textarea
                        value={getSafeString(project.description)}
                        onChange={e => updateProject(project.id, { description: e.target.value })}
                        placeholder="Deskripsi proyek..."
                        rows={3}
                        style={{ width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 14, padding: '12px 16px', fontSize: 14, fontWeight: 500, color: 'var(--cms-text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Tags</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {getSafeArray(project.tags).map((tag, i) => (
                          <span key={i} style={{
                            background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                            padding: '5px 8px 5px 12px', borderRadius: 100,
                            fontSize: 12, fontWeight: 800,
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            lineHeight: 1
                          }}>
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => updateProject(project.id, { tags: getSafeArray(project.tags).filter(t => t !== tag) })}
                              style={{
                                background: 'rgba(var(--cms-accent-rgb), 0.15)', border: 'none', color: 'inherit',
                                cursor: 'pointer', padding: 0, width: 16, height: 16, minWidth: 16, minHeight: 16,
                                borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                              }}
                              title="Hapus tag"
                            >
                              <X size={10} strokeWidth={2.5} />
                            </button>
                          </span>
                        ))}
                        <TagSelect project={project} projects={projects} updateProject={updateProject} />
                      </div>
                    </div>

                    {/* Tim & Kolaborator Overview */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Tim ({getSafeArray(project.team).length})
                          </div>
                          <InfoTooltip content="Anggota tim & kolaborator yang ditag" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('team')}
                          style={{ background: 'none', border: 'none', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <UserCheck size={13} /> <span>Kelola</span>
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {getSafeArray(project.team).map((m: any, idx: number) => {
                          const avatar = m.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(m.name || 'Admin')}`;
                          return (
                            <span
                              key={m.id || idx}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)',
                                padding: '3px 8px 3px 5px', borderRadius: 100, fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text)'
                              }}
                            >
                              <img src={avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
                              <span>{m.name}</span>
                            </span>
                          );
                        })}
                        {getSafeArray(project.team).length === 0 && (
                          <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', fontStyle: 'italic' }}>Belum ada tim ditag.</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab('team')}
                          style={{
                            padding: '3px 8px', borderRadius: 100, border: '1px dashed var(--glass-border)',
                            background: 'transparent', color: 'var(--cms-accent)', fontSize: 11, fontWeight: 750,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Plus size={11} /> <span>Tag</span>
                        </button>
                      </div>
                    </div>

                    {/* ── UNIFIED PROJECT NOTES & DOCUMENTS LIST (REGULAR PROJECT) ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Catatan & Dokumen ({projectNotes.length})
                          </div>
                          <InfoTooltip content="Brief proyek, naskah, studi kasus, dan catatan internal" />
                        </div>

                        {/* Vertical (top-bottom) button stack */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {/* Studi Kasus AI — circle icon only */}
                          <button
                            type="button"
                            onClick={() => handleGenerateAiDocument('casestudy')}
                            disabled={isAiBriefLoading}
                            className="cms-circle-btn"
                            style={{
                              width: 30, height: 30, minWidth: 30, minHeight: 30,
                              borderRadius: '50%',
                              border: '1.5px solid var(--glass-border)',
                              background: 'var(--cms-accent-soft)',
                              color: 'var(--cms-accent)',
                              cursor: isAiBriefLoading ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, padding: 0
                            }}
                            title="Susun Studi Kasus AI"
                          >
                            {isAiBriefLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                          </button>

                          {/* Tambah — circle icon only */}
                          <button
                            type="button"
                            onClick={() => handleAddProjectNote('Catatan Baru', '', 'note')}
                            className="cms-circle-btn"
                            style={{
                              width: 30, height: 30, minWidth: 30, minHeight: 30,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'var(--cms-accent)',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, padding: 0
                            }}
                            title="Tambah Catatan Baru"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                      {/* Notes Cards List with Color Theming */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {projectNotes.length === 0 ? (
                          <div
                            onClick={() => handleAddProjectNote('Catatan Proyek', '', 'note')}
                            style={{
                              padding: '16px',
                              borderRadius: 14,
                              background: 'var(--cms-input-bg)',
                              border: '1.5px dashed var(--glass-border)',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <FileText size={20} color="var(--cms-accent)" style={{ margin: '0 auto 4px', display: 'block', opacity: 0.6 }} />
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text)' }}>Belum ada catatan</div>
                            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>Klik untuk membuat catatan atau brief baru</div>
                          </div>
                        ) : (
                          projectNotes.map((noteItem, nIdx) => {
                            const snippet = (noteItem.content || '').replace(/^[#\s*>•\-]+/gm, '').trim();
                            const cardTheme = NOTE_COLOR_THEMES[noteItem.color || 'default'] || NOTE_COLOR_THEMES.default;

                            return (
                              <div
                                key={noteItem.id || nIdx}
                                onClick={() => setActiveEditingNoteId(noteItem.id)}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 14,
                                  background: 'var(--cms-input-bg)',
                                  border: `1.5px solid ${cardTheme.border}`,
                                  borderLeft: `4px solid ${cardTheme.dot}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.borderColor = cardTheme.dot;
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.borderColor = cardTheme.border;
                                  e.currentTarget.style.borderLeftColor = cardTheme.dot;
                                  e.currentTarget.style.transform = 'none';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: cardTheme.bg,
                                    color: cardTheme.text,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <FileText size={15} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 850, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {noteItem.title || 'Catatan'}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                                      {snippet || 'Klik untuk membuka catatan...'}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveEditingNoteId(noteItem.id)}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: 6,
                                      border: '1px solid var(--glass-border)',
                                      background: 'var(--cms-card-bg)',
                                      color: cardTheme.text,
                                      fontSize: 11,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 3
                                    }}
                                    title="Buka"
                                  >
                                    <Maximize2 size={11} />
                                    <span>Buka</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProjectNote(noteItem.id)}
                                    style={{
                                      width: 26, height: 26, borderRadius: 6,
                                      border: 'none', background: 'transparent',
                                      color: 'var(--cms-text-muted)', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.color = '#ef4444';
                                      e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.color = 'var(--cms-text-muted)';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                    title="Hapus"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cover Image & Gallery Setup */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Cover & Galeri</span>
                    <InfoTooltip content="Gambar pertama pada tab Files otomatis dijadikan cover jika URL kosong" />
                  </div>
                  <ImageInputWithActions
                    value={getSafeString(project.coverImage)}
                    onChange={url => updateProject(project.id, { coverImage: url })}
                    placeholder="URL Cover Image (Opsional)"
                  />
                </div>

                {/* Sub-modul / Sub-proyek Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Sub-tasks ({subProjects.length})
                      </div>
                      <InfoTooltip content="Pecahan sub-modul dan tugas turunan proyek" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={handleGenerateAiSubProjects}
                        disabled={isAiTaskLoading}
                        style={{
                          width: 28, height: 28, minWidth: 28, minHeight: 28, borderRadius: '50%',
                          flexShrink: 0, aspectRatio: '1 / 1',
                          background: 'var(--cms-accent-soft)', border: '1.5px solid var(--glass-border)',
                          color: 'var(--cms-accent)',
                          cursor: isAiTaskLoading ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        title="AI Sub-tasks"
                      >
                        {isAiTaskLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuickSubProject('Sub-modul Baru')}
                        style={{
                          width: 28, height: 28, minWidth: 28, minHeight: 28, borderRadius: '50%',
                          flexShrink: 0, aspectRatio: '1 / 1',
                          background: 'var(--cms-accent)',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 2px 8px rgba(var(--cms-accent-rgb), 0.25)'
                        }}
                        title="Tambah Sub-task"
                      >
                        <Plus size={14} strokeWidth={2.8} />
                      </button>
                    </div>
                  </div>

                  {/* List of Sub-projects (Sub-modules) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {subProjects.map(sub => {
                      const subStatus = STATUSES.find(s => s.id === sub.status) || STATUSES[0];
                      return (
                        <div
                          key={sub.id}
                          onClick={() => { setSelectedProject(sub); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                            borderRadius: 14, background: 'var(--cms-input-bg)',
                            cursor: 'pointer', border: '1.5px solid var(--glass-border)', transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                          title="Klik untuk membuka detail sub-modul ini"
                        >
                          <span style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {renderProjectIcon(sub.icon || 'FolderKanban', 16)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <input
                              type="text"
                              value={getSafeString(sub.title)}
                              onChange={(e) => {
                                const newTitle = e.target.value;
                                updateProject(sub.id, { title: newTitle });
                                const currentSubs = (Array.isArray(project.submodules) ? project.submodules : []).map((s: any) =>
                                  String(s.id) === String(sub.id) ? { ...s, title: newTitle } : s
                                );
                                updateProject(project.id, { submodules: currentSubs });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Nama Sub-modul..."
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--cms-text)',
                                fontSize: 13.5, fontWeight: 800, width: '100%', outline: 'none',
                                fontFamily: 'inherit', padding: 0, margin: 0
                              }}
                            />
                            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{sub.category || (sub.type === 'content' ? sub.platform : 'Sub-modul')}</span>
                              {sub.deadline && <span>• Deadline: {sub.deadline}</span>}
                            </div>
                          </div>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStatus = sub.status === 'completed' ? 'todo' : sub.status === 'in_progress' ? 'completed' : 'in_progress';
                              updateProject(sub.id, { status: nextStatus });
                            }}
                            style={{
                              background: subStatus.bg, color: subStatus.color,
                              fontSize: 10.5, fontWeight: 900, padding: '3px 10px',
                              borderRadius: 100, flexShrink: 0, cursor: 'pointer'
                            }}
                            title="Klik untuk mengubah status"
                          >
                            {subStatus.label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeProject(sub.id);
                              const currentSubs = (Array.isArray(project.submodules) ? project.submodules : []).filter((s: any) => String(s.id) !== String(sub.id));
                              updateProject(project.id, { submodules: currentSubs });
                            }}
                            style={{
                              background: 'none', border: 'none', color: 'var(--cms-text-muted)',
                              cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0
                            }}
                            title="Hapus sub-modul ini"
                          >
                            <X size={14} />
                          </button>
                          <ChevronRight size={15} color="var(--cms-text-muted)" style={{ flexShrink: 0 }} />
                        </div>
                      );
                    })}

                    {/* Tombol Tambah Sub-modul Kosong */}
                    <button
                      type="button"
                      onClick={() => handleAddQuickSubProject('Sub-modul Baru')}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 14,
                        border: '1.5px dashed var(--glass-border)', cursor: 'pointer',
                        background: 'transparent', color: 'var(--cms-accent)', fontSize: 12.5, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                    >
                      <Plus size={15} />
                      <span>Tambah Sub-modul Kosong</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <div>
                <form onSubmit={addTask} style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <input
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="Add a new task..."
                    style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto', padding: '12px 16px', borderRadius: 100, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)', color: 'var(--cms-text)', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button type="submit" style={{ padding: '12px 20px', borderRadius: 100, background: 'var(--cms-accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 900 }}>Add</button>
                  <button
                    type="button"
                    onClick={handleGenerateAiSubtasks}
                    disabled={isAiTaskLoading}
                    style={{
                      padding: '10px 16px', borderRadius: 100,
                      background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                      border: '1.5px solid var(--glass-border)', cursor: isAiTaskLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 850, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                      whiteSpace: 'nowrap'
                    }}
                    title="Susun sub-tasks otomatis dengan AI"
                  >
                    {isAiTaskLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                    <span>AI Sub-tasks</span>
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {normalizedTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        borderRadius: 14, background: task.done ? 'var(--cms-input-bg)' : 'var(--cms-card-bg)',
                        border: '1.5px solid var(--glass-border)', transition: 'all 0.15s ease',
                        cursor: 'pointer', userSelect: 'none'
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          border: task.done ? '2px solid var(--cms-accent)' : '2px solid var(--glass-border)',
                          background: task.done ? 'var(--cms-accent)' : 'transparent',
                          cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {task.done && <Check size={13} color="#fff" strokeWidth={3} />}
                      </button>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: task.done ? 'var(--cms-text-muted)' : 'var(--cms-text)', textDecoration: task.done ? 'line-through' : 'none' }}>
                        {task.text}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
                        title="Hapus sub-task"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {normalizedTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--cms-text-muted)' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Belum ada sub-task</div>
                      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Tambahkan tugas di atas atau gunakan AI Sub-tasks</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TEAM & TAGGED ADMINS TAB */}
            {activeTab === 'team' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Add / Tag Admin Form */}
                <div style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--cms-text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={16} color="var(--cms-accent)" />
                    <span>Tag & Tambahkan Admin / Anggota Tim</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <CustomDropdown
                        value={selectedAdminId}
                        onChange={val => setSelectedAdminId(val)}
                        placeholder="-- Pilih User Admin --"
                        options={[
                          { value: '', label: '-- Pilih User Admin --' },
                          ...adminUsers.map(u => ({
                            value: u.id,
                            label: `${u.name || u.email} (${u.role || 'Admin'})`,
                            icon: <img src={u.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(u.name || 'Admin')}`} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                          }))
                        ]}
                      />
                    </div>

                    <div style={{ width: isMobile ? '100%' : 170 }}>
                      <CustomDropdown
                        value={selectedRole}
                        onChange={val => setSelectedRole(val)}
                        placeholder="Pilih Role"
                        options={[
                          { value: 'Project Lead', label: 'Project Lead' },
                          { value: 'UI/UX Designer', label: 'UI/UX Designer' },
                          { value: 'Web Developer', label: 'Web Developer' },
                          { value: 'Video Editor', label: 'Video Editor' },
                          { value: 'Copywriter', label: 'Copywriter' },
                          { value: 'QA Reviewer', label: 'QA Reviewer' },
                          { value: 'Member', label: 'Member' }
                        ]}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedAdminId) {
                          notify?.('Pilih admin terlebih dahulu', 'warning');
                          return;
                        }
                        const user = adminUsers.find(u => u.id === selectedAdminId);
                        if (!user) return;
                        const currentTeam = getSafeArray(project.team);
                        if (currentTeam.some((t: any) => t.id === user.id || t.name === user.name)) {
                          notify?.('User sudah ada dalam tim proyek ini', 'warning');
                          return;
                        }
                        const newMember = {
                          id: user.id,
                          name: user.name || 'Admin',
                          avatar: user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name || 'Admin')}`,
                          role: selectedRole,
                          color: 'var(--cms-accent)'
                        };
                        const updatedTeam = [...currentTeam, newMember];
                        updateProject(project.id, {
                          team: updatedTeam,
                          activity: [{ id: Date.now(), time: new Date().toISOString(), message: `${newMember.name} ditambahkan sebagai ${selectedRole}` }, ...getSafeArray(project.activity)]
                        });
                        setSelectedAdminId('');
                        notify?.(`✨ ${newMember.name} berhasil ditambahkan ke tim!`, 'success');
                      }}
                      style={{
                        padding: '0 18px', height: 40, borderRadius: 10,
                        background: 'var(--cms-accent)', color: '#fff', border: 'none',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      + Tag ke Tim
                    </button>
                  </div>
                </div>

                {/* Team Members List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Daftar Anggota Proyek ({getSafeArray(project.team).length})
                  </div>

                  {getSafeArray(project.team).map((member: any, i: number) => {
                    const avatar = member.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(member.name || 'Admin')}`;
                    return (
                      <div
                        key={member.id || i}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', borderRadius: 14, background: 'var(--cms-card-bg)',
                          border: '1.5px solid var(--glass-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img src={avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cms-text)' }}>{member.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2 }}>{member.role || 'Member'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 850, padding: '3px 10px', borderRadius: 100, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)' }}>
                            {member.role || 'Member'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedTeam = getSafeArray(project.team).filter((_: any, idx: number) => idx !== i);
                              updateProject(project.id, {
                                team: updatedTeam,
                                activity: [{ id: Date.now(), time: new Date().toISOString(), message: `${member.name} dihapus dari tim proyek` }, ...getSafeArray(project.activity)]
                              });
                              notify?.(`${member.name} dihapus dari tim`);
                            }}
                            style={{
                              width: 30, height: 30, borderRadius: 8, border: 'none',
                              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Hapus dari tim"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {getSafeArray(project.team).length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--cms-text-muted)' }}>
                      <Users size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Belum ada anggota tim yang ditag</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMMENTS & DISCUSSION TAB */}
            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Add Comment Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCommentText.trim()) return;
                    const currentUserName = auth.currentUser?.displayName || 'Admin';
                    const currentUserAvatar = auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUserName)}`;
                    const comment = {
                      id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                      userId: auth.currentUser?.uid || 'admin',
                      userName: currentUserName,
                      userAvatar: currentUserAvatar,
                      text: newCommentText.trim(),
                      createdAt: new Date().toISOString()
                    };
                    const updatedComments = [...getSafeArray(project.comments), comment];
                    updateProject(project.id, {
                      comments: updatedComments,
                      activity: [{ id: Date.now(), time: new Date().toISOString(), message: `${currentUserName} menambahkan komentar` }, ...getSafeArray(project.activity)]
                    });
                    setNewCommentText('');
                    notify?.('💬 Komentar berhasil diposting', 'success');
                  }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                >
                  <textarea
                    rows={2}
                    placeholder="Tulis update, catatan, atau tanggapan untuk tim..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: 14,
                      background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      fontSize: 13, color: 'var(--cms-text)', outline: 'none', resize: 'none',
                      lineHeight: 1.5, fontFamily: 'inherit'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    style={{
                      padding: '12px 20px', height: 44, borderRadius: 12,
                      background: newCommentText.trim() ? 'var(--cms-accent)' : 'var(--cms-input-bg)',
                      color: newCommentText.trim() ? '#fff' : 'var(--cms-text-muted)',
                      border: 'none', fontSize: 13, fontWeight: 850,
                      cursor: newCommentText.trim() ? 'pointer' : 'default',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Kirim
                  </button>
                </form>

                {/* Discussion Thread List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {getSafeArray(project.comments).map((comm: any) => (
                    <div
                      key={comm.id}
                      style={{
                        display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14,
                        background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <img
                        src={comm.userAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(comm.userName || 'Admin')}`}
                        alt=""
                        style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 850, color: 'var(--cms-text)' }}>{comm.userName}</span>
                            <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                              {new Date(comm.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedComments = getSafeArray(project.comments).filter((c: any) => c.id !== comm.id);
                              updateProject(project.id, { comments: updatedComments });
                              notify?.('Komentar dihapus');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 2 }}
                            title="Hapus komentar"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--cms-text)', lineHeight: 1.5 }}>
                          {comm.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  {getSafeArray(project.comments).length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--cms-text-muted)' }}>
                      <MessageSquare size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Belum ada diskusi untuk proyek ini</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FILES TAB */}
            {activeTab === 'files' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {getSafeArray(project.files || project.attachments).length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--cms-card-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>
                      {getSafeArray(project.files || project.attachments).length} Berkas Hasil / Lampiran
                    </div>
                    <button
                      type="button"
                      disabled={isZippingFiles}
                      onClick={async () => {
                        const filesList = getSafeArray(project.files || project.attachments);
                        if (!filesList.length) return;
                        setIsZippingFiles(true);
                        setZippingProgressText('Mempersiapkan...');
                        try {
                          const zipName = `${(project.title || 'project').replace(/[^a-zA-Z0-9_-]/g, '_')}_deliverables.zip`;
                          await downloadFilesAsZip(filesList, zipName, (pct, item) => {
                            setZippingProgressText(`${pct}% - ${item}`);
                          });
                          notify?.('📦 Berkas ZIP proyek berhasil diunduh!', 'success');
                        } catch (err: any) {
                          notify?.(err?.message || 'Gagal membuat file ZIP', 'error');
                        } finally {
                          setIsZippingFiles(false);
                          setZippingProgressText('');
                        }
                      }}
                      className="cms-btn cms-btn-primary"
                      style={{
                        height: 34,
                        padding: '0 14px',
                        borderRadius: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: isZippingFiles ? 'wait' : 'pointer'
                      }}
                      title="Unduh Semua Berkas Lampiran sebagai Satu File ZIP"
                    >
                      {isZippingFiles ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{zippingProgressText || 'Mengompres...'}</span>
                        </>
                      ) : (
                        <>
                          <Archive size={14} />
                          <span>Unduh Semua (.ZIP)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <DriveAttachmentPicker
                  attachments={getSafeArray(project.files || project.attachments)}
                  onChange={(newFiles) => {
                    updateProject(project.id, { files: newFiles, attachments: newFiles });
                    notify?.('Lampiran proyek diperbarui');
                  }}
                  folderCategory={`Projects/${project.title || project.id}`}
                  notify={notify}
                />
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <div>
                {getSafeArray(project.activity).map((act, i) => (
                  <div key={act.id || i} style={{ display: 'flex', gap: 14, paddingBottom: 16, borderLeft: '2px solid var(--glass-border)', marginLeft: 8, paddingLeft: 20, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--cms-accent)', border: '2px solid var(--cms-panel-bg)' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cms-text)' }}>{act.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>{act.time ? new Date(act.time).toLocaleString() : ''}</div>
                    </div>
                  </div>
                ))}
                {getSafeArray(project.activity).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--cms-text-muted)' }}>
                    <History size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                    <div style={{ fontSize: 14, fontWeight: 700 }}>No activity yet</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CLIENT PROOFING & WATERMARK MODAL ── */}
      <ProjectProofingModal
        isOpen={isProofingModalOpen}
        onClose={() => setIsProofingModalOpen(false)}
        project={project}
        updateProject={updateProject}
        notify={notify}
      />
    </div>,
    document.body
  );
};

export default ProjectsModule;