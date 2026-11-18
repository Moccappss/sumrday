import React, { useState, useEffect, useRef } from 'react';
import { Film, Target, Megaphone, Mic, Edit3 } from 'lucide-react';

export interface NoteBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'number' | 'quote' | 'callout' | 'scene' | 'hook' | 'cta' | 'voiceover' | 'code' | 'table' | 'image' | 'divider' | 'p';
  text: string;
  checked?: boolean;
  num?: number;
  url?: string;
  size?: 'small' | 'medium' | 'full';
  wrap?: 'inline' | 'left' | 'right' | 'center';
  tableData?: { headers: string[]; rows: string[][] };
}

export const parseContentToBlocks = (content: string, existingBlocks?: NoteBlock[]): NoteBlock[] => {
  if (!content || !content.trim()) {
    return [{ id: 'b_0', type: 'p', text: '' }];
  }

  const imgRegex = /(!\[.*?\]\(.*?\))/g;
  const rawParts = content.split(imgRegex);
  const blocks: NoteBlock[] = [];

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;

    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      const rawAlt = imgMatch[1] || '';
      let size: 'small' | 'medium' | 'full' = 'small';
      let wrap: 'inline' | 'left' | 'right' | 'center' = 'inline';

      const segs = rawAlt.split(/[|:]/);
      const cleanAlt = segs[0] || 'Gambar';

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

      blocks.push({
        id: `blk_img_${blocks.length}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'image',
        text: cleanAlt,
        url: imgMatch[2],
        size,
        wrap
      });
    } else {
      blocks.push({
        id: `blk_text_${blocks.length}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'p',
        text: part
      });
    }
  }

  if (blocks.length === 0 || blocks[blocks.length - 1].type === 'image') {
    blocks.push({
      id: `blk_text_end_${Date.now()}`,
      type: 'p',
      text: ''
    });
  }

  return blocks.length > 0 ? blocks : [{ id: 'b_0', type: 'p', text: '' }];
};

export const serializeBlocksToContent = (blocks: NoteBlock[]): string => {
  return blocks.map(b => {
    if (b.type === 'image') {
      const sizeTag = b.size || 'small';
      const wrapTag = b.wrap || 'inline';
      return `![${(b.text || 'Gambar')}|${sizeTag}|${wrapTag}](${b.url})`;
    }
    return b.text;
  }).join('');
};

export const AutoGrowTextarea: React.FC<{
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

export function renderInlineFormattedText(text: string): React.ReactNode {
  if (!text) return null;

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

export const InteractiveMarkdownRenderer: React.FC<{
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
        const checkMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
        if (checkMatch) {
          const isChecked = checkMatch[2].toLowerCase() === 'x';
          const label = checkMatch[3];
          return (
            <div
              key={lineIdx}
              onClick={(e) => {
                e.stopPropagation();
                onToggleChecklist(lineIdx, !isChecked);
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
                transition: 'background 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleChecklist(lineIdx, !isChecked)}
                style={{ width: 16, height: 16, marginTop: 3, cursor: 'pointer', accentColor: 'var(--cms-accent)' }}
              />
              <span style={{ fontSize: 13.5, textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.6 : 1, color: 'var(--cms-text)' }}>
                {renderInlineFormattedText(label)}
              </span>
            </div>
          );
        }

        if (line.startsWith('# ')) {
          return <h1 key={lineIdx} style={{ fontSize: 22, fontWeight: 900, margin: '14px 0 6px', color: 'var(--cms-text)' }}>{renderInlineFormattedText(line.slice(2))}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={lineIdx} style={{ fontSize: 18, fontWeight: 850, margin: '12px 0 4px', color: 'var(--cms-text)' }}>{renderInlineFormattedText(line.slice(3))}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={lineIdx} style={{ fontSize: 15, fontWeight: 800, margin: '10px 0 2px', color: 'var(--cms-text)' }}>{renderInlineFormattedText(line.slice(4))}</h3>;
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={lineIdx} style={{ borderLeft: '3px solid var(--cms-accent)', paddingLeft: 12, margin: '6px 0', color: 'var(--cms-text-muted)', fontStyle: 'italic', fontSize: 13 }}>
              {renderInlineFormattedText(line.slice(2))}
            </blockquote>
          );
        }

        return (
          <p key={lineIdx} style={{ margin: '2px 0', fontSize: 13.5, lineHeight: 1.6, color: 'var(--cms-text)' }}>
            {renderInlineFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
};
