import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Gamepad2, LayoutGrid, Plus, KeyRound, Clock, ShieldCheck, Download, Trash2, Edit3, 
  Search, CheckCircle2, AlertCircle, RefreshCw, UploadCloud, Layers, Sparkles,
  ExternalLink, Copy, Check, FileCode, Monitor, ArrowLeft, Users, Settings2,
  Upload, Image as ImageIcon, Loader2, ChevronDown, Star, Tag, Video, X, Database,
  Info, Camera, Mic, MousePointer, Keyboard, Palette, Trophy, HelpCircle,
  BookOpen, Lightbulb, Zap, Send, Code, Terminal, Play, CircleDot
} from 'lucide-react';
import { GameInstance, ClientGameLicense, ClientTier, LicenseModel, GameVisualConfig, GamePricingTier, AdminGameRole } from '../../types/gameLicense';
import { 
  subscribeToGames, saveGameInstance, deleteGameInstance, 
  subscribeToLicenses, saveClientLicense, deleteClientLicense, seedSampleGames 
} from '../../services/gameService';
import { exportGameZip } from '../../utils/gameExporter';
import { scaffoldNewGameEngine, generateGameEngineHtml } from '../../utils/gameEngineBuilder';
import { printGameSetupPdf } from '../../utils/gamePdfPrinter';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { callGemini, getGeminiKey } from '../../utils/ai';
import { GAME_STUDIO_TEMPLATES, GameTemplatePreset } from '../../data/gameTemplatesData';
import { GAME_STUDIO_KNOWLEDGE_BASE, KnowledgeItem } from '../../data/gameKnowledgeData';
import MediaGalleryModal from '../../components/admin/MediaGalleryModal';
import { CustomDropdown } from '../../components/admin/CustomDropdown';
import { useContextMenu } from '../../components/admin/ContextMenuProvider';

interface Props {
  notify?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  confirm?: (msg: string, onConfirm: () => void) => void;
  isDarkMode?: boolean;
  onSwitchPage?: (page: string) => void;
}

export const GameManagementTab: React.FC<Props> = ({ notify, confirm, isDarkMode = true, onSwitchPage }) => {
  const { openContextMenu } = useContextMenu();
  const navigate = useNavigate();
  const location = useLocation();
  const [games, setGames] = useState<GameInstance[]>([]);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<ClientGameLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Game for Detail & Product License Management
  const [selectedGame, setSelectedGame] = useState<GameInstance | null>(null);

  // Modals / Editors
  const [isEditingGame, setIsEditingGame] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<GameInstance> | null>(null);
  const initialGameSnapshotRef = useRef<string>('');

  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [editingLicense, setEditingLicense] = useState<Partial<ClientGameLicense> | null>(null);
  const initialLicenseSnapshotRef = useRef<string>('');

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [downloadingGameId, setDownloadingGameId] = useState<string | null>(null);

  // AI Prompt Modal State
  const [aiPromptGame, setAiPromptGame] = useState<GameInstance | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Upload Thumbnail & Gallery States
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'game_thumbnail' | 'license_logo' | 'license_hero'>('game_thumbnail');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseLogoInputRef = useRef<HTMLInputElement>(null);
  const licenseHeroInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  // Dynamic Tags / Categories State (Ditambah / Dikurang oleh Admin)
  const [availableTags, setAvailableTags] = useState<string[]>([
    'E-Sport', 'Ramadhan', 'Corporate', 'Exhibition', 'Interactive', 
    'Doorprise', 'Arcade', 'Trivia', 'Festival', 'Mall Activation'
  ]);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Video Preview Modal State di CMS
  const [previewVideoGame, setPreviewVideoGame] = useState<GameInstance | null>(null);

  // Dual-View Live Test Modal State (Iframe Tester + Real-time Settings)
  const [liveTestGame, setLiveTestGame] = useState<GameInstance | null>(null);
  const [liveTestLicense, setLiveTestLicense] = useState<ClientGameLicense | null>(null);
  const [liveTestConfig, setLiveTestConfig] = useState<GameVisualConfig>({});

  // Pusat Panduan & Wawasan Game Studio Drawer State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'encyclopedia' | 'templates' | 'ai_architect'>('encyclopedia');
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState('all');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
  const [selectedTemplateForAi, setSelectedTemplateForAi] = useState<GameTemplatePreset | null>(null);

  // Gemini AI Game Generator State (Direct In-App Generation)
  const [geminiPromptCustom, setGeminiPromptCustom] = useState('');
  const [geminiGeneratedHtml, setGeminiGeneratedHtml] = useState('');
  const [isGeneratingWithGemini, setIsGeneratingWithGemini] = useState(false);
  const [geminiGeneratedSlug, setGeminiGeneratedSlug] = useState('');
  const [geminiGeneratedTitle, setGeminiGeneratedTitle] = useState('');
  const [geminiAiStatusMessage, setGeminiAiStatusMessage] = useState('');

  // Load tags from storage on mount
  useEffect(() => {
    storage.getItem('porto_game_dynamic_tags', null).then((saved: any) => {
      if (Array.isArray(saved) && saved.length > 0) {
        setAvailableTags(saved);
      }
    });
  }, []);

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (availableTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      notify?.('Tag/label ini sudah ada', 'warning');
      return;
    }
    const updated = [...availableTags, trimmed];
    setAvailableTags(updated);
    storage.setItem('porto_game_dynamic_tags', updated);
    setNewTagInput('');
    notify?.(`Label "${trimmed}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteTag = (tagToRemove: string) => {
    const updated = availableTags.filter(t => t !== tagToRemove);
    setAvailableTags(updated);
    storage.setItem('porto_game_dynamic_tags', updated);
    notify?.(`Label "${tagToRemove}" dihapus`, 'info');
  };

  const handleSeedSampleData = async () => {
    setIsSeeding(true);
    notify?.('Sedang memasukkan data dummy game & aktivasi event...', 'info');
    try {
      await seedSampleGames();
      notify?.('Data dummy berhasil dimasukkan! 5 game sampel siap diuji coba.', 'success');
    } catch (err: any) {
      notify?.('Gagal memasukkan data sampel: ' + err.message, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingThumbnail(true);
    notify?.('Sedang mengunggah thumbnail ke Cloudinary...', 'info');
    try {
      const res = await uploadToCloudinary(file, 'image');
      if (res && res.url) {
        setEditingGame(prev => ({ ...prev, thumbnailUrl: res.url }));
        notify?.('Thumbnail berhasil diunggah ke Cloudinary!', 'success');
      } else {
        notify?.('Gagal mengunggah thumbnail.', 'error');
      }
    } catch (err: any) {
      notify?.('Terjadi kesalahan saat unggah: ' + (err.message || err), 'error');
    } finally {
      setIsUploadingThumbnail(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLicenseLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    notify?.('Sedang mengunggah logo ke Cloudinary...', 'info');
    try {
      const res = await uploadToCloudinary(file, 'image');
      if (res && res.url) {
        setEditingLicense(prev => ({
          ...prev,
          customConfig: { ...(prev?.customConfig || {}), logoUrl: res.url }
        }));
        notify?.('Logo brand berhasil diunggah ke Cloudinary!', 'success');
      } else {
        notify?.('Gagal mengunggah logo brand.', 'error');
      }
    } catch (err: any) {
      notify?.('Terjadi kesalahan saat unggah: ' + (err.message || err), 'error');
    } finally {
      setIsUploadingLogo(false);
      if (licenseLogoInputRef.current) licenseLogoInputRef.current.value = '';
    }
  };

  const handleLicenseHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    notify?.('Sedang mengunggah background hero ke Cloudinary...', 'info');
    try {
      const res = await uploadToCloudinary(file, 'image');
      if (res && res.url) {
        setEditingLicense(prev => ({
          ...prev,
          customConfig: { ...(prev?.customConfig || {}), heroBackgroundUrl: res.url }
        }));
        notify?.('Background hero berhasil diunggah ke Cloudinary!', 'success');
      } else {
        notify?.('Gagal mengunggah background hero.', 'error');
      }
    } catch (err: any) {
      notify?.('Terjadi kesalahan saat unggah: ' + (err.message || err), 'error');
    } finally {
      setIsUploadingHero(false);
      if (licenseHeroInputRef.current) licenseHeroInputRef.current.value = '';
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubGames = subscribeToGames((data) => {
      setGames(data);
      // Sinkronisasi selectedGame dari database atau dari URL /admin/game-management/:slug
      const pathParts = location.pathname.split('/').filter(Boolean);
      // Contoh path: ['admin', 'game-management', 'shake-n-drop']
      const gameSlugFromUrl = pathParts.length >= 3 && pathParts[1] === 'game-management' ? pathParts[2] : null;

      setSelectedGame(prev => {
        if (gameSlugFromUrl) {
          const matchedByUrl = data.find(g => g.slug === gameSlugFromUrl || g.id === gameSlugFromUrl);
          if (matchedByUrl) return matchedByUrl;
        }
        return prev ? (data.find(g => g.id === prev.id) || prev) : null;
      });
      setLoading(false);
    });
    const unsubLicenses = subscribeToLicenses((data) => {
      setLicenses(data);
    });
    return () => {
      unsubGames();
      unsubLicenses();
    };
  }, [location.pathname]);

  // Handle memilih game dengan update URL browser agar bisa refresh tanpa keluar
  const handleSelectGame = (game: GameInstance | null) => {
    setSelectedGame(game);
    if (game) {
      navigate(`/admin/game-management/${game.slug || game.id}`);
    } else {
      navigate('/admin/game-management');
    }
  };

  // Helper untuk mengambil URL Webhook Google Apps Script secara otomatis di belakang layar
  const getDynamicWebhookUrl = async (): Promise<string> => {
    try {
      const settings = await storage.getItem('porto_settings', {});
      if (settings?.googleAppsScriptUrl) {
        return settings.googleAppsScriptUrl.trim();
      }
    } catch (e) {}
    return (localStorage.getItem('porto_game_webhook_url') || '').trim();
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame?.title) {
      notify?.('Judul game wajib diisi', 'error');
      return;
    }
    const isNew = !editingGame.id;
    try {
      const savedId = await saveGameInstance(editingGame);
      notify?.('Data game berhasil disimpan!', 'success');

      // Auto-generator folder & struktur game baru (/public/engines/[slug] atau unduh ZIP)
      if (isNew) {
        try {
          const scaffoldRes = await scaffoldNewGameEngine({
            ...editingGame,
            id: savedId
          });
          if (scaffoldRes.mode === 'local') {
            notify?.(scaffoldRes.message, 'success');
          } else {
            notify?.('Paket template game (.ZIP) otomatis terunduh untuk penempatan server.', 'info');
          }
        } catch (scaffoldErr) {
          console.warn('[Auto Scaffold Error]:', scaffoldErr);
        }
      }

      setIsEditingGame(false);
      if (selectedGame && selectedGame.id === savedId) {
        setSelectedGame(prev => ({ ...prev, ...(editingGame as GameInstance) }));
      }
      setEditingGame(null);
    } catch (err: any) {
      notify?.(err.message || 'Gagal menyimpan game', 'error');
    }
  };

  const handleDeleteGame = (id: string, title: string) => {
    const doDelete = async () => {
      try {
        await deleteGameInstance(id);
        notify?.('Game berhasil dihapus', 'success');
        if (selectedGame?.id === id) {
          setSelectedGame(null);
        }
      } catch (err: any) {
        notify?.('Gagal menghapus game', 'error');
      }
    };
    if (confirm) confirm(`Hapus game instance "${title}"?`, doDelete);
    else if (window.confirm(`Hapus game instance "${title}"?`)) doDelete();
  };

  const toggleSelectGame = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedGameIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllGames = (list: GameInstance[]) => {
    if (selectedGameIds.length === list.length && list.length > 0) {
      setSelectedGameIds([]);
    } else {
      setSelectedGameIds(list.map(g => g.id));
    }
  };

  const handleBulkDeleteGames = () => {
    if (selectedGameIds.length === 0) return;
    const count = selectedGameIds.length;
    const doBulkDelete = async () => {
      try {
        for (const id of selectedGameIds) {
          await deleteGameInstance(id);
        }
        notify?.(`🗑️ ${count} game/aplikasi berhasil dihapus`, 'success');
        if (selectedGame && selectedGameIds.includes(selectedGame.id)) {
          setSelectedGame(null);
        }
        setSelectedGameIds([]);
      } catch (err: any) {
        notify?.(err.message || 'Gagal menghapus game', 'error');
      }
    };
    if (confirm) confirm(`Hapus permanen ${count} game yang ditandai?`, doBulkDelete);
    else if (window.confirm(`Hapus permanen ${count} game yang ditandai?`)) doBulkDelete();
  };

  const handleSaveLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicense?.clientId || !editingLicense?.gameId) {
      notify?.('ID Klien dan Game wajib dipilih', 'error');
      return;
    }
    try {
      const targetGame = games.find(g => g.id === editingLicense.gameId) || selectedGame;
      const payload: Partial<ClientGameLicense> = {
        ...editingLicense,
        gameTitle: targetGame?.title || editingLicense.gameTitle || 'Game'
      };
      await saveClientLicense(payload);
      notify?.('Lisensi klien berhasil disimpan ke produk ini', 'success');
      setIsEditingLicense(false);
      setEditingLicense(null);
    } catch (err: any) {
      notify?.(err.message || 'Gagal menyimpan lisensi', 'error');
    }
  };

  const handleDeleteLicense = (id: string, clientName: string) => {
    const doDelete = async () => {
      try {
        await deleteClientLicense(id);
        notify?.('Lisensi berhasil dihapus', 'success');
      } catch (err: any) {
        notify?.('Gagal menghapus lisensi', 'error');
      }
    };
    if (confirm) confirm(`Hapus lisensi klien "${clientName}"?`, doDelete);
    else if (window.confirm(`Hapus lisensi klien "${clientName}"?`)) doDelete();
  };

  const handleTriggerWebhookBackup = async (license: ClientGameLicense) => {
    const url = await getDynamicWebhookUrl();
    if (!url) {
      notify?.('URL Webhook Google Apps Script belum dikonfigurasi di Pengaturan Global Sistem!', 'warning');
      return;
    }
    setIsBackingUp(true);
    try {
      const payload = {
        action: 'backup_game_config',
        clientId: license.clientId,
        clientEmail: license.clientEmail,
        clientName: license.clientName,
        gameId: license.gameId,
        gameTitle: license.gameTitle,
        tier: license.tier,
        model: license.model,
        timestamp: new Date().toISOString(),
        config: license.customConfig || {}
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const resJson = await res.json();
      if (resJson.status === 'success') {
        notify?.('Backup config ke Google Drive & Sheets berhasil!', 'success');
      } else {
        notify?.(resJson.message || 'Gagal memproses webhook', 'error');
      }
    } catch (err: any) {
      notify?.('Gagal mengirim Webhook: ' + err.message, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadZip = async (license: ClientGameLicense) => {
    if (license.model !== 'lifetime') {
      notify?.('Hanya lisensi Beli Putus (Lifetime) yang berhak unduh offline.', 'warning');
      return;
    }
    setDownloadingGameId(license.id);
    try {
      const targetGame = games.find(g => g.id === license.gameId) || selectedGame;
      const mergedConfig: GameVisualConfig = {
        ...(targetGame?.defaultConfig || {}),
        ...(license.customConfig || {})
      };
      notify?.('Sedang mengekstrak aset dan mengompres file ZIP...', 'info');
      await exportGameZip({
        gameId: license.gameId,
        gameTitle: license.gameTitle,
        config: mergedConfig,
        clientName: license.clientName,
        clientId: license.clientId || license.clientEmail
      });
      notify?.('Download ZIP offline berhasil dimulai!', 'success');
    } catch (err: any) {
      notify?.('Gagal membuat ZIP: ' + (err.message || err), 'error');
    } finally {
      setDownloadingGameId(null);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredGames = useMemo(() => {
    let result = games;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.title.toLowerCase().includes(q) || 
        g.slug.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q) ||
        g.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== 'all') {
      const cat = selectedCategory.toLowerCase();
      result = result.filter(g => 
        g.category?.toLowerCase() === cat ||
        g.tags?.some(t => t.toLowerCase() === cat)
      );
    }
    return result;
  }, [games, searchTerm, selectedCategory]);

  // Lisensi khusus untuk game yang sedang dipilih
  const selectedGameLicenses = useMemo(() => {
    if (!selectedGame) return [];
    return licenses.filter(l => l.gameId === selectedGame.id);
  }, [licenses, selectedGame]);

  // Modal Handlers with Dirty Input Confirmation
  const openAddGameModal = (initialData?: Partial<GameInstance>) => {
    const newGame: Partial<GameInstance> = initialData || {
      id: `game_${Date.now()}`,
      title: '',
      slug: '',
      engineType: 'HTML5 Single File (Event Activation)',
      category: 'Event',
      tags: ['Interactive'],
      pricingTier: 'basic',
      previewVideoUrl: '',
      eventSpecs: {
        estimatedDuration: '30 - 60 Detik / Pemain',
        leaderboardCapacity: 'Top 10 Peserta',
        deviceSupport: 'Touchscreen Kiosk & Smartphone'
      },
      defaultConfig: { themeColor: '#7c3aed' },
      isActive: true
    };
    setEditingGame(newGame);
    initialGameSnapshotRef.current = JSON.stringify(newGame);
    setIsEditingGame(true);
  };

  const openEditGameModal = (game: GameInstance) => {
    setEditingGame(game);
    initialGameSnapshotRef.current = JSON.stringify(game);
    setIsEditingGame(true);
  };

  const handleCloseGameModal = () => {
    if (!editingGame) {
      setIsEditingGame(false);
      return;
    }
    const isNew = !editingGame.createdAt;
    let hasDirtyContent = false;
    if (isNew) {
      hasDirtyContent = Boolean(
        (editingGame.title && editingGame.title.trim() !== '') ||
        (editingGame.slug && editingGame.slug.trim() !== '') ||
        (editingGame.description && editingGame.description.trim() !== '') ||
        (editingGame.thumbnailUrl && editingGame.thumbnailUrl.trim() !== '') ||
        (editingGame.previewVideoUrl && editingGame.previewVideoUrl.trim() !== '') ||
        (editingGame.customHtml && editingGame.customHtml.trim() !== '')
      );
    } else {
      hasDirtyContent = initialGameSnapshotRef.current
        ? JSON.stringify(editingGame) !== initialGameSnapshotRef.current
        : true;
    }

    if (hasDirtyContent) {
      const confirmMsg = 'Formulir aplikasi/game sudah berisi data yang belum disimpan. Yakin ingin keluar dan membuang perubahan ini?';
      if (confirm) {
        confirm(confirmMsg, () => {
          setIsEditingGame(false);
          setEditingGame(null);
        });
      } else if (window.confirm(confirmMsg)) {
        setIsEditingGame(false);
        setEditingGame(null);
      }
    } else {
      setIsEditingGame(false);
      setEditingGame(null);
    }
  };

  const openAddLicenseModal = (initialData: Partial<ClientGameLicense>) => {
    setEditingLicense(initialData);
    initialLicenseSnapshotRef.current = JSON.stringify(initialData);
    setIsEditingLicense(true);
  };

  const openEditLicenseModal = (lic: ClientGameLicense) => {
    setEditingLicense(lic);
    initialLicenseSnapshotRef.current = JSON.stringify(lic);
    setIsEditingLicense(true);
  };

  const handleCloseLicenseModal = () => {
    if (!editingLicense) {
      setIsEditingLicense(false);
      return;
    }
    const isNew = !editingLicense.createdAt;
    let hasDirtyContent = false;
    if (isNew) {
      hasDirtyContent = Boolean(
        (editingLicense.clientName && editingLicense.clientName.trim() !== '') ||
        (editingLicense.clientEmail && editingLicense.clientEmail.trim() !== '') ||
        (editingLicense.notes && editingLicense.notes.trim() !== '') ||
        (editingLicense.brandLogoUrl && editingLicense.brandLogoUrl.trim() !== '') ||
        (editingLicense.heroBannerUrl && editingLicense.heroBannerUrl.trim() !== '') ||
        (editingLicense.customThemeColor && editingLicense.customThemeColor !== '#7c3aed')
      );
    } else {
      hasDirtyContent = initialLicenseSnapshotRef.current
        ? JSON.stringify(editingLicense) !== initialLicenseSnapshotRef.current
        : true;
    }

    if (hasDirtyContent) {
      const confirmMsg = 'Formulir lisensi/link branding klien sudah berisi data yang belum disimpan. Yakin ingin keluar dan membuang perubahan?';
      if (confirm) {
        confirm(confirmMsg, () => {
          setIsEditingLicense(false);
          setEditingLicense(null);
        });
      } else if (window.confirm(confirmMsg)) {
        setIsEditingLicense(false);
        setEditingLicense(null);
      }
    } else {
      setIsEditingLicense(false);
      setEditingLicense(null);
    }
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingGame) {
          handleCloseGameModal();
        } else if (isEditingLicense) {
          handleCloseLicenseModal();
        } else if (isManagingTags) {
          setIsManagingTags(false);
        } else if (previewVideoGame) {
          setPreviewVideoGame(null);
        } else if (aiPromptGame) {
          setAiPromptGame(null);
        } else if (isGuideOpen) {
          setIsGuideOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingGame, isEditingLicense, editingGame, editingLicense, isManagingTags, previewVideoGame, aiPromptGame, isGuideOpen]);

  return (
    <div 
      className="cms-game-management-root"
      style={{ 
        flex: 1,
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '24px 24px 80px', 
        maxWidth: '1280px', 
        width: '100%',
        margin: '0 auto', 
        color: 'var(--cms-text, #fff)',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .cms-game-management-root::-webkit-scrollbar {
          width: 8px;
        }
        .cms-game-management-root::-webkit-scrollbar-track {
          background: transparent;
        }
        .cms-game-management-root::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'};
          border-radius: 999px;
        }
        .cms-game-management-root::-webkit-scrollbar-thumb:hover {
          background: var(--cms-accent, #7c3aed);
        }
        .cms-game-management-root input[type=number]::-webkit-inner-spin-button,
        .cms-game-management-root input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none !important;
          margin: 0 !important;
        }
        .cms-game-management-root input[type=number] {
          -moz-appearance: textfield !important;
          appearance: textfield !important;
        }
        @media (max-width: 768px) {
          .cms-game-management-root {
            padding: 16px 16px 90px !important;
          }
        }
      `}</style>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedGame ? (
            <button
              onClick={() => handleSelectGame(null)}
              style={{
                width: 42, height: 42, borderRadius: 12, 
                background: 'var(--cms-card-bg, #1e1e2d)',
                color: 'var(--cms-text, #fff)', 
                border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.2s'
              }}
              title="Kembali ke Katalog Game"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.18)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.3)', flexShrink: 0 }}>
              <LayoutGrid size={24} color="#8b5cf6" strokeWidth={2.4} style={{ display: 'block', margin: 'auto' }} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--cms-text, #fff)' }}>
              {selectedGame ? selectedGame.title : 'Apps'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cms-text-muted, #94a3b8)' }}>
              {selectedGame 
                ? 'Panel Modul & Game: Generator link kustom, branding mandiri klien, dan kendali akses'
                : 'Pusat modul interaktif, mini games santai & aktivasi seru sumr.day studio ☀️'
              }
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {selectedGame ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Tombol Uji Coba Game / App */}
              <button
                onClick={() => {
                  setLiveTestGame(selectedGame);
                  setLiveTestLicense(null);
                  setLiveTestConfig(selectedGame.defaultConfig || { themeColor: '#7c3aed' });
                }}
                style={{
                  padding: '9px 15px', borderRadius: 100,
                  background: 'rgba(59, 130, 246, 0.16)',
                  color: '#3b82f6',
                  border: '1.5px solid rgba(59, 130, 246, 0.3)',
                  fontWeight: 800, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                }}
              >
                <Play size={14} fill="#3b82f6" /> Uji Coba Live
              </button>

              {/* Tombol Cetak Panduan Setup PDF */}
              <button
                onClick={() => printGameSetupPdf(selectedGame)}
                style={{
                  padding: '9px 15px', borderRadius: 100,
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#10b981',
                  border: '1.5px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 800, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                }}
              >
                <FileCode size={14} /> Cetak SOP Panduan
              </button>

              <button
                onClick={() => {
                  openAddLicenseModal({
                    clientId: '',
                    clientEmail: '',
                    clientName: '',
                    customTitle: '',
                    gameId: selectedGame.id,
                    gameTitle: selectedGame.title,
                    model: 'rental',
                    tier: 'view_only',
                    adminRole: 'master',
                    status: 'active',
                    customConfig: {
                      themeColor: selectedGame.defaultConfig?.themeColor || '#7c3aed',
                      brandName: '',
                      welcomeMessage: '',
                      ctaText: '',
                      ctaUrl: ''
                    }
                  });
                }}
                style={{
                  padding: '9px 18px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)',
                  color: '#fff', border: 'none', fontWeight: 800, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(124,58,237,0.3)'
                }}
              >
                <Plus size={15} /> Buat Link Multi-Branding
              </button>

              <button
                onClick={() => { openEditGameModal(selectedGame); }}
                style={{
                  padding: '9px 15px', borderRadius: 100, 
                  background: 'var(--cms-card-bg, #1e1e2d)',
                  color: 'var(--cms-text, #fff)', 
                  border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))', 
                  fontWeight: 800, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                }}
              >
                <Edit3 size={14} color="var(--cms-text, #fff)" /> Ubah Info
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Tombol Manajemen Label / Kategori (Icon Only) */}
              <button
                onClick={() => setIsManagingTags(true)}
                title={`Kelola Label (${availableTags.length})`}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--cms-card-bg, #1e1e2d)',
                  color: 'var(--cms-accent, #7c3aed)',
                  border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Tag size={16} />
              </button>

              {/* Tombol Buat Game via AI (Icon Only) */}
              <button
                onClick={() => {
                  setGuideActiveTab('templates');
                  setIsGuideOpen(true);
                }}
                title="Buat Game Otomatis via AI & Template"
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.25))',
                  color: '#c4b5fd',
                  border: '1.5px solid rgba(124,58,237,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(124,58,237,0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={16} color="#a78bfa" />
              </button>

              {/* Tombol Panduan & Solusi (Icon Only) */}
              <button
                onClick={() => {
                  setGuideActiveTab('encyclopedia');
                  setIsGuideOpen(true);
                }}
                title="Pusat Panduan & Solusi Game Studio (A-Z)"
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  border: '1.5px solid rgba(59, 130, 246, 0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease'
                }}
              >
                <HelpCircle size={17} />
              </button>

              {/* Tombol Tambah Game Manual (Icon Only) */}
              <button
                onClick={() => openAddGameModal()}
                title="Tambah Game Baru Secara Manual"
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--cms-accent, #7c3aed)',
                  color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(124,58,237,0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: KATALOG GAME (Grid Produk Utama) */}
      {!selectedGame && (
        <div>
          {/* Search & Category Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted, #94a3b8)' }} />
                <input
                  type="text"
                  placeholder="Cari judul game, slug, label, atau kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', height: 44, padding: '0 16px 0 42px', borderRadius: 100,
                    background: 'var(--cms-card-bg, #1a1a24)', border: '1.5px solid var(--cms-border, rgba(255,255,255,0.12))',
                    color: 'var(--cms-text, #fff)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    boxShadow: isDarkMode ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--cms-text-muted, #94a3b8)', cursor: 'pointer', fontSize: 14 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Tag / Category Filter Chips */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 800,
                    background: selectedCategory === 'all' ? 'var(--cms-accent, #7c3aed)' : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    color: selectedCategory === 'all' ? '#fff' : 'var(--cms-text, #fff)',
                    border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Semua ({games.length})
                </button>
                {availableTags.slice(0, 7).map((tag) => {
                  const isCurrent = selectedCategory.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedCategory(isCurrent ? 'all' : tag)}
                      style={{
                        padding: '6px 12px', borderRadius: 100, fontSize: 11.5, fontWeight: 700,
                        background: isCurrent ? 'var(--cms-accent, #7c3aed)' : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        color: isCurrent ? '#fff' : 'var(--cms-text-muted, #94a3b8)',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.08))', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedGameIds.length > 0 && (
            <div style={{
              marginBottom: 16,
              padding: '12px 18px',
              borderRadius: 14,
              background: 'var(--cms-card-bg, #1a1a24)',
              border: '1.5px solid var(--cms-accent, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-accent, #7c3aed)' }}>
                  {selectedGameIds.length} Game Ditandai
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAllGames(filteredGames)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                    background: 'transparent',
                    color: 'var(--cms-text, #fff)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {selectedGameIds.length === filteredGames.length ? 'Batalkan Semua' : 'Tandai Semua'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleBulkDeleteGames}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Trash2 size={14} /> Hapus Ditandai ({selectedGameIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGameIds([])}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
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

          {filteredGames.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--cms-card-bg, #1a1a24)', borderRadius: 20, border: '1.5px dashed var(--cms-border, rgba(255,255,255,0.15))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutGrid size={44} style={{ opacity: 0.3, marginBottom: 12, color: 'var(--cms-accent, #7c3aed)', display: 'block', margin: '0 auto 12px' }} />
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--cms-text, #fff)' }}>Tidak Ada Game Yang Sesuai</h3>
              <p style={{ fontSize: 13, color: 'var(--cms-text-muted, #94a3b8)', margin: '6px 0 16px' }}>Coba kata kunci pencarian lain atau klik tombol "Semua".</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                style={{ padding: '8px 18px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 22 }}>
              {filteredGames.map((game) => {
                const isSelected = selectedGameIds.includes(game.id);
                const gameLicenseCount = licenses.filter(l => l.gameId === game.id).length;
                // Normalize tags to remove duplicates with category
                const uniqueTags = (game.tags || []).filter(t => t.toLowerCase() !== game.category?.toLowerCase());

                return (
                  <div 
                    key={game.id} 
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openContextMenu(e, {
                        title: game.title || 'Game / Aplikasi',
                        subtitle: `${game.category || 'Event'} · ${game.engineType || 'HTML5'}`,
                        items: [
                          {
                            label: 'Kelola & Buka Lisensi',
                            icon: <Edit3 size={15} color="#7c3aed" />,
                            action: () => handleSelectGame(game)
                          },
                          {
                            label: isSelected ? 'Hilangkan Tanda' : 'Tandai / Mode Pilih',
                            icon: <Check size={15} color="#10b981" />,
                            action: () => toggleSelectGame(game.id)
                          },
                          ...(selectedGameIds.length > 0 ? [
                            {
                              label: 'Batalkan Semua Pilihan',
                              icon: <X size={15} color="#94a3b8" />,
                              action: () => setSelectedGameIds([])
                            }
                          ] : []),
                          {
                            label: 'Live Test / Uji Coba Game',
                            icon: <Play size={15} color="#3b82f6" />,
                            action: () => window.open(`/apps/${game.slug || game.id}`, '_blank')
                          },
                          {
                            label: 'Salin Tautan Game',
                            icon: <Copy size={15} />,
                            action: () => {
                              navigator.clipboard?.writeText(`${window.location.origin}/apps/${game.slug || game.id}`);
                              notify?.('Tautan game berhasil disalin', 'info');
                            }
                          },
                          { separator: true },
                          {
                            label: 'Hapus Game',
                            icon: <Trash2 size={15} color="#ef4444" />,
                            danger: true,
                            action: () => handleDeleteGame(game.id, game.title)
                          }
                        ]
                      });
                    }}
                    style={{ 
                      background: 'var(--cms-card-bg, #1a1a24)', 
                      borderRadius: 20, 
                      border: isSelected ? '2px solid var(--cms-accent, #7c3aed)' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                      overflow: 'hidden', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.35)' : '0 6px 20px rgba(0,0,0,0.06)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--cms-accent, #7c3aed)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isSelected ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-border, rgba(255,255,255,0.1))';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Multi-Select Checkbox button (Hanya tampil saat mode pilih aktif) */}
                    {selectedGameIds.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => toggleSelectGame(game.id, e)}
                        title={isSelected ? 'Batalkan pilihan' : 'Tandai game ini'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: isSelected ? 'var(--cms-accent, #7c3aed)' : 'rgba(0,0,0,0.65)',
                          border: isSelected ? '2px solid #ffffff' : '1.5px solid rgba(255,255,255,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                      </button>
                    )}
                    {/* Media Thumbnail & Overlay Badges */}
                    <div 
                      onClick={() => handleSelectGame(game)}
                      style={{ height: 160, background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                    >
                      {game.thumbnailUrl ? (
                        <img 
                          src={game.thumbnailUrl} 
                          alt={game.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.25))', gap: 6 }}>
                          <LayoutGrid size={44} style={{ opacity: 0.6, color: 'var(--cms-accent, #a78bfa)' }} />
                          <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', fontWeight: 700 }}>Tanpa Thumbnail</span>
                        </div>
                      )}

                      {/* Top Badges (Tier & Status) */}
                      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 900, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 8,
                          background: game.pricingTier === 'premium' ? 'rgba(236,72,153,0.92)' : game.pricingTier === 'plus' ? 'rgba(59,130,246,0.92)' : game.pricingTier === 'free' ? 'rgba(16,185,129,0.92)' : 'rgba(234,179,8,0.92)',
                          color: '#fff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          letterSpacing: '0.04em'
                        }}>
                          {game.pricingTier || 'basic'}
                        </span>

                        {game.category && (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                            color: '#fff', border: '1px solid rgba(255,255,255,0.15)'
                          }}>
                            {game.category}
                          </span>
                        )}
                      </div>

                      <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 100, fontSize: 10.5, fontWeight: 800, background: game.isActive ? '#10b981' : '#64748b', color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                        {game.isActive ? 'Aktif' : 'Non-aktif'}
                      </div>

                      {/* Bottom Info Bar (Lisensi & Engine) */}
                      <div style={{
                        position: 'absolute', bottom: 10, left: 10, right: 10,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: 10.5, fontWeight: 800, color: '#fff'
                      }}>
                        <div style={{ padding: '3px 9px', borderRadius: 100, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 5, color: '#60a5fa' }}>
                          <Users size={11} /> {gameLicenseCount} Lisensi Klien
                        </div>

                        <div style={{ padding: '3px 8px', borderRadius: 100, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.8)' }}>
                          HTML5 Event
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div 
                        onClick={() => handleSelectGame(game)}
                        style={{ cursor: 'pointer', marginBottom: 8 }}
                      >
                        <h3 style={{ margin: '0 0 4px', fontSize: 16.5, fontWeight: 900, color: 'var(--cms-text, #fff)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>
                          {game.title}
                        </h3>
                        <span style={{ fontSize: 11, color: 'var(--cms-accent, #a78bfa)', fontFamily: 'monospace', fontWeight: 700 }}>
                          /{game.slug}
                        </span>
                      </div>

                      {/* Tags List */}
                      {uniqueTags.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                          {uniqueTags.slice(0, 3).map((t, idx) => (
                            <span 
                              key={idx} 
                              style={{ 
                                fontSize: 10, padding: '2px 7px', borderRadius: 6, 
                                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
                                color: 'var(--cms-text-muted, #94a3b8)',
                                border: '1px solid var(--cms-border, rgba(255,255,255,0.06))'
                              }}
                            >
                              #{t}
                            </span>
                          ))}
                          {uniqueTags.length > 3 && (
                            <span style={{ fontSize: 9.5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                              +{uniqueTags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      <p 
                        onClick={() => handleSelectGame(game)}
                        style={{ 
                          fontSize: 12.5, 
                          color: 'var(--cms-text-muted, #94a3b8)', 
                          margin: '0 0 16px', 
                          lineHeight: 1.5, 
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                      >
                        {game.description || 'Game aktivasi interaktif event siap disewa dan dibranding logo klien.'}
                      </p>

                      {/* Card Footer: Action Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        paddingTop: 12, 
                        borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                        gap: 8
                      }}>
                        {/* Primary Action Button */}
                        <button
                          onClick={() => handleSelectGame(game)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 100,
                            background: 'var(--cms-accent, #7c3aed)',
                            color: '#fff',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 2px 8px rgba(124,58,237,0.25)'
                          }}
                        >
                          <Play size={12} fill="#fff" /> Detail & Klien
                        </button>

                        {/* Quick Utility Tools */}
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {game.previewVideoUrl && (
                            <button
                              onClick={() => setPreviewVideoGame(game)}
                              style={{
                                padding: '6px 10px', borderRadius: 100,
                                background: 'rgba(59, 130, 246, 0.14)', color: '#3b82f6',
                                border: '1px solid rgba(59, 130, 246, 0.28)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 11, fontWeight: 800
                              }}
                              title="Tonton Cuplikan Video Gameplay"
                            >
                              <Video size={12} />
                              <span>Video</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedTemplateForAi({
                                id: `custom_${game.id}`,
                                category: 'Arcade & Reflex',
                                title: game.title,
                                theme: game.description || 'Game Interaktif',
                                durationSec: game.inputSpecs?.sessionDurationSec || 45,
                                inputMethod: game.inputSpecs?.requireCamera ? 'Camera' : game.inputSpecs?.requireMicrophone ? 'Mic' : game.inputSpecs?.requireKeyboard ? 'Keyboard' : 'Touch',
                                difficulty: 'Sedang',
                                description: game.description || '',
                                promptGoal: `Mekanik game interaktif ${game.title} dengan target skor ${game.inputSpecs?.maxTargetScore || 1000}.`,
                                techSpecs: 'HTML5 60FPS Single-File'
                              });
                              const fp = `Buatkan game HTML5 Single File bertema "${game.title}".\n\nDeskripsi: ${game.description || 'Game interaktif event booth'}\n\nDurasi: ${game.inputSpecs?.sessionDurationSec || 45} detik.\n\nInstruksi: ${game.inputSpecs?.instructionText || 'Kumpulkan poin sebanyak mungkin!'}\n\nStruktur wajib: 6 layar standar (Idle, Peraturan, Countdown 3..2..1, Gameplay + Timer, Skor Akhir + Input Nama + WA, Leaderboard IndexedDB Top 10).\n\nBaca dan terapkan window.gameConfig = { logoUrl, heroBackgroundUrl, themeColor, soundtrackUrl }. Output hanya satu file HTML lengkap tanpa penjelasan.`;
                              setGeminiPromptCustom(fp);
                              setGuideActiveTab('ai_architect');
                              setIsGuideOpen(true);
                            }}
                            style={{
                              padding: '6px 10px', borderRadius: 100,
                              background: 'rgba(234, 179, 8, 0.14)', color: '#eab308',
                              border: '1px solid rgba(234, 179, 8, 0.28)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 800
                            }}
                            title="Buat Kode Game via AI"
                          >
                            <Sparkles size={12} />
                            <span>AI</span>
                          </button>

                          <button
                            onClick={() => openEditGameModal(game)}
                            style={{
                              padding: '6px 9px', borderRadius: 100,
                              background: 'var(--cms-card-bg, #1e1e2d)',
                              color: 'var(--cms-text, #fff)',
                              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Ubah Rincian Game"
                          >
                            <Edit3 size={12} color="var(--cms-text, #fff)" />
                          </button>

                          <button
                            onClick={() => handleDeleteGame(game.id, game.title)}
                            style={{ 
                              padding: '6px 9px', borderRadius: 100, 
                              background: 'rgba(239,68,68,0.12)', color: '#ef4444', 
                              border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Hapus Game"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DETAIL PRODUK GAME & DAFTAR LISENSI KLIEN (Menyatu) */}
      {selectedGame && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card Ringkasan Produk */}
          <div style={{ 
            background: 'var(--cms-card-bg, #1a1a24)', padding: 24, borderRadius: 20,
            border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
            display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
            boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)'
          }}>
            <div style={{ width: 120, height: 120, borderRadius: 16, overflow: 'hidden', background: isDarkMode ? '#252538' : '#e2e8f0', flexShrink: 0, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
              {selectedGame.thumbnailUrl ? (
                <img src={selectedGame.thumbnailUrl} alt={selectedGame.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayoutGrid size={40} color="var(--cms-accent, #7c3aed)" />
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--cms-text, #fff)' }}>{selectedGame.title}</h2>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 100, background: selectedGame.isActive ? '#10b981' : '#64748b', color: '#fff', fontWeight: 800 }}>
                  {selectedGame.isActive ? 'Aktif' : 'Non-aktif'}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 900, textTransform: 'uppercase', padding: '2px 10px', borderRadius: 100,
                  background: selectedGame.pricingTier === 'premium' ? 'rgba(236,72,153,0.2)' : selectedGame.pricingTier === 'plus' ? 'rgba(59,130,246,0.2)' : selectedGame.pricingTier === 'free' ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.2)',
                  color: selectedGame.pricingTier === 'premium' ? '#f472b6' : selectedGame.pricingTier === 'plus' ? '#60a5fa' : selectedGame.pricingTier === 'free' ? '#34d399' : '#facc15',
                  border: `1px solid currentColor`
                }}>
                  Tier: {selectedGame.pricingTier || 'basic'}
                </span>
                {selectedGame.previewVideoUrl && (
                  <button
                    onClick={() => setPreviewVideoGame(selectedGame)}
                    style={{
                      padding: '3px 10px', borderRadius: 8,
                      background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 11, fontWeight: 800
                    }}
                  >
                    <Video size={13} /> Putar Preview Video
                  </button>
                )}
              </div>
              <p style={{ margin: '6px 0', fontSize: 13, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.5 }}>
                {selectedGame.description || 'Tidak ada deskripsi.'}
              </p>

              {/* Event Organizer Specs */}
              {selectedGame.eventSpecs && (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '8px 0', fontSize: 12, background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f1f5f9', padding: '8px 12px', borderRadius: 10, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                    <Clock size={13} color="var(--cms-accent, #a78bfa)" />
                    Durasi: <strong style={{ color: 'var(--cms-text, #fff)' }}>{selectedGame.eventSpecs.estimatedDuration || '30-60 Detik'}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                    <Trophy size={13} color="#eab308" />
                    Leaderboard: <strong style={{ color: 'var(--cms-text, #fff)' }}>{selectedGame.eventSpecs.leaderboardCapacity || 'Top 10'}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                    <Monitor size={13} color="#38bdf8" />
                    Perangkat: <strong style={{ color: 'var(--cms-text, #fff)' }}>{selectedGame.eventSpecs.deviceSupport || 'Touchscreen Kiosk'}</strong>
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', flexWrap: 'wrap' }}>
                <span>Engine: <strong style={{ color: 'var(--cms-text, #fff)' }}>{selectedGame.engineType}</strong></span>
                <span>•</span>
                <span>Slug: <strong style={{ color: 'var(--cms-accent, #a78bfa)' }}>/{selectedGame.slug}</strong></span>
                <span>•</span>
                <span>Total Lisensi: <strong style={{ color: 'var(--cms-text, #fff)' }}>{selectedGameLicenses.length}</strong></span>
                {selectedGame.tags && selectedGame.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <span>Labels: {selectedGame.tags.map((t, i) => (
                      <span key={i} style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 4, background: 'rgba(124,58,237,0.15)', color: 'var(--cms-accent, #a78bfa)', fontSize: 11 }}>#{t}</span>
                    ))}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section Generator Link Klien & Multi-Branding Mandiri */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--cms-text, #fff)' }}>
                    Generator Link Klien & Multi-Branding Mandiri ({selectedGameLicenses.length})
                  </h3>
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                    background: 'rgba(124,58,237,0.18)', color: 'var(--cms-accent, #a78bfa)',
                    border: '1px solid rgba(124,58,237,0.35)'
                  }}>
                    Multi-Tenant Links
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  Setiap link memiliki URL unik serta logo brand, tema warna, tombol aksi (CTA), dan konfigurasi mandiri khusus untuk <strong style={{ color: 'var(--cms-text, #fff)' }}>{selectedGame.title}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  openAddLicenseModal({
                    clientId: '',
                    clientEmail: '',
                    clientName: '',
                    customTitle: '',
                    gameId: selectedGame.id,
                    gameTitle: selectedGame.title,
                    model: 'rental',
                    tier: 'view_only',
                    adminRole: 'master',
                    status: 'active',
                    customConfig: {
                      themeColor: selectedGame.defaultConfig?.themeColor || '#7c3aed',
                      brandName: '',
                      welcomeMessage: '',
                      ctaText: '',
                      ctaUrl: ''
                    }
                  });
                }}
                style={{
                  padding: '9px 18px', borderRadius: 10, background: 'var(--cms-accent, #7c3aed)',
                  color: '#fff', border: 'none', fontWeight: 800, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(124,58,237,0.3)'
                }}
              >
                <Plus size={14} /> Buat Link Klien Baru
              </button>
            </div>

            {/* Arsitektur Multi-Branding Callout */}
            <div style={{
              padding: '12px 16px',
              borderRadius: 14,
              background: isDarkMode ? 'rgba(124,58,237,0.08)' : '#f5f3ff',
              border: '1px solid rgba(124,58,237,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={18} color="var(--cms-accent, #8b5cf6)" />
                <div style={{ fontSize: 11.5, color: 'var(--cms-text, #fff)', lineHeight: 1.45 }}>
                  <strong>Prinsip Multi-Branding:</strong> Setiap link publik klien berjalan terisolasi di URL <code style={{ color: 'var(--cms-accent, #a78bfa)', background: 'var(--cms-input-bg)', padding: '2px 6px', borderRadius: 6 }}>/client/play/:linkId</code>. Klien dapat memiliki logo brand, warna tema, teks tombol sponsor, dan konfigurasi soal/level masing-masing tanpa saling bertabrakan.
                </div>
              </div>
            </div>

            {selectedGameLicenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--cms-card-bg, #1a1a24)', borderRadius: 16, border: '1.5px dashed var(--cms-border, rgba(255,255,255,0.15))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={40} style={{ opacity: 0.3, marginBottom: 10, color: 'var(--cms-accent, #7c3aed)', display: 'block', margin: '0 auto 10px' }} />
                <h4 style={{ margin: 0, fontSize: 15, color: 'var(--cms-text, #fff)' }}>Belum Ada Link Klien untuk Aplikasi / Game Ini</h4>
                <p style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', margin: '6px 0 16px', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                  Klik tombol <strong>"Buat Link Klien Baru"</strong> di atas untuk membuat URL baru lengkap dengan logo brand sponsor, warna tombol kustom, dan izin admin mandiri.
                </p>
                <button
                  onClick={() => {
                    openAddLicenseModal({
                      clientId: '',
                      clientEmail: '',
                      clientName: '',
                      customTitle: '',
                      gameId: selectedGame.id,
                      gameTitle: selectedGame.title,
                      model: 'rental',
                      tier: 'view_only',
                      adminRole: 'master',
                      status: 'active',
                      customConfig: {
                        themeColor: selectedGame.defaultConfig?.themeColor || '#7c3aed',
                        brandName: '',
                        welcomeMessage: '',
                        ctaText: '',
                        ctaUrl: ''
                      }
                    });
                  }}
                  style={{
                    padding: '8px 18px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)',
                    color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(124,58,237,0.3)'
                  }}
                >
                  + Buat Link Pertama Sekarang
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedGameLicenses.map((lic) => {
                  const isLifetime = lic.model === 'lifetime';
                  const isRental = lic.model === 'rental';
                  const isExpired = isRental && lic.expiryDate && lic.expiryDate < Date.now();
                  const themeColor = lic.customConfig?.themeColor || selectedGame.defaultConfig?.themeColor || '#7c3aed';
                  const logoUrl = lic.customConfig?.logoUrl;
                  const publicUrl = `${window.location.origin}/client/play/${lic.id}`;

                  return (
                    <div 
                      key={lic.id} 
                      style={{ 
                        background: 'var(--cms-card-bg, #1a1a24)', padding: '18px 20px', borderRadius: 18, 
                        border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
                        display: 'flex', flexDirection: 'column', gap: 14,
                        boxShadow: isDarkMode ? '0 4px 14px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Baris Atas: Info Klien, Logo Brand & Status Lisensi */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: '280px' }}>
                          {/* Logo Brand Avatar Klien */}
                          <div style={{ 
                            width: 48, height: 48, borderRadius: 14, 
                            background: isDarkMode ? 'rgba(0,0,0,0.4)' : '#f1f5f9',
                            border: `2px solid ${themeColor}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', flexShrink: 0,
                            boxShadow: `0 2px 8px ${themeColor}33`
                          }}>
                            {logoUrl ? (
                              <img src={logoUrl} alt={lic.clientName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: 18, fontWeight: 900, color: themeColor }}>
                                {(lic.clientName || 'K')[0].toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--cms-text, #fff)' }}>
                                {lic.clientName}
                              </h4>
                              {lic.customTitle && (
                                <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 800, background: 'rgba(56,189,248,0.12)', padding: '2px 8px', borderRadius: 6 }}>
                                  "{lic.customTitle}"
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>
                                ({lic.clientEmail || lic.clientId})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                              {(() => {
                                const role = lic.adminRole || (lic.tier === 'view_only' ? 'view_only' : lic.tier === 'plus' ? 'supplier' : 'master');
                                if (role === 'master') {
                                  return (
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <ShieldCheck size={11} /> Admin Master
                                    </span>
                                  );
                                }
                                if (role === 'supplier') {
                                  return (
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(14,165,233,0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <Layers size={11} /> Admin Supplier
                                    </span>
                                  );
                                }
                                return (
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.2)', color: '#34d399', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Play size={10} fill="#34d399" /> View Only
                                  </span>
                                );
                              })()}

                              <span style={{ 
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                                background: isLifetime ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                                color: isLifetime ? '#34d399' : '#60a5fa',
                                display: 'flex', alignItems: 'center', gap: 4
                              }}>
                                {isLifetime ? <ShieldCheck size={11} /> : <Clock size={11} />}
                                {isLifetime ? 'Beli Putus' : 'Sewa Berjangka'}
                              </span>

                              {/* Warna Tema Brand Indicator */}
                              <span style={{
                                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                                background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                color: 'var(--cms-text, #fff)', display: 'flex', alignItems: 'center', gap: 4
                              }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: themeColor }} />
                                {themeColor}
                              </span>

                              {/* CTA Button Badge */}
                              {lic.customConfig?.ctaText && (
                                <span style={{
                                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                                  background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
                                  display: 'flex', alignItems: 'center', gap: 3
                                }}>
                                  <ExternalLink size={10} /> CTA: "{lic.customConfig.ctaText}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Masa Berlaku */}
                        <div style={{ textAlign: 'right', minWidth: '130px' }}>
                          <div style={{ fontSize: 12, color: isExpired ? '#ef4444' : 'var(--cms-text-muted, #94a3b8)' }}>
                            {isLifetime ? 'Akses Permanen' : (
                              lic.expiryDate ? `Kedaluwarsa: ${new Date(lic.expiryDate).toLocaleDateString('id-ID')}` : 'Status Aktif'
                            )}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 2, color: isExpired ? '#ef4444' : '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            {isExpired ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                            {isExpired ? 'KEDALUWARSA' : 'LINK AKTIF'}
                          </div>
                        </div>
                      </div>

                      {/* Baris Tengah: Tautan Publik Unik Klien */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-input-bg, rgba(0,0,0,0.3))',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: '220px' }}>
                          <KeyRound size={14} color="var(--cms-accent, #a78bfa)" />
                          <span style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', fontWeight: 700 }}>URL Klien:</span>
                          <code style={{ fontSize: 12, color: 'var(--cms-accent, #c4b5fd)', wordBreak: 'break-all', fontFamily: 'monospace', fontWeight: 700 }}>
                            {publicUrl}
                          </code>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(publicUrl);
                              notify?.(`Link unik untuk ${lic.clientName} berhasil disalin!`, 'success');
                            }}
                            style={{
                              padding: '5px 12px', borderRadius: 8,
                              background: 'var(--cms-accent, #7c3aed)',
                              color: '#fff', border: 'none',
                              fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Copy size={12} /> Salin Link
                          </button>
                          <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 10px', borderRadius: 8,
                              background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                              color: 'var(--cms-text, #fff)', border: 'none',
                              fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none'
                            }}
                          >
                            <ExternalLink size={12} /> Buka
                          </a>
                        </div>
                      </div>

                      {/* Baris Bawah: Tombol Aksi Kontrol & Manajemen */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.06))' }}>
                        {/* Live Test Iframe untuk Lisensi Klien Ini */}
                        <button
                          onClick={() => {
                            setLiveTestGame(selectedGame);
                            setLiveTestLicense(lic);
                            setLiveTestConfig(lic.customConfig || selectedGame.defaultConfig || { themeColor: '#7c3aed' });
                          }}
                          style={{
                            padding: '7px 12px', borderRadius: 9, background: 'rgba(59,130,246,0.15)',
                            color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <Monitor size={13} />
                          Uji Coba Tampilan
                        </button>

                        {/* Atur Desain Branding Klien */}
                        <button
                          onClick={() => openEditLicenseModal(lic)}
                          style={{
                            padding: '7px 14px', borderRadius: 9,
                            background: 'rgba(124,58,237,0.16)',
                            color: 'var(--cms-accent, #a78bfa)',
                            border: '1px solid rgba(124,58,237,0.35)',
                            cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: 5
                          }}
                          title="Atur Logo, Warna Tema, CTA, & Level Klien Ini"
                        >
                          <Palette size={13} />
                          Atur Multi-Branding
                        </button>

                        {/* Cetak Panduan PDF Klien Ini */}
                        <button
                          onClick={() => printGameSetupPdf(selectedGame, lic)}
                          style={{
                            padding: '7px 12px', borderRadius: 9, background: 'rgba(16,185,129,0.15)',
                            color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <FileCode size={13} />
                          Cetak SOP
                        </button>

                        {/* Auto Webhook Backup to Drive & Sheets */}
                        <button
                          onClick={() => handleTriggerWebhookBackup(lic)}
                          disabled={isBackingUp}
                          style={{
                            padding: '7px 12px', borderRadius: 9, background: 'rgba(168,85,247,0.15)',
                            color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <UploadCloud size={13} />
                          Cadangkan Webhook
                        </button>

                        {/* Offline ZIP Download (Lifetime only) */}
                        {isLifetime && (
                          <button
                            onClick={() => handleDownloadZip(lic)}
                            disabled={downloadingGameId === lic.id}
                            style={{
                              padding: '7px 13px', borderRadius: 9, background: 'rgba(16,185,129,0.2)',
                              color: '#34d399', border: '1px solid rgba(16,185,129,0.4)', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                              display: 'flex', alignItems: 'center', gap: 5
                            }}
                          >
                            <Download size={13} />
                            {downloadingGameId === lic.id ? 'Mengompres...' : 'Paket Offline ZIP'}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteLicense(lic.id, lic.clientName)}
                          style={{ padding: '7px 10px', borderRadius: 9, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                          title="Hapus Link Ini"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL GAME */}
      {isEditingGame && editingGame && (
        <div 
          onClick={handleCloseGameModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'var(--cms-card-bg, #181824)', borderRadius: 20, maxWidth: '550px', width: '100%', padding: 24, 
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 16px', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--cms-text, #fff)' }}>
                {editingGame.createdAt ? 'Edit Instance Game' : 'Tambah Instance Game Baru'}
              </h2>
              <button
                type="button"
                onClick={handleCloseGameModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                  color: 'var(--cms-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveGame} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Judul Game *</label>
                <input
                  type="text"
                  required
                  value={editingGame.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    setEditingGame(prev => ({ ...prev, title, slug: prev?.slug || slug }));
                  }}
                  placeholder="Contoh: Space Invaders Pro / Kalkulator ROI Bisnis"
                  style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Slug URL</label>
                <input
                  type="text"
                  required
                  value={editingGame.slug || ''}
                  onChange={(e) => setEditingGame(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="simulator-roi-bisnis"
                  style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 6 }}>Tipe Engine / Aplikasi</label>
                <CustomDropdown
                  value={editingGame.engineType || 'HTML5 Single File (Event Activation)'}
                  onChange={(val) => setEditingGame(prev => ({ ...prev, engineType: val as any }))}
                  options={[
                    {
                      value: 'HTML5 Single File (Event Activation)',
                      label: 'HTML5 Single File (Event Activation)',
                      desc: 'Engine offline murni siap pakai, responsif, dan ringan tanpa dependensi luar'
                    },
                    {
                      value: 'Interactive Web Application (React / HTML / JS)',
                      label: 'Interactive Web Application (Form, Utility, Tool)',
                      desc: 'Aplikasi web interaktif, form lead-gen, kalkulator, & simulator bisnis'
                    },
                    {
                      value: 'Touchscreen Kiosk Widget (Exhibition Display)',
                      label: 'Touchscreen Kiosk Widget (Exhibition Display)',
                      desc: 'Tampilan interaktif full-screen khusus perangkat layar sentuh event booth'
                    }
                  ]}
                />
              </div>

              {/* Upload Thumbnail / Galeri (Otomatis ke Cloudinary) */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 6 }}>
                  Cover / Thumbnail Game (Cloudinary)
                </label>
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleThumbnailFileUpload}
                  style={{ display: 'none' }}
                />

                {/* Thumbnail Preview & Action Buttons */}
                <div style={{ 
                  background: isDarkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)', 
                  border: '1px dashed var(--cms-border, rgba(255,255,255,0.2))', 
                  borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' 
                }}>
                  <div style={{ 
                    width: 72, height: 72, borderRadius: 14, overflow: 'hidden', 
                    background: isDarkMode ? '#252538' : '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' 
                  }}>
                    {editingGame.thumbnailUrl ? (
                      <img 
                        src={editingGame.thumbnailUrl} 
                        alt="Preview Cover" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <LayoutGrid size={28} style={{ opacity: 0.4, color: 'var(--cms-accent, #7c3aed)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={isUploadingThumbnail}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: '8px 16px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)',
                          color: '#fff', border: 'none', fontWeight: 800, fontSize: 12,
                          cursor: isUploadingThumbnail ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                          boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                        }}
                      >
                        {isUploadingThumbnail ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {isUploadingThumbnail ? 'Mengunggah...' : 'Upload dari Komputer'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsGalleryOpen(true)}
                        style={{
                          padding: '8px 16px', borderRadius: 100, 
                          background: 'var(--cms-card-bg, #1a1a24)',
                          color: 'var(--cms-text, #fff)', 
                          border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', 
                          fontWeight: 700, fontSize: 12,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <ImageIcon size={14} /> Buka Galeri Media
                      </button>

                      {editingGame.thumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingGame(prev => ({ ...prev, thumbnailUrl: '' }))}
                          style={{
                            padding: '8px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.15)',
                            color: '#ef4444', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginTop: 6 }}>
                      {editingGame.thumbnailUrl ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Thumbnail terhubung ke Cloudinary
                        </span>
                      ) : (
                        'Pilih gambar langsung dari komputer atau arsip media Cloudinary.'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Tier & Kategori Utama */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 6 }}>
                    Tier Akses / Harga
                  </label>
                  <CustomDropdown
                    value={editingGame.pricingTier || 'basic'}
                    onChange={(val) => setEditingGame(prev => ({ ...prev, pricingTier: val as GamePricingTier }))}
                    options={[
                      { value: 'free', label: 'FREE (Gratis)', desc: 'Dapat diakses / dimainkan bebas tanpa lisensi' },
                      { value: 'basic', label: 'BASIC', desc: 'Akses sewa standar aktivasi event' },
                      { value: 'plus', label: 'PLUS', desc: 'Hak ubah layout puzzle & game level' },
                      { value: 'premium', label: 'PREMIUM', desc: 'Kustomisasi visual penuh & opsi beli putus' }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 6 }}>
                    Kategori Utama
                  </label>
                  <input
                    type="text"
                    value={editingGame.category || ''}
                    onChange={(e) => setEditingGame(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Contoh: Exhibition, Corporate, E-Sport"
                    style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Dynamic Labels / Tags Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
                    Label / Tags Event (Bisa pilih lebih dari satu)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManagingTags(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--cms-accent, #a78bfa)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    + Kelola Master Label
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 16, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                  {availableTags.map((tag) => {
                    const isSelected = (editingGame.tags || []).includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = editingGame.tags || [];
                          const updated = isSelected ? current.filter(t => t !== tag) : [...current, tag];
                          setEditingGame(prev => ({ ...prev, tags: updated }));
                        }}
                        style={{
                          padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                          background: isSelected ? 'var(--cms-accent, #7c3aed)' : isDarkMode ? 'rgba(255,255,255,0.07)' : '#e2e8f0',
                          color: isSelected ? '#fff' : 'var(--cms-text, #fff)',
                          border: `1px solid ${isSelected ? 'transparent' : 'var(--cms-border, rgba(255,255,255,0.15))'}`,
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: isSelected ? '#fff' : 'transparent',
                          border: isSelected ? 'none' : '1.5px solid currentColor',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isSelected ? (
                            <Check size={9} color="var(--cms-accent, #7c3aed)" strokeWidth={3.5} />
                          ) : (
                            <Plus size={8} strokeWidth={2.5} />
                          )}
                        </div>
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* URL Video Pratinjau (Gameplay Preview) */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>
                  URL Video Pratinjau Gameplay (MP4 / WebM / Cloudinary)
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="url"
                    value={editingGame.previewVideoUrl || ''}
                    onChange={(e) => setEditingGame(prev => ({ ...prev, previewVideoUrl: e.target.value }))}
                    placeholder="https://res.cloudinary.com/.../video.mp4"
                    style={{ flex: 1, height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                  />
                  {editingGame.previewVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewVideoGame(editingGame as GameInstance)}
                      style={{ padding: '0 18px', height: 42, borderRadius: 100, background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}
                    >
                      Tes Video
                    </button>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginTop: 4 }}>
                  Video ini akan diputar mulus saat pengunjung menekan tombol "Preview Video" di katalog publik.
                </span>
              </div>

              {/* Spesifikasi Teknis Event Organizer (EO) */}
              <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text, #fff)', display: 'block', marginBottom: 8 }}>
                  Kebutuhan Layar & Perangkat Acara (Untuk Panitia / EO)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 3 }}>Lama Main Tiap Orang</label>
                    <input
                      type="text"
                      value={editingGame.eventSpecs?.estimatedDuration || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingGame(prev => ({
                          ...prev,
                          eventSpecs: { ...(prev?.eventSpecs || {}), estimatedDuration: val }
                        }));
                      }}
                      placeholder="Contoh: 30 - 60 Detik / Pemain"
                      style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 3 }}>Peringkat Skor (Leaderboard)</label>
                    <input
                      type="text"
                      value={editingGame.eventSpecs?.leaderboardCapacity || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingGame(prev => ({
                          ...prev,
                          eventSpecs: { ...(prev?.eventSpecs || {}), leaderboardCapacity: val }
                        }));
                      }}
                      placeholder="Contoh: Top 10 / 50 Peserta"
                      style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 3 }}>Jenis Layar yang Didukung</label>
                  <input
                    type="text"
                    value={editingGame.eventSpecs?.deviceSupport || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingGame(prev => ({
                        ...prev,
                        eventSpecs: { ...(prev?.eventSpecs || {}), deviceSupport: val }
                      }));
                    }}
                    placeholder="Contoh: Layar Sentuh Kiosk, Tablet iPad/Android & Laptop"
                    style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              {/* FITUR BARU: SPESIFIKASI INPUT & KONTROL SENSOR (RAMAH ORANG AWAM) */}
              <div style={{ background: isDarkMode ? 'rgba(124,58,237,0.06)' : '#faf5ff', padding: 16, borderRadius: 16, border: '1px solid rgba(124,58,237,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Settings2 size={16} color="var(--cms-accent, #a78bfa)" />
                    <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-accent, #a78bfa)' }}>
                      Kebutuhan Sensor & Kontrol
                    </label>
                    
                  </div>
                </div>

                {/* Checkboxes Kebutuhan Sensor (Redesain Lingkaran + Pill Harmonis) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
                  {/* Sensor 1: Kamera */}
                  {(() => {
                    const isChecked = editingGame.inputSpecs?.requireCamera || false;
                    return (
                      <div
                        onClick={() => {
                          setEditingGame(prev => ({
                            ...prev,
                            inputSpecs: { ...(prev?.inputSpecs || {}), requireCamera: !isChecked }
                          }));
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 100,
                          background: isChecked 
                            ? (isDarkMode ? 'rgba(56, 189, 248, 0.16)' : '#e0f2fe') 
                            : (isDarkMode ? 'rgba(0,0,0,0.25)' : '#fff'),
                          border: isChecked ? '1px solid #38bdf8' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          cursor: 'pointer', fontSize: 12, transition: 'all 0.2s ease', userSelect: 'none'
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: isChecked ? '#38bdf8' : 'transparent',
                          border: isChecked ? 'none' : '2px solid var(--cms-border, rgba(255,255,255,0.3))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0
                        }}>
                          {isChecked && <Check size={12} color="#000" strokeWidth={3} />}
                        </div>
                        <Camera size={14} color="#38bdf8" />
                        <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--cms-text, #fff)' : 'var(--cms-text-muted, #94a3b8)' }}>
                          Kamera / Webcam (AR)
                        </span>
                      </div>
                    );
                  })()}

                  {/* Sensor 2: Mikrofon */}
                  {(() => {
                    const isChecked = editingGame.inputSpecs?.requireMicrophone || false;
                    return (
                      <div
                        onClick={() => {
                          setEditingGame(prev => ({
                            ...prev,
                            inputSpecs: { ...(prev?.inputSpecs || {}), requireMicrophone: !isChecked }
                          }));
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 100,
                          background: isChecked 
                            ? (isDarkMode ? 'rgba(244, 63, 94, 0.16)' : '#ffe4e6') 
                            : (isDarkMode ? 'rgba(0,0,0,0.25)' : '#fff'),
                          border: isChecked ? '1px solid #f43f5e' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          cursor: 'pointer', fontSize: 12, transition: 'all 0.2s ease', userSelect: 'none'
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: isChecked ? '#f43f5e' : 'transparent',
                          border: isChecked ? 'none' : '2px solid var(--cms-border, rgba(255,255,255,0.3))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0
                        }}>
                          {isChecked && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                        <Mic size={14} color="#f43f5e" />
                        <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--cms-text, #fff)' : 'var(--cms-text-muted, #94a3b8)' }}>
                          Mikrofon (Suara)
                        </span>
                      </div>
                    );
                  })()}

                  {/* Sensor 3: Sentuhan Layar */}
                  {(() => {
                    const isChecked = editingGame.inputSpecs?.requireTouchTap !== false;
                    return (
                      <div
                        onClick={() => {
                          setEditingGame(prev => ({
                            ...prev,
                            inputSpecs: { ...(prev?.inputSpecs || {}), requireTouchTap: !isChecked }
                          }));
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 100,
                          background: isChecked 
                            ? (isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#d1fae5') 
                            : (isDarkMode ? 'rgba(0,0,0,0.25)' : '#fff'),
                          border: isChecked ? '1px solid #10b981' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          cursor: 'pointer', fontSize: 12, transition: 'all 0.2s ease', userSelect: 'none'
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: isChecked ? '#10b981' : 'transparent',
                          border: isChecked ? 'none' : '2px solid var(--cms-border, rgba(255,255,255,0.3))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0
                        }}>
                          {isChecked && <Check size={12} color="#000" strokeWidth={3} />}
                        </div>
                        <MousePointer size={14} color="#10b981" />
                        <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--cms-text, #fff)' : 'var(--cms-text-muted, #94a3b8)' }}>
                          Sentuhan Layar / Mouse
                        </span>
                      </div>
                    );
                  })()}

                  {/* Sensor 4: Keyboard Arcade */}
                  {(() => {
                    const isChecked = editingGame.inputSpecs?.requireKeyboard || false;
                    return (
                      <div
                        onClick={() => {
                          setEditingGame(prev => ({
                            ...prev,
                            inputSpecs: { ...(prev?.inputSpecs || {}), requireKeyboard: !isChecked }
                          }));
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 100,
                          background: isChecked 
                            ? (isDarkMode ? 'rgba(168, 85, 247, 0.16)' : '#f3e8ff') 
                            : (isDarkMode ? 'rgba(0,0,0,0.25)' : '#fff'),
                          border: isChecked ? '1px solid #a855f7' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          cursor: 'pointer', fontSize: 12, transition: 'all 0.2s ease', userSelect: 'none'
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: isChecked ? '#a855f7' : 'transparent',
                          border: isChecked ? 'none' : '2px solid var(--cms-border, rgba(255,255,255,0.3))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0
                        }}>
                          {isChecked && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                        <Keyboard size={14} color="#a855f7" />
                        <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--cms-text, #fff)' : 'var(--cms-text-muted, #94a3b8)' }}>
                          Keyboard / Arcade
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Pengaturan Tambahan: Durasi, Target Skor, Teks Instruksi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 3 }}>
                      Waktu Main per Ronde (Detik)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={editingGame.inputSpecs?.sessionDurationSec || 45}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 45;
                        setEditingGame(prev => ({
                          ...prev,
                          inputSpecs: { ...(prev?.inputSpecs || {}), sessionDurationSec: val }
                        }));
                      }}
                      style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 3 }}>
                      Target Skor Tertinggi
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={editingGame.inputSpecs?.maxTargetScore || 1000}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1000;
                        setEditingGame(prev => ({
                          ...prev,
                          inputSpecs: { ...(prev?.inputSpecs || {}), maxTargetScore: val }
                        }));
                      }}
                      style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 3 }}>
                    Petunjuk Singkat untuk Pemain (Ditampilkan di layar sebelum main)
                  </label>
                  <input
                    type="text"
                    value={editingGame.inputSpecs?.instructionText || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingGame(prev => ({
                        ...prev,
                        inputSpecs: { ...(prev?.inputSpecs || {}), instructionText: val }
                      }));
                    }}
                    placeholder="Contoh: Sentuh koin emas secepatnya dan hindari bom rintangan!"
                    style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Deskripsi Game</label>
                <textarea
                  rows={3}
                  value={editingGame.description || ''}
                  onChange={(e) => setEditingGame(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Keterangan singkat game..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 16, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleCloseGameModal}
                  style={{ padding: '9px 20px', borderRadius: 100, background: 'transparent', border: '1px solid var(--cms-border, rgba(255,255,255,0.2))', color: 'var(--cms-text, #fff)', cursor: 'pointer', fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 24px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
                >
                  Simpan Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LISENSI KLIEN */}
      {isEditingLicense && editingLicense && (
        <div 
          onClick={handleCloseLicenseModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'var(--cms-card-bg, #181824)', borderRadius: 20, maxWidth: '600px', width: '100%', padding: 24, 
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, margin: '0 0 16px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: 'var(--cms-text, #ffffff)' }}>
                  {editingLicense.createdAt ? 'Edit Link & Multi-Branding Klien' : 'Generator Link Klien Baru (Multi-Branding)'}
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  Konfigurasi identitas link, branding logo & warna tema, tombol CTA, dan hak akses admin terisolasi untuk klien ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseLicenseModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                  color: 'var(--cms-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveLicense} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Aplikasi Master Terhubung</label>
                <input
                  type="text"
                  disabled
                  value={editingLicense.gameTitle || selectedGame?.title || 'Game'}
                  style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(255,255,255,0.05))', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', color: 'var(--cms-text-muted, #94a3b8)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Nama Klien / Brand Sponsor *</label>
                  <input
                    type="text"
                    required
                    value={editingLicense.clientName || ''}
                    onChange={(e) => setEditingLicense(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="PT Sinar Maju / Bank BCA / Event Fest"
                    style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Email / ID Klien Unik *</label>
                  <input
                    type="text"
                    required
                    value={editingLicense.clientEmail || editingLicense.clientId || ''}
                    onChange={(e) => setEditingLicense(prev => ({ ...prev, clientEmail: e.target.value, clientId: e.target.value }))}
                    placeholder="bca-expo-2026 / klien@mail.com"
                    style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Judul Kustom Aplikasi pada Link Ini */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>
                  Judul Khusus Aplikasi pada Link Ini (Opsional)
                </label>
                <input
                  type="text"
                  value={editingLicense.customTitle || ''}
                  onChange={(e) => setEditingLicense(prev => ({ ...prev, customTitle: e.target.value }))}
                  placeholder={`Default: ${editingLicense.gameTitle || selectedGame?.title || 'Judul Aplikasi'}`}
                  style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* PILIHAN MODE AKSES GAME ADMIN & KLIEN (3 PERAN UTAMA) */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text, #fff)', display: 'block', marginBottom: 6 }}>
                  Peran & Hak Akses Game
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[
                    {
                      role: 'master' as const,
                      label: 'Admin Master',
                      desc: 'Full Branding, Data Game, & Kelola Supplier',
                      icon: <ShieldCheck size={16} />,
                      color: '#7c3aed'
                    },
                    {
                      role: 'supplier' as const,
                      label: 'Admin Supplier',
                      desc: 'Hanya Atur Tampilan & Data Level Game',
                      icon: <Layers size={16} />,
                      color: '#0ea5e9'
                    },
                    {
                      role: 'view_only' as const,
                      label: 'View Only',
                      desc: 'Hanya Memainkan Game Tanpa Ubah Pengaturan',
                      icon: <Play size={16} />,
                      color: '#10b981'
                    }
                  ].map(opt => {
                    const currentRole = editingLicense.adminRole || (editingLicense.tier === 'view_only' ? 'view_only' : editingLicense.tier === 'plus' ? 'supplier' : 'master');
                    const isSelected = currentRole === opt.role;
                    return (
                      <div
                        key={opt.role}
                        onClick={() => {
                          setEditingLicense(prev => ({
                            ...prev,
                            adminRole: opt.role,
                            tier: opt.role === 'view_only' ? 'view_only' : opt.role === 'supplier' ? 'plus' : 'premium'
                          }));
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 14,
                          background: isSelected 
                            ? (isDarkMode ? `${opt.color}22` : `${opt.color}15`) 
                            : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff'),
                          border: isSelected ? `1.5px solid ${opt.color}` : '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: opt.color, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12 }}>
                            {opt.icon} {opt.label}
                          </span>
                          <div style={{
                            width: 14, height: 14, borderRadius: '50%',
                            border: isSelected ? `4px solid ${opt.color}` : '1.5px solid var(--cms-border, rgba(255,255,255,0.2))',
                            background: isSelected ? '#fff' : 'transparent',
                            transition: 'all 0.15s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
                          {opt.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MODEL BISNIS & MASA BERLAKU SEWA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 6 }}>Model Penyerahan Game</label>
                  <CustomDropdown
                    value={editingLicense.model || 'rental'}
                    onChange={(val) => setEditingLicense(prev => ({ ...prev, model: val as LicenseModel }))}
                    options={[
                      {
                        value: 'rental',
                        label: 'Sewa Berjangka (Online Link)',
                        desc: 'Bisa dimainkan online selama masa aktif sewa'
                      },
                      {
                        value: 'lifetime',
                        label: 'Beli Putus (Paket Offline ZIP)',
                        desc: 'Download paket ZIP mandiri untuk diputar offline tanpa internet'
                      }
                    ]}
                  />
                </div>

                {editingLicense.model === 'rental' ? (
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Durasi Sewa Acara (Hari)</label>
                    <input
                      type="number"
                      min="1"
                      defaultValue={30}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 30;
                        setEditingLicense(prev => ({ ...prev, expiryDate: Date.now() + days * 24 * 60 * 60 * 1000 }));
                      }}
                      style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', boxSizing: 'border-box', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>Status Lisensi</label>
                    <div style={{ width: '100%', height: 42, padding: '0 16px', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 800 }}>
                      <CheckCircle2 size={14} style={{ marginRight: 6 }} /> Masa Aktif Permanen (Lifetime)
                    </div>
                  </div>
                )}
              </div>

              {/* ── BAGIAN 1: PENGATURAN TAMPILAN & BRANDING (Untuk Master & Supplier) ── */}
              {editingLicense.adminRole !== 'view_only' && (
                <div style={{ marginTop: 4, padding: 16, borderRadius: 16, background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Palette size={15} color="var(--cms-accent, #7c3aed)" />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)' }}>
                      Tampilan &amp; Branding Klien:
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', marginLeft: 'auto' }}>
                      Tiap klien memiliki tampilan logo &amp; warna tersendiri
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={licenseLogoInputRef}
                    accept="image/*"
                    onChange={handleLicenseLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    ref={licenseHeroInputRef}
                    accept="image/*"
                    onChange={handleLicenseHeroUpload}
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Logo Brand Upload/Gallery */}
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #cbd5e1)' }}>Logo Brand / Sponsor Klien</span>
                        {editingLicense.customConfig?.logoUrl && (
                          <span style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={11} /> Terpasang
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          disabled={isUploadingLogo}
                          onClick={() => licenseLogoInputRef.current?.click()}
                          style={{
                            padding: '7px 16px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)',
                            color: '#fff', border: 'none', fontWeight: 800, fontSize: 11,
                            cursor: isUploadingLogo ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                          }}
                        >
                          {isUploadingLogo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          {isUploadingLogo ? 'Mengunggah...' : 'Upload Logo'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryTarget('license_logo');
                            setIsGalleryOpen(true);
                          }}
                          style={{
                            padding: '7px 16px', borderRadius: 100, 
                            background: 'var(--cms-card-bg, #1a1a24)',
                            color: 'var(--cms-text, #fff)', 
                            border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', 
                            fontWeight: 700, fontSize: 11,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <ImageIcon size={12} /> Buka Galeri
                        </button>
                        {editingLicense.customConfig?.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingLicense(prev => ({
                              ...prev,
                              customConfig: { ...(prev?.customConfig || {}), logoUrl: '' }
                            }))}
                            style={{
                              padding: '7px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.15)',
                              color: '#ef4444', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Background Hero Upload/Gallery */}
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #cbd5e1)' }}>Background Hero Layar Game</span>
                        {editingLicense.customConfig?.heroBackgroundUrl && (
                          <span style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={11} /> Terpasang
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          disabled={isUploadingHero}
                          onClick={() => licenseHeroInputRef.current?.click()}
                          style={{
                            padding: '7px 16px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)',
                            color: '#fff', border: 'none', fontWeight: 800, fontSize: 11,
                            cursor: isUploadingHero ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                          }}
                        >
                          {isUploadingHero ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          {isUploadingHero ? 'Mengunggah...' : 'Upload Background'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryTarget('license_hero');
                            setIsGalleryOpen(true);
                          }}
                          style={{
                            padding: '7px 16px', borderRadius: 100, 
                            background: 'var(--cms-card-bg, #1a1a24)',
                            color: 'var(--cms-text, #fff)', 
                            border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', 
                            fontWeight: 700, fontSize: 11,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <ImageIcon size={12} /> Buka Galeri
                        </button>
                        {editingLicense.customConfig?.heroBackgroundUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingLicense(prev => ({
                              ...prev,
                              customConfig: { ...(prev?.customConfig || {}), heroBackgroundUrl: '' }
                            }))}
                            style={{
                              padding: '7px 14px', borderRadius: 100, background: 'rgba(239,68,68,0.15)',
                              color: '#ef4444', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Warna Utama / Aksen Klien */}
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #cbd5e1)' }}>Warna Brand / Tombol Game</span>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: editingLicense.customConfig?.themeColor || '#7c3aed', fontWeight: 800 }}>
                          {editingLicense.customConfig?.themeColor || '#7c3aed'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="color"
                          value={editingLicense.customConfig?.themeColor || '#7c3aed'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingLicense(prev => ({
                              ...prev,
                              customConfig: { ...(prev?.customConfig || {}), themeColor: val }
                            }));
                          }}
                          style={{ width: 44, height: 36, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'transparent' }}
                        />
                        <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                          Pilih warna brand klien untuk mewarnai tombol, skor, dan aksen permainan.
                        </span>
                      </div>
                    </div>

                    {/* Musik Latar BGM Kustom */}
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #cbd5e1)', display: 'block', marginBottom: 4 }}>
                        Musik Latar Game (BGM) / Sound Kustom (MP3 URL)
                      </label>
                      <input
                        type="url"
                        value={editingLicense.customConfig?.soundtrackUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingLicense(prev => ({
                            ...prev,
                            customConfig: { ...(prev?.customConfig || {}), soundtrackUrl: val }
                          }));
                        }}
                        placeholder="https://res.cloudinary.com/.../audio.mp3"
                        style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>

                    {/* Pesan Sambutan Kustom Klien */}
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #cbd5e1)', display: 'block', marginBottom: 4 }}>
                        Pesan Sambutan / Tagline Klien pada Layar Awal
                      </label>
                      <input
                        type="text"
                        value={editingLicense.customConfig?.welcomeMessage || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingLicense(prev => ({
                            ...prev,
                            customConfig: { ...(prev?.customConfig || {}), welcomeMessage: val }
                          }));
                        }}
                        placeholder="Contoh: Selamat Datang di Booth Bank BCA! Ikuti kuis dan menangkan doorprize."
                        style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>

                    {/* Tombol Call-to-Action (CTA) Klien */}
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <ExternalLink size={13} color="var(--cms-accent, #7c3aed)" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #cbd5e1)' }}>Tombol Aksi (CTA) Klien / Sponsor</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>
                            Teks Tombol CTA
                          </label>
                          <input
                            type="text"
                            value={editingLicense.customConfig?.ctaText || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingLicense(prev => ({
                                ...prev,
                                customConfig: { ...(prev?.customConfig || {}), ctaText: val }
                              }));
                            }}
                            placeholder="Contoh: Kunjungi Website Kami / Klaim Promo"
                            style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 11.5, boxSizing: 'border-box', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 4 }}>
                            Tautan URL Tujuan CTA
                          </label>
                          <input
                            type="url"
                            value={editingLicense.customConfig?.ctaUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingLicense(prev => ({
                                ...prev,
                                customConfig: { ...(prev?.customConfig || {}), ctaUrl: val }
                              }));
                            }}
                            placeholder="https://sponsor.com/event"
                            style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 11.5, boxSizing: 'border-box', outline: 'none' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Webhook Khusus Klien Ini */}
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', padding: 12, borderRadius: 14, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text, #cbd5e1)', display: 'block', marginBottom: 4 }}>
                        Webhook Google Apps Script / Sheet Khusus Klien (Opsional)
                      </label>
                      <input
                        type="url"
                        value={editingLicense.customConfig?.webhookUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingLicense(prev => ({
                            ...prev,
                            customConfig: { ...(prev?.customConfig || {}), webhookUrl: val }
                          }));
                        }}
                        placeholder="https://script.google.com/macros/s/.../exec (Khusus data link ini)"
                        style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── BAGIAN 2: DATA LEVEL & PUZZLE (Untuk Admin Master & Admin Supplier) ── */}
              {editingLicense.adminRole !== 'view_only' && (
                <div style={{ padding: 16, borderRadius: 16, background: isDarkMode ? 'rgba(14,165,233,0.06)' : '#f0f9ff', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Code size={15} color="#0ea5e9" />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0ea5e9' }}>
                      Data Level &amp; Tantangan Kustom (Supplier / Level Designer):
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)', margin: '0 0 8px' }}>
                    Konfigurasi JSON level, pertanyaan kuis trivia, letak rintangan, atau target puzzle khusus klien ini.
                  </p>
                  <textarea
                    rows={4}
                    value={editingLicense.customConfig?.customLevelJson || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingLicense(prev => ({
                        ...prev,
                        customConfig: { ...(prev?.customConfig || {}), customLevelJson: val }
                      }));
                    }}
                    placeholder={`{\n  "level1": { "targetScore": 500, "speed": 1.2 },\n  "questions": [{ "q": "Siapa pendiri brand?", "a": ["A", "B", "C"], "correct": 0 }]\n}`}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 12,
                      background: isDarkMode ? '#0d0d14' : '#fff',
                      border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                      color: 'var(--cms-text, #fff)', fontFamily: 'monospace', fontSize: 11.5,
                      outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* ── BAGIAN 3: INFO KHUSUS VIEW ONLY ── */}
              {editingLicense.adminRole === 'view_only' && (
                <div style={{ padding: 16, borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Play size={18} fill="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>Mode Siap Main Langsung (View Only)</div>
                    <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted, #94a3b8)', marginTop: 2 }}>
                      Akun klien ini hanya akan mendapatkan link untuk memainkan game di kiosk event, tanpa izin mengubah konfigurasi warna, logo, atau level permainan.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={handleCloseLicenseModal}
                  style={{ padding: '9px 20px', borderRadius: 100, background: 'transparent', border: '1px solid var(--cms-border, rgba(255,255,255,0.2))', color: 'var(--cms-text, #fff)', cursor: 'pointer', fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 24px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
                >
                  Simpan Lisensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POP-UP TEMPLATE PROMPT AI (STRUKTUR LAYAR EVENT) */}
      {aiPromptGame && (
        <div 
          onClick={() => setAiPromptGame(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'var(--cms-card-bg, #161622)', borderRadius: 20, maxWidth: '720px', width: '100%', padding: 24, 
              border: '1.5px solid rgba(234, 179, 8, 0.4)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={20} fill="#eab308" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text, #fff)' }}>
                    Prompt AI Game: {aiPromptGame.title}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
                    Salin template instruksi lengkap ini ke AI (ChatGPT / Claude / Gemini) untuk generate kode HTML5 single-file event
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiPromptGame(null)}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--cms-card-bg, #1a1a24)', color: 'var(--cms-text, #fff)', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', cursor: 'pointer', fontSize: 12 }}
              >
                Tutup
              </button>
            </div>

            {/* Template Box Preview */}
            <div style={{ position: 'relative' }}>
              <textarea
                readOnly
                rows={16}
                value={`Buatkan sebuah game interaktif berbasis HTML5 Single File (Event Activation) dengan tema dan ketentuan berikut:

INFORMASI GAME:
- Judul Game: ${aiPromptGame.title}
- Konsep & Deskripsi: ${aiPromptGame.description || 'Game interaktif ringan untuk aktivasi event publik'}
- Engine Type: HTML5 Canvas / Single File Pure (Offline Ready, tanpa dependensi CDN eksternal yang berat)
- Target Display: Responsif untuk layar Tablet Kiosk & Smartphone (Sentuhan jari / Touch & Mouse Click)

STRUKTUR 3 TINGKATAN PENGATURAN (ADMIN MASTER, SUPPLIER, & VIEW ONLY):
1. Admin Master: Akses penuh mengubah logoUrl, heroBackgroundUrl, themeColor, soundtrackUrl, dan data konten game.
2. Admin Supplier: Akses mengubah level kustom via window.gameConfig.customLevelJson & branding visual.
3. View Only: Pengunjung memainkan instance game dengan branding kustom yang terkunci.

INTEGRASI PENYIMPANAN WEBSITE UTAMA (STORAGE & LEADERBOARD):
- Skor tersimpan otomatis ke IndexedDB/localStorage dengan kunci: "porto_lb_${aiPromptGame.slug || 'game'}"
- Membaca window.gameConfig secara real-time:
  window.gameConfig = {
    themeColor: '#7c3aed',
    logoUrl: '...',
    heroBackgroundUrl: '...',
    soundtrackUrl: '...',
    customLevelJson: '...'
  };

STRUKTUR 6 ALUR LAYAR (SCREENS):
1. LAYAR IDLE (Attract Screen):
   - Tampilan visual menarik dengan judul "${aiPromptGame.title}", animasi pancingan (bounce/pulse), logo klien dari window.gameConfig.logoUrl, dan tombol "KETUK UNTUK MEMULAI".
   - Reset otomatis kembali ke layar ini jika tidak ada interaksi selama 60 detik.
2. LAYAR PERATURAN (Rules & Cara Bermain):
   - Teks instruksi singkat 3 langkah bermain yang mudah dipahami pengunjung event dalam 5 detik.
   - Tombol "SAYA SIAP BERMAIN" untuk lanjut.
3. LAYAR LOADING (Countdown 3-2-1):
   - Hitungan mundur 3, 2, 1 dengan efek audio visual energik sebelum game dimulai.
4. LAYAR MAIN (Gameplay Active):
   - Waktu permainan: 30 - 60 detik (Countdown Timer).
   - Tampilan Skor berjalan di bagian atas dengan warna var(--accent, window.gameConfig.themeColor).
   - Gameplay adiktif, responsif, dan stabil pada 60 FPS.
5. LAYAR HASIL (Game Over & Final Score):
   - Menampilkan skor akhir yang dicapai pemain dan ucapan apresiasi.
   - Input nama & nomor WhatsApp pemain untuk leaderboard.
   - Tombol "SIMPAN SKOR" atau "MAIN LAGI".
6. LAYAR LEADERBOARD (Peringkat Skor Teratas):
   - Menampilkan Top 10 skor tertinggi event yang tersimpan di IndexedDB/localStorage.
   - Tombol "KEMBALI KE BERANDA".

KETENTUAN KODE:
- Kode ditulis murni dalam 1 file HTML utuh (<style>, <canvas>/DOM, dan <script> menyatu tanpa markdown wrappers).`}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: isDarkMode ? '#0d0d14' : '#f8fafc', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                  color: isDarkMode ? '#e2e8f0' : '#1e293b', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
                  resize: 'none', boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  const text = `Buatkan sebuah game interaktif berbasis HTML5 Single File (Event Activation) dengan tema dan ketentuan berikut:

INFORMASI GAME:
- Judul Game: ${aiPromptGame.title}
- Konsep & Deskripsi: ${aiPromptGame.description || 'Game interaktif ringan untuk aktivasi event publik'}
- Engine Type: HTML5 Canvas / Single File Pure (Offline Ready, tanpa dependensi CDN eksternal yang berat)
- Target Display: Responsif untuk layar Tablet Kiosk & Smartphone (Sentuhan jari / Touch & Mouse Click)

STRUKTUR 6 ALUR LAYAR (SCREENS):
1. LAYAR IDLE (Attract Screen):
   - Tampilan visual menarik dengan judul "${aiPromptGame.title}", animasi pancingan (bounce/pulse), dan tombol "KETUK UNTUK MEMULAI".
   - Reset otomatis kembali ke layar ini jika tidak ada interaksi selama 60 detik.
2. LAYAR PERATURAN (Rules & Cara Bermain):
   - Teks instruksi singkat 3 langkah bermain yang mudah dipahami pengunjung event dalam 5 detik.
   - Tombol "SAYA SIAP BERMAIN" untuk lanjut.
3. LAYAR LOADING (Countdown 3-2-1):
   - Hitungan mundur 3, 2, 1 dengan efek audio visual energik sebelum game dimulai.
4. LAYAR MAIN (Gameplay Active):
   - Waktu permainan: 30 - 60 detik (Countdown Timer).
   - Tampilan Skor berjalan di bagian atas.
   - Gameplay adiktif, responsif, dan stabil pada 60 FPS.
5. LAYAR HASIL (Game Over & Final Score):
   - Menampilkan skor akhir yang dicapai pemain dan ucapan apresiasi.
   - Input nama/nomor kontak pemain untuk leaderboard.
   - Memiliki tombol "SIMPAN SKOR" atau "MAIN LAGI".
6. LAYAR LEADERBOARD (Peringkat Skor Teratas):
   - Menampilkan Top 5 / Top 10 skor tertinggi event yang tersimpan di IndexedDB/localStorage perangkat.
   - Memiliki tombol "KEMBALI KE BERANDA".

KETENTUAN ASSETS & BRANDING:
- Dukung variabel konfigurasi JSON global (logoUrl, heroBackgroundUrl, themeColor) agar mudah dibranding ulang per event klien.
- Kode ditulis murni dalam 1 file HTML utuh (<style>, <canvas>/DOM, dan <script> menyatu).`;
                  navigator.clipboard.writeText(text);
                  setCopiedPrompt(true);
                  notify?.('Template Prompt AI berhasil disalin ke clipboard!', 'success');
                  setTimeout(() => setCopiedPrompt(false), 3000);
                }}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  background: copiedPrompt ? '#10b981' : '#eab308',
                  color: copiedPrompt ? '#fff' : '#000',
                  border: 'none', fontWeight: 900, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {copiedPrompt ? <Check size={16} /> : <Copy size={16} />}
                {copiedPrompt ? 'Prompt Disalin' : 'Salin Template Prompt AI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA GALLERY MODAL UNTUK MEMILIH GAMBAR CLOUDINARY */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => {
          if (galleryTarget === 'game_thumbnail') {
            setEditingGame(prev => ({ ...prev, thumbnailUrl: url }));
            notify?.('Gambar dari Galeri dipilih sebagai thumbnail game!', 'success');
          } else if (galleryTarget === 'license_logo') {
            setEditingLicense(prev => ({
              ...prev,
              customConfig: { ...(prev?.customConfig || {}), logoUrl: url }
            }));
            notify?.('Logo brand berhasil dipilih dari Galeri!', 'success');
          } else if (galleryTarget === 'license_hero') {
            setEditingLicense(prev => ({
              ...prev,
              customConfig: { ...(prev?.customConfig || {}), heroBackgroundUrl: url }
            }));
            notify?.('Background hero berhasil dipilih dari Galeri!', 'success');
          }
          setIsGalleryOpen(false);
        }}
      />

      {/* MODAL MANAJEMEN LABEL / TAGS DINAMIS */}
      {isManagingTags && (
        <div
          onClick={() => setIsManagingTags(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--cms-card-bg, #181824)', borderRadius: 20, maxWidth: '480px', width: '100%', padding: 24,
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag size={20} color="var(--cms-accent, #7c3aed)" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text, #fff)' }}>
                  Kelola Label & Kategori Game
                </h3>
              </div>
              <button
                onClick={() => setIsManagingTags(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted, #94a3b8)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.5 }}>
              Tambahkan label baru atau hapus label yang sudah tidak digunakan. Label ini akan muncul di form game dan menjadi badge di katalog publik.
            </p>

            {/* Input Tambah Tag Baru */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Nama label baru (misal: Corporate, Ramadhan)..."
                style={{
                  flex: 1, height: 42, padding: '0 16px', borderRadius: 100,
                  background: 'var(--cms-input-bg, rgba(0,0,0,0.3))',
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                  color: 'var(--cms-text, #fff)', fontSize: 13, outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{
                  padding: '0 20px', height: 42, borderRadius: 100,
                  background: 'var(--cms-accent, #7c3aed)', color: '#fff',
                  border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <Plus size={14} /> Tambah
              </button>
            </div>

            {/* List Tags Yang Ada */}
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 12, border: '1px solid var(--cms-border, rgba(255,255,255,0.08))' }}>
              {availableTags.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>Belum ada label.</span>
              ) : (
                availableTags.map((tag) => (
                  <div
                    key={tag}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                      borderRadius: 100, background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                      color: 'var(--cms-text, #fff)', fontSize: 12, fontWeight: 700
                    }}
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleDeleteTag(tag)}
                      title={`Hapus label ${tag}`}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center'
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                onClick={() => setIsManagingTags(false)}
                style={{
                  padding: '9px 18px', borderRadius: 8,
                  background: 'var(--cms-accent, #7c3aed)', color: '#fff',
                  border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer'
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIDEO PREVIEW (CMS ADMIN) */}
      {previewVideoGame && (
        <div
          onClick={() => setPreviewVideoGame(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--cms-card-bg, #181824)', borderRadius: 20, maxWidth: '720px', width: '100%', overflow: 'hidden',
              border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))', boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ padding: '14px 20px', background: 'var(--cms-input-bg, #1e1e2d)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Video size={18} color="var(--cms-accent, #7c3aed)" />
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--cms-text, #fff)' }}>
                  Preview Gameplay: {previewVideoGame.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewVideoGame(null)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text, #fff)', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 16, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {previewVideoGame.previewVideoUrl ? (
                <video
                  src={previewVideoGame.previewVideoUrl}
                  controls
                  autoPlay
                  loop
                  style={{ width: '100%', maxHeight: '440px', borderRadius: 10, outline: 'none' }}
                />
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  Tidak ada URL video yang diatur.
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', background: 'var(--cms-card-bg, #181824)' }}>
              <button
                onClick={() => setPreviewVideoGame(null)}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--cms-accent, #7c3aed)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DUAL-VIEW INTERFACE (IFRAME PREVIEW INTERAKTIF + PANEL PENGATURAN REAL-TIME) */}
      {liveTestGame && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 99999, display: 'flex', flexDirection: 'column' }}>
          {/* Top Bar Dual View */}
          <div style={{
            height: 56,
            background: 'var(--cms-card-bg, #181824)',
            borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            color: '#fff',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(59,130,246,0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Monitor size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Uji Coba Game: {liveTestGame.title}</span>
                  {liveTestLicense ? (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 800 }}>
                      KLIEN: {liveTestLicense.clientName}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', fontWeight: 800 }}>
                      DEFAULT MASTER
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  Perubahan pada panel kanan langsung memperbarui tampilan game di sebelah kiri secara real-time.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => {
                  const url = liveTestLicense 
                    ? `${window.location.origin}/client/play/${liveTestLicense.id}`
                    : `${window.location.origin}/apps`;
                  window.open(url, '_blank');
                }}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
                title="Buka tampilan fullscreen publik di tab baru"
              >
                <ExternalLink size={13} /> Buka Layar Penuh
              </button>

              <button
                onClick={() => {
                  setLiveTestGame(null);
                  setLiveTestLicense(null);
                }}
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  background: 'var(--cms-accent, #7c3aed)',
                  color: '#fff', border: 'none',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer'
                }}
              >
                ✕ Tutup Pengujian
              </button>
            </div>
          </div>

          {/* Body Dual-View (Split Screen: Iframe + Realtime Control Panel) */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sisi Kiri: Iframe Preview Game (Interaktif) */}
            <div style={{ flex: 1, background: '#09090e', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                position: 'absolute', top: 12, left: 12, zIndex: 10,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)',
                fontSize: 11, fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6
              }}>
                <Gamepad2 size={13} />
                <span>Simulator Interaktif (Bisa Dimainkan)</span>
              </div>

              <iframe
                key={JSON.stringify(liveTestConfig)}
                srcDoc={(() => {
                  if (liveTestGame.htmlContent) {
                    const cfgScript = `<script>window.gameConfig = ${JSON.stringify(liveTestConfig)};</script>`;
                    if (liveTestGame.htmlContent.includes('<head>')) {
                      return liveTestGame.htmlContent.replace('<head>', `<head>${cfgScript}`);
                    }
                    return cfgScript + liveTestGame.htmlContent;
                  }
                  return generateGameEngineHtml(liveTestGame, liveTestConfig);
                })()}
                title="Game Live Simulator"
                allow="camera; microphone; fullscreen; autoplay"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', outline: 'none' }}
              />
            </div>

            {/* Sisi Kanan: Panel Pengaturan Cepat Real-Time */}
            <div style={{
              width: 380,
              background: 'var(--cms-card-bg, #181824)',
              borderLeft: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
              display: 'flex',
              flexDirection: 'column',
              padding: 20,
              overflowY: 'auto',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Settings2 size={16} color="var(--cms-accent, #7c3aed)" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--cms-text, #fff)' }}>
                    Panel Pengaturan
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)' }}>
                  Perubahan langsung terlihat seketika pada simulator di samping.
                </p>
              </div>

              {/* Warna Utama / Aksen */}
              <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.25)' : '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Palette size={13} color="var(--cms-accent, #a78bfa)" />
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #cbd5e1)' }}>
                    Warna Utama
                  </label>
                  
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={liveTestConfig.themeColor || '#7c3aed'}
                    onChange={(e) => {
                      const col = e.target.value;
                      setLiveTestConfig(prev => ({ ...prev, themeColor: col }));
                    }}
                    style={{ width: 44, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: liveTestConfig.themeColor || '#7c3aed' }}>
                      {liveTestConfig.themeColor || '#7c3aed'}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                      Warna tombol dan skor permainan
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Logo Brand Klien */}
              <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.25)' : '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <ImageIcon size={13} color="var(--cms-accent, #a78bfa)" />
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #cbd5e1)' }}>
                    Logo Klien
                  </label>
                  
                </div>
                <input
                  type="url"
                  value={liveTestConfig.logoUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setLiveTestConfig(prev => ({ ...prev, logoUrl: url }));
                  }}
                  placeholder="https://.../logo.png"
                  style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                />
                {liveTestConfig.logoUrl && (
                  <div style={{ marginTop: 8, textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: 6, borderRadius: 12 }}>
                    <img src={liveTestConfig.logoUrl} alt="Logo" style={{ maxHeight: 36, objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              {/* URL Background Hero Klien */}
              <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.25)' : '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Layers size={13} color="var(--cms-accent, #a78bfa)" />
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text, #cbd5e1)' }}>
                    Gambar Latar Kustom
                  </label>
                  
                </div>
                <input
                  type="url"
                  value={liveTestConfig.heroBackgroundUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setLiveTestConfig(prev => ({ ...prev, heroBackgroundUrl: url }));
                  }}
                  placeholder="https://.../background.jpg"
                  style={{ width: '100%', height: 38, padding: '0 14px', borderRadius: 100, background: 'var(--cms-input-bg, rgba(0,0,0,0.3))', border: '1px solid var(--cms-border, rgba(255,255,255,0.15))', color: 'var(--cms-text, #fff)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Petunjuk Cetak SOP */}
              <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                <button
                  onClick={() => printGameSetupPdf(liveTestGame, liveTestLicense)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 100,
                    background: 'rgba(16, 185, 129, 0.16)',
                    color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <FileCode size={15} /> Cetak SOP Panduan (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER PUSAT PANDUAN & WAWASAN GAME STUDIO */}
      {isGuideOpen && (
        <div
          onClick={() => setIsGuideOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--cms-card-bg, #161622)', borderRadius: 24, maxWidth: '820px', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))', boxShadow: isDarkMode ? '0 25px 70px rgba(0,0,0,0.8)' : '0 20px 50px rgba(0,0,0,0.15)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cms-input-bg, #1a1a28)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text, #fff)' }}>Pusat Panduan &amp; Wawasan Game Studio</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--cms-text-muted, #94a3b8)' }}>
                    {GAME_STUDIO_KNOWLEDGE_BASE.length} butir ensiklopedia · {GAME_STUDIO_TEMPLATES.length}+ template · AI Architect langsung di browser
                  </p>
                </div>
              </div>
              <button onClick={() => setIsGuideOpen(false)} style={{ width: 32, height: 32, borderRadius: 100, background: 'rgba(255,255,255,0.08)', color: 'var(--cms-text, #fff)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.1))', background: 'var(--cms-input-bg, #1a1a28)', padding: '0 24px' }}>
              {([
                { key: 'encyclopedia' as const, label: 'Ensiklopedia', icon: <BookOpen size={14} />, count: GAME_STUDIO_KNOWLEDGE_BASE.length },
                { key: 'templates' as const, label: 'Template Prompt', icon: <Code size={14} />, count: GAME_STUDIO_TEMPLATES.length },
                { key: 'ai_architect' as const, label: 'AI Architect', icon: <Sparkles size={14} />, count: null },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setGuideActiveTab(tab.key)}
                  style={{ padding: '12px 16px', background: 'transparent', color: guideActiveTab === tab.key ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text-muted, #94a3b8)', border: 'none', borderBottom: guideActiveTab === tab.key ? '2px solid var(--cms-accent, #7c3aed)' : '2px solid transparent', cursor: 'pointer', fontWeight: guideActiveTab === tab.key ? 800 : 600, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {tab.icon} {tab.label}
                  {tab.count !== null && <span style={{ background: guideActiveTab === tab.key ? 'var(--cms-accent, #7c3aed)' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 100 }}>{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* ─── TAB 1: ENSIKLOPEDIA ─── */}
            {guideActiveTab === 'encyclopedia' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.07))', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 8, background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderRadius: 100, padding: '7px 14px', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                    <Search size={13} color="var(--cms-text-muted, #94a3b8)" />
                    <input type="text" placeholder="Cari topik..." value={knowledgeSearchQuery} onChange={e => setKnowledgeSearchQuery(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--cms-text, #fff)' }} />
                  </div>
                  <select value={knowledgeCategoryFilter} onChange={e => setKnowledgeCategoryFilter(e.target.value)} style={{ background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', borderRadius: 100, color: 'var(--cms-text, #fff)', fontSize: 12, padding: '7px 14px', cursor: 'pointer', outline: 'none' }}>
                    <option value="all">Semua Kategori</option>
                    <option value="Arsitektur & AI">Arsitektur &amp; AI</option>
                    <option value="Hardware & Display">Hardware &amp; Display</option>
                    <option value="SOP & Booth">SOP &amp; Booth</option>
                    <option value="White-Label & Branding">White-Label &amp; Branding</option>
                    <option value="Troubleshooting & Darurat">Troubleshooting &amp; Darurat</option>
                    <option value="Engagement & Psikologi">Engagement &amp; Psikologi</option>
                  </select>
                </div>
                {(() => {
                  const catColor: Record<string, string> = { 'Arsitektur & AI': '#7c3aed', 'Hardware & Display': '#0ea5e9', 'SOP & Booth': '#10b981', 'White-Label & Branding': '#f59e0b', 'Troubleshooting & Darurat': '#ef4444', 'Engagement & Psikologi': '#ec4899' };
                  const q = knowledgeSearchQuery.toLowerCase();
                  const filtered = GAME_STUDIO_KNOWLEDGE_BASE.filter(k =>
                    (knowledgeCategoryFilter === 'all' || k.category === knowledgeCategoryFilter) &&
                    (!q || k.title.toLowerCase().includes(q) || k.summary.toLowerCase().includes(q) || k.solution.toLowerCase().includes(q) || k.badge.toLowerCase().includes(q))
                  );
                  if (!filtered.length) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted, #94a3b8)' }}><Search size={28} style={{ marginBottom: 10, opacity: 0.4 }} /><div>Tidak ada hasil ditemukan.</div></div>;
                  return (
                    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>{filtered.length} butir ditemukan</div>
                      {filtered.map(item => (
                        <div key={item.id} style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', border: '1px solid var(--cms-border, rgba(255,255,255,0.08))', borderLeft: `3px solid ${catColor[item.category] || '#7c3aed'}`, borderRadius: 12, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--cms-text, #fff)', lineHeight: 1.4 }}>{item.title}</div>
                            <span style={{ flexShrink: 0, background: (catColor[item.category] || '#7c3aed') + '22', color: catColor[item.category] || '#7c3aed', fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 100 }}>{item.badge}</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', marginBottom: 6, fontStyle: 'italic' }}>{item.summary}</div>
                          <div style={{ fontSize: 12, color: isDarkMode ? '#c4c4d0' : '#374151', lineHeight: 1.6 }}><span style={{ fontWeight: 700, color: '#10b981' }}>Solusi: </span>{item.solution}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ─── TAB 2: TEMPLATE PROMPT ─── */}
            {guideActiveTab === 'templates' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.07))', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 8, background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderRadius: 100, padding: '7px 14px', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                    <Search size={13} color="var(--cms-text-muted, #94a3b8)" />
                    <input type="text" placeholder="Cari template..." value={templateSearchQuery} onChange={e => setTemplateSearchQuery(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--cms-text, #fff)' }} />
                  </div>
                  <select value={templateCategoryFilter} onChange={e => setTemplateCategoryFilter(e.target.value)} style={{ background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', borderRadius: 100, color: 'var(--cms-text, #fff)', fontSize: 12, padding: '7px 14px', cursor: 'pointer', outline: 'none' }}>
                    <option value="all">Semua Kategori</option>
                    <option value="Arcade & Reflex">Arcade &amp; Reflex</option>
                    <option value="Trivia & Edukasi">Trivia &amp; Edukasi</option>
                    <option value="AR & Sensor Gerak">AR &amp; Sensor Gerak</option>
                    <option value="Branded & Corporate">Branded &amp; Corporate</option>
                    <option value="Ramadhan & Hari Raya">Ramadhan &amp; Hari Raya</option>
                    <option value="Sport & Racing">Sport &amp; Racing</option>
                  </select>
                </div>
                {(() => {
                  const tplColor: Record<string, string> = { 'Arcade & Reflex': '#f59e0b', 'Trivia & Edukasi': '#3b82f6', 'AR & Sensor Gerak': '#8b5cf6', 'Branded & Corporate': '#10b981', 'Ramadhan & Hari Raya': '#ec4899', 'Sport & Racing': '#ef4444' };
                  const q = templateSearchQuery.toLowerCase();
                  const filtered = GAME_STUDIO_TEMPLATES.filter(t =>
                    (templateCategoryFilter === 'all' || t.category === templateCategoryFilter) &&
                    (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.theme.toLowerCase().includes(q))
                  );
                  return (
                    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>{filtered.length} template ditemukan</div>
                      {filtered.map(tpl => (
                        <div key={tpl.id} style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff', border: `1px solid ${selectedTemplateForAi?.id === tpl.id ? (tplColor[tpl.category] || '#7c3aed') : 'var(--cms-border, rgba(255,255,255,0.08))'}`, borderLeft: `3px solid ${tplColor[tpl.category] || '#7c3aed'}`, borderRadius: 12, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--cms-text, #fff)' }}>{tpl.title}</div>
                              <div style={{ fontSize: 11, color: tplColor[tpl.category] || '#7c3aed', fontWeight: 700, marginTop: 2 }}>{tpl.theme}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <span style={{ background: (tplColor[tpl.category] || '#7c3aed') + '22', color: tplColor[tpl.category] || '#7c3aed', fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 100 }}>{tpl.category}</span>
                              <span style={{ background: tpl.difficulty === 'Mudah' ? 'rgba(16,185,129,0.15)' : tpl.difficulty === 'Sedang' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: tpl.difficulty === 'Mudah' ? '#10b981' : tpl.difficulty === 'Sedang' ? '#f59e0b' : '#ef4444', fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 100 }}>{tpl.difficulty}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--cms-text-muted, #94a3b8)', marginBottom: 8, lineHeight: 1.5 }}>{tpl.description}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--cms-text-muted, #94a3b8)', fontSize: 11, padding: '3px 9px', borderRadius: 100 }}>
                              {tpl.inputMethod === 'Camera' ? <Camera size={11} /> : tpl.inputMethod === 'Mic' ? <Mic size={11} /> : tpl.inputMethod === 'Keyboard' ? <Keyboard size={11} /> : <MousePointer size={11} />} {tpl.inputMethod}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--cms-text-muted, #94a3b8)', fontSize: 11, padding: '3px 9px', borderRadius: 100 }}><Clock size={11} /> {tpl.durationSec}s</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTemplateForAi(tpl);
                              const fp = `Buatkan game HTML5 Single File bertema "${tpl.title}" (${tpl.theme}).\n\nDeskripsi: ${tpl.description}\n\nTujuan Mekanik: ${tpl.promptGoal}\n\nSpesifikasi Teknis: ${tpl.techSpecs}\n\nDurasi: ${tpl.durationSec} detik. Input: ${tpl.inputMethod}. Kesulitan: ${tpl.difficulty}.\n\nArsitektur 3 Mode Admin & Klien:\n1. Admin Master: Kendali penuh branding (logoUrl, heroBackgroundUrl, themeColor, soundtrackUrl) dan data game.\n2. Admin Supplier: Akses modifikasi level / rintangan via window.gameConfig.customLevelJson.\n3. View Only: Instance siap main terkunci di kiosk event.\n\nStruktur wajib: 6 layar standar (Idle/Attract Mode, Peraturan, Countdown 3..2..1, Gameplay + Timer, Skor Akhir + Input Nama & WhatsApp, Leaderboard IndexedDB Top 10).\n\nSkor wajib otomatis disimpan ke localStorage/IndexedDB dengan kunci 'porto_lb_' + slug.\n\nOutput HANYA satu file HTML lengkap tanpa markdown format (tanpa \`\`\`html) dan tanpa penjelasan apapun.`;
                              setGeminiPromptCustom(fp);
                              setGuideActiveTab('ai_architect');
                              notify?.(`Template "${tpl.title}" dimuat ke AI Architect!`, 'success');
                            }}
                            style={{ width: '100%', padding: '8px 14px', borderRadius: 100, background: (tplColor[tpl.category] || '#7c3aed') + '22', color: tplColor[tpl.category] || '#7c3aed', border: `1px solid ${(tplColor[tpl.category] || '#7c3aed')}44`, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          >
                            <Sparkles size={12} /> Buat dengan AI Architect
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ─── TAB 3: AI ARCHITECT ─── */}
            {guideActiveTab === 'ai_architect' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {selectedTemplateForAi && (
                    <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={14} color="#7c3aed" />
                      <span style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 700 }}>Template aktif: <span style={{ color: '#a78bfa' }}>{selectedTemplateForAi.title}</span></span>
                      <button onClick={() => { setSelectedTemplateForAi(null); setGeminiPromptCustom(''); }} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>x</button>
                    </div>
                  )}
                  {!getGeminiKey() && (
                    <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={14} color="#f59e0b" />
                      <span style={{ fontSize: 12, color: '#fcd34d' }}>API Key Gemini belum dikonfigurasi. Silakan tambahkan via panel pengaturan AI.</span>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted, #94a3b8)', display: 'block', marginBottom: 6 }}>Instruksi Game untuk Gemini AI</label>
                    <textarea value={geminiPromptCustom} onChange={e => setGeminiPromptCustom(e.target.value)} placeholder="Contoh: Buatkan game HTML5 Single File bertema Tap Cepat Koin Logo Tokopedia, durasi 30 detik, 6 layar standar..." rows={8} style={{ width: '100%', padding: '12px 16px', borderRadius: 16, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', border: '1px solid var(--cms-border, rgba(255,255,255,0.12))', color: 'var(--cms-text, #fff)', fontSize: 12.5, lineHeight: 1.7, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--cms-text-muted, #94a3b8)' }}>{geminiPromptCustom.length} karakter</span>
                      <button onClick={() => setGeminiPromptCustom('')} style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted, #94a3b8)', cursor: 'pointer', fontSize: 11.5 }}>Hapus</button>
                    </div>
                  </div>
                  <button
                    disabled={isGeneratingWithGemini || !geminiPromptCustom.trim()}
                    onClick={async () => {
                      if (!geminiPromptCustom.trim()) return;
                      setIsGeneratingWithGemini(true);
                      setGeminiGeneratedHtml('');
                      setGeminiAiStatusMessage('Menghubungi Gemini AI dan membangun game...');
                      try {
                        const sysInstr = `You are an expert HTML5 game developer for event activation booths. Output ONLY raw complete single-file HTML without markdown wrappers. 
Support touch and mouse events. 60 FPS requestAnimationFrame loop. 
6 screens: 
1. Idle/attract mode with client logo & tap to start.
2. Rules & 3-step instructions.
3. Countdown 3.. 2.. 1..
4. Gameplay with timer & score display using theme color.
5. Result screen with score, player name, and phone/WA input.
6. Leaderboard screen ranking top 10 scores from localStorage.setItem('porto_lb_' + slug).

Architecture Roles & White-Label Integration:
- Read window.gameConfig = { logoUrl, heroBackgroundUrl, themeColor, soundtrackUrl, customLevelJson }.
- Support Admin Master (full branding), Admin Supplier (customLevelJson parsing for obstacles/trivia), and View Only (locked kiosk play).`;
                        const result = await callGemini(geminiPromptCustom, sysInstr);
                        const html = result.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
                        setGeminiGeneratedHtml(html);
                        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
                        const guessTitle = selectedTemplateForAi?.title || titleMatch?.[1] || 'Game AI Baru';
                        setGeminiGeneratedTitle(guessTitle);
                        setGeminiGeneratedSlug(guessTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                        setGeminiAiStatusMessage(`Game berhasil dibuat! ${html.length.toLocaleString()} karakter HTML.`);
                      } catch (err) {
                        setGeminiAiStatusMessage('Error: ' + ((err as any)?.message || 'Gagal menghubungi Gemini AI.'));
                      } finally {
                        setIsGeneratingWithGemini(false);
                      }
                    }}
                    style={{ width: '100%', padding: '12px 20px', borderRadius: 100, background: isGeneratingWithGemini || !geminiPromptCustom.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: isGeneratingWithGemini || !geminiPromptCustom.trim() ? 'var(--cms-text-muted, #94a3b8)' : '#fff', border: 'none', cursor: isGeneratingWithGemini || !geminiPromptCustom.trim() ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {isGeneratingWithGemini ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
                    {isGeneratingWithGemini ? 'Gemini AI sedang membangun game...' : 'Generate Game dengan Gemini AI'}
                  </button>
                  {geminiAiStatusMessage && (
                    <div style={{ background: isGeneratingWithGemini ? 'rgba(59,130,246,0.1)' : geminiGeneratedHtml ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isGeneratingWithGemini ? 'rgba(59,130,246,0.3)' : geminiGeneratedHtml ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 12, padding: '10px 14px', fontSize: 12, color: isGeneratingWithGemini ? '#93c5fd' : geminiGeneratedHtml ? '#6ee7b7' : '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isGeneratingWithGemini ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : geminiGeneratedHtml ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {geminiAiStatusMessage}
                    </div>
                  )}
                  {geminiGeneratedHtml && (
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))', borderRadius: 16, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--cms-text, #fff)', display: 'flex', alignItems: 'center', gap: 6 }}><Terminal size={14} color="#10b981" /> Kode Game Dihasilkan</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { navigator.clipboard.writeText(geminiGeneratedHtml); notify?.('Kode HTML disalin!', 'success'); }} style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.35)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Copy size={11} /> Salin</button>
                          <button onClick={() => { const b = new Blob([geminiGeneratedHtml], { type: 'text/html' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${geminiGeneratedSlug || 'game-ai'}.html`; a.click(); URL.revokeObjectURL(u); notify?.('File HTML diunduh!', 'success'); }} style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Download size={11} /> Unduh</button>
                        </div>
                      </div>
                      <pre style={{ background: isDarkMode ? '#0d0d14' : '#1e293b', color: '#e2e8f0', padding: '14px 16px', fontSize: 11, lineHeight: 1.5, overflowX: 'auto', fontFamily: 'monospace', margin: 0, maxHeight: 180, overflowY: 'auto' }}>{geminiGeneratedHtml.slice(0, 1800)}{geminiGeneratedHtml.length > 1800 ? `\n\n... (+${(geminiGeneratedHtml.length - 1800).toLocaleString()} karakter)` : ''}</pre>
                      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.1))', display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderRadius: 100, padding: '7px 14px', border: '1px solid var(--cms-border, rgba(255,255,255,0.1))' }}>
                          <input type="text" placeholder="Slug (contoh: tap-coin-rush)" value={geminiGeneratedSlug} onChange={e => setGeminiGeneratedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: 'var(--cms-text, #fff)' }} />
                        </div>
                        <button onClick={async () => {
                          if (!geminiGeneratedSlug.trim()) { notify?.('Isi slug game terlebih dahulu!', 'warning'); return; }
                          try {
                            const newGamePayload = {
                              title: geminiGeneratedTitle || geminiGeneratedSlug,
                              slug: geminiGeneratedSlug,
                              description: `Dibuat dengan Gemini AI — template: ${selectedTemplateForAi?.title || 'Kustom'}.`,
                              engineType: 'HTML5 Single File (Event Activation)',
                              category: selectedTemplateForAi?.category?.split(' &')[0] || 'Event',
                              tags: ['AI Generated', selectedTemplateForAi?.inputMethod || 'Touch'],
                              pricingTier: 'basic' as const,
                              htmlContent: geminiGeneratedHtml,
                              eventSpecs: {
                                estimatedDuration: `${selectedTemplateForAi?.durationSec || 45} Detik / Pemain`,
                                leaderboardCapacity: 'Top 10 Peserta',
                                deviceSupport: 'Touchscreen Kiosk & Smartphone'
                              },
                              inputSpecs: {
                                requireCamera: selectedTemplateForAi?.inputMethod === 'Camera',
                                requireMicrophone: selectedTemplateForAi?.inputMethod === 'Mic',
                                requireTouchTap: selectedTemplateForAi?.inputMethod !== 'Keyboard',
                                requireKeyboard: selectedTemplateForAi?.inputMethod === 'Keyboard',
                                sessionDurationSec: selectedTemplateForAi?.durationSec || 45,
                                maxTargetScore: 1000,
                                instructionText: selectedTemplateForAi?.promptGoal || 'Mainkan game dan raih skor tertinggi!'
                              },
                              defaultConfig: { themeColor: '#7c3aed' },
                              isActive: true
                            };
                            await saveGameInstance(newGamePayload);
                            notify?.(`Game "${geminiGeneratedSlug}" berhasil disimpan ke sistem!`, 'success');
                            setIsGuideOpen(false);
                          } catch (err) { notify?.('Gagal menyimpan: ' + (err as any)?.message, 'error'); }
                        }} style={{ padding: '8px 18px', borderRadius: 100, background: 'var(--cms-accent, #7c3aed)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <CheckCircle2 size={13} /> Simpan ke Game Studio
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.1))', display: 'flex', justifyContent: 'flex-end', background: 'var(--cms-input-bg, #1a1a28)' }}>
              <button onClick={() => setIsGuideOpen(false)} style={{ padding: '8px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', color: 'var(--cms-text, #fff)', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameManagementTab;
