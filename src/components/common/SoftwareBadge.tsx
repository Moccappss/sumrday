import React from 'react';
import { getSoftwareEmblem } from '../../utils/softwareEmblems';
import { 
  Sparkles, Code, Palette, Video, Box, Cpu, Bot, Layers,
  Terminal, Globe, PenTool, Layout, Monitor
} from 'lucide-react';

interface SoftwareBadgeProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
  showCategory?: boolean;
  onRemove?: () => void;
}

export const SoftwareBadge: React.FC<SoftwareBadgeProps> = ({
  name,
  size = 'md',
  isDark = true,
  showCategory = false,
  onRemove
}) => {
  const info = getSoftwareEmblem(name);

  const getIcon = () => {
    const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
    switch (info.category) {
      case 'design': return <Palette size={iconSize} />;
      case 'video': return <Video size={iconSize} />;
      case '3d': return <Box size={iconSize} />;
      case 'tech': return <Code size={iconSize} />;
      case 'ai': return <Bot size={iconSize} />;
      default: return <Layers size={iconSize} />;
    }
  };

  const pad = size === 'sm' ? '4px 10px' : size === 'lg' ? '6px 14px' : '5px 12px';
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 13.5 : 12.5;
  const badgeColor = info.color || 'var(--cms-accent, #7c3aed)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: pad,
        borderRadius: 100,
        background: isDark ? 'rgba(255, 255, 255, 0.09)' : '#f1f5f9',
        border: `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'}`,
        color: isDark ? '#ffffff' : '#0f172a',
        fontFamily: "'Outfit', sans-serif",
        fontSize: fontSize,
        fontWeight: 700,
        letterSpacing: '0.01em',
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <span style={{ color: badgeColor, display: 'flex', alignItems: 'center' }}>
        {getIcon()}
      </span>
      <span style={{ color: 'inherit' }}>{info.name}</span>
      {showCategory && (
        <span style={{ fontSize: 10.5, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase' }}>
          • {info.category}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: 'none',
            color: '#ef4444',
            width: 18,
            height: 18,
            borderRadius: '50%',
            cursor: 'pointer',
            padding: 0,
            marginLeft: 4,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1,
            transition: 'background 0.15s'
          }}
          title="Hapus software ini"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default SoftwareBadge;
