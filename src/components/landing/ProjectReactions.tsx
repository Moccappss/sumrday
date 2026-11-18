import React, { useState, useEffect } from 'react';
import { haptic } from '../../utils/haptics';
import { SoundEffectEngine } from '../../utils/soundEffects';

const soundEngine = new SoundEffectEngine();

interface ProjectReactionsProps {
  projectId: string;
  isDark: boolean;
  accentColor?: string;
  compact?: boolean;
}

interface ReactionCounts {
  heart: number;
  fire: number;
  bulb: number;
  clap: number;
}

interface FloatingParticle {
  id: number;
  emoji: string;
  x: number; // offset X
}

const DEFAULT_COUNTS: Record<string, ReactionCounts> = {
  default: { heart: 24, fire: 18, bulb: 12, clap: 15 }
};

export const ProjectReactions: React.FC<ProjectReactionsProps> = ({
  projectId,
  isDark,
  accentColor = '#6366f1',
  compact = false,
}) => {
  const [counts, setCounts] = useState<ReactionCounts>(() => {
    try {
      const stored = localStorage.getItem(`porto_reactions_${projectId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Deterministic pseudo-random seed based on project ID length/hash
    const seed = projectId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return {
      heart: 12 + (seed % 28),
      fire: 8 + ((seed * 3) % 25),
      bulb: 6 + ((seed * 7) % 20),
      clap: 10 + ((seed * 5) % 22)
    };
  });

  const [userReacted, setUserReacted] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`porto_user_reacted_${projectId}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  const handleReact = (type: keyof ReactionCounts, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger project card modal click

    // Play micro-sound feedback & haptic
    haptic.selection();
    soundEngine.play('sparkle');

    const hasReacted = Boolean(userReacted[type]);
    const updatedCount = {
      ...counts,
      [type]: counts[type] + (hasReacted ? -1 : 1)
    };

    const updatedUserReacted = {
      ...userReacted,
      [type]: !hasReacted
    };

    setCounts(updatedCount);
    setUserReacted(updatedUserReacted);

    try {
      localStorage.setItem(`porto_reactions_${projectId}`, JSON.stringify(updatedCount));
      localStorage.setItem(`porto_user_reacted_${projectId}`, JSON.stringify(updatedUserReacted));
    } catch {}

    // Trigger floating burst particle if reacting
    if (!hasReacted) {
      const particleId = Date.now() + Math.random();
      const randomOffsetX = (Math.random() - 0.5) * 40;
      setParticles(prev => [...prev, { id: particleId, emoji, x: randomOffsetX }]);

      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== particleId));
      }, 950);
    }
  };

  const reactionItems: { key: keyof ReactionCounts; emoji: string; label: string }[] = [
    { key: 'heart', emoji: '❤️', label: 'Suka' },
    { key: 'fire', emoji: '🔥', label: 'Keren' },
    { key: 'bulb', emoji: '💡', label: 'Inspiratif' },
    { key: 'clap', emoji: '👏', label: 'Apresiasi' }
  ];

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 4 : 6,
        padding: compact ? '3px 6px' : '4px 8px',
        borderRadius: 100,
        background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Floating Particle Container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {particles.map(p => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              bottom: 10,
              left: `calc(50% + ${p.x}px)`,
              fontSize: 22,
              animation: 'floatUpAndFade 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              zIndex: 99,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes floatUpAndFade {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.7);
          }
          40% {
            opacity: 1;
            transform: translateY(-28px) scale(1.25);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(1);
          }
        }
      `}</style>

      {reactionItems.map(item => {
        const isSelected = Boolean(userReacted[item.key]);
        const count = counts[item.key] || 0;

        return (
          <button
            key={item.key}
            type="button"
            title={`${item.label} (${count})`}
            onClick={(e) => handleReact(item.key, item.emoji, e)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3.5,
              padding: compact ? '3px 6px' : '3px 8px',
              borderRadius: 100,
              border: isSelected ? `1.2px solid ${accentColor}` : '1px solid transparent',
              background: isSelected ? (isDark ? `${accentColor}35` : `${accentColor}18`) : 'transparent',
              color: isSelected ? (isDark ? '#ffffff' : accentColor) : (isDark ? '#cbd5e1' : '#475569'),
              fontFamily: "'Outfit', sans-serif",
              fontSize: compact ? 10.5 : 11.5,
              fontWeight: isSelected ? 800 : 600,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: compact ? 12 : 13.5, lineHeight: 1 }}>{item.emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProjectReactions;

