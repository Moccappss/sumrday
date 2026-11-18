import React, { useState, useEffect } from 'react';
import { Play, Pause, Music, X, Repeat } from 'lucide-react';

interface FloatingMusicPlayerProps {
  nowPlaying: { blockId: string; name: string; isBackground: boolean } | null;
  onToggle: () => void;
  onMute: () => void;
  isMuted: boolean;
  isPaused: boolean;
  onClose?: () => void;
}

const FloatingMusicPlayer: React.FC<FloatingMusicPlayerProps> = ({
  nowPlaying,
  onToggle,
  isPaused,
  onClose
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (nowPlaying) setVisible(true);
  }, [nowPlaying]);

  if (!nowPlaying && !visible) return null;

  return (
    <div className={`fixed bottom-5 right-4 z-[99999] flex items-center gap-2.5 bg-[#0f0c1e]/90 backdrop-blur-md border border-[#8b5cf6]/30 rounded-full py-2 pl-2.5 pr-3.5 shadow-lg shadow-black/40 min-w-0 max-w-[220px] transition-all duration-300 ${nowPlaying ? 'animate-in slide-in-from-bottom-5 zoom-in-95' : 'animate-out slide-out-to-bottom-5 zoom-out-95 opacity-0'}`}>
      
      {/* Equalizer / Music icon */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shrink-0 relative overflow-hidden">
        {!isPaused ? (
          <div className="flex items-end gap-0.5 h-4">
            {[1, 1.5, 0.8, 1.3].map((h, i) => (
              <div 
                key={i} 
                className="w-[3px] bg-white rounded-full animate-pulse"
                style={{ 
                  height: `${h * 10}px`,
                  animationDuration: `${0.4 + i * 0.1}s`,
                  animationDirection: 'alternate'
                }} 
              />
            ))}
          </div>
        ) : (
          <Music size={14} color="#fff" />
        )}
      </div>

      {/* Track name */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-white truncate">
          {nowPlaying?.name || 'Musik'}
        </div>
        <div className="text-[9px] text-white/50 mt-px flex items-center gap-1">
          {nowPlaying?.isBackground ? (
            <>
              <Repeat size={9} />
              <span>Background</span>
            </>
          ) : (
            <>
              <Music size={9} />
              <span>Konten</span>
            </>
          )}
        </div>
      </div>

      {/* Play/Pause */}
      <button 
        onClick={onToggle}
        className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors"
      >
        {isPaused ? <Play size={12} fill="#fff" /> : <Pause size={12} />}
      </button>

      {/* Close */}
      <button 
        onClick={() => { setVisible(false); onClose?.(); }}
        className="w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center shrink-0 hover:bg-white/20 hover:text-white transition-colors"
      >
        <X size={10} />
      </button>
    </div>
  );
};

export default FloatingMusicPlayer;
