import { useState, useEffect, useRef, useCallback } from 'react';

export interface MusicBlock {
  id: string;
  musicUrl?: string;
  musicLoop?: boolean;
  musicBackground?: boolean;
  musicVolume?: number;
  musicName?: string;
  name?: string;
  markers?: { id: string }[];
}

export const useBlockMusic = (blocks: MusicBlock[]) => {
  const audiosRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const [nowPlaying, setNowPlaying] = useState<{ blockId: string; name: string; isBackground: boolean } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [manualPause, setManualPause] = useState(false);

  // Build/cleanup audio elements when blocks change
  useEffect(() => {
    const musicBlocks = blocks.filter(b => b.musicUrl);
    const ids = new Set(musicBlocks.map(b => b.id));

    // Remove old
    Object.keys(audiosRef.current).forEach(id => {
      if (!ids.has(id)) {
        audiosRef.current[id].pause();
        audiosRef.current[id].src = '';
        delete audiosRef.current[id];
      }
    });

    // Create new
    musicBlocks.forEach(b => {
      if (b.musicUrl) {
        if (!audiosRef.current[b.id]) {
          const audio = new Audio(b.musicUrl);
          audio.loop = b.musicLoop !== false;
          audio.volume = 0;
          audio.muted = isMuted; // Keep sync with global mute state
          audiosRef.current[b.id] = audio;
        } else {
          // Update src if changed
          if (audiosRef.current[b.id].src !== b.musicUrl) {
            audiosRef.current[b.id].src = b.musicUrl;
          }
        }
      }
    });

    return () => {
      Object.keys(audiosRef.current).forEach(id => {
        try {
          audiosRef.current[id].pause();
          audiosRef.current[id].src = '';
        } catch (_) {}
      });
    };
  }, [blocks, isMuted]);

  // Fade helper
  const fadeTo = useCallback((audio: HTMLAudioElement & { _fadeId?: number }, targetVol: number, durationMs = 600) => {
    const id = audio._fadeId = (audio._fadeId || 0) + 1;
    const startVol = audio.volume;
    const startTime = performance.now();
    
    const step = (now: number) => {
      if (audio._fadeId !== id) return;
      const t = Math.min((now - startTime) / durationMs, 1);
      audio.volume = startVol + (targetVol - startVol) * t;
      if (t < 1) requestAnimationFrame(step);
      else if (targetVol === 0) audio.pause();
    };
    requestAnimationFrame(step);
  }, []);

  // IntersectionObserver setup
  useEffect(() => {
    const musicBlocks = blocks.filter(b => b.musicUrl);
    if (!musicBlocks.length) return;

    const activeNonBg = new Set<string>();

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        const target = entry.target as HTMLElement;
        const blockId = target.getAttribute('data-block-id') ||
          target.closest('[data-block-id]')?.getAttribute('data-block-id');
        if (!blockId) return;

        const block = blocks.find(b => b.id === blockId);
        if (!block || !block.musicUrl) return;

        const audio = audiosRef.current[blockId];
        if (!audio) return;

        if (entry.isIntersecting) {
          if (block.musicBackground) {
            if (audio.paused) {
              audio.volume = 0;
              audio.play().catch(() => {});
            }
            fadeTo(audio, block.musicVolume ?? 1);
            setNowPlaying({ blockId, name: block.musicName || block.name || 'Musik', isBackground: true });
          } else {
            activeNonBg.add(blockId);
            Object.entries(audiosRef.current).forEach(([id, a]) => {
              const b = blocks.find(x => x.id === id);
              if (!b?.musicBackground && id !== blockId && !a.paused) {
                fadeTo(a, 0);
              }
            });
            if (audio.paused) {
              audio.volume = 0;
              audio.play().catch(() => {});
            }
            fadeTo(audio, block.musicVolume ?? 1);
            setNowPlaying({ blockId, name: block.musicName || block.name || 'Musik', isBackground: false });
          }
        } else {
          if (!block.musicBackground) {
            activeNonBg.delete(blockId);
            fadeTo(audio, 0);
            setNowPlaying(prev => {
              if (prev?.blockId === blockId) {
                const bgBlock = blocks.find(b => b.musicBackground && audiosRef.current[b.id] && !audiosRef.current[b.id].paused);
                return bgBlock ? { blockId: bgBlock.id, name: bgBlock.musicName || bgBlock.name || 'Musik BG', isBackground: true } : null;
              }
              return prev;
            });
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.4 });

    musicBlocks.forEach(b => {
      const el = document.querySelector(`[data-block-id="${b.id}"]`) ||
                 (b.markers?.[0]?.id ? document.getElementById(b.markers[0].id) : null);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [blocks, fadeTo]);

  const togglePlayPause = useCallback(() => {
    if (!nowPlaying) return;
    const audio = audiosRef.current[nowPlaying.blockId];
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setManualPause(false);
    } else {
      audio.pause();
      setManualPause(true);
    }
  }, [nowPlaying]);

  const toggleMute = useCallback(() => {
    setIsMuted(m => {
      const next = !m;
      Object.values(audiosRef.current).forEach(a => { a.muted = next; });
      return next;
    });
  }, []);

  return { nowPlaying, togglePlayPause, toggleMute, isMuted, manualPause };
};
