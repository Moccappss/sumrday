import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Search, FileText, Settings, Image as ImageIcon, Trash2, Edit3, Eye, 
  Layout, Tag, Calendar, Bold, Italic, Underline, Heading1, Heading2, 
  Plus, X, AlignLeft, AlignCenter, AlignRight, Type, Quote, Code, ListOrdered, Undo, Redo, Strikethrough, 
  CheckCircle2, Clock, Table, Heading3, Heading4, 
  Subscript, Superscript, Eraser, Palette, Highlighter,
  Maximize, Minimize, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Star,
  List as ListIcon, Link as LinkIcon, Video, File, Copy, ExternalLink,
  Sparkles, Zap, Wand2, BookOpen, TrendingUp, Cpu, Award, Briefcase, Info, Loader2, SlidersHorizontal, Bookmark,
  Check, EyeOff, Share2
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { notifyBlog } from '../../utils/notifications';
import { useDialog } from './DialogProvider';
import { useContextMenu } from './ContextMenuProvider';
import MediaGalleryModal from './MediaGalleryModal';
import GlassColorPicker from './GlassColorPicker';
import GlassSelect from './GlassSelect';
import { OFFLINE_BLOG_TEMPLATES, buildOfflineBlogPost, type OfflineBlogTemplate } from '../../utils/offlineTemplates';
import { generateAiBlogPost, callGemini } from '../../utils/ai';
import InfoTooltip from './InfoTooltip';
import { 
  getCustomBlogTemplates, 
  saveCustomBlogTemplate, 
  deleteCustomBlogTemplate, 
  getCustomBlogCategories, 
  addCustomBlogCategory, 
  CustomBlogTemplate 
} from '../../utils/customTemplatesStorage';
import CustomDropdown from './CustomDropdown';
import UpdatesFeedManager from './blog/UpdatesFeedManager';

const BLOG_ICON_MAP: Record<string, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  BookOpen,
  TrendingUp,
  Cpu,
  Zap,
  Award,
  Briefcase,
  FileText,
  Sparkles,
  Info
};

const BlogManager: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialViewMode = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('/admin/updates') || path.includes('/admin/update')) {
        return 'updates';
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'settings') {
        return 'categories';
      }
    }
    return 'list';
  };

  const { showConfirm, showAlert } = useDialog();
  const { bindContextMenu, openContextMenu } = useContextMenu();
  const [posts, setPosts] = useState([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [categories, setCategories] = useState([]);
  const [featuredPostIds, setFeaturedPostIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<string>(getInitialViewMode);

  useEffect(() => {
    if (location.pathname.includes('/admin/updates') || location.pathname.includes('/admin/update')) {
      if (viewMode !== 'updates') setViewMode('updates');
    } else if (location.pathname.includes('/admin/blog')) {
      const params = new URLSearchParams(location.search);
      if (params.get('tab') === 'settings') {
        if (viewMode !== 'categories') setViewMode('categories');
      } else {
        if (viewMode === 'updates') setViewMode('list');
      }
    }
  }, [location.pathname, location.search]);

  const handleSwitchTab = (mode: 'updates' | 'list' | 'categories') => {
    setViewMode(mode);
    if (mode === 'updates') {
      navigate('/admin/updates');
    } else if (mode === 'list') {
      navigate('/admin/blog');
    } else if (mode === 'categories') {
      navigate('/admin/blog?tab=settings');
    }
  };
  const [currentPost, setCurrentPost] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [newCategory, setNewCategory] = useState('');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(() => typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth <= 1240) : false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const editorRef = useRef(null);
  const [savedSelection, setSavedSelection] = useState(null);
  const [showMediaPopup, setShowMediaPopup] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTextInput, setMediaTextInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState(null);
  const [activeTableNode, setActiveTableNode] = useState(null);
  const [activeTableCellNode, setActiveTableCellNode] = useState(null);
  const [customFontSize, setCustomFontSize] = useState('16');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showTablePopup, setShowTablePopup] = useState(false);
  const [tRows, setTRows] = useState(3);
  const [tCols, setTCols] = useState(3);
  const [tBorder, setTBorder] = useState(true);
  const [tAlign, setTAlign] = useState('left');

  // State: AI & Offline Blog Template Generator
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [blogGenMode, setBlogGenMode] = useState<'offline' | 'ai'>('offline');
  const [aiBlogPrompt, setAiBlogPrompt] = useState('Tuliskan panduan praktis membangun identitas visual brand untuk pemula.');
  const [aiBlogTemplateType, setAiBlogTemplateType] = useState<string>('tutorial_step_by_step');
  const [aiBlogCategoryFilter, setAiBlogCategoryFilter] = useState<string>('all');
  const [aiBlogSearchQuery, setAiBlogSearchQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // State: Custom Blog Templates & Categories
  const [customBlogTemplates, setCustomBlogTemplates] = useState<CustomBlogTemplate[]>(() => getCustomBlogTemplates());
  const [customBlogCategories, setCustomBlogCategories] = useState<{ id: string; label: string }[]>(() => getCustomBlogCategories());
  const [isCreatingCustomTemplate, setIsCreatingCustomTemplate] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    label: '',
    category: 'Tutorial',
    newCategoryInput: '',
    title: '',
    description: '',
    prompt: '',
    tags: '',
    readingTime: '5 mnt'
  });

  // ── Smart AI SEO & Headline Generator ──
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [headlineSuggestions, setHeadlineSuggestions] = useState<string[]>([]);

  const handleAutoGenerateSeo = async () => {
    if (!currentPost?.title) {
      showAlert('Ketik judul artikel terlebih dahulu agar AI dapat merangkum SEO.', 'Pemberitahuan');
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const contentSnippet = (editorRef.current?.innerText || currentPost.content || '').slice(0, 1000);
      const prompt = `Artikel berjudul: "${currentPost.title}". Cuplikan konten: "${contentSnippet}".
Tolong buatkan:
1. Meta Title (maks 55 karakter, menarik untuk pencarian Google)
2. Meta Description (wajib antara 120-150 karakter, persuasif, ringkas)
3. 4 Tags kata kunci dipisahkan koma

Keluarkan hanya JSON valid tanpa markdown backtick:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "tags": ["tag1", "tag2", "tag3"]
}`;
      const res = await callGemini(prompt, 'Anda adalah pakar SEO profesional.', 250);
      const clean = res.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);

      setCurrentPost(prev => ({
        ...prev,
        metaTitle: parsed.metaTitle || prev.metaTitle,
        metaDescription: parsed.metaDescription || prev.metaDescription,
        tags: Array.isArray(parsed.tags) ? parsed.tags : prev.tags
      }));
      showAlert('✅ Meta Title, Meta Description, & Tag SEO berhasil diisi otomatis oleh AI!', 'Sukses');
    } catch (e) {
      showAlert('Gagal menghasilkan snippet SEO otomatis.', 'Error');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleGenerateAiHeadlines = async () => {
    const topic = currentPost?.title || 'Strategi Desain & Branding Kreatif';
    setIsGeneratingHeadlines(true);
    try {
      const prompt = `Berikan 3 variasi judul artikel blog yang sangat menarik, ber-CTR tinggi, profesional, dan ramah SEO untuk topik: "${topic}". Format output: HANYA 3 baris judul tanpa nomor dan tanpa tanda kutip.`;
      const res = await callGemini(prompt, 'Anda adalah copywriter editorial profesional.', 150);
      const list = res.split('\n').map(s => s.trim().replace(/^["'\d\.\-\s]+/, '')).filter(Boolean);
      setHeadlineSuggestions(list);
    } catch (e) {
      showAlert('Gagal menghasilkan variasi judul.', 'Error');
    } finally {
      setIsGeneratingHeadlines(false);
    }
  };

  const handleSaveNewCustomTemplate = () => {
    if (!newTemplateForm.label.trim()) {
      showAlert('Nama template artikel wajib diisi!', 'Perhatian');
      return;
    }

    let finalCategory = newTemplateForm.category;
    if (newTemplateForm.newCategoryInput.trim()) {
      const addedCat = addCustomBlogCategory(newTemplateForm.newCategoryInput.trim());
      setCustomBlogCategories(getCustomBlogCategories());
      finalCategory = addedCat.id;
    }

    const saved = saveCustomBlogTemplate({
      label: newTemplateForm.label.trim(),
      category: finalCategory,
      title: newTemplateForm.title.trim() || newTemplateForm.label.trim(),
      description: newTemplateForm.description.trim() || 'Template artikel kustom',
      prompt: newTemplateForm.prompt.trim() || 'Kerangka artikel blog profesional',
      tags: newTemplateForm.tags.trim() || 'Kustom',
      readingTime: newTemplateForm.readingTime || '5 mnt'
    });

    setCustomBlogTemplates(getCustomBlogTemplates());
    setAiBlogTemplateType(saved.id);
    setIsCreatingCustomTemplate(false);
    setNewTemplateForm({ label: '', category: 'Tutorial', newCategoryInput: '', title: '', description: '', prompt: '', tags: '', readingTime: '5 mnt' });
    showAlert(`⭐ Template "${saved.label}" berhasil disimpan!`, 'Berhasil');
  };

  const handleDeleteCustomTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteCustomBlogTemplate(id);
    setCustomBlogTemplates(getCustomBlogTemplates());
    if (aiBlogTemplateType === id) {
      setAiBlogTemplateType('tutorial_step_by_step');
    }
  };

  const handleSaveActiveBlogAsTemplate = () => {
    if (!currentPost) {
      showAlert('Pilih atau buka artikel terlebih dahulu untuk disimpan sebagai template.', 'Perhatian');
      return;
    }
    const saved = saveCustomBlogTemplate({
      label: currentPost.title || 'Template Artikel Kustom',
      category: currentPost.category || 'Tutorial',
      title: currentPost.title || 'Template Artikel Kustom',
      description: currentPost.metaDescription || (currentPost.content ? currentPost.content.slice(0, 150) : 'Template artikel kustom'),
      prompt: currentPost.content || 'Kerangka artikel',
      tags: Array.isArray(currentPost.tags) ? currentPost.tags.join(', ') : 'Kustom',
      readingTime: `${currentPost.readTime || 5} mnt`
    });
    setCustomBlogTemplates(getCustomBlogTemplates());
    showAlert(`⭐ Artikel "${currentPost.title}" berhasil disimpan sebagai template!`, 'Berhasil');
  };

  const handleSelectBlogTemplate = (tmpl: any) => {
    setAiBlogTemplateType(tmpl.id);
    if (tmpl.prompt) {
      setAiBlogPrompt(tmpl.prompt);
    }
  };

  const handleApplyBlogTemplate = async () => {
    setAiError('');
    setIsAiGenerating(true);
    try {
      let articleData: any = null;
      if (blogGenMode === 'offline') {
        const customMatch = customBlogTemplates.find(t => t.id === aiBlogTemplateType);
        if (customMatch) {
          articleData = {
            title: customMatch.title || customMatch.label,
            category: customMatch.category || 'Umum',
            slug: (customMatch.title || customMatch.label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            content: customMatch.prompt || `<h2>${customMatch.title}</h2><p>${customMatch.description || ''}</p>`,
            tags: customMatch.tags ? customMatch.tags.split(',').map(t => t.trim()) : ['Kustom'],
            metaTitle: customMatch.title || customMatch.label,
            metaDescription: customMatch.description || (customMatch.title || customMatch.label),
            readTime: parseInt(customMatch.readingTime) || 5,
            status: 'Draft'
          };
        } else {
          articleData = buildOfflineBlogPost(aiBlogTemplateType, aiBlogPrompt);
        }
      } else {
        const result = await generateAiBlogPost(aiBlogPrompt, aiBlogTemplateType);
        if (!result || result.error) {
          setAiError(result?.error || 'Gagal menghasilkan artikel via AI.');
          setIsAiGenerating(false);
          return;
        }
        articleData = result;
      }

      if (articleData) {
        if (viewMode === 'edit' && currentPost) {
          const updatedPost = {
            ...currentPost,
            title: articleData.title || currentPost.title,
            category: articleData.category || currentPost.category || 'Umum',
            slug: articleData.slug || currentPost.slug,
            content: articleData.content || currentPost.content,
            tags: articleData.tags || currentPost.tags,
            metaTitle: articleData.metaTitle || currentPost.metaTitle,
            metaDescription: articleData.metaDescription || currentPost.metaDescription,
            readTime: articleData.readTime || currentPost.readTime || 4,
          };
          setCurrentPost(updatedPost);
          if (editorRef.current) {
            editorRef.current.innerHTML = updatedPost.content;
          }
          const updatedPosts = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
          setPosts(updatedPosts);
          await storage.setItem('porto_blog_posts', updatedPosts);
          window.dispatchEvent(new Event('porto_blog_saved'));
          showAlert(`✅ Template "${updatedPost.title}" berhasil diterapkan pada artikel!`, 'Sukses');
        } else {
          const newPost = {
            id: `post-${Date.now()}`,
            title: articleData.title || 'Artikel Baru',
            category: articleData.category || 'Umum',
            slug: articleData.slug || 'artikel-baru',
            content: articleData.content || '<p>Konten artikel...</p>',
            tags: articleData.tags || '',
            metaTitle: articleData.metaTitle || '',
            metaDescription: articleData.metaDescription || '',
            readTime: articleData.readTime || 4,
            status: 'Published',
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            thumbnail: articleData.thumbnail || ''
          };
          const updatedPosts = [newPost, ...posts];
          setPosts(updatedPosts);
          await storage.setItem('porto_blog_posts', updatedPosts);
          window.dispatchEvent(new Event('porto_blog_saved'));
          setCurrentPost(newPost);
          setViewMode('edit');
          showAlert(`✨ Artikel baru "${newPost.title}" berhasil dibuat dari template!`, 'Sukses');
        }
        setIsTemplateModalOpen(false);
      }
    } catch (err: any) {
      console.error('Error applying blog template:', err);
      setAiError(err.message || 'Gagal menerapkan template artikel.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  useEffect(() => {
    const handleGlobalAdd = () => {
      if (viewMode === 'list') {
        handleCreatePost();
      }
    };
    window.addEventListener('cms_global_add', handleGlobalAdd);
    return () => window.removeEventListener('cms_global_add', handleGlobalAdd);
  }, [viewMode]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w <= 1240);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const savedPosts = await storage.getItem('porto_blog_posts', []);
      const savedCats = await storage.getItem('porto_blog_categories', ['Umum', 'Teknologi', 'Gaya Hidup']);
      const savedFeatured = await storage.getItem('porto_blog_featured', []);
      setPosts(savedPosts);
      setCategories(savedCats);
      setFeaturedPostIds(Array.isArray(savedFeatured) ? savedFeatured : (savedFeatured ? [savedFeatured] : []));
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  useEffect(() => {
    if (viewMode === 'edit' && editorRef.current && currentPost) {
      if (editorRef.current.dataset.postId !== currentPost.id) {
        editorRef.current.innerHTML = currentPost.content || '';
        editorRef.current.dataset.postId = currentPost.id;
      }
    }
  }, [viewMode, currentPost]);

  const savePost = async (postToSave, isAutoSave = false) => {
    if (!postToSave.title) return;
    if (!postToSave.slug) {
      postToSave.slug = postToSave.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    try {
      const isNew = !posts.find(p => p.id === postToSave.id);
      const updatedPosts = isNew ? [postToSave, ...posts] : posts.map(p => p.id === postToSave.id ? postToSave : p);
      await storage.setItem('porto_blog_posts', updatedPosts);
      setPosts(updatedPosts);
      window.dispatchEvent(new Event('porto_blog_saved'));
      if (!isAutoSave || isNew) {
        notifyBlog(postToSave.title || 'Artikel Blog', isNew ? 'dibuat' : 'disimpan');
      }
    } catch (err) {
      if (!isAutoSave) showAlert('Gagal menyimpan artikel', 'error');
    }
  };

  const handleBroadcastPostToFeed = async (post: any) => {
    try {
      const existingUpdates: any[] = (await storage.getItem('porto_social_updates', [])) || [];
      const newUpdateId = `upd-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const todayDate = nowIso.slice(0, 10);
      const title = post.title || 'Artikel Baru';
      const cleanContent = (post.content || '').replace(/<[^>]*>/g, '').trim();

      const newUpdate = {
        id: newUpdateId,
        title: `Artikel Baru: ${title}`,
        category: 'article',
        content: post.excerpt || (cleanContent.slice(0, 200) + (cleanContent.length > 200 ? '...' : '')) || `Wawasan baru dari studio kami: "${title}". Simak ulasan selengkapnya di blog.`,
        mediaUrls: post.thumbnail ? [post.thumbnail] : [],
        mediaType: 'image',
        projectTag: post.category || 'Wawasan Industri',
        projectUrl: `/blog/${post.slug || post.id}`,
        ctaLabel: 'Baca Artikel Lengkap',
        badge: 'Artikel Baru',
        customDate: todayDate,
        createdAt: nowIso,
        likesCount: 0,
        isPinned: false,
        isPublished: true,
        author: {
          name: 'sumr.day',
          role: 'Creative Digital Studio & Enterprise Systems',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        }
      };

      const updated = [newUpdate, ...(Array.isArray(existingUpdates) ? existingUpdates : [])];
      await storage.setItem('porto_social_updates', updated);
      window.dispatchEvent(new CustomEvent('porto_social_updates_changed', { detail: updated }));
      window.dispatchEvent(new CustomEvent('porto_updates_updated', { detail: updated }));
      showAlert?.(`✓ Artikel "${title}" berhasil disiarkan ke Feed Beranda!`, 'Siarkan Berhasil');
    } catch (err) {
      console.error('Broadcast article error:', err);
      showAlert?.('Gagal menyiarkan artikel ke feed', 'Error');
    }
  };

  const handleBulkBroadcastPosts = async () => {
    if (selectedPostIds.length === 0) return;
    const targets = posts.filter((p: any) => selectedPostIds.includes(p.id));
    for (const p of targets) {
      await handleBroadcastPostToFeed(p);
    }
    setSelectedPostIds([]);
    showAlert?.(`✓ Berhasil menyiarkan ${targets.length} artikel ke Feed Beranda!`, 'Siarkan Berhasil');
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) { showAlert('Kategori sudah ada', 'error'); return; }
    const updatedCats = [...categories, newCategory.trim()];
    await storage.setItem('porto_blog_categories', updatedCats);
    setCategories(updatedCats);
    setNewCategory('');
  };

  const handleDeleteCategory = async (cat) => {
    const confirmed = await showConfirm(`Hapus kategori "${cat}"? Artikel dengan kategori ini akan dipindah ke "Umum".`);
    if (confirmed) {
      const updatedCats = categories.filter(c => c !== cat);
      if (!updatedCats.includes('Umum')) updatedCats.unshift('Umum');
      await storage.setItem('porto_blog_categories', updatedCats);
      setCategories(updatedCats);
      const updatedPosts = posts.map(p => p.category === cat ? { ...p, category: 'Umum' } : p);
      await storage.setItem('porto_blog_posts', updatedPosts);
      setPosts(updatedPosts);
    }
  };

  const handleCreatePost = () => {
    const newPost = {
      id: `post_${Date.now()}`,
      title: '', slug: '', content: '', thumbnail: '', status: 'Draft', tags: '',
      category: categories[0] || 'Umum',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      views: 0, metaTitle: '', metaDescription: ''
    };
    setCurrentPost(newPost);
    setViewMode('edit');
    if (isMobile) { setShowMobileSidebar(false); setShowMobileSettings(false); }
  };

  // ── AUTO-OPEN CREATE BLOG POST (GLOBAL SHORTCUT / SLASH COMMAND / SEARCH INTENT) ──
  useEffect(() => {
    const onAdd = () => handleCreatePost();
    const onOpenUpdates = () => {
      handleSwitchTab('updates');
    };

    if (typeof window !== 'undefined' && sessionStorage.getItem('porto_auto_create_blog') === '1') {
      sessionStorage.removeItem('porto_auto_create_blog');
      setTimeout(onAdd, 150);
    }

    window.addEventListener('porto_add_blog_post', onAdd);
    window.addEventListener('porto_create_blog', onAdd);
    window.addEventListener('porto_open_updates', onOpenUpdates);
    return () => {
      window.removeEventListener('porto_add_blog_post', onAdd);
      window.removeEventListener('porto_create_blog', onAdd);
      window.removeEventListener('porto_open_updates', onOpenUpdates);
    };
  }, [categories, isMobile]);

  const handleEdit = (post) => {
    setCurrentPost({...post});
    setViewMode('edit');
    if (isMobile) { setShowMobileSidebar(false); setShowMobileSettings(false); }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Hapus artikel ini secara permanen?');
    if (confirmed) {
      const updated = posts.filter(p => p.id !== id);
      await storage.setItem('porto_blog_posts', updated);
      setPosts(updated);
    }
  };

  const toggleSelectPost = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPostIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllPosts = (list: any[]) => {
    if (selectedPostIds.length === list.length && list.length > 0) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(list.map(p => p.id));
    }
  };

  const handleBulkDeletePosts = async () => {
    if (selectedPostIds.length === 0) return;
    const count = selectedPostIds.length;
    const confirmed = await showConfirm(`Hapus permanen ${count} artikel yang ditandai?`);
    if (!confirmed) return;
    const updated = posts.filter(p => !selectedPostIds.includes(p.id));
    setPosts(updated);
    await storage.setItem('porto_blog_posts', updated);
    setSelectedPostIds([]);
    notifyBlog(`🗑️ ${count} artikel berhasil dihapus.`);
  };

  const handleListContextMenu = (e: React.MouseEvent, filteredList: any[]) => {
    e.preventDefault();
    openContextMenu(e, {
      title: 'Manajemen Artikel & Blog',
      subtitle: `${filteredList.length} artikel ditampilkan`,
      items: [
        {
          label: 'Tulis Artikel Baru',
          icon: <Plus size={15} color="#10b981" />,
          action: () => handleCreatePost()
        },
        {
          label: 'Buat dengan AI / Template',
          icon: <Wand2 size={15} color="#8b5cf6" />,
          action: () => setIsTemplateModalOpen(true)
        },
        {
          label: selectedPostIds.length === filteredList.length && filteredList.length > 0 ? 'Batalkan Semua Pilihan' : 'Tandai Semua Artikel',
          icon: <Check size={15} color="#6366f1" />,
          action: () => handleSelectAllPosts(filteredList)
        },
        ...(selectedPostIds.length > 0 ? [
          {
            label: `Hapus ${selectedPostIds.length} Artikel Ditandai`,
            icon: <Trash2 size={15} color="#ef4444" />,
            danger: true,
            action: handleBulkDeletePosts
          }
        ] : []),
        { separator: true, label: '' },
        {
          label: 'Buka Halaman Blog Publik',
          icon: <ExternalLink size={15} color="#38bdf8" />,
          action: () => window.open('/blog', '_blank')
        }
      ]
    });
  };

  const handleBackWithAutoSave = () => {
    if (currentPost) savePost(currentPost, true);
    handleSwitchTab('list');
    setCurrentPost(null);
  };

  const toggleStatus = (post) => {
    const updated = { ...post, status: post.status === 'Published' ? 'Draft' : 'Published' };
    savePost(updated, false);
    setCurrentPost(updated);
  };

  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel && sel.getRangeAt && sel.rangeCount) setSavedSelection(sel.getRangeAt(0));
    }
  };

  const restoreSelection = () => {
    if (savedSelection && window.getSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelection);
    }
  };

  const execCmd = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
  };

  const handleInsertMediaHTML = (html) => {
    editorRef.current?.focus();
    if (savedSelection) {
      restoreSelection();
    } else {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    document.execCommand('insertHTML', false, html + '<p><br></p>');
    if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
    setShowMediaPopup(false);
    setMediaUrlInput('');
    setMediaTextInput('');
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadToCloudinary(file, type === 'image' ? 'image' : 'video');
      if (res && res.url) {
        if (galleryTarget === 'cover') {
          setCurrentPost(prev => ({...prev, thumbnail: res.url}));
        } else {
          if (type === 'image') handleInsertMediaHTML(`<figure style="margin:24px auto; text-align:center; display:block;"><img src="${res.url}" alt="gambar blog" style="max-width:100%; border-radius:14px; display:block; margin:0 auto; box-shadow:0 6px 24px rgba(0,0,0,0.08);" /><figcaption style="margin-top:8px; font-size:12px; color:var(--cms-text-secondary, #64748b); font-style:italic; text-align:center;" contenteditable="true">Sumber / Keterangan: [Klik di sini untuk ketik sumber gambar]</figcaption></figure>`);
          else handleInsertMediaHTML(`<video src="${res.url}" controls style="max-width:100%; border-radius:12px; margin:20px 0;"></video>`);
        }
      }
    } catch (err) { showAlert('Upload gagal: ' + err.message, 'error'); }
    setIsUploading(false);
    setGalleryTarget(null);
  };

  const openMediaPopup = (type) => {
    saveSelection();
    setShowMediaPopup(type);
    setGalleryTarget('inline');
  };

  const processMediaLink = () => {
    if (!mediaUrlInput) return;
    let html = '';
    if (showMediaPopup === 'image') {
      const captionText = mediaTextInput ? `Sumber: ${mediaTextInput}` : 'Sumber / Keterangan: [Klik di sini untuk ketik sumber gambar]';
      html = `<figure style="margin:24px auto; text-align:center; display:block;"><img src="${mediaUrlInput}" alt="gambar blog" style="max-width:100%; border-radius:14px; display:block; margin:0 auto; box-shadow:0 6px 24px rgba(0,0,0,0.08);" /><figcaption style="margin-top:8px; font-size:12px; color:var(--cms-text-secondary, #64748b); font-style:italic; text-align:center;" contenteditable="true">${captionText}</figcaption></figure>`;
    } else if (showMediaPopup === 'video') {
      if (mediaUrlInput.includes('youtube.com') || mediaUrlInput.includes('youtu.be')) {
        let videoId = '';
        if (mediaUrlInput.includes('v=')) videoId = mediaUrlInput.split('v=')[1].split('&')[0];
        else if (mediaUrlInput.includes('youtu.be/')) videoId = mediaUrlInput.split('youtu.be/')[1].split('?')[0];
        if (videoId) html = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="border-radius:12px; margin:20px 0;"></iframe>`;
        else html = `<video src="${mediaUrlInput}" controls style="max-width:100%; border-radius:12px; margin:20px 0;"></video>`;
      } else {
        html = `<video src="${mediaUrlInput}" controls style="max-width:100%; border-radius:12px; margin:20px 0;"></video>`;
      }
    } else if (showMediaPopup === 'file' || showMediaPopup === 'link') {
      const text = mediaTextInput || (showMediaPopup === 'file' ? 'Download File' : 'Klik Disini');
      if (showMediaPopup === 'file') {
        html = `<a href="${mediaUrlInput}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:12px 24px; background:var(--cms-accent, #7c3aed); color:#fff; text-decoration:none; border-radius:99px; font-weight:bold; margin:20px 0;">⬇ ${text}</a>`;
      } else {
        html = `<a href="${mediaUrlInput}" target="_blank" rel="noopener noreferrer" style="color:var(--cms-accent, #7c3aed); text-decoration:underline;">${text}</a>`;
      }
    }
    handleInsertMediaHTML(html);
  };

  const insertTable = () => {
    let html = `<table style="width:100%; border-collapse:collapse; margin:20px ${tAlign === 'center' ? 'auto' : '0'}; text-align:${tAlign};"><tbody>`;
    for (let r = 0; r < tRows; r++) {
      html += '<tr>';
      for (let c = 0; c < tCols; c++) {
        const borderStyle = tBorder ? 'border:1px solid #ccc;' : 'border:none;';
        const bgStyle = r === 0 ? 'background:rgba(0,0,0,0.05); font-weight:bold;' : '';
        const tag = r === 0 ? 'th' : 'td';
        html += `<${tag} style="${borderStyle} padding:12px; ${bgStyle}">${r === 0 ? 'Header' : 'Isi'} ${c + 1}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    handleInsertMediaHTML(html);
    setShowTablePopup(false);
  };

  const addTableRow = (tableNode, cellNode) => {
    try {
      if (!tableNode) return;
      const tr = cellNode ? cellNode.closest('tr') : tableNode.querySelector('tr');
      if (!tr) return;
      const newTr = tr.cloneNode(true);
      newTr.querySelectorAll('td, th').forEach(cell => { cell.innerHTML = '&nbsp;'; });
      tr.insertAdjacentElement('afterend', newTr);
      if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
    } catch(e) { console.error(e); }
  };

  const removeTableRow = (tableNode, cellNode) => {
    try {
      if (!tableNode) return;
      const tr = cellNode ? cellNode.closest('tr') : tableNode.querySelector('tr');
      if (!tr) return;
      tr.remove();
      if (tableNode.querySelectorAll('tr').length === 0) { tableNode.remove(); setActiveTableNode(null); }
      setActiveTableCellNode(null);
      if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
    } catch(e) { console.error(e); }
  };

  const addTableCol = (tableNode, cellNode) => {
    try {
      if (!tableNode) return;
      const tr = cellNode ? cellNode.closest('tr') : tableNode.querySelector('tr');
      if (!tr) return;
      const cells = Array.from(tr.children);
      const cellIndex = cellNode ? cells.indexOf(cellNode) : cells.length - 1;
      if (cellIndex === -1) return;
      tableNode.querySelectorAll('tr').forEach(r => {
        const refCell = r.children[cellIndex];
        if (refCell) { const newCell = refCell.cloneNode(true); newCell.innerHTML = '&nbsp;'; refCell.insertAdjacentElement('afterend', newCell); }
      });
      if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
    } catch(e) { console.error(e); }
  };

  const removeTableCol = (tableNode, cellNode) => {
    try {
      if (!tableNode) return;
      const tr = cellNode ? cellNode.closest('tr') : tableNode.querySelector('tr');
      if (!tr) return;
      const cells = Array.from(tr.children);
      const cellIndex = cellNode ? cells.indexOf(cellNode) : cells.length - 1;
      if (cellIndex === -1) return;
      let columnsRemaining = 0;
      tableNode.querySelectorAll('tr').forEach(r => { if (r.children[cellIndex]) r.children[cellIndex].remove(); columnsRemaining = r.children.length; });
      if (columnsRemaining === 0) { tableNode.remove(); setActiveTableNode(null); }
      setActiveTableCellNode(null);
      if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
    } catch(e) { console.error(e); }
  };

  const resizeTableCol = (tableNode, cellNode, wider) => {
    if (!cellNode) return;
    const currentWidth = cellNode.style.width ? (parseInt(cellNode.style.width) || 100) : 100;
    const newWidth = wider ? currentWidth + 30 : Math.max(30, currentWidth - 30);
    const tr = cellNode.parentNode;
    const cellIndex = Array.from(tr.children).indexOf(cellNode);
    tableNode.querySelectorAll('tr').forEach(r => {
      if (r.children[cellIndex]) { r.children[cellIndex].style.width = newWidth + 'px'; r.children[cellIndex].style.minWidth = newWidth + 'px'; }
    });
    tableNode.style.width = 'max-content';
    if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
  };

  const deleteTable = (tableNode) => {
    tableNode.remove();
    setActiveTableNode(null);
    setActiveTableCellNode(null);
    if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
  };

  const applyCustomFontSize = (size) => {
    if (!size) return;
    editorRef.current?.focus();
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    document.execCommand('insertHTML', false, `<span style="font-size: ${size}px">${sel.toString()}</span>`);
    if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML}));
  };

  const handleEditorActivity = () => {
    if (!window.getSelection) return;
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    let el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
    let table = null, cell = null;
    while (el && el !== editorRef.current) {
      if (el.tagName === 'TD' || el.tagName === 'TH') cell = el;
      if (el.tagName === 'TABLE') { table = el; break; }
      el = el.parentNode;
    }
    setActiveTableNode(table);
    setActiveTableCellNode(cell);
  };

  const handlePreview = () => {
    if (!currentPost) return;
    savePost(currentPost, true);
    window.open(`/blog/${currentPost.slug || currentPost.id}`, '_blank');
  };

  useEffect(() => {
    const handleTemplateEvent = () => setIsTemplateModalOpen(true);
    const handlePreviewEvent = () => {
      if (currentPost) {
        handlePreview();
      } else {
        window.open('/blog', '_blank');
      }
    };
    const handleSaveEvent = () => {
      if (currentPost) {
        savePost(currentPost);
      } else {
        handleCreatePost();
      }
    };
    window.addEventListener('cms_blog_open_template', handleTemplateEvent);
    window.addEventListener('cms_blog_preview', handlePreviewEvent);
    window.addEventListener('cms_blog_save', handleSaveEvent);
    return () => {
      window.removeEventListener('cms_blog_open_template', handleTemplateEvent);
      window.removeEventListener('cms_blog_preview', handlePreviewEvent);
      window.removeEventListener('cms_blog_save', handleSaveEvent);
    };
  }, [currentPost]);

  const ToolbarBtn = ({ icon, onClick, title }) => (
    <button 
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-primary)', width: 44, height: 44, borderRadius: '50%', padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
      onMouseOver={(e) => e.currentTarget.style.background = 'var(--cms-switcher-bg)'}
      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {React.isValidElement(icon) ? React.cloneElement(icon, { size: 20 }) : icon}
    </button>
  );

  const publishedCount = posts.filter(p => p.status === 'Published').length;
  const draftCount = posts.filter(p => p.status === 'Draft').length;

  const filteredBlogTemplates = (OFFLINE_BLOG_TEMPLATES || []).filter(tmpl => {
    const matchesCategory = aiBlogCategoryFilter === 'all' || tmpl.category === aiBlogCategoryFilter;
    const q = aiBlogSearchQuery.toLowerCase();
    const matchesSearch = !q || tmpl.title.toLowerCase().includes(q) || (tmpl.description || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', height: '100%', overflow: 'hidden', background: 'var(--cms-bg)', position: 'relative' }}>
      <style>{`
        @keyframes bm-fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .super-editor-content ul { padding-left: 28px; margin-bottom: 24px; list-style-type: disc !important; }
        .super-editor-content ol { padding-left: 28px; margin-bottom: 24px; list-style-type: decimal !important; }
        .super-editor-content li { margin-bottom: 10px; padding-left: 6px; line-height: 1.85; font-family: inherit; }
        .super-editor-content li::marker { color: var(--cms-accent); font-weight: 700; }
        .super-editor-content blockquote { border-left: 4px solid var(--cms-accent); padding: 12px 16px; margin: 16px 0; background: var(--cms-bg-elevated); border-radius: 0 12px 12px 0; font-style: italic; color: var(--cms-text-secondary); }
        .super-editor-content table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .super-editor-content th, .super-editor-content td { border: 1px solid #4b5563 !important; padding: 12px; text-align: left; }
        .bm-post-card { transition: all 0.22s cubic-bezier(0.25, 1, 0.35, 1); }
        .bm-post-card:hover { border-color: rgba(var(--cms-accent-rgb), 0.35) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important; transform: translateY(-2px); }
        .blog-toolbar-scroll::-webkit-scrollbar { height: 3px; }
        .blog-toolbar-scroll::-webkit-scrollbar-track { background: transparent; }
        .blog-toolbar-scroll::-webkit-scrollbar-thumb { background: var(--cms-border); border-radius: 99px; }
        .blog-toolbar-scroll::-webkit-scrollbar-thumb:hover { background: var(--cms-text-muted); }
        .blog-toolbar-scroll { -ms-overflow-style: auto; scrollbar-width: thin; scrollbar-color: var(--cms-border) transparent; }
      `}</style>

      {/* Main Content Area */}
      <div style={isFullscreen ? {
        position: 'fixed', inset: 0, zIndex: 99999, background: 'var(--cms-bg)', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100vw', height: '100vh'
      } : { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {/* Tablet overlay */}
        {isTablet && (showMobileSidebar || showMobileSettings) && (
          <div onClick={() => { setShowMobileSidebar(false); setShowMobileSettings(false); }}
            style={{ position: 'absolute', inset: 0, zIndex: 2300, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', animation: 'bm-fade-in 0.25s ease' }}
          />
        )}

        {/* Tablet Arrow Toggle */}
        {isTablet && viewMode === 'edit' && (
          <button onClick={() => setShowMobileSettings(s => !s)}
            style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', zIndex: 2400, width: 28, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--cms-border)', borderRight: 'none', background: 'var(--cms-bg-card)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '14px 0 0 14px', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', transition: 'all 0.25s', color: 'var(--cms-text-muted)' }}
          >
            {showMobileSettings ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
          </button>
        )}

        {/* Top Navbar */}
        {viewMode === 'edit' ? (
          <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, width: '100%', position: 'sticky', top: 0, zIndex: 500, background: 'var(--cms-bg-elevated)', borderBottom: '1px solid var(--cms-border)' }}>
            {/* ROW 1: Header Title, Back Button, and Top Action Buttons */}
            {isMobile ? (
              /* Mobile View: Symmetrical, centered icon-only toolbar */
              <div style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0 8px',
                borderBottom: '1px solid var(--cms-border)',
                boxSizing: 'border-box',
                width: '100%',
                background: 'var(--cms-bg-elevated)'
              }}>
                {/* 1. Back */}
                <button
                  onClick={handleBackWithAutoSave}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: '1px solid var(--cms-border)', background: 'var(--cms-bg-card)',
                    color: 'var(--cms-text-primary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  title="Kembali (Auto-saved)"
                >
                  <ArrowLeft size={16} />
                </button>

                {/* 2. Template & AI */}
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: '1.5px solid rgba(var(--cms-accent-rgb), 0.3)',
                    background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                  }}
                  title="Template & AI Generator"
                >
                  <Sparkles size={16} />
                </button>

                {/* 3. Preview */}
                <button
                  onClick={handlePreview}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: '1px solid var(--cms-border)', background: 'var(--cms-bg-card)',
                    color: 'var(--cms-text-secondary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                  }}
                  title="Pratinjau Artikel"
                >
                  <Eye size={16} />
                </button>

                {/* 4. Status (Published / Draft) */}
                <button
                  onClick={() => toggleStatus(currentPost)}
                  style={{
                    height: '34px', padding: '0 12px', borderRadius: '99px', cursor: 'pointer',
                    background: currentPost?.status === 'Published' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                    color: currentPost?.status === 'Published' ? '#16a34a' : '#ca8a04',
                    fontSize: '12px', fontWeight: 800, transition: 'all 0.2s', flexShrink: 0,
                    border: `1px solid ${currentPost?.status === 'Published' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  title={`Status: ${currentPost?.status || 'Draft'} (Klik untuk ubah)`}
                >
                  <span>{currentPost?.status === 'Published' ? '● Pub' : '○ Drf'}</span>
                </button>

                {/* 5. Settings / Sidebar Toggle */}
                <button
                  onClick={() => setShowMobileSettings(s => !s)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: showMobileSettings ? '1.5px solid var(--cms-accent)' : '1px solid var(--cms-border)',
                    background: showMobileSettings ? 'var(--cms-accent)' : 'var(--cms-bg-card)',
                    color: showMobileSettings ? '#fff' : 'var(--cms-text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                  }}
                  title="Buka Panel Pengaturan"
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            ) : (
              /* Desktop / Tablet View: Dynamic 2-column header with title and responsive action buttons */
              <div style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isTablet ? '0 12px' : '0 18px',
                borderBottom: '1px solid var(--cms-border)',
                boxSizing: 'border-box',
                gap: '10px',
                width: '100%',
                overflow: 'hidden'
              }}>
                {/* Left: Back & Title info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <button
                    onClick={handleBackWithAutoSave}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                      borderRadius: '99px', border: '1px solid var(--cms-border)',
                      background: 'var(--cms-bg-card)', color: 'var(--cms-text-primary)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 750, flexShrink: 0,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--cms-border)'}
                    title="Kembali ke Daftar Artikel (Auto-saved)"
                  >
                    <ArrowLeft size={15} />
                    <span>Kembali</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--cms-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {currentPost?.title || 'Artikel Tanpa Judul'}
                    </span>
                    {!isTablet && (
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: 'rgba(34,197,94,0.12)', color: '#16a34a', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Auto-saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Sleek & Compact on Tablet/Medium screen) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isTablet ? '5px' : '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: isTablet ? '6px 10px' : '7px 14px',
                      borderRadius: '99px', border: '1.5px solid var(--cms-border)',
                      background: 'var(--cms-bg-card)', color: 'var(--cms-accent)',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.08)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cms-border)'; e.currentTarget.style.background = 'var(--cms-bg-card)'; }}
                    title="Template Generator"
                  >
                    <Sparkles size={14} />
                    <span>{isTablet ? 'AI' : 'Template'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveActiveBlogAsTemplate}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: isTablet ? '6px 10px' : '7px 12px',
                      borderRadius: '99px', border: '1.5px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(16, 185, 129, 0.08)', color: '#10b981',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    title="Simpan Artikel Aktif sebagai Template Kustom"
                  >
                    <Bookmark size={14} />
                    {!isTablet && <span>Simpan</span>}
                  </button>

                  <button
                    onClick={handlePreview}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: isTablet ? '6px 10px' : '7px 12px',
                      borderRadius: '99px', border: '1px solid var(--cms-border)',
                      background: 'var(--cms-bg-card)', color: 'var(--cms-text-secondary)',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'; e.currentTarget.style.color = 'var(--cms-accent)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cms-border)'; e.currentTarget.style.color = 'var(--cms-text-secondary)'; }}
                    title="Pratinjau Artikel"
                  >
                    <Eye size={14} />
                    {!isTablet && <span>Pratinjau</span>}
                  </button>

                  <button
                    onClick={() => toggleStatus(currentPost)}
                    style={{
                      padding: isTablet ? '6px 10px' : '7px 13px', borderRadius: '99px', cursor: 'pointer',
                      background: currentPost?.status === 'Published' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                      color: currentPost?.status === 'Published' ? '#16a34a' : '#ca8a04',
                      fontSize: '12px', fontWeight: 750, transition: 'all 0.2s',
                      border: `1px solid ${currentPost?.status === 'Published' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`
                    }}
                    title={`Status: ${currentPost?.status || 'Draft'} (Klik untuk ubah)`}
                  >
                    {currentPost?.status === 'Published' ? '● Terbit' : '○ Draft'}
                  </button>

                  <button
                    onClick={() => setShowMobileSettings(s => !s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px', padding: isTablet ? '6px 10px' : '7px 12px',
                      borderRadius: '99px', border: '1px solid var(--cms-border)',
                      background: showMobileSettings ? 'var(--cms-accent)' : 'var(--cms-bg-card)',
                      color: showMobileSettings ? '#fff' : 'var(--cms-text-secondary)',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    title="Buka / Tutup Panel Pengaturan"
                  >
                    <SlidersHorizontal size={14} />
                    {!isTablet && <span>Seting</span>}
                  </button>
                </div>
              </div>
            )}

            {/* ROW 2: Formatting Toolbar */}
            <div
              className="blog-toolbar-scroll"
              style={{
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '0 14px',
                overflowX: 'auto',
                overflowY: 'hidden',
                background: 'var(--cms-bg)',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--cms-border) transparent',
                boxSizing: 'border-box'
              }}
            >
              <ToolbarBtn icon={<Undo size={17} />} onClick={() => execCmd('undo')} title="Undo" />
              <ToolbarBtn icon={<Redo size={17} />} onClick={() => execCmd('redo')} title="Redo" />
              <ToolbarBtn icon={<Eraser size={17} />} onClick={() => execCmd('removeFormat')} title="Hapus Format" />
              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />

              <ToolbarBtn icon={<Bold size={17} />} onClick={() => execCmd('bold')} title="Bold" />
              <ToolbarBtn icon={<Italic size={17} />} onClick={() => execCmd('italic')} title="Italic" />
              <ToolbarBtn icon={<Underline size={17} />} onClick={() => execCmd('underline')} title="Underline" />
              <ToolbarBtn icon={<Strikethrough size={17} />} onClick={() => execCmd('strikeThrough')} title="Strikethrough" />
              <ToolbarBtn icon={<Subscript size={17} />} onClick={() => execCmd('subscript')} title="Subscript" />
              <ToolbarBtn icon={<Superscript size={17} />} onClick={() => execCmd('superscript')} title="Superscript" />
              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />

              <GlassColorPicker value="#000000" onChange={(color) => execCmd('foreColor', color)}
                customTrigger={<label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', background: 'transparent', flexShrink: 0 }} title="Warna Teks" onMouseOver={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}><Palette size={17} color="var(--cms-text-primary)" /></label>}
              />
              <GlassColorPicker value="#FFFF00" onChange={(color) => execCmd('hiliteColor', color)}
                customTrigger={<label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', background: 'transparent', flexShrink: 0 }} title="Highlight" onMouseOver={e => e.currentTarget.style.background = 'var(--cms-switcher-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}><Highlighter size={17} color="var(--cms-text-primary)" /></label>}
              />
              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />

              <ToolbarBtn icon={<Heading1 size={17} />} onClick={() => execCmd('formatBlock', 'H1')} title="Heading 1" />
              <ToolbarBtn icon={<Heading2 size={17} />} onClick={() => execCmd('formatBlock', 'H2')} title="Heading 2" />
              <ToolbarBtn icon={<Heading3 size={17} />} onClick={() => execCmd('formatBlock', 'H3')} title="Heading 3" />
              <ToolbarBtn icon={<Heading4 size={17} />} onClick={() => execCmd('formatBlock', 'H4')} title="Heading 4" />
              <ToolbarBtn icon={<Type size={17} />} onClick={() => execCmd('formatBlock', 'P')} title="Paragraf" />
              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />

              <ToolbarBtn icon={<AlignLeft size={17} />} onClick={() => execCmd('justifyLeft')} title="Rata Kiri" />
              <ToolbarBtn icon={<AlignCenter size={17} />} onClick={() => execCmd('justifyCenter')} title="Rata Tengah" />
              <ToolbarBtn icon={<AlignRight size={17} />} onClick={() => execCmd('justifyRight')} title="Rata Kanan" />
              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />

              <ToolbarBtn icon={<ListIcon size={17} />} onClick={() => execCmd('insertUnorderedList')} title="Bullet List" />
              <ToolbarBtn icon={<ListOrdered size={17} />} onClick={() => execCmd('insertOrderedList')} title="Numbered List" />
              <ToolbarBtn icon={<Quote size={17} />} onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')} title="Quote" />
              <ToolbarBtn icon={<Code size={17} />} onClick={() => execCmd('formatBlock', 'PRE')} title="Code" />
              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />

              <ToolbarBtn icon={<ImageIcon size={17} />} onClick={() => openMediaPopup('image')} title="Sisipkan Gambar" />
              <ToolbarBtn icon={<Video size={17} />} onClick={() => openMediaPopup('video')} title="Sisipkan Video" />
              <ToolbarBtn icon={<File size={17} />} onClick={() => openMediaPopup('file')} title="Sisipkan File" />
              <ToolbarBtn icon={<LinkIcon size={17} />} onClick={() => openMediaPopup('link')} title="Sisipkan Link" />
              <ToolbarBtn icon={<Table size={17} />} onClick={() => setShowTablePopup(s => !s)} title="Tabel" />
              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                <input
                  type="number"
                  value={customFontSize}
                  onChange={e => setCustomFontSize(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { saveSelection(); applyCustomFontSize(customFontSize); } }}
                  style={{ width: '44px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--cms-border)', background: 'var(--cms-bg-card)', color: 'var(--cms-text-primary)', outline: 'none', fontSize: '12px', textAlign: 'center' }}
                  title="Ukuran Font px"
                />
                <span style={{ fontSize: '10.5px', color: 'var(--cms-text-muted)', fontWeight: 600 }}>px</span>
              </div>

              <div style={{ width: 1, height: 20, background: 'var(--cms-border)', margin: '0 3px', flexShrink: 0 }} />
              <ToolbarBtn icon={isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />} onClick={() => setIsFullscreen(s => !s)} title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'} />
            </div>
          </div>
        ) : (
          /* List Mode Top Navbar */
          <div style={{ 
            minHeight: isMobile ? '52px' : '58px', 
            borderBottom: '1px solid var(--glass-border)', 
            background: 'var(--cms-bg)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: isMobile ? '0 12px' : '0 20px', 
            flexShrink: 0, 
            position: 'sticky', 
            top: 0, 
            zIndex: 500, 
            width: '100%', 
            boxSizing: 'border-box' 
          }}>
            {/* Left: Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  title="Kembali ke Vault"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--cms-switcher-bg)',
                    color: 'var(--cms-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="cms-segmented-tabs" style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', borderRadius: '99px', padding: '3px', flex: isMobile ? 1 : 'initial', height: isMobile ? '38px' : 'auto', boxSizing: 'border-box' }}>
                <button onClick={() => handleSwitchTab('updates')} style={{ flex: isMobile ? 1 : 'initial', height: isMobile ? '100%' : 'auto', background: viewMode === 'updates' ? 'var(--cms-accent)' : 'transparent', color: viewMode === 'updates' ? '#fff' : 'var(--cms-text-muted)', border: 'none', borderRadius: '99px', padding: isMobile ? '0 10px' : '7px 16px', fontWeight: 800, fontSize: isMobile ? '12px' : '13px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Update</button>
                <button onClick={() => handleSwitchTab('list')} style={{ flex: isMobile ? 1 : 'initial', height: isMobile ? '100%' : 'auto', background: viewMode === 'list' ? 'var(--cms-accent)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--cms-text-muted)', border: 'none', borderRadius: '99px', padding: isMobile ? '0 10px' : '7px 16px', fontWeight: 800, fontSize: isMobile ? '12px' : '13px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Artikel</button>
                <button onClick={() => handleSwitchTab('categories')} style={{ flex: isMobile ? 1 : 'initial', height: isMobile ? '100%' : 'auto', background: viewMode === 'categories' ? 'var(--cms-accent)' : 'transparent', color: viewMode === 'categories' ? '#fff' : 'var(--cms-text-muted)', border: 'none', borderRadius: '99px', padding: isMobile ? '0 10px' : '7px 16px', fontWeight: 800, fontSize: isMobile ? '12px' : '13px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Seting</button>
              </div>
            </div>

            {/* Right: Actions */}
            {viewMode !== 'updates' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                {!isMobile && (
                  <button onClick={() => setIsTemplateModalOpen(true)}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', 
                      padding: '7px 14px', 
                      background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', 
                      color: 'var(--cms-accent)', borderRadius: '99px', 
                      fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 
                    }}
                    title="Template & AI Generator"
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cms-accent)'; e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.08)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--cms-switcher-bg)'; }}
                  >
                    <Sparkles size={16} />
                    <span>Template</span>
                  </button>
                )}
                <button onClick={handleCreatePost}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', 
                    padding: isMobile ? '0' : '7px 16px', 
                    width: isMobile ? '36px' : 'auto', height: isMobile ? '36px' : 'auto',
                    background: 'var(--cms-accent)', color: '#fff', 
                    borderRadius: isMobile ? '50%' : '99px', border: 'none', 
                    fontWeight: 800, fontSize: '12px', cursor: 'pointer', 
                    boxShadow: '0 4px 14px var(--cms-accent-soft)', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 
                  }}
                  title="Tulis Artikel Baru"
                  onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Plus size={17}/>
                  {!isMobile && <span>Tulis</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Editor + Sidebar wrapper */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', minHeight: 0, width: '100%', minWidth: 0 }}>

          <div 
            className="blog-manager-root"
            style={{ 
              flex: 1,
              minHeight: 0,
              overflowY: 'auto', 
              overflowX: 'hidden',
              paddingTop: isMobile ? '16px' : '24px', 
              paddingBottom: isMobile ? '90px' : (viewMode === 'edit' ? '100px' : '80px'), 
              paddingLeft: (isMobile && viewMode === 'edit') ? '0' : (isMobile ? '16px' : '24px'),
              paddingRight: (isMobile && viewMode === 'edit') ? '0' : (isMobile ? '16px' : '24px'),
              background: 'var(--cms-bg)', 
              boxSizing: 'border-box',
              width: '100%'
            }}
          >
            <div style={{ width: '100%', maxWidth: viewMode === 'edit' ? '720px' : '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

              {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cms-text-muted)' }}>Memuat data...</div>

              ) : viewMode === 'updates' ? (
                /* ===== UPDATES / UTAS STATUS VIEW ===== */
                <UpdatesFeedManager 
                  notify={(msg, type) => showAlert ? showAlert(msg) : alert(msg)} 
                  confirm={showConfirm ? (opts) => showConfirm({ title: opts.title, message: opts.message, isDestructive: opts.isDestructive, onConfirm: opts.onConfirm }) : undefined} 
                />

              ) : viewMode === 'edit' ? (
                /* ===== EDITOR VIEW ===== */
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0' }}>


                  {/* Table Popup */}
                  {showTablePopup && (
                    <div style={{ background: 'var(--cms-bg-card)', border: '1.5px solid var(--cms-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cms-text-primary)' }}>Buat Tabel</div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                          Baris
                          <input type="number" min="1" max="20" value={tRows} onChange={e => setTRows(parseInt(e.target.value) || 1)} style={{ width: '70px', padding: '8px', borderRadius: '8px', border: '1px solid var(--cms-border)', background: 'var(--cms-bg)', color: 'var(--cms-text-primary)', outline: 'none' }} />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                          Kolom
                          <input type="number" min="1" max="10" value={tCols} onChange={e => setTCols(parseInt(e.target.value) || 1)} style={{ width: '70px', padding: '8px', borderRadius: '8px', border: '1px solid var(--cms-border)', background: 'var(--cms-bg)', color: 'var(--cms-text-primary)', outline: 'none' }} />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--cms-text-muted)', fontWeight: 600, cursor: 'pointer' }}>
                          <input type="checkbox" checked={tBorder} onChange={e => setTBorder(e.target.checked)} /> Border
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={insertTable} style={{ flex: 1, padding: '10px', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Buat Tabel</button>
                        <button onClick={() => setShowTablePopup(false)} style={{ padding: '10px 16px', background: 'var(--cms-bg-elevated)', border: '1px solid var(--cms-border)', borderRadius: '10px', color: 'var(--cms-text-secondary)', cursor: 'pointer' }}>Batal</button>
                      </div>
                    </div>
                  )}

                  {/* Active Table Toolbar */}
                  {activeTableNode && (
                    <div style={{ position: 'sticky', top: '76px', zIndex: 999, background: 'var(--cms-bg-card)', border: '1px solid var(--cms-border)', color: 'var(--cms-text-primary)', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, marginRight: '4px' }}>Tabel:</span>
                      <div style={{ display: 'flex', border: '1px solid var(--cms-border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <button type="button" onMouseDown={(e)=>{ e.preventDefault(); addTableRow(activeTableNode, activeTableCellNode); }} style={{ background: 'var(--cms-bg-elevated)', border: 'none', borderRight: '1px solid var(--cms-border)', color: 'var(--cms-text-primary)', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>+ Baris ⬇</button>
                        <button type="button" onMouseDown={(e)=>{ e.preventDefault(); removeTableRow(activeTableNode, activeTableCellNode); }} style={{ background: 'var(--cms-bg-elevated)', border: 'none', color: 'var(--cms-text-primary)', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>- Baris</button>
                      </div>
                      <div style={{ display: 'flex', border: '1px solid var(--cms-border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <button type="button" onMouseDown={(e)=>{ e.preventDefault(); addTableCol(activeTableNode, activeTableCellNode); }} style={{ background: 'var(--cms-bg-elevated)', border: 'none', borderRight: '1px solid var(--cms-border)', color: 'var(--cms-text-primary)', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>+ Kolom ➡</button>
                        <button type="button" onMouseDown={(e)=>{ e.preventDefault(); removeTableCol(activeTableNode, activeTableCellNode); }} style={{ background: 'var(--cms-bg-elevated)', border: 'none', color: 'var(--cms-text-primary)', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>- Kolom</button>
                      </div>
                      {activeTableCellNode && (
                        <div style={{ display: 'flex', border: '1px solid var(--cms-border)', borderRadius: '8px', overflow: 'hidden' }}>
                          <button type="button" onMouseDown={(e)=>{ e.preventDefault(); resizeTableCol(activeTableNode, activeTableCellNode, false); }} style={{ background: 'var(--cms-bg-elevated)', border: 'none', borderRight: '1px solid var(--cms-border)', color: 'var(--cms-text-primary)', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Sempitkan</button>
                          <button type="button" onMouseDown={(e)=>{ e.preventDefault(); resizeTableCol(activeTableNode, activeTableCellNode, true); }} style={{ background: 'var(--cms-bg-elevated)', border: 'none', color: 'var(--cms-text-primary)', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Lebarkan</button>
                        </div>
                      )}
                      <button type="button" onMouseDown={(e)=>{ e.preventDefault(); deleteTable(activeTableNode); }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, marginLeft: 'auto' }}>Hapus</button>
                    </div>
                  )}

                  {/* Editor Card */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cms-bg-card)', borderRadius: isMobile ? '0' : '24px', flexShrink: 0, border: isMobile ? 'none' : '1px solid var(--cms-border)', boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden', minHeight: isMobile ? '100vh' : '700px', position: 'relative' }}>
                    {currentPost?.thumbnail && (
                      <div style={{ width: '100%', height: '200px', position: 'relative', borderBottom: '1px solid var(--cms-border)' }}>
                        <img src={currentPost.thumbnail} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => setCurrentPost(prev => ({...prev, thumbnail: ''}))} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    {/* Dedicated Clean Title Header at top of card */}
                    <div style={{
                      padding: isMobile ? '16px 18px 12px' : '22px 32px 14px',
                      borderBottom: '1px solid var(--cms-border)',
                      background: 'rgba(var(--cms-accent-rgb), 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Judul Artikel
                        </div>
                        <button
                          type="button"
                          disabled={isGeneratingHeadlines}
                          onClick={handleGenerateAiHeadlines}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 9px', borderRadius: 9999,
                            background: 'rgba(var(--cms-accent-rgb), 0.12)',
                            border: '1px solid rgba(var(--cms-accent-rgb), 0.25)',
                            color: 'var(--cms-accent)', fontSize: '10.5px', fontWeight: 750,
                            cursor: isGeneratingHeadlines ? 'wait' : 'pointer'
                          }}
                        >
                          <Sparkles size={11} />
                          <span>{isGeneratingHeadlines ? 'Meracik Judul...' : '✨ Variasi Judul AI'}</span>
                        </button>
                      </div>

                      {headlineSuggestions.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10, padding: 8, background: 'var(--cms-bg-elevated)', borderRadius: 10, border: '1px solid var(--cms-border)' }}>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Pilih Judul Rekomendasi AI:</div>
                          {headlineSuggestions.map((hl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCurrentPost(prev => ({ ...prev, title: hl }));
                                setHeadlineSuggestions([]);
                              }}
                              style={{
                                textAlign: 'left', padding: '5px 8px', borderRadius: 6,
                                background: 'transparent', border: 'none', color: 'var(--cms-text-primary)',
                                fontSize: '11.5px', fontWeight: 650, cursor: 'pointer',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              💡 {hl}
                            </button>
                          ))}
                        </div>
                      )}
                      <input 
                        type="text" 
                        value={currentPost?.title || ''} 
                        onChange={(e) => setCurrentPost(prev => ({...prev, title: e.target.value}))} 
                        placeholder="Ketik judul artikel di sini..."
                        style={{ 
                          width: '100%', 
                          fontSize: isMobile ? '18px' : '22px', 
                          fontWeight: '800', 
                          lineHeight: 1.35, 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--cms-text-primary)', 
                          outline: 'none', 
                          padding: 0,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div ref={editorRef} className="super-editor-content" contentEditable suppressContentEditableWarning
                      style={{ padding: isMobile ? '16px 18px 40px 18px' : '20px 32px 60px 32px', flex: 1, outline: 'none', fontSize: isMobile ? '15px' : '17px', lineHeight: '1.8', color: 'var(--cms-text-primary)', minHeight: '400px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      onInput={() => { if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML})); }}
                      onBlur={() => { if (editorRef.current) setCurrentPost(prev => ({...prev, content: editorRef.current.innerHTML})); }}
                      onKeyUp={handleEditorActivity}
                      onMouseUp={handleEditorActivity}
                    />
                    {showMediaPopup && createPortal(
                      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={(e) => { if (e.target === e.currentTarget) setShowMediaPopup(false); }}>
                        {/* Backdrop */}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'none', WebkitBackdropFilter: 'none' }} onClick={() => setShowMediaPopup(false)} />
                        {/* Modal */}
                        <div style={{ position: 'relative', background: 'var(--cms-bg)', border: '1px solid var(--cms-border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', zIndex: 1, animation: 'bm-fade-in 0.2s ease' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: 'var(--cms-text-primary)', fontSize: '16px', fontWeight: 700 }}>
                              Sisipkan {showMediaPopup === 'image' ? 'Gambar' : showMediaPopup === 'video' ? 'Video/YouTube' : showMediaPopup === 'file' ? 'File' : 'Link'}
                            </h4>
                            <button onClick={() => setShowMediaPopup(false)} style={{ background: 'var(--cms-bg-elevated)', border: '1px solid var(--cms-border)', borderRadius: '8px', color: 'var(--cms-text-muted)', cursor: 'pointer', display: 'flex', padding: '6px' }}><X size={18}/></button>
                          </div>
                          {(showMediaPopup === 'image' || showMediaPopup === 'video') && (
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', background: 'var(--cms-bg-elevated)', border: '1.5px dashed var(--cms-border)', borderRadius: '12px', padding: '28px 24px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--cms-border)'}
                              >
                                <input type="file" style={{ display: 'none' }} accept={showMediaPopup === 'image' ? 'image/*' : 'video/*'} onChange={(e) => handleMediaUpload(e, showMediaPopup)} />
                                {isUploading ? (
                                  <span style={{ color: 'var(--cms-accent)', fontWeight: 600 }}>Mengunggah...</span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '28px' }}>{showMediaPopup === 'image' ? '🖼' : '🎬'}</div>
                                    <span style={{ color: 'var(--cms-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Klik untuk Upload {showMediaPopup === 'image' ? 'Gambar' : 'Video'}</span>
                                    <span style={{ color: 'var(--cms-text-muted)', fontSize: '12px' }}>atau drag & drop</span>
                                  </div>
                                )}
                              </label>
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: 'var(--cms-text-muted)', marginBottom: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--cms-border)' }} />
                            <span>atau gunakan URL</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--cms-border)' }} />
                          </div>
                          <input type="text" placeholder="https://..." value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--cms-border)', background: 'var(--cms-bg-elevated)', color: 'var(--cms-text-primary)', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', fontSize: '14px' }}
                            onFocus={e => e.target.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'}
                            onBlur={e => e.target.style.borderColor = 'var(--cms-border)'}
                          />
                          {(showMediaPopup === 'file' || showMediaPopup === 'link') && (
                            <input type="text" placeholder="Teks Tombol/Link" value={mediaTextInput} onChange={(e) => setMediaTextInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--cms-border)', background: 'var(--cms-bg-elevated)', color: 'var(--cms-text-primary)', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', fontSize: '14px' }}
                              onFocus={e => e.target.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'}
                              onBlur={e => e.target.style.borderColor = 'var(--cms-border)'}
                            />
                          )}
                          <button onClick={processMediaLink} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, var(--cms-accent), #9333ea)', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 16px rgba(var(--cms-accent-rgb), 0.35)' }}>Sisipkan</button>
                        </div>
                      </div>,
                      document.body
                    )}
                    
                  </div>
                </div>

              ) : viewMode === 'list' ? (
                /* ===== LIST VIEW ===== */
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '20px' }}>
                  {isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--cms-bg)', border: '1.5px solid var(--cms-border)', borderRadius: '99px', padding: '10px 16px' }}>
                      <Search size={18} color="var(--cms-text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
                      <input type="text" placeholder="Cari artikel..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--cms-text-primary)', width: '100%', fontSize: '14px' }} />
                    </div>
                  )}
                  {!isMobile && (
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', background: 'var(--cms-bg-card)', border: '1px solid var(--cms-border)', borderRadius: '12px', padding: '10px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: 'border-color 0.2s' }}>
                        <Search size={16} color="var(--cms-text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
                        <input type="text" placeholder="Cari artikel berdasarkan judul atau tag..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'none', outline: 'none', color: 'var(--cms-text-primary)', width: '100%', fontSize: '14px', fontWeight: 500 }} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '2px' }}>
                        {[
                          { value: filterCategory, onChange: e => setFilterCategory(e.target.value), options: [['All', 'Semua Kategori'], ...categories.map(c => [c, c])] },
                          { value: filterStatus, onChange: e => setFilterStatus(e.target.value), options: [['All', 'Semua Status'], ['Published', 'Terbit'], ['Draft', 'Draft']] },
                          { value: sortBy, onChange: e => setSortBy(e.target.value), options: [['newest', 'Terbaru'], ['oldest', 'Terlama'], ['views', 'Terpopuler']] },
                        ].map((sel, i) => (
                          <GlassSelect key={i} value={sel.value} onChange={sel.onChange}
                            options={sel.options.map(([val, lbl]) => ({ value: val, label: lbl }))}
                            style={{ height: 42, padding: '0 16px', background: 'var(--cms-bg-card)', border: '1px solid var(--cms-border)', color: 'var(--cms-text-primary)', outline: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: 600, minWidth: 140, borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats (1 Baris, Ikon & Angka Saja) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '8px' : '12px' }}>
                    {[
                      { label: 'Total Artikel', count: posts.length, color: 'var(--cms-accent)', icon: <FileText size={isMobile ? 18 : 20} /> },
                      { label: 'Artikel Terbit', count: publishedCount, color: '#10b981', icon: <CheckCircle2 size={isMobile ? 18 : 20} /> },
                      { label: 'Artikel Draft', count: draftCount, color: '#f59e0b', icon: <Edit3 size={isMobile ? 18 : 20} /> },
                    ].map((s, i) => (
                      <div 
                        key={i} 
                        title={s.label} 
                        style={{ 
                          background: 'var(--cms-card-bg)', 
                          borderRadius: isMobile ? 14 : 16, 
                          border: '1px solid var(--glass-border)', 
                          padding: isMobile ? '10px 8px' : '14px 16px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: isMobile ? '8px' : '12px', 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)', 
                          transition: 'transform 0.2s', 
                          cursor: 'default' 
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ 
                          width: isMobile ? 32 : 38, 
                          height: isMobile ? 32 : 38, 
                          borderRadius: isMobile ? 8 : 10, 
                          background: i === 0 ? 'rgba(var(--cms-accent-rgb), 0.12)' : `${s.color}18`, 
                          color: s.color, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0 
                        }}>
                          {s.icon}
                        </div>
                        <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: 'var(--cms-text)', lineHeight: 1 }}>
                          {s.count}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cards & Bulk Action Bar */}
                  {(() => {
                    const filtered = posts
                      .filter(p => filterCategory === 'All' || p.category === filterCategory)
                      .filter(p => filterStatus === 'All' || p.status === filterStatus)
                      .filter(p => {
                        const q = searchQuery.toLowerCase();
                        return (p.title || '').toLowerCase().includes(q) ||
                               (p.category || '').toLowerCase().includes(q) ||
                               (p.tags || '').toLowerCase().includes(q);
                      });

                    return (
                      <div 
                        onContextMenu={(e) => handleListContextMenu(e, filtered)}
                        style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}
                      >
                        {/* Bulk Action Bar */}
                        {selectedPostIds.length > 0 && (
                          <div style={{
                            padding: '12px 18px',
                            borderRadius: 14,
                            background: 'var(--cms-card-bg, #1e293b)',
                            border: '1.5px solid var(--cms-accent, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--cms-accent)' }}>
                                {selectedPostIds.length} Artikel Ditandai
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectAllPosts(filtered)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 8,
                                  border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
                                  background: 'transparent',
                                  color: 'var(--cms-text, #f8fafc)',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {selectedPostIds.length === filtered.length ? 'Batalkan Semua' : 'Tandai Semua'}
                              </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                type="button"
                                onClick={handleBulkBroadcastPosts}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: 10,
                                  border: '1px solid rgba(99,102,241,0.3)',
                                  background: 'rgba(99,102,241,0.18)',
                                  color: 'var(--cms-accent, #6366f1)',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <Share2 size={14} /> Siarkan ({selectedPostIds.length})
                              </button>
                              <button
                                type="button"
                                onClick={handleBulkDeletePosts}
                                style={{
                                  padding: '7px 16px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <Trash2 size={14} /> Hapus Ditandai ({selectedPostIds.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPostIds([])}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: 10,
                                  border: '1px solid var(--glass-border, rgba(255,255,255,0.15))',
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

                        {filtered.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--cms-bg-card)', borderRadius: '20px', border: '1.5px dashed var(--cms-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={48} color="var(--cms-text-secondary)" style={{ opacity: 0.3, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: 'var(--cms-text-primary)' }}>Tidak ada artikel ditemukan</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--cms-text-secondary)' }}>Coba ubah filter atau tambahkan artikel baru.</p>
                          </div>
                        ) : (
                          filtered.map((post, idx) => {
                            const isPublished = post.status === 'Published';
                            const isSelected = selectedPostIds.includes(post.id);
                            const wordCount = (post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).length;
                            const rt = Math.max(1, Math.ceil(wordCount / 200));

                            return (
                              <div
                                key={post.id}
                                onClick={() => handleEdit(post)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openContextMenu(e, {
                                    title: post.title || 'Artikel',
                                    subtitle: `${post.category || 'Umum'} · ${isPublished ? 'Terbit' : 'Draft'}`,
                                    items: [
                                      {
                                        label: 'Edit Artikel',
                                        icon: <Edit3 size={15} color="var(--cms-accent)" />,
                                        action: () => handleEdit(post)
                                      },
                                      {
                                        label: 'Siarkan Feed',
                                        icon: <Share2 size={15} color="var(--cms-accent)" />,
                                        action: () => handleBroadcastPostToFeed(post)
                                      },
                                      {
                                        label: isSelected ? 'Hilangkan Tanda' : 'Tandai / Mode Pilih',
                                        icon: <Check size={15} color="#10b981" />,
                                        action: () => toggleSelectPost(post.id)
                                      },
                                      ...(selectedPostIds.length > 0 ? [
                                        {
                                          label: 'Batalkan Semua Pilihan',
                                          icon: <X size={15} color="#94a3b8" />,
                                          action: () => setSelectedPostIds([])
                                        }
                                      ] : []),
                                      {
                                        label: isPublished ? 'Jadikan Draf' : 'Terbitkan Artikel',
                                        icon: isPublished ? <EyeOff size={15} /> : <Eye size={15} />,
                                        action: async () => {
                                          const updated = posts.map(p => p.id === post.id ? { ...p, status: isPublished ? 'Draft' : 'Published' } : p);
                                          setPosts(updated);
                                          await storage.setItem('porto_blog_posts', updated);
                                          window.dispatchEvent(new Event('porto_blog_saved'));
                                        }
                                      },
                                      ...(post.slug ? [{
                                        label: 'Buka Pratinjau Web',
                                        icon: <ExternalLink size={15} />,
                                        action: () => window.open(`/blog/${post.slug || post.id}`, '_blank')
                                      }] : []),
                                      {
                                        label: 'Salin Tautan Artikel',
                                        icon: <Copy size={15} />,
                                        action: () => {
                                          navigator.clipboard?.writeText(`${window.location.origin}/blog/${post.slug || post.id}`);
                                          window.dispatchEvent(new CustomEvent('porto_notify', { detail: { message: "Link artikel disalin", type: "info" } }));
                                        }
                                      },
                                      { separator: true, label: '' },
                                      {
                                        label: 'Hapus Artikel',
                                        icon: <Trash2 size={15} />,
                                        danger: true,
                                        action: () => handleDelete(post.id)
                                      }
                                    ]
                                  });
                                }}
                                style={{
                                  display: 'flex',
                                  flexDirection: isMobile ? 'column' : 'row',
                                  alignItems: isMobile ? 'stretch' : 'center',
                                  background: 'var(--cms-bg-card)',
                                  padding: isMobile ? '12px' : '14px 16px',
                                  borderRadius: isMobile ? '14px' : '16px',
                                  border: isSelected ? '2px solid var(--cms-accent, #6366f1)' : '1px solid var(--cms-border)',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                  animation: `bm-fade-in 0.35s ease ${idx * 40}ms both`,
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  gap: 12
                                }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = isSelected ? 'var(--cms-accent, #6366f1)' : 'rgba(var(--cms-accent-rgb), 0.2)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = isSelected ? 'var(--cms-accent, #6366f1)' : 'var(--cms-border)'; }}
                              >
                                {/* Multi-Select Checkbox Badge (Hanya tampil saat mode pilih aktif) */}
                                {selectedPostIds.length > 0 && (
                                  <div
                                    onClick={(e) => toggleSelectPost(post.id, e)}
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 8,
                                      background: isSelected ? 'var(--cms-accent, #6366f1)' : 'rgba(0,0,0,0.4)',
                                      border: isSelected ? '2px solid #ffffff' : '1.5px solid rgba(255,255,255,0.3)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      flexShrink: 0
                                    }}
                                    title={isSelected ? 'Batalkan pilihan' : 'Tandai artikel'}
                                  >
                                    {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                                  </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', width: '100%', gap: isMobile ? '14px' : '20px' }}>
                                  {post.thumbnail ? (
                                    <div style={{ width: isMobile ? '100%' : '150px', height: isMobile ? '140px' : '100px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                      <img src={post.thumbnail} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                    </div>
                                  ) : (
                                    <div style={{ width: isMobile ? '100%' : '150px', height: isMobile ? '100px' : '100px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, rgba(var(--cms-accent-rgb), 0.05), rgba(var(--cms-accent-rgb), 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <ImageIcon size={28} color="var(--cms-accent)" style={{ opacity: 0.4 }} />
                                    </div>
                                  )}
                                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: isPublished ? '#10b98115' : '#f59e0b15', color: isPublished ? '#10b981' : '#f59e0b' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} /> {isPublished ? 'Terbit' : 'Draft'}
                                      </span>
                                      <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: 'rgba(var(--cms-accent-rgb), 0.08)', color: 'var(--cms-accent)' }}>{post.category}</span>
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 800, color: 'var(--cms-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                                      {post.title || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>Tanpa Judul</span>}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--cms-text-secondary)', fontWeight: 500, flexWrap: 'wrap' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} style={{ opacity: 0.7 }}/> {post.date}</span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={14} style={{ opacity: 0.7 }}/> {post.views || 0} x dilihat</span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} style={{ opacity: 0.7 }}/> {rt} mnt baca</span>
                                    </div>
                                  </div>
                                  {!isMobile && (
                                    <div style={{ display: 'flex', gap: '10px', marginLeft: '16px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                      <button onClick={() => handleBroadcastPostToFeed(post)} title="Siarkan Feed" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(var(--cms-accent-rgb), 0.08)', border: '1px solid rgba(var(--cms-accent-rgb), 0.2)', color: 'var(--cms-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                        onMouseOver={e => { e.currentTarget.style.background = 'var(--cms-accent)'; e.currentTarget.style.color = '#ffffff'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.08)'; e.currentTarget.style.color = 'var(--cms-accent)'; }}
                                      ><Share2 size={17} /></button>
                                      <button onClick={() => handleEdit(post)} title="Edit Artikel" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--cms-bg)', border: '1px solid var(--cms-border)', color: 'var(--cms-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(var(--cms-accent-rgb), 0.08)'; e.currentTarget.style.color = 'var(--cms-accent)'; e.currentTarget.style.borderColor = 'transparent'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'var(--cms-bg)'; e.currentTarget.style.color = 'var(--cms-text-secondary)'; e.currentTarget.style.borderColor = 'var(--cms-border)'; }}
                                      ><Edit3 size={18} /></button>
                                      <button onClick={() => handleDelete(post.id)} title="Hapus Artikel" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--cms-bg)', border: '1px solid var(--cms-border)', color: 'var(--cms-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                        onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'transparent'; }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'var(--cms-bg)'; e.currentTarget.style.color = 'var(--cms-text-secondary)'; e.currentTarget.style.borderColor = 'var(--cms-border)'; }}
                                      ><Trash2 size={18} /></button>
                                    </div>
                                  )}
                                </div>
                                {isMobile && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleBroadcastPostToFeed(post)} style={{ padding: '9px 12px', background: 'rgba(var(--cms-accent-rgb), 0.1)', border: '1px solid rgba(var(--cms-accent-rgb), 0.2)', borderRadius: '10px', color: 'var(--cms-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700 }}><Share2 size={14} /> Siarkan</button>
                                    <button onClick={() => handleEdit(post)} style={{ flex: 1, padding: '9px', background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--cms-text-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Edit3 size={14} /> Edit</button>
                                    <button onClick={() => handleDelete(post.id)} style={{ padding: '9px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}><Trash2 size={14} /> Hapus</button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ===== CATEGORIES VIEW ===== */
                <div style={{ maxWidth: '560px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Category Manager */}
                  <div style={{ background: 'var(--cms-bg-card)', padding: isMobile ? '16px' : '24px', borderRadius: '20px', border: '1.5px solid var(--cms-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(var(--cms-accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Tag size={15} color="var(--cms-accent)" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--cms-text-primary)' }}>Kategori</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); }} placeholder="Nama kategori baru..." aria-label="Nama kategori baru"
                        style={{ flex: 1, minWidth: 0, height: '42px', padding: '0 14px', borderRadius: '12px', border: '1.5px solid var(--cms-border)', background: 'var(--cms-bg)', color: 'var(--cms-text-primary)', outline: 'none', fontSize: '13.5px', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'}
                        onBlur={e => e.target.style.borderColor = 'var(--cms-border)'}
                      />
                      <button type="button" onClick={handleAddCategory} aria-label="Tambah Kategori" title="Tambah Kategori" style={{ height: '42px', padding: isMobile ? '0 14px' : '0 18px', background: 'var(--cms-accent)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 750, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <Plus size={16} />
                        <span>Tambah</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {categories.map(cat => {
                        const count = posts.filter(p => p.category === cat).length;
                        return (
                          <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--cms-bg-elevated)', borderRadius: '12px', border: '1px solid var(--cms-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cms-accent)' }} />
                              <span style={{ fontWeight: 700, color: 'var(--cms-text-primary)', fontSize: '14px' }}>{cat}</span>
                              <span style={{ fontSize: '12px', color: 'var(--cms-text-muted)', background: 'var(--cms-bg)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>{count} artikel</span>
                            </div>
                            {cat !== 'Umum' && (
                              <button onClick={() => handleDeleteCategory(cat)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                              ><Trash2 size={14} /></button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {isMobile && <div style={{ height: '100px', minHeight: '100px', flexShrink: 0, width: '100%', pointerEvents: 'none' }} />}
            </div>
          </div>

          {/* Right Sidebar (only in edit mode) */}
          {viewMode === 'edit' && (
            <div style={{
              width: isMobile ? '100%' : (isTablet ? '330px' : '300px'),
              minWidth: isMobile ? '100%' : (isTablet ? '330px' : '280px'),
              maxWidth: isMobile ? '100%' : (isTablet ? '360px' : '320px'),
              boxSizing: 'border-box',
              borderLeft: isMobile ? 'none' : '1px solid var(--cms-border)',
              background: 'var(--cms-panel-bg-solid, var(--cms-bg-elevated))',
              display: (isMobile || isTablet) ? (showMobileSettings ? 'flex' : 'none') : 'flex',
              flexDirection: 'column',
              zIndex: (isMobile || isTablet) ? 2500 : 60,
              position: (isMobile || isTablet) ? 'fixed' : 'relative',
              top: 0,
              bottom: 0,
              height: '100%',
              right: 0,
              transform: 'none',
              boxShadow: (isMobile || isTablet) ? '-6px 0 32px rgba(0,0,0,0.25)' : 'none',
              overflow: 'hidden',
              alignSelf: 'stretch',
              flexShrink: 0
            }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--cms-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'sticky', top: 0, background: 'var(--cms-panel-bg-solid, var(--cms-bg-elevated))', zIndex: 10, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(var(--cms-accent-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={15} color="var(--cms-accent)" />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--cms-text-primary)', margin: 0 }}>Pengaturan Blog</h3>
                </div>
                {(isMobile || isTablet) && <button onClick={() => setShowMobileSettings(false)} style={{ background: 'var(--cms-bg-elevated)', border: '1px solid var(--cms-border)', borderRadius: '8px', color: 'var(--cms-text-primary)', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={17}/></button>}
              </div>

              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingBottom: '160px', boxSizing: 'border-box', width: '100%' }}>
                {/* Pilihan Utama */}
                <div style={{ padding: '14px', background: 'var(--cms-bg-elevated)', borderRadius: '14px', border: '1px solid var(--cms-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cms-text-primary)' }}>Jadikan Pilihan Utama</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }}
                      checked={currentPost ? featuredPostIds.includes(currentPost.id) : false}
                      onChange={async (e) => {
                        if (!currentPost) return;
                        const checked = e.target.checked;
                        let newIds = [...featuredPostIds];
                        if (checked) {
                          if (newIds.length >= 3) {
                            alert('Maksimal 3 artikel pilihan utama.');
                            return;
                          }
                          if (!newIds.includes(currentPost.id)) newIds.push(currentPost.id);
                        } else {
                          newIds = newIds.filter(id => id !== currentPost.id);
                        }
                        setFeaturedPostIds(newIds);
                        await storage.setItem('porto_blog_featured', newIds);
                        window.dispatchEvent(new Event('porto_blog_saved'));
                      }}
                    />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: currentPost && featuredPostIds.includes(currentPost.id) ? 'var(--cms-accent)' : 'var(--cms-border)', transition: '.4s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: currentPost && featuredPostIds.includes(currentPost.id) ? '20px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }} />
                    </span>
                  </label>
                </div>

                {/* Cover Banner */}
                <div style={{ padding: '14px', background: 'var(--cms-bg-elevated)', borderRadius: '14px', border: '1px solid var(--cms-border)', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CheckCircle2 size={12} /> Kategori & Slug
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cms-text-secondary)', marginBottom: '8px' }}>Kategori</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {categories.map(c => {
                        const isCat = currentPost?.category === c;
                        return (
                          <button key={c} onClick={() => setCurrentPost(prev => ({...prev, category: c}))}
                            style={{ padding: '5px 12px', borderRadius: '99px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', background: isCat ? 'var(--cms-accent)' : 'var(--cms-bg)', border: `1.5px solid ${isCat ? 'var(--cms-accent)' : 'var(--cms-border)'}`, color: isCat ? '#fff' : 'var(--cms-text-secondary)', transition: 'all 0.2s' }}
                          >{c}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cms-text-secondary)', marginBottom: '6px' }}>URL Slug</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--cms-bg)', border: '1.5px solid var(--cms-border)', borderRadius: '10px', overflow: 'hidden', boxSizing: 'border-box' }}>
                      <span style={{ padding: '8px 0 8px 8px', color: 'var(--cms-text-muted)', fontSize: '11px', whiteSpace: 'nowrap' }}>/blog/</span>
                      <input type="text" value={currentPost?.slug || ''} onChange={(e) => setCurrentPost(prev => ({...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')}))} placeholder="nama-artikel"
                        style={{ flex: 1, minWidth: 0, padding: '8px 8px 8px 2px', border: 'none', background: 'transparent', color: 'var(--cms-text-primary)', outline: 'none', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ padding: '14px', background: 'var(--cms-bg-elevated)', borderRadius: '14px', border: '1px solid var(--cms-border)', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={12} /> Tags
                  </div>
                  <input type="text" value={currentPost?.tags || ''} onChange={(e) => setCurrentPost(prev => ({...prev, tags: e.target.value}))} placeholder="Tips, Tutorial, News"
                    style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', background: 'var(--cms-bg)', border: '1.5px solid var(--cms-border)', color: 'var(--cms-text-primary)', outline: 'none', fontSize: '12px', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'}
                    onBlur={e => e.target.style.borderColor = 'var(--cms-border)'}
                  />
                  <div style={{ fontSize: '10.5px', color: 'var(--cms-text-muted)', marginTop: '4px' }}>Pisahkan dengan koma</div>
                </div>

                {/* SEO */}
                <div style={{ padding: '14px', background: 'var(--cms-bg-elevated)', borderRadius: '14px', border: '1px solid var(--cms-border)', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Search size={12} /> SEO
                    </div>
                    <button
                      type="button"
                      disabled={isGeneratingSeo}
                      onClick={handleAutoGenerateSeo}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 9999,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '10px',
                        fontWeight: 750,
                        cursor: isGeneratingSeo ? 'wait' : 'pointer'
                      }}
                      title="Isi Meta Title, Description, dan Tags Otomatis dengan AI"
                    >
                      <Sparkles size={11} />
                      <span>{isGeneratingSeo ? 'Meracik SEO...' : '✨ Auto-SEO (AI)'}</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cms-text-secondary)', marginBottom: '6px' }}>Meta Title</label>
                      <input type="text" value={currentPost?.metaTitle || ''} onChange={(e) => setCurrentPost(prev => ({...prev, metaTitle: e.target.value}))} placeholder="Judul untuk pencarian Google..."
                        style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', background: 'var(--cms-bg)', border: '1.5px solid var(--cms-border)', color: 'var(--cms-text-primary)', outline: 'none', fontSize: '12px', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'}
                        onBlur={e => e.target.style.borderColor = 'var(--cms-border)'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--cms-text-secondary)', marginBottom: '6px' }}>Meta Description</label>
                      <textarea value={currentPost?.metaDescription || ''} onChange={(e) => setCurrentPost(prev => ({...prev, metaDescription: e.target.value}))} placeholder="Deskripsi singkat (maks 160 karakter)..." rows={3}
                        style={{ width: '100%', padding: '9px 11px', borderRadius: '10px', background: 'var(--cms-bg)', border: '1.5px solid var(--cms-border)', color: 'var(--cms-text-primary)', outline: 'none', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(var(--cms-accent-rgb), 0.4)'}
                        onBlur={e => e.target.style.borderColor = 'var(--cms-border)'}
                      />
                      <div style={{ fontSize: '10.5px', color: currentPost?.metaDescription?.length > 150 ? '#ef4444' : 'var(--cms-text-muted)', marginTop: '4px', textAlign: 'right', fontWeight: 600 }}>
                        {currentPost?.metaDescription?.length || 0}/160
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Gallery Modal */}
      <MediaGalleryModal 
        isOpen={showGallery}
        onClose={() => { setShowGallery(false); setGalleryTarget(null); }}
        onSelect={(url, type) => {
          if (galleryTarget === 'cover') {
            setCurrentPost(prev => ({...prev, thumbnail: url}));
          } else {
            if (type === 'image') handleInsertMediaHTML(`<figure style="margin:24px auto; text-align:center; display:block;"><img src="${url}" alt="gambar blog" style="max-width:100%; border-radius:14px; display:block; margin:0 auto; box-shadow:0 6px 24px rgba(0,0,0,0.08);" /><figcaption style="margin-top:8px; font-size:12px; color:var(--cms-text-secondary, #64748b); font-style:italic; text-align:center;" contenteditable="true">Sumber / Keterangan: [Klik di sini untuk ketik sumber gambar]</figcaption></figure>`);
            else handleInsertMediaHTML(`<video src="${url}" controls style="max-width:100%; border-radius:12px; margin:20px 0;"></video>`);
          }
          setShowGallery(false);
          setGalleryTarget(null);
        }}
      />

      {/* ── REDESIGNED UNIFIED AI & OFFLINE BLOG TEMPLATE MODAL ── */}
      {isTemplateModalOpen && createPortal(
        <div 
          onClick={() => !isAiGenerating && setIsTemplateModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483640,
            background: isMobile ? 'var(--cms-panel-bg, var(--cms-bg))' : 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 20,
            boxSizing: 'border-box',
            animation: 'cmsFadeIn 0.2s ease both'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={isMobile ? {
              position: 'relative',
              width: '100vw',
              height: '100dvh',
              maxHeight: '100dvh',
              background: 'var(--cms-panel-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'nativeSheetUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
              overflow: 'hidden',
              boxSizing: 'border-box'
            } : {
              position: 'relative',
              width: '100%',
              maxWidth: 700,
              height: 'min(660px, 90vh)',
              minHeight: 600,
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 24,
              boxShadow: '0 28px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'pmModalIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
              boxSizing: 'border-box'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '12px 14px' : '16px 20px',
              borderBottom: '1px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: blogGenMode === 'offline' ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-accent-soft)',
                  color: blogGenMode === 'offline' ? '#10b981' : 'var(--cms-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: blogGenMode === 'offline' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px var(--cms-accent-soft)'
                }}>
                  {blogGenMode === 'offline' ? <Zap size={18} /> : <Sparkles size={18} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {blogGenMode === 'offline' ? 'Template Artikel Instan' : 'AI Blog Generator'}
                    </span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                      background: blogGenMode === 'offline' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(124, 58, 237, 0.15)',
                      color: blogGenMode === 'offline' ? '#10b981' : '#8b5cf6',
                      border: `1px solid ${blogGenMode === 'offline' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(124, 58, 237, 0.3)'}`,
                      display: 'inline-flex', alignItems: 'center', gap: 3
                    }}>
                      {blogGenMode === 'offline' ? <><Zap size={10} /> 0 Kuota</> : <><Sparkles size={10} /> Gemini AI</>}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {blogGenMode === 'offline' ? 'Pilih draf artikel siap pakai lengkap' : 'Rancang draf artikel komprehensif dengan AI'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                disabled={isAiGenerating}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--cms-input-bg)',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '12px 14px' : '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              WebkitOverflowScrolling: 'touch'
            }}>
              {/* 1. Sleek Mode Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 12,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: blogGenMode === 'ai' ? 'var(--cms-accent-soft)' : 'rgba(16, 185, 129, 0.15)',
                    color: blogGenMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {blogGenMode === 'ai' ? <Sparkles size={14} /> : <Zap size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 850, color: 'var(--cms-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{blogGenMode === 'ai' ? 'Mode AI Generator' : 'Mode Template Instan'}</span>
                    </div>
                  </div>
                </div>

                {/* Switch Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={blogGenMode === 'ai'}
                  onClick={() => setBlogGenMode(blogGenMode === 'ai' ? 'offline' : 'ai')}
                  title={blogGenMode === 'ai' ? 'Beralih ke Template (Offline)' : 'Beralih ke AI Generator'}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    borderRadius: 100,
                    border: `1.5px solid ${blogGenMode === 'ai' ? 'var(--cms-accent)' : '#10b981'}`,
                    background: blogGenMode === 'ai' ? 'var(--cms-accent-soft)' : 'rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 2,
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    background: blogGenMode === 'ai' ? 'var(--cms-accent)' : '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: blogGenMode === 'ai' ? 'translateY(-50%) translateX(20px)' : 'translateY(-50%) translateX(0)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                  }}>
                    {blogGenMode === 'ai' ? <Sparkles size={10} /> : <Zap size={10} />}
                  </div>
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* MODE 1: TEMPLATE INSTAN                                      */}
              {/* 1. Mode Switcher -> 2. Live Preview -> 3. Controls -> 4. Grid */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {blogGenMode === 'offline' && (() => {
                const allTemplates = [...customBlogTemplates, ...OFFLINE_BLOG_TEMPLATES];
                const currentTemplate = allTemplates.find(t => t.id === aiBlogTemplateType) || allTemplates[0];
                const baseCategories = [
                  { id: 'all', label: 'Semua' },
                  ...(customBlogTemplates.length > 0 ? [{ id: 'custom', label: '⭐ Kustom' }] : []),
                  { id: 'Desain', label: 'Desain' },
                  { id: 'Tutorial', label: 'Tutorial' },
                  { id: 'Teknologi', label: 'Teknologi' },
                  { id: 'Bisnis', label: 'Bisnis' },
                  ...customBlogCategories
                ];

                const filteredTemplates = allTemplates.filter(preset => {
                  const isCustom = preset.id.startsWith('custom_');
                  let matchesCategory = true;
                  if (aiBlogCategoryFilter === 'custom') {
                    matchesCategory = isCustom;
                  } else if (aiBlogCategoryFilter !== 'all') {
                    matchesCategory = (preset.category || '').toLowerCase() === aiBlogCategoryFilter.toLowerCase();
                  }

                  const matchesSearch = !aiBlogSearchQuery.trim() ||
                    preset.title.toLowerCase().includes(aiBlogSearchQuery.toLowerCase()) ||
                    (preset.category || '').toLowerCase().includes(aiBlogSearchQuery.toLowerCase()) ||
                    (preset.tags || '').toLowerCase().includes(aiBlogSearchQuery.toLowerCase());

                  return matchesCategory && matchesSearch;
                });

                return (
                  <>
                    {/* 2. LIVE PREVIEW BOX (TEPAT DI BAWAH SWITCH MODE) */}
                    {currentTemplate && (
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-card-bg)',
                        border: '1.5px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                        flexShrink: 0
                      }}>
                        {/* Header Preview */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 5, flexWrap: 'wrap', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 850, color: '#10b981', minWidth: 0, flexWrap: 'wrap' }}>
                            <Eye size={13} style={{ flexShrink: 0 }} />
                            <span>
                              Preview Template: {currentTemplate.category}
                            </span>
                            {currentTemplate.id.startsWith('custom_') && (
                              <span style={{ fontSize: 8.5, fontWeight: 850, padding: '1px 5px', borderRadius: 4, background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', flexShrink: 0 }}>
                                ⭐ KUSTOM
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 5, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                              ⏱️ {currentTemplate.readingTime}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 850, color: 'var(--cms-text)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                            {currentTemplate.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', lineHeight: 1.45, marginTop: 4, wordBreak: 'break-word' }}>
                            {currentTemplate.description || currentTemplate.prompt || 'Draf artikel siap tayang dengan pembuka, subjudul, dan tips praktis.'}
                          </div>
                        </div>

                        {/* Tags Preview */}
                        {currentTemplate.tags && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                            {currentTemplate.tags.split(',').map((tag: string, idx: number) => (
                              <span key={idx} style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                                background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)', border: '1px solid var(--glass-border)'
                              }}>
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. SEARCH BAR + CATEGORY FILTER CHIPS + +TEMPLATE BUTTON */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          flex: 1,
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', borderRadius: 10,
                          background: 'var(--cms-input-bg)', border: '1px solid var(--glass-border)'
                        }}>
                          <Search size={13} style={{ color: 'var(--cms-text-muted)', flexShrink: 0 }} />
                          <input
                            type="text"
                            value={aiBlogSearchQuery}
                            onChange={e => setAiBlogSearchQuery(e.target.value)}
                            placeholder="Cari tema / topik artikel..."
                            style={{
                              width: '100%', background: 'transparent', border: 'none',
                              outline: 'none', color: 'var(--cms-text)', fontSize: 12, fontWeight: 600
                            }}
                          />
                          {aiBlogSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setAiBlogSearchQuery('')}
                              style={{
                                background: 'transparent', border: 'none', color: 'var(--cms-text-muted)',
                                cursor: 'pointer', padding: 0, display: 'flex'
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>

                        {/* + Buat Template Baru Button */}
                        <button
                          type="button"
                          onClick={() => setIsCreatingCustomTemplate(true)}
                          style={{
                            padding: '7px 12px',
                            borderRadius: 10,
                            border: '1px solid #10b981',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontSize: 11.5,
                            fontWeight: 850,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Plus size={13} />
                          <span>Template</span>
                        </button>
                      </div>

                      {/* Category Filter Chips */}
                      <div style={{
                        display: 'flex', flexWrap: 'nowrap', gap: 5, padding: '2px 0',
                        overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
                      }}>
                        {baseCategories.map(cat => {
                          const isActive = aiBlogCategoryFilter === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setAiBlogCategoryFilter(cat.id)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 100,
                                border: `1px solid ${isActive ? '#10b981' : 'var(--glass-border)'}`,
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-input-bg)',
                                color: isActive ? '#10b981' : 'var(--cms-text-muted)',
                                fontSize: 11, fontWeight: isActive ? 850 : 650,
                                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                transition: 'all 0.12s ease'
                              }}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. TEMPLATE CARDS GRID */}
                    <div style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: 8,
                      padding: '1px',
                      alignContent: 'start'
                    }}>
                      {filteredTemplates.length === 0 ? (
                        <div style={{
                          gridColumn: '1 / -1',
                          padding: 20, textAlign: 'center', borderRadius: 10,
                          background: 'var(--cms-input-bg)', border: '1px dashed var(--glass-border)'
                        }}>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                            Tidak ada template yang cocok dengan pencarian.
                          </p>
                        </div>
                      ) : (
                        filteredTemplates.map(preset => {
                          const isSelected = aiBlogTemplateType === preset.id;
                          const isCustom = preset.id.startsWith('custom_');
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectBlogTemplate(preset)}
                              style={{
                                padding: isMobile ? '10px 12px' : '10px 14px',
                                borderRadius: 12,
                                border: `1.5px solid ${isSelected ? '#10b981' : 'var(--glass-border)'}`,
                                background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--cms-input-bg)',
                                color: isSelected ? '#10b981' : 'var(--cms-text)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                textAlign: 'left',
                                transition: 'all 0.12s ease',
                                boxShadow: isSelected ? '0 2px 10px rgba(16, 185, 129, 0.15)' : 'none',
                                width: '100%',
                                boxSizing: 'border-box',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--cms-card-bg)',
                                color: isSelected ? '#10b981' : 'var(--cms-text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                marginTop: 1
                              }}>
                                <FileText size={15} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: 12.5,
                                  fontWeight: isSelected ? 850 : 700,
                                  color: 'var(--cms-text)',
                                  lineHeight: 1.35,
                                  wordBreak: 'break-word',
                                  whiteSpace: 'normal',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  alignItems: 'center',
                                  gap: 6
                                }}>
                                  <span>{preset.title}</span>
                                  {isCustom && (
                                    <span style={{ fontSize: 8.5, padding: '1px 5px', borderRadius: 4, background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', fontWeight: 900 }}>
                                      ⭐ KUSTOM
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600 }}>{preset.category}</span>
                                  <span>•</span>
                                  <span>{preset.readingTime}</span>
                                </div>
                              </div>
                              {isCustom ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomTemplate(e, preset.id)}
                                  title="Hapus template kustom"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--cms-text-muted)',
                                    cursor: 'pointer',
                                    padding: 2,
                                    display: 'flex',
                                    borderRadius: 4
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                isSelected && (
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                                )
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}

              {/* ══════════════════════════════════════════════════════════════ */}
              {/* MODE 2: GEMINI AI GENERATOR (Hanya Form Prompt + Tombol)     */}
              {/* ══════════════════════════════════════════════════════════════ */}
              {blogGenMode === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                  {/* Quick Chips Topik */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={11} color="var(--cms-accent)" /> Rekomendasi Topik Cepat:
                    </div>
                    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
                      {[
                        '7 Kesalahan Pemula Desain UI/UX',
                        'Panduan Sukses Freelance dari Nol',
                        'Tren Web & AI 2026',
                        'Studi Kasus Rebranding Brand'
                      ].map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiBlogPrompt(sug)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: 8,
                            border: '1px solid var(--glass-border)',
                            background: 'var(--cms-card-bg)',
                            color: 'var(--cms-text)',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cms-accent)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Textarea Instruksi */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 850, color: 'var(--cms-text)' }}>
                        <FileText size={13} color="var(--cms-accent)" />
                        <span>Topik & Instruksi Artikel AI</span>
                      </div>
                      {/* Info Tooltip with Fade Transition */}
                      <div 
                        title="AI akan menyusun judul, meta SEO, pembuka, subjudul artikel H2/H3, dan kesimpulan."
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 10, color: 'var(--cms-text-muted)', cursor: 'help'
                        }}
                      >
                        <Info size={12} />
                        <span>Format Bebas</span>
                      </div>
                    </div>

                    <textarea
                      value={aiBlogPrompt}
                      onChange={e => setAiBlogPrompt(e.target.value)}
                      placeholder="Contoh: Buatkan artikel mendalam tentang cara desainer grafis bertransisi menjadi product designer profesional..."
                      rows={isMobile ? 3 : 4}
                      disabled={isAiGenerating}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--cms-input-bg)',
                        border: '1.5px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--cms-accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>

                  {aiError && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', fontSize: 11, fontWeight: 700
                    }}>
                      {aiError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div style={{
              display: 'flex',
              gap: 8,
              padding: isMobile ? '10px 14px max(14px, env(safe-area-inset-bottom, 14px)) 14px' : '14px 20px',
              borderTop: '1.5px solid var(--glass-border)',
              background: 'var(--cms-card-bg)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                disabled={isAiGenerating}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--cms-text)', fontSize: 12, fontWeight: 750, cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyBlogTemplate}
                disabled={isAiGenerating}
                style={{
                  flex: 2, padding: '10px', borderRadius: 10, border: 'none',
                  background: blogGenMode === 'offline' ? '#10b981' : 'var(--cms-accent)',
                  color: '#fff', fontSize: 12, fontWeight: 850, cursor: isAiGenerating ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: blogGenMode === 'offline' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : '0 4px 14px var(--cms-accent-soft)',
                  opacity: isAiGenerating ? 0.7 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 size={13} className="cms-spin" />
                    <span>Menulis Artikel...</span>
                  </>
                ) : (
                  <>
                    {blogGenMode === 'offline' ? <Zap size={14} /> : <Sparkles size={14} />}
                    <span>{blogGenMode === 'offline' ? 'Terapkan Template' : 'Buat Artikel AI'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CREATE CUSTOM BLOG TEMPLATE MODAL ── */}
      {isCreatingCustomTemplate && createPortal(
        <div
          onClick={() => setIsCreatingCustomTemplate(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483645,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={isMobile ? {
              position: 'relative',
              width: '100vw',
              height: '100dvh',
              maxHeight: '100dvh',
              background: 'var(--cms-panel-bg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'nativeSheetUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
              overflow: 'hidden',
              boxSizing: 'border-box'
            } : {
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '12px 16px' : '14px 18px', borderBottom: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>
                <Plus size={16} color="#10b981" />
                <span>Buat Template Artikel Baru</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingCustomTemplate(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: 'var(--cms-input-bg)', color: 'var(--cms-text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: isMobile ? '12px 16px' : '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Nama Template Artikel *
                </label>
                <input
                  type="text"
                  value={newTemplateForm.label}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, label: e.target.value })}
                  placeholder="Contoh: Format Review Gadget & Tech"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Kategori
                  </label>
                  <CustomDropdown
                    value={newTemplateForm.category}
                    onChange={(val) => setNewTemplateForm({ ...newTemplateForm, category: val })}
                    options={[
                      { value: 'Desain', label: 'Desain' },
                      { value: 'Tutorial', label: 'Tutorial' },
                      { value: 'Teknologi', label: 'Teknologi' },
                      { value: 'Bisnis', label: 'Bisnis' },
                      ...customBlogCategories.map(c => ({ value: c.label || c.id, label: c.label }))
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    + Buat Kategori Baru
                  </label>
                  <input
                    type="text"
                    value={newTemplateForm.newCategoryInput}
                    onChange={e => setNewTemplateForm({ ...newTemplateForm, newCategoryInput: e.target.value })}
                    placeholder="Nama kategori..."
                    style={{
                      width: '100%', height: 38, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 10, padding: '0 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Judul Standar Artikel
                </label>
                <input
                  type="text"
                  value={newTemplateForm.title}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, title: e.target.value })}
                  placeholder="Contoh: Review Lengkap: Kelebihan & Kekurangan [Nama Produk]"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Ringkasan / Meta Deskripsi
                </label>
                <input
                  type="text"
                  value={newTemplateForm.description}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, description: e.target.value })}
                  placeholder="Ringkasan singkat topik artikel..."
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                  Isi / Kerangka Artikel (HTML / Teks)
                </label>
                <textarea
                  rows={4}
                  value={newTemplateForm.prompt}
                  onChange={e => setNewTemplateForm({ ...newTemplateForm, prompt: e.target.value })}
                  placeholder="<h2>1. Pendahuluan</h2><p>Tulis paragraf pembuka di sini...</p><h2>2. Fitur Utama</h2>"
                  style={{
                    width: '100%', background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                    borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', resize: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Estimasi Waktu Baca
                  </label>
                  <input
                    type="text"
                    value={newTemplateForm.readingTime}
                    onChange={e => setNewTemplateForm({ ...newTemplateForm, readingTime: e.target.value })}
                    placeholder="Contoh: 5 mnt"
                    style={{
                      width: '100%', height: 38, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 10, padding: '0 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text)', display: 'block', marginBottom: 4 }}>
                    Tags (Pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={newTemplateForm.tags}
                    onChange={e => setNewTemplateForm({ ...newTemplateForm, tags: e.target.value })}
                    placeholder="Review, Gadget, Tech"
                    style={{
                      width: '100%', height: 38, background: 'var(--cms-input-bg)', border: '1.5px solid var(--glass-border)',
                      borderRadius: 10, padding: '0 12px', fontSize: 12, color: 'var(--cms-text)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
              padding: isMobile ? '10px 16px max(14px, env(safe-area-inset-bottom, 14px)) 16px' : '12px 18px',
              borderTop: '1px solid var(--glass-border)', background: 'var(--cms-card-bg)'
            }}>
              <button
                type="button"
                onClick={() => setIsCreatingCustomTemplate(false)}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--cms-text)', fontSize: 11.5, fontWeight: 750, cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewCustomTemplate}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none',
                  background: '#10b981', color: '#fff', fontSize: 11.5, fontWeight: 850, cursor: 'pointer'
                }}
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BlogManager;
