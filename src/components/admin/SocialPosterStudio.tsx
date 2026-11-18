import React, { useState, useEffect, useRef } from 'react';
import {
  Download, Copy, Share2, Sparkles, Check,
  Layers, RefreshCw, LayoutTemplate, Palette, Globe,
  Upload, Image as ImageIcon, QrCode, ArrowRight,
  Search, Grid, Sliders, Type, Eye, Dices, Loader2,
  Film, Play, Pause
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import {
  renderSocialPosterCanvas,
  exportPosterBlob,
  exportPosterVideo,
  downloadPosterVideo,
  loadImageAsync,
  POSTER_RATIOS,
  SOLID_COLOR_PRESETS,
  GRADIENT_PRESETS,
  CARD_BG_PRESETS,
  PATTERN_LIST,
  POSTER_FONT_PRESETS,
  POSTER_ANIMATION_PRESETS,
  type SocialPosterRatio,
  type CardLayoutTemplate,
  type ImageShape,
  type PosterFontFamily,
  type PosterAnimationType,
  type CardTheme,
  type BgType,
  type BgPattern,
  type SocialCardConfig
} from '../../utils/socialCardPosterEngine';
import {
  SOCIAL_POSTER_100_TEMPLATES,
  TEMPLATE_CATEGORIES,
  SHARED_POSTER_IMAGE,
  SHARED_POSTER_IMAGE_2,
  SHARED_POSTER_IMAGE_3,
  type SocialPosterTemplateDef
} from '../../utils/socialPosterTemplates100';
import { searchUnsplashCurated } from '../../utils/mediaIntegrations';
import { storage } from '../../utils/storage';
import MediaGalleryModal from './MediaGalleryModal';

export interface SocialPosterStudioProps {
  onNavigate?: (page: string) => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

type AutoSourceType = 'manual' | 'product' | 'project' | 'flipbook' | 'page';

// Safe Hex Color Validator to prevent <input type="color"> format errors
const ensureHexColor = (val?: string, fallback: string = '#7c3aed'): string => {
  if (!val) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) return val;
  return fallback;
};

// Curated coordinated aesthetics for the "Dadu" (Acak Desain) generator
const RANDOM_AESTHETICS = [
  { name: 'Minimal Mint', bgType: 'solid' as const, solidColor: '#edf7ee', bgPattern: 'grid' as const, bgPatternColor: 'rgba(0,0,0,0.06)', bgPatternOpacity: 0.9, theme: 'light' as const, cardBg: '#ffffff', cardBorder: 'rgba(0,0,0,0.06)', accentColor: '#10b981', textColor: '#0f172a' },
  { name: 'Cyberpunk Neon', bgType: 'gradient' as const, gradientPreset: 'cyber', bgPattern: 'isometric' as const, bgPatternColor: 'rgba(192,132,252,0.22)', bgPatternOpacity: 1.0, theme: 'darkGlass' as const, cardBg: '#14151f', cardBorder: 'rgba(192,132,252,0.3)', accentColor: '#c084fc', textColor: '#ffffff' },
  { name: 'Tokyo Night', bgType: 'solid' as const, solidColor: '#0A0B0E', bgPattern: 'dots' as const, bgPatternColor: 'rgba(56,189,248,0.2)', bgPatternOpacity: 0.9, theme: 'darkGlass' as const, cardBg: '#111827', cardBorder: 'rgba(56,189,248,0.25)', accentColor: '#38bdf8', textColor: '#ffffff' },
  { name: 'Warm Ceramic', bgType: 'solid' as const, solidColor: '#f5f5f4', bgPattern: 'dots' as const, bgPatternColor: 'rgba(180,83,9,0.1)', bgPatternOpacity: 0.8, theme: 'light' as const, cardBg: '#faf7f2', cardBorder: 'rgba(180,83,9,0.15)', accentColor: '#d97706', textColor: '#1c1917' },
  { name: 'Swiss Editorial', bgType: 'solid' as const, solidColor: '#f8fafc', bgPattern: 'grid' as const, bgPatternColor: 'rgba(0,0,0,0.08)', bgPatternOpacity: 0.8, theme: 'light' as const, cardBg: '#ffffff', cardBorder: '#000000', accentColor: '#000000', textColor: '#000000' },
  { name: 'Ocean Mist', bgType: 'gradient' as const, gradientPreset: 'ocean', bgPattern: 'waves' as const, bgPatternColor: 'rgba(2,132,199,0.16)', bgPatternOpacity: 0.9, theme: 'light' as const, cardBg: '#ffffff', cardBorder: 'rgba(2,132,199,0.15)', accentColor: '#0284c7', textColor: '#0f172a' },
  { name: 'Nordic Sage', bgType: 'solid' as const, solidColor: '#e2ece9', bgPattern: 'triangles' as const, bgPatternColor: 'rgba(5,150,105,0.12)', bgPatternOpacity: 0.85, theme: 'light' as const, cardBg: '#ffffff', cardBorder: 'rgba(5,150,105,0.12)', accentColor: '#059669', textColor: '#064e3b' },
  { name: 'Sunset Aura', bgType: 'gradient' as const, gradientPreset: 'sunset', bgPattern: 'mesh' as const, bgPatternColor: 'rgba(244,63,94,0.18)', bgPatternOpacity: 1.0, theme: 'light' as const, cardBg: '#ffffff', cardBorder: 'rgba(244,63,94,0.12)', accentColor: '#f43f5e', textColor: '#1e1b4b' },
  { name: 'Deep Space', bgType: 'gradient' as const, gradientPreset: 'dark', bgPattern: 'crosses' as const, bgPatternColor: 'rgba(255,255,255,0.12)', bgPatternOpacity: 0.9, theme: 'darkGlass' as const, cardBg: '#1e293b', cardBorder: 'rgba(255,255,255,0.14)', accentColor: '#818cf8', textColor: '#ffffff' },
  { name: 'Velvet Lilac', bgType: 'solid' as const, solidColor: '#faf5ff', bgPattern: 'stripes' as const, bgPatternColor: 'rgba(147,51,234,0.1)', bgPatternOpacity: 0.85, theme: 'light' as const, cardBg: '#ffffff', cardBorder: 'rgba(147,51,234,0.12)', accentColor: '#9333ea', textColor: '#3b0764' },
  { name: 'Amber Gold', bgType: 'solid' as const, solidColor: '#fef3c7', bgPattern: 'grid' as const, bgPatternColor: 'rgba(180,83,9,0.12)', bgPatternOpacity: 0.8, theme: 'light' as const, cardBg: '#ffffff', cardBorder: 'rgba(180,83,9,0.18)', accentColor: '#b45309', textColor: '#78350f' },
  { name: 'Aurora Borealis', bgType: 'gradient' as const, gradientPreset: 'aurora', bgPattern: 'waves' as const, bgPatternColor: 'rgba(16,185,129,0.2)', bgPatternOpacity: 1.0, theme: 'darkGlass' as const, cardBg: '#0f172a', cardBorder: 'rgba(16,185,129,0.3)', accentColor: '#10b981', textColor: '#f8fafc' },
  { name: 'Pastel Dream', bgType: 'gradient' as const, gradientPreset: 'pastel', bgPattern: 'dots' as const, bgPatternColor: 'rgba(99,102,241,0.12)', bgPatternOpacity: 0.8, theme: 'light' as const, cardBg: 'rgba(255,255,255,0.92)', cardBorder: 'rgba(99,102,241,0.15)', accentColor: '#6366f1', textColor: '#1e1b4b' },
  { name: 'Peach Sorbet', bgType: 'gradient' as const, gradientPreset: 'peach', bgPattern: 'crosses' as const, bgPatternColor: 'rgba(249,115,22,0.12)', bgPatternOpacity: 0.85, theme: 'light' as const, cardBg: '#ffffff', cardBorder: 'rgba(249,115,22,0.15)', accentColor: '#ea580c', textColor: '#431407' },
  { name: 'Onyx Monochrome', bgType: 'solid' as const, solidColor: '#000000', bgPattern: 'isometric' as const, bgPatternColor: 'rgba(255,255,255,0.08)', bgPatternOpacity: 0.8, theme: 'darkGlass' as const, cardBg: '#14151f', cardBorder: 'rgba(255,255,255,0.15)', accentColor: '#ffffff', textColor: '#ffffff' }
];

export const SocialPosterStudio: React.FC<SocialPosterStudioProps> = ({
  onNavigate,
  notify,
  isDarkMode = true
}) => {
  // Responsive Mobile Detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configuration State
  const [ratio, setRatio] = useState<SocialPosterRatio>('9:16');
  const [template, setTemplate] = useState<CardLayoutTemplate>('appStack');
  const [theme, setTheme] = useState<CardTheme>('light');
  const [bgType, setBgType] = useState<BgType>('solid');
  const [solidColor, setSolidColor] = useState('#edf7ee');
  const [gradientPreset, setGradientPreset] = useState('mint');
  const [customBgUrl, setCustomBgUrl] = useState('');

  // Background Pattern State (Grid, Dots, Triangles, Waves, Stripes, Isometric, Crosses, Mesh)
  const [bgPattern, setBgPattern] = useState<BgPattern>('grid');
  const [bgPatternColor, setBgPatternColor] = useState('');
  const [bgPatternOpacity, setBgPatternOpacity] = useState(0.85);

  // Custom Styling from Templates & Colors
  const [cardBg, setCardBg] = useState('');
  const [cardBorder, setCardBorder] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [fontFamily, setFontFamily] = useState<PosterFontFamily>('sans');

  // 100 Templates State
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [activeTemplateId, setActiveTemplateId] = useState<string>('t001');

  // Card Content State
  const [title, setTitle] = useState('Recenter');
  const [subtitle, setSubtitle] = useState('Your mental wellness companion');
  const [badge, setBadge] = useState('Active now');
  const [priceOrTag, setPriceOrTag] = useState('Rp 250.000');
  const [linkText, setLinkText] = useState('Get started ↗');
  const [coverUrl, setCoverUrl] = useState(SHARED_POSTER_IMAGE);
  const [coverUrl2, setCoverUrl2] = useState(SHARED_POSTER_IMAGE_2);
  const [coverUrl3, setCoverUrl3] = useState(SHARED_POSTER_IMAGE_3);
  const [imageShape, setImageShape] = useState<ImageShape>('auto');
  const [activePhotoSlot, setActivePhotoSlot] = useState<1 | 2 | 3>(1);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrUrl, setQrUrl] = useState('https://sumr.day');

  // Animation & Video Export State
  const [animationType, setAnimationType] = useState<PosterAnimationType>('none');
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(false);
  const [animDuration, setAnimDuration] = useState<number>(15);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  // Source Auto-Generate State
  const [sourceType, setSourceType] = useState<AutoSourceType>('manual');
  const [sourceItems, setSourceItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // UI state: 3 streamlined modes: 'template' (100 Desain), 'desain' (Desain & Sumber), 'konten' (Teks & Konten)
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRenderingCanvas, setIsRenderingCanvas] = useState(false);
  const [activeTab, setActiveTab] = useState<'template' | 'desain' | 'konten'>('template');
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'cover' | 'bg'>('cover');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preload shared poster images immediately on mount for zero-latency instant rendering
  useEffect(() => {
    loadImageAsync(SHARED_POSTER_IMAGE);
    loadImageAsync(SHARED_POSTER_IMAGE_2);
    loadImageAsync(SHARED_POSTER_IMAGE_3);
  }, []);

  // Load items from local storage whenever sourceType changes
  useEffect(() => {
    const loadItems = async () => {
      let items: any[] = [];
      try {
        if (sourceType === 'product') {
          const catalog = await storage.getItem('porto_catalog_products', []);
          const fallback = await storage.getItem('porto_catalog', []);
          items = Array.isArray(catalog) && catalog.length > 0 ? catalog : (Array.isArray(fallback) ? fallback : []);
        } else if (sourceType === 'project') {
          const prj = await storage.getItem('porto_projects', []);
          const fallback = await storage.getItem('porto_portfolio', []);
          items = Array.isArray(prj) && prj.length > 0 ? prj : (Array.isArray(fallback) ? fallback : []);
        } else if (sourceType === 'flipbook') {
          const fbooks = await storage.getItem('porto_client_flipbooks', []);
          items = Array.isArray(fbooks) ? fbooks : [];
        } else if (sourceType === 'page') {
          const pages = await storage.getItem('porto_pages', []);
          items = Array.isArray(pages) ? pages : [];
        }
      } catch (err) {
        console.warn('Error loading source items:', err);
      }
      setSourceItems(items);
    };
    loadItems();
  }, [sourceType]);

  // Populate data when selecting an item
  const handleSelectSourceItem = (id: string) => {
    setSelectedItemId(id);
    const item = sourceItems.find(i => String(i.id || i.slug || i.title) === id);
    if (!item) return;

    soundEffects.play('pop');
    if (sourceType === 'product') {
      setTitle(item.title || item.name || 'Produk');
      setSubtitle(item.category || item.description?.slice(0, 50) || 'Koleksi Eksklusif');
      const p = item.price ? (typeof item.price === 'number' ? `Rp ${item.price.toLocaleString('id-ID')}` : String(item.price)) : 'Rp 150.000';
      setPriceOrTag(p);
      setBadge('Tersedia');
      setLinkText('Beli Sekarang ↗');
      if (item.image || item.thumbnail || item.images?.[0]) {
        setCoverUrl(item.image || item.thumbnail || item.images[0]);
      }
      setQrUrl(item.slug ? `https://sumr.day/p/${item.slug}` : 'https://sumr.day');
    } else if (sourceType === 'project') {
      setTitle(item.title || item.clientName || 'Portofolio');
      setSubtitle(item.category || item.services?.join(', ') || 'Karya Unggulan');
      setPriceOrTag(item.year || '2026');
      setBadge('Featured');
      setLinkText('Lihat Karya ↗');
      if (item.cover || item.image || item.gallery?.[0]) {
        setCoverUrl(item.cover || item.image || item.gallery[0]);
      }
      setQrUrl(item.slug ? `https://sumr.day/works/${item.slug}` : 'https://sumr.day');
    } else if (sourceType === 'flipbook') {
      setTitle(item.title || 'Katalog Interaktif');
      setSubtitle(item.subtitle || 'Flipbook 3D Page Turn');
      setPriceOrTag('Online');
      setBadge('Flipbook');
      setLinkText('Buka Buku ↗');
      if (item.coverUrl || item.pages?.[0]?.imageUrl) {
        setCoverUrl(item.coverUrl || item.pages[0].imageUrl);
      }
      setQrUrl(item.slug ? `https://sumr.day/book/${item.slug}` : 'https://sumr.day');
    } else if (sourceType === 'page') {
      setTitle(item.title || item.name || 'Halaman Web');
      setSubtitle(item.slug ? `sumr.day/${item.slug}` : 'Eksplorasi Halaman');
      setPriceOrTag('Web Live');
      setBadge('Live');
      setLinkText('Kunjungi ↗');
      if (item.heroImage || item.cover) {
        setCoverUrl(item.heroImage || item.cover);
      }
      setQrUrl(item.slug ? `https://sumr.day/${item.slug}` : 'https://sumr.day');
    }
  };

  // Render Canvas when configuration changes
  useEffect(() => {
    if (canvasRef.current) {
      setIsRenderingCanvas(true);
      const config: SocialCardConfig = {
        ratio,
        template,
        theme,
        bgType,
        solidColor,
        gradientPreset,
        customBgUrl,
        bgPattern,
        bgPatternColor: bgPatternColor || undefined,
        bgPatternOpacity,
        cardBg: cardBg || undefined,
        cardBorder: cardBorder || undefined,
        accentColor: accentColor || undefined,
        textColor: textColor || undefined,
        fontFamily,
        title,
        subtitle,
        badge,
        coverUrl,
        coverUrl2,
        coverUrl3,
        imageShape,
        priceOrTag,
        linkText,
        showQrCode,
        qrUrl
      };
      renderSocialPosterCanvas(canvasRef.current, config)
        .catch((err) => {
          console.error('[SocialPosterStudio] Render error:', err);
        })
        .finally(() => {
          setIsRenderingCanvas(false);
        });
    }
  }, [
    ratio, template, theme, bgType, solidColor,
    gradientPreset, customBgUrl, bgPattern, bgPatternColor, bgPatternOpacity,
    cardBg, cardBorder, accentColor, textColor, fontFamily,
    title, subtitle, badge, coverUrl, coverUrl2, coverUrl3, imageShape, priceOrTag, linkText, showQrCode, qrUrl,
    mobileView, isMobile
  ]);

  // Live Animation Loop (requestAnimationFrame)
  useEffect(() => {
    if (!isPlayingAnim || animationType === 'none' || !canvasRef.current || isExportingVideo) return;

    let animId: number;
    const start = performance.now();
    const durationMs = animDuration * 1000;

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = (elapsed % durationMs) / durationMs;

      if (canvasRef.current) {
        const config: SocialCardConfig = {
          ratio,
          template,
          theme,
          bgType,
          solidColor,
          gradientPreset,
          customBgUrl,
          bgPattern,
          bgPatternColor: bgPatternColor || undefined,
          bgPatternOpacity,
          cardBg: cardBg || undefined,
          cardBorder: cardBorder || undefined,
          accentColor: accentColor || undefined,
          textColor: textColor || undefined,
          fontFamily,
          animation: {
            type: animationType,
            progress
          },
          title,
          subtitle,
          badge,
          coverUrl,
          coverUrl2,
          coverUrl3,
          imageShape,
          priceOrTag,
          linkText,
          showQrCode,
          qrUrl
        };
        renderSocialPosterCanvas(canvasRef.current, config);
      }
      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animId);
      if (canvasRef.current) {
        const staticConfig: SocialCardConfig = {
          ratio,
          template,
          theme,
          bgType,
          solidColor,
          gradientPreset,
          customBgUrl,
          bgPattern,
          bgPatternColor: bgPatternColor || undefined,
          bgPatternOpacity,
          cardBg: cardBg || undefined,
          cardBorder: cardBorder || undefined,
          accentColor: accentColor || undefined,
          textColor: textColor || undefined,
          fontFamily,
          title,
          subtitle,
          badge,
          coverUrl,
          coverUrl2,
          coverUrl3,
          imageShape,
          priceOrTag,
          linkText,
          showQrCode,
          qrUrl
        };
        renderSocialPosterCanvas(canvasRef.current, staticConfig);
      }
    };
  }, [
    isPlayingAnim, animationType, animDuration, isExportingVideo,
    ratio, template, theme, bgType, solidColor,
    gradientPreset, customBgUrl, bgPattern, bgPatternColor, bgPatternOpacity,
    cardBg, cardBorder, accentColor, textColor, fontFamily,
    title, subtitle, badge, coverUrl, coverUrl2, coverUrl3, imageShape, priceOrTag, linkText, showQrCode, qrUrl
  ]);

  // Video MP4 Export Handler
  const handleExportVideo = async () => {
    if (!canvasRef.current || isExportingVideo) return;
    soundEffects.play('pop');

    setIsPlayingAnim(false);
    setIsExportingVideo(true);
    setVideoProgress(0);

    const activeAnim = animationType === 'none' ? 'float' : animationType;

    const config: SocialCardConfig = {
      ratio,
      template,
      theme,
      bgType,
      solidColor,
      gradientPreset,
      customBgUrl,
      bgPattern,
      bgPatternColor: bgPatternColor || undefined,
      bgPatternOpacity,
      cardBg: cardBg || undefined,
      cardBorder: cardBorder || undefined,
      accentColor: accentColor || undefined,
      textColor: textColor || undefined,
      fontFamily,
      animation: {
        type: activeAnim,
        progress: 0
      },
      title,
      subtitle,
      badge,
      coverUrl,
      coverUrl2,
      coverUrl3,
      imageShape,
      priceOrTag,
      linkText,
      showQrCode,
      qrUrl
    };

    try {
      const filename = await downloadPosterVideo(canvasRef.current, config, {
        durationSeconds: animDuration,
        fps: 30,
        onProgress: (p) => setVideoProgress(p)
      });
      soundEffects.play('cash');
      notify?.(`Video MP4 berhasil diunduh (${filename})`, 'success');
    } catch (err: any) {
      console.error('Video export error:', err);
      notify?.(err?.message || 'Gagal mengekspor video MP4', 'error');
    } finally {
      setIsExportingVideo(false);
      setVideoProgress(0);
    }
  };

  // "Dadu" (Acak Desain) - Randomizes coordinated palette & patterns instantly
  const handleRandomizeDesign = () => {
    soundEffects.play('pop');
    const pick = RANDOM_AESTHETICS[Math.floor(Math.random() * RANDOM_AESTHETICS.length)];
    const fontPresets: PosterFontFamily[] = ['sans', 'display', 'serif', 'grotesk', 'mono'];
    const randomFont = fontPresets[Math.floor(Math.random() * fontPresets.length)];
    setBgType(pick.bgType);
    if (pick.solidColor) setSolidColor(pick.solidColor);
    if (pick.gradientPreset) setGradientPreset(pick.gradientPreset);
    setBgPattern(pick.bgPattern);
    setBgPatternColor(pick.bgPatternColor || '');
    setBgPatternOpacity(pick.bgPatternOpacity ?? 0.85);
    setTheme(pick.theme);
    setCardBg(pick.cardBg || '');
    setCardBorder(pick.cardBorder || '');
    setAccentColor(pick.accentColor || '');
    setTextColor(pick.textColor || '');
    setFontFamily(randomFont);
    notify?.(`Kombinasi ${pick.name} diterapkan`, 'info');
  };

  // Apply template from 100 catalog
  const handleApplyTemplate = (tmpl: SocialPosterTemplateDef) => {
    soundEffects.play('pop');
    setActiveTemplateId(tmpl.id);
    setTemplate(tmpl.layout);
    setTheme(tmpl.theme);
    setBgType(tmpl.bgType);
    setSolidColor(tmpl.solidColor);
    setGradientPreset(tmpl.gradientPreset);
    setCardBg(tmpl.cardBg || '');
    setCardBorder(tmpl.cardBorder || '');
    setAccentColor(tmpl.accentColor || '');
    setTextColor(tmpl.textColor || '');
    if (tmpl.fontFamily) {
      setFontFamily(tmpl.fontFamily);
    }
    setTitle(tmpl.title);
    setSubtitle(tmpl.subtitle);
    setBadge(tmpl.badge);
    setPriceOrTag(tmpl.priceOrTag);
    setLinkText(tmpl.linkText);
    // Auto-apply curated animation & play live preview
    if (tmpl.animation) {
      setAnimationType(tmpl.animation);
      setIsPlayingAnim(true);
    }
    if (tmpl.animDuration) {
      setAnimDuration(tmpl.animDuration);
    }
    // User requirement: 1 shared image across templates for instant zero-latency rendering
    if (!coverUrl) {
      setCoverUrl(SHARED_POSTER_IMAGE);
    }
    notify?.(`Template ${tmpl.name} diterapkan`, 'info');
  };

  // Filter 100 templates
  const filteredTemplates = SOCIAL_POSTER_100_TEMPLATES.filter(tmpl => {
    const matchesCategory = selectedCategory === 'Semua' || tmpl.category === selectedCategory;
    const matchesSearch = !templateSearchQuery ||
      tmpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tmpl.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      tmpl.category.toLowerCase().includes(templateSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Actions
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    soundEffects.play('pop');
    const blob = await exportPosterBlob(canvasRef.current);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poster_${ratio.replace(':', 'x')}_${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.play('success');
    notify?.('Poster berhasil diunduh!', 'success');
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    soundEffects.play('pop');
    setIsProcessing(true);
    try {
      const blob = await exportPosterBlob(canvasRef.current);
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setIsCopied(true);
        soundEffects.play('success');
        notify?.('Poster disalin ke clipboard!', 'success');
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    soundEffects.play('pop');
    setIsProcessing(true);
    try {
      const blob = await exportPosterBlob(canvasRef.current);
      if (blob && navigator.share) {
        const file = new File([blob], `poster_${Date.now()}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            text: subtitle,
            files: [file]
          });
          soundEffects.play('success');
        } else {
          await navigator.share({ title, text: `${title} - ${subtitle}` });
        }
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Native share error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickUnsplash = async (keyword: string) => {
    soundEffects.play('pop');
    const photos = await searchUnsplashCurated(keyword);
    if (photos && photos.length > 0) {
      const random = photos[Math.floor(Math.random() * photos.length)];
      if (template === 'trioCollage' || template === 'bentoTrio') {
        if (activePhotoSlot === 2) setCoverUrl2(random.url);
        else if (activePhotoSlot === 3) setCoverUrl3(random.url);
        else setCoverUrl(random.url);
      } else {
        setCoverUrl(random.url);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        soundEffects.play('pop');
        if (template === 'trioCollage' || template === 'bentoTrio') {
          if (activePhotoSlot === 2) setCoverUrl2(reader.result);
          else if (activePhotoSlot === 3) setCoverUrl3(reader.result);
          else setCoverUrl(reader.result);
        } else {
          setCoverUrl(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="cms-fullbleed-root social-poster-root" style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      height: '100%',
      width: '100%',
      background: 'var(--cms-card-bg, #11121a)',
      borderRadius: isMobile ? 0 : 20,
      border: isMobile ? 'none' : '1px solid var(--cms-border, rgba(255,255,255,0.08))',
      overflow: 'hidden'
    }}>
      <style>{`
        .social-poster-noscroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .social-poster-noscroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
      {/* ── TOP HEADER (RESPONSIVE FOR MOBILE & DESKTOP) ── */}
      <div style={{
        height: isMobile ? 48 : 60,
        padding: isMobile ? '0 10px' : '0 20px',
        borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 8 : 0,
        background: 'var(--cms-panel-bg, #161724)',
        flexShrink: 0,
        position: 'relative'
      }}>
        {/* Left: Desktop Title OR Mobile Editor/Preview Toggle */}
        {!isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--cms-accent, #7c3aed)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LayoutTemplate size={18} />
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cms-text, #ffffff)' }}>
                Poster Promosi
              </div>
              <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>
                100 Desain Story, Feed & QR Siap Pakai
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-canvas, rgba(0,0,0,0.35))',
            borderRadius: 9999,
            padding: 2,
            border: '1px solid var(--cms-border, rgba(255,255,255,0.1))'
          }}>
            <button
              type="button"
              onClick={() => {
                soundEffects.play('pop');
                setMobileView('editor');
              }}
              title="Edit Desain"
              style={{
                width: 32,
                height: 28,
                borderRadius: 9999,
                border: 'none',
                background: mobileView === 'editor' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                color: mobileView === 'editor' ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sliders size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.play('pop');
                setMobileView('preview');
              }}
              title="Lihat Pratinjau"
              style={{
                width: 32,
                height: 28,
                borderRadius: 9999,
                border: 'none',
                background: mobileView === 'preview' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                color: mobileView === 'preview' ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Eye size={14} />
            </button>
          </div>
        )}

        {/* Center: Ratio Tabs (shared single bar for Desktop & Mobile) */}
        <div style={isMobile ? {
          flex: 1,
          maxWidth: 196,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-canvas, rgba(0,0,0,0.3))',
          borderRadius: 9999,
          padding: 2,
          border: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
        } : {
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-canvas, rgba(0,0,0,0.3))',
          borderRadius: 9999,
          padding: 3,
          border: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
        }}>
          {(['9:16', '4:5', '1:1'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                soundEffects.play('pop');
                setRatio(tab);
              }}
              style={{
                flex: isMobile ? 1 : 'unset',
                height: isMobile ? 28 : 30,
                padding: isMobile ? '0 8px' : '0 14px',
                borderRadius: 9999,
                border: 'none',
                background: ratio === tab ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                color: ratio === tab ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                fontSize: isMobile ? 11 : 12,
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {isMobile ? tab : POSTER_RATIOS[tab].label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
          <button
            type="button"
            onClick={handleRandomizeDesign}
            title="Acak Desain"
            style={{
              height: isMobile ? 32 : 34,
              padding: isMobile ? '0 10px' : '0 12px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--cms-accent, #7c3aed)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Dices size={15} />
            {!isMobile && <span>Acak</span>}
          </button>

          {!isMobile && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                disabled={isProcessing}
                title="Salin"
                style={{
                  height: 34,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                  background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                  color: isCopied ? '#10b981' : 'var(--cms-text, #0f172a)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                <span>Salin</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={isProcessing}
                title="Bagikan"
                style={{
                  height: 34,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                  background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                  color: 'var(--cms-text, #0f172a)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Share2 size={14} />
                <span>Bagikan</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                title="Unduh PNG"
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--cms-accent, #7c3aed)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Download size={14} />
                <span>Unduh</span>
              </button>

              <button
                type="button"
                onClick={handleExportVideo}
                disabled={isExportingVideo}
                title="Ekspor Video MP4"
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: isExportingVideo ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {isExportingVideo ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
                <span>Video MP4</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── STUDIO WORKSPACE ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* LEFT CONTROLS (Permanently mounted; toggled via CSS display) */}
        <div style={{
          width: isMobile ? '100%' : 380,
          borderRight: isMobile ? 'none' : '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          display: (isMobile && mobileView !== 'editor') ? 'none' : 'flex',
          flexDirection: 'column',
          background: 'var(--cms-panel-bg, #141520)',
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Sub-tabs: 3 Concise Tabs */}
          <div style={{
            display: 'flex',
            padding: isMobile ? '6px 12px' : '8px 16px',
            borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
            gap: 6,
            flexShrink: 0
          }}>
            {([
              { key: 'template', label: 'Template', count: '100' },
              { key: 'desain', label: 'Desain', count: null },
              { key: 'konten', label: 'Konten', count: null }
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  soundEffects.play('pop');
                  setActiveTab(tab.key);
                }}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: activeTab === tab.key ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                  color: activeTab === tab.key ? '#ffffff' : 'var(--cms-text-muted, #94a3b8)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <span>{tab.label}</span>
                {tab.count && (
                  <span style={{
                    fontSize: 9.5,
                    padding: '1px 5px',
                    borderRadius: 9999,
                    background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color: '#ffffff'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sub-tab Contents */}
          <div
            className="social-poster-noscroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              padding: isMobile ? '12px 12px 104px' : 16
            }}
          >
            {/* ── TAB 0: 100 TEMPLATES CATALOG ── */}
            {activeTab === 'template' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Search Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                  border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                  borderRadius: 10,
                  padding: '0 12px',
                  height: 38
                }}>
                  <Search size={14} style={{ color: 'var(--cms-text-muted, #64748b)' }} />
                  <input
                    className="no-focus-ring"
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="Cari template..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12,
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                  {templateSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTemplateSearchQuery('')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--cms-text-muted, #64748b)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      Batal
                    </button>
                  )}
                </div>

                {/* Category Pills Filter */}
                <div
                  className="social-poster-noscroll"
                  style={{
                    display: 'flex',
                    gap: 6,
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-x',
                    width: '100%',
                    minWidth: 0,
                    paddingBottom: 2,
                    scrollbarWidth: 'none'
                  }}
                >
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        soundEffects.play('pop');
                        setSelectedCategory(cat);
                      }}
                      style={{
                        height: 28,
                        padding: '0 12px',
                        borderRadius: 9999,
                        border: selectedCategory === cat ? 'none' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                        background: selectedCategory === cat ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                        color: selectedCategory === cat ? '#ffffff' : 'var(--cms-text, #0f172a)',
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Template Grid (100 items) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {filteredTemplates.map(tmpl => {
                    const isSelected = activeTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleApplyTemplate(tmpl)}
                        style={{
                          borderRadius: 12,
                          border: isSelected ? '2px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                          background: isSelected ? 'rgba(124,58,237,0.12)' : 'var(--surface-canvas, rgba(0,0,0,0.25))',
                          padding: 10,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          position: 'relative',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Mini Visual Preview Mockup */}
                        <div style={{
                          height: 80,
                          borderRadius: 8,
                          background: tmpl.bgType === 'gradient'
                            ? `linear-gradient(135deg, ${GRADIENT_PRESETS[tmpl.gradientPreset]?.[0] || '#d1fae5'}, ${GRADIENT_PRESETS[tmpl.gradientPreset]?.[1] || '#a7f3d0'})`
                            : (tmpl.solidColor || '#edf7ee'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 6,
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {/* Mini Card Representation based on exact template layout */}
                          <div style={{
                            width: '84%',
                            height: '90%',
                            borderRadius: 8,
                            background: tmpl.cardBg || (tmpl.theme === 'light' ? '#ffffff' : '#14151f'),
                            border: tmpl.cardBorder ? `1px solid ${tmpl.cardBorder}` : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 4,
                            gap: 3,
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            {tmpl.layout === 'headerTop' ? (
                              <>
                                {/* Header Top layout: Title & Chips at top, image at bottom */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ height: 4, width: '48%', borderRadius: 2, background: tmpl.textColor || (tmpl.theme === 'light' ? '#0f172a' : '#ffffff') }} />
                                  <div style={{ height: 3, width: '24%', borderRadius: 9999, background: tmpl.accentColor || '#10b981' }} />
                                </div>
                                <div style={{ height: 3, width: '38%', borderRadius: 2, background: tmpl.theme === 'light' ? '#94a3b8' : '#64748b' }} />
                                <div style={{
                                  flex: 1,
                                  width: '100%',
                                  borderRadius: 4,
                                  background: '#334155',
                                  backgroundImage: `url(${tmpl.coverUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  marginTop: 2
                                }} />
                              </>
                            ) : tmpl.layout === 'dualIdentity' ? (
                              <>
                                {/* Dual Identity: Top photo with notch, bottom avatar stack */}
                                <div style={{
                                  height: '52%',
                                  width: '100%',
                                  borderRadius: '4px 4px 0 0',
                                  background: '#334155',
                                  backgroundImage: `url(${tmpl.coverUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                                }} />
                                <div style={{ height: 3, width: '58%', borderRadius: 2, background: tmpl.textColor || (tmpl.theme === 'light' ? '#0f172a' : '#ffffff'), marginTop: 2 }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                  <div style={{ display: 'flex', gap: 2 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: 9999, background: '#cbd5e1' }} />
                                    <div style={{ width: 6, height: 6, borderRadius: 9999, background: '#94a3b8' }} />
                                  </div>
                                  <div style={{ height: 4, width: 14, borderRadius: 2, background: tmpl.accentColor || '#3b82f6' }} />
                                </div>
                              </>
                            ) : tmpl.layout === 'scenicShowcase' ? (
                              <>
                                {/* Showcase: Top photo with category tags, bottom price & button */}
                                <div style={{
                                  height: '50%',
                                  width: '100%',
                                  borderRadius: 4,
                                  background: '#334155',
                                  backgroundImage: `url(${tmpl.coverUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  position: 'relative',
                                  padding: 2
                                }}>
                                  <div style={{ width: 14, height: 3, borderRadius: 9999, background: 'rgba(255,255,255,0.85)' }} />
                                </div>
                                <div style={{ height: 4, width: '65%', borderRadius: 2, background: tmpl.textColor || (tmpl.theme === 'light' ? '#0f172a' : '#ffffff') }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                  <div style={{ height: 3, width: '32%', borderRadius: 2, background: tmpl.theme === 'light' ? '#64748b' : '#94a3b8' }} />
                                  <div style={{ height: 5, width: 16, borderRadius: 9999, background: tmpl.accentColor || '#000000' }} />
                                </div>
                              </>
                            ) : tmpl.layout === 'trioCollage' ? (
                              <>
                                {/* Trio Collage: Left portrait + 2 stacked square photos */}
                                <div style={{ height: '52%', width: '100%', display: 'flex', gap: 2 }}>
                                  <div style={{ flex: 1.4, borderRadius: 3, background: '#334155', backgroundImage: `url(${tmpl.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ flex: 1, borderRadius: 2, background: '#475569', backgroundImage: `url(${tmpl.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                    <div style={{ flex: 1, borderRadius: 2, background: '#64748b', backgroundImage: `url(${tmpl.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                  </div>
                                </div>
                                <div style={{ height: 4, width: '60%', borderRadius: 2, background: tmpl.textColor || (tmpl.theme === 'light' ? '#0f172a' : '#ffffff') }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                  <div style={{ height: 3, width: '36%', borderRadius: 2, background: tmpl.theme === 'light' ? '#94a3b8' : '#64748b' }} />
                                  <div style={{ height: 5, width: 16, borderRadius: 9999, background: tmpl.accentColor || '#000000' }} />
                                </div>
                              </>
                            ) : tmpl.layout === 'bentoTrio' ? (
                              <>
                                {/* Bento 3: Top landscape hero + 2 bottom side-by-side square photos */}
                                <div style={{ height: '52%', width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <div style={{ flex: 1.2, borderRadius: 2, background: '#334155', backgroundImage: `url(${tmpl.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                  <div style={{ flex: 1, display: 'flex', gap: 2 }}>
                                    <div style={{ flex: 1, borderRadius: 2, background: '#475569', backgroundImage: `url(${tmpl.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                    <div style={{ flex: 1, borderRadius: 2, background: '#64748b', backgroundImage: `url(${tmpl.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                  </div>
                                </div>
                                <div style={{ height: 4, width: '60%', borderRadius: 2, background: tmpl.textColor || (tmpl.theme === 'light' ? '#0f172a' : '#ffffff') }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                  <div style={{ height: 3, width: '36%', borderRadius: 2, background: tmpl.theme === 'light' ? '#94a3b8' : '#64748b' }} />
                                  <div style={{ height: 5, width: 16, borderRadius: 9999, background: tmpl.accentColor || '#000000' }} />
                                </div>
                              </>
                            ) : (
                              <>
                                {/* AppStack: Modern Card with top image, title and pill button */}
                                <div style={{
                                  height: '52%',
                                  width: '100%',
                                  borderRadius: 4,
                                  background: '#334155',
                                  backgroundImage: `url(${tmpl.coverUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  position: 'relative',
                                  padding: 2
                                }}>
                                  <div style={{ width: 5, height: 5, borderRadius: 9999, background: tmpl.accentColor || '#10b981' }} />
                                </div>
                                <div style={{ height: 4, width: '60%', borderRadius: 2, background: tmpl.textColor || (tmpl.theme === 'light' ? '#0f172a' : '#ffffff') }} />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                  <div style={{ height: 3, width: '40%', borderRadius: 2, background: tmpl.theme === 'light' ? '#94a3b8' : '#64748b' }} />
                                  <div style={{ height: 5, width: 16, borderRadius: 9999, background: tmpl.accentColor || '#000000' }} />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Selected Check Pill */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 20,
                              height: 20,
                              borderRadius: 9999,
                              background: 'var(--cms-accent, #7c3aed)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                            }}>
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div>
                          <div style={{
                            fontSize: 12,
                            fontWeight: 750,
                            color: isSelected ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text, #0f172a)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {tmpl.name}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 3
                          }}>
                            <span style={{ fontSize: 10, color: 'var(--cms-text-muted, #64748b)' }}>
                              {tmpl.category}
                            </span>
                            <span style={{
                              fontSize: 9,
                              fontWeight: 750,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: isSelected ? 'var(--cms-accent, #7c3aed)' : 'rgba(124,58,237,0.12)',
                              color: isSelected ? '#ffffff' : 'var(--cms-accent, #7c3aed)'
                            }}>
                              {POSTER_ANIMATION_PRESETS.find(a => a.id === tmpl.animation)?.label || tmpl.previewBadge}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* ── TAB 1: DESAIN & SUMBER (HIGH-CONTRAST & CONCISE 1-2 WORD LABELS) ── */}
            {activeTab === 'desain' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1-Row Dadu Button: Acak Desain */}
                <button
                  type="button"
                  onClick={handleRandomizeDesign}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--cms-accent, #7c3aed)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                  }}
                >
                  <Dices size={16} />
                  <span>Acak Desain</span>
                </button>

                {/* 1. Gaya Kartu */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Gaya Kartu
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                    {([
                      { key: 'appStack', label: 'Modern' },
                      { key: 'scenicShowcase', label: 'Showcase' },
                      { key: 'headerTop', label: 'Header' },
                      { key: 'dualIdentity', label: 'Identitas' },
                      { key: 'trioCollage', label: 'Trio Mix' },
                      { key: 'bentoTrio', label: 'Bento 3' }
                    ] as const).map(t => {
                      const isAct = template === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setTemplate(t.key);
                          }}
                          style={{
                            height: 36,
                            borderRadius: 9,
                            border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                            background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                            color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Bentuk Foto */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Bentuk Foto
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                    {([
                      { key: 'auto', label: 'Auto' },
                      { key: 'square', label: 'Kotak' },
                      { key: 'portrait', label: 'Potret' }
                    ] as const).map(s => {
                      const isAct = imageShape === s.key;
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setImageShape(s.key);
                          }}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                            background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                            color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Gaya Font */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Gaya Font
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12 }}>
                    {POSTER_FONT_PRESETS.map(f => {
                      const isAct = fontFamily === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setFontFamily(f.id);
                          }}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                            background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                            color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Animasi */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Animasi
                    </span>
                    {animationType !== 'none' && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.play('pop');
                          setIsPlayingAnim(!isPlayingAnim);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                          background: isPlayingAnim ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                          color: isPlayingAnim ? '#ffffff' : 'var(--cms-text, #0f172a)',
                          fontSize: 10,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >
                        {isPlayingAnim ? <Pause size={10} /> : <Play size={10} />}
                        <span>{isPlayingAnim ? 'Jeda' : 'Putar'}</span>
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: animationType !== 'none' ? 8 : 12 }}>
                    {POSTER_ANIMATION_PRESETS.map(a => {
                      const isAct = animationType === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setAnimationType(a.id);
                            if (a.id !== 'none') {
                              setIsPlayingAnim(true);
                            } else {
                              setIsPlayingAnim(false);
                            }
                          }}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                            background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                            color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                  {animationType !== 'none' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'var(--surface-canvas, rgba(0,0,0,0.03))', border: '1px solid var(--cms-border, rgba(0,0,0,0.08))', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Durasi Video</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {([5, 15, 30] as const).map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              soundEffects.play('pop');
                              setAnimDuration(d);
                            }}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: animDuration === d ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                              background: animDuration === d ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                              color: animDuration === d ? '#ffffff' : 'var(--cms-text, #0f172a)',
                              fontSize: 10,
                              fontWeight: 750,
                              cursor: 'pointer'
                            }}
                          >
                            {d} Detik
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Tarik Data
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                    {([
                      { key: 'product', label: 'Produk' },
                      { key: 'project', label: 'Karya' },
                      { key: 'flipbook', label: 'Flipbook' },
                      { key: 'page', label: 'Halaman' }
                    ] as const).map(src => {
                      const isAct = sourceType === src.key;
                      return (
                        <button
                          key={src.key}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setSourceType(src.key);
                          }}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                            background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                            color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {src.label}
                        </button>
                      );
                    })}
                  </div>

                  {sourceType !== 'manual' && (
                    sourceItems.length === 0 ? (
                      <div style={{ padding: 10, borderRadius: 8, background: 'var(--surface-canvas, rgba(0,0,0,0.04))', color: 'var(--cms-text-muted, #64748b)', fontSize: 11, textAlign: 'center' }}>
                        Belum ada item tersedia di modul ini
                      </div>
                    ) : (
                      <select
                        className="no-focus-ring"
                        value={selectedItemId}
                        onChange={(e) => handleSelectSourceItem(e.target.value)}
                        style={{
                          width: '100%',
                          height: 38,
                          borderRadius: 8,
                          background: 'var(--surface-canvas, #ffffff)',
                          border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                          color: 'var(--cms-text, #0f172a)',
                          fontSize: 12,
                          fontWeight: 650,
                          padding: '0 10px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Pilih Konten --</option>
                        {sourceItems.map((item, idx) => (
                          <option key={idx} value={String(item.id || item.slug || item.title)}>
                            {item.title || item.name || item.clientName || `Item #${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    )
                  )}
                </div>

                {/* 3. Pola Latar */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      Pola Latar
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--cms-accent, #7c3aed)' }}>
                      {PATTERN_LIST.find(p => p.id === bgPattern)?.label || 'Polos'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                    {PATTERN_LIST.map(p => {
                      const isAct = bgPattern === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setBgPattern(p.id);
                          }}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                            background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                            color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Pengaturan Warna & Opasitas Pola */}
                  {bgPattern !== 'none' && (
                    <div style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.10))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Warna Pola</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setBgPatternColor('')}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 6,
                              border: !bgPatternColor ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid rgba(0,0,0,0.15)',
                              background: !bgPatternColor ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                              color: !bgPatternColor ? '#ffffff' : 'var(--cms-text, #0f172a)',
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Otomatis
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgPatternColor('rgba(0,0,0,0.08)')}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#000000',
                              border: '1.5px solid rgba(0,0,0,0.2)',
                              cursor: 'pointer'
                            }}
                            title="Hitam Halus"
                          />
                          <button
                            type="button"
                            onClick={() => setBgPatternColor('rgba(255,255,255,0.18)')}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#ffffff',
                              border: '1.5px solid rgba(0,0,0,0.25)',
                              cursor: 'pointer'
                            }}
                            title="Putih Halus"
                          />
                          <input
                            type="color"
                            value={ensureHexColor(bgPatternColor, '#7c3aed')}
                            onChange={(e) => setBgPatternColor(e.target.value)}
                            style={{ width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: 'none', background: 'transparent' }}
                            title="Warna Pola Kustom"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Opasitas Pola</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={bgPatternOpacity}
                          onChange={(e) => setBgPatternOpacity(parseFloat(e.target.value))}
                          style={{ flex: 1, maxWidth: 140, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text, #0f172a)', width: 32, textAlign: 'right' }}>
                          {Math.round(bgPatternOpacity * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Warna Latar */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Warna Latar
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                    {([
                      { key: 'blurred', label: 'Blur' },
                      { key: 'solid', label: 'Warna' },
                      { key: 'gradient', label: 'Gradasi' },
                      { key: 'image', label: 'Foto' }
                    ] as const).map(m => {
                      const isAct = bgType === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setBgType(m.key);
                          }}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                            background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                            color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>

                  {bgType === 'solid' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 8 }}>
                        {SOLID_COLOR_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSolidColor(p.hex)}
                            title={p.label}
                            style={{
                              height: 30,
                              borderRadius: 6,
                              background: p.hex,
                              border: solidColor === p.hex ? '2.5px solid var(--cms-accent, #7c3aed)' : '1px solid rgba(0,0,0,0.15)',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'var(--surface-canvas, rgba(0,0,0,0.04))', border: '1px solid var(--cms-border, rgba(0,0,0,0.10))' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Warna Kustom: {solidColor}</span>
                        <input
                          type="color"
                          value={ensureHexColor(solidColor, '#edf7ee')}
                          onChange={(e) => setSolidColor(e.target.value)}
                          style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'transparent' }}
                        />
                      </div>
                    </div>
                  )}

                  {bgType === 'gradient' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {Object.entries(GRADIENT_PRESETS).map(([key, colors]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setGradientPreset(key)}
                          title={key}
                          style={{
                            height: 34,
                            borderRadius: 8,
                            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                            border: gradientPreset === key ? '2.5px solid var(--cms-accent, #7c3aed)' : '1px solid rgba(0,0,0,0.15)',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {bgType === 'image' && (
                    <input
                      className="no-focus-ring"
                      type="text"
                      placeholder="URL Gambar Latar..."
                      value={customBgUrl}
                      onChange={(e) => setCustomBgUrl(e.target.value)}
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--surface-canvas, #ffffff)',
                        border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                        color: 'var(--cms-text, #0f172a)',
                        fontSize: 12,
                        padding: '0 10px',
                        outline: 'none'
                      }}
                    />
                  )}
                </div>

                {/* 5. Warna Kartu */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Warna Kartu
                  </div>

                  {/* Preset Warna Kartu */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                    {CARD_BG_PRESETS.map((cb, idx) => {
                      const isAct = cardBg === cb.hex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            soundEffects.play('pop');
                            setCardBg(cb.hex);
                            if (cb.hex === '#ffffff' || cb.hex === '#faf7f2' || cb.hex === '#f1f5f9' || cb.hex.includes('255')) {
                              setTheme('light');
                              setTextColor('#0f172a');
                            } else {
                              setTheme('darkGlass');
                              setTextColor('#ffffff');
                            }
                          }}
                          style={{
                            height: 32,
                            borderRadius: 8,
                            border: isAct ? '2.5px solid var(--cms-accent, #7c3aed)' : '1px solid rgba(0,0,0,0.18)',
                            background: cb.hex,
                            color: (cb.hex === '#ffffff' || cb.hex === '#faf7f2' || cb.hex === '#f1f5f9' || cb.hex.includes('255')) ? '#0f172a' : '#ffffff',
                            fontSize: 10.5,
                            fontWeight: 750,
                            cursor: 'pointer',
                            boxShadow: isAct ? '0 2px 8px rgba(124, 58, 237, 0.25)' : 'none'
                          }}
                        >
                          {cb.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Kustom Warna Kartu, Border & Aksen */}
                  <div style={{
                    padding: 10,
                    borderRadius: 10,
                    background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                    border: '1px solid var(--cms-border, rgba(0,0,0,0.10))',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Warna Kartu</span>
                      <input
                        type="color"
                        value={ensureHexColor(cardBg, theme === 'light' ? '#ffffff' : '#14151f')}
                        onChange={(e) => setCardBg(e.target.value)}
                        style={{ width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: 'none', background: 'transparent' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Garis Tepi</span>
                      <input
                        type="color"
                        value={ensureHexColor(cardBorder, '#cbd5e1')}
                        onChange={(e) => setCardBorder(e.target.value)}
                        style={{ width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: 'none', background: 'transparent' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Aksen Tombol</span>
                      <input
                        type="color"
                        value={ensureHexColor(accentColor, '#7c3aed')}
                        onChange={(e) => setAccentColor(e.target.value)}
                        style={{ width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: 'none', background: 'transparent' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>Warna Teks</span>
                      <input
                        type="color"
                        value={ensureHexColor(textColor, theme === 'light' ? '#0f172a' : '#ffffff')}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{ width: 24, height: 24, borderRadius: 4, cursor: 'pointer', border: 'none', background: 'transparent' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Gambar Cover */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
                    Gambar Cover
                  </div>

                  {/* Slot selector when in Trio Mix / Bento 3 (3 Gambar) */}
                  {(template === 'trioCollage' || template === 'bentoTrio') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                      {([
                        { slot: 1, label: 'Foto 1' },
                        { slot: 2, label: 'Foto 2' },
                        { slot: 3, label: 'Foto 3' }
                      ] as const).map(s => {
                        const isAct = activePhotoSlot === s.slot;
                        return (
                          <button
                            key={s.slot}
                            type="button"
                            onClick={() => {
                              soundEffects.play('pop');
                              setActivePhotoSlot(s.slot);
                            }}
                            style={{
                              height: 30,
                              borderRadius: 8,
                              border: isAct ? '1.5px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                              background: isAct ? 'var(--cms-accent, #7c3aed)' : 'var(--surface-canvas, rgba(0,0,0,0.04))',
                              color: isAct ? '#ffffff' : 'var(--cms-text, #0f172a)',
                              fontSize: 11,
                              fontWeight: 750,
                              cursor: 'pointer'
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                        background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                        color: 'var(--cms-text, #0f172a)',
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Upload size={13} />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGalleryTarget('cover');
                        setShowGallery(true);
                      }}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                        background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                        color: 'var(--cms-text, #0f172a)',
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <ImageIcon size={13} />
                      <span>Galeri</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  {/* Quick Unsplash Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {['Minimalist', 'Studio', 'Workspace', 'Nature'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handlePickUnsplash(tag)}
                        style={{
                          height: 26,
                          borderRadius: 6,
                          border: '1px solid var(--cms-border, rgba(0,0,0,0.10))',
                          background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                          color: 'var(--cms-text, #0f172a)',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: TEKS & KONTEN ── */}
            {activeTab === 'konten' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Judul
                  </label>
                  <input
                    className="no-focus-ring"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: '100%',
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12,
                      fontWeight: 650,
                      padding: '0 10px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Subjudul
                  </label>
                  <textarea
                    className="no-focus-ring"
                    rows={2}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12,
                      fontWeight: 650,
                      padding: '8px 10px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                      Badge
                    </label>
                    <input
                      className="no-focus-ring"
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                        border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                        color: 'var(--cms-text, #0f172a)',
                        fontSize: 12,
                        fontWeight: 650,
                        padding: '0 10px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                      Harga
                    </label>
                    <input
                      className="no-focus-ring"
                      type="text"
                      value={priceOrTag}
                      onChange={(e) => setPriceOrTag(e.target.value)}
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                        border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                        color: 'var(--cms-text, #0f172a)',
                        fontSize: 12,
                        fontWeight: 650,
                        padding: '0 10px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Tombol
                  </label>
                  <input
                    className="no-focus-ring"
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    style={{
                      width: '100%',
                      height: 36,
                      borderRadius: 8,
                      background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                      border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                      color: 'var(--cms-text, #0f172a)',
                      fontSize: 12,
                      fontWeight: 650,
                      padding: '0 10px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* QR Code Switch */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                  border: '1px solid var(--cms-border, rgba(0,0,0,0.12))',
                  marginTop: 6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <QrCode size={18} color="var(--cms-accent, #7c3aed)" />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--cms-text, #0f172a)' }}>QR Code</div>
                      <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #64748b)' }}>Aktifkan QR</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                </div>

                {showQrCode && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text, #0f172a)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                      Tautan QR
                    </label>
                    <input
                      className="no-focus-ring"
                      type="text"
                      value={qrUrl}
                      onChange={(e) => setQrUrl(e.target.value)}
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--surface-canvas, rgba(0,0,0,0.04))',
                        border: '1px solid var(--cms-border, rgba(0,0,0,0.15))',
                        color: 'var(--cms-text, #0f172a)',
                        fontSize: 12,
                        fontWeight: 650,
                        padding: '0 10px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PREVIEW WORKSPACE (Permanently mounted; toggled via CSS display) */}
        <div style={{
          flex: 1,
          width: isMobile ? '100%' : 'auto',
          background: 'var(--surface-canvas, rgba(0,0,0,0.35))',
          display: (isMobile && mobileView !== 'preview') ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '10px 12px 92px' : '16px 24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Centered Canvas Container (Maximized Height & Proportions) */}
          <div style={{
            position: 'relative',
            boxShadow: '0 28px 80px rgba(0,0,0,0.65)',
            borderRadius: 24,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: isMobile ? 'calc(100% - 60px)' : 'calc(100% - 16px)',
            maxWidth: 'calc(100% - 16px)',
            flex: isMobile ? 1 : 'unset'
          }}>
            <canvas
              ref={canvasRef}
              style={{
                width: 'auto',
                height: isMobile
                  ? (ratio === '9:16' ? 'min(66vh, 580px)' : (ratio === '4:5' ? 'min(60vh, 500px)' : 'min(54vh, 440px)'))
                  : (ratio === '9:16' ? 'min(86vh, 920px)' : (ratio === '4:5' ? 'min(82vh, 820px)' : 'min(78vh, 720px)')),
                maxHeight: '100%',
                maxWidth: '100%',
                display: 'block',
                borderRadius: 22,
                background: 'transparent'
              }}
            />

            {/* Spinning Loader Overlay when Loading */}
            {isRenderingCanvas && (
              <div style={{
                position: 'absolute',
                top: '38%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '9px 16px',
                borderRadius: 9999,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 750,
                zIndex: 20,
                pointerEvents: 'none'
              }}>
                <Loader2 size={16} className="animate-spin" style={{ color: '#c4b5fd' }} />
                <span>Memuat Gambar</span>
              </div>
            )}

            {/* Live Animation Play/Pause Floating Pill */}
            {animationType !== 'none' && !isRenderingCanvas && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('pop');
                  setIsPlayingAnim(!isPlayingAnim);
                }}
                style={{
                  position: 'absolute',
                  bottom: 18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '7px 16px',
                  borderRadius: 9999,
                  background: isPlayingAnim ? 'rgba(124, 58, 237, 0.92)' : 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  zIndex: 20,
                  transition: 'all 0.15s'
                }}
              >
                {isPlayingAnim ? <Pause size={13} /> : <Play size={13} />}
                <span>{isPlayingAnim ? 'Jeda Animasi' : 'Putar Animasi'}</span>
              </button>
            )}
          </div>

          {/* Mobile Action Controls inside Preview */}
          {isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 10,
              width: '100%',
              maxWidth: 340,
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={handleCopy}
                disabled={isProcessing}
                title="Salin"
                style={{
                  width: 42,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: isCopied ? '#10b981' : '#ffffff',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isCopied ? <Check size={15} /> : <Copy size={15} />}
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={isProcessing}
                title="Bagikan"
                style={{
                  width: 42,
                  height: 38,
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Share2 size={15} />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                style={{
                  flex: 1.2,
                  height: 38,
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--cms-accent, #7c3aed)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Download size={15} />
                <span>Unduh</span>
              </button>
              <button
                type="button"
                onClick={handleExportVideo}
                disabled={isExportingVideo}
                style={{
                  flex: 1.2,
                  height: 38,
                  borderRadius: 10,
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: isExportingVideo ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {isExportingVideo ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
                <span>Video MP4</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Gallery Modal for Image Selection */}
      {showGallery && (
        <MediaGalleryModal
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          onSelectMedia={(url) => {
            soundEffects.play('pop');
            if (galleryTarget === 'cover') {
              if (template === 'trioCollage' || template === 'bentoTrio') {
                if (activePhotoSlot === 2) setCoverUrl2(url);
                else if (activePhotoSlot === 3) setCoverUrl3(url);
                else setCoverUrl(url);
              } else {
                setCoverUrl(url);
              }
            } else {
              setCustomBgUrl(url);
              setBgType('image');
            }
            setShowGallery(false);
          }}
        />
      )}

      {/* Video MP4 Export Progress Modal */}
      {isExportingVideo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: 'var(--cms-card-bg, #161724)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
            borderRadius: 20,
            padding: '24px 28px',
            width: '100%',
            maxWidth: 360,
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)'
            }}>
              <Film size={26} />
            </div>

            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cms-text, #ffffff)', marginBottom: 6 }}>
              Merender Video MP4
            </div>
            <div style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', marginBottom: 20 }}>
              Menghasilkan video sosial animasi {animDuration} detik
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: 8,
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              marginBottom: 12
            }}>
              <div style={{
                height: '100%',
                width: `${videoProgress}%`,
                background: 'linear-gradient(90deg, #0284c7 0%, #7c3aed 100%)',
                borderRadius: 9999,
                transition: 'width 0.1s linear'
              }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 750, color: 'var(--cms-text, #ffffff)' }}>
              <span>Proses Render</span>
              <span>{videoProgress}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPosterStudio;
