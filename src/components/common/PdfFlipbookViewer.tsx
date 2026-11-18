import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX, Download, BookOpen, FileText, Loader2
} from 'lucide-react';
import { getCloudinaryPdfPageUrl } from '../../utils/cloudinary';
import { haptic } from '../../utils/haptics';

export interface PdfFlipbookViewerProps {
  pdfUrl?: string;
  pageImages?: string[];
  totalPages?: number;
  title?: string;
  isDark?: boolean;
  accentColor?: string;
  allowDownload?: boolean;
  height?: string | number;
  className?: string;
  defaultViewMode?: 'double' | 'single';
  showModeSwitch?: boolean;
  isEditable?: boolean;
  paperAspectRatio?: number;
  onViewModeChange?: (mode: 'double' | 'single') => void;
  onTotalPagesDetected?: (numPages: number) => void;
  onFirstPageRendered?: (dataUrl: string) => void;
}

const PDFJS_CDN_SOURCES = [
  {
    lib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    cmaps: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/'
  },
  {
    lib: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    worker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    cmaps: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/'
  }
];

let pdfJsLoadPromise: Promise<any> | null = null;

const ensurePdfJsLoaded = (): Promise<any> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  const existingLib = (window as any).pdfjsLib;
  if (existingLib) return Promise.resolve(existingLib);
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const tryLoad = (idx: number) => {
      if (idx >= PDFJS_CDN_SOURCES.length) {
        pdfJsLoadPromise = null;
        reject(new Error('Gagal memuat engine PDF.js'));
        return;
      }
      const src = PDFJS_CDN_SOURCES[idx];
      const script = document.createElement('script');
      script.src = src.lib;
      script.async = true;
      script.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = src.worker;
          (lib as any).__cmapUrl = src.cmaps;
          resolve(lib);
        } else {
          tryLoad(idx + 1);
        }
      };
      script.onerror = () => {
        script.remove();
        tryLoad(idx + 1);
      };
      document.head.appendChild(script);
    };
    tryLoad(0);
  });

  return pdfJsLoadPromise;
};

// Built-in editorial sample pages for demo & fallback
const DEFAULT_EDITORIAL_PAGES = [
  {
    page: 1,
    title: 'SUMR.DAY',
    subtitle: 'Creative Digital Studio & Design System 2026',
    category: 'BRAND GUIDELINE • VOL. 01',
    bg: '#0f172a',
    accent: '#f59e0b',
    isCover: true
  },
  {
    page: 2,
    title: 'Filosofi Warm Tech',
    subtitle: 'Teknologi modern yang ramah, intuitif, dan tidak kaku.',
    category: '01. PENDEKATAN DESAIN',
    content: 'Kami percaya interaksi digital harus menghadirkan kenyamanan visual. Melalui palet warna hangat, tipografi berkarakter, dan animasi mikro yang halus, setiap layar terasa hidup dan membahagiakan.'
  },
  {
    page: 3,
    title: 'Sistem Tipografi',
    subtitle: 'Outfit & Plus Jakarta Sans',
    category: '02. VISUAL IDENTITY',
    content: 'Perpaduan font modern geometris untuk judul dan sans-serif berketerbacaan tinggi untuk konten. Menguatkan karakter studio kreatif kontemporer.'
  },
  {
    page: 4,
    title: 'Palet Warna Studio',
    subtitle: 'Warm Amber, Slate Navy & Skena Neutral',
    category: '03. COLOR SYSTEM',
    content: 'Harmoni warna yang terinspirasi dari kehangatan sinar matahari musim panas dan keanggunan arsitektur modern.'
  },
  {
    page: 5,
    title: 'Showcase Produk & Undangan',
    subtitle: 'Interaksi Web Berstandar PWA',
    category: '04. DIGITAL PRODUCTS',
    content: 'Undangan pernikahan digital berbasis web interaktif, katalog responsif, dan landing page performa tinggi tanpa dependensi berat.'
  },
  {
    page: 6,
    title: 'Standar Aset 3D & Spasial',
    subtitle: 'Khronos WebGL & Google Model-Viewer',
    category: '05. 3D EXPERIENCES',
    content: 'Integrasi format .glb ringan dengan tekstur fotorealistis. Memungkinkan klien menginspeksi produk 360° langsung di browser.'
  },
  {
    page: 7,
    title: 'Alur Kerja & Kolaborasi',
    subtitle: 'Transparan, Terukur & Tepat Waktu',
    category: '06. WORKFLOW & SLA',
    content: 'Setiap iterasi desain dilengkapi link proofing interaktif, revisi terstruktur, dan serah terima aset master terorganisir.'
  },
  {
    page: 8,
    title: 'A Little Sunshine for Your Screen',
    subtitle: 'Mari ciptakan karya bermakna bersama sumr.day',
    category: 'KOLABORASI STUDIO',
    bg: '#0f172a',
    accent: '#f59e0b',
    isBackCover: true
  }
];

// Synthesize soft, warm paper rustle sound using Shared Web Audio API (Zero Memory Leak)
let sharedFlipAudioCtx: AudioContext | null = null;

const playPaperFlipSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedFlipAudioCtx || sharedFlipAudioCtx.state === 'closed') {
      sharedFlipAudioCtx = new AudioCtx();
    }
    if (sharedFlipAudioCtx.state === 'suspended') {
      sharedFlipAudioCtx.resume().catch(() => { });
    }
    const ctx = sharedFlipAudioCtx;
    const bufferSize = Math.floor(ctx.sampleRate * 0.20); // 200ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.exp(-i / (bufferSize * 0.35));
      data[i] = (Math.random() * 2 - 1) * decay * 0.20;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.19);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (_) { }
};

export const PdfFlipbookViewer: React.FC<PdfFlipbookViewerProps> = ({
  pdfUrl,
  pageImages,
  totalPages: propTotalPages,
  title = 'Studio Lookbook',
  isDark = true,
  accentColor = '#f59e0b',
  allowDownload = true,
  height = '540px',
  className = '',
  defaultViewMode,
  showModeSwitch = true,
  isEditable = false,
  paperAspectRatio,
  onViewModeChange,
  onTotalPagesDetected,
  onFirstPageRendered
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // View Mode: 'double' (2-Sisi spread) or 'single' (1-Sisi single page)
  const [viewMode, setViewMode] = useState<'double' | 'single'>(() => {
    if (defaultViewMode) return defaultViewMode;
    return typeof window !== 'undefined' && window.innerWidth < 820 ? 'single' : 'double';
  });

  useEffect(() => {
    if (defaultViewMode) {
      setViewMode(defaultViewMode);
    }
  }, [defaultViewMode]);

  // Client-side PDF.js rendered pages & auto-detected page count
  const [pdfJsPages, setPdfJsPages] = useState<Record<number, string>>({});
  const [pdfJsNumPages, setPdfJsNumPages] = useState<number | null>(null);
  const [isLoadingPdfDoc, setIsLoadingPdfDoc] = useState<boolean>(false);
  const pdfDocRef = useRef<any>(null);
  const renderingPagesRef = useRef<Set<number>>(new Set());

  const totalPages = Math.max(
    pdfJsNumPages || propTotalPages || (pageImages ? pageImages.length : (pdfUrl ? 8 : DEFAULT_EDITORIAL_PAGES.length)),
    1
  );

  // Dynamic Image URL helper (Priority: explicit pageImages -> PDF.js rendered canvas -> Cloudinary PDF-to-JPG)
  const getPageImageUrl = useCallback((pageNo: number): string | null => {
    if (pageImages && pageImages[pageNo - 1]) return pageImages[pageNo - 1];
    if (pdfJsPages[pageNo]) return pdfJsPages[pageNo];
    if (pdfUrl && pdfUrl.includes('cloudinary.com') && !pdfUrl.includes('/raw/upload/')) {
      return getCloudinaryPdfPageUrl(pdfUrl, pageNo, { width: 1200 }) || null;
    }
    return null;
  }, [pageImages, pdfJsPages, pdfUrl]);

  // Image load error tracker to prevent ugly broken image boxes
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // Auto-probe PDF image natural aspect ratio (width / height)
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null);

  // Render a single PDF page via PDF.js onto an offscreen canvas
  const renderPdfJsPage = useCallback(async (pageNo: number) => {
    const doc = pdfDocRef.current;
    if (!doc || pageNo < 1 || pageNo > doc.numPages) return;
    if (renderingPagesRef.current.has(pageNo)) return;

    renderingPagesRef.current.add(pageNo);
    try {
      const page = await doc.getPage(pageNo);
      const baseVp = page.getViewport({ scale: 1 });
      if (pageNo === 1 && baseVp.width && baseVp.height) {
        const r = baseVp.width / baseVp.height;
        if (r > 0.2 && r < 4.0) {
          setDetectedRatio(r);
        }
      }

      const maxDim = Math.max(baseVp.width, baseVp.height, 1);
      const targetScale = Math.min(2.2, Math.max(1.5, 1600 / maxDim));
      const viewport = page.getViewport({ scale: targetScale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      setPdfJsPages(prev => ({ ...prev, [pageNo]: dataUrl }));
      if (pageNo === 1) {
        onFirstPageRendered?.(dataUrl);
      }
    } catch {
      // Ignore individual page render error
    } finally {
      renderingPagesRef.current.delete(pageNo);
    }
  }, [onFirstPageRendered]);

  // Load PDF document via PDF.js whenever pdfUrl changes
  useEffect(() => {
    let isCancelled = false;
    setPdfJsPages({});
    setPdfJsNumPages(null);
    setFailedImages({});
    renderingPagesRef.current.clear();
    pdfDocRef.current = null;

    if (!pdfUrl || typeof pdfUrl !== 'string' || !pdfUrl.trim()) {
      setIsLoadingPdfDoc(false);
      setDetectedRatio(null);
      return;
    }

    setIsLoadingPdfDoc(true);

    ensurePdfJsLoaded()
      .then(async (pdfjsLib) => {
        if (isCancelled) return;
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: (pdfjsLib as any).__cmapUrl,
          cMapPacked: true
        });
        const doc = await loadingTask.promise;
        if (isCancelled) {
          doc.destroy?.();
          return;
        }
        pdfDocRef.current = doc;
        const num = doc.numPages || 1;
        setPdfJsNumPages(num);
        onTotalPagesDetected?.(num);

        // Probe page 1 aspect ratio & render first 3 pages immediately
        try {
          const p1 = await doc.getPage(1);
          const vp1 = p1.getViewport({ scale: 1 });
          if (vp1.width && vp1.height) {
            const r = vp1.width / vp1.height;
            if (r > 0.2 && r < 4.0 && !isCancelled) {
              setDetectedRatio(r);
            }
          }
        } catch { }

        await Promise.all([1, 2, 3].filter(p => p <= num).map(p => renderPdfJsPage(p)));
        if (!isCancelled) setIsLoadingPdfDoc(false);
      })
      .catch(() => {
        if (!isCancelled) setIsLoadingPdfDoc(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl, onTotalPagesDetected, renderPdfJsPage]);

  // Responsive Container Width with RAF Debounce to prevent ResizeObserver loop errors
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 1100) : 960
  );

  useEffect(() => {
    if (!containerRef.current) return;
    let rafId: number | null = null;
    const updateSize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          const w = containerRef.current.clientWidth;
          if (w > 0) setContainerWidth(w);
        }
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (detectedRatio) return;
    const probeUrl = getPageImageUrl(1);
    if (!probeUrl) return;
    const probeImg = new Image();
    probeImg.onload = () => {
      if (probeImg.naturalWidth && probeImg.naturalHeight) {
        const r = probeImg.naturalWidth / probeImg.naturalHeight;
        if (r > 0.25 && r < 3.5) {
          setDetectedRatio(r);
        }
      }
    };
    probeImg.src = probeUrl;
  }, [getPageImageUrl, detectedRatio]);

  const isDouble = viewMode === 'double';

  // Active Paper Aspect Ratio (Prop > Detected from PDF > ISO A4 Standard 0.7071)
  const activeRatio = paperAspectRatio || detectedRatio || 0.7071;

  // Base desired total height (from prop or default with responsive viewport calculation)
  const baseTargetHeight = useMemo(() => {
    if (typeof height === 'number') return height;
    if (typeof height === 'string') {
      if (height.endsWith('px')) {
        const parsed = parseInt(height, 10);
        if (!isNaN(parsed) && parsed > 180) return parsed;
      }
      if (typeof window !== 'undefined' && (height.includes('vh') || height.includes('dvh') || height.includes('calc'))) {
        const availableH = window.innerHeight - 130;
        if (availableH > 320) return Math.min(availableH, 860);
      }
    }
    return typeof window !== 'undefined' && window.innerWidth < 820 ? 460 : 540;
  }, [height]);

  // Calculate strict length x width stable paper dimensions (reserving 52px for the bottom dock when height is compact)
  const { stageWidth, stageHeight, singlePageWidth, spreadWidth, halfWidth } = useMemo(() => {
    const isMobileSize = containerWidth < 768;
    const maxAllowedWidth = Math.max(containerWidth - (isMobileSize ? 12 : 24), 240);
    const maxStageHeight = Math.max(180, baseTargetHeight - 54);

    if (isDouble) {
      let h = maxStageHeight;
      let singleW = Math.round(h * activeRatio);
      let totalW = singleW * 2;

      if (totalW > maxAllowedWidth) {
        totalW = maxAllowedWidth;
        singleW = Math.round(totalW / 2);
        h = Math.round(singleW / activeRatio);
      }

      return {
        stageWidth: totalW,
        stageHeight: h,
        singlePageWidth: singleW,
        spreadWidth: totalW,
        halfWidth: singleW
      };
    } else {
      let h = maxStageHeight;
      let singleW = Math.round(h * activeRatio);

      if (singleW > maxAllowedWidth) {
        singleW = maxAllowedWidth;
        h = Math.round(singleW / activeRatio);
      }

      return {
        stageWidth: singleW,
        stageHeight: h,
        singlePageWidth: singleW,
        spreadWidth: singleW,
        halfWidth: Math.round(singleW / 2)
      };
    }
  }, [isDouble, activeRatio, baseTargetHeight, containerWidth]);

  // In 2-Sisi mode:
  // - currentSpread: 0 = Cover, 1 = Pages 2-3, 2 = Pages 4-5, 3 = Pages 6-7, 4 = Back Cover (Page 8)
  const maxSpread = Math.ceil(totalPages / 2);
  const [currentSpread, setCurrentSpread] = useState<number>(0);

  // In 1-Sisi mode:
  // - singlePage: 1 to totalPages
  const [singlePage, setSinglePage] = useState<number>(1);

  // Animation state with synchronous atomic lock
  const isFlippingRef = useRef<boolean>(false);
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next');
  const [animatingPage, setAnimatingPage] = useState<{ front: number; back: number } | null>(null);

  // Interactive Physics Drag state
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [dragSide, setDragSide] = useState<'right' | 'left' | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number; time: number; side: 'right' | 'left' } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 820;
      setIsMobile(mobile);
      if (mobile) setViewMode('single');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload PDF.js and Cloudinary PDF pages around current view to ensure instantaneous zero-glitch display
  useEffect(() => {
    if (!pdfUrl) return;
    const basePage = isDouble ? currentSpread * 2 : singlePage;
    const pagesToPreload = [
      basePage - 2,
      basePage - 1,
      basePage,
      basePage + 1,
      basePage + 2,
      basePage + 3
    ].filter(p => p >= 1 && p <= totalPages);

    if (pdfDocRef.current) {
      pagesToPreload.forEach(p => {
        if (!pdfJsPages[p]) {
          renderPdfJsPage(p);
        }
      });
    } else if (pdfUrl.includes('cloudinary.com') && !pdfUrl.includes('/raw/upload/')) {
      pagesToPreload.forEach(p => {
        const url = getCloudinaryPdfPageUrl(pdfUrl, p, { width: 1200 });
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [currentSpread, singlePage, isDouble, pdfUrl, totalPages, pdfJsPages, renderPdfJsPage]);

  const isCover = isDouble && currentSpread === 0;
  const isBackCover = isDouble && currentSpread === maxSpread;

  // ── ATOMIC ROCK-SOLID FLIP ACTIONS ──────────────────────────────────────────
  const flipNext = useCallback(() => {
    if (isFlippingRef.current) return;
    if (dragAnimRafRef.current !== null) {
      cancelAnimationFrame(dragAnimRafRef.current);
      dragAnimRafRef.current = null;
    }

    if (!isDouble) {
      if (singlePage >= totalPages) return;
      isFlippingRef.current = true;
      haptic.selection();
      if (soundEnabled) playPaperFlipSound();

      setAnimatingPage({ front: singlePage, back: singlePage + 1 });
      setFlipDir('next');
      setIsFlipping(true);

      const finishSingleNext = () => {
        commitFlipFinishRef.current = null;
        if (flipTimeoutRef.current) { clearTimeout(flipTimeoutRef.current); flipTimeoutRef.current = null; }
        setSinglePage(prev => Math.min(totalPages, prev + 1));
        isFlippingRef.current = false;
        setIsFlipping(false);
        setAnimatingPage(null);
        setDragProgress(null);
        setDragSide(null);
      };
      commitFlipFinishRef.current = finishSingleNext;
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(finishSingleNext, 850);
      return;
    }

    // 2-Sisi mode
    if (currentSpread >= maxSpread) return;
    isFlippingRef.current = true;
    haptic.selection();
    if (soundEnabled) playPaperFlipSound();

    if (currentSpread === 0) {
      // Opening Cover (Page 1 turns to Left -> reveals Page 2 on back, Page 3 on right)
      setAnimatingPage({ front: 1, back: 2 });
    } else if (currentSpread === maxSpread - 1) {
      // Closing last spread to Back Cover (Page 7 turns to Left -> lands as Page 8)
      setAnimatingPage({ front: currentSpread * 2 + 1, back: totalPages });
    } else {
      // Inside spread turning forward
      const rightPage = currentSpread * 2 + 1;
      setAnimatingPage({ front: rightPage, back: rightPage + 1 });
    }

    setFlipDir('next');
    setIsFlipping(true);

    const finishDoubleNext = () => {
      commitFlipFinishRef.current = null;
      if (flipTimeoutRef.current) { clearTimeout(flipTimeoutRef.current); flipTimeoutRef.current = null; }
      setCurrentSpread(prev => Math.min(maxSpread, prev + 1));
      isFlippingRef.current = false;
      setIsFlipping(false);
      setAnimatingPage(null);
      setDragProgress(null);
      setDragSide(null);
    };
    commitFlipFinishRef.current = finishDoubleNext;
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    flipTimeoutRef.current = setTimeout(finishDoubleNext, 900);
  }, [isDouble, singlePage, totalPages, currentSpread, maxSpread, soundEnabled]);

  const flipPrev = useCallback(() => {
    if (isFlippingRef.current) return;
    if (dragAnimRafRef.current !== null) {
      cancelAnimationFrame(dragAnimRafRef.current);
      dragAnimRafRef.current = null;
    }

    if (!isDouble) {
      if (singlePage <= 1) return;
      isFlippingRef.current = true;
      haptic.selection();
      if (soundEnabled) playPaperFlipSound();

      setAnimatingPage({ front: singlePage, back: singlePage - 1 });
      setFlipDir('prev');
      setIsFlipping(true);

      const finishSinglePrev = () => {
        commitFlipFinishRef.current = null;
        if (flipTimeoutRef.current) { clearTimeout(flipTimeoutRef.current); flipTimeoutRef.current = null; }
        setSinglePage(prev => Math.max(1, prev - 1));
        isFlippingRef.current = false;
        setIsFlipping(false);
        setAnimatingPage(null);
        setDragProgress(null);
        setDragSide(null);
      };
      commitFlipFinishRef.current = finishSinglePrev;
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(finishSinglePrev, 850);
      return;
    }

    // 2-Sisi mode
    if (currentSpread <= 0) return;
    isFlippingRef.current = true;
    haptic.selection();
    if (soundEnabled) playPaperFlipSound();

    if (currentSpread === 1) {
      // Closing Spread 1 back to Cover (Page 2 turns to Right -> lands as Cover Page 1)
      setAnimatingPage({ front: 2, back: 1 });
    } else if (currentSpread === maxSpread) {
      // Opening Back Cover backward (Page 8 turns to Right -> reveals Page 7)
      setAnimatingPage({ front: totalPages, back: totalPages - 1 });
    } else {
      // Inside spread turning backward
      const leftPage = currentSpread * 2;
      setAnimatingPage({ front: leftPage, back: leftPage - 1 });
    }

    setFlipDir('prev');
    setIsFlipping(true);

    const finishDoublePrev = () => {
      commitFlipFinishRef.current = null;
      if (flipTimeoutRef.current) { clearTimeout(flipTimeoutRef.current); flipTimeoutRef.current = null; }
      setCurrentSpread(prev => Math.max(0, prev - 1));
      isFlippingRef.current = false;
      setIsFlipping(false);
      setAnimatingPage(null);
      setDragProgress(null);
      setDragSide(null);
    };
    commitFlipFinishRef.current = finishDoublePrev;
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    flipTimeoutRef.current = setTimeout(finishDoublePrev, 900);
  }, [isDouble, singlePage, currentSpread, maxSpread, totalPages, soundEnabled]);

  const jumpToPage = useCallback((targetPage: number) => {
    if (isFlippingRef.current) return;
    const p = Math.max(1, Math.min(totalPages, targetPage));
    haptic.selection();
    if (!isDouble) {
      setSinglePage(p);
    } else {
      if (p === 1) setCurrentSpread(0);
      else if (p >= totalPages) setCurrentSpread(maxSpread);
      else setCurrentSpread(Math.floor(p / 2));
    }
  }, [totalPages, isDouble, maxSpread]);

  const dragAnimRafRef = useRef<number | null>(null);
  const onStagePointerUpRef = useRef<() => void>(() => {});
  const commitFlipFinishRef = useRef<(() => void) | null>(null);

  const animateDragProgress = (from: number, to: number, durationMs: number, onComplete: () => void) => {
    if (dragAnimRafRef.current !== null) {
      cancelAnimationFrame(dragAnimRafRef.current);
      dragAnimRafRef.current = null;
    }
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / Math.max(1, durationMs));
      // Smooth cubic ease-out for natural paper settling
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      setDragProgress(val);
      if (t < 1) {
        dragAnimRafRef.current = requestAnimationFrame(tick);
      } else {
        dragAnimRafRef.current = null;
        onComplete();
      }
    };
    dragAnimRafRef.current = requestAnimationFrame(tick);
  };

  // Clean up timeouts and reset atomic flipping lock on unmount
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      if (dragAnimRafRef.current !== null) cancelAnimationFrame(dragAnimRafRef.current);
      isFlippingRef.current = false;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') flipNext();
      if (e.key === 'ArrowLeft') flipPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flipNext, flipPrev]);

  // ── Drag / Pull Physics Handlers ─────────────────────────────────────────────
  const onPagePointerDown = (e: React.PointerEvent<HTMLDivElement>, side: 'right' | 'left') => {
    if (isFlippingRef.current) return;
    if (isDouble) {
      if (side === 'right' && currentSpread >= maxSpread) return;
      if (side === 'left' && currentSpread <= 0) return;
    } else {
      if (side === 'right' && singlePage >= totalPages) return;
      if (side === 'left' && singlePage <= 1) return;
    }

    // Immediately clear any active text selections in the browser
    if (typeof window !== 'undefined' && window.getSelection) {
      try {
        window.getSelection()?.removeAllRanges();
      } catch (_) { }
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) { }

    pointerDownPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      side
    };
    isDraggingRef.current = false;
  };

  const onStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownPosRef.current || isFlippingRef.current) return;
    const { x, side } = pointerDownPosRef.current;

    // Boundary guards: cegah out-of-bounds drag di cover atau back cover
    if (isDouble) {
      if (side === 'right' && currentSpread >= maxSpread) return;
      if (side === 'left' && currentSpread <= 0) return;
    } else {
      if (side === 'right' && singlePage >= totalPages) return;
      if (side === 'left' && singlePage <= 1) return;
    }

    const deltaX = side === 'right' ? x - e.clientX : e.clientX - x;

    if (deltaX > 8) {
      isDraggingRef.current = true;
      if (typeof window !== 'undefined' && window.getSelection) {
        try {
          window.getSelection()?.removeAllRanges();
        } catch (_) { }
      }
      const progress = Math.min(Math.max(deltaX / (halfWidth * 0.9), 0), 1);
      setDragSide(side);
      setDragProgress(progress);

      // Mount turning leaf if not already mounted
      if (!animatingPage) {
        if (!isDouble) {
          if (side === 'right') {
            setAnimatingPage({ front: singlePage, back: Math.min(totalPages, singlePage + 1) });
            setFlipDir('next');
          } else {
            setAnimatingPage({ front: singlePage, back: Math.max(1, singlePage - 1) });
            setFlipDir('prev');
          }
        } else {
          if (side === 'right') {
            if (currentSpread >= maxSpread) return;
            if (currentSpread === 0) setAnimatingPage({ front: 1, back: 2 });
            else if (currentSpread === maxSpread - 1) setAnimatingPage({ front: currentSpread * 2 + 1, back: totalPages });
            else setAnimatingPage({ front: currentSpread * 2 + 1, back: currentSpread * 2 + 2 });
            setFlipDir('next');
          } else {
            if (currentSpread <= 0) return;
            if (currentSpread === 1) setAnimatingPage({ front: 2, back: 1 });
            else if (currentSpread === maxSpread) setAnimatingPage({ front: totalPages, back: totalPages - 1 });
            else setAnimatingPage({ front: currentSpread * 2, back: currentSpread * 2 - 1 });
            setFlipDir('prev');
          }
        }
      }
    }
  };

  const onStagePointerUp = () => {
    if (!pointerDownPosRef.current) return;
    const { time, side } = pointerDownPosRef.current;
    const elapsed = Date.now() - time;
    const wasDragging = isDraggingRef.current;

    pointerDownPosRef.current = null;
    isDraggingRef.current = false;

    if (wasDragging && dragProgress !== null) {
      const velocity = dragProgress / Math.max(elapsed / 1000, 0.1);
      if (dragProgress > 0.24 || velocity > 0.55) {
        // Complete the flip smoothly from current dragProgress to 1.0
        isFlippingRef.current = true;
        setIsFlipping(true);
        if (soundEnabled) playPaperFlipSound();
        haptic.selection();

        const remainingRatio = Math.max(0.25, 1 - dragProgress);
        const duration = Math.round(460 * remainingRatio + 120);
        animateDragProgress(dragProgress, 1, duration, () => {
          if (!isDouble) {
            if (side === 'right') setSinglePage(prev => Math.min(totalPages, prev + 1));
            else setSinglePage(prev => Math.max(1, prev - 1));
          } else {
            if (side === 'right') setCurrentSpread(prev => Math.min(maxSpread, prev + 1));
            else setCurrentSpread(prev => Math.max(0, prev - 1));
          }
          isFlippingRef.current = false;
          setIsFlipping(false);
          setAnimatingPage(null);
          setDragProgress(null);
          setDragSide(null);
        });
      } else {
        // Smoothly snap back from current dragProgress to 0
        isFlippingRef.current = true;
        const duration = Math.round(280 * Math.max(0.3, dragProgress) + 90);
        animateDragProgress(dragProgress, 0, duration, () => {
          isFlippingRef.current = false;
          setDragProgress(null);
          setDragSide(null);
          setAnimatingPage(null);
        });
      }
    } else {
      // It was a click (no drag)
      setDragProgress(null);
      setDragSide(null);
      setAnimatingPage(null);
      if (side === 'right') flipNext();
      else flipPrev();
    }
  };

  onStagePointerUpRef.current = onStagePointerUp;

  // Global window pointer listener to ensure drag never hangs if mouse releases outside
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDraggingRef.current || pointerDownPosRef.current) {
        onStagePointerUpRef.current();
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${(title || 'sumrday-guideline').toLowerCase().replace(/\s+/g, '-')}.pdf`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.print();
    }
  };

  // Render content of a single page leaf (Clean, zero giant gap, pristine typography & true PDF rendering)
  const renderPageContent = (pageNo: number, isRightSide: boolean = false) => {
    if (pageNo < 1 || pageNo > totalPages) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          background: isDark ? '#0b0f19' : '#ffffff'
        }} />
      );
    }

    const imgUrl = getPageImageUrl(pageNo);
    const hasRealPdfImage = Boolean(imgUrl && !failedImages[pageNo]);
    const isWaitingForPdfRender = Boolean(pdfUrl && !hasRealPdfImage && (isLoadingPdfDoc || pdfDocRef.current));
    const editorial = DEFAULT_EDITORIAL_PAGES[(pageNo - 1) % DEFAULT_EDITORIAL_PAGES.length];
    const isThisCover = pageNo === 1;
    const isThisBack = pageNo === totalPages;
    const pageScale = Math.max(0.42, Math.min(1.15, stageHeight / 480));

    return (
      <div
        className="flipbook-unselectable"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: hasRealPdfImage || isWaitingForPdfRender ? '#ffffff' : (editorial?.bg || (isDark ? '#0f172a' : '#ffffff')),
          color: isDark ? '#ffffff' : '#0f172a',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          boxShadow: isRightSide
            ? 'inset 6px 0 10px -6px rgba(0,0,0,0.06)'
            : 'inset -6px 0 10px -6px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {hasRealPdfImage ? (
          <img
            src={imgUrl!}
            alt={`Halaman ${pageNo}`}
            onError={() => {
              setFailedImages(prev => ({ ...prev, [pageNo]: true }));
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              background: '#ffffff',
              display: 'block',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
            loading="eager"
            draggable={false}
          />
        ) : isWaitingForPdfRender ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#ffffff',
            color: '#475569'
          }}>
            <Loader2 size={20} className="animate-spin" style={{ color: accentColor }} />
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
              Halaman {pageNo}
            </span>
          </div>
        ) : (
          /* Scaled Editorial Fallback (Never wraps or overflows at any preview size) */
          <div style={{
            padding: `${Math.round(32 * pageScale)}px ${Math.round(24 * pageScale)}px`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span style={{
                fontSize: Math.max(7.5, Math.round(10 * pageScale)),
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: accentColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {editorial?.category || 'STUDIO'}
              </span>
              <span style={{
                fontSize: Math.max(7.5, Math.round(10 * pageScale)),
                fontWeight: 750,
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}>
                {isThisCover ? 'COVER' : isThisBack ? 'BACK' : pageNo}
              </span>
            </div>

            <div style={{ margin: 'auto 0', overflow: 'hidden' }}>
              {isThisCover && (
                <div style={{
                  display: 'inline-flex',
                  padding: `${Math.max(2, Math.round(4 * pageScale))}px ${Math.max(6, Math.round(10 * pageScale))}px`,
                  borderRadius: 100,
                  background: `${accentColor}25`,
                  color: accentColor,
                  fontSize: Math.max(7.5, Math.round(10 * pageScale)),
                  fontWeight: 800,
                  marginBottom: Math.round(12 * pageScale),
                  whiteSpace: 'nowrap'
                }}>
                  OFFICIAL RELEASE
                </div>
              )}

              <h3 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: Math.max(13, Math.round((isThisCover ? 30 : 22) * pageScale)),
                fontWeight: 850,
                lineHeight: 1.18,
                margin: `0 0 ${Math.round(8 * pageScale)}px`,
                color: isDark ? '#ffffff' : '#0f172a'
              }}>
                {editorial?.title || `Halaman ${pageNo}`}
              </h3>

              <h5 style={{
                fontSize: Math.max(9, Math.round(12.5 * pageScale)),
                fontWeight: 650,
                color: accentColor,
                margin: `0 0 ${Math.round(10 * pageScale)}px`,
                lineHeight: 1.35
              }}>
                {editorial?.subtitle}
              </h5>

              {editorial?.content && (
                <p style={{
                  fontSize: Math.max(8.5, Math.round(12.5 * pageScale)),
                  lineHeight: 1.55,
                  color: isDark ? '#cbd5e1' : '#475569',
                  margin: 0
                }}>
                  {editorial.content}
                </p>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              paddingTop: Math.round(8 * pageScale),
              gap: 6
            }}>
              <span style={{
                fontSize: Math.max(7, Math.round(9.5 * pageScale)),
                color: '#94a3b8',
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                sumr.day • Creative Digital Studio
              </span>
              <div style={{
                width: Math.max(5, Math.round(7 * pageScale)),
                height: Math.max(5, Math.round(7 * pageScale)),
                borderRadius: '50%',
                background: accentColor,
                flexShrink: 0
              }} />
            </div>
          </div>
        )}

        {/* Ultra-subtle paper fold crease (Soft whisper, zero wide dark gap) */}
        {isDouble && !isCover && !isBackCover && (
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: isRightSide ? 0 : 'auto',
            right: isRightSide ? 'auto' : 0,
            width: 10,
            background: isRightSide
              ? (isDark ? 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)' : 'linear-gradient(to right, rgba(0,0,0,0.04), transparent)')
              : (isDark ? 'linear-gradient(to left, rgba(0,0,0,0.2), transparent)' : 'linear-gradient(to left, rgba(0,0,0,0.04), transparent)'),
            pointerEvents: 'none'
          }} />
        )}
      </div>
    );
  };

  // Active drag angle calculation for real-time physics pull
  const isDragging = dragProgress !== null && dragProgress > 0;
  const isRestingCover = isCover && !isFlipping && !isDragging;
  const isRestingBackCover = isBackCover && !isFlipping && !isDragging;
  const dragRotateAngle = isDragging
    ? (dragSide === 'right' ? -dragProgress * 180 : dragProgress * 180)
    : 0;
  const dragCurlSkew = isDragging
    ? (dragSide === 'right' ? -Math.sin(dragProgress * Math.PI) * 4.5 : Math.sin(dragProgress * Math.PI) * 4.5)
    : 0;

  // Dynamic smooth drag shadow and sheen (fades in smoothly from 0, peaks mid-flight, fades out to 0 at landing)
  const dragProgressFactor = isDragging && dragProgress !== null ? Math.sin(dragProgress * Math.PI) : 0;

  const dragLeafShadow = isDragging
    ? (dragSide === 'right'
      ? `-${dragProgressFactor * 26}px 0 ${dragProgressFactor * 45}px rgba(0,0,0,${dragProgressFactor * 0.32})`
      : `${dragProgressFactor * 26}px 0 ${dragProgressFactor * 45}px rgba(0,0,0,${dragProgressFactor * 0.32})`)
    : undefined;

  const dragSheenFrontOpacity = isDragging
    ? (dragProgress !== null ? Math.sin(Math.min(dragProgress, 0.6) / 0.6 * Math.PI) * 0.45 : 0)
    : 0;

  const dragSheenBackOpacity = isDragging
    ? (dragProgress !== null && dragProgress > 0.4 ? Math.sin((dragProgress - 0.4) / 0.6 * Math.PI) * 0.45 : 0)
    : 0;

  // In 1-Sisi mode: once rotated past 90° (or dragProgress > 0.48), the turning page MUST be hidden
  // so it never juts out onto the left empty canvas!
  const singlePageLeafOpacity = !isDouble && isDragging
    ? (dragSide === 'right'
      ? (dragProgress !== null && dragProgress > 0.48 ? 0 : 1)
      : (dragProgress !== null && dragProgress < 0.48 ? 0 : 1))
    : 1;

  // ── DYNAMIC BOOK BODY TRANSLATION (AUTO-CENTERING WITHOUT DOM REFLOW) ────────
  // When Cover (spread 0) is closed, book body translates by -halfWidth/2 (-240px)
  // so the 480px Cover is DEAD CENTER in the viewport.
  // As it opens, it smoothly glides to 0px!
  // Same symmetry for closed Back Cover (+240px).
  const getBookShiftX = () => {
    if (!isDouble) return 0;
    const baseCoverShift = -(halfWidth / 2);
    const baseBackShift = halfWidth / 2;

    if (currentSpread === 0) {
      if (isDragging && dragSide === 'right' && dragProgress !== null) {
        return baseCoverShift * (1 - dragProgress);
      }
      if (isFlipping && flipDir === 'next') {
        return 0;
      }
      return baseCoverShift;
    }

    if (currentSpread === maxSpread) {
      if (isDragging && dragSide === 'left' && dragProgress !== null) {
        return baseBackShift * (1 - dragProgress);
      }
      if (isFlipping && flipDir === 'prev') {
        return 0;
      }
      return baseBackShift;
    }

    if (currentSpread === 1) {
      if (isDragging && dragSide === 'left' && dragProgress !== null) {
        return baseCoverShift * dragProgress;
      }
      if (isFlipping && flipDir === 'prev') {
        return baseCoverShift;
      }
      return 0;
    }

    if (currentSpread === maxSpread - 1) {
      if (isDragging && dragSide === 'right' && dragProgress !== null) {
        return baseBackShift * dragProgress;
      }
      if (isFlipping && flipDir === 'next') {
        return baseBackShift;
      }
      return 0;
    }

    return 0;
  };

  const bookShiftX = getBookShiftX();

  const getGroundShadowWidth = (): string => {
    if (!isDouble) return '92%';
    if (currentSpread === 0) {
      if (isDragging && dragSide === 'right' && dragProgress !== null) {
        return `${48 + 44 * dragProgress}%`;
      }
      if (isFlipping && flipDir === 'next') return '92%';
      return '48%';
    }
    if (currentSpread === maxSpread) {
      if (isDragging && dragSide === 'left' && dragProgress !== null) {
        return `${48 + 44 * dragProgress}%`;
      }
      if (isFlipping && flipDir === 'prev') return '92%';
      return '48%';
    }
    if (currentSpread === 1) {
      if (isDragging && dragSide === 'left' && dragProgress !== null) {
        return `${92 - 44 * dragProgress}%`;
      }
      if (isFlipping && flipDir === 'prev') return '48%';
    }
    if (currentSpread === maxSpread - 1) {
      if (isDragging && dragSide === 'right' && dragProgress !== null) {
        return `${92 - 44 * dragProgress}%`;
      }
      if (isFlipping && flipDir === 'next') return '48%';
    }
    return '92%';
  };

  const groundShadowWidth = getGroundShadowWidth();

  const getSpreadPageNumbers = () => {
    if (currentSpread === 0) {
      if ((isFlipping || isDragging) && flipDir === 'next') {
        // While cover leaf is turning, left slot MUST remain hidden!
        // Page 2 is printed on the back of the turning cover leaf itself.
        // It lands on the left at the end of the flip, at which point currentSpread becomes 1.
        return { left: 0, right: 3, leftVisible: false, rightVisible: true };
      }
      return { left: 0, right: 1, leftVisible: false, rightVisible: true };
    }

    if (currentSpread === maxSpread) {
      if ((isFlipping || isDragging) && flipDir === 'prev') {
        // While back cover is lifting backward, right slot stays hidden until leaf lands on right.
        return { left: Math.max(1, totalPages - 2), right: 0, leftVisible: true, rightVisible: false };
      }
      return { left: totalPages, right: 0, leftVisible: true, rightVisible: false };
    }

    // Inside spreads
    const baseLeft = currentSpread * 2;
    const baseRight = currentSpread * 2 + 1;

    if ((isFlipping || isDragging) && flipDir === 'next') {
      if (currentSpread === maxSpread - 1) {
        return { left: baseLeft, right: 0, leftVisible: true, rightVisible: false };
      }
      return { left: baseLeft, right: Math.min(totalPages, (currentSpread + 1) * 2 + 1), leftVisible: true, rightVisible: true };
    }

    if ((isFlipping || isDragging) && flipDir === 'prev') {
      if (currentSpread === 1) {
        return { left: 0, right: baseRight, leftVisible: false, rightVisible: true };
      }
      return { left: Math.max(1, (currentSpread - 1) * 2), right: baseRight, leftVisible: true, rightVisible: true };
    }

    return { left: baseLeft, right: baseRight, leftVisible: true, rightVisible: true };
  };

  const spreadPages = getSpreadPageNumbers();

  return (
    <div
      ref={containerRef}
      className={`flipbook-unselectable relative w-full flex flex-col items-center justify-center select-none ${className}`}
      style={{
        background: 'transparent',
        padding: '6px 0 4px',
        height: isFullscreen ? '100vh' : (typeof height === 'number' ? `${height}px` : height),
        minHeight: isFullscreen ? '100vh' : (typeof height === 'number' ? `${height}px` : height),
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        justifyContent: 'space-between',
        overscrollBehavior: 'none'
      }}
    >
      {/* ── 3D Paper Motion Keyframes & GPU Anti-Aliasing Rules ── */}
      <style>{`
        /* Complete prevention of text highlighting during physics drag */
        .flipbook-unselectable,
        .flipbook-unselectable * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-user-drag: none !important;
        }
        .flipbook-unselectable ::selection {
          background: transparent !important;
          color: inherit !important;
        }

        /* 2-Sisi Paper Curl Keyframes (Spine pinned at x=0; translateZ before rotateY prevents spine detachment & Z-fighting) */
        @keyframes pageTurnNextCurl {
          0% {
            transform: translateZ(1px) rotateY(0deg) skewY(0deg);
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          18% {
            box-shadow: -8px 0 18px rgba(0,0,0,0.16);
          }
          38% {
            transform: translateZ(2px) rotateY(-55deg) skewY(-4.5deg);
            box-shadow: -26px 0 45px rgba(0,0,0,0.30);
          }
          65% {
            transform: translateZ(2px) rotateY(-125deg) skewY(3.5deg);
            box-shadow: 26px 0 45px rgba(0,0,0,0.30);
          }
          85% {
            box-shadow: 8px 0 18px rgba(0,0,0,0.16);
          }
          100% {
            transform: translateZ(1px) rotateY(-180deg) skewY(0deg);
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
        }
        @keyframes pageTurnPrevCurl {
          0% {
            transform: translateZ(1px) rotateY(0deg) skewY(0deg);
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          18% {
            box-shadow: 8px 0 18px rgba(0,0,0,0.16);
          }
          38% {
            transform: translateZ(2px) rotateY(55deg) skewY(4.5deg);
            box-shadow: 28px 0 45px rgba(0,0,0,0.30);
          }
          65% {
            transform: translateZ(2px) rotateY(125deg) skewY(-3.5deg);
            box-shadow: -28px 0 45px rgba(0,0,0,0.30);
          }
          85% {
            box-shadow: -8px 0 18px rgba(0,0,0,0.16);
          }
          100% {
            transform: translateZ(1px) rotateY(180deg) skewY(0deg);
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
        }

        /* ── Dynamic Paper Sheen Fade-In & Fade-Out Animations (Zero Abrupt Cuts) ── */
        @keyframes frontSheenAnim {
          0% {
            opacity: 0;
          }
          18% {
            opacity: 0.20;
          }
          45% {
            opacity: 0.45;
          }
          70% {
            opacity: 0.20;
          }
          92%, 100% {
            opacity: 0;
          }
        }

        @keyframes backSheenAnim {
          0%, 35% {
            opacity: 0;
          }
          55% {
            opacity: 0.20;
          }
          75% {
            opacity: 0.45;
          }
          90% {
            opacity: 0.20;
          }
          100% {
            opacity: 0;
          }
        }

        .flipbook-sheen-front {
          animation: frontSheenAnim 0.78s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: opacity;
        }

        .flipbook-sheen-back {
          animation: backSheenAnim 0.78s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: opacity;
        }

        /* 1-Sisi Keyframes: HIDDEN AFTER 90° (50%) SO IT NEVER JUTS OUT TO THE LEFT! */
        @keyframes pageTurnNextSingle {
          0% {
            transform: rotateY(0deg) skewY(0deg) translateZ(0px);
            opacity: 1;
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          18% {
            box-shadow: -10px 0 20px rgba(0,0,0,0.20);
          }
          30% {
            transform: rotateY(-50deg) skewY(-3.5deg) translateZ(28px);
            opacity: 1;
            box-shadow: -20px 0 35px rgba(0,0,0,0.32);
          }
          46% {
            transform: rotateY(-82deg) skewY(-1deg) translateZ(10px);
            opacity: 0.6;
            box-shadow: -8px 0 15px rgba(0,0,0,0.15);
          }
          49% {
            transform: rotateY(-89deg) skewY(0deg) translateZ(2px);
            opacity: 0.1;
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          50%, 100% {
            transform: rotateY(-90deg) skewY(0deg) translateZ(0px);
            opacity: 0;
            visibility: hidden;
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
        }

        @keyframes pageTurnPrevSingle {
          0%, 50% {
            transform: rotateY(-90deg) skewY(0deg) translateZ(0px);
            opacity: 0;
            visibility: hidden;
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          52% {
            transform: rotateY(-89deg) skewY(0deg) translateZ(2px);
            opacity: 0.1;
            visibility: visible;
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          55% {
            transform: rotateY(-82deg) skewY(1deg) translateZ(10px);
            opacity: 0.6;
            box-shadow: -8px 0 15px rgba(0,0,0,0.15);
          }
          72% {
            transform: rotateY(-50deg) skewY(3.5deg) translateZ(28px);
            opacity: 1;
            box-shadow: -20px 0 35px rgba(0,0,0,0.32);
          }
          88% {
            box-shadow: -10px 0 20px rgba(0,0,0,0.20);
          }
          100% {
            transform: rotateY(0deg) skewY(0deg) translateZ(0px);
            opacity: 1;
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
        }

        .flipbook-leaf-next-curl {
          animation: pageTurnNextCurl 0.78s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: left center;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          will-change: transform, box-shadow;
        }
        .flipbook-leaf-prev-curl {
          animation: pageTurnPrevCurl 0.78s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: right center;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          will-change: transform, box-shadow;
        }
        .flipbook-leaf-single-next {
          animation: pageTurnNextSingle 0.72s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: left center;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          will-change: transform, opacity;
        }
        .flipbook-leaf-single-prev {
          animation: pageTurnPrevSingle 0.72s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          transform-origin: left center;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          will-change: transform, opacity;
        }
        .flipbook-page-cursor-right {
          cursor: grab;
        }
        .flipbook-page-cursor-right:active {
          cursor: grabbing;
        }
        .flipbook-page-cursor-left {
          cursor: grab;
        }
        .flipbook-page-cursor-left:active {
          cursor: grabbing;
        }
      `}</style>

      {/* 3D Physical Magazine Stage (Fixed Width to prevent layout jumps & jitter) */}
      <div
        ref={stageRef}
        data-no-3d="true"
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerCancel={onStagePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: stageWidth,
          height: stageHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 2400,
          WebkitPerspective: 2400,
          margin: '0 auto',
          touchAction: isDragging ? 'none' : (isMobile ? 'pan-y' : 'none'),
          transition: isDragging ? 'none' : 'max-width 0.45s cubic-bezier(0.22, 1, 0.36, 1), height 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {/* Soft Ambient Ground Shadow on Canvas */}
        <div style={{
          position: 'absolute',
          bottom: -18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: groundShadowWidth,
          height: 40,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 50%, transparent 75%)',
          filter: 'blur(10px)',
          zIndex: 1,
          pointerEvents: 'none',
          transition: isDragging ? 'none' : 'width 0.78s cubic-bezier(0.22, 1, 0.36, 1)'
        }} />

        {/* ── Open Book Body (Smooth translation without changing container width) ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          transform: `translateX(${bookShiftX}px)`,
          transition: isDragging ? 'none' : 'transform 0.78s cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 5,
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d'
        }}>
          {!isDouble ? (
            /* ════════════════ 1 SISI (SINGLE PAGE E-READER MODE) ════════════════ */
            <div
              onPointerDown={(e) => onPagePointerDown(e, 'right')}
              className="flipbook-page-cursor-right"
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 14,
                boxShadow: isDark
                  ? '0 30px 70px -15px rgba(0,0,0,0.95), 0 16px 32px -8px rgba(0,0,0,0.6)'
                  : '0 24px 60px -15px rgba(15,23,42,0.22), 0 10px 24px -8px rgba(15,23,42,0.15)'
              }}
            >
              {renderPageContent(
                isFlipping && flipDir === 'next'
                  ? Math.min(totalPages, singlePage + 1)
                  : singlePage,
                false
              )}
            </div>
          ) : (
            /* ════════════════ 2 SISI: SPREAD (CLEAN SEAMLESS INTEGRATION) ════════════════ */
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              position: 'relative',
            }}>
              {/* Left Page Slot: ALWAYS OCCUPIES 50% OF THE 2-PAGE SPREAD */}
              <div
                onPointerDown={(e) => {
                  if (spreadPages.leftVisible && currentSpread > 0) {
                    onPagePointerDown(e, 'left');
                  }
                }}
                className={spreadPages.leftVisible && currentSpread > 0 ? "flipbook-page-cursor-left" : ""}
                title={currentSpread > 0 ? "Klik untuk membalik mundur" : ""}
                style={{
                  width: '50%',
                  height: '100%',
                  position: 'relative',
                  borderTopLeftRadius: 14,
                  borderBottomLeftRadius: 14,
                  borderTopRightRadius: isRestingBackCover ? 14 : 0,
                  borderBottomRightRadius: isRestingBackCover ? 14 : 0,
                  overflow: 'hidden',
                  visibility: spreadPages.leftVisible ? 'visible' : 'hidden',
                  pointerEvents: spreadPages.leftVisible && currentSpread > 0 ? 'auto' : 'none',
                  borderRight: undefined,
                  boxShadow: isRestingBackCover
                    ? (isDark ? 'inset -5px 0 0 #050811, 0 25px 60px rgba(0,0,0,0.85), -5px 0 0 #1e293b, -10px 0 0 #0f172a' : 'inset -5px 0 0 #cbd5e1, 0 20px 50px rgba(15,23,42,0.18), -5px 0 0 #cbd5e1, -10px 0 0 #e2e8f0')
                    : (isDark ? '0 30px 70px -15px rgba(0,0,0,0.95)' : '0 24px 60px -15px rgba(15,23,42,0.22)'),
                  transform: 'translateZ(0px)',
                  transition: 'border-radius 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              >
                {spreadPages.left > 0 && renderPageContent(spreadPages.left, false)}
              </div>

              {/* Seamless Center Crease Line (1px ultra-fine, ZERO WIDE GAP!) */}
              <div style={{
                width: 1,
                height: '100%',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                opacity: isRestingCover || isRestingBackCover ? 0 : 1,
                transition: 'opacity 0.45s ease',
                zIndex: 10
              }} />

              {/* Right Page Slot: ALWAYS OCCUPIES 50% OF THE 2-PAGE SPREAD */}
              <div
                onPointerDown={(e) => {
                  if (spreadPages.rightVisible && currentSpread < maxSpread) {
                    onPagePointerDown(e, 'right');
                  }
                }}
                className={spreadPages.rightVisible && currentSpread < maxSpread ? "flipbook-page-cursor-right" : ""}
                title={currentSpread === 0 ? "Buka cover majalah" : (currentSpread < maxSpread ? "Klik untuk membalik maju" : "")}
                style={{
                  width: '50%',
                  height: '100%',
                  position: 'relative',
                  borderTopRightRadius: 14,
                  borderBottomRightRadius: 14,
                  borderTopLeftRadius: isRestingCover ? 14 : 0,
                  borderBottomLeftRadius: isRestingCover ? 14 : 0,
                  overflow: 'hidden',
                  visibility: spreadPages.rightVisible ? 'visible' : 'hidden',
                  pointerEvents: spreadPages.rightVisible && currentSpread < maxSpread ? 'auto' : 'none',
                  borderLeft: undefined,
                  boxShadow: isRestingCover
                    ? (isDark ? 'inset 5px 0 0 #050811, 0 25px 60px rgba(0,0,0,0.85), 5px 0 0 #1e293b, 10px 0 0 #0f172a' : 'inset 5px 0 0 #cbd5e1, 0 20px 50px rgba(15,23,42,0.18), 5px 0 0 #cbd5e1, 10px 0 0 #e2e8f0')
                    : (isDark ? '0 30px 70px -15px rgba(0,0,0,0.95)' : '0 24px 60px -15px rgba(15,23,42,0.22)'),
                  transform: 'translateZ(0px)',
                  transition: 'border-radius 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              >
                {spreadPages.right > 0 && renderPageContent(spreadPages.right, true)}
              </div>
            </div>
          )}

          {/* ════════════════ 3D CURVED TURNING LEAF ════════════════ */}
          {(isFlipping || isDragging) && animatingPage && (
            <div
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget && !isDragging && commitFlipFinishRef.current) {
                  commitFlipFinishRef.current();
                }
              }}
              className={
                isDragging
                  ? ''
                  : (!isDouble
                    ? (flipDir === 'next' ? 'flipbook-leaf-single-next' : 'flipbook-leaf-single-prev')
                    : (flipDir === 'next' ? 'flipbook-leaf-next-curl' : 'flipbook-leaf-prev-curl'))
              }
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: !isDouble
                  ? 0
                  : (flipDir === 'next' ? '50%' : 0),
                right: !isDouble
                  ? 0
                  : (flipDir === 'next' ? 0 : '50%'),
                width: !isDouble ? '100%' : '50%',
                height: '100%',
                zIndex: 35,
                pointerEvents: 'none',
                transformOrigin: flipDir === 'next' ? 'left center' : 'right center',
                WebkitTransformOrigin: flipDir === 'next' ? 'left center' : 'right center',
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d',
                opacity: singlePageLeafOpacity,
                boxShadow: isDragging ? dragLeafShadow : undefined,
                transform: isDragging
                  ? `translateZ(2px) rotateY(${dragRotateAngle}deg) skewY(${dragCurlSkew}deg)`
                  : undefined,
                transition: isDragging ? 'none' : undefined
              }}
            >
              {/* Front Face of Turning Page */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                borderRadius: flipDir === 'next' ? '0 14px 14px 0' : '14px 0 0 14px',
                overflow: 'hidden'
              }}>
                {renderPageContent(animatingPage.front, flipDir === 'next')}
                {/* Dynamic 3D Paper Curve Lighting Sheen (Gradual fade-in & fade-out) */}
                <div
                  className={!isDragging ? "flipbook-sheen-front" : ""}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: flipDir === 'next'
                      ? 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 14%, rgba(255,255,255,0.20) 28%, rgba(255,255,255,0.06) 44%, transparent 72%)'
                      : 'linear-gradient(to left, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 14%, rgba(255,255,255,0.20) 28%, rgba(255,255,255,0.06) 44%, transparent 72%)',
                    pointerEvents: 'none',
                    opacity: isDragging ? dragSheenFrontOpacity : 0
                  }}
                />
              </div>

              {/* Back Face of Turning Page (Only needed in 2-Sisi spread mode) */}
              {isDouble && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  WebkitTransform: 'rotateY(180deg)',
                  borderRadius: flipDir === 'next' ? '14px 0 0 14px' : '0 14px 14px 0',
                  overflow: 'hidden'
                }}>
                  {renderPageContent(animatingPage.back, flipDir !== 'next')}
                  {/* Dynamic 3D Paper Curve Lighting Sheen (Gradual fade-in & fade-out) */}
                  <div
                    className={!isDragging ? "flipbook-sheen-back" : ""}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: flipDir === 'next'
                        ? 'linear-gradient(to left, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 14%, rgba(255,255,255,0.20) 28%, rgba(255,255,255,0.06) 44%, transparent 72%)'
                        : 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 14%, rgba(255,255,255,0.20) 28%, rgba(255,255,255,0.06) 44%, transparent 72%)',
                      pointerEvents: 'none',
                      opacity: isDragging ? dragSheenBackOpacity : 0
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Minimalist Clean Floating Navigation Dock (Icon-Only, Zero Overlap) ── */}
      <div style={{
        marginTop: 28,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px',
        borderRadius: 100,
        background: isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
        boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
        zIndex: 10,
        flexWrap: 'nowrap',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {/* Mode Switcher: 2 Sisi vs 1 Sisi (Icon-Only) */}
        {(showModeSwitch || isEditable) && !isMobile && (
          <>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderRadius: 100,
              padding: 2,
              gap: 2
            }}>
              <button
                type="button"
                onClick={() => {
                  setViewMode('double');
                  onViewModeChange?.('double');
                  setCurrentSpread(Math.floor(singlePage / 2));
                }}
                title="2 Sisi (Spread)"
                style={{
                  width: 28,
                  height: 26,
                  borderRadius: 100,
                  background: viewMode === 'double' ? accentColor : 'transparent',
                  color: viewMode === 'double' ? '#000' : (isDark ? '#cbd5e1' : '#64748b'),
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <BookOpen size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('single');
                  onViewModeChange?.('single');
                  setSinglePage(currentSpread === 0 ? 1 : currentSpread * 2);
                }}
                title="1 Sisi (Single Page)"
                style={{
                  width: 28,
                  height: 26,
                  borderRadius: 100,
                  background: viewMode === 'single' ? accentColor : 'transparent',
                  color: viewMode === 'single' ? '#000' : (isDark ? '#cbd5e1' : '#64748b'),
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={13} />
              </button>
            </div>

            <div style={{ width: 1, height: 14, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
          </>
        )}

        {/* Prev Arrow Button */}
        <button
          type="button"
          onClick={flipPrev}
          disabled={isFlipping || (isDouble ? currentSpread <= 0 : singlePage <= 1)}
          title="Sebelumnya"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: 'none',
            color: (isDouble ? currentSpread <= 0 : singlePage <= 1) ? '#64748b' : (isDark ? '#ffffff' : '#0f172a'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (isDouble ? currentSpread <= 0 : singlePage <= 1) || isFlipping ? 'not-allowed' : 'pointer',
            opacity: (isDouble ? currentSpread <= 0 : singlePage <= 1) || isFlipping ? 0.35 : 1,
            transition: 'transform 0.15s, opacity 0.15s'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Indicator */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            color: isDark ? '#f8fafc' : '#0f172a',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            padding: '0 2px',
            userSelect: 'none'
          }}>
            {!isDouble ? (
              `${singlePage}`
            ) : currentSpread === 0 ? (
              `1`
            ) : currentSpread === maxSpread ? (
              `${totalPages}`
            ) : (
              `${currentSpread * 2}-${Math.min(totalPages, currentSpread * 2 + 1)}`
            )} <span style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', fontWeight: 600, fontSize: 11.5 }}>/ {totalPages}</span>
          </span>

          {totalPages > 2 && (
            <input
              type="range"
              min={1}
              max={totalPages}
              value={!isDouble ? singlePage : (currentSpread === 0 ? 1 : Math.min(totalPages, currentSpread * 2))}
              onChange={(e) => jumpToPage(Number(e.target.value))}
              title="Geser Halaman"
              style={{
                width: 48,
                height: 4,
                accentColor: accentColor,
                cursor: 'pointer',
                opacity: 0.75,
                borderRadius: 4
              }}
            />
          )}
        </div>

        {/* Next Arrow Button */}
        <button
          type="button"
          onClick={flipNext}
          disabled={isFlipping || (isDouble ? currentSpread >= maxSpread : singlePage >= totalPages)}
          title="Selanjutnya"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: 'none',
            color: (isDouble ? currentSpread >= maxSpread : singlePage >= totalPages) ? '#64748b' : (isDark ? '#ffffff' : '#0f172a'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (isDouble ? currentSpread >= maxSpread : singlePage >= totalPages) || isFlipping ? 'not-allowed' : 'pointer',
            opacity: (isDouble ? currentSpread >= maxSpread : singlePage >= totalPages) || isFlipping ? 0.35 : 1,
            transition: 'transform 0.15s, opacity 0.15s'
          }}
        >
          <ChevronRight size={16} />
        </button>

        <div style={{ width: 1, height: 14, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: soundEnabled ? `${accentColor}25` : 'transparent',
            border: 'none',
            color: soundEnabled ? accentColor : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>

        {/* Download PDF */}
        {allowDownload && (
          <button
            type="button"
            onClick={handleDownload}
            title={pdfUrl ? "Unduh PDF" : "Cetak PDF"}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'transparent',
              border: 'none',
              color: isDark ? '#e2e8f0' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s, color 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? '#e2e8f0' : '#475569'; }}
          >
            <Download size={13} />
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'transparent',
            border: 'none',
            color: isDark ? '#e2e8f0' : '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>
    </div>
  );
};

export default PdfFlipbookViewer;
