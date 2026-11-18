import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  HardDrive, Upload, Image as ImageIcon, Video, Music, FileText, 
  Trash2, Copy, Check, ExternalLink, Search, Filter, Plus, Loader2, Sparkles, 
  X, ArrowLeft, Edit3, Folder, FolderPlus, Grid, List, CheckCircle2,
  Cloud, Globe, Link2, Download, AlertCircle, ChevronRight, Home,
  FolderOpen, MoveRight, MoreVertical, Eye, Info
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import { uploadToCloudinary, uploadAudioToCloudinary } from '../../../utils/cloudinary';
import { getCloudinaryGenerativeFill } from '../../../utils/browserPowerHacks';
import type { MediaVaultItem, MediaVaultType, MediaStorageSource, VaultFolder } from './stashTypes';

const DEFAULT_FOLDERS: VaultFolder[] = [
  { id: 'fld-drive-projects', name: 'Google Drive Projects', parentId: null, color: '#22c55e', createdAt: new Date().toISOString() },
  { id: 'fld-branding', name: 'Brand & Identitas', parentId: null, color: '#3b82f6', createdAt: new Date().toISOString() },
  { id: 'fld-assets', name: 'Aset Desain & Grafis', parentId: null, color: '#ec4899', createdAt: new Date().toISOString() },
  { id: 'fld-docs', name: 'Dokumen & Kontrak', parentId: null, color: '#f59e0b', createdAt: new Date().toISOString() }
];

const DEFAULT_VAULT_ITEMS: MediaVaultItem[] = [
  {
    id: 'mv-1',
    name: 'Logo Studio Master (PNG)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    source: 'cloudinary',
    folderId: 'fld-branding',
    folder: 'Brand & Identitas',
    size: 420000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mv-2',
    name: 'Brand Typography & Banner Art',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    source: 'cloudinary',
    folderId: 'fld-branding',
    folder: 'Brand & Identitas',
    size: 890000,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mv-3',
    name: 'Master Vault Proyek Klien (Google Drive)',
    url: 'https://drive.google.com',
    type: 'document',
    source: 'drive',
    folderId: 'fld-drive-projects',
    folder: 'Google Drive Projects',
    size: 15400000,
    createdAt: new Date().toISOString()
  }
];

interface MediaVaultManagerProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  isDarkMode?: boolean;
  onBack?: () => void;
}

// Helper auto-kompresi gambar CDN Cloudinary & Google Drive untuk galeri ultra-cepat
const getOptimizedThumbUrl = (url: any): string => {
  const urlStr = typeof url === 'string' ? url : (url?.url || '');
  if (!urlStr) return '';
  if (urlStr.includes('cloudinary.com') && urlStr.includes('/upload/')) {
    return urlStr.replace('/upload/', '/upload/c_fill,w_400,h_260,f_auto,q_auto:eco/');
  }
  if (urlStr.includes('drive.google.com') && urlStr.includes('id=')) {
    const fileId = urlStr.split('id=')[1]?.split('&')[0];
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
  return urlStr;
};

export const MediaVaultManager: React.FC<MediaVaultManagerProps> = ({
  notify,
  confirm,
  isDarkMode = true,
  onBack
}) => {
  const [items, setItems] = useState<MediaVaultItem[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null = Root
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | MediaVaultType>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | MediaStorageSource>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: '', color: '#3b82f6' });

  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({
    name: '',
    url: '',
    type: 'document' as MediaVaultType,
    source: 'drive' as MediaStorageSource,
    folderId: ''
  });

  const [renamingTarget, setRenamingTarget] = useState<{ type: 'file' | 'folder'; id: string; name: string } | null>(null);
  const [renamingInput, setRenamingInput] = useState('');

  const [movingFile, setMovingFile] = useState<MediaVaultItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load items & folders from storage
  useEffect(() => {
    const loadVaultData = async () => {
      try {
        const savedFolders = await storage.getItem('porto_vault_folders', null);
        if (Array.isArray(savedFolders) && savedFolders.length > 0) {
          setFolders(savedFolders);
        } else {
          setFolders(DEFAULT_FOLDERS);
          await storage.setItem('porto_vault_folders', DEFAULT_FOLDERS);
        }

        const savedItems = await storage.getItem('porto_media_vault', null);
        if (Array.isArray(savedItems) && savedItems.length > 0) {
          setItems(savedItems);
        } else {
          setItems(DEFAULT_VAULT_ITEMS);
          await storage.setItem('porto_media_vault', DEFAULT_VAULT_ITEMS);
        }
      } catch (err) {
        setFolders(DEFAULT_FOLDERS);
        setItems(DEFAULT_VAULT_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };
    loadVaultData();
  }, []);

  const saveItems = async (updated: MediaVaultItem[]) => {
    setItems(updated);
    try {
      await storage.setItem('porto_media_vault', updated);
      window.dispatchEvent(new CustomEvent('porto_vault_updated'));
      window.dispatchEvent(new CustomEvent('porto_media_vault_updated'));
    } catch (err) {
      console.error('Failed to save media vault:', err);
    }
  };

  const saveFolders = async (updated: VaultFolder[]) => {
    setFolders(updated);
    try {
      await storage.setItem('porto_vault_folders', updated);
    } catch (err) {
      console.error('Failed to save folders:', err);
    }
  };

  const detectSource = (url: any): MediaStorageSource => {
    const urlStr = typeof url === 'string' ? url : (url?.url || '');
    if (!urlStr) return 'local';
    const lower = urlStr.toLowerCase();
    if (lower.includes('drive.google.com') || lower.includes('docs.google.com') || lower.includes('googleusercontent.com')) return 'drive';
    if (lower.includes('cloudinary.com')) return 'cloudinary';
    return 'external';
  };

  // Current folder object
  const currentFolder = useMemo(() => {
    return folders.find(f => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Breadcrumbs path
  const breadcrumbs = useMemo(() => {
    const crumbs = [{ id: null, name: 'Beranda Berkas' }];
    if (currentFolder) {
      crumbs.push({ id: currentFolder.id, name: currentFolder.name });
    }
    return crumbs;
  }, [currentFolder]);

  // Folders to display in current level
  const displayedFolders = useMemo(() => {
    if (searchQuery.trim()) {
      return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId, searchQuery]);

  // Files to display in current level
  const displayedFiles = useMemo(() => {
    return items.filter(item => {
      // Jika sedang mencari kata kunci, cari di semua folder
      const matchFolder = searchQuery.trim() ? true : (item.folderId || null) === currentFolderId;
      const matchType = activeTypeFilter === 'all' || item.type === activeTypeFilter;
      const itemSrc = item.source || detectSource(item.url);
      const matchSource = sourceFilter === 'all' || itemSrc === sourceFilter;
      const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFolder && matchType && matchSource && matchSearch;
    });
  }, [items, currentFolderId, activeTypeFilter, sourceFilter, searchQuery]);

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name.trim()) return;

    const newFolder: VaultFolder = {
      id: `fld-${Date.now()}`,
      name: folderForm.name.trim(),
      parentId: currentFolderId,
      color: folderForm.color,
      createdAt: new Date().toISOString()
    };

    const nextFolders = [...folders, newFolder];
    await saveFolders(nextFolders);
    setFolderForm({ name: '', color: '#3b82f6' });
    setShowAddFolderModal(false);
    notify?.(`Folder "${newFolder.name}" berhasil dibuat!`, 'success');
  };

  // Upload file to current folder
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploading(true);
    try {
      let type: MediaVaultType = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      let uploadedRes: any = null;
      if (type === 'audio') {
        uploadedRes = await uploadAudioToCloudinary(file);
      } else {
        uploadedRes = await uploadToCloudinary(file);
      }

      const uploadedUrl = typeof uploadedRes === 'string' ? uploadedRes : (uploadedRes?.url || '');
      if (!uploadedUrl) {
        throw new Error('Gagal mengunggah berkas');
      }

      const detectedSrc = detectSource(uploadedUrl);
      const newItem: MediaVaultItem = {
        id: `mv-${Date.now()}`,
        name: file.name,
        url: uploadedUrl,
        type,
        source: detectedSrc === 'drive' ? 'drive' : 'cloudinary',
        folderId: currentFolderId || undefined,
        folder: currentFolder ? currentFolder.name : 'Beranda',
        size: file.size,
        createdAt: new Date().toISOString()
      };

      const next = [newItem, ...items];
      await saveItems(next);
      notify?.(`Berkas "${file.name}" berhasil diunggah ke folder ${currentFolder ? currentFolder.name : 'Beranda'}!`, 'success');
    } catch (err: any) {
      notify?.(err?.message || 'Gagal mengunggah berkas', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Add Link (Drive or Cloud)
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.name.trim() || !linkForm.url.trim()) {
      notify?.('Nama berkas dan URL wajib diisi!', 'error');
      return;
    }

    const targetFldId = linkForm.folderId || currentFolderId || undefined;
    const targetFolderObj = folders.find(f => f.id === targetFldId);

    const newItem: MediaVaultItem = {
      id: `mv-${Date.now()}`,
      name: linkForm.name.trim(),
      url: linkForm.url.trim(),
      type: linkForm.type,
      source: linkForm.source || detectSource(linkForm.url),
      folderId: targetFldId,
      folder: targetFolderObj ? targetFolderObj.name : 'Beranda',
      createdAt: new Date().toISOString()
    };

    const next = [newItem, ...items];
    await saveItems(next);
    setShowAddLinkModal(false);
    setLinkForm({ name: '', url: '', type: 'document', source: 'drive', folderId: '' });
    notify?.(`Tautan "${newItem.name}" berhasil disimpan!`, 'success');
  };

  // Rename action
  const handleConfirmRename = async () => {
    if (!renamingTarget || !renamingInput.trim()) return;

    if (renamingTarget.type === 'folder') {
      const nextFolders = folders.map(f => f.id === renamingTarget.id ? { ...f, name: renamingInput.trim() } : f);
      await saveFolders(nextFolders);
      // update human readable folder name in items
      const nextItems = items.map(i => i.folderId === renamingTarget.id ? { ...i, folder: renamingInput.trim() } : i);
      await saveItems(nextItems);
      notify?.(`Nama folder diperbarui menjadi "${renamingInput.trim()}"`, 'success');
    } else {
      const nextItems = items.map(i => i.id === renamingTarget.id ? { ...i, name: renamingInput.trim() } : i);
      await saveItems(nextItems);
      notify?.(`Nama berkas diperbarui menjadi "${renamingInput.trim()}"`, 'success');
    }

    setRenamingTarget(null);
    setRenamingInput('');
  };

  // Move file to folder
  const handleMoveFile = async (targetFolderId: string | null) => {
    if (!movingFile) return;
    const targetFolderObj = folders.find(f => f.id === targetFolderId);
    const next = items.map(i => i.id === movingFile.id ? {
      ...i,
      folderId: targetFolderId || undefined,
      folder: targetFolderObj ? targetFolderObj.name : 'Beranda'
    } : i);
    await saveItems(next);
    notify?.(`Berkas dipindahkan ke ${targetFolderObj ? targetFolderObj.name : 'Beranda Berkas'}`, 'success');
    setMovingFile(null);
  };

  // Delete Folder
  const handleDeleteFolder = (folder: VaultFolder) => {
    const action = async () => {
      const nextFolders = folders.filter(f => f.id !== folder.id);
      await saveFolders(nextFolders);
      // Move items in folder to root
      const nextItems = items.map(i => i.folderId === folder.id ? { ...i, folderId: undefined, folder: 'Beranda' } : i);
      await saveItems(nextItems);
      if (currentFolderId === folder.id) setCurrentFolderId(null);
      notify?.(`Folder "${folder.name}" dihapus. Berkas di dalamnya dipindahkan ke Beranda.`, 'info');
    };

    if (confirm) {
      confirm({
        title: 'Hapus Folder?',
        message: `Hapus folder "${folder.name}"? Berkas di dalamnya tidak akan hilang dan akan dipindahkan ke Beranda Berkas.`,
        isDestructive: true,
        onConfirm: action
      });
    } else {
      if (window.confirm(`Hapus folder "${folder.name}"?`)) action();
    }
  };

  // Delete File
  const handleDeleteFile = (item: MediaVaultItem) => {
    const action = () => {
      const next = items.filter(i => i.id !== item.id);
      saveItems(next);
      notify?.(`Berkas "${item.name}" berhasil dihapus.`, 'info');
    };

    if (confirm) {
      confirm({
        title: 'Hapus Berkas?',
        message: `Hapus berkas "${item.name}" dari File Manager? Tindakan ini tidak dapat dibatalkan.`,
        isDestructive: true,
        onConfirm: action
      });
    } else {
      if (window.confirm(`Hapus "${item.name}"?`)) action();
    }
  };

  // Preview file: LANGSUNG BUKA NEW TAB
  const handleOpenNewTab = (item: MediaVaultItem) => {
    if (!item.url) return;
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUrl = (item: MediaVaultItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
    notify?.('Tautan berkas berhasil disalin!', 'success');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render Source Badge
  const renderSourceBadge = (item: MediaVaultItem) => {
    const src = item.source || detectSource(item.url);
    if (src === 'drive') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 100,
          background: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          fontSize: 10,
          fontWeight: 800
        }}>
          <HardDrive size={10} /> Google Drive
        </span>
      );
    }
    if (src === 'cloudinary') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 100,
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#3b82f6',
          fontSize: 10,
          fontWeight: 800
        }}>
          <Cloud size={10} /> Cloud CDN
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 100,
        background: 'rgba(168, 85, 247, 0.15)',
        color: '#a855f7',
        fontSize: 10,
        fontWeight: 800
      }}>
        <Globe size={10} /> Cloud Link
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── Top Header Bar ── */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 22,
        padding: '18px 24px',
        boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Kembali"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                color: 'var(--cms-text, currentColor)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(59, 130, 246, 0.18))',
            color: '#22c55e',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <HardDrive size={22} strokeWidth={2.4} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
              Media
            </h2>
            <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: 'rgba(34, 197, 94, 0.14)', border: '1px solid rgba(34, 197, 94, 0.28)', color: '#22c55e' }}>
              {folders.length} Folder • {items.length} Berkas
            </span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* New Folder Button */}
          <button
            type="button"
            onClick={() => setShowAddFolderModal(true)}
            style={{
              padding: '9px 16px',
              borderRadius: 100,
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: 'var(--cms-text)',
              border: '1px solid var(--cms-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 750
            }}
          >
            <FolderPlus size={16} color="#3b82f6" />
            <span>Folder</span>
          </button>

          {/* Upload File Button */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xlsx,.zip"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Unggah Berkas ke Folder Ini"
            style={{
              padding: '9px 16px',
              borderRadius: 100,
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
              boxShadow: 'none'
            }}
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>{isUploading ? 'Upload...' : 'Upload'}</span>
          </button>

          {/* Link Drive Button */}
          <button
            type="button"
            onClick={() => {
              setLinkForm(prev => ({ ...prev, folderId: currentFolderId || '' }));
              setShowAddLinkModal(true);
            }}
            title="Tautkan Tautan Google Drive atau Berkas Cloud"
            style={{
              padding: '9px 18px',
              borderRadius: 100,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
              boxShadow: 'none'
            }}
          >
            <Plus size={16} />
            <span>Drive</span>
          </button>
        </div>
      </div>

      {/* ── Breadcrumb Explorer & Search Navigation ── */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 18,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Breadcrumb Path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            style={{
              background: 'none',
              border: 'none',
              color: currentFolderId === null ? 'var(--cms-text)' : 'var(--cms-text-muted)',
              fontSize: 13,
              fontWeight: currentFolderId === null ? 900 : 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 8
            }}
          >
            <Home size={15} color={currentFolderId === null ? '#22c55e' : undefined} />
            <span>Beranda Berkas</span>
          </button>

          {currentFolder && (
            <>
              <ChevronRight size={14} color="var(--cms-text-muted)" />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 8,
                background: `${currentFolder.color || '#3b82f6'}15`,
                color: currentFolder.color || '#3b82f6',
                fontSize: 13,
                fontWeight: 900
              }}>
                <FolderOpen size={15} />
                <span>{currentFolder.name}</span>
              </div>
            </>
          )}
        </div>

        {/* Search, Filter & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari folder & berkas..."
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: 100,
                border: '1px solid var(--cms-border)',
                background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                color: 'var(--cms-text)',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))', borderRadius: 8, padding: 3, border: '1px solid var(--cms-border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--cms-card-bg, #ffffff)' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer'
              }}
              title="Tampilan Grid"
            >
              <Grid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--cms-card-bg, #ffffff)' : 'transparent',
                border: 'none',
                color: viewMode === 'list' ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer'
              }}
              title="Tampilan List"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-Filter Bar: Cloud Source & File Types ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        {/* Source Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Semua Storage', icon: <HardDrive size={12} /> },
            { id: 'drive', label: 'Google Drive', icon: <HardDrive size={12} color="#22c55e" /> },
            { id: 'cloudinary', label: 'Cloud CDN', icon: <Cloud size={12} color="#3b82f6" /> },
            { id: 'external', label: 'Cloud Lain', icon: <Globe size={12} color="#a855f7" /> },
          ].map(src => {
            const isAct = sourceFilter === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => setSourceFilter(src.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 100,
                  border: isAct ? 'none' : '1px solid var(--cms-border)',
                  background: isAct ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                  color: isAct ? '#ffffff' : 'var(--cms-text-muted)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {src.icon}
                <span>{src.label}</span>
              </button>
            );
          })}
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { id: 'all', label: 'Semua Tipe' },
            { id: 'image', label: 'Gambar' },
            { id: 'video', label: 'Video' },
            { id: 'document', label: 'Dokumen' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTypeFilter(t.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: 100,
                border: 'none',
                background: activeTypeFilter === t.id ? 'var(--cms-switcher-bg, rgba(255,255,255,0.15))' : 'transparent',
                color: activeTypeFilter === t.id ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                fontSize: 11.5,
                fontWeight: activeTypeFilter === t.id ? 800 : 600,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BAGIAN 1: FOLDER DIRECTORY GRID ── */}
      {displayedFolders.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Folder Direktori</span>
            <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>({displayedFolders.length})</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12
          }}>
            {displayedFolders.map(folder => {
              const fileCount = items.filter(i => i.folderId === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  style={{
                    background: 'var(--cms-card-bg, #ffffff)',
                    border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--cms-shadow-sm, 0 2px 8px rgba(0,0,0,0.03))'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = folder.color || '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--cms-border, rgba(255,255,255,0.1))'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${folder.color || '#3b82f6'}18`,
                      color: folder.color || '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Folder size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: 'var(--cms-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {folder.name}
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                        {fileCount} Berkas
                      </span>
                    </div>
                  </div>

                  {/* Folder Options Menu */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingTarget({ type: 'folder', id: folder.id, name: folder.name });
                        setRenamingInput(folder.name);
                      }}
                      title="Ubah Nama Folder"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--cms-text-muted)',
                        cursor: 'pointer',
                        padding: 4
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder)}
                      title="Hapus Folder"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 4
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BAGIAN 2: BERKAS (FILES) VIEW ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
              Berkas {currentFolder ? `di ${currentFolder.name}` : 'Tersimpan'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontWeight: 600 }}>({displayedFiles.length})</span>
          </div>

          <div title="Klik berkas untuk pratinjau langsung di tab baru" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--cms-text-muted)', cursor: 'help' }}>
            <Info size={14} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--cms-text-muted)' }}>
            <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: 13 }}>Memuat berkas...</p>
          </div>
        ) : displayedFiles.length === 0 ? (
          <div style={{
            padding: '50px 20px',
            textAlign: 'center',
            borderRadius: 20,
            background: 'var(--cms-card-bg)',
            border: '1.5px dashed var(--cms-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10
          }}>
            <FileText size={38} style={{ opacity: 0.3, color: 'var(--cms-text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>
              Folder Ini Kosong
            </h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--cms-text-muted)', maxWidth: 340 }}>
              Belum ada berkas di dalam folder ini. Klik tombol <strong>Upload Berkas</strong> atau <strong>Tautkan Drive</strong> di atas.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID BERKAS ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: 16
          }}>
            {displayedFiles.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                  borderRadius: 18,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 10,
                  boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.03))',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Thumbnail yang LANGSUNG BUKA NEW TAB */}
                  <div
                    onClick={() => handleOpenNewTab(item)}
                    style={{
                      width: '100%',
                      height: 130,
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      border: '1px solid var(--cms-border)'
                    }}
                    title="Buka Langsung di Tab Baru"
                  >
                    {item.type === 'image' ? (
                      <img
                        src={getOptimizedThumbUrl(item.url)}
                        alt={item.name}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : item.type === 'video' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#3b82f6' }}>
                        <Video size={34} />
                        <span style={{ fontSize: 10, fontWeight: 700 }}>Berkas Video</span>
                      </div>
                    ) : item.type === 'audio' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#ec4899' }}>
                        <Music size={34} />
                        <span style={{ fontSize: 10, fontWeight: 700 }}>Berkas Audio</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#22c55e' }}>
                        <FileText size={34} />
                        <span style={{ fontSize: 10, fontWeight: 700 }}>Dokumen / Drive</span>
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '3px 7px',
                      borderRadius: 6,
                      fontSize: 9.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <ExternalLink size={10} /> Tab Baru
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                      {renderSourceBadge(item)}
                      <span style={{ fontSize: 10, color: 'var(--cms-text-muted)' }}>
                        {formatFileSize(item.size)}
                      </span>
                    </div>

                    <h4
                      onClick={() => handleOpenNewTab(item)}
                      style={{
                        margin: '2px 0 0',
                        fontSize: 13.5,
                        fontWeight: 800,
                        color: 'var(--cms-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer'
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                  </div>
                </div>

                {/* File Action Toolbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid var(--cms-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Buka Tab Baru */}
                    <button
                      type="button"
                      onClick={() => handleOpenNewTab(item)}
                      title="Buka di Tab Baru"
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--cms-border)',
                        background: 'var(--cms-switcher-bg)',
                        color: 'var(--cms-text)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                      }}
                    >
                      <ExternalLink size={11} /> Tab
                    </button>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      title="Salin Link"
                      style={{
                        padding: '5px 7px',
                        borderRadius: 6,
                        border: '1px solid var(--cms-border)',
                        background: 'var(--cms-switcher-bg)',
                        color: copiedId === item.id ? '#10b981' : 'var(--cms-text)',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === item.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>

                    {/* AI Story 9:16 Expand Hack */}
                    {item.type === 'image' && (
                      <button
                        type="button"
                        onClick={() => {
                          const storyUrl = getCloudinaryGenerativeFill(item.url, '9:16');
                          window.open(storyUrl, '_blank');
                          notify?.('Membuka foto versi Story 9:16 (AI Generative Fill)', 'success');
                        }}
                        title="AI Generative Fill: Expand foto ke format vertikal Story 9:16 tanpa crop"
                        style={{
                          padding: '5px 7px',
                          borderRadius: 6,
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          background: 'rgba(139, 92, 246, 0.1)',
                          color: '#8b5cf6',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 10.5,
                          fontWeight: 800
                        }}
                      >
                        <Sparkles size={11} /> 9:16
                      </button>
                    )}

                    {/* Move to Folder */}
                    <button
                      type="button"
                      onClick={() => setMovingFile(item)}
                      title="Pindahkan ke Folder Lain"
                      style={{
                        padding: '5px 7px',
                        borderRadius: 6,
                        border: '1px solid var(--cms-border)',
                        background: 'var(--cms-switcher-bg)',
                        color: 'var(--cms-text)',
                        cursor: 'pointer'
                      }}
                    >
                      <Folder size={12} />
                    </button>

                    {/* Rename */}
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingTarget({ type: 'file', id: item.id, name: item.name });
                        setRenamingInput(item.name);
                      }}
                      title="Ubah Nama (Rename)"
                      style={{
                        padding: '5px 7px',
                        borderRadius: 6,
                        border: '1px solid var(--cms-border)',
                        background: 'var(--cms-switcher-bg)',
                        color: 'var(--cms-text)',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(item)}
                    title="Hapus Berkas"
                    style={{
                      padding: '5px 7px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── LIST BERKAS ── */
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
            borderRadius: 18,
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--cms-text-muted)', fontSize: 11 }}>NAMA BERKAS</th>
                  <th style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--cms-text-muted)', fontSize: 11 }}>STORAGE</th>
                  <th style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--cms-text-muted)', fontSize: 11 }}>FOLDER</th>
                  <th style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--cms-text-muted)', fontSize: 11 }}>UKURAN</th>
                  <th style={{ padding: '10px 16px', fontWeight: 800, color: 'var(--cms-text-muted)', fontSize: 11, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {displayedFiles.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--cms-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        onClick={() => handleOpenNewTab(item)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                        title="Buka di Tab Baru"
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--cms-switcher-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                          {item.type === 'image' ? <ImageIcon size={15} /> : item.type === 'video' ? <Video size={15} /> : <FileText size={15} />}
                        </div>
                        <span style={{ fontWeight: 750, color: 'var(--cms-text)' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{renderSourceBadge(item)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--cms-text-muted)' }}>{item.folder || 'Beranda'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--cms-text-muted)' }}>{formatFileSize(item.size)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenNewTab(item)}
                          title="Buka di Tab Baru"
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--cms-border)',
                            background: 'var(--cms-switcher-bg)',
                            color: 'var(--cms-text)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <ExternalLink size={11} /> Tab Baru
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item)}
                          style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: copiedId === item.id ? '#10b981' : 'var(--cms-text)', cursor: 'pointer' }}
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMovingFile(item)}
                          title="Pindahkan Folder"
                          style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer' }}
                        >
                          <Folder size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingTarget({ type: 'file', id: item.id, name: item.name });
                            setRenamingInput(item.name);
                          }}
                          style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', cursor: 'pointer' }}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(item)}
                          style={{ padding: '4px 6px', borderRadius: 6, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: BUAT FOLDER BARU ── */}
      {showAddFolderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--cms-card-bg, #0f172a)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
            borderRadius: 20,
            padding: 22,
            maxWidth: 400,
            width: '100%',
            color: 'var(--cms-text, #ffffff)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderPlus size={18} color="#3b82f6" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Buat Folder Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFolderModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Nama Folder:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={folderForm.name}
                  onChange={e => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="Contoh: Proyek Klien VIP"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--cms-border)',
                    background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Warna Folder:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['#3b82f6', '#22c55e', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFolderForm({ ...folderForm, color })}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: color,
                        border: folderForm.color === color ? '2.5px solid #ffffff' : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddFolderModal(false)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)', fontSize: 12.5, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  Buat Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: TAUTKAN GOOGLE DRIVE / LINK ── */}
      {showAddLinkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--cms-card-bg, #0f172a)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
            borderRadius: 20,
            padding: 22,
            maxWidth: 460,
            width: '100%',
            color: 'var(--cms-text, #ffffff)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={18} color="#22c55e" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Tautkan Berkas Google Drive / Cloud</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLinkModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Nama Berkas / Item:
                </label>
                <input
                  type="text"
                  required
                  value={linkForm.name}
                  onChange={e => setLinkForm({ ...linkForm, name: e.target.value })}
                  placeholder="Contoh: Master Desain PSD (Drive)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--cms-border)',
                    background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  URL Berkas Google Drive / Cloud:
                </label>
                <input
                  type="url"
                  required
                  value={linkForm.url}
                  onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--cms-border)',
                    background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                    Sumber Storage:
                  </label>
                  <select
                    value={linkForm.source}
                    onChange={e => setLinkForm({ ...linkForm, source: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--cms-border)',
                      background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      outline: 'none'
                    }}
                  >
                    <option value="drive">Google Drive</option>
                    <option value="cloudinary">Cloudinary CDN</option>
                    <option value="external">Cloud Web Lainnya</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                    Tipe Konten:
                  </label>
                  <select
                    value={linkForm.type}
                    onChange={e => setLinkForm({ ...linkForm, type: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--cms-border)',
                      background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                      color: 'var(--cms-text)',
                      fontSize: 12.5,
                      outline: 'none'
                    }}
                  >
                    <option value="document">Dokumen / Folder</option>
                    <option value="image">Gambar</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                  Simpan di Folder:
                </label>
                <select
                  value={linkForm.folderId}
                  onChange={e => setLinkForm({ ...linkForm, folderId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--cms-border)',
                    background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                    color: 'var(--cms-text)',
                    fontSize: 12.5,
                    outline: 'none'
                  }}
                >
                  <option value="">(Beranda Berkas / Tanpa Folder)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(false)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)', fontSize: 12.5, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PINDAHKAN BERKAS KE FOLDER (MOVE TO) ── */}
      {movingFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--cms-card-bg, #0f172a)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
            borderRadius: 20,
            padding: 22,
            maxWidth: 380,
            width: '100%',
            color: 'var(--cms-text, #ffffff)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Folder size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Pindahkan Berkas</h3>
              </div>
              <button type="button" onClick={() => setMovingFile(null)} style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--cms-text-muted)' }}>
              Pindahkan <strong>{movingFile.name}</strong> ke:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              <button
                type="button"
                onClick={() => handleMoveFile(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--cms-border)',
                  background: !movingFile.folderId ? 'var(--cms-switcher-bg)' : 'transparent',
                  color: 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Home size={14} /> Beranda Berkas (Root)
              </button>
              {folders.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleMoveFile(f.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--cms-border)',
                    background: movingFile.folderId === f.id ? 'var(--cms-switcher-bg)' : 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Folder size={14} color={f.color || '#3b82f6'} /> {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RENAME TARGET (FILE ATAU FOLDER) ── */}
      {renamingTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--cms-card-bg, #0f172a)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
            borderRadius: 20,
            padding: 22,
            maxWidth: 380,
            width: '100%',
            color: 'var(--cms-text, #ffffff)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={17} color="#0d9488" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                  Ubah Nama {renamingTarget.type === 'folder' ? 'Folder' : 'Berkas'}
                </h3>
              </div>
              <button type="button" onClick={() => setRenamingTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={renamingInput}
              onChange={e => setRenamingInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--cms-border)',
                background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
                color: 'var(--cms-text)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setRenamingTarget(null)}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text-muted)', fontSize: 12.5, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#0d9488', color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaVaultManager;
