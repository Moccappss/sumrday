import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, RotateCw, Maximize2, Minimize2,
  Upload, Sparkles, AlertCircle, RefreshCw, Compass, Check, Layers
} from 'lucide-react';

// Declare custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        'camera-controls'?: boolean | string;
        'auto-rotate'?: boolean | string;
        'auto-rotate-delay'?: number | string;
        'rotation-per-second'?: string;
        'shadow-intensity'?: number | string;
        'shadow-softness'?: number | string;
        'environment-image'?: string;
        exposure?: number | string;
        ar?: boolean | string;
        'ar-modes'?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'interaction' | 'manual';
        'touch-action'?: string;
        'interaction-prompt'?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

interface Model3DViewerProps {
  src?: string;
  poster?: string;
  title?: string;
  height?: number | string;
  isDark?: boolean;
  accentColor?: string;
  allowLocalUpload?: boolean;
  autoRotate?: boolean;
  onModelLoaded?: () => void;
  className?: string;
}

const CDN_SCRIPT_SOURCES = [
  'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js',
  'https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js',
  'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js'
];

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  src: initialSrc = '',
  poster,
  title = '3D Model',
  height = '500px',
  isDark = true,
  accentColor = '#f59e0b',
  allowLocalUpload = true,
  autoRotate: initialAutoRotate = true,
  onModelLoaded,
  className = ''
}) => {
  // Prefer local model if initialSrc is empty or raw github that might be blocked
  const defaultModel = initialSrc || '/models/armchair.glb';
  const [modelSrc, setModelSrc] = useState<string>(defaultModel);
  const [localFileName, setLocalFileName] = useState<string>('');
  const [isScriptReady, setIsScriptReady] = useState<boolean>(() => {
    return typeof window !== 'undefined' && Boolean(window.customElements?.get('model-viewer'));
  });
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(Boolean(defaultModel));
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(initialAutoRotate);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [interactionHintVisible, setInteractionHintVisible] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const modelViewerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const prevInitialSrcRef = useRef<string>(initialSrc);

  // Sync initialSrc changes safely (even if user previously tested a local file)
  useEffect(() => {
    if (prevInitialSrcRef.current !== initialSrc) {
      prevInitialSrcRef.current = initialSrc;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setLocalFileName('');
      const nextSrc = (initialSrc || '').trim() || '/models/armchair.glb';
      setModelSrc(nextSrc);
      setIsLoadingModel(true);
      setLoadProgress(0);
      setLoadError(null);
    }
  }, [initialSrc]);

  // Clean up object URLs on unmount to prevent GPU and RAM memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Multi-CDN Resilient Script Loader with Fallback Chain
  useEffect(() => {
    if (window.customElements && window.customElements.get('model-viewer')) {
      setIsScriptReady(true);
      return;
    }

    let isMounted = true;
    let currentCdnIndex = 0;

    const loadCdnScript = (index: number) => {
      if (index >= CDN_SCRIPT_SOURCES.length) {
        if (isMounted) setLoadError('Gagal memuat engine WebGL 3D dari semua CDN.');
        return;
      }

      const scriptId = 'google-model-viewer-script';
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existing) {
        const handleExistingLoad = () => {
          if (isMounted) setIsScriptReady(true);
        };
        const handleExistingError = () => {
          existing.remove();
          if (isMounted) loadCdnScript(index + 1);
        };
        existing.addEventListener('load', handleExistingLoad, { once: true });
        existing.addEventListener('error', handleExistingError, { once: true });
        window.customElements?.whenDefined('model-viewer').then(() => {
          if (isMounted) setIsScriptReady(true);
        });
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'module';
      script.src = CDN_SCRIPT_SOURCES[index];

      const timeoutId = setTimeout(() => {
        // Fallback to next CDN if takes more than 7 seconds
        if (isMounted && (!window.customElements || !window.customElements.get('model-viewer'))) {
          loadCdnScript(index + 1);
        }
      }, 7000);

      script.onload = () => {
        clearTimeout(timeoutId);
        if (isMounted) setIsScriptReady(true);
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        if (isMounted) loadCdnScript(index + 1);
      };

      document.head.appendChild(script);
    };

    loadCdnScript(currentCdnIndex);

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-hide interaction hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setInteractionHintVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Model-viewer event listeners & WebGL context crash prevention
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    // Enforce 360 camera controls
    viewer.setAttribute('camera-controls', '');
    if (autoRotate) {
      viewer.setAttribute('auto-rotate', '');
    } else {
      viewer.removeAttribute('auto-rotate');
    }

    const handleProgress = (event: any) => {
      const detail = event?.detail?.totalProgress ?? 0;
      setLoadProgress(Math.round(detail * 100));
    };

    const handleLoad = () => {
      setIsLoadingModel(false);
      setLoadError(null);
      setLoadProgress(100);
      onModelLoaded?.();
    };

    const handleError = () => {
      setIsLoadingModel(false);
      setLoadError('Tidak dapat membaca file 3D. Format .glb/.gltf mungkin tidak sesuai atau diblokir.');
    };

    // WebGL Context Lost Prevention & Auto-Restoration
    const handleContextLost = (event: Event) => {
      event.preventDefault(); // Tells browser to try restoring context
      setIsLoadingModel(true);
      setLoadError('Sistem WebGL mereset grafis. Memulihkan model 3D...');
    };

    const handleContextRestored = () => {
      setIsLoadingModel(false);
      setLoadError(null);
      // Reload current model source
      const current = viewer.src;
      viewer.src = '';
      setTimeout(() => {
        if (viewer) viewer.src = current;
      }, 100);
    };

    viewer.addEventListener('progress', handleProgress);
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);
    viewer.addEventListener('webglcontextlost', handleContextLost);
    viewer.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      viewer.removeEventListener('progress', handleProgress);
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
      viewer.removeEventListener('webglcontextlost', handleContextLost);
      viewer.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [isScriptReady, modelSrc, autoRotate, onModelLoaded]);

  // Handle local file picking (100% Client-Side, Revoking old Blob URLs)
  const handleLocalFile = (file: File) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.glb') && !lowerName.endsWith('.gltf')) {
      setLoadError('Format harus .glb atau .gltf. Jika dari SketchUp/Blender, export terlebih dahulu ke GLB.');
      return;
    }

    // Revoke previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;

    setModelSrc(objectUrl);
    setLocalFileName(file.name);
    setIsLoadingModel(true);
    setLoadProgress(0);
    setLoadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!allowLocalUpload) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleLocalFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (allowLocalUpload) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const resetCamera = useCallback(() => {
    if (modelViewerRef.current) {
      try {
        modelViewerRef.current.cameraOrbit = '0deg 75deg 105%';
        modelViewerRef.current.fieldOfView = 'auto';
        if (typeof modelViewerRef.current.resetTurntable === 'function') {
          modelViewerRef.current.resetTurntable();
        }
      } catch (_) { }
    }
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        height: isFullscreen ? '100vh' : height,
        minHeight: isFullscreen ? '100vh' : (typeof height === 'number' ? `${height}px` : height),
        background: isDark
          ? 'radial-gradient(circle at 50% 35%, #181d28 0%, #0d111a 75%, #080a0f 100%)'
          : 'radial-gradient(circle at 50% 35%, #f8fafc 0%, #e2e8f0 80%, #cbd5e1 100%)',
        border: isDragOver
          ? `2px dashed ${accentColor}`
          : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 10px 30px rgba(0,0,0,0.04)',
        userSelect: 'none'
      }}
    >
      {/* Subtle 3D Studio Floor Reflection Effect */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '45%',
          background: isDark
            ? 'radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.06) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.04) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Hidden File Input for Local 3D File */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLocalFile(file);
        }}
      />

      {/* Active Model Viewer: touch-action pan-y ensures smooth mobile page scroll */}
      {isScriptReady && modelSrc && !loadError && (
        <model-viewer
          ref={modelViewerRef}
          src={modelSrc}
          poster={poster}
          alt={title}
          camera-controls=""
          reveal="auto"
          auto-rotate={autoRotate ? "" : undefined}
          auto-rotate-delay="1000"
          rotation-per-second="25deg"
          shadow-intensity="1.2"
          shadow-softness="0.8"
          exposure="1.0"
          touch-action="pan-y"
          interaction-prompt="none"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            outline: 'none',
            cursor: 'grab'
          }}
        />
      )}

      {/* Empty State or Error Fallback Card with Instant 1-Click Demo Recovery */}
      {(!modelSrc || loadError) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: loadError ? '#ef4444' : accentColor,
            boxShadow: `0 8px 24px ${loadError ? '#ef444425' : `${accentColor}25`}`
          }}>
            {loadError ? <AlertCircle size={32} /> : <Box size={32} />}
          </div>

          <h4 style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            color: isDark ? '#ffffff' : '#0f172a'
          }}>
            {loadError ? 'Model 3D Butuh Dipulihkan' : 'Preview 3D Interaktif'}
          </h4>

          <p style={{
            margin: '0 0 18px',
            maxWidth: 380,
            fontSize: 13,
            lineHeight: 1.5,
            color: isDark ? '#94a3b8' : '#64748b'
          }}>
            {loadError ? (
              <span style={{ color: '#ef4444' }}>{loadError}</span>
            ) : (
              'Seret file .glb dari SketchUp/Blender ke sini, atau klik tombol di bawah untuk memilih file lokal.'
            )}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* 1-Click Local Demo Model Recovery */}
            <button
              type="button"
              onClick={() => {
                setModelSrc('/models/armchair.glb');
                setLocalFileName('Armchair Studio (Lokal)');
                setLoadError(null);
                setIsLoadingModel(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 100,
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                color: isDark ? '#ffffff' : '#0f172a',
                border: '1px solid rgba(255,255,255,0.15)',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>Gunakan Model Demo Lokal</span>
            </button>

            {allowLocalUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  borderRadius: 100,
                  background: accentColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  boxShadow: `0 8px 20px ${accentColor}40`
                }}
              >
                <Upload size={14} />
                <span>Pilih File .glb Sendiri</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay with Real-Time Percentage */}
      {isLoadingModel && modelSrc && !loadError && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: isDark ? 'rgba(10,12,18,0.72)' : 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          zIndex: 20
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderTopColor: accentColor,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: isDark ? '#ffffff' : '#0f172a',
              fontFamily: "'Outfit', sans-serif"
            }}>
              Memuat Model 3D...
            </div>
            {loadProgress > 0 && loadProgress < 100 && (
              <div style={{ fontSize: 11.5, color: accentColor, fontWeight: 700, marginTop: 3 }}>
                {loadProgress}%
              </div>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Mobile-Friendly Gentle Touch Gesture Hint (Disabled for true clean minimal) */}

      {/* Top Left Badge: Flat Icon-Only */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        display: 'flex',
        alignItems: 'center',
        zIndex: 15,
        pointerEvents: 'none'
      }}>
        <div
          title={localFileName || '3D Spatial Model'}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: isDark ? '#141620' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none'
          }}
        >
          <Box size={14} style={{ color: accentColor, flexShrink: 0 }} />
        </div>
      </div>

      {/* Top Right Floating Controls Bar (Flat, Icon-Only, Zero Overlap) */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 15
      }}>
        {modelSrc && !loadError && (
          <>
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Jeda Putar 360°' : 'Putar Otomatis 360°'}
              aria-label="Toggle Auto Rotate"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: autoRotate
                  ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)')
                  : (isDark ? '#141620' : '#ffffff'),
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                color: isDark ? '#ffffff' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <RotateCw size={14} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
            </button>

            <button
              type="button"
              onClick={resetCamera}
              title="Reset Kamera"
              aria-label="Reset Camera"
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: isDark ? '#141620' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                color: isDark ? '#e2e8f0' : '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Compass size={14} />
            </button>
          </>
        )}

        {/* Demo Switcher Icon-Only Button */}
        <button
          type="button"
          onClick={() => {
            const next = modelSrc.includes('armchair') ? '/models/helmet.glb' : '/models/armchair.glb';
            setModelSrc(next);
            setLocalFileName(next.includes('helmet') ? 'Battle Helmet' : 'Armchair');
            setIsLoadingModel(true);
            setLoadError(null);
          }}
          title="Ganti Preset 3D"
          aria-label="Switch 3D Model"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: isDark ? '#141620' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={14} />
        </button>

        {allowLocalUpload && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Pilih File .glb Lokal"
            aria-label="Upload Local 3D File"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: isDark ? '#141620' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              color: isDark ? '#e2e8f0' : '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
          aria-label="Toggle Fullscreen"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: isDark ? '#141620' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            color: isDark ? '#e2e8f0' : '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
};

export default Model3DViewer;
